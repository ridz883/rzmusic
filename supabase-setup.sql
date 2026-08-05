-- ============================================================
-- RZmusic — Setup Database Supabase
-- Jalankan seluruh file ini di: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) TABEL PROFIL (pengganti koleksi "users" di Firestore)
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  email            text,
  photo_url        text,
  custom_photo_url text,
  created_at       timestamptz default now(),
  last_login       timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 2) TABEL DATA USER: favorit, riwayat, playlist (pengganti koleksi "userdata")
create table if not exists public.user_data (
  id          uuid primary key references auth.users(id) on delete cascade,
  favorites   jsonb default '[]'::jsonb,
  history     jsonb default '[]'::jsonb,
  playlists   jsonb default '[]'::jsonb,
  updated_at  timestamptz default now()
);

alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = id);

-- 3) STORAGE BUCKET untuk foto profil (pengganti Firebase Storage)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_user_upload" on storage.objects;
create policy "avatars_user_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
