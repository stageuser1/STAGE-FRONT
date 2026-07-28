"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { Card, EmptyNote, StatTile } from "@/components/ielts/ui";
import { buildActions, dismissedActions, type ActionItem } from "@/lib/dashboard/actions";
import {
  READINESS_ALGORITHM_VERSION,
  buildReadiness,
  upcomingDeadlines,
  type ProgramReadiness,
} from "@/lib/dashboard/readiness";
import { READINESS_RULE_SENTENCE } from "@/lib/fit/dimensions";
import { buildQuestionTypeStats, weakestType } from "@/lib/ielts/analytics";
import { computeStats, loadRecords } from "@/lib/ielts/storage";
import type { PracticeRecord } from "@/lib/ielts/types";
import { wrongbookCount } from "@/lib/ielts/wrongbook";
import { currentEnglishScore, profileCompleteness } from "@/lib/profile/derive";
import { loadSaved, type SavedProgramV1 } from "@/lib/profile/saved";
import { dismissNudge, loadProfile } from "@/lib/profile/storage";
import {
  ENGLISH_SUBJECTS,
  ENGLISH_SUBJECT_LABELS,
  type ProfileV2,
} from "@/lib/profile/types";
import { DeadlineTimeline } from "./DeadlineTimeline";

/** Attempts per side of the trend comparison. */
const TREND_BLOCK = 5;

/**
 * Accuracy of the most recent attempts against the block before them.
 *
 * Native data compared with itself — no conversion, no score. Returns null
 * until there are enough attempts on both sides for the comparison to mean
 * anything; a trend drawn from one attempt is noise wearing a number.
 */
function accuracyTrend(
  records: PracticeRecord[],
  block = TREND_BLOCK,
): { recent: number; previous: number; delta: number; sample: number } | null {
  if (records.length < block * 2) return null;
  const mean = (slice: PracticeRecord[]) =>
    slice.reduce((sum, record) => sum + record.accuracy, 0) / slice.length;
  // Records are stored newest-first.
  const recent = Math.round(mean(records.slice(0, block)) * 100);
  const previous = Math.round(mean(records.slice(block, block * 2)) * 100);
  return { recent, previous, delta: recent - previous, sample: block };
}

/**
 * Product home (P-06).
 *
 * Every number here is derived from local state — the page makes ZERO network
 * requests. The action feed is a pure function of profile + saves + records,
 * so a card cannot disagree with the surface it points at, and nothing is ever
 * marked "done": a card disappears when its condition stops holding.
 */
