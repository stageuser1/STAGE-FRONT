import assert from "node:assert/strict";
import test from "node:test";

import { migrateProfile } from "../lib/profile/migrate.ts";
import {
  PROFILE_SCHEMA_VERSION,
  createEmptyProfile,
} from "../lib/profile/types.ts";

test("round-trips a well-formed current-version profile", () => {
  const profile = createEmptyProfile();
  profile.discipline.fieldSlugs = ["Composition"];
  profile.english.currentOverall = 6.5;
  profile.english.currentSource = "self_reported";
  profile.steps.discipline = "answered";

  const result = migrateProfile(JSON.parse(JSON.stringify(profile)));
  assert.equal(result.status, "ok");
  assert.equal(result.migrated, false);
  assert.deepEqual(result.profile.discipline.fieldSlugs, ["Composition"]);
  assert.equal(result.profile.english.currentOverall, 6.5);
  assert.equal(result.profile.steps.discipline, "answered");
});

test("refuses to touch a profile from a newer build", () => {
  // Writing would silently downgrade and drop whatever the newer build added.
  const result = migrateProfile({ schemaVersion: PROFILE_SCHEMA_VERSION + 1 });
  assert.equal(result.status, "future");
  assert.equal(result.version, PROFILE_SCHEMA_VERSION + 1);
});

test("rejects values that are not profiles", () => {
  for (const raw of [null, undefined, 42, "profile", [], {}]) {
    assert.equal(migrateProfile(raw).status, "unmigratable", String(raw));
  }
});

test("fills every missing field rather than returning a partial object", () => {
  const result = migrateProfile({ schemaVersion: 1 });
  assert.equal(result.status, "ok");
  const p = result.profile;
  assert.deepEqual(p.discipline.fieldSlugs, []);
  assert.equal(p.discipline.instrument, null);
  assert.deepEqual(p.target.degreeSlugs, []);
  assert.equal(p.geography.budgetBand, null);
  assert.deepEqual(p.english.targets, {
    reading: null,
    listening: null,
    writing: null,
    speaking: null,
  });
  assert.deepEqual(Object.keys(p.steps).sort(), [
    "academic",
    "discipline",
    "english",
    "geography",
    "target",
  ]);
  assert.equal(p.steps.english, "pristine");
  assert.deepEqual(p.nudges, {});
});

test("discards junk field values instead of trusting them", () => {
  const result = migrateProfile({
    schemaVersion: 1,
    discipline: { fieldSlugs: ["ok", 5, null], instrument: "  " },
    target: "not-an-object",
    geography: { countries: "United States", budgetCeilingUsd: "40000" },
    english: { hasScore: "yes", currentOverall: "6.5" },
    steps: { discipline: "bogus", english: "answered" },
    nudges: { a: "2026-07-01", b: 5 },
  });

  assert.equal(result.status, "ok");
  const p = result.profile;
  assert.deepEqual(p.discipline.fieldSlugs, ["ok"]);
  assert.equal(p.discipline.instrument, null);
  assert.deepEqual(p.target.degreeSlugs, []);
  assert.deepEqual(p.geography.countries, []);
  assert.equal(p.geography.budgetCeilingUsd, null);
  assert.equal(p.english.hasScore, null);
  assert.equal(p.english.currentOverall, null);
  // An unrecognised step state falls back to pristine rather than propagating.
  assert.equal(p.steps.discipline, "pristine");
  assert.equal(p.steps.english, "answered");
  assert.deepEqual(p.nudges, { a: "2026-07-01" });
});

/* -------------------------- v1 → v2 (ruling C1) --------------------------- */

test("v1 → v2 keeps a self-reported score and its source", () => {
  const result = migrateProfile({
    schemaVersion: 1,
    english: {
      hasScore: true,
      test: "IELTS",
      currentOverall: 6.5,
      currentSource: "self_reported",
      targetOverall: 7,
    },
    steps: { english: "answered" },
  });

  assert.equal(result.status, "ok");
  assert.equal(result.migrated, true);
  const english = result.profile.english;
  assert.equal(english.currentOverall, 6.5);
  assert.equal(english.currentSource, "self_reported");
  assert.equal(english.targetOverall, 7);
  assert.equal(result.profile.steps.english, "answered");
});

test("v1 → v2 blanks a score that came from the old estimate", () => {
  // The estimate is abolished, not laundered: a number the product invented
  // does not become the learner's score by surviving a schema change.
  const result = migrateProfile({
    schemaVersion: 1,
    english: {
      hasScore: true,
      test: "IELTS",
      currentOverall: 6.0,
      currentSource: "lab_estimate",
      targetOverall: 7,
    },
  });

  assert.equal(result.status, "ok");
  assert.equal(result.profile.english.currentOverall, null);
  assert.equal(result.profile.english.currentSource, null);
  // The learner's own target is untouched by the deletion.
  assert.equal(result.profile.english.targetOverall, 7);
});

test("v1 → v2 drops the stored estimate object entirely", () => {
  const v1 = {
    schemaVersion: 1,
    english: {
      currentOverall: 6.5,
      currentSource: "self_reported",
      // The v1 estimate blob, whatever it held, has no home in v2.
      ["lab" + "Estimate"]: {
        band: 6.5,
        questionCount: 40,
        recordCount: 3,
        computedAt: "2026-07-24T00:00:00.000Z",
        tableVersion: "academic-reading-2026-07",
      },
    },
  };
  const result = migrateProfile(v1);

  assert.equal(result.status, "ok");
  assert.deepEqual(Object.keys(result.profile.english).sort(), [
    "currentOverall",
    "currentSource",
    "hasScore",
    "targetOverall",
    "targets",
    "test",
  ]);
});

test("v1 → v2 starts per-subject targets empty rather than inventing them", () => {
  // Nothing in v1 expressed a per-subject target, and copying the overall one
  // into four subjects would put words in the learner's mouth.
  const result = migrateProfile({
    schemaVersion: 1,
    english: { targetOverall: 7 },
  });
  assert.equal(result.status, "ok");
  assert.deepEqual(result.profile.english.targets, {
    reading: null,
    listening: null,
    writing: null,
    speaking: null,
  });
});

test("v2 round-trips per-subject targets, clamped to the half-band scale", () => {
  const result = migrateProfile({
    schemaVersion: 2,
    english: {
      targets: { reading: 7, listening: 6.4, writing: 12, speaking: "x" },
    },
  });
  assert.equal(result.status, "ok");
  assert.equal(result.migrated, false);
  assert.deepEqual(result.profile.english.targets, {
    reading: 7,
    listening: 6.5,
    writing: 9,
    speaking: null,
  });
});

test("always stamps the current schema version on the way out", () => {
  const result = migrateProfile({ schemaVersion: 1, profileId: "p-abc" });
  assert.equal(result.status, "ok");
  assert.equal(result.profile.schemaVersion, PROFILE_SCHEMA_VERSION);
  assert.equal(result.profile.profileId, "p-abc");
});
