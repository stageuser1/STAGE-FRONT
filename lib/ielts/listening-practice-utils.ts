/**
 * The decisions the practice page makes, as pure functions.
 *
 * Same rule B3 set for the question components (`listening-ui-utils.ts`): this
 * repository runs `node --test` and has no DOM harness, so anything decided
 * inside a component body is undecidable in a test. The page owns four
 * judgements that are not layout — what the confirm button says, what the
 * warning above it says, which question `Previous`/`Next` land on, and which
 * control a jump should focus — and all four live here.
 *
 * No React, no storage, no fixture import.
 */
import type { ListeningSet, QuestionGroup } from "./listening-types.ts";

/* --------------------------------------------------------------------------
 * The submit confirmation
 * ----------------------------------------------------------------------- */

/**
 * The confirm button's copy.
 *
 * Two labels rather than one, because the button does two different things: a
 * complete paper is handed in, an incomplete one is handed in *anyway*. A
 * single 确认交卷 on both would let a candidate who skimmed the dialog confirm
 * away three blank questions with a word that told them nothing.
 */
export function confirmSubmitLabel(unanswered: readonly number[]): string {
  return unanswered.length === 0 ? "确认交卷" : "仍要交卷";
}

/**
 * The line above the button.
 *
 * States the count, and the count is what the number buttons beside it then
 * itemise. Deliberately no exhortation and no warning colour in the copy: the
 * spec's tone rule for the Lab is that the interface reports, it does not
 * pressure.
 */
export function submitSummary(
  unanswered: readonly number[],
  total: number,
): string {
  if (unanswered.length === 0) return `全部 ${total} 题均已作答。`;
  return `还有 ${unanswered.length} 题未作答（共 ${total} 题）：`;
}

/* --------------------------------------------------------------------------
 * Previous / Next
 * ----------------------------------------------------------------------- */

/**
 * Where `Previous` or `Next` goes from the current question.
 *
 * Clamps rather than wraps: `Next` on the last question is a no-op, because a
 * candidate who has reached the end of the paper and taps once more should not
 * be thrown back to question 1 — the button that ends a paper is 交卷 and there
 * is only one of it.
 *
 * From nothing selected, either direction lands on the first question: that is
 * the only entry point the paper has, and a `Previous` that did nothing at all
 * would read as a broken button.
 */
export function stepQuestionNo(
  numbers: readonly number[],
  currentNo: number | null,
  delta: 1 | -1,
): number | null {
  if (numbers.length === 0) return null;
  if (currentNo === null) return numbers[0];

  const index = numbers.indexOf(currentNo);
  if (index === -1) return numbers[0];

  const next = index + delta;
  if (next < 0 || next >= numbers.length) return currentNo;
  return numbers[next];
}

/* --------------------------------------------------------------------------
 * Jumping to a question
 * ----------------------------------------------------------------------- */

/**
 * Which group holds a question, and which of that group's controls answers it.
 *
 * The page scrolls to a *group* — the card is the unit that gets brought into
 * view — but focus has to land on the one control that records this question's
 * answer, and for form completion a card holds five of them.
 *
 * `controlIndex` counts answer controls in document order within the group, so
 * the caller can take the group's rendered controls and index into them. That
 * is why it is computed from the data rather than from an id on the input: the
 * B3 components are read-only, none of them accepts an id prop, and a lookup
 * keyed on their `aria-label` copy would break the moment that copy changed.
 *
 * Every group type except form completion is exactly one question, so its only
 * answer control is index 0.
 */
export interface QuestionTarget {
  groupIndex: number;
  controlIndex: number;
}

export function questionTarget(
  set: ListeningSet,
  questionNo: number,
): QuestionTarget | null {
  for (let groupIndex = 0; groupIndex < set.questionGroups.length; groupIndex++) {
    const group: QuestionGroup = set.questionGroups[groupIndex];

    if (group.type === "form_completion") {
      let controlIndex = 0;
      for (const row of group.rows) {
        for (const segment of row.segments) {
          if (segment.kind !== "blank") continue;
          if (segment.questionNo === questionNo) {
            return { groupIndex, controlIndex };
          }
          controlIndex += 1;
        }
      }
      continue;
    }

    if (group.questionNo === questionNo) return { groupIndex, controlIndex: 0 };
  }

  return null;
}
