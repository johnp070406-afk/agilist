// Shared sign-in and album. Both values are public by design (a publishable key, never a secret or service key). Empty both to keep accounts on one device only.
// The same two values can be pasted in the app ("Connect shared sign-in" on the sign-in screen);
// they are then kept in this browser. The anon key is public by design; never put a service key here.
export const SUPABASE_URL: string = "https://mxfiiuybyahqpvbuvyuf.supabase.co";
export const SUPABASE_ANON_KEY: string = "sb_publishable_jMhe7i7pLiNJ-0t2oUXqMA_GAzp03DV";

const KEY = "sembang-supabase";

export interface Cloud { url: string; key: string }

export function cloud(): Cloud | null {
  // A project chosen on this device ("Connect shared sign-in") wins over the built-in one.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw) as Cloud;
      if (c.url && c.key) return { url: c.url.replace(/\/+$/, ""), key: c.key };
    }
  } catch { /* storage blocked or not JSON */ }
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return { url: SUPABASE_URL.replace(/\/+$/, ""), key: SUPABASE_ANON_KEY };
  return null;
}

export function saveCloud(c: Cloud | null) {
  try {
    if (c) localStorage.setItem(KEY, JSON.stringify(c));
    else localStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
}
