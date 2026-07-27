import assert from "node:assert/strict";
import test from "node:test";

import { buildActions } from "../lib/dashboard/actions.ts";
import { buildReadiness, upcomingDeadlines } from "../lib/dashboard/readiness.ts";
import { createEmptyProfile } from "../lib/profile/types.ts";

const DAY = 86_400_000;

/**
 * Deadline `days` calendar days from today, in the *local* calendar.
 *
 * Deadlines are calendar dates, and every consumer of them (`daysUntil`,
 * `upcomingDeadlines`, the readiness dimensions) parses `YYYY-MM-DD` as local
 * midnight — a Chinese applicant's "10 天后截止" counts from their own today.
 * Building the fixture with `toISOString()` produced a UTC calendar date
 * instead, so east-of-UTC zones disagreed with the code under test for the
 * part of the day where the two calendars differ: in Asia/Shanghai every
 * expectation shifted by one day between 00:00 and 08:00 local. Ticking the
 * local calendar keeps the fixture and the code on the same day everywhere.
 */
const isoIn = (days) => {
  // Noon, so a DST transition cannot land on a local midnight that does not
  // exist or happens twice.
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

function savedProgram(overrides = {}) {
  const snapshot = {
    capturedAt: new Date().toISOString(),
    programName: "Master of Music, Violin",
    programNameZh: "音乐硕士 小提琴",
    schoolName: "Test Conservatory",
    degreeLabel: "音乐硕士",
    country: "United States",
    city: "New York",
    applicationDeadline: isoIn(60),
    prescreeningDeadline: null,
    auditionDate: null,
    ieltsMinimum: "6.5",
    tuitionAnnual: 50000,
    tuitionCurrency: "USD",
    lastCheckedAt: "2026-03-11",
    workflowStatus: "published",
    ...(overrides.snapshot ?? {}),
  };
  return {
    schemaVersion: 1,
    programId: overrides.programId ?? "1",
    schoolId: "test",
    savedAt: new Date().toISOString(),
    snapshot,
  };
}

function profileWithBand(band) {
  const profile = createEmptyProfile();
  profile.english.currentOverall = band;
  profile.english.currentSource = "self_reported";
  for (const step of Object.keys(profile.steps)) profile.steps[step] = "answered";
  return profile;
}

test("a brand-new user is told to build a profile, not that there is nothing to do", () => {
  const actions = buildActions({ profile: null, saved: [], records: [] });
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, "profile_hole");
  assert.equal(actions[0].cta.label, "建立档案");
});

test("all-clear appears only when no generator has anything to say", () => {
  // Complete profile, requirement met, distant deadline, no practice history.
  const profile = profileWithBand(7.0);
  const actions = buildActions({
    profile,
    saved: [savedProgram({ snapshot: { applicationDeadline: isoIn(300) } })],
    records: [],
  });
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, "all_clear");
});

test("an IELTS shortfall produces an imperative card citing its evidence", () => {
  const actions = buildActions({
    profile: profileWithBand(6.0),
    saved: [savedProgram()],
    records: [],
  });
  const gap = actions.find((a) => a.kind === "ielts_gap");
  assert.ok(gap, "expected an ielts_gap action");
  assert.equal(gap.title, "提高雅思 0.5 分");
  // The why-line must cite the requirement and the learner's own figure.
  assert.match(gap.why, /6\.5/);
  assert.match(gap.why, /6\.0/);
});

test("no IELTS card once the requirement is met", () => {
  const actions = buildActions({
    profile: profileWithBand(7.0),
    saved: [savedProgram()],
    records: [],
  });
  assert.equal(actions.find((a) => a.kind === "ielts_gap"), undefined);
});

test("a near deadline outranks everything else", () => {
  const actions = buildActions({
    profile: profileWithBand(6.0),
    saved: [savedProgram({ snapshot: { applicationDeadline: isoIn(10) } })],
    records: [],
  });
  assert.equal(actions[0].kind, "deadline");
  assert.match(actions[0].title, /10 天后截止/);
});

test("a deadline beyond the window produces no card", () => {
  const actions = buildActions({
    profile: profileWithBand(7.0),
    saved: [savedProgram({ snapshot: { applicationDeadline: isoIn(200) } })],
    records: [],
  });
  assert.equal(actions.find((a) => a.kind === "deadline"), undefined);
});

test("an incomplete profile asks for the first missing step only", () => {
  const profile = createEmptyProfile();
  profile.steps.discipline = "answered";
  const actions = buildActions({ profile, saved: [], records: [] });
  const hole = actions.find((a) => a.kind === "profile_hole");
  assert.ok(hole);
  assert.match(hole.title, /目标学位/);
});

test("dismissed actions are suppressed but still recoverable", () => {
  const profile = profileWithBand(6.0);
  const input = { profile, saved: [savedProgram()], records: [] };
  const before = buildActions(input);
  const gap = before.find((a) => a.kind === "ielts_gap");
  assert.ok(gap);

  profile.nudges[gap.id] = new Date().toISOString();
  const after = buildActions(input);
  assert.equal(after.find((a) => a.id === gap.id), undefined);
});

test("at most three cards are returned", () => {
  const profile = createEmptyProfile();
  const actions = buildActions({
    profile,
    saved: [savedProgram({ snapshot: { applicationDeadline: isoIn(5) } })],
    records: [],
  });
  assert.ok(actions.length <= 3);
});

test("readiness reports null, not zero, for missing inputs", () => {
  const [program] = buildReadiness([savedProgram()], createEmptyProfile());
  const language = program.dimensions.find((d) => d.key === "language");
  const budget = program.dimensions.find((d) => d.key === "budget");
  // No score filled in and no budget set: unknown, never a zero score.
  assert.equal(language.score, null);
  assert.equal(budget.score, null);
  assert.match(language.note, /你还没有填写成绩/);
});

test("readiness scores a met requirement as full", () => {
  const profile = profileWithBand(7.0);
  profile.geography.budgetCeilingUsd = 60000;
  const [program] = buildReadiness([savedProgram()], profile);
  assert.equal(program.dimensions.find((d) => d.key === "language").score, 1);
  assert.equal(program.dimensions.find((d) => d.key === "budget").score, 1);
});

test("a stale snapshot is flagged", () => {
  const old = savedProgram();
  old.snapshot.capturedAt = new Date(Date.now() - 60 * DAY).toISOString();
  const [program] = buildReadiness([old], profileWithBand(7.0));
  assert.equal(program.stale, true);
  assert.equal(program.overall, "stale");
});

test("deadlines inside the window are returned nearest first", () => {
  const nodes = upcomingDeadlines([
    savedProgram({
      programId: "far",
      snapshot: { applicationDeadline: isoIn(80) },
    }),
    savedProgram({
      programId: "near",
      snapshot: { applicationDeadline: isoIn(5), prescreeningDeadline: isoIn(2) },
    }),
  ]);
  assert.deepEqual(
    nodes.map((n) => n.daysUntil),
    [2, 5, 80],
  );
  // audition_date has no data source yet, so it can never appear.
  assert.equal(nodes.some((n) => n.kind === "audition"), false);
});

test("past deadlines are excluded", () => {
  const nodes = upcomingDeadlines([
    savedProgram({ snapshot: { applicationDeadline: isoIn(-5) } }),
  ]);
  assert.deepEqual(nodes, []);
});
