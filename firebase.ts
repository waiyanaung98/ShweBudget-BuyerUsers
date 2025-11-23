import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Updated with your specific Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqrbPYWELTPO4jCXwdQ6mFIgGSxOG0CDk",
  authDomain: "shwebudget-buyeruser.firebaseapp.com",
  projectId: "shwebudget-buyeruser",
  storageBucket: "shwebudget-buyeruser.firebasestorage.app",
  messagingSenderId: "824224370532",
  appId: "1:824224370532:web:a31f057c275259a4967471"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let db: Firestore | undefined;

try {
  // Ensure app is only initialized once
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  if (app) {
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { auth, googleProvider, db };