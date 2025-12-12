/* main.js - FIX FINAL */

// Fungsi ini dipanggil setelah firebaseReady = true
window.mainReady = function(){

  if (!window.db){
    console.warn("Firebase belum siap, retry mainReady...");
    setTimeout(window.mainReady, 200);
    return;
  }

  console.log("main.js START");

  /* =============================
      Load semua item 
  ============================== */
  async function loadAllItems() {
    const snapshot = await db.collection("items").get();
    const arr = [];
    snapshot.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
    return arr;
  }

  /* =============================
      Buka kategori
  ============================== */
  window.openCategory = async function(categoryName){
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
      const foto = it.foto?.[0] || "";

      const col = document.createElement("div");
      col.className = "col-md-4";
      col.innerHTML = `
        <div class="card shadow-sm h-100 p-2">
          <img src="${foto}" style="height:150px;object-fit:cover;" class="card-img-top">
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
  };

  /* =============================
      Buka Rent Modal
  ============================== */
  window.openRentFromCategory = async function(id){
    const snap = await db.collection("items").doc(id).get();
    if(!snap.exists) return alert("Barang tidak ditemukan");

    const data = snap.data();
    document.getElementById("rentItemName").innerText = data.nama;
    document.getElementById("rentHarga").innerText = "Rp " + data.harga.toLocaleString();

    new bootstrap.Modal(document.getElementById("rentModal")).show();
  };

  /* =====================================================
       FIX: tombol home bekerja (sebelumnya TIDAK BISA)
  ===================================================== */
  document.getElementById("rentBtn").onclick = () => {
    openAllItems();
  };

  document.getElementById("addBtn").onclick = () => {
    new bootstrap.Modal(document.getElementById("addModal")).show();
  };

  console.log("main.js READY");
};
