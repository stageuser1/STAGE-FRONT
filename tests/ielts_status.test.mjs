import assert from "node:assert/strict";
import test from "node:test";

import { buildLatestWrongIndex, examStatus } from "../lib/ielts/status.ts";

const progress = {
  attempts: 1,
  bestAccuracy: 0.8,
  lastAccuracy: 0.8,
  lastAttemptAt: "2026-07-24T10:00:00.000Z",
  lastRecordId: "r1",
};

const draft = {
  examId: "p1-high-01",
  updatedAt: "2026-07-25T10:00:00.000Z",
  answered: 4,
  total: 13,
};

test("no progress and no draft is unstarted", () => {
  assert.equal(examStatus(undefined), "unstarted");
});

test("a draft wins over completed history", () => {
  assert.equal(examStatus(progress, draft, 0), "pending");
  assert.equal(examStatus(undefined, draft), "pending");
});

test("completed with wrong answers is a distinct state", () => {
  assert.equal(examStatus(progress, undefined, 3), "completed_with_errors");
  assert.equal(examStatus(progress, undefined, 0), "completed");
});

test("an unknown wrong count falls back to completed", () => {
  assert.equal(examStatus(progress), "completed");
});

function record(id, examId, createdAt, results) {
  const answerComparison = {};
  results.forEach((isCorrect, index) => {
    answerComparison[`q${index + 1}`] = {
      questionId: `q${index + 1}`,
      userAnswer: "x",
      correctAnswer: "y",
      isCorrect,
    };
  });
  return { id, examId, createdAt, answerComparison };
}

test("latest wrong index reads only the newest attempt per exam", () => {
  const index = buildLatestWrongIndex([
    record("new", "p1-a", "2026-07-24T10:00:00.000Z", [true, true]),
    record("old", "p1-a", "2026-07-01T10:00:00.000Z", [false, false]),
    record("b", "p2-b", "2026-07-20T10:00:00.000Z", [true, false]),
  ]);

  assert.equal(index.get("p1-a"), 0);
  assert.equal(index.get("p2-b"), 1);
  // Present with 0 rather than absent: "no errors" and "never attempted"
  // are different states and the chip must be able to tell them apart.
  assert.equal(index.has("p1-a"), true);
  assert.equal(index.has("p3-c"), false);
});
