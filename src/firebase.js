// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBW4AK1rHCbr_N74_2pbDWqaVyjMKa7D9o",
  authDomain: "sparepart-foundry-33835.firebaseapp.com",
  projectId: "sparepart-foundry-33835",
  storageBucket: "sparepart-foundry-33835.firebasestorage.app",
  messagingSenderId: "954698431161",
  appId: "1:954698431161:web:a03287a6a75a27541f7968",
  measurementId: "G-8BCF8TDEPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
