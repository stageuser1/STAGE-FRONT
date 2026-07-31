"use client";

/**
 * The browser half of attempt persistence: read, debounced write, delete.
 *
 * Everything that can be decided without a `window` is in
 * `lib/ielts/listening-persist.ts` and tested there. What is left here is the
 * part that only exists in a browser, and it has one rule: storage is a
 * convenience, never a dependency. Private-mode Safari throws on `setItem`, a
 * full quota throws mid-attempt, and an embedded webview may have storage
 * disabled outright — in all three the candidate keeps a working paper held in
 * memory, and the only trace is a single console warning.
 *
 * Single, because the write is on a 500ms debounce behind every keystroke: a
 * warning per failed write would put thousands of identical lines in the
 * console of a session that is otherwise fine.
 */
import { useEffect, useRef } from "react";

import { hasRecordedWork, storageKey } from "@/lib/ielts/listening-persist";
import { serializeAttempt } from "@/lib/ielts/listening-runner";
import type { Attempt } from "@/lib/ielts/listening-types";

/** How long the paper sits still before a draft is written. */
const WRITE_DEBOUNCE_MS = 500;

let warned = false;

function warnOnce(error: unknown): void {
  if (warned) return;
  warned = true;
  console.warn(
    "Listening: 本机存储不可用，本次练习不会被保存（仅本次会话内有效）。",
    error,
  );
}

export function readStoredAttempt(setId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(setId));
  } catch (error) {
    warnOnce(error);
    return null;
  }
}

export function writeStoredAttempt(setId: string, attempt: Attempt): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(setId), serializeAttempt(attempt));
  } catch (error) {
    warnOnce(error);
  }
}

export function clearStoredAttempt(setId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(setId));
  } catch (error) {
    warnOnce(error);
  }
}

/**
 * Keep the stored draft in step with the attempt.
 *
 * Two effects rather than one, because the two writes have opposite deadlines.
 * A keystroke is debounced — writing on every character would serialize the
 * whole paper per keypress — while a submit is written through on the spot: the
 * result view is the next thing the candidate sees, and a 500ms window in which
 * a reload would resurrect the paper as unsubmitted is a window in which a
 * finished attempt can be silently reopened.
 *
 * `enabled` is false until the restore question has been answered. Without that
 * gate the fresh attempt rendered behind the dialog would debounce itself over
 * the very draft the dialog is offering to restore.
 *
 * The draft effect additionally waits for the first answer (`hasRecordedWork`,
 * latched, so that clearing back to nothing still saves). A blank attempt has
 * nothing to protect, and staying quiet until there is means that merely
 * opening a set cannot overwrite the record of the last one handed in.
 *
 * A submitted attempt is written unconditionally: a paper with no answers at
 * all is still a paper that was handed in, and the record of it is the only
 * evidence that it was.
 */
export function useAttemptStorage(
  setId: string,
  attempt: Attempt,
  enabled: boolean,
): void {
  // Read through a ref so the debounce effect re-runs on attempt changes only.
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || attempt.status !== "in_progress") return;
    if (!started.current && !hasRecordedWork(attempt)) return;
    started.current = true;

    const timer = window.setTimeout(
      () => writeStoredAttempt(setId, attemptRef.current),
      WRITE_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [attempt, enabled, setId]);

  useEffect(() => {
    if (!enabled || attempt.status !== "submitted") return;
    writeStoredAttempt(setId, attempt);
  }, [attempt, enabled, setId]);
}
