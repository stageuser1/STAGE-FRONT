/**
 * Listening shapes, with no corpus attached.
 *
 * Split from the fixture and the source for the same reason `speaking-types.ts`
 * is split from `speaking-corpus.ts`: importing a *value* from a module that
 * builds an index at load time pulls the whole corpus into that bundle. Client
 * components need the row types and the labels; only the source needs the data.
 *
 * Every question in a set carries a stable, unique, 1-based `questionNo`. For
 * form completion the number lives on the blank segment, so a row can mix fixed
 * text and numbered gaps; for the other four group types it lives on the group,
 * because each of those groups is exactly one question.
 */

export type ListeningPart = 1 | 2 | 3 | 4;

export const LISTENING_PARTS: readonly ListeningPart[] = [1, 2, 3, 4];

export const LISTENING_PART_LABELS: Record<ListeningPart, string> = {
  1: "Part 1",
  2: "Part 2",
  3: "Part 3",
  4: "Part 4",
};

export type ListeningFrequency = "high" | "mid" | "low";

export const LISTENING_FREQUENCY_LABELS: Record<ListeningFrequency, string> = {
  high: "高频",
  mid: "次高频",
  low: "低频",
};

/* --------------------------------------------------------------------------
 * Question groups
 * ----------------------------------------------------------------------- */

/**
 * One piece of a form-completion row. A row is a sequence of these, so the
 * renderer can lay out `Helena ____` and `£ ____` without parsing a template
 * string and without the blank's number being implied by its position.
 */
export type FormSegment =
  | { kind: "text"; value: string }
  | { kind: "blank"; questionNo: number };

export interface FormRow {
  label: string;
  segments: FormSegment[];
}

export interface FormCompletionGroup {
  type: "form_completion";
  instruction: string;
  formTitle: string;
  rows: FormRow[];
}

/**
 * A lettered choice. The `label` is what an answer is recorded as ("A"), the
 * `text` is what the candidate reads. Keeping them apart means a scoring rule
 * never has to depend on an option's position in the array.
 */
export interface ChoiceOption {
  label: string;
  text: string;
}

export interface McqSingleGroup {
  type: "mcq_single";
  questionNo: number;
  question: string;
  options: ChoiceOption[];
}

export interface McqMultiGroup {
  type: "mcq_multi";
  questionNo: number;
  question: string;
  options: ChoiceOption[];
  /** How many options the candidate must pick. Scored all-or-nothing. */
  selectCount: number;
}

export interface MapLabellingGroup {
  type: "map_labelling";
  questionNo: number;
  question: string;
  labels: string[];
  imageUrl?: string;
}

export interface MatchingGroup {
  type: "matching";
  questionNo: number;
  question: string;
  options: string[];
}

export type QuestionGroup =
  | FormCompletionGroup
  | McqSingleGroup
  | McqMultiGroup
  | MapLabellingGroup
  | MatchingGroup;

/* --------------------------------------------------------------------------
 * Sets
 * ----------------------------------------------------------------------- */

export interface ListeningSet {
  id: string;
  title: string;
  titleZh: string;
  part: ListeningPart;
  frequency: ListeningFrequency;
  audioUrl: string;
  durationSec: number;
  questionGroups: QuestionGroup[];
}

/**
 * What the library list page needs. No `questionGroups`: the list renders a
 * count, and shipping every group to it would put the whole bank in the
 * payload for a page that shows none of it.
 */
export interface ListeningSetSummary {
  id: string;
  title: string;
  titleZh: string;
  part: ListeningPart;
  frequency: ListeningFrequency;
  questionCount: number;
}

/* --------------------------------------------------------------------------
 * Attempts and scoring
 * ----------------------------------------------------------------------- */

/** `string[]` is for the multi-select groups; every other type records a string. */
export interface Answer {
  questionNo: number;
  value: string | string[];
}

export type AttemptStatus = "in_progress" | "submitted";

export interface Attempt {
  setId: string;
  answers: Record<number, Answer>;
  /** ISO-8601. A string rather than a Date so the JSON round trip is lossless. */
  startedAt: string;
  elapsedSec: number;
  status: AttemptStatus;
}

export type NormalizeStep =
  | "trim"
  | "lowercase"
  | "collapseSpaces"
  | "stripCurrency";

export interface ScoringRule {
  questionNo: number;
  /**
   * For a gap-fill, the alternatives — matching any one of them is correct.
   * For a multi-select, the whole array is the one correct set.
   */
  accepted: string[];
  /** Applied in this order, to the given answer and to each accepted value. */
  normalize: NormalizeStep[];
}

export interface QuestionScore {
  no: number;
  /** The raw answer as recorded. A multi-select is joined with ", ". */
  given: string;
  accepted: string[];
  correct: boolean;
}

export interface ScoreReport {
  total: number;
  correct: number;
  byQuestion: QuestionScore[];
}
