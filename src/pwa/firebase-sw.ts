import { getOptionalEnv } from '../utils/env';

function getFirebaseConfig() {
  const apiKey = getOptionalEnv('VITE_FIREBASE_API_KEY');
  const authDomain = getOptionalEnv('VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = getOptionalEnv('VITE_FIREBASE_PROJECT_ID');
  const storageBucket = getOptionalEnv('VITE_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = getOptionalEnv('VITE_FIREBASE_MESSAGING_SENDER_ID');
  const appId = getOptionalEnv('VITE_FIREBASE_APP_ID');

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export async function ensureFirebaseMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const config = getFirebaseConfig();

  if (config) {
    const readyRegistration = await navigator.serviceWorker.ready;
    const targetWorker =
      readyRegistration.active ?? registration.active ?? registration.waiting ?? registration.installing ?? null;

    targetWorker?.postMessage({
      type: 'SET_FIREBASE_CONFIG',
      payload: config,
    });
  }

  return registration;
}
