"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  WRITING_ESSAY_TYPE_LABELS,
  WRITING_FREQUENCY_LABELS,
  type WritingT2Question,
} from "@/lib/ielts/writing-types";
import { writingStrategyTip } from "@/lib/ielts/writing-tips";
import { Badge, EmptyNote, Tag } from "./ui";

/**
 * 全部 / Task 1 / Task 2.
 *
 * `task1` is in the union but unreachable: the T1 archive is frozen and the bank
 * holds no Task 1 question, so its tab is inert. It is rendered anyway because
 * the module is a two-task exam and a list that silently omitted Task 1 would
 * read as "Task 1 does not exist" rather than "Task 1 is not ready".
 */
type TaskFilter = "all" | "task1" | "task2";

/**
 * Nine cards fill the three-column grid exactly, which is the page size the
 * Writing catalog already used. The export's own `perPage` is 4 — a value sized
 * for its six-item mock; at 21 questions it would make six pages of one row.
 */
const PAGE_SIZE = 9;

/** Task 2 is 40 minutes of the 60-minute paper. One task per attempt in this phase. */
const TASK2_MINUTES = 40;

/**
 * IELTS Writing Practice — the task list (writing-spec §二).
 *
 * Geometry from the approved export's `WritingTasks.jsx`: an 18px page grid, a
 * `minmax(288px,1fr)` auto-fit card grid at 14px, 18px cards at 12px, and the
 * gold 策略提示 panel. Three of its card fields are deliberately not rendered:
 *
 *  - **difficulty** (入门/进阶/挑战) — the bank has no difficulty field. A chip
 *    assigned by this component would be an invention with a learner-facing
 *    consequence: it tells someone what to attempt next.
 *  - **the Chinese subtitle** — `promptTextCn` does not exist in the data. No row
 *    has one, so no row shows one; the card is laid out to tolerate its absence
 *    rather than reserve a blank line for it.
 *  - **`2 tasks`** — this phase practises Task 2 alone.
 *
 * The frequency badge takes the slot the difficulty chip occupied, and appears
 * only on the six questions that carry the field. Nothing here scores, ranks or
 * predicts a band (§五.8).
 */
export function WritingT2Catalog({
  questions,
  sourceStatement,
}: {
  questions: WritingT2Question[];
  sourceStatement: string;
}) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [page, setPage] = useState(1);

  // 全部 and Task 2 are the same set while Task 1 is frozen. The filter is still
  // applied rather than shortcut, so it keeps working when T1 lands.
  const rows = useMemo(
    () => (filter === "task1" ? [] : questions),
    [questions, filter],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped rather than reset, matching the Reading and Speaking catalogs:
  // narrowing a filter lands on the last page instead of discarding the
  // reading position.
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="grid content-start gap-[18px]">
      <h1 className="text-stage-h2 font-bold leading-[1.15] text-stage-fg">
        IELTS Writing Practice
      </h1>
      <p className="max-w-[56ch] text-stage-sm leading-[1.7] text-stage-fg-muted">
        按任务类型练习大作文。本阶段开放 Task 2，题目来自考生考后回忆，逐字保留；草稿只保存在本机浏览器。
      </p>

      <TaskTabs
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setPage(1);
        }}
      />

      {visible.length === 0 ? (
        <EmptyNote>
          {questions.length === 0
            ? "写作题目还没有上线。题目发布后会出现在这里。"
            : "这个分类下还没有题目。"}
        </EmptyNote>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(288px,1fr))] gap-3.5">
          {visible.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <Pagination
          page={current}
          pageCount={pageCount}
          total={rows.length}
          onChange={setPage}
        />
      ) : null}

      {/*
        Not in the export, and required by the data contract: `writing-types.ts`
        states that the provenance disclaimer is rendered wherever the bank is.
        These prompts are recollections, not official wording, and a learner
        choosing what to practise is entitled to know that before they spend
        forty minutes on one.
      */}
      <p className="max-w-[68ch] text-stage-2xs leading-[1.7] text-stage-fg-subtle">
        {sourceStatement}
      </p>
    </div>
  );
}

/**
 * The task filter, at the export's `Tabs variant="pill"` geometry: a sunken 8px
 * tray with 4px of padding holding 4px-radius tabs, the selected one a white
 * chip. Local rather than `./ui`'s `Tabs`, which is the fully-rounded segmented
 * control this screen does not use — the same split `SpeakingCatalog` makes.
 *
 * Task 1 is a real `<button disabled>` rather than a styled `<span>`: it is a
 * control that will work later, and a disabled button is what tells a screen
 * reader "this exists and is unavailable". The 待上线 marker carries the reason
 * in text, so it survives greyscale and does not depend on the hover title.
 */
function TaskTabs({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (next: TaskFilter) => void;
}) {
  const tabs = [
    { value: "all", label: "全部" },
    { value: "task1", label: "Task 1", pending: true },
    { value: "task2", label: "Task 2" },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="写作任务分类"
      className="inline-flex flex-wrap gap-1.5 self-start rounded-stage-sm bg-stage-bg-soft p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        const pending = "pending" in tab;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={pending}
            title={pending ? "Task 1 题库尚未上线" : undefined}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-stage-xs px-4 py-2 text-stage-sm font-medium transition-colors duration-stage-fast ease-stage-standard ${
              pending
                ? "cursor-not-allowed text-stage-neutral-400"
                : active
                  ? "bg-stage-bg text-stage-fg shadow-stage-xs"
                  : "text-stage-fg-muted hover:text-stage-fg"
            }`}
          >
            {tab.label}
            {pending ? (
              <span className="rounded-stage-xs bg-stage-bg px-1.5 py-0.5 text-stage-2xs font-normal text-stage-fg-subtle">
                待上线
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The export's md primary button, as a link.
 *
 * Written out rather than composed onto `./ui`'s `BUTTON_PRIMARY`, which is a
 * 13px control with no fixed height: overriding its padding and size would put
 * two conflicting utilities for one property on the element, and Tailwind
 * resolves that by stylesheet order, not by the order they are written here.
 */
const CARD_CTA =
  "inline-flex h-11 w-full items-center justify-center rounded-stage-sm bg-stage-primary px-[18px] text-stage-sm font-medium leading-none text-stage-fg-on-dark transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-primary-hover active:bg-stage-primary-press";

/**
 * One question card.
 *
 * `promptText` is the card title, clamped to four lines. Clamping is layout only
 * — the practice page renders the prompt in full — and no ellipsis is written
 * into the string, so nothing downstream can mistake the truncation for the
 * question's actual wording.
 */
function QuestionCard({ question }: { question: WritingT2Question }) {
  return (
    <li className="grid content-start gap-3 rounded-stage-lg border border-stage-border bg-stage-bg p-[18px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Task 2</Badge>
        {/* Omitted, not defaulted: `null` means the recall was too thin to
            classify, and guessing a rubric would misdirect the practice. */}
        {question.essayType ? (
          <Badge tone="neutral">
            {WRITING_ESSAY_TYPE_LABELS[question.essayType]}
          </Badge>
        ) : null}
        {question.frequency ? (
          <span className="ml-auto">
            <Tag>
              <span className="sr-only">出现频次 </span>
              {WRITING_FREQUENCY_LABELS[question.frequency]}
            </Tag>
          </span>
        ) : null}
      </div>

      <span className="line-clamp-4 text-stage-sm font-semibold leading-[1.55] text-stage-fg">
        {question.promptText}
      </span>

      <span className="flex flex-wrap gap-3.5 font-stage-mono text-stage-xs text-stage-fg-subtle">
        <span>预计 {TASK2_MINUTES} 分钟</span>
        <span>1 task</span>
      </span>

      {/*
        Methodology only (writing-spec §二.3), keyed by essay type — a
        pedagogical constant, not something the bank said about this question.
        The export puts a 14px lightbulb here; the Lab's icon set has none, and
        adding a glyph would mean editing a shared file this work may not touch,
        so the panel carries its label in text alone.
      */}
      <p className="rounded-stage-sm border border-stage-gold-200 bg-stage-gold-50 px-3 py-[11px] text-stage-xs leading-[1.7] text-stage-fg-body">
        <span className="font-semibold">策略提示 · </span>
        {writingStrategyTip(question.essayType)}
      </p>

      <Link href={`/ielts-lab/writing/t2/${question.id}`} className={CARD_CTA}>
        开始练习
        <span className="sr-only">：{question.promptText}</span>
      </Link>
    </li>
  );
}

/**
 * `Previous 1 2 Next 共 {N} 项` (writing-spec §二.4).
 *
 * The Reading and Speaking pager, not the one the Writing export draws. The
 * export gives this page ghost arrows and a soft-blue selected chip; the two
 * sibling catalogs use bordered arrows and a filled navy chip, and a learner
 * moving between the three banks meets this control on all of them, so
 * cross-module consistency was ruled to outrank the single page's export.
 * `共 {N} 项` stays in the row, which is where the export puts it — the siblings
 * carry that count elsewhere on their own pages.
 *
 * Client-side, so the route stays static — a `?page=` search param would opt it
 * into dynamic rendering (Plan §4.1.2).
 */
function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (next: number) => void;
}) {
  const control =
    "rounded-stage-sm border border-stage-border px-3 py-1.5 text-stage-2xs transition-colors duration-stage-fast disabled:cursor-not-allowed disabled:opacity-40";
  const quiet =
    "text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg";

  return (
    <nav
      aria-label="任务分页"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${control} ${quiet}`}
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
                : quiet
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
        className={`${control} ${quiet}`}
      >
        Next
      </button>
      <span className="ml-2 font-stage-mono text-stage-xs tabular-nums text-stage-fg-subtle">
        共 {total} 项
      </span>
    </nav>
  );
}
