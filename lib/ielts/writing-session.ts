/**
 * Local writing drafts for the IELTS Lab Writing module.
 *
 * The learner's own prose never leaves the browser: there is no learner account
 * (lib/directus-auth.tsx is reviewer-only CMS auth) and nothing about draft
 * management needs a server. This module owns the whole contract — components
 * never touch `localStorage` directly.
 *
 * Key: `stage.ielts.writing`, following the `stage.*` convention, with the
 * schema version *inside* the payload rather than in the key name so a future
 * migration can read the old shape instead of orphaning it (Plan §6.3).
 *
 * One session per practice set. Both tasks of a set live in the same session
 * and are keyed by position, which is what lets the Task 1 / Task 2 tabs switch
 * without either side losing what was typed.
 *
 * The pure half (word counting, completion rules) is separated from the storage
 * half so the rules that gate the model answer are testable without a DOM.
 */

const STORAGE_KEY = "stage.ielts.writing";
const SCHEMA_VERSION = 1;

/**
 * Sessions older than this are dropped on read.
 *
 * Six months, far longer than the runner's 30-day draft markers: those are
 * "where was I in this attempt", while this is prose the learner wrote. Losing
 * an essay because it sat for five weeks would be indefensible.
 */
const MAX_AGE_DAYS = 180;

export interface WritingTaskDraft {
  /** Verbatim text as typed. Never trimmed on write — the caret is the user's. */
  text: string;
  wordCount: number;
  updatedAt: string;
}

export interface WritingSessionState {
  slug: string;
  schemaVersion: number;
  updatedAt: string;
  /** Elapsed practice time, accumulated across visits. Counts up only. */
  elapsedSeconds: number;
  /** Keyed by task position as a string, because JSON object keys are strings. */
  tasks: Record<string, WritingTaskDraft>;
  /** Set by 完成本次练习. Null until then. */
  completedAt: string | null;
}

interface WritingStore {
  schemaVersion: number;
  sessions: Record<string, WritingSessionState>;
}

/* ------------------------------------------------------------------ *
 * Pure rules
 * ------------------------------------------------------------------ */

/**
 * Words in a piece of English prose.
 *
 * Whitespace-delimited tokens that contain at least one letter or digit, which
 * is the convention every word processor a candidate has used applies:
 * "well-known" is one word, a stray "—" is none. The count drives a progress
 * readout, never a judgement, so it is deliberately simple and predictable
 * rather than clever.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

export function emptySession(slug: string): WritingSessionState {
  return {
    slug,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    tasks: {},
    completedAt: null,
  };
}

/** Words written across every task of a set. */
export function totalWords(session: WritingSessionState | null): number {
  if (!session) return 0;
  return Object.values(session.tasks).reduce(
    (sum, task) => sum + (task?.wordCount ?? 0),
    0,
  );
}

/** Tasks with at least one word — the numerator of `{X}/{Y} tasks`. */
export function startedTaskCount(session: WritingSessionState | null): number {
  if (!session) return 0;
  return Object.values(session.tasks).filter((task) => (task?.wordCount ?? 0) > 0)
    .length;
}

/**
 * Whether 完成本次练习 is available.
 *
 * A session with nothing written cannot be completed. This is the first half of
 * the "try first, then unlock" rule (writing-spec §四): with no completion there
 * is no unlock, so an empty draft can never reach a model answer.
 */
export function canComplete(session: WritingSessionState | null): boolean {
  return totalWords(session) > 0;
}

/**
 * Whether a model answer may be shown.
 *
 * Both conditions are required, and the word check is re-evaluated here rather
 * than trusted from `completedAt` alone: a session completed and then emptied
 * must lock again. This is the single predicate the model-answer route asks.
 */
export function isModelAnswerUnlocked(
  session: WritingSessionState | null,
): boolean {
  if (!session || !session.completedAt) return false;
  return totalWords(session) > 0;
}

/**
 * Marks a session complete. Returns the session unchanged when the rule
 * refuses, so callers cannot accidentally treat a refusal as a success.
 */
export function markCompleted(
  session: WritingSessionState,
  now: string = new Date().toISOString(),
): WritingSessionState {
  if (!canComplete(session)) return session;
  return { ...session, completedAt: now, updatedAt: now };
}

/** Applies typed text to one task, recomputing its count. */
export function withTaskText(
  session: WritingSessionState,
  position: number,
  text: string,
  now: string = new Date().toISOString(),
): WritingSessionState {
  return {
    ...session,
    updatedAt: now,
    tasks: {
      ...session.tasks,
      [String(position)]: { text, wordCount: countWords(text), updatedAt: now },
    },
  };
}

