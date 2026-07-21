import assert from "node:assert/strict";
import test from "node:test";

import { runImport } from "../scripts/import_v4_package.mjs";

function packageData() {
  const programRef = "new_school_piano_bm";
  return {
    schema_version: "stage_school_extraction_v4",
    school: {
      school_ref: "new_school",
      school_name: "New School",
      city: "Example City",
      country: "United States",
      school_type: "Conservatory",
      official_website: "https://example.edu",
    },
    program_offerings: [{
      program_offering_ref: programRef,
      field_ref: "piano",
      degree_level_ref: "bm",
      track_or_concentration: null,
      official_program_name: "Bachelor of Music in Piano",
      program_url: "https://example.edu/piano",
      last_checked: "2026-07-21",
      review_status: "Extracted",
    }],
    application_requirements: [{
      program_offering_ref: programRef,
      admission_cycle: "2026-2027",
      is_current: true,
      application_deadline: "2026-12-01",
      tuition_annual: 1000,
      review_status: "Needs Review",
    }],
    audition_requirements: [{
      program_offering_ref: programRef,
      admission_cycle: "2026-2027",
      is_current: true,
      prescreening_required: "No",
      audition_required: "Yes",
      review_status: "Needs Review",
    }],
    source_records: [{
      school_ref: null,
      program_offering_ref: programRef,
      source_url: "https://example.edu/piano",
      source_type: "Official Program Page",
      retrieved_date: "2026-07-21",
      related_field: "official_program_name",
      confidence_level: "High",
      review_status: "Needs Review",
    }],
    workflow_status: { extraction_status: "complete" },
  };
}

test("first-time school dry-run previews the full relational import", async () => {
  const calls = [];
  const client = {
    async list(collection, options) {
      calls.push({ collection, options });
      if (collection === "fields") return [{ id: 10, slug: "piano" }];
      if (collection === "degree_levels") return [{ id: 20, slug: "bm" }];
      if (collection === "schools") return [];
      throw new Error(`Unexpected Directus read for ${collection}`);
    },
    async create() {
      throw new Error("dry-run must not create records");
    },
    async update() {
      throw new Error("dry-run must not update records");
    },
  };

  const report = await runImport({ packageData: packageData(), client, mode: "dry-run" });

  assert.equal(report.counts.schools.create, 1);
  assert.equal(report.counts.program_offerings.create, 1);
  assert.equal(report.counts.application_requirements.create, 1);
  assert.equal(report.counts.audition_requirements.create, 1);
  assert.equal(report.counts.source_records.create, 1);
  assert.deepEqual(calls.map(({ collection }) => collection), [
    "fields",
    "degree_levels",
    "schools",
  ]);
});
