// What the app shows for a photo when no AI is available. Nothing here pretends to know the photo:
// the background is left to the family's own words and the questions are general invitations.
// With AI on (see realAI.ts), Claude writes real background and questions from the hashtags.

export interface Preview {
  context: string;
  questions: string[];
}

export function buildPreview(title: string, year: string, _tags: string[]): Preview {
  const when = year ? ` from ${year}` : "";
  return {
    context: `A family photo${when}${title ? `: ${title}` : ""}. Agilist has no background for it yet. Ask open questions and follow the names and places he brings up.`,
    questions: [
      "Tell me about this photo.",
      "Who was with you that day?",
      "What was happening around you?",
    ],
  };
}

export function cleanTag(raw: string): string {
  return raw.replace(/^#+/, "").replace(/[,\s]+/g, "").slice(0, 28);
}
