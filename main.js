import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* =============================
   LOAD BARANG DARI FIRESTORE
============================= */
async function loadAllItems(){
  const querySnapshot = await getDocs(collection(db, "items"));
  let items = [];
  querySnapshot.forEach(doc => items.push(doc.data()));
  return items;
}

/* =============================
    OPEN CATEGORY MODAL
============================= */
async function openCategory(categoryName){
  const categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"));
  categoryTitle.innerText = categoryName;
  categoryItems.innerHTML = "";

  const allItems = await loadAllItems();
  const filtered = allItems.filter(i => i.kategori === categoryName);

  if(filtered.length === 0){
    categoryItems.innerHTML = `<p class="text-center text-muted">Tidak ada barang.</p>`;
    return categoryModal.show();
  }

  for(const it of filtered){
    const stok = it.stok || 0;

    const col = document.createElement("div");
    col.className = "col-md-4";
    col.innerHTML = `
      <div class="card shadow-sm h-100 p-2">
        <img src="${it.foto[0] || ''}" style="height:150px; object-fit:cover;" class="card-img-top">
        <div class="card-body">
          <h5 class="fw-bold">${it.nama}</h5>
          <p class="small">${it.deskripsi || '-'}</p>
          <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
          <p><b>Stok:</b> ${stok}</p>
          <button class="btn btn-primary w-100"
            ${stok===0 ? 'disabled' : ''}
            onclick="openRentFromCategory('${it.id}')">
            ${stok === 0 ? 'Stok Habis' : 'Sewa Sekarang'}
          </button>
        </div>
      </div>
    `;
    categoryItems.appendChild(col);
  }

  categoryModal.show();
}

/* =============================
    RENT FORM MODAL
============================= */
async function openRentFromCategory(id){
  const itemRef = doc(db, "items", id);
  const snap = await getDoc(itemRef);

  if(!snap.exists()) return alert("Barang tidak ditemukan");

  const item = snap.data();

  document.getElementById("rentItemName").innerText = item.nama;
  document.getElementById("rentHarga").innerText = "Rp " + item.harga.toLocaleString();
  
  new bootstrap.Modal("#rentModal").show();
}

/* =============================
    EXPORT KE GLOBAL AGAR ONCLICK BERFUNGSI
============================= */
window.openCategory = openCategory;
window.openRentFromCategory = openRentFromCategory;

console.log("main.js loaded");
