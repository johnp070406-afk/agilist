import { NoteTools, TidyBar, useTidy } from "../components/Tidy";
import { useState } from "react";
import { HERITAGE, MOODS, type Photo } from "../data";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Picture, Sheet, TagChips } from "../components/UI";
import { ResultCard } from "./ResultCard";

export function CareNotes() {
  const { state } = useStore();
  const tidy = useTidy();
  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">{state.notes.length} notes · kept with him, not with one caregiver</p>
        <h1>What he has told us</h1>
      </header>
      <TidyBar tidy={tidy} />
      <ol className="note-list">
        {state.notes.map((n) => (
          <li key={n.id}>
            <article className={`note ${n.fresh ? "fresh" : ""} ${tidy.sel.includes(n.id) ? "picked" : ""}`}>
              <NoteTools tidy={tidy} id={n.id} />
              <div className="note-head">
                <h2>{n.topic}</h2>
                {n.fresh ? <span className="pill green">Just saved</span> : <span className="mono-small">{n.date}</span>}
              </div>
              {n.mood && <span className={`mood-pill ${n.mood}`}><span className="mood-dot" aria-hidden="true" />After: {MOODS.find((m) => m.id === n.mood)!.label.toLowerCase()}</span>}
              <p>{n.body}</p>
              <TagChips tags={n.tags} small />
              <p className="note-by">Approved by {n.author}</p>
            </article>
          </li>
        ))}
      </ol>
      {state.notes.length === 0 && <p className="hint">No notes yet. After a conversation, the note you approve appears here.</p>}
    </div>
  );
}

export function CareAlbum() {
  const { state } = useStore();
  const [open, setOpen] = useState<Photo | null>(null);
  const [sheet, setSheet] = useState(false);
  const shared = state.photos.filter((p) => p.shared);


  return (
    <div className="stack">
      <Sheet open={sheet} onClose={() => setSheet(false)} label={open?.title ?? "Photo"}>
        {open && <ResultCard photo={open} showable />}
      </Sheet>
      <header className="screen-head">
        <p className="eyebrow">Shared by his family</p>
        <h1>{state.elderName ? `${state.elderName}'s album` : "The family's album"}</h1>
      </header>
      <p className="view-only"><Icon name="lock" size={15} />Shared by his family for your conversations with him. Please don't save or forward these photos.</p>
      {state.consent && shared.length === 0 && <p className="hint">The family hasn't shared any photos yet. They appear here as soon as they do.</p>}
      {!state.consent ? (
        <div className="empty">
          <Icon name="eyeOff" size={26} />
          <p>His family has paused sharing. Nothing is visible to the care team right now.</p>
        </div>
      ) : (
        <ul className="grid">
          {shared.map((p) => (
            <li key={p.id}>
              <button type="button" className="tile" onClick={() => { setOpen(p); setSheet(true); }}>
                <Picture photo={p} size="thumb" />
                <span className="tile-title">{p.title}</span>
                <TagChips tags={p.tags.slice(0, 2)} small />
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="heritage-sec" aria-labelledby="heritage-h">
        <h2 id="heritage-h">Heritage set</h2>
        <p className="sub">Everyday Singapore from his younger years, drawn for Agilist. Use these when the family album is still thin. They are general pictures, not his own photos.</p>
        <ul className="grid">
          {HERITAGE.map((p) => (
            <li key={p.id}>
              <button type="button" className="tile" onClick={() => { setOpen(p); setSheet(true); }}>
                <Picture photo={p} size="thumb" />
                <span className="tile-title">{p.title}</span>
                <span className="tile-sub">{p.year}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
