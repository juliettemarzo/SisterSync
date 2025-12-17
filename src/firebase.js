// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcd51I2-w6BMhhd9CnMD5O4Uvfta5BwAQ",
  authDomain: "sistersync-e14b8.firebaseapp.com",
  projectId: "sistersync-e14b8",
  storageBucket: "sistersync-e14b8.firebasestorage.app",
  messagingSenderId: "265515978104",
  appId: "1:265515978104:web:d44e3c62a804f8cf68cc8d",
  measurementId: "G-K9Z8CP2GB2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Export Firebase Authentication instance
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;//new