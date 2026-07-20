import "server-only";

import pilotPackage from "@/data/pilot/manhattan_school_of_music.json";

type Id = string | number;

export interface PilotCountry {
  id: Id;
  country_name: string;
  visa_summary: string | null;
  post_study_work: string | null;
}

export interface PilotCity {
  id: Id;
  city_name: string;
  living_cost_band: "Low" | "Medium" | "High" | "Very High";
  living_cost_monthly_est: string | number | null;
  living_cost_currency: string | null;
  country_ref: PilotCountry | null;
}

export interface PilotSchool {
  id: Id;
  slug: string;
  school_name: string;
  city: string | null;
  country: string | null;
  school_type: string | null;
  official_website: string;
  city_ref: PilotCity | null;
}

export interface PilotProgram {
  id: Id;
  program_offering_ref: string;
  official_program_name: string;
  track_or_concentration: string | null;
  program_url: string;
  duration_years: string | number | null;
  language_of_instruction: string[] | null;
  faculty_list: string | null;
  last_checked: string;
  review_status: string;
  school_id: PilotSchool;
  field_id: { id: Id; slug: string; field_name: string };
  degree_level_id: {
    id: Id;
    slug: string;
    degree_level_name: string;
    abbreviation: string | null;
  };
}

export interface PilotApplication {
  id: Id;
  admission_cycle: string;
  is_current: boolean;
  application_deadline: string | null;
  deadline_notes: string | null;
  english_language_tests: string[] | null;
  toefl_minimum: string | number | null;
  ielts_minimum: string | number | null;
  conditional_notes: string | null;
  tuition_annual: string | number | null;
  tuition_currency: string | null;
  scholarships_available: "Yes" | "No" | "Unknown";
  scholarship_note: string | null;
  review_status: string;
}

export interface PilotAudition {
  id: Id;
  admission_cycle: string;
  is_current: boolean;
  prescreening_required: "Yes" | "No" | "Varies" | "Unknown";
  prescreening_deadline: string | null;
  audition_required: "Yes" | "No" | "Varies" | "Unknown";
  audition_format: string | null;
  repertoire_summary: string | null;
  conditional_notes: string | null;
  review_status: string;
}

export interface PilotSource {
  id: Id;
  source_url: string;
  source_type: string;
  retrieved_date: string;
  source_quote: string | null;
  related_field: string | null;
  confidence_level: string;
  review_status: string;
}

export interface PilotProgramData {
  program: PilotProgram;
  application: PilotApplication | null;
  audition: PilotAudition | null;
  sources: PilotSource[];
}

const PILOT_REFS = new Set(
  pilotPackage.program_offerings.map(({ program_offering_ref }) => program_offering_ref),
);

function endpoint(): string {
  const base = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!base) throw new Error("DIRECTUS_URL is not configured");
  return base.replace(/\/+$/, "");
}

async function directusItems<T>(
  collection: string,
  params: Record<string, string>,
): Promise<T[]> {
  const query = new URLSearchParams(params);
  const response = await fetch(`${endpoint()}/items/${collection}?${query}`, {
    headers: process.env.DIRECTUS_TOKEN
      ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` }
      : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Directus ${response.status} while reading ${collection}`);
  }
  const body = (await response.json()) as { data: T[] };
  return body.data;
}

const PROGRAM_FIELDS = [
  "id", "program_offering_ref", "official_program_name", "track_or_concentration",
  "program_url", "duration_years", "language_of_instruction", "faculty_list",
  "last_checked", "review_status", "school_id.id", "school_id.slug",
  "school_id.school_name", "school_id.city", "school_id.country", "school_id.school_type",
  "school_id.official_website", "school_id.city_ref.id", "school_id.city_ref.city_name",
  "school_id.city_ref.living_cost_band", "school_id.city_ref.living_cost_monthly_est",
  "school_id.city_ref.living_cost_currency", "school_id.city_ref.country_ref.id",
  "school_id.city_ref.country_ref.country_name", "school_id.city_ref.country_ref.visa_summary",
  "school_id.city_ref.country_ref.post_study_work", "field_id.id", "field_id.slug",
  "field_id.field_name", "degree_level_id.id", "degree_level_id.slug",
  "degree_level_id.degree_level_name", "degree_level_id.abbreviation",
].join(",");

const APPLICATION_FIELDS = [
  "id", "admission_cycle", "is_current", "application_deadline", "deadline_notes",
  "english_language_tests", "toefl_minimum", "ielts_minimum", "conditional_notes",
  "tuition_annual", "tuition_currency", "scholarships_available", "scholarship_note",
  "review_status",
].join(",");

const AUDITION_FIELDS = [
  "id", "admission_cycle", "is_current", "prescreening_required", "prescreening_deadline",
  "audition_required", "audition_format", "repertoire_summary", "conditional_notes",
  "review_status",
].join(",");

const SOURCE_FIELDS = [
  "id", "source_url", "source_type", "retrieved_date", "source_quote", "related_field",
  "confidence_level", "review_status",
].join(",");

export async function getPilotProgramsBySchool(slug: string): Promise<PilotProgram[]> {
  const rows = await directusItems<PilotProgram>("program_offerings", {
    limit: "-1",
    fields: PROGRAM_FIELDS,
    "filter[school_id][slug][_eq]": slug,
    sort: "program_offering_ref",
  });
  return rows.filter(({ program_offering_ref }) => PILOT_REFS.has(program_offering_ref));
}

export async function getPilotProgramByRef(ref: string): Promise<PilotProgramData | null> {
  if (!PILOT_REFS.has(ref)) return null;
  const [program] = await directusItems<PilotProgram>("program_offerings", {
    limit: "1",
    fields: PROGRAM_FIELDS,
    "filter[program_offering_ref][_eq]": ref,
  });
  if (!program) return null;

  const [applications, auditions, sources] = await Promise.all([
    directusItems<PilotApplication>("application_requirements", {
      limit: "1",
      fields: APPLICATION_FIELDS,
      "filter[program_offering_id][_eq]": String(program.id),
      "filter[is_current][_eq]": "true",
      sort: "-admission_cycle",
    }),
    directusItems<PilotAudition>("audition_requirements", {
      limit: "1",
      fields: AUDITION_FIELDS,
      "filter[program_offering_id][_eq]": String(program.id),
      "filter[is_current][_eq]": "true",
      sort: "-admission_cycle",
    }),
    directusItems<PilotSource>("source_records", {
      limit: "-1",
      fields: SOURCE_FIELDS,
      "filter[_or][0][program_offering_id][_eq]": String(program.id),
      "filter[_or][1][school_id][_eq]": String(program.school_id.id),
      sort: "related_field,source_url",
    }),
  ]);

  return {
    program,
    application: applications[0] ?? null,
    audition: auditions[0] ?? null,
    sources,
  };
}
