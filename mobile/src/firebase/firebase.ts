import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrMlsqeuy710d3xr9hI8D8sJQTVVB9cig",
  authDomain: "traveldiary-445a4.firebaseapp.com",
  projectId: "traveldiary-445a4",
  storageBucket: "traveldiary-445a4.firebasestorage.app",
  messagingSenderId: "472563535586",
  appId: "1:472563535586:web:6c0b528f04fe4b805218bb",
  measurementId: "G-2V0VGGVP8P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
