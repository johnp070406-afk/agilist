// Real AI, where the page can reach it. Inside the published Claude page, `claude.use("sample")`
// asks Claude on the viewer's own account (no API key in the app). Anywhere else (the
// double-click file, the phone app) it resolves null and the app uses its offline library.

import { accessToken } from "./auth";
import { cloud } from "./config";
import { cleanSvg } from "./svg";

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: Record<string, unknown>) => Promise<T>;
};
type ClaudeWin = { claude?: { use?: (name: string) => Promise<SampleFn | null> } };

// Outside the Claude page, a team can paste its own Anthropic API key (Display settings) so the
// double-click file also gets live AI. The key stays in this browser only. Demo use only:
// a real app keeps keys on a server, never in the page.
const KEY_STORE = "sembang-api-key";
const API_MODEL = "claude-haiku-5-5";
export function getApiKey(): string {
  try { return localStorage.getItem(KEY_STORE) ?? ""; } catch { return ""; }
}
export function setApiKey(key: string) {
  try { if (key) localStorage.setItem(KEY_STORE, key); else localStorage.removeItem(KEY_STORE); } catch { /* storage blocked */ }
}

// Turns "send a prompt, get text back" into the sampler the rest of the app uses.
function makeSampler(ask: (input: string) => Promise<{ text: string }>): SampleFn {
  const fn = ((input: string) => ask(input)) as SampleFn;
  fn.json = async <T,>(input: string) => {
    const { text } = await ask(input + "\n\nReply with the JSON only.");
    const start = text.search(/[[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    return JSON.parse(text.slice(start, end + 1)) as T;
  };
  return fn;
}

function keySampler(key: string): SampleFn {
  return makeSampler(async (input) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: API_MODEL, max_tokens: 3500, messages: [{ role: "user", content: input }] }),
    });
    if (!res.ok) throw new Error(`api ${res.status}`);
    const data = await res.json();
    return { text: (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("") };
  });
}

// With the shared sign-in, Claude is reached through the project's "claude" Edge Function
// (supabase/functions/claude). The Anthropic key lives on the server, so no phone holds one.
function serverSampler(): SampleFn | null {
  const c = cloud();
  const token = accessToken();
  if (!c || !token) return null;
  return makeSampler(async (input) => {
    const res = await fetch(`${c.url}/functions/v1/claude`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: c.key, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: input, max_tokens: 3500 }),
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return { text: String(data.text ?? "") };
  });
}

/** Where live AI comes from right now, for the settings screen. */
export type AISource = "claude" | "server" | "key" | "none";
let source: AISource = "none";
export function aiSource() { return source; }

let claudePage: Promise<SampleFn | null> | null = null;
export function getSample(): Promise<SampleFn | null> {
  if (!claudePage) {
    const c = (window as unknown as ClaudeWin).claude;
    claudePage = c?.use ? c.use("sample").catch(() => null) : Promise.resolve(null);
  }
  // Decided on every call, so signing in or out switches the source straight away.
  return claudePage.then((fn) => {
    if (fn) { source = "claude"; return fn; }
    const server = serverSampler();
    if (server) { source = "server"; return server; }
    const key = getApiKey();
    source = key ? "key" : "none";
    return key ? keySampler(key) : null;
  });
}

export interface AIPreview {
  context: string;
  questions: string[];
  simple: string[];
  yesno: string[];
}

const RULES = `You help English-speaking caregivers (often foreign domestic workers) talk with an elderly person with dementia in Singapore, aged about 80, who speaks mainly Hokkien and grew up in 1940s-70s Singapore. The family has shared one old photo with a title, year, hashtags and maybe one line.

Write for the caregiver, in plain English:
- "context": 2 short sentences of background on what the photo shows, as it was in Singapore at that time. Only general, well-known facts; do not invent details about this family. If the tags are vague, say what to look for and follow his lead.
- "questions": 3 open questions for the early stage. Invitations, never tests of memory: prefer "Tell me about...", "What was it like...". Never ask for names, dates, numbers or "do you remember".
- "simple": 3 questions for the middle stage: one idea each, under 9 words, or a choice of two ("Sweet or salty?").
- "yesno": 3 yes/no or sensory questions for the later stage, under 8 words.

Reply with only JSON: {"context": string, "questions": [3 strings], "simple": [3 strings], "yesno": [3 strings]}`;

export async function aiPreview(title: string, year: string, tags: string[], memory: string): Promise<AIPreview | null> {
  const sample = await getSample();
  if (!sample) return null;
  const photo = `Title: ${title || "(none)"}\nYear: ${year || "(unknown)"}\nHashtags: ${tags.map((t) => "#" + t).join(" ")}\nFamily's line: ${memory || "(none)"}`;
  try {
    const r = await sample.json<Partial<AIPreview>>(`${RULES}\n\nThe photo:\n${photo}`, { modelTier: "quick" });
    const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, 3) : []);
    const out = { context: String(r?.context ?? "").trim(), questions: list(r?.questions), simple: list(r?.simple), yesno: list(r?.yesno) };
    if (!out.context || out.questions.length < 3) return null;
    return out;
  } catch {
    return null;
  }
}

export interface AINote {
  note: string;
  nextQuestion: string;
}

