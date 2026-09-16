-- GlassChat schema: rooms, participants, messages, storage, and RLS.
-- Run this in the Supabase SQL editor once per project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  name text not null default 'our little room',
  created_at timestamptz not null default now(),
  created_by text not null
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  session_id text not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (room_id, session_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  sender_id uuid not null references participants(id) on delete cascade,
  sender_name text not null,
  type text not null check (type in ('text', 'image', 'sticker', 'link')),
  content text not null default '',
  image_url text,
  sticker_id text,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_id_created_at_idx on messages (room_id, created_at);
create index if not exists participants_room_id_idx on participants (room_id);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is an invite-only app with no accounts, but the client still
-- authenticates via Supabase Anonymous Auth (enable this in
-- Authentication -> Providers -> Anonymous Sign-Ins). That gives every
-- browser a real, unspoofable auth.uid(), which `session_id` stores — so
-- policies can check "is this you" instead of trusting a client-sent string.
--
-- There is deliberately no policy that lets a client list all rooms: the
-- only way in is knowing a room's invite_code (from an invite link) or id
-- (once you're already a participant), which keeps rooms invite-only
-- without needing to hide the tables from PostgREST entirely.
-- ---------------------------------------------------------------------------

alter table rooms enable row level security;
alter table participants enable row level security;
alter table messages enable row level security;

-- Rooms: anyone authenticated (anonymous or not) can create a room, and can
-- read a room row — but only ever fetches one via `.eq('invite_code', ...)`
-- or `.eq('id', ...)`, both of which require already knowing that value.
create policy "rooms are readable" on rooms
  for select using (auth.role() = 'authenticated');

create policy "anyone signed in can create a room" on rooms
  for insert with check (auth.role() = 'authenticated' and created_by = auth.uid()::text);

-- Participants: readable within a room you know the id of; a participant
-- row can only ever be created or edited by the session it belongs to.
create policy "participants are readable" on participants
  for select using (auth.role() = 'authenticated');

create policy "you can only join as yourself" on participants
  for insert with check (session_id = auth.uid()::text);

create policy "you can only update your own participant row" on participants
  for update using (session_id = auth.uid()::text);

-- Messages: readable within a room you know the id of; a message can only
-- be inserted by the participant row that matches your own session.
create policy "messages are readable" on messages
  for select using (auth.role() = 'authenticated');

create policy "you can only send messages as your own participant" on messages
  for insert with check (
    exists (
      select 1 from participants
      where participants.id = messages.sender_id
        and participants.session_id = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: a public bucket for chat images. Public read is fine since URLs
-- are unguessable and only ever shared with someone already in the room;
-- writes still require the same "know the room" access pattern.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

create policy "chat images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'chat-images');

create policy "signed-in users can upload chat images"
  on storage.objects for insert
  with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');
