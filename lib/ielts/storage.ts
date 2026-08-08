/**
 * Local practice history for IELTS Lab.
 *
 * Browser-local and single-user, matching the source project's model. STAGE has
 * no learner accounts yet (已删除的 reviewer CMS auth is reviewer/administrator-only
 * CMS auth), so there is nothing to key server-side records against.
 *
 * The original shipped a four-tier IndexedDB → localStorage → sessionStorage →
 * memory engine. That machinery is not warranted here: a capped list of records
 * stays comfortably inside the localStorage quota. Revisit if volume grows.
 */
import type { PracticeCompleteData } from "./messages";
import type {
  AnswerComparison,
  ExamCategory,
  ExamFrequency,
  PracticeMode,
  PracticeRecord,
  PracticeStats,
  SuiteRef,
} from "./types";

const STORAGE_KEY = "stage.ielts.practice-records";
/**
 * 2.0.0 added `answerComparison[].questionType` and `userKey`.
 * 2.1.0 adds `frequency`, `markedQuestions`, `mode` and `suite`.
 *
 * Every addition is optional, so older records stay readable and are NOT
 * rewritten on load — analytics resolves their question types from the live
 * corpus index instead. Keeping old records untouched means a bug in this
 * module can never corrupt existing history.
 */
const RECORD_VERSION = "2.1.0";
/** The source project truncates at 1,000; the same cap keeps quota predictable. */
const MAX_RECORDS = 1000;
/** Owner of every record while history is browser-local. See PracticeRecord. */
const LOCAL_USER_KEY = "local";

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

/** Writes the list as given, newest first. Returns what was actually stored. */
function persist(records: PracticeRecord[]): PracticeRecord[] {
  const next = records.slice(0, MAX_RECORDS);
  if (!isBrowser()) return next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded — keep the in-memory list so the current result still renders.
  }
  return next;
}

export function saveRecord(record: PracticeRecord): PracticeRecord[] {
  if (!isBrowser()) return [];
  return persist([record, ...loadRecords().filter((r) => r.id !== record.id)]);
}

export function getRecord(id: string): PracticeRecord | undefined {
  return loadRecords().find((record) => record.id === id);
}

/** Removes the given ids. Returns the surviving records. */
export function deleteRecords(ids: readonly string[]): PracticeRecord[] {
  if (!isBrowser()) return [];
  const doomed = new Set(ids);
  return persist(loadRecords().filter((record) => !doomed.has(record.id)));
}

export function clearRecords(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function timeOf(iso: string): number {
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Merges imported records into history, newest first.
 *
 * De-duplicated on record id, with the *existing* record winning: an import
 * must never silently overwrite an attempt the learner actually took on this
 * machine. Returns the merged list and how many records were genuinely new.
 */
export function mergeRecords(incoming: readonly PracticeRecord[]): {
  records: PracticeRecord[];
  added: number;
} {
  const existing = loadRecords();
  const seen = new Set(existing.map((record) => record.id));
  const added = incoming.filter((record) => record?.id && !seen.has(record.id));

  const merged = [...existing, ...added].sort(
    (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt),
  );
  return { records: persist(merged), added: added.length };
}

/** Local calendar day of an ISO timestamp, as `YYYY-M-D`. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(iso: string): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Consecutive practice days ending at the most recent practice day.
 *
 * Counts back from the latest day a record exists for, not from today, so a
 * streak that ended yesterday still reports its length rather than collapsing
 * to zero the moment the clock rolls over.
 *
 * Steps by calendar day rather than by subtracting 24h from a timestamp: across
 * a DST boundary the two disagree, and the calendar is what a learner counts.
 */
export function computeStreak(records: readonly PracticeRecord[]): number {
  const days = new Set<string>();
  let latest = 0;

  for (const record of records) {
    const start = startOfDay(record.createdAt);
    if (start === 0) continue;
    days.add(dayKey(new Date(start)));
    if (start > latest) latest = start;
  }
  if (latest === 0) return 0;

  let streak = 0;
  const cursor = new Date(latest);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    // Step by calendar field, not by subtracting 24h: across a DST boundary a
    // fixed -86400000ms lands on 23:00 of the same day and would loop forever.
    cursor.setDate(cursor.getDate() - 1);
    cursor.setHours(0, 0, 0, 0);
  }
  return streak;
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
    streakDays: computeStreak(records),
    byCategory,
  };
}

/** Context the runner cannot know: which exam STAGE launched, and why. */
export interface RecordContext {
  examId: string;
  title: string;
  category: ExamCategory | "";
  frequency?: ExamFrequency;
  mode?: PracticeMode;
  suite?: SuiteRef;
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
  context: RecordContext,
  /**
   * Resolves a question's type from the corpus. Injected rather than imported
   * so this module stays free of the ~26KB type index: the history page reads
   * records without ever needing to write one.
   */
  resolveQuestionType?: (examId: string, questionId: string) => string | undefined,
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
  const marked = data.metadata?.markedQuestions;

  return {
    // Suite entries are saved back-to-back, so a millisecond clock alone is not
    // a safe key; the sequence position disambiguates without a uuid dependency.
    id: `${context.examId}-${Date.now()}${context.suite ? `-${context.suite.index}` : ""}`,
    examId: data.examId ?? data.metadata?.examId ?? context.examId,
    title: data.metadata?.examTitle ?? data.metadata?.title ?? context.title,
    category: (data.metadata?.category as ExamCategory) || context.category,
    frequency: (data.metadata?.frequency as ExamFrequency) || context.frequency || "",
    type: "reading",
    userKey: LOCAL_USER_KEY,
    startTime,
    endTime,
    duration: Math.max(0, Number(data.duration ?? 0)),
    score: correct,
    totalQuestions: total,
    correctAnswers: correct,
    accuracy,
    answers: data.answers ?? {},
    answerComparison: annotateTypes(
      data.answerComparison ?? {},
      // The catalog id, not the runner-reported one: the type index is keyed by
      // catalog id, and the runner is free to report a dataset key instead.
      context.examId,
      resolveQuestionType,
    ),
    correctAnswerMap: data.correctAnswers ?? {},
    markedQuestions: Array.isArray(marked) ? marked.map(String) : undefined,
    mode: context.mode ?? "single",
    suite: context.suite,
    createdAt: new Date().toISOString(),
    version: RECORD_VERSION,
  };
}

/**
 * Copies the runner's per-question comparison, adding the corpus question type.
 *
 * Never drops or rewrites a comparison whose type cannot be resolved — an
 * unclassified question still counts toward the attempt's score, and losing it
 * would make the stored record disagree with the score the learner was shown.
 */
function annotateTypes(
  comparison: Record<string, AnswerComparison>,
  examId: string,
  resolve?: (examId: string, questionId: string) => string | undefined,
): Record<string, AnswerComparison> {
  if (!resolve) return comparison;

  const annotated: Record<string, AnswerComparison> = {};
  for (const [questionId, entry] of Object.entries(comparison)) {
    if (!entry || typeof entry !== "object") continue;
    // The map key is authoritative: the runner has been seen to omit
    // `questionId` from the value while still keying it correctly.
    // Prefer the value's own id, falling back to the map key — the runner is
    // untrusted input, and the two are expected to agree.
    const type = resolve(examId, entry.questionId ?? questionId);
    annotated[questionId] = type ? { ...entry, questionType: type } : entry;
  }
  return annotated;
}
