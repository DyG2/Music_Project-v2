import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchArtist } from "../lib/data";
import Player from "../components/Player.jsx";

export default function Artist() {
  const { id } = useParams();
  const [artist, setArtist] = useState(undefined); // undefined = en cours

  useEffect(() => {
    let alive = true;
    setArtist(undefined);
    fetchArtist(id)
      .then((data) => alive && setArtist(data))
      .catch(() => alive && setArtist(null));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (artist) document.title = `${artist.name} – MusicOrchestra`;
    return () => {
      document.title = "MusicOrchestra";
    };
  }, [artist]);

  return (
    <div className="text-white p-2 p-md-3">
      <div className="page-head d-flex justify-content-start my-2">
        <Link to="/playlist" className="btn btn-ghost">
          <i className="fa-solid fa-arrow-left me-2"></i> Retour aux artistes
        </Link>
      </div>

      {artist === undefined && (
        <div className="artist__panel">
          <div className="row justify-content-between g-4">
            <div className="col-lg-4">
              <div className="now-playing">
                <div className="skeleton" style={{ width: 200, height: 200, borderRadius: 16, margin: "0 auto" }}></div>
                <div className="skeleton skeleton-line mx-auto mt-3" style={{ width: "60%", height: 22 }}></div>
                <div className="skeleton skeleton-line mx-auto" style={{ width: "35%" }}></div>
              </div>
            </div>
            <div className="col-lg-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="skeleton skeleton-line" key={i} style={{ height: 40, marginBottom: 12 }}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {artist === null && (
        <div className="text-center">
          <h1 className="text-bolder">Artiste introuvable</h1>
          <Link className="btn btn-primary mt-2" to="/playlist">
            Voir les playlists
          </Link>
        </div>
      )}

      {artist && <Player artist={artist} />}
    </div>
  );
}
