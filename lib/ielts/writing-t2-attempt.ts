/**
 * The Task 2 attempt model: the word-count rule, the clock, and local storage.
 *
 * The learner's prose never leaves the browser. There is no learner account and
 * no endpoint that would accept an essay; this module owns the whole storage
 * contract, and the component never touches `localStorage` directly.
 *
 * Two keys per question, both namespaced `stage.*` with the schema version
 * *inside* the payload so a later migration can read the old shape instead of
 * orphaning it (Plan §6.3):
 *
 *   stage.ielts.writing.draft.<questionId>    the attempt in progress
 *   stage.ielts.writing.attempt.<questionId>  the submitted record
 *
 * Per question rather than one map under a single key — the shape the approved
 * brief specifies. It also means a quota refusal or a corrupt entry can only
 * cost one question's draft instead of all 21.
 *
 * Which of the two exists decides what the screen shows: a draft means an
 * attempt is open, and its absence beside a record means the last attempt was
 * submitted. That is why 再练一次 writes an empty draft rather than deleting the
 * record — the record is the learner's history, and starting again must not
 * erase it.
 *
 * Separate from `writing-session.ts`, which models a Directus *set* of one or
 * two tasks keyed by slug. That path is being retired and its stored sessions
 * stay readable under their own key; nothing here touches them.
 */

/** Task 2 asks for at least 250 words. */
export const T2_WORD_TARGET = 250;

/**
 * Words in an English essay: whitespace-delimited tokens that contain at least
 * one letter or digit.
 *
 * Carried over verbatim from `writing-session.ts` so the two Writing surfaces
 * can never report different counts for the same text. Consequences worth being
 * explicit about, since this number is what a learner is judged against:
 *
 *  - `well-being` is **one** word. Nothing splits on the hyphen, which is the
 *    convention IELTS itself uses.
 *  - `don't` is one word.
 *  - a token of pure punctuation — a stray `—` or `-` on its own — counts as
 *    **zero**. The export's rule (`split(/\s+/).length`) counts it as one, which
 *    would let a line of dashes read as progress toward 250.
 *  - CJK text has no spaces, so a Chinese paragraph counts as one word. That is
 *    correct for this surface: the task is an English essay.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/**
 * `00:04:12` — hours:minutes:seconds, counting up, hours always padded.
 *
 * The export's format. Counting up rather than down, in neutral grey with no
 * threshold and no colour change, is writing-spec §五.5 and the same rule
 * Reading and Listening follow.
 */
