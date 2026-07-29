"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  WRITING_DIFFICULTY_LABELS,
  WRITING_TASK_KIND_LABELS,
  type WritingDifficulty,
  type WritingSetSummaryDto,
  type WritingTaskKind,
} from "@/lib/writing-data";
import {
  loadWritingSessions,
  totalWords,
  type WritingSessionState,
} from "@/lib/ielts/writing-session";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, EmptyNote, PageHeader, Tabs } from "./ui";

/** 全部 / Task 1 / Task 2 (writing-spec §二.2). */
type CategoryFilter = "all" | WritingTaskKind;

const CATEGORY_OPTIONS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "task_1", label: "Task 1" },
  { value: "task_2", label: "Task 2" },
];

/** Nine cards fills the 3-column grid exactly; pagination starts at ten sets. */
const PAGE_SIZE = 9;

/**
 * Difficulty chip.
 *
 * Three neutral steps — pale blue, pale grey, deep navy — and never red: the
 * writing spec calls this out twice (§二.3, §五.6) because a warning colour on
 * a browsing decision reads as a verdict on the learner. The word is always
 * rendered beside the colour, so the step survives greyscale (Plan §4.1.4).
 */
const DIFFICULTY_TONES: Record<WritingDifficulty, string> = {
  foundation: "bg-stage-primary-soft text-stage-primary",
  standard: "bg-stage-bg-soft text-stage-fg-muted",
  advanced: "bg-stage-primary text-stage-fg-on-dark",
};

function DifficultyChip({ value }: { value: WritingDifficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-stage-xs px-1.5 py-0.5 text-stage-2xs font-medium ${DIFFICULTY_TONES[value]}`}
    >
      <span className="sr-only">难度 </span>
      {WRITING_DIFFICULTY_LABELS[value]}
    </span>
  );
}

/**
 * IELTS Writing task list (writing-spec §二).
 *
 * Deliberately absent, per §二.5 and §五.3: any promotional slot. There is also
 * no score, no band and no evaluation anywhere on this screen — the module's
 * whole scope is draft management and process tracking (§五.8).
 */
export function WritingCatalog({ sets }: { sets: WritingSetSummaryDto[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  // localStorage is unreadable until after mount, so status lines appear with
  // their data rather than flashing an empty state first.
  const [sessions, setSessions] = useState<Map<string, WritingSessionState>>(
    new Map(),
  );

  useEffect(() => {
    setSessions(loadWritingSessions());
  }, []);

  const filtered = useMemo(
    () =>
      category === "all"
        ? sets
        : sets.filter((set) => set.taskKinds.includes(category)),
    [sets, category],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp rather than reset: switching to a shorter category should land on its
  // last page, not silently discard the reading position.
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="IELTS Writing Practice"
        subtitle="按 Task 1 / Task 2 浏览写作题目，逐题写、随时改。草稿只保存在本机浏览器。"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Tabs
          value={category}
          onChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
          options={CATEGORY_OPTIONS}
          label="写作任务分类"
        />
        <p className="text-stage-2xs tabular-nums text-stage-fg-subtle">
          共 {filtered.length} 项
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyNote>
          {sets.length === 0
            ? "写作题目还没有上线。题目发布后会出现在这里。"
            : "这个分类下还没有题目。"}
        </EmptyNote>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((set) => (
            <TaskCard
              key={set.slug}
              set={set}
              session={sessions.get(set.slug) ?? null}
            />
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <Pagination
          page={current}
          pageCount={pageCount}
          onChange={(next) => setPage(next)}
        />
      ) : null}
    </div>
  );
}

/**
 * One practice set (writing-spec §二.3).
 *
 * The strategy hint is methodology only — the field's editorial rule forbids
 * ready-made sentences or model-answer content for the specific task, and the
 * mapper drops any hint that outgrew one line.
 */
function TaskCard({
  set,
  session,
}: {
  set: WritingSetSummaryDto;
  session: WritingSessionState | null;
}) {
  const words = totalWords(session);
  const status = session?.completedAt
    ? "已完成"
    : words > 0
      ? `进行中 · 已写 ${words} 词`
      : null;

  const meta = [
    set.estimatedMinutes === null ? null : `预计 ${set.estimatedMinutes} 分钟`,
    `${set.taskCount} ${set.taskCount === 1 ? "task" : "tasks"}`,
    set.taskKinds.map((kind) => WRITING_TASK_KIND_LABELS[kind]).join(" · "),
  ].filter((item): item is string => item !== null);

  return (
    <li className="flex flex-col rounded-stage-lg border border-stage-border bg-stage-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-stage-sm font-semibold text-stage-fg">
          {set.titleEn}
        </h2>
        {set.difficulty ? <DifficultyChip value={set.difficulty} /> : null}
      </div>
      {set.titleZh ? (
        <p className="mt-1 text-stage-2xs text-stage-fg-subtle">{set.titleZh}</p>
      ) : null}

      <p className="mt-2 text-stage-2xs tabular-nums text-stage-fg-muted">
        {meta.join(" · ")}
      </p>

      {set.strategyHint ? (
        <p className="mt-3 rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-2 text-stage-2xs text-stage-fg-body">
          <span className="font-medium text-stage-fg">写作思路 </span>
          {set.strategyHint}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
        {status ? (
          <span className="text-stage-2xs text-stage-fg-subtle">{status}</span>
        ) : (
          <span />
        )}
        <Link
          href={`/ielts-lab/writing/${set.slug}`}
          className={words > 0 ? BUTTON_SECONDARY : BUTTON_PRIMARY}
        >
          {words > 0 ? "继续练习" : "开始练习"}
          <span className="sr-only">：{set.titleEn}</span>
        </Link>
      </div>
    </li>
  );
}

/**
 * `Previous 1 2 Next` (writing-spec §二.4), driven by component state.
 *
 * Client-side on purpose: a `?page=` search param would opt this route out of
 * static rendering, which Plan §4.1.2 forbids. The corpus is small enough that
 * every page is already in memory.
 */
function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
}) {
  const control =
    "rounded-stage-sm border border-stage-border px-3 py-1.5 text-stage-2xs transition-colors duration-stage-fast disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="任务分页" className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${control} text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg`}
      >
        Previous
      </button>
      {Array.from({ length: pageCount }, (_item, index) => index + 1).map(
        (number) => (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-current={number === page ? "page" : undefined}
            className={`${control} tabular-nums ${
              number === page
                ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
                : "text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg"
            }`}
          >
            {number}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className={`${control} text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg`}
      >
        Next
      </button>
    </nav>
  );
}
