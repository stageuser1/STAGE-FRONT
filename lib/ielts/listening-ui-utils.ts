/**
 * Every decision the Listening question UI makes, as pure functions.
 *
 * The repository has `node --test` and no DOM, so a component that decides
 * anything inside its own body is a component whose decisions cannot be
 * asserted. The rule for B3 is therefore that the components hold layout and
 * nothing else, and each judgement they need — is this question answered, what
 * does a multi-select click do, what does the nav bar look like, what does the
 * clock read — lives here and is tested directly.
 *
 * No React and no fixture import: this module is as testable as the runner.
 */
import type { Attempt, ListeningSet, QuestionGroup } from "./listening-types.ts";
import { questionNumbers } from "./listening-runner.ts";

/* --------------------------------------------------------------------------
 * Display copy
 *
 * `listening-types.ts` deliberately ships no label maps — what a group type is
 * called on screen is a UI decision, so it is made in the batch that renders
 * it.
 * ----------------------------------------------------------------------- */

export const GROUP_TYPE_LABELS: Record<QuestionGroup["type"], string> = {
  form_completion: "填空",
  mcq_single: "单选",
  mcq_multi: "多选",
  map_labelling: "地图标注",
  matching: "匹配",
};

/* --------------------------------------------------------------------------
 * Reading a group
 * ----------------------------------------------------------------------- */

/**
 * The question numbers one group holds, ascending.
 *
 * `questionNumbers` in the runner answers the same question for a whole set,
 * and this is deliberately not built by filtering that: review mode draws a
 * verdict strip *per card*, and it needs to know which numbers belong to the
 * card it is drawing without being told the card's position in the set.
 *
 * Form completion contributes one per blank segment; expanded instruction
 * groups contribute one per numbered question, while legacy groups contribute
 * their single `questionNo`.
 */
export function groupQuestionNumbers(group: QuestionGroup): number[] {
  if (group.type !== "form_completion") {
    if ("questions" in group && group.questions && group.questions.length > 0) {
      return group.questions
        .map((question) => question.questionNo)
        .sort((a, b) => a - b);
    }
    return [group.questionNo];
  }
  const numbers: number[] = [];
  for (const row of group.rows) {
    for (const segment of row.segments) {
      if (segment.kind === "blank") numbers.push(segment.questionNo);
    }
  }
  return numbers.sort((a, b) => a - b);
}

/* --------------------------------------------------------------------------
 * Reading an answer
 * ----------------------------------------------------------------------- */

export type AnsweredState = "answered" | "unanswered";

/**
 * Whether one question counts as answered.
 *
 * The rule is the runner's, inverted: a missing answer, an empty selection and
 * a whitespace-only string are all unanswered. It is restated rather than
 * derived because `unansweredQuestions` walks the whole set, and the nav bar
 * asks this question once per question on every keystroke. A test pins the two
 * together over the fixture so the restatement cannot drift.
 */
export function answeredState(
  attempt: Attempt,
  questionNo: number,
): AnsweredState {
  const answer = attempt.answers[questionNo];
  if (answer === undefined) return "unanswered";
  if (Array.isArray(answer.value)) {
    return answer.value.length === 0 ? "unanswered" : "answered";
  }
  return answer.value.trim() === "" ? "unanswered" : "answered";
}

/**
 * The recorded answer as a string, for the single-value inputs.
 *
 * An array-valued answer under a single-value question is a bug elsewhere, not
 * a crash here: it reads as blank, the same as no answer at all. `Answer.value`
 * is a union, so a component that indexed into it directly would need this
 * branch inline — which is exactly what this module exists to prevent.
 */
export function answerText(attempt: Attempt, questionNo: number): string {
  const value = attempt.answers[questionNo]?.value;
  return typeof value === "string" ? value : "";
}

/** The recorded answer as a list, for the multi-select groups. */
export function answerList(attempt: Attempt, questionNo: number): string[] {
  const value = attempt.answers[questionNo]?.value;
  return Array.isArray(value) ? value : [];
}

/* --------------------------------------------------------------------------
 * Multi-select
 * ----------------------------------------------------------------------- */

/**
 * What a click on a multi-select option produces.
 *
 * Selecting past `selectCount` is a no-op — it returns the *same array*, so a
 * caller can compare by reference to tell that nothing happened, matching the
 * runner's convention for a rejected tick. The alternative, dropping the oldest
 * selection to make room, is rejected on purpose: a candidate who has picked
 * two of two and clicks a third would silently lose an answer they had already
 * given. The UI disables the remaining options instead, and this function is
 * the guarantee behind that, not a substitute for it.
 *
 * Clicking an already-selected option removes it, which is how a candidate
 * changes their mind once the limit is reached.
 */
export function multiSelectNext(
  current: string[],
  clicked: string,
  selectCount: number,
): string[] {
  if (current.includes(clicked)) {
    return current.filter((label) => label !== clicked);
  }
  if (current.length >= selectCount) return current;
  return [...current, clicked];
}

/* --------------------------------------------------------------------------
 * Navigation
 * ----------------------------------------------------------------------- */

export interface NavState {
  no: number;
  state: AnsweredState;
  current: boolean;
}

/**
 * One entry per question in the set, ascending.
 *
 * `current` is a flag beside the answered state rather than a third value in
 * it: the question a candidate is standing on is usually one they have just
 * answered, and collapsing the two into one enum would make the ring erase the
 * fill — the bar would then read as if the current question were blank. The
 * ring composes over either state.
 *
 * Pass `null` for `currentNo` when nothing is selected yet.
 */
export function navStates(
  set: ListeningSet,
  attempt: Attempt,
  currentNo: number | null,
): NavState[] {
  return questionNumbers(set).map((no) => ({
    no,
    state: answeredState(attempt, no),
    current: no === currentNo,
  }));
}

/* --------------------------------------------------------------------------
 * The clock
 * ----------------------------------------------------------------------- */

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Elapsed seconds as `HH:MM:SS`.
 *
 * Always three fields, so the width never changes under the bottom bar, and
 * counting *up* — the spec forbids a countdown, a warning threshold and any
 * colour change on this display.
 *
 * Hours are not clamped: a paused-and-forgotten attempt reading `27:04:11` is
 * strange but true, and truncating it to `03:04:11` would be a lie. Negative
 * and non-finite inputs read as zero rather than throwing; nothing upstream
 * produces them, and a clock is not where a caller should learn that.
 */
export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}
