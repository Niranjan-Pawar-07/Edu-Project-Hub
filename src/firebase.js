// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC44VIXNQdlLI3kfg_U0mvxKf32nf5AlpM",
  authDomain: "interdepartmental-coordi-c8b9b.firebaseapp.com",
  projectId: "interdepartmental-coordi-c8b9b",
  storageBucket: "interdepartmental-coordi-c8b9b.firebasestorage.app",
  messagingSenderId: "713124321439",
  appId: "1:713124321439:web:59332439f626d8dbee2aaa",
  measurementId: "G-R73JC6MVX2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider(); // ✅ Google Auth Provider

export { auth, db, googleProvider ,storage};