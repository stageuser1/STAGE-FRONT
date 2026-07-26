/**
 * Fit dimensions and the readiness algorithm.
 *
 * Four separately-reported dimensions, never a single blended number: a magic
 * score cannot be argued with, and the whole point of this surface is that a
 * learner can see exactly which requirement is in the way.
 *
 * A dimension with missing inputs scores `null`, which renders as 待确认 and a
 * hatched bar — NOT zero. A missing fact and a failed check must never look
 * the same.
 */
import type { PublicProgramDto } from "@/data/types";
import type { ProfileV1 } from "../profile/types.ts";
import {
  buildRequirementChecklist,
  ieltsGap,
  programTuition,
  type RequirementItem,
} from "./requirements.ts";

export const READINESS_ALGORITHM_VERSION = "readiness-v1";

export const READINESS_RULE_SENTENCE =
  "按语言成绩、剩余时间、材料完整度、预算四个维度，与该项目公开收录的要求逐项比对；" +
  "任何一项缺少数据时不计分，并标注为「待确认」，不会用猜测填补。";

export type DimensionKey = "language" | "timing" | "materials" | "budget";

export interface FitDimension {
  key: DimensionKey;
  label: string;
  /** 0–1, or null when an input is missing. Null is NOT zero. */
  score: number | null;
  detail: string;
  /** Profile step that would resolve a null score. */
  missingProfileStep?: string;
}

const LABELS: Record<DimensionKey, string> = {
  language: "语言",
  timing: "时间",
  materials: "材料",
  budget: "预算",
};

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / 86_400_000);
}

export function scoreDimensions(
  program: PublicProgramDto,
  profile: ProfileV1 | null,
  checklist?: RequirementItem[],
): FitDimension[] {
  const items = checklist ?? buildRequirementChecklist(program, profile);

  /* ------------------------------- language ----------------------------- */
  const gap = ieltsGap(program, profile);
  let languageScore: number | null = null;
  let languageDetail = "该项目未收录语言要求";
  if (program.language_requirements.english_required === false) {
    languageScore = 1;
    languageDetail = "不要求英语成绩";
  } else if (gap.required !== null && gap.current !== null) {
    // A full band short scores 0.5; two bands short scores 0. Linear, so the
    // meter moves visibly as a learner improves.
    languageScore =
      gap.current >= gap.required
        ? 1
        : Math.max(0, 1 - (gap.required - gap.current) / 2);
    languageDetail = `要求 ${gap.required.toFixed(1)} · 你的 ${gap.current.toFixed(1)}${
      gap.currentSource === "lab_estimate" ? "（估算）" : ""
    }`;
  } else if (gap.required !== null) {
    languageDetail = `要求 ${gap.required.toFixed(1)} · 你还没有填写成绩`;
  }

  /* -------------------------------- timing ------------------------------ */
  const days = daysUntil(program.deadline.application_deadline);
  let timingScore: number | null = null;
  let timingDetail = "该项目未收录申请截止日期";
  if (days !== null) {
    timingScore = days < 0 ? 0 : days > 180 ? 1 : days > 90 ? 0.6 : days > 30 ? 0.3 : 0.1;
    timingDetail =
      days < 0 ? "申请已截止" : `距离申请截止还有 ${days} 天`;
  }

  /* ------------------------------ materials ----------------------------- */
  const materialItems = items.filter((item) =>
    ["prescreen", "audition", "documents"].includes(item.kind),
  );
  const known = materialItems.filter((item) => item.state !== "unknown");
  const materialsScore =
    known.length === 0
      ? null
      : known.filter(
          (item) => item.state === "satisfied" || item.state === "not_required",
        ).length / known.length;
  const materialsDetail =
    known.length === 0
      ? "预筛选、试音与材料要求暂未收录"
      : `${known.length} 项要求中，${known.filter((i) => i.state === "not_required").length} 项不需要`;

  /* -------------------------------- budget ------------------------------ */
  const ceiling = profile?.geography.budgetCeilingUsd ?? null;
  const { amount: tuition, currency } = programTuition(program);
  let budgetScore: number | null = null;
  let budgetDetail = "该项目未收录学费";
  if (tuition !== null && ceiling !== null) {
    budgetScore =
      tuition <= ceiling ? 1 : Math.max(0, 1 - (tuition - ceiling) / ceiling);
    budgetDetail = `学费 ${currency} ${tuition.toLocaleString()} · 你的预算上限 ${ceiling.toLocaleString()}`;
  } else if (tuition !== null) {
    budgetDetail = `学费 ${currency} ${tuition.toLocaleString()} · 你还没有填写预算`;
  }

  return [
    {
      key: "language",
      label: LABELS.language,
      score: languageScore,
      detail: languageDetail,
      missingProfileStep:
        languageScore === null && gap.required !== null ? "english" : undefined,
    },
    { key: "timing", label: LABELS.timing, score: timingScore, detail: timingDetail },
    {
      key: "materials",
      label: LABELS.materials,
      score: materialsScore,
      detail: materialsDetail,
    },
    {
      key: "budget",
      label: LABELS.budget,
      score: budgetScore,
      detail: budgetDetail,
      missingProfileStep:
        budgetScore === null && tuition !== null ? "geography" : undefined,
    },
  ];
}

/** Overall readiness label from the dimension set. */
export function readinessLabel(
  dimensions: FitDimension[],
  hasProfile: boolean,
): "building" | "ready" | "gaps" | "stale" {
  if (!hasProfile) return "building";
  const scored = dimensions.filter((d) => d.score !== null);
  if (scored.length === 0) return "building";
  return scored.every((d) => (d.score ?? 0) >= 0.99) ? "ready" : "gaps";
}
