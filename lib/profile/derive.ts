/**
 * Pure derivations over a profile.
 *
 * No storage access and no React, so every surface that shows profile-derived
 * state computes it the same way and the numbers cannot disagree between the
 * dashboard, the fit panel and the lab.
 */
import {
  PROFILE_STEPS,
  type EnglishSubject,
  type ProfileStepId,
  type ProfileV2,
} from "./types.ts";

/**
 * How much of the profile is filled in, 0–1.
 *
 * A SKIPPED step counts as complete: the learner answered the question by
 * declining it, and nagging them about a deliberate choice is the wrong
 * behaviour. Only `pristine` steps are missing.
 */
export function profileCompleteness(profile: ProfileV2 | null): number {
  if (!profile) return 0;
  const done = PROFILE_STEPS.filter(
    (step) => profile.steps[step] !== "pristine",
  ).length;
  return done / PROFILE_STEPS.length;
}

/** The first step the learner has not reached yet, or null when all are done. */
export function firstPristineStep(
  profile: ProfileV2 | null,
): ProfileStepId | null {
  if (!profile) return PROFILE_STEPS[0];
  return PROFILE_STEPS.find((step) => profile.steps[step] === "pristine") ?? null;
}

/**
 * The English figure to compare against requirements.
 *
 * Self-reported only (ruling C1). STAGE has no score of its own to offer here:
 * if the learner has not told us their result, the answer is null and every
 * surface renders 待确认 rather than filling the hole with a guess.
 */
export function currentEnglishScore(
  profile: ProfileV2 | null,
): { value: number; source: "self_reported" } | null {
  if (!profile) return null;
  const { currentOverall, currentSource } = profile.english;
  if (currentOverall === null || currentSource !== "self_reported") return null;
  return { value: currentOverall, source: currentSource };
}

/**
 * The overall band the learner is aiming at, if they set one.
 *
 * A target is intent, not a result: callers may display it beside a
 * requirement, but it must never satisfy one.
 */
export function targetBand(profile: ProfileV2 | null): number | null {
  return profile?.english.targetOverall ?? null;
}

/** A subject target the learner set for themselves, or null. */
export function subjectTarget(
  profile: ProfileV2 | null,
  subject: EnglishSubject,
): number | null {
  return profile?.english.targets?.[subject] ?? null;
}

export function isNudgeDismissed(
  profile: ProfileV2 | null,
  id: string,
): boolean {
  return Boolean(profile?.nudges[id]);
}
