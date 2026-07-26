/**
 * Per-program readiness for the dashboard.
 *
 * Computed from the SAVED SNAPSHOT rather than a live fetch: the dashboard
 * must render with zero Directus round-trips, and a shortlist of twenty
 * programs cannot each pull a DTO. The snapshot's age is carried through so
 * the UI can admit when it might be out of date instead of quietly asserting
 * stale numbers.
 */
import { parseBandScore } from "../ielts/band.ts";
import { currentEnglishScore } from "../profile/derive.ts";
import type { ProfileV1 } from "../profile/types.ts";
import {
  SNAPSHOT_STALE_DAYS,
  snapshotAgeDays,
  type SavedProgramV1,
} from "../profile/saved.ts";

export const READINESS_ALGORITHM_VERSION = "readiness-v1";

export interface ReadinessDimension {
  key: "language" | "timing" | "materials" | "budget";
  label: string;
  /** 0–1, or null when an input is missing. Null renders hatched, never 0. */
  score: number | null;
  note: string;
}

export interface ProgramReadiness {
  programId: string;
  schoolId: string;
  programLabel: string;
  schoolName: string;
  dimensions: ReadinessDimension[];
  overall: "building" | "ready" | "gaps" | "stale";
  snapshotAgeDays: number | null;
  stale: boolean;
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / 86_400_000);
}

export function buildReadiness(
  saved: SavedProgramV1[],
  profile: ProfileV1 | null,
): ProgramReadiness[] {
  const current = currentEnglishScore(profile);
  const ceiling = profile?.geography.budgetCeilingUsd ?? null;

  return saved.map((entry) => {
    const snapshot = entry.snapshot;
    const required = parseBandScore(snapshot.ieltsMinimum);

    const language: ReadinessDimension = {
      key: "language",
      label: "语言",
      score:
        required === null || current === null
          ? null
          : current.value >= required
            ? 1
            : Math.max(0, 1 - (required - current.value) / 2),
      note:
        required === null
          ? "该项目未收录语言要求"
          : current === null
            ? `要求 ${required.toFixed(1)} · 你还没有填写成绩`
            : `要求 ${required.toFixed(1)} · 你的 ${current.value.toFixed(1)}${
                current.source === "lab_estimate" ? "（估算）" : ""
              }`,
    };

    const days = daysUntil(snapshot.applicationDeadline);
    const timing: ReadinessDimension = {
      key: "timing",
      label: "时间",
      score:
        days === null
          ? null
          : days < 0
            ? 0
            : days > 180
              ? 1
              : days > 90
                ? 0.6
                : days > 30
                  ? 0.3
                  : 0.1,
      note:
        days === null
          ? "未收录申请截止日期"
          : days < 0
            ? "申请已截止"
            : `还有 ${days} 天`,
    };

    // The snapshot deliberately does not carry the full requirement set, so
    // materials is reported as unknown rather than guessed at. The program
    // page remains the authority.
    const materials: ReadinessDimension = {
      key: "materials",
      label: "材料",
      score: snapshot.prescreeningDeadline ? 0.5 : null,
      note: snapshot.prescreeningDeadline
        ? `预筛选截止 ${snapshot.prescreeningDeadline}`
        : "材料要求见项目页",
    };

    const tuition = snapshot.tuitionAnnual;
    const budget: ReadinessDimension = {
      key: "budget",
      label: "预算",
      score:
        tuition === null || ceiling === null
          ? null
          : tuition <= ceiling
            ? 1
            : Math.max(0, 1 - (tuition - ceiling) / ceiling),
      note:
        tuition === null
          ? "未收录学费"
          : ceiling === null
            ? `学费 ${snapshot.tuitionCurrency ?? ""} ${tuition.toLocaleString()} · 你还没有填写预算`
            : `学费 ${snapshot.tuitionCurrency ?? ""} ${tuition.toLocaleString()} · 预算上限 ${ceiling.toLocaleString()}`,
    };

    const dimensions = [language, timing, materials, budget];
    const scored = dimensions.filter((d) => d.score !== null);
    const age = snapshotAgeDays(entry);
    const stale = age !== null && age > SNAPSHOT_STALE_DAYS;

    return {
      programId: entry.programId,
      schoolId: entry.schoolId,
      programLabel:
        snapshot.programNameZh ?? snapshot.programName ?? entry.programId,
      schoolName: snapshot.schoolName,
      dimensions,
      overall: !profile
        ? "building"
        : stale
          ? "stale"
          : scored.length === 0
            ? "building"
            : scored.every((d) => (d.score ?? 0) >= 0.99)
              ? "ready"
              : "gaps",
      snapshotAgeDays: age,
      stale,
    };
  });
}

export interface DeadlineNode {
  id: string;
  programId: string;
  schoolId: string;
  programLabel: string;
  kind: "application" | "prescreening" | "audition";
  date: string;
  daysUntil: number;
}

const KIND_LABELS: Record<DeadlineNode["kind"], string> = {
  application: "申请截止",
  prescreening: "预筛选截止",
  audition: "试音日期",
};

export function deadlineLabel(kind: DeadlineNode["kind"]): string {
  return KIND_LABELS[kind];
}

/**
 * Upcoming deadlines across saved programs, nearest first.
 *
 * NOTE: the `audition` node type can never populate today — `lib/data.ts`
 * hard-codes `Deadline.audition_date` to null because no Directus column
 * supplies it. The timeline legend says so rather than implying that no
 * program has an audition date.
 */
export function upcomingDeadlines(
  saved: SavedProgramV1[],
  windowDays = 90,
): DeadlineNode[] {
  const nodes: DeadlineNode[] = [];

  for (const entry of saved) {
    const label =
      entry.snapshot.programNameZh ?? entry.snapshot.programName ?? entry.programId;
    const candidates: Array<[DeadlineNode["kind"], string | null]> = [
      ["application", entry.snapshot.applicationDeadline],
      ["prescreening", entry.snapshot.prescreeningDeadline],
      ["audition", entry.snapshot.auditionDate],
    ];

    for (const [kind, date] of candidates) {
      const days = daysUntil(date);
      if (date === null || days === null) continue;
      if (days < 0 || days > windowDays) continue;
      nodes.push({
        id: `${entry.programId}-${kind}`,
        programId: entry.programId,
        schoolId: entry.schoolId,
        programLabel: label,
        kind,
        date,
        daysUntil: days,
      });
    }
  }

  return nodes.sort((a, b) => a.daysUntil - b.daysUntil);
}
