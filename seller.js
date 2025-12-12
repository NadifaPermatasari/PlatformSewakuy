const wrap = document.getElementById("sellerItemList");

// ======================
// LOAD SEMUA BARANG
// ======================
async function loadSellerItems() {
    wrap.innerHTML = "";

    const snap = await db.collection("items").get();
    if (snap.empty) {
        wrap.innerHTML = `<p class="text-center text-muted">Belum ada barang.</p>`;
        return;
    }

    snap.forEach(doc => renderSellerCard(doc.id, doc.data()));
}

function renderSellerCard(id, it) {
    const foto = it.fotoURLs ? it.fotoURLs[0] : "https://via.placeholder.com/200";

    wrap.innerHTML += `
      <div class="col-md-4">
        <div class="card shadow-sm h-100 p-2">
          <img src="${foto}" class="card-img-top">
          <div class="card-body">
            <h5 class="fw-bold">${it.nama}</h5>
            <p>Kategori: ${it.kategori}</p>
            <p>Harga: Rp ${it.harga.toLocaleString()}</p>
            <p>Stok: ${it.stok}</p>

            <button class="btn btn-warning btn-sm w-100" onclick="editItem('${id}')">Edit</button>
          </div>
        </div>
      </div>
    `;
}

// ======================
// TAMBAH BARANG
// ======================
async function addNewItem() {
    const nama = prompt("Nama barang:");
    const kategori = prompt("Kategori:");
    const harga = Number(prompt("Harga:"));
    const stok = Number(prompt("Stok:"));

    if (!nama || !kategori) return;

    await db.collection("items").add({
        nama, kategori, harga, stok,
        fotoURLs: []
    });

    alert("Barang ditambahkan!");
    loadSellerItems();
}

// ======================
// EDIT BARANG
// ======================
async function editItem(id) {
    const ref = db.collection("items").doc(id);
    const snap = await ref.get();
    const it = snap.data();

    const nama = prompt("Nama:", it.nama);
    const harga = Number(prompt("Harga:", it.harga));
    const stok = Number(prompt("Stok:", it.stok));

    await ref.update({ nama, harga, stok });
    alert("Berhasil diupdate!");
    loadSellerItems();
}

loadSellerItems();
