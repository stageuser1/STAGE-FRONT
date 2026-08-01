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

test("stripCurrency also takes the space behind the mark", () => {
  assert.equal(mark(5, "£ 25").correct, true);
  assert.equal(normalize("£ 25", ["stripCurrency"]), "25");
  assert.equal(normalize("$  25", ["stripCurrency"]), "25");
});

test("stripCurrency only strips a leading mark", () => {
  assert.equal(normalize("25£", ["stripCurrency"]), "25£");
  assert.equal(normalize("$25", ["stripCurrency"]), "25");
  assert.equal(normalize("€25", ["stripCurrency"]), "25");
  assert.equal(mark(5, "25£").correct, false);
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

test("duplicate selections are never collapsed away", () => {
  // ["A","A"] must not be marked as the set {A}, and ["A","A","C"] must not be
  // marked as {A,C} — a doubled selection is an invalid submission, not a
  // shorter correct one.
  assert.equal(mark(6, ["A", "A"]).correct, false);
  assert.equal(mark(6, ["A", "A", "C"]).correct, false);
  assert.equal(mark(6, ["C", "C"]).correct, false);
  assert.equal(mark(6, ["C", "A"]).correct, true);
});

test("duplicates are caught after normalization, not before", () => {
  // " a " and "A" are the same selection once the rule's steps have run.
  assert.equal(mark(6, [" a ", "A", "C"]).correct, false);
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

/* --------------------------------------------------------------------------
 * Mode dispatch
 *
 * The marking scheme is a property of the question. A UI that sends the wrong
 * shape produces a wrong answer, never a different scheme and never a throw.
 * ----------------------------------------------------------------------- */

test("a single-mode question marks like a text question", () => {
  assert.equal(mark(7, "C").correct, true);
  assert.equal(mark(7, " c ").correct, true);
  assert.equal(mark(7, "D").correct, false);
  assert.equal(mark(8, "First Floor").correct, true);
});

test("an array given for a text question is wrong, not joined", () => {
  const row = mark(1, ["Marchetti"]);
  assert.equal(row.correct, false);
  assert.equal(row.given, "Marchetti");
});

test("an array given for a single question is wrong", () => {
  assert.equal(mark(7, ["C"]).correct, false);
});

test("a string given for a multi question is wrong, not text-matched", () => {
  // The accepted set spelled out as a string must not sneak past set equality.
  assert.equal(mark(6, "A, C").correct, false);
  assert.equal(mark(6, "A").correct, false);
  assert.equal(mark(6, "").correct, false);
});

test("mode, not the given value, decides the scheme", () => {
  // Same answer, same accepted list, different declared mode.
  const accepted = ["A", "C"];
  const asMulti = { questionNo: 1, mode: "multi", accepted, normalize: ["trim"] };
  const asText = { questionNo: 1, mode: "text", accepted, normalize: ["trim"] };
  const attempt = attemptWith({ 1: ["C", "A"] });

  assert.equal(scoreAttempt(attempt, [asMulti]).byQuestion[0].correct, true);
  assert.equal(scoreAttempt(attempt, [asText]).byQuestion[0].correct, false);
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

test("scores multiple numbered questions from one instruction group", () => {
  const rules = [
    {
      questionNo: 17,
      groupId: "17-18",
      mode: "single",
      accepted: ["C"],
      normalize: ["trim", "lowercase"],
    },
    {
      questionNo: 18,
      groupId: "17-18",
      mode: "single",
      accepted: ["E"],
      normalize: ["trim", "lowercase"],
    },
  ];

  const report = scoreAttempt(attemptWith({ 17: "C", 18: "E" }), rules);

  assert.equal(report.total, 2);
  assert.equal(report.correct, 2);
  assert.deepEqual(report.byQuestion.map((row) => row.no), [17, 18]);
});

test("matching questions can be scored by stable option IDs", () => {
  const rule = {
    questionNo: 21,
    groupId: "21-22",
    mode: "single",
    answerKind: "optionId",
    accepted: ["option-b"],
    normalize: ["trim"],
  };

  const report = scoreAttempt(attemptWith({ 21: "option-b" }), [rule]);
  assert.equal(report.byQuestion[0].correct, true);
});

test("multi-answer rules honor explicit selectCount", () => {
  const rule = {
    questionNo: 22,
    groupId: "22-23",
    mode: "multi",
    accepted: ["A", "C"],
    selectCount: 2,
    normalize: ["trim", "lowercase"],
  };

  assert.equal(scoreAttempt(attemptWith({ 22: ["C", "A"] }), [rule]).correct, 1);
  assert.equal(scoreAttempt(attemptWith({ 22: ["A"] }), [rule]).correct, 0);
});
