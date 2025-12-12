/* main.js — untuk index.html (Firebase versi)
   Pastikan <script src="firebase.js"></script> telah dimuat sebelum file ini. */

(function(){

// wait until firebase is ready (db on window)
function ready(cb){
  if(window.db) return cb();
  const i = setInterval(()=>{ if(window.db){ clearInterval(i); cb(); } }, 100);
}

ready(() => {

  // helper: upload data_url string to Storage and return downloadURL
  async function uploadDataUrl(path, dataUrl){
    const ref = storage.ref(path);
    await ref.putString(dataUrl, 'data_url');
    return await ref.getDownloadURL();
  }

  // helper: convert File -> dataURL
  function fileToDataUrl(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // keep old DOM refs same names
  const addModal = document.getElementById('addModal');
  const rentModal = document.getElementById('rentModal');
  const addForm = document.getElementById('addForm');
  const rentForm = document.getElementById('rentForm');
  const categoryItems = document.getElementById('categoryItems');
  const categoryTitle = document.getElementById('categoryTitle');

  // show/hook buttons (keep existing behavior)
  document.getElementById("rentBtn").onclick = () => {
    document.getElementById("category").scrollIntoView({ behavior: "smooth" });
    openAllItems();
  };
  document.getElementById("addBtn").onclick = () => new bootstrap.Modal(addModal).show();

  // ADD ITEM (upload KTM + foto -> Storage, then save doc in 'items')
  addForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const id = 'BRG-' + Date.now();

    // upload KTM (if any)
    let ktmUrl = null;
    const ktmFile = document.getElementById('mhsKTM').files[0];
    if(ktmFile){
      const ktmData = await fileToDataUrl(ktmFile);
      ktmUrl = await uploadDataUrl(`ktm/${id}/ktm`, ktmData);
    }

    // upload photos
    const files = Array.from(document.getElementById('barangFoto').files || []);
    const fotoURLs = [];
    for(let i=0;i<files.length;i++){
      const data = await fileToDataUrl(files[i]);
      const url = await uploadDataUrl(`items/${id}/${i}`, data);
      fotoURLs.push(url);
    }

    // build item object (mirip struktur lama)
    const item = {
      id,
      mhsNama: document.getElementById('mhsNama').value,
      mhsNRP: document.getElementById('mhsNRP').value,
      mhsProdi: document.getElementById('mhsProdi').value,
      mhsKontak: document.getElementById('mhsKontak').value,
      mhsKTM: ktmUrl,
      nama: document.getElementById('barangNama').value,
      kategori: document.getElementById('barangKategori').value,
      deskripsi: document.getElementById('barangDeskripsi').value || '',
      kondisi: document.getElementById('barangKondisi').value || '',
      aturan: document.getElementById('barangAturan').value || '',
      harga: Number(document.getElementById('barangHarga').value) || 0,
      deposit: Number(document.getElementById('barangDeposit').value) || 0,
      stok: Number(document.getElementById('barangStok').value) || 0,
      lokasi: document.getElementById('barangLokasi').value || '',
      catatan: document.getElementById('barangCatatan').value || '',
      foto: fotoURLs,
      status: 'Tersedia',
      tanggalInput: new Date().toISOString()
    };

    try{
      await db.collection('items').doc(item.id).set(item);
      addForm.reset();
      bootstrap.Modal.getInstance(addModal).hide();
      alert('Barang berhasil ditambahkan ke Firebase!');
    }catch(err){
      console.error(err);
      alert('Gagal menambahkan barang: ' + err.message);
    }
  });


  // RENDER helpers (ke DOM) - keeps same card markup as before
  function renderItemToGrid(it){
    const stok = it.stok || 0;
    const foto = (it.foto && it.foto[0]) ? it.foto[0] : '';
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card shadow-sm h-100 p-2">
        <img src="${foto}" style="height:150px; object-fit:cover;" class="card-img-top" alt="">
        <div class="card-body">
          <h5 class="fw-bold">${it.nama}</h5>
          <p class="small mb-1">${it.deskripsi || '-'}</p>
          <p class="mb-1"><b>Harga:</b> Rp ${Number(it.harga||0).toLocaleString()}</p>
          <p class="mb-1"><b>Stok:</b> ${stok}</p>
          <button class="btn btn-primary w-100 mt-2" ${stok===0? 'disabled':''} onclick="openRentFromCategory('${it.id}')">
            ${stok===0 ? 'Stok Habis' : 'Sewa Sekarang'}
          </button>
        </div>
      </div>
    `;
    categoryItems.appendChild(col);
  }

  // OPEN CATEGORY -> fetch items where kategori == categoryName
  window.openCategory = async function(categoryName){
    const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    categoryTitle.innerText = categoryName;
    categoryItems.innerHTML = '';

    const q = await db.collection('items').where('kategori','==',categoryName).get();
    if(q.empty){
      categoryItems.innerHTML = `<p class="text-center text-muted">Belum ada barang di kategori ini.</p>`;
      categoryModal.show();
      return;
    }
    q.forEach(d => renderItemToGrid(d.data()));
    categoryModal.show();
  };

  // OPEN ALL ITEMS
  window.openAllItems = async function(){
    const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    categoryTitle.innerText = "Semua Barang Tersedia";
    categoryItems.innerHTML = '';

    const q = await db.collection('items').orderBy('tanggalInput','desc').get();
    if(q.empty){
      categoryItems.innerHTML = `<p class="text-center text-muted">Belum ada barang disewakan.</p>`;
      categoryModal.show();
      return;
    }
    q.forEach(d => renderItemToGrid(d.data()));
    categoryModal.show();
  };

  // openRentFromCategory: auto-fill name and show rent modal (keputusan: use itemId)
  window.openRentFromCategory = async function(itemId){
    const rentModalEl = document.getElementById('rentModal');
    const rentModal = new bootstrap.Modal(rentModalEl);
    const namaField = document.getElementById('namaBarangRent');

    // fetch item doc
    const snap = await db.collection('items').doc(itemId).get();
    if(!snap.exists){
      alert('Barang tidak ditemukan');
      return;
    }
    const it = snap.data();
    namaField.value = it.nama;
    namaField.dataset.itemId = it.id; // store id for rent
    rentModal.show();
  };

  // rentForm: create rental and transaction decrement stok
  rentForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const penyewa = document.getElementById('renterName').value;
    const nrp = document.getElementById('renterNRP').value;
    const kontak = document.getElementById('renterContact').value;
    const namaBarang = document.getElementById('namaBarangRent').value;
    const tglMulai = document.getElementById('tglMulai').value;
    const tglSelesai = document.getElementById('tglSelesai').value;
    const itemId = document.getElementById('namaBarangRent').dataset.itemId;

    if(!itemId){
      alert('Item ID tidak ditemukan.');
      return;
    }

    const itemRef = db.collection('items').doc(itemId);
    const rentalsRef = db.collection('rentals');

    try{
      await db.runTransaction(async (t) => {
        const docSnap = await t.get(itemRef);
        if(!docSnap.exists) throw new Error('Item tidak ada');
        const current = docSnap.data();
        if((current.stok||0) <= 0) throw new Error('Stok tidak mencukupi');

        // decrement stok
        t.update(itemRef, { stok: (current.stok||0) - 1 });

        // add rental doc
        const rentId = 'RENT-' + Date.now();
        t.set(rentalsRef.doc(rentId), {
          rentId,
          itemId: current.id,
          itemNama: current.nama,
          penyewa, nrp, kontak,
          tglMulai, tglSelesai,
          status: 'Sedang Disewa',
          createdAt: new Date().toISOString()
        });
      });

      rentForm.reset();
      bootstrap.Modal.getInstance(document.getElementById('rentModal')).hide();
      alert('Penyewaan tercatat — stok telah diperbarui.');
    }catch(err){
      console.error(err);
      alert('Gagal melakukan penyewaan: ' + err.message);
    }
  });

  // Optional: helper to migrate existing localStorage data to Firestore (run once in console)
  window.migrateLocalToFirebase = async function(){
    const sellerItems = JSON.parse(localStorage.getItem('sellerItems') || '[]');
    const categoryDB = JSON.parse(localStorage.getItem('categoryDB') || '{}');

    for(const it of sellerItems){
      // if foto stored as base64 in old data, upload it to storage
      const fotos = [];
      for(let i=0;i<(it.foto||[]).length;i++){
        const f = it.foto[i];
        if(typeof f === 'string' && f.startsWith('data:')){ // base64
          const url = await uploadDataUrl(`items/${it.id}/${i}`, f);
          fotos.push(url);
        }else if(typeof f === 'string'){
          fotos.push(f);
        }
      }
      it.foto = fotos;
      await db.collection('items').doc(it.id).set(it);
    }

    // rentalHistory
    const rentals = JSON.parse(localStorage.getItem('rentalHistory') || '[]');
    for(const r of rentals){
      await db.collection('rentals').doc(r.rentId).set(r);
    }

    alert('Migrasi selesai. Periksa Firestore console.');
  };

  console.log('main.js ready (Firebase-backed).');
}); // ready

})();
