create extension if not exists "pgcrypto";

alter table public.users
  add column if not exists is_platform_admin boolean not null default false;

alter table public.users
  add column if not exists can_create_community boolean not null default false;

-- Extend churches (communities) with profile fields
alter table public.churches add column if not exists description text;
alter table public.churches add column if not exists location text;
alter table public.churches add column if not exists avatar_url text;
alter table public.churches add column if not exists banner_url text;
alter table public.churches add column if not exists is_private boolean not null default true;
alter table public.churches add column if not exists created_by uuid references public.users(id);
-- Ensure all communities require admin approval for joining
update public.churches set is_private = true where is_private = false;

-- Community join requests (for approval flow)
create table if not exists public.community_join_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists community_join_requests_community_user_uidx
  on public.community_join_requests (community_id, user_id);

create index if not exists community_join_requests_community_status_idx
  on public.community_join_requests (community_id, status);

-- Community goals (metas de la comunidad para incentivar uso)
create table if not exists public.community_goals (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  type text not null check (type in ('prayer', 'bible', 'meditation')),
  target_days integer not null check (target_days > 0),
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists community_goals_community_idx
  on public.community_goals (community_id, created_at desc);

-- Community meetings (reuniones / servicios con días y horarios)
create table if not exists public.community_meetings (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  schedule text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_meetings_community_idx
  on public.community_meetings (community_id, created_at desc);

-- -------------------------------------------------------------------
-- Schema evolution only (no recreation of existing base tables)
-- Existing tables: churches, users, posts, comments, reading_progress,
-- notification_subscriptions
-- -------------------------------------------------------------------

-- 1) Communities membership (many-to-many user <-> community)
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator', 'member')),
  joined_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_members_role_check'
      and conrelid = 'public.community_members'::regclass
  ) then
    alter table public.community_members
      add constraint community_members_role_check
      check (role in ('admin', 'moderator', 'member'));
  end if;
end $$;

create unique index if not exists community_members_community_user_uidx
  on public.community_members (community_id, user_id);

create index if not exists community_members_user_idx
  on public.community_members (user_id);

create index if not exists community_members_community_role_idx
  on public.community_members (community_id, role);

create table if not exists public.community_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text not null,
  requested_by uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.community_requests add column if not exists description text;
alter table public.community_requests add column if not exists location text;

create index if not exists community_requests_requested_by_idx
  on public.community_requests (requested_by);

create index if not exists community_requests_status_created_idx
  on public.community_requests (status, created_at desc);

-- 2) Post interactions
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists post_likes_post_user_uidx
  on public.post_likes (post_id, user_id);

create index if not exists post_likes_user_idx
  on public.post_likes (user_id);

create index if not exists post_likes_post_created_idx
  on public.post_likes (post_id, created_at desc);

-- 3) Extend posts table with optional media fields
alter table public.posts
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists post_type text,
  add column if not exists comments_enabled boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_post_type_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_post_type_check
      check (post_type is null or post_type in ('reflection', 'prayer_request', 'testimony', 'question'));
  end if;
end $$;

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

create index if not exists posts_church_visibility_created_idx
  on public.posts (church_id, visibility, created_at desc);

-- 4) Spiritual goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('prayer', 'bible', 'meditation')),
  target_minutes integer not null default 0 check (target_minutes >= 0),
  target_days integer not null check (target_days > 0),
  created_at timestamptz not null default now()
);

alter table public.goals add column if not exists target_days integer not null default 7;

create index if not exists goals_user_created_idx
  on public.goals (user_id, created_at desc);

create index if not exists goals_user_type_idx
  on public.goals (user_id, type);

-- 5) Goal progress
create table if not exists public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  minutes_done integer not null default 0 check (minutes_done >= 0)
);

create index if not exists goal_progress_goal_date_idx
  on public.goal_progress (goal_id, date desc);

create index if not exists goal_progress_date_idx
  on public.goal_progress (date desc);

create unique index if not exists goal_progress_goal_date_uidx
  on public.goal_progress (goal_id, date);

-- 5b) Saved verses (user bookmarks)
create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  verse_reference text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists saved_verses_user_created_idx
  on public.saved_verses (user_id, created_at desc);

