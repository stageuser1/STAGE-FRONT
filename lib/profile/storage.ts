"use client";

/**
 * Profile persistence.
 *
 * Browser-local and single-user, like the IELTS history beside it. Nothing
 * here talks to a network, by design: the profile is the learner's own notes
 * about themselves, and Phase 1 makes no claim to hold it anywhere else.
 *
 * Every write is guarded. A quota failure (private mode, full storage) must
 * degrade to in-memory state with a visible notice, never throw inside a
 * render.
 */
import { migrateProfile, type MigrationResult } from "./migrate";
import { createEmptyProfile, type ProfileV2 } from "./types";

const STORAGE_KEY = "stage.profile";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export type LoadResult =
  | { status: "none" }
  | { status: "ok"; profile: ProfileV2 }
  | { status: "future"; version: number }
  | { status: "unmigratable"; raw: string };

export function loadProfileResult(): LoadResult {
  if (!isBrowser()) return { status: "none" };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: "none" };
  }
  if (!raw) return { status: "none" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "unmigratable", raw };
  }

  const result: MigrationResult = migrateProfile(parsed);
  if (result.status === "ok") return { status: "ok", profile: result.profile };
  if (result.status === "future") {
    return { status: "future", version: result.version };
  }
  return { status: "unmigratable", raw };
}

/** Convenience for readers that only care whether a usable profile exists. */
export function loadProfile(): ProfileV2 | null {
  const result = loadProfileResult();
  return result.status === "ok" ? result.profile : null;
}

/** Returns false when the write failed, so the caller can surface it. */
export function saveProfile(profile: ProfileV2): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies a partial update to the stored profile.
 *
 * Creates a profile when none exists: the suite result and the save button can
 * both be a learner's first interaction, and neither should have to know
 * whether a profile is already there.
 */
export function patchProfile(
  patch: (current: ProfileV2) => ProfileV2,
): ProfileV2 | null {
  if (!isBrowser()) return null;
  const current = loadProfile() ?? createEmptyProfile();
  const next = { ...patch(current), updatedAt: new Date().toISOString() };
  saveProfile(next);
  return next;
}

export function clearProfile(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the caller already offered an export.
  }
}

/** Marks a nudge or action card dismissed. */
export function dismissNudge(id: string): void {
  patchProfile((profile) => ({
    ...profile,
    nudges: { ...profile.nudges, [id]: new Date().toISOString() },
  }));
}