export function DashboardView() {
  const [profile, setProfile] = useState<ProfileV2 | null>(null);
  const [saved, setSaved] = useState<SavedProgramV1[]>([]);
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setSaved(loadSaved());
    setRecords(loadRecords());
  }, []);

  const weakest = useMemo(
    () => (records ? weakestType(buildQuestionTypeStats(records)) : null),
    [records],
  );

  const input = useMemo(
    () => ({ profile, saved, records: records ?? [], weakest }),
    [profile, saved, records, weakest],
  );

  const actions = useMemo(() => buildActions(input), [input]);
  const hidden = useMemo(() => dismissedActions(input), [input]);
  const readiness = useMemo(() => buildReadiness(saved, profile), [saved, profile]);
  const deadlines = useMemo(() => upcomingDeadlines(saved), [saved]);
  const trend = useMemo(
    () => (records ? accuracyTrend(records) : null),
    [records],
  );
  const stats = useMemo(
    () => (records && records.length > 0 ? computeStats(records) : null),
    [records],
  );
  const mistakes = useMemo(
    () => (records ? wrongbookCount(records) : 0),
    [records],
  );
  const completeness = profileCompleteness(profile);
  const savedScore = currentEnglishScore(profile)?.value ?? null;
  // Every figure the learner set for themselves, overall first.
  const targets = profile?.english.targets ?? null;
  const targetLine = [
    profile?.english.targetOverall != null
      ? `总分 ${profile.english.targetOverall.toFixed(1)}`
      : null,
    ...ENGLISH_SUBJECTS.map((subject) =>
      targets?.[subject] != null
        ? `${ENGLISH_SUBJECT_LABELS[subject]} ${targets[subject]?.toFixed(1)}`
        : null,
    ),
  ]
    .filter(Boolean)
    .join(" · ");

  // localStorage is unreadable until after mount: null means loading, which is
  // a different state from "you have nothing".
  if (records === null) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-stage-md bg-stage-bg-soft" />
        <div className="h-40 animate-pulse rounded-stage-md bg-stage-bg-soft" />
        <div className="h-40 animate-pulse rounded-stage-md bg-stage-bg-soft" />
      </div>
    );
  }

  const isEmpty = !profile && saved.length === 0 && records.length === 0;
  if (isEmpty) return <Onboarding />;

  return (
    <div className="space-y-6">
      <section aria-labelledby="next-actions">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold" id="next-actions">
            下一步
          </h2>
          <Link
            className="text-xs text-stage-fg-muted underline-offset-2 hover:text-stage-fg hover:underline"
            href="/profile?return=/dashboard"
          >
            档案完成度 {Math.round(completeness * 100)}% · 编辑
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {actions.map((action) => (
            <ActionCard
              action={action}
              key={action.id}
              onDismiss={
                action.kind === "all_clear"
                  ? undefined
                  : () => {
                      dismissNudge(action.id);
                      setProfile(loadProfile());
                    }
              }
            />
          ))}
        </div>
        {hidden.length > 0 ? (
          <details
            className="mt-2"
            onToggle={(event) =>
              setShowDismissed((event.currentTarget as HTMLDetailsElement).open)
            }
          >
            <summary className="cursor-pointer list-none text-xs text-stage-fg-muted underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
              已隐藏的建议（{hidden.length}）{showDismissed ? "▴" : "▾"}
            </summary>
            <ul className="mt-2 space-y-1">
              {hidden.map((item) => (
                <li className="text-xs text-stage-fg-muted" key={item.id}>
                  {item.title} ·{" "}
                  <Link
                    className="text-stage-primary underline-offset-2 hover:underline"
                    href={item.cta.href}
                  >
                    {item.cta.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section aria-labelledby="readiness">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold" id="readiness">
            申请准备度
          </h2>
          <details>
            <summary className="cursor-pointer list-none text-xs text-stage-fg-muted underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
              规则说明 · {READINESS_ALGORITHM_VERSION} ▾
            </summary>
            <p className="mt-1.5 max-w-prose text-xs leading-5 text-stage-fg-muted">
              {READINESS_RULE_SENTENCE}
            </p>
          </details>
        </div>
        {readiness.length === 0 ? (
          <EmptyNote>
            还没有收藏的项目。在项目页点击「加入我的清单」后，这里会显示准备度。
          </EmptyNote>
        ) : (
          <ul className="space-y-2">
            {readiness.map((program) => (
              <li key={program.programId}>
                <ReadinessMeter program={program} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="deadlines">
          <h2 className="mb-3 text-lg font-semibold" id="deadlines">
            截止时间线
            <span className="ml-2 text-xs font-normal text-stage-fg-muted">
              未来 90 天
            </span>
          </h2>
          <DeadlineTimeline nodes={deadlines} />
        </section>

        <section aria-labelledby="ielts-snapshot">
          <h2 className="mb-3 text-lg font-semibold" id="ielts-snapshot">
            雅思快照
          </h2>
          <Card>
            {records.length === 0 ? (
              <>
                <EmptyNote>还没有练习记录。</EmptyNote>
                <Link
                  className="mt-3 inline-flex rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark"
                  href="/ielts-lab"
                >
                  开始练习
                </Link>
              </>
            ) : (
              <>
                {/* Native practice data only (ruling C1): what was answered,
                    how accurately, and where it is moving. Nothing here is
                    converted into a score. */}
                <dl className="grid grid-cols-2 gap-3">
                  <StatTile
                    hint={`共 ${records.length} 次练习`}
                    label="平均正确率"
                    value={stats ? `${Math.round(stats.averageAccuracy * 100)}%` : "—"}
                  />
                  <StatTile
                    hint={
                      trend
                        ? `最近 ${trend.sample} 次 ${trend.recent}% · 之前 ${trend.sample} 次 ${trend.previous}%`
                        : `练满 ${TREND_BLOCK * 2} 次后开始对比`
                    }
                    label="正确率趋势"
                    value={
                      trend
                        ? trend.delta === 0
                          ? "持平"
                          : `${trend.delta > 0 ? "+" : "−"}${Math.abs(trend.delta)} 个百分点`
                        : "—"
                    }
                  />
                </dl>

                {weakest ? (
                  <p className="mt-3 text-xs text-stage-fg-muted">
                    最弱题型：{weakest.label} {weakest.accuracy}%（作答{" "}
                    {weakest.attempted} 题）
                  </p>
                ) : null}

                {/* The learner's own numbers, labelled as theirs. STAGE never
                    writes either of them. */}
                {savedScore !== null ? (
                  <p className="mt-3 text-xs text-stage-fg-muted">
                    你填写的成绩：{savedScore.toFixed(1)}
                  </p>
                ) : null}
                {targetLine ? (
                  <p className="mt-1 text-xs text-stage-fg-muted">
                    你自己设定的目标分数：{targetLine}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-stage-fg-muted">
                    还没有设定目标分数，可以在 IELTS Lab 总览页自己填写。
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    className="rounded-stage-md border border-stage-border px-3 py-1.5 text-xs transition-colors hover:border-stage-primary"
                    href="/ielts-lab"
                  >
                    继续练习
                  </Link>
                  <Link
                    className="flex items-center gap-1.5 rounded-stage-md border border-stage-border px-3 py-1.5 text-xs transition-colors hover:border-stage-primary"
                    href="/ielts-lab/mistakes"
                  >
                    错题本
                    {mistakes > 0 ? (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[11px] font-medium tabular-nums text-amber-700">
                        {mistakes}
                      </span>
                    ) : null}
                  </Link>
                </div>
              </>
            )}
          </Card>
        </section>
      </div>

      <p className="text-xs text-stage-fg-muted">
        档案、收藏与练习记录都保存在本机浏览器，未上传到服务器。
      </p>
    </div>
  );
}

function ActionCard({
  action,
  onDismiss,
}: {
  action: ActionItem;
  onDismiss?: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-stage-md border border-stage-border bg-stage-bg p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-stage-sm bg-stage-primary/10 text-stage-primary">
          <Icon name={action.icon as IconName} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-5">{action.title}</h3>
          {/* The why-line always cites its evidence — a requirement and its
              freshness, or a statistic and its sample size. */}
          <p className="mt-1 text-xs leading-5 text-stage-fg-muted">
            {action.why}
          </p>
        </div>
        {onDismiss ? (
          <button
            aria-label={`忽略：${action.title}`}
            className="shrink-0 text-stage-fg-muted transition-colors hover:text-stage-fg"
            onClick={onDismiss}
            type="button"
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </div>
      <Link
        className="mt-3 inline-flex h-9 items-center justify-center rounded-stage-md bg-stage-primary px-3 text-xs font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover sm:self-start"
        href={action.cta.href}
      >
        {action.cta.label}
      </Link>
    </article>
  );
}

function ReadinessMeter({ program }: { program: ProgramReadiness }) {
  return (
    <div className="rounded-stage-md border border-stage-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline"
          href={`/schools/${program.schoolId}/programs/${program.programId}`}
        >
          {program.programLabel}
          <span className="ml-2 text-xs font-normal text-stage-fg-muted">
            {program.schoolName}
          </span>
        </Link>
        <StatusChip
          state={
            program.overall === "ready"
              ? "satisfied"
              : program.overall === "gaps"
                ? "gap"
                : "unknown"
          }
          surface="app"
        />
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {program.dimensions.map((dimension) => (
          <div key={dimension.key}>
            <dt className="text-[11px] text-stage-fg-muted">{dimension.label}</dt>
            <dd
              aria-label={`${dimension.label}：${dimension.note}`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={
                dimension.score === null ? undefined : Math.round(dimension.score * 100)
              }
              aria-valuetext={dimension.note}
              className="mt-1 flex gap-0.5"
              role="meter"
              title={dimension.note}
            >
              {/* Four ticks, so a partial score is countable without a number.
                  A null score is hatched, NOT zero. */}
              {[0, 1, 2, 3].map((tick) => {
                const filled =
                  dimension.score !== null && dimension.score * 4 > tick;
                return (
                  <span
                    aria-hidden
                    className={`h-1.5 flex-1 rounded-full ${
                      dimension.score === null
                        ? "bg-stage-bg-soft ring-1 ring-inset ring-stage-border"
                        : filled
                          ? dimension.score >= 0.99
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                          : "bg-stage-bg-soft"
                    }`}
                    key={tick}
                  />
                );
              })}
            </dd>
          </div>
        ))}
      </dl>

      {program.stale ? (
        <p className="mt-2 text-[11px] text-amber-700">
          本机信息已保存 {program.snapshotAgeDays} 天，可能已更新 · 打开项目页刷新
        </p>
      ) : null}
    </div>
  );
}

/** First-run state: one card with three ordered steps, not four empty modules. */
function Onboarding() {
  const steps = [
    {
      icon: "user" as IconName,
      title: "建立档案",
      body: "5 个问题，约 2 分钟。之后每个项目都会显示与你的差距。",
      href: "/profile?return=/dashboard",
      label: "开始",
    },
    {
      icon: "bookmark" as IconName,
      title: "收藏感兴趣的项目",
      body: "在项目页点击「加入我的清单」，这里会跟踪它们的截止日期与准备度。",
      href: "/schools",
      label: "浏览院校",
    },
    {
      icon: "target" as IconName,
      title: "开始雅思练习",
      body: "练习记录保存在本机，正确率与最弱题型会显示在这里。",
      href: "/ielts-lab",
      label: "去实验室",
    },
  ];

  return (
    <Card
      subtitle="按顺序完成这三步，学习中心就会开始工作"
      title="欢迎来到学习中心"
    >
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            className="flex flex-wrap items-start gap-3 rounded-stage-md border border-stage-border p-3"
            key={step.title}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stage-primary/10 text-sm font-semibold text-stage-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Icon name={step.icon} size={15} />
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-stage-fg-muted">
                {step.body}
              </p>
            </div>
            <Link
              className="shrink-0 rounded-stage-md border border-stage-border px-3 py-1.5 text-xs transition-colors hover:border-stage-primary"
              href={step.href}
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-stage-fg-muted">
        所有数据保存在本机浏览器，未上传到服务器。
      </p>
    </Card>
  );
}
