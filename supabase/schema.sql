-- ============================================================
--  Hira'Alefako — Schema Supabase
--  A executer dans : Supabase Dashboard > SQL Editor > New query
--  (copier-coller tout, puis RUN)
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

create index if not exists tracks_artist_idx on public.tracks (artist_id);

-- ----- Securite (RLS) ----------------------------------------
-- Lecture publique pour tout le monde ; ecriture reservee aux
-- utilisateurs connectes (compte admin cree dans Supabase Auth).

alter table public.artists enable row level security;
alter table public.tracks  enable row level security;

drop policy if exists "artists_read"  on public.artists;
drop policy if exists "artists_write" on public.artists;
create policy "artists_read"  on public.artists for select using (true);
create policy "artists_write" on public.artists for all to authenticated using (true) with check (true);

drop policy if exists "tracks_read"  on public.tracks;
drop policy if exists "tracks_write" on public.tracks;
create policy "tracks_read"  on public.tracks for select using (true);
create policy "tracks_write" on public.tracks for all to authenticated using (true) with check (true);

-- ----- Storage (fichiers images + audio) ---------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_read"   on storage.objects;
drop policy if exists "media_insert" on storage.objects;
drop policy if exists "media_update" on storage.objects;
drop policy if exists "media_delete" on storage.objects;

create policy "media_read"   on storage.objects for select using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media_update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ----- Donnees de depart -------------------------------------
-- Reprend les 5 artistes existants. Les chemins sont relatifs :
-- ils pointent vers les fichiers deja presents dans le depot
-- (assets/...). Les artistes ajoutes ensuite via l'admin
-- utiliseront des URL Supabase Storage.

insert into public.artists (id, name, img_url, position) values
  ('pr',     'Le Programme SESAME',  'assets/img/pr.jpeg',     1),
  ('cd',     'Céline Dion',          'assets/img/celine.jpeg', 2),
  ('poopy',  'Poopy',                'assets/img/poopy.jpg',   3),
  ('louane', 'Louane',               'assets/img/lou.jpeg',    4),
  ('jacque', 'Jean-Jacques Goldman', 'assets/img/jjg.jpeg',    5)
on conflict (id) do nothing;

insert into public.tracks (artist_id, title, duration, audio_url, position) values
  ('pr',     'Hymne du 10ème anniversaire du Programme SESAME', '03:21', 'assets/media/music3.mp3', 1),
  ('cd',     'Hymne à l''amitié',                                null,   'assets/media/cd1.mp3',    1),
  ('poopy',  'Tena namana',                                     '04:23', 'assets/media/po.mp3',     1),
  ('louane', 'Je vole',                                         '03:25', 'assets/media/louv.mp3',   1),
  ('louane', 'Je vais t''aimer',                                '03:25', 'assets/media/loujv.mp3',  2),
  ('jacque', 'Au bout de mes rêves',                            '03:37', 'assets/media/Au bout.mp3', 1),
  ('jacque', 'Là-bas',                                          '04:53', 'assets/media/La bas.mp3',  2),
  ('jacque', 'Nos mains',                                       '03:18', 'assets/media/Nos.mp3',     3)
on conflict do nothing;
