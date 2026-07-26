"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, FREQUENCY_LABELS } from "@/lib/ielts/catalog";
import { questionTypeLabel, questionTypeOf } from "@/lib/ielts/question-types";
import { answerText } from "@/lib/ielts/review";
import { practiceHref } from "@/lib/ielts/session";
import { loadRecords } from "@/lib/ielts/storage";
import type {
  ExamCategory,
  ExamFrequency,
  ExamSummary,
  PracticeRecord,
} from "@/lib/ielts/types";
import {
  DEFAULT_WRONGBOOK_FILTERS,
  buildWrongbook,
  wrongQuestionCount,
  wrongbookTypeCounts,
  type WrongbookEntry,
  type WrongbookFilters,
  type WrongbookSort,
} from "@/lib/ielts/wrongbook";
import { EmptyNote } from "./ui";

const FREQUENCIES: ExamFrequency[] = ["high", "medium", "low"];

const SORT_LABELS: Record<WrongbookSort, string> = {
  recent: "最近错题优先",
  most_wrong: "错题最多优先",
  title: "按标题",
};

/**
 * Filters mirrored to sessionStorage, matching the browse page.
 *
 * The wrongbook deliberately reuses the catalog's filter vocabulary — one
 * mental model for "find me passages like this", wherever the learner is.
 */
const FILTER_KEY = "stage.ielts.mistakes";

function readFilters(): WrongbookFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FILTER_KEY);
    if (!raw) return null;
    // Spread over the defaults so a value written by an older build cannot
    // leave a field undefined.
    return {
      ...DEFAULT_WRONGBOOK_FILTERS,
      ...(JSON.parse(raw) as Partial<WrongbookFilters>),
    };
  } catch {
    return null;
  }
}

