/**
 * Derived wrongbook: the remediation queue, computed from practice history.
 *
 * Pure functions over records, like progress.ts and analytics.ts — no storage
 * access, no React, and deliberately no import of question-types.json, so this
 * module stays testable under `node --test --experimental-strip-types`.
 * Question-type labels are resolved by the caller and passed in.
 *
 * The rule, stated here because it is also stated to the learner in the UI:
 * for each exam look only at the MOST RECENT attempt; the exam is in the
 * wrongbook if that attempt has at least one wrong answer. Nothing is stored,
 * so redoing a passage successfully removes it on the next render and there is
 * no "resolved" flag that can drift out of step with the attempt history.
 */
import type {
  AnswerComparison,
  ExamCategory,
  ExamFrequency,
  ExamSummary,
  PracticeRecord,
} from "./types";

export interface WrongQuestion {
  questionId: string;
  /** Real question number when the corpus supplies one; the id otherwise. */
  displayNo?: string;
  questionType?: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
}

export interface WrongbookEntry {
  examId: string;
  title: string;
  category: ExamCategory | "";
  frequency?: ExamFrequency | "";
  /** The attempt this entry is derived from — the target of "回顾". */
  latestRecordId: string;
  latestAttemptAt: string;
  latestAccuracy: number;
  wrongCount: number;
  totalQuestions: number;
  /** How many times this passage has been attempted in total. */
  attempts: number;
  questions: WrongQuestion[];
  /** True when the exam no longer resolves in the catalog. */
  orphaned?: boolean;
}

export type WrongbookSort = "recent" | "most_wrong" | "title";

export interface WrongbookFilters {
  search: string;
  category: ExamCategory | "all";
  frequency: ExamFrequency | "all";
  questionType: string | "all";
  sort: WrongbookSort;
}

export const DEFAULT_WRONGBOOK_FILTERS: WrongbookFilters = {
  search: "",
  category: "all",
  frequency: "all",
  questionType: "all",
  sort: "recent",
};

function timeOf(iso: string | undefined): number {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/**
 * The most recent attempt per exam.
 *
 * Records are stored newest-first, but the timestamps are compared explicitly:
 * an imported history may arrive unsorted, and silently trusting order would
 * make the wrongbook report the wrong attempt (the same defensive choice
 * `buildProgressIndex` makes).
 */
function latestByExam(
  records: readonly PracticeRecord[],
): Map<string, { record: PracticeRecord; attempts: number }> {
  const index = new Map<string, { record: PracticeRecord; attempts: number }>();

  for (const record of records) {
    if (!record?.examId) continue;
    const current = index.get(record.examId);
    if (!current) {
      index.set(record.examId, { record, attempts: 1 });
      continue;
    }
    current.attempts += 1;
    if (timeOf(record.createdAt) > timeOf(current.record.createdAt)) {
      current.record = record;
    }
  }

  return index;
}

function wrongQuestions(record: PracticeRecord): WrongQuestion[] {
  const comparison = record.answerComparison;
  if (!comparison || typeof comparison !== "object") return [];

  const wrong: WrongQuestion[] = [];
  for (const [questionId, entry] of Object.entries(comparison)) {
    if (!entry || typeof entry !== "object") continue;
    const typed = entry as AnswerComparison;
    if (typed.isCorrect) continue;
    wrong.push({
      // The map key is authoritative — the runner has been seen to omit
      // `questionId` from the value while still keying it correctly.
      questionId: typed.questionId ?? questionId,
      questionType: typed.questionType,
      userAnswer: typed.userAnswer,
      correctAnswer: typed.correctAnswer,
    });
  }
  return wrong;
}

/** Natural order for `q1, q2, q10` — string sort would put q10 before q2. */
function compareQuestionIds(left: string, right: string): number {
  const leftNumber = Number(left.replace(/\D+/g, ""));
  const rightNumber = Number(right.replace(/\D+/g, ""));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
  }
  return left.localeCompare(right);
}

export interface BuildWrongbookOptions {
  /** Catalog, used to backfill category/frequency on pre-2.1.0 records. */
  exams?: readonly ExamSummary[];
  filters?: Partial<WrongbookFilters>;
  /** Resolves a question's type when the record predates stored types. */
  resolveQuestionType?: (examId: string, questionId: string) => string | undefined;
}

export function buildWrongbook(
  records: readonly PracticeRecord[],
  { exams, filters, resolveQuestionType }: BuildWrongbookOptions = {},
): WrongbookEntry[] {
  const catalog = new Map(exams?.map((exam) => [exam.id, exam]) ?? []);
  const entries: WrongbookEntry[] = [];

  for (const [examId, { record, attempts }] of latestByExam(records)) {
    const questions = wrongQuestions(record);
    if (questions.length === 0) continue;

    const exam = catalog.get(examId);
    entries.push({
      examId,
      title: record.title || exam?.title || examId,
      // Records written before 2.1.0 carry no frequency and may carry no
      // category; the live corpus fills the gap rather than showing "—".
      category: record.category || exam?.category || "",
      frequency: record.frequency || exam?.frequency || "",
      latestRecordId: record.id,
      latestAttemptAt: record.createdAt,
      latestAccuracy: record.accuracy,
      wrongCount: questions.length,
      totalQuestions: record.totalQuestions,
      attempts,
      questions: questions
        .map((question) => ({
          ...question,
          questionType:
            question.questionType ??
            resolveQuestionType?.(examId, question.questionId),
        }))
        .sort((a, b) => compareQuestionIds(a.questionId, b.questionId)),
      orphaned: exams !== undefined && exam === undefined,
    });
  }

  return sortEntries(filterEntries(entries, filters), filters?.sort ?? "recent");
}

function filterEntries(
  entries: WrongbookEntry[],
  filters: Partial<WrongbookFilters> | undefined,
): WrongbookEntry[] {
  if (!filters) return entries;
  const needle = (filters.search ?? "").trim().toLowerCase();

  return entries.filter((entry) => {
    if (filters.category && filters.category !== "all") {
      if (entry.category !== filters.category) return false;
    }
    if (filters.frequency && filters.frequency !== "all") {
      if (entry.frequency !== filters.frequency) return false;
    }
    if (filters.questionType && filters.questionType !== "all") {
      const has = entry.questions.some(
        (question) => question.questionType === filters.questionType,
      );
      if (!has) return false;
    }
    if (needle && !entry.title.toLowerCase().includes(needle)) return false;
    return true;
  });
}

function sortEntries(
  entries: WrongbookEntry[],
  sort: WrongbookSort,
): WrongbookEntry[] {
  const sorted = [...entries];
  switch (sort) {
    case "most_wrong":
      sorted.sort(
        (a, b) =>
          b.wrongCount - a.wrongCount ||
          timeOf(b.latestAttemptAt) - timeOf(a.latestAttemptAt),
      );
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "en"));
      break;
    case "recent":
    default:
      // Latest wrong answer first — the remediation queue is time-ordered.
      sorted.sort(
        (a, b) => timeOf(b.latestAttemptAt) - timeOf(a.latestAttemptAt),
      );
      break;
  }
  return sorted;
}

/** Number of exams currently in the wrongbook. Drives the nav badge. */
export function wrongbookCount(records: readonly PracticeRecord[]): number {
  let count = 0;
  for (const { record } of latestByExam(records).values()) {
    if (wrongQuestions(record).length > 0) count += 1;
  }
  return count;
}

/** Total wrong questions across the wrongbook, for the header line. */
export function wrongQuestionCount(entries: readonly WrongbookEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.wrongCount, 0);
}

/** Question types present in the current wrongbook, with counts, for filters. */
export function wrongbookTypeCounts(
  entries: readonly WrongbookEntry[],
): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const question of entry.questions) {
      if (!question.questionType) continue;
      counts.set(
        question.questionType,
        (counts.get(question.questionType) ?? 0) + 1,
      );
    }
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
