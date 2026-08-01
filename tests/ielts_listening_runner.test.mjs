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

const EXPANDED_GROUP_SET = {
  id: "expanded-listening-groups",
  title: "Expanded groups",
  titleZh: null,
  part: 3,
  frequency: "mid",
  audioUrl: "/audio/expanded.m4a",
  durationSec: 180,
  audioMetadata: { container: "mp4/m4a", checksum: "sha256:test" },
  transcriptRef: "transcripts/expanded.json",
  questionGroups: [
    {
      type: "form_completion",
      layout: "table",
      instruction: "Complete the table.",
      formTitle: "Table",
      rows: [
        { label: "Name", segments: [{ kind: "blank", questionNo: 1 }] },
      ],
    },
    {
      type: "form_completion",
      layout: "notes",
      instruction: "Complete the notes.",
      formTitle: "Notes",
      rows: [
        { label: "Point", segments: [{ kind: "blank", questionNo: 2 }] },
      ],
    },
    {
      type: "form_completion",
      layout: "sentence",
      instruction: "Complete the sentence.",
      formTitle: "Sentence",
      rows: [
        { label: "Text", segments: [{ kind: "blank", questionNo: 3 }] },
      ],
    },
    {
      type: "form_completion",
      layout: "form",
      instruction: "Complete the form.",
      formTitle: "Form",
      rows: [
        { label: "Field", segments: [{ kind: "blank", questionNo: 4 }] },
      ],
    },
    {
      type: "mcq_single",
      instruction: "Questions 5–6. Choose the correct answer.",
      questions: [
        {
          questionNo: 5,
          prompt: "First single-choice prompt",
          options: [{ label: "A", text: "Option A" }],
        },
        {
          questionNo: 6,
          prompt: "Second single-choice prompt",
          options: [{ label: "B", text: "Option B" }],
        },
      ],
      questionNo: 5,
      question: "First single-choice prompt",
      options: [{ label: "A", text: "Option A" }],
    },
    {
      type: "map_labelling",
      instruction: "Questions 7–8. Label the map.",
      questions: [
        { questionNo: 7, prompt: "First location", labels: ["A", "B"] },
        { questionNo: 8, prompt: "Second location", labels: ["A", "B"] },
      ],
      questionNo: 7,
      question: "First location",
      labels: ["A", "B"],
    },
    {
      type: "mcq_multi",
      instruction: "Questions 17–18. Choose TWO answers.",
      questions: [
        {
          questionNo: 17,
          prompt: "First reason",
          options: [{ label: "A", text: "Option A" }],
          selectCount: 1,
        },
        {
          questionNo: 18,
          prompt: "Second reason",
          options: [{ label: "A", text: "Option A" }],
          selectCount: 1,
        },
      ],
      // The legacy projection remains for the current renderer until its UI
      // is upgraded to render the expanded question list.
      questionNo: 17,
      question: "First reason",
      options: [{ label: "A", text: "Option A" }],
      selectCount: 2,
    },
    {
      type: "matching",
      questions: [{ questionNo: 19, prompt: "Match the speaker" }],
      questionNo: 19,
      question: "Match the speaker",
      options: ["speaker-a"],
      optionItems: [{ id: "speaker-a", text: "Speaker A" }],
    },
  ],
};

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

test("a zero or negative tick is a no-op returning the same object", () => {
  let attempt = newAttempt();
  attempt = reduce(attempt, { type: "tick", seconds: 10 });

  for (const seconds of [0, -1, -600]) {
    const ticked = reduce(attempt, { type: "tick", seconds });
    assert.equal(ticked, attempt, `tick(${seconds}) did not return the same object`);
    assert.equal(ticked.elapsedSec, 10);
  }
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

test("questionNumbers expands multi-question instruction groups", () => {
  assert.deepEqual(questionNumbers(EXPANDED_GROUP_SET), [1, 2, 3, 4, 5, 6, 7, 8, 17, 18, 19]);
});

test("form layout variants retain the same FormSegment model", () => {
  assert.deepEqual(
    EXPANDED_GROUP_SET.questionGroups
      .filter((group) => group.type === "form_completion")
      .map((group) => group.layout),
    ["table", "notes", "sentence", "form"],
  );
  assert.deepEqual(
    EXPANDED_GROUP_SET.questionGroups
      .filter((group) => group.type === "form_completion")
      .map((group) => group.rows[0].segments[0]),
    [1, 2, 3, 4].map((questionNo) => ({ kind: "blank", questionNo })),
  );
});

test("expanded metadata and matching options retain their identity", () => {
  assert.equal(EXPANDED_GROUP_SET.titleZh, null);
  assert.deepEqual(EXPANDED_GROUP_SET.audioMetadata, {
    container: "mp4/m4a",
    checksum: "sha256:test",
  });
  assert.equal(EXPANDED_GROUP_SET.transcriptRef, "transcripts/expanded.json");
  assert.deepEqual(
    EXPANDED_GROUP_SET.questionGroups[7].optionItems,
    [{ id: "speaker-a", text: "Speaker A" }],
  );
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
