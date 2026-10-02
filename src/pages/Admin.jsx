import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase, configured } from "../lib/supabase";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function upload(file, folder) {
  const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export default function Admin() {
  if (!configured) return <NotConfigured />;
  return <AdminApp />;
}

function NotConfigured() {
  return (
    <div className="text-white auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-icon">
          <i className="fa-solid fa-database"></i>
        </div>
        <h4 className="text-center mb-3">Supabase n'est pas encore configuré</h4>
        <p className="mb-2 text-muted-2">
          Renseigne tes clés dans un fichier <code>.env</code> (voir{" "}
          <code>.env.example</code>), puis exécute{" "}
          <code>supabase/schema.sql</code> dans le SQL Editor de Supabase.
        </p>
        <p className="mb-0 text-muted-2">
          Crée ensuite ton compte admin : <em>Authentication &gt; Users &gt; Add
          user</em>.
        </p>
      </div>
    </div>
  );
}

function AdminApp() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready)
    return (
      <div className="admin-wrap text-center text-muted-2 p-5">
        <span className="loader"></span>
      </div>
    );

  return (
    <div className="admin-wrap text-white pb-5 fade-in">
      <h1 className="text-center my-4">
        <i className="fa-solid fa-sliders me-2"></i>Administration
      </h1>
      {session ? <Panel session={session} /> : <Login />}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) setErr(error.message);
  };

  return (
    <div className="auth-wrap fade-in">
      <form onSubmit={submit} className="auth-card">
        <div className="auth-icon">
          <i className="fa-solid fa-lock"></i>
        </div>
        <h4 className="text-center mb-1">Espace administrateur</h4>
        <p className="text-center text-muted-2 mb-4">
          Connecte-toi pour gérer les artistes et les titres.
        </p>
        {err && (
          <div className="alert alert-danger py-2">
            <i className="fa-solid fa-triangle-exclamation me-2"></i>
            {err}
          </div>
        )}
        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <div className="input-icon">
            <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemple.com"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="form-label">Mot de passe</label>
          <div className="input-icon">
            <i className="fa-solid fa-key"></i>
            <input
              type="password"
              className="form-control"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <button className="btn btn-primary w-100 btn-lg" type="submit">
          <i className="fa-solid fa-right-to-bracket me-2"></i>
          Se connecter
        </button>
      </form>
    </div>
  );
}

