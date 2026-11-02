import { STAGES } from "../data";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { buzz } from "../components/UI";

// How to ask him: the stage decides which questions every picture card shows.
export function AboutSenior() {
  const { state, dispatch } = useStore();
  const warnings = state.photos.filter((p) => p.careWarning).map((p) => p.careWarning!);

  return (
    <div className="about">
      <header className="screen-head">
        <h1>How to ask him</h1>
      </header>

      {warnings.length > 0 && (
        <section className="about-sec care">
          <h3><Icon name="shield" size={16} />Take care with</h3>
          <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
      )}

      <section className="about-sec" aria-labelledby="stage-h">
        <h3 id="stage-h"><Icon name="smile" size={16} />Stage</h3>
        <p className="about-note">Choose with the family and his doctor. The questions on every picture card follow this.</p>
        <div className="stage-opts" role="radiogroup" aria-labelledby="stage-h">
          {STAGES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={state.stage === s.id}
              onClick={() => { buzz(8); if (state.stage !== s.id) dispatch({ type: "stage", stage: s.id }); }}>
              <span className="radio" aria-hidden="true" />
              <span><strong>{s.label} stage</strong><span>{s.how}</span></span>
            </button>
          ))}
        </div>
      </section>

      <p className="hint">Agilist keeps no profile of him beyond this. What he has told you is in Notes.</p>
    </div>
  );
}
