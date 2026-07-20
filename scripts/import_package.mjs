#!/usr/bin/env node

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROTECTED_STATUSES = new Set(["Verified", "human_checked"]);
const COLLECTIONS = [
  "schools",
  "program_offerings",
  "application_requirements",
  "audition_requirements",
  "source_records",
  "countries",
  "cities",
];

const ACTIVE_FIELDS = {
  schools: [
    "slug", "school_name", "city", "country", "school_type", "official_website", "city_ref",
  ],
  program_offerings: [
    "school_id", "field_id", "degree_level_id", "track_or_concentration",
    "official_program_name", "program_url", "duration_years", "language_of_instruction",
    "last_checked", "review_status", "notes", "faculty_list", "program_offering_ref",
  ],
  application_requirements: [
    "program_offering_id", "admission_cycle", "is_current", "application_deadline",
    "deadline_notes", "english_language_tests", "toefl_minimum", "ielts_minimum",
    "conditional_notes", "review_status", "notes", "tuition_annual", "tuition_currency",
    "scholarships_available", "scholarship_note",
  ],
  audition_requirements: [
    "program_offering_id", "admission_cycle", "is_current", "prescreening_required",
    "prescreening_deadline", "audition_required", "audition_format", "repertoire_summary",
    "conditional_notes", "review_status", "notes",
  ],
  source_records: [
    "source_url", "source_type", "retrieved_date", "source_quote", "related_field",
    "program_offering_id", "school_id", "confidence_level", "review_status",
  ],
};

async function loadDotEnv(file) {
  try {
    for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) value = value.slice(1, -1);
      process.env[match[1].trim()] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function relationId(value) {
  return value && typeof value === "object" ? value.id : value;
}

function numeric(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return value;
}

function equivalent(a, b) {
  if (a == null && b == null) return true;
  if (
    (typeof a === "number" || typeof a === "string") &&
    (typeof b === "number" || typeof b === "string") &&
    typeof numeric(a) === "number" && typeof numeric(b) === "number"
  ) return numeric(a) === numeric(b);
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }
  return relationId(a) === relationId(b);
}

function diff(existing, incoming, fields) {
  const changes = {};
  const before = {};
  for (const field of fields) {
    if (!Object.hasOwn(incoming, field) || incoming[field] === undefined) continue;
    if (!equivalent(existing?.[field], incoming[field])) {
      changes[field] = clone(incoming[field]);
      before[field] = clone(existing?.[field] ?? null);
    }
  }
  return { changes, before };
}

function makeCounts() {
  return Object.fromEntries(
    COLLECTIONS.map((collection) => [collection, { create: 0, update: 0, skip: 0 }]),
  );
}

function stableSortReport(report) {
  report.conflicts.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  report.needs_attention.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return report;
}

function sourceUrlFor(packageData, programRef, field) {
  const source = packageData.source_records.find(
    (item) =>
      item.related_field === field &&
      (item.program_offering_ref === programRef || item.school_ref === packageData.school.school_ref),
  );
  return source?.source_url ?? null;
}

function attentionRefs(validation) {
  return new Set(
    (validation.needs_attention ?? [])
      .map((item) => item.program_offering_ref)
      .filter((value) => typeof value === "string"),
  );
}

function appComplete(record) {
  return record.application_deadline != null && record.tuition_annual != null;
}

function auditionComplete(record) {
  return ![null, undefined, "Unknown"].includes(record.prescreening_required) &&
    ![null, undefined, "Unknown"].includes(record.audition_required);
}

