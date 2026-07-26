/**
 * Profile schema migration.
 *
 * Exists at version 1 on purpose: the migration path has to be in place before
 * there is anything to migrate, or the first schema change strands every
 * profile already sitting in a browser.
 *
 * Three outcomes, and the difference between them matters:
 *   - a ProfileV1            → usable
 *   - "future"               → written by a NEWER build; refuse to touch it,
 *                              because writing would downgrade and lose fields
 *   - "unmigratable"         → unreadable; the caller offers a download before
 *                              anything is overwritten
 */
import {
  createEmptyProfile,
  PROFILE_SCHEMA_VERSION,
  PROFILE_STEPS,
  type ProfileV1,
  type StepState,
} from "./types.ts";

export type MigrationResult =
  | { status: "ok"; profile: ProfileV1; migrated: boolean }
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
  const labEstimate = isObject(english.labEstimate) ? english.labEstimate : null;

  const profile: ProfileV1 = {
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
        null) as ProfileV1["geography"]["budgetBand"],
      budgetCeilingUsd: numberOrNull(geography.budgetCeilingUsd),
    },
    academic: {
      currentLevel: (stringOrNull(academic.currentLevel) ??
        null) as ProfileV1["academic"]["currentLevel"],
      graduationYear: numberOrNull(academic.graduationYear),
      gpaBand: (stringOrNull(academic.gpaBand) ??
        null) as ProfileV1["academic"]["gpaBand"],
    },
    english: {
      hasScore: typeof english.hasScore === "boolean" ? english.hasScore : null,
      test: (stringOrNull(english.test) ??
        null) as ProfileV1["english"]["test"],
      currentOverall: numberOrNull(english.currentOverall),
      currentSource: (stringOrNull(english.currentSource) ??
        null) as ProfileV1["english"]["currentSource"],
      targetOverall: numberOrNull(english.targetOverall),
      labEstimate: labEstimate
        ? {
            band: numberOrNull(labEstimate.band) ?? 0,
            questionCount: numberOrNull(labEstimate.questionCount) ?? 0,
            recordCount: numberOrNull(labEstimate.recordCount) ?? 0,
            computedAt:
              stringOrNull(labEstimate.computedAt) ?? new Date().toISOString(),
            tableVersion: stringOrNull(labEstimate.tableVersion) ?? "unknown",
          }
        : null,
    },
    steps: Object.fromEntries(
      PROFILE_STEPS.map((step) => {
        const value = steps[step];
        const valid =
          value === "answered" || value === "skipped" || value === "pristine";
        return [step, (valid ? value : "pristine") as StepState];
      }),
    ) as ProfileV1["steps"],
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
