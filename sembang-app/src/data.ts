// Types and the few fixed pieces of content Agilist ships with (stages, moods, the heritage set).

export type SceneId = "shipyard" | "tiongbahru" | "kueh" | "wedding" | "bus" | "seaside" | "wayang" | "kampung" | "trishaw" | "radio";
/** photo = the family's own; drawing = made from his words after a session; heritage = general picture of his era. */
export type PictureKind = "photo" | "drawing" | "heritage";

/** Rough dementia stage, set by the family or care team. It changes how questions are asked. */
export type Stage = "early" | "middle" | "later";
export const STAGES: { id: Stage; label: string; how: string }[] = [
  { id: "early", label: "Early", how: "Open questions. Let him lead the story." },
  { id: "middle", label: "Middle", how: "One idea at a time. Offer a choice of two." },
  { id: "later", label: "Later", how: "Yes or no, and the senses: sounds, smells, food." },
];

/** The 10-second check after a session. */
export type Mood = "brighter" | "same" | "quieter" | "upset";
export const MOODS: { id: Mood; label: string }[] = [
  { id: "brighter", label: "Brighter" },
  { id: "same", label: "About the same" },
  { id: "quieter", label: "Quieter" },
  { id: "upset", label: "Upset" },
];

export interface Photo {
  id: string;
  scene: SceneId;
  kind: PictureKind;
  title: string;
  year: string;
  tags: string[];
  memory?: string;
  /** A thank-you from the family to the care team, sent with this photo. */
  thanks?: string;
  shared: boolean;
  addedBy: string;
  addedOn: string;
  context: string;
  /** Open questions, for the early stage. Invitations, never tests of memory. */
  questions: string[];
  /** One idea at a time, for the middle stage. */
  simple?: string[];
  /** Yes/no and sensory, for the later stage and for "Show him". */
  yesno?: string[];
  careWarning?: string;
  isNew?: boolean;
  /** A drawing written by the AI from an approved note (already cleaned). Absent for the pre-drawn scenes. */
  svg?: string;
  /** A photo uploaded from the family's own device (shrunk JPEG data URL). Absent for the built-in sample scenes. */
  src?: string;
  /** Drawings only: whether the family has confirmed it matches his memory. */
  check?: "pending" | "ok" | "fix";
  correction?: string;
}

export interface Note {
  id: string;
  date: string;
  author: string;
  topic: string;
  body: string;
  tags: string[];
  newDetail?: boolean;
  familyHadNotHeard?: boolean;
  fresh?: boolean;
  mood?: Mood;
  upset?: boolean;
  /** A short word from the caregiver to the family, sent with this note. Not part of his stories. */
  toFamily?: string;
  /** The picture this conversation was about, so his stories can be gathered by memory. */
  photoId?: string;
  /** A question for next time, when AI suggested one from this conversation. */
  next?: string;
}

export const SUGGESTED_TAGS = [
  "work", "family", "food", "school", "friends", "wedding", "kampung", "holiday", "CNY", "NS", "hawker", "bus",
];

/** Picks the questions that suit his stage. Falls back to gentle general ones. */
export function askFor(photo: Pick<Photo, "questions" | "simple" | "yesno">, stage: Stage): string[] {
  if (stage === "early") return photo.questions;
  if (stage === "middle") return photo.simple ?? ["Tell me about this picture.", "Was it a happy time, or a hard one?", "What do you notice first?"];
  return photo.yesno ?? ["Do you like this picture?", "Is it a happy one?", "Shall we look at another?"];
}

export const CALM_PHRASE = { roman: "M̄-bián kiann, guá tī-leh.", han: "毋免驚，我佇咧。", meaning: "Don't worry, I'm here." };

/**
 * Agilist's own heritage set: general pictures of everyday Singapore from his era, drawn for
 * the app. They help on day one, before the family has added anything. They are never
 * presented as his own photos.
 */
export const HERITAGE: Photo[] = [
  {
    id: "h-kampung",
    scene: "kampung",
    kind: "heritage",
    title: "A kampung house",
    year: "1950s",
    tags: ["kampung", "attap", "1950s"],
    shared: true,
    addedBy: "Agilist heritage set",
    addedOn: "",
    context:
      "Before HDB flats, many families lived in kampungs: wooden houses on stilts with attap or zinc roofs, chickens underneath and doors left open. This is a general picture of the time, not his own home.",
    questions: ["Did you ever live in a house like this?", "What did people do after dark in the kampung?", "Tell me about the neighbours."],
    simple: ["Tell me about houses like this.", "Was it hot or cool inside?", "What animals were there?"],
    yesno: ["Have you seen a house like this?", "Was it noisy at night?", "Did you like it there?"],
  },
  {
    id: "h-trishaw",
    scene: "trishaw",
    kind: "heritage",
    title: "Trishaws on the street",
    year: "1960s",
    tags: ["trishaw", "shophouses", "1960s"],
    shared: true,
    addedBy: "Agilist heritage set",
    addedOn: "",
    context:
      "Trishaws were an everyday ride in the 1950s and 60s: a bicycle with a sidecar, pedalled past the shophouses. Many men of his generation rode in one, or knew someone who pedalled one.",
    questions: ["Tell me about riding in a trishaw.", "Where would you go in one?", "What did the street sound like?"],
    simple: ["Tell me about this street.", "Fast or slow?", "What shops were there?"],
    yesno: ["Did you ride in one of these?", "Was the street busy?", "Was it hot in the sun?"],
  },
  {
    id: "h-radio",
    scene: "radio",
    kind: "heritage",
    title: "Rediffusion at home",
    year: "1960s",
    tags: ["Rediffusion", "radio", "evenings"],
    shared: true,
    addedBy: "Agilist heritage set",
    addedOn: "",
    context:
      "Rediffusion was a cable radio service. A wooden speaker box in the living room played dialect stories, songs and news, and families gathered round it in the evening.",
    questions: ["What did your family listen to in the evening?", "Tell me about the stories on the radio.", "Who sat with you to listen?"],
    simple: ["Tell me about the radio.", "Stories or songs?", "Who listened with you?"],
    yesno: ["Did you have a radio like this?", "Did you listen at night?", "Did you like the stories?"],
  },
];

/** Today's date as it is shown and kept on notes and photos, e.g. "2 Nov 2026". */
export const today = () => new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
