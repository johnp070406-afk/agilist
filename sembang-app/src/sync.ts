// The shared album. With shared sign-in on (config.ts), the family's photos and the caregivers'
// notes live in Supabase so every phone sees the same thing. Reached over PostgREST with plain
// fetch, like auth.ts. See supabase/schema.sql for the tables and the access rules (RLS).
import { accessToken, restore } from "./auth";
import { cloud } from "./config";
import type { Note, Photo } from "./data";
import type { Role } from "./store";

export interface Link { elderId: string; role: Role; joinCode: string; name: string; /** The family has paused sharing with the care team. */ paused: boolean; /** What the family calls him ("Dad", "Ah Ma"). Empty until the family sets it. */ elder: string }
export type Kind = "photos" | "notes";
export interface Row<T> { id: string; ord: number; data: T }

async function api(path: string, init: RequestInit = {}, retry = true): Promise<unknown> {
  const c = cloud();
  const token = accessToken();
  if (!c || !token) throw new Error("The shared album needs the shared sign-in.");
  let res: Response;
  try {
    res = await fetch(`${c.url}/rest/v1/${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", apikey: c.key, Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new Error("Can't reach the shared album. Check the internet connection.");
  }
  // The access token lasts about an hour: refresh it once and try again.
  if (res.status === 401 && retry && (await restore())) return api(path, init, false);
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    const msg = (json as { message?: string } | null)?.message;
    throw new Error(msg || "The shared album didn't answer. Run supabase/schema.sql in your project first.");
  }
  return json;
}

const rpc = (fn: string, args: Record<string, unknown> = {}) => api(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

type LinkRow = { elder_id: string; role: Role; join_code: string; name: string; paused?: boolean; call_name?: string };
const toLink = (r: LinkRow): Link => ({ elderId: r.elder_id, role: r.role, joinCode: r.join_code, name: r.name, paused: !!r.paused, elder: r.call_name ?? "" });

/** The album this person already belongs to, or null. */
export async function getLink(): Promise<Link | null> {
  const rows = (await rpc("my_elder")) as LinkRow[];
  return rows[0] ? toLink(rows[0]) : null;
}
/** Family: starts the album and gets a join code for the care team. */
export async function createElder(name: string): Promise<Link> {
  return toLink(((await rpc("create_elder", { p_name: name })) as LinkRow[])[0]);
}
/** Caregiver: joins with the code the family shares. */
export async function joinElder(code: string): Promise<Link> {
  const joined = toLink(((await rpc("join_elder", { p_code: code })) as LinkRow[])[0]);
  // The join answer is short; ask again for the whole picture (his name, whether sharing is paused).
  return (await getLink().catch(() => null)) ?? joined;
}

/** Family: set what he is called on every screen. The server keeps it for the whole care team. */
export async function setElderName(name: string): Promise<void> {
  try {
    await rpc("set_elder_name", { p_name: name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    throw new Error(/set_elder_name/.test(msg) ? "The server isn't ready for names yet. Run supabase/004_elder_name.sql in Supabase." : msg || "The name could not be saved. Try again.");
  }
}

/** Family: pause (true) or resume (false) sharing with the care team. The server enforces it. */
export async function setSharing(paused: boolean): Promise<void> {
  try {
    await rpc("set_sharing", { p_paused: paused });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    throw new Error(/set_sharing/.test(msg) ? "The server isn't ready for this yet. Run supabase/003_pause_sharing.sql in Supabase." : msg || "Sharing could not be changed. Try again.");
  }
}

export async function pull<T extends Photo | Note>(elderId: string, kind: Kind): Promise<Row<T>[]> {
  const rows = (await api(`${kind}?elder_id=eq.${elderId}&select=id,ord,data&order=ord.asc`)) as Row<T>[];
  return rows;
}

export async function push<T>(elderId: string, kind: Kind, rows: Row<T>[]): Promise<void> {
  if (rows.length === 0) return;
  const body = rows.map((r) => ({ elder_id: elderId, id: r.id, ord: r.ord, data: r.data, updated_at: new Date().toISOString() }));
  await api(`${kind}?on_conflict=elder_id,id`, { method: "POST", body: JSON.stringify(body), headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
}

export async function remove(elderId: string, kind: Kind, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const list = ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",");
  await api(`${kind}?elder_id=eq.${elderId}&id=in.(${list})`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}
