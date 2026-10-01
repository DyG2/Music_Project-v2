import { Link } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext.jsx";
import { fmt } from "../lib/time";
import Visualizer from "./Visualizer.jsx";

export default function PlayerBar() {
  const p = usePlayer();
  if (!p.hasTrack) return null;

  const color = p.meta?.color || "29, 185, 84";

  const ratio = p.dur > 0 ? p.time / p.dur : 0;
  const pct = `${(ratio * 100).toFixed(2)}%`;

  const seekFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    p.seek((e.clientX - rect.left) / rect.width);
  };

  const volIcon = p.muted || p.volume === 0
    ? "fa-volume-xmark"
    : p.volume < 0.5
    ? "fa-volume-low"
    : "fa-volume-high";

  const repeatTitle =
    p.repeat === "one" ? "Répéter : un titre"
    : p.repeat === "all" ? "Répéter : toute la file"
    : "Répéter : désactivé";

  return (
    <div
      className="playerbar"
      role="region"
      aria-label="Lecteur audio"
      style={{ "--artist-rgb": color }}
    >
      <Visualizer
        analyserRef={p.analyserRef}
        playing={p.playing}
        color={color}
      />

      {/* Infos piste */}
      <div className="pb-track">
        <Link
          to={p.meta ? `/artist/${encodeURIComponent(p.meta.artistId)}` : "#"}
          className={"pb-cover" + (p.playing ? " is-playing" : "")}
          aria-label="Ouvrir l'artiste"
        >
          {p.meta?.artistImg && <img src={p.meta.artistImg} alt="" />}
        </Link>
        <div className="pb-track-text">
          <div className="pb-title">{p.current?.title}</div>
          <div className="pb-artist">{p.meta?.artistName}</div>
        </div>
      </div>

      {/* Contrôles + progression */}
      <div className="pb-center">
        <div className="pb-controls">
          <button
            className={"pb-btn" + (p.shuffle ? " on" : "")}
            onClick={p.toggleShuffle}
            aria-label="Lecture aléatoire"
            aria-pressed={p.shuffle}
            title="Lecture aléatoire"
          >
            <i className="fa-solid fa-shuffle"></i>
          </button>
          <button className="pb-btn" onClick={p.prev} aria-label="Précédent">
            <i className="fa-solid fa-backward-step"></i>
          </button>
          <button
            className="pb-btn pb-play"
            onClick={p.toggle}
            aria-label={p.playing ? "Pause" : "Lecture"}
          >
            <i className={`fa-solid ${p.playing ? "fa-pause" : "fa-play"}`}></i>
          </button>
          <button className="pb-btn" onClick={p.next} aria-label="Suivant">
            <i className="fa-solid fa-forward-step"></i>
          </button>
          <button
            className={"pb-btn" + (p.repeat !== "off" ? " on" : "")}
            onClick={p.cycleRepeat}
            aria-label={repeatTitle}
            title={repeatTitle}
          >
            <i className="fa-solid fa-repeat"></i>
            {p.repeat === "one" && <span className="pb-repeat-one">1</span>}
          </button>
        </div>

        <div className="pb-progress">
          <span className="pb-time">{fmt(p.time) || "00:00"}</span>
          <div
            className="progress-bar-track"
            style={{ "--knob": pct }}
            onClick={seekFromEvent}
            role="slider"
            aria-label="Progression"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") p.seek(ratio + 0.03);
              if (e.key === "ArrowLeft") p.seek(ratio - 0.03);
            }}
          >
            <div className="progress-bar-fill" style={{ width: pct }} />
          </div>
          <span className="pb-time">{fmt(p.dur) || "––:––"}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="pb-volume">
        <button className="pb-btn" onClick={p.toggleMute} aria-label="Muet">
          <i className={`fa-solid ${volIcon}`}></i>
        </button>
        <input
          className="pb-vol-range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={p.muted ? 0 : p.volume}
          onChange={(e) => p.changeVolume(Number(e.target.value))}
          aria-label="Volume"
          style={{ "--vol": `${(p.muted ? 0 : p.volume) * 100}%` }}
        />
      </div>
    </div>
  );
}
