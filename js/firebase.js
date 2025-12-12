window.mainReady = window.mainReady || function(){};
/* firebase.js — FINAL FIXED VERSION (Wajib pakai ini) */

(function () {
  console.log("Firebase loading...");

  // Loader untuk Firebase
  function load(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Load Firebase compat
  Promise.all([
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"),
  ])
    .then(() => {
      console.log("Firebase SDK loaded.");

      // CONFIG KAMU
      const firebaseConfig = {
        apiKey: "AIzaSyBo_DDPM5-o5DKk8ai8t-XjgVW9o32znAY",
        authDomain: "platformsewakuy.firebaseapp.com",
        projectId: "platformsewakuy",
        storageBucket: "platformsewakuy.firebasestorage.app",
        messagingSenderId: "67191506678",
        appId: "1:67191506678:web:a9d996814ab6fe8c158ed7",
        measurementId: "G-S80RL41QJC",
      };

      // INIT
      firebase.initializeApp(firebaseConfig);
      window.db = firebase.firestore();
      window.storage = firebase.storage();

      console.log("%cFirebase READY ✔", "color: green; font-size:16px;");

      // 🔥 PANGGIL mainReady() DAN sellerReady() jika ada
      if (window.mainReady) window.mainReady();
      if (window.sellerReady) window.sellerReady();

    })
    .catch((err) => {
      console.error("Firebase FAILED to load:", err);
      alert("Firebase gagal dimuat. Periksa koneksi internet.");
    });

})();
