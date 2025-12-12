/* main.js — FINAL COMPLETE VERSION */

window.mainReady = function () {
  if (!window.db || !window.storage) {
    return setTimeout(window.mainReady, 200);
  }

  console.log("main.js ready.");

  const addForm = document.getElementById("addForm");
  const rentForm = document.getElementById("rentForm");
  const addModal = document.getElementById("addModal");
  const rentModal = document.getElementById("rentModal");

  async function uploadFile(path, file) {
    const ref = storage.ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  }

  async function uploadMultiple(prefix, files) {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      let url = await uploadFile(`${prefix}/foto_${Date.now()}_${i}.jpg`, files[i]);
      urls.push(url);
    }
    return urls;
  }

  /* ADD ITEM */
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const ktmFile = mhsKTM.files[0];
      const fotoFiles = barangFoto.files;

      if (!ktmFile) return alert("KTM wajib di-upload!");
      if (fotoFiles.length === 0) return alert("Minimal 1 foto!");

      const ktmURL = await uploadFile(`ktm/${Date.now()}.jpg`, ktmFile);
      const fotoURLs = await uploadMultiple(`barang/${Date.now()}`, fotoFiles);

      const itemData = {
        id: "BRG-" + Date.now(),
        mhsNama: mhsNama.value,
        mhsNRP: mhsNRP.value,
        mhsProdi: mhsProdi.value,
        mhsKontak: mhsKontak.value,
        mhsKTM: ktmURL,
        nama: barangNama.value,
        kategori: barangKategori.value,
        deskripsi: barangDeskripsi.value,
        kondisi: barangKondisi.value,
        aturan: barangAturan.value,
        harga: Number(barangHarga.value),
        deposit: Number(barangDeposit.value),
        stok: Number(barangStok.value),
        lokasi: barangLokasi.value,
        catatan: barangCatatan.value,
        foto: fotoURLs,
        status: "Tersedia",
        tanggalInput: new Date().toISOString(),
      };

      await db.collection("items").doc(itemData.id).set(itemData);

      addForm.reset();
      bootstrap.Modal.getInstance(addModal).hide();
      alert("Barang berhasil ditambahkan!");

    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    }
  });

  /* OPEN CATEGORY */
  window.openCategory = async (catName) => {
    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    categoryTitle.innerText = catName;
    categoryItems.innerHTML = "<p>Memuat...</p>";

    const snap = await db.collection("items").where("kategori", "==", catName).get();
    categoryItems.innerHTML = "";

    if (snap.empty) {
      categoryItems.innerHTML = "<p class='text-center text-muted'>Tidak ada barang.</p>";
      return modal.show();
    }

    snap.forEach((doc) => {
      const it = doc.data();
      const img = it.foto?.[0] || "";
      categoryItems.innerHTML += `
        <div class="col-md-4">
          <div class="card p-2 shadow-sm h-100">
            <img src="${img}" class="card-img-top" style="height:150px;object-fit:cover">
            <div class="card-body">
              <h5>${it.nama}</h5>
              <p>${it.deskripsi || "-"}</p>
              <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
              <button class="btn btn-primary w-100" onclick="openRentFromCategory('${it.id}')">Sewa Sekarang</button>
            </div>
          </div>
        </div>
      `;
    });

    modal.show();
  };

  /* OPEN RENT */
  window.openRentFromCategory = async (id) => {
    const snap = await db.collection("items").doc(id).get();
    if (!snap.exists) return alert("Barang tidak ditemukan");

    const d = snap.data();
    namaBarangRent.value = d.nama;

    new bootstrap.Modal(rentModal).show();
  };

  /* RENT FORM */
  rentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const nama = namaBarangRent.value;
      const snap = await db.collection("items").where("nama", "==", nama).get();
      if (snap.empty) return alert("Barang tidak ditemukan!");

      const item = snap.docs[0].data();

      await db.collection("items").doc(item.id).update({
        stok: item.stok - 1,
      });

      await db.collection("rentals").doc("RENT-" + Date.now()).set({
        rentId: "RENT-" + Date.now(),
        itemId: item.id,
        itemNama: item.nama,
        penyewa: renterName.value,
        nrp: renterNRP.value,
        kontak: renterContact.value,
        tglMulai: tglMulai.value,
        tglSelesai: tglSelesai.value,
        status: "Sedang Disewa",
        createdAt: new Date().toISOString(),
      });

      rentForm.reset();
      bootstrap.Modal.getInstance(rentModal).hide();
      alert("Penyewaan berhasil dicatat!");

    } catch (err) {
      alert("Gagal menyewa: " + err.message);
    }
  });

  /* FIX BUTTON */
  rentBtn.onclick = () => openCategory("Peralatan Elektronik");
  addBtn.onclick = () => new bootstrap.Modal(addModal).show();
};
