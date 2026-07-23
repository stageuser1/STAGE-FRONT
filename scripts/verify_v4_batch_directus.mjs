#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { DirectusClient } from "./import_v4_package.mjs";

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

function relationId(value) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values.filter((item) => item != null && item !== "")) {
    counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function sourceKey(source, programByRef, schoolBySlug) {
  const programId = source.program_offering_ref
    ? programByRef.get(source.program_offering_ref)?.id
    : null;
  const schoolId = source.school_ref ? schoolBySlug.get(source.school_ref)?.id : null;
  const scope = programId != null ? `program:${programId}` : `school:${schoolId}`;
  return `${source.source_url}|${source.related_field ?? ""}|${scope}`;
}

function storedSourceKey(source) {
  const programId = relationId(source.program_offering_id);
  const schoolId = relationId(source.school_id);
  const scope = programId != null ? `program:${programId}` : `school:${schoolId}`;
  return `${source.source_url}|${source.related_field ?? ""}|${scope}`;
}

function markdown(result) {
  const lines = [
    "# STAGE V4 nine-school Directus verification",
    "",
    `Generated: ${result.generated_at}`,
    "",
    `Result: **${result.passed ? "PASS" : "FAIL"}**`,
    "",
    "## Imported counts",
    "",
    "| School | Programs | Applications | Auditions | Sources |",
    "|---|---:|---:|---:|---:|",
  ];
  for (const school of result.schools) {
    lines.push(`| ${school.school_ref} | ${school.programs_found}/${school.programs_expected} | ${school.applications_found}/${school.applications_expected} | ${school.auditions_found}/${school.auditions_expected} | ${school.sources_found}/${school.sources_expected} |`);
  }
  lines.push(
    "",
    "## Integrity checks",
    "",
    `- Expected schools found exactly once: ${result.checks.target_schools_exact ? "PASS" : "FAIL"}`,
    `- Program refs unique globally: ${result.checks.duplicate_program_refs.length === 0 ? "PASS" : "FAIL"}`,
    `- Program relations valid: ${result.checks.broken_program_relations.length === 0 ? "PASS" : "FAIL"}`,
    `- Application requirements have valid program relations: ${result.checks.orphan_applications.length === 0 ? "PASS" : "FAIL"}`,
    `- Audition requirements have valid program relations: ${result.checks.orphan_auditions.length === 0 ? "PASS" : "FAIL"}`,
    `- Sources have exactly one valid school/program scope: ${result.checks.orphan_or_invalid_sources.length === 0 ? "PASS" : "FAIL"}`,
    `- Package source keys present: ${result.checks.package_source_keys_missing.length === 0 ? "PASS" : "FAIL"}`,
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0
    ? path.resolve(args[reportIndex + 1])
    : path.join(ROOT, "docs", "imports", "stage-v4-nine-school-verification.json");
  if (reportIndex >= 0 && !args[reportIndex + 1]) throw new Error("--report requires a path");

  await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(ROOT, ".env.local"));
  await loadDotEnv(path.join(ROOT, ".env"));
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
  const token = process.env.DIRECTUS_TOKEN;
  if (!baseUrl || !token) throw new Error("DIRECTUS_URL and DIRECTUS_TOKEN are required");
  const client = new DirectusClient(baseUrl, token);

  const packages = await Promise.all(SCHOOL_REFS.map(async (schoolRef) => {
    const file = path.join(ROOT, "output", schoolRef, `${schoolRef}.json`);
    return JSON.parse(await readFile(file, "utf8"));
  }));
  const [schools, fields, degreeLevels, programs, applications, auditions, sources] = await Promise.all([
    client.list("schools", { fields: "id,slug" }),
    client.list("fields", { fields: "id,slug" }),
    client.list("degree_levels", { fields: "id,slug" }),
    client.list("program_offerings", { fields: "id,program_offering_ref,school_id,field_id,degree_level_id" }),
    client.list("application_requirements", { fields: "id,program_offering_id,admission_cycle,is_current" }),
    client.list("audition_requirements", { fields: "id,program_offering_id,admission_cycle,is_current" }),
    client.list("source_records", { fields: "id,source_url,related_field,program_offering_id,school_id" }),
  ]);

  const schoolBySlug = new Map(schools.map((row) => [row.slug, row]));
  const programByRef = new Map(programs.map((row) => [row.program_offering_ref, row]));
  const schoolIds = new Set(schools.map(({ id }) => String(id)));
  const fieldIds = new Set(fields.map(({ id }) => String(id)));
  const degreeIds = new Set(degreeLevels.map(({ id }) => String(id)));
  const programIds = new Set(programs.map(({ id }) => String(id)));
  const storedSourceKeys = new Set(sources.map(storedSourceKey));

  const brokenProgramRelations = programs.filter((row) =>
    !schoolIds.has(String(relationId(row.school_id))) ||
    !fieldIds.has(String(relationId(row.field_id))) ||
    !degreeIds.has(String(relationId(row.degree_level_id))),
  ).map(({ id, program_offering_ref }) => ({ id, program_offering_ref }));
  const orphanApplications = applications.filter((row) =>
    !programIds.has(String(relationId(row.program_offering_id))),
  ).map(({ id }) => id);
  const orphanAuditions = auditions.filter((row) =>
    !programIds.has(String(relationId(row.program_offering_id))),
  ).map(({ id }) => id);
  const orphanOrInvalidSources = sources.filter((row) => {
    const programId = relationId(row.program_offering_id);
    const schoolId = relationId(row.school_id);
    if ((programId == null) === (schoolId == null)) return true;
    return programId != null
      ? !programIds.has(String(programId))
      : !schoolIds.has(String(schoolId));
  }).map(({ id }) => id);

  const packageSourceKeysMissing = [];
  const schoolResults = [];
  for (const packageData of packages) {
    const schoolRef = packageData.school.school_ref;
    const school = schoolBySlug.get(schoolRef);
    const expectedRefs = new Set(packageData.program_offerings.map((row) => row.program_offering_ref));
    const storedPrograms = programs.filter((row) => expectedRefs.has(row.program_offering_ref));
    const storedIds = new Set(storedPrograms.map(({ id }) => String(id)));
    const expectedCycles = new Set(packageData.application_requirements.map((row) => `${row.program_offering_ref}|${row.admission_cycle}`));
    const applicationKeys = new Set(applications.flatMap((row) => {
      const program = storedPrograms.find(({ id }) => String(id) === String(relationId(row.program_offering_id)));
      return program ? [`${program.program_offering_ref}|${row.admission_cycle}`] : [];
    }));
    const auditionKeys = new Set(auditions.flatMap((row) => {
      const program = storedPrograms.find(({ id }) => String(id) === String(relationId(row.program_offering_id)));
      return program ? [`${program.program_offering_ref}|${row.admission_cycle}`] : [];
    }));
    const expectedSourceKeys = packageData.source_records.map((source) => sourceKey(source, programByRef, schoolBySlug));
    const missingSources = expectedSourceKeys.filter((key) => !storedSourceKeys.has(key));
    packageSourceKeysMissing.push(...missingSources);
    schoolResults.push({
      school_ref: schoolRef,
      school_found: Boolean(school),
      programs_expected: expectedRefs.size,
      programs_found: storedPrograms.length,
      applications_expected: expectedCycles.size,
      applications_found: [...expectedCycles].filter((key) => applicationKeys.has(key)).length,
      auditions_expected: expectedCycles.size,
      auditions_found: [...expectedCycles].filter((key) => auditionKeys.has(key)).length,
      sources_expected: new Set(expectedSourceKeys).size,
      sources_found: new Set(expectedSourceKeys.filter((key) => storedSourceKeys.has(key))).size,
      program_school_links_valid: Boolean(school) && storedPrograms.every((row) => String(relationId(row.school_id)) === String(school.id)),
      current_application_rows: applications.filter((row) => storedIds.has(String(relationId(row.program_offering_id))) && row.is_current === true).length,
      current_audition_rows: auditions.filter((row) => storedIds.has(String(relationId(row.program_offering_id))) && row.is_current === true).length,
    });
  }

  const checks = {
    target_schools_exact: SCHOOL_REFS.every((slug) => schools.filter((row) => row.slug === slug).length === 1),
    duplicate_program_refs: duplicates(programs.map(({ program_offering_ref }) => program_offering_ref)),
    broken_program_relations: brokenProgramRelations,
    orphan_applications: orphanApplications,
    orphan_auditions: orphanAuditions,
    orphan_or_invalid_sources: orphanOrInvalidSources,
    package_source_keys_missing: packageSourceKeysMissing,
  };
  const result = {
    endpoint: baseUrl,
    generated_at: new Date().toISOString(),
    database_counts: {
      schools: schools.length,
      fields: fields.length,
      degree_levels: degreeLevels.length,
      program_offerings: programs.length,
      application_requirements: applications.length,
      audition_requirements: auditions.length,
      source_records: sources.length,
    },
    schools: schoolResults,
    checks,
  };
  result.passed = checks.target_schools_exact &&
    Object.values(checks).filter(Array.isArray).every((items) => items.length === 0) &&
    schoolResults.every((school) =>
      school.school_found && school.programs_found === school.programs_expected &&
      school.applications_found === school.applications_expected &&
      school.auditions_found === school.auditions_expected &&
      school.sources_found === school.sources_expected && school.program_school_links_valid,
    );

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(reportPath.replace(/\.json$/i, ".md"), markdown(result), "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }, null, 2));
  process.exitCode = 1;
});
