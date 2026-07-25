"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, countByCategory } from "@/lib/ielts/catalog";
import { buildProgressIndex, pickRandomExam, practisedByCategory } from "@/lib/ielts/progress";
import {
  clearSession,
  loadSession,
  practiceHref,
  reviewHref,
  startEndless,
  type PracticeSession,
} from "@/lib/ielts/session";
import { computeStats, loadRecords } from "@/lib/ielts/storage";
import type { ExamCategory, ExamSummary, PracticeRecord } from "@/lib/ielts/types";
import { Card, EmptyNote, StatTile } from "./ui";

const CATEGORY_BLURB: Record<ExamCategory, string> = {
  P1: "篇幅最短，事实定位为主",
  P2: "论证结构，段落匹配偏多",
  P3: "学术论文，题型最复杂",
};

function accuracyPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(then).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

/**
 * IELTS Lab entry screen.
 *
 * The catalog used to be the landing page, which meant a returning learner met
 * 223 undifferentiated cards and no indication of what they had already done.
 * This answers the three questions the source project's overview answers on
 * open: where was I, what should I do next, and how far through am I.
 */
export function LabOverview({ exams }: { exams: ExamSummary[] }) {
  const router = useRouter();
  // localStorage and sessionStorage are unreadable until after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
    setSession(loadSession());
  }, []);

  const totals = useMemo(() => countByCategory(exams), [exams]);
  const progress = useMemo(
    () => buildProgressIndex(records ?? []),
    [records],
  );
  const practised = useMemo(
    () => practisedByCategory(exams, progress),
    [exams, progress],
  );
  const stats = useMemo(
    () => (records ? computeStats(records) : null),
    [records],
  );

  function startRandom(category?: ExamCategory) {
    const pick = pickRandomExam(exams, progress, { category });
    if (pick) router.push(practiceHref(pick.id));
  }

  function startEndlessMode() {
    const pick = pickRandomExam(exams, progress);
    if (!pick) return;
    startEndless(pick.id);
    router.push(practiceHref(pick.id, "endless"));
  }

  const recent = (records ?? []).slice(0, 5);
  const practisedTotal = progress.size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">雅思实验室</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          {exams.length} 篇真题阅读 · 完整还原考试环境 · 记录保存在本机
        </p>
      </header>

      {session ? (
        <ResumeBanner
          session={session}
          onDismiss={() => {
            clearSession();
            setSession(null);
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => startRandom()}
          className="rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover"
        >
          随机练习
        </button>
        <button
          type="button"
          onClick={startEndlessMode}
          className="rounded-stage-md border border-stage-border px-4 py-2 text-sm transition-colors hover:border-stage-primary hover:text-stage-fg"
        >
          无尽模式
        </button>
        <Link
          href="/ielts-lab/suite"
          className="rounded-stage-md border border-stage-border px-4 py-2 text-sm transition-colors hover:border-stage-primary hover:text-stage-fg"
        >
          套题模式
        </Link>
        <Link
          href="/ielts-lab/browse"
          className="rounded-stage-md border border-stage-border px-4 py-2 text-sm transition-colors hover:border-stage-primary hover:text-stage-fg"
        >
          浏览题库
        </Link>
      </div>

      {stats && stats.totalPractices > 0 ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="已练习题目" value={String(stats.totalPractices)} />
          <StatTile
            label="平均正确率"
            value={`${accuracyPercent(stats.averageAccuracy)}%`}
          />
          <StatTile
            label="学习时长"
            value={`${Math.round(stats.totalTimeSeconds / 60)} 分钟`}
          />
          <StatTile label="连续学习" value={`${stats.streakDays} 天`} />
        </dl>
      ) : null}

      <section aria-labelledby="category-heading">
        <h2 id="category-heading" className="mb-3 text-sm font-semibold">
          阅读分类
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              total={totals[category]}
              practised={practised[category]}
              onRandom={() => startRandom(category)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-stage-fg-muted">
          已练习 {practisedTotal} / {exams.length} 篇
        </p>
      </section>

      <Card
        title="最近练习"
        aside={
          <Link
            href="/ielts-lab/history"
            className="text-xs text-stage-fg-muted transition-colors hover:text-stage-fg"
          >
            全部记录 →
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
        ) : (
          <ul className="divide-y divide-stage-border">
            {recent.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{record.title}</p>
                  <p className="text-xs text-stage-fg-muted">
                    {record.category || "—"} · {relativeTime(record.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stage-primary">
                  {accuracyPercent(record.accuracy)}%
                </span>
                <Link
                  href={reviewHref(record.examId, record.id)}
                  className="text-xs text-stage-fg-muted transition-colors hover:text-stage-fg"
                >
                  回顾
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CategoryCard({
  category,
  total,
  practised,
  onRandom,
}: {
  category: ExamCategory;
  total: number;
  practised: number;
  onRandom: () => void;
}) {
  const percent = total > 0 ? Math.round((practised / total) * 100) : 0;

  return (
    <div className="rounded-stage-md border border-stage-border p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">{category} 阅读</h3>
        <span className="text-xs text-stage-fg-muted">{total} 篇</span>
      </div>
      <p className="mt-1 text-xs text-stage-fg-muted">
        {CATEGORY_BLURB[category]}
      </p>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-stage-bg-soft"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category} 完成进度`}
      >
        <div
          className="h-full rounded-full bg-stage-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-stage-fg-muted">
        已练习 {practised} / {total}
      </p>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/ielts-lab/browse?category=${category}`}
          className="flex-1 rounded-stage-sm border border-stage-border px-2 py-1.5 text-center text-xs transition-colors hover:border-stage-primary"
        >
          浏览题库
        </Link>
        <button
          type="button"
          onClick={onRandom}
          className="flex-1 rounded-stage-sm border border-stage-border px-2 py-1.5 text-xs transition-colors hover:border-stage-primary"
        >
          随机练习
        </button>
      </div>
    </div>
  );
}

/**
 * Offers to resume an interrupted multi-passage session.
 *
 * The source project reconstructs a suite from a sessionStorage snapshot on
 * demand. Same idea, stated explicitly rather than restored silently: resuming
 * navigates back into a test, which should be the learner's choice.
 */
function ResumeBanner({
  session,
  onDismiss,
}: {
  session: PracticeSession;
  onDismiss: () => void;
}) {
  if (session.kind === "endless") {
    const last = session.served[session.served.length - 1];
    return (
      <Card className="border-stage-primary/40 bg-stage-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            无尽模式进行中 · 已完成 {session.completed} 篇
          </p>
          <div className="flex gap-2">
            {last ? (
              <Link
                href={practiceHref(last, "endless")}
                className="rounded-stage-sm bg-stage-primary px-3 py-1.5 text-xs font-medium text-stage-fg-on-dark"
              >
                继续
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-stage-sm border border-stage-border px-3 py-1.5 text-xs"
            >
              结束
            </button>
          </div>
        </div>
      </Card>
    );
  }

  const current = session.entries[session.index];
  return (
    <Card className="border-stage-primary/40 bg-stage-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          套题进行中 · 第 {session.index + 1} / {session.entries.length} 篇
          {current ? ` · ${current.title}` : ""}
        </p>
        <div className="flex gap-2">
          {current ? (
            <Link
              href={practiceHref(current.examId, "suite")}
              className="rounded-stage-sm bg-stage-primary px-3 py-1.5 text-xs font-medium text-stage-fg-on-dark"
            >
              继续
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-stage-sm border border-stage-border px-3 py-1.5 text-xs"
          >
            放弃
          </button>
        </div>
      </div>
    </Card>
  );
}
