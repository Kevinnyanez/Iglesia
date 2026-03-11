import { notificationService } from '../services/notification.service';

interface InitPushNotificationsArgs {
  userId: string;
  churchId?: string | null;
}

export async function initPushNotifications(args: InitPushNotificationsArgs) {
  try {
    const token = await notificationService.requestPermissionAndGetToken();
    if (!token) {
      console.info('[Notificaciones] Sin token (permiso denegado o no soportado)');
      return;
    }

    await notificationService.registerTokenInBackend({
      token,
      userId: args.userId,
      churchId: args.churchId,
    });
    console.info('[Notificaciones] Token registrado correctamente');
  } catch (error) {
    console.warn('[Notificaciones] Error al configurar:', error);
  }
}
