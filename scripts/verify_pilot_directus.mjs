#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DirectusClient } from "./import_package.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACKAGE_PATH = path.join(ROOT, "data", "pilot", "manhattan_school_of_music.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "pilot", "directus_verification.json");
const COLLECTIONS = [
  "schools", "program_offerings", "application_requirements", "audition_requirements",
  "source_records", "countries", "cities",
];

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

await loadDotEnv(process.env.DIRECTUS_ENV_FILE);
const baseUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL;
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) throw new Error("DIRECTUS_URL/NEXT_PUBLIC_DIRECTUS_URL and DIRECTUS_TOKEN are required");

const client = new DirectusClient(baseUrl, token);
const packageData = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));
const values = await Promise.all(COLLECTIONS.map((collection) => client.list(collection)));
const db = Object.fromEntries(COLLECTIONS.map((collection, index) => [collection, values[index]]));
const school = db.schools.find((row) => row.slug === packageData.school.school_ref);
const refs = packageData.program_offerings.map((row) => row.program_offering_ref);
const programRows = db.program_offerings.filter((row) => refs.includes(row.program_offering_ref));
const programByRef = new Map(programRows.map((row) => [row.program_offering_ref, row]));
const appRows = db.application_requirements.filter((row) =>
  [...programByRef.values()].some((program) => String(program.id) === String(relationId(row.program_offering_id))),
);
const auditionRows = db.audition_requirements.filter((row) =>
  [...programByRef.values()].some((program) => String(program.id) === String(relationId(row.program_offering_id))),
);
const sourceRows = db.source_records.filter((row) =>
  String(relationId(row.school_id)) === String(school?.id) ||
  [...programByRef.values()].some((program) => String(program.id) === String(relationId(row.program_offering_id))),
);

const checks = [];
for (const ref of refs) {
  const program = programByRef.get(ref);
  const currentApplications = appRows.filter((row) =>
    String(relationId(row.program_offering_id)) === String(program?.id) && row.is_current === true,
  );
  const currentAuditions = auditionRows.filter((row) =>
    String(relationId(row.program_offering_id)) === String(program?.id) && row.is_current === true,
  );
  const linkedSources = sourceRows.filter((row) =>
    String(relationId(row.program_offering_id)) === String(program?.id),
  );
  checks.push({
    program_offering_ref: ref,
    program_found: Boolean(program),
    current_application_count: currentApplications.length,
    current_audition_count: currentAuditions.length,
    linked_source_count: linkedSources.length,
    statuses: {
      program: program?.review_status ?? null,
      current_application: currentApplications[0]?.review_status ?? null,
      current_audition: currentAuditions[0]?.review_status ?? null,
    },
  });
}

const packageSourceKeys = new Set(packageData.source_records.map((source) => {
  const programId = source.program_offering_ref ? programByRef.get(source.program_offering_ref)?.id : null;
  const scope = programId ? `program:${programId}` : `school:${school?.id}`;
  return `${source.source_url}|${source.related_field ?? ""}|${scope}`;
}));
const storedSourceKeys = new Set(sourceRows.map((source) => {
  const programId = relationId(source.program_offering_id);
  const scope = programId ? `program:${programId}` : `school:${relationId(source.school_id)}`;
  return `${source.source_url}|${source.related_field ?? ""}|${scope}`;
}));

const pilotStatuses = [
  ...programRows.map((row) => ({ collection: "program_offerings", id: row.id, status: row.review_status })),
  ...appRows.map((row) => ({ collection: "application_requirements", id: row.id, status: row.review_status })),
  ...auditionRows.map((row) => ({ collection: "audition_requirements", id: row.id, status: row.review_status })),
  ...sourceRows.filter((row) => packageSourceKeys.has((() => {
    const programId = relationId(row.program_offering_id);
    const scope = programId ? `program:${programId}` : `school:${relationId(row.school_id)}`;
    return `${row.source_url}|${row.related_field ?? ""}|${scope}`;
  })())).map((row) => ({ collection: "source_records", id: row.id, status: row.review_status })),
];

const allowedStatuses = new Set(["Extracted", "Needs Review"]);
const result = {
  endpoint: baseUrl,
  generated_at: new Date().toISOString(),
  school: {
    id: school?.id ?? null,
    slug: school?.slug ?? null,
    city_ref: relationId(school?.city_ref) ?? null,
  },
  final_row_counts: Object.fromEntries(COLLECTIONS.map((collection) => [collection, db[collection].length])),
  package_counts: {
    programs_expected: refs.length,
    programs_found: programRows.length,
    applications_for_pilot_programs: appRows.length,
    auditions_for_pilot_programs: auditionRows.length,
    package_source_keys_expected: packageSourceKeys.size,
    package_source_keys_found: [...packageSourceKeys].filter((key) => storedSourceKeys.has(key)).length,
  },
  program_checks: checks,
  status_distribution: Object.fromEntries(
    [...new Set(pilotStatuses.map(({ status }) => status))]
      .sort()
      .map((status) => [status, pilotStatuses.filter((row) => row.status === status).length]),
  ),
  verified_records: pilotStatuses.filter(({ status }) => status === "Verified"),
  passed:
    Boolean(school?.city_ref) &&
    programRows.length === refs.length &&
    checks.every((row) =>
      row.program_found && row.current_application_count === 1 && row.current_audition_count === 1 &&
      row.linked_source_count >= 1 && Object.values(row.statuses).every((status) => allowedStatuses.has(status))
    ) &&
    [...packageSourceKeys].every((key) => storedSourceKeys.has(key)) &&
    pilotStatuses.every(({ status }) => allowedStatuses.has(status)),
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.passed) process.exitCode = 1;
