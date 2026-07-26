/**
 * Pure derivations over a profile.
 *
 * No storage access and no React, so every surface that shows profile-derived
 * state computes it the same way and the numbers cannot disagree between the
 * dashboard, the fit panel and the lab.
 */
import { PROFILE_STEPS, type ProfileStepId, type ProfileV1 } from "./types.ts";

/**
 * How much of the profile is filled in, 0–1.
 *
 * A SKIPPED step counts as complete: the learner answered the question by
 * declining it, and nagging them about a deliberate choice is the wrong
 * behaviour. Only `pristine` steps are missing.
 */
export function profileCompleteness(profile: ProfileV1 | null): number {
  if (!profile) return 0;
  const done = PROFILE_STEPS.filter(
    (step) => profile.steps[step] !== "pristine",
  ).length;
  return done / PROFILE_STEPS.length;
}

/** The first step the learner has not reached yet, or null when all are done. */
export function firstPristineStep(
  profile: ProfileV1 | null,
): ProfileStepId | null {
  if (!profile) return PROFILE_STEPS[0];
  return PROFILE_STEPS.find((step) => profile.steps[step] === "pristine") ?? null;
}

/**
 * The English figure to compare against requirements.
 *
 * A self-reported score outranks a lab estimate: the learner knows their own
 * result, and a practice estimate must never silently override it. The source
 * travels with the value so the UI can always say where it came from.
 */
export function currentEnglishScore(
  profile: ProfileV1 | null,
): { value: number; source: "self_reported" | "lab_estimate" } | null {
  if (!profile) return null;
  const { currentOverall, currentSource, labEstimate } = profile.english;
  if (currentOverall !== null && currentSource) {
    return { value: currentOverall, source: currentSource };
  }
  if (labEstimate) return { value: labEstimate.band, source: "lab_estimate" };
  return null;
}

/** The band the learner is aiming at, if they named one. */
export function targetBand(profile: ProfileV1 | null): number | null {
  return profile?.english.targetOverall ?? null;
}

export function isNudgeDismissed(
  profile: ProfileV1 | null,
  id: string,
): boolean {
  return Boolean(profile?.nudges[id]);
}
