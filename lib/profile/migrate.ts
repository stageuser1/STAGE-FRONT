/**
 * Profile schema migration.
 *
 * Three outcomes, and the difference between them matters:
 *   - a ProfileV2            → usable
 *   - "future"               → written by a NEWER build; refuse to touch it,
 *                              because writing would downgrade and lose fields
 *   - "unmigratable"         → unreadable; the caller offers a download before
 *                              anything is overwritten
 *
 * v1 → v2 (ruling C1) is the first real migration, and it is a DELETION:
 *
 *   - the lab's stored band estimate is dropped entirely;
 *   - a `currentOverall` whose source was that estimate is blanked, because a
 *     number the product invented does not become the learner's score by being
 *     carried into a new schema — estimates are abolished, not laundered;
 *   - a self-reported score, its source, and the learner's target survive
 *     untouched: those are the learner's own statements;
 *   - per-subject targets start empty. Nothing in v1 expressed them, and
 *     copying the old overall target into four subjects would put words in the
 *     learner's mouth.
 */
import {
  createEmptyProfile,
  emptyTargets,
  ENGLISH_SUBJECTS,
  normaliseTarget,
  PROFILE_SCHEMA_VERSION,
  PROFILE_STEPS,
  type EnglishTargets,
  type ProfileV2,
  type StepState,
} from "./types.ts";

export type MigrationResult =
  | { status: "ok"; profile: ProfileV2; migrated: boolean }
  | { status: "future"; version: number }
  | { status: "unmigratable"; raw: unknown };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * The learner's self-reported score, or nothing.
 *
 * v1 allowed a second source — the lab's own estimate. That value is dropped
 * here rather than carried forward under a new name: the whole point of ruling
 * C1 is that the product stops asserting scores. A figure with no recognisable
 * source is dropped for the same reason: it cannot be attributed to the
 * learner, so it does not get to be the learner's score.
 */
function selfReportedScore(english: Record<string, unknown>): {
  currentOverall: number | null;
  currentSource: "self_reported" | null;
} {
  const source = stringOrNull(english.currentSource);
  if (source !== "self_reported") {
    return { currentOverall: null, currentSource: null };
  }
  const value = numberOrNull(english.currentOverall);
  return value === null
    ? { currentOverall: null, currentSource: null }
    : { currentOverall: value, currentSource: "self_reported" };
}

/** Per-subject targets, present only from v2 onwards. */
function readTargets(english: Record<string, unknown>): EnglishTargets {
  const raw = isObject(english.targets) ? english.targets : null;
  if (!raw) return emptyTargets();
  const targets = emptyTargets();
  for (const subject of ENGLISH_SUBJECTS) {
    targets[subject] = normaliseTarget(numberOrNull(raw[subject]));
  }
  return targets;
}

export function migrateProfile(raw: unknown): MigrationResult {
  if (!isObject(raw)) return { status: "unmigratable", raw };

  const version = raw.schemaVersion;
  if (typeof version !== "number") return { status: "unmigratable", raw };
  if (version > PROFILE_SCHEMA_VERSION) {
    return { status: "future", version };
  }

  // Rebuilt field by field over a fresh default rather than spread: a
  // hand-edited or partially-written object must not be able to leave a
  // required field undefined and crash a reader downstream.
  const base = createEmptyProfile();
  const discipline = isObject(raw.discipline) ? raw.discipline : {};
  const target = isObject(raw.target) ? raw.target : {};
  const geography = isObject(raw.geography) ? raw.geography : {};
  const academic = isObject(raw.academic) ? raw.academic : {};
  const english = isObject(raw.english) ? raw.english : {};
  const steps = isObject(raw.steps) ? raw.steps : {};

  const profile: ProfileV2 = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    profileId: stringOrNull(raw.profileId) ?? base.profileId,
    createdAt: stringOrNull(raw.createdAt) ?? base.createdAt,
    updatedAt: stringOrNull(raw.updatedAt) ?? base.updatedAt,
    discipline: {
      fieldSlugs: stringArray(discipline.fieldSlugs),
      instrument: stringOrNull(discipline.instrument),
    },
    target: {
      degreeSlugs: stringArray(target.degreeSlugs),
      entryTerm: stringOrNull(target.entryTerm),
    },
    geography: {
      countries: stringArray(geography.countries),
      budgetBand: (stringOrNull(geography.budgetBand) ??
        null) as ProfileV2["geography"]["budgetBand"],
      budgetCeilingUsd: numberOrNull(geography.budgetCeilingUsd),
    },
    academic: {
      currentLevel: (stringOrNull(academic.currentLevel) ??
        null) as ProfileV2["academic"]["currentLevel"],
      graduationYear: numberOrNull(academic.graduationYear),
      gpaBand: (stringOrNull(academic.gpaBand) ??
        null) as ProfileV2["academic"]["gpaBand"],
    },
    english: {
      hasScore: typeof english.hasScore === "boolean" ? english.hasScore : null,
      test: (stringOrNull(english.test) ??
        null) as ProfileV2["english"]["test"],
      ...selfReportedScore(english),
      // The learner's own target survives every migration: they set it, and no
      // schema change makes it less theirs.
      targetOverall: normaliseTarget(numberOrNull(english.targetOverall)),
      targets: readTargets(english),
    },
    steps: Object.fromEntries(
      PROFILE_STEPS.map((step) => {
        const value = steps[step];
        const valid =
          value === "answered" || value === "skipped" || value === "pristine";
        return [step, (valid ? value : "pristine") as StepState];
      }),
    ) as ProfileV2["steps"],
    nudges: isObject(raw.nudges)
      ? Object.fromEntries(
          Object.entries(raw.nudges).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {},
  };

  return { status: "ok", profile, migrated: version < PROFILE_SCHEMA_VERSION };
}
