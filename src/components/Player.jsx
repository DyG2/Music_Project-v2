import { useEffect, useRef, useState } from "react";

function fmt(sec) {
  if (!isFinite(sec)) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Player({ artist }) {
  const tracks = artist.tracks;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [durations, setDurations] = useState(() =>
    tracks.map((t) => t.duration || "")
  );
  const audioRef = useRef(null);

  // Joue / met en pause selon l'etat.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, current]);

  // Remplit les durees manquantes depuis les metadonnees audio.
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
          if (d[i]) return d; // on garde la valeur fournie si elle existe
          const next = [...d];
          next[i] = value;
          return next;
        });
      });
    });
  }, [tracks]);

  const playIndex = (i) => {
    setCurrent(i);
    setPlaying(true);
  };
  const toggle = () => setPlaying((p) => !p);
  const prev = () => (current > 0 ? playIndex(current - 1) : setPlaying(false));
  const next = () =>
    current < tracks.length - 1 ? playIndex(current + 1) : setPlaying(false);

  return (
    <div className="row justify-content-between g-4">
      <div className="col-md-4">
        <div className="artist text-center">
          <div className="artist__img">
            <img src={artist.img} alt={artist.name} />
          </div>
          <h1 className="text-bolder text-white text-center mt-2">
            {artist.name}
          </h1>

          <audio
            ref={audioRef}
            src={tracks[current]?.src}
            preload="metadata"
            onEnded={next}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <div className="my-2 bg-black rounded-2 player-option">
            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn text-white"
                onClick={prev}
                aria-label="Précédent"
              >
                <i className="fa-solid fa-backward"></i>
              </button>
              <button
                className="btn text-white"
                onClick={toggle}
                aria-label="Lecture / pause"
              >
                <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`}></i>
              </button>
              <button
                className="btn text-white"
                onClick={next}
                aria-label="Suivant"
              >
                <i className="fa-solid fa-forward"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-8">
        <table className="table table-striped table-hover w-100 rounded overflow-hidden align-middle">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Titre</th>
              <th scope="col">Temps</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t, i) => {
              const isCurrent = i === current && playing;
              return (
                <tr
                  key={i}
                  className={"track-row" + (isCurrent ? " is-playing" : "")}
                  role="button"
                  tabIndex={0}
                  onClick={() => playIndex(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      playIndex(i);
                    }
                  }}
                >
                  <th scope="row">{i + 1}</th>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      <div>{t.title}</div>
                      {isCurrent && (
                        <div className="sound-track">
                          <img src="/assets/img/sound-track.gif" alt="En lecture" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{durations[i] || "––:––"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
