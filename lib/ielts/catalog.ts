/**
 * Catalog access and filtering over the 223-record exam index.
 *
 * At this scale a linear scan is the right implementation — the original
 * project does the same, and any index would cost more than it saves.
 */
import examIndexJson from "./exam-index.json";
import type { ExamCategory, ExamFrequency, ExamSummary } from "./types";

const EXAMS = examIndexJson as ExamSummary[];

export const CATEGORIES: ExamCategory[] = ["P1", "P2", "P3"];

export const FREQUENCY_LABELS: Record<ExamFrequency, string> = {
  high: "高频",
  medium: "次高频",
  low: "低频",
};

/** Whether the learner has already attempted a passage. */
export type ProgressFilter = "all" | "practised" | "fresh";

export interface CatalogFilters {
  search?: string;
  category?: ExamCategory | "all";
  frequency?: ExamFrequency | "all";
  progress?: ProgressFilter;
  /** Exam ids with at least one stored attempt. Only read when `progress` is set. */
  practised?: ReadonlySet<string>;
}

export const DEFAULT_FILTERS: Required<
  Pick<CatalogFilters, "search" | "category" | "frequency" | "progress">
> = {
  search: "",
  category: "all",
  frequency: "all",
  progress: "all",
};

export type SortKey = "default" | "frequency" | "difficulty" | "title";

export const SORT_LABELS: Record<SortKey, string> = {
  default: "默认顺序",
  frequency: "按频次",
  difficulty: "按难度",
  title: "按标题",
};

/** High first — the order a learner preparing for an exam wants. */
const FREQUENCY_RANK: Record<ExamFrequency, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getAllExams(): ExamSummary[] {
  return EXAMS;
}

export function getExamById(id: string): ExamSummary | undefined {
  return EXAMS.find((exam) => exam.id === id);
}

export function filterExams(
  exams: ExamSummary[],
  {
    search = "",
    category = "all",
    frequency = "all",
    progress = "all",
    practised,
  }: CatalogFilters,
): ExamSummary[] {
  const needle = search.trim().toLowerCase();
  return exams.filter((exam) => {
    if (category !== "all" && exam.category !== category) return false;
    if (frequency !== "all" && exam.frequency !== frequency) return false;
    if (progress !== "all") {
      const done = practised?.has(exam.id) ?? false;
      if (progress === "practised" ? !done : done) return false;
    }
    if (needle && !exam.title.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/**
 * Orders a filtered list. Returns a new array; the caller's list is untouched
 * because `getAllExams()` hands out the module-level corpus by reference.
 *
 * `default` is corpus order, which is how the source project lists exams and
 * what the ordinal on each card refers to.
 */
export function sortExams(exams: ExamSummary[], key: SortKey): ExamSummary[] {
  if (key === "default") return exams;
  const sorted = [...exams];

  switch (key) {
    case "frequency":
      // Difficulty breaks ties so the order is stable and not merely bucketed.
      sorted.sort(
        (a, b) =>
          FREQUENCY_RANK[a.frequency] - FREQUENCY_RANK[b.frequency] ||
          difficultyOf(a) - difficultyOf(b),
      );
      break;
    case "difficulty":
      sorted.sort((a, b) => difficultyOf(a) - difficultyOf(b));
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "en"));
      break;
  }
  return sorted;
}

/**
 * 84 of 223 records carry no `difficultyScore`. They sort last rather than
 * first: an unscored passage is unknown, not easy.
 */
function difficultyOf(exam: ExamSummary): number {
  return exam.difficultyScore ?? Number.POSITIVE_INFINITY;
}

/** Counts for the overview cards. */
export function countByCategory(
  exams: ExamSummary[] = EXAMS,
): Record<ExamCategory, number> {
  const counts: Record<ExamCategory, number> = { P1: 0, P2: 0, P3: 0 };
  for (const exam of exams) counts[exam.category] += 1;
  return counts;
}
