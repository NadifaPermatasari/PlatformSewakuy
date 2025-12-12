/* main.js — FINAL COMPLETE VERSION */

window.mainReady = function () {
  if (!window.db) {
    setTimeout(window.mainReady, 150);
    return;
  }

  console.log("main.js start.");

  const addForm = document.getElementById("addForm");
  const rentForm = document.getElementById("rentForm");
  const addModal = document.getElementById("addModal");
  const rentModal = document.getElementById("rentModal");

  /* =====================================================
        Upload file ke Firebase Storage
  ===================================================== */
  async function uploadFile(path, file) {
    const ref = storage.ref().child(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  }

  async function uploadMultiple(prefix, files) {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(`${prefix}/foto_${Date.now()}_${i}.jpg`, files[i]);
      urls.push(url);
    }
    return urls;
  }

  /* =====================================================
            ADD NEW ITEM
  ===================================================== */
  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const ktmFile = document.getElementById("mhsKTM").files[0];
      const fotoFiles = document.getElementById("barangFoto").files;

      if (!ktmFile) return alert("Upload KTM wajib!");
      if (fotoFiles.length < 1) return alert("Minimal 1 foto barang");

      // Upload KTM
      const ktmURL = await uploadFile(`ktm/${Date.now()}.jpg`, ktmFile);

      // Upload foto barang
      const fotoURLs = await uploadMultiple(`barang/${Date.now()}`, fotoFiles);

      // Data barang
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

      // Simpan ke Firestore
      await db.collection("items").doc(itemData.id).set(itemData);

      addForm.reset();
      bootstrap.Modal.getInstance(addModal).hide();
      alert("Barang berhasil ditambahkan!");

    } catch (err) {
      console.error(err);
      alert("Gagal menambah barang: " + err.message);
    }
  });

  /* =====================================================
            LOAD ITEM UNTUK KATEGORI
  ===================================================== */
  async function getAllItems() {
    const snap = await db.collection("items").get();
    const arr = [];
    snap.forEach((d) => arr.push(d.data()));
    return arr;
  }

  window.openCategory = async function (catName) {
    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    categoryTitle.innerText = catName;
    categoryItems.innerHTML = "";

    const all = await getAllItems();
    const list = all.filter((i) => i.kategori === catName);

    if (list.length === 0) {
      categoryItems.innerHTML = `<p class='text-center text-muted'>Tidak ada barang.</p>`;
      return modal.show();
    }

    list.forEach((it) => {
      const stok = it.stok || 0;

      categoryItems.innerHTML += `
        <div class="col-md-4">
          <div class="card p-2 shadow-sm h-100">
            <img src="${it.foto?.[0] || ""}" class="card-img-top" style="height:150px;object-fit:cover">
            <div class="card-body">
              <h5 class="fw-bold">${it.nama}</h5>
              <p>${it.deskripsi || "-"}</p>
              <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
              <p><b>Stok:</b> ${stok}</p>
              <button class="btn btn-primary w-100" 
                ${stok == 0 ? "disabled" : ""}
                onclick="openRentFromCategory('${it.id}')">
                ${stok == 0 ? "Stok Habis" : "Sewa Sekarang"}
              </button>
            </div>
          </div>
        </div>
      `;
    });

    modal.show();
  };

  /* =====================================================
            OPEN RENT MODAL
  ===================================================== */
  window.openRentFromCategory = async function (id) {
    const snap = await db.collection("items").doc(id).get();
    if (!snap.exists) return alert("Barang tidak ditemukan");

    const d = snap.data();
    document.getElementById("namaBarangRent").value = d.nama;

    new bootstrap.Modal(rentModal).show();
  };

  /* =====================================================
            SUBMIT RENTAL
  ===================================================== */
  rentForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const nama = namaBarangRent.value;

      const snap = await db.collection("items").where("nama", "==", nama).get();
      if (snap.empty) return alert("Barang tidak ditemukan!");

      const item = snap.docs[0];
      const data = item.data();

      if (data.stok <= 0) return alert("Stok habis!");

      // kurangi stok
      await db.collection("items").doc(data.id).update({
        stok: data.stok - 1,
      });

      // simpan ke rentals
      await db.collection("rentals").doc("RENT-" + Date.now()).set({
        rentId: "RENT-" + Date.now(),
        itemId: data.id,
        itemNama: data.nama,
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
      console.error(err);
      alert("Gagal menyewa: " + err.message);
    }
  });

  /* =====================================================
            BUTTON FIX
  ===================================================== */
  document.getElementById("rentBtn").onclick = () => openCategory("Peralatan Elektronik");
  document.getElementById("addBtn").onclick = () =>
    new bootstrap.Modal(addModal).show();

  console.log("main.js ready.");
};
