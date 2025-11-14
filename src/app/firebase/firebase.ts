// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB46LIyqdWsdbThijDRKqFW0dRjFtyRXl0",
  authDomain: "calendar-assistant-5c8de.firebaseapp.com",
  projectId: "calendar-assistant-5c8de",
  storageBucket: "calendar-assistant-5c8de.firebasestorage.app",
  messagingSenderId: "777695496748",
  appId: "1:777695496748:web:565fc4452b38aeb6b59f89",
  measurementId: "G-T1LDKRZHGH",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
