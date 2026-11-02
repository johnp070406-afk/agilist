// Real listening for the demo: the browser's own speech recognition (Chrome, Edge, Safari),
// plus a matcher that links the words heard to pictures in the album. Browsers can't
// recognise Hokkien, so the demo listens in English, Mandarin or Cantonese; the real app
// would use a Hokkien speech model on its own server.
import { HERITAGE, type Photo } from "./data";

export const LANGS = [
  { id: "en-SG", label: "English" },
  { id: "cmn-Hans-CN", label: "Mandarin" },
  { id: "yue-Hant-HK", label: "Cantonese" },
] as const;

type Rec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecCtor = new () => Rec;

type Win = Window & {
  SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor;
  SembangNative?: { speech?: boolean; app?: boolean };
  ReactNativeWebView?: { postMessage: (s: string) => void };
};
const win = () => window as unknown as Win;

/** True inside the Agilist phone app, where speech recognition is done by the phone itself. */
export const inPhoneApp = () => !!win().SembangNative?.app;
const hasNativeSpeech = () => !!win().SembangNative?.speech && !!win().ReactNativeWebView;

// Inside the phone app the WebView has no speech recognition of its own. The app asks the phone's
// recogniser through a small bridge: this side posts {type:"speech", op, lang}; the phone answers
// with "sembang-speech" events whose detail is {kind: "result" | "error" | "end", ...}.
class NativeRec implements Rec {
  lang = "en-SG";
  continuous = true;
  interimResults = true;
  onresult: Rec["onresult"] = null;
  onerror: Rec["onerror"] = null;
  onend: Rec["onend"] = null;

  private on = (ev: Event) => {
    const d = (ev as CustomEvent<{ kind: string; transcript?: string; isFinal?: boolean; error?: string }>).detail;
    if (d.kind === "result" && d.transcript) {
      this.onresult?.({ resultIndex: 0, results: [{ isFinal: !!d.isFinal, 0: { transcript: d.transcript } }] });
    } else if (d.kind === "error") {
      // The phone reports silence as an error; the web side treats that as "keep listening".
      this.onerror?.({ error: d.error === "no-match" || d.error === "speech-timeout" ? "no-speech" : d.error ?? "unknown" });
    } else if (d.kind === "end") {
      window.removeEventListener("sembang-speech", this.on);
      this.onend?.();
    }
  };
  private send(op: "start" | "stop" | "abort") {
    win().ReactNativeWebView?.postMessage(JSON.stringify({ type: "speech", op, lang: this.lang }));
  }
  start() {
    window.removeEventListener("sembang-speech", this.on);
    window.addEventListener("sembang-speech", this.on);
    this.send("start");
  }
  stop() { this.send("stop"); }
  abort() { this.send("abort"); }
}

/** The speech recogniser this device can use, or null when it cannot listen (the screen then offers typing). */
export function speechCtor(): RecCtor | null {
  if (hasNativeSpeech()) return NativeRec as unknown as RecCtor;
  // The phone app without the speech module (Expo Go): listening is off, typing still works.
  if (inPhoneApp()) return null;
  const w = win();
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Asks for the microphone once, before listening, so a refusal can be explained exactly. Returns "" when fine. */
export async function micProblem(): Promise<string> {
  if (hasNativeSpeech()) return ""; // the phone asks for its own permissions
  if (!navigator.mediaDevices?.getUserMedia) return window.isSecureContext
    ? "This browser can't use a microphone." : "The microphone needs a secure page. Open Agilist from https:// or http://localhost.";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop()); // permission check only; nothing is recorded
    return "";
  } catch (e) {
    const name = (e as DOMException).name;
    if (name === "NotAllowedError" || name === "SecurityError") return "The microphone is blocked. Allow it for this page in the browser's address bar, then press Start again. (Chrome also blocks it for files opened by double-click and inside the Claude page.)";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "No microphone was found on this device.";
    if (name === "NotReadableError") return "Another app is using the microphone. Close it and try again.";
    return `The microphone could not start (${name || "unknown error"}).`;
  }
}

/** Extra words, in English and Chinese, that point to each picture. */
const EXTRA: Record<string, string[]> = {
  "h-kampung": ["kampung", "kampong", "village", "attap", "chicken", "甘榜", "村"],
  "h-trishaw": ["trishaw", "rickshaw", "三轮车", "三輪車"],
  "h-radio": ["radio", "rediffusion", "story", "stories", "收音机", "收音機", "丽的呼声", "麗的呼聲"],
};
const SCENE_WORDS: Record<string, string[]> = {
  bus: ["bus", "buses", "巴士", "公车", "公車"],
  seaside: ["beach", "sea", "swim", "changi", "海边", "海邊", "海", "樟宜"],
};

export interface Match { photo: Photo; word: string }

// Chinese words have no spaces around them, so they're matched anywhere in the text.
const isCJK = (w: string) => [...w].some((c) => c.charCodeAt(0) >= 0x4e00 && c.charCodeAt(0) <= 0x9fff);

const STOP = new Set("about after again also been before being could does doing done from have having here into just like made make many more most much only other over said same some such than that their them then there these they this those through very want well were what when where which while will with would your".split(" "));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
const contentWords = (s: string) => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w));

/** Second chance when no key word matched: words that appear in the picture's own title, line and background. */
function matchByDescription(text: string, pool: Photo[]): Match | null {
  const said = new Map<string, string>();
  for (const w of contentWords(text)) said.set(stem(w), w);
  if (said.size === 0) return null;
  let best: { photo: Photo; word: string; score: number } | null = null;
  for (const p of pool) {
    const own = new Set(contentWords(`${p.title} ${p.memory ?? ""} ${p.context}`).map(stem));
    const hits = [...said.keys()].filter((k) => own.has(k));
    // One shared everyday word is a coincidence; two or more is a real pointer.
    if (hits.length >= 2 && (!best || hits.length > best.score)) best = { photo: p, word: said.get(hits[0])!, score: hits.length };
  }
  return best ? { photo: best.photo, word: best.word } : null;
}

/** Finds the picture the words point to, preferring the family's own photos over the heritage set. */
export function matchPhoto(text: string, photos: Photo[]): Match | null {
  const t = text.toLowerCase();
  const pool = [...photos.filter((p) => p.shared), ...HERITAGE];
  for (const p of pool) {
    const words = [
      ...(p.kind === "heritage" ? [...(EXTRA[p.id] ?? []), ...(SCENE_WORDS[p.scene] ?? [])] : []),
      ...p.tags.map((x) => x.toLowerCase()).filter((x) => x.length > 3 && !/^\d+$/.test(x)),
    ];
    const hit = words.find((w) => (isCJK(w) ? t.includes(w) : new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)));
    if (hit) return { photo: p, word: hit };
  }
  return matchByDescription(text, pool);
}

/** A plain draft when no AI is available: the opening of what was said, kept short. */
export function localDraft(transcript: string, title: string | null): string {
  const said = transcript.replace(/\s+/g, " ").trim();
  if (!said) return "The conversation was too quiet to pick up. Add what he talked about.";
  const short = said.length > 260 ? said.slice(0, 260).replace(/\s\S*$/, "") + "…" : said;
  return `${title ? `We looked at "${title}". ` : ""}From the conversation: "${short}" Edit this into a note about what he shared.`;
}
