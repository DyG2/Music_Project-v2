import { Link } from "react-router-dom";

export default function ArtistCard({ artist }) {
  const count = artist.tracks.length;
  const label = count > 1 ? `${count} titres` : `${count} titre`;

  return (
    <div className="card">
      <div className="card__img">
        <img src={artist.img} alt={artist.name} loading="lazy" />
      </div>
      <div className="card__desc">
        <h3 className="text-center card__name">{artist.name}</h3>
        <p className="text-center text-white-50 small mb-2">{label}</p>
        <Link
          to={`/artist/${encodeURIComponent(artist.id)}`}
          className="w-100 btn btn-primary text-center"
        >
          Voir
        </Link>
      </div>
    </div>
  );
}
