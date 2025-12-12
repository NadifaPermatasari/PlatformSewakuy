/* =============================
   Load semua item dari Firestore
============================= */
async function loadAllItems() {
  const snapshot = await db.collection("items").get();
  const arr = [];
  snapshot.forEach(doc => arr.push(doc.data()));
  return arr;
}

/* =============================
   Buka kategori
============================= */
async function openCategory(categoryName) {
  const categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"));
  categoryTitle.innerText = categoryName;
  categoryItems.innerHTML = "";

  const allItems = await loadAllItems();
  const filtered = allItems.filter(i => i.kategori === categoryName);

  if(filtered.length === 0){
    categoryItems.innerHTML = `<p class='text-center text-muted'>Tidak ada barang.</p>`;
    return categoryModal.show();
  }

  for(const it of filtered){
    const stok = it.stok || 0;
    const col = document.createElement("div");
    col.className = "col-md-4";

    col.innerHTML = `
      <div class="card shadow-sm h-100 p-2">
        <img src="${it.foto[0] || ''}" style="height:150px;object-fit:cover;" class="card-img-top">
        <div class="card-body">
          <h5 class="fw-bold">${it.nama}</h5>
          <p class="small mb-1">${it.deskripsi || "-"}</p>
          <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
          <p><b>Stok:</b> ${stok}</p>

          <button class="btn btn-primary w-100"
            ${stok === 0 ? "disabled" : ""}
            onclick="openRentFromCategory('${it.id}')">
            ${stok === 0 ? "Stok Habis" : "Sewa Sekarang"}
          </button>
        </div>
      </div>
    `;

    categoryItems.appendChild(col);
  }

  categoryModal.show();
}

/* =============================
   Buka Rent Modal
============================= */
async function openRentFromCategory(id) {
  const docRef = db.collection("items").doc(id);
  const snap = await docRef.get();

  if(!snap.exists){
    return alert("Barang tidak ditemukan");
  }

  const data = snap.data();

  document.getElementById("rentItemName").innerText = data.nama;
  document.getElementById("rentHarga").innerText = "Rp " + data.harga.toLocaleString();

  new bootstrap.Modal("#rentModal").show();
}

/* ==========================================
   Buat fungsi ini global agar onclick berfungsi
========================================== */
window.openCategory = openCategory;
window.openRentFromCategory = openRentFromCategory;

console.log("main.js loaded");
