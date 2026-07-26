/**
 * Local-first student profile.
 *
 * Versioned from day one because this schema migrates to server sync in a
 * later phase, and an unversioned blob in thousands of browsers is not
 * migratable. Every field is optional in spirit — a profile where all five
 * steps were skipped is valid, and the surfaces that read it must degrade to
 * "待确认" rather than pretending.
 *
 * Deliberately holds NOTHING identifying: no name, no email, no birthdate.
 * Instrument and country are preferences, not identity.
 */
import type { DegreeLevel } from "@/data/types";

export const PROFILE_SCHEMA_VERSION = 1;

export type ProfileStepId =
  | "discipline"
  | "target"
  | "geography"
  | "academic"
  | "english";

export const PROFILE_STEPS: ProfileStepId[] = [
  "discipline",
  "target",
  "geography",
  "academic",
  "english",
];

export type StepState = "pristine" | "answered" | "skipped";

export type BudgetBand =
  | "lt_20k"
  | "20_40k"
  | "40_60k"
  | "60_80k"
  | "gt_80k"
  | "unsure";

/** USD ceiling implied by each band; null when the learner is unsure. */
export const BUDGET_CEILING_USD: Record<BudgetBand, number | null> = {
  lt_20k: 20_000,
  "20_40k": 40_000,
  "40_60k": 60_000,
  "60_80k": 80_000,
  gt_80k: null,
  unsure: null,
};

export const BUDGET_LABELS: Record<BudgetBand, string> = {
  lt_20k: "2 万美元以下",
  "20_40k": "2–4 万美元",
  "40_60k": "4–6 万美元",
  "60_80k": "6–8 万美元",
  gt_80k: "8 万美元以上",
  unsure: "还没想好",
};

export type GpaBand = "lt_3_0" | "3_0_3_4" | "3_5_3_7" | "gt_3_7" | "unsure";

export const GPA_LABELS: Record<GpaBand, string> = {
  lt_3_0: "3.0 以下",
  "3_0_3_4": "3.0–3.4",
  "3_5_3_7": "3.5–3.7",
  gt_3_7: "3.7 以上",
  unsure: "不确定",
};

export type EnglishTest = "IELTS" | "TOEFL" | "Duolingo" | "none";

export interface LabEstimate {
  band: number;
  /** Always shown beside the band — an estimate without its sample is a claim. */
  questionCount: number;
  recordCount: number;
  computedAt: string;
  tableVersion: string;
}

export interface ProfileV1 {
  schemaVersion: 1;
  /** Local and non-identifying. Never a fingerprint. */
  profileId: string;
  createdAt: string;
  updatedAt: string;

  discipline: {
    /** Directus `field_name` values — the vocabulary /search already filters on. */
    fieldSlugs: string[];
    /** The only free-text input in the whole flow. */
    instrument: string | null;
  };

  target: {
    /** Directus degree slugs: bm | mm | dma | gd | ad. */
    degreeSlugs: string[];
    /** "2027-fall" | "2028-fall" | null (未定). */
    entryTerm: string | null;
  };

  geography: {
    /** Country names as they appear in `School.country` — today's join key. */
    countries: string[];
    budgetBand: BudgetBand | null;
    budgetCeilingUsd: number | null;
  };

  academic: {
    currentLevel: DegreeLevel | null;
    graduationYear: number | null;
    gpaBand: GpaBand | null;
  };

  english: {
    hasScore: boolean | null;
    test: EnglishTest | null;
    /** The figure compared against requirements. */
    currentOverall: number | null;
    /** Where currentOverall came from. Rendered in the UI, never hidden. */
    currentSource: "self_reported" | "lab_estimate" | null;
    targetOverall: number | null;
    /** Written only by the explicit suite-result CTA. */
    labEstimate: LabEstimate | null;
  };

  steps: Record<ProfileStepId, StepState>;

  /** Dismissed nudges and action cards: id → ISO dismissal date. */
  nudges: Record<string, string>;
}

export function createEmptyProfile(now = new Date()): ProfileV1 {
  const iso = now.toISOString();
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    profileId: `p-${now.getTime().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    createdAt: iso,
    updatedAt: iso,
    discipline: { fieldSlugs: [], instrument: null },
    target: { degreeSlugs: [], entryTerm: null },
    geography: { countries: [], budgetBand: null, budgetCeilingUsd: null },
    academic: { currentLevel: null, graduationYear: null, gpaBand: null },
    english: {
      hasScore: null,
      test: null,
      currentOverall: null,
      currentSource: null,
      targetOverall: null,
      labEstimate: null,
    },
    steps: {
      discipline: "pristine",
      target: "pristine",
      geography: "pristine",
      academic: "pristine",
      english: "pristine",
    },
    nudges: {},
  };
}

export const STEP_TITLES: Record<ProfileStepId, string> = {
  discipline: "你主修什么？",
  target: "目标学位与入学学期",
  geography: "目标国家与预算",
  academic: "你的学术背景",
  english: "英语考试情况",
};

export const STEP_HINTS: Record<ProfileStepId, string> = {
  discipline: "可以多选，之后随时可改。",
  target: "用于筛选适合你的项目。",
  geography: "预算指每年学费，不含生活费。",
  academic: "用于判断申请资格，留空也可以。",
  english: "没有成绩也没关系，可以先填目标分数。",
};