function Chip({
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
      className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary ${
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
 * Derived remediation queue (P-10).
 *
 * Nothing here is stored: the list is recomputed from practice history on every
 * render, so redoing a passage successfully removes it with no "resolved" flag
 * to drift out of step with the attempts themselves.
 */
export function Wrongbook({ exams }: { exams: ExamSummary[] }) {
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [filters, setFilters] = useState<WrongbookFilters>(
    DEFAULT_WRONGBOOK_FILTERS,
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setFilters(readFilters() ?? DEFAULT_WRONGBOOK_FILTERS);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch {
      // Filter memory is a convenience; a full quota must not break the page.
    }
  }, [filters, restored]);

  // Unfiltered, so the chips can show what exists rather than what survives
  // the current selection.
  const allEntries = useMemo(
    () =>
      records
        ? buildWrongbook(records, { exams, resolveQuestionType: questionTypeOf })
        : [],
    [records, exams],
  );

  const entries = useMemo(
    () =>
      records
        ? buildWrongbook(records, {
            exams,
            filters,
            resolveQuestionType: questionTypeOf,
          })
        : [],
    [records, exams, filters],
  );

  const typeCounts = useMemo(
    () => wrongbookTypeCounts(allEntries),
    [allEntries],
  );

  const categoryCount = (category: ExamCategory) =>
    allEntries.filter((entry) => entry.category === category).length;
  const frequencyCount = (frequency: ExamFrequency) =>
    allEntries.filter((entry) => entry.frequency === frequency).length;

  const isFiltered =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.frequency !== "all" ||
    filters.questionType !== "all";

  if (records === null) {
    return <p className="py-8 text-sm text-stage-fg-muted">加载错题本…</p>;
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">错题本</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          规则：每篇文章只看最近一次作答，其中还有错题的会出现在这里；重做全对后自动移出。
        </p>
      </header>

      {allEntries.length === 0 ? (
        records.length === 0 ? (
          <>
            <EmptyNote>
              还没有练习记录。完成一篇阅读后，这里会自动收集错题。
            </EmptyNote>
            <div className="mt-4">
              <Link
                href="/ielts-lab/browse"
                className="rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
              >
                去题库
              </Link>
            </div>
          </>
        ) : (
          <>
            <EmptyNote>
              最近一次作答里没有错题 🎉 继续保持。
            </EmptyNote>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/ielts-lab/browse"
                className="rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
              >
                继续练习
              </Link>
              <Link
                href="/ielts-lab/suite"
                className="rounded-stage-md border border-stage-border px-3 py-1.5 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
              >
                来一套套题
              </Link>
            </div>
          </>
        )
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder="搜索标题…"
                aria-label="搜索错题文章标题"
                className="min-w-0 flex-1 rounded-stage-md border border-stage-border bg-stage-bg px-4 py-2 text-sm outline-none focus:border-stage-primary"
              />
              <label className="flex items-center gap-2 text-sm text-stage-fg-muted">
                <span className="sr-only sm:not-sr-only">排序</span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      sort: event.target.value as WrongbookSort,
                    }))
                  }
                  aria-label="错题排序方式"
                  className="rounded-stage-md border border-stage-border bg-stage-bg px-3 py-2 text-sm outline-none focus:border-stage-primary"
                >
                  {(Object.keys(SORT_LABELS) as WrongbookSort[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip
                active={filters.category === "all"}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: "all" }))
                }
              >
                全部 {allEntries.length}
              </Chip>
              {CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  active={filters.category === value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, category: value }))
                  }
                >
                  {value} {categoryCount(value)}
                </Chip>
              ))}
              <span className="mx-1 w-px self-stretch bg-stage-border" aria-hidden />
              <Chip
                active={filters.frequency === "all"}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, frequency: "all" }))
                }
              >
                不限频次
              </Chip>
              {FREQUENCIES.map((value) => (
                <Chip
                  key={value}
                  active={filters.frequency === value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, frequency: value }))
                  }
                >
                  {FREQUENCY_LABELS[value]} {frequencyCount(value)}
                </Chip>
              ))}
            </div>

            {typeCounts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={filters.questionType === "all"}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, questionType: "all" }))
                  }
                >
                  全部题型
                </Chip>
                {typeCounts.map(({ type, count }) => (
                  <Chip
                    key={type}
                    active={filters.questionType === type}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, questionType: type }))
                    }
                  >
                    {questionTypeLabel(type)} {count}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-stage-fg-muted" aria-live="polite">
              共 {entries.length} 篇 · {wrongQuestionCount(entries)} 道错题
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...DEFAULT_WRONGBOOK_FILTERS,
                    sort: prev.sort,
                  }))
                }
                className="text-sm text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
              >
                清除筛选
              </button>
            ) : null}
          </div>

          {entries.length === 0 ? (
            <EmptyNote>这些条件下没有错题。</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.examId}>
                  <WrongbookRow entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function WrongbookRow({ entry }: { entry: WrongbookEntry }) {
  // Reveal is per-visit and per-question, exactly as on the review page:
  // the wrongbook is for reviewing, not for reading off answers.
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());

  return (
    <div className="rounded-stage-md border border-stage-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3">
        <span className="rounded bg-stage-bg-soft px-1.5 py-0.5 text-xs font-medium">
          {entry.category || "—"}
        </span>
        {entry.frequency ? (
          <span className="text-xs text-stage-fg-muted">
            {FREQUENCY_LABELS[entry.frequency as ExamFrequency]}
          </span>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {entry.title}
        </p>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-700">
          {entry.wrongCount} 错 / {entry.totalQuestions}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-1.5 text-xs text-stage-fg-muted">
        <span>
          最近作答 {new Date(entry.latestAttemptAt).toLocaleDateString("zh-CN")} ·{" "}
          {Math.round(entry.latestAccuracy * 100)}%
        </span>
        <span>练习 {entry.attempts} 次</span>
        <Link
          href={`/ielts-lab/review/${entry.latestRecordId}`}
          className="underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
        >
          逐题回顾
        </Link>
        {entry.orphaned ? (
          <span className="text-amber-700">题库中已无此篇</span>
        ) : (
          <a
            href={practiceHref(entry.examId)}
            className="underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
          >
            重做
          </a>
        )}
      </div>

      <details className="group border-t border-stage-border">
        <summary className="cursor-pointer px-4 py-2 text-xs text-stage-fg-muted [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">展开 {entry.wrongCount} 道错题 ▾</span>
          <span className="hidden group-open:inline">收起错题 ▴</span>
        </summary>
        <ul className="border-t border-stage-border">
          {entry.questions.map((question) => {
            const isRevealed = revealed.has(question.questionId);
            return (
              <li
                key={question.questionId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stage-border px-4 py-2 text-xs last:border-b-0"
              >
                <span className="w-10 shrink-0 tabular-nums text-stage-fg-muted">
                  {question.questionId.replace(/\D+/g, "") ||
                    question.questionId}
                </span>
                {question.questionType ? (
                  <span className="rounded bg-stage-bg-soft px-1.5 py-0.5 text-stage-fg-muted">
                    {questionTypeLabel(question.questionType)}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  我的作答 {answerText(question.userAnswer)}
                </span>
                {isRevealed ? (
                  <span className="font-medium">
                    正确 {answerText(question.correctAnswer)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((current) =>
                        new Set(current).add(question.questionId),
                      )
                    }
                    aria-label={`显示第 ${question.questionId} 题的正确答案`}
                    className="rounded-stage-sm border border-stage-border px-2 py-0.5 text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg"
                  >
                    <span aria-hidden className="tracking-widest">
                      ●●●
                    </span>{" "}
                    显示
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
