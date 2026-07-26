/**
 * The dashboard's "what should I do next" feed.
 *
 * Every item is DERIVED, never stored. Nothing is marked "done": a card
 * disappears because the condition that produced it stopped being true, which
 * is the only way the feed can be guaranteed to agree with the surfaces it
 * points at.
 *
 * Every generator runs inside its own try/catch — one throwing generator
 * contributes zero items rather than taking the whole feed down.
 */
import { bandFromRecords } from "../ielts/band.ts";
import { wrongbookCount } from "../ielts/wrongbook.ts";
import type { PracticeRecord } from "../ielts/types.ts";
import { currentEnglishScore, firstPristineStep } from "../profile/derive.ts";
import type { ProfileV1 } from "../profile/types.ts";
import { parseBandScore } from "../ielts/band.ts";
import {
  SNAPSHOT_STALE_DAYS,
  snapshotAgeDays,
  type SavedProgramV1,
} from "../profile/saved.ts";

export type ActionKind =
  | "ielts_gap"
  | "deadline"
  | "profile_hole"
  | "weak_type"
  | "wrongbook"
  | "stale_data"
  | "all_clear";

export interface ActionItem {
  id: string;
  kind: ActionKind;
  icon: string;
  /** Imperative: "提高雅思 0.5 分", never "你的雅思偏低". */
  title: string;
  /** MUST cite its evidence: a requirement + freshness, or a stat + sample size. */
  why: string;
  cta: { label: string; href: string };
  priority: number;
}

export interface ActionInput {
  profile: ProfileV1 | null;
  saved: SavedProgramV1[];
  records: PracticeRecord[];
  /**
   * Weakest question type, computed by the caller.
   *
   * Injected rather than imported so this module stays free of the ~26KB
   * question-type index — the same reason `toPracticeRecord` takes a resolver.
   * It also keeps the generators unit-testable in isolation.
   */
  weakest?: { type: string; label: string; accuracy: number; attempted: number } | null;
}

type Generator = (input: ActionInput) => ActionItem[];

/** Highest IELTS requirement across the shortlist, and how many demand it. */
function ieltsDemand(saved: SavedProgramV1[]): {
  required: number | null;
  count: number;
} {
  let required: number | null = null;
  let count = 0;
  for (const entry of saved) {
    const value = parseBandScore(entry.snapshot.ieltsMinimum);
    if (value === null) continue;
    if (required === null || value > required) {
      required = value;
      count = 1;
    } else if (value === required) {
      count += 1;
    }
  }
  return { required, count };
}

const ieltsGapAction: Generator = ({ profile, saved, records }) => {
  const { required, count } = ieltsDemand(saved);
  if (required === null) return [];
  const current = currentEnglishScore(profile);
  const estimate = current ?? (bandFromRecords(records)
    ? { value: bandFromRecords(records)!.band, source: "lab_estimate" as const }
    : null);
  if (!estimate || estimate.value >= required) return [];

  const delta = Math.round((required - estimate.value) * 2) / 2;
  return [
    {
      id: "ielts_gap",
      kind: "ielts_gap",
      icon: "target",
      title: `提高雅思 ${delta.toFixed(1)} 分`,
      why: `${count} 个收藏项目要求 ${required.toFixed(1)} · 你的${
        estimate.source === "lab_estimate" ? "估算" : "成绩"
      } ${estimate.value.toFixed(1)}`,
      cta: { label: "去雅思实验室", href: "/ielts-lab/suite" },
      priority: 10,
    },
  ];
};

const deadlineAction: Generator = ({ saved }) => {
  const upcoming = saved
    .map((entry) => {
      const date = entry.snapshot.prescreeningDeadline ?? entry.snapshot.applicationDeadline;
      if (!date) return null;
      const days = Math.ceil(
        (new Date(`${date.slice(0, 10)}T00:00:00`).getTime() - Date.now()) /
          86_400_000,
      );
      return Number.isFinite(days) && days >= 0 ? { entry, date, days } : null;
    })
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((a, b) => a.days - b.days);

  const next = upcoming[0];
  if (!next || next.days > 90) return [];

  const label =
    next.entry.snapshot.programNameZh ?? next.entry.snapshot.programName;
  return [
    {
      id: `deadline-${next.entry.programId}`,
      kind: "deadline",
      icon: "calendar",
      title: `${next.days} 天后截止：${label}`,
      why: `${next.entry.snapshot.schoolName} · ${next.date}${
        next.entry.snapshot.lastCheckedAt
          ? ` · 核验于 ${next.entry.snapshot.lastCheckedAt}`
          : ""
      }`,
      cta: {
        label: "查看要求",
        href: `/schools/${next.entry.schoolId}/programs/${next.entry.programId}`,
      },
      priority: 5,
    },
  ];
};

