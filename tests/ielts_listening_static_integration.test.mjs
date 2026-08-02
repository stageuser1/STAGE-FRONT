import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import {
  getListeningAvailability,
  getListeningSource,
} from "../lib/ielts/listening-catalog.ts";
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

test("the shared catalog reports the bank the library actually lists", async () => {
  const availability = await getListeningAvailability();

  // The number the overview's Listening card prints. It is the same call the
  // bank route makes, which is the point: the card cannot say 0 段 while the
  // list shows 203 rows, because there is one source of the figure.
  assert.equal(availability.available, true);
  assert.equal(availability.setIds.length, 203);
  assert.deepEqual(
    availability.setIds,
    (await source.listSets()).map((summary) => summary.id),
  );

  // One instance, so the 203 files are read once per worker rather than once
  // per route.
  assert.equal(getListeningSource(), getListeningSource());
});

test("every Listening route reads one shared source, and item JSON stays server-only", async () => {
  const read = (...segments) =>
    fs.readFile(path.join(projectRoot, ...segments), "utf8");

  const catalog = await read("lib", "ielts", "listening-catalog.ts");
  const overviewRoute = await read("app", "(ielts)", "ielts-lab", "(shell)", "page.tsx");
  const libraryRoute = await read(
    "app", "(ielts)", "ielts-lab", "(shell)", "listening", "page.tsx",
  );
  const practiceRoute = await read(
    "app", "(ielts)", "ielts-lab", "practice", "listening", "[setId]", "page.tsx",
  );

  // The catalog is the one module that builds a source. It used to be the two
  // routes, separately, and the overview built none at all — which is how its
  // Listening card came to read 0 while the bank held 203 sets.
  assert.match(catalog, /new StaticListeningSource/);

  for (const route of [overviewRoute, libraryRoute, practiceRoute]) {
    assert.match(route, /from "@\/lib\/ielts\/listening-catalog"/);
    assert.doesNotMatch(
      route,
      /new StaticListeningSource/,
      "a route that builds its own source can disagree with the others",
    );
    assert.doesNotMatch(route, /FixtureSetSource/);
  }

  // The overview must derive availability rather than assert it: no literal
  // total, and no card hard-coded inert.
  assert.match(overviewRoute, /getListeningAvailability/);

  const publicItems = path.join(projectRoot, "public", "ielts", "listening", "items");
  await assert.rejects(() => fs.access(publicItems));
});

