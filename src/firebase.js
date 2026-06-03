import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId
);

/** @type {import("firebase/app").FirebaseApp | null} */
let app = null;

/** @type {import("firebase/firestore").Firestore | null} */
let db = null;

/** @type {import("firebase/auth").Auth | null} */
let auth = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };
