import { useEffect, useState } from "react";
import { fetchArtists } from "../lib/data";
import ArtistCard from "../components/ArtistCard.jsx";

export default function Playlist() {
  const [artists, setArtists] = useState(null); // null = en cours

  useEffect(() => {
    let alive = true;
    fetchArtists()
      .then((data) => alive && setArtists(data))
      .catch(() => alive && setArtists([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <h1 className="text-white text-decoration-underline m-4 m-md-5">
        Artistes
      </h1>
      <div className="playlist">
        {artists === null && (
          <p className="text-white-50 p-3">Chargement…</p>
        )}
        {artists && artists.length === 0 && (
          <p className="text-white-50 p-3">Aucun artiste pour le moment.</p>
        )}
        {artists &&
          artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
      </div>
    </>
  );
}
