const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
const categoryTitle = document.getElementById("categoryTitle");
const categoryItems = document.getElementById("categoryItems");

// ================================
// LOAD ITEM BERDASARKAN KATEGORI
// ================================
async function openCategory(categoryName) {
    categoryTitle.innerText = categoryName;
    categoryItems.innerHTML = "";

    const snap = await db.collection("items").where("kategori", "==", categoryName).get();
    if (snap.empty) {
        categoryItems.innerHTML = `<p class="text-center">Belum ada barang.</p>`;
        categoryModal.show();
        return;
    }

    snap.forEach(doc => {
        const it = doc.data();
        renderItemCard(doc.id, it);
    });

    categoryModal.show();
}

// ================================
// LOAD SEMUA BARANG
// ================================
async function openAllItems() {
    categoryTitle.innerText = "Semua Barang";
    categoryItems.innerHTML = "";

    const snap = await db.collection("items").get();
    snap.forEach(doc => {
        const it = doc.data();
        renderItemCard(doc.id, it);
    });

    categoryModal.show();
}

// ================================
// TEMPLATE KARTU BARANG
// ================================
function renderItemCard(id, it) {
    const stok = it.stok ?? 0;
    const foto = it.fotoURLs ? it.fotoURLs[0] : "https://via.placeholder.com/200";

    const col = document.createElement("div");
    col.className = "col-md-4";
    col.innerHTML = `
        <div class="card shadow-sm h-100 p-2">
            <img src="${foto}" class="card-img-top" style="height:150px;object-fit:cover">
            <div class="card-body">
                <h5 class="fw-bold">${it.nama}</h5>
                <p>Kategori: ${it.kategori}</p>
                <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
                <p><b>Stok:</b> ${stok}</p>

                <button class="btn btn-primary w-100"
                    ${stok === 0 ? "disabled" : ""}
                    onclick="rentItem('${id}', '${it.nama}')">
                    ${stok === 0 ? "Stok Habis" : "Sewa"}
                </button>
            </div>
        </div>
    `;
    categoryItems.appendChild(col);
}

// ================================
// FUNGSI SEWA
// ================================
async function rentItem(id, name) {
    if (!confirm(`Sewa ${name}?`)) return;

    const ref = db.collection("items").doc(id);
    const docSnap = await ref.get();

    if (!docSnap.exists) return;

    const currentStock = docSnap.data().stok;

    if (currentStock <= 0) {
        alert("Stok habis!");
        return;
    }

    // Kurangi stok
    await ref.update({
        stok: currentStock - 1
    });

    alert("Berhasil disewa!");
    openAllItems();
}
