#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DirectusClient, runImport } from "./import_package.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "docs", "pilot", "rollback_demo.json");

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

function sourceKey(row) {
  const programId = relationId(row.program_offering_id);
  const scope = programId ? `program:${programId}` : `school:${relationId(row.school_id)}`;
  return `${row.source_url}|${row.related_field ?? ""}|${scope}`;
}

await loadDotEnv(process.env.DIRECTUS_ENV_FILE);
const baseUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL;
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) throw new Error("Directus configuration is required");
const client = new DirectusClient(baseUrl, token);
const packageData = JSON.parse(await readFile(path.join(ROOT, "data", "pilot", "manhattan_school_of_music.json"), "utf8"));
const validation = JSON.parse(await readFile(path.join(ROOT, "docs", "pilot", "validation_report.json"), "utf8"));
const firstImport = JSON.parse(await readFile(path.join(ROOT, "docs", "pilot", "import_commit.json"), "utf8"));
const targetJournal = firstImport.journal.find((entry) => entry.collection === "source_records" && entry.action === "create");
if (!targetJournal) throw new Error("No journal-created source record is available for the rollback demonstration");

const beforeRows = await client.list("source_records");
const target = beforeRows.find((row) => String(row.id) === String(targetJournal.id)) ??
  beforeRows.find((row) => sourceKey(row) === targetJournal.identity);
if (!target) throw new Error(`Journal source natural key no longer exists: ${targetJournal.identity}`);
const key = sourceKey(target);

await client.request("DELETE", `/items/source_records/${target.id}`);
const afterDeleteRows = await client.list("source_records");
const absentAfterDelete = !afterDeleteRows.some((row) => String(row.id) === String(target.id));

const restoreReport = await runImport({ packageData, validation, client, mode: "commit" });
const restoredRows = await client.list("source_records");
const restored = restoredRows.find((row) => sourceKey(row) === key);
const rerunReport = await runImport({ packageData, validation, client, mode: "commit" });
const rerunWrites = Object.values(rerunReport.counts).reduce(
  (total, counts) => total + counts.create + counts.update,
  0,
);

const result = {
  operation: "targeted deletion of one source_records row listed as created in import_commit.json, followed by package replay",
  journal_target: {
    collection: targetJournal.collection,
    original_id: target.id,
    identity: targetJournal.identity,
    natural_key: key,
  },
  delete_succeeded: absentAfterDelete,
  restore_counts: restoreReport.counts,
  restored_id: restored?.id ?? null,
  restored_natural_key_matches: Boolean(restored && sourceKey(restored) === key),
  post_restore_rerun_writes: rerunWrites,
  passed: absentAfterDelete && restoreReport.counts.source_records.create === 1 && Boolean(restored) && rerunWrites === 0,
};

await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.passed) process.exitCode = 1;
