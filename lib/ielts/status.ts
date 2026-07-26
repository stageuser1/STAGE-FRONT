/**
 * Three-state exam status, derived from history and drafts.
 *
 * The source project's card semantics: a passage is unstarted, has a pending
 * draft, or is completed — and a completed passage with wrong answers is a
 * distinct fourth reading, because it is the one that still needs work.
 *
 * Derived, never stored (blueprint ground rule 7). A new draft coexists with
 * completed history: `pending` wins, because what the learner has open matters
 * more than what they finished last week.
 *
 * No JSON imports here on purpose — this module is unit-tested directly.
 */
import type { ExamProgress, PracticeRecord } from "./types";

export type ExamStatus =
  | "unstarted"
  | "pending"
  | "completed"
  | "completed_with_errors";

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  unstarted: "未开始",
  pending: "进行中",
  completed: "已完成",
  completed_with_errors: "有错题",
};

/** Draft marker, kept minimal: STAGE never mirrors the runner's answer state. */
export interface DraftMarker {
  examId: string;
  updatedAt: string;
  answered: number;
  total: number;
}

export function examStatus(
  progress: ExamProgress | undefined,
  draft?: DraftMarker,
  latestWrongCount?: number,
): ExamStatus {
  if (draft) return "pending";
  if (!progress) return "unstarted";
  if (latestWrongCount !== undefined && latestWrongCount > 0) {
    return "completed_with_errors";
  }
  return "completed";
}

export function statusLabel(status: ExamStatus): string {
  return EXAM_STATUS_LABELS[status];
}

/**
 * Wrong-answer count of each exam's most recent attempt, keyed by exam id.
 *
 * Computed in one pass so a catalog of 223 cards does not re-scan history per
 * card. Exams with no wrong answers are present with 0 rather than absent, so
 * callers can tell "no errors" from "never attempted".
 */
export function buildLatestWrongIndex(
  records: readonly PracticeRecord[],
): Map<string, number> {
  const latest = new Map<string, { at: number; wrong: number }>();

  for (const record of records) {
    if (!record?.examId) continue;
    const at = new Date(record.createdAt).getTime();
    const time = Number.isNaN(at) ? 0 : at;
    const current = latest.get(record.examId);
    if (current && current.at >= time) continue;

    let wrong = 0;
    const comparison = record.answerComparison;
    if (comparison && typeof comparison === "object") {
      for (const entry of Object.values(comparison)) {
        if (entry && typeof entry === "object" && !entry.isCorrect) wrong += 1;
      }
    }
    latest.set(record.examId, { at: time, wrong });
  }

  return new Map(
    [...latest.entries()].map(([examId, { wrong }]) => [examId, wrong]),
  );
}
