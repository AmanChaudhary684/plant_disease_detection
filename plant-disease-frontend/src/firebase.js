import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTGkIBkBTiIxTjtR1ByQSYg6lmHIfNmC8",
  authDomain: "leafdoc-ai-dbc87.firebaseapp.com",
  projectId: "leafdoc-ai-dbc87",
  storageBucket: "leafdoc-ai-dbc87.firebasestorage.app",
  messagingSenderId: "325892667462",
  appId: "1:325892667462:web:935048372f088e851ab247"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();