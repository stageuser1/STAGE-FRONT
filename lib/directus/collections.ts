/**
 * Directus row shapes and the bounded reads that produce them.
 *
 * Every query names exactly the columns its mappers read. The import pipeline
 * stores very large blob columns on these collections — `program_payload`
 * (~117KB/row), `requirement_sections` (~89KB/row), `evidence_metadata`
 * (~126KB/row at the top end), plus a ~2KB `source_quote` on 17,663
 * source_records rows. A `fields=*` here drags tens of megabytes through a
 * slow link on every render; the measured cost of carrying just
 * `evidence_metadata` on the shared path was 15MB / 90s.
 *
 * The rule this module encodes: list surfaces read no source-record bodies at
 * all — they read aggregates. Only the detail surface that actually renders a
 * quote fetches quotes, filtered to the records it displays.
 */
import {
  isUnknownFieldError,
  logDirectusDegradation,
  readAggregate,
  readAllItems,
  readItems,
  type DirectusParams,
} from "./client";

export type DirectusId = string | number;

export interface DirectusSchool {
  id: DirectusId;
  slug?: string | null;
  school_name?: string | null;
  city?: string | null;
  country?: string | null;
  official_website?: string | null;
  review_status?: string | null;
  intro_zh?: string | null;
  school_detail_sections?: unknown;
}

export interface DirectusField {
  id?: DirectusId;
  slug?: string | null;
  field_name?: string | null;
  field_name_zh?: string | null;
  field_category?: string | null;
}

export interface DirectusDegreeLevel {
  id?: DirectusId;
  slug?: string | null;
  degree_level_name?: string | null;
  degree_level_name_zh?: string | null;
  abbreviation?: string | null;
  degree_category?: string | null;
}

export interface DirectusProgramOffering {
  id: DirectusId;
  school_id?: DirectusId | DirectusSchool | null;
  field_id?: DirectusId | DirectusField | null;
  degree_level_id?: DirectusId | DirectusDegreeLevel | null;
  official_program_name?: string | null;
  program_name_zh?: string | null;
  track_or_concentration?: string | null;
  department?: string | null;
  card_summary_zh?: string | null;
  duration_years?: string | number | null;
  language_of_instruction?: unknown;
  program_url?: string | null;
  application_url?: string | null;
  audition_url?: string | null;
  international_url?: string | null;
  review_status?: string | null;
  faculty_list?: string | null;
  last_checked?: string | null;
  program_offering_ref?: string | null;
}

export interface DirectusCycleRecord {
  id: DirectusId;
  program_offering_id?: DirectusId | { id?: DirectusId } | null;
  is_current?: boolean | string | number | null;
  admission_cycle?: string | number | null;
  review_status?: string | null;
}

export interface DirectusApplicationRequirement extends DirectusCycleRecord {
  deadline_notes?: string | null;
  application_deadline?: string | null;
  english_language_tests?: unknown;
  toefl_minimum?: string | number | null;
  ielts_minimum?: string | number | null;
  duolingo_minimum?: string | number | null;
  english_waiver_policy?: string | null;
  resume_required?: string | null;
  essay_required?: string | null;
  recommendation_letters?: string | number | null;
  transcript_requirements?: string | null;
  portfolio_required?: string | null;
  required_materials?: unknown;
  international_applicant_notes?: string | null;
  conditional_notes?: string | null;
  notes?: string | null;
  application_fee?: string | number | null;
  application_fee_currency?: string | null;
  tuition_annual?: string | number | null;
  tuition_currency?: string | null;
  scholarships_available?: string | null;
  scholarship_note?: string | null;
}

export interface DirectusAuditionRequirement extends DirectusCycleRecord {
  prescreening_deadline?: string | null;
  prescreening_required?: string | null;
  Prescreening_required?: string | null;
  audition_required?: string | null;
  repertoire_summary?: string | null;
  repertoire_structured?: unknown;
  prescreen_repertoire?: string | null;
  audition_repertoire?: string | null;
  audition_format?: string | null;
  video_requirements?: string | null;
  file_format_requirements?: string | null;
  accompaniment_requirements?: string | null;
  interview_or_callback_requirements?: string | null;
  special_notes?: string | null;
  conditional_notes?: string | null;
  notes?: string | null;
}

export interface DirectusSourceRecord {
  id?: DirectusId;
  program_offering_id?: DirectusId | { id?: DirectusId } | null;
  school_id?: DirectusId | { id?: DirectusId } | null;
  source_url?: string | null;
  source_title?: string | null;
  source_quote?: string | null;
  retrieved_date?: string | null;
  confidence_level?: string | null;
  source_type?: string | null;
  related_field?: string | null;
  evidence_metadata?: unknown;
}

