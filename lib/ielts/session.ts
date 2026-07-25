/**
 * Multi-passage practice sessions (endless and suite), held in sessionStorage.
 *
 * sessionStorage rather than localStorage, deliberately: a session is the
 * state of one sitting in one tab. Surviving a reload or a mid-suite navigation
 * is the requirement; surviving a browser restart is not, and a stale suite
 * resurfacing days later would be a bug rather than a feature.
 *
 * The finished attempts themselves are ordinary practice records in
 * localStorage — a session only tracks *where the learner is*, so losing one
 * can never lose a scored attempt.
 */
import type { ExamCategory } from "./types";
import type { FrequencyScope } from "./progress";

const SESSION_KEY = "stage.ielts.session";

/** Which multi-passage flow launched the current practice page. */
export type SessionFlow = "endless" | "suite";

export interface SuiteEntry {
  examId: string;
  title: string;
  category: ExamCategory;
  /** Set once the entry has been submitted. */
  recordId?: string;
}

export interface EndlessSession {
  kind: "endless";
  startedAt: string;
  /** Exams already served, so the next draw can avoid an immediate repeat. */
  served: string[];
  completed: number;
}

export interface SuiteSession {
  kind: "suite";
  id: string;
  startedAt: string;
  scope: FrequencyScope;
  entries: SuiteEntry[];
  /** 0-based position in `entries`. */
  index: number;
}

export type PracticeSession = EndlessSession | SuiteSession;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadSession(): PracticeSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as PracticeSession;
    return session.kind === "endless" || session.kind === "suite" ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session: PracticeSession): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // A session is a convenience. Failing to persist it must not break practice.
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Reads the session only if it matches the flow the page was opened in.
 *
 * Guards the case where a learner leaves a suite half-finished and then opens a
 * single passage: the stale suite must not capture that attempt.
 */
export function loadSessionOfKind<K extends SessionFlow>(
  kind: K,
): (K extends "suite" ? SuiteSession : EndlessSession) | null {
  const session = loadSession();
  if (!session || session.kind !== kind) return null;
  return session as K extends "suite" ? SuiteSession : EndlessSession;
}

export function startEndless(firstExamId: string): EndlessSession {
  const session: EndlessSession = {
    kind: "endless",
    startedAt: new Date().toISOString(),
    served: [firstExamId],
    completed: 0,
  };
  saveSession(session);
  return session;
}

export function startSuite(
  entries: SuiteEntry[],
  scope: FrequencyScope,
): SuiteSession {
  const session: SuiteSession = {
    kind: "suite",
    id: `suite-${Date.now()}`,
    startedAt: new Date().toISOString(),
    scope,
    entries,
    index: 0,
  };
  saveSession(session);
  return session;
}

/** True once every entry has a stored record. */
export function isSuiteComplete(session: SuiteSession): boolean {
  return session.entries.every((entry) => Boolean(entry.recordId));
}

/** Practice URL for one passage, carrying the flow it belongs to. */
export function practiceHref(examId: string, flow?: SessionFlow): string {
  const base = `/ielts-lab/practice/${examId}`;
  return flow ? `${base}?flow=${flow}` : base;
}

/** Practice URL that re-opens a stored attempt read-only. */
export function reviewHref(examId: string, recordId: string): string {
  return `/ielts-lab/practice/${examId}?review=${encodeURIComponent(recordId)}`;
}
