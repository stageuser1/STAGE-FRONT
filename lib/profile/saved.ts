"use client";

/**
 * Saved programs, with a display snapshot.
 *
 * The snapshot exists so the dashboard can render a learner's shortlist with
 * ZERO Directus round-trips. It is a cache, never a source of truth: it is
 * refreshed every time the program page is visited, and its age is shown to
 * the user once it is old enough to be doubted.
 */
import type { WorkflowStatus } from "@/data/types";

const STORAGE_KEY = "stage.saved.programs";
export const SAVED_SCHEMA_VERSION = 1;

/** Past this age the dashboard warns that the snapshot may be out of date. */
export const SNAPSHOT_STALE_DAYS = 30;

export interface SavedSnapshot {
  capturedAt: string;
  programName: string;
  programNameZh: string | null;
  schoolName: string;
  degreeLabel: string | null;
  country: string;
  city: string;
  applicationDeadline: string | null;
  prescreeningDeadline: string | null;
  auditionDate: string | null;
  ieltsMinimum: string | null;
  tuitionAnnual: number | null;
  tuitionCurrency: string | null;
  lastCheckedAt: string | null;
  workflowStatus: WorkflowStatus;
}

export interface SavedProgramV1 {
  schemaVersion: 1;
  programId: string;
  schoolId: string;
  savedAt: string;
  snapshot: SavedSnapshot;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadSaved(): SavedProgramV1[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SavedProgramV1 =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as SavedProgramV1).programId === "string" &&
        Boolean((entry as SavedProgramV1).snapshot),
    );
  } catch {
    return [];
  }
}

function persist(entries: SavedProgramV1[]): SavedProgramV1[] {
  if (!isBrowser()) return entries;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Keep the in-memory list so the current render still reflects the action.
  }
  return entries;
}

export function isSaved(programId: string): boolean {
  return loadSaved().some((entry) => entry.programId === programId);
}

/**
 * Saves a program, or refreshes the snapshot of one already saved.
 *
 * `savedAt` is preserved on refresh — the learner saved it when they saved it,
 * and re-visiting the page is not a new decision.
 */
export function saveProgram(
  programId: string,
  schoolId: string,
  snapshot: Omit<SavedSnapshot, "capturedAt">,
): SavedProgramV1[] {
  const entries = loadSaved();
  const existing = entries.find((entry) => entry.programId === programId);
  const next: SavedProgramV1 = {
    schemaVersion: SAVED_SCHEMA_VERSION,
    programId,
    schoolId,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
    snapshot: { ...snapshot, capturedAt: new Date().toISOString() },
  };
  return persist([
    next,
    ...entries.filter((entry) => entry.programId !== programId),
  ]);
}

export function unsaveProgram(programId: string): SavedProgramV1[] {
  return persist(loadSaved().filter((entry) => entry.programId !== programId));
}

/**
 * Refreshes an already-saved program's snapshot without saving a new one.
 *
 * Called when a program page renders: visiting a page is how a snapshot stays
 * fresh, but it must never add the program to the shortlist by itself.
 */
export function refreshSnapshot(
  programId: string,
  snapshot: Omit<SavedSnapshot, "capturedAt">,
): void {
  const entries = loadSaved();
  const existing = entries.find((entry) => entry.programId === programId);
  if (!existing) return;
  persist(
    entries.map((entry) =>
      entry.programId === programId
        ? { ...entry, snapshot: { ...snapshot, capturedAt: new Date().toISOString() } }
        : entry,
    ),
  );
}

export function snapshotAgeDays(entry: SavedProgramV1): number | null {
  const at = new Date(entry.snapshot.capturedAt).getTime();
  if (Number.isNaN(at)) return null;
  return Math.floor((Date.now() - at) / 86_400_000);
}
