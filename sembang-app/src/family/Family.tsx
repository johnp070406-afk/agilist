import { NoteTools, TidyBar, useTidy } from "../components/Tidy";
import { useEffect, useRef, useState } from "react";
import { HERITAGE, MOODS, SUGGESTED_TAGS, today, type Note, type Photo } from "../data";
import { cloud } from "../config";
import { JoinFamily } from "../components/JoinFamily";
import { setElderName, setSharing } from "../sync";
import { EmojiRow, withEmoji } from "../components/EmojiRow";
import { buildPreview } from "../ai";
import { aiPreview, getSample, type AIPreview } from "../realAI";
import { useStore } from "../store";
import { Icon } from "../components/Icons";
import { Button, Picture, ScreenHead, Sheet, scrollInPhone, TagChips, TagInput, Toggle, buzz, useStagger } from "../components/UI";
import { ResultCard } from "../caregiver/ResultCard";

/* ---------------- album ---------------- */

export function FamilyAlbum() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState<Photo | null>(null);
  const [sheet, setSheet] = useState(false);
  const own = state.photos.filter((p) => p.from !== "friend");
  const friends = state.photos.filter((p) => p.from === "friend");
  const waiting = friends.filter((p) => !p.shared).length;
  const sharedCount = own.filter((p) => p.shared).length;

  useEffect(() => {
    if (state.fam.highlightId) scrollInPhone(document.getElementById(`tile-${state.fam.highlightId}`), "center");
  }, [state.fam.highlightId]);

  const live = open ? state.photos.find((p) => p.id === open.id) ?? open : null;
  const pending = state.photos.filter((p) => p.kind === "drawing" && p.check === "pending");
  const careWord = state.notes.find((n) => n.toFamily);
  const detail = live && (
      <div className="stack">
        <div className="share-row">
          <div>
            <strong>Share with the care team</strong>
            <span>{live.shared ? `The care team can see this` : "Only the family can see this"}</span>
          </div>
          <Toggle on={live.shared} label="Share with the care team" onChange={() => dispatch({ type: "toggleShare", id: live.id })} />
        </div>
        <p className="eyebrow preview-label">What the caregiver sees</p>
        <ResultCard photo={live} />
      </div>
  );

  return (
    <div className="stack">
      <Sheet open={sheet} onClose={() => setSheet(false)} label={live?.title ?? "Photo"}>{detail}</Sheet>
      <header className="screen-head">
        <p className="eyebrow">Family{state.user ? ` · ${state.user.name}` : ""}</p>
        <h1>{state.elderName ? `${state.elderName}'s album` : "The family album"}</h1>
        <p className="sub">{sharedCount} of {own.length} shared with the care team. A few hashtags per photo is enough.</p>
      </header>

      <ElderName />

      {careWord && (
        <section className="thanks-card" aria-label="A word from the care team">
          <p className="eyebrow"><Icon name="smile" size={13} /> From the care team</p>
          <p className="thanks-text">“{careWord.toFamily}”</p>
          <p className="thanks-by">{careWord.author} · {careWord.date}</p>
        </section>
      )}

      {pending.map((p) => <CheckDrawing key={p.id} photo={p} />)}

      <Button icon="plus" onClick={() => dispatch({ type: "openAdd" })}>Add a photo</Button>

      {own.length === 0 && <p className="hint">No photos yet. Choose a photo from this device to start the album.</p>}

      <ul className="grid">
        {own.map((p) => (
          <li key={p.id} id={`tile-${p.id}`} className={state.fam.highlightId === p.id ? "highlight" : ""}>
            <div className="tile">
              <button type="button" className="tile-open" onClick={() => { setOpen(p); setSheet(true); }} aria-label={`Open ${p.title}`}>
                <Picture photo={p} size="thumb" />
                <span className="tile-title">{p.title}</span>
              </button>
              <div className="tile-share">
                <span className={p.shared ? "on" : ""}>{p.shared ? "Shared" : "Family only"}</span>
                <Toggle on={p.shared} label={`Share ${p.title} with the care team`} onChange={() => dispatch({ type: "toggleShare", id: p.id })} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {friends.length > 0 && (
        <section className="friends-sec" aria-labelledby="friends-h">
          <h2 id="friends-h">From his friends</h2>
          <p className="sub">{waiting > 0 ? `${waiting} waiting for you. Turn one on to let the care team use it in conversations.` : "Photos his friends have sent. Turn one off to hide it from the care team."}</p>
      <ul className="grid">
          {friends.map((p) => (
            <li key={p.id} id={`tile-${p.id}`} className={state.fam.highlightId === p.id ? "highlight" : ""}>
              <div className="tile">
                <button type="button" className="tile-open" onClick={() => { setOpen(p); setSheet(true); }} aria-label={`Open ${p.title}`}>
                  <Picture photo={p} size="thumb" />
                  <span className="tile-title">{p.title}</span>
                  <span className="tile-sub">From {p.addedBy}</span>
                </button>
                <div className="tile-share">
                  <span className={p.shared ? "on" : ""}>{p.shared ? "Shared" : "Not yet"}</span>
                  <Toggle on={p.shared} label={`Share ${p.title} with the care team`} onChange={() => dispatch({ type: "toggleShare", id: p.id })} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        </section>
      )}
    </div>
  );
}

// The family confirms a drawing before it's used to open a conversation.
function CheckDrawing({ photo }: { photo: Photo }) {
  const { dispatch } = useStore();
  const [fixing, setFixing] = useState(false);
  const [text, setText] = useState("");
  return (
    <section className="check-card" aria-label="Check this drawing">
      <p className="eyebrow"><Icon name="brush" size={13} /> The care team asks you to check a drawing</p>
      <div className="check-body">
        <div className="check-thumb"><Picture photo={photo} size="thumb" /></div>
        <div>
          <strong>{photo.title}</strong>
          <p>Drawn from what he described. Does it match what you know?</p>
        </div>
      </div>
      {fixing ? (
        <div className="check-fix">
          <label className="field" htmlFor="fix-text">
            <span>What's different?</span>
            <input id="fix-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="The stage was by the canal, not the temple" />
          </label>
          <div className="btn-row">
            <Button variant="ghost" onClick={() => setFixing(false)}>Cancel</Button>
            <Button disabled={!text.trim()} onClick={() => dispatch({ type: "checkDrawing", id: photo.id, ok: false, correction: text.trim() })}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          <Button variant="ghost" onClick={() => setFixing(true)}>Not quite</Button>
          <Button icon="check" onClick={() => { buzz(10); dispatch({ type: "checkDrawing", id: photo.id, ok: true }); }}>Looks right</Button>
        </div>
      )}
    </section>
  );
}

/* ---------------- add a photo ---------------- */

const MAX_SIDE = 900;

/** Reads a photo from the device and shrinks it to a JPEG of at most 900 px, so many photos fit on the device. */
async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a picture. Choose a photo.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => no(new Error("This photo can't be opened here. Try a JPEG or PNG."));
      i.src = url;
    });
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const g = c.getContext("2d");
    if (!g) throw new Error("This browser can't prepare the photo.");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AddPhoto() {
  const { state, dispatch } = useStore();
  const [src, setSrc] = useState<string | null>(null);
  const [pickError, setPickError] = useState("");
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [memory, setMemory] = useState("");
  const [thanks, setThanks] = useState("");
  const friend = state.role === "friend";
  const [shared, setShared] = useState(!friend);
  const [stage, setStage] = useState<"pick" | "form" | "working" | "preview">("pick");
  const [ai, setAi] = useState<AIPreview | null>(null);
  const [live, setLive] = useState(false);
  useEffect(() => { getSample().then((s) => setLive(!!s)); }, []);

  // With real AI available, Claude writes the background and questions from the hashtags.
  // Without it, general questions are shown instead (see ai.ts), after a short pause.
  useEffect(() => {
    if (stage !== "working") return;
    let alive = true;
    const started = Date.now();
    aiPreview(title, year, tags, memory).then((r) => {
      if (!alive) return;
      setAi(r);
      const wait = Math.max(0, 1700 - (Date.now() - started));
      setTimeout(() => alive && setStage("preview"), wait);
    });
    return () => { alive = false; };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPickError("");
    setReading(true);
    try {
      setSrc(await shrinkPhoto(file));
      setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 60));
      setYear(""); setTags([]); setMemory(""); setThanks("");
      setStage("form");
    } catch (e) {
      setPickError(e instanceof Error ? e.message : "This photo can't be opened here.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const draftId = useRef(Date.now());
  const preview = buildPreview(title, year, tags);
  const draft: Photo = {
    id: `p-${draftId.current}`,
    scene: "bus",
    src: src ?? undefined,
    kind: "photo",
    title: title.trim() || "Untitled photo",
    year: year.trim() || "Year unknown",
    tags,
    memory: memory.trim() || undefined,
    thanks: friend ? undefined : thanks.trim() || undefined,
    shared: friend ? false : shared,
    from: friend ? "friend" : "family",
    addedBy: state.user?.name ?? (friend ? "A friend" : "Family"),
    addedOn: today(),
    context: ai?.context ?? preview.context,
    questions: ai?.questions ?? preview.questions,
    simple: ai?.simple.length ? ai.simple : undefined,
    yesno: ai?.yesno.length ? ai.yesno : undefined,
    isNew: true,
  };

  if (stage === "pick") {
    return (
      <div className="stack">
        <ScreenHead title="Add a photo" sub="Choose a photo from this device." onBack={() => dispatch({ type: "closeAdd" })} />
        <input ref={fileRef} id="photo-file" className="sr-only" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button icon="plus" disabled={reading} onClick={() => fileRef.current?.click()}>{reading ? "Opening the photo…" : "Choose a photo"}</Button>
        {pickError && <p className="login-error" role="alert">{pickError}</p>}
        <p className="hint">{friend ? "The family sees it first and decides whether the care team can use it." : "Only the family and, if you share it, the care team can see it."}</p>
      </div>
    );
  }

  if (stage === "working") return <Working draft={draft} live={live} />;

  if (stage === "preview") {
    return (
      <div className="stack">
        <ScreenHead eyebrow="Preview" title={"What the caregiver will see"} sub="The background and questions were written from your hashtags." onBack={() => setStage("form")} />
        <p className={`ai-source ${ai ? "live" : ""}`}>
          <Icon name="sparkle" size={15} />
          {ai ? "Written by Claude just now, from your hashtags. Edit the hashtags to try again." : live ? "AI couldn't answer just now, so these are general questions. Go back and try again." : "AI is off here, so these are general questions that are not written for this photo. Sign in with the shared sign-in to let AI write them."}
        </p>
        <ResultCard photo={draft} />
        {friend ? (
          <p className="hint">The family will check this photo before the care team can use it.</p>
        ) : (
          <div className="share-row">
            <div>
              <strong>Share with the care team</strong>
              <span>{shared ? `The care team can see this` : "Only the family can see this"}</span>
            </div>
            <Toggle on={shared} onChange={setShared} label="Share with the care team" />
          </div>
        )}
        <div className="btn-row">
          <Button variant="ghost" onClick={() => setStage("form")}>Edit</Button>
          <Button icon="check" onClick={() => dispatch({ type: "addPhoto", photo: draft })}>{friend ? "Send to the family" : "Save to album"}</Button>
        </div>
      </div>
    );
  }

  // form
  return (
    <div className="stack">
      <ScreenHead title="Tag this photo" sub="Hashtags, not paragraphs. We'll write the rest." onBack={() => setStage("pick")} />
      {src && <Picture photo={draft} />}

      <div className="field-row">
        <label className="field grow" htmlFor="ph-title">
          <span>What is it?</span>
          <input id="ph-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${state.elderName || "Dad"} at the shipyard`} />
        </label>
        <label className="field year" htmlFor="ph-year">
          <span>Year</span>
          <input id="ph-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1972" inputMode="numeric" />
        </label>
      </div>

      <div className="field">
        <span>Hashtags</span>
        <TagInput tags={tags} onChange={setTags} suggestions={SUGGESTED_TAGS} />
      </div>

      <label className="field" htmlFor="ph-memory">
        <span>One line about it <em>(optional)</em></span>
        <input id="ph-memory" value={memory} onChange={(e) => setMemory(e.target.value)} placeholder={friend ? "We sang in the church choir together." : "Dad's first job. He worked there 31 years."} />
      </label>

      {!friend && (
        <>
          <label className="field" htmlFor="ph-thanks">
            <span>A thank-you for the care team <em>(optional)</em></span>
            <input id="ph-thanks" value={thanks} onChange={(e) => setThanks(e.target.value)} maxLength={160} placeholder={`Thank you for sitting with ${state.elderName || "Dad"} every day.`} />
          </label>
          <EmojiRow label="Add a feeling to the thank-you" onPick={(e) => setThanks((t) => withEmoji(t, e))} />

          <div className="share-row">
            <div>
              <strong>Share with the care team</strong>
              <span>{shared ? `The care team can see this` : "Only the family can see this"}</span>
            </div>
            <Toggle on={shared} onChange={setShared} label="Share with the care team" />
          </div>
        </>
      )}

      {live && <p className="ai-source live"><Icon name="sparkle" size={15} />Live AI is on. Try your own title and hashtags: Claude writes the background and questions.</p>}
      <Button icon="sparkle" disabled={tags.length === 0} onClick={() => { setAi(null); setStage("working"); }}>
        Prepare for the caregiver
      </Button>
      {tags.length === 0 && <p className="hint">Add at least one hashtag first.</p>}
    </div>
  );
}

function Working({ draft, live }: { draft: Photo; live: boolean }) {
  const steps = useStagger(live ? 2 : 3, 420, 100);
  return (
    <div className="stack center-stack">
      <div className="working-pic"><Picture photo={draft} size="thumb" /></div>
      <h1 className="working-title">Preparing it for the caregiver</h1>
      {live && <p className="sub">Claude is writing it now. This takes a few seconds.</p>}
      <ul className="work-steps" aria-live="polite">
        {["Reading your hashtags", "Adding the background she'd need", "Drafting three questions"].map((t, i) => (
          <li key={t} className={i < steps ? "done" : ""}>
            <span className="ws-dot">{i < steps ? <Icon name="check" size={12} /> : null}</span>{t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- from the home ---------------- */

function MoodTrend() {
  const { state } = useStore();
  const rated = state.notes.filter((n) => n.mood).slice(0, 6);
  if (rated.length === 0) return null;
  const brighter = rated.filter((n) => n.mood === "brighter").length;
  return (
    <section className="trend" aria-labelledby="trend-h">
      <h2 id="trend-h">After each conversation</h2>
      <p className="trend-sum"><strong>{brighter} of the last {rated.length}</strong> left him brighter.</p>
      <ol className="trend-row">
        {[...rated].reverse().map((n) => (
          <li key={n.id} className={n.mood}>
            <span className="trend-bar" aria-hidden="true" />
            <span className="trend-label">{MOODS.find((m) => m.id === n.mood)!.label}</span>
            <span className="trend-date">{n.date}</span>
          </li>
        ))}
      </ol>
      <p className="hint">From the caregiver's 10-second check after each conversation.</p>
    </section>
  );
}

export function FromHome() {
  const { state } = useStore();
  const tidy = useTidy();
  const unheard = state.notes.filter((n) => n.familyHadNotHeard).length;
  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">From the home</p>
        <h1>{state.elderName ? `What ${state.elderName} said` : "What he said"}</h1>
        <p className="sub">Things he told the people who were with him. {unheard > 0 && `${unheard} you hadn't heard before.`}</p>
      </header>
      <MoodTrend />
      <TidyBar tidy={tidy} />
      <ol className="note-list">
        {state.notes.map((n) => (
          <li key={n.id}>
            <article className={`note ${n.fresh ? "fresh" : ""} ${tidy.sel.includes(n.id) ? "picked" : ""}`}>
              <NoteTools tidy={tidy} id={n.id} />
              <div className="note-head">
                <h2>{n.topic}</h2>
                <span className="mono-small">{n.date}</span>
              </div>
              {n.familyHadNotHeard && <span className="pill amberless">You hadn't heard this</span>}
              {n.upset && <span className="pill">Got upset, then settled</span>}
              <p>{n.body}</p>
              {n.toFamily && <p className="thanks"><Icon name="smile" size={16} /><span>“{n.toFamily}” <cite>{n.author}, to you</cite></span></p>}
              <p className="note-by">Told to {n.author}</p>
            </article>
          </li>
        ))}
      </ol>
      {state.notes.length === 0 && <p className="hint">No notes yet. New ones appear here after each conversation.</p>}
    </div>
  );
}

/* ---------------- consent ---------------- */

export function Consent() {
  const { state, dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // With the shared album, the server stops sending the care team anything while sharing is paused.
  const share = async (on: boolean) => {
    setErr("");
    if (cloud() && state.link) {
      setBusy(true);
      try {
        await setSharing(!on);
        dispatch({ type: "setLink", link: { ...state.link, paused: !on } });
      } catch (e) {
        setBusy(false);
        return setErr(e instanceof Error ? e.message : "Sharing could not be changed. Try again.");
      }
      setBusy(false);
    }
    setConfirming(false);
    dispatch({ type: "consent", on });
  };

  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">Consent and access</p>
        <h1>Who can see what</h1>
      </header>

      <section className="who-agreed" aria-labelledby="agreed-h">
        <h3 id="agreed-h">Who decides what is shared</h3>
        <p className="hint">{state.user ? `${state.user.name}'s family account` : "The family account"} decides which photos the care team sees, photo by photo, and can pause all sharing below at any time.</p>
        <p className="hint">Agilist does not hold his own consent or any Lasting Power of Attorney. Keep those records with his care provider, and ask again if his health changes.</p>
      </section>

      {state.link && (
        <section className="who-agreed" aria-labelledby="link-h">
          <h3 id="link-h">Care team code</h3>
          <p className="hint">Give this code to each caregiver. They enter it on their Home screen after they sign in.</p>
          <p className="join-code" aria-label={`Code ${state.link.joinCode.split("").join(" ")}`}>{state.link.joinCode}</p>
          {state.syncError && <p className="login-error" role="alert">{state.syncError}</p>}
        </section>
      )}

      <section className={`consent-status ${state.consent ? "on" : "off"}`}>
        <Icon name="shield" size={22} />
        <div>
          <strong>{state.consent ? "Sharing is on" : "Sharing is paused"}</strong>
          <span>
            {state.consent
              ? "The care team sees only the photos you have shared."
              : "The care team can't see the album or notes, and sessions are off."}
          </span>
        </div>
      </section>

      <section className="rules">
        <h3>The care team can</h3>
        <ul>
          <li><Icon name="check" size={15} />See the photos you have shared</li>
          <li><Icon name="check" size={15} />Read and add notes from conversations</li>
        </ul>
        <h3>They can't</h3>
        <ul className="no">
          <li><Icon name="x" size={15} />See photos you haven't shared, or photos from friends you haven't turned on</li>
          <li><Icon name="x" size={15} />See anything while sharing is paused</li>
        </ul>
        <p className="hint">The app can't stop someone from taking a screenshot of a photo they can see. Share only what you're comfortable with.</p>
        <h3>Recordings</h3>
        <ul>
          <li><Icon name="trash" size={15} />Agilist never stores audio. The phone's or browser's speech service turns speech into text as it is spoken.</li>
          <li><Icon name="check" size={15} />A note is saved only when the caregiver approves it.</li>
        </ul>
      </section>

      <section className="rules" aria-labelledby="pdpa-h">
        <h3 id="pdpa-h">His data (PDPA)</h3>
        <ul>
          <li><Icon name="lock" size={15} />Photos and notes are kept on Agilist's server (Supabase, West EU region, Ireland).</li>
          <li><Icon name="sparkle" size={15} />To pick pictures and write notes, what was said and the photo details are sent to Claude (Anthropic) to be processed.</li>
          <li><Icon name="check" size={15} />You can delete any note under From home, and turn any photo off at any time.</li>
        </ul>
      </section>

      {state.consent ? (
        confirming ? (
          <div className="confirm">
            <p>Pause sharing? Within about 15 seconds the care team stops receiving photos and notes. You can turn it back on any time.</p>
            <div className="btn-row">
              <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" disabled={busy} onClick={() => share(false)}>{busy ? "Pausing…" : "Pause sharing"}</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>Withdraw consent</Button>
        )
      ) : (
        <Button icon="check" disabled={busy} onClick={() => share(true)}>{busy ? "Turning it on…" : "Turn sharing back on"}</Button>
      )}
      {err && <p className="login-error" role="alert">{err}</p>}
    </div>
  );
}

/* ---------------- a friend's side ---------------- */

// Church friends and old friends add photos of times they shared with him. The family approves each one.
export function FriendHome() {
  const { state, dispatch } = useStore();
  const mine = state.photos.filter((p) => p.from === "friend");
  const needsCode = !!cloud() && !state.link;
  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">Friend{state.user ? ` · ${state.user.name}` : ""}</p>
        <h1>Photos for him</h1>
        <p className="sub">Old photos of times you spent together give him more to talk about. The family checks each one before the care team uses it.</p>
      </header>
      <JoinFamily intro="Ask his family for their 6-character code. Then you can send photos for him." />
      <Button icon="plus" disabled={needsCode} onClick={() => dispatch({ type: "openAdd" })}>Add a photo</Button>
      {needsCode && <p className="hint">Enter the family's code first.</p>}
      {mine.length === 0 ? (
        !needsCode && <p className="hint">You haven't sent any photos yet.</p>
      ) : (
        <ul className="grid">
          {mine.map((p) => (
            <li key={p.id}>
              <div className="tile">
                <Picture photo={p} size="thumb" />
                <span className="tile-title">{p.title}</span>
                <span className={`pill ${p.shared ? "green" : ""}`}>{p.shared ? "The care team can use it" : "Waiting for the family"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- his stories (oral history) ---------------- */

// What he has told the people who sit with him, gathered by the memory it was about.
// Built only from notes a caregiver approved. Text only: no recording is ever kept.
export function Stories() {
  const { state } = useStore();
  const pool = [...state.photos, ...HERITAGE];
  const groups: { photo: Photo | null; notes: Note[] }[] = [];
  for (const n of state.notes) {
    const photo = n.photoId ? pool.find((p) => p.id === n.photoId) ?? null : null;
    const g = groups.find((x) => (x.photo?.id ?? null) === (photo?.id ?? null));
    if (g) g.notes.push(n); else groups.push({ photo, notes: [n] });
  }
  // Memories with a picture first, in the order he last talked about them; the rest at the end.
  groups.sort((a, b) => (a.photo ? 0 : 1) - (b.photo ? 0 : 1));
  return (
    <div className="stack">
      <header className="screen-head">
        <p className="eyebrow">Oral history</p>
        <h1>His stories</h1>
        <p className="sub">What he has told the people who sit with him, gathered by memory. Only notes a caregiver approved are here.</p>
      </header>
      {groups.length === 0 && <p className="hint">No stories yet. They appear here after each conversation a caregiver approves.</p>}
      {groups.map((g) => (
        <section key={g.photo?.id ?? "other"} className="story-group" aria-label={g.photo?.title ?? "Other conversations"}>
          <div className="story-head">
            {g.photo && <div className="story-thumb"><Picture photo={g.photo} size="thumb" /></div>}
            <div>
              <h2>{g.photo?.title ?? "Other conversations"}</h2>
              <span className="mono-small">{g.notes.length === 1 ? "1 story" : `${g.notes.length} stories`}</span>
            </div>
          </div>
          <ol className="story-list">
            {g.notes.map((n) => (
              <li key={n.id}>
                <p>{n.body}</p>
                <span>{n.date} · told to {n.author}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ---------------- what the family calls him ---------------- */

// Asked once, at the top of the album, and easy to change. Everyone on the care team sees it.
function ElderName() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const has = !!state.elderName;
  const save = async () => {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true); setErr("");
    dispatch({ type: "elderName", name });
    if (cloud() && state.link) {
      try { await setElderName(name); }
      catch (e) { setErr(e instanceof Error ? e.message : "The name could not be shared. Try again."); setBusy(false); return; }
    }
    setBusy(false); setEditing(false);
  };
  if (has && !editing) {
    return <button type="button" className="name-change" onClick={() => { setDraft(state.elderName); setEditing(true); }}><Icon name="user" size={14} />This album is for {state.elderName}. Change</button>;
  }
  return (
    <section className="carry" aria-label="Who is this album for">
      <p className="eyebrow">Who is this album for?</p>
      <p className="carry-body">What do you call him? The care team will see this name on their screens.</p>
      <label className="field" htmlFor="elder-name">
        <span>His name</span>
        <span className="type-row">
          <input id="elder-name" value={draft} maxLength={40} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Dad, Ah Gong, Mr Tan" autoComplete="off" />
          <button type="button" className="btn" disabled={busy || !draft.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        </span>
      </label>
      {err && <p className="login-error" role="alert">{err}</p>}
      {has && <button type="button" className="btn ghost" onClick={() => { setEditing(false); setErr(""); }}>Cancel</button>}
    </section>
  );
}
