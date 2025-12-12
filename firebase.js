<!-- Firebase App -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>

<!-- Firestore -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<!-- Storage -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "AIzaSyBo_DDPM5-o5DKk8ai8t-XjgVW9o32znAY",
    authDomain: "platformsewakuy.firebaseapp.com",
    projectId: "platformsewakuy",
    storageBucket: "platformsewakuy.firebasestorage.app",
    messagingSenderId: "67191506678",
    appId: "1:67191506678:web:a9d996814ab6fe8c158ed7",
    measurementId: "G-S80RL41QJC"
  };

  firebase.initializeApp(firebaseConfig);

  // Firebase instances
  const db = firebase.firestore();
  const storage = firebase.storage();
</script>
