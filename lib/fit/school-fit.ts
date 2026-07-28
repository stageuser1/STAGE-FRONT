/**
 * School-level fit summary.
 *
 * Deliberately computed from the SLIM program shape rather than the full
 * requirement checklist: a school page can carry a hundred programs, and
 * shipping a hundred DTOs to the client so a four-number strip can be rendered
 * would cost far more than the strip is worth.
 *
 * The trade is stated in the UI — the strip compares language, deadline and
 * budget, and the program page remains the authority on everything else.
 */
import type { ExploreProgram } from "../explore/types.ts";
import { currentEnglishScore } from "../profile/derive.ts";
import type { ProfileV2 } from "../profile/types.ts";
import { parseBandScore } from "./gap.ts";
import type { RequirementState } from "./requirements.ts";

export interface SchoolFitSummary {
  eligible: number;
  gap: number;
  unknown: number;
  total: number;
  /** Lowest IELTS requirement across the school's programs. */
  minIelts: number | null;
}

/**
 * Coarse per-program state for the school strip and the program index chips.
 *
 * Compares only what the slim shape carries. A program whose language
 * requirement is recorded but whose learner value is missing is `unknown`,
 * never `gap` — the same rule the full checklist follows.
 */
export function quickProgramState(
  program: ExploreProgram,
  profile: ProfileV2 | null,
): RequirementState {
  const required = parseBandScore(program.ieltsMinimum);
  const current = currentEnglishScore(profile);
  const ceiling = profile?.geography.budgetCeilingUsd ?? null;

  // Nothing to compare against at all.
  if (!profile) return "unknown";

  let sawComparison = false;

  if (required !== null) {
    if (current === null) return "unknown";
    sawComparison = true;
    if (current.value < required) return "gap";
  }

  if (program.tuitionAmount !== null && ceiling !== null) {
    sawComparison = true;
    if (program.tuitionAmount > ceiling) return "gap";
  }

  if (program.applicationDeadline) {
    const days = Math.ceil(
      (new Date(`${program.applicationDeadline.slice(0, 10)}T00:00:00`).getTime() -
        Date.now()) /
        86_400_000,
    );
    if (Number.isFinite(days)) {
      sawComparison = true;
      if (days < 0) return "gap";
    }
  }

  return sawComparison ? "satisfied" : "unknown";
}

export function summariseSchoolFit(
  programs: ExploreProgram[],
  profile: ProfileV2 | null,
): SchoolFitSummary {
  const summary: SchoolFitSummary = {
    eligible: 0,
    gap: 0,
    unknown: 0,
    total: programs.length,
    minIelts: null,
  };

  for (const program of programs) {
    const state = quickProgramState(program, profile);
    if (state === "gap") summary.gap += 1;
    else if (state === "unknown") summary.unknown += 1;
    else summary.eligible += 1;

    const required = parseBandScore(program.ieltsMinimum);
    if (required !== null) {
      summary.minIelts =
        summary.minIelts === null ? required : Math.min(summary.minIelts, required);
    }
  }

  return summary;
}
