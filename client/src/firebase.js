
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDGcJzDFlXtGC4chiZYkLIMVRpzU7AVimI",
    authDomain: "campusgig-42702.firebaseapp.com",
    projectId: "campusgig-42702",
    storageBucket: "campusgig-42702.firebasestorage.app",
    messagingSenderId: "611524681253",
    appId: "1:611524681253:web:4ab4e75477a8276d4ea9cc",
    measurementId: "G-Y964B3V3PD"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
