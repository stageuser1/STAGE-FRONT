#!/usr/bin/env node
// V4-aware Directus importer for `stage_school_extraction_v4` packages.
// Mirrors the mechanics of scripts/import_package.mjs (idempotent upsert,
// protected-status skip, single-is_current invariant) adapted to the V4
// field set. See docs/contracts/stage-school-extraction-v4.md §12.
//
// Usage:
//   node scripts/import_v4_package.mjs PACKAGE.json --dry-run [--report OUT.json]
//   node scripts/import_v4_package.mjs PACKAGE.json --commit --seed-fields [--report OUT.json]
//
// --seed-fields creates any `fields` rows referenced by the package that are
// missing from Directus (slug + English name only). Without it, the import
// refuses (as scripts/import_package.mjs always has) when a program
// references an unseeded field.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROTECTED_STATUSES = new Set(["Verified", "human_checked"]);
const SCHEMA_VERSION = "stage_school_extraction_v4";

const COLLECTIONS = [
  "schools",
  "fields",
  "program_offerings",
  "application_requirements",
  "audition_requirements",
  "source_records",
];

const ACTIVE_FIELDS = {
  schools: [
    "slug", "school_name", "city", "country", "school_type", "official_website",
  ],
  fields: ["slug", "field_name", "field_name_zh", "field_category"],
  program_offerings: [
    "school_id", "field_id", "degree_level_id", "track_or_concentration",
    "official_program_name", "program_url", "application_url", "audition_url",
    "duration_years", "language_of_instruction", "last_checked",
    "review_status", "program_offering_ref",
  ],
  application_requirements: [
    "program_offering_id", "admission_cycle", "is_current", "application_deadline",
    "deadline_notes", "english_language_tests", "toefl_minimum", "ielts_minimum",
    "duolingo_minimum", "tuition_annual", "tuition_currency", "scholarships_available",
    "scholarship_note", "required_materials", "conditional_notes", "review_status",
  ],
  audition_requirements: [
    "program_offering_id", "admission_cycle", "is_current", "prescreening_required",
    "prescreening_deadline", "audition_required", "audition_format",
    "repertoire_summary", "repertoire_structured", "conditional_notes", "review_status",
  ],
  source_records: [
    "source_url", "source_type", "retrieved_date", "source_quote", "related_field",
    "program_offering_id", "school_id", "confidence_level", "review_status",
  ],
};

// English display names for field slugs this package needs but Directus has
// not seeded yet. Chinese names (field_name_zh) are intentionally left null —
// per the V4 contract §12, Chinese-facing fields are a separate review-pass
// step, not part of extraction/import.
const FIELD_SEED_NAMES = {
  alto_saxophone: ["Alto Saxophone", "Music Performance"],
  baritone_saxophone: ["Baritone Saxophone", "Music Performance"],
  bass_clarinet: ["Bass Clarinet", "Music Performance"],
  bass_trombone: ["Bass Trombone", "Music Performance"],
  bassoon: ["Bassoon", "Music Performance"],
  clarinet: ["Clarinet", "Music Performance"],
  collaborative_piano: ["Collaborative Piano", "Music Performance"],
  double_bass: ["Double Bass", "Music Performance"],
  drum_set: ["Drum Set", "Music Performance"],
  electric_bass: ["Electric Bass", "Music Performance"],
  flute: ["Flute", "Music Performance"],
  guitar: ["Guitar", "Music Performance"],
  harmonica: ["Harmonica", "Music Performance"],
  harp: ["Harp", "Music Performance"],
  horn: ["Horn", "Music Performance"],
  jazz_arts_advancement: ["Jazz Arts Advancement", "Jazz Studies"],
  musical_theatre: ["Musical Theatre", "Musical Theatre"],
  oboe: ["Oboe", "Music Performance"],
  orchestral_conducting: ["Orchestral Conducting", "Conducting"],
  organ: ["Organ", "Music Performance"],
  percussion: ["Percussion", "Music Performance"],
  saxophone: ["Saxophone", "Music Performance"],
  tenor_saxophone: ["Tenor Saxophone", "Music Performance"],
  tenor_trombone: ["Tenor Trombone", "Music Performance"],
  trumpet: ["Trumpet", "Music Performance"],
  tuba: ["Tuba", "Music Performance"],
  vibraphone: ["Vibraphone", "Music Performance"],
  viola: ["Viola", "Music Performance"],
};

