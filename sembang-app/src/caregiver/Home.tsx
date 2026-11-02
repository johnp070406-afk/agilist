import { useState } from "react";
import { JoinFamily } from "../components/JoinFamily";
import { STAGES } from "../data";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Picture, Sheet, buzz } from "../components/UI";
import { AboutSenior } from "./About";
import { HowItWorks } from "./HowItWorks";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function CareHome() {
  const { state, dispatch } = useStore();
  const latest = state.notes[0];
  const paused = !state.consent;
  const me = state.user?.name ?? "";
  const thanked = state.consent ? state.photos.find((p) => p.thanks && p.shared) : undefined;
  const [about, setAbout] = useState(false);
  const [how, setHow] = useState(false);

  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">Caregiver</p>
        <h1>{greeting()}{me ? `, ${me}` : ""}</h1>
        {state.elderName && <p className="sub">Today with {state.elderName}</p>}
      </header>

      <button type="button" className="senior-card" onClick={() => setAbout(true)} aria-label="How to ask him">
        <div className="avatar"><Icon name="smile" size={22} /></div>
        <div className="senior-meta">
          <h2>How to ask him</h2>
          <p>{STAGES.find((x) => x.id === state.stage)?.label} stage · tap to change</p>
        </div>
        <span className="chev" aria-hidden="true"><Icon name="arrow" size={16} /></span>
      </button>
      <Sheet open={about} onClose={() => setAbout(false)} label="How to ask him">
        <AboutSenior />
      </Sheet>

      <JoinFamily intro="Ask the family for their 6-character code. Their photos then appear here, and your notes reach them." />

      {thanked && (
        <section className="thanks-card" aria-label="A thank-you from the family">
          <p className="eyebrow"><Icon name="smile" size={13} /> From the family</p>
          <p className="thanks-text">“{thanked.thanks}”</p>
          <p className="thanks-by">{thanked.addedBy} · with “{thanked.title}”</p>
        </section>
      )}

      <section className="start" aria-label="Start a conversation">
        <button
          type="button"
          className="start-btn"
          disabled={paused}
          onClick={() => { buzz(14); dispatch({ type: "startLive" }); }}
        >
          <span className="start-ring"><Icon name="mic" size={28} /></span>
          <span className="start-text">
            <strong>Start a conversation</strong>
            <span>Uses the microphone, or you can type what he says</span>
          </span>
        </button>
        <p className="start-help">
          {paused
            ? "The family has paused sharing, so conversations are off until they turn it back on."
            : "The recording is never saved. Only the note you approve is kept."}
        </p>
      </section>

      {latest && (
        <section className="carry" aria-label="Picked up from last time">
          <p className="eyebrow">Picked up from last time · {latest.date}</p>
          <p className="carry-body">{latest.body}</p>
          {latest.next && <p className="carry-q"><Icon name="sparkle" size={14} /> Try asking: “{latest.next}”</p>}
        </section>
      )}

      <button type="button" className="btn ghost" onClick={() => { buzz(8); setHow(true); }}><Icon name="sparkle" size={16} /><span>How Agilist uses AI</span></button>
      <Sheet open={how} onClose={() => setHow(false)} label="How Agilist uses AI">
        <HowItWorks />
      </Sheet>
    </div>
  );
}
