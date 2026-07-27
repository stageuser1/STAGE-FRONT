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
  PublicProgramDto,
  PublicSchoolDto,
  PublicSourceCitationDto,
  School,
  SchoolDetailSection,
  SchoolDetailSectionKey,
  SourceRecord,
  SourceSummary,
  SourceType,
  WorkflowStatus,
} from "@/data/types";
import type {
  DirectusApplicationRequirement,
  DirectusAuditionRequirement,
  DirectusCycleRecord,
  DirectusDegreeLevel,
  DirectusField,
  DirectusProgramOffering,
  DirectusSchool,
  DirectusSourceRecord,
  SourceStatsRow,
} from "@/lib/directus/collections";
import {
  readCatalogApplications,
  readCatalogAuditions,
  readCatalogOfferings,
  readCatalogSchools,
  readDegreeLevels,
  readOfferingById,
  readProgramApplications,
  readProgramAuditions,
  readProgramConfidenceStats,
  readProgramSources,
  readProgramSourceStats,
  readSchoolBySlug,
  readSchoolConfidenceStats,
  readSchoolSources,
  readSchoolSourceStats,
  readSourceEvidence,
} from "@/lib/directus/collections";

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

/**
 * Groups cycle rows by their program once. Selecting a program's cycle is
 * then a map lookup rather than a filter over the whole collection, which
 * mattered at 1,938 programs × 4,000 requirement rows per render.
 */
function indexByProgram<T extends DirectusCycleRecord>(
  records: T[],
): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const record of records) {
    const programId = relationId(record.program_offering_id);
    if (!programId) continue;
    const bucket = index.get(programId);
    if (bucket) bucket.push(record);
    else index.set(programId, [record]);
  }
  return index;
}

/**
 * Current admission cycle for one program: the `is_current` rows when any
 * exist, otherwise every row, newest `admission_cycle` first. Group order is
 * collection order, so the tie-break is unchanged.
 */
