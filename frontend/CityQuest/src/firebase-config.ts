// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDu1Az6NgjLN9O2dt-7u6uBOPBmxaSOTuk",
  authDomain: "cityquest-ff8e9.firebaseapp.com",
  projectId: "cityquest-ff8e9",
  storageBucket: "cityquest-ff8e9.firebasestorage.app",
  messagingSenderId: "886064600094",
  appId: "1:886064600094:web:11b1153ab513cfb4914a0f",
  measurementId: "G-385N6VZZ51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, firestore, storage };