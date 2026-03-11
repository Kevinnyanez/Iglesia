import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
    }
    return;
  }

  registerSW({
    immediate: true,
    onRegistered() {
      // Service Worker registered successfully.
    },
    onRegisterError(error: unknown) {
      console.error('Service Worker registration failed:', error);
    },
  });
}
