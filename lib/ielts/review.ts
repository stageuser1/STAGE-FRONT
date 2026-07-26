/**
 * Review projections over a stored attempt.
 *
 * An attempt is immutable, so everything the review page shows is a pure
 * projection of one `PracticeRecord` (optionally enriched with corpus data
 * that the record does not carry, such as real question numbers).
 *
 * The stored `answerComparison` is authoritative: a later correction to the
 * corpus answer key must not retroactively change what a learner was told they
 * scored. Corpus data only ever *adds* display information here.
 */
import type { PracticeRecord } from "./types";

export interface ResultRow {
  questionId: string;
  /** Real question number from the corpus, falling back to the id. */
  displayNo: string;
  questionType?: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  marked: boolean;
}

export interface AttemptSummary {
  recordId: string;
  createdAt: string;
  accuracy: number;
  correct: number;
  total: number;
  mode?: PracticeRecord["mode"];
}

export interface BuildResultRowsOptions {
  /** `questionDisplayMap` from the exam dataset, when it has been loaded. */
  displayMap?: Record<string, string>;
  /** `questionOrder` from the exam dataset — the paper's own order. */
  questionOrder?: string[];
  resolveQuestionType?: (examId: string, questionId: string) => string | undefined;
}

/** Natural order for `q1, q2, q10`. */
function compareQuestionIds(left: string, right: string): number {
  const leftNumber = Number(left.replace(/\D+/g, ""));
  const rightNumber = Number(right.replace(/\D+/g, ""));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
  }
  return left.localeCompare(right);
}

export function buildResultRows(
  record: PracticeRecord,
  { displayMap, questionOrder, resolveQuestionType }: BuildResultRowsOptions = {},
): ResultRow[] {
  const comparison = record.answerComparison;
  if (!comparison || typeof comparison !== "object") return [];

  const marked = new Set(record.markedQuestions ?? []);
  const rows: ResultRow[] = [];

  for (const [questionId, entry] of Object.entries(comparison)) {
    if (!entry || typeof entry !== "object") continue;
    // The map key is authoritative; the value's own id is preferred when present.
    const id = entry.questionId ?? questionId;
    rows.push({
      questionId: id,
      displayNo: displayMap?.[id] ?? displayMap?.[questionId] ?? stripPrefix(id),
      questionType: entry.questionType ?? resolveQuestionType?.(record.examId, id),
      userAnswer: entry.userAnswer,
      correctAnswer: entry.correctAnswer,
      isCorrect: Boolean(entry.isCorrect),
      marked: marked.has(id) || marked.has(questionId),
    });
  }

  if (questionOrder && questionOrder.length > 0) {
    const position = new Map(questionOrder.map((id, index) => [id, index]));
    rows.sort(
      (a, b) =>
        (position.get(a.questionId) ?? Number.MAX_SAFE_INTEGER) -
          (position.get(b.questionId) ?? Number.MAX_SAFE_INTEGER) ||
        compareQuestionIds(a.questionId, b.questionId),
    );
    return rows;
  }

  rows.sort((a, b) => compareQuestionIds(a.questionId, b.questionId));
  return rows;
}

/** "q13" → "13"; anything without a numeric tail is returned unchanged. */
function stripPrefix(questionId: string): string {
  const digits = questionId.replace(/\D+/g, "");
  return digits.length > 0 ? digits : questionId;
}

/**
 * Every attempt of one exam, newest first — the C-16 pager's data.
 *
 * Sorted explicitly rather than trusting storage order, for the same reason
 * the wrongbook does: an imported history may not be sorted.
 */
export function attemptsForExam(
  records: readonly PracticeRecord[],
  examId: string,
): AttemptSummary[] {
  return records
    .filter((record) => record.examId === examId)
    .map((record) => ({
      recordId: record.id,
      createdAt: record.createdAt,
      accuracy: record.accuracy,
      correct: record.correctAnswers,
      total: record.totalQuestions,
      mode: record.mode,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/** Answer rendering shared by the review table, wrongbook and history. */
export function answerText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = (value ?? "").toString().trim();
  return text.length > 0 ? text : "（未作答）";
}
