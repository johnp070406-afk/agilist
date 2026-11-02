import { CALM_PHRASE } from "../data";
import { Icon } from "../components/Icons";
import { Button } from "../components/UI";

// "He's getting upset": the questions stop, listening pauses, and the caregiver gets
// what has settled him before. Research on reminiscence apps (CIRCA and others) found
// quiz-like prompts can distress people with dementia, so the first step is always to stop asking.
export function Calm({ onBack, onEnd }: { onBack: () => void; onEnd: () => void }) {

  return (
    <div className="calm">
      <p className="calm-status"><Icon name="leaf" size={16} />Listening paused · questions hidden</p>
      <h2 className="calm-title">Stop asking. Sit with him.</h2>

      <ol className="calm-steps">
        <li><span>1</span><p>Sit beside him at his eye level. Speak slowly and keep your voice low.</p></li>
        <li>
          <span>2</span>
          <div>
            <p>Say, in Hokkien:</p>
            <p className="calm-phrase"><strong>{CALM_PHRASE.roman}</strong> <span lang="zh-Hant">{CALM_PHRASE.han}</span></p>
            <p className="calm-mean">{CALM_PHRASE.meaning}</p>
          </div>
        </li>
        <li><span>3</span><p>Don't correct him or explain. Agree with how he feels: “That sounds hard.”</p></li>
      </ol>

      <div className="calm-actions">
        <Button icon="check" onClick={onBack}>He's calmer, carry on</Button>
        <Button variant="ghost" icon="stop" onClick={onEnd}>End the conversation</Button>
      </div>
      <p className="hint">This is noted for the family as “got upset, settled”.</p>
    </div>
  );
}
