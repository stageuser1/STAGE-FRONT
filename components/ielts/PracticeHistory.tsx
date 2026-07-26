"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CATEGORIES } from "@/lib/ielts/catalog";
import {
  downloadFile,
  exportFilename,
  parseImport,
  toJson,
  toMarkdown,
} from "@/lib/ielts/history-io";
import { questionTypeLabel, questionTypeOf } from "@/lib/ielts/question-types";
import { reviewHref } from "@/lib/ielts/session";
import {
  clearRecords,
  computeStats,
  deleteRecords,
  loadRecords,
  mergeRecords,
} from "@/lib/ielts/storage";
import type {
  AnswerComparison,
  ExamCategory,
  PracticeRecord,
} from "@/lib/ielts/types";
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

/** Result bands, matching the colour thresholds used in the charts. */
type Band = "all" | "strong" | "fair" | "weak";

const BAND_LABELS: Record<Band, string> = {
  all: "全部成绩",
  strong: "≥ 75%",
  fair: "50–74%",
  weak: "< 50%",
};

function inBand(accuracy: number, band: Band): boolean {
  const percent = accuracy * 100;
  switch (band) {
    case "strong":
      return percent >= 75;
    case "fair":
      return percent >= 50 && percent < 75;
    case "weak":
      return percent < 50;
    default:
      return true;
  }
}

type SortKey = "recent" | "accuracy-desc" | "accuracy-asc" | "duration-desc";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "最近优先",
  "accuracy-desc": "正确率从高到低",
  "accuracy-asc": "正确率从低到高",
  "duration-desc": "用时从长到短",
};

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

const TOOLBAR_BUTTON =
  "rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg";

