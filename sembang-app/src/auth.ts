// Accounts. Only an account made with "Create an account" can sign in; there are no built-in logins.
// With a shared sign-in configured (config.ts) accounts live in Supabase Auth, reached over its REST
// API. Without one, accounts live on this device, with the password stored only as a salted PBKDF2 hash.
import { cloud } from "./config";
import type { Role } from "./store";

export interface User { name: string; email: string; role: Role }

const ACCOUNTS = "sembang-accounts";
const SESSION = "sembang-session";
const CLOUD_SESSION = "sembang-cloud-session";
const ITER = 150_000;

const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ }
};

export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

/* ---------------- on this device ---------------- */

interface Stored extends User { salt: string; hash: string }

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  if (!crypto?.subtle) throw new Error("This browser can't keep a password safely here. Open Agilist from https:// or localhost.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITER }, key, 256);
  return b64(bits);
}

function readAccounts(): Stored[] {
  try { return JSON.parse(get(ACCOUNTS) ?? "[]") as Stored[]; } catch { return []; }
}

const pub = (a: Stored): User => ({ name: a.name, email: a.email, role: a.role });

async function localSignUp(name: string, email: string, password: string, role: Role): Promise<User> {
  const list = readAccounts();
  if (list.some((a) => a.email === email)) throw new Error("There is already an account with this email. Sign in instead.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const acc: Stored = { name, email, role, salt: b64(salt), hash: await hashPassword(password, salt) };
  set(ACCOUNTS, JSON.stringify([...list, acc]));
  set(SESSION, email);
  return pub(acc);
}

async function localSignIn(email: string, password: string): Promise<User> {
  const acc = readAccounts().find((a) => a.email === email);
  const wrong = new Error("That email and password don't match an account. Check them, or create an account.");
  if (!acc) throw wrong;
  if ((await hashPassword(password, unb64(acc.salt))) !== acc.hash) throw wrong;
  set(SESSION, email);
  return pub(acc);
}

/* ---------------- shared sign-in (Supabase Auth over REST) ---------------- */

interface CloudSession { access_token: string; refresh_token?: string; user: { email?: string; user_metadata?: { name?: string; role?: string } } }

const toUser = (s: CloudSession): User => ({
  email: normEmail(s.user.email ?? ""),
  name: s.user.user_metadata?.name || (s.user.email ?? "").split("@")[0],
  role: s.user.user_metadata?.role === "family" ? "family" : "caregiver",
});

async function call(path: string, body: unknown, bearer?: string, method = "POST"): Promise<Record<string, unknown>> {
  const c = cloud()!;
  let res: Response;
  try {
    res = await fetch(`${c.url}/auth/v1/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: c.key,
        // New-style publishable keys (sb_publishable_…) are not JWTs and go only in `apikey`.
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : c.key.startsWith("eyJ") ? { Authorization: `Bearer ${c.key}` } : {}),
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the shared sign-in. Check the internet connection.");
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = String(json.msg ?? json.error_description ?? json.message ?? "");
    if (/invalid login/i.test(msg)) throw new Error("That email and password don't match an account. Check them, or create an account.");
    if (/already registered/i.test(msg)) throw new Error("There is already an account with this email. Sign in instead.");
    if (/password/i.test(msg)) throw new Error("Choose a longer password (at least 6 characters).");
    throw new Error(msg || "Sign-in didn't work. Try again.");
  }
  return json;
}

async function cloudSignUp(name: string, email: string, password: string, role: Role): Promise<User> {
  const json = await call("signup", { email, password, data: { name, role } });
  if (!json.access_token) throw new Error("Almost there: open the email we just sent and confirm your address, then sign in.");
  set(CLOUD_SESSION, JSON.stringify(json));
  return toUser(json as unknown as CloudSession);
}

async function cloudSignIn(email: string, password: string): Promise<User> {
  const json = await call("token?grant_type=password", { email, password });
  set(CLOUD_SESSION, JSON.stringify(json));
  return toUser(json as unknown as CloudSession);
}

/* ---------------- what the screens use ---------------- */

export async function signUp(name: string, email: string, password: string, role: Role): Promise<User> {
  const e = normEmail(email);
  return cloud() ? cloudSignUp(name.trim(), e, password, role) : localSignUp(name.trim(), e, password, role);
}

export async function signIn(email: string, password: string): Promise<User> {
  const e = normEmail(email);
  return cloud() ? cloudSignIn(e, password) : localSignIn(e, password);
}

/** The person who was signed in when the app was last open, or null. */
export async function restore(): Promise<User | null> {
  if (cloud()) {
    try {
      const s = JSON.parse(get(CLOUD_SESSION) ?? "null") as CloudSession | null;
      if (!s) return null;
      try {
        const u = await call("user", undefined, s.access_token, "GET");
        return toUser({ ...s, user: u as CloudSession["user"] });
      } catch {
        if (!s.refresh_token) throw new Error("expired");
        const fresh = await call("token?grant_type=refresh_token", { refresh_token: s.refresh_token });
        set(CLOUD_SESSION, JSON.stringify(fresh));
        return toUser(fresh as unknown as CloudSession);
      }
    } catch { set(CLOUD_SESSION, null); return null; }
  }
  const email = get(SESSION);
  const acc = email ? readAccounts().find((a) => a.email === email) : undefined;
  return acc ? pub(acc) : null;
}

export function signOut() {
  set(SESSION, null);
  set(CLOUD_SESSION, null);
}

/** The signed-in person's access token for the shared album, or null when not using shared sign-in. */
export function accessToken(): string | null {
  try { return (JSON.parse(get(CLOUD_SESSION) ?? "null") as CloudSession | null)?.access_token ?? null; } catch { return null; }
}
