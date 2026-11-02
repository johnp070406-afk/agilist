import { useState } from "react";
import { STAGES, askFor, type Photo } from "../data";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Overlay, Picture, SourceChip, buzz, useStream } from "../components/UI";
import { ShowHim } from "./ShowHim";

function AskHim({ questions, ready = true }: { questions: string[]; ready?: boolean }) {
  const { state } = useStore();
  const stage = STAGES.find((s) => s.id === state.stage)!;
  const [asked, setAsked] = useState<number[]>([]);
  const toggle = (i: number) => {
    buzz(8);
    setAsked((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));
  };
  const [more, setMore] = useState(false);
  const [first, ...rest] = questions;
  const row = (q: string, i: number) => (
    <li key={q} className={ready ? "in" : ""}>
      <button type="button" aria-pressed={asked.includes(i)} onClick={() => toggle(i)}>
        <span className="q-num">{asked.includes(i) ? <Icon name="check" size={14} /> : i + 1}</span>
        <span className="q-text">{q}</span>
      </button>
    </li>
  );
  return (
    <section className="ask" aria-label="Ask him">
      <div className="ask-head">
        <h3>Ask him</h3>
        <span className="pill">{stage.label} stage</span>
      </div>
      <ol>
        {first && row(first, 0)}
        {more && rest.map((q, i) => row(q, i + 1))}
      </ol>
      {rest.length > 0 && (
        <button type="button" className="more-btn" aria-expanded={more} onClick={() => { buzz(6); setMore(!more); }}>
          {more ? "Fewer questions" : `${rest.length} more questions`}
        </button>
      )}
      <p className="hint no-quiz-line">No right answers. If he can't remember, move on.</p>
    </section>
  );
}

function DrawingStatus({ photo }: { photo: Photo }) {
  if (photo.kind !== "drawing" || !photo.check) return null;
  const map = {
    ok: { icon: "check" as const, text: "Checked by the family" },
    pending: { icon: "clock" as const, text: "Waiting for the family to check it" },
    fix: { icon: "brush" as const, text: `The family asked for a change${photo.correction ? `: “${photo.correction}”` : ""}` },
  };
  const m = map[photo.check];
  return <p className={`draw-status ${photo.check}`}><Icon name={m.icon} size={14} />{m.text}</p>;
}

export function ResultCard({ photo, at, stream = false, showable = false }: {
  photo: Photo; at?: string; stream?: boolean; showable?: boolean;
}) {
  const { state, dispatch } = useStore();
  const ctx = useStream(photo.context, stream);
  const [showing, setShowing] = useState(false);
  const pool = [photo, ...state.photos.filter((p) => p.shared && p.id !== photo.id)];

  return (
    <article className="result">
      <div className="result-top">
        <SourceChip kind={photo.kind} from={photo.from} />
        {at && <span className="mono-small">{at}</span>}
      </div>

      {photo.careWarning && (
        <section className="care-warning" aria-label="Before you ask">
          <Icon name="shield" size={20} />
          <div>
            <p className="eyebrow">Read this first</p>
            <p>{photo.careWarning}</p>
          </div>
        </section>
      )}

      <Picture photo={photo} />

      {showable && (
        <>
          <button type="button" className="btn ghost show-open" onClick={() => { buzz(10); setShowing(true); }}>
            <Icon name="turn" size={18} /><span>Show him this picture</span>
          </button>
          <Overlay open={showing} onClose={() => setShowing(false)} label="Show him">
            <ShowHim pool={pool} startId={photo.id} onClose={(n) => {
              setShowing(false);
              if (n > 0) dispatch({ type: "notice", text: `He answered ${n} on his own. It'll go in the note.` });
            }} />
          </Overlay>
        </>
      )}

      <div className="result-title">
        <h2>{photo.title}</h2>
        <DrawingStatus photo={photo} />
      </div>

      {photo.thanks && (
        <p className="thanks" aria-label="A thank-you from the family">
          <Icon name="smile" size={16} />
          <span>“{photo.thanks}” <cite>{photo.addedBy}</cite></span>
        </p>
      )}

      <AskHim questions={askFor(photo, state.stage)} />

      <details className="more-info">
        <summary>Background</summary>
        {photo.memory && (
          <blockquote className="family-note">
            <p>“{photo.memory}”</p>
            <cite>{photo.addedBy}</cite>
          </blockquote>
        )}
        <section className="context" aria-label="Background">
          <p className={ctx.done ? "" : "streaming"}>{ctx.shown}</p>
        </section>
      </details>
    </article>
  );
}
