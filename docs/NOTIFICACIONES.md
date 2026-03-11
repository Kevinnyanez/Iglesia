# Sistema de notificaciones push

## Estado actual

El frontend ya envía eventos de notificación cuando ocurren estas acciones:

| Evento | Cuándo | Payload |
|--------|--------|---------|
| `new_church_post` | Alguien publica en una comunidad | `communityId`, `postId` |
| `new_post` | Alguien publica en global | `postId`, `visibility` |
| `new_comment` | Alguien comenta tu publicación | `postId`, `receiverUserId` |
| `new_like` | Alguien da like a tu publicación | `postId`, `receiverUserId`, `likerUserId` |
| `goal_completed` | Completas una meta | `goalId`, `date` |
| `goal_reminder` | Recordatorio: meta por terminar el día | (requiere cron) |
| `new_direct_message` | Mensaje directo | `chatId`, `receiverUserId` |

## Lo que falta: backend

El frontend llama a:
- `POST /api/notifications/register` – registrar token FCM del usuario
- `POST /api/notifications/event` – enviar evento (nuevo post, like, comentario, etc.)

**No hay backend implementado.** Las llamadas devuelven 404. Para que las notificaciones funcionen necesitas:

### Opción 1: Supabase Edge Functions

1. Crear `supabase/functions/notifications-register/index.ts` que guarde el token en `notification_subscriptions`
2. Crear `supabase/functions/notifications-event/index.ts` que reciba el evento, busque los tokens de los destinatarios y envíe push con Firebase Admin SDK
3. Configurar proxy en Vercel o usar la URL de Supabase Functions directamente

### Opción 2: Vercel Serverless (API Routes)

1. Crear `api/notifications/register.ts` y `api/notifications/event.ts`
2. Usar Firebase Admin SDK para enviar push
3. Guardar tokens en Supabase (`notification_subscriptions`)

### Tabla notification_subscriptions

```sql
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  church_id uuid references public.churches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, token)
);
```

### Recordatorio de metas (goal_reminder)

Requiere un **cron** que corra cada día (ej. 20:00). El job debe:

1. Buscar usuarios con metas activas (no completadas hoy)
2. Obtener sus tokens FCM
3. Enviar push: "Aún no completaste tu meta de hoy: [título]"

En Supabase: usar `pg_cron` + `pg_net` para invocar una Edge Function a esa hora.

## Variables de entorno

- `VITE_FIREBASE_VAPID_KEY` – clave VAPID de Firebase (frontend)
- En el backend: credenciales de Firebase Admin (service account JSON)
