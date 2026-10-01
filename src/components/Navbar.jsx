import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext.jsx";
import Equalizer from "./Equalizer.jsx";

const BRAND = "Hira'Alefako";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const p = usePlayer();
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(100, (y / h) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <nav
      className={
        "navbar--custom shadow-sm navbar navbar-expand-lg font-title" +
        (scrolled ? " is-scrolled" : "")
      }
    >
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={close}>
          <span className="brand-dot">
            <i className="fa-solid fa-music"></i>
          </span>
          {BRAND}
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Basculer la navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={"collapse navbar-collapse" + (open ? " show" : "")}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" end className={linkClass} onClick={close}>
                <i className="fa-solid fa-house"></i>
                <span>Accueil</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/playlist" className={linkClass} onClick={close}>
                <i className="fa-solid fa-headphones"></i>
                <span>Playlists</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className={linkClass} onClick={close}>
                <i className="fa-solid fa-circle-info"></i>
                <span>À propos</span>
              </NavLink>
            </li>
          </ul>

          {p.hasTrack && p.meta && (
            <Link
              to={`/artist/${encodeURIComponent(p.meta.artistId)}`}
              className="nav-now"
              onClick={close}
              style={{ "--artist-rgb": p.meta.color || "29, 185, 84" }}
            >
              <span className="nav-now__cover">
                {p.meta.artistImg && <img src={p.meta.artistImg} alt="" />}
              </span>
              <span className="nav-now__text">
                <span className="nav-now__title">{p.current?.title}</span>
                <span className="nav-now__artist">{p.meta.artistName}</span>
              </span>
              <Equalizer playing={p.playing} />
            </Link>
          )}

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              "nav-admin ms-lg-3" + (isActive ? " active" : "")
            }
            onClick={close}
          >
            <i className="fa-solid fa-lock"></i>
            <span>Connexion</span>
          </NavLink>
        </div>
      </div>

      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }}></span>
      </div>
    </nav>
  );
}
