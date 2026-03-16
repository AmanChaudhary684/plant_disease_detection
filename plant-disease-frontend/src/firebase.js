// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkTL2A0_qtLYvzBrgtot-DI5rMfxN8FPc",
  authDomain: "leafdoc-ai.firebaseapp.com",
  projectId: "leafdoc-ai",
  storageBucket: "leafdoc-ai.firebasestorage.app",
  messagingSenderId: "352473419154",
  appId: "1:352473419154:web:789ef6c4c2fce52de3854b",
  measurementId: "G-VEL89ZTFP2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();