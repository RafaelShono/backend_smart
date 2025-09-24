// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Suas configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAUZWTmoULUoIiYv7z8OP-N0j-5i2IvePc",
    authDomain: "appviagens-ec9b1.firebaseapp.com",
    databaseURL: "https://appviagens-ec9b1-default-rtdb.firebaseio.com",
    projectId: "appviagens-ec9b1",
    storageBucket: "appviagens-ec9b1.firebasestorage.app",
    messagingSenderId: "309450859114",
    appId: "1:309450859114:web:2fc294c02d3168338fe013"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
