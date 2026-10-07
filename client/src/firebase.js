// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "campusgig-42702.firebaseapp.com",
    projectId: "campusgig-42702",
    storageBucket: "campusgig-42702.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Authentication
export const auth = getAuth(app);