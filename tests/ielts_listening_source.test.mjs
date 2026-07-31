/**
 * The fixture source, and the shape guarantees the UI batches will rely on.
 *
 * The summary's `questionCount` is derived rather than typed in, so the test
 * that pins it to 8 is really a test that the set still carries eight
 * questions across all five group types.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { FixtureSetSource } from "../lib/ielts/listening-fixture.ts";
import { questionNumbers } from "../lib/ielts/listening-runner.ts";

const source = new FixtureSetSource();

test("getSet resolves the fixture set", async () => {
  const set = await source.getSet("museum-membership-enquiry");
  assert.equal(set.id, "museum-membership-enquiry");
  assert.equal(set.title, "Museum Membership Enquiry");
  assert.equal(set.part, 1);
  assert.equal(set.audioUrl, "/fixtures/audio/silence-placeholder.mp3");
  assert.deepEqual(questionNumbers(set), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("listSets returns a summary with a question count of 8", async () => {
  const summaries = await source.listSets();
  assert.equal(summaries.length, 1);

  const [summary] = summaries;
  assert.equal(summary.id, "museum-membership-enquiry");
  assert.equal(summary.titleZh, "博物馆会员咨询");
  assert.equal(summary.frequency, "high");
  assert.equal(summary.questionCount, 8);
  assert.equal("questionGroups" in summary, false, "the list payload carries no groups");
});

test("an unknown id rejects rather than resolving undefined", async () => {
  await assert.rejects(() => source.getSet("no-such-set"), /Unknown listening set/);
  await assert.rejects(() => source.getScoringRules("no-such-set"), /Unknown listening set/);
});

// `mcq_single` is typed but unused: the eight questions this set is specified
// to hold leave no slot for it. Adding a ninth question would break the count
// the library page asserts, so the type is exercised by the compiler only.
test("the set covers every group type its eight questions allow", async () => {
  const set = await source.getSet("museum-membership-enquiry");
  assert.deepEqual(
    [...new Set(set.questionGroups.map((group) => group.type))].sort(),
    ["form_completion", "map_labelling", "matching", "mcq_multi"],
  );

  const multi = set.questionGroups.find((group) => group.type === "mcq_multi");
  assert.equal(multi.selectCount, 2);
  assert.deepEqual(
    multi.options.map((option) => option.label),
    ["A", "B", "C", "D", "E"],
  );

  const map = set.questionGroups.find((group) => group.type === "map_labelling");
  assert.deepEqual(map.labels, ["A", "B", "C", "D", "E"]);

  const matching = set.questionGroups.find((group) => group.type === "matching");
  assert.equal(matching.options.length, 3);
});

test("the form rows carry all four inline segment patterns", async () => {
  const set = await source.getSet("museum-membership-enquiry");
  const form = set.questionGroups.find((group) => group.type === "form_completion");

  /** A row's segments as a compact shape string, e.g. `text:Helena|blank`. */
  const shape = (row) =>
    row.segments
      .map((segment) => (segment.kind === "text" ? `text:${segment.value}` : "blank"))
      .join("|");

  const shapes = form.rows.map(shape);
  assert.ok(shapes.includes("text:Helena|blank"));
  assert.ok(shapes.includes("text:BS|blank"));
  assert.ok(shapes.includes("blank|text:membership"));
  assert.ok(shapes.includes("text:£|blank"));
});

test("getScoringRules covers every question exactly once", async () => {
  const rules = await source.getScoringRules("museum-membership-enquiry");
  assert.deepEqual(
    rules.map((rule) => rule.questionNo),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.ok(
    rules.every((rule) => rule.accepted.length > 0),
    "every question has at least one accepted answer",
  );
  assert.ok(
    rules.filter((rule) => rule.accepted.length > 1).length >= 2,
    "at least two questions accept more than one answer",
  );
});

test("every rule declares a mode matching its question's group type", async () => {
  const rules = await source.getScoringRules("museum-membership-enquiry");
  const modeOf = (no) => rules.find((rule) => rule.questionNo === no).mode;

  // Q1–5 are form blanks, Q6 is the "choose TWO" group, Q7 and Q8 each pick
  // one printed option.
  assert.deepEqual([1, 2, 3, 4, 5].map(modeOf), Array(5).fill("text"));
  assert.equal(modeOf(6), "multi");
  assert.equal(modeOf(7), "single");
  assert.equal(modeOf(8), "single");
});
