"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FREQUENCY_SCOPE_LABELS,
  buildProgressIndex,
  composeSuite,
  pickRandomExam,
  type FrequencyScope,
} from "@/lib/ielts/progress";
import {
  clearSession,
  loadSessionOfKind,
  practiceHref,
  reviewHref,
  saveSession,
  startSuite,
  type SuiteEntry,
  type SuiteSession,
} from "@/lib/ielts/session";
import { loadRecords } from "@/lib/ielts/storage";
import type { ExamProgress, ExamSummary, PracticeRecord } from "@/lib/ielts/types";
import { Card, EmptyNote, StatTile } from "./ui";

const SCOPES: FrequencyScope[] = ["high", "high_medium", "all"];

function toEntry(exam: ExamSummary): SuiteEntry {
  return { examId: exam.id, title: exam.title, category: exam.category };
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)} 分 ${String(total % 60).padStart(2, "0")} 秒`;
}

/**
 * Three-part suite practice: one P1, one P2 and one P3 in sequence.
 *
 * The source project runs its suite inside a single reused tab, exchanging
 * draft-sync and navigation messages with the runner. STAGE sequences it at the
 * route level instead — one passage per page, each scored and stored as its own
 * record. Same exercise, and it removes the reason the original had to rewrite
 * every question id as `examId::questionId`: records never collide, so question
 * type analytics works on suite attempts with no special case.
 */
export function SuitePractice({ exams }: { exams: ExamSummary[] }) {
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [session, setSession] = useState<SuiteSession | null>(null);
  const [scope, setScope] = useState<FrequencyScope>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
    const active = loadSessionOfKind("suite");
    setSession(active);
    if (active) setScope(active.scope);
  }, []);

  const progress = useMemo(
    () => buildProgressIndex(records ?? []),
    [records],
  );
  const recordsById = useMemo(() => {
    const map = new Map<string, PracticeRecord>();
    for (const record of records ?? []) map.set(record.id, record);
    return map;
  }, [records]);

  function start() {
    const picks = composeSuite(exams, progress, scope);
    if (!picks) {
      setError("当前范围内没有足够的题目，换一个范围试试。");
      return;
    }
    setError(null);
    setSession(startSuite(picks.map(toEntry), scope));
  }

  /** Swaps one not-yet-attempted entry for a different passage. */
  function reroll(index: number) {
    if (!session) return;
    const entry = session.entries[index];
    if (!entry || entry.recordId) return;

    const taken = new Set(session.entries.map((item) => item.examId));
    const pick = pickRandomExam(exams, progress, {
      category: entry.category,
      scope: session.scope,
      exclude: taken,
    });
    if (!pick) return;

    const entries = session.entries.map((item, position) =>
      position === index ? toEntry(pick) : item,
    );
    const next = { ...session, entries };
    saveSession(next);
    setSession(next);
  }

  function abandon() {
    if (!window.confirm("确定要放弃当前套题吗？已完成的篇目仍会保留在练习记录中。")) {
      return;
    }
    clearSession();
    setSession(null);
  }

  if (records === null) {
    return <p className="text-sm text-stage-fg-muted">加载套题状态…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">套题练习</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          按 P1 → P2 → P3 的顺序连续完成三篇阅读，模拟一场完整的阅读考试。
        </p>
      </header>

      {session ? (
        <ActiveSuite
          session={session}
          recordsById={recordsById}
          onReroll={reroll}
          onAbandon={abandon}
        />
      ) : (
        <Card title="选择出题范围" subtitle="优先抽取尚未练习过的篇目">
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                aria-pressed={scope === value}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  scope === value
                    ? "border-stage-primary bg-stage-primary text-white"
                    : "border-stage-border text-stage-fg-muted hover:border-stage-primary"
                }`}
              >
                {FREQUENCY_SCOPE_LABELS[value]}
              </button>
            ))}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-stage-warning">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover"
          >
            抽取三篇并开始
          </button>
        </Card>
      )}
    </div>
  );
}

