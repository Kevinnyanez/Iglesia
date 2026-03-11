-- Storage buckets para avatares y banners
-- Ejecutar en Supabase SQL Editor: supabase/storage.sql

-- Storage: ejecutar en Supabase Dashboard > SQL Editor
-- Si los buckets ya existen, crea los buckets manualmente en Storage y solo ejecuta las políticas

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas (drop si existen para poder re-ejecutar)
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "banners_insert" on storage.objects;
drop policy if exists "banners_update" on storage.objects;
drop policy if exists "banners_select" on storage.objects;

create policy "avatars_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars');

create policy "avatars_update" on storage.objects for update to authenticated
using (bucket_id = 'avatars');

create policy "avatars_select" on storage.objects for select to public
using (bucket_id = 'avatars');

create policy "banners_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'banners');

create policy "banners_update" on storage.objects for update to authenticated
using (bucket_id = 'banners');

create policy "banners_select" on storage.objects for select to public
using (bucket_id = 'banners');
