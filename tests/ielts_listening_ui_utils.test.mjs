/**
 * Every decision the Listening question UI makes.
 *
 * The repository has no DOM test runner, so the components are written to hold
 * layout only and each judgement they need lives in `listening-ui-utils.ts`.
 * This file is therefore the coverage for the B3 components' behaviour: what
 * counts as answered, what a multi-select click does at the limit, what the nav
 * bar shows, and what the clock reads.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  answeredState,
  answerList,
  answerText,
  formatClock,
  GROUP_TYPE_LABELS,
  multiSelectNext,
  navStates,
} from "../lib/ielts/listening-ui-utils.ts";
import {
  createAttempt,
  questionNumbers,
  reduce,
  unansweredQuestions,
} from "../lib/ielts/listening-runner.ts";
import { MUSEUM_MEMBERSHIP_SET } from "../lib/ielts/listening-fixture.ts";

const STARTED_AT = "2026-07-31T09:00:00.000Z";

const newAttempt = () => createAttempt(MUSEUM_MEMBERSHIP_SET, STARTED_AT);

const withAnswer = (attempt, questionNo, value) =>
  reduce(attempt, { type: "answer", questionNo, value });

/* --------------------------------------------------------------------------
 * answeredState
 * ----------------------------------------------------------------------- */

test("a question with no answer is unanswered", () => {
  assert.equal(answeredState(newAttempt(), 1), "unanswered");
});

test("a typed answer is answered", () => {
  const attempt = withAnswer(newAttempt(), 1, "Marchetti");
  assert.equal(answeredState(attempt, 1), "answered");
});

test("a blank or whitespace-only answer is unanswered", () => {
  const empty = withAnswer(newAttempt(), 1, "");
  const spaces = withAnswer(newAttempt(), 1, "   ");
  assert.equal(answeredState(empty, 1), "unanswered");
  assert.equal(answeredState(spaces, 1), "unanswered");
});

test("an empty selection is unanswered, a non-empty one is answered", () => {
  const none = withAnswer(newAttempt(), 6, []);
  const some = withAnswer(newAttempt(), 6, ["A"]);
  assert.equal(answeredState(none, 6), "unanswered");
  assert.equal(answeredState(some, 6), "answered");
});

test("answeredState agrees with the runner's own emptiness rule", () => {
  // The nav bar asks per question and the runner walks the set; the two
  // restate the same rule, so they are pinned together here. A drift in either
  // would show as a nav cell that disagrees with the submit warning.
  let attempt = newAttempt();
  attempt = withAnswer(attempt, 1, "Marchetti");
  attempt = withAnswer(attempt, 2, "   ");
  attempt = withAnswer(attempt, 6, []);
  attempt = withAnswer(attempt, 7, "C");

  const blank = unansweredQuestions(attempt, MUSEUM_MEMBERSHIP_SET);
  for (const no of questionNumbers(MUSEUM_MEMBERSHIP_SET)) {
    assert.equal(
      answeredState(attempt, no),
      blank.includes(no) ? "unanswered" : "answered",
      `question ${no}`,
    );
  }
});

/* --------------------------------------------------------------------------
 * Reading a value
 * ----------------------------------------------------------------------- */

test("answerText reads a string and refuses a list", () => {
  const text = withAnswer(newAttempt(), 1, "Marchetti");
  const list = withAnswer(newAttempt(), 1, ["A", "C"]);
  assert.equal(answerText(text, 1), "Marchetti");
  assert.equal(answerText(newAttempt(), 1), "");
  assert.equal(answerText(list, 1), "", "a mistyped answer reads as blank");
});

test("answerList reads a list and refuses a string", () => {
  const list = withAnswer(newAttempt(), 6, ["A", "C"]);
  const text = withAnswer(newAttempt(), 6, "A");
  assert.deepEqual(answerList(list, 6), ["A", "C"]);
  assert.deepEqual(answerList(newAttempt(), 6), []);
  assert.deepEqual(answerList(text, 6), []);
});

/* --------------------------------------------------------------------------
 * multiSelectNext
 * ----------------------------------------------------------------------- */

test("clicking an unselected option adds it, in click order", () => {
  assert.deepEqual(multiSelectNext([], "C", 2), ["C"]);
  assert.deepEqual(multiSelectNext(["C"], "A", 2), ["C", "A"]);
});

