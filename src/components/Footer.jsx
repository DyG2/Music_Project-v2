import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="site-footer text-center text-white py-4 px-3">
      <p className="mb-2">
        &copy; {year} MusicOrchestra &middot; Projet SESAME &middot; R. Dylane
        Gimode
      </p>
      <Link to="/admin" className="footer-admin">
        <i className="fa-solid fa-lock me-1"></i> Espace admin
      </Link>
    </div>
  );
}