-- 6) Community chat
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.churches(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_messages_community_created_idx
  on public.community_messages (community_id, created_at desc);

create index if not exists community_messages_author_idx
  on public.community_messages (author_id);

-- 7) Direct chats
create table if not exists public.direct_chats (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.users(id) on delete cascade,
  user2_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint direct_chats_users_check check (user1_id <> user2_id)
);

create unique index if not exists direct_chats_pair_uidx
  on public.direct_chats (least(user1_id, user2_id), greatest(user1_id, user2_id));

create index if not exists direct_chats_user1_idx
  on public.direct_chats (user1_id);

create index if not exists direct_chats_user2_idx
  on public.direct_chats (user2_id);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.direct_chats(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_chat_created_idx
  on public.direct_messages (chat_id, created_at desc);

create index if not exists direct_messages_author_idx
  on public.direct_messages (author_id);

-- 8) Row Level Security for chat tables
alter table public.community_messages enable row level security;
alter table public.direct_chats enable row level security;
alter table public.direct_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_messages' and policyname = 'community_messages_select_member'
  ) then
    create policy community_messages_select_member
      on public.community_messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.community_members cm
          where cm.community_id = community_messages.community_id
            and cm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_messages' and policyname = 'community_messages_insert_member'
  ) then
    create policy community_messages_insert_member
      on public.community_messages
      for insert
      to authenticated
      with check (
        author_id = auth.uid()
        and exists (
          select 1
          from public.community_members cm
          where cm.community_id = community_messages.community_id
            and cm.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'direct_chats' and policyname = 'direct_chats_select_participant'
  ) then
    create policy direct_chats_select_participant
      on public.direct_chats
      for select
      to authenticated
      using (user1_id = auth.uid() or user2_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'direct_chats' and policyname = 'direct_chats_insert_participant'
  ) then
    create policy direct_chats_insert_participant
      on public.direct_chats
      for insert
      to authenticated
      with check (
        (user1_id = auth.uid() or user2_id = auth.uid())
        and user1_id <> user2_id
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'direct_messages' and policyname = 'direct_messages_select_participant'
  ) then
    create policy direct_messages_select_participant
      on public.direct_messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.direct_chats dc
          where dc.id = direct_messages.chat_id
            and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'direct_messages' and policyname = 'direct_messages_insert_participant'
  ) then
    create policy direct_messages_insert_participant
      on public.direct_messages
      for insert
      to authenticated
      with check (
        author_id = auth.uid()
        and exists (
          select 1
          from public.direct_chats dc
          where dc.id = direct_messages.chat_id
            and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
        )
      );
  end if;
end $$;

-- 9) Spiritual streaks
create table if not exists public.user_streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date
);

create or replace function public.update_user_streak(p_user_id uuid, p_activity_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer;
  v_longest integer;
  v_last date;
  v_next_current integer;
  v_next_longest integer;
begin
  select current_streak, longest_streak, last_activity_date
    into v_current, v_longest, v_last
  from public.user_streaks
  where user_id = p_user_id;

  if not found then
    insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    values (p_user_id, 1, 1, p_activity_date);
    return;
  end if;

  if v_last is null then
    v_next_current := 1;
  elsif p_activity_date = v_last then
    v_next_current := v_current;
  elsif p_activity_date = v_last + 1 then
    v_next_current := v_current + 1;
  elsif p_activity_date > v_last + 1 then
    v_next_current := 1;
  else
    v_next_current := v_current;
  end if;

  v_next_longest := greatest(v_longest, v_next_current);

  update public.user_streaks
  set current_streak = v_next_current,
      longest_streak = v_next_longest,
      last_activity_date = greatest(coalesce(v_last, p_activity_date), p_activity_date)
  where user_id = p_user_id;
end;
$$;

create or replace function public.on_reading_progress_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed is true then
    perform public.update_user_streak(new.user_id, new.date::date);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reading_progress_streak on public.reading_progress;
create trigger trg_reading_progress_streak
after insert or update of completed, date on public.reading_progress
for each row
execute function public.on_reading_progress_streak();

create or replace function public.on_goal_progress_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if new.completed is true then
    select user_id into v_user_id
    from public.goals
    where id = new.goal_id;

    if v_user_id is not null then
      perform public.update_user_streak(v_user_id, new.date);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_goal_progress_streak on public.goal_progress;
create trigger trg_goal_progress_streak
after insert or update of completed, date on public.goal_progress
for each row
execute function public.on_goal_progress_streak();
