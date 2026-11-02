import { useEffect, useState } from "react";
import { HERITAGE, MOODS, askFor, type Mood } from "../data";
import { localDraft } from "../listen";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Button, Picture, TagChips, Toggle, buzz, useStagger, useStream } from "../components/UI";
import { aiDrawing, aiNote, aiNoteFromTranscript, getSample } from "../realAI";
import { EmojiRow, withEmoji } from "../components/EmojiRow";

const mins = (s: number) => (s < 60 ? `${s} seconds` : `${Math.round(s / 60)} min`);

export function Review() {
  const { state, dispatch } = useStore();
  const ready = state.care.reviewReady;
  const [phase, setPhase] = useState<0 | 1 | 2>(ready ? 2 : 0);
  const upsetAt = state.care.upsetAt;
  // Real-microphone sessions draft from what was actually said.
  const transcript = state.care.transcript;
  const isLive = transcript !== null;
  const livePhoto = isLive ? [...state.photos, ...HERITAGE].find((p) => p.id === state.care.livePhotoId) : undefined;
  const baseBody = localDraft(transcript ?? "", livePhoto?.title ?? null);
  const [title, setTitle] = useState(livePhoto?.title ?? "Today's conversation");
  const [tags, setTags] = useState<string[]>(livePhoto?.tags.slice(0, 2) ?? []);
  const draftBody = upsetAt === null ? baseBody
    : `${baseBody} Got upset at ${Math.floor(upsetAt / 60)}:${String(upsetAt % 60).padStart(2, "0")}. We paused the questions and he settled.`;
  const [body, setBody] = useState(draftBody);
  const [mood, setMood] = useState<Mood | null>(null);
  const [toFamily, setToFamily] = useState("");
  const [live, setLive] = useState(false);
  const [noticed, setNoticed] = useState("");
  const [next, setNext] = useState<string | undefined>(undefined);
  const [aiState, setAiState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  useEffect(() => { getSample().then((s) => setLive(!!s)); }, []);
  // With AI available, the note from a real conversation is written from the transcript.
  const [fromSpeech, setFromSpeech] = useState<"idle" | "busy" | "done" | "none">("idle");
  useEffect(() => {
    if (!isLive || phase < 2 || fromSpeech !== "idle") return;
    let alive = true;
    setFromSpeech("busy");
    aiNoteFromTranscript(transcript!, livePhoto?.title ?? null).then((r) => {
      if (!alive) return;
      if (!r) return setFromSpeech("none");
      setBody(upsetAt === null ? r.note : `${r.note} He got upset once; we paused the questions and he settled.`);
      setTitle(r.title);
      if (r.tags.length) setTags(r.tags);
      if (r.nextQuestion) setNext(r.nextQuestion);
      setFromSpeech("done");
    });
    return () => { alive = false; };
  }, [isLive, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const improve = async () => {
    buzz(10);
    setAiState("busy");
    const r = await aiNote(title, body, noticed.trim());
    if (!r) return setAiState("failed");
    setBody(r.note);
    if (r.nextQuestion) setNext(r.nextQuestion);
    setAiState("done");
  };
  const needsDrawing = isLive && !livePhoto && live;
  const [drawing, setDrawing] = useState(false);
  // With AI, the drawing is written fresh from the approved note; otherwise a pre-drawn scene is used.
  const keep = async () => {
    buzz([10, 40, 10]);
    let svg: string | undefined;
    if (needsDrawing && draw && live) {
      setDrawing(true);
      const out = await Promise.race([aiDrawing(title, body), new Promise<null>((r) => setTimeout(() => r(null), 40000))]);
      svg = out ?? undefined;
      setDrawing(false);
    }
    // The question for next time comes from what was actually said (AI), or from the picture he looked at.
    // With neither, there is no question: a made-up one would have nothing to do with the conversation.
    const photoQs = livePhoto ? askFor(livePhoto, state.stage) : [];
    const nextQ = next ?? (photoQs[1] ?? photoQs[0]);
    dispatch({ type: "keepNote", draw: needsDrawing && draw && (!!svg || !isLive), askFamily, mood: mood ?? undefined, body, next: nextQ, title, tags, svg, toFamily });
  };
  const [draw, setDraw] = useState(true);
  const [askFamily, setAskFamily] = useState(true);

  useEffect(() => {
    if (ready) return;
    const a = setTimeout(() => setPhase(1), 1500);
    const b = setTimeout(() => setPhase(2), 3300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [ready]);

  const steps = useStagger(3, 450, 1500);
  // The note writes itself in front of her, then becomes editable.
  const stream = useStream(draftBody, phase === 2 && !ready && !isLive, 120);

  if (phase < 2) {
    return (
      <div className="stack center-stack">
        <div className="deleted">
          <span className="deleted-icon"><Icon name="trash" size={26} /></span>
          <h1>Recording deleted</h1>
          <p className="sub">{mins(state.care.seconds)} with {state.elderName || "him"}. The audio is gone and nothing was stored.</p>
        </div>
        <ul className="work-steps" aria-live="polite">
          {["Writing the note from what he said", "Keeping only what is about his own life", "Checking it against earlier notes"].map((t, i) => (
            <li key={t} className={i < steps ? "done" : ""}>
              <span className="ws-dot">{i < steps ? <Icon name="check" size={12} /> : null}</span>{t}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">Step 2 of 2 · nothing is saved yet</p>
        <h1>Keep this note?</h1>
        <p className="sub">Read it, fix anything that's wrong, then decide.</p>
      </header>

      <article className="note draft">
        <div className="note-head">
          <h2>{title}</h2>
          <span className="pill green">{isLive ? "From the recording" : "New detail"}</span>
        </div>
        {fromSpeech === "busy" && <p className="ai-source live"><Icon name="sparkle" size={15} />Claude is writing the note from what was said…</p>}
        {fromSpeech === "done" && <p className="ai-source live"><Icon name="sparkle" size={15} />Written by Claude from the conversation. Check it before you keep it.</p>}
        {isLive && fromSpeech === "none" && <p className="ai-source"><Icon name="sparkle" size={15} />No live AI here, so this is the start of what was said. Edit it into a note.</p>}
        {stream.done ? (
          <>
            <label className="sr-only" htmlFor="note-body">Note text</label>
            <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          </>
        ) : (
          <p className="streaming note-stream" aria-live="polite">{stream.shown}</p>
        )}
        <TagChips tags={tags} small />
      </article>

      {live && stream.done && (
        <details className="ai-fold"><summary>Add something you noticed</summary>
        <section className="ai-note" aria-label="Improve the note with AI">
          <label className="field" htmlFor="noticed">
            <span>Anything else you noticed? <em>(optional)</em></span>
            <input id="noticed" value={noticed} onChange={(e) => setNoticed(e.target.value)} placeholder="He smiled when he said her name" />
          </label>
          <Button variant="ghost" icon="sparkle" disabled={aiState === "busy"} onClick={improve}>
            {aiState === "busy" ? "Claude is rewriting the note…" : "Rewrite the note with AI"}
          </Button>
          {aiState === "done" && <p className="ai-source live"><Icon name="sparkle" size={15} />Rewritten by Claude just now. Check it before you keep it.{next ? ` Next time, try: “${next}”` : ""}</p>}
          {aiState === "failed" && <p className="ai-source"><Icon name="sparkle" size={15} />AI couldn't answer just now. Your note is unchanged.</p>}
        </section>
        </details>
      )}

      {needsDrawing && (
        <section className="draw-opt" aria-label="Drawing for next time">
          <div className="draw-row">
            <span className="draw-ico"><Icon name="brush" size={18} /></span>
            <div>
              <strong>Draw this for next time</strong>
              <span>There's no photo of it. A drawing made from this note can open the next conversation.</span>
            </div>
            <Toggle on={draw} onChange={setDraw} label="Draw this for next time" />
          </div>
          {draw && (
            <div className="draw-row sub-row">
              <span className="draw-ico quiet"><Icon name="people" size={16} /></span>
              <div>
                <strong>Ask the family to check it</strong>
                <span>She can say if it matches what she knows.</span>
              </div>
              <Toggle on={askFamily} onChange={setAskFamily} label="Ask the family to check it" />
            </div>
          )}
        </section>
      )}

      <section className="mood-check" aria-labelledby="mood-q">
        <div className="mood-head">
          <h3 id="mood-q">How did he seem by the end?</h3>
          <span className="mono-small">10 seconds · optional</span>
        </div>
        <div className="mood-opts" role="radiogroup" aria-labelledby="mood-q">
          {MOODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mood === m.id} className={`mood-opt ${m.id}`}
              onClick={() => { buzz(8); setMood(mood === m.id ? null : m.id); }}>
              <span className="mood-dot" aria-hidden="true" />{m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="to-family" aria-labelledby="tofam-h">
        <label className="field" htmlFor="to-family">
          <span id="tofam-h">A word for the family <em>(optional)</em></span>
          <input id="to-family" value={toFamily} onChange={(e) => setToFamily(e.target.value)} maxLength={160} placeholder="He smiled a lot today." />
        </label>
        <EmojiRow label="Add a feeling to your word for the family" onPick={(e) => setToFamily((t) => withEmoji(t, e))} />
      </section>

      <div className="btn-row">
        <Button variant="ghost" icon="x" onClick={() => dispatch({ type: "discardNote" })}>Discard</Button>
        <Button icon="check" disabled={!stream.done || drawing} onClick={keep}>{drawing ? "Claude is drawing it…" : "Keep this note"}</Button>
      </div>
    </div>
  );
}

export function Loop() {
  const { state, dispatch } = useStore();
  const kept = state.notes.find((n) => n.id === state.care.keptNoteId);
  const drawing = state.care.drewId ? state.photos.find((p) => p.id === state.care.drewId) : null;
  const question = kept?.next;
  const count = 1 + (drawing ? 1 : 0) + (question ? 1 : 0);
  const shown = useStagger(count, 550, 250);
  let n = 0;
  const step = () => ++n;

  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow"><Icon name="check" size={13} /> Saved to {state.elderName ? `${state.elderName}'s` : "his"} record</p>
        <h1>The loop is closed</h1>
        <p className="sub">One conversation now helps the next person who sits with him.</p>
      </header>

      <ol className="loop-list">
        {drawing && (() => { const i = step(); return (
          <li className={shown >= i ? "in" : ""}>
            <span className="loop-num">{i}</span>
            <div>
              <h3>A drawing for next time</h3>
              <div className={`develop ${shown >= i ? "go" : ""}`}><Picture photo={drawing} /></div>
              <p className="loop-sub">
                Drawn from your approved note, after the conversation.
                {drawing.check === "pending" && " The family will check it before it's used."}
              </p>
            </div>
          </li>); })()}
        {question && (() => { const i = step(); return (
          <li className={shown >= i ? "in" : ""}>
            <span className="loop-num">{i}</span>
            <div>
              <h3>A question for next time</h3>
              <p className="quote">“{question}”</p>
            </div>
          </li>); })()}
        {(() => { const i = step(); return (
          <li className={shown >= i ? "in" : ""}>
            <span className="loop-num">{i}</span>
            <div>
              <h3>The care team and the family have been told</h3>
              <p className="loop-sub">{(kept?.body ?? "").split(". ")[0].replace(/\.$/, "")}.</p>
            </div>
          </li>); })()}
      </ol>

      <Button icon="arrow" onClick={() => dispatch({ type: "finishLoop" })}>Done</Button>
    </div>
  );
}
