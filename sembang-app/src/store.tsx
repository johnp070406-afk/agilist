import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { User } from "./auth";
import type { Link } from "./sync";
import { today, type Mood, type Note, type Photo, type Stage } from "./data";

export type Role = "caregiver" | "family" | "friend";
export type CareTab = "home" | "notes" | "album";
export type CareView = "home" | "live" | "review" | "loop";
export type FamTab = "album" | "home" | "stories" | "consent";
export type FamView = "album" | "add";

export interface State {
  role: Role;
  signedIn: boolean;
  /** Who is signed in. Null on the sign-in screen. */
  user: User | null;
  /** The shared album this person belongs to (shared sign-in only). */
  link: Link | null;
  /** What the family calls him. Shown on screens in place of "he" where a name reads better. */
  elderName: string;
  /** True once we have asked the shared album whether this person already belongs to one. */
  linkChecked: boolean;
  syncError: string;
  photos: Photo[];
  notes: Note[];
  care: { tab: CareTab; view: CareView; keptNoteId: string | null; seconds: number; reviewReady: boolean; drewId: string | null; upsetAt: number | null;
    /** Real-microphone sessions: what was heard, and the picture it matched. Kept in memory only. */
    transcript: string | null; livePhotoId: string | null };
  /** Set by the family or care team; changes how questions are asked. */
  stage: Stage;
  fam: { tab: FamTab; view: FamView; highlightId: string | null };
  consent: boolean;
  toast: { id: number; text: string; undo?: Action } | null;
}

export type Action =
  | { type: "signIn"; user: User }
  | { type: "signOut" }
  | { type: "setLink"; link: Link | null }
  | { type: "pulled"; photos: Photo[]; notes: Note[] }
  | { type: "syncError"; text: string }
  | { type: "careTab"; tab: CareTab }
  | { type: "keepNote"; draw: boolean; askFamily: boolean; mood?: Mood; body?: string; next?: string; title?: string; tags?: string[]; svg?: string; toFamily?: string }
  | { type: "deleteNotes"; ids: string[] }
  | { type: "setNotes"; notes: Note[] }
  | { type: "upset"; at: number }
  | { type: "startLive" }
  | { type: "endLive"; seconds: number; transcript: string; photoId: string | null }
  | { type: "stage"; stage: Stage }
  | { type: "notice"; text: string }
  | { type: "restoreReview" }
  | { type: "checkDrawing"; id: string; ok: boolean; correction?: string }
  | { type: "discardNote" }
  | { type: "finishLoop" }
  | { type: "famTab"; tab: FamTab }
  | { type: "openAdd" }
  | { type: "closeAdd" }
  | { type: "addPhoto"; photo: Photo }
  | { type: "toggleShare"; id: string }
  | { type: "consent"; on: boolean }
  | { type: "elderName"; name: string }
  | { type: "toast"; text: string | null };

const PHOTOS_KEY = "sembang-photos";
const NOTES_KEY = "sembang-notes";
const ELDER_KEY = "sembang-elder";

// Earlier versions kept built-in sample photos and notes on the device. They are dropped here.
const SAMPLE_IDS = new Set(["keppel", "tiongbahru", "kueh", "wedding", "n-1", "n-2", "n-3"]);

function load<T extends { id: string }>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]).filter((x) => !SAMPLE_IDS.has(x.id)) : fallback;
  } catch { return fallback; }
}

const initial: State = {
  role: "caregiver",
  signedIn: false,
  user: null,
  link: null,
  elderName: "",
  linkChecked: false,
  syncError: "",
  photos: [],
  notes: [],
  care: { tab: "home", view: "home", keptNoteId: null, seconds: 0, reviewReady: false, drewId: null, upsetAt: null, transcript: null, livePhotoId: null },
  stage: "early",
  fam: { tab: "album", view: "album", highlightId: null },
  consent: true,
  toast: null,
};

