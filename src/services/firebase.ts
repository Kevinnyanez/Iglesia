import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getOptionalEnv } from '../utils/env';

const firebaseConfig = {
  apiKey: getOptionalEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getOptionalEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getOptionalEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getOptionalEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getOptionalEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getOptionalEnv('VITE_FIREBASE_APP_ID'),
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig as Required<typeof firebaseConfig>) : null;

export async function getFirebaseMessaging() {
  if (!firebaseApp) {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  return getMessaging(firebaseApp);
}
