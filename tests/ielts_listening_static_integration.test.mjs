import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { scoreAttempt } from "../lib/ielts/listening-scoring.ts";
import { StaticListeningSource } from "../lib/ielts/listening-static-source.ts";

const projectRoot = process.cwd();
const dataRoot = path.join(projectRoot, "data", "ielts", "listening");
const source = new StaticListeningSource({ dataRoot });

test("the integrated static source discovers 203 internal items", async () => {
  const summaries = await source.listSets();
  assert.equal(summaries.length, 203);
  assert.ok(summaries.some((summary) => summary.id === "p1-1-asia-pacific-tours-activity-holidays"));
  assert.ok(summaries.some((summary) => summary.id === "p4-93-the-music-of-salvatore-sciarrino"));
});

test("the integrated source loads a real internal item and media URLs", async () => {
  const set = await source.getSet("p2-21-map-of-melbourne-zoo");

  assert.equal(set.id, "p2-21-map-of-melbourne-zoo");
  assert.equal(set.part, 2);
  assert.match(set.audioUrl, /^\/ielts\/listening\/audio\/audio-[a-f0-9]+\.mp3$/);

  const map = set.questionGroups.find((group) => group.type === "map_labelling");
  assert.ok(map);
  assert.match(map.imageUrl, /^\/ielts\/listening\/images\/image-.*\.png$/);
});

test("integrated scoring rules score the migrated multiple-choice answers", async () => {
  const setId = "p2-101-saving-energy";
  const rules = await source.getScoringRules(setId);
  const attempt = {
    setId,
    answers: {
      17: { questionNo: 17, value: "C" },
      18: { questionNo: 18, value: "E" },
      19: { questionNo: 19, value: "A" },
      20: { questionNo: 20, value: "C" },
    },
    startedAt: "2026-08-01T00:00:00.000Z",
    elapsedSec: 0,
    status: "submitted",
  };

  const report = scoreAttempt(attempt, rules);
  assert.equal(report.total, 10);
  assert.equal(report.correct, 4);
  assert.deepEqual(
    report.byQuestion.filter((question) => question.correct).map((question) => question.no),
    [17, 18, 19, 20],
  );
});

test("route seams use StaticListeningSource and keep item JSON server-only", async () => {
  const libraryRoute = await fs.readFile(
    path.join(projectRoot, "app", "(ielts)", "ielts-lab", "(shell)", "listening", "page.tsx"),
    "utf8",
  );
  const practiceRoute = await fs.readFile(
    path.join(projectRoot, "app", "(ielts)", "ielts-lab", "practice", "listening", "[setId]", "page.tsx"),
    "utf8",
  );

  for (const route of [libraryRoute, practiceRoute]) {
    assert.match(route, /StaticListeningSource/);
    assert.doesNotMatch(route, /FixtureSetSource/);
  }

  const publicItems = path.join(projectRoot, "public", "ielts", "listening", "items");
  await assert.rejects(() => fs.access(publicItems));
});

