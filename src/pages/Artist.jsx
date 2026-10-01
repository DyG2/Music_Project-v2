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
    if (artist) document.title = `${artist.name} – Hira'Alefako`;
    return () => {
      document.title = "Hira'Alefako";
    };
  }, [artist]);

  return (
    <div className="text-white">
      <div className="row justify-content-end my-3">
        <div className="col-auto">
          <Link to="/playlist" className="btn btn-primary">
            <i className="fa-solid fa-arrow-left me-1"></i> Retour
          </Link>
        </div>
      </div>

      {artist === undefined && <p className="text-white-50">Chargement…</p>}

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
