/**
 * Pure text rules behind 记忆巩固 and 独立表达 (master-spec 批次三 §4–5).
 *
 * Two jobs, both deterministic and both offline:
 *
 *   1. `skeletonTokens` turns the learner's own draft into a keyword skeleton —
 *      "连接词与用户核心词保留、其余淡化" — with progressive hiding levels for
 *      recall practice.
 *   2. `keywordsOf` produces the minimal hint list the 独立表达 screen offers
 *      (and lets the learner dismiss).
 *
 * Neither reads a model, a service or a corpus: the "core words" are simply the
 * words that are not grammatical scaffolding, decided by the closed function-word
 * list below. That is the whole rule. It is dumb on purpose — the learner needs
 * a skeleton whose behaviour they can predict from one screen to the next, and
 * anything cleverer would be a judgement about their wording that this module has
 * no business making.
 */

/**
 * English function words: articles, pronouns, auxiliaries, prepositions,
 * conjunctions and the handful of adverbs that carry no topic content.
 *
 * Everything not in this list counts as a content word and survives to the
 * highest hiding level. A closed list rather than a frequency cut-off, so the
 * same sentence always skeletonises the same way.
 */
const FUNCTION_WORDS = new Set([
  "a", "an", "the",
  "i", "me", "my", "mine", "myself", "we", "us", "our", "ours",
  "you", "your", "yours", "he", "him", "his", "she", "her", "hers",
  "it", "its", "they", "them", "their", "theirs", "this", "that",
  "these", "those", "there", "here",
  "am", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "done", "have", "has", "had", "having",
  "will", "would", "shall", "should", "can", "could", "may", "might",
  "must", "get", "got", "getting",
  "of", "in", "on", "at", "to", "for", "with", "without", "from",
  "by", "about", "into", "onto", "over", "under", "up", "down",
  "out", "off", "than", "as", "like", "near", "between", "through",
  "during", "after", "before", "since", "until",
  "and", "or", "but", "so", "if", "because", "while", "when",
  "where", "which", "who", "whom", "whose", "what", "how", "why",
  "not", "no", "nor", "too", "very", "just", "also", "then",
  "some", "any", "all", "both", "each", "every", "more", "most",
  "much", "many", "few", "lot", "lots", "one", "two", "other",
  "own", "same", "such", "quite", "really", "actually", "still",
  "yet", "ever", "never", "always", "usually", "often", "sometimes",
]);

export type TokenKind = "word" | "gap";

export interface SkeletonToken {
  /** The token as written, kept so a caller can reconstruct the original. */
  raw: string;
  kind: TokenKind;
  /** Whether the word carries topic content. Always false for `gap`. */
  content: boolean;
  /** What to render at the requested level. */
  display: string;
  /** Rendered at reduced contrast rather than removed. */
  faded: boolean;
}

/**
 * Four steps of recall difficulty.
 *
 * 0 shows the draft as written; each step after that removes more scaffolding
 * while the learner's own content words hold on longest, so the last thing left
 * on screen is the shape of what they wanted to say.
 */
export const RECALL_LEVELS = [
  { value: 0, label: "完整", hint: "先照着读一遍" },
  { value: 1, label: "淡化虚词", hint: "虚词变淡，注意力落在自己的词上" },
  { value: 2, label: "隐去虚词", hint: "虚词消失，靠自己补出连接" },
  { value: 3, label: "只留首字母", hint: "只剩线索，尽量完整复述" },
] as const;

export type RecallLevel = 0 | 1 | 2 | 3;

export function isRecallLevel(value: number): value is RecallLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** Splits into alternating word / non-word runs, losing nothing. */
function tokenise(text: string): Array<{ raw: string; kind: TokenKind }> {
  const tokens: Array<{ raw: string; kind: TokenKind }> = [];
  const pattern = /[A-Za-z][A-Za-z'’-]*|[^A-Za-z]+/g;
  for (const match of text.match(pattern) ?? []) {
    tokens.push({
      raw: match,
      kind: /^[A-Za-z]/.test(match) ? "word" : "gap",
    });
  }
  return tokens;
}

export function isContentWord(word: string): boolean {
  const normalised = word.toLowerCase().replace(/[^a-z'’-]/g, "");
  if (normalised.length === 0) return false;
  return !FUNCTION_WORDS.has(normalised);
}

/**
 * The draft at one hiding level.
 *
 * Whitespace runs are always preserved verbatim so the line breaks and the
 * sentence rhythm the learner typed stay recognisable at every level — the
 * skeleton has to look like *their* answer, not like a puzzle.
 */
export function skeletonTokens(
  text: string,
  level: RecallLevel,
): SkeletonToken[] {
  return tokenise(text).map(({ raw, kind }) => {
    if (kind === "gap") {
      return { raw, kind, content: false, display: raw, faded: false };
    }
    const content = isContentWord(raw);

    if (level === 0) {
      return { raw, kind, content, display: raw, faded: false };
    }
    if (!content) {
      // Function words: faded at level 1, then gone.
      if (level === 1) return { raw, kind, content, display: raw, faded: true };
      return { raw, kind, content, display: "·", faded: true };
    }
    if (level === 3) {
      // First letter plus a run of underscores as long as what is missing, so
      // the word's length is still a cue.
      return {
        raw,
        kind,
        content,
        display: raw[0] + "_".repeat(Math.max(1, raw.length - 1)),
        faded: false,
      };
    }
    return { raw, kind, content, display: raw, faded: false };
  });
}

/**
 * Distinct content words, in the order they were written.
 *
 * These are the "极简关键词提示" of 独立表达 — the learner's own words handed
 * back to them, never a suggestion of what else to say. Deduplicated
 * case-insensitively but rendered as first written.
 */
export function keywordsOf(text: string, limit = 12): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const token of tokenise(text)) {
    if (token.kind !== "word" || !isContentWord(token.raw)) continue;
    const key = token.raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(token.raw);
    if (words.length >= limit) break;
  }
  return words;
}

/**
 * The connectives a draft block may be built from.
 *
 * A closed vocabulary, not a text field: 答案构建's core rule is that the draft
 * may only be the organisation and connection of the learner's own fragments
 * (批次三 §3). A free-text connector would be a hole in that rule — anything
 * could be typed into it. These carry no topic content, so joining fragments
 * with them cannot introduce material the learner did not write.
 */
export const CONNECTIVES = [
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
] as const;

export type Connective = (typeof CONNECTIVES)[number];

export function isConnective(value: string): value is Connective {
  return (CONNECTIVES as readonly string[]).includes(value);
}