test("clicking a selected option removes it", () => {
  assert.deepEqual(multiSelectNext(["C", "A"], "C", 2), ["A"]);
  assert.deepEqual(multiSelectNext(["A"], "A", 2), []);
});

test("selecting past selectCount is a no-op, not a swap", () => {
  const current = ["A", "C"];
  const next = multiSelectNext(current, "E", 2);

  // The same array back, so a caller can tell by reference that nothing
  // happened — and, load-bearing, neither earlier answer was dropped to make
  // room for the third click.
  assert.equal(next, current);
  assert.deepEqual(next, ["A", "C"]);
});

test("at the limit, deselecting still works and frees a slot", () => {
  const full = ["A", "C"];
  const freed = multiSelectNext(full, "A", 2);
  assert.deepEqual(freed, ["C"]);
  assert.deepEqual(multiSelectNext(freed, "E", 2), ["C", "E"]);
});

test("the input array is never mutated", () => {
  const current = ["A"];
  multiSelectNext(current, "C", 2);
  multiSelectNext(current, "A", 2);
  assert.deepEqual(current, ["A"]);
});

/* --------------------------------------------------------------------------
 * navStates
 * ----------------------------------------------------------------------- */

test("navStates covers every question in the set, ascending", () => {
  const cells = navStates(MUSEUM_MEMBERSHIP_SET, newAttempt(), null);
  assert.deepEqual(
    cells.map((cell) => cell.no),
    questionNumbers(MUSEUM_MEMBERSHIP_SET),
  );
  assert.equal(cells.length, 8, "five form blanks plus three group questions");
  assert.ok(cells.every((cell) => cell.state === "unanswered"));
  assert.ok(cells.every((cell) => cell.current === false));
});

test("navStates marks the answered questions and the current one", () => {
  let attempt = newAttempt();
  attempt = withAnswer(attempt, 3, "07700 900142");
  attempt = withAnswer(attempt, 6, ["A", "C"]);

  const cells = navStates(MUSEUM_MEMBERSHIP_SET, attempt, 3);
  const byNo = new Map(cells.map((cell) => [cell.no, cell]));

  assert.equal(byNo.get(3).state, "answered");
  assert.equal(byNo.get(6).state, "answered");
  assert.equal(byNo.get(4).state, "unanswered");

  // The current question keeps its answered state: the ring composes over the
  // fill rather than replacing it, so the bar never shows an answered question
  // as blank just because the candidate is standing on it.
  assert.equal(byNo.get(3).current, true);
  assert.equal(byNo.get(3).state, "answered");
  assert.equal(cells.filter((cell) => cell.current).length, 1);
});

test("a currentNo outside the set marks nothing current", () => {
  const cells = navStates(MUSEUM_MEMBERSHIP_SET, newAttempt(), 99);
  assert.ok(cells.every((cell) => cell.current === false));
});

/* --------------------------------------------------------------------------
 * formatClock
 * ----------------------------------------------------------------------- */

test("formatClock always renders three padded fields", () => {
  assert.equal(formatClock(0), "00:00:00");
  assert.equal(formatClock(2), "00:00:02");
  assert.equal(formatClock(59), "00:00:59");
  assert.equal(formatClock(60), "00:01:00");
  assert.equal(formatClock(252), "00:04:12");
  assert.equal(formatClock(3599), "00:59:59");
});

test("formatClock rolls over into hours and does not clamp them", () => {
  assert.equal(formatClock(3600), "01:00:00");
  assert.equal(formatClock(3661), "01:01:01");
  assert.equal(formatClock(86399), "23:59:59");
  assert.equal(formatClock(86400), "24:00:00");
  assert.equal(formatClock(360000), "100:00:00");
});

test("formatClock survives values a stopwatch should never produce", () => {
  assert.equal(formatClock(-5), "00:00:00");
  assert.equal(formatClock(2.9), "00:00:02");
  assert.equal(formatClock(Number.NaN), "00:00:00");
  assert.equal(formatClock(Number.POSITIVE_INFINITY), "00:00:00");
});

/* --------------------------------------------------------------------------
 * Labels
 * ----------------------------------------------------------------------- */

test("every group type in the set has a display label", () => {
  for (const group of MUSEUM_MEMBERSHIP_SET.questionGroups) {
    assert.equal(typeof GROUP_TYPE_LABELS[group.type], "string");
    assert.notEqual(GROUP_TYPE_LABELS[group.type], "");
  }
  assert.equal(Object.keys(GROUP_TYPE_LABELS).length, 5);
});
