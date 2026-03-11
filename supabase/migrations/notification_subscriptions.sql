-- Tabla para guardar tokens FCM de usuarios (para push notifications)
-- Ejecutar en Supabase SQL Editor si no existe

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  church_id uuid references public.churches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, token)
);

create index if not exists notification_subscriptions_user_idx on public.notification_subscriptions(user_id);
create index if not exists notification_subscriptions_church_idx on public.notification_subscriptions(church_id);
