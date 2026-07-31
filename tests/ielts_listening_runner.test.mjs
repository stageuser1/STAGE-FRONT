/**
 * The attempt state machine.
 *
 * The load-bearing rule is that a submitted attempt is frozen: a late timer
 * tick or a second submit click must not be able to change what was handed in.
 * The round trip is asserted too, because B4 persists attempts through it.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  createAttempt,
  deserializeAttempt,
  questionNumbers,
  reduce,
  serializeAttempt,
  unansweredQuestions,
} from "../lib/ielts/listening-runner.ts";
import { MUSEUM_MEMBERSHIP_SET } from "../lib/ielts/listening-fixture.ts";

const STARTED_AT = "2026-07-31T09:00:00.000Z";

const newAttempt = () => createAttempt(MUSEUM_MEMBERSHIP_SET, STARTED_AT);

test("a new attempt is empty and in progress", () => {
  const attempt = newAttempt();
  assert.equal(attempt.setId, MUSEUM_MEMBERSHIP_SET.id);
  assert.deepEqual(attempt.answers, {});
  assert.equal(attempt.startedAt, STARTED_AT);
  assert.equal(attempt.elapsedSec, 0);
  assert.equal(attempt.status, "in_progress");
});

test("answer then clearAnswer returns to the starting state", () => {
  const start = newAttempt();
  const answered = reduce(start, { type: "answer", questionNo: 4, value: "silver" });

  assert.deepEqual(answered.answers[4], { questionNo: 4, value: "silver" });
  assert.deepEqual(start.answers, {}, "the original attempt is not mutated");

  const cleared = reduce(answered, { type: "clearAnswer", questionNo: 4 });
  assert.deepEqual(cleared.answers, {});
  assert.deepEqual(answered.answers[4], { questionNo: 4, value: "silver" });
});

test("answering again replaces the previous value", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: ["A"] });
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: ["A", "C"] });
  assert.deepEqual(attempt.answers[6].value, ["A", "C"]);
});

test("tick accumulates elapsed seconds", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "tick", seconds: 1 });
  attempt = reduce(attempt, { type: "tick", seconds: 1 });
  attempt = reduce(attempt, { type: "tick", seconds: 30 });
  assert.equal(attempt.elapsedSec, 32);
});

test("every action after submit is a no-op", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "answer", questionNo: 1, value: "Marchetti" });
  const submitted = reduce(attempt, { type: "submit" });

  assert.equal(submitted.status, "submitted");

  for (const action of [
    { type: "answer", questionNo: 1, value: "changed" },
    { type: "answer", questionNo: 2, value: "1 5TR" },
    { type: "clearAnswer", questionNo: 1 },
    { type: "tick", seconds: 5 },
    { type: "submit" },
  ]) {
    assert.equal(
      reduce(submitted, action),
      submitted,
      `${action.type} altered a submitted attempt`,
    );
  }
});

test("questionNumbers reads every blank and every single-question group", () => {
  assert.deepEqual(questionNumbers(MUSEUM_MEMBERSHIP_SET), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("unansweredQuestions lists what the submit dialog must warn about", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "answer", questionNo: 1, value: "Marchetti" });
  attempt = reduce(attempt, { type: "answer", questionNo: 3, value: "07700 900142" });
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: ["A", "C"] });

  assert.deepEqual(unansweredQuestions(attempt, MUSEUM_MEMBERSHIP_SET), [2, 4, 5, 7, 8]);
});

test("blank text and an empty selection both count as unanswered", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "answer", questionNo: 1, value: "   " });
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: [] });

  const unanswered = unansweredQuestions(attempt, MUSEUM_MEMBERSHIP_SET);
  assert.ok(unanswered.includes(1));
  assert.ok(unanswered.includes(6));
});

test("serialize then deserialize returns an identical attempt", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "answer", questionNo: 1, value: "Marchetti" });
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: ["A", "C"] });
  attempt = reduce(attempt, { type: "tick", seconds: 42 });
  attempt = reduce(attempt, { type: "submit" });

  const restored = deserializeAttempt(serializeAttempt(attempt));

  assert.deepEqual(restored, attempt);
  assert.deepEqual(restored.answers[6].value, ["A", "C"]);
  assert.equal(restored.elapsedSec, 42);
  assert.equal(restored.status, "submitted");
});