// One-time reconciliation: the original (pre-V4) MSM import used a
// different track-slug convention than this V4 package — untracked/classical
// programs were bare `_{degree}` (no `_classical` suffix) and the Zukerman
// track was `_zukerman` instead of the V4 package's `_pinchas_zukerman_
// performance_program`. Each mapping below was confirmed by matching the
// existing row's (field_id, degree_level_id) and official_program_name/
// track_or_concentration against the V4 package's equivalent — not guessed.
// Applying this prevents creating 19 duplicate program_offerings rows for
// programs that already exist. After the first commit these old refs no
// longer appear anywhere and this table becomes dead weight (safe to delete).
const ALIAS_REF_MAP = {
  manhattan_school_of_music_violin_bm_zukerman: "manhattan_school_of_music_violin_bm_pinchas_zukerman_performance_program",
  manhattan_school_of_music_violin_mm_zukerman: "manhattan_school_of_music_violin_mm_pinchas_zukerman_performance_program",
  manhattan_school_of_music_violin_dma_zukerman: "manhattan_school_of_music_violin_dma_pinchas_zukerman_performance_program",
  manhattan_school_of_music_violin_ad_zukerman: "manhattan_school_of_music_violin_ad_pinchas_zukerman_performance_program",
  manhattan_school_of_music_cello_bm: "manhattan_school_of_music_cello_bm_classical",
  manhattan_school_of_music_cello_mm: "manhattan_school_of_music_cello_mm_classical",
  manhattan_school_of_music_cello_dma: "manhattan_school_of_music_cello_dma_classical",
  manhattan_school_of_music_cello_ad: "manhattan_school_of_music_cello_ad_classical",
  manhattan_school_of_music_piano_bm: "manhattan_school_of_music_piano_bm_classical",
  manhattan_school_of_music_piano_mm: "manhattan_school_of_music_piano_mm_classical",
  manhattan_school_of_music_piano_dma: "manhattan_school_of_music_piano_dma_classical",
  manhattan_school_of_music_piano_ad: "manhattan_school_of_music_piano_ad_classical",
  manhattan_school_of_music_voice_bm: "manhattan_school_of_music_voice_bm_classical",
  manhattan_school_of_music_voice_mm: "manhattan_school_of_music_voice_mm_classical",
  manhattan_school_of_music_voice_dma: "manhattan_school_of_music_voice_dma_classical",
  manhattan_school_of_music_voice_ad: "manhattan_school_of_music_voice_ad_classical",
  manhattan_school_of_music_composition_bm: "manhattan_school_of_music_composition_bm_classical",
  manhattan_school_of_music_composition_mm: "manhattan_school_of_music_composition_mm_classical",
  manhattan_school_of_music_composition_dma: "manhattan_school_of_music_composition_dma_classical",
};
const ALIAS_BY_NEW_REF = new Map(
  Object.entries(ALIAS_REF_MAP).map(([oldRef, newRef]) => [newRef, oldRef]),
);

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
  if (typeof a === "object" || typeof b === "object") {
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
    const headers = { Accept: "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${this.baseUrl}${apiPath}`, {
      method,
      headers,
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

  list(collection, { filter, fields = "*" } = {}) {
    const search = new URLSearchParams({ limit: "-1", fields });
    if (filter) search.set("filter", JSON.stringify(filter));
    return this.request("GET", `/items/${collection}?${search}`);
  }

  create(collection, values) {
    return this.request("POST", `/items/${collection}`, values);
  }

  update(collection, id, values) {
    return this.request("PATCH", `/items/${collection}/${id}`, values);
  }
}

async function readVocab(client) {
  const [fields, degreeLevels] = await Promise.all([
    client.list("fields", { fields: "id,slug,field_name,field_name_zh,field_category" }),
    client.list("degree_levels", { fields: "id,slug" }),
  ]);
  return { fields, degreeLevels };
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
  client, commit, report, collection, identity, existing, incoming, fields, packageData, programRef,
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
      action: "planned_update", collection, identity, id: existing.id, before, after: changes,
    });
    return { ...existing, ...clone(changes) };
  }
  const updated = await client.update(collection, existing.id, changes);
  report.journal.push({
    action: "update", collection, identity, id: existing.id, before, after: changes,
    rollback: `PATCH /items/${collection}/${existing.id} with journal.before`,
  });
  return updated;
}

