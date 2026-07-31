/**
 * The Task 2 attempt model.
 *
 * Pure functions only at this stage: the word-count rule, the clock format and
 * the one word target. Draft persistence and the attempt record land here next,
 * which is why they are not in the component — the rule that decides whether a
 * draft counts as empty must be the same one the readout shows, or the button
 * and the counter can disagree about the same text.
 *
 * Separate from `writing-session.ts`, which models a Directus *set* of one or
 * two tasks keyed by slug. That path is being retired and its stored sessions
 * stay readable under their own key; nothing here touches them.
 */

/** Task 2 asks for at least 250 words. */
export const T2_WORD_TARGET = 250;

/**
 * Words in an English essay: whitespace-delimited tokens that contain at least
 * one letter or digit.
 *
 * Carried over verbatim from `writing-session.ts` so the two Writing surfaces
 * can never report different counts for the same text. Consequences worth being
 * explicit about, since this number is what a learner is judged against:
 *
 *  - `well-being` is **one** word. Nothing splits on the hyphen, which is the
 *    convention IELTS itself uses.
 *  - `don't` is one word.
 *  - a token of pure punctuation — a stray `—` or `-` on its own — counts as
 *    **zero**. The export's rule (`split(/\s+/).length`) counts it as one, which
 *    would let a line of dashes read as progress toward 250.
 *  - CJK text has no spaces, so a Chinese paragraph counts as one word. That is
 *    correct for this surface: the task is an English essay.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/**
 * `00:04:12` — hours:minutes:seconds, counting up, hours always padded.
 *
 * The export's format. Counting up rather than down, in neutral grey with no
 * threshold and no colour change, is writing-spec §五.5 and the same rule
 * Reading and Listening follow.
 */
export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(
    Math.floor((seconds % 3600) / 60),
  )}:${pad(seconds % 60)}`;
}
