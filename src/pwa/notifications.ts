import { notificationService } from '../services/notification.service';

interface InitPushNotificationsArgs {
  userId: string;
  churchId?: string | null;
}

export async function initPushNotifications(args: InitPushNotificationsArgs) {
  try {
    const token = await notificationService.requestPermissionAndGetToken();
    if (!token) return;

    await notificationService.registerTokenInBackend({
      token,
      userId: args.userId,
      churchId: args.churchId,
    });
  } catch (error) {
    console.warn('Push notification setup skipped.', error);
  }
}
