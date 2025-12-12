<!-- firebase.js -->
<!-- copy this file as plain JS (not inside an HTML tag) -->
<script>
/*
  Firebase compat version (works on GitHub Pages without bundler)
  IMPORTANT: jika kamu sudah punya firebaseConfig (dari console), ganti object di bawah.
*/
(function(){
  // load compat libs dynamically
  const load = (url) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  Promise.all([
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"),
    load("https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js")
  ]).then(() => {
    // --- MASUKKAN firebaseConfig MILIKMU DI SINI ---
    const firebaseConfig = {
      apiKey: "AIzaSyBo_DDPM5-o5DKk8ai8t-XjgVW9o32znAY",
      authDomain: "platformsewakuy.firebaseapp.com",
      projectId: "platformsewakuy",
      storageBucket: "platformsewakuy.firebasestorage.app",
      messagingSenderId: "67191506678",
      appId: "1:67191506678:web:a9d996814ab6fe8c158ed7",
      measurementId: "G-S80RL41QJC"
    };
    // ---------------------------------------------

    firebase.initializeApp(firebaseConfig);

    // Export globals used by main.js & seller.js
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    console.log('Firebase initialized (compat).');
  }).catch(err => {
    console.error('Failed to load Firebase scripts', err);
  });
})();
</script>
