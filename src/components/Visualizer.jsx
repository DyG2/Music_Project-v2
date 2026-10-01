import { useEffect, useRef } from "react";

// Dessine un spectre de fréquences réactif en arrière-plan de la barre de
// lecture, à partir de l'AnalyserNode du contexte. Discret (faible opacité),
// teinté par la couleur de l'artiste. Ne fait rien si l'analyseur est absent
// (ex. audio cross-origin sans CORS).
export default function Visualizer({ analyserRef, playing, color = "29,185,84" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    if (!analyser || !playing) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      return () => window.removeEventListener("resize", resize);
    }

    const bins = analyser.frequencyBinCount; // 32 pour fftSize 64
    const data = new Uint8Array(bins);
    const bars = 24;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * bins)] / 255;
        const bh = Math.max(2, v * h);
        const x = i * (bw + gap);
        const grad = ctx.createLinearGradient(0, h, 0, h - bh);
        grad.addColorStop(0, `rgba(${color}, 0.02)`);
        grad.addColorStop(1, `rgba(${color}, 0.5)`);
        ctx.fillStyle = grad;
        const r = Math.min(bw / 2, 3);
        roundRect(ctx, x, h - bh, bw, bh, r);
        ctx.fill();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [analyserRef, playing, color]);

  return <canvas ref={canvasRef} className="pb-visualizer" aria-hidden="true" />;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
