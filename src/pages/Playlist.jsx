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
    <section className="fade-in">
      <div className="page-head d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <span className="eyebrow">
            <i className="fa-solid fa-headphones"></i> Catalogue
          </span>
          <h1 className="section-title text-white mt-3 mb-0">Artistes</h1>
        </div>
        {artists && artists.length > 0 && (
          <span className="badge-count">
            <i className="fa-solid fa-user-group"></i>
            {artists.length} {artists.length > 1 ? "artistes" : "artiste"}
          </span>
        )}
      </div>

      {artists === null && (
        <div className="playlist">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="card card--skeleton" key={i}>
              <div className="card__img skeleton"></div>
              <div className="card__desc">
                <div className="skeleton skeleton-line" style={{ width: "70%" }}></div>
                <div className="skeleton skeleton-line" style={{ width: "40%" }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {artists && artists.length === 0 && (
        <p className="text-muted-2 p-4">Aucun artiste pour le moment.</p>
      )}

      {artists && artists.length > 0 && (
        <div className="playlist">
          {artists.map((a, i) => (
            <div
              key={a.id}
              className="card-reveal"
              style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
            >
              <ArtistCard artist={a} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
