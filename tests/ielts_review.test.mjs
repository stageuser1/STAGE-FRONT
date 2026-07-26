import assert from "node:assert/strict";
import test from "node:test";

import {
  answerText,
  attemptsForExam,
  buildResultRows,
} from "../lib/ielts/review.ts";

function record(overrides = {}) {
  return {
    id: "r1",
    examId: "p1-high-01",
    title: "A Brief History of Tea",
    category: "P1",
    type: "reading",
    startTime: "2026-07-24T10:00:00.000Z",
    endTime: "2026-07-24T10:17:00.000Z",
    duration: 1020,
    score: 1,
    totalQuestions: 2,
    correctAnswers: 1,
    accuracy: 0.5,
    answers: {},
    answerComparison: {
      q2: {
        questionId: "q2",
        userAnswer: "vi",
        correctAnswer: "iv",
        isCorrect: false,
      },
      q10: {
        questionId: "q10",
        userAnswer: ["A", "B"],
        correctAnswer: ["A", "B"],
        isCorrect: true,
      },
    },
    correctAnswerMap: {},
    createdAt: "2026-07-24T10:17:00.000Z",
    version: "2.1.0",
    ...overrides,
  };
}

test("builds rows in natural question order without corpus data", () => {
  const rows = buildResultRows(record());
  assert.deepEqual(
    rows.map((row) => row.questionId),
    ["q2", "q10"],
  );
  // Display number falls back to the numeric part of the id.
  assert.deepEqual(
    rows.map((row) => row.displayNo),
    ["2", "10"],
  );
});

test("uses the corpus display map and question order when available", () => {
  const rows = buildResultRows(record(), {
    displayMap: { q2: "2", q10: "10" },
    questionOrder: ["q10", "q2"],
  });
  assert.deepEqual(
    rows.map((row) => row.questionId),
    ["q10", "q2"],
  );
});

test("prefers the stored question type over the resolver", () => {
  const withType = record();
  withType.answerComparison.q2.questionType = "matching";
  const rows = buildResultRows(withType, {
    resolveQuestionType: () => "single_choice",
  });
  const q2 = rows.find((row) => row.questionId === "q2");
  const q10 = rows.find((row) => row.questionId === "q10");
  assert.equal(q2.questionType, "matching");
  // The resolver only fills what the record does not carry.
  assert.equal(q10.questionType, "single_choice");
});

test("marks flagged questions", () => {
  const rows = buildResultRows(record({ markedQuestions: ["q10"] }));
  assert.equal(rows.find((r) => r.questionId === "q10").marked, true);
  assert.equal(rows.find((r) => r.questionId === "q2").marked, false);
});

test("returns an empty list for a record with no comparison data", () => {
  assert.deepEqual(buildResultRows(record({ answerComparison: {} })), []);
  assert.deepEqual(buildResultRows(record({ answerComparison: null })), []);
});

test("attemptsForExam returns newest first and only the matching exam", () => {
  const attempts = attemptsForExam(
    [
      record({ id: "a", createdAt: "2026-07-01T10:00:00.000Z" }),
      record({ id: "b", createdAt: "2026-07-24T10:00:00.000Z" }),
      record({ id: "c", examId: "p2-x", createdAt: "2026-07-30T10:00:00.000Z" }),
    ],
    "p1-high-01",
  );
  assert.deepEqual(
    attempts.map((a) => a.recordId),
    ["b", "a"],
  );
});

test("answerText renders arrays and blanks honestly", () => {
  assert.equal(answerText(["A", "B"]), "A, B");
  assert.equal(answerText(""), "（未作答）");
  assert.equal(answerText(undefined), "（未作答）");
  assert.equal(answerText("  viii "), "viii");
});
