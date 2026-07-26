/**
 * Raw score → IELTS band estimate for Academic Reading.
 *
 * This is an ESTIMATE and every caller must render it as one: the corpus is
 * reading-only, so it cannot produce an overall four-skill band, and a real
 * test's conversion varies slightly per paper. The table version travels with
 * the value so a later revision is visible rather than silent.
 *
 * Pure and dependency-free, so it is unit-testable in isolation.
 */
import type { PracticeRecord } from "./types";

export const BAND_TABLE_VERSION = "academic-reading-2026-07";

/** The paper this table is calibrated for. */
const FULL_PAPER_QUESTIONS = 40;

/**
 * Inclusive lower bounds, highest first: the first row whose `minCorrect` is
 * met wins. Widely published Academic Reading conversion; see OQ-2 — it ships
 * labelled as an estimate pending the owner's confirmation.
 */
export const ACADEMIC_READING_TABLE: ReadonlyArray<
  readonly [minCorrect: number, band: number]
> = [
  [39, 9.0],
  [37, 8.5],
  [35, 8.0],
  [33, 7.5],
  [30, 7.0],
  [27, 6.5],
  [23, 6.0],
  [19, 5.5],
  [15, 5.0],
  [13, 4.5],
  [10, 4.0],
  [8, 3.5],
  [6, 3.0],
  [4, 2.5],
  [0, 2.0],
];

export interface BandEstimate {
  band: number;
  correct: number;
  total: number;
  /** Score actually looked up, after scaling to a 40-question paper. */
  scaledCorrect: number;
  /** True when `total !== 40`; the UI must say "按 N 题折算". */
  scaled: boolean;
  tableVersion: string;
}

/**
 * Estimates a band from a raw score.
 *
 * Returns null rather than a number for an empty attempt: "no data" and
 * "band 2.0" are different statements, and only one of them is honest.
 */
export function estimateBand(
  correct: number,
  total: number,
): BandEstimate | null {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  const bounded = Math.max(0, Math.min(correct, total));
  const scaled = total !== FULL_PAPER_QUESTIONS;
  const scaledCorrect = scaled
    ? Math.round((bounded / total) * FULL_PAPER_QUESTIONS)
    : bounded;

  const row = ACADEMIC_READING_TABLE.find(
    ([minCorrect]) => scaledCorrect >= minCorrect,
  );

  return {
    band: row ? row[1] : 2.0,
    correct: bounded,
    total,
    scaledCorrect,
    scaled,
    tableVersion: BAND_TABLE_VERSION,
  };
}

/**
 * A learner-level estimate from recent history.
 *
 * Uses the most recent `limit` attempts rather than the all-time best: the
 * question a band estimate answers is "where am I now", and a personal best
 * from three months ago does not answer it.
 */
export function bandFromRecords(
  records: readonly PracticeRecord[],
  limit = 6,
): (BandEstimate & { recordCount: number }) | null {
  const recent = records.slice(0, limit);
  if (recent.length === 0) return null;

  const correct = recent.reduce(
    (sum, record) => sum + (record.correctAnswers || 0),
    0,
  );
  const total = recent.reduce(
    (sum, record) => sum + (record.totalQuestions || 0),
    0,
  );

  const estimate = estimateBand(correct, total);
  return estimate ? { ...estimate, recordCount: recent.length } : null;
}

/** Formats a band for display: 6 → "6.0", 6.5 → "6.5". */
export function formatBand(band: number): string {
  return band.toFixed(1);
}

/**
 * A requirement compared against a learner's current figure.
 *
 * Lives here rather than in lib/fit because it is a band concept: the program
 * page produces one from requirement data, the lab produces one from a target
 * band, and both render it with the same meter.
 */
export interface BandGap {
  /** Program requirement. Null = not recorded. */
  required: number | null;
  /** The learner's current figure. Null = no estimate and no self-report. */
  current: number | null;
  currentSource: "self_reported" | "lab_estimate" | null;
  /** current − required, or null when either side is missing. */
  delta: number | null;
  state: "no-estimate" | "below" | "meets" | "exceeds" | "no-requirement";
  /** Present when `current` came from practice history. */
  estimateMeta?: {
    questionCount: number;
    recordCount: number;
    computedAt: string;
    tableVersion: string;
  };
  /** Raw requirement text, e.g. "6.5 (no band below 6.0)". Rendered verbatim. */
  requirementText?: string | null;
}

/** Assembles a BandGap, deriving `state` and `delta` consistently. */
export function toBandGap(
  required: number | null,
  current: number | null,
  currentSource: BandGap["currentSource"] = null,
  extras: Pick<BandGap, "estimateMeta" | "requirementText"> = {},
): BandGap {
  if (required === null) {
    return {
      required: null,
      current,
      currentSource,
      delta: null,
      state: "no-requirement",
      ...extras,
    };
  }
  if (current === null) {
    return {
      required,
      current: null,
      currentSource,
      delta: null,
      state: "no-estimate",
      ...extras,
    };
  }
  // Rounded to the nearest half band: IELTS is not reported more finely, and
  // "还差 0.3 分" would imply a precision the scale does not have.
  const delta = Math.round((current - required) * 2) / 2;
  return {
    required,
    current,
    currentSource,
    delta,
    state: delta > 0 ? "exceeds" : delta === 0 ? "meets" : "below",
    ...extras,
  };
}

/**
 * Extracts the overall band from a requirement string.
 *
 * Directus stores these as free text ("6.5", "6.5 (no band below 6.0)",
 * "IELTS 7.0 overall"). The leading number is the overall requirement; the
 * caller keeps the original string so any section requirement stays visible
 * rather than being silently dropped.
 */
export function parseBandScore(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = /(\d+(?:\.\d+)?)/.exec(String(raw));
  if (!match) return null;
  const value = Number(match[1]);
  // IELTS bands run 0–9; anything outside is a different number that happened
  // to be first in the string (a year, a fee), not a band.
  return Number.isFinite(value) && value >= 0 && value <= 9 ? value : null;
}
