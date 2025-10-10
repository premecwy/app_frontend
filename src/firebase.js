// /src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 👈 เอา auth กลับมา
import { getDatabase } from "firebase/database";

// ข้อมูล config ของคุณ
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// สร้าง instance ทั้งหมดที่จำเป็น
const auth = getAuth(app); // 👈 สร้าง auth
const provider = new GoogleAuthProvider(); // 👈 สร้าง provider
const db = getDatabase(app); // 👈 สร้าง db สำหรับ Realtime Database

// 🔥 ส่งออกไปให้ครบทุกตัว
export { auth, provider, db };