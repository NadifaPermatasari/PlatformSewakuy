/* seller.js — untuk seller.html (Firebase version) */
(function(){

function ready(cb){
  if(window.db) return cb();
  const i = setInterval(()=>{ if(window.db){ clearInterval(i); cb(); } }, 100);
}

ready(() => {

  const wrap = document.getElementById("sellerItemList");
  const rentalHistoryList = document.getElementById("rentalHistoryList");
  const placeholderImg = "https://via.placeholder.com/300x200?text=No+Image";

  // LOAD BARANG
  window.loadSellerItems = async function(){
    wrap.innerHTML = '';
    try{
      const snap = await db.collection('items').orderBy('tanggalInput','desc').get();
      if(snap.empty){
        wrap.innerHTML = `<p class="text-center text-muted">Belum ada barang terdaftar.</p>`;
        return;
      }
      snap.forEach(docSnap => {
        const it = docSnap.data();
        const foto = (it.foto && it.foto[0]) ? it.foto[0] : placeholderImg;
        wrap.innerHTML += `
          <div class="col-md-4">
            <div class="card shadow-sm h-100 p-2">
              <img src="${foto}" class="card-img-top" alt="Foto Barang">
              <div class="card-body">
                <h5 class="fw-bold">${it.nama}</h5>
                <p><b>Kategori:</b> ${it.kategori}</p>
                <p><b>Harga:</b> Rp ${Number(it.harga||0).toLocaleString()}</p>
                <p><b>Stok:</b> ${it.stok ?? 0}</p>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-warning btn-sm" onclick="editItem('${it.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteItem('${it.id}')">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }catch(err){
      console.error(err);
      wrap.innerHTML = `<p class="text-center text-danger">Gagal memuat: ${err.message}</p>`;
    }
  };

  // LOAD RIWAYAT PENYEWAAN
  window.loadRentHistory = async function(){
    rentalHistoryList.innerHTML = '';
    try{
      const snap = await db.collection('rentals').orderBy('createdAt','desc').get();
      if(snap.empty){
        rentalHistoryList.innerHTML = `<p class="text-center text-muted">Belum ada transaksi.</p>`;
        return;
      }
      for(const docSnap of snap.docs){
        const r = docSnap.data();
        let barang = {};
        try{
          const itemDoc = await db.collection('items').doc(r.itemId).get();
          if(itemDoc.exists) barang = itemDoc.data();
        }catch(e){ console.warn('fetch item fail', e); }
        const foto = (barang.foto && barang.foto[0]) ? barang.foto[0] : placeholderImg;

        rentalHistoryList.innerHTML += `
          <div class="card mb-3 shadow-sm p-3">
            <div class="row">
              <div class="col-md-3">
                <img src="${foto}" class="w-100 rounded" alt="Foto Barang">
              </div>

              <div class="col-md-9">
                <h5 class="fw-bold">${barang.nama || "Barang terhapus"}</h5>
                <p><b>Penyewa:</b> ${r.penyewa || '-'} (${r.nrp || '-'})</p>
                <p><b>Kontak:</b> ${r.kontak || '-'}</p>
                <p><b>Periode:</b> ${r.tglMulai || "-"} → ${r.tglSelesai || "-"}</p>
                <p><b>Status:</b>
                  <span class="badge ${r.status === "Dikembalikan" ? "bg-success" : "bg-warning text-dark"}">
                    ${r.status}
                  </span>
                </p>
                ${r.status === "Sedang Disewa" ? `<button class="btn btn-success btn-sm" onclick="returnItem('${r.rentId}')">Tandai Dikembalikan</button>` : ""}
              </div>
            </div>
          </div>
        `;
      }
    }catch(err){
      console.error(err);
      rentalHistoryList.innerHTML = `<p class="text-center text-danger">Gagal memuat riwayat: ${err.message}</p>`;
    }
  };

  // EDIT (prompt)
  window.editItem = async function(itemId){
    try{
      const docRef = db.collection('items').doc(itemId);
      const snap = await docRef.get();
      if(!snap.exists) return alert('Barang tidak ditemukan.');
      const it = snap.data();
      const newName = prompt('Nama barang:', it.nama);
      if(!newName) return;
      const newHarga = Number(prompt('Harga per hari:', it.harga));
      const newStok = Number(prompt('Stok:', it.stok));
      await docRef.update({ nama: newName, harga: newHarga || it.harga, stok: newStok || it.stok });
      await loadSellerItems();
      await loadRentHistory();
      alert('Perubahan disimpan.');
    }catch(err){
      console.error(err);
      alert('Gagal edit: ' + err.message);
    }
  };

  // DELETE (hapus doc + rentals terkait). NOTE: storage files will be left (optional removal)
  window.deleteItem = async function(itemId){
    if(!confirm('Hapus barang ini?')) return;
    try{
      // delete item doc
      await db.collection('items').doc(itemId).delete();

      // delete rentals referencing this item
      const rentSnap = await db.collection('rentals').where('itemId','==',itemId).get();
      for(const r of rentSnap.docs) await db.collection('rentals').doc(r.id).delete();

      await loadSellerItems();
      await loadRentHistory();
      alert('Barang dan transaksi terkait dihapus.');
    }catch(err){
      console.error(err);
      alert('Gagal hapus: ' + err.message);
    }
  };

  // RETURN ITEM (transaction: increment stok + update rental.status)
  window.returnItem = async function(rentId){
    if(!confirm('Tandai transaksi ini sebagai dikembalikan?')) return;
    try{
      const rentRef = db.collection('rentals').doc(rentId);
      const rentSnap = await rentRef.get();
      if(!rentSnap.exists) return alert('Transaksi tidak ditemukan.');
      const rent = rentSnap.data();
      const itemRef = db.collection('items').doc(rent.itemId);

      await db.runTransaction(async (t) => {
        const itemSnap = await t.get(itemRef);
        if(!itemSnap.exists) throw new Error('Item tidak ditemukan.');
        const current = itemSnap.data();
        t.update(itemRef, { stok: (current.stok||0) + 1 });
        t.update(rentRef, { status: 'Dikembalikan' });
      });

      await loadSellerItems();
      await loadRentHistory();
      alert('Transaksi diperbarui: dikembalikan, stok diupdate.');
    }catch(err){
      console.error(err);
      alert('Gagal update return: ' + err.message);
    }
  };

  // initial load
  loadSellerItems();
  loadRentHistory();

  console.log('seller.js ready (Firebase-backed).');

}); // ready

})();