/* ------------------------------------------------------------------ *
 * Field allowlists
 * ------------------------------------------------------------------ */

const schoolCatalogFields = [
  "id",
  "slug",
  "school_name",
  "city",
  "country",
  "official_website",
  "review_status",
].join(",");

/** `intro_zh` and `school_detail_sections` render on the school page only. */
const schoolDetailFields = [schoolCatalogFields, "intro_zh", "school_detail_sections"].join(",");

const offeringRelationFields = [
  "school_id.id",
  "school_id.slug",
  "school_id.school_name",
  "school_id.city",
  "school_id.country",
  "field_id.field_name",
  "field_id.field_name_zh",
  "degree_level_id.id",
  "degree_level_id.slug",
  "degree_level_id.degree_level_name",
  "degree_level_id.degree_level_name_zh",
  "degree_level_id.abbreviation",
  "degree_level_id.degree_category",
];

/**
 * Catalog fidelity: the columns the school catalog, the school page's program
 * index, the fit strip and the profile filter options actually read. Detail
 * prose, URLs and the reviewer editing surface are not among them.
 */
const offeringCatalogFields = [
  "id",
  "official_program_name",
  "program_name_zh",
  "track_or_concentration",
  "department",
  "review_status",
  "last_checked",
  ...offeringRelationFields,
].join(",");

/** Detail fidelity: adds the columns the program page renders and edits. */
const offeringDetailFields = [
  "id",
  "program_offering_ref",
  "official_program_name",
  "program_name_zh",
  "track_or_concentration",
  "department",
  "card_summary_zh",
  "duration_years",
  "language_of_instruction",
  "program_url",
  "application_url",
  "audition_url",
  "international_url",
  "review_status",
  "faculty_list",
  "last_checked",
  ...offeringRelationFields,
  "field_id.id",
  "field_id.slug",
  "field_id.field_category",
].join(",");

const applicationCatalogFields = [
  "id",
  "program_offering_id",
  "is_current",
  "admission_cycle",
  "review_status",
  "application_deadline",
  "english_language_tests",
  "toefl_minimum",
  "ielts_minimum",
  "duolingo_minimum",
  "english_waiver_policy",
  "application_fee",
  "application_fee_currency",
  "tuition_annual",
  "tuition_currency",
].join(",");

const applicationDetailFields = [
  applicationCatalogFields,
  "deadline_notes",
  "resume_required",
  "essay_required",
  "recommendation_letters",
  "transcript_requirements",
  "portfolio_required",
  "required_materials",
  "international_applicant_notes",
  "conditional_notes",
  "notes",
  "scholarships_available",
  "scholarship_note",
].join(",");

const auditionCatalogFields = [
  "id",
  "program_offering_id",
  "is_current",
  "admission_cycle",
  "review_status",
  "prescreening_deadline",
].join(",");

const auditionDetailFields = [
  auditionCatalogFields,
  "prescreening_required",
  "Prescreening_required",
  "audition_required",
  "repertoire_summary",
  "repertoire_structured",
  "audition_format",
  "video_requirements",
  "file_format_requirements",
  "accompaniment_requirements",
  "interview_or_callback_requirements",
  "special_notes",
  "conditional_notes",
  "notes",
].join(",");

/**
 * The split repertoire columns do not exist in Directus yet. Directus answers
 * a query naming them with 403 and a message identifying the fields, so the
 * detail read asks for them optimistically and falls back — and only on that
 * classified answer. The `"field" in record` detection in the mappers keeps
 * working the day the admin adds the columns.
 */
const auditionOptionalFields = ["prescreen_repertoire", "audition_repertoire"];

/** Citation fields. No `source_quote`, no `evidence_metadata`. */
const sourceCitationFields = [
  "id",
  "program_offering_id",
  "school_id",
  "source_url",
  "source_title",
  "retrieved_date",
  "confidence_level",
  "source_type",
  "related_field",
].join(",");

/* ------------------------------------------------------------------ *
 * Collection reads
 * ------------------------------------------------------------------ */

export function readCatalogSchools(): Promise<DirectusSchool[]> {
  return readAllItems<DirectusSchool>("schools", { fields: schoolCatalogFields });
}

/**
 * Slugs only, for the school route's static params. Generating 20 route
 * params does not need names, cities, review status or a catalog of programs.
 */
export function readSchoolSlugs(): Promise<DirectusSchool[]> {
  return readAllItems<DirectusSchool>("schools", { fields: "id,slug" });
}

/**
 * Enough of an offering to produce a `/schools/[schoolId]/programs/[programId]`
 * param and to apply the same "has a school slug and a program name" guard the
 * catalog applies, so the params match the programs the catalog would list.
 */
