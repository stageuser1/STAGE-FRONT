/**
 * Requirement checklist and gap computation.
 *
 * Pure functions over a PublicProgramDto and a ProfileV2. The rules here are
 * the product's central honesty commitment, so they are stated once and used
 * everywhere:
 *
 *   requirement recorded + learner value present + met      → satisfied
 *   requirement recorded + learner value present + not met  → gap
 *   requirement recorded + learner value absent             → unknown
 *   requirement explicitly negative ("No")                  → not_required
 *   requirement field null / unparseable                    → unknown
 *
 * `unknown` NEVER renders as a failure. "We have not verified this" and "you
 * do not meet this" are different claims and must never share a colour.
 */
import type { ConfidenceLevel, PublicProgramDto } from "@/data/types";
import { currentEnglishScore, targetBand } from "../profile/derive.ts";
import type { ProfileV2 } from "../profile/types.ts";
import { parseBandScore, toBandGap, type BandGap } from "./gap.ts";

export type RequirementState =
  | "satisfied"
  | "gap"
  | "unknown"
  | "not_required";

export type RequirementKind =
  | "language"
  | "prescreen"
  | "audition"
  | "documents"
  | "deadline"
  | "cost";

export interface RequirementEvidence {
  title: string;
  url: string;
  accessedAt: string;
  quote?: string | null;
}

export interface RequirementItem {
  key: string;
  kind: RequirementKind;
  title: string;
  titleEn?: string;
  state: RequirementState;
  /** One scalar line. Never a sentence. */
  summary: string | null;
  /** Markdown; rendered when the row is expanded. */
  detail?: string | null;
  evidence?: RequirementEvidence;
  lastCheckedAt: string | null;
  confidence?: ConfidenceLevel | null;
  /** Offered when `state === "gap"`. */
  action?: { label: string; href: string };
  /** Which profile step would resolve an `unknown` caused by a missing input. */
  missingProfileStep?: string;
}

/** Normalises Directus' free-text yes/no columns. */
function requiredFlag(text: string | null | undefined): boolean | null {
  if (!text) return null;
  const value = String(text).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["required", "yes", "true"].includes(value)) return true;
  if (["not_required", "no", "false", "none"].includes(value)) return false;
  return null;
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / 86_400_000);
}

/**
 * Annual tuition, read from the same place the rest of the program page reads.
 *
 * `cost_aid.tuition_amount` is ALWAYS null — lib/data.ts never populates it,
 * because the value lives on the application-requirements cycle record and
 * reaches the DTO through `display.application.tuition_annual`. Reading
 * cost_aid alone would make the checklist permanently report "暂未收录" while
 * the decision bar two inches above it showed a number.
 */
export function programTuition(program: PublicProgramDto): {
  amount: number | null;
  currency: string;
} {
  const raw = program.display.application?.tuition_annual;
  const parsed = raw === null || raw === undefined || raw === "" ? null : Number(raw);
  const amount =
    parsed !== null && Number.isFinite(parsed)
      ? parsed
      : program.cost_aid.tuition_amount;
  return {
    amount,
    currency:
      program.display.application?.tuition_currency ?? program.cost_aid.currency,
  };
}

/** Freshness for the program: the most recent source access date. */
export function programLastChecked(program: PublicProgramDto): string | null {
  const dates = program.sources
    .map((source) => source.accessed_at)
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? null;
}

/** Best matching source for a requirement kind, so a row can cite something. */
function evidenceFor(
  program: PublicProgramDto,
  kind: RequirementKind,
): RequirementEvidence | undefined {
  const preferred: Record<RequirementKind, string[]> = {
    language: ["official_language_page", "official_admissions_page"],
    prescreen: ["official_audition_page", "official_admissions_page"],
    audition: ["official_audition_page", "official_admissions_page"],
    documents: ["official_admissions_page", "official_program_page"],
    deadline: ["official_admissions_page", "official_program_page"],
    cost: ["official_tuition_page", "official_admissions_page"],
  };

  for (const type of preferred[kind]) {
    const source = program.sources.find((entry) => entry.source_type === type);
    if (source) {
      return {
        title: source.source_title,
        url: source.source_url,
        accessedAt: source.accessed_at,
      };
    }
  }
  const fallback = program.sources[0];
  return fallback
    ? {
        title: fallback.source_title,
        url: fallback.source_url,
        accessedAt: fallback.accessed_at,
      }
    : undefined;
}

