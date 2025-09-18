// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyCHObaq-CJCW0xKpm2CKdmYKG8isIlJqws",
  authDomain: "hermessapp-5b6ec.firebaseapp.com",
  projectId: "hermessapp-5b6ec",
  storageBucket: "hermessapp-5b6ec.firebasestorage.app",
  messagingSenderId: "643058049911",
  appId: "1:643058049911:web:aa3b345c8880230d32b772",
  measurementId: "G-4KCRJCWEF5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged, serverTimestamp };
