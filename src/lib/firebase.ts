import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LLOSA,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LLOSA,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_LLOSA,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_FIREBASE_* en .env.local (ver .env.local.example)",
    );
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