export function PracticeHistory() {
  // Records live in localStorage, so they can only be read after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [view, setView] = useState<View>("records");
  const [category, setCategory] = useState<ExamCategory | "all">("all");
  const [band, setBand] = useState<Band>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selection, setSelection] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  // Stats describe the whole history, not the current filter: a filtered
  // "average accuracy" would silently answer a different question.
  const stats = useMemo(
    () => (records ? computeStats(records) : null),
    [records],
  );

  const visible = useMemo(() => {
    if (!records) return [];
    const filtered = records.filter(
      (record) =>
        (category === "all" || record.category === category) &&
        inBand(record.accuracy, band),
    );
    if (sort === "recent") return filtered;

    const sorted = [...filtered];
    switch (sort) {
      case "accuracy-desc":
        sorted.sort((a, b) => b.accuracy - a.accuracy);
        break;
      case "accuracy-asc":
        sorted.sort((a, b) => a.accuracy - b.accuracy);
        break;
      case "duration-desc":
        sorted.sort((a, b) => b.duration - a.duration);
        break;
    }
    return sorted;
  }, [records, category, band, sort]);

  function applyRecords(next: PracticeRecord[]) {
    setRecords(next);
    setSelection(new Set());
  }

  function toggleSelected(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSelected() {
    if (selection.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selection.size} 条记录吗？`)) return;
    applyRecords(deleteRecords([...selection]));
    setNotice(`已删除 ${selection.size} 条记录。`);
  }

  async function handleImport(file: File) {
    try {
      const { records: merged, added } = mergeRecords(parseImport(await file.text()));
      applyRecords(merged);
      setNotice(
        added > 0 ? `已导入 ${added} 条新记录。` : "文件中的记录都已存在，未做改动。",
      );
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "导入失败。");
    }
  }

  if (records === null) {
    return <p className="py-8 text-sm text-stage-fg-muted">加载练习记录…</p>;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">练习记录</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          记录保存在本机浏览器中，可导出备份或迁移到其他设备
        </p>
      </header>

      {records.length === 0 || !stats ? (
        <>
          <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/ielts-lab/browse" className={TOOLBAR_BUTTON}>
              去题库
            </Link>
            <ImportButton inputRef={fileRef} onFile={handleImport} />
          </div>
          {notice ? (
            <p className="mt-3 text-sm text-stage-fg-muted">{notice}</p>
          ) : null}
        </>
      ) : (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="已练习题目"
              value={String(stats.totalPractices)}
              hint="累计练习次数"
            />
            <StatTile
              label="平均正确率"
              value={`${Math.round(stats.averageAccuracy * 100)}%`}
            />
            <StatTile
              label="学习时长"
              value={`${Math.round(stats.totalTimeSeconds / 60)} 分钟`}
            />
            <StatTile
              label="连续学习"
              value={`${stats.streakDays} 天`}
              hint="截至最近一次练习"
            />
          </dl>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={view} onChange={setView} options={VIEWS} />
            {view === "records" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      exportFilename("md"),
                      toMarkdown(visible),
                      "text/markdown",
                    )
                  }
                  className={TOOLBAR_BUTTON}
                >
                  导出 Markdown
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      exportFilename("json"),
                      toJson(records),
                      "application/json",
                    )
                  }
                  className={TOOLBAR_BUTTON}
                >
                  导出 JSON
                </button>
                <ImportButton inputRef={fileRef} onFile={handleImport} />
              </div>
            ) : null}
          </div>

          {view === "analytics" ? (
            <PracticeAnalytics records={records} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <FilterChip
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  全部分类
                </FilterChip>
                {CATEGORIES.map((value) => (
                  <FilterChip
                    key={value}
                    active={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {value}
                  </FilterChip>
                ))}
                <span className="mx-1 w-px self-stretch bg-stage-border" aria-hidden />
                {(Object.keys(BAND_LABELS) as Band[]).map((value) => (
                  <FilterChip
                    key={value}
                    active={band === value}
                    onClick={() => setBand(value)}
                  >
                    {BAND_LABELS[value]}
                  </FilterChip>
                ))}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="记录排序方式"
                  className="ml-auto rounded-stage-md border border-stage-border bg-stage-bg px-3 py-1.5 text-sm outline-none focus:border-stage-primary"
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-stage-fg-muted">
                <span>共 {visible.length} 条</span>
                {selection.size > 0 ? (
                  <>
                    <span>已选 {selection.size} 条</span>
                    <button
                      type="button"
                      onClick={removeSelected}
                      className="text-red-600 underline-offset-2 hover:underline"
                    >
                      删除所选
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelection(new Set())}
                      className="underline-offset-2 hover:underline"
                    >
                      取消选择
                    </button>
                  </>
                ) : null}
              </div>

              {notice ? (
                <p className="mb-3 rounded-stage-md border border-stage-border bg-stage-bg-soft px-3 py-2 text-sm">
                  {notice}
                </p>
              ) : null}

              {visible.length === 0 ? (
                <EmptyNote>没有符合条件的记录。</EmptyNote>
              ) : (
                <ul className="space-y-2">
                  {visible.map((record) => (
                    <li key={record.id}>
                      <RecordRow
                        record={record}
                        selected={selection.has(record.id)}
                        onToggle={() => toggleSelected(record.id)}
                        onDelete={() => {
                          if (!window.confirm("确定要删除这条记录吗？")) return;
                          applyRecords(deleteRecords([record.id]));
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm("确定要清空全部练习记录吗？此操作无法撤销。")
                  ) {
                    return;
                  }
                  clearRecords();
                  applyRecords([]);
                }}
                className="mt-6 rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-red-500 hover:text-red-600"
              >
                清空记录
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-stage-primary bg-stage-primary text-white"
          : "border-stage-border text-stage-fg-muted hover:border-stage-primary hover:text-stage-fg"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * File picker for JSON import.
 *
 * The input is reset after every pick so choosing the same file twice still
 * fires a change event — otherwise a failed import cannot be retried.
 */
function ImportButton({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={TOOLBAR_BUTTON}
      >
        导入 JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </>
  );
}

/**
 * One attempt, expandable to its per-question outcomes.
 *
 * `<details>` rather than React state: the browser owns the disclosure, which
 * keeps the list cheap when a learner has hundreds of records, and matches the
 * ExpandableSection pattern used on the Explore surface.
 */
function RecordRow({
  record,
  selected,
  onToggle,
  onDelete,
}: {
  record: PracticeRecord;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const questions = Object.entries(record.answerComparison ?? {});

  return (
    <div
      className={`rounded-stage-md border ${
        selected ? "border-stage-primary" : "border-stage-border"
      }`}
    >
      <div className="flex items-center gap-3 px-4 pt-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`选择 ${record.title}`}
          className="h-4 w-4 shrink-0 accent-[var(--stage-primary)]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{record.title}</p>
          <p className="text-xs text-stage-fg-muted">
            {record.category || "—"} · {formatDate(record.createdAt)} ·{" "}
            {formatDuration(record.duration)}
            {record.suite
              ? ` · 套题 ${record.suite.index + 1}/${record.suite.total}`
              : record.mode === "endless"
                ? " · 无尽模式"
                : ""}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-stage-primary tabular-nums">
          {record.correctAnswers}/{record.totalQuestions} ·{" "}
          {Math.round(record.accuracy * 100)}%
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-2 text-xs">
        <Link
          href={`/ielts-lab/review/${record.id}`}
          className="font-medium text-stage-primary underline-offset-2 transition-colors hover:underline"
        >
          逐题回顾
        </Link>
        <Link
          href={reviewHref(record.examId, record.id)}
          className="text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
        >
          在题目中回顾
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="text-stage-fg-muted underline-offset-2 transition-colors hover:text-red-600 hover:underline"
        >
          删除
        </button>
        {record.markedQuestions?.length ? (
          <span className="text-stage-fg-muted">
            标记 {record.markedQuestions.length} 题
          </span>
        ) : null}
      </div>

      <details className="group border-t border-stage-border">
        <summary className="cursor-pointer px-4 py-2 text-xs text-stage-fg-muted [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">展开逐题结果 ▾</span>
          <span className="hidden group-open:inline">收起逐题结果 ▴</span>
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
    </div>
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
