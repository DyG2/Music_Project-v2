// Formate un nombre de secondes en "MM:SS" (ou null si invalide).
export function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
