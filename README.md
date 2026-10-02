# MusicOrchestra — Projet SESAME

Application musicale en **React + Vite**, données **dynamiques via Supabase**
(base + Auth + Storage), déployée sur **Vercel**. Les artistes et musiques sont
administrables depuis une page d'admin (upload des fichiers inclus) et partagés
entre tous les visiteurs.

> _« Ce n'est qu'en changeant l'éducation qu'on pourra changer le monde. »_

---

## Stack

- **React 18** + **React Router** (SPA)
- **Vite** (dev server + build)
- **Bootstrap 5** + Font Awesome
- **Supabase** (PostgreSQL + Auth + Storage)
- **Vercel** (hébergement)

---

## Structure

```
index.html                 → point d'entrée Vite
vite.config.js
vercel.json                → rewrites SPA
.env.example               → modèle de configuration Supabase
public/assets/             → images, mp3, polices (servis à la racine : /assets/…)
src/
  main.jsx                 → montage React + imports CSS
  App.jsx                  → routes
  components/
    Layout.jsx  Navbar.jsx  Footer.jsx
    ArtistCard.jsx  Player.jsx   ← lecteur audio
  pages/
    Home.jsx  Playlist.jsx  Artist.jsx  About.jsx  Admin.jsx
  lib/
    supabase.js            → client Supabase (ou null si non configuré)
    data.js                → fetchArtists / fetchArtist (+ repli local)
  data/artists.local.js    → données de secours (si pas de Supabase)
  styles/ index.css style.css
supabase/migrations/       → schéma, rôles, sécurité, bucket (appliqué par `npm run db:push`)
supabase/seed.sql          → données de départ (optionnel)
```

### Routes

| URL             | Page                         |
| --------------- | ---------------------------- |
| `/`             | Accueil                      |
| `/playlist`     | Liste des artistes           |
| `/artist/:id`   | Page d'un artiste + lecteur  |
| `/about`        | À propos du développeur      |
| `/admin`        | Administration (connexion)   |

---

## Démarrer en local

```bash
npm install
npm run dev        # http://localhost:5173
```

Sans fichier `.env`, le site fonctionne avec les **données locales de secours**
(`src/data/artists.local.js`). Dès que tu ajoutes tes clés Supabase, il bascule
automatiquement sur la base.

Autres commandes : `npm run build` (production → `dist/`), `npm run preview`.

---

## Configuration Supabase (une seule fois)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans un terminal, à la racine du projet :
   ```bash
   npx supabase login        # une seule fois
   npm run db:link           # demande le mot de passe de la base
   npm run db:push           # tables, rôles, sécurité RLS, bucket `media`
   ```
   Un changement de base = un nouveau fichier dans `supabase/migrations/`, puis
   `npm run db:push`. (Optionnel : colle `supabase/seed.sql` dans le SQL Editor
   pour les 5 artistes de départ.)
3. **Project Settings → API** : copie `Project URL` et la clé `anon` / `public`.
4. Crée un fichier `.env` à la racine (copie de `.env.example`) :
   ```
   VITE_SUPABASE_URL=https://ton-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=ta_cle_anon_publique
   ```
5. **Authentication → Users → Add user** : crée ton compte admin (e-mail + mot
   de passe) pour te connecter sur `/admin`.

> La clé `anon` est publique (incluse dans le build front) : c'est normal. La
> sécurité vient des règles RLS — lecture pour tous, écriture réservée à l'admin
> connecté.

---

## Administration (`/admin`)

Connecte-toi avec ton compte admin, puis :

- **Ajouter un artiste** : nom, identifiant (auto), image, et autant de titres
  que voulu (titre + durée optionnelle + `.mp3`). Les fichiers sont envoyés dans
  Supabase Storage.
- **Supprimer** un artiste ou un titre depuis la liste.

---

## Déploiement (Vercel)

1. `git push` vers GitHub.
2. [vercel.com](https://vercel.com) → **Add New… → Project** → importe le dépôt.
   Vercel détecte Vite automatiquement (`npm run build`, sortie `dist/`).
3. **Settings → Environment Variables** : ajoute `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Chaque push redéploie le site automatiquement.
