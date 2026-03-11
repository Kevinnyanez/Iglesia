# Documentación: Comunidades

Referencia para entender y extender la lógica de comunidades en la app.

---

## 1. Resumen

Las comunidades son grupos reducidos donde los miembros comparten publicaciones, metas personales, metas comunitarias y chat. Funcionalmente igual que el feed global, pero con acceso restringido a miembros.

---

## 2. Roles

### Nivel plataforma (usuarios)

| Rol | Campo en `users` | Permisos |
|-----|------------------|----------|
| **Superadmin** | `is_platform_admin = true` | Aprobar solicitudes de crear comunidad, crear comunidades directamente, otorgar `can_create_community` |
| **Creador de comunidades** | `can_create_community = true` | Crear comunidades directamente (sin solicitud) |
| **Usuario** | (ninguno) | Solicitar crear comunidad, unirse a comunidades, participar |

### Nivel comunidad (community_members)

| Rol | Permisos |
|-----|----------|
| **admin** | Crear metas comunitarias, aprobar/rechazar solicitudes de ingreso, gestionar miembros |
| **moderator** | (reservado para futuras funciones) |
| **member** | Publicar, ver feed, chat, metas comunitarias |

---

## 3. Flujo de creación de comunidad

1. **Usuario sin permiso:** Envía solicitud (nombre, descripción, ciudad, país, ubicación).
2. **Superadmin:** Aprueba o rechaza en `/church`.
3. **Al aprobar:** Se crea la comunidad y el solicitante queda como admin.
4. **Usuario con `can_create_community` o superadmin:** Crea comunidad directamente sin solicitud.

---

## 4. Base de datos

### Tabla `churches` (comunidades)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| name | text | Nombre |
| description | text | Descripción (opcional) |
| city | text | Ciudad |
| country | text | País |
| location | text | Dirección/ubicación (opcional) |
| is_private | boolean | Si es true, requiere aprobación para unirse |
| avatar_url | text | URL foto de perfil (opcional) |
| banner_url | text | URL banner/portada (opcional) |
| created_by | uuid | FK → users (quien la creó) |

### Tabla `community_members`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| community_id | uuid | FK → churches |
| user_id | uuid | FK → users |
| role | text | 'admin' \| 'moderator' \| 'member' |
| joined_at | timestamptz | Fecha de ingreso |

### Tabla `community_join_requests`

Para comunidades privadas (`is_private = true`).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| community_id | uuid | FK → churches |
| user_id | uuid | FK → users |
| status | text | 'pending' \| 'approved' \| 'rejected' |

### Tabla `community_goals`

Metas que la comunidad propone para incentivar el uso.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| community_id | uuid | FK → churches |
| created_by | uuid | FK → users (admin que la creó) |
| title | text | Título |
| description | text | Descripción (opcional) |
| type | text | 'prayer' \| 'bible' \| 'meditation' |
| target_days | integer | Días objetivo |
| start_date | date | Inicio (opcional) |
| end_date | date | Fin (opcional) |

---

## 5. Archivos relevantes

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/pages/ChurchFeedPage.tsx` | Hub de comunidades, crear/solicitar, descubrir |
| `src/pages/CommunityFeedPage.tsx` | Perfil, feed, metas, chat de una comunidad |
| `src/services/community.service.ts` | CRUD comunidades, unirse, solicitudes de ingreso |
| `src/services/communityRequest.service.ts` | Solicitudes de crear comunidad |
| `src/services/communityGoals.service.ts` | Metas comunitarias |
| `src/services/posts.service.ts` | Feed por comunidad (solo miembros) |

---

## 6. Acceso al feed de comunidad

- **Solo miembros** ven el feed de una comunidad.
- `listCommunityFeed` comprueba membresía antes de devolver posts.
- Los no miembros ven el perfil (nombre, descripción, ubicación, miembros) y el botón "Unirme".

---

## 7. Otorgar permiso para crear comunidades

Como superadmin, ejecutar en Supabase:

```sql
UPDATE public.users
SET can_create_community = true
WHERE id = 'uuid-del-usuario';
```

---

## 8. Migración de schema

Ejecutar en Supabase SQL Editor:

```sql
-- Usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_create_community boolean NOT NULL DEFAULT false;

-- Churches
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS banner_url text;

-- Community requests
ALTER TABLE public.community_requests ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.community_requests ADD COLUMN IF NOT EXISTS location text;

-- Community join requests
CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS community_join_requests_community_user_uidx
  ON public.community_join_requests (community_id, user_id);

-- Community goals
CREATE TABLE IF NOT EXISTS public.community_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('prayer', 'bible', 'meditation')),
  target_days integer NOT NULL CHECK (target_days > 0),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_goals_community_idx ON public.community_goals (community_id, created_at desc);
```

---

## 9. Ideas para extender

- Progreso de metas comunitarias (cuántos miembros completaron)
- Notificaciones cuando alguien solicita unirse
- Moderador: eliminar posts, silenciar usuarios
- Comunidades privadas por invitación
- Avatar/portada de comunidad
