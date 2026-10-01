// Extrait une couleur dominante "agréable" d'une image.
// Renvoie une Promise résolue en [r, g, b] (ou l'accent par défaut).

const ACCENT = [29, 185, 84];
const cache = new Map();

export function getDominantColor(src) {
  if (!src) return Promise.resolve(ACCENT);
  if (cache.has(src)) return Promise.resolve(cache.get(src));

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onload = () => {
      try {
        const size = 28;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // Regroupe les couleurs par "bucket" grossier, en privilégiant
        // les teintes saturées et ni trop sombres ni trop claires.
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 125) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = (r + g + b) / 3;
          if (lum < 24 || lum > 232) continue; // ignore quasi noir/blanc
          const weight = 1 + sat * 3; // favorise les couleurs vives
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          const cur = buckets.get(key) || { r: 0, g: 0, b: 0, w: 0 };
          cur.r += r * weight;
          cur.g += g * weight;
          cur.b += b * weight;
          cur.w += weight;
          buckets.set(key, cur);
        }

        let best = null;
        for (const v of buckets.values()) {
          if (!best || v.w > best.w) best = v;
        }
        if (!best) {
          cache.set(src, ACCENT);
          return resolve(ACCENT);
        }
        let rgb = [
          Math.round(best.r / best.w),
          Math.round(best.g / best.w),
          Math.round(best.b / best.w),
        ];
        rgb = liven(rgb);
        cache.set(src, rgb);
        resolve(rgb);
      } catch {
        cache.set(src, ACCENT); // canvas "tainted" (CORS) : on retombe sur l'accent
        resolve(ACCENT);
      }
    };

    img.onerror = () => resolve(ACCENT);
    img.src = src;
  });
}

// Rehausse légèrement une couleur terne pour qu'elle "parle" sur fond sombre.
function liven([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.18) return ACCENT; // couleur trop grise : accent par défaut
  const lum = (r + g + b) / 3;
  if (lum < 60) {
    const f = 60 / Math.max(lum, 1);
    return [Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f)].map(
      Math.round
    );
  }
  return [r, g, b];
}

export const rgbStr = (rgb) => `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
