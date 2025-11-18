
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyDeYgDkbQNW0tzTsIViowgmlbZr4cyfdnE",
  authDomain: "dyverze-ads-app.firebaseapp.com",
  projectId: "dyverze-ads-app",
  storageBucket: "dyverze-ads-app.appspot.com",
  messagingSenderId: "859818727374",
  appId: "1:859818727374:web:17fc30ace915d74fd2bd9f",
  measurementId: "G-HBHTBTZNEQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firebase persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firebase persistence not supported in this browser.');
    }
});

export { db, auth };
