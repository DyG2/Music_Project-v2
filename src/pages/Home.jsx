import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="explorer">
      <div className="row align-items-center">
        <div className="col-md-6 order-2 order-md-1">
          <h1 className="text-lg text-bolder text-white">
            «&nbsp;Découvrez, écoutez, vibrez.&nbsp;»
          </h1>
          <p className="text-white-50">
            Les playlists du Programme SESAME, rien que pour vous.
          </p>
          <div>
            <Link className="btn btn-success btn-lg" to="/playlist">
              <i className="fa-solid fa-play me-1"></i> Voir les playlists
            </Link>
          </div>
        </div>
        <div className="col-md-6 order-1 order-md-2 mb-3 mb-md-0">
          <div className="avatar">
            <img src="/assets/img/music.jpg" alt="Illustration musicale" />
          </div>
        </div>
      </div>
    </section>
  );
}
