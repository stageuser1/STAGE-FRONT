import { cache } from "react";
import type {
  ConfidenceLevel,
  CurrencyCode,
  DegreeLevel,
  LanguageTest,
  Program,
  ProgramSearchQuery,
  School,
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
}

interface DirectusField {
  id?: DirectusId;
  slug?: string | null;
  field_name?: string | null;
}

interface DirectusDegreeLevel {
  id?: DirectusId;
  slug?: string | null;
  degree_level_name?: string | null;
}

interface DirectusProgramOffering {
  id: DirectusId;
  school_id?: DirectusId | DirectusSchool | null;
  field_id?: DirectusId | DirectusField | null;
  degree_level_id?: DirectusId | DirectusDegreeLevel | null;
  degree_level_name?: string | null;
  official_program_name?: string | null;
  duration_years?: string | number | null;
  application_url?: string | null;
  application_fee?: string | number | null;
  application_fee_currency?: string | null;
  review_status?: string | null;
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
  english_required?: boolean | string | number | null;
  instruction_language?: string | null;
  application_fee?: string | number | null;
  application_fee_currency?: string | null;
}

interface DirectusAuditionRequirement extends DirectusCycleRecord {
  prescreening_deadline?: string | null;
  prescreening_required?: boolean | string | number | null;
  audition_required?: boolean | string | number | null;
  repertoire_summary?: string | null;
  audition_format?: string | null;
  format?: string | null;
  notes?: string | null;
}

interface DirectusSourceRecord {
  program_offering_id?: DirectusId | { id?: DirectusId } | null;
  school_id?: DirectusId | { id?: DirectusId } | null;
  source_url?: string | null;
  source_title?: string | null;
  source_quote?: string | null;
  retrieved_date?: string | null;
  confidence_level?: string | null;
  source_type?: string | null;
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
    offering.degree_level_name,
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

  const names = englishTestNames(requirement.english_language_tests);
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

function mapAuditionFormat(
  value: unknown,
): Program["audition_requirements"]["format"] {
  const format = textValue(value)?.toLowerCase().replace(/[ -]+/g, "_");
  if (
    format === "in_person" ||
    format === "recorded" ||
    format === "online" ||
    format === "hybrid"
  ) {
    return format;
  }
  return null;
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
    title: textValue(record.source_title) ?? "Official source",
    url,
    source_type: mapSourceType(record),
    accessed_at: accessedAt,
    notes: textValue(record.source_quote),
  };
}

const loadDirectusData = cache(async (): Promise<DirectusData> => {
  const [
    directusSchools,
    offerings,
    applicationRequirements,
    auditionRequirements,
    sourceRecords,
  ] = await Promise.all([
    directusFetch<DirectusSchool[]>(
      "/items/schools?limit=-1&fields=id,slug,school_name,city,country,official_website,review_status",
    ),
    directusFetch<DirectusProgramOffering[]>(
      "/items/program_offerings?limit=-1&fields=*,school_id.id,school_id.slug,school_id.school_name,school_id.city,school_id.country,field_id.id,field_id.slug,field_id.field_name,degree_level_id.id,degree_level_id.slug,degree_level_id.degree_level_name",
    ),
    directusFetch<DirectusApplicationRequirement[]>(
      "/items/application_requirements?limit=-1",
    ),
    directusFetch<DirectusAuditionRequirement[]>(
      "/items/audition_requirements?limit=-1",
    ),
    directusFetch<DirectusSourceRecord[]>(
      "/items/source_records?limit=-1",
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
    const acceptedTests = mapLanguageTests(application);
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
    const applicationFeeValue =
      application?.application_fee ?? offering.application_fee;
    const applicationFeeCurrency =
      application?.application_fee_currency ??
      offering.application_fee_currency;

    return [
      {
        id: programId,
        school_id: schoolSlug,
        school_name: textValue(school.school_name) ?? "暂未收录",
        country: textValue(school.country) ?? "待核实",
        city: textValue(school.city) ?? "待核实",
        name: programName,
        degree_level: degreeLevel.degreeLevel,
        major_area: textValue(field?.field_name) ?? programName,
        duration: textValue(offering.duration_years),
        application_url: textValue(offering.application_url),
        deadline: {
          application_deadline: dateValue(application?.application_deadline),
          prescreening_deadline: dateValue(audition?.prescreening_deadline),
          audition_date: null,
          notes: textValue(application?.deadline_notes),
        },
        language_requirements: {
          instruction_language: textValue(application?.instruction_language),
          english_required:
            booleanValue(application?.english_required) ??
            (acceptedTests.length > 0 ||
            textValue(application?.english_waiver_policy)
              ? true
              : null),
          accepted_tests: acceptedTests,
          waiver_policy: textValue(application?.english_waiver_policy),
          notes: null,
        },
        audition_requirements: {
          prescreening_required: booleanValue(
            audition?.prescreening_required,
          ),
          audition_required: booleanValue(audition?.audition_required),
          repertoire_requirements: textValue(audition?.repertoire_summary),
          format: mapAuditionFormat(
            audition?.audition_format ?? audition?.format,
          ),
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
              degree_level_id: relationId(offering.degree_level_id),
              duration_years: textValue(offering.duration_years),
              application_url: textValue(offering.application_url),
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
                  english_required: booleanValue(
                    application.english_required,
                  ),
                  instruction_language: textValue(
                    application.instruction_language,
                  ),
                  application_fee: textValue(applicationFeeValue),
                  application_fee_currency:
                    textValue(applicationFeeCurrency),
                },
              }
            : null,
          audition: audition
            ? {
                id: String(audition.id),
                review_status: textValue(audition.review_status),
                values: {
                  prescreening_required: booleanValue(
                    audition.prescreening_required,
                  ),
                  prescreening_deadline: dateValue(
                    audition.prescreening_deadline,
                  ),
                  audition_required: booleanValue(audition.audition_required),
                  audition_format: textValue(
                    audition.audition_format ?? audition.format,
                  ),
                  repertoire_summary: textValue(audition.repertoire_summary),
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
  return schools.find((school) => school.id === schoolId);
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
  return programs.find(
    (program) => program.school_id === schoolId && program.id === programId,
  );
}

export async function searchPrograms(
  query: ProgramSearchQuery,
): Promise<Program[]> {
  const { programs } = await loadDirectusData();
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const country = query.country?.trim().toLowerCase() ?? "";
  const majorArea = query.major_area?.trim().toLowerCase() ?? "";

  return programs.filter((program) => {
    const keywordTarget = [
      program.name,
      program.school_name,
      program.country,
      program.city,
      program.degree_level,
      program.major_area,
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword = keyword === "" || keywordTarget.includes(keyword);
    const matchesCountry =
      country === "" || program.country.toLowerCase() === country;
    const matchesDegree =
      !query.degree_level || program.degree_level === query.degree_level;
    const matchesMajorArea =
      majorArea === "" || program.major_area.toLowerCase() === majorArea;

    return (
      matchesKeyword && matchesCountry && matchesDegree && matchesMajorArea
    );
  });
}
