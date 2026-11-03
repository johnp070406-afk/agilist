import { useState } from "react";
import { cloud } from "../config";
import { joinElder } from "../sync";
import { useStore } from "../store";

// Shared sign-in only: a caregiver joins the family's album with the code the family shares.
export function JoinFamily({ intro }: { intro: string }) {
  const { state, dispatch } = useStore();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!cloud() || !state.linkChecked || state.link) return state.syncError && cloud() ? <p className="ai-source" role="status">{state.syncError}</p> : null;
  const join = async () => {
    if (busy || code.trim().length < 4) return;
    setBusy(true); setErr("");
    try { dispatch({ type: "setLink", link: await joinElder(code) }); }
    catch (e) { setErr(e instanceof Error ? e.message : "That didn't work. Try again."); setBusy(false); }
  };
  return (
    <section className="carry" aria-label="Join the family's album">
      <p className="eyebrow">Link to the family</p>
      <p className="carry-body">{intro}</p>
      <label className="field" htmlFor="join-code">
        <span>Family code</span>
        <span className="type-row">
          <input id="join-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && join()} autoCapitalize="characters" autoComplete="off" />
          <button type="button" className="btn" disabled={busy || code.trim().length < 4} onClick={join}>{busy ? "Joining…" : "Join"}</button>
        </span>
      </label>
      {(err || state.syncError) && <p className="login-error" role="alert">{err || state.syncError}</p>}
    </section>
  );
}
