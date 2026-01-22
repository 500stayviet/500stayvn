import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration missing');
    }
    app = initializeApp(firebaseConfig);
  } catch (error) {
    throw error;
  }
} else {
  app = getApps()[0];
}

try {
  db = getFirestore(app, 'stayviet');
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  throw error;
}

export { app, db, auth, storage };
export default app;