let toastSeq = 0;
const toast = (text: string, undo?: Action) => ({ id: ++toastSeq, text, undo });

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "signIn":
      return {
        ...state,
        role: action.user.role,
        user: action.user,
        signedIn: true,
        care: { ...state.care, tab: "home", view: "home" },
        fam: { ...state.fam, tab: "album", view: "album" },
        toast: null,
      };
    case "signOut":
      // Signing out leaves nothing of this album on the phone: the next person to sign in starts clean.
      return { ...state, signedIn: false, user: null, link: null, linkChecked: false, syncError: "", photos: [], notes: [], elderName: "", consent: true, care: { ...state.care, tab: "home", view: "home" }, fam: { ...state.fam, tab: "album", view: "album" }, toast: null };
    case "setLink":
      return { ...state, link: action.link, linkChecked: true, syncError: "", consent: action.link ? !action.link.paused : state.consent, elderName: action.link?.elder ? action.link.elder : state.elderName };
    case "elderName":
      return { ...state, elderName: action.name.trim().slice(0, 40), link: state.link ? { ...state.link, elder: action.name.trim().slice(0, 40) } : state.link };
    case "pulled":
      return { ...state, photos: action.photos, notes: action.notes, syncError: "" };
    case "syncError":
      return { ...state, syncError: action.text };
    case "careTab":
      return { ...state, care: { ...state.care, tab: action.tab, view: "home" } };
    case "startLive":
      return { ...state, care: { ...state.care, tab: "home", view: "live", keptNoteId: null, drewId: null, upsetAt: null, transcript: null, livePhotoId: null } };
    case "endLive":
      return { ...state, care: { ...state.care, view: "review", seconds: action.seconds, reviewReady: false, transcript: action.transcript, livePhotoId: action.photoId } };
    case "keepNote": {
      const note: Note = {
        id: `n-${Date.now()}`,
        date: today(),
        author: state.user?.name ?? "Caregiver",
        topic: action.title ?? "Today's conversation",
        body: action.body ?? "",
        tags: [...(action.tags ?? []), ...(state.care.upsetAt !== null ? ["got upset, settled"] : [])],
        mood: action.mood,
        next: action.next,
        photoId: state.care.livePhotoId ?? undefined,
        toFamily: action.toFamily?.trim() || undefined,
        upset: state.care.upsetAt !== null,
        newDetail: true,
        familyHadNotHeard: true,
        fresh: true,
      };
      const notes = [note, ...state.notes.map((n) => ({ ...n, fresh: false }))];
      const aiDrawn: Photo | null = action.draw && action.svg ? {
        id: `d-${Date.now()}`, scene: "wayang", kind: "drawing", svg: action.svg,
        title: note.topic, year: "As he told it", tags: note.tags.filter((t) => !t.includes(" ")).slice(0, 3),
        shared: true, addedBy: "Drawn by AI after a conversation", addedOn: today(),
        check: action.askFamily ? "pending" : undefined,
        context: `Drawn by AI from the approved note: ${note.body} Show it as a drawing and let him correct it.`,
        questions: ["Is this how it looked? Tell me what's different.", "Tell me more about this place.", action.next ?? "What else comes to mind when you see this?"],
        simple: ["Is this like it was?", "What is missing?", "Who was there?"],
        yesno: ["Is this like it was?", "Did you like it there?", "Was it a happy time?"],
        isNew: true,
      } : null;
      const drawing = aiDrawn;
      const photos = drawing ? [drawing, ...state.photos] : state.photos;
      return { ...state, notes, photos, care: { ...state.care, view: "loop", keptNoteId: note.id, drewId: drawing?.id ?? null } };
    }
    case "discardNote":
      return { ...state, care: { ...state.care, view: "home" }, toast: toast("Note discarded. Nothing was saved.", { type: "restoreReview" }) };
    case "restoreReview":
      return { ...state, care: { ...state.care, tab: "home", view: "review", reviewReady: true }, toast: null };
    case "checkDrawing": {
      const photos = state.photos.map((p) =>
        p.id === action.id ? { ...p, check: action.ok ? ("ok" as const) : ("fix" as const), correction: action.correction } : p,
      );
      return {
        ...state,
        photos,
        toast: toast(action.ok ? "Thanks. The care team will see it's been checked." : "Sent to the care team. It'll be redrawn before the next conversation."),
      };
    }
    case "finishLoop":
      return { ...state, care: { ...state.care, view: "home" } };
    case "famTab":
      return { ...state, fam: { ...state.fam, tab: action.tab, view: "album" } };
    case "openAdd":
      return { ...state, fam: { ...state.fam, tab: "album", view: "add" } };
    case "closeAdd":
      return { ...state, fam: { ...state.fam, view: "album" } };
    case "addPhoto":
      return {
        ...state,
        photos: [action.photo, ...state.photos],
        fam: { tab: "album", view: "album", highlightId: action.photo.id },
        toast: toast(action.photo.from === "friend" ? "Sent. The family will check it before the care team sees it." : action.photo.shared ? "Added and shared with the care team" : "Added to the family album only"),
      };
    case "toggleShare": {
      const photos = state.photos.map((p) => (p.id === action.id ? { ...p, shared: !p.shared } : p));
      const now = photos.find((p) => p.id === action.id);
      return { ...state, photos, toast: toast(now?.shared ? "Shared with the care team" : "Now family only", { type: "toggleShare", id: action.id }) };
    }
    case "consent":
      return {
        ...state,
        consent: action.on,
        toast: toast(action.on ? "Sharing restored" : "Consent withdrawn. The care team can no longer see the album or notes."),
      };
    case "upset":
      return { ...state, care: { ...state.care, upsetAt: state.care.upsetAt ?? action.at } };
    case "stage":
      return { ...state, stage: action.stage, toast: toast("Questions will now suit this stage") };
    case "notice":
      return { ...state, toast: toast(action.text) };
    case "deleteNotes": {
      const gone = state.notes.filter((n) => action.ids.includes(n.id));
      if (gone.length === 0) return state;
      const left = state.notes.filter((n) => !action.ids.includes(n.id));
      return {
        ...state,
        notes: left,
        toast: toast(gone.length === 1 ? "Note deleted" : `${gone.length} notes deleted`, { type: "setNotes", notes: state.notes }),
      };
    }
    case "setNotes":
      return { ...state, notes: action.notes, toast: toast("Notes restored") };
    case "toast":
      return { ...state, toast: action.text ? toast(action.text) : null };
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial, (i): State => ({
    ...i,
    photos: load<Photo>(PHOTOS_KEY, i.photos),
    notes: load<Note>(NOTES_KEY, i.notes),
    elderName: (() => { try { return localStorage.getItem(ELDER_KEY) ?? ""; } catch { return ""; } })(),
  }));
  // Photos the family added and notes the caregiver kept stay on this device between visits.
  useEffect(() => {
    try {
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(state.photos));
      localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
      localStorage.setItem(ELDER_KEY, state.elderName);
    } catch {
      dispatch({ type: "notice", text: "This device is out of space, so the latest photo or note may not be kept after you close Agilist." });
    }
  }, [state.photos, state.notes, state.elderName]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}
