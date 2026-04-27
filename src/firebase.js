import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA2tP73CIdP3E7MNyhRSTsXv3WysrtU8OU",
  authDomain: "kolka-deshine.firebaseapp.com",
  projectId: "kolka-deshine",
  storageBucket: "kolka-deshine.firebasestorage.app",
  messagingSenderId: "292936393477",
  appId: "1:292936393477:web:a2ba372caa098d91c2cd6c",
  measurementId: "G-BDX1HJST5G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