export function readOfferingRouteParams(
  limit: number,
): Promise<DirectusProgramOffering[]> {
  return readItems<DirectusProgramOffering>("program_offerings", {
    fields: "id,official_program_name,school_id.slug",
    limit,
  });
}

/**
 * The columns the profile route's filter vocabulary is built from: country,
 * major area and degree identity, plus the two guard columns. No requirement
 * rows, no source aggregates — a chip list needs none of them.
 */
const offeringFilterOptionFields = [
  "id",
  "official_program_name",
  "school_id.slug",
  "school_id.country",
  "field_id.field_name",
  "field_id.field_name_zh",
  "degree_level_id.slug",
  "degree_level_id.degree_level_name",
  "degree_level_id.degree_level_name_zh",
  "degree_level_id.abbreviation",
  "degree_level_id.degree_category",
].join(",");

export function readOfferingFilterOptions(): Promise<DirectusProgramOffering[]> {
  return readAllItems<DirectusProgramOffering>("program_offerings", {
    fields: offeringFilterOptionFields,
  });
}

export async function readSchoolBySlug(
  slug: string,
): Promise<DirectusSchool | null> {
  const rows = await readItems<DirectusSchool>("schools", {
    fields: schoolDetailFields,
    limit: 1,
    filter: { "filter[slug][_eq]": slug },
  });
  return rows[0] ?? null;
}

export function readCatalogOfferings(
  filter?: DirectusParams,
): Promise<DirectusProgramOffering[]> {
  return readAllItems<DirectusProgramOffering>("program_offerings", {
    fields: offeringCatalogFields,
    filter,
  });
}

export async function readOfferingById(
  id: string,
): Promise<DirectusProgramOffering | null> {
  const rows = await readItems<DirectusProgramOffering>("program_offerings", {
    fields: offeringDetailFields,
    limit: 1,
    filter: { "filter[id][_eq]": id },
  });
  return rows[0] ?? null;
}

export function readCatalogApplications(
  filter?: DirectusParams,
): Promise<DirectusApplicationRequirement[]> {
  return readAllItems<DirectusApplicationRequirement>(
    "application_requirements",
    { fields: applicationCatalogFields, filter },
  );
}

export function readCatalogAuditions(
  filter?: DirectusParams,
): Promise<DirectusAuditionRequirement[]> {
  return readAllItems<DirectusAuditionRequirement>("audition_requirements", {
    fields: auditionCatalogFields,
    filter,
  });
}

/** Every cycle row for one program — a handful, so one bounded page. */
const CYCLE_ROWS_PER_PROGRAM = 50;

export function readProgramApplications(
  programId: string,
): Promise<DirectusApplicationRequirement[]> {
  return readItems<DirectusApplicationRequirement>("application_requirements", {
    fields: applicationDetailFields,
    limit: CYCLE_ROWS_PER_PROGRAM,
    filter: { "filter[program_offering_id][_eq]": programId },
  });
}

export async function readProgramAuditions(
  programId: string,
): Promise<DirectusAuditionRequirement[]> {
  const read = (fields: string, attempts?: number) =>
    readItems<DirectusAuditionRequirement>(
      "audition_requirements",
      {
        fields,
        limit: CYCLE_ROWS_PER_PROGRAM,
        filter: { "filter[program_offering_id][_eq]": programId },
      },
      attempts === undefined ? {} : { attempts },
    );

  try {
    // One attempt: a 403 here is the expected answer while the columns are
    // missing, not a transport failure worth retrying.
    return await read(
      [auditionDetailFields, ...auditionOptionalFields].join(","),
      1,
    );
  } catch (error) {
    if (!isUnknownFieldError(error)) throw error;
    return read(auditionDetailFields);
  }
}

/**
 * Citations for one detail surface, filtered to the records it displays:
 * the program's own sources plus its school's school-level sources, which is
 * exactly the set the pre-R1 in-memory join produced.
 */
export function readProgramSources(
  programId: string,
  schoolId: string,
): Promise<DirectusSourceRecord[]> {
  return readAllItems<DirectusSourceRecord>("source_records", {
    fields: sourceCitationFields,
    filter: {
      "filter[_or][0][program_offering_id][_eq]": programId,
      "filter[_or][1][_and][0][program_offering_id][_null]": "true",
      "filter[_or][1][_and][1][school_id][_eq]": schoolId,
    },
  });
}

/** School-level citations (no program link) for one school. */
export function readSchoolSources(
  schoolId: string,
): Promise<DirectusSourceRecord[]> {
  return readAllItems<DirectusSourceRecord>("source_records", {
    fields: sourceCitationFields,
    filter: {
      "filter[program_offering_id][_null]": "true",
      "filter[school_id][_eq]": schoolId,
    },
  });
}

