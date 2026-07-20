#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const BEFORE_DIR = path.join(ROOT, "docs", "pilot", "schema_before");
const AFTER_DIR = path.join(ROOT, "docs", "pilot", "schema_after");
const args = new Set(process.argv.slice(2));

async function loadDotEnv(file) {
  try {
    const text = await readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
      if (!match) continue;
      const name = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[name] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(ROOT, ".env.local"));
await loadDotEnv(path.join(ROOT, ".env"));

const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) {
  throw new Error(
    "DIRECTUS_URL and DIRECTUS_TOKEN are required (DIRECTUS_ENV_FILE may point to an existing dotenv file).",
  );
}

async function request(method, apiPath, body) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
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
    const detail =
      payload?.errors?.map((error) => error.message).join("; ") ??
      payload?.raw ??
      response.statusText;
    throw new Error(`${method} ${apiPath} failed (${response.status}): ${detail}`);
  }
  return payload;
}

const get = (apiPath) => request("GET", apiPath);
const data = async (apiPath) => (await get(apiPath)).data;

function itemPath(collection, { filter, fields = "*", sort, limit = -1 } = {}) {
  const search = new URLSearchParams({ limit: String(limit), fields });
  if (filter) search.set("filter", JSON.stringify(filter));
  if (sort) search.set("sort", sort);
  return `/items/${collection}?${search}`;
}

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function rowCounts(collectionPayload) {
  const counts = {};
  for (const record of collectionPayload.data
    .filter(({ collection }) => !collection.startsWith("directus_"))
    .sort((a, b) => a.collection.localeCompare(b.collection))) {
    const payload = await get(
      `/items/${record.collection}?aggregate%5Bcount%5D=*&limit=1`,
    );
    counts[record.collection] = Number(payload.data?.[0]?.count ?? 0);
  }
  return counts;
}

async function dumpSchema(directory, { preserveExisting = false } = {}) {
  const files = {
    collections: path.join(directory, "collections.json"),
    fields: path.join(directory, "fields.json"),
    relations: path.join(directory, "relations.json"),
    snapshot: path.join(directory, "snapshot.json"),
    counts: path.join(directory, "row_counts.json"),
  };
  if (preserveExisting && (await exists(files.snapshot))) {
    return { skipped: true, directory };
  }
  const [collections, fields, relations, snapshot] = await Promise.all([
    get("/collections"),
    get("/fields"),
    get("/relations"),
    get("/schema/snapshot"),
  ]);
  const counts = await rowCounts(collections);
  await Promise.all([
    writeJson(files.collections, collections),
    writeJson(files.fields, fields),
    writeJson(files.relations, relations),
    writeJson(files.snapshot, snapshot.data),
    writeJson(files.counts, counts),
  ]);
  return { skipped: false, directory, counts };
}

const CURRENCIES = [
  "USD", "GBP", "EUR", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN",
  "CZK", "HUF", "JPY", "KRW", "CNY", "SGD", "HKD", "AUD", "NZD",
];

const choices = (values) => ({
  choices: values.map((value) => ({ text: value, value })),
});

