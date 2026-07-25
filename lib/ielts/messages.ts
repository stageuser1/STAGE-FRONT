/**
 * postMessage contract between the STAGE shell and the legacy exam runner
 * (public/ielts/runtime/unifiedReadingPage.js).
 *
 * The runner is unmodified, so this file documents its protocol rather than
 * defining it. It posts an envelope of the form:
 *
 *   { type, source: "practice_page", data: { examId, sessionId, ...payload } }
 *
 * and reaches its parent through `opener -> parentWindow -> parent`, which
 * resolves to `window.parent` when it is hosted in an iframe.
 *
 * SECURITY: the runner posts with targetOrigin "*" (acceptable for its original
 * file:// distribution, not for a hosted origin). Everything arriving from it is
 * therefore untrusted until `isTrustedRunnerEvent` has confirmed both the origin
 * and the source window.
 */
import type { AnswerComparison, ScoreInfo } from "./types";

export const RUNNER_MESSAGE_SOURCE = "practice_page";

/** Messages the runner emits. The MVP consumes the first two; the rest belong
 *  to suite/endless modes, which are out of scope but listed so the union is
 *  exhaustive and future work does not have to re-derive it. */
export type RunnerMessageType =
  | "SESSION_READY"
  | "PRACTICE_COMPLETE"
  | "SIMULATION_SUBMIT"
  | "SIMULATION_DRAFT_SYNC"
  | "SIMULATION_NAVIGATE"
  | "REVIEW_NAVIGATE"
  | "SUITE_USER_EXIT"
  | "ENDLESS_USER_EXIT";

export interface RunnerEnvelope<T = unknown> {
  type: RunnerMessageType;
  source?: string;
  data?: T;
}

export interface SessionReadyData {
  examId?: string;
  pageType?: string;
  title?: string;
}

export interface PracticeCompleteData {
  examId?: string;
  answers?: Record<string, string | string[]>;
  answerComparison?: Record<string, AnswerComparison>;
  correctAnswers?: Record<string, string | string[]>;
  scoreInfo?: ScoreInfo;
  duration?: number;
  startTime?: string;
  endTime?: string;
  metadata?: {
    examId?: string;
    examTitle?: string;
    title?: string;
    category?: string;
    frequency?: string;
    practiceMode?: string;
    dataKey?: string;
    /** Question ids the learner flagged in the runner. */
    markedQuestions?: string[];
  };
}

/**
 * Accepts an event only if it came from this exact iframe on this exact origin.
 * Guards against messages from other frames, extensions, or embedded content.
 */
export function isTrustedRunnerEvent(
  event: MessageEvent,
  frame: HTMLIFrameElement | null,
): boolean {
  if (typeof window === "undefined") return false;
  if (event.origin !== window.location.origin) return false;
  if (!frame?.contentWindow || event.source !== frame.contentWindow) return false;

  const payload = event.data as RunnerEnvelope | null;
  if (!payload || typeof payload !== "object") return false;
  return typeof payload.type === "string";
}

/**
 * Sends a message *to* the runner.
 *
 * Targeted at this origin rather than "*": the runner is same-origin, so there
 * is no reason to widen the target and let another document read the payload
 * if the frame is ever redirected.
 */
function postToRunner(
  frame: HTMLIFrameElement | null,
  type: string,
  data: Record<string, unknown>,
): void {
  const target = frame?.contentWindow;
  if (!target || typeof window === "undefined") return;
  target.postMessage({ type, data }, window.location.origin);
}

/**
 * Completes the runner's startup handshake.
 *
 * Until this arrives the runner re-posts SESSION_READY on an interval
 * (`stopInitLoop` in unifiedReadingPage.js is only reached from its
 * INIT_SESSION branch), so a host that merely listens leaves a timer running
 * for the life of the page.
 */
export function sendInitSession(
  frame: HTMLIFrameElement | null,
  data: { examId: string; sessionId: string },
): void {
  postToRunner(frame, "INIT_SESSION", data);
}

/**
 * Re-opens a stored attempt read-only, restoring the learner's answers, flags,
 * per-question outcomes and score.
 *
 * The stored comparison and score are sent rather than left for the runner to
 * re-derive: `buildReplayResults` only falls back to comparing answers when a
 * field is absent, so passing them makes the review show exactly the result the
 * learner was given, even if the corpus answer key is later corrected.
 */
export function sendReplayRecord(
  frame: HTMLIFrameElement | null,
  record: {
    examId: string;
    answers: Record<string, string | string[]>;
    correctAnswerMap: Record<string, string | string[]>;
    answerComparison: Record<string, AnswerComparison>;
    correctAnswers: number;
    totalQuestions: number;
    accuracy: number;
    markedQuestions?: string[];
  },
): void {
  const marked = record.markedQuestions ?? [];
  postToRunner(frame, "REPLAY_PRACTICE_RECORD", {
    entry: {
      examId: record.examId,
      answers: record.answers,
      correctAnswers: record.correctAnswerMap,
      answerComparison: record.answerComparison,
      scoreInfo: {
        correct: record.correctAnswers,
        total: record.totalQuestions,
        totalQuestions: record.totalQuestions,
        accuracy: record.accuracy,
        percentage: Math.round(record.accuracy * 100),
      },
      markedQuestions: marked,
    },
    markedQuestions: marked,
    readOnly: true,
  });
}

/** URL of the exam runner for a given exam. */
export function runnerUrl(examId: string, dataKey?: string): string {
  const params = new URLSearchParams({ examId });
  if (dataKey && dataKey !== examId) params.set("dataKey", dataKey);
  return `/ielts/reading-exams/reading-practice-unified.html?${params}`;
}
