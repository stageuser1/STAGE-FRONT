import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MemoryClient, runImport } from "../scripts/import_package.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(
  await readFile(path.join(ROOT, "data/examples/example_conservatory.json"), "utf8"),
);
const programRef = base.program_offerings[0].program_offering_ref;

function packageCopy() {
  return structuredClone(base);
}

function initialDb() {
  return {
    fields: [{ id: 10, slug: "piano" }],
    degree_levels: [{ id: 20, slug: "bm" }],
    countries: [{ id: 30, country_name: "United States" }],
    cities: [
      {
        id: 40,
        city_name: "Example City",
        country_ref: 30,
        living_cost_band: "High",
      },
    ],
  };
}

const valid = { valid: true, needs_attention: [] };

function total(report, field) {
  return Object.values(report.counts).reduce((sum, counts) => sum + counts[field], 0);
}

async function importedBaseline({ cycle = "2026-2027" } = {}) {
  const client = new MemoryClient(initialDb());
  const packageData = packageCopy();
  packageData.application_requirements[0].admission_cycle = cycle;
  packageData.audition_requirements[0].admission_cycle = cycle;
  await runImport({ packageData, validation: valid, client, mode: "commit" });
  return { client, packageData };
}

test("natural-key upsert creates once and an unchanged commit is idempotent", async () => {
  const client = new MemoryClient(initialDb());
  const packageData = packageCopy();
  const first = await runImport({ packageData, validation: valid, client, mode: "commit" });
  assert.equal(first.counts.schools.create, 1);
  assert.equal(first.counts.program_offerings.create, 1);
  assert.equal(first.counts.application_requirements.create, 1);
  assert.equal(first.counts.audition_requirements.create, 1);
  assert.equal(first.counts.source_records.create, 5);

  const beforeRerun = client.snapshot();
  const second = await runImport({ packageData, validation: valid, client, mode: "commit" });
  assert.equal(total(second, "create"), 0);
  assert.equal(total(second, "update"), 0);
  assert.deepEqual(client.snapshot(), beforeRerun);
});

test("Verified record protection leaves the row byte-identical and reports one changed field", async () => {
  const { client } = await importedBaseline();
  const application = client.tables.application_requirements[0];
  application.review_status = "Verified";
  const before = structuredClone(application);
  const changed = packageCopy();
  changed.application_requirements[0].application_deadline = "2026-12-02";

  const report = await runImport({
    packageData: changed,
    validation: valid,
    client,
    mode: "commit",
  });
  assert.deepEqual(client.tables.application_requirements[0], before);
  const conflicts = report.conflicts.filter(
    (item) => item.collection === "application_requirements",
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].field, "application_deadline");
});

test("complete incoming cycle flips an older unreviewed current cycle", async () => {
  const { client } = await importedBaseline({ cycle: "2025-2026" });
  const incoming = packageCopy();
  const report = await runImport({
    packageData: incoming,
    validation: valid,
    client,
    mode: "commit",
  });
  const rows = client.tables.application_requirements;
  assert.equal(rows.find((row) => row.admission_cycle === "2025-2026").is_current, false);
  assert.equal(rows.find((row) => row.admission_cycle === "2026-2027").is_current, true);
  assert.equal(report.counts.application_requirements.update, 1);
  assert.equal(report.counts.application_requirements.create, 1);
});

test("reviewed older current cycle stays current and forces the new row to Needs Review", async () => {
  const { client } = await importedBaseline({ cycle: "2025-2026" });
  const older = client.tables.application_requirements[0];
  older.review_status = "Verified";
  const before = structuredClone(older);
  const report = await runImport({
    packageData: packageCopy(),
    validation: valid,
    client,
    mode: "commit",
  });
  assert.deepEqual(client.tables.application_requirements[0], before);
  const incoming = client.tables.application_requirements.find(
    (row) => row.admission_cycle === "2026-2027",
  );
  assert.equal(incoming.is_current, false);
  assert.equal(incoming.review_status, "Needs Review");
  assert.equal(
    report.conflicts.filter((item) => item.collection === "application_requirements").length,
    1,
  );
});

test("incomplete incoming cycle stays non-current and does not flip the older row", async () => {
  const { client } = await importedBaseline({ cycle: "2025-2026" });
  const incoming = packageCopy();
  incoming.application_requirements[0].tuition_annual = null;
  incoming.application_requirements[0].tuition_currency = null;
  const validation = {
    valid: true,
    needs_attention: [
      {
        program_offering_ref: programRef,
        field: "tuition_annual",
        message: "current annual tuition is null",
      },
    ],
  };
  await runImport({ packageData: incoming, validation, client, mode: "commit" });
  const older = client.tables.application_requirements.find(
    (row) => row.admission_cycle === "2025-2026",
  );
  const newer = client.tables.application_requirements.find(
    (row) => row.admission_cycle === "2026-2027",
  );
  assert.equal(older.is_current, true);
  assert.equal(newer.is_current, false);
  assert.equal(newer.review_status, "Needs Review");
});

test("complete cycle with no older row remains current", async () => {
  const client = new MemoryClient(initialDb());
  const packageData = packageCopy();
  packageData.audition_requirements[0].prescreening_required = "No";
  await runImport({ packageData, validation: valid, client, mode: "commit" });
  assert.equal(client.tables.application_requirements[0].is_current, true);
  assert.equal(client.tables.audition_requirements[0].is_current, true);
});

test("two dry runs against the same database are byte-for-byte deterministic", async () => {
  const { client } = await importedBaseline();
  const packageData = packageCopy();
  const before = client.snapshot();
  const first = await runImport({ packageData, validation: valid, client, mode: "dry-run" });
  const second = await runImport({ packageData, validation: valid, client, mode: "dry-run" });
  assert.deepEqual(first, second);
  assert.deepEqual(client.snapshot(), before);
});
