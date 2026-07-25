/**
 * Per-exam progress derived from practice history, plus the selection rules
 * that use it (random practice, suite composition).
 *
 * Pure functions over records and the catalog, like analytics.ts — no storage
 * access and no React, so every caller decides when to read localStorage.
 */
import type {
  ExamCategory,
  ExamProgress,
  ExamSummary,
  PracticeRecord,
} from "./types";

/**
 * Rolls history up per exam.
 *
 * Keyed by `record.examId`, which is what the catalog is keyed by. Records
 * whose exam has since left the corpus are kept in the map rather than
 * dropped — the history page still needs to render them.
 */
export function buildProgressIndex(
  records: readonly PracticeRecord[],
): Map<string, ExamProgress> {
  const index = new Map<string, ExamProgress>();

  for (const record of records) {
    if (!record?.examId) continue;
    const current = index.get(record.examId);

    if (!current) {
      index.set(record.examId, {
        attempts: 1,
        bestAccuracy: record.accuracy,
        lastAccuracy: record.accuracy,
        lastAttemptAt: record.createdAt,
        lastRecordId: record.id,
      });
      continue;
    }

    current.attempts += 1;
    current.bestAccuracy = Math.max(current.bestAccuracy, record.accuracy);
    // Records arrive newest-first, so the first one seen for an exam is the
    // most recent. Compared explicitly anyway: an imported list may not be
    // sorted, and silently trusting order would mis-report "last attempt".
    if (new Date(record.createdAt) > new Date(current.lastAttemptAt)) {
      current.lastAccuracy = record.accuracy;
      current.lastAttemptAt = record.createdAt;
      current.lastRecordId = record.id;
    }
  }

  return index;
}

/** How many distinct exams in each category have at least one attempt. */
export function practisedByCategory(
  exams: readonly ExamSummary[],
  progress: Map<string, ExamProgress>,
): Record<ExamCategory, number> {
  const counts: Record<ExamCategory, number> = { P1: 0, P2: 0, P3: 0 };
  for (const exam of exams) {
    if (progress.has(exam.id)) counts[exam.category] += 1;
  }
  return counts;
}

/** Frequency scopes offered when composing a suite, matching the source project. */
export type FrequencyScope = "high" | "high_medium" | "all";

export const FREQUENCY_SCOPE_LABELS: Record<FrequencyScope, string> = {
  high: "仅高频",
  high_medium: "高频 + 次高频",
  all: "全部题目",
};

function inScope(exam: ExamSummary, scope: FrequencyScope): boolean {
  if (scope === "all") return true;
  if (scope === "high") return exam.frequency === "high";
  return exam.frequency === "high" || exam.frequency === "medium";
}

export interface PickOptions {
  category?: ExamCategory;
  scope?: FrequencyScope;
  /** Never return these — used to avoid repeating the passage just finished. */
  exclude?: ReadonlySet<string>;
}

/**
 * Picks one exam at random, preferring passages the learner has not done.
 *
 * The source project applies the same rule when composing a suite: draw from
 * unpractised candidates, and only fall back to repeats once that pool is
 * empty. Applying it to single random practice too means a learner working
 * through the corpus stops drawing the same handful of passages.
 */
export function pickRandomExam(
  exams: readonly ExamSummary[],
  progress: Map<string, ExamProgress>,
  { category, scope = "all", exclude }: PickOptions = {},
): ExamSummary | null {
  const pool = exams.filter(
    (exam) =>
      exam.interactive &&
      (!category || exam.category === category) &&
      inScope(exam, scope) &&
      !exclude?.has(exam.id),
  );
  if (pool.length === 0) return null;

  const fresh = pool.filter((exam) => !progress.has(exam.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

/**
 * Composes a P1 → P2 → P3 suite.
 *
 * Returns null rather than a short sequence if any category has no eligible
 * passage: a two-part "three-part test" would misrepresent the exercise.
 */
export function composeSuite(
  exams: readonly ExamSummary[],
  progress: Map<string, ExamProgress>,
  scope: FrequencyScope = "all",
): ExamSummary[] | null {
  const chosen: ExamSummary[] = [];
  const taken = new Set<string>();

  for (const category of ["P1", "P2", "P3"] as const) {
    const pick = pickRandomExam(exams, progress, {
      category,
      scope,
      exclude: taken,
    });
    if (!pick) return null;
    chosen.push(pick);
    taken.add(pick.id);
  }
  return chosen;
}
