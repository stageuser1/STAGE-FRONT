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
import {
  BUTTON_QUIET,
  BUTTON_SECONDARY,
  Badge,
  Chip,
  ConfirmButton,
  EmptyNote,
  FIELD,
  PageHeader,
  StatTile,
  Tabs,
  Tag,
  accuracyText,
  splitTitle,
} from "./ui";

/**
 * Charts are a route-level minority: the default tab is the timeline, and
 * Recharts is by far the heaviest thing IELTS Lab depends on. Loading it only
 * when the analytics tab is opened keeps the history page's first load close
 * to what it was before this module existed.
 */
const PracticeAnalytics = dynamic(
  () => import("./PracticeAnalytics").then((m) => m.PracticeAnalytics),
  {
    ssr: false,
    loading: () => (
      <p className="px-4 py-8 text-stage-xs text-stage-fg-muted">加载图表…</p>
    ),
  },
);

type View = "timeline" | "analytics";

const VIEWS = [
  { value: "timeline" as const, label: "时间线" },
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

/**
 * Timeline event kinds (master-spec 批次二 学习记录页).
 *
 * Derived from the records themselves, never stored: an attempt on a passage
 * that already has an earlier attempt IS a retest, and saying so needs no new
 * field. A "复盘" event has no source in the storage contract — opening a
 * review writes nothing — so it is not invented here; see the T3 report.
 */
type EventKind = "practice" | "retest";

const EVENT_LABELS: Record<EventKind, string> = {
  practice: "练习",
  retest: "重测",
};

/** Distinct glyph per kind, so the row is not distinguished by colour alone. */
const EVENT_GLYPHS: Record<EventKind, string> = {
  practice: "◆",
  retest: "↻",
};

interface TimelineEvent {
  record: PracticeRecord;
  kind: EventKind;
  /** Accuracy of the previous attempt on the same passage, for a retest. */
  previousAccuracy: number | null;
}

/**
 * Classifies every record against the attempts that came before it.
 *
 * Records arrive newest-first, so the pass walks them oldest-first and keeps
 * the last accuracy seen per exam.
 */
function buildEvents(records: PracticeRecord[]): Map<string, TimelineEvent> {
  const events = new Map<string, TimelineEvent>();
  const lastSeen = new Map<string, number>();

  for (let i = records.length - 1; i >= 0; i -= 1) {
    const record = records[i];
    const previous = lastSeen.get(record.examId);
    events.set(record.id, {
      record,
      kind: previous === undefined ? "practice" : "retest",
      previousAccuracy: previous ?? null,
    });
    lastSeen.set(record.examId, record.accuracy);
  }
  return events;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function answerText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = (value ?? "").toString().trim();
  return text.length > 0 ? text : "（未作答）";
}

export function PracticeHistory() {
  // Records live in localStorage, so they can only be read after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [view, setView] = useState<View>("timeline");
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

  const events = useMemo(
    () => buildEvents(records ?? []),
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

  /** Visible records grouped by calendar day, in the current sort order. */
  const groups = useMemo(() => {
    const byDay: Array<{ day: string; records: PracticeRecord[] }> = [];
    for (const record of visible) {
      const day = dayKey(record.createdAt);
      const last = byDay[byDay.length - 1];
      if (last && last.day === day) last.records.push(record);
      else byDay.push({ day, records: [record] });
    }
    return byDay;
  }, [visible]);

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
    const count = selection.size;
    applyRecords(deleteRecords([...selection]));
    setNotice(`已删除 ${count} 条记录。`);
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
    return <p className="py-8 text-stage-xs text-stage-fg-muted">加载练习记录…</p>;
  }

  return (
    <div>
      <PageHeader
        title="练习记录"
        subtitle="记录保存在本机浏览器中，可导出备份或迁移到其他设备"
      />

      {records.length === 0 || !stats ? (
        <>
          <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/ielts-lab/browse" className={BUTTON_SECONDARY}>
              去题库
            </Link>
            <ImportButton inputRef={fileRef} onFile={handleImport} />
          </div>
          {notice ? (
            <p className="mt-3 text-stage-xs text-stage-fg-muted">{notice}</p>
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
              value={accuracyText(stats.averageAccuracy)}
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
            <Tabs
              value={view}
              onChange={setView}
              options={VIEWS}
              label="练习记录视图"
            />
            {view === "timeline" ? (
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
                  className={BUTTON_SECONDARY}
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
                  className={BUTTON_SECONDARY}
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
                <Chip
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  全部分类
                </Chip>
                {CATEGORIES.map((value) => (
                  <Chip
                    key={value}
                    active={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {value}
                  </Chip>
                ))}
                <span
                  className="mx-1 w-px self-stretch bg-stage-border"
                  aria-hidden
                />
                {(Object.keys(BAND_LABELS) as Band[]).map((value) => (
                  <Chip
                    key={value}
                    active={band === value}
                    onClick={() => setBand(value)}
                  >
                    {BAND_LABELS[value]}
                  </Chip>
                ))}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="记录排序方式"
                  className={`ml-auto ${FIELD}`}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-stage-xs text-stage-fg-muted">
                <span>共 {visible.length} 条</span>
                {selection.size > 0 ? (
                  <>
                    <span>已选 {selection.size} 条</span>
                    <ConfirmButton
                      label="删除所选"
                      question={`删除选中的 ${selection.size} 条记录？`}
                      onConfirm={removeSelected}
                    />
                    <button
                      type="button"
                      onClick={() => setSelection(new Set())}
                      className={BUTTON_QUIET}
                    >
                      取消选择
                    </button>
                  </>
                ) : null}
              </div>

              {notice ? (
                <p className="mb-3 rounded-stage-md border border-stage-border bg-stage-bg-soft px-3 py-2 text-stage-xs text-stage-fg-body">
                  {notice}
                </p>
              ) : null}

              {visible.length === 0 ? (
                <EmptyNote>没有符合条件的记录。</EmptyNote>
              ) : (
                <div className="space-y-6">
                  {groups.map((group) => (
                    <section key={group.day}>
                      <h2 className="mb-2 flex items-baseline gap-2 text-stage-xs font-medium text-stage-fg">
                        {group.day}
                        <span className="text-stage-2xs font-normal text-stage-fg-subtle">
                          {group.records.length} 次
                        </span>
                      </h2>
                      {/* The rule down the left is the timeline spine; each
                          event hangs off it with its own glyph. */}
                      <ul className="space-y-2 border-l border-stage-border pl-4">
                        {group.records.map((record) => (
                          <li key={record.id}>
                            <EventRow
                              event={
                                events.get(record.id) ?? {
                                  record,
                                  kind: "practice",
                                  previousAccuracy: null,
                                }
                              }
                              selected={selection.has(record.id)}
                              onToggle={() => toggleSelected(record.id)}
                              onDelete={() =>
                                applyRecords(deleteRecords([record.id]))
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}

              <ConfirmButton
                label="清空记录"
                question="清空全部练习记录？此操作无法撤销。"
                onConfirm={() => {
                  clearRecords();
                  applyRecords([]);
                }}
                className={`mt-6 ${BUTTON_SECONDARY}`}
              />
            </>
          )}
        </>
      )}
    </div>
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
        className={BUTTON_SECONDARY}
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
 * One timeline event, expandable to its per-question outcomes.
 *
 * `<details>` rather than React state: the browser owns the disclosure, which
 * keeps the list cheap when a learner has hundreds of records, and matches the
 * ExpandableSection pattern used on the Explore surface.
 */
function EventRow({
  event,
  selected,
  onToggle,
  onDelete,
}: {
  event: TimelineEvent;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { record, kind, previousAccuracy } = event;
  const { en, zh } = splitTitle(record.title);
  const questions = Object.entries(record.answerComparison ?? {});

  return (
    <div
      className={`relative rounded-stage-md border bg-stage-bg ${
        selected ? "border-stage-primary" : "border-stage-border"
      }`}
    >
      {/* The glyph sits on the spine, so scanning the column tells the learner
          what kind of event each row was without reading it. */}
      <span
        aria-hidden
        className="absolute -left-[1.4rem] top-4 text-stage-2xs text-stage-fg-subtle"
      >
        {EVENT_GLYPHS[kind]}
      </span>

      <div className="flex items-start gap-3 px-4 pt-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`选择 ${record.title}`}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--stage-primary)]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-stage-xs font-medium text-stage-fg">
            {en}
          </p>
          {zh ? (
            <p className="truncate text-stage-2xs text-stage-fg-subtle">{zh}</p>
          ) : null}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-stage-2xs text-stage-fg-subtle">
            <Badge tone={kind === "retest" ? "accent" : "neutral"}>
              {EVENT_LABELS[kind]}
            </Badge>
            {record.category ? <Tag>{record.category}</Tag> : null}
            <span className="tabular-nums">{formatTime(record.createdAt)}</span>
            <span className="tabular-nums">{formatDuration(record.duration)}</span>
            {record.suite ? (
              <span>套题 {record.suite.index + 1}/{record.suite.total}</span>
            ) : record.mode === "endless" ? (
              <span>无尽模式</span>
            ) : null}
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-stage-xs font-semibold tabular-nums text-stage-fg">
            {accuracyText(record.accuracy)}
          </span>
          <span className="block text-stage-2xs tabular-nums text-stage-fg-subtle">
            {record.correctAnswers}/{record.totalQuestions}
          </span>
        </span>
      </div>

      {/* Retest measurement: what this attempt changed, in the learner's own
          native unit. Never a score. */}
      {kind === "retest" && previousAccuracy !== null ? (
        <p className="px-4 pt-2 text-stage-2xs tabular-nums text-stage-fg-muted">
          上次 {accuracyText(previousAccuracy)} → 本次{" "}
          <span className="font-semibold text-stage-fg">
            {accuracyText(record.accuracy)}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-2 text-stage-2xs">
        <Link
          href={`/ielts-lab/review/${record.id}`}
          className="font-medium text-stage-primary underline-offset-2 transition-colors duration-stage-fast hover:underline"
        >
          逐题回顾
        </Link>
        <Link href={reviewHref(record.examId, record.id)} className={BUTTON_QUIET}>
          在题目中回顾
        </Link>
        <ConfirmButton
          label="删除"
          question="删除这条记录？"
          onConfirm={onDelete}
        />
        {record.markedQuestions?.length ? (
          <span className="text-stage-fg-subtle">
            标记 {record.markedQuestions.length} 题
          </span>
        ) : null}
      </div>

      <details className="group border-t border-stage-border">
        <summary className="cursor-pointer px-4 py-2 text-stage-2xs text-stage-fg-muted [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">展开逐题结果 ▾</span>
          <span className="hidden group-open:inline">收起逐题结果 ▴</span>
        </summary>

        {questions.length === 0 ? (
          <p className="border-t border-stage-border px-4 py-3 text-stage-2xs text-stage-fg-subtle">
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
      <span className="w-8 shrink-0 text-stage-2xs text-stage-fg-subtle">
        {questionId}
      </span>
      <Badge tone={entry.isCorrect ? "positive" : "warning"}>
        {entry.isCorrect ? "正确" : "错误"}
      </Badge>
      {type ? <Badge>{questionTypeLabel(type)}</Badge> : null}
      <span className="min-w-0 flex-1 truncate text-stage-2xs text-stage-fg-body">
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
