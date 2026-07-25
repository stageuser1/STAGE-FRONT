"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { questionTypeLabel, questionTypeOf } from "@/lib/ielts/question-types";
import { clearRecords, computeStats, loadRecords } from "@/lib/ielts/storage";
import type { AnswerComparison, PracticeRecord } from "@/lib/ielts/types";
import { Badge, EmptyNote, StatTile, Tabs } from "./ui";

/**
 * Charts are a route-level minority: the default tab is the record list, and
 * Recharts is by far the heaviest thing IELTS Lab depends on. Loading it only
 * when the analytics tab is opened keeps the history page's first load close
 * to what it was before this module existed.
 */
const PracticeAnalytics = dynamic(
  () => import("./PracticeAnalytics").then((m) => m.PracticeAnalytics),
  {
    ssr: false,
    loading: () => (
      <p className="px-4 py-8 text-sm text-stage-fg-muted">加载图表…</p>
    ),
  },
);

type View = "records" | "analytics";

const VIEWS = [
  { value: "records" as const, label: "练习记录" },
  { value: "analytics" as const, label: "数据分析" },
];

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN");
}

function answerText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = (value ?? "").toString().trim();
  return text.length > 0 ? text : "（未作答）";
}

export function PracticeHistory() {
  // Records live in localStorage, so they can only be read after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [view, setView] = useState<View>("records");

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const stats = useMemo(
    () => (records ? computeStats(records) : null),
    [records],
  );

  if (records === null) {
    return (
      <p className="px-4 py-8 text-sm text-stage-fg-muted">加载练习记录…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">练习记录</h1>
          <p className="mt-1 text-sm text-stage-fg-muted">
            记录保存在本机浏览器中
          </p>
        </div>
        <Link
          href="/ielts-lab"
          className="text-sm text-stage-fg-muted transition-colors hover:text-stage-fg"
        >
          ← 返回题库
        </Link>
      </header>

      {records.length === 0 || !stats ? (
        <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
      ) : (
        <>
          <dl className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatTile label="练习次数" value={String(stats.totalPractices)} />
            <StatTile
              label="平均正确率"
              value={`${Math.round(stats.averageAccuracy * 100)}%`}
            />
            <StatTile
              label="累计用时"
              value={`${Math.round(stats.totalTimeSeconds / 60)} 分钟`}
            />
          </dl>

          <div className="mb-4">
            <Tabs value={view} onChange={setView} options={VIEWS} />
          </div>

          {view === "analytics" ? (
            <PracticeAnalytics records={records} />
          ) : (
            <ul className="space-y-2">
              {records.map((record) => (
                <li key={record.id}>
                  <RecordRow record={record} />
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              if (!window.confirm("确定要清空全部练习记录吗？此操作无法撤销。")) return;
              clearRecords();
              setRecords([]);
            }}
            className="mt-6 rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
          >
            清空记录
          </button>
        </>
      )}
    </div>
  );
}

/**
 * One attempt, expandable to its per-question outcomes.
 *
 * `<details>` rather than React state: the browser owns the disclosure, which
 * keeps the list cheap when a learner has hundreds of records, and matches the
 * ExpandableSection pattern used on the Explore surface.
 */
function RecordRow({ record }: { record: PracticeRecord }) {
  const questions = Object.entries(record.answerComparison ?? {});

  return (
    <details className="group rounded-stage-md border border-stage-border">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{record.title}</p>
          <p className="text-xs text-stage-fg-muted">
            {record.category} · {formatDate(record.createdAt)} ·{" "}
            {formatDuration(record.duration)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stage-primary">
            {record.correctAnswers}/{record.totalQuestions} ·{" "}
            {Math.round(record.accuracy * 100)}%
          </span>
          <span
            aria-hidden
            className="text-xs text-stage-fg-muted transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </div>
      </summary>

      {questions.length === 0 ? (
        <p className="border-t border-stage-border px-4 py-3 text-xs text-stage-fg-muted">
          这条记录没有逐题数据。
        </p>
      ) : (
        <ul className="border-t border-stage-border">
          {questions.map(([questionId, entry]) => (
            <QuestionRow
              key={questionId}
              examId={record.examId}
              questionId={questionId}
              entry={entry}
            />
          ))}
        </ul>
      )}
    </details>
  );
}

function QuestionRow({
  examId,
  questionId,
  entry,
}: {
  examId: string;
  questionId: string;
  entry: AnswerComparison;
}) {
  // Stored type wins; records written before analytics fall back to the corpus.
  const type =
    entry.questionType ?? questionTypeOf(examId, entry.questionId ?? questionId);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stage-border px-4 py-2 last:border-b-0">
      <span className="w-8 shrink-0 text-xs text-stage-fg-muted">
        {questionId}
      </span>
      <Badge tone={entry.isCorrect ? "positive" : "warning"}>
        {entry.isCorrect ? "正确" : "错误"}
      </Badge>
      {type ? <Badge>{questionTypeLabel(type)}</Badge> : null}
      <span className="min-w-0 flex-1 truncate text-xs text-stage-fg">
        {answerText(entry.userAnswer)}
        {!entry.isCorrect ? (
          <span className="text-stage-fg-muted">
            {" → "}
            {answerText(entry.correctAnswer)}
          </span>
        ) : null}
      </span>
    </li>
  );
}