async function seedMissingFields({ client, commit, seedFields, report, packageData, existingFields }) {
  const bySlug = new Map(existingFields.map((item) => [item.slug, item]));
  const neededSlugs = new Set(packageData.program_offerings.map((p) => p.field_ref));
  const resolved = new Map(existingFields.map((item) => [item.slug, item]));
  // Always compute the plan (for dry-run visibility) but only perform a real
  // write when the caller explicitly opted in with --seed-fields.
  const effectiveCommit = commit && seedFields;
  for (const slug of [...neededSlugs].sort()) {
    if (bySlug.has(slug)) continue;
    const seed = FIELD_SEED_NAMES[slug];
    if (!seed) {
      throw new Error(
        `No seed name defined for field slug "${slug}" — add it to FIELD_SEED_NAMES before importing.`,
      );
    }
    const [field_name, field_category] = seed;
    const incoming = { slug, field_name, field_name_zh: null, field_category };
    const created = await writeUpsert({
      client, commit: effectiveCommit, report, collection: "fields", identity: slug,
      existing: null, incoming, fields: ACTIVE_FIELDS.fields, packageData, programRef: null,
    });
    if (commit && !seedFields) continue; // not actually created; leave unresolved on purpose
    resolved.set(slug, created);
  }
  return resolved;
}