function ActiveSuite({
  session,
  recordsById,
  onReroll,
  onAbandon,
}: {
  session: SuiteSession;
  recordsById: Map<string, PracticeRecord>;
  onReroll: (index: number) => void;
  onAbandon: () => void;
}) {
  const done = session.entries.filter((entry) => entry.recordId);
  const finished = done.length === session.entries.length;
  const next = session.entries.find((entry) => !entry.recordId);

  // Only entries whose record still exists are aggregated: a learner can delete
  // a record from history mid-suite, and the total must not count a score that
  // no longer has anything behind it.
  const scored = done
    .map((entry) => recordsById.get(entry.recordId as string))
    .filter((record): record is PracticeRecord => Boolean(record));

  const correct = scored.reduce((sum, record) => sum + record.correctAnswers, 0);
  const total = scored.reduce((sum, record) => sum + record.totalQuestions, 0);
  const duration = scored.reduce((sum, record) => sum + record.duration, 0);

  return (
    <>
      <Card
        title={finished ? "套题成绩" : "进行中"}
        subtitle={`${FREQUENCY_SCOPE_LABELS[session.scope]} · 已完成 ${done.length} / ${session.entries.length} 篇`}
        aside={
          <button
            type="button"
            onClick={onAbandon}
            className="text-xs text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
          >
            {finished ? "开始新套题" : "放弃套题"}
          </button>
        }
      >
        {scored.length > 0 ? (
          <dl className="mb-4 grid grid-cols-3 gap-3">
            <StatTile
              label="总分"
              value={`${correct}/${total}`}
              hint={finished ? "三篇合计" : "已完成部分"}
            />
            <StatTile
              label="正确率"
              value={`${total > 0 ? Math.round((correct / total) * 100) : 0}%`}
            />
            <StatTile label="总用时" value={formatDuration(duration)} />
          </dl>
        ) : (
          <EmptyNote>完成第一篇后这里会显示合计成绩。</EmptyNote>
        )}

        <ol className="space-y-2">
          {session.entries.map((entry, index) => (
            <li key={`${entry.examId}-${index}`}>
              <SuiteRow
                entry={entry}
                index={index}
                record={
                  entry.recordId ? recordsById.get(entry.recordId) : undefined
                }
                isNext={next?.examId === entry.examId}
                onReroll={() => onReroll(index)}
              />
            </li>
          ))}
        </ol>

        {next ? (
          <Link
            href={practiceHref(next.examId, "suite")}
            className="mt-4 inline-block rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover"
          >
            {done.length === 0 ? "开始第一篇" : `继续第 ${done.length + 1} 篇`}
          </Link>
        ) : (
          <p className="mt-4 text-sm text-stage-fg-muted">
            三篇已全部完成。点击右上角可以开始新的一套。
          </p>
        )}
      </Card>
    </>
  );
}

function SuiteRow({
  entry,
  index,
  record,
  isNext,
  onReroll,
}: {
  entry: SuiteEntry;
  index: number;
  record?: PracticeRecord;
  isNext: boolean;
  onReroll: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-stage-md border px-3 py-2 ${
        isNext ? "border-stage-primary" : "border-stage-border"
      }`}
    >
      <span className="w-6 shrink-0 text-xs text-stage-fg-muted tabular-nums">
        {index + 1}
      </span>
      <span className="rounded bg-stage-bg-soft px-1.5 py-0.5 text-xs font-medium">
        {entry.category}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{entry.title}</span>

      {record ? (
        <>
          <span className="text-sm font-semibold text-stage-primary tabular-nums">
            {record.correctAnswers}/{record.totalQuestions}
          </span>
          <Link
            href={reviewHref(entry.examId, record.id)}
            className="text-xs text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
          >
            回顾
          </Link>
        </>
      ) : entry.recordId ? (
        <span className="text-xs text-stage-fg-muted">记录已删除</span>
      ) : (
        <button
          type="button"
          onClick={onReroll}
          className="text-xs text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
        >
          换一篇
        </button>
      )}
    </div>
  );
}
