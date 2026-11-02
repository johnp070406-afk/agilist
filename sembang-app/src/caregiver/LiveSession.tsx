import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Overlay, Picture, Sheet, buzz, scrollInPhone } from "../components/UI";
import { LANGS, inPhoneApp, matchPhoto, micProblem, speechCtor, type Match } from "../listen";
import { HERITAGE } from "../data";
import { aiMatchPhoto, aiSource, getSample, type AISource } from "../realAI";
import { ResultCard } from "./ResultCard";
import { Calm } from "./Calm";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface Line { at: number; text: string }

// A conversation with the real microphone. What is said appears as it is recognised;
// when the words point to a picture in the album, the card comes up on its own.
export function LiveSession() {
  const { state, dispatch } = useStore();
  const [lang, setLang] = useState<string>(LANGS[0].id);
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  const [match, setMatch] = useState<(Match & { at: number; ai?: boolean; manual?: boolean }) | null>(null);
  const [error, setError] = useState("");
  const [calm, setCalm] = useState(false);
  const [pick, setPick] = useState(false);
  const [typed, setTyped] = useState("");
  const [ai, setAi] = useState<AISource | null>(null);
  useEffect(() => { getSample().then(() => setAi(aiSource())); }, []);
  const recRef = useRef<ReturnType<typeof makeRec> | null>(null);
  const secsRef = useRef(0);
  const wantOn = useRef(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Line[]>([]);

  function makeRec() {
    const Ctor = speechCtor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        if (r.isFinal) {
          const line = { at: secsRef.current, text };
          linesRef.current = [...linesRef.current, line];
          setLines(linesRef.current);
        } else live += text + " ";
      }
      setInterim(live.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantOn.current = false;
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "The microphone is blocked here. Allow it in the browser, or open Agilist.html in Chrome on a computer."
        : e.error === "network"
          ? "Speech recognition needs an internet connection."
          : `The microphone stopped (${e.error}).`);
    };
    // Browsers end recognition after a pause; carry on until the caregiver presses Stop.
    rec.onend = () => { if (wantOn.current) { try { rec.start(); } catch { /* already started */ } } };
    return rec;
  }

  // Start (and restart when the language changes); pause while he is being settled.
  // The microphone is checked first so a refusal is explained exactly. Typing always works.
  useEffect(() => {
    if (calm) return;
    let dead = false;
    wantOn.current = true;
    (async () => {
      if (!speechCtor()) {
        setError(inPhoneApp()
          ? "Listening isn't switched on in this version of the app. Type what he says below."
          : "This browser can't recognise speech. Type what he says below, or use Chrome or Edge.");
        return;
      }
      const problem = await micProblem();
      if (dead) return;
      if (problem) { setError(problem); return; }
      setError("");
      const rec = makeRec();
      recRef.current = rec;
      try { rec?.start(); } catch { /* ignore */ }
    })();
    return () => { dead = true; wantOn.current = false; try { recRef.current?.abort(); } catch { /* ignore */ } recRef.current = null; };
  }, [lang, calm]); // eslint-disable-line react-hooks/exhaustive-deps

  // What the caregiver types is treated exactly like a finished spoken sentence.
  const addTyped = () => {
    const text = typed.trim();
    if (!text) return;
    buzz(8);
    linesRef.current = [...linesRef.current, { at: secsRef.current, text }];
    setLines(linesRef.current);
    setTyped("");
  };

  useEffect(() => {
    if (calm) return;
    const t = setInterval(() => { secsRef.current += 1; setSecs(secsRef.current); }, 1000);
    return () => clearInterval(t);
  }, [calm]);

  // Look for a picture in everything heard so far, newest words first.
  useEffect(() => {
    // Newest words first, so the card follows him when he moves on to another memory.
    const recent = [interim, ...lines.slice(-3).map((l) => l.text).reverse()].filter(Boolean);
    let m = null;
    for (const text of recent) { m = matchPhoto(text, state.photos); if (m) break; }
    if (m && m.photo.id !== match?.photo.id) {
      buzz([10, 60, 18]);
      setMatch({ ...m, at: secsRef.current });
    }
  }, [lines, interim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Meaning-based match: after each finished sentence, ask the AI (when it is available) which
  // picture fits. Keywords above answer instantly; this catches what the word list misses.
  const asked = useRef(0);
  useEffect(() => {
    if (lines.length === 0 || lines.length === asked.current) return;
    asked.current = lines.length;
    const recent = lines.slice(-3).map((l) => l.text).join(" ");
    const pool = [...state.photos.filter((p) => p.shared), ...HERITAGE];
    let stale = false;
    aiMatchPhoto(recent, pool).then((r) => {
      if (stale || !r) return;
      const photo = pool.find((p) => p.id === r.id);
      if (!photo) return;
      setMatch((cur) => {
        if (cur?.photo.id === photo.id) return cur;
        buzz([10, 60, 18]);
        return { photo, word: r.cue, at: secsRef.current, ai: true };
      });
    });
    return () => { stale = true; };
  }, [lines]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (match) scrollInPhone(cardRef.current); }, [match]);

  const transcript = () => [...linesRef.current.map((l) => l.text), interim].join(" ").trim();
  const stop = () => {
    buzz(15);
    wantOn.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    dispatch({ type: "endLive", seconds: Math.max(secsRef.current, 1), transcript: transcript(), photoId: match?.photo.id ?? null });
  };
  const listening = !calm && !error;

  return (
    <div className="session">
      <div className="rec-bar" role="status" aria-live="off">
        <span className={`rec-dot ${listening ? "" : "off"}`} aria-hidden="true" />
        <span className="rec-label">{calm ? "Paused" : error ? "Not listening" : "Listening"}</span>
        <span className="rec-time">{fmt(secs)}</span>
        <label className="lang-pick">
          <span className="sr-only">Language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <p className="live-note"><Icon name="mic" size={15} /><span><strong>Real microphone.</strong> Talk about a memory. Browsers can't hear Hokkien yet, so this demo listens in English, Mandarin or Cantonese. The browser's speech service turns speech into text; Agilist keeps no audio.</span></p>

      {ai && (
        <p className={`ai-source ${ai === "none" ? "" : "live"}`}>
          <Icon name="sparkle" size={15} />
          {ai === "none"
            ? "AI is off here, so pictures are found from key words only. Sign in with the shared sign-in, or add an API key in Display, to let AI pick them."
            : "AI is listening and will pick the picture for you."}
        </p>
      )}

      {error && <p className="live-error" role="alert">{error}</p>}

      <ol className="timeline" aria-label="What was said">
        {!match && lines.slice(-1).map((l, i) => (
          <li key={i} className="beat k-heard">
            <span className="beat-time">{fmt(l.at)}</span>
            <div className="beat-body"><span>{l.text}</span></div>
          </li>
        ))}
        {!match && interim && (
          <li className="beat k-heard interim">
            <span className="beat-time">{fmt(secs)}</span>
            <div className="beat-body"><span>{interim}</span></div>
          </li>
        )}
        {match && (
          <li className="beat k-found">
            <span className="beat-time">{fmt(match.at)}</span>
            <div className="beat-body"><span><Icon name="check" size={14} />{match.manual ? "You chose" : match.ai ? `AI matched “${match.word}”.` : `Heard “${match.word}”.`} {match.photo.kind === "heritage" ? "From the heritage set" : match.photo.from === "friend" ? "From his friends' photos" : "Found in the family album"}: {match.photo.title}</span></div>
          </li>
        )}
        {listening && !interim && <li className="beat typing" aria-hidden="true"><span className="beat-time" /><span className="dots"><i /><i /><i /></span></li>}
      </ol>

      {match && (
        <div ref={cardRef} className="card-rise" key={match.photo.id}>
          <ResultCard photo={match.photo} at={fmt(match.at)} showable />
        </div>
      )}

      <form className="type-in" onSubmit={(e) => { e.preventDefault(); addTyped(); }}>
        <label className="field" htmlFor="type-said">
          <span>Or type what he says</span>
          <span className="type-row">
            <input id="type-said" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="He is talking about his old school" autoComplete="off" />
            <button type="button" className="btn" disabled={!typed.trim()} onClick={addTyped}>Add</button>
          </span>
        </label>
      </form>

      <div className="session-foot">
        <button type="button" className="btn calm-btn" onClick={() => { buzz(14); dispatch({ type: "upset", at: secsRef.current }); setCalm(true); }}>
          <Icon name="hand" size={18} /><span>He's getting upset</span>
        </button>
        <button type="button" className="btn" onClick={() => { buzz(8); setPick(true); }}>
          <Icon name="album" size={18} /><span>Choose myself</span>
        </button>
        <button type="button" className="btn danger stop" onClick={stop}>
          <Icon name="stop" size={16} /><span>Stop</span>
        </button>
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} label="Choose a picture">
        <div className="pick-grid">
          <p className="about-note">If the microphone misses what he said, pick the picture yourself.</p>
          <ul>
            {[...state.photos.filter((p) => p.shared), ...HERITAGE].map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => { buzz([10, 60, 18]); setMatch({ photo: p, word: "your choice", at: secsRef.current, manual: true }); setPick(false); }}>
                  <Picture photo={p} size="thumb" />
                  <span>{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>
      <Overlay open={calm} onClose={() => setCalm(false)} label="Help him settle" tone="calm">
        <Calm onBack={() => setCalm(false)} onEnd={() => { setCalm(false); stop(); }} />
      </Overlay>
    </div>
  );
}
