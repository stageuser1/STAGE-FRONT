/**
 * The persistence half of a Listening attempt: keys and the restore decision.
 *
 * Pure by construction — nothing here touches `window`. The browser side of
 * storage (reading, the debounced write, the quota failure) lives in the hook
 * that uses these functions, because `node --test` cannot exercise it and a
 * decision buried inside a `useEffect` is a decision nobody can assert.
 *
 * The decision worth isolating is `shouldOfferRestore`. A stored attempt is
 * untrusted input: it may be from an older build, hand-edited in devtools, or
 * truncated by a quota failure mid-write. Anything that is not a complete,
 * in-progress attempt reads as *nothing stored* rather than as an error, so a
 * bad record costs a candidate their draft and never the page.
 *
 * A submitted attempt is likewise "no restore" — but it is not corrupt, and
 * this module deliberately never says to delete it. Reopening a finished paper
 * is B5's concern and the record is the only copy of it.
 */
import { deserializeAttempt } from "./listening-runner.ts";
import type { Answer, Attempt } from "./listening-types.ts";

/**
 * One key per set, so two sets in two tabs cannot overwrite each other.
 *
 * The prefix is namespaced `ielts:listening:` rather than sharing the
 * `stage.ielts.` prefix `lib/ielts/storage.ts` uses for practice history: that
 * key holds one capped list for the whole app, these hold one live draft each,
 * and a future "clear my drafts" must be able to find one family without
 * matching the other.
 */
export const ATTEMPT_KEY_PREFIX = "ielts:listening:attempt:";

export function storageKey(setId: string): string {
  return `${ATTEMPT_KEY_PREFIX}${setId}`;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isAnswer(value: unknown): value is Answer {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Answer>;
  if (!Number.isFinite(candidate.questionNo)) return false;
  return (
    typeof candidate.value === "string" || isStringArray(candidate.value)
  );
}

function isAnswerMap(value: unknown): value is Record<number, Answer> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(isAnswer);
}

/**
 * Whether a draft holds anything a candidate would mind losing.
 *
 * An attempt is written from the moment the page opens, so a visit that
 * answered nothing still leaves a record behind — and offering *that* back
 * means a dialog reading "已作答 0 / 8 题" standing between the candidate and a
 * paper they have not started. The clock alone does not count either: seconds
 * spent on an untouched paper are not work, and a candidate who lost them
 * loses nothing.
 *
 * The writer uses the same predicate to decide when a run starts saving at all,
 * which is what keeps a *submitted* record safe: reopening the route after
 * handing a paper in renders a fresh blank attempt, and if that attempt saved
 * itself on sight it would overwrite the finished paper B5 has to be able to
 * reopen. Nothing is written until the candidate answers something — by which
 * point they have genuinely started a new attempt.
 */
export function hasRecordedWork(attempt: Attempt): boolean {
  return Object.keys(attempt.answers).length > 0;
}

/**
 * The stored attempt to offer, or `null` when there is nothing to offer.
 *
 * `null` covers five different situations on purpose — no record, unparseable
 * JSON, a record of the wrong shape, a finished paper, and a paper nobody has
 * written on — because the caller does the same thing in all five: start fresh
 * without asking. Distinguishing them would only let the page render five
 * flavours of a dialog nobody wants.
 *
 * Fields are copied out one by one rather than the parsed object being handed
 * back whole, so a record carrying extra keys from some future version cannot
 * smuggle them into the running attempt.
 */
export function shouldOfferRestore(raw: string | null): Attempt | null {
  if (raw === null || raw === "") return null;

  let parsed: unknown;
  try {
    // The same function the runner exposes as its persistence seam, so a
    // restored attempt is parsed by exactly the code that serialized it.
    parsed = deserializeAttempt(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const candidate = parsed as Partial<Attempt>;

  if (typeof candidate.setId !== "string" || candidate.setId === "") {
    return null;
  }
  if (typeof candidate.startedAt !== "string") return null;
  if (
    typeof candidate.elapsedSec !== "number" ||
    !Number.isFinite(candidate.elapsedSec) ||
    candidate.elapsedSec < 0
  ) {
    return null;
  }
  // Submitted papers, and any status this build does not know, are not offered.
  if (candidate.status !== "in_progress") return null;
  if (!isAnswerMap(candidate.answers)) return null;

  const attempt: Attempt = {
    setId: candidate.setId,
    answers: candidate.answers,
    startedAt: candidate.startedAt,
    elapsedSec: candidate.elapsedSec,
    status: "in_progress",
  };
  return hasRecordedWork(attempt) ? attempt : null;
}
