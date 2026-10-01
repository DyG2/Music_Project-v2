import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import PlayerBar from "./PlayerBar.jsx";
import { PlayerProvider } from "../context/PlayerContext.jsx";

export default function Layout() {
  const location = useLocation();
  return (
    <PlayerProvider>
      <div className="bg"></div>
      <div className="page-content">
        <header>
          <Navbar />
        </header>
        <main>
          <div key={location.pathname} className="route-fade">
            <Outlet />
          </div>
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
      <PlayerBar />
    </PlayerProvider>
  );
}
