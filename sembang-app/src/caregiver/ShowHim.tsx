import { useState } from "react";
import { askFor, type Photo } from "../data";
import { Icon } from "../components/Icons";
import { Picture, buzz } from "../components/UI";

// The screen the caregiver turns towards him. Built to dementia design guidance:
// one picture, one short line, one yes/no question, three big buttons. Plain sans-serif,
// left-aligned, no text on the picture, and nothing changes until he presses something.
export function ShowHim({ pool, startId, onClose }: { pool: Photo[]; startId: string; onClose: (answered: number) => void }) {
  const start = Math.max(0, pool.findIndex((p) => p.id === startId));
  const [i, setI] = useState(start);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [answered, setAnswered] = useState(0);
  const photo = pool[i];
  if (!photo) return null;
  const question = askFor(photo, "later")[0];
  const year = photo.kind === "photo" ? `, ${photo.year.replace(/^.*?(\d{4}).*$/, "$1")}` : "";

  const reply = (a: "yes" | "no") => {
    buzz(10);
    if (!answer) setAnswered((n) => n + 1);
    setAnswer(a);
  };
  const next = () => {
    buzz(8);
    setAnswer(null);
    setI((v) => (v + 1) % pool.length);
  };

  return (
    <div className="show">
      <div className="show-top">
        <button type="button" className="show-exit" onClick={() => onClose(answered)}>
          <Icon name="back" size={20} /><span>Back</span>
        </button>
        <span className="show-count">{i + 1} of {pool.length}</span>
      </div>

      <div className="show-pic"><Picture photo={photo} /></div>

      <h2 className="show-title">{photo.title}{year}</h2>
      <p className="show-q">{question}</p>

      <div className="show-answers" role="group" aria-label="Your answer">
        <button type="button" className="show-btn yes" aria-pressed={answer === "yes"} onClick={() => reply("yes")}>
          <Icon name="check" size={26} /><span>Yes</span>
        </button>
        <button type="button" className="show-btn no" aria-pressed={answer === "no"} onClick={() => reply("no")}>
          <Icon name="x" size={26} /><span>No</span>
        </button>
      </div>
      {answer && <p className="show-thanks" role="status">Thank you. Tell your carer about it.</p>}
      <button type="button" className="show-btn next" onClick={next}>
        <Icon name="arrow" size={24} /><span>Another picture</span>
      </button>
    </div>
  );
}
