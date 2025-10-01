import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsAjRQ-SmVrDYf54HE0wg1rnTWknELkc4",
  authDomain: "son-prim-app.firebaseapp.com",
  projectId: "son-prim-app",
  storageBucket: "son-prim-app.firebasestorage.app",
  messagingSenderId: "549213995823",
  appId: "1:549213995823:web:b86f9e459d01198da4d7da"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export {};