import { useEffect, useRef, useState } from "react";
import { useStore, type CareTab, type FamTab } from "./store";
import { Icon } from "./components/Icons";
import { BottomNav, Button, Sheet, StatusBar, Toast, buzz } from "./components/UI";
import { CareHome } from "./caregiver/Home";
import { LiveSession } from "./caregiver/LiveSession";
import { aiSource, getSample, setApiKey, type AISource } from "./realAI";
import { Loop, Review } from "./caregiver/Review";
import { CareAlbum, CareNotes } from "./caregiver/Tabs";
import { AddPhoto, Consent, FamilyAlbum, FromHome, Stories } from "./family/Family";
import { Login } from "./Login";
import { restore, signOut } from "./auth";
import { useSync } from "./useSync";
import { cloud } from "./config";

type Theme = "light" | "dark" | null;

const MOBILE_QUERY = "(max-width: 520px)";
function useIsMobile() {
  const [m, setM] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

const CAPTIONS: Record<string, [string, string]> = {
  login: ["Sign in", "Each person signs in to their own side: family or caregiver."],
  "care/home": ["Caregiver home", "One button and nothing to learn. She presses it before the conversation, not during it."],
  "care/live": ["Real microphone", "What is said appears as it's recognised. When the words point to a photo, the card comes up on its own."],
  "care/review": ["AI 3 · memory", "The recording is deleted first. The note is drafted, but nothing is saved until she approves it."],
  "care/loop": ["The loop", "The approved note feeds the next session's questions, the night shift and the family."],
  "care/notes": ["Continuity", "His memories stay with him when caregivers change."],
  "care/album": ["Three sources", "Family photos are prints. Drawings have a dashed amber edge. The heritage set covers day one, before the family has added anything."],
  "family/album": ["Family side", "The family decides what the care team sees, photo by photo."],
  "family/add": ["AI 1 · context", "A few hashtags in, background and questions for the caregiver out."],
  "family/home": ["What comes back", "Things her father said that she had never heard, and how he felt after each conversation."],
  "family/stories": ["Oral history", "His stories in his own words, gathered by memory from the notes caregivers approved."],
  "family/consent": ["Consent", "Mental Capacity Act, LPA and PDPA: who agreed, who decides if he can't, and what happens to his data."],
};

export function App() {
  const { state, dispatch } = useStore();
  useSync();
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<Theme>(null);
  const [large, setLarge] = useState(false);
  const [display, setDisplay] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [aiOn, setAiOn] = useState<AISource>("none");
  useEffect(() => { getSample().then(() => setAiOn(aiSource())); }, [display, state.signedIn]);
  // Pick up where this person left off: a returning visitor stays signed in until they sign out.
  useEffect(() => {
    restore().then((user) => { if (user) dispatch({ type: "signIn", user }); }).finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const [compact, setCompact] = useState<string | null>(null);
  // iOS-style large titles: once the big heading scrolls away, a small one appears on top.
  const onScroll = () => {
    const el = scrollRef.current;
    const h = el?.querySelector(".screen-head h1") as HTMLElement | null;
    if (!el || !h) return setCompact(null);
    const gone = h.getBoundingClientRect().bottom < el.getBoundingClientRect().top + 8;
    setCompact(gone ? h.textContent : null);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", large);
  }, [large]);

  const isDark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;

  const care = state.care;
  const fam = state.fam;
  const careKey = care.view !== "home" ? care.view : care.tab;
  const famKey = fam.view === "add" ? "add" : fam.tab;
  const screenKey = !state.signedIn ? "login" : state.role === "caregiver" ? `care/${careKey}` : `family/${famKey}`;
  const [capTitle, capText] = CAPTIONS[screenKey] ?? ["", ""];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setCompact(null);
  }, [screenKey]);

  const careNav = state.signedIn && care.view === "home";
  const famNav = state.signedIn && fam.view === "album";

  let body;
  if (!state.signedIn) {
    body = <Login />;
  } else if (state.role === "caregiver") {
    if (care.view === "live") body = <LiveSession />;
    else if (care.view === "review") body = <Review />;
    else if (care.view === "loop") body = <Loop />;
    else if (care.tab === "notes") body = <CareNotes />;
    else if (care.tab === "album") body = <CareAlbum />;
    else body = <CareHome />;
  } else {
    if (fam.view === "add") body = <AddPhoto />;
    else if (fam.tab === "home") body = <FromHome />;
    else if (fam.tab === "stories") body = <Stories />;
    else if (fam.tab === "consent") body = <Consent />;
    else body = <FamilyAlbum />;
  }

  const fresh = state.notes.filter((n) => n.fresh).length;

  const who = state.user && (
    <span className="who" title={state.user.email}>
      <Icon name={state.role === "family" ? "people" : "user"} size={16} />
      <span className="who-name">{state.user.name}</span>
      <span className="who-role">{state.role === "family" ? "Family" : "Caregiver"}</span>
    </span>
  );
  const themeBtn = (
    <button type="button" className="theme-btn display-btn" onClick={() => setDisplay(true)} aria-label="Display: text size and dark mode" title="Display">
      <span aria-hidden="true">Aa</span>
    </button>
  );
  const displaySheet = (
    <Sheet open={display} onClose={() => setDisplay(false)} label="Display">
      <div className="about">
        <header className="screen-head"><h1>Display</h1></header>
        <section className="about-sec" aria-labelledby="ts-h">
          <h3 id="ts-h"><Icon name="textSize" size={16} />Text size</h3>
          <div className="seg" role="radiogroup" aria-labelledby="ts-h">
            <button type="button" role="radio" aria-checked={!large} onClick={() => { buzz(8); setLarge(false); }}>Standard</button>
            <button type="button" role="radio" aria-checked={large} onClick={() => { buzz(8); setLarge(true); }} className="seg-large">Large</button>
          </div>
        </section>
        <section className="about-sec" aria-labelledby="ai-h">
          <h3 id="ai-h"><Icon name="sparkle" size={16} />Live AI</h3>
          {aiOn === "claude" || aiOn === "server" ? (
            <p className="about-note">{aiOn === "server" ? "On. Claude answers through the Agilist server, so nothing needs to be set up on this phone." : "On. This page uses Claude through your Claude account."}</p>
          ) : (
            cloud() ? (
              // With the shared sign-in, AI comes from the server once someone is signed in: no key on the phone.
              <p className="about-note">{state.signedIn ? "Off. The Agilist server could not be reached. Check the internet connection, then open this again." : "Off until you sign in. After you sign in, Claude answers through the Agilist server."}</p>
            ) : <>
              <p className="about-note">{aiOn === "key" ? "On, using the API key saved in this browser." : "Off. Pictures are found from key words only, and notes are not written by AI. To turn it on here, paste an Anthropic API key. It's saved in this browser only. For demos, not for real use."}</p>
              {aiOn === "key" ? (
                <Button variant="ghost" icon="x" onClick={() => { setApiKey(""); setAiOn("none"); }}>Remove the key</Button>
              ) : (
                <>
                  <label className="field" htmlFor="api-key">
                    <span>Anthropic API key</span>
                    <input id="api-key" type="password" autoComplete="off" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value.trim())} placeholder="sk-ant-…" />
                  </label>
                  <Button icon="check" disabled={!keyDraft.startsWith("sk-")} onClick={() => { setApiKey(keyDraft); setKeyDraft(""); getSample().then(() => setAiOn(aiSource())); }}>Turn on live AI</Button>
                </>
              )}
            </>
          )}
        </section>
        <section className="about-sec" aria-labelledby="th-h">
          <h3 id="th-h"><Icon name={isDark ? "moon" : "sun"} size={16} />Appearance</h3>
          <div className="seg" role="radiogroup" aria-labelledby="th-h">
            <button type="button" role="radio" aria-checked={theme === null} onClick={() => setTheme(null)}>Automatic</button>
            <button type="button" role="radio" aria-checked={theme === "light"} onClick={() => setTheme("light")}>Light</button>
            <button type="button" role="radio" aria-checked={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
          </div>
        </section>
      </div>
    </Sheet>
  );
  const showNav = state.role === "caregiver" ? careNav : famNav;
  const signOutBtn = state.signedIn ? (
    <button type="button" className="theme-btn" onClick={() => { signOut(); dispatch({ type: "signOut" }); }} aria-label="Sign out" title="Sign out">
      <Icon name="logout" size={18} />
    </button>
  ) : null;
  if (!ready) return null;

  const screen = (
    <>
      <div className="scroll-wrap">
        <div className={`compact-title ${compact ? "on" : ""}`} aria-hidden="true">{compact}</div>
        <div className={`scroll ${state.role}`} ref={scrollRef} onScroll={onScroll} key={state.signedIn ? state.role : "login"}>
          <div className="screen-pad" key={screenKey}>{body}</div>
        </div>
      </div>
      {state.role === "caregiver" && careNav && (
        <BottomNav<CareTab>
          items={[
            { id: "home", label: "Home", icon: "home" },
            { id: "notes", label: "Notes", icon: "notes", badge: fresh },
            { id: "album", label: "Album", icon: "album" },
          ]}
          active={care.tab}
          onPick={(tab) => dispatch({ type: "careTab", tab })}
        />
      )}
      {state.role === "family" && famNav && (
        <BottomNav<FamTab>
          items={[
            { id: "album", label: "Album", icon: "album" },
            { id: "home", label: "From home", icon: "notes", badge: fresh },
            { id: "stories", label: "Stories", icon: "book" },
            { id: "consent", label: "Consent", icon: "shield" },
          ]}
          active={fam.tab}
          onPick={(tab) => dispatch({ type: "famTab", tab })}
        />
      )}
      <Toast />
      {displaySheet}
      <div id="sheet-host" className="sheet-host" />
    </>
  );

  // On a phone: the app itself, full screen. The role switch sits in a slim top bar on
  // screens with tabs, and disappears during a conversation so nothing distracts.
  if (mobile) {
    return (
      <div className={`app-mobile ${showNav ? "" : "focus"}`}>
        {showNav && (
          <header className="m-bar">
            <span className="m-brand">Agilist</span>
            {who}
            {themeBtn}
            {signOutBtn}
          </header>
        )}
        {screen}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="brand">
          <span className="brand-name">Agilist</span>
          <span className="brand-tag">a conversation aid for caregivers</span>
        </div>
        <div className="page-controls">
          {who}
          {themeBtn}
          {signOutBtn}
        </div>
      </header>

      <div className="phone">
        <div className="phone-screen">
          <StatusBar live={state.signedIn && state.role === "caregiver" && care.view === "live"} />
          {screen}
        </div>
      </div>

      <p className="caption" aria-live="polite">
        <strong>{capTitle}</strong>
        <span>{capText}</span>
      </p>
    </div>
  );
}
