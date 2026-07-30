/**
 * Writing Task 2 recall-bank shapes.
 *
 * A new file rather than an addition to `types.ts` (Reading) or
 * `speaking-types.ts`, following the one-module-per-file split already in
 * lib/ielts: the Writing bank has no shared vocabulary with either, and the
 * split keeps a client component that only needs an essay-type label from
 * pulling another module's corpus into its bundle.
 *
 * Everything here describes *recalled* exam questions. Two consequences the
 * types encode deliberately:
 *
 *  - `promptText` is a test-taker's recollection, not official exam wording.
 *    It is stored byte-faithful to the recall, including the ` - ` joins left
 *    by the source's collapsed bullet lines. Nothing in this pipeline rewrites
 *    a prompt, so any presentation-layer tidying must be reversible.
 *  - Absent facts are absent. `modules` is empty when no recall said which
 *    module it was, `essayType` is `null` when the fragment cannot carry the
 *    classification, and `frequency` is *missing* — not `"low"` — for a
 *    question seen once. A single sighting is not evidence of rarity.
 */

/** Which paper a sitting was. */
export type WritingModule = "academic" | "general";

/** The five standard Task 2 rubrics. `null` on fragments too thin to classify. */
export type WritingEssayType =
  | "opinion"
  | "discussion"
  | "advantages-disadvantages"
  | "problem-solution"
  | "two-part";

/**
 * Frequency bands, mirroring the Speaking corpus convention: two bands only,
 * and no band at all for single sightings.
 *
 * `high` is >= 3 recalled sittings, `medium` is exactly 2. Reading has a third
 * 非高频 band because every exam there carries a frequency; here most questions
 * were reported once, and labelling those 非高频 would assert something the
 * recall window cannot support — a January question simply had fewer months in
 * which to be reported again.
 */
export type WritingFrequency = "high" | "medium";

export interface WritingT2Question {
  /** Stable id, `wt2-NNN`. Assigned in source order; never renumbered. */
  id: string;
  /** The most complete recalled wording of this question, verbatim. */
  promptText: string;
  /**
   * Every other recalled wording of the same exam question, verbatim.
   *
   * Empty when the merged recalls were textually identical, or when the
   * question was reported once. A variant that is a *description* of the
   * question rather than the question itself still belongs here — it is
   * evidence of the sitting, and discarding it would lose the occurrence.
   */
  variants: string[];
  essayType: WritingEssayType | null;
  /**
   * Every module whose recalls reported this question — an aggregate, like
   * `months` and `countries`, because a Task 2 topic is shared across papers
   * and one question can legitimately be sighted in both.
   *
   * Empty when no recall named a module. That is not a default of "academic":
   * the source page's header claims all its recalls are Academic, but an entry
   * that does not say so itself carries no such fact, and propagating the
   * header's claim onto it would be an inference dressed as data.
   */
  modules: WritingModule[];
  /** How many recalled sittings reported this question. Always >= 1. */
  occurrenceCount: number;
  /** Present only at >= 2 occurrences. See `WritingFrequency`. */
  frequency?: WritingFrequency;
  /** `YYYY-MM` of every sitting that reported it, newest first. */
  months: string[];
  /** Countries named by the recalls. Empty when none named one. */
  countries: string[];
  /**
   * The recall is a topic fragment, not a full prompt with an instruction line
   * (e.g. `"Congestion tax"`). Excluded from the default catalog filter —
   * practising against a fragment teaches the wrong task — but kept in the
   * bank, because the sighting is real and the fuller wording may arrive later.
   */
  incomplete?: boolean;
}

export interface WritingT2Bank {
  schemaVersion: "WritingT2BankV1";
  corpusVersion: number;
  /** Provenance of the question text. `verbatim-recall` = never rewritten. */
  source: "verbatim-recall";
  generatedAt: string;
  /** Inclusive month range the recalls were drawn from, `YYYY-MM..YYYY-MM`. */
  sourceWindow: string;
  /** Learner-facing provenance disclaimer. Rendered wherever the bank is. */
  sourceStatement: string;
  questions: WritingT2Question[];
}

export const WRITING_ESSAY_TYPE_LABELS: Record<WritingEssayType, string> = {
  opinion: "同意与否",
  discussion: "双边讨论",
  "advantages-disadvantages": "利弊分析",
  "problem-solution": "问题与对策",
  "two-part": "双问题",
};

export const WRITING_MODULE_LABELS: Record<WritingModule, string> = {
  academic: "A 类",
  general: "G 类",
};

export const WRITING_FREQUENCY_LABELS: Record<WritingFrequency, string> = {
  high: "高频",
  medium: "中频",
};

/** The catalog default: fragments are hidden until a fuller recall lands. */
export function isPracticable(question: WritingT2Question): boolean {
  return question.incomplete !== true;
}
