import { useState } from "react";
import { useStore } from "../store";
import { Icon } from "./Icons";
import { buzz } from "./UI";

// Tidying up the notes: delete one, or select several and delete together.
// Deleting is never final straight away: an Undo shows for a few seconds.
export function useTidy() {
  const { state, dispatch } = useStore();
  const [on, setOn] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [armed, setArmed] = useState(false);
  const all = state.notes.map((n) => n.id);
  return {
    on, sel, armed, count: all.length,
    start: () => { buzz(8); setOn(true); setSel([]); setArmed(false); },
    done: () => { setOn(false); setSel([]); setArmed(false); },
    toggle: (id: string) => { buzz(6); setArmed(false); setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); },
    selectAll: () => { buzz(6); setArmed(false); setSel(sel.length === all.length ? [] : all); },
    removeOne: (id: string) => { buzz(10); dispatch({ type: "deleteNotes", ids: [id] }); },
    removeSelected: () => {
      if (sel.length === 0) return;
      if (!armed) { buzz(8); setArmed(true); return; }
      buzz(12);
      dispatch({ type: "deleteNotes", ids: sel });
      setOn(false); setSel([]); setArmed(false);
    },
  };
}
type Tidy = ReturnType<typeof useTidy>;

export function TidyBar({ tidy }: { tidy: Tidy }) {
  if (tidy.count === 0) return null;
  if (!tidy.on) {
    return <button type="button" className="btn ghost tidy-start" onClick={tidy.start}><Icon name="trash" size={16} /><span>Tidy up notes</span></button>;
  }
  return (
    <div className="tidy-bar" role="group" aria-label="Tidy up notes">
      <button type="button" className="btn ghost" onClick={tidy.selectAll}>{tidy.sel.length === tidy.count ? "Select none" : "Select all"}</button>
      <button type="button" className="btn danger" disabled={tidy.sel.length === 0} onClick={tidy.removeSelected}>
        <Icon name="trash" size={16} /><span>{tidy.armed ? `Tap again to delete ${tidy.sel.length}` : `Delete ${tidy.sel.length || ""}`.trim()}</span>
      </button>
      <button type="button" className="btn ghost" onClick={tidy.done}>Done</button>
    </div>
  );
}

export function NoteTools({ tidy, id }: { tidy: Tidy; id: string }) {
  if (tidy.on) {
    const picked = tidy.sel.includes(id);
    return (
      <button type="button" className={`note-pick ${picked ? "on" : ""}`} role="checkbox" aria-checked={picked} aria-label="Select this note" onClick={() => tidy.toggle(id)}>
        <span className="note-pick-box">{picked && <Icon name="check" size={16} />}</span>
        <span>{picked ? "Selected" : "Select"}</span>
      </button>
    );
  }
  return (
    <button type="button" className="note-del" aria-label="Delete this note" onClick={() => tidy.removeOne(id)}>
      <Icon name="trash" size={16} /><span>Delete</span>
    </button>
  );
}
