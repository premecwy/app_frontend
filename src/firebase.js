// /src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD-MQPyOS1A3GpIxgg81nOCIHmLcCAsKBE",
  authDomain: "lumaai-12b32.firebaseapp.com",
  databaseURL: "https://lumaai-12b32-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "lumaai-12b32",
  storageBucket: "lumaai-12b32.firebasestorage.app",
  messagingSenderId: "672244117841",
  appId: "1:672244117841:web:d691f3db6799f668f56370",
  measurementId: "G-MCJMBJT6JH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, db };
