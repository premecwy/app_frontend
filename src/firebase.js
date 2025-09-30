// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// 👉 export ที่คุณจะใช้
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };