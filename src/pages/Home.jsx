import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="explorer fade-in">
      <div className="aurora" aria-hidden="true">
        <span className="aurora__blob a1"></span>
        <span className="aurora__blob a2"></span>
        <span className="aurora__blob a3"></span>
      </div>
      <div className="notes" aria-hidden="true">
        <i className="fa-solid fa-music note n1"></i>
        <i className="fa-solid fa-music note n2"></i>
        <i className="fa-solid fa-headphones note n3"></i>
        <i className="fa-solid fa-compact-disc note n4"></i>
        <i className="fa-solid fa-music note n5"></i>
      </div>

      <div className="row align-items-center g-4 g-lg-5 position-relative">
        <div className="col-lg-6 order-2 order-lg-1 hero-copy">
          <span className="eyebrow">
            <i className="fa-solid fa-compact-disc"></i> Programme SESAME
          </span>
          <h1 className="text-lg text-bolder text-white mt-3">
            Découvrez,
            <br />
            écoutez, <span style={{ color: "var(--accent)" }}>vibrez.</span>
          </h1>
          <p className="mt-3">
            Les playlists du Programme SESAME, rassemblées en un seul endroit —
            rien que pour vous.
          </p>

          <div className="d-flex flex-wrap gap-3 mt-4">
            <Link className="btn btn-success btn-lg" to="/playlist">
              <i className="fa-solid fa-play me-2"></i> Voir les playlists
            </Link>
            <Link className="btn btn-ghost btn-lg" to="/about">
              À propos
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <b>5</b>
              <span>Artistes</span>
            </div>
            <div className="stat">
              <b>8+</b>
              <span>Titres</span>
            </div>
            <div className="stat">
              <b>100%</b>
              <span>SESAME</span>
            </div>
          </div>
        </div>

        <div className="col-lg-6 order-1 order-lg-2">
          <div className="avatar">
            <img src="/assets/img/music.jpg" alt="Illustration musicale" />
          </div>
        </div>
      </div>
    </section>
  );
}
