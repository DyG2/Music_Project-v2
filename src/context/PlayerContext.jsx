import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

const PlayerCtx = createContext(null);
export const usePlayer = () => useContext(PlayerCtx);

/** Ordre aléatoire des indices [0..n), avec `first` placé en tête si fourni. */
function shuffledOrder(n, first = null) {
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first == null ? rest : [first, ...rest];
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  // Construit le graphe Web Audio (une seule fois) pour le visualiseur.
  // Appelé sur un geste utilisateur pour respecter les règles d'autoplay.
  const ensureGraph = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        const ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.78;
        const source = ctx.createMediaElementSource(a);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {
      /* visualiseur indisponible (CORS/navigateur) : lecture normale */
    }
  }, []);

  const [queue, setQueue] = useState([]); // tableau de pistes {title, src, duration}
  const [meta, setMeta] = useState(null); // {artistId, artistName, artistImg}
  const [order, setOrder] = useState([]); // indices de `queue` dans l'ordre de lecture
  const [pos, setPos] = useState(0); // position courante dans `order`

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off"); // "off" | "all" | "one"

  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem("mo_vol");
      return v != null ? Math.min(1, Math.max(0, Number(v))) : 0.8;
    } catch {
      return 0.8;
    }
  });
  const [muted, setMuted] = useState(false);

  const index = order[pos] ?? 0;
  const current = queue[index] || null;

  /**
   * Charge une file de lecture et démarre à `start`.
   * `opts.shuffle` (optionnel) force l'état aléatoire pour cette lecture.
   */
  const playQueue = useCallback(
    (tracks, start = 0, m = null, opts = {}) => {
      if (!tracks || tracks.length === 0) return;
      ensureGraph();
      const sh = opts.shuffle != null ? opts.shuffle : shuffle;
      if (opts.shuffle != null) setShuffle(opts.shuffle);
      setQueue(tracks);
      setMeta(m);
      if (sh) {
        setOrder(shuffledOrder(tracks.length, start));
        setPos(0);
      } else {
        setOrder(tracks.map((_, i) => i));
        setPos(start);
      }
      setPlaying(true);
    },
    [shuffle, ensureGraph]
  );

  const toggle = useCallback(() => {
    if (current) {
      ensureGraph();
      setPlaying((p) => !p);
    }
  }, [current, ensureGraph]);

  const goNext = useCallback(
    (auto = false) => {
      if (pos < order.length - 1) setPos(pos + 1);
      else if (repeat === "all") setPos(0);
      else if (auto) setPlaying(false);
    },
    [pos, order.length, repeat]
  );

  const goPrev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    if (pos > 0) setPos(pos - 1);
    else if (a) a.currentTime = 0;
  }, [pos]);

  const seek = useCallback(
    (ratio) => {
      const a = audioRef.current;
      if (!a || !isFinite(a.duration)) return;
      a.currentTime = Math.min(1, Math.max(0, ratio)) * a.duration;
    },
    []
  );

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const ns = !s;
      if (queue.length) {
        if (ns) {
          setOrder(shuffledOrder(queue.length, index));
          setPos(0);
        } else {
          setOrder(queue.map((_, i) => i));
          setPos(index);
        }
      }
      return ns;
    });
  }, [queue, index]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const changeVolume = useCallback((v) => {
    const nv = Math.min(1, Math.max(0, v));
    setVolume(nv);
    if (nv > 0) setMuted(false);
    try {
      localStorage.setItem("mo_vol", String(nv));
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // --- Synchronisation avec l'élément <audio> ---------------------
  // Lecture / pause (et au changement de piste).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, index]);

  // Volume / muet.
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = muted ? 0 : volume;
  }, [volume, muted, index]);

  // Réserve l'espace en bas de page tant qu'une piste est chargée.
  useEffect(() => {
    document.body.classList.toggle("has-player", Boolean(current));
    return () => document.body.classList.remove("has-player");
  }, [current]);

  const onEnded = () => {
    if (repeat === "one") {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => setPlaying(false));
      }
      return;
    }
    goNext(true);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setTime(a.currentTime);
    if (isFinite(a.duration)) setDur(a.duration);
  };

  const value = {
    // état
    queue,
    meta,
    current,
    index,
    playing,
    time,
    dur,
    shuffle,
    repeat,
    volume,
    muted,
    hasTrack: Boolean(current),
    analyserRef,
    // actions
    playQueue,
    toggle,
    next: () => goNext(false),
    prev: goPrev,
    seek,
    toggleShuffle,
    cycleRepeat,
    changeVolume,
    toggleMute,
  };

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={current?.src}
        crossOrigin="anonymous"
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onTimeUpdate}
      />
    </PlayerCtx.Provider>
  );
}
