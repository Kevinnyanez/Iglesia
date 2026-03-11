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

## Backend: Supabase Edge Functions (implementado)

El frontend llama a las Edge Functions de Supabase:
- `POST .../functions/v1/notifications-register` – registrar token FCM
- `POST .../functions/v1/notifications-event` – enviar evento (post, like, comentario)

**Archivos creados:**
1. `supabase/functions/notifications-register/index.ts` – guarda el token en `notification_subscriptions`
2. `supabase/functions/notifications-event/index.ts` – recibe el evento y busca tokens de destinatarios

**Pasos para activar:**
1. Ejecutar `supabase/migrations/notification_subscriptions.sql` en el SQL Editor
2. Desplegar ambas funciones en Supabase
3. **Push real:** En Firebase Console → Project Settings → Service Accounts → Generate new private key. Luego en Supabase → Edge Functions → Secrets, agregar:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = contenido del JSON descargado (como string)
   - `FIREBASE_PROJECT_ID` = tu project ID (ej. biblia-app-97be8)
4. El frontend ya usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

**Realtime (likes al instante):** En Supabase Dashboard → Database → Replication, habilitar replicación para `posts`, `post_likes` y `comments`. Sin esto, los likes no se actualizan en tiempo real en PWA.

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

- `VITE_FIREBASE_VAPID_KEY` – **clave VAPID** de Firebase (frontend). **No** uses el Measurement ID (G-XXXXX). La VAPID está en Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair. Es una cadena larga tipo base64.
- En el backend: credenciales de Firebase Admin (service account JSON)

## Vercel

En Vercel solo necesitas las mismas variables de entorno que en local (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_*`. Las Edge Functions de notificaciones corren en Supabase, no en Vercel.

## Troubleshooting

**No llegan notificaciones push:**
1. ¿Aceptaste permisos de notificación en el navegador/PWA?
2. ¿Está `FIREBASE_SERVICE_ACCOUNT_JSON` en Supabase Edge Functions → Secrets?
3. ¿La tabla `notification_subscriptions` tiene tu token? (revisar en SQL Editor)
4. ¿Las Edge Functions están desplegadas? Probar: `curl -X POST TU_URL/functions/v1/notifications-event -H "Content-Type: application/json" -d '{"type":"new_post","postId":"test"}'`

**Likes no aparecen hasta salir/entrar (PWA):**
- Se agregó refetch automático al volver a la app (`visibilitychange`)
- Habilitar replicación de `post_likes` en Supabase → Database → Replication
