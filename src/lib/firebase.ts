import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

// ─── Auth Helpers ───────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();

export async function signInAnon(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const currentUser = auth.currentUser;

  // If currently anonymous, link the Google account
  if (currentUser && currentUser.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return result.user;
    } catch (error: unknown) {
      // If linking fails (e.g. account already exists), sign in directly
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/credential-already-in-use') {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
      throw error;
    }
  }

  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
