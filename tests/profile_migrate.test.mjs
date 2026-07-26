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
  assert.equal(p.english.labEstimate, null);
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

test("preserves a lab estimate with its provenance", () => {
  const result = migrateProfile({
    schemaVersion: 1,
    english: {
      labEstimate: {
        band: 6.5,
        questionCount: 40,
        recordCount: 3,
        computedAt: "2026-07-24T00:00:00.000Z",
        tableVersion: "academic-reading-2026-07",
      },
    },
  });
  assert.equal(result.status, "ok");
  assert.deepEqual(result.profile.english.labEstimate, {
    band: 6.5,
    questionCount: 40,
    recordCount: 3,
    computedAt: "2026-07-24T00:00:00.000Z",
    tableVersion: "academic-reading-2026-07",
  });
});

test("always stamps the current schema version on the way out", () => {
  const result = migrateProfile({ schemaVersion: 1, profileId: "p-abc" });
  assert.equal(result.status, "ok");
  assert.equal(result.profile.schemaVersion, PROFILE_SCHEMA_VERSION);
  assert.equal(result.profile.profileId, "p-abc");
});