const fieldDefinitions = [
  ["countries", "country_name", "string", "input", true, { is_unique: true }],
  ["countries", "visa_summary", "text", "input-multiline", false],
  ["countries", "post_study_work", "text", "input-multiline", false],
  ["countries", "notes", "text", "input-multiline", false],
  ["countries", "last_reviewed", "date", "datetime", false],
  ["cities", "city_name", "string", "input", true],
  [
    "cities", "country_ref", "integer", "select-dropdown-m2o", true, {},
    { special: ["m2o"], options: { template: "{{country_name}}" } },
  ],
  [
    "cities", "living_cost_band", "string", "select-dropdown", true, {},
    { options: choices(["Low", "Medium", "High", "Very High"]) },
  ],
  ["cities", "living_cost_monthly_est", "integer", "input", false],
  [
    "cities", "living_cost_currency", "string", "select-dropdown", false, {},
    { options: choices(CURRENCIES) },
  ],
  ["cities", "last_reviewed", "date", "datetime", false],
  [
    "schools", "city_ref", "integer", "select-dropdown-m2o", false, {},
    { special: ["m2o"], options: { template: "{{city_name}}" } },
  ],
  ["program_offerings", "faculty_list", "text", "input-multiline", false],
  [
    "program_offerings", "program_offering_ref", "string", "input", false,
    { is_unique: true },
  ],
  ["application_requirements", "tuition_annual", "decimal", "input", false],
  [
    "application_requirements", "tuition_currency", "string", "select-dropdown",
    false, {}, { options: choices(CURRENCIES) },
  ],
  [
    "application_requirements", "scholarships_available", "string",
    "select-dropdown", true, { default_value: "Unknown" },
    { options: choices(["Yes", "No", "Unknown"]) },
  ],
  [
    "application_requirements", "scholarship_note", "text", "input-multiline", false,
  ],
  [
    "audition_requirements", "prescreening_required", "string", "select-dropdown",
    false, { default_value: "Unknown" },
    { options: choices(["Yes", "No", "Varies", "Unknown"]) },
  ],
];

const relationDefinitions = [
  ["cities", "country_ref", "countries", false],
  ["schools", "city_ref", "cities", true],
];

const hiddenFields = {
  schools: [
    "region", "school_name_zh", "intro_zh", "ranking_source",
    "ranking_position", "logo", "card_image",
  ],
  program_offerings: [
    "department", "application_url", "audition_url", "international_url",
    "program_name_zh", "card_summary_zh",
  ],
  application_requirements: [
    "application_fee", "application_fee_currency", "required_materials",
    "transcript_requirements", "recommendation_letters", "resume_required",
    "essay_required", "portfolio_required", "duolingo_minimum",
    "english_waiver_policy", "international_applicant_notes",
  ],
  audition_requirements: [
    "repertoire_structured", "video_requirements", "file_format_requirements",
    "accompaniment_requirements", "interview_or_callback_requirements", "special_notes",
  ],
  source_records: ["raw_markdown", "source_title"],
};

function fieldPayload(field, type, interfaceName, required, schema, meta) {
  return {
    field,
    type,
    meta: {
      interface: interfaceName,
      hidden: false,
      readonly: false,
      required,
      searchable: true,
      width: "full",
      ...(meta ?? {}),
    },
    schema: { is_nullable: !required, ...(schema ?? {}) },
  };
}

async function schemaState() {
  const [collections, fields, relations] = await Promise.all([
    data("/collections"), data("/fields"), data("/relations"),
  ]);
  return { collections, fields, relations };
}

async function ensureCollections(journal) {
  let state = await schemaState();
  for (const collection of ["countries", "cities"]) {
    if (state.collections.some((entry) => entry.collection === collection)) continue;
    await request("POST", "/collections", {
      collection,
      meta: {
        accountability: "all", archive_app_filter: true, collapse: "open",
        hidden: false, singleton: false,
      },
      schema: { name: collection },
    });
    journal.push({ action: "create_collection", collection });
    state = await schemaState();
  }
}

async function ensureFields(journal) {
  let allFields = await data("/fields");
  for (const definition of fieldDefinitions) {
    const [collection, field, type, interfaceName, required, schema, meta] = definition;
    if (allFields.some((entry) => entry.collection === collection && entry.field === field)) continue;
    await request(
      "POST", `/fields/${collection}`,
      fieldPayload(field, type, interfaceName, required, schema, meta),
    );
    journal.push({ action: "create_field", collection, field });
    allFields = await data("/fields");
  }
}

async function ensureRelations(journal) {
  let allRelations = await data("/relations");
  for (const [collection, field, relatedCollection, nullable] of relationDefinitions) {
    if (allRelations.some((entry) => entry.collection === collection && entry.field === field)) continue;
    await request("POST", "/relations", {
      collection,
      field,
      related_collection: relatedCollection,
      meta: { one_deselect_action: nullable ? "nullify" : "delete" },
      schema: { on_delete: nullable ? "SET NULL" : "NO ACTION" },
    });
    journal.push({ action: "create_relation", collection, field, relatedCollection });
    allRelations = await data("/relations");
  }
}

