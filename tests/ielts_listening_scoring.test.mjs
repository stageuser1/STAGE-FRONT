/**
 * Listening marking rules.
 *
 * The normalization cases are the point of this file: a candidate who types
 * "  25 " or "£25" or "twenty  five" has heard the answer, and marking any of
 * those wrong would be the module lying about the candidate's listening. The
 * multi-select cases guard the opposite direction — half of a "choose TWO"
 * answer is not half a mark.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { normalize, scoreAttempt } from "../lib/ielts/listening-scoring.ts";
import {
  MUSEUM_MEMBERSHIP_RULES,
  MUSEUM_MEMBERSHIP_SET,
} from "../lib/ielts/listening-fixture.ts";

/** An attempt carrying exactly the answers given, for rule-level assertions. */
function attemptWith(answers) {
  return {
    setId: MUSEUM_MEMBERSHIP_SET.id,
    answers: Object.fromEntries(
      Object.entries(answers).map(([no, value]) => [
        Number(no),
        { questionNo: Number(no), value },
      ]),
    ),
    startedAt: "2026-07-31T09:00:00.000Z",
    elapsedSec: 0,
    status: "submitted",
  };
}

function ruleFor(questionNo) {
  return MUSEUM_MEMBERSHIP_RULES.find((rule) => rule.questionNo === questionNo);
}

/** Marks one question in isolation and returns its `byQuestion` row. */
function mark(questionNo, value) {
  const rule = ruleFor(questionNo);
  const report = scoreAttempt(attemptWith({ [questionNo]: value }), [rule]);
  return report.byQuestion[0];
}

test("trim: surrounding whitespace does not fail an answer", () => {
  assert.equal(mark(5, "  25 ").correct, true);
});

test("lowercase: capitalisation does not fail an answer", () => {
  assert.equal(mark(4, "Silver").correct, true);
});

test("collapseSpaces: a doubled space does not fail an answer", () => {
  assert.equal(mark(5, "twenty  five").correct, true);
});

test("stripCurrency: a leading currency mark is ignored", () => {
  assert.equal(mark(5, "£25").correct, true);
});

test("stripCurrency only strips a leading mark", () => {
  assert.equal(normalize("25£", ["stripCurrency"]), "25£");
  assert.equal(normalize("$25", ["stripCurrency"]), "25");
  assert.equal(normalize("€25", ["stripCurrency"]), "25");
});

test("normalize applies steps in the declared order", () => {
  // trim first exposes the £; the other order leaves it embedded.
  assert.equal(normalize(" £25 ", ["trim", "stripCurrency"]), "25");
  assert.equal(normalize(" £25 ", ["stripCurrency", "trim"]), "£25");
});

test("either accepted form of a multi-answer question is correct", () => {
  assert.equal(mark(2, "1 5TR").correct, true);
  assert.equal(mark(2, "15TR").correct, true);
  assert.equal(mark(3, "07700 900142").correct, true);
  assert.equal(mark(3, "07700900142").correct, true);
});

test("a wrong answer reports the given and the accepted values", () => {
  const row = mark(4, "gold");
  assert.equal(row.correct, false);
  assert.equal(row.no, 4);
  assert.equal(row.given, "gold");
  assert.deepEqual(row.accepted, ["silver"]);
});

test("multi-select is order-independent", () => {
  assert.equal(mark(6, ["C", "A"]).correct, true);
  assert.equal(mark(6, ["A", "C"]).correct, true);
});

test("multi-select gives no partial credit", () => {
  assert.equal(mark(6, ["A"]).correct, false);
  assert.equal(mark(6, ["A", "B"]).correct, false);
  assert.equal(mark(6, ["A", "C", "D"]).correct, false);
  assert.equal(mark(6, []).correct, false);
});

test("a multi-select answer is reported as the letters the candidate picked", () => {
  assert.equal(mark(6, ["A", "B"]).given, "A, B");
});

test("an unanswered question is wrong and reports an empty given", () => {
  const report = scoreAttempt(attemptWith({}), [ruleFor(1)]);
  assert.equal(report.byQuestion.length, 1);
  assert.equal(report.byQuestion[0].correct, false);
  assert.equal(report.byQuestion[0].given, "");
  assert.equal(report.correct, 0);
});

test("a whitespace-only answer is wrong, not an accidental match", () => {
  assert.equal(mark(1, "   ").correct, false);
});

test("a full fixture attempt scores as expected", () => {
  const attempt = attemptWith({
    1: "marchetti", // correct, lowercase
    2: "15TR", // correct, second accepted form
    3: "07700 900143", // wrong by one digit
    4: " Silver ", // correct after trim + lowercase
    5: "£25", // correct after stripCurrency
    6: ["C", "A"], // correct, reordered
    7: "c", // correct after lowercase
    // 8 left unanswered
  });

  const report = scoreAttempt(attempt, MUSEUM_MEMBERSHIP_RULES);

  assert.equal(report.total, 8);
  assert.equal(report.correct, 6);
  assert.deepEqual(
    report.byQuestion.map((row) => row.correct),
    [true, true, false, true, true, true, true, false],
  );
  assert.equal(report.byQuestion[7].given, "");
});

test("the report covers every rule even when the attempt is empty", () => {
  const report = scoreAttempt(attemptWith({}), MUSEUM_MEMBERSHIP_RULES);
  assert.equal(report.total, 8);
  assert.equal(report.correct, 0);
  assert.deepEqual(
    report.byQuestion.map((row) => row.no),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});
