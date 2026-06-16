// Server-only Firebase Admin SDK — full access, bypasses Firestore/Storage security rules.
// Only import this from server functions or other *.server.ts modules, never from
// route files or *.functions.ts top-level scope (those ship to the client bundle).
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function adminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  const missing = [
    !projectId && "FIREBASE_PROJECT_ID",
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !privateKey && "FIREBASE_PRIVATE_KEY",
    !storageBucket && "FIREBASE_STORAGE_BUCKET",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase admin environment variable(s): ${missing.join(", ")}. Generate a service account key in the Firebase console (Project settings > Service accounts).`,
    );
  }
  return { projectId, clientEmail, privateKey, storageBucket } as {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    storageBucket: string;
  };
}

let _app: App | undefined;
function getAdminApp() {
  if (!_app) {
    const config = adminConfig();
    _app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey,
          }),
          storageBucket: config.storageBucket,
        });
  }
  return _app;
}

let _adminAuth: Auth | undefined;
export const adminAuth = new Proxy({} as Auth, {
  get(_, prop, receiver) {
    if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
    return Reflect.get(_adminAuth, prop, receiver);
  },
});

let _adminDb: Firestore | undefined;
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop, receiver) {
    if (!_adminDb) _adminDb = getFirestore(getAdminApp());
    return Reflect.get(_adminDb, prop, receiver);
  },
});

let _adminStorage: Storage | undefined;
export const adminStorage = new Proxy({} as Storage, {
  get(_, prop, receiver) {
    if (!_adminStorage) _adminStorage = getStorage(getAdminApp());
    return Reflect.get(_adminStorage, prop, receiver);
  },
});
