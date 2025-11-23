import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOg9ltt-Nuu0siyPS7E4tgw669SkM8eVw",
  authDomain: "shwebudget.firebaseapp.com",
  projectId: "shwebudget",
  storageBucket: "shwebudget.firebasestorage.app",
  messagingSenderId: "462219103120",
  appId: "1:462219103120:web:e6326536dc184cbe20c115"
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