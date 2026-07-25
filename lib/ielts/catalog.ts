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

export interface CatalogFilters {
  search?: string;
  category?: ExamCategory | "all";
  frequency?: ExamFrequency | "all";
}

export function getAllExams(): ExamSummary[] {
  return EXAMS;
}

export function getExamById(id: string): ExamSummary | undefined {
  return EXAMS.find((exam) => exam.id === id);
}

export function filterExams(
  exams: ExamSummary[],
  { search = "", category = "all", frequency = "all" }: CatalogFilters,
): ExamSummary[] {
  const needle = search.trim().toLowerCase();
  return exams.filter((exam) => {
    if (category !== "all" && exam.category !== category) return false;
    if (frequency !== "all" && exam.frequency !== frequency) return false;
    if (needle && !exam.title.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/** Counts for the overview cards. */
export function countByCategory(
  exams: ExamSummary[] = EXAMS,
): Record<ExamCategory, number> {
  const counts: Record<ExamCategory, number> = { P1: 0, P2: 0, P3: 0 };
  for (const exam of exams) counts[exam.category] += 1;
  return counts;
}