export async function runImport({ packageData, client, mode = "dry-run", seedFields = false }) {
  if (!packageData || packageData.schema_version !== SCHEMA_VERSION) {
    throw new Error(`Unexpected schema_version (expected ${SCHEMA_VERSION})`);
  }
  if (!["dry-run", "commit"].includes(mode)) throw new Error(`Unsupported mode ${mode}`);
  if (packageData.workflow_status?.extraction_status !== "complete") {
    throw new Error("Refusing import: workflow_status.extraction_status is not complete");
  }
  const commit = mode === "commit";
  const report = {
    mode,
    schema_version: packageData.schema_version,
    school_ref: packageData.school.school_ref,
    counts: makeCounts(),
    conflicts: [],
    journal: [],
  };

  try {
    const { fields: existingFields, degreeLevels } = await readVocab(client);
    const fieldBySlug = await seedMissingFields({
      client, commit, seedFields, report, packageData, existingFields,
    });
    const degreeBySlug = new Map(degreeLevels.map((item) => [item.slug, item]));

    for (const program of packageData.program_offerings) {
      if (!fieldBySlug.has(program.field_ref)) {
        throw new Error(
          `Unresolved field slug: ${program.field_ref} (pass --seed-fields with --commit, or run --dry-run first)`,
        );
      }
      if (!degreeBySlug.has(program.degree_level_ref)) {
        throw new Error(`Unresolved degree slug: ${program.degree_level_ref}`);
      }
    }

    const [existingSchool] = await client.list("schools", {
      filter: { slug: { _eq: packageData.school.school_ref } },
      fields: ACTIVE_FIELDS.schools.concat("id").join(","),
    });
    const schoolIncoming = {
      slug: packageData.school.school_ref,
      school_name: packageData.school.school_name,
      city: packageData.school.city,
      country: packageData.school.country,
      school_type: packageData.school.school_type,
      official_website: packageData.school.official_website,
    };
    const school = await writeUpsert({
      client, commit, report, collection: "schools", identity: packageData.school.school_ref,
      existing: existingSchool ?? null, incoming: schoolIncoming,
      fields: ACTIVE_FIELDS.schools, packageData, programRef: null,
    });
    const schoolId = school.id;
    if (typeof schoolId === "string" && schoolId.startsWith("planned:")) {
      throw new Error("Refusing to plan programs under a not-yet-created school in dry-run preview");
    }

    const existingPrograms = await client.list("program_offerings", {
      filter: { school_id: { _eq: schoolId } },
      fields: "id,program_offering_ref,school_id,field_id,degree_level_id,track_or_concentration,official_program_name,program_url,application_url,audition_url,duration_years,language_of_instruction,last_checked,review_status",
    });
    const programByRef = new Map(existingPrograms.map((item) => [item.program_offering_ref, item]));
    const resolvedProgramByRef = new Map();

    for (const program of packageData.program_offerings) {
      const aliasOldRef = ALIAS_BY_NEW_REF.get(program.program_offering_ref);
      const existing = programByRef.get(program.program_offering_ref) ??
        (aliasOldRef ? programByRef.get(aliasOldRef) ?? null : null);
      const incoming = {
        program_offering_ref: program.program_offering_ref,
        school_id: schoolId,
        field_id: fieldBySlug.get(program.field_ref).id,
        degree_level_id: degreeBySlug.get(program.degree_level_ref).id,
        track_or_concentration: program.track_or_concentration ?? null,
        official_program_name: program.official_program_name,
        program_url: program.program_url,
        application_url: program.application_url ?? null,
        audition_url: program.audition_url ?? null,
        duration_years: program.duration_years ?? null,
        language_of_instruction: program.language_of_instruction ?? null,
        last_checked: program.last_checked,
        ...(!existing ? { review_status: program.review_status ?? "Extracted" } : {}),
      };
      const resolved = await writeUpsert({
        client, commit, report, collection: "program_offerings",
        identity: program.program_offering_ref, existing, incoming,
        fields: ACTIVE_FIELDS.program_offerings, packageData,
        programRef: program.program_offering_ref,
      });
      resolvedProgramByRef.set(program.program_offering_ref, resolved);
    }

    const programIds = [...resolvedProgramByRef.values()]
      .map((p) => p.id)
      .filter((id) => typeof id === "number");
    const [existingApplications, existingAuditions] = await Promise.all([
      programIds.length
        ? client.list("application_requirements", {
            filter: { program_offering_id: { _in: programIds } },
          })
        : [],
      programIds.length
        ? client.list("audition_requirements", {
            filter: { program_offering_id: { _in: programIds } },
          })
        : [],
    ]);

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
        let desiredStatus = input.review_status ?? "Needs Review";
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
              existing: olderCurrent, incoming: { is_current: false },
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
          duolingo_minimum: input.duolingo_minimum,
          tuition_annual: input.tuition_annual,
          tuition_currency: input.tuition_currency,
          scholarships_available: input.scholarships_available,
          scholarship_note: input.scholarship_note,
          required_materials: input.required_materials,
          prescreening_required: input.prescreening_required,
          prescreening_deadline: input.prescreening_deadline,
          audition_required: input.audition_required,
          audition_format: input.audition_format,
          repertoire_summary: input.repertoire_summary,
          repertoire_structured: input.repertoire_structured,
          conditional_notes: input.conditional_notes,
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
      "application_requirements", packageData.application_requirements, existingApplications, appComplete,
    );
    await importCycles(
      "audition_requirements", packageData.audition_requirements, existingAuditions, auditionComplete,
    );

    const existingSources = programIds.length || schoolId
      ? await client.list("source_records", {
          filter: { _or: [
            { program_offering_id: { _in: programIds.length ? programIds : [-1] } },
            { school_id: { _eq: schoolId } },
          ] },
        })
      : [];
    const sourceByKey = new Map();
    for (const source of existingSources) {
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
            review_status: source.review_status ?? "Needs Review",
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

async function cli() {
  const args = process.argv.slice(2);
  const packagePath = args.find((arg) => !arg.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const commit = args.includes("--commit");
  const seedFields = args.includes("--seed-fields");
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null;
  if (!packagePath || dryRun === commit || (reportIndex >= 0 && !reportPath)) {
    throw new Error(
      "Usage: node scripts/import_v4_package.mjs PACKAGE.json (--dry-run|--commit) [--seed-fields] [--report OUT.json]",
    );
  }
  if (commit && !seedFields) {
    console.error(
      "Note: run without --seed-fields only if all field_ref values in the package are already seeded; " +
      "this package needs --seed-fields on first commit.",
    );
  }
  await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(ROOT, ".env.local"));
  await loadDotEnv(path.join(ROOT, ".env"));
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
  const token = process.env.DIRECTUS_TOKEN;
  if (!baseUrl) throw new Error("DIRECTUS_URL is required");
  if (commit && !token) throw new Error("DIRECTUS_TOKEN is required for --commit");
  const absolutePackage = path.resolve(packagePath);
  const packageData = JSON.parse(await readFile(absolutePackage, "utf8"));
  const client = new DirectusClient(baseUrl, token);
  let report;
  try {
    report = await runImport({
      packageData, client, mode: commit ? "commit" : "dry-run", seedFields,
    });
  } catch (error) {
    report = {
      ...(error.importReport ?? {}),
      error: error.message,
    };
    if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  cli().catch((error) => {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
