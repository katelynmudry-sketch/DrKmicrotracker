import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function firebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variable(s): ${missing.join(", ")}. Create a Firebase project and add the web app config to your env.`,
    );
  }
  return config;
}

let _app: FirebaseApp | undefined;
function getFirebaseApp() {
  if (!_app) _app = getApps().length ? getApp() : initializeApp(firebaseConfig());
  return _app;
}

let _auth: Auth | undefined;
export const auth = new Proxy({} as Auth, {
  get(_, prop, receiver) {
    if (!_auth) {
      _auth = getAuth(getFirebaseApp());
      if (typeof window !== "undefined") {
        setPersistence(_auth, browserLocalPersistence).catch(() => {});
      }
    }
    return Reflect.get(_auth, prop, receiver);
  },
});

let _db: Firestore | undefined;
export const db = new Proxy({} as Firestore, {
  get(_, prop, receiver) {
    if (!_db) _db = getFirestore(getFirebaseApp());
    return Reflect.get(_db, prop, receiver);
  },
});

let _storage: FirebaseStorage | undefined;
export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop, receiver) {
    if (!_storage) _storage = getStorage(getFirebaseApp());
    return Reflect.get(_storage, prop, receiver);
  },
});

// Resolves once Firebase Auth has determined the initial signed-in/out state
// (auth.currentUser is unreliable before this fires once after page load).
export function waitForAuthUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
