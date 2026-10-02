-- Donnees de depart (optionnel) : a coller une fois dans le SQL Editor.
-- Ne pas relancer (doublons).

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
