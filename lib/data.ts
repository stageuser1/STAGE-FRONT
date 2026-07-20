import { cache } from "react";
import type {
  ApplicationSection,
  AuditionSection,
  ConfidenceLevel,
  CurrencyCode,
  DegreeInfo,
  DegreeLevel,
  LanguageTest,
  PrescreenSection,
  Program,
  ProgramSearchQuery,
  School,
  SchoolDetailSection,
  SchoolDetailSectionKey,
  SourceRecord,
  SourceType,
  WorkflowStatus,
} from "@/data/types";

type DirectusId = string | number;

interface DirectusSchool {
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

interface DirectusField {
  id?: DirectusId;
  slug?: string | null;
  field_name?: string | null;
  field_name_zh?: string | null;
  field_category?: string | null;
}

interface DirectusDegreeLevel {
  id?: DirectusId;
  slug?: string | null;
  degree_level_name?: string | null;
  degree_level_name_zh?: string | null;
  abbreviation?: string | null;
  degree_category?: string | null;
}

interface DirectusProgramOffering {
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

interface DirectusCycleRecord {
  id: DirectusId;
  program_offering_id?: DirectusId | { id?: DirectusId } | null;
  is_current?: boolean | string | number | null;
  admission_cycle?: string | number | null;
  review_status?: string | null;
}

interface DirectusApplicationRequirement extends DirectusCycleRecord {
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

interface DirectusAuditionRequirement extends DirectusCycleRecord {
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

interface DirectusSourceRecord {
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

interface DirectusData {
  schools: School[];
  programs: Program[];
}

const statusStrength: Record<WorkflowStatus, number> = {
  draft: 0,
  extracted_awaiting_review: 1,
  human_reviewed: 2,
  published: 3,
};

async function directusFetch<T>(path: string): Promise<T> {
  const base = process.env.DIRECTUS_URL;
  if (!base) throw new Error("DIRECTUS_URL is not set");
  const headers: HeadersInit = {};
  if (process.env.DIRECTUS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIRECTUS_TOKEN}`;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let res: Response;
    try {
      res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        headers,
        cache: "no-store",
      });
    } catch (error) {
      if (attempt === 1) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Directus request failed on ${path}: ${message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
      continue;
    }

    if (res.ok) {
      const json = await res.json();
      return json.data as T;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 1) {
      throw new Error(`Directus ${res.status} on ${path}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Directus request failed on ${path}`);
}

function relationId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" || typeof id === "number"
      ? String(id)
      : null;
  }

  return null;
}

function relationObject<T extends object>(value: unknown): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function parsedStructuredValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("[") && !text.startsWith("{")) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function editorValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() === "" ? null : value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

function displayStructuredValue(value: unknown): string | null {
  const parsed = parsedStructuredValue(value);
  if (parsed === null || parsed === undefined) return null;
  if (typeof parsed === "string" || typeof parsed === "number") {
    return textValue(parsed);
  }
  if (typeof parsed === "boolean") return parsed ? "Yes" : "No";
  if (Array.isArray(parsed)) {
    const values = parsed
      .map(displayStructuredValue)
      .filter((item): item is string => item !== null);
    return values.length > 0 ? values.join(", ") : null;
  }
  if (typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of ["language", "name", "label", "value"]) {
      const display = displayStructuredValue(record[key]);
      if (display) return display;
    }
    try {
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return null;
}

function dateValue(value: unknown): string | null {
  const text = textValue(value);
  if (!text) return null;
  const date = text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : date;
}

function mapReviewStatus(value: unknown): WorkflowStatus {
  switch (textValue(value)?.toLowerCase()) {
    case "needs_update":
    case "outdated":
      return "draft";
    case "human_checked":
    case "human_edited":
    case "verified":
      return "human_reviewed";
    case "ai_generated":
    case "extracted":
    case "needs review":
    default:
      return "extracted_awaiting_review";
  }
}

function weakestStatus(statuses: WorkflowStatus[]): WorkflowStatus {
  return statuses.reduce(
    (weakest, status) =>
      statusStrength[status] < statusStrength[weakest] ? status : weakest,
    "published",
  );
}

function mapConfidence(value: unknown): ConfidenceLevel {
  switch (textValue(value)?.toLowerCase()) {
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

function weakestConfidence(records: DirectusSourceRecord[]): ConfidenceLevel {
  const strength: Record<ConfidenceLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  if (records.length === 0) return "medium";

  return records.slice(1).reduce<ConfidenceLevel>((weakest, record) => {
    const confidence = mapConfidence(record.confidence_level);
    return strength[confidence] < strength[weakest] ? confidence : weakest;
  }, mapConfidence(records[0].confidence_level));
}

function selectCurrentCycle<T extends DirectusCycleRecord>(
  records: T[],
  programId: string,
): T | null {
  const matching = records.filter(
    (record) => relationId(record.program_offering_id) === programId,
  );
  const current = matching.filter(
    (record) => booleanValue(record.is_current) === true,
  );
  const candidates = current.length > 0 ? current : matching;

  return (
    [...candidates].sort((left, right) =>
      (textValue(right.admission_cycle) ?? "").localeCompare(
        textValue(left.admission_cycle) ?? "",
      ),
    )[0] ?? null
  );
}

interface DegreeLevelMapping {
  degreeLevel: DegreeLevel;
  reviewNote: string | null;
}

function inferDegreeLevelFromName(value: string): DegreeLevel | null {
  const name = value.toLowerCase();
  if (/doctor|doctoral|dma|ph\.?d/.test(name)) return "doctorate";
  if (name.includes("diploma")) return "diploma";
  if (/master|m\.?m\.?|graduate/.test(name)) return "master";
  if (/bachelor|b\.?m\.?|undergraduate/.test(name)) return "bachelor";
  if (name.includes("certificate")) return "certificate";
  return null;
}

function mapDegreeLevel(
  offering: DirectusProgramOffering,
  name: string,
): DegreeLevelMapping {
  const relation = relationObject<DirectusDegreeLevel>(
    offering.degree_level_id,
  );
  const slug = textValue(relation?.slug)?.toLowerCase();
  const slugMapping: Record<string, DegreeLevel> = {
    bm: "bachelor",
    mm: "master",
    dma: "doctorate",
    gd: "diploma",
    ad: "diploma",
  };

  if (slug && slugMapping[slug]) {
    return { degreeLevel: slugMapping[slug], reviewNote: null };
  }

  if (slug) {
    return {
      degreeLevel: "certificate",
      reviewNote: `Unmapped Directus degree level slug "${slug}"; certificate is a temporary frontend fallback and requires review.`,
    };
  }

  const heuristicSource = [
    relation?.degree_level_name,
    name,
  ]
    .filter((item): item is string => typeof item === "string")
    .join(" ");
  const inferred = inferDegreeLevelFromName(heuristicSource);

  return {
    degreeLevel: inferred ?? "certificate",
    reviewNote: inferred
      ? "Degree level was inferred from its name because the Directus degree level slug was unavailable."
      : "Directus degree level slug was unavailable and the degree name could not be mapped; certificate is a temporary frontend fallback and requires review.",
  };
}

const degreeZhBySlug: Record<string, string> = {
  bm: "音乐学士",
  mm: "音乐硕士",
  dma: "音乐艺术博士",
  gd: "研究生文凭",
  ad: "艺术家文凭",
};

function mapDegreeInfo(
  offering: DirectusProgramOffering,
  fallbackName: string,
): DegreeInfo {
  const relation = relationObject<DirectusDegreeLevel>(offering.degree_level_id);
  const slug = textValue(relation?.slug)?.toLowerCase() ?? null;
  return {
    slug,
    name: textValue(relation?.degree_level_name) ?? fallbackName,
    name_zh:
      textValue(relation?.degree_level_name_zh) ??
      (slug ? degreeZhBySlug[slug] ?? null : null),
    abbreviation:
      textValue(relation?.abbreviation) ?? slug?.toUpperCase() ?? null,
    category: textValue(relation?.degree_category),
  };
}

function structuredStringList(value: unknown): string[] {
  const parsed = parsedStructuredValue(value);
  if (Array.isArray(parsed)) return parsed.flatMap(structuredStringList);
  if (parsed && typeof parsed === "object") {
    return Object.values(parsed as Record<string, unknown>).flatMap(
      structuredStringList,
    );
  }
  const text = textValue(parsed);
  return text ? [text] : [];
}

function repertoireListMarkdown(
  value: unknown,
  key: "prescreen" | "audition",
): string | null {
  const parsed = parsedStructuredValue(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const items = (parsed as Record<string, unknown>)[key];
  if (!Array.isArray(items)) return null;
  const lines = items
    .map((item) => textValue(item))
    .filter((item): item is string => item !== null);
  return lines.length > 0
    ? lines.map((line, index) => `${index + 1}. ${line}`).join("\n")
    : null;
}

function mapApplicationSection(
  application: DirectusApplicationRequirement | null,
): ApplicationSection | null {
  if (!application) return null;
  return {
    resume_required: textValue(application.resume_required),
    essay_required: textValue(application.essay_required),
    recommendation_letters: textValue(application.recommendation_letters),
    transcript_requirements: textValue(application.transcript_requirements),
    portfolio_required: textValue(application.portfolio_required),
    required_materials: structuredStringList(application.required_materials),
    international_applicant_notes: textValue(
      application.international_applicant_notes,
    ),
    conditional_notes: textValue(application.conditional_notes),
    notes: textValue(application.notes),
    admission_cycle: textValue(application.admission_cycle),
  };
}

function mapAuditionSections(audition: DirectusAuditionRequirement | null): {
  prescreen: PrescreenSection | null;
  audition: AuditionSection | null;
} {
  if (!audition) return { prescreen: null, audition: null };

  const prescreenRepertoire =
    textValue(audition.prescreen_repertoire) ??
    repertoireListMarkdown(audition.repertoire_structured, "prescreen");
  const auditionRepertoire =
    textValue(audition.audition_repertoire) ??
    repertoireListMarkdown(audition.repertoire_structured, "audition");
  const hasSplitRepertoire =
    prescreenRepertoire !== null || auditionRepertoire !== null;

  return {
    prescreen: {
      required: requirementBoolean(
        audition.prescreening_required ?? audition.Prescreening_required,
      ),
      required_text: textValue(
        audition.prescreening_required ?? audition.Prescreening_required,
      ),
      deadline: dateValue(audition.prescreening_deadline),
      video_requirements: textValue(audition.video_requirements),
      file_format_requirements: textValue(audition.file_format_requirements),
      repertoire: prescreenRepertoire,
    },
    audition: {
      required: requirementBoolean(audition.audition_required),
      required_text: textValue(audition.audition_required),
      format: textValue(audition.audition_format),
      accompaniment_requirements: textValue(
        audition.accompaniment_requirements,
      ),
      interview_or_callback_requirements: textValue(
        audition.interview_or_callback_requirements,
      ),
      repertoire: auditionRepertoire,
      special_notes: textValue(audition.special_notes),
      conditional_notes: textValue(audition.conditional_notes),
      notes: textValue(audition.notes),
      legacy_repertoire_summary: hasSplitRepertoire
        ? null
        : textValue(audition.repertoire_summary),
    },
  };
}

function englishTestNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return [
          textValue(record.test_name) ??
            textValue(record.name) ??
            textValue(record.test),
        ].filter((name): name is string => name !== null);
      }
      return [];
    });
  }

  const text = textValue(value);
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return englishTestNames(JSON.parse(text));
    } catch {
      // Fall through to delimiter parsing for non-JSON values.
    }
  }

  return text.split(/[,;|/]/).map((item) => item.trim()).filter(Boolean);
}

function requirementStatus(value: unknown): boolean | null | undefined {
  const normalized = textValue(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "required" ||
    normalized === "yes" ||
    normalized === "true"
  ) {
    return true;
  }
  if (
    normalized === "not_required" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "none"
  ) {
    return false;
  }
  if (normalized === "optional" || normalized === "unknown") return null;
  return undefined;
}

function structuredStatuses(value: unknown): Array<boolean | null> {
  const parsed = parsedStructuredValue(value);
  if (Array.isArray(parsed)) return parsed.flatMap(structuredStatuses);
  if (parsed && typeof parsed === "object") {
    return Object.values(parsed as Record<string, unknown>).flatMap(
      structuredStatuses,
    );
  }
  const status = requirementStatus(parsed);
  return status === undefined ? [] : [status];
}

function canonicalTestName(value: string): LanguageTest["test_name"] {
  const name = value.toLowerCase();
  if (name.includes("toefl")) return "TOEFL";
  if (name.includes("ielts")) return "IELTS";
  if (name.includes("duolingo")) return "Duolingo";
  if (name.includes("cambridge")) return "Cambridge";
  return "Other";
}

function mapLanguageTests(
  requirement: DirectusApplicationRequirement | null,
): LanguageTest[] {
  if (!requirement) return [];

  const names = englishTestNames(requirement.english_language_tests).filter(
    (name) => requirementStatus(name) === undefined,
  );
  if (textValue(requirement.toefl_minimum)) names.push("TOEFL");
  if (textValue(requirement.ielts_minimum)) names.push("IELTS");
  if (textValue(requirement.duolingo_minimum)) names.push("Duolingo");

  const tests = new Map<LanguageTest["test_name"], LanguageTest>();
  names.forEach((name) => {
    const testName = canonicalTestName(name);
    const minimumScore =
      testName === "TOEFL"
        ? textValue(requirement.toefl_minimum)
        : testName === "IELTS"
          ? textValue(requirement.ielts_minimum)
          : testName === "Duolingo"
            ? textValue(requirement.duolingo_minimum)
            : null;

    tests.set(testName, {
      test_name: testName,
      minimum_score: minimumScore,
      section_minimums: null,
      notes: null,
    });
  });

  return [...tests.values()];
}

function derivedEnglishRequired(
  requirement: DirectusApplicationRequirement | null,
  acceptedTests: LanguageTest[],
): boolean | null {
  if (!requirement) return null;
  const statuses = structuredStatuses(requirement.english_language_tests);
  if (statuses.includes(false)) return false;
  if (statuses.includes(true)) return true;
  if (statuses.includes(null)) return null;
  return acceptedTests.length > 0 || textValue(requirement.english_waiver_policy)
    ? true
    : null;
}

function requirementBoolean(value: unknown): boolean | null {
  return requirementStatus(value) ?? null;
}

function mapCurrency(value: unknown): CurrencyCode | null {
  const currency = textValue(value)?.toUpperCase();
  return currency === "USD" || currency === "GBP" || currency === "EUR"
    ? currency
    : null;
}

function mapCostAid(
  amountValue: unknown,
  currencyValue: unknown,
): Program["cost_aid"] {
  const applicationFee = numberValue(amountValue);
  const originalAmount = textValue(amountValue);
  const originalCurrency = textValue(currencyValue)?.toUpperCase();
  const currency = mapCurrency(currencyValue);
  const hasOriginalValue = originalAmount !== null || originalCurrency !== null;

  if (!currency && hasOriginalValue) {
    const originalValue = `${originalCurrency ?? "currency missing"} ${
      originalAmount ?? "amount missing"
    }`;
    return {
      currency: "USD",
      tuition_amount: null,
      tuition_period: null,
      application_fee: null,
      scholarships_available: null,
      notes: `Application fee is not displayed because its Directus currency is unsupported or missing. Original value: ${originalValue}.`,
    };
  }

  return {
    currency: currency ?? "USD",
    tuition_amount: null,
    tuition_period: null,
    application_fee: applicationFee,
    scholarships_available: null,
    notes: null,
  };
}

function mapSourceType(record: DirectusSourceRecord): SourceType {
  const directType = textValue(record.source_type) as SourceType | null;
  if (
    directType === "official_program_page" ||
    directType === "official_admissions_page" ||
    directType === "official_tuition_page" ||
    directType === "official_language_page" ||
    directType === "official_audition_page"
  ) {
    return directType;
  }

  const description = `${record.source_title ?? ""} ${record.source_url ?? ""}`.toLowerCase();
  if (description.includes("tuition")) return "official_tuition_page";
  if (description.includes("language") || description.includes("english")) {
    return "official_language_page";
  }
  if (description.includes("audition")) return "official_audition_page";
  if (description.includes("admission") || description.includes("apply")) {
    return "official_admissions_page";
  }
  return "official_program_page";
}

function mapSource(record: DirectusSourceRecord): SourceRecord | null {
  const url = textValue(record.source_url);
  const accessedAt = dateValue(record.retrieved_date);
  if (!url || !accessedAt) return null;

  return {
    record_id: record.id !== undefined ? String(record.id) : null,
    title: textValue(record.source_title) ?? "Official source",
    url,
    source_type: mapSourceType(record),
    accessed_at: accessedAt,
    notes: textValue(record.source_quote),
    related_field: textValue(record.related_field),
    topic_key: sourceTopicKey(record),
  };
}

function sourceTopicKey(record: DirectusSourceRecord): string | null {
  const metadata = parsedStructuredValue(record.evidence_metadata);
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const topic = textValue((metadata as Record<string, unknown>).topic_key);
    if (topic) return topic;
  }
  return null;
}

function mapSchoolDetailSections(
  value: unknown,
): Partial<Record<SchoolDetailSectionKey, SchoolDetailSection>> {
  const parsed = parsedStructuredValue(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const allowedKeys: SchoolDetailSectionKey[] = [
    "overview",
    "international",
    "tuition",
    "campus",
    "policies",
  ];
  return Object.fromEntries(
    allowedKeys.flatMap((key) => {
      const section = (parsed as Record<string, unknown>)[key];
      if (!section || typeof section !== "object" || Array.isArray(section)) {
        return [];
      }
      const record = section as Record<string, unknown>;
      const body = textValue(record.body_zh);
      const checked = dateValue(record.last_checked_at);
      if (!body || !checked) return [];
      const stringArray = (entry: unknown): string[] =>
        Array.isArray(entry)
          ? entry
              .map(textValue)
              .filter((item): item is string => item !== null)
          : [];
      return [
        [
          key,
          {
            body_zh: body,
            source_urls: stringArray(record.source_urls),
            evidence_quotes: stringArray(record.evidence_quotes),
            last_checked_at: checked,
            admission_cycle: textValue(record.admission_cycle),
            academic_year: textValue(record.academic_year),
          },
        ],
      ];
    }),
  );
}

/**
 * Detail-page enhancement: load the evidence quotes for a small set of
 * already-mapped source records. Quotes are supplementary content, so a
 * failed quote fetch never fails the page — it just renders without
 * blockquotes.
 */
async function attachSourceQuotes(
  sources: SourceRecord[],
): Promise<SourceRecord[]> {
  const ids = sources
    .map((source) => source.record_id)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return sources;

  try {
    const rows = await directusFetch<
      Array<{ id?: DirectusId; source_quote?: string | null }>
    >(
      `/items/source_records?limit=-1&fields=id,source_quote&filter[id][_in]=${ids
        .map((id) => encodeURIComponent(id))
        .join(",")}`,
    );
    const quotes = new Map(
      rows.map((row) => [String(row.id), textValue(row.source_quote)]),
    );
    return sources.map((source) =>
      source.record_id && quotes.has(source.record_id)
        ? { ...source, notes: quotes.get(source.record_id) ?? source.notes }
        : source,
    );
  } catch {
    return sources;
  }
}

/**
 * Every query names exactly the fields the mappers read. The import
 * pipeline stores very large blob columns on these collections
 * (program_payload ~117KB/row, requirement_sections ~89KB/row,
 * evidence_metadata ~126KB/row) that the frontend never uses; fetching
 * with `fields=*` drags tens of megabytes through a slow link on every
 * request and stalls server rendering for minutes.
 */
const offeringFields = [
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
  "school_id.id",
  "school_id.slug",
  "school_id.school_name",
  "school_id.city",
  "school_id.country",
  "field_id.id",
  "field_id.slug",
  "field_id.field_name",
  "field_id.field_name_zh",
  "field_id.field_category",
  "degree_level_id.id",
  "degree_level_id.slug",
  "degree_level_id.degree_level_name",
  "degree_level_id.degree_level_name_zh",
  "degree_level_id.abbreviation",
  "degree_level_id.degree_category",
].join(",");

const applicationFields = [
  "id",
  "program_offering_id",
  "is_current",
  "admission_cycle",
  "review_status",
  "deadline_notes",
  "application_deadline",
  "english_language_tests",
  "toefl_minimum",
  "ielts_minimum",
  "duolingo_minimum",
  "english_waiver_policy",
  "resume_required",
  "essay_required",
  "recommendation_letters",
  "transcript_requirements",
  "portfolio_required",
  "required_materials",
  "international_applicant_notes",
  "conditional_notes",
  "notes",
  "application_fee",
  "application_fee_currency",
  "tuition_annual",
  "tuition_currency",
  "scholarships_available",
  "scholarship_note",
].join(",");

const auditionBaseFields = [
  "id",
  "program_offering_id",
  "is_current",
  "admission_cycle",
  "review_status",
  "prescreening_deadline",
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
 * The split repertoire columns do not exist in Directus yet. Directus
 * rejects queries naming unknown fields, so request them opportunistically
 * and fall back to the base list — the `"field" in record` detection in
 * the mappers keeps working the day the admin adds the columns.
 */
const auditionOptionalFields = ["prescreen_repertoire", "audition_repertoire"];

async function fetchAuditionRequirements(): Promise<
  DirectusAuditionRequirement[]
> {
  try {
    return await directusFetch<DirectusAuditionRequirement[]>(
      `/items/audition_requirements?limit=-1&fields=${auditionBaseFields},${auditionOptionalFields.join(",")}`,
    );
  } catch {
    return directusFetch<DirectusAuditionRequirement[]>(
      `/items/audition_requirements?limit=-1&fields=${auditionBaseFields}`,
    );
  }
}

/**
 * The bulk load intentionally skips `source_quote`: 5,000+ rows carry
 * ~2KB quotes each (~6MB). Quotes are only rendered on school and
 * program detail pages, which fetch them per-record via
 * attachSourceQuotes below.
 */
const sourceRecordFields = [
  "id",
  "program_offering_id",
  "school_id",
  "source_url",
  "source_title",
  "retrieved_date",
  "confidence_level",
  "source_type",
  "related_field",
  "evidence_metadata",
].join(",");

const loadDirectusData = cache(async (): Promise<DirectusData> => {
  const [
    directusSchools,
    offerings,
    applicationRequirements,
    auditionRequirements,
    sourceRecords,
  ] = await Promise.all([
    directusFetch<DirectusSchool[]>(
      "/items/schools?limit=-1&fields=id,slug,school_name,city,country,official_website,review_status,intro_zh,school_detail_sections",
    ),
    directusFetch<DirectusProgramOffering[]>(
      `/items/program_offerings?limit=-1&fields=${offeringFields}`,
    ),
    directusFetch<DirectusApplicationRequirement[]>(
      `/items/application_requirements?limit=-1&fields=${applicationFields}`,
    ),
    fetchAuditionRequirements(),
    directusFetch<DirectusSourceRecord[]>(
      `/items/source_records?limit=-1&fields=${sourceRecordFields}`,
    ),
  ]);

  const schoolsByDirectusId = new Map(
    directusSchools.map((school) => [String(school.id), school]),
  );
  const degreeLevelOptions = [
    ...new Map(
      offerings.flatMap((offering) => {
        const degree = relationObject<DirectusDegreeLevel>(
          offering.degree_level_id,
        );
        const id = relationId(offering.degree_level_id);
        const label =
          textValue(degree?.degree_level_name) ?? textValue(degree?.slug);
        return id && label ? [[id, { label, value: id }] as const] : [];
      }),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label));

  const programs = offerings.flatMap<Program>((offering) => {
    const programId = String(offering.id);
    const expandedSchool = relationObject<DirectusSchool>(offering.school_id);
    const schoolDirectusId = relationId(offering.school_id);
    const school =
      expandedSchool ??
      (schoolDirectusId
        ? schoolsByDirectusId.get(schoolDirectusId) ?? null
        : null);
    const schoolSlug = textValue(school?.slug);
    const programName = textValue(offering.official_program_name);
    if (!school || !schoolSlug || !programName) return [];

    const application = selectCurrentCycle(
      applicationRequirements,
      programId,
    );
    const audition = selectCurrentCycle(auditionRequirements, programId);
    const linkedSourceRecords = sourceRecords.filter((source) => {
      const sourceProgramId = relationId(source.program_offering_id);
      const sourceSchoolId = relationId(source.school_id);
      return (
        sourceProgramId === programId ||
        (!sourceProgramId && sourceSchoolId === String(school.id))
      );
    });
    const mappedSources = linkedSourceRecords.map(mapSource);
    const sources = mappedSources
      .filter((source): source is SourceRecord => source !== null);
    const field = relationObject<DirectusField>(offering.field_id);
    const degreeLevel = mapDegreeLevel(offering, programName);
    const degree = mapDegreeInfo(offering, programName);
    const acceptedTests = mapLanguageTests(application);
    const sections = mapAuditionSections(audition);
    const statuses = [mapReviewStatus(offering.review_status)];
    if (application) statuses.push(mapReviewStatus(application.review_status));
    if (audition) statuses.push(mapReviewStatus(audition.review_status));
    const status = weakestStatus(statuses);
    const reviewNotes: string[] = [];
    if (degreeLevel.reviewNote) reviewNotes.push(degreeLevel.reviewNote);
    const omittedSources = linkedSourceRecords.filter(
      (_source, index) => mappedSources[index] === null,
    );
    const omittedForDate = omittedSources.filter(
      (source) => dateValue(source.retrieved_date) === null,
    ).length;
    const omittedForUrl = omittedSources.filter(
      (source) => textValue(source.source_url) === null,
    ).length;
    if (omittedForDate > 0) {
      reviewNotes.push(
        `${omittedForDate} linked source record(s) were omitted because retrieved_date was missing or invalid.`,
      );
    }
    if (omittedForUrl > 0) {
      reviewNotes.push(
        `${omittedForUrl} linked source record(s) were omitted because source_url was missing.`,
      );
    }
    const applicationFeeValue = application?.application_fee;
    const applicationFeeCurrency = application?.application_fee_currency;

    return [
      {
        id: programId,
        school_id: schoolSlug,
        school_name: textValue(school.school_name) ?? "暂未收录",
        country: textValue(school.country) ?? "待核实",
        city: textValue(school.city) ?? "待核实",
        name: programName,
        name_zh: textValue(offering.program_name_zh),
        degree_level: degreeLevel.degreeLevel,
        degree,
        major_area: textValue(field?.field_name) ?? "",
        major_area_zh: textValue(field?.field_name_zh),
        specialization:
          textValue(offering.track_or_concentration) ??
          textValue(field?.field_name),
        department: textValue(offering.department),
        card_summary: textValue(offering.card_summary_zh),
        application: mapApplicationSection(application),
        prescreen: sections.prescreen,
        audition: sections.audition,
        duration: textValue(offering.duration_years),
        program_url: textValue(offering.program_url),
        application_url: textValue(offering.application_url),
        audition_url: textValue(offering.audition_url),
        international_url: textValue(offering.international_url),
        deadline: {
          application_deadline: dateValue(application?.application_deadline),
          prescreening_deadline: dateValue(audition?.prescreening_deadline),
          audition_date: null,
          notes: textValue(application?.deadline_notes),
        },
        language_requirements: {
          instruction_language: displayStructuredValue(
            offering.language_of_instruction,
          ),
          english_required: derivedEnglishRequired(application, acceptedTests),
          accepted_tests: acceptedTests,
          waiver_policy: textValue(application?.english_waiver_policy),
          notes: displayStructuredValue(application?.english_language_tests),
        },
        audition_requirements: {
          prescreening_required: requirementBoolean(
            audition?.prescreening_required ?? audition?.Prescreening_required,
          ),
          audition_required: requirementBoolean(audition?.audition_required),
          repertoire_requirements: textValue(audition?.repertoire_summary),
          format: textValue(audition?.audition_format),
          notes: textValue(audition?.notes),
        },
        cost_aid: mapCostAid(applicationFeeValue, applicationFeeCurrency),
        sources,
        data_quality: {
          confidence: weakestConfidence(linkedSourceRecords),
          status,
          missing_fields: [],
          review_notes:
            reviewNotes.length > 0 ? reviewNotes.join(" ") : null,
        },
        review_records: {
          offering: {
            id: programId,
            review_status: textValue(offering.review_status),
            values: {
              official_program_name: programName,
              program_name_zh: textValue(offering.program_name_zh),
              track_or_concentration: textValue(
                offering.track_or_concentration,
              ),
              department: textValue(offering.department),
              card_summary_zh: textValue(offering.card_summary_zh),
              degree_level_id: relationId(offering.degree_level_id),
              duration_years: textValue(offering.duration_years),
              language_of_instruction: editorValue(
                offering.language_of_instruction,
              ),
              program_url: textValue(offering.program_url),
              faculty_list: textValue(offering.faculty_list),
              last_checked: dateValue(offering.last_checked),
              application_url: textValue(offering.application_url),
              audition_url: textValue(offering.audition_url),
              international_url: textValue(offering.international_url),
            },
          },
          application: application
            ? {
                id: String(application.id),
                review_status: textValue(application.review_status),
                values: {
                  application_deadline: dateValue(
                    application.application_deadline,
                  ),
                  deadline_notes: textValue(application.deadline_notes),
                  toefl_minimum: textValue(application.toefl_minimum),
                  ielts_minimum: textValue(application.ielts_minimum),
                  duolingo_minimum: textValue(application.duolingo_minimum),
                  english_waiver_policy: textValue(
                    application.english_waiver_policy,
                  ),
                  english_language_tests: editorValue(
                    application.english_language_tests,
                  ),
                  resume_required: textValue(application.resume_required),
                  essay_required: textValue(application.essay_required),
                  recommendation_letters: textValue(
                    application.recommendation_letters,
                  ),
                  transcript_requirements: textValue(
                    application.transcript_requirements,
                  ),
                  portfolio_required: textValue(
                    application.portfolio_required,
                  ),
                  required_materials: editorValue(
                    application.required_materials,
                  ),
                  international_applicant_notes: textValue(
                    application.international_applicant_notes,
                  ),
                  conditional_notes: textValue(application.conditional_notes),
                  notes: textValue(application.notes),
                  application_fee: textValue(applicationFeeValue),
                  application_fee_currency:
                    textValue(applicationFeeCurrency),
                  tuition_annual: textValue(application.tuition_annual),
                  tuition_currency: textValue(application.tuition_currency),
                  scholarships_available: textValue(
                    application.scholarships_available,
                  ),
                  scholarship_note: textValue(application.scholarship_note),
                },
              }
            : null,
          audition: audition
            ? {
                id: String(audition.id),
                review_status: textValue(audition.review_status),
                values: {
                  prescreening_required: textValue(
                    audition.prescreening_required ?? audition.Prescreening_required,
                  ),
                  prescreening_deadline: dateValue(
                    audition.prescreening_deadline,
                  ),
                  audition_required: textValue(audition.audition_required),
                  audition_format: textValue(audition.audition_format),
                  repertoire_summary: textValue(audition.repertoire_summary),
                  // Only expose the split repertoire fields for editing when
                  // the Directus schema actually has them, so saves cannot
                  // target nonexistent columns.
                  ...("prescreen_repertoire" in audition
                    ? {
                        prescreen_repertoire: textValue(
                          audition.prescreen_repertoire,
                        ),
                      }
                    : {}),
                  ...("audition_repertoire" in audition
                    ? {
                        audition_repertoire: textValue(
                          audition.audition_repertoire,
                        ),
                      }
                    : {}),
                  video_requirements: textValue(audition.video_requirements),
                  file_format_requirements: textValue(
                    audition.file_format_requirements,
                  ),
                  accompaniment_requirements: textValue(
                    audition.accompaniment_requirements,
                  ),
                  interview_or_callback_requirements: textValue(
                    audition.interview_or_callback_requirements,
                  ),
                  special_notes: textValue(audition.special_notes),
                  conditional_notes: textValue(audition.conditional_notes),
                  notes: textValue(audition.notes),
                },
              }
            : null,
          degree_level_options: degreeLevelOptions,
        },
      },
    ];
  });

  const schools = directusSchools.flatMap<School>((school) => {
    const slug = textValue(school.slug);
    if (!slug) return [];
    const schoolPrograms = programs.filter(
      (program) => program.school_id === slug,
    );
    const schoolSources = sourceRecords
      .filter(
        (record) =>
          !relationId(record.program_offering_id) &&
          relationId(record.school_id) === String(school.id),
      )
      .map(mapSource)
      .filter((source): source is SourceRecord => source !== null);
    const status =
      schoolPrograms.length > 0
        ? weakestStatus(
            schoolPrograms.map((program) => program.data_quality.status),
          )
        : "extracted_awaiting_review";
    const confidenceStrength: Record<ConfidenceLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
    };
    const confidence =
      schoolPrograms.length > 0
        ? schoolPrograms.slice(1).reduce<ConfidenceLevel>((weakest, program) => {
            return confidenceStrength[program.data_quality.confidence] <
              confidenceStrength[weakest]
              ? program.data_quality.confidence
              : weakest;
          }, schoolPrograms[0].data_quality.confidence)
        : "medium";

    return [
      {
        id: slug,
        name: textValue(school.school_name) ?? "暂未收录",
        country: textValue(school.country) ?? "待核实",
        city: textValue(school.city) ?? "待核实",
        website_url: textValue(school.official_website),
        intro_zh: textValue(school.intro_zh),
        detail_sections: mapSchoolDetailSections(school.school_detail_sections),
        sources: schoolSources,
        status,
        data_quality: {
          confidence,
          status,
          missing_fields: [],
          review_notes: null,
        },
        review_record: {
          id: String(school.id),
          review_status: textValue(school.review_status),
          values: {
            school_name: textValue(school.school_name),
            country: textValue(school.country),
            city: textValue(school.city),
            official_website: textValue(school.official_website),
          },
        },
      },
    ];
  });

  return { schools, programs };
});

export async function getAllSchools(): Promise<School[]> {
  const { schools } = await loadDirectusData();
  return schools;
}

export async function getAllPrograms(): Promise<Program[]> {
  const { programs } = await loadDirectusData();
  return programs;
}

export async function getSchoolById(
  schoolId: string,
): Promise<School | undefined> {
  const { schools } = await loadDirectusData();
  const school = schools.find((candidate) => candidate.id === schoolId);
  if (!school) return undefined;
  return {
    ...school,
    sources: await attachSourceQuotes(school.sources ?? []),
  };
}

export async function getProgramsBySchoolId(
  schoolId: string,
): Promise<Program[]> {
  const { programs } = await loadDirectusData();
  return programs.filter((program) => program.school_id === schoolId);
}

export async function getProgramById(
  schoolId: string,
  programId: string,
): Promise<Program | undefined> {
  const { programs } = await loadDirectusData();
  const program = programs.find(
    (candidate) =>
      candidate.school_id === schoolId && candidate.id === programId,
  );
  if (!program) return undefined;
  return {
    ...program,
    sources: await attachSourceQuotes(program.sources),
  };
}

export async function searchPrograms(
  query: ProgramSearchQuery,
): Promise<Program[]> {
  const { programs } = await loadDirectusData();
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const country = query.country?.trim().toLowerCase() ?? "";
  const majorArea = query.major_area?.trim().toLowerCase() ?? "";
  const degreeSlug = query.degree_slug?.trim().toLowerCase() ?? "";

  return programs.filter((program) => {
    const keywordTarget = [
      program.name,
      program.name_zh,
      program.school_name,
      program.country,
      program.city,
      program.degree_level,
      program.degree?.name,
      program.degree?.name_zh,
      program.degree?.abbreviation,
      program.major_area,
      program.major_area_zh,
      program.specialization,
      program.department,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesKeyword = keyword === "" || keywordTarget.includes(keyword);
    const matchesCountry =
      country === "" || program.country.toLowerCase() === country;
    const matchesDegree =
      !query.degree_level || program.degree_level === query.degree_level;
    const matchesDegreeSlug =
      degreeSlug === "" ||
      (program.degree?.slug ?? "").toLowerCase() === degreeSlug;
    const matchesMajorArea =
      majorArea === "" ||
      program.major_area.toLowerCase() === majorArea ||
      (program.major_area_zh ?? "").toLowerCase() === majorArea;

    return (
      matchesKeyword &&
      matchesCountry &&
      matchesDegree &&
      matchesDegreeSlug &&
      matchesMajorArea
    );
  });
}