/** Rewrites the session note with what the caregiver noticed, and suggests one question for next time. */
export async function aiNote(topic: string, draft: string, noticed: string): Promise<AINote | null> {
  const sample = await getSample();
  if (!sample) return null;
  const prompt = `You help a caregiver write a short memory note after talking with an elderly man with dementia in Singapore (he speaks mainly Hokkien). The note is kept in his care record and shown to his family and the next caregiver.

Rewrite the draft note, adding what the caregiver noticed. Rules:
- 2 to 4 short sentences, plain English, past tense, written as the caregiver ("we").
- Keep only things about his own life, memories, people and feelings, plus what settled or upset him. Leave out anything else, and anything about other people that isn't part of his story.
- Never add facts that are not in the draft or the caregiver's words.
Then write one gentle open question for next time that builds on something new he said. An invitation, never a memory test.

Topic: ${topic}
Draft note: ${draft}
What the caregiver noticed: ${noticed || "(nothing added)"}

Reply with only JSON: {"note": string, "nextQuestion": string}`;
  try {
    const r = await sample.json<Partial<AINote>>(prompt, { modelTier: "quick", cache: false });
    const note = String(r?.note ?? "").trim();
    const nextQuestion = String(r?.nextQuestion ?? "").trim();
    return note ? { note, nextQuestion } : null;
  } catch {
    return null;
  }
}

export interface AITranscriptNote {
  title: string;
  note: string;
  nextQuestion: string;
  tags: string[];
}

/** Turns what was said in a real recorded conversation into a draft memory note. */
export async function aiNoteFromTranscript(transcript: string, photoTitle: string | null): Promise<AITranscriptNote | null> {
  const sample = await getSample();
  if (!sample) return null;
  const prompt = `A caregiver in Singapore just talked with an elderly man with dementia. Below is a speech-to-text transcript of the conversation (both voices mixed, may contain recognition errors).${photoTitle ? ` They looked at a family photo: "${photoTitle}".` : ""}

Write a draft memory note for his care record:
- "title": 2 to 5 words naming the memory he talked about.
- "note": 2 to 4 short sentences, plain English, past tense, as the caregiver ("we"). Only things about his own life, memories, people and feelings, plus what settled or upset him. Never invent facts that are not in the transcript. If the transcript is too short or unclear, say so in one sentence.
- "nextQuestion": one gentle open question for next time that builds on something he actually said in the transcript, an invitation, never a memory test. If the transcript is too short, unclear or has nothing about his life to build on, use "" (an empty string). Never ask about people, places or things that are not in the transcript.
- "tags": 2 or 3 short hashtags without #.

Transcript:
${transcript.slice(0, 6000)}

Reply with only JSON: {"title": string, "note": string, "nextQuestion": string, "tags": [strings]}`;
  try {
    const r = await sample.json<Partial<AITranscriptNote>>(prompt, { modelTier: "quick", cache: false });
    const note = String(r?.note ?? "").trim();
    if (!note) return null;
    return {
      title: String(r?.title ?? "").trim() || photoTitle || "Today's conversation",
      note,
      nextQuestion: String(r?.nextQuestion ?? "").trim(),
      tags: Array.isArray(r?.tags) ? r!.tags!.map((t) => String(t).replace(/^#/, "")).slice(0, 3) : [],
    };
  } catch {
    return null;
  }
}

export interface AIMatch {
  id: string;
  cue: string;
}

/** Picks the album picture that best fits what was just said, by meaning rather than keywords. */
export async function aiMatchPhoto(
  recent: string,
  pool: { id: string; title: string; year: string; tags: string[]; memory?: string; context: string }[],
): Promise<AIMatch | null> {
  const sample = await getSample();
  if (!sample || !recent.trim() || pool.length === 0) return null;
  const list = pool
    .map((p) => `- id "${p.id}": ${p.title} (${p.year}). Tags: ${p.tags.map((t) => "#" + t).join(" ")}. ${p.memory ?? ""} ${p.context}`.trim())
    .join("\n");
  const prompt = `A caregiver in Singapore is talking with an elderly man with dementia. Below is the latest speech-to-text of what was said (English, Mandarin or Cantonese; may contain recognition errors; both voices mixed).

Decide which ONE picture from his album he is talking about, going by meaning, not only exact words (e.g. "where we built the big boats" means a shipyard photo). If what was said does not clearly point to any picture, answer null. Never guess from a vague or unrelated sentence.

Album:
${list}

Said:
${recent.slice(-800)}

Reply with only JSON: {"id": string or null, "cue": string}. "cue" is the 1 to 4 words he said that point to the picture, in his own language.`;
  try {
    const r = await sample.json<{ id?: string | null; cue?: string }>(prompt, { modelTier: "quick", cache: false });
    const id = r?.id ? String(r.id) : "";
    if (!id || !pool.some((p) => p.id === id)) return null;
    return { id, cue: String(r?.cue ?? "").trim().slice(0, 40) || "that memory" };
  } catch {
    return null;
  }
}

/** Asks Claude to draw the memory as a simple flat SVG, in a fixed style. Returns cleaned SVG or null. */
export async function aiDrawing(title: string, note: string): Promise<string | null> {
  const sample = await getSample();
  if (!sample) return null;
  const prompt = `Draw a simple picture of a memory told by an elderly man with dementia in Singapore, to be shown to him as a gentle conversation starter. Write one SVG.

Memory title: ${title}
Approved note: ${note}

Rules:
- <svg viewBox="0 0 400 300"> only. Use only rect, circle, ellipse, path, line, polygon, polyline, g and linearGradient. No text, no letters, no images, no scripts, no styles.
- Flat storybook style, soft warm colours, at most 60 shapes. A sky or wall band, a ground band, then the main things from the note (place, objects, a few simple people as round heads with plain bodies and NO facial features).
- It must be obviously a drawing, never photo-like. Draw only what the note says; add nothing about people or places it does not mention.
- Fill the whole 400x300 canvas with a background rect first.

Reply with only the SVG code.`;
  try {
    const r = await sample(prompt, { modelTier: "default", cache: false });
    return cleanSvg(r.text);
  } catch {
    return null;
  }
}
