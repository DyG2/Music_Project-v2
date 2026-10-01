import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vrai seulement si les deux variables sont renseignees (fichier .env).
export const configured = Boolean(url && anonKey);

// Client Supabase, ou null si non configure (le site utilise alors
// les donnees locales de secours).
export const supabase = configured ? createClient(url, anonKey) : null;
