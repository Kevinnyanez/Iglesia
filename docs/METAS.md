# Documentación: Metas espirituales

Referencia para entender y rediseñar la lógica de metas en la app.

---

## 1. Resumen del flujo

1. **Crear meta:** El usuario elige tipo (orar/leer Biblia), minutos por día y cantidad de días.
2. **Progreso diario:** Cada día marca el siguiente slot del checklist como completado (un día por fecha).
3. **Meta completada:** Cuando todos los días están marcados, se muestra el modal de celebración.
4. **Compartir:** Botón para compartir la meta con la comunidad (PostComposer).
5. **Eliminar:** Botón para borrar la meta (con confirmación).

---

## 2. Base de datos

### Tabla `goals`

| Columna         | Tipo      | Descripción                                      |
|-----------------|-----------|--------------------------------------------------|
| id              | uuid      | PK                                               |
| user_id         | uuid      | FK → users                                       |
| title           | text      | Ej: "Oración 15 min durante 7 días"             |
| type            | text      | `'prayer'` \| `'bible'` \| `'meditation'`       |
| target_minutes  | integer   | Minutos por día (5, 10, 15, 20, 30)             |
| target_days     | integer   | Días totales (3, 5, 7, 10, 14, 21, 30)          |
| created_at      | timestamptz | Fecha de creación                             |

### Tabla `goal_progress`

| Columna    | Tipo    | Descripción                                      |
|------------|---------|--------------------------------------------------|
| id         | uuid    | PK                                               |
| goal_id    | uuid    | FK → goals (on delete cascade)                   |
| date       | date    | Fecha del día completado                         |
| completed  | boolean | Si se completó ese día                           |
| minutes_done | integer | Minutos realizados (legacy, puede ser 0)       |

**Constraint único:** `(goal_id, date)` — un registro por meta y por fecha.

**Lógica de progreso:** Cada fila con `completed = true` cuenta como un día completado. El orden se obtiene por `date` ascendente. Si hay N filas completadas, la meta está al día N de `target_days`.

### Tabla `saved_verses` (versículos guardados)

| Columna         | Tipo      | Descripción                    |
|-----------------|-----------|--------------------------------|
| id              | uuid      | PK                             |
| user_id         | uuid      | FK → users                     |
| verse_reference | text      | Ej: "Juan 3:16"                |
| note            | text      | Nota opcional                  |
| created_at      | timestamptz | Fecha de guardado            |

---

## 3. Reglas de negocio

### Creación de meta

- **Título:** Generado automáticamente: `"{Oración|Lectura bíblica} {target_minutes} min durante {target_days} días"`.
- **Opciones de minutos:** 5, 10, 15, 20, 30.
- **Opciones de días:** 3, 5, 7, 10, 14, 21, 30.

### Progreso diario

- Solo se puede marcar **un día por fecha** (por meta).
- Los días se completan en orden: el siguiente día es el primero no completado.
- Se usa siempre la fecha actual (`today`) al marcar.
- Una meta está completada cuando `count(goal_progress WHERE completed) >= goal.target_days`.

### Streak (rachas)

- El trigger `on_goal_progress_streak` actualiza `user_streaks` cuando se marca un día completado.
- Se usa para mantener la racha de actividad del usuario.

---

## 4. Archivos relevantes

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/pages/GoalsPage.tsx` | UI principal, formulario, lista de metas, modales |
| `src/services/goals.service.ts` | CRUD de metas y progreso |
| `src/services/savedVerses.service.ts` | CRUD de versículos guardados |
| `src/hooks/useGoals.ts` | Hooks React Query para metas |
| `src/hooks/useSavedVerses.ts` | Hooks para versículos guardados |
| `src/types/models.ts` | `Goal`, `GoalProgress`, `GoalType` |
| `supabase/schema.sql` | Tablas `goals`, `goal_progress`, `saved_verses` y triggers |

---

## 5. Query keys (React Query)

- `queryKeys.goals` — lista de metas del usuario
- `queryKeys.goalProgress(goalId)` — progreso de una meta
- `queryKeys.savedVerses` — versículos guardados

---

## 6. Servicios (API)

### goalsService

- `createGoal(payload)` — Crear meta
- `fetchUserGoals()` — Listar metas del usuario
- `markGoalProgress(payload)` — Marcar día completado (upsert por goal_id + date)
- `deleteGoal(goalId)` — Eliminar meta (cascade borra goal_progress)
- `fetchGoalProgress(goalId)` — Obtener progreso de una meta

### savedVersesService

- `fetchUserSavedVerses()` — Listar versículos guardados
- `saveVerse(payload)` — Guardar versículo
- `deleteSavedVerse(id)` — Eliminar versículo

---

## 7. Notificaciones

- Al marcar un día como completado, `notificationService.notifyEvent({ type: 'goal_completed', goalId, date })` se dispara.
- Se puede usar para notificaciones push o eventos en tiempo real.

---

## 8. Ideas para rediseño

- **Días flexibles:** Permitir número de días personalizado (input numérico).
- **Título editable:** Permitir editar el título en lugar de generarlo.
- **Historial:** Mostrar metas completadas en una sección aparte.
- **Recordatorios:** Notificaciones para recordar completar el día.
- **Compartir real:** Conectar el botón de compartir con la lógica de posts/comunidad.
- **Tipo meditation:** El tipo existe en el schema pero no en la UI.
- **RLS:** Añadir políticas de seguridad en Supabase para `goals` y `saved_verses`.