const weakTypeAction: Generator = ({ records, weakest }) => {
  if (records.length === 0 || !weakest) return [];
  return [
    {
      id: `weak-${weakest.type}`,
      kind: "weak_type",
      icon: "trend",
      title: `练习你最弱的题型：${weakest.label}`,
      why: `正确率 ${weakest.accuracy}%（已作答 ${weakest.attempted} 题）`,
      cta: { label: "去题库", href: "/ielts-lab/browse" },
      priority: 30,
    },
  ];
};

const wrongbookAction: Generator = ({ records }) => {
  const count = wrongbookCount(records);
  if (count === 0) return [];
  return [
    {
      id: "wrongbook",
      kind: "wrongbook",
      icon: "flag",
      title: `复习 ${count} 篇还有错题的文章`,
      why: "按每篇最近一次作答统计，重做全对后自动移出",
      cta: { label: "打开错题本", href: "/ielts-lab/mistakes" },
      priority: 25,
    },
  ];
};

const profileHoleAction: Generator = ({ profile }) => {
  const step = firstPristineStep(profile);
  if (!step) return [];
  const labels: Record<string, string> = {
    discipline: "主修方向",
    target: "目标学位",
    geography: "国家与预算",
    academic: "学术背景",
    english: "英语成绩",
  };
  return [
    {
      id: `profile-${step}`,
      kind: "profile_hole",
      icon: "user",
      title: `补全档案：${labels[step] ?? step}`,
      why: profile
        ? "缺少这一项时，相关维度会显示为「待确认」而不计分"
        : "建立档案后才能比对每个项目的要求",
      cta: {
        label: profile ? "继续填写" : "建立档案",
        href: `/profile?return=/dashboard`,
      },
      priority: 20,
    },
  ];
};

const staleDataAction: Generator = ({ saved }) => {
  const stale = saved.filter((entry) => {
    const age = snapshotAgeDays(entry);
    return age !== null && age > SNAPSHOT_STALE_DAYS;
  });
  if (stale.length === 0) return [];
  const first = stale[0];
  return [
    {
      id: `stale-${first.programId}`,
      kind: "stale_data",
      icon: "clock",
      title: `刷新 ${stale.length} 个收藏项目的信息`,
      why: `本机缓存的信息已超过 ${SNAPSHOT_STALE_DAYS} 天，打开项目页即可刷新`,
      cta: {
        label: "打开项目",
        href: `/schools/${first.schoolId}/programs/${first.programId}`,
      },
      priority: 40,
    },
  ];
};

const GENERATORS: Generator[] = [
  deadlineAction,
  ieltsGapAction,
  profileHoleAction,
  wrongbookAction,
  weakTypeAction,
  staleDataAction,
];

export function buildActions(input: ActionInput, limit = 3): ActionItem[] {
  const items: ActionItem[] = [];

  for (const generate of GENERATORS) {
    try {
      items.push(...generate(input));
    } catch {
      // One broken generator must not empty the feed.
    }
  }

  const dismissed = input.profile?.nudges ?? {};
  const live = items
    .filter((item) => !dismissed[item.id])
    .sort((a, b) => a.priority - b.priority);

  if (live.length === 0) {
    // A complete, on-track learner gets a positive statement rather than an
    // empty region that reads like a failure to load.
    return [
      {
        id: "all_clear",
        kind: "all_clear",
        icon: "check",
        title: "目前没有需要立即处理的事项",
        why: "收藏更多项目或继续练习，这里会给出下一步建议",
        cta: { label: "浏览院校", href: "/schools" },
        priority: 100,
      },
    ];
  }

  return live.slice(0, limit);
}

/** Everything currently suppressed, so dismissal is recoverable. */
export function dismissedActions(input: ActionInput): ActionItem[] {
  const dismissed = input.profile?.nudges ?? {};
  const items: ActionItem[] = [];
  for (const generate of GENERATORS) {
    try {
      items.push(...generate(input));
    } catch {
      /* ignore */
    }
  }
  return items.filter((item) => dismissed[item.id]);
}
