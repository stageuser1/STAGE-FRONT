#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DirectusClient, runImport } from "./import_package.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACKAGE_PATH = path.join(ROOT, "data", "pilot", "manhattan_school_of_music.json");
const VALIDATION_PATH = path.join(ROOT, "docs", "pilot", "validation_report.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "pilot", "protection_test_report.json");
const TARGET_REF = "manhattan_school_of_music_composition_bm";
const TARGET_CYCLE = "2026-2027";

async function loadDotEnv(file) {
  if (!file) return;
  for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1].trim()] ??= value;
  }
}

function relationId(value) {
  return value && typeof value === "object" ? value.id : value;
}

function stable(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

await loadDotEnv(process.env.DIRECTUS_ENV_FILE);
const baseUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL;
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) throw new Error("DIRECTUS_URL/NEXT_PUBLIC_DIRECTUS_URL and DIRECTUS_TOKEN are required");

const client = new DirectusClient(baseUrl, token);
const packageData = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));
const validation = JSON.parse(await readFile(VALIDATION_PATH, "utf8"));
const programs = await client.list("program_offerings");
const targetProgram = programs.find((row) => row.program_offering_ref === TARGET_REF);
if (!targetProgram) throw new Error(`Target program not found: ${TARGET_REF}`);

const applications = await client.list("application_requirements");
const target = applications.find(
  (row) => String(relationId(row.program_offering_id)) === String(targetProgram.id) &&
    row.admission_cycle === TARGET_CYCLE,
);
if (!target) throw new Error(`Target application not found: ${TARGET_REF}:${TARGET_CYCLE}`);

let baseline;
let after;
let importReport;
let reset;
try {
  await client.update("application_requirements", target.id, { review_status: "Verified" });
  baseline = (await client.list("application_requirements")).find((row) => row.id === target.id);

  const modified = structuredClone(packageData);
  const incoming = modified.application_requirements.find(
    (row) => row.program_offering_ref === TARGET_REF && row.admission_cycle === TARGET_CYCLE,
  );
  incoming.tuition_annual += 1;
  importReport = await runImport({
    packageData: modified,
    validation,
    client,
    mode: "commit",
  });
  after = (await client.list("application_requirements")).find((row) => row.id === target.id);
} finally {
  await client.update("application_requirements", target.id, { review_status: "Extracted" });
  reset = (await client.list("application_requirements")).find((row) => row.id === target.id);
}

const result = {
  target: {
    collection: "application_requirements",
    id: target.id,
    program_offering_ref: TARGET_REF,
    admission_cycle: TARGET_CYCLE,
    modified_field: "tuition_annual",
  },
  verified_snapshot_sha256: hash(baseline),
  post_import_snapshot_sha256: hash(after),
  stored_record_byte_identical: stable(baseline) === stable(after),
  conflict_count: importReport.conflicts.length,
  conflicts: importReport.conflicts,
  import_counts: importReport.counts,
  import_journal: importReport.journal,
  status_after_reset: reset.review_status,
  passed:
    stable(baseline) === stable(after) &&
    importReport.conflicts.length === 1 &&
    importReport.conflicts[0].field === "tuition_annual" &&
    reset.review_status === "Extracted",
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.passed) process.exitCode = 1;