function Panel({ session }) {
  return (
    <>
      <div className="admin-session">
        <span className="admin-session__user">
          <i className="fa-solid fa-circle-user"></i>
          {session.user.email}
        </span>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => supabase.auth.signOut()}
        >
          <i className="fa-solid fa-right-from-bracket me-1"></i> Se déconnecter
        </button>
      </div>
      <BulkImport />
      <CreateArtist />
      <ArtistList />
    </>
  );
}

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Retire les parasites de titres YouTube : (Official Video), (MP3 160K)...
const cleanTitle = (s) =>
  s
    .replace(/\((?=[^)]*(official|video|audio|lyrics|mp3|clip|hd|\d+k))[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * Devine l'artiste de chaque fichier à partir de son nom.
 * 1. "Artiste - Titre" ; 2. début du nom = artiste déjà existant ;
 * 3. sinon 1er mot, étendu aux mots communs du groupe (ex : "Kaiamba Orchestra").
 */
function detectArtists(items, existing) {
  const words = (s) => s.split(/\s+/).filter(Boolean);
  const guessed = items.map((it) => {
    const raw = it.file.name.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
    // Tags ID3 : fiables seulement si l'artiste apparaît dans le nom du fichier
    // (sinon c'est souvent le nom de la chaîne YouTube : « Hira Gasy »...).
    const tagArtist = (it.tags?.artist || "").split(/,|&| ft\.? /i)[0].trim();
    if (tagArtist && norm(raw).includes(norm(tagArtist))) {
      const tTitle = (it.tags?.title || "").trim();
      const fromName = cleanTitle(
        raw.replace(/^.*?\s[-–]\s/, "").replace(new RegExp("^" + tagArtist + "\\s*", "i"), "")
      );
      return { artist: tagArtist, title: tTitle && !/\s[-–]\s/.test(tTitle) ? cleanTitle(tTitle) : fromName };
    }
    const dash = raw.split(/\s+[-–]\s+/);
    if (dash.length > 1) return { artist: dash[0].trim(), title: cleanTitle(dash.slice(1).join(" - ")) };
    const n = norm(raw);
    const known = existing
      .filter((a) => n === norm(a.name) || n.startsWith(norm(a.name) + " "))
      .sort((a, b) => b.name.length - a.name.length)[0];
    if (known) {
      const cut = words(known.name).length;
      return { artist: known.name, title: cleanTitle(words(raw).slice(cut).join(" ")) || cleanTitle(raw) };
    }
    return { artist: null, title: cleanTitle(raw), raw };
  });

  // Groupes par 1er mot, puis préfixe commun des mots (si >= 2 fichiers).
  const groups = {};
  guessed.forEach((g, i) => {
    if (g.artist) return;
    const first = norm(words(g.raw)[0] || "");
    (groups[first] ||= []).push(i);
  });
  Object.values(groups).forEach((idxs) => {
    const lists = idxs.map((i) => words(guessed[i].raw));
    let len = 1;
    if (idxs.length > 1) {
      while (
        lists.every((l) => l[len] && norm(l[len]) === norm(lists[0][len])) &&
        len < 3
      )
        len++;
    }
    idxs.forEach((i, k) => {
      const l = lists[k];
      guessed[i].artist = l.slice(0, len).join(" ");
      guessed[i].title = cleanTitle(l.slice(len).join(" ")) || guessed[i].title;
    });
  });
  return guessed;
}

const stripBom = (s) => (typeof s === "string" ? s.replace(/﻿/g, "").trim() : "");

// Lit les infos ID3 d'un mp3 : artiste, titre et pochette intégrée.
async function readTags(file) {
  try {
    const { default: jsmediatags } = await import(
      "jsmediatags/dist/jsmediatags.min.js"
    );
    const t = await new Promise((resolve, reject) =>
      jsmediatags.read(file, { onSuccess: resolve, onError: reject })
    );
    const g = t.tags || {};
    let cover = null;
    if (g.picture?.data?.length) {
      const type = g.picture.format || "image/jpeg";
      const ext = type.includes("png") ? "png" : "jpg";
      cover = new File([new Uint8Array(g.picture.data)], `${slugify(file.name)}.${ext}`, { type });
    }
    return { tags: { artist: stripBom(g.artist), title: stripBom(g.title) }, cover };
  } catch {
    return { tags: null, cover: null };
  }
}

function BulkImport() {
  const [items, setItems] = useState([]); // {file,title,artist,img}
  const [images, setImages] = useState([]); // images déposées (non associées)
  const [existing, setExisting] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    supabase
      .from("artists")
      .select("id,name")
      .then(({ data }) => data && setExisting(data));
  }, []);

  // Associe chaque image au titre dont le nom de fichier est le plus proche.
  const matchImages = (list, imgs) =>
    list.map((it) => {
      if (it.img) return it;
      const base = norm(titleFromName(it.file.name));
      const m = imgs.find((im) => {
        const ib = norm(titleFromName(im.name));
        return ib && (ib === base || base.includes(ib) || ib.includes(base));
      });
      return m ? { ...it, img: m } : it;
    });

  const addFiles = async (fileList) => {
    const files = [...fileList];
    const audios = files.filter((f) => f.type.startsWith("audio/"));
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!audios.length && !imgs.length) {
      setStatus({ type: "warning", text: "Dépose des fichiers audio ou image." });
      return;
    }
    const allImgs = [...images, ...imgs];
    setImages(allImgs);
    setStatus({ type: "info", text: "Lecture des pochettes et infos intégrées…" });
    const fresh = await Promise.all(
      audios.map(async (file) => {
        const { tags, cover } = await readTags(file);
        return { file, title: "", artist: "", img: cover, tags };
      })
    );
    const merged = [...items, ...fresh];
    const det = detectArtists(merged, existing);
    setItems(
      matchImages(
        merged.map((it, i) => ({
          ...it,
          // on garde les corrections manuelles déjà faites
          artist: it.artist || det[i].artist,
          title: it.title || det[i].title,
        })),
        allImgs
      )
    );
    setStatus({
      type: "success",
      text: `${audios.length} titre(s) ajoutés, ${
        fresh.filter((f) => f.img).length
      } pochette(s) trouvée(s) ✓`,
    });
  };

  const patch = (i, p) =>
    setItems((l) => l.map((it, j) => (j === i ? { ...it, ...p } : it)));

  const submit = async () => {
    setBusy(true);
    setStatus(null);
    try {
      if (items.some((t) => !t.title.trim() || !t.artist.trim()))
        throw new Error("Chaque titre a besoin d'un titre et d'un artiste.");

      const byArtist = new Map();
      items.forEach((t) => {
        const id = slugify(t.artist);
        if (!id) throw new Error(`Artiste invalide : « ${t.artist} »`);
        if (!byArtist.has(id)) byArtist.set(id, { name: t.artist.trim(), tracks: [] });
        byArtist.get(id).tracks.push(t);
      });

      let done = 0;
      for (const [id, group] of byArtist) {
        setStatus({ type: "info", text: `Envoi : ${group.name}…` });
        const { data: found } = await supabase
          .from("artists")
          .select("id")
          .eq("id", id)
          .maybeSingle();

        if (!found) {
          const firstImg = group.tracks.find((t) => t.img)?.img;
          const img_url = firstImg ? await upload(firstImg, "images") : null;
          const { data: maxRow } = await supabase
            .from("artists")
            .select("position")
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle();
          const { error } = await supabase.from("artists").insert({
            id,
            name: group.name,
            img_url,
            position: (maxRow?.position || 0) + 1,
          });
          if (error) throw error;
        }

        const { data: lastT } = await supabase
          .from("tracks")
          .select("position")
          .eq("artist_id", id)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();
        let pos = lastT?.position || 0;

        for (const t of group.tracks) {
          const audio_url = await upload(t.file, "audio");
          const img_url = t.img ? await upload(t.img, "images") : null;
          const { error } = await supabase.from("tracks").insert({
            artist_id: id,
            title: t.title.trim(),
            audio_url,
            img_url,
            position: ++pos,
          });
          if (error) throw error;
          setStatus({ type: "info", text: `${++done}/${items.length} titres envoyés…` });
        }
      }

      setStatus({
        type: "success",
        text: `${items.length} titre(s) classés dans ${byArtist.size} artiste(s) ✓`,
      });
      setItems([]);
      setImages([]);
      window.dispatchEvent(new Event("artists-changed"));
    } catch (err) {
      setStatus({ type: "danger", text: err.message || String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="about-card p-4 rounded-3 mb-4">
      <h4 className="mb-1">
        <i className="fa-solid fa-wand-magic-sparkles me-2"></i>Import automatique
      </h4>
      <p className="text-muted-2 mb-3">
        Dépose tous tes .mp3 (et leurs photos, avec le même nom que le titre) :
        chaque chanson est classée automatiquement dans son artiste.
      </p>
      {status && <div className={`alert alert-${status.type} py-2`}>{status.text}</div>}

      <div
        className={"dropzone" + (dragging ? " is-dragging" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,audio/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <i className="fa-solid fa-cloud-arrow-up dropzone__icon"></i>
        <div className="dropzone__text">
          <strong>Glissez-déposez vos chansons et photos</strong>
          <span>Ex : « Stromae Papaoutai.mp3 » → artiste Stromae.</span>
        </div>
      </div>

      {items.map((t, i) => (
        <div className="track-edit" key={i}>
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              {t.img ? (
                <img
                  className="track-thumb"
                  src={URL.createObjectURL(t.img)}
                  alt=""
                />
              ) : (
                <div className="track-thumb d-flex align-items-center justify-content-center text-muted-2">
                  <i className="fa-solid fa-image"></i>
                </div>
              )}
            </div>
            <div className="col-md-4 col">
              <input
                className="form-control"
                placeholder="Artiste"
                value={t.artist}
                onChange={(e) => patch(i, { artist: e.target.value })}
              />
            </div>
            <div className="col-md col-12">
              <input
                className="form-control"
                placeholder="Titre"
                value={t.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
            </div>
            <div className="col-auto">
              <label className="btn btn-ghost btn-sm mb-0" title="Photo de la chanson">
                <i className="fa-solid fa-image"></i>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => patch(i, { img: e.target.files[0] || t.img })}
                />
              </label>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                aria-label="Retirer"
                onClick={() => setItems((l) => l.filter((_, j) => j !== i))}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <button className="btn btn-success btn-lg mt-3" onClick={submit} disabled={busy}>
          {busy ? (
            <>
              <span className="loader loader--sm me-2"></span>Envoi…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk me-2"></i>Enregistrer {items.length}{" "}
              titre(s)
            </>
          )}
        </button>
      )}
    </div>
  );
}

const emptyTrack = () => ({ title: "", duration: "", file: null });

const titleFromName = (filename) =>
  filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

function CreateArtist() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tracks, setTracks] = useState([emptyTrack()]);
  const [imgFile, setImgFile] = useState(null);
  const [status, setStatus] = useState(null); // {type,text}
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef(null);

  const imgPreview = useMemo(
    () => (imgFile ? URL.createObjectURL(imgFile) : null),
    [imgFile]
  );
  useEffect(() => {
    return () => imgPreview && URL.revokeObjectURL(imgPreview);
  }, [imgPreview]);

  const setTrack = (i, patch) =>
    setTracks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  // Ajoute des fichiers déposés : les images -> pochette, les audios -> titres.
  const addFiles = (fileList) => {
    const files = [...fileList];
    const img = files.find((f) => f.type.startsWith("image/"));
    if (img) setImgFile(img);

    const audios = files.filter((f) => f.type.startsWith("audio/"));
    if (audios.length) {
      setTracks((ts) => {
        const next = [...ts];
        audios.forEach((f) => {
          const title = titleFromName(f.name);
          const emptyIdx = next.findIndex((t) => !t.file && !t.title.trim());
          if (emptyIdx >= 0) {
            next[emptyIdx] = { ...next[emptyIdx], file: f, title };
          } else {
            next.push({ title, duration: "", file: f });
          }
        });
        return next;
      });
    }

    if (!img && !audios.length) {
      setStatus({ type: "warning", text: "Dépose des fichiers audio ou image." });
    } else {
      const parts = [];
      if (audios.length)
        parts.push(`${audios.length} titre${audios.length > 1 ? "s" : ""}`);
      if (img) parts.push("pochette");
      setStatus({ type: "success", text: `Ajouté : ${parts.join(" + ")} ✓` });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const finalSlug = slugify(slug || name);
      if (!name.trim() || !finalSlug)
        throw new Error("Nom et identifiant obligatoires.");
      if (!tracks.length || tracks.some((t) => !t.title.trim() || !t.file))
        throw new Error("Chaque titre a besoin d'un nom et d'un fichier audio.");

      setStatus({ type: "info", text: "Envoi en cours…" });

      const img_url = imgFile ? await upload(imgFile, "images") : null;

      const { data: maxRow } = await supabase
        .from("artists")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      const position = (maxRow?.position || 0) + 1;

      const { error: aErr } = await supabase
        .from("artists")
        .insert({ id: finalSlug, name: name.trim(), img_url, position });
      if (aErr) throw aErr;

      for (let i = 0; i < tracks.length; i++) {
        const audio_url = await upload(tracks[i].file, "audio");
        const { error: tErr } = await supabase.from("tracks").insert({
          artist_id: finalSlug,
          title: tracks[i].title.trim(),
          duration: tracks[i].duration.trim() || null,
          audio_url,
          position: i + 1,
        });
        if (tErr) throw tErr;
      }

      setStatus({ type: "success", text: "Artiste ajouté ✓" });
      setName("");
      setSlug("");
      setTracks([emptyTrack()]);
      setImgFile(null);
      if (imgRef.current) imgRef.current.value = "";
      window.dispatchEvent(new Event("artists-changed"));
    } catch (err) {
      setStatus({ type: "danger", text: err.message || String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="about-card p-4 rounded-3 mb-4">
      <h4 className="mb-3">
        <i className="fa-solid fa-user-plus me-2"></i>Ajouter un artiste
      </h4>
      {status && (
        <div className={`alert alert-${status.type} py-2`}>{status.text}</div>
      )}
      <form onSubmit={submit}>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Nom de l'artiste</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Identifiant (URL)</label>
            <input
              className="form-control"
              value={slug}
              placeholder={name ? slugify(name) : "généré depuis le nom"}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        {/* Zone de glisser-déposer */}
        <div
          className={"dropzone mt-3" + (dragging ? " is-dragging" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => imgRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") imgRef.current?.click();
          }}
        >
          <input
            ref={imgRef}
            type="file"
            accept="image/*,audio/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {imgPreview ? (
            <img className="dropzone__preview" src={imgPreview} alt="Aperçu" />
          ) : (
            <i className="fa-solid fa-cloud-arrow-up dropzone__icon"></i>
          )}
          <div className="dropzone__text">
            <strong>Glissez-déposez vos fichiers ici</strong>
            <span>
              Déposez <b>plusieurs .mp3 d'un coup</b> : chacun devient un titre.
              Une image = la pochette. Ou cliquez pour parcourir.
            </span>
          </div>
        </div>

        <hr className="admin-divider" />
        <h6 className="mb-3">
          <i className="fa-solid fa-list-ol me-2"></i>Titres
        </h6>
        {tracks.map((t, i) => (
          <div className="track-edit" key={i}>
            <div className="row g-2 align-items-center">
              <div className="col-auto track-edit__num">{i + 1}</div>
              <div className="col">
                <input
                  className="form-control"
                  placeholder="Titre"
                  value={t.title}
                  onChange={(e) => setTrack(i, { title: e.target.value })}
                />
              </div>
              <div className="col-auto" style={{ width: 110 }}>
                <input
                  className="form-control"
                  placeholder="03:25"
                  value={t.duration}
                  onChange={(e) => setTrack(i, { duration: e.target.value })}
                />
              </div>
              <div className="col-auto">
                <label className="btn btn-ghost btn-sm mb-0">
                  <i className="fa-solid fa-file-audio me-1"></i>
                  {t.file ? "Changer" : "Fichier"}
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(e) =>
                      setTrack(i, { file: e.target.files[0] || null })
                    }
                  />
                </label>
              </div>
              <div className="col-auto">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  aria-label="Supprimer ce titre"
                  onClick={() =>
                    setTracks((ts) =>
                      ts.length > 1 ? ts.filter((_, j) => j !== i) : ts
                    )
                  }
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            {t.file && (
              <div className="track-edit__file">
                <i className="fa-solid fa-circle-check"></i> {t.file.name}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline-light btn-sm mt-2"
          onClick={() => setTracks((ts) => [...ts, emptyTrack()])}
        >
          <i className="fa-solid fa-plus me-1"></i> Ajouter un titre
        </button>

        <div className="mt-4">
          <button className="btn btn-success btn-lg" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="loader loader--sm me-2"></span>Enregistrement…
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk me-2"></i>Enregistrer
                l'artiste
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ArtistList() {
  const [artists, setArtists] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("artists")
      .select("id,name,img_url,position,tracks(id,title,img_url,position)")
      .order("position");
    if (error) setErr(error.message);
    else setArtists(data);
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("artists-changed", h);
    return () => window.removeEventListener("artists-changed", h);
  }, []);

  const delArtist = async (id) => {
    if (!confirm("Supprimer cet artiste et tous ses titres ?")) return;
    const { error } = await supabase.from("artists").delete().eq("id", id);
    if (error) setErr(error.message);
    else load();
  };
  // Change la photo d'un artiste ou d'une chanson (table : "artists" | "tracks").
  const setPhoto = async (table, id, file) => {
    if (!file) return;
    try {
      setErr("");
      const img_url = await upload(file, "images");
      const { error } = await supabase.from(table).update({ img_url }).eq("id", id);
      if (error) throw error;
      load();
    } catch (e) {
      setErr(e.message || String(e));
    }
  };
  const delTrack = async (id) => {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) setErr(error.message);
    else load();
  };

  return (
    <>
      <h4 className="mb-3">
        <i className="fa-solid fa-record-vinyl me-2"></i>Artistes existants
      </h4>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {artists === null && (
        <p className="text-muted-2 text-center">
          <span className="loader loader--sm"></span>
        </p>
      )}
      {artists && artists.length === 0 && (
        <p className="text-muted-2 text-center">Aucun artiste.</p>
      )}
      {artists &&
        artists.map((a) => {
          const list = (a.tracks || [])
            .slice()
            .sort((x, y) => (x.position || 0) - (y.position || 0));
          return (
            <div className="about-card p-3 rounded-3 mb-3" key={a.id}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <strong>{a.name}</strong>
                <div className="d-flex gap-2">
                  <label
                    className="btn btn-sm btn-ghost icon-btn mb-0"
                    title="Changer la photo de l'artiste"
                  >
                    <i className="fa-solid fa-image"></i>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setPhoto("artists", a.id, e.target.files[0])}
                    />
                  </label>
                  <Link
                    className="btn btn-sm btn-ghost icon-btn"
                    to={`/artist/${encodeURIComponent(a.id)}`}
                    aria-label="Voir l'artiste"
                    title="Voir"
                  >
                    <i className="fa-solid fa-eye"></i>
                  </Link>
                  <button
                    className="btn btn-sm btn-danger icon-btn"
                    onClick={() => delArtist(a.id)}
                    aria-label="Supprimer l'artiste"
                    title="Supprimer l'artiste"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <ul className="list-unstyled mt-3 mb-0">
                {list.length === 0 && (
                  <li className="text-muted-2 small">aucun titre</li>
                )}
                {list.map((t) => (
                  <li key={t.id} className="admin-track">
                    <span className="admin-track__title">{t.title}</span>
                    <label
                      className="btn btn-sm btn-ghost icon-btn mb-0 me-1"
                      title="Changer la photo de la chanson"
                    >
                      <i className="fa-solid fa-image"></i>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => setPhoto("tracks", t.id, e.target.files[0])}
                      />
                    </label>
                    <button
                      className="btn btn-sm btn-outline-danger icon-btn"
                      onClick={() => delTrack(t.id)}
                      aria-label="Supprimer ce titre"
                      title="Supprimer"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </>
  );
}