/**
 * Evidence enrichment for records already on screen.
 *
 * This is the per-detail pattern the pre-R1 code used for quotes, extended to
 * carry `evidence_metadata` (the school page groups citations by its
 * `topic_key`). Quotes and metadata are supplementary, so a failure degrades
 * the page to citations without blockquotes rather than failing it — and the
 * degradation is logged instead of swallowed. Ids are chunked so the URL
 * length cannot run away on a school with many records.
 */
const EVIDENCE_CHUNK = 100;

export async function readSourceEvidence(
  ids: string[],
  options: { withMetadata: boolean },
): Promise<Map<string, DirectusSourceRecord>> {
  const evidence = new Map<string, DirectusSourceRecord>();
  if (ids.length === 0) return evidence;

  const fields = ["id", "source_quote", ...(options.withMetadata ? ["evidence_metadata"] : [])]
    .join(",");

  for (let start = 0; start < ids.length; start += EVIDENCE_CHUNK) {
    const chunk = ids.slice(start, start + EVIDENCE_CHUNK);
    try {
      const rows = await readItems<DirectusSourceRecord>("source_records", {
        fields,
        limit: chunk.length,
        filter: { "filter[id][_in]": chunk.join(",") },
      });
      for (const row of rows) {
        if (row.id !== undefined) evidence.set(String(row.id), row);
      }
    } catch (error) {
      logDirectusDegradation("source_evidence", error);
      return evidence;
    }
  }
  return evidence;
}

/**
 * Degree level lookup for the program page's degree label.
 *
 * Pre-R1 this list was a by-product of scanning every offering's expanded
 * degree relation. The collection itself answers the same question in one
 * five-row read.
 */
export function readDegreeLevels(): Promise<DirectusDegreeLevel[]> {
  return readAllItems<DirectusDegreeLevel>("degree_levels", {
    fields: "id,slug,degree_level_name,degree_level_name_zh,abbreviation,degree_category",
  });
}

/* ------------------------------------------------------------------ *
 * Source aggregates — what list surfaces read instead of source bodies
 * ------------------------------------------------------------------ */

export interface SourceStatsRow {
  program_offering_id?: DirectusId | null;
  school_id?: DirectusId | null;
  confidence_level?: string | null;
  max?: { retrieved_date?: string | null } | null;
  count?: { id?: string | number } | null;
}

/**
 * `mapSource` drops records without a URL or a usable retrieval date, so the
 * date/count aggregates apply the same filter — the numbers they produce are
 * the numbers the old in-memory join produced.
 */
const mappableSourceFilter: DirectusParams = {
  "filter[source_url][_nnull]": "true",
  "filter[retrieved_date][_nnull]": "true",
};

export function readProgramSourceStats(
  filter?: DirectusParams,
): Promise<SourceStatsRow[]> {
  return readAggregate<SourceStatsRow>("source_records", {
    aggregate: { "aggregate[max]": "retrieved_date", "aggregate[count]": "id" },
    groupBy: "program_offering_id",
    filter: {
      "filter[program_offering_id][_nnull]": "true",
      ...mappableSourceFilter,
      ...filter,
    },
  });
}

export function readSchoolSourceStats(
  filter?: DirectusParams,
): Promise<SourceStatsRow[]> {
  return readAggregate<SourceStatsRow>("source_records", {
    aggregate: { "aggregate[max]": "retrieved_date", "aggregate[count]": "id" },
    groupBy: "school_id",
    filter: {
      "filter[program_offering_id][_null]": "true",
      "filter[school_id][_nnull]": "true",
      ...mappableSourceFilter,
      ...filter,
    },
  });
}

/**
 * Confidence is read over *all* linked records, including ones `mapSource`
 * drops — `weakestConfidence` has always been computed before that filter, so
 * the aggregate is deliberately unfiltered.
 */
export function readProgramConfidenceStats(
  filter?: DirectusParams,
): Promise<SourceStatsRow[]> {
  return readAggregate<SourceStatsRow>("source_records", {
    aggregate: { "aggregate[count]": "id" },
    groupBy: "program_offering_id,confidence_level",
    filter: { "filter[program_offering_id][_nnull]": "true", ...filter },
  });
}

export function readSchoolConfidenceStats(
  filter?: DirectusParams,
): Promise<SourceStatsRow[]> {
  return readAggregate<SourceStatsRow>("source_records", {
    aggregate: { "aggregate[count]": "id" },
    groupBy: "school_id,confidence_level",
    filter: {
      "filter[program_offering_id][_null]": "true",
      "filter[school_id][_nnull]": "true",
      ...filter,
    },
  });
}
