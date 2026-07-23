#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { DirectusClient, runImport } from "./import_v4_package.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SCHOOL_REFS = [
  "yale_school_of_music",
  "jacobs_school_of_music",
  "university_of_michigan_smtd",
  "northwestern_bienen_school_of_music",
  "usc_thornton_school_of_music",
  "rice_shepherd_school_of_music",
  "peabody_institute",
  "oberlin_conservatory_of_music",
  "cleveland_institute_of_music",
];
const COLLECTIONS = [
  "schools",
  "fields",
  "program_offerings",
  "application_requirements",
  "audition_requirements",
  "source_records",
];

async function loadDotEnv(file) {
  try {
    for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1].trim()] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function emptyTotals() {
  return Object.fromEntries(
    COLLECTIONS.map((collection) => [collection, { create: 0, update: 0, skip: 0 }]),
  );
}

function addCounts(totals, counts) {
  for (const collection of COLLECTIONS) {
    for (const action of ["create", "update", "skip"]) {
      totals[collection][action] += counts[collection][action];
    }
  }
}

function compactReport(report) {
  return {
    school_ref: report.school_ref,
    counts: report.counts,
    conflicts: report.conflicts,
    journal_entries: report.journal.length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const commit = args.includes("--commit");
  const seedFields = args.includes("--seed-fields");
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0
    ? path.resolve(args[reportIndex + 1])
    : path.join(ROOT, "docs", "imports", `stage-v4-nine-school-${commit ? "commit" : "dry-run"}.json`);
  if (dryRun === commit || (reportIndex >= 0 && !args[reportIndex + 1])) {
    throw new Error("Usage: node scripts/import_v4_batch.mjs (--dry-run|--commit) [--seed-fields] [--report OUT.json]");
  }

  await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(ROOT, ".env.local"));
  await loadDotEnv(path.join(ROOT, ".env"));
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
  const token = process.env.DIRECTUS_TOKEN;
  if (!baseUrl) throw new Error("DIRECTUS_URL is required");
  if (commit && !token) throw new Error("DIRECTUS_TOKEN is required for --commit");

  const client = new DirectusClient(baseUrl, token);
  const beforeSchools = await client.list("schools", { fields: "id,slug" });
  const result = {
    mode: commit ? "commit" : "dry-run",
    generated_at: new Date().toISOString(),
    endpoint: baseUrl,
    input_root: path.join(ROOT, "output"),
    school_refs: SCHOOL_REFS,
    preexisting_school_slugs: beforeSchools.map(({ slug }) => slug).filter(Boolean).sort(),
    schools: [],
    totals: emptyTotals(),
    conflicts: [],
  };

  try {
    for (const schoolRef of SCHOOL_REFS) {
      const packagePath = path.join(ROOT, "output", schoolRef, `${schoolRef}.json`);
      const packageData = JSON.parse(await readFile(packagePath, "utf8"));
      const report = await runImport({
        packageData,
        client,
        mode: commit ? "commit" : "dry-run",
        seedFields,
      });
      result.schools.push(compactReport(report));
      addCounts(result.totals, report.counts);
      result.conflicts.push(...report.conflicts);
    }
    const afterSchools = await client.list("schools", { fields: "id,slug" });
    result.final_school_slugs = afterSchools.map(({ slug }) => slug).filter(Boolean).sort();
    result.preexisting_schools_preserved = result.preexisting_school_slugs.every(
      (slug) => result.final_school_slugs.includes(slug),
    );
    result.completed = true;
  } catch (error) {
    result.completed = false;
    result.error = error.message;
    result.partial_commit_possible = commit && result.schools.length > 0;
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.completed || !result.preexisting_schools_preserved) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }, null, 2));
  process.exitCode = 1;
});