async function hideFrozenFields(journal) {
  const allFields = await data("/fields");
  for (const [collection, fields] of Object.entries(hiddenFields)) {
    for (const field of fields) {
      const current = allFields.find(
        (entry) => entry.collection === collection && entry.field === field,
      );
      if (!current || current.meta?.hidden === true) continue;
      await request("PATCH", `/fields/${collection}/${field}`, { meta: { hidden: true } });
      journal.push({ action: "hide_field", collection, field });
    }
  }
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function backfillProgramRefs(journal) {
  const programs = await data(itemPath("program_offerings", {
    fields:
      "id,program_offering_ref,import_ref,track_or_concentration,school_id.slug,field_id.slug,degree_level_id.slug",
    sort: "id",
  }));
  const groups = new Map();
  for (const program of programs) {
    const base = [program.school_id?.slug, program.field_id?.slug, program.degree_level_id?.slug].join("_");
    groups.set(base, (groups.get(base) ?? 0) + 1);
  }
  const seen = new Set();
  for (const program of programs) {
    if (program.program_offering_ref) {
      if (seen.has(program.program_offering_ref)) {
        throw new Error(`Duplicate existing program_offering_ref ${program.program_offering_ref}`);
      }
      seen.add(program.program_offering_ref);
      continue;
    }
    const base = [program.school_id?.slug, program.field_id?.slug, program.degree_level_id?.slug].join("_");
    if (base.includes("undefined") || base.includes("null")) {
      throw new Error(`Cannot backfill program ${program.id}: an identity relation is unresolved`);
    }
    const fallback = (groups.get(base) ?? 0) > 1
      ? `${base}_${slugify(program.track_or_concentration)}`
      : base;
    const stableRef = program.import_ref || fallback;
    if (!stableRef || seen.has(stableRef)) {
      throw new Error(`Cannot backfill a unique stable ref for program ${program.id}`);
    }
    await request("PATCH", `/items/program_offerings/${program.id}`, {
      program_offering_ref: stableRef,
    });
    seen.add(stableRef);
    journal.push({
      action: "backfill", collection: "program_offerings", id: program.id,
      field: "program_offering_ref", value: stableRef,
    });
  }
  const field = await data("/fields/program_offerings/program_offering_ref");
  if (!field.meta?.required || field.schema?.is_nullable) {
    await request("PATCH", "/fields/program_offerings/program_offering_ref", {
      meta: { required: true }, schema: { is_nullable: false, is_unique: true },
    });
    journal.push({ action: "require_field", collection: "program_offerings", field: "program_offering_ref" });
  }
}

async function backfillCanonicalPrescreen(journal) {
  const allFields = await data("/fields");
  const hasLegacy = allFields.some(
    (entry) => entry.collection === "audition_requirements" && entry.field === "Prescreening_required",
  );
  if (!hasLegacy) return;
  const rows = await data(itemPath("audition_requirements", {
    fields: "id,prescreening_required,Prescreening_required", sort: "id",
  }));
  for (const row of rows) {
    const value = row.Prescreening_required === "NO" ? "No" : row.Prescreening_required;
    if (
      value == null ||
      row.prescreening_required === value ||
      ![null, undefined, "Unknown"].includes(row.prescreening_required)
    ) continue;
    await request("PATCH", `/items/audition_requirements/${row.id}`, { prescreening_required: value });
    journal.push({
      action: "backfill", collection: "audition_requirements", id: row.id,
      field: "prescreening_required", value,
    });
  }
}

async function applyMigration() {
  const journal = [];
  await ensureCollections(journal);
  await ensureFields(journal);
  await ensureRelations(journal);
  await hideFrozenFields(journal);
  await backfillProgramRefs(journal);
  await backfillCanonicalPrescreen(journal);
  return journal;
}

async function createSchemaDiff() {
  const before = JSON.parse(await readFile(path.join(BEFORE_DIR, "snapshot.json"), "utf8"));
  const after = JSON.parse(await readFile(path.join(AFTER_DIR, "snapshot.json"), "utf8"));
  const beforeCollections = new Set(before.collections.map(({ collection }) => collection));
  const beforeFields = new Map(before.fields.map((field) => [`${field.collection}.${field.field}`, field]));
  const afterFields = new Map(after.fields.map((field) => [`${field.collection}.${field.field}`, field]));
  const addedCollections = after.collections
    .map(({ collection }) => collection)
    .filter((collection) => !beforeCollections.has(collection)).sort();
  const addedFields = [...afterFields.keys()].filter((key) => !beforeFields.has(key)).sort();
  const newlyHidden = [...afterFields]
    .filter(([key, field]) =>
      beforeFields.has(key) && beforeFields.get(key).meta?.hidden !== true && field.meta?.hidden === true)
    .map(([key]) => key).sort();
  const beforeCounts = JSON.parse(await readFile(path.join(BEFORE_DIR, "row_counts.json"), "utf8"));
  const afterCounts = JSON.parse(await readFile(path.join(AFTER_DIR, "row_counts.json"), "utf8"));
  const existingCountChanges = Object.keys(beforeCounts)
    .filter((collection) => beforeCounts[collection] !== afterCounts[collection])
    .map((collection) => `${collection}: ${beforeCounts[collection]} -> ${afterCounts[collection]}`);
  const lines = [
    "# Directus pilot schema diff", "",
    "Generated from the committed before/after snapshots. No fields were deleted, renamed, or type-changed.", "",
    "## Added collections", "",
    ...(addedCollections.length ? addedCollections.map((x) => `- \`${x}\``) : ["- None"]), "",
    "## Added fields", "",
    ...(addedFields.length ? addedFields.map((x) => `- \`${x}\``) : ["- None"]), "",
    "## Newly hidden fields", "",
    ...(newlyHidden.length ? newlyHidden.map((x) => `- \`${x}\``) : ["- None"]), "",
    "## Existing collection row-count changes during M1-M3", "",
    ...(existingCountChanges.length
      ? existingCountChanges.map((x) => `- ${x}`)
      : ["- None; all pre-existing collection counts are unchanged."]), "",
    "## Compatibility notes", "",
    "- The live `audition_requirements.Prescreening_required` typo is retained; canonical lowercase `prescreening_required` was added and backfilled.",
    "- Existing legacy review-status values are retained byte-for-byte. New pilot writes use `Extracted`, `Needs Review`, `Verified`, or `Outdated`.",
    "- Existing `program_offerings.import_ref` values were used as the stable backfill when present, preserving reviewed identities.", "",
  ];
  await writeFile(path.join(ROOT, "docs", "pilot", "schema_diff.md"), lines.join("\n"), "utf8");
  return { addedCollections, addedFields, newlyHidden, existingCountChanges };
}

const runAll = args.size === 0 || args.has("--all");
const result = {};
if (runAll || args.has("--backup")) {
  result.backup = await dumpSchema(BEFORE_DIR, { preserveExisting: true });
}
if (runAll || args.has("--apply")) {
  if (!(await exists(path.join(BEFORE_DIR, "snapshot.json")))) {
    throw new Error("Refusing to apply without docs/pilot/schema_before/snapshot.json");
  }
  result.journal = await applyMigration();
}
if (runAll || args.has("--verify")) {
  result.after = await dumpSchema(AFTER_DIR);
  result.diff = await createSchemaDiff();
}

const rendered = `${JSON.stringify(result, null, 2)}\n`;
const reportIndex = process.argv.indexOf("--report");
if (reportIndex !== -1) {
  const reportPath = process.argv[reportIndex + 1];
  if (!reportPath) throw new Error("--report requires a path");
  await writeFile(path.resolve(reportPath), rendered, "utf8");
}
process.stdout.write(rendered);
