/**
 * Derived views over practice history.
 *
 * Pure functions over an array of records, mirroring `computeStats` in
 * storage.ts: no storage access, no React, so the charts stay trivially
 * testable and the history page can compute everything in one pass on mount.
 *
 * Records are stored newest-first (storage.ts prepends). Trends read oldest-
 * first, so the series is reversed here rather than at every call site.
 */
import { UNCLASSIFIED, questionTypeLabel, questionTypeOf } from "./question-types";
import type {
  PracticeRecord,
  QuestionTypeStat,
  TrendPoint,
} from "./types";

/** Percent, 0–100, rounded. Charts and labels never show the [0,1] ratio. */
function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

/**
 * Builds the score / accuracy trend series, oldest attempt first.
 *
 * `limit` keeps the x axis readable — the newest N attempts are the ones a
 * learner is asking about, and 1,000 points would be unreadable regardless.
 */
export function buildTrend(
  records: PracticeRecord[],
  limit = 20,
): TrendPoint[] {
  return records
    .slice(0, limit)
    .reverse()
    .map((record, position) => ({
      id: record.id,
      index: position + 1,
      date: shortDate(record.createdAt),
      title: record.title,
      category: record.category,
      score: record.correctAnswers,
      totalQuestions: record.totalQuestions,
      accuracy: toPercent(record.accuracy),
    }));
}

/**
 * Rolls per-question outcomes up by question type, weakest first.
 *
 * The stored `questionType` wins when present (record version 2.0.0+). For
 * older records the corpus index is consulted so history saved before this
 * module existed still contributes — this is why no migration is needed.
 */
export function buildQuestionTypeStats(
  records: PracticeRecord[],
): QuestionTypeStat[] {
  const totals = new Map<string, { attempted: number; correct: number }>();

  for (const record of records) {
    const comparisons = record.answerComparison;
    if (!comparisons || typeof comparisons !== "object") continue;

    for (const [questionId, entry] of Object.entries(comparisons)) {
      if (!entry || typeof entry !== "object") continue;

      const type =
        entry.questionType ??
        questionTypeOf(record.examId, entry.questionId ?? questionId) ??
        UNCLASSIFIED;

      const bucket = totals.get(type) ?? { attempted: 0, correct: 0 };
      bucket.attempted += 1;
      if (entry.isCorrect) bucket.correct += 1;
      totals.set(type, bucket);
    }
  }

  return [...totals.entries()]
    .map(([type, { attempted, correct }]) => ({
      type,
      label: questionTypeLabel(type),
      attempted,
      correct,
      accuracy: attempted > 0 ? toPercent(correct / attempted) : 0,
    }))
    .sort((a, b) =>
      // Weakest first — the point of the chart is to show what to practise.
      // Ties break on volume so a 0/1 outlier cannot outrank a real weakness.
      a.accuracy !== b.accuracy
        ? a.accuracy - b.accuracy
        : b.attempted - a.attempted,
    );
}

/**
 * The weakest type worth acting on, or null.
 *
 * `minAttempted` guards against a single wrong answer on a rare type being
 * presented as the learner's main weakness.
 */
export function weakestType(
  stats: QuestionTypeStat[],
  minAttempted = 5,
): QuestionTypeStat | null {
  return (
    stats.find(
      (stat) => stat.type !== UNCLASSIFIED && stat.attempted >= minAttempted,
    ) ?? null
  );
}
