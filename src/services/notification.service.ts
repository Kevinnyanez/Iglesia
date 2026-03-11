import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { getOptionalEnv } from '../utils/env';
import { ensureFirebaseMessagingServiceWorker } from '../pwa/firebase-sw';

export type NotificationEventType =
  | 'daily_verse'
  | 'new_comment'
  | 'new_church_post'
  | 'new_post'
  | 'new_like'
  | 'goal_completed'
  | 'goal_reminder'
  | 'new_direct_message';

export interface NotificationSubscriptionPayload {
  token: string;
  userId: string;
  churchId?: string | null;
}

export interface NotificationEventPayload {
  type: NotificationEventType;
  [key: string]: unknown;
}

export const notificationService = {
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!('Notification' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const vapidKey = getOptionalEnv('VITE_FIREBASE_VAPID_KEY');
    if (!vapidKey || vapidKey.length < 80) {
      return null;
    }

    const registration = await ensureFirebaseMessagingServiceWorker();

    try {
      return await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration ?? undefined,
      });
    } catch (error) {
      console.warn('Push notifications disabled due to invalid web push key or browser config.', error);
      return null;
    }
  },

  onForegroundMessage(callback: (payload: unknown) => void) {
    getFirebaseMessaging().then((messaging) => {
      if (!messaging) return;
      onMessage(messaging, callback);
    });
  },

  async registerTokenInBackend(payload: NotificationSubscriptionPayload): Promise<void> {
    const baseUrl = getOptionalEnv('VITE_SUPABASE_URL');
    const anonKey = getOptionalEnv('VITE_SUPABASE_ANON_KEY');
    const url = baseUrl ? `${baseUrl}/functions/v1/notifications-register` : '/api/notifications/register';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (anonKey) headers['Authorization'] = `Bearer ${anonKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to register notification token. Status: ${response.status}`);
    }
  },

  async notifyEvent(payload: NotificationEventPayload): Promise<void> {
    const baseUrl = getOptionalEnv('VITE_SUPABASE_URL');
    const anonKey = getOptionalEnv('VITE_SUPABASE_ANON_KEY');
    const url = baseUrl ? `${baseUrl}/functions/v1/notifications-event` : '/api/notifications/event';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (anonKey) headers['Authorization'] = `Bearer ${anonKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to publish notification event. Status: ${response.status}`);
    }
  },
};
