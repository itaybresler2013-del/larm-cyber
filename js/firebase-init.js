import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBboyiqvQCc3j0TSV28mUKAUunJ6ANLW5A",
  authDomain: "larm-cyber.firebaseapp.com",
  databaseURL: "https://larm-cyber-default-rtdb.firebaseio.com",
  projectId: "larm-cyber",
  storageBucket: "larm-cyber.firebasestorage.app",
  messagingSenderId: "511914130904",
  appId: "1:511914130904:web:fa36f55153b93e338646ad",
  measurementId: "G-CE0BWBJ6DJ"
};

let app, auth, db;

try {
    // Check if configuration is updated before initializing
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase Initialized Successfully");
    } else {
        console.warn("Firebase configuration is missing! Running in MOCK mode.");
    }
} catch (error) {
    console.error("Firebase initialization error", error);
}

export { auth, db, firebaseConfig };
