import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDh9XxYy1bQ4GfcEF1tYkKqWWCQ7xPcxPQ",
  authDomain: "vazerk-61e39.firebaseapp.com",
  projectId: "vazerk-61e39",
  storageBucket: "vazerk-61e39.firebasestorage.app",
  messagingSenderId: "862934684683",
  appId: "1:862934684683:web:0a76ac330cf9abaaa1630e",
  measurementId: "G-8G5Q3YW7L6"
};

const googleWebClientId = "862934684683-6undunvn01hnq8cqakippk3cv9rt5j18.apps.googleusercontent.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics is optional and can fail in unsupported environments.
  });

window.VWGolfFirebase = {
  app,
  auth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  googleWebClientId,
  firebaseConfig
};

window.dispatchEvent(new CustomEvent("vwgolf:firebase-ready"));