export class DirectusClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  async request(method, apiPath, body) {
    const response = await fetch(`${this.baseUrl}${apiPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text.slice(0, 1000) };
      }
    }
    if (!response.ok) {
      const detail = payload?.errors?.map(({ message }) => message).join("; ") ??
        payload?.raw ?? response.statusText;
      throw new Error(`${method} ${apiPath} failed (${response.status}): ${detail}`);
    }
    return payload?.data;
  }

  async list(collection) {
    const search = new URLSearchParams({ limit: "-1", fields: "*" });
    return this.request("GET", `/items/${collection}?${search}`);
  }

  create(collection, values) {
    return this.request("POST", `/items/${collection}`, values);
  }

  update(collection, id, values) {
    return this.request("PATCH", `/items/${collection}/${id}`, values);
  }
}

export class MemoryClient {
  constructor(initial = {}) {
    this.tables = Object.fromEntries(
      ["fields", "degree_levels", ...COLLECTIONS].map((collection) => [
        collection,
        clone(initial[collection] ?? []),
      ]),
    );
  }

  async list(collection) {
    return clone(this.tables[collection] ?? []);
  }

  async create(collection, values) {
    const table = this.tables[collection] ?? (this.tables[collection] = []);
    const numericIds = table.map(({ id }) => Number(id)).filter(Number.isFinite);
    const record = { id: numericIds.length ? Math.max(...numericIds) + 1 : 1, ...clone(values) };
    table.push(record);
    return clone(record);
  }

  async update(collection, id, values) {
    const table = this.tables[collection] ?? [];
    const record = table.find((item) => String(item.id) === String(id));
    if (!record) throw new Error(`${collection} ${id} not found`);
    Object.assign(record, clone(values));
    return clone(record);
  }

  snapshot() {
    return clone(this.tables);
  }
}

async function readDatabase(client) {
  const names = ["fields", "degree_levels", ...COLLECTIONS];
  const values = await Promise.all(names.map((name) => client.list(name)));
  return Object.fromEntries(names.map((name, index) => [name, values[index]]));
}

function protectedConflicts({ collection, identity, existing, incoming, fields, packageData, programRef }) {
  const { changes } = diff(existing, incoming, fields);
  return Object.keys(changes).sort().map((field) => ({
    collection,
    identity,
    field,
    stored_value: clone(existing[field] ?? null),
    incoming_value: clone(incoming[field] ?? null),
    source_url: sourceUrlFor(packageData, programRef, field),
    reason: existing.review_status === "human_checked"
      ? "legacy human-reviewed record is protected"
      : "review_status is Verified",
  }));
}

async function writeUpsert({
  client,
  commit,
  report,
  collection,
  identity,
  existing,
  incoming,
  fields,
  packageData,
  programRef,
}) {
  if (existing && PROTECTED_STATUSES.has(existing.review_status)) {
    report.counts[collection].skip += 1;
    report.conflicts.push(...protectedConflicts({
      collection, identity, existing, incoming, fields, packageData, programRef,
    }));
    return existing;
  }
  if (!existing) {
    report.counts[collection].create += 1;
    if (!commit) {
      report.journal.push({
        action: "planned_create", collection, identity, values: clone(incoming),
        rollback: "no write in dry-run",
      });
      return { id: `planned:${identity}`, ...clone(incoming) };
    }
    const created = await client.create(collection, incoming);
    report.journal.push({
      action: "create", collection, identity, id: created.id,
      rollback: `DELETE /items/${collection}/${created.id}`,
    });
    return created;
  }
  const { changes, before } = diff(existing, incoming, fields);
  if (Object.keys(changes).length === 0) {
    report.counts[collection].skip += 1;
    return existing;
  }
  report.counts[collection].update += 1;
  if (!commit) {
    report.journal.push({
      action: "planned_update", collection, identity, id: existing.id,
      before, after: changes, rollback: "no write in dry-run",
    });
    return { ...existing, ...clone(changes) };
  }
  const updated = await client.update(collection, existing.id, changes);
  report.journal.push({
    action: "update", collection, identity, id: existing.id,
    before, after: changes,
    rollback: `PATCH /items/${collection}/${existing.id} with journal.before`,
  });
  return updated;
}

export async function runImport({ packageData, validation, client, mode = "dry-run" }) {
  if (!validation?.valid) throw new Error("Refusing import because validator report is not valid");
  if (!packageData || packageData.schema_version !== "stage_music_admissions_v3") {
    throw new Error("Unexpected package schema_version");
  }
  if (!['dry-run', 'commit'].includes(mode)) throw new Error(`Unsupported mode ${mode}`);
  const commit = mode === "commit";
  const report = {
    mode,
    schema_version: packageData.schema_version,
    school_ref: packageData.school.school_ref,
    counts: makeCounts(),
    conflicts: [],
    needs_attention: clone(validation.needs_attention ?? []),
    journal: [],
    package_rows: clone({
      school: packageData.school,
      program_offerings: packageData.program_offerings,
      application_requirements: packageData.application_requirements,
      audition_requirements: packageData.audition_requirements,
      source_records: packageData.source_records,
    }),
  };

  try {
    const db = await readDatabase(client);
    const fieldBySlug = new Map(db.fields.map((item) => [item.slug, item]));
    const degreeBySlug = new Map(db.degree_levels.map((item) => [item.slug, item]));
    for (const program of packageData.program_offerings) {
      if (!fieldBySlug.has(program.field_ref)) {
        throw new Error(`Unresolved seeded field slug: ${program.field_ref}`);
      }
      if (!degreeBySlug.has(program.degree_level_ref)) {
        throw new Error(`Unresolved seeded degree slug: ${program.degree_level_ref}`);
      }
    }

    const country = db.countries.find(
      (item) => item.country_name === packageData.school.country,
    ) ?? null;
    const city = country
      ? db.cities.find(
          (item) => item.city_name === packageData.school.city &&
            String(relationId(item.country_ref)) === String(country.id),
        ) ?? null
      : null;
    report.counts.countries.skip += country ? 1 : 0;
    report.counts.cities.skip += city ? 1 : 0;

    let school = db.schools.find((item) => item.slug === packageData.school.school_ref) ?? null;
    const schoolIncoming = {
      slug: packageData.school.school_ref,
      school_name: packageData.school.school_name,
      city: packageData.school.city,
      country: packageData.school.country,
      school_type: packageData.school.school_type,
      official_website: packageData.school.official_website,
      city_ref: city?.id ?? null,
    };
    school = await writeUpsert({
      client, commit, report, collection: "schools", identity: packageData.school.school_ref,
      existing: school, incoming: schoolIncoming, fields: ACTIVE_FIELDS.schools,
      packageData, programRef: null,
    });
    const schoolId = school.id;

    const programByRef = new Map(
      db.program_offerings.map((item) => [item.program_offering_ref, item]),
    );
    const resolvedProgramByRef = new Map();
    const refsWithAttention = attentionRefs(validation);
    for (const program of packageData.program_offerings) {
      const existing = programByRef.get(program.program_offering_ref) ?? null;
      const incoming = {
        program_offering_ref: program.program_offering_ref,
        school_id: schoolId,
        field_id: fieldBySlug.get(program.field_ref).id,
        degree_level_id: degreeBySlug.get(program.degree_level_ref).id,
        track_or_concentration: program.track_or_concentration ?? null,
        official_program_name: program.official_program_name,
        program_url: program.program_url,
        duration_years: program.duration_years ?? null,
        language_of_instruction: program.language_of_instruction ?? null,
        faculty_list: program.faculty_list ?? null,
        last_checked: program.last_checked,
        notes: program.notes ?? null,
        ...(!existing
          ? { review_status: refsWithAttention.has(program.program_offering_ref) ? "Needs Review" : "Extracted" }
          : {}),
      };
      const resolved = await writeUpsert({
        client, commit, report, collection: "program_offerings",
        identity: program.program_offering_ref, existing, incoming,
        fields: ACTIVE_FIELDS.program_offerings, packageData,
        programRef: program.program_offering_ref,
      });
      resolvedProgramByRef.set(program.program_offering_ref, resolved);
    }

    const applicationRows = [...db.application_requirements];
    const auditionRows = [...db.audition_requirements];

    async function importCycles(collection, packageRows, existingRows, complete) {
      for (const input of packageRows) {
        const program = resolvedProgramByRef.get(input.program_offering_ref);
        if (!program) throw new Error(`Program ref did not resolve: ${input.program_offering_ref}`);
        const programId = program.id;
        const existing = existingRows.find(
          (item) => String(relationId(item.program_offering_id)) === String(programId) &&
            item.admission_cycle === input.admission_cycle,
        ) ?? null;
        let desiredCurrent = input.is_current;
        let desiredStatus = refsWithAttention.has(input.program_offering_ref)
          ? "Needs Review"
          : "Extracted";
        if (input.is_current) {
          const olderCurrent = existingRows.find(
            (item) => String(relationId(item.program_offering_id)) === String(programId) &&
              item.is_current === true && item.admission_cycle !== input.admission_cycle,
          );
          if (!complete(input)) {
            desiredCurrent = false;
            desiredStatus = "Needs Review";
          } else if (olderCurrent && PROTECTED_STATUSES.has(olderCurrent.review_status)) {
            desiredCurrent = false;
            desiredStatus = "Needs Review";
            report.conflicts.push({
              collection,
              identity: `${input.program_offering_ref}:${input.admission_cycle}`,
              field: "is_current",
              stored_value: true,
              incoming_value: true,
              source_url: sourceUrlFor(packageData, input.program_offering_ref,
                collection === "application_requirements" ? "application_deadline" : "prescreening_required"),
              reason: `older current cycle ${olderCurrent.admission_cycle} is reviewed and cannot be flipped`,
            });
          } else if (olderCurrent) {
            const flipped = await writeUpsert({
              client, commit, report, collection,
              identity: `${input.program_offering_ref}:${olderCurrent.admission_cycle}`,
              existing: olderCurrent,
              incoming: { is_current: false },
              fields: ["is_current"], packageData, programRef: input.program_offering_ref,
            });
            Object.assign(olderCurrent, flipped);
          }
        }
        const common = {
          program_offering_id: programId,
          admission_cycle: input.admission_cycle,
          is_current: desiredCurrent,
          application_deadline: input.application_deadline,
          deadline_notes: input.deadline_notes,
          english_language_tests: input.english_language_tests,
          toefl_minimum: input.toefl_minimum,
          ielts_minimum: input.ielts_minimum,
          tuition_annual: input.tuition_annual,
          tuition_currency: input.tuition_currency,
          scholarships_available: input.scholarships_available,
          scholarship_note: input.scholarship_note,
          prescreening_required: input.prescreening_required,
          prescreening_deadline: input.prescreening_deadline,
          audition_required: input.audition_required,
          audition_format: input.audition_format,
          repertoire_summary: input.repertoire_summary,
          conditional_notes: input.conditional_notes,
          notes: input.notes,
          ...(!existing || desiredStatus === "Needs Review" ? { review_status: desiredStatus } : {}),
        };
        const incoming = Object.fromEntries(
          Object.entries(common).filter(([key, value]) =>
            ACTIVE_FIELDS[collection].includes(key) && value !== undefined),
        );
        const identity = `${input.program_offering_ref}:${input.admission_cycle}`;
        const resolved = await writeUpsert({
          client, commit, report, collection, identity, existing, incoming,
          fields: ACTIVE_FIELDS[collection], packageData, programRef: input.program_offering_ref,
        });
        if (!existing) existingRows.push(resolved);
        else Object.assign(existing, resolved);
      }
    }

    await importCycles(
      "application_requirements", packageData.application_requirements,
      applicationRows, appComplete,
    );
    await importCycles(
      "audition_requirements", packageData.audition_requirements,
      auditionRows, auditionComplete,
    );

    const sourceByKey = new Map();
    for (const source of db.source_records) {
      const scope = relationId(source.program_offering_id) != null
        ? `program:${relationId(source.program_offering_id)}`
        : `school:${relationId(source.school_id)}`;
      sourceByKey.set(`${source.source_url}|${source.related_field ?? ""}|${scope}`, source);
    }
    for (const source of packageData.source_records) {
      const program = source.program_offering_ref
        ? resolvedProgramByRef.get(source.program_offering_ref)
        : null;
      const scope = program ? `program:${program.id}` : `school:${schoolId}`;
      const key = `${source.source_url}|${source.related_field ?? ""}|${scope}`;
      const existing = sourceByKey.get(key) ?? null;
      const incoming = existing
        ? {
            retrieved_date: source.retrieved_date,
            source_quote: source.source_quote ?? null,
            confidence_level: source.confidence_level ?? "High",
          }
        : {
            source_url: source.source_url,
            source_type: source.source_type,
            retrieved_date: source.retrieved_date,
            source_quote: source.source_quote ?? null,
            related_field: source.related_field ?? null,
            program_offering_id: program?.id ?? null,
            school_id: program ? null : schoolId,
            confidence_level: source.confidence_level ?? "High",
            review_status: source.program_offering_ref && refsWithAttention.has(source.program_offering_ref)
              ? "Needs Review"
              : "Extracted",
          };
      await writeUpsert({
        client, commit, report, collection: "source_records", identity: key,
        existing, incoming,
        fields: existing
          ? ["retrieved_date", "source_quote", "confidence_level"]
          : ACTIVE_FIELDS.source_records,
        packageData, programRef: source.program_offering_ref,
      });
    }
    return stableSortReport(report);
  } catch (error) {
    error.importReport = stableSortReport(report);
    throw error;
  }
}

async function validateWithCli(packagePath) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "stage-validate-"));
  const reportPath = path.join(temp, "report.json");
  try {
    const result = spawnSync(
      process.env.PYTHON ?? "python",
      [path.join(ROOT, "scripts", "validate_package.py"), packagePath, "--json-report", reportPath],
      { cwd: ROOT, encoding: "utf8" },
    );
    const validation = JSON.parse(await readFile(reportPath, "utf8"));
    if (result.status !== 0 || !validation.valid) {
      throw new Error(`Package validation failed:\n${result.stdout}${result.stderr}`);
    }
    return validation;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function cli() {
  const args = process.argv.slice(2);
  const packagePath = args.find((arg) => !arg.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const commit = args.includes("--commit");
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null;
  if (!packagePath || dryRun === commit || (reportIndex >= 0 && !reportPath)) {
    throw new Error(
      "Usage: node scripts/import_package.mjs PACKAGE.json (--dry-run|--commit) [--report OUT.json]",
    );
  }
  await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(ROOT, ".env.local"));
  await loadDotEnv(path.join(ROOT, ".env"));
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
  const token = process.env.DIRECTUS_TOKEN;
  if (!baseUrl || !token) throw new Error("DIRECTUS_URL and DIRECTUS_TOKEN are required");
  const absolutePackage = path.resolve(packagePath);
  const [packageData, validation] = await Promise.all([
    readFile(absolutePackage, "utf8").then(JSON.parse),
    validateWithCli(absolutePackage),
  ]);
  const client = new DirectusClient(baseUrl, token);
  let report;
  try {
    report = await runImport({
      packageData, validation, client, mode: commit ? "commit" : "dry-run",
    });
  } catch (error) {
    report = {
      ...(error.importReport ?? {}),
      error: error.message,
      rollback_required: Boolean(error.importReport?.journal?.some(({ action }) =>
        action === "create" || action === "update")),
    };
    if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  if (reportPath) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  cli().catch((error) => {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
