/* ============================================================
    seller.js — FINAL COMPLETE VERSION (Firebase + Storage)
   ============================================================ */

(function () {

  // Jalankan script setelah Firebase siap
  function ready(cb) {
    if (window.db) return cb();
    const timer = setInterval(() => {
      if (window.db) {
        clearInterval(timer);
        cb();
      }
    }, 150);
  }

  ready(() => {

    console.log("seller.js started.");

    const wrap = document.getElementById("sellerItemList");
    const historyWrap = document.getElementById("rentalHistoryList");
    const placeholderImg = "https://via.placeholder.com/300x200?text=No+Image";

    /* ============================================================
        LOAD ITEM SELLER
    ============================================================ */
    window.loadSellerItems = async function () {
      wrap.innerHTML = "<p class='text-center text-muted'>Memuat...</p>";

      try {
        const snap = await db.collection("items").orderBy("tanggalInput", "desc").get();

        if (snap.empty) {
          wrap.innerHTML = `<p class='text-center text-muted'>Belum ada barang terdaftar.</p>`;
          return;
        }

        wrap.innerHTML = "";

        snap.forEach((doc) => {
          const it = doc.data();
          const img = it.foto?.[0] || placeholderImg;

          wrap.innerHTML += `
            <div class="col-md-4">
              <div class="card shadow-sm h-100 p-2">
                <img src="${img}" class="card-img-top" alt="Foto Barang">
                <div class="card-body">
                  <h5 class="fw-bold">${it.nama}</h5>
                  <p><b>Kategori:</b> ${it.kategori}</p>
                  <p><b>Harga:</b> Rp ${Number(it.harga).toLocaleString()}</p>
                  <p><b>Stok:</b> ${it.stok}</p>

                  <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-warning btn-sm" onclick="editItem('${it.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteItem('${it.id}')">Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });

      } catch (err) {
        console.error(err);
        wrap.innerHTML = `<p class="text-danger text-center">Gagal memuat data: ${err.message}</p>`;
      }
    };

    /* ============================================================
        LOAD RENTAL HISTORY
    ============================================================ */
    window.loadRentHistory = async function () {
      historyWrap.innerHTML = "<p class='text-center text-muted'>Memuat...</p>";

      try {
        const snap = await db.collection("rentals").orderBy("createdAt", "desc").get();

        if (snap.empty) {
          historyWrap.innerHTML = `<p class='text-center text-muted'>Belum ada transaksi.</p>`;
          return;
        }

        historyWrap.innerHTML = "";

        for (const doc of snap.docs) {
          const r = doc.data();

          let barang = {};
          try {
            const itemDoc = await db.collection("items").doc(r.itemId).get();
            if (itemDoc.exists) barang = itemDoc.data();
          } catch (e) {
            console.warn("Gagal ambil detail barang", e);
          }

          const img = barang.foto?.[0] || placeholderImg;

          historyWrap.innerHTML += `
            <div class="card shadow-sm p-3 mb-3">
              <div class="row">
                <div class="col-md-3">
                  <img src="${img}" class="w-100 rounded">
                </div>

                <div class="col-md-9">
                  <h5 class="fw-bold">${barang.nama || "Barang telah dihapus"}</h5>
                  <p><b>Penyewa:</b> ${r.penyewa} (${r.nrp})</p>
                  <p><b>Kontak:</b> ${r.kontak}</p>
                  <p><b>Periode:</b> ${r.tglMulai} → ${r.tglSelesai}</p>

                  <p><b>Status:</b>
                    <span class="badge ${r.status === "Dikembalikan" ? "bg-success" : "bg-warning text-dark"}">
                      ${r.status}
                    </span>
                  </p>

                  ${r.status === "Sedang Disewa" ?
                    `<button class="btn btn-success btn-sm" onclick="returnItem('${r.rentId}')">Tandai Dikembalikan</button>` : ""
                  }
                </div>
              </div>
            </div>
          `;
        }

      } catch (err) {
        console.error(err);
        historyWrap.innerHTML = `<p class="text-danger text-center">Gagal memuat riwayat: ${err.message}</p>`;
      }
    };

    /* ============================================================
        EDIT ITEM
    ============================================================ */
    window.editItem = async function (itemId) {
      try {
        const ref = db.collection("items").doc(itemId);
        const snap = await ref.get();

        if (!snap.exists) return alert("Barang tidak ditemukan!");

        const it = snap.data();
        const newName = prompt("Nama barang:", it.nama);
        if (!newName) return;

        const newHarga = Number(prompt("Harga per hari:", it.harga));
        const newStok = Number(prompt("Stok:", it.stok));

        await ref.update({
          nama: newName,
          harga: newHarga || it.harga,
          stok: newStok || it.stok,
        });

        alert("Perubahan disimpan!");
        loadSellerItems();
        loadRentHistory();

      } catch (err) {
        alert("Gagal mengedit: " + err.message);
      }
    };

    /* ============================================================
        DELETE ITEM
    ============================================================ */
    window.deleteItem = async function (itemId) {
      if (!confirm("Hapus barang ini beserta semua transaksi terkait?")) return;

      try {
        // 1. Hapus item
        await db.collection("items").doc(itemId).delete();

        // 2. Hapus rental terkait
        const rentSnap = await db.collection("rentals").where("itemId", "==", itemId).get();
        for (const r of rentSnap.docs) {
          await db.collection("rentals").doc(r.id).delete();
        }

        alert("Barang dan semua transaksi terkait berhasil dihapus.");
        loadSellerItems();
        loadRentHistory();

      } catch (err) {
        alert("Gagal hapus: " + err.message);
      }
    };

    /* ============================================================
        RETURN ITEM
    ============================================================ */
    window.returnItem = async function (rentId) {
      if (!confirm("Tandai sebagai dikembalikan?")) return;

      try {
        const rentRef = db.collection("rentals").doc(rentId);
        const rentSnap = await rentRef.get();

        if (!rentSnap.exists) return alert("Transaksi tidak ditemukan.");

        const r = rentSnap.data();
        const itemRef = db.collection("items").doc(r.itemId);

        await db.runTransaction(async (trx) => {
          const itemSnap = await trx.get(itemRef);

          if (!itemSnap.exists) throw new Error("Barang sudah dihapus.");

          const current = itemSnap.data();
          trx.update(itemRef, { stok: (current.stok || 0) + 1 });
          trx.update(rentRef, { status: "Dikembalikan" });
        });

        alert("Barang telah dikembalikan.");
        loadSellerItems();
        loadRentHistory();

      } catch (err) {
        console.error(err);
        alert("Gagal memperbarui pengembalian: " + err.message);
      }
    };

    /* ============================================================
        INITIAL LOAD
    ============================================================ */
    loadSellerItems();
    loadRentHistory();

    console.log("seller.js complete.");
  });

})();
