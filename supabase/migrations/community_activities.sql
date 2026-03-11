-- Reuniones y oraciones: múltiples días y horarios
-- Eventos: fecha, hora, lugar, descripción (tipo invitación)
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1) Extender community_meetings
alter table public.community_meetings
  add column if not exists type text not null default 'meeting' check (type in ('meeting', 'prayer'));

alter table public.community_meetings
  add column if not exists slots jsonb default '[]'::jsonb;

-- slots: [{"days": ["Domingo", "Miércoles"], "time": "10:00"}, {"days": ["Viernes"], "time": "19:00"}]

-- 2) Tabla community_events (eventos especiales: Santa Cena, retiros, etc.)
create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_time text,
  place text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists community_events_community_idx
  on public.community_events (community_id, event_date desc);

-- RLS: solo admins pueden insertar/actualizar/eliminar
-- (usar las mismas políticas que community_meetings si existen, o permitir select público para miembros)
