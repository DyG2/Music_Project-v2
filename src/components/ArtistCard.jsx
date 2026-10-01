import { useNavigate } from "react-router-dom";

export default function ArtistCard({ artist }) {
  const navigate = useNavigate();
  const count = artist.tracks.length;
  const label = count > 1 ? `${count} titres` : `${count} titre`;
  const to = `/artist/${encodeURIComponent(artist.id)}`;

  const open = () => navigate(to);

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="card__img">
        <img src={artist.img} alt={artist.name} loading="lazy" />
        <button
          className="card__play"
          aria-label={`Écouter ${artist.name}`}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          <i className="fa-solid fa-play"></i>
        </button>
      </div>
      <div className="card__desc">
        <h3 className="card__name">{artist.name}</h3>
        <p className="card__count mb-0">{label}</p>
      </div>
    </div>
  );
}
