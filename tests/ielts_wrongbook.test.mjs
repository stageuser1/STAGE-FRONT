/**
 * Wrongbook derivation.
 *
 * Run with `node --test --experimental-strip-types` (see package.json
 * `test:lib`): the modules under test are TypeScript but import nothing except
 * types, so Node's type stripping is enough and no bundler is involved.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWrongbook,
  wrongQuestionCount,
  wrongbookCount,
  wrongbookTypeCounts,
} from "../lib/ielts/wrongbook.ts";

/** Minimal record factory: only the fields the derivation reads. */
function record({
  id,
  examId = "p1-high-01",
  title = "A Brief History of Tea",
  createdAt,
  category = "P1",
  frequency = "high",
  answers,
  totalQuestions = 13,
}) {
  const answerComparison = {};
  answers.forEach(([questionId, isCorrect, type], index) => {
    answerComparison[questionId] = {
      questionId,
      userAnswer: isCorrect ? "right" : "wrong",
      correctAnswer: "right",
      isCorrect,
      ...(type ? { questionType: type } : {}),
    };
    void index;
  });
  const correct = answers.filter(([, isCorrect]) => isCorrect).length;
  return {
    id,
    examId,
    title,
    category,
    frequency,
    type: "reading",
    startTime: createdAt,
    endTime: createdAt,
    duration: 600,
    score: correct,
    totalQuestions,
    correctAnswers: correct,
    accuracy: answers.length > 0 ? correct / answers.length : 0,
    answers: {},
    answerComparison,
    correctAnswerMap: {},
    createdAt,
    version: "2.1.0",
  };
}

test("includes an exam whose latest attempt has wrong answers", () => {
  const records = [
    record({
      id: "r2",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [
        ["q1", true],
        ["q2", false],
      ],
    }),
  ];
  const entries = buildWrongbook(records);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].wrongCount, 1);
  assert.equal(entries[0].latestRecordId, "r2");
  assert.equal(entries[0].attempts, 1);
});

test("excludes an exam whose latest attempt is perfect, despite earlier failures", () => {
  const records = [
    record({
      id: "new",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [
        ["q1", true],
        ["q2", true],
      ],
    }),
    record({
      id: "old",
      createdAt: "2026-07-01T10:00:00.000Z",
      answers: [
        ["q1", false],
        ["q2", false],
      ],
    }),
  ];
  assert.deepEqual(buildWrongbook(records), []);
  assert.equal(wrongbookCount(records), 0);
});

test("includes an exam whose latest attempt failed, despite an earlier perfect one", () => {
  const records = [
    record({
      id: "new",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [
        ["q1", false],
        ["q2", true],
      ],
    }),
    record({
      id: "old",
      createdAt: "2026-07-01T10:00:00.000Z",
      answers: [
        ["q1", true],
        ["q2", true],
      ],
    }),
  ];
  const entries = buildWrongbook(records);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].latestRecordId, "new");
  assert.equal(entries[0].attempts, 2);
});

test("picks the latest attempt by timestamp even when the list is unsorted", () => {
  // An imported history may arrive in any order.
  const records = [
    record({
      id: "old",
      createdAt: "2026-07-01T10:00:00.000Z",
      answers: [["q1", false]],
    }),
    record({
      id: "new",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [["q1", true]],
    }),
  ];
  assert.deepEqual(buildWrongbook(records), []);
});

test("tolerates a record with no per-question data", () => {
  const records = [
    record({ id: "r1", createdAt: "2026-07-24T10:00:00.000Z", answers: [] }),
  ];
  assert.deepEqual(buildWrongbook(records), []);
});

test("backfills category and frequency from the catalog for pre-2.1.0 records", () => {
  const legacy = record({
    id: "r1",
    createdAt: "2026-07-24T10:00:00.000Z",
    answers: [["q1", false]],
  });
  delete legacy.frequency;
  legacy.category = "";

  const entries = buildWrongbook([legacy], {
    exams: [
      {
        id: "p1-high-01",
        title: "A Brief History of Tea",
        category: "P1",
        frequency: "high",
        interactive: true,
        hasExplanation: true,
      },
    ],
  });
  assert.equal(entries[0].category, "P1");
  assert.equal(entries[0].frequency, "high");
  assert.equal(entries[0].orphaned, false);
});

test("flags an exam that has left the corpus", () => {
  const entries = buildWrongbook(
    [
      record({
        id: "r1",
        examId: "gone-99",
        createdAt: "2026-07-24T10:00:00.000Z",
        answers: [["q1", false]],
      }),
    ],
    { exams: [] },
  );
  assert.equal(entries[0].orphaned, true);
});

test("sorts by latest wrong time, most wrong, and title", () => {
  const records = [
    record({
      id: "a",
      examId: "p1-a",
      title: "Beta",
      createdAt: "2026-07-01T10:00:00.000Z",
      answers: [
        ["q1", false],
        ["q2", false],
      ],
    }),
    record({
      id: "b",
      examId: "p1-b",
      title: "Alpha",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [["q1", false]],
    }),
  ];

  assert.deepEqual(
    buildWrongbook(records, { filters: { sort: "recent" } }).map((e) => e.examId),
    ["p1-b", "p1-a"],
  );
  assert.deepEqual(
    buildWrongbook(records, { filters: { sort: "most_wrong" } }).map(
      (e) => e.examId,
    ),
    ["p1-a", "p1-b"],
  );
  assert.deepEqual(
    buildWrongbook(records, { filters: { sort: "title" } }).map((e) => e.title),
    ["Alpha", "Beta"],
  );
});

test("filters by category, frequency, question type and search", () => {
  const records = [
    record({
      id: "a",
      examId: "p1-a",
      title: "Tea",
      category: "P1",
      frequency: "high",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [["q1", false, "matching"]],
    }),
    record({
      id: "b",
      examId: "p3-b",
      title: "Yawning",
      category: "P3",
      frequency: "low",
      createdAt: "2026-07-23T10:00:00.000Z",
      answers: [["q1", false, "single_choice"]],
    }),
  ];

  assert.equal(
    buildWrongbook(records, { filters: { category: "P3" } }).length,
    1,
  );
  assert.equal(
    buildWrongbook(records, { filters: { frequency: "high" } })[0].examId,
    "p1-a",
  );
  assert.equal(
    buildWrongbook(records, { filters: { questionType: "matching" } })[0]
      .examId,
    "p1-a",
  );
  assert.equal(
    buildWrongbook(records, { filters: { search: "yawn" } })[0].examId,
    "p3-b",
  );
});

test("orders wrong questions naturally, not lexicographically", () => {
  const entries = buildWrongbook([
    record({
      id: "r1",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [
        ["q10", false],
        ["q2", false],
      ],
    }),
  ]);
  assert.deepEqual(
    entries[0].questions.map((q) => q.questionId),
    ["q2", "q10"],
  );
});

test("counts wrong questions and question types across entries", () => {
  const entries = buildWrongbook([
    record({
      id: "a",
      examId: "p1-a",
      createdAt: "2026-07-24T10:00:00.000Z",
      answers: [
        ["q1", false, "matching"],
        ["q2", false, "matching"],
      ],
    }),
    record({
      id: "b",
      examId: "p2-b",
      createdAt: "2026-07-23T10:00:00.000Z",
      answers: [["q1", false, "single_choice"]],
    }),
  ]);

  assert.equal(wrongQuestionCount(entries), 3);
  assert.deepEqual(wrongbookTypeCounts(entries), [
    { type: "matching", count: 2 },
    { type: "single_choice", count: 1 },
  ]);
});
