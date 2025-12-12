/*
  Firebase compat version (works on GitHub Pages)
  Tidak memerlukan module import.
  Tinggal copy–paste saja.
*/

(function () {

  // Utility untuk load Firebase SDK versi compat
  const load = (url) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

  // Load library yang diperlukan (app, firestore, storage)
  Promise.all([
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js")
  ])
    .then(() => {

      // ============ MASUKKAN CONFIG DI SINI ===============
      const firebaseConfig = {
        apiKey: "AIzaSyBo_DDPM5-o5DKk8ai8t-XjgVW9o32znAY",
        authDomain: "platformsewakuy.firebaseapp.com",
        projectId: "platformsewakuy",
        storageBucket: "platformsewakuy.firebasestorage.app",
        messagingSenderId: "67191506678",
        appId: "1:67191506678:web:a9d996814ab6fe8c158ed7",
        measurementId: "G-S80RL41QJC"
      };
      // ======================================================

      // Init Firebase
      firebase.initializeApp(firebaseConfig);

      // Export global
      window.db = firebase.firestore();
      window.storage = firebase.storage();

      console.log("Firebase initialized successfully!");
    })
    .catch((err) => {
      console.error("Failed to initialize Firebase", err);
    });

})();
