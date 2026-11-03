import { svgUrl } from "../svg";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "../data";
import { Scene } from "../art/Scenes";
import { cleanTag } from "../ai";
import { Icon, type IconName } from "./Icons";
import { useStore } from "../store";

/* ---------- pictures: the two sources never look alike ---------- */

export function Picture({ photo, size = "full" }: { photo: Pick<Photo, "scene" | "kind" | "title" | "year"> & { svg?: string; src?: string }; size?: "full" | "thumb" }) {
  // Heritage pictures: general scenes of his era. A plain slate frame, never his own photo.
  if (photo.kind === "heritage") {
    return (
      <figure className={`heritage ${size}`}>
        <div className="heritage-art">
          <Scene scene={photo.scene} treatment="wash" label={`Heritage picture: ${photo.title}`} />
        </div>
        <figcaption className="heritage-label">
          <Icon name="building" size={size === "thumb" ? 12 : 14} />
          <span>Heritage picture · not his own photo</span>
        </figcaption>
      </figure>
    );
  }
  if (photo.kind === "drawing") {
    return (
      <figure className={`drawing ${size}`}>
        <div className="drawing-art">
          {photo.svg ? <img className="scene-svg" src={svgUrl(photo.svg)} alt={`Illustration: ${photo.title}`} /> : <Scene scene={photo.scene} treatment="wash" label={`Illustration: ${photo.title}`} />}
        </div>
        <figcaption className="drawing-label">
          <Icon name="brush" size={size === "thumb" ? 12 : 14} />
          <span>A drawing, not a photograph</span>
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className={`print ${size}`}>
      <div className="print-art">
        {photo.src
          ? <img className="print-img" src={photo.src} alt={`Photo: ${photo.title}`} />
          : <Scene scene={photo.scene} treatment="photo" label={`Photo: ${photo.title}`} />}
      </div>
      {size === "full" && <figcaption className="print-year">{photo.year}</figcaption>}
      {size === "thumb" && <span className="print-stamp">{photo.year.replace(/^.*?(\d{4}).*$/, "$1")}</span>}
    </figure>
  );
}

export function SourceChip({ kind }: { kind: Photo["kind"] }) {
  if (kind === "heritage") return <span className="source-chip heritage"><Icon name="building" size={13} />Agilist heritage set</span>;
  return kind === "drawing" ? (
    <span className="source-chip drawn"><Icon name="brush" size={13} />Drawn from his words</span>
  ) : (
    <span className="source-chip family"><Icon name="people" size={13} />Family album</span>
  );
}

/* ---------- tags ---------- */

export function TagChips({ tags, small }: { tags: string[]; small?: boolean }) {
  return (
    <ul className={`tags ${small ? "small" : ""}`} aria-label="Hashtags">
      {tags.map((t) => <li key={t}>#{t}</li>)}
    </ul>
  );
}

export function TagInput({ tags, onChange, suggestions }: { tags: string[]; onChange: (t: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const t = cleanTag(raw);
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...tags, t]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const onType = (v: string) => {
    if (v.includes(",")) {
      v.split(",").slice(0, -1).forEach(add);
      setDraft(v.split(",").pop() ?? "");
    } else setDraft(v);
  };

  const left = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className="tag-input">
      <div className="tag-field" onClick={() => inputRef.current?.focus()}>
        {tags.map((t) => (
          <span key={t} className="tag-chip">
            #{t}
            <button type="button" aria-label={`Remove #${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        <input
          id="tag-draft"
          ref={inputRef}
          value={draft}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { if (draft.trim()) { add(draft); setDraft(""); } }}
          placeholder={tags.length ? "Add another" : "#family"}
          aria-label="Add a hashtag"
          enterKeyHint="done"
        />
      </div>
      <p className="hint">Enter or comma adds a tag. Backspace removes the last one.</p>
      {left.length > 0 && (
        <div className="suggest">
          {left.slice(0, 8).map((s) => (
            <button key={s} type="button" className="suggest-chip" onClick={() => add(s)}>+ #{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- controls ---------- */

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Button({ children, onClick, variant = "primary", icon, disabled, type = "button" }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "quiet"; icon?: IconName; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <button type={type} className={`btn ${variant}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  );
}

export function ScreenHead({ eyebrow, title, sub, onBack }: { eyebrow?: string; title: string; sub?: string; onBack?: () => void }) {
  return (
    <header className="screen-head">
      {onBack && (
        <button type="button" className="back" onClick={onBack} aria-label="Back"><Icon name="back" size={20} /></button>
      )}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {sub && <p className="sub">{sub}</p>}
    </header>
  );
}

/* ---------- phone chrome ---------- */

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit", hour12: false });
}

export function StatusBar({ live = false }: { live?: boolean }) {
  const time = useClock();
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!live) { setSecs(0); return; }
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="sb-time">{time}</span>
      {/* Like an iPhone Live Activity: the island grows to show the session is listening. */}
      <span className={`sb-island ${live ? "live" : ""}`}>
        {live && (
          <>
            <span className="isl-dot" />
            <span className="isl-time">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
            <span className="isl-wave"><i /><i /><i /><i /></span>
          </>
        )}
      </span>
      <span className="sb-icons">
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="15" height="8" rx="1.8" /><rect x="22.5" y="4" width="1.8" height="4" rx="0.9" opacity="0.5" /></svg>
      </span>
    </div>
  );
}

export function BottomNav<T extends string>({ items, active, onPick }: { items: { id: T; label: string; icon: IconName; badge?: number }[]; active: T; onPick: (id: T) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Sections">
      {items.map((it) => (
        <button key={it.id} type="button" aria-current={active === it.id ? "page" : undefined} onClick={() => onPick(it.id)}>
          <span className="bn-icon">
            <Icon name={it.icon} size={22} />
            {it.badge ? <span className="bn-badge">{it.badge}</span> : null}
          </span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Toast() {
  const { state, dispatch } = useStore();
  const t = state.toast;
  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(() => dispatch({ type: "toast", text: null }), t.undo ? 8000 : 3200);
    return () => clearTimeout(timer);
  }, [t, dispatch]);
  if (!t) return null;
  return (
    <div className={`toast ${t.undo ? "long" : ""}`} role="status" key={t.id}>
      <Icon name="check" size={16} />
      <span>{t.text}</span>
      {t.undo && (
        <button type="button" className="toast-undo" onClick={() => { buzz(8); dispatch(t.undo!); }}>Undo</button>
      )}
    </div>
  );
}

/* ---------- bottom sheet (Apple Maps style): drag the handle down to close ---------- */

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    toNative({ type: "sheet", open: true });
    panel.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      toNative({ type: "sheet", open: false });
    };
  }, [open, onClose]);

  const host = typeof document !== "undefined" ? document.getElementById("sheet-host") : null;
  if (!mounted || !host) return null;

  const down = (e: RPointerEvent) => { startY.current = e.clientY; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); };
  const move = (e: RPointerEvent) => { if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current)); };
  const up = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (drag > 110) onClose();
    setDrag(0);
  };

  return createPortal(
    <div className={`sheet-layer ${shown ? "in" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} style={drag ? { opacity: Math.max(0, 1 - drag / 400) } : undefined} />
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
      >
        <div className="sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span />
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    host,
  );
}

/* ---------- full-screen overlay: "Show him" and calm mode ---------- */

// Covers the whole app screen. No drag-to-dismiss and nothing that moves on its own:
// it closes only when someone presses the clearly labelled button (or Esc / Android back).
export function Overlay({ open, onClose, label, tone = "plain", children }: { open: boolean; onClose: () => void; label: string; tone?: "plain" | "calm"; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    toNative({ type: "sheet", open: true });
    panel.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      toNative({ type: "sheet", open: false });
    };
  }, [open, onClose]);
  const host = typeof document !== "undefined" ? document.getElementById("sheet-host") : null;
  if (!open || !host) return null;
  return createPortal(
    <div ref={panel} className={`overlay ${tone}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
      {children}
    </div>,
    host,
  );
}

