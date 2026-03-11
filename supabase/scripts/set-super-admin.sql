-- Dar super admin a un usuario por email
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Reemplaza 'tu-email@ejemplo.com' con el email real

UPDATE public.users
SET is_platform_admin = true
WHERE email = 'tu-email@ejemplo.com';