function selectCurrentCycle<T extends DirectusCycleRecord>(
  records: T[] | undefined,
): T | null {
  if (!records || records.length === 0) return null;
  const current = records.filter(
    (record) => booleanValue(record.is_current) === true,
  );
  const candidates = current.length > 0 ? current : records;

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

function toPublicSourceCitationDto(
  source: SourceRecord,
): PublicSourceCitationDto {
  return {
    source_title: source.title,
    source_url: source.url,
    source_type: source.source_type,
    accessed_at: source.accessed_at,
  };
}

/**
 * Explicit server-side boundary for the school profile client component.
 * Reviewer records and backend-only source metadata are intentionally not
 * copied into the returned object.
 */
export function toPublicSchoolDto(school: School): PublicSchoolDto {
  return {
    id: school.id,
    name: school.name,
    country: school.country,
    city: school.city,
    website_url: school.website_url,
    status: school.status,
    sources: school.sources?.map(toPublicSourceCitationDto),
  };
}

/**
 * Explicit server-side boundary for the program detail client component.
 * Keep this mapping field-by-field so additions to the internal Program shape
 * cannot cross the public boundary without an intentional mapping change.
 */
export function toPublicProgramDto(program: Program): PublicProgramDto {
  const offeringValues = program.review_records?.offering.values;
  const applicationValues = program.review_records?.application?.values;
  const auditionValues = program.review_records?.audition?.values;
  const degreeLabel =
    program.review_records?.degree_level_options.find(
      (option) => option.value === offeringValues?.degree_level_id,
    )?.label ?? null;
  const publicText = (
    value: string | number | boolean | null | undefined,
  ): string | null => (value === null || value === undefined ? null : String(value));

  return {
    id: program.id,
    school_name: program.school_name,
    country: program.country,
    city: program.city,
    name: program.name,
    name_zh: program.name_zh,
    degree: program.degree
      ? {
          slug: program.degree.slug,
          name: program.degree.name,
          name_zh: program.degree.name_zh,
          abbreviation: program.degree.abbreviation,
          category: program.degree.category,
        }
      : undefined,
    major_area: program.major_area,
    major_area_zh: program.major_area_zh,
    specialization: program.specialization,
    department: program.department,
    card_summary: program.card_summary,
    application:
      program.application === undefined
        ? undefined
        : program.application === null
          ? null
          : {
              resume_required: program.application.resume_required,
              essay_required: program.application.essay_required,
              recommendation_letters:
                program.application.recommendation_letters,
              transcript_requirements:
                program.application.transcript_requirements,
              portfolio_required: program.application.portfolio_required,
              required_materials: [...program.application.required_materials],
              international_applicant_notes:
                program.application.international_applicant_notes,
              conditional_notes: program.application.conditional_notes,
              notes: program.application.notes,
              admission_cycle: program.application.admission_cycle,
            },
    prescreen:
      program.prescreen === undefined
        ? undefined
        : program.prescreen === null
          ? null
          : {
              required: program.prescreen.required,
              required_text: program.prescreen.required_text,
              deadline: program.prescreen.deadline,
              video_requirements: program.prescreen.video_requirements,
              file_format_requirements:
                program.prescreen.file_format_requirements,
              repertoire: program.prescreen.repertoire,
            },
    audition:
      program.audition === undefined
        ? undefined
        : program.audition === null
          ? null
          : {
              required: program.audition.required,
              required_text: program.audition.required_text,
              format: program.audition.format,
              accompaniment_requirements:
                program.audition.accompaniment_requirements,
              interview_or_callback_requirements:
                program.audition.interview_or_callback_requirements,
              repertoire: program.audition.repertoire,
              special_notes: program.audition.special_notes,
              conditional_notes: program.audition.conditional_notes,
              notes: program.audition.notes,
              legacy_repertoire_summary:
                program.audition.legacy_repertoire_summary,
            },
    duration: program.duration,
    program_url: program.program_url,
    application_url: program.application_url,
    audition_url: program.audition_url,
    international_url: program.international_url,
    deadline: {
      application_deadline: program.deadline.application_deadline,
      prescreening_deadline: program.deadline.prescreening_deadline,
      audition_date: program.deadline.audition_date,
      notes: program.deadline.notes,
    },
    language_requirements: {
      instruction_language: program.language_requirements.instruction_language,
      english_required: program.language_requirements.english_required,
      accepted_tests: program.language_requirements.accepted_tests.map(
        (test) => ({
          test_name: test.test_name,
          minimum_score: test.minimum_score,
          section_minimums: test.section_minimums,
          notes: test.notes,
        }),
      ),
      waiver_policy: program.language_requirements.waiver_policy,
      notes: program.language_requirements.notes,
    },
    audition_requirements: {
      prescreening_required:
        program.audition_requirements.prescreening_required,
      audition_required: program.audition_requirements.audition_required,
      repertoire_requirements:
        program.audition_requirements.repertoire_requirements,
      format: program.audition_requirements.format,
      notes: program.audition_requirements.notes,
    },
    cost_aid: {
      currency: program.cost_aid.currency,
      tuition_amount: program.cost_aid.tuition_amount,
      tuition_period: program.cost_aid.tuition_period,
      application_fee: program.cost_aid.application_fee,
      scholarships_available: program.cost_aid.scholarships_available,
      notes: program.cost_aid.notes,
    },
    sources: program.sources.map(toPublicSourceCitationDto),
    data_quality: {
      status: program.data_quality.status,
    },
    display: {
      offering: {
        official_program_name: publicText(
          offeringValues?.official_program_name ?? program.name,
        ),
        program_name_zh: publicText(
          offeringValues?.program_name_zh ?? program.name_zh,
        ),
        track_or_concentration: publicText(
          offeringValues?.track_or_concentration ?? program.specialization,
        ),
        duration_years: publicText(
          offeringValues?.duration_years ?? program.duration,
        ),
        language_of_instruction: publicText(
          offeringValues?.language_of_instruction ??
            program.language_requirements.instruction_language,
        ),
        program_url: publicText(
          offeringValues?.program_url ?? program.program_url,
        ),
        application_url: publicText(
          offeringValues?.application_url ?? program.application_url,
        ),
        audition_url: publicText(
          offeringValues?.audition_url ?? program.audition_url,
        ),
        international_url: publicText(
          offeringValues?.international_url ?? program.international_url,
        ),
        degree_label: degreeLabel,
      },
      application: applicationValues
        ? {
            application_deadline: publicText(
              applicationValues.application_deadline,
            ),
            deadline_notes: publicText(applicationValues.deadline_notes),
            toefl_minimum: publicText(applicationValues.toefl_minimum),
            ielts_minimum: publicText(applicationValues.ielts_minimum),
            duolingo_minimum: publicText(applicationValues.duolingo_minimum),
            english_waiver_policy: publicText(
              applicationValues.english_waiver_policy,
            ),
            english_language_tests: publicText(
              applicationValues.english_language_tests,
            ),
            resume_required: publicText(applicationValues.resume_required),
            essay_required: publicText(applicationValues.essay_required),
            recommendation_letters: publicText(
              applicationValues.recommendation_letters,
            ),
            transcript_requirements: publicText(
              applicationValues.transcript_requirements,
            ),
            portfolio_required: publicText(
              applicationValues.portfolio_required,
            ),
            required_materials: publicText(
              applicationValues.required_materials,
            ),
            international_applicant_notes: publicText(
              applicationValues.international_applicant_notes,
            ),
            conditional_notes: publicText(applicationValues.conditional_notes),
            notes: publicText(applicationValues.notes),
            application_fee: publicText(applicationValues.application_fee),
            application_fee_currency: publicText(
              applicationValues.application_fee_currency,
            ),
            tuition_annual: publicText(applicationValues.tuition_annual),
            tuition_currency: publicText(applicationValues.tuition_currency),
            scholarships_available: publicText(
              applicationValues.scholarships_available,
            ),
            scholarship_note: publicText(applicationValues.scholarship_note),
          }
        : null,
      audition: auditionValues
        ? {
            prescreening_required: publicText(
              auditionValues.prescreening_required,
            ),
            prescreening_deadline: publicText(
              auditionValues.prescreening_deadline,
            ),
            audition_required: publicText(auditionValues.audition_required),
            audition_format: publicText(auditionValues.audition_format),
            repertoire_summary: publicText(auditionValues.repertoire_summary),
            ...("prescreen_repertoire" in auditionValues
              ? {
                  prescreen_repertoire: publicText(
                    auditionValues.prescreen_repertoire,
                  ),
                }
              : {}),
            ...("audition_repertoire" in auditionValues
              ? {
                  audition_repertoire: publicText(
                    auditionValues.audition_repertoire,
                  ),
                }
              : {}),
            video_requirements: publicText(auditionValues.video_requirements),
            file_format_requirements: publicText(
              auditionValues.file_format_requirements,
            ),
            accompaniment_requirements: publicText(
              auditionValues.accompaniment_requirements,
            ),
            interview_or_callback_requirements: publicText(
              auditionValues.interview_or_callback_requirements,
            ),
            special_notes: publicText(auditionValues.special_notes),
            conditional_notes: publicText(auditionValues.conditional_notes),
            notes: publicText(auditionValues.notes),
          }
        : null,
    },
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
 * Detail-page enhancement: load the evidence bodies for a small set of
 * already-mapped source records — the quote every citation renders, and the
 * `evidence_metadata` the school page reads `topic_key` from.
 *
 * This is the boundary that keeps 17,663 source bodies off every other
 * surface: evidence is fetched only here, only for records the page is about
 * to display, and only by id. Quotes are supplementary content, so a failed
 * fetch degrades to citations without blockquotes rather than failing the
 * page — but the degradation is logged rather than swallowed.
 */
async function attachSourceEvidence(
  sources: SourceRecord[],
  options: { withMetadata: boolean },
): Promise<SourceRecord[]> {
  const ids = sources
    .map((source) => source.record_id)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return sources;

  const evidence = await readSourceEvidence(ids, options);
  if (evidence.size === 0) return sources;

  return sources.map((source) => {
    const row = source.record_id ? evidence.get(source.record_id) : undefined;
    if (!row) return source;
    return {
      ...source,
      notes: textValue(row.source_quote) ?? source.notes,
      topic_key: options.withMetadata
        ? sourceTopicKey(row) ?? source.topic_key
        : source.topic_key,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Source summaries
 *
 * List surfaces need two facts about a record's citations — how recently it
 * was verified, and how many/how confident they are — and never the citation
 * bodies. Reading those facts as Directus aggregates instead of downloading
 * the corpus is the single largest delivery change in this phase: the shared
 * loader's source read was 15MB / 90s; the aggregates that replace it are
 * ~0.3MB / ~1s and produce identical values (verified group by group against
 * the in-memory join they replace).
 * ------------------------------------------------------------------ */

const confidenceStrength: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function weakerConfidence(
  left: ConfidenceLevel,
  right: ConfidenceLevel,
): ConfidenceLevel {
  return confidenceStrength[left] <= confidenceStrength[right] ? left : right;
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return right > left ? right : left;
}

interface SummaryAccumulator {
  last: string | null;
  count: number;
  confidence: ConfidenceLevel | null;
}

/**
 * Folds the date/count aggregate and the confidence aggregate into one
 * summary per group. They are separate reads because they answer questions
 * with different scopes: dates and counts describe records that survive
 * mapping, while `weakestConfidence` has always been computed over every
 * linked record, dropped ones included.
 */
function buildSourceSummaries(
  stats: SourceStatsRow[],
  confidence: SourceStatsRow[],
  key: "program_offering_id" | "school_id",
): Map<string, SourceSummary> {
  const accumulators = new Map<string, SummaryAccumulator>();
  const ensure = (id: string): SummaryAccumulator => {
    const existing = accumulators.get(id);
    if (existing) return existing;
    const created: SummaryAccumulator = {
      last: null,
      count: 0,
      confidence: null,
    };
    accumulators.set(id, created);
    return created;
  };

  for (const row of stats) {
    const id = relationId(row[key]);
    if (!id) continue;
    const accumulator = ensure(id);
    accumulator.last = laterDate(
      accumulator.last,
      dateValue(row.max?.retrieved_date),
    );
    accumulator.count += numberValue(row.count?.id) ?? 0;
  }

  for (const row of confidence) {
    const id = relationId(row[key]);
    if (!id) continue;
    const accumulator = ensure(id);
    const level = mapConfidence(row.confidence_level);
    accumulator.confidence =
      accumulator.confidence === null
        ? level
        : weakerConfidence(accumulator.confidence, level);
  }

  return new Map(
    [...accumulators].map(([id, accumulator]) => [
      id,
      {
        last_retrieved_at: accumulator.last,
        count: accumulator.count,
        confidence: accumulator.confidence ?? "medium",
      },
    ]),
  );
}

/**
 * A program's citations have always been its own records plus its school's
 * school-level records, so its summary is the merge of both groups.
 */
function mergeSourceSummaries(
  ...parts: Array<SourceSummary | undefined>
): SourceSummary {
  let last: string | null = null;
  let count = 0;
  let confidence: ConfidenceLevel | null = null;
  for (const part of parts) {
    if (!part) continue;
    last = laterDate(last, part.last_retrieved_at);
    count += part.count;
    confidence =
      confidence === null
        ? part.confidence
        : weakerConfidence(confidence, part.confidence);
  }
  return { last_retrieved_at: last, count, confidence: confidence ?? "medium" };
}

/** Same three facts, derived from records a detail route already holds. */
function summariseSourceRows(rows: DirectusSourceRecord[]): SourceSummary {
  const mapped = rows
    .map(mapSource)
    .filter((source): source is SourceRecord => source !== null);
  return {
    last_retrieved_at: mapped.reduce<string | null>(
      (latest, source) => laterDate(latest, source.accessed_at),
      null,
    ),
    count: mapped.length,
    confidence: weakestConfidence(rows),
  };
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

interface CatalogInput {
  offerings: DirectusProgramOffering[];
  applications: DirectusApplicationRequirement[];
  auditions: DirectusAuditionRequirement[];
  schoolsById: Map<string, DirectusSchool>;
  programSummaries: Map<string, SourceSummary>;
  schoolSummaries: Map<string, SourceSummary>;
}

/**
 * Catalog fidelity: the fields the school catalog, the school page's program
 * index, the fit strip and the profile filter options read.
 *
 * Detail prose, URLs, requirement sections and the reviewer editing surface
 * are deliberately absent — they belong to the program page, which loads one
 * program at full fidelity. `review_records` carries only the two columns
 * list surfaces derive from (`last_checked` for the verification date,
 * tuition for the school card range); the program page rebuilds it in full.
 */
function buildCatalogPrograms(input: CatalogInput): Program[] {
  const applicationsByProgram = indexByProgram(input.applications);
  const auditionsByProgram = indexByProgram(input.auditions);

  return input.offerings.flatMap<Program>((offering) => {
    const programId = String(offering.id);
    const expandedSchool = relationObject<DirectusSchool>(offering.school_id);
    const schoolDirectusId = relationId(offering.school_id);
    const school =
      expandedSchool ??
      (schoolDirectusId
        ? input.schoolsById.get(schoolDirectusId) ?? null
        : null);
    const schoolSlug = textValue(school?.slug);
    const programName = textValue(offering.official_program_name);
    if (!school || !schoolSlug || !programName) return [];

    const application = selectCurrentCycle(applicationsByProgram.get(programId));
    const audition = selectCurrentCycle(auditionsByProgram.get(programId));
    const field = relationObject<DirectusField>(offering.field_id);
    const degreeLevel = mapDegreeLevel(offering, programName);
    const degree = mapDegreeInfo(offering, programName);
    const acceptedTests = mapLanguageTests(application);
    const statuses = [mapReviewStatus(offering.review_status)];
    if (application) statuses.push(mapReviewStatus(application.review_status));
    if (audition) statuses.push(mapReviewStatus(audition.review_status));
    const sourceSummary = mergeSourceSummaries(
      input.programSummaries.get(programId),
      schoolDirectusId
        ? input.schoolSummaries.get(schoolDirectusId)
        : undefined,
    );

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
        application: null,
        prescreen: null,
        audition: null,
        duration: null,
        application_url: null,
        deadline: {
          application_deadline: dateValue(application?.application_deadline),
          prescreening_deadline: dateValue(audition?.prescreening_deadline),
          audition_date: null,
          notes: null,
        },
        language_requirements: {
          instruction_language: null,
          english_required: derivedEnglishRequired(application, acceptedTests),
          accepted_tests: acceptedTests,
          waiver_policy: textValue(application?.english_waiver_policy),
          notes: displayStructuredValue(application?.english_language_tests),
        },
        audition_requirements: {
          prescreening_required: null,
          audition_required: null,
          repertoire_requirements: null,
          format: null,
          notes: null,
        },
        cost_aid: mapCostAid(
          application?.application_fee,
          application?.application_fee_currency,
        ),
        sources: [],
        source_summary: sourceSummary,
        data_quality: {
          confidence: sourceSummary.confidence,
          status: weakestStatus(statuses),
          missing_fields: [],
          review_notes: degreeLevel.reviewNote,
        },
        review_records: {
          offering: {
            id: programId,
            review_status: textValue(offering.review_status),
            values: { last_checked: dateValue(offering.last_checked) },
          },
          application: application
            ? {
                id: String(application.id),
                review_status: textValue(application.review_status),
                values: {
                  tuition_annual: textValue(application.tuition_annual),
                  tuition_currency: textValue(application.tuition_currency),
                },
              }
            : null,
          audition: null,
          degree_level_options: [],
        },
      },
    ];
  });
}

function buildSchool(
  row: DirectusSchool,
  programs: Program[],
  citations: { sources?: SourceRecord[]; summary?: SourceSummary },
): School | null {
  const slug = textValue(row.slug);
  if (!slug) return null;

  const status =
    programs.length > 0
      ? weakestStatus(programs.map((program) => program.data_quality.status))
      : "extracted_awaiting_review";
  const confidence =
    programs.length > 0
      ? programs
          .slice(1)
          .reduce<ConfidenceLevel>(
            (weakest, program) =>
              weakerConfidence(weakest, program.data_quality.confidence),
            programs[0].data_quality.confidence,
          )
      : "medium";

  return {
    id: slug,
    name: textValue(row.school_name) ?? "暂未收录",
    country: textValue(row.country) ?? "待核实",
    city: textValue(row.city) ?? "待核实",
    website_url: textValue(row.official_website),
    intro_zh: textValue(row.intro_zh),
    detail_sections: mapSchoolDetailSections(row.school_detail_sections),
    sources: citations.sources ?? [],
    source_summary: citations.summary,
    status,
    data_quality: {
      confidence,
      status,
      missing_fields: [],
      review_notes: null,
    },
    review_record: {
      id: String(row.id),
      review_status: textValue(row.review_status),
      values: {
        school_name: textValue(row.school_name),
        country: textValue(row.country),
        city: textValue(row.city),
        official_website: textValue(row.official_website),
      },
    },
  };
}

/* ------------------------------------------------------------------ *
 * Route-specific loaders
 * ------------------------------------------------------------------ */

/**
 * Catalog loader: every school and every program at list fidelity.
 *
 * Six bounded reads (four paged collections, two source aggregates) replace
 * the five `limit=-1` reads the pre-R1 shared loader issued. No source-record
 * body is fetched on this path at all.
 */
const loadCatalogData = cache(async (): Promise<DirectusData> => {
  const [
    schoolRows,
    offerings,
    applications,
    auditions,
    programStats,
    programConfidence,
    schoolStats,
    schoolConfidence,
  ] = await Promise.all([
    readCatalogSchools(),
    readCatalogOfferings(),
    readCatalogApplications(),
    readCatalogAuditions(),
    readProgramSourceStats(),
    readProgramConfidenceStats(),
    readSchoolSourceStats(),
    readSchoolConfidenceStats(),
  ]);

  const schoolsById = new Map(
    schoolRows.map((school) => [String(school.id), school]),
  );
  const schoolSummaries = buildSourceSummaries(
    schoolStats,
    schoolConfidence,
    "school_id",
  );
  const programs = buildCatalogPrograms({
    offerings,
    applications,
    auditions,
    schoolsById,
    programSummaries: buildSourceSummaries(
      programStats,
      programConfidence,
      "program_offering_id",
    ),
    schoolSummaries,
  });

  const programsBySchool = new Map<string, Program[]>();
  for (const program of programs) {
    const bucket = programsBySchool.get(program.school_id);
    if (bucket) bucket.push(program);
    else programsBySchool.set(program.school_id, [program]);
  }

  const schools = schoolRows.flatMap<School>((row) => {
    const slug = textValue(row.slug);
    if (!slug) return [];
    const school = buildSchool(row, programsBySchool.get(slug) ?? [], {
      summary: schoolSummaries.get(String(row.id)),
    });
    return school ? [school] : [];
  });

  return { schools, programs };
});

/**
 * School page loader: one school, its programs at catalog fidelity, and its
 * school-level citations with their evidence.
 *
 * Program citations are summarised rather than fetched — the page counts them
 * and dates them but renders only the school-level ones.
 */
const loadSchoolPageData = cache(
  async (
    slug: string,
  ): Promise<{ school: School; programs: Program[] } | null> => {
    const schoolRow = await readSchoolBySlug(slug);
    if (!schoolRow) return null;

    const schoolId = String(schoolRow.id);
    const scopedToSchool = {
      "filter[program_offering_id][school_id][_eq]": schoolId,
    };
    const [
      offerings,
      applications,
      auditions,
      schoolSourceRows,
      programStats,
      programConfidence,
    ] = await Promise.all([
      readCatalogOfferings({ "filter[school_id][_eq]": schoolId }),
      readCatalogApplications(scopedToSchool),
      readCatalogAuditions(scopedToSchool),
      readSchoolSources(schoolId),
      readProgramSourceStats(scopedToSchool),
      readProgramConfidenceStats(scopedToSchool),
    ]);

    const schoolSummary = summariseSourceRows(schoolSourceRows);
    const programs = buildCatalogPrograms({
      offerings,
      applications,
      auditions,
      schoolsById: new Map([[schoolId, schoolRow]]),
      programSummaries: buildSourceSummaries(
        programStats,
        programConfidence,
        "program_offering_id",
      ),
      schoolSummaries: new Map([[schoolId, schoolSummary]]),
    });

    const sources = await attachSourceEvidence(
      schoolSourceRows
        .map(mapSource)
        .filter((source): source is SourceRecord => source !== null),
      { withMetadata: true },
    );
    // The school's own citations are real records here, so `sources` is
    // authoritative and no summary is attached.
    const school = buildSchool(schoolRow, programs, { sources });
    return school ? { school, programs } : null;
  },
);

/**
 * Program page loader: one offering at full fidelity, its cycle records, and
 * every citation it displays — with quotes, because this is the surface that
 * renders them.
 */
const loadProgramDetailData = cache(
  async (programId: string): Promise<Program | null> => {
    const offering = await readOfferingById(programId);
    if (!offering) return null;

    const school = relationObject<DirectusSchool>(offering.school_id);
    const schoolDirectusId = relationId(offering.school_id);
    const schoolSlug = textValue(school?.slug);
    const programName = textValue(offering.official_program_name);
    if (!school || !schoolDirectusId || !schoolSlug || !programName) return null;

    const [applications, auditions, linkedSourceRecords, degreeLevels] =
      await Promise.all([
        readProgramApplications(programId),
        readProgramAuditions(programId),
        readProgramSources(programId, schoolDirectusId),
        readDegreeLevels(),
      ]);

    const application = selectCurrentCycle(applications);
    const audition = selectCurrentCycle(auditions);
    const degreeLevelOptions = degreeLevels
      .flatMap((level) => {
        const id = level.id === undefined ? null : String(level.id);
        const label =
          textValue(level.degree_level_name) ?? textValue(level.slug);
        return id && label ? [{ label, value: id }] : [];
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    const mappedSources = linkedSourceRecords.map(mapSource);
    const sources = await attachSourceEvidence(
      mappedSources.filter((source): source is SourceRecord => source !== null),
      { withMetadata: true },
    );
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

    return {
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
        review_notes: reviewNotes.length > 0 ? reviewNotes.join(" ") : null,
      },
      review_records: {
        offering: {
          id: programId,
          review_status: textValue(offering.review_status),
          values: {
            official_program_name: programName,
            program_name_zh: textValue(offering.program_name_zh),
            track_or_concentration: textValue(offering.track_or_concentration),
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
                portfolio_required: textValue(application.portfolio_required),
                required_materials: editorValue(application.required_materials),
                international_applicant_notes: textValue(
                  application.international_applicant_notes,
                ),
                conditional_notes: textValue(application.conditional_notes),
                notes: textValue(application.notes),
                application_fee: textValue(applicationFeeValue),
                application_fee_currency: textValue(applicationFeeCurrency),
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
                  audition.prescreening_required ??
                    audition.Prescreening_required,
                ),
                prescreening_deadline: dateValue(audition.prescreening_deadline),
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
    };
  },
);

export async function getAllSchools(): Promise<School[]> {
  const { schools } = await loadCatalogData();
  return schools;
}

export async function getAllPrograms(): Promise<Program[]> {
  const { programs } = await loadCatalogData();
  return programs;
}

export async function getSchoolById(
  schoolId: string,
): Promise<School | undefined> {
  const data = await loadSchoolPageData(schoolId);
  return data?.school;
}

export async function getProgramsBySchoolId(
  schoolId: string,
): Promise<Program[]> {
  const data = await loadSchoolPageData(schoolId);
  return data?.programs ?? [];
}

export async function getProgramById(
  schoolId: string,
  programId: string,
): Promise<Program | undefined> {
  const program = await loadProgramDetailData(programId);
  // The school segment is part of the program's identity: a program reached
  // through the wrong school is not found, exactly as before.
  if (!program || program.school_id !== schoolId) return undefined;
  return program;
}

export async function searchPrograms(
  query: ProgramSearchQuery,
): Promise<Program[]> {
  const programs = await getAllPrograms();
  return programs.filter((program) => matchesQuery(program, query));
}

/** Shared filter semantics for both program query entry points. */
function matchesQuery(program: Program, query: ProgramSearchQuery): boolean {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const country = query.country?.trim().toLowerCase() ?? "";
  const majorArea = query.major_area?.trim().toLowerCase() ?? "";
  const degreeSlug = query.degree_slug?.trim().toLowerCase() ?? "";

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
}

/**
 * Narrow Directus boundary for the dynamic search route.
 *
 * Search needs enough data to build its filters, apply the existing query
 * semantics, and render ProgramCard. It reads no schools collection and no
 * source records at all — a search result carries no citations — and its
 * three collection reads are paged rather than unbounded.
 */
export async function loadSearchPagePrograms(
  query: ProgramSearchQuery | null,
): Promise<{ allPrograms: Program[]; matchedPrograms: Program[] }> {
  const [offerings, applicationRequirements, auditionRequirements] =
    await Promise.all([
      readCatalogOfferings(),
      readCatalogApplications(),
      readCatalogAuditions(),
    ]);

  const applicationsByProgram = indexByProgram(applicationRequirements);
  const auditionsByProgram = indexByProgram(auditionRequirements);

  const allPrograms = offerings.flatMap<Program>((offering) => {
    const programId = String(offering.id);
    const school = relationObject<DirectusSchool>(offering.school_id);
    const schoolSlug = textValue(school?.slug);
    const programName = textValue(offering.official_program_name);
    if (!school || !schoolSlug || !programName) return [];

    const application = selectCurrentCycle(applicationsByProgram.get(programId));
    const audition = selectCurrentCycle(auditionsByProgram.get(programId));
    const field = relationObject<DirectusField>(offering.field_id);
    const degreeLevel = mapDegreeLevel(offering, programName);
    const degree = mapDegreeInfo(offering, programName);
    const acceptedTests = mapLanguageTests(application);
    const statuses = [mapReviewStatus(offering.review_status)];
    if (application) statuses.push(mapReviewStatus(application.review_status));
    if (audition) statuses.push(mapReviewStatus(audition.review_status));

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
        application: null,
        prescreen: null,
        audition: null,
        duration: null,
        application_url: null,
        deadline: {
          application_deadline: dateValue(application?.application_deadline),
          prescreening_deadline: dateValue(audition?.prescreening_deadline),
          audition_date: null,
          notes: null,
        },
        language_requirements: {
          instruction_language: null,
          english_required: derivedEnglishRequired(application, acceptedTests),
          accepted_tests: acceptedTests,
          waiver_policy: textValue(application?.english_waiver_policy),
          notes: displayStructuredValue(application?.english_language_tests),
        },
        audition_requirements: {
          prescreening_required: null,
          audition_required: null,
          repertoire_requirements: null,
          format: null,
          notes: null,
        },
        cost_aid: mapCostAid(
          application?.application_fee,
          application?.application_fee_currency,
        ),
        sources: [],
        data_quality: {
          confidence: "medium",
          status: weakestStatus(statuses),
          missing_fields: [],
          review_notes: degreeLevel.reviewNote,
        },
      },
    ];
  });

  if (!query) return { allPrograms, matchedPrograms: [] };

  return {
    allPrograms,
    matchedPrograms: allPrograms.filter((program) =>
      matchesQuery(program, query),
    ),
  };
}
