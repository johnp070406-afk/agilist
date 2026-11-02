import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useStore, type Role } from "./store";
import { signIn, signUp, validEmail } from "./auth";
import { cloud, saveCloud } from "./config";
import { Icon } from "./components/Icons";
import { Picture, Sheet } from "./components/UI";

type Mode = "in" | "up";

export function Login() {
  const { dispatch } = useStore();
  const [mode, setMode] = useState<Mode>("in");
  const [role, setRole] = useState<Role>("caregiver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [homes, setHomes] = useState(false);
  const [shared, setShared] = useState(false);
  const [sUrl, setSUrl] = useState(cloud()?.url ?? "");
  const [sKey, setSKey] = useState(cloud()?.key ?? "");
  const [connected, setConnected] = useState(!!cloud());
  const up = mode === "up";

  const switchMode = (m: Mode) => { setMode(m); setError(""); setPassword(""); setConfirm(""); };

  // The Claude page runs the app in a sandboxed frame that blocks real form submission,
  // so signing in never relies on it: the button and the Enter key call this directly.
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (up && !name.trim()) return setError("Enter your name.");
    if (!validEmail(email)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Your password needs at least 6 characters.");
    if (up && password !== confirm) return setError("The two passwords don't match.");
    setError("");
    setBusy(true);
    try {
      const user = up ? await signUp(name, email, password, role) : await signIn(email, password);
      dispatch({ type: "signIn", user });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in didn't work. Try again.");
      setBusy(false);
    }
  };
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") submit(e as unknown as FormEvent); };

  const connect = () => {
    const url = sUrl.trim(), key = sKey.trim();
    if (!/^https:\/\/\S+$/.test(url) || key.length < 20) return setError("Paste the project URL (https://…) and the anon key from Supabase.");
    saveCloud({ url, key });
    setConnected(true);
    setShared(false);
    setError("");
  };
  const disconnect = () => { saveCloud(null); setConnected(false); setSUrl(""); setSKey(""); };

  // Decorative pictures for the sign-in screen only: not anyone's photos.
  const keppel = { scene: "shipyard", kind: "photo", title: "", year: "1972" } as const;
  const kueh = { scene: "kueh", kind: "drawing", title: "", year: "" } as const;

  return (
    <div className="login">
      <div className="login-art" aria-hidden="true">
        <div className="login-card a"><Picture photo={keppel} size="thumb" /></div>
        <div className="login-card b"><Picture photo={kueh} size="thumb" /></div>
      </div>

      <header className="login-head">
        <p className="login-brand">Agilist</p>
        <h1>Conversations that remember</h1>
        <p className="sub">Family photos and past talks, ready for whoever sits with him next.</p>
      </header>

      <form className="login-form" onSubmit={submit} noValidate>
        <div className="seg" role="radiogroup" aria-label="Sign in or create an account">
          <button type="button" role="radio" aria-checked={!up} onClick={() => switchMode("in")}>Sign in</button>
          <button type="button" role="radio" aria-checked={up} onClick={() => switchMode("up")}>Create an account</button>
        </div>

        {up && (
          <fieldset className="login-role">
            <legend>I am</legend>
            <div className="role-cards">
              <button type="button" aria-pressed={role === "family"} onClick={() => setRole("family")}>
                <Icon name="people" size={20} />
                <strong>Family</strong>
                <span>Share photos, read notes</span>
              </button>
              <button type="button" aria-pressed={role === "caregiver"} onClick={() => setRole("caregiver")}>
                <Icon name="user" size={20} />
                <strong>Caregiver</strong>
                <span>Start conversations</span>
              </button>
              <button type="button" aria-pressed={role === "friend"} onClick={() => setRole("friend")}>
                <Icon name="smile" size={20} />
                <strong>Friend</strong>
                <span>Church or old friends: share photos</span>
              </button>
            </div>
          </fieldset>
        )}

        {up && (
          <label className="field" htmlFor="login-name">
            <span>Your name</span>
            <input id="login-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onEnter} />
          </label>
        )}

        <label className="field" htmlFor="login-email">
          <span>Email</span>
          <input id="login-email" type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} onKeyDown={onEnter} aria-invalid={!!error && error.includes("email")} />
        </label>

        <label className="field" htmlFor="login-password">
          <span>Password</span>
          <span className="pw-wrap">
            <input id="login-password" type={show ? "text" : "password"} autoComplete={up ? "new-password" : "current-password"} value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={onEnter} aria-invalid={!!error && error.includes("password")} />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              <Icon name={show ? "eyeOff" : "eye"} size={18} />
            </button>
          </span>
        </label>

        {up && (
          <label className="field" htmlFor="login-confirm">
            <span>Type the password again</span>
            <input id="login-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} onKeyDown={onEnter} />
          </label>
        )}

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="button" className="btn primary sign-in" disabled={busy} onClick={() => submit()}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="arrow" size={18} />}
          <span>{busy ? (up ? "Creating your account…" : "Signing in…") : up ? "Create my account" : "Sign in"}</span>
        </button>

        <p className="login-note">
          {up
            ? "You will sign in with this email and password. Your role is fixed when you create the account."
            : "No account yet? Choose “Create an account” above."}
          {" "}{connected ? "Accounts are kept in the shared sign-in." : "Accounts are kept on this device only."}
        </p>
      </form>

      <button type="button" className="homes-link" onClick={() => setShared((v) => !v)} aria-expanded={shared}>
        <Icon name="lock" size={18} /><span>{connected ? "Shared sign-in is on" : "Connect shared sign-in"}</span><Icon name="arrow" size={16} />
      </button>
      {shared && (
        <div className="login-form">
          <p className="login-note">So family and caregivers on different phones use the same accounts. Paste your Supabase project URL and anon (public) key.</p>
          <label className="field" htmlFor="sb-url"><span>Project URL</span>
            <input id="sb-url" value={sUrl} onChange={(e) => setSUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoCapitalize="none" /></label>
          <label className="field" htmlFor="sb-key"><span>Anon key</span>
            <input id="sb-key" value={sKey} onChange={(e) => setSKey(e.target.value)} autoCapitalize="none" /></label>
          <div className="btn-row">
            {connected && <button type="button" className="btn ghost" onClick={disconnect}>Turn off</button>}
            <button type="button" className="btn" onClick={connect}>Use this project</button>
          </div>
        </div>
      )}

      <button type="button" className="homes-link" onClick={() => setHomes(true)}>
        <Icon name="building" size={18} /><span>For care homes and day centres</span><Icon name="arrow" size={16} />
      </button>
      <Sheet open={homes} onClose={() => setHomes(false)} label="Agilist for care homes">
        <div className="about">
          <header className="screen-head">
            <p className="eyebrow">Our plan for care homes</p>
            <h1>One record per resident, shared by the whole care team</h1>
            <p className="sub">Not built yet. This is where we would take Agilist next.</p>
          </header>
          <ul className="homes-list">
            <li><Icon name="people" size={18} /><div><strong>All your residents in one place</strong><span>Each with their own album, notes and “how to ask him”.</span></div></li>
            <li><Icon name="clock" size={18} /><div><strong>Shift handover built in</strong><span>The night shift sees what the day shift learned, before they walk in.</span></div></li>
            <li><Icon name="smile" size={18} /><div><strong>See what helps</strong><span>Mood checks after each conversation, across residents, for care planning.</span></div></li>
            <li><Icon name="shield" size={18} /><div><strong>Consent handled once</strong><span>Mental Capacity Act and LPA records kept with each resident.</span></div></li>
          </ul>
          <section className="about-sec">
            <h3>How it's paid for</h3>
            <p className="about-note">Care homes and day centres pay per resident. Families use it free and are invited by the home.</p>
          </section>
          <section className="about-sec">
            <h3>Where we'd start</h3>
            <p className="about-note">A pilot with one day centre and one nursing home, then dementia support organisations and community care networks as referral partners.</p>
          </section>
        </div>
      </Sheet>
    </div>
  );
}
