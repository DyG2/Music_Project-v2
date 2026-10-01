import { useEffect, useState, useRef } from "react";
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
    <div className="text-white">
      <h1 className="m-3 m-md-4">Administration</h1>
      <div className="about-card p-4 rounded-3 mx-3" style={{ maxWidth: 640 }}>
        <h4>Supabase n'est pas encore configuré</h4>
        <p className="mb-2">
          Renseigne tes clés dans un fichier <code>.env</code> (voir{" "}
          <code>.env.example</code>), puis exécute{" "}
          <code>supabase/schema.sql</code> dans le SQL Editor de Supabase.
        </p>
        <p className="mb-0">
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

  if (!ready) return <p className="text-white-50 p-4">Chargement…</p>;

  return (
    <div className="text-white px-3 px-md-4 pb-5">
      <h1 className="my-3">Administration</h1>
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
    <form
      onSubmit={submit}
      className="about-card p-4 rounded-3"
      style={{ maxWidth: 420 }}
    >
      <h4 className="mb-3">Connexion admin</h4>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="mb-3">
        <label className="form-label">E-mail</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Mot de passe</label>
        <input
          type="password"
          className="form-control"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary w-100" type="submit">
        Se connecter
      </button>
    </form>
  );
}

function Panel({ session }) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <span className="text-white-50">Connecté : {session.user.email}</span>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => supabase.auth.signOut()}
        >
          Se déconnecter
        </button>
      </div>
      <CreateArtist />
      <ArtistList />
    </>
  );
}

const emptyTrack = () => ({ title: "", duration: "", file: null });

function CreateArtist() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tracks, setTracks] = useState([emptyTrack()]);
  const [status, setStatus] = useState(null); // {type,text}
  const [busy, setBusy] = useState(false);
  const imgRef = useRef(null);

  const setTrack = (i, patch) =>
    setTracks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

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

      const imgFile = imgRef.current?.files[0];
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
      if (imgRef.current) imgRef.current.value = "";
      window.dispatchEvent(new Event("artists-changed"));
    } catch (err) {
      setStatus({ type: "danger", text: err.message || String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="about-card p-4 rounded-3 mb-4" style={{ maxWidth: 720 }}>
      <h4 className="mb-3">Ajouter un artiste</h4>
      {status && <div className={`alert alert-${status.type} py-2`}>{status.text}</div>}
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

        <div className="mt-2">
          <label className="form-label">Image de l'artiste</label>
          <input className="form-control" type="file" accept="image/*" ref={imgRef} />
        </div>

        <hr className="text-white-50" />
        <h6>Titres</h6>
        {tracks.map((t, i) => (
          <div className="row g-2 align-items-end mb-2" key={i}>
            <div className="col-md-5">
              <input
                className="form-control"
                placeholder="Titre"
                value={t.title}
                onChange={(e) => setTrack(i, { title: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                placeholder="03:25"
                value={t.duration}
                onChange={(e) => setTrack(i, { duration: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                type="file"
                accept="audio/*"
                onChange={(e) => setTrack(i, { file: e.target.files[0] || null })}
              />
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  setTracks((ts) =>
                    ts.length > 1 ? ts.filter((_, j) => j !== i) : ts
                  )
                }
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline-light btn-sm mt-2"
          onClick={() => setTracks((ts) => [...ts, emptyTrack()])}
        >
          <i className="fa-solid fa-plus"></i> Ajouter un titre
        </button>

        <div className="mt-3">
          <button className="btn btn-success" type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer l'artiste"}
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
      <h4 className="mb-3">Artistes existants</h4>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {artists === null && <p className="text-white-50">Chargement…</p>}
      {artists && artists.length === 0 && (
        <p className="text-white-50">Aucun artiste.</p>
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
                    className="btn btn-sm btn-outline-light"
                    to={`/artist/${encodeURIComponent(a.id)}`}
                  >
                    voir
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => delArtist(a.id)}
                  >
                    supprimer l'artiste
                  </button>
                </div>
              </div>
              <ul className="list-unstyled mt-2 mb-0 small">
                {list.length === 0 && (
                  <li className="text-white-50">aucun titre</li>
                )}
                {list.map((t) => (
                  <li
                    key={t.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{t.title}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => delTrack(t.id)}
                    >
                      supprimer
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
