import { useEffect, useState } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import { fmt } from "../lib/time";
import { getDominantColor, rgbStr } from "../lib/color";
import Equalizer from "./Equalizer.jsx";

export default function Player({ artist }) {
  const tracks = artist.tracks;
  const p = usePlayer();

  // Couleur dominante de la pochette (ambiance de la page).
  const [color, setColor] = useState("29, 185, 84");
  useEffect(() => {
    let alive = true;
    getDominantColor(artist.img).then((rgb) => alive && setColor(rgbStr(rgb)));
    return () => {
      alive = false;
    };
  }, [artist.img]);

  // Durées : valeur fournie, sinon lue dans les métadonnées audio.
  const [durations, setDurations] = useState(() =>
    tracks.map((t) => t.duration || "")
  );

  useEffect(() => {
    setDurations(tracks.map((t) => t.duration || ""));
    tracks.forEach((t, i) => {
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = t.src;
      probe.addEventListener("loadedmetadata", () => {
        const value = fmt(probe.duration);
        if (!value) return;
        setDurations((d) => {
          if (d[i]) return d;
          const next = [...d];
          next[i] = value;
          return next;
        });
      });
    });
  }, [tracks]);

  const meta = {
    artistId: artist.id,
    artistName: artist.name,
    artistImg: artist.img,
    color,
  };
  const isThisArtist = p.meta?.artistId === artist.id;

  const playFrom = (i) => {
    if (isThisArtist && p.index === i) p.toggle();
    else p.playQueue(tracks, i, meta, { shuffle: false });
  };

  return (
    <div
      className="artist__panel artist__panel--tinted fade-in"
      style={{ "--artist-rgb": color }}
    >
      <div className="row justify-content-between g-4">
        <div className="col-lg-4">
          <div className="artist text-center now-playing">
            <div className="artist__img">
              <img src={artist.img} alt={artist.name} />
            </div>

            <p className="np-label mb-0">Artiste</p>
            <h1 className="mb-1">{artist.name}</h1>
            <p className="np-track mb-3">
              {tracks.length} {tracks.length > 1 ? "titres" : "titre"}
            </p>

            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button
                className="btn btn-success"
                onClick={() => p.playQueue(tracks, 0, meta, { shuffle: false })}
              >
                <i className="fa-solid fa-play me-2"></i> Lecture
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => p.playQueue(tracks, 0, meta, { shuffle: true })}
              >
                <i className="fa-solid fa-shuffle me-2"></i> Aléatoire
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <table className="tracklist">
            <thead>
              <tr>
                <th scope="col" style={{ width: 48 }}>#</th>
                <th scope="col">Titre</th>
                <th scope="col" className="text-end">
                  <i className="fa-regular fa-clock"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t, i) => {
                const isActive = isThisArtist && p.index === i;
                const isCurrent = isActive && p.playing;
                return (
                  <tr
                    key={i}
                    className={"track-row" + (isActive ? " is-playing" : "")}
                    role="button"
                    tabIndex={0}
                    onClick={() => playFrom(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playFrom(i);
                      }
                    }}
                  >
                    <th scope="row" className="track-index">
                      <span className="num">{i + 1}</span>
                      <span className="ico">
                        <i
                          className={`fa-solid ${
                            isCurrent ? "fa-pause" : "fa-play"
                          }`}
                        ></i>
                      </span>
                    </th>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        {(t.img || artist.img) && (
                          <img
                            className="track-thumb"
                            src={t.img || artist.img}
                            alt=""
                            loading="lazy"
                          />
                        )}
                        <span className="track-title">{t.title}</span>
                        {isActive && <Equalizer playing={p.playing} />}
                      </div>
                    </td>
                    <td className="track-time">{durations[i] || "––:––"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
