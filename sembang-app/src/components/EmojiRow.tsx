import { buzz } from "./UI";

// One tap adds a feeling to a short message, for people who would rather not type.
const EMOJI: [string, string][] = [["❤️", "a heart"], ["🙏", "thank you"], ["😊", "a smile"], ["🌸", "a flower"], ["👏", "applause"], ["🤗", "a hug"]];

/** Adds an emoji to the end of `text` (kept within `max` characters). */
export const withEmoji = (text: string, e: string, max = 160) => (text.trim() ? `${text.trimEnd()} ${e}` : e).slice(0, max);

export function EmojiRow({ onPick, label }: { onPick: (emoji: string) => void; label: string }) {
  return (
    <div className="emoji-row" role="group" aria-label={label}>
      {EMOJI.map(([e, name]) => (
        <button key={e} type="button" aria-label={`Add ${name}`} title={name} onClick={() => { buzz(6); onPick(e); }}>
          <span aria-hidden="true">{e}</span>
        </button>
      ))}
    </div>
  );
}
