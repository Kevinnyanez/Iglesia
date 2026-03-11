importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

let messaging = null;
let configured = false;

function setupMessaging(firebaseConfig) {
  if (configured) return;
  if (!firebaseConfig) return;

  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Biblia Comunidad';
    const options = {
      body: payload.notification?.body ?? '',
      icon: '/icons/icon-192.svg',
      data: payload.data ?? {},
    };

    self.registration.showNotification(title, options);
  });

  configured = true;
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SET_FIREBASE_CONFIG') return;
  setupMessaging(event.data.payload);
});
