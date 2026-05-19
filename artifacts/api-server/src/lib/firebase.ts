import admin from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

export function getFirestore(): Firestore {
  if (_db) return _db;

  const firebaseJson = process.env.FIREBASE_JSON;
  if (!firebaseJson) {
    throw new Error("FIREBASE_JSON environment variable is not set");
  }

  const serviceAccount = JSON.parse(firebaseJson);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  _db = admin.firestore();
  return _db;
}
