// Edge Function "claude": Agilist's one door to Claude. The app sends a prompt; this adds the
// Anthropic key (kept as a Supabase secret, never in the app) and returns the text.
// Only signed-in Agilist users can call it: the function asks Supabase Auth who the caller is.
// (Turn "Verify JWT with legacy secret" off in the function's settings, as Supabase recommends.)
//
// Deploy: Supabase dashboard -> Edge Functions -> Deploy a new function -> name it "claude" and paste this file.
// Then: Edge Functions -> Secrets -> add ANTHROPIC_API_KEY.

const MODEL = "claude-haiku-5-5";
const MAX_PROMPT = 24_000; // characters
const MAX_TOKENS = 4_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// The caller's own token is checked with Supabase Auth, so only signed-in people use the API credit.
async function signedIn(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const apikey = req.headers.get("apikey") ?? "";
  const url = Deno.env.get("SUPABASE_URL");
  if (!url || !auth.startsWith("Bearer ") || !apikey) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: auth, apikey } });
  return res.ok;
}

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);
  if (!(await signedIn(req))) return reply({ error: "Sign in to Agilist first" }, 401);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return reply({ error: "ANTHROPIC_API_KEY is not set on the server" }, 500);

  let body: { prompt?: unknown; max_tokens?: unknown };
  try { body = await req.json(); } catch { return reply({ error: "Body must be JSON" }, 400); }
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt || prompt.length > MAX_PROMPT) return reply({ error: "prompt is missing or too long" }, 400);
  const max_tokens = Math.min(Math.max(Number(body.max_tokens) || 1500, 100), MAX_TOKENS);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return reply({ error: data?.error?.message ?? "Claude did not answer" }, 502);
  const text = (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  return reply({ text });
});
