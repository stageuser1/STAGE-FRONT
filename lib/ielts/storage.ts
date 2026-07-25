/**
 * Local practice history for IELTS Lab.
 *
 * Browser-local and single-user, matching the source project's model. STAGE has
 * no learner accounts yet (lib/directus-auth.tsx is reviewer/administrator-only
 * CMS auth), so there is nothing to key server-side records against.
 *
 * The original shipped a four-tier IndexedDB → localStorage → sessionStorage →
 * memory engine. That machinery is not warranted here: a capped list of records
 * stays comfortably inside the localStorage quota. Revisit if volume grows.
 */
import type { PracticeCompleteData } from "./messages";
import type { ExamCategory, PracticeRecord, PracticeStats } from "./types";

const STORAGE_KEY = "stage.ielts.practice-records";
const RECORD_VERSION = "1.0.0";
/** The source project truncates at 1,000; the same cap keeps quota predictable. */
const MAX_RECORDS = 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadRecords(): PracticeRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PracticeRecord[]) : [];
  } catch {
    // Corrupt or unreadable storage must not take the page down.
    return [];
  }
}

export function saveRecord(record: PracticeRecord): PracticeRecord[] {
  if (!isBrowser()) return [];
  const next = [record, ...loadRecords().filter((r) => r.id !== record.id)].slice(
    0,
    MAX_RECORDS,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded — keep the in-memory list so the current result still renders.
  }
  return next;
}

export function clearRecords(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function computeStats(records: PracticeRecord[]): PracticeStats {
  const byCategory: PracticeStats["byCategory"] = {
    P1: { practices: 0, averageAccuracy: 0 },
    P2: { practices: 0, averageAccuracy: 0 },
    P3: { practices: 0, averageAccuracy: 0 },
  };
  const accuracySum: Record<ExamCategory, number> = { P1: 0, P2: 0, P3: 0 };

  let totalAccuracy = 0;
  let totalTimeSeconds = 0;

  for (const record of records) {
    totalAccuracy += record.accuracy;
    totalTimeSeconds += record.duration;
    if (record.category === "P1" || record.category === "P2" || record.category === "P3") {
      byCategory[record.category].practices += 1;
      accuracySum[record.category] += record.accuracy;
    }
  }

  for (const category of ["P1", "P2", "P3"] as const) {
    const { practices } = byCategory[category];
    byCategory[category].averageAccuracy =
      practices > 0 ? accuracySum[category] / practices : 0;
  }

  return {
    totalPractices: records.length,
    averageAccuracy: records.length > 0 ? totalAccuracy / records.length : 0,
    totalTimeSeconds,
    byCategory,
  };
}

/**
 * Normalises a PRACTICE_COMPLETE payload from the exam runner into a record.
 *
 * The runner is the authority on scoring — it owns the answer key and runs
 * AnswerMatchCore internally — so this never recomputes a score, it only
 * reshapes and defends against missing fields.
 */
export function toPracticeRecord(
  data: PracticeCompleteData,
  fallback: { examId: string; title: string; category: ExamCategory | "" },
): PracticeRecord {
  const score = data.scoreInfo;
  const correct = Number(score?.correct ?? 0);
  const total = Number(score?.total ?? score?.totalQuestions ?? 0);
  const accuracy =
    typeof score?.accuracy === "number"
      ? score.accuracy
      : total > 0
        ? correct / total
        : 0;

  const endTime = data.endTime ?? new Date().toISOString();
  const startTime = data.startTime ?? endTime;

  return {
    id: `${fallback.examId}-${Date.now()}`,
    examId: data.examId ?? data.metadata?.examId ?? fallback.examId,
    title: data.metadata?.examTitle ?? data.metadata?.title ?? fallback.title,
    category: (data.metadata?.category as ExamCategory) || fallback.category,
    type: "reading",
    startTime,
    endTime,
    duration: Math.max(0, Number(data.duration ?? 0)),
    score: correct,
    totalQuestions: total,
    correctAnswers: correct,
    accuracy,
    answers: data.answers ?? {},
    answerComparison: data.answerComparison ?? {},
    correctAnswerMap: data.correctAnswers ?? {},
    createdAt: new Date().toISOString(),
    version: RECORD_VERSION,
  };
}
