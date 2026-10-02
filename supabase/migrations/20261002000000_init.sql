-- ============================================================
--  MusicOrchestra — Schema Supabase
--  Appliquee par : npm run db:push   (npx supabase db push)
-- ============================================================

-- ----- Tables -------------------------------------------------

create table if not exists public.artists (
  id          text primary key,          -- slug utilise dans l'URL (ex : 'jacque')
  name        text not null,
  img_url     text,                       -- URL publique (Storage) ou chemin relatif
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  artist_id   text not null references public.artists(id) on delete cascade,
  title       text not null,
  duration    text,                       -- "03:25" ou null (calcule cote client)
  audio_url   text not null,              -- URL publique (Storage) ou chemin relatif
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Photo propre a chaque chanson (a executer aussi si la table existe deja).
alter table public.tracks add column if not exists img_url text;

create index if not exists tracks_artist_idx on public.tracks (artist_id);

-- ----- Securite (RLS) ----------------------------------------
-- Lecture publique pour tout le monde ; ecriture reservee aux
-- utilisateurs connectes (compte admin cree dans Supabase Auth).

alter table public.artists enable row level security;
alter table public.tracks  enable row level security;

-- Roles : 'admin' (tout) et 'editor' (ajoute / modifie, ne supprime pas).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        text not null default 'editor' check (role in ('admin', 'editor')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;
create or replace function public.can_edit()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('admin', 'editor'), false)
$$;

-- Tout nouveau compte (cree dans Authentication > Users) devient 'editor'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes deja existants : admin (c'est toi). Peut etre relance sans risque.
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users
on conflict (id) do nothing;

drop policy if exists "profiles_read"   on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_read"   on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_delete" on public.profiles for delete to authenticated using (public.is_admin());

drop policy if exists "artists_read"   on public.artists;
drop policy if exists "artists_write"  on public.artists;
drop policy if exists "artists_insert" on public.artists;
drop policy if exists "artists_update" on public.artists;
drop policy if exists "artists_delete" on public.artists;
create policy "artists_read"   on public.artists for select using (true);
create policy "artists_insert" on public.artists for insert to authenticated with check (public.can_edit());
create policy "artists_update" on public.artists for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "artists_delete" on public.artists for delete to authenticated using (public.is_admin());

drop policy if exists "tracks_read"   on public.tracks;
drop policy if exists "tracks_write"  on public.tracks;
drop policy if exists "tracks_insert" on public.tracks;
drop policy if exists "tracks_update" on public.tracks;
drop policy if exists "tracks_delete" on public.tracks;
create policy "tracks_read"   on public.tracks for select using (true);
create policy "tracks_insert" on public.tracks for insert to authenticated with check (public.can_edit());
create policy "tracks_update" on public.tracks for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "tracks_delete" on public.tracks for delete to authenticated using (public.is_admin());

-- ----- Storage (fichiers images + audio) ---------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_read"   on storage.objects;
drop policy if exists "media_insert" on storage.objects;
drop policy if exists "media_update" on storage.objects;
drop policy if exists "media_delete" on storage.objects;

create policy "media_read"   on storage.objects for select using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.can_edit());
create policy "media_update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.can_edit());
create policy "media_delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

