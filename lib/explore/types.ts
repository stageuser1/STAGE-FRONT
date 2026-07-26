/**
 * Slim program shape for the Explore catalog.
 *
 * The full `Program` carries reviewer records, source lists and raw Directus
 * blobs that the catalog never renders. Shipping it to a client component
 * would put megabytes of unused data in the RSC payload, so the server maps
 * down to exactly the fields the catalog, facets and cards read.
 *
 * This is the same discipline as `toPublicProgramDto`: an explicit,
 * field-by-field boundary, so growth in the internal shape cannot leak.
 */
import type { Program, WorkflowStatus } from "@/data/types";
import { latestCheckedDate } from "@/lib/format";

export interface ExploreProgram {
  id: string;
  schoolId: string;
  name: string;
  nameZh: string | null;
  schoolName: string;
  country: string;
  city: string;
  degreeSlug: string | null;
  degreeName: string | null;
  degreeNameZh: string | null;
  degreeAbbr: string | null;
  majorArea: string | null;
  majorAreaZh: string | null;
  specialization: string | null;
  applicationDeadline: string | null;
  prescreeningDeadline: string | null;
  /** Raw requirement text — parsed at read time, shown verbatim when odd. */
  ieltsMinimum: string | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
  status: WorkflowStatus;
  lastCheckedAt: string | null;
}

export interface ExploreSchool {
  id: string;
  name: string;
  country: string;
  city: string;
  status: WorkflowStatus;
  programCount: number;
  /** Distinct major areas across this school's programs. */
  majorCount: number;
  tuitionMin: number | null;
  tuitionMax: number | null;
  tuitionCurrency: string | null;
  /** Nearest future application/prescreening deadline, ISO. */
  nearestDeadline: string | null;
  lastCheckedAt: string | null;
}

/**
 * Rolls a school's programs into the card metrics.
 *
 * Computed on the server so the client payload carries four numbers per school
 * instead of every program it owns.
 */
export function toExploreSchool(
  school: { id: string; name: string; country: string; city: string; status: WorkflowStatus },
  programs: ExploreProgram[],
  lastCheckedAt: string | null,
): ExploreSchool {
  const tuitions = programs
    .map((program) => program.tuitionAmount)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const deadlines = programs
    .flatMap((program) => [
      program.applicationDeadline,
      program.prescreeningDeadline,
    ])
    .filter((value): value is string => Boolean(value))
    .sort();
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: school.id,
    name: school.name,
    country: school.country,
    city: school.city,
    status: school.status,
    programCount: programs.length,
    majorCount: new Set(
      programs.map((program) => program.majorArea).filter(Boolean),
    ).size,
    tuitionMin: tuitions[0] ?? null,
    tuitionMax: tuitions.at(-1) ?? null,
    tuitionCurrency:
      programs.find((program) => program.tuitionAmount !== null)
        ?.tuitionCurrency ?? null,
    // A past deadline is history, not the next thing to do.
    nearestDeadline:
      deadlines.find((date) => date >= today) ?? deadlines.at(-1) ?? null,
    lastCheckedAt,
  };
}

function tuitionOf(program: Program): {
  amount: number | null;
  currency: string | null;
} {
  const values = program.review_records?.application?.values;
  const raw = values?.tuition_annual;
  const amount =
    raw === null || raw === undefined || raw === ""
      ? program.cost_aid.tuition_amount
      : Number(raw);
  const currency =
    (typeof values?.tuition_currency === "string" && values.tuition_currency) ||
    program.cost_aid.currency ||
    null;
  return {
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    currency,
  };
}

export function toExploreProgram(program: Program): ExploreProgram {
  const tuition = tuitionOf(program);
  const ielts = program.language_requirements.accepted_tests.find(
    (test) => test.test_name === "IELTS",
  );

  return {
    id: program.id,
    schoolId: program.school_id,
    name: program.name,
    nameZh: program.name_zh ?? null,
    schoolName: program.school_name,
    country: program.country,
    city: program.city,
    degreeSlug: program.degree?.slug ?? null,
    degreeName: program.degree?.name ?? null,
    degreeNameZh: program.degree?.name_zh ?? null,
    degreeAbbr: program.degree?.abbreviation ?? null,
    majorArea: program.major_area || null,
    majorAreaZh: program.major_area_zh ?? null,
    specialization: program.specialization ?? null,
    applicationDeadline: program.deadline.application_deadline,
    prescreeningDeadline: program.deadline.prescreening_deadline,
    ieltsMinimum: ielts?.minimum_score ?? null,
    tuitionAmount: tuition.amount,
    tuitionCurrency: tuition.currency,
    status: program.data_quality.status,
    lastCheckedAt: latestCheckedDate(program),
  };
}
