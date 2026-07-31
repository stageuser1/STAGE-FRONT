/**
 * The attempt state machine. Pure logic — no React, no timers, no storage.
 *
 * The caller owns the interval and dispatches `tick`; this module only knows
 * how to fold an action into an attempt. That keeps the rule that matters
 * testable without a clock: once an attempt is `submitted` it is frozen, and
 * every action after that is a no-op returning the same object. A late-firing
 * timer or a double-clicked submit button therefore cannot alter a finished
 * attempt.
 *
 * `serializeAttempt` / `deserializeAttempt` are the persistence seam for B4.
 * Storage itself (localStorage, a server) lives outside this module.
 */
import type { Answer, Attempt, ListeningSet } from "./listening-types.ts";

export type AttemptAction =
  | { type: "answer"; questionNo: number; value: string | string[] }
  | { type: "clearAnswer"; questionNo: number }
  | { type: "tick"; seconds: number }
  | { type: "submit" };

export function createAttempt(
  set: ListeningSet,
  startedAt: string = new Date().toISOString(),
): Attempt {
  return {
    setId: set.id,
    answers: {},
    startedAt,
    elapsedSec: 0,
    status: "in_progress",
  };
}

export function reduce(attempt: Attempt, action: AttemptAction): Attempt {
  if (attempt.status === "submitted") return attempt;

  switch (action.type) {
    case "answer": {
      const answer: Answer = {
        questionNo: action.questionNo,
        value: action.value,
      };
      return {
        ...attempt,
        answers: { ...attempt.answers, [action.questionNo]: answer },
      };
    }
    case "clearAnswer": {
      if (!(action.questionNo in attempt.answers)) return attempt;
      const answers = { ...attempt.answers };
      delete answers[action.questionNo];
      return { ...attempt, answers };
    }
    case "tick":
      return { ...attempt, elapsedSec: attempt.elapsedSec + action.seconds };
    case "submit":
      return { ...attempt, status: "submitted" };
  }
}

/**
 * Every question number in the set, ascending. Form completion contributes one
 * per blank segment; the other group types are one question each.
 */
export function questionNumbers(set: ListeningSet): number[] {
  const numbers: number[] = [];
  for (const group of set.questionGroups) {
    if (group.type === "form_completion") {
      for (const row of group.rows) {
        for (const segment of row.segments) {
          if (segment.kind === "blank") numbers.push(segment.questionNo);
        }
      }
    } else {
      numbers.push(group.questionNo);
    }
  }
  return numbers.sort((a, b) => a - b);
}

/** What the submit dialog warns about. Blank and empty-selection both count. */
export function unansweredQuestions(
  attempt: Attempt,
  set: ListeningSet,
): number[] {
  return questionNumbers(set).filter((no) => {
    const answer = attempt.answers[no];
    if (answer === undefined) return true;
    if (Array.isArray(answer.value)) return answer.value.length === 0;
    return answer.value.trim() === "";
  });
}

export function serializeAttempt(attempt: Attempt): string {
  return JSON.stringify(attempt);
}

export function deserializeAttempt(json: string): Attempt {
  return JSON.parse(json) as Attempt;
}
