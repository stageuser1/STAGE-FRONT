/**
 * Pure text rules behind 记忆巩固 and 独立表达.
 *
 * Both are deterministic and offline, and both work on the *blocks* of the
 * draft rather than on a flattened string: the approved design fades and hides
 * per fragment, keeping the opening words of each one as the cue, and prints
 * the connectives in full at every level. A whole-text tokeniser cannot express
 * that, because it cannot tell where one fragment ends and the next begins.
 *
 * The rule is dumb on purpose — the first N words of what the learner wrote —
 * so the same fragment always reduces to the same cue, and nothing here makes a
 * judgement about their wording. Nothing reads a model, a service or a corpus.
 */

/* ------------------------------------------------------------------ *
 * Connectives
 * ------------------------------------------------------------------ */

/**
 * The connectives a draft block may be built from (the approved design's list).
 *
 * A closed vocabulary, not a text field: 答案构建's core rule is that the draft
 * may only be the organisation and connection of the learner's own fragments. A
 * free-text connector would be a hole in that rule — anything could be typed
 * into it. These carry no topic content, so joining fragments with them cannot
 * introduce material the learner did not write.
 */
export const CONNECTIVES = [
  "because",
  "however",
  "for example",
  "after that",
  "which means",
  "compared with",
] as const;

/**
 * The set offered before the design's list replaced it.
 *
 * Still accepted on read so a draft assembled under the old list keeps its
 * blocks — `normaliseState` drops a connective it does not recognise, which
 * would silently shorten someone's answer. Not offered anywhere: no screen
 * renders this array.
 */
const LEGACY_CONNECTIVES: readonly string[] = [
  "First of all,",
  "To begin with,",
  "Also,",
  "In addition,",
  "For example,",
  "Because of that,",
  "That is why,",
  "However,",
  "On the other hand,",
  "At the same time,",
  "In the end,",
  "Overall,",
];

const ACCEPTED = new Set<string>([...CONNECTIVES, ...LEGACY_CONNECTIVES]);

/** Whether a stored or imported block's value is a connective we will keep. */
export function isConnective(value: string): boolean {
  return ACCEPTED.has(value);
}

/* ------------------------------------------------------------------ *
 * 记忆巩固
 * ------------------------------------------------------------------ */

/**
 * Four steps of hiding, in the approved design's wording.
 *
 * The stored value is the index, so the four levels a learner already picked
 * still resolve after this rewording.
 */
export const RECALL_LEVELS = [
  { value: 0, label: "全文" },
  { value: 1, label: "淡化" },
  { value: 2, label: "隐藏" },
  { value: 3, label: "仅连接词" },
] as const;

export type RecallLevel = 0 | 1 | 2 | 3;

export function isRecallLevel(value: number): value is RecallLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** How many opening words of a fragment survive as the cue. */
export const RECALL_HEAD_WORDS = 2;

export interface SplitText {
  /** The opening words, kept at every level. */
  head: string;
  /** The remainder, faded then hidden. Empty when the fragment is short. */
  rest: string;
}

/**
 * Splits a fragment into its cue and its remainder.
 *
 * Whitespace is collapsed on the join so a fragment typed across two lines
 * still reduces to one readable cue; the learner's own words are otherwise
 * untouched.
 */
export function splitHead(text: string, count = RECALL_HEAD_WORDS): SplitText {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return {
    head: words.slice(0, count).join(" "),
    rest: words.slice(count).join(" "),
  };
}

/**
 * The 独立表达 hint strip: each fragment's cue, in draft order.
 *
 * The learner's own opening words handed back to them, never a suggestion of
 * what else to say. Returns an empty string when there is nothing to hint at,
 * so the caller can drop the strip rather than render an empty card.
 */
export function soloHints(fragmentTexts: readonly string[]): string {
  return fragmentTexts
    .map((text) => splitHead(text).head)
    .filter((head) => head !== "")
    .join(" · ");
}