/**
 * IELTS requirement vs the learner's own figures.
 *
 * Both learner-side numbers come from the learner: the score they reported and
 * the target they set. Only the reported score decides the state — the target
 * rides along so the meter can show it, never so it can satisfy a requirement.
 *
 * The raw requirement string is carried through untouched: "6.5 (no band below
 * 6.0)" has a section requirement the meter cannot express, and dropping it
 * would misrepresent the requirement as easier than it is.
 */
export function ieltsGap(
  program: PublicProgramDto,
  profile: ProfileV2 | null,
): BandGap {
  const test = program.language_requirements.accepted_tests.find(
    (entry) => entry.test_name === "IELTS",
  );
  const required = parseBandScore(test?.minimum_score ?? null);
  const current = currentEnglishScore(profile);

  return toBandGap(required, current?.value ?? null, current?.source ?? null, {
    target: targetBand(profile),
    requirementText: test?.minimum_score ?? null,
  });
}

export function buildRequirementChecklist(
  program: PublicProgramDto,
  profile: ProfileV2 | null,
): RequirementItem[] {
  const lastCheckedAt = programLastChecked(program);
  const items: RequirementItem[] = [];

  /* ------------------------------ language ------------------------------ */
  const gap = ieltsGap(program, profile);
  const languageState: RequirementState =
    program.language_requirements.english_required === false
      ? "not_required"
      : gap.state === "no-requirement"
        ? "unknown"
        : // No self-reported score: the requirement is recorded but nothing on
          // the learner's side has been confirmed. Unknown, never a gap.
          gap.state === "unconfirmed"
          ? "unknown"
          : gap.state === "below"
            ? "gap"
            : "satisfied";

  items.push({
    key: "language.ielts",
    kind: "language",
    title: "语言成绩",
    titleEn: "English Language",
    state: languageState,
    summary:
      program.language_requirements.english_required === false
        ? "不要求英语成绩"
        : gap.required !== null
          ? `IELTS ${gap.required.toFixed(1)} 要求${
              gap.current !== null
                ? ` · 你填写的 ${gap.current.toFixed(1)}`
                : " · 待确认"
            }`
          : program.language_requirements.accepted_tests.length > 0
            ? program.language_requirements.accepted_tests
                .map((test) => test.test_name)
                .join(" / ")
            : null,
    detail: program.language_requirements.waiver_policy,
    evidence: evidenceFor(program, "language"),
    lastCheckedAt,
    action:
      languageState === "gap"
        ? {
            label: "去雅思实验室提分",
            href: `/ielts-lab/suite?target=${gap.required ?? ""}&from=program:${program.id}`,
          }
        : undefined,
    missingProfileStep: gap.state === "unconfirmed" ? "english" : undefined,
  });

  /* ------------------------------ prescreen ----------------------------- */
  const prescreenRequired = requiredFlag(
    program.prescreen?.required_text ?? null,
  );
  const prescreenDeadline = program.deadline.prescreening_deadline;
  items.push({
    key: "prescreen",
    kind: "prescreen",
    title: "预筛选",
    titleEn: "Prescreening",
    state:
      prescreenRequired === false
        ? "not_required"
        : prescreenRequired === true
          ? "gap"
          : "unknown",
    summary:
      prescreenRequired === false
        ? "不需要预筛选"
        : prescreenRequired === true
          ? prescreenDeadline
            ? `需要 · 截止 ${prescreenDeadline}`
            : "需要"
          : null,
    detail:
      [
        program.prescreen?.video_requirements,
        program.prescreen?.file_format_requirements,
        program.prescreen?.repertoire,
      ]
        .filter(Boolean)
        .join("\n\n") || null,
    evidence: evidenceFor(program, "prescreen"),
    lastCheckedAt,
  });

  /* ------------------------------- audition ----------------------------- */
  const auditionRequired = requiredFlag(program.audition?.required_text ?? null);
  items.push({
    key: "audition",
    kind: "audition",
    title: "现场试音",
    titleEn: "Audition",
    state:
      auditionRequired === false
        ? "not_required"
        : auditionRequired === true
          ? "gap"
          : "unknown",
    summary:
      auditionRequired === false
        ? "不需要试音"
        : auditionRequired === true
          ? program.audition?.format ?? "需要"
          : null,
    detail:
      [
        program.audition?.repertoire,
        program.audition?.legacy_repertoire_summary,
        program.audition?.accompaniment_requirements,
        program.audition?.interview_or_callback_requirements,
      ]
        .filter(Boolean)
        .join("\n\n") || null,
    evidence: evidenceFor(program, "audition"),
    lastCheckedAt,
  });

  /* ------------------------------ documents ----------------------------- */
  const application = program.application;
  const materials = application?.required_materials ?? [];
  const documentBits = [
    application?.resume_required,
    application?.essay_required,
    application?.recommendation_letters,
    application?.transcript_requirements,
    application?.portfolio_required,
  ].filter(Boolean);

  items.push({
    key: "documents",
    kind: "documents",
    title: "申请材料",
    titleEn: "Application Materials",
    state:
      materials.length > 0 || documentBits.length > 0 ? "gap" : "unknown",
    summary:
      materials.length > 0
        ? `${materials.length} 项材料`
        : documentBits.length > 0
          ? `${documentBits.length} 项要求`
          : null,
    detail:
      materials.length > 0
        ? materials.map((item) => `- ${item}`).join("\n")
        : documentBits.join("\n\n") || null,
    evidence: evidenceFor(program, "documents"),
    lastCheckedAt,
  });

  /* ------------------------------- deadline ----------------------------- */
  const applicationDeadline = program.deadline.application_deadline;
  const days = daysUntil(applicationDeadline);
  items.push({
    key: "deadline",
    kind: "deadline",
    title: "申请截止",
    titleEn: "Deadline",
    state:
      applicationDeadline === null
        ? "unknown"
        : days !== null && days < 0
          ? "gap"
          : "satisfied",
    summary: applicationDeadline
      ? days !== null && days < 0
        ? `${applicationDeadline}（已过）`
        : `${applicationDeadline}${days !== null ? ` · 还有 ${days} 天` : ""}`
      : null,
    detail: program.deadline.notes,
    evidence: evidenceFor(program, "deadline"),
    lastCheckedAt,
  });

  /* --------------------------------- cost ------------------------------- */
  const budgetCeiling = profile?.geography.budgetCeilingUsd ?? null;
  const { amount: tuition, currency } = programTuition(program);
  items.push({
    key: "cost",
    kind: "cost",
    title: "学费预算",
    titleEn: "Tuition",
    state:
      tuition === null
        ? "unknown"
        : budgetCeiling === null
          ? "unknown"
          : tuition <= budgetCeiling
            ? "satisfied"
            : "gap",
    summary:
      tuition !== null
        ? `${currency} ${tuition.toLocaleString()} /年`
        : null,
    detail: program.cost_aid.notes,
    evidence: evidenceFor(program, "cost"),
    lastCheckedAt,
    missingProfileStep:
      tuition !== null && budgetCeiling === null ? "geography" : undefined,
  });

  return items;
}

/** Worst state present, used as the panel's overall verdict. */
export function overallState(items: RequirementItem[]): RequirementState {
  if (items.some((item) => item.state === "gap")) return "gap";
  if (items.some((item) => item.state === "unknown")) return "unknown";
  return "satisfied";
}

/** Counts for the school-level fit strip. */
export function countStates(
  items: RequirementItem[],
): Record<RequirementState, number> {
  const counts: Record<RequirementState, number> = {
    satisfied: 0,
    gap: 0,
    unknown: 0,
    not_required: 0,
  };
  for (const item of items) counts[item.state] += 1;
  return counts;
}
