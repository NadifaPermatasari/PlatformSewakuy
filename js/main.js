/* ======================================================
      main.js — FINAL WORKING VERSION
====================================================== */

window.mainReady = function () {
  if (!window.db || !window.storage) {
    console.log("Waiting Firebase...");
    setTimeout(window.mainReady, 150);
    return;
  }

  console.log("main.js READY ✔");

  // Form dan modal
  const addForm = document.getElementById("addForm");
  const rentForm = document.getElementById("rentForm");
  const addModal = document.getElementById("addModal");
  const rentModal = document.getElementById("rentModal");

  /* ======================================================
          UPLOAD FILE KE FIREBASE STORAGE
  ====================================================== */
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

  /* ======================================================
               ADD ITEM
  ====================================================== */
  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const ktmFile = mhsKTM.files[0];
      const fotoFiles = barangFoto.files;

      if (!ktmFile) return alert("Upload KTM wajib!");
      if (fotoFiles.length === 0) return alert("Minimal 1 foto!");

      // Upload KTM & Foto
      const ktmURL = await uploadFile(`ktm/${Date.now()}.jpg`, ktmFile);
      const fotoURLs = await uploadMultiple(`barang/${Date.now()}`, fotoFiles);

      const item = {
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

      await db.collection("items").doc(item.id).set(item);

      addForm.reset();
      bootstrap.Modal.getInstance(addModal).hide();

      alert("Barang berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menambah barang: " + err.message);
    }
  });

  /* ======================================================
          OPEN CATEGORY
  ====================================================== */
  async function getAllItems() {
    const snap = await db.collection("items").get();
    return snap.docs.map((d) => d.data());
  }

  window.openCategory = async function (catName) {
    const modal = new bootstrap.Modal(categoryModal);
    categoryTitle.innerText = catName;
    categoryItems.innerHTML = "";

    const all = await getAllItems();
    const list = all.filter((i) => i.kategori === catName);

    if (list.length === 0) {
      categoryItems.innerHTML = `<p class="text-center">Tidak ada barang.</p>`;
      return modal.show();
    }

    list.forEach((it) => {
      categoryItems.innerHTML += `
        <div class="col-md-4">
          <div class="card p-2 shadow-sm h-100">
            <img src="${it.foto?.[0] || ''}" class="card-img-top" style="height:150px;object-fit:cover">
            <div class="card-body">
              <h5>${it.nama}</h5>
              <p>${it.deskripsi || "-"}</p>
              <p><b>Harga:</b> Rp ${it.harga.toLocaleString()}</p>
              <p><b>Stok:</b> ${it.stok}</p>
              <button class="btn btn-primary w-100"
                ${it.stok === 0 ? "disabled" : ""}
                onclick="openRentFromCategory('${it.id}')">
                ${it.stok === 0 ? "Stok Habis" : "Sewa Sekarang"}
              </button>
            </div>
          </div>
        </div>
      `;
    });

    modal.show();
  };

  /* ======================================================
          RENTAL
  ====================================================== */
  window.openRentFromCategory = async function (id) {
    const snap = await db.collection("items").doc(id).get();
    if (!snap.exists) return alert("Barang tidak ditemukan!");

    namaBarangRent.value = snap.data().nama;
    new bootstrap.Modal(rentModal).show();
  };

  rentForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nama = namaBarangRent.value;
    const snap = await db.collection("items").where("nama", "==", nama).get();

    if (snap.empty) return alert("Barang tidak ditemukan!");

    const item = snap.docs[0].data();

    if (item.stok <= 0) return alert("Stok habis!");

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
  });

  /* BUTTON FIX */
  rentBtn.onclick = () => openCategory("Peralatan Elektronik");
  addBtn.onclick = () => new bootstrap.Modal(addModal).show();
};
