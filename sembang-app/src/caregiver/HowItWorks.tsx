import { useEffect, useState } from "react";
import { Icon } from "../components/Icons";
import { aiSource, getSample } from "../realAI";

const AI_STEPS = [
  ["Before the conversation", "Reads a family photo's title, year and hashtags and writes background and questions for the caregiver, for each stage of dementia."],
  ["During the conversation", "Matches what he says to a picture in the album by meaning, not only by exact words."],
  ["After the conversation", "Turns what was said into a short memory note. No audio is kept; the caregiver edits and approves."],
  ["For next time", "Suggests one gentle question that builds on something new he said."],
  ["When there is no photo", "Draws the memory as a simple flat picture, labelled as a drawing. The family checks it before it is used."],
];

const LIMITS = [
  "Hokkien is not recognised by browsers or phones yet. The microphone listens in English, Mandarin or Cantonese; the caregiver can type what he says or choose a picture by hand.",
  "AI drawings are simple and sometimes off. They are never used until the family confirms them.",
  "Pictures are matched from words, so an unclear sentence can match the wrong picture or none.",
  "Changes reach the other phones within about 15 seconds, not instantly.",
  "Not yet tested with real families and caregivers.",
];

export function HowItWorks() {
  const [src, setSrc] = useState<string>("checking");
  useEffect(() => {
    getSample().then((s) => setSrc(!s ? "offline" : aiSource() === "server" ? "Claude, through the Agilist server" : aiSource() === "claude" ? "Claude (live)" : "Your API key (live)"));
  }, []);
  return (
    <div className="about">
      <header className="about-head"><div><h2>How Agilist uses AI</h2><p>AI here: {src === "offline" ? "off. Pictures are found from key words only" : src}</p></div></header>
      <section className="about-sec">
        <h3><Icon name="sparkle" size={16} />Where AI helps</h3>
        <ol className="how-list">
          {AI_STEPS.map(([h, t]) => <li key={h}><strong>{h}</strong><span>{t}</span></li>)}
        </ol>
      </section>
      <section className="about-sec care">
        <h3><Icon name="shield" size={16} />What it can't do yet</h3>
        <ul>{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
    </div>
  );
}