export function taskText(
  session: WritingSessionState | null,
  position: number,
): string {
  return session?.tasks[String(position)]?.text ?? "";
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isFresh(session: WritingSessionState): boolean {
  const at = new Date(session.updatedAt).getTime();
  if (Number.isNaN(at)) return false;
  return Date.now() - at < MAX_AGE_DAYS * 86_400_000;
}

/**
 * Accepts only what this version knows how to read.
 *
 * A payload written by a future schema version is left alone rather than
 * coerced: reading it as v1 would silently drop fields, and dropping a
 * learner's essay is worse than showing them a blank editor once.
 */
function normalise(value: unknown, slug: string): WritingSessionState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<WritingSessionState>;
  if (raw.schemaVersion !== SCHEMA_VERSION) return null;
  if (!raw.tasks || typeof raw.tasks !== "object") return null;

  const tasks: Record<string, WritingTaskDraft> = {};
  for (const [position, task] of Object.entries(raw.tasks)) {
    if (!task || typeof task !== "object") continue;
    const text = typeof task.text === "string" ? task.text : "";
    tasks[position] = {
      text,
      // Recomputed rather than trusted: the count is what gates the unlock, so
      // it must always agree with the text actually stored.
      wordCount: countWords(text),
      updatedAt:
        typeof task.updatedAt === "string" ? task.updatedAt : new Date(0).toISOString(),
    };
  }

  return {
    slug: typeof raw.slug === "string" ? raw.slug : slug,
    schemaVersion: SCHEMA_VERSION,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    elapsedSeconds:
      typeof raw.elapsedSeconds === "number" && Number.isFinite(raw.elapsedSeconds)
        ? Math.max(0, Math.floor(raw.elapsedSeconds))
        : 0,
    tasks,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : null,
  };
}

function readStore(): WritingStore {
  const empty: WritingStore = { schemaVersion: SCHEMA_VERSION, sessions: {} };
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<WritingStore>;
    if (!parsed || typeof parsed !== "object" || !parsed.sessions) return empty;

    const sessions: Record<string, WritingSessionState> = {};
    for (const [slug, value] of Object.entries(parsed.sessions)) {
      const session = normalise(value, slug);
      if (session && isFresh(session)) sessions[slug] = session;
    }
    return { schemaVersion: SCHEMA_VERSION, sessions };
  } catch {
    // Corrupt storage must not take the writing page down.
    return empty;
  }
}

function writeStore(store: WritingStore): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota refusal: the in-memory draft the caller holds still renders, and
    // the next keystroke tries again.
  }
}

/** Every live session, keyed by set slug. Used by the task list for status. */
export function loadWritingSessions(): Map<string, WritingSessionState> {
  return new Map(Object.entries(readStore().sessions));
}

export function loadWritingSession(slug: string): WritingSessionState | null {
  return readStore().sessions[slug] ?? null;
}

function persist(session: WritingSessionState): WritingSessionState {
  const store = readStore();
  store.sessions[session.slug] = session;
  writeStore(store);
  return session;
}

/** Autosave entry point. Returns the session as stored. */
export function saveTaskText(
  slug: string,
  position: number,
  text: string,
): WritingSessionState {
  const current = loadWritingSession(slug) ?? emptySession(slug);
  return persist(withTaskText(current, position, text));
}

/** Persists the count-up timer. Never decreases a stored value. */
export function saveElapsed(slug: string, elapsedSeconds: number): void {
  const current = loadWritingSession(slug);
  if (!current) return;
  const next = Math.max(current.elapsedSeconds, Math.floor(elapsedSeconds));
  if (next === current.elapsedSeconds) return;
  persist({ ...current, elapsedSeconds: next });
}

/**
 * 完成本次练习. Returns the completed session, or null when the rule refuses
 * (nothing written), which is the caller's signal to keep the button inert.
 */
export function completeWritingSession(
  slug: string,
): WritingSessionState | null {
  const current = loadWritingSession(slug);
  if (!current || !canComplete(current)) return null;
  return persist(markCompleted(current));
}

/** Reopens a completed session for further editing without losing the text. */
export function reopenWritingSession(slug: string): WritingSessionState | null {
  const current = loadWritingSession(slug);
  if (!current) return null;
  return persist({ ...current, completedAt: null });
}

export function clearWritingSession(slug: string): void {
  const store = readStore();
  if (!(slug in store.sessions)) return;
  delete store.sessions[slug];
  writeStore(store);
}
