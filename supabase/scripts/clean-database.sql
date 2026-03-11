-- =============================================================================
-- Script para limpiar TODOS los registros de la base de datos
-- Solo elimina datos, NO modifica tablas, índices ni lógica.
-- Para testear la app desde cero.
--
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- O con CLI: supabase db execute -f supabase/scripts/clean-database.sql
--
-- OPCIONES:
-- 1) Limpieza de contenido: mantiene usuarios (puedes seguir logeado, feeds vacíos)
--    -> Comenta la línea "DELETE FROM public.users;" (aprox. línea 75)
--
-- 2) Limpieza total: borra todo incluyendo usuarios (tendrás que volver a registrarte)
--    -> Deja el script tal cual y descomenta el bloque final de auth.users
-- =============================================================================

-- Deshabilitar triggers temporalmente (evita errores en streaks, etc.)
SET session_replication_role = replica;

-- Eliminar en orden de dependencias (hijos antes que padres)

-- 1. Mensajes directos
DELETE FROM public.direct_messages;

-- 2. Chats directos
DELETE FROM public.direct_chats;

-- 3. Mensajes de comunidad
DELETE FROM public.community_messages;

-- 4. Likes de posts
DELETE FROM public.post_likes;

-- 5. Comentarios
DELETE FROM public.comments;

-- 6. Posts
DELETE FROM public.posts;

-- 7. Progreso de metas
DELETE FROM public.goal_progress;

-- 8. Metas de usuario
DELETE FROM public.goals;

-- 9. Versículos guardados
DELETE FROM public.saved_verses;

-- 10. Racha de usuario
DELETE FROM public.user_streaks;

-- 11. Progreso de lectura
DELETE FROM public.reading_progress;

-- 12. Solicitudes de unión a comunidad
DELETE FROM public.community_join_requests;

-- 13. Miembros de comunidad
DELETE FROM public.community_members;

-- 14. Metas de comunidad
DELETE FROM public.community_goals;

-- 15. Reuniones de comunidad
DELETE FROM public.community_meetings;

-- 16. Eventos de comunidad
DELETE FROM public.community_events;

-- 17. Solicitudes de comunidad (pendientes de aprobación)
DELETE FROM public.community_requests;

-- 18. Notificaciones (si existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_subscriptions') THEN
    DELETE FROM public.notification_subscriptions;
  END IF;
END $$;

-- 19. Comunidades (churches)
DELETE FROM public.churches;

-- 20. Usuarios de la app (public.users)
-- Para mantener usuarios y solo vaciar contenido: comenta la siguiente línea
DELETE FROM public.users;

-- 21. Storage: eliminar objetos subidos (avatares, banners)
-- Opcional: descomenta si quieres limpiar también archivos
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'banners');

-- Restaurar triggers
SET session_replication_role = DEFAULT;

-- =============================================================================
-- OPCIONAL: Borrar también usuarios de autenticación (auth.users)
-- Descomenta el siguiente bloque para un reset TOTAL.
-- Después tendrás que volver a registrarte desde cero.
-- =============================================================================
/*
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM storage.objects;
DELETE FROM auth.users;
*/