export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(
    Math.floor((seconds % 3600) / 60),
  )}:${pad(seconds % 60)}`;
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

const SCHEMA_VERSION = 1;
const DRAFT_PREFIX = "stage.ielts.writing.draft.";
const ATTEMPT_PREFIX = "stage.ielts.writing.attempt.";

/**
 * Drafts older than this are dropped on read. Six months, matching
 * `writing-session.ts`: losing an essay because it sat for five weeks would be
 * indefensible.
 *
 * Submitted attempts are deliberately **not** aged out. A draft is "where I got
 * to"; a record is what the learner actually did, and it is 21 short entries at
 * most.
 */
const DRAFT_MAX_AGE_DAYS = 180;

export interface WritingT2Draft {
  schemaVersion: number;
  questionId: string;
  /** Verbatim as typed. Never trimmed on write — the caret belongs to the user. */
  text: string;
  /** Counts up only, carried across refreshes within one attempt. */
  elapsedSeconds: number;
  updatedAt: string;
}

export interface WritingT2Attempt {
  schemaVersion: number;
  questionId: string;
  text: string;
  wordCount: number;
  elapsedSeconds: number;
  submittedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readKey(key: string): unknown {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    // Corrupt storage must not take the writing page down.
    return null;
  }
}

/**
 * Write, reporting whether the value actually reached storage.
 *
 * The boolean is the whole point: a quota refusal used to be swallowed here, so
 * the caller could not tell a saved draft from a lost one and the UI said
 * 草稿已自动保存 over an empty store. Every write path returns this up to the
 * component, which may only claim a save it was told happened.
 */
function writeKey(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota refusal or a blocked store. The in-memory draft the caller holds
    // still renders, and the next debounced save tries again.
    return false;
  }
}

function removeKey(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function asSeconds(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

/**
 * The draft for a question, or `null` when there is no attempt in progress.
 *
 * Defensive about every field: this is data a previous version of the app wrote,
 * and a hand-edited or half-written entry must degrade to "no draft" rather than
 * render `undefined` into the editor.
 */
export function loadWritingT2Draft(questionId: string): WritingT2Draft | null {
  const raw = readKey(DRAFT_PREFIX + questionId);
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.text !== "string") return null;

  // Age out only against a timestamp that actually parses. An entry with a
  // missing or unreadable `updatedAt` is of *unknown* age, not infinitely old:
  // treating it as the epoch would delete the learner's essay to enforce a
  // freshness rule that has no evidence to apply. It is kept and restamped, so
  // the clock starts from the moment we could first read it.
  const stored = typeof row.updatedAt === "string" ? row.updatedAt : null;
  const stamped = stored === null ? Number.NaN : new Date(stored).getTime();
  const known = Number.isFinite(stamped);
  if (known && Date.now() - stamped > DRAFT_MAX_AGE_DAYS * 86_400_000) {
    return null;
  }

  const draft: WritingT2Draft = {
    schemaVersion: SCHEMA_VERSION,
    questionId,
    text: row.text,
    elapsedSeconds: asSeconds(row.elapsedSeconds),
    updatedAt: known ? (stored as string) : new Date().toISOString(),
  };

  // The repair is written back, not just returned. A restamp that lived only in
  // memory would be redone on every load, so the draft would never age at all:
  // each visit would reset its unknown age to "now". Persisting it starts the
  // 180-day clock from the first read that could not tell how old it was.
  if (!known) writeKey(DRAFT_PREFIX + questionId, draft);

  return draft;
}

/** Returns whether the draft reached storage. */
export function saveWritingT2Draft(
  questionId: string,
  text: string,
  elapsedSeconds: number,
): boolean {
  const draft: WritingT2Draft = {
    schemaVersion: SCHEMA_VERSION,
    questionId,
    text,
    elapsedSeconds: asSeconds(elapsedSeconds),
    updatedAt: new Date().toISOString(),
  };
  return writeKey(DRAFT_PREFIX + questionId, draft);
}

export function clearWritingT2Draft(questionId: string): boolean {
  return removeKey(DRAFT_PREFIX + questionId);
}

export function loadWritingT2Attempt(questionId: string): WritingT2Attempt | null {
  const raw = readKey(ATTEMPT_PREFIX + questionId);
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.text !== "string") return null;

  return {
    schemaVersion: SCHEMA_VERSION,
    questionId,
    text: row.text,
    // Recomputed rather than trusted: the stored count must always agree with
    // the stored text, and only one of the two can be authoritative.
    wordCount: countWords(row.text),
    elapsedSeconds: asSeconds(row.elapsedSeconds),
    // Empty rather than the epoch when it is missing or unreadable: the panel
    // omits an unparseable stamp, and "1970-01-01" would be a worse answer to
    // "when did I write this" than no answer.
    submittedAt: typeof row.submittedAt === "string" ? row.submittedAt : "",
  };
}

/**
 * Whether this question has a submitted record.
 *
 * The overview's Writing progress is the count of these across the practicable
 * bank. Reading the record rather than a separate counter keeps one source of
 * truth: a question is done when its attempt exists, and nothing else says so.
 */
export function hasWritingT2Attempt(questionId: string): boolean {
  return loadWritingT2Attempt(questionId) !== null;
}

/**
 * Why a submission did not happen.
 *
 * `empty` is the guard refusing a blank essay; `storage` is the browser refusing
 * the write. The caller must tell these apart, because only one of them means
 * the learner's text is at risk.
 */
export type WritingT2SubmitFailure = "empty" | "storage";

export type WritingT2SubmitResult =
  | { ok: true; attempt: WritingT2Attempt }
  | { ok: false; reason: WritingT2SubmitFailure };

/**
 * Record a submission and close the attempt.
 *
 * Refuses empty text without writing anything — the empty-submit guard lives
 * here as well as on the button, because a disabled button is a UI state and
 * this is the rule. Nothing is scored, graded or sent anywhere; the record is
 * what was written, how long it took, and when.
 *
 * The draft is cleared **only** once the record write is confirmed. If storage
 * refuses the record, the draft is left exactly where it was: clearing it first
 * and discovering the failure afterwards would destroy the essay it was meant
 * to replace.
 */
export function submitWritingT2Attempt(
  questionId: string,
  text: string,
  elapsedSeconds: number,
): WritingT2SubmitResult {
  const wordCount = countWords(text);
  if (wordCount === 0) return { ok: false, reason: "empty" };

  const attempt: WritingT2Attempt = {
    schemaVersion: SCHEMA_VERSION,
    questionId,
    text,
    wordCount,
    elapsedSeconds: asSeconds(elapsedSeconds),
    submittedAt: new Date().toISOString(),
  };

  if (!writeKey(ATTEMPT_PREFIX + questionId, attempt)) {
    return { ok: false, reason: "storage" };
  }

  clearWritingT2Draft(questionId);
  return { ok: true, attempt };
}

/**
 * Reopen a submitted question for another go.
 *
 * Writes an empty draft, which is what puts the screen back into the editor. The
 * previous record stays until a new submission replaces it. Returns whether that
 * draft reached storage.
 */
export function restartWritingT2Attempt(questionId: string): boolean {
  return saveWritingT2Draft(questionId, "", 0);
}
