import test from "node:test";
import assert from "node:assert/strict";

import { questionNumbers } from "../lib/ielts/listening-runner.ts";
import { StaticListeningSource } from "../lib/ielts/listening-static-source.ts";

const source = new StaticListeningSource({
  dataRoot: "D:\\STAGE LISTENING DATA",
});

function hasAnswerKey(value) {
  if (Array.isArray(value)) return value.some(hasAnswerKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) =>
    key === "answer" || key === "answerRules" || hasAnswerKey(nested),
  );
}

test("listSets reads all 203 migrated item JSON files", async () => {
  const summaries = await source.listSets();

  assert.equal(summaries.length, 203);
  assert.deepEqual(summaries.find((summary) => summary.id === "p2-101-saving-energy"), {
    id: "p2-101-saving-energy",
    title: "Saving Energy",
    titleZh: "Saving Energy",
    part: 2,
    frequency: "mid",
    questionCount: 10,
  });
});

test("getSet maps audio, form, question groups, and image URLs", async () => {
  const set = await source.getSet("p2-101-saving-energy");

  assert.equal(set.titleZh, "Saving Energy");
  assert.equal(set.frequency, "mid");
  assert.equal(set.audioUrl, "/ielts/listening/audio/audio-9d994c8c4966.m4a");
  assert.deepEqual(set.audioMetadata, {
    container: "mp4/m4a",
    checksum: "sha256:119d4a1281c1ded6ad6e8ebefa37471e897e4fe486ff5564ad101803d60961e5",
  });
  assert.equal(set.transcriptRef, "p2-101-saving-energy#transcript");
  assert.deepEqual(questionNumbers(set), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

  const multiple = set.questionGroups.find(
    (group) => group.type === "mcq_multi" && group.groupId === "17-18",
  );
  assert.ok(multiple);
  assert.deepEqual(multiple.questions.map((question) => question.questionNo), [17, 18]);
  assert.equal(multiple.questions[0].prompt, "Which TWO water-saving tips does Jill recommend?");
  assert.equal(multiple.questions[0].selectCount, 1);
  assert.deepEqual(multiple.questions[0].options[2], {
    label: "C",
    text: "boil only as much water as you need",
  });

  const mapSet = await source.getSet("p2-21-map-of-melbourne-zoo");
  const map = mapSet.questionGroups.find((group) => group.type === "map_labelling");
  assert.ok(map);
  assert.equal(
    map.imageUrl,
    "/ielts/listening/images/image-p2-21-map-of-melbourne-zoo-map-png-map.png",
  );
  assert.deepEqual(map.questions.map((question) => question.questionNo), [16, 17, 18, 19, 20]);

  const fillSet = await source.getSet("p1-1-asia-pacific-tours-activity-holidays");
  const fill = fillSet.questionGroups[0];
  assert.equal(fill.type, "form_completion");
  assert.equal(fill.layout, "table");
  assert.deepEqual(questionNumbers(fillSet), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  assert.equal(hasAnswerKey(set), false, "getSet must not expose raw answers");
});

test("matching preserves option IDs and display text", async () => {
  const set = await source.getSet("p1-17-birthday-party-arrangement");
  const matching = set.questionGroups.find((group) => group.type === "matching");

  assert.ok(matching);
  assert.deepEqual(matching.options, ["A", "B", "C", "D"]);
  assert.deepEqual(matching.optionItems[1], {
    id: "B",
    text: "Star Hotel",
  });
  assert.deepEqual(matching.questions[0].options[1], {
    id: "B",
    text: "Star Hotel",
  });
});

test("getScoringRules returns question-level rules with group IDs", async () => {
  const rules = await source.getScoringRules("p2-101-saving-energy");

  assert.equal(rules.length, 10);
  const byQuestion = new Map(rules.map((rule) => [rule.questionNo, rule]));
  assert.deepEqual(byQuestion.get(11).accepted, ["A"]);
  assert.deepEqual(byQuestion.get(17), {
    questionNo: 17,
    groupId: "17-18",
    mode: "single",
    accepted: ["C"],
    answerKind: "optionId",
    selectCount: 1,
    normalize: ["trim"],
  });
  assert.deepEqual(byQuestion.get(18).accepted, ["E"]);

  const matchingRules = await source.getScoringRules("p1-17-birthday-party-arrangement");
  assert.equal(matchingRules[0].answerKind, "optionId");
  assert.deepEqual(matchingRules[0].accepted, ["B"]);
});

test("unknown static IDs reject", async () => {
  await assert.rejects(
    () => source.getSet("not-a-real-listening-item"),
    /Unknown listening set/,
  );
  await assert.rejects(
    () => source.getScoringRules("not-a-real-listening-item"),
    /Unknown listening set/,
  );
});
