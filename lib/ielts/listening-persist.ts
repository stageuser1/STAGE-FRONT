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
 * this module deliberately never says to delete it. B5's library reads exactly
 * those records through `parseStoredAttempt` to say which sets have been
 * practised, and the record is the only copy of that fact.
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
 * A stored record read back as an attempt, or `null` when it is not one.
 *
 * This is the shape check alone — is this a complete attempt of a status this
 * build understands — with no judgement about what to *do* with it. Both
 * statuses come back, because the two callers want different ones: the practice
 * page asks whether there is a draft to offer, and the library asks whether a
 * paper was ever handed in.
 *
 * `null` covers no record, unparseable JSON, a record of the wrong shape, and a
 * status this build does not know, because in every one of those the honest
 * answer is *nothing is stored here*. A record written by some future build is
 * not an error to report; it is a record this build cannot read.
 *
 * Fields are copied out one by one rather than the parsed object being handed
 * back whole, so a record carrying extra keys from another version cannot
 * smuggle them into the running attempt.
 */
export function parseStoredAttempt(raw: string | null): Attempt | null {
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
  if (candidate.status !== "in_progress" && candidate.status !== "submitted") {
    return null;
  }
  if (!isAnswerMap(candidate.answers)) return null;

  return {
    setId: candidate.setId,
    answers: candidate.answers,
    startedAt: candidate.startedAt,
    elapsedSec: candidate.elapsedSec,
    status: candidate.status,
  };
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
 * The two judgements this adds on top of the shape check are the whole content
 * of the function: a submitted paper is not a draft, and a draft nobody has
 * written on is not worth a dialog.
 */
export function shouldOfferRestore(raw: string | null): Attempt | null {
  const attempt = parseStoredAttempt(raw);
  if (attempt === null) return null;
  if (attempt.status !== "in_progress") return null;
  return hasRecordedWork(attempt) ? attempt : null;
}
