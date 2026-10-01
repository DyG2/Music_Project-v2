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
      <CreateArtist />
      <ArtistList />
    </>
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
      .select("id,name,position,tracks(id,title,position)")
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