/* ---------- streaming text, the way AI answers arrive ---------- */

export function useStream(text: string, active: boolean, cps = 90) {
  const [n, setN] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) { setN(text.length); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; }
    setN(0);
    const step = Math.max(1, Math.round(cps / 30));
    const t = setInterval(() => setN((v) => { if (v >= text.length) { clearInterval(t); return v; } return Math.min(text.length, v + step); }), 1000 / 30);
    return () => clearInterval(t);
  }, [text, active, cps]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

/* ---------- light haptics where the device supports them ---------- */

// Inside the phone app (Expo), messages go to the native side so it can use real haptics
// and handle the Android back button. In a browser these calls are no-ops or plain vibrate.
type NativeBridge = { postMessage: (msg: string) => void };
export function toNative(msg: Record<string, unknown>) {
  const bridge = (window as unknown as { ReactNativeWebView?: NativeBridge }).ReactNativeWebView;
  if (!bridge) return false;
  try { bridge.postMessage(JSON.stringify(msg)); } catch { /* ignore */ }
  return true;
}

export function buzz(ms: number | number[] = 10) {
  if (toNative({ type: "haptic", pattern: ms })) return;
  try { navigator.vibrate?.(ms); } catch { /* not supported */ }
}

/* ---------- scrolling inside the phone only ---------- */

export function scrollInPhone(el: HTMLElement | null, align: "start" | "center" = "start") {
  if (!el) return;
  const box = el.closest(".scroll") as HTMLElement | null;
  if (!box) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
  const target = align === "center" ? top - box.clientHeight / 2 + el.offsetHeight / 2 : top - 64;
  box.scrollTo({ top: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
}

/* ---------- small animation helper ---------- */

// Reveals items one by one on mount. Returns how many are visible so far.
export function useStagger(count: number, stepMs: number, startDelay = 0) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= count; i++) timers.push(setTimeout(() => setShown(i), startDelay + i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [count, stepMs, startDelay]);
  return shown;
}
