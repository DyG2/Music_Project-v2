import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const BRAND = "Hira'Alefako";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <nav className="navbar--custom shadow-sm navbar navbar-expand-lg bg-body-tertiary font-title">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={close}>
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
                Accueil
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/playlist" className={linkClass} onClick={close}>
                Playlists
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className={linkClass} onClick={close}>
                À propos du développeur
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
