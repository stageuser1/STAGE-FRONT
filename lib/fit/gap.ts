/**
 * A programme's language requirement compared against the learner's OWN figures.
 *
 * Ruling C1 abolished the raw→band conversion: STAGE no longer produces a score
 * of any kind. The only numbers that may appear on the learner's side of this
 * comparison are numbers the learner entered themselves — a self-reported test
 * result, or a target they set for their own planning.
 *
 * The two are not interchangeable, and this module keeps them apart:
 *
 *   - `current` is a claim about a result. It alone decides `state`.
 *   - `target` is a statement of intent. It is displayed for context and NEVER
 *     satisfies a requirement — planning to reach 7.0 is not holding 7.0.
 *
 * With no self-reported score the state is `unconfirmed`, which every surface
 * renders neutrally as 待确认. "Not entered" and "not met" are different facts
 * and must never share a colour.
 *
 * Pure and dependency-free, so it is unit-testable in isolation.
 */

/** Where a learner-side number came from. Only ever the learner. */
export type SelfEnteredSource = "self_reported";

export interface BandGap {
  /** Programme requirement. Null = not recorded. */
  required: number | null;
  /** The learner's self-reported result. Null = they have not entered one. */
  current: number | null;
  currentSource: SelfEnteredSource | null;
  /** The learner's self-set overall target. Context only, never a result. */
  target: number | null;
  /** current − required, or null when either side is missing. */
  delta: number | null;
  state: "unconfirmed" | "below" | "meets" | "exceeds" | "no-requirement";
  /** Raw requirement text, e.g. "6.5 (no band below 6.0)". Rendered verbatim. */
  requirementText?: string | null;
}

/** Assembles a BandGap, deriving `state` and `delta` consistently. */
export function toBandGap(
  required: number | null,
  current: number | null,
  currentSource: BandGap["currentSource"] = null,
  extras: Pick<BandGap, "target" | "requirementText"> = { target: null },
): BandGap {
  const target = extras.target ?? null;
  const rest = { target, requirementText: extras.requirementText };

  if (required === null) {
    return {
      required: null,
      current,
      currentSource,
      delta: null,
      state: "no-requirement",
      ...rest,
    };
  }
  if (current === null) {
    return {
      required,
      current: null,
      currentSource,
      delta: null,
      state: "unconfirmed",
      ...rest,
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
    ...rest,
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

/** Formats a requirement or a learner's own figure: 6 → "6.0", 6.5 → "6.5". */
export function formatBand(band: number): string {
  return band.toFixed(1);
}
