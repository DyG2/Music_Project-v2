import { supabase, configured } from "./supabase";
import localArtists from "../data/artists.local";

/**
 * Transforme un chemin stocke en URL utilisable.
 * - URL http(s) (Supabase Storage) : telle quelle.
 * - Chemin relatif (donnees locales / seed) : servi depuis la racine (/assets/...).
 */
export function resolveUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return "/" + String(u).replace(/^\/+/, "");
}

const SELECT =
  "id,name,img_url,position,tracks(id,title,duration,audio_url,img_url,position)";

function mapFromSupabase(a) {
  const tracks = (a.tracks || [])
    .slice()
    .sort((x, y) => (x.position || 0) - (y.position || 0))
    .map((t) => ({
      title: t.title,
      duration: t.duration || "",
      src: resolveUrl(t.audio_url),
      img: resolveUrl(t.img_url),
    }));
  // Sans photo d'artiste, on reprend celle de la première chanson illustrée.
  const img = resolveUrl(a.img_url) || tracks.find((t) => t.img)?.img || "";
  return { id: a.id, name: a.name, img, tracks };
}

function mapFromLocal(a) {
  return {
    id: a.id,
    name: a.name,
    img: resolveUrl(a.img),
    tracks: (a.tracks || []).map((t) => ({
      title: t.title,
      duration: t.duration || "",
      src: resolveUrl(t.src),
    })),
  };
}

export async function fetchArtists() {
  if (!configured) return localArtists.map(mapFromLocal);
  const { data, error } = await supabase
    .from("artists")
    .select(SELECT)
    .order("position");
  if (error) {
    console.error("Supabase fetchArtists:", error.message);
    return localArtists.map(mapFromLocal);
  }
  return data.map(mapFromSupabase);
}

export async function fetchArtist(id) {
  if (!configured) {
    const a = localArtists.find((x) => x.id === id);
    return a ? mapFromLocal(a) : null;
  }
  const { data, error } = await supabase
    .from("artists")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Supabase fetchArtist:", error.message);
    const a = localArtists.find((x) => x.id === id);
    return a ? mapFromLocal(a) : null;
  }
  return data ? mapFromSupabase(data) : null;
}
