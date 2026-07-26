import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRequirementChecklist,
  ieltsGap,
  overallState,
} from "../lib/fit/requirements.ts";
import { createEmptyProfile } from "../lib/profile/types.ts";

function dto(overrides = {}) {
  return {
    id: "1",
    school_name: "Test Conservatory",
    country: "United States",
    city: "New York",
    name: "Master of Music, Violin",
    major_area: "Performance",
    duration: null,
    application_url: null,
    deadline: {
      application_deadline: "2027-12-01",
      prescreening_deadline: null,
      audition_date: null,
      notes: null,
    },
    language_requirements: {
      instruction_language: null,
      english_required: true,
      accepted_tests: [
        {
          test_name: "IELTS",
          minimum_score: "6.5",
          section_minimums: null,
          notes: null,
        },
      ],
      waiver_policy: null,
      notes: null,
    },
    audition_requirements: {
      prescreening_required: null,
      audition_required: null,
      repertoire_requirements: null,
      format: null,
      notes: null,
    },
    cost_aid: {
      currency: "USD",
      tuition_amount: null,
      tuition_period: null,
      application_fee: null,
      scholarships_available: null,
      notes: null,
    },
    sources: [
      {
        source_title: "Official admissions page",
        source_url: "https://example.edu/admissions",
        source_type: "official_admissions_page",
        accessed_at: "2026-03-11",
      },
    ],
    data_quality: { status: "published" },
    display: { offering: {}, application: null, audition: null },
    ...overrides,
  };
}

function profileWithBand(band, source = "self_reported") {
  const profile = createEmptyProfile();
  profile.english.currentOverall = band;
  profile.english.currentSource = source;
  return profile;
}

const languageOf = (items) => items.find((i) => i.key === "language.ielts");

test("requirement 6.5 with estimate 6.0 is a gap", () => {
  const items = buildRequirementChecklist(dto(), profileWithBand(6.0));
  assert.equal(languageOf(items).state, "gap");

  const gap = ieltsGap(dto(), profileWithBand(6.0));
  assert.equal(gap.state, "below");
  assert.equal(gap.delta, -0.5);
});

test("requirement 6.5 with score 6.5 is satisfied", () => {
  const items = buildRequirementChecklist(dto(), profileWithBand(6.5));
  assert.equal(languageOf(items).state, "satisfied");
});

test("a recorded requirement with no learner value is unknown, never a gap", () => {
  // "We haven't verified you" must never look like "you don't qualify".
  const items = buildRequirementChecklist(dto(), createEmptyProfile());
  assert.equal(languageOf(items).state, "unknown");
  assert.equal(languageOf(items).missingProfileStep, "english");
});

test("a null requirement is unknown, never a gap", () => {
  const program = dto({
    language_requirements: {
      instruction_language: null,
      english_required: null,
      accepted_tests: [],
      waiver_policy: null,
      notes: null,
    },
  });
  const items = buildRequirementChecklist(program, profileWithBand(6.0));
  assert.equal(languageOf(items).state, "unknown");
});

test("english_required false renders as not_required", () => {
  const program = dto({
    language_requirements: {
      instruction_language: null,
      english_required: false,
      accepted_tests: [],
      waiver_policy: null,
      notes: null,
    },
  });
  const items = buildRequirementChecklist(program, profileWithBand(6.0));
  assert.equal(languageOf(items).state, "not_required");
});

test("prescreening 'No' is not_required, not satisfied", () => {
  const program = dto({
    prescreen: {
      required: false,
      required_text: "No",
      deadline: null,
      video_requirements: null,
      file_format_requirements: null,
      repertoire: null,
    },
  });
  const items = buildRequirementChecklist(program, createEmptyProfile());
  const prescreen = items.find((i) => i.key === "prescreen");
  assert.equal(prescreen.state, "not_required");
  assert.equal(prescreen.summary, "不需要预筛选");
});

test("an unparseable required_text stays unknown", () => {
  const program = dto({
    prescreen: {
      required: null,
      required_text: "Varies by program",
      deadline: null,
      video_requirements: null,
      file_format_requirements: null,
      repertoire: null,
    },
  });
  const items = buildRequirementChecklist(program, createEmptyProfile());
  assert.equal(items.find((i) => i.key === "prescreen").state, "unknown");
});

test("a past deadline is a gap; a future one is satisfied", () => {
  const past = buildRequirementChecklist(
    dto({
      deadline: {
        application_deadline: "2020-01-01",
        prescreening_deadline: null,
        audition_date: null,
        notes: null,
      },
    }),
    createEmptyProfile(),
  );
  assert.equal(past.find((i) => i.key === "deadline").state, "gap");

  const future = buildRequirementChecklist(dto(), createEmptyProfile());
  assert.equal(future.find((i) => i.key === "deadline").state, "satisfied");
});

test("tuition without a budget is unknown, not a gap", () => {
  const program = dto({
    cost_aid: {
      currency: "USD",
      tuition_amount: 60000,
      tuition_period: "year",
      application_fee: null,
      scholarships_available: null,
      notes: null,
    },
  });
  const items = buildRequirementChecklist(program, createEmptyProfile());
  const cost = items.find((i) => i.key === "cost");
  assert.equal(cost.state, "unknown");
  assert.equal(cost.missingProfileStep, "geography");
});

test("tuition over the budget ceiling is a gap", () => {
  const profile = createEmptyProfile();
  profile.geography.budgetCeilingUsd = 40000;
  const program = dto({
    cost_aid: {
      currency: "USD",
      tuition_amount: 60000,
      tuition_period: "year",
      application_fee: null,
      scholarships_available: null,
      notes: null,
    },
  });
  const items = buildRequirementChecklist(program, profile);
  assert.equal(items.find((i) => i.key === "cost").state, "gap");
});

test("an anonymous visitor still sees every requirement", () => {
  const items = buildRequirementChecklist(dto(), null);
  assert.equal(items.length, 6);
  // The requirement itself is public even with no profile to compare against.
  assert.match(languageOf(items).summary, /IELTS 6\.5/);
  assert.equal(languageOf(items).state, "unknown");
});

test("every row cites a source when the program has one", () => {
  const items = buildRequirementChecklist(dto(), createEmptyProfile());
  for (const item of items) {
    assert.ok(item.evidence, `${item.key} has no evidence`);
    assert.equal(item.evidence.accessedAt, "2026-03-11");
    assert.equal(item.lastCheckedAt, "2026-03-11");
  }
});

test("a gap on any row makes the overall verdict a gap", () => {
  const items = buildRequirementChecklist(dto(), profileWithBand(6.0));
  assert.equal(overallState(items), "gap");
});

test("prose requirement text is preserved verbatim", () => {
  const program = dto({
    language_requirements: {
      instruction_language: null,
      english_required: true,
      accepted_tests: [
        {
          test_name: "IELTS",
          minimum_score: "6.5 (no band below 6.0)",
          section_minimums: null,
          notes: null,
        },
      ],
      waiver_policy: null,
      notes: null,
    },
  });
  const gap = ieltsGap(program, profileWithBand(6.5));
  // The overall band drives the meter…
  assert.equal(gap.required, 6.5);
  assert.equal(gap.state, "meets");
  // …but the section requirement is never silently dropped.
  assert.equal(gap.requirementText, "6.5 (no band below 6.0)");
});
