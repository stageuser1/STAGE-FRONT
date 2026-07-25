"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  FREQUENCY_LABELS,
  SORT_LABELS,
  filterExams,
  sortExams,
  type ProgressFilter,
  type SortKey,
} from "@/lib/ielts/catalog";
import { buildProgressIndex, pickRandomExam } from "@/lib/ielts/progress";
import { practiceHref, reviewHref } from "@/lib/ielts/session";
import { loadRecords } from "@/lib/ielts/storage";
import type {
  ExamCategory,
  ExamFrequency,
  ExamProgress,
  ExamSummary,
} from "@/lib/ielts/types";
import { Badge, EmptyNote } from "./ui";

const FREQUENCIES: ExamFrequency[] = ["high", "medium", "low"];
const SORT_KEYS: SortKey[] = ["default", "frequency", "difficulty", "title"];

const PROGRESS_LABELS: Record<ProgressFilter, string> = {
  all: "全部",
  fresh: "未练习",
  practised: "已练习",
};

/**
 * Browse state, mirrored to sessionStorage.
 *
 * The source project keeps filters and list position when a learner leaves the
 * catalog and comes back; losing them turns "check one thing in my history"
 * into "set up the same four filters again".
 */
const BROWSE_STATE_KEY = "stage.ielts.browse";

interface BrowseState {
  search: string;
  category: ExamCategory | "all";
  frequency: ExamFrequency | "all";
  progress: ProgressFilter;
  sort: SortKey;
}

const INITIAL_STATE: BrowseState = { ...DEFAULT_FILTERS, sort: "default" };

function readBrowseState(): BrowseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BROWSE_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrowseState>;
    // Spread over the defaults so a state written by an older build — or a
    // hand-edited value — cannot leave a field undefined.
    return { ...INITIAL_STATE, ...parsed };
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

export function ExamCatalog({ exams }: { exams: ExamSummary[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [state, setState] = useState<BrowseState>(INITIAL_STATE);
  const [progress, setProgress] = useState<Map<string, ExamProgress>>(
    () => new Map(),
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setProgress(buildProgressIndex(loadRecords()));

    const saved = readBrowseState();
    // An explicit ?category= (the overview's category cards) is a deliberate
    // request and outranks whatever the learner last had selected.
    const fromUrl = CATEGORIES.find((value) => value === categoryParam);
    setState({
      ...(saved ?? INITIAL_STATE),
      ...(fromUrl ? { category: fromUrl } : {}),
    });
    setRestored(true);
  }, [categoryParam]);

  useEffect(() => {
    // Skipped until the saved state has been restored, so the first render's
    // defaults cannot overwrite it.
    if (!restored || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(BROWSE_STATE_KEY, JSON.stringify(state));
    } catch {
      // Browse state is a convenience; a full quota must not break the catalog.
    }
  }, [state, restored]);

  const practisedIds = useMemo(() => new Set(progress.keys()), [progress]);

  const visible = useMemo(
    () =>
      sortExams(
        filterExams(exams, {
          search: state.search,
          category: state.category,
          frequency: state.frequency,
          progress: state.progress,
          practised: practisedIds,
        }),
        state.sort,
      ),
    [exams, state, practisedIds],
  );

  // Corpus position, so the ordinal on a card is stable under filtering and
  // sorting — it identifies the passage rather than its place in this list.
  const ordinals = useMemo(() => {
    const map = new Map<string, number>();
    exams.forEach((exam, index) => map.set(exam.id, index + 1));
    return map;
  }, [exams]);

  const isFiltered =
    state.search !== "" ||
    state.category !== "all" ||
    state.frequency !== "all" ||
    state.progress !== "all";

  function practiseRandom() {
    const pick = pickRandomExam(visible, progress);
    if (pick) router.push(practiceHref(pick.id));
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">题库浏览</h1>
          <p className="mt-1 text-sm text-stage-fg-muted">
            共 {exams.length} 篇 · 已练习 {practisedIds.size} 篇
          </p>
        </div>
        <button
          type="button"
          onClick={practiseRandom}
          disabled={visible.length === 0}
          className="rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover disabled:opacity-50"
        >
          从结果中随机练习
        </button>
      </header>

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={state.search}
            onChange={(event) =>
              setState((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder="搜索标题…"
            aria-label="搜索题目标题"
            className="min-w-0 flex-1 rounded-stage-md border border-stage-border bg-stage-bg px-4 py-2 text-sm outline-none focus:border-stage-primary"
          />
          <label className="flex items-center gap-2 text-sm text-stage-fg-muted">
            <span className="sr-only sm:not-sr-only">排序</span>
            <select
              value={state.sort}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  sort: event.target.value as SortKey,
                }))
              }
              aria-label="排序方式"
              className="rounded-stage-md border border-stage-border bg-stage-bg px-3 py-2 text-sm text-stage-fg outline-none focus:border-stage-primary"
            >
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip
            active={state.category === "all"}
            onClick={() => setState((prev) => ({ ...prev, category: "all" }))}
          >
            全部
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              active={state.category === value}
              onClick={() => setState((prev) => ({ ...prev, category: value }))}
            >
              {value}
            </Chip>
          ))}
          <span className="mx-1 w-px bg-stage-border" aria-hidden />
          <Chip
            active={state.frequency === "all"}
            onClick={() => setState((prev) => ({ ...prev, frequency: "all" }))}
          >
            不限频次
          </Chip>
          {FREQUENCIES.map((value) => (
            <Chip
              key={value}
              active={state.frequency === value}
              onClick={() => setState((prev) => ({ ...prev, frequency: value }))}
            >
              {FREQUENCY_LABELS[value]}
            </Chip>
          ))}
          <span className="mx-1 w-px bg-stage-border" aria-hidden />
          {(Object.keys(PROGRESS_LABELS) as ProgressFilter[]).map((value) => (
            <Chip
              key={value}
              active={state.progress === value}
              onClick={() => setState((prev) => ({ ...prev, progress: value }))}
            >
              {PROGRESS_LABELS[value]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-stage-fg-muted">匹配 {visible.length} 篇</p>
        {isFiltered ? (
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({ ...INITIAL_STATE, sort: prev.sort }))
            }
            className="text-sm text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
          >
            清除筛选
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyNote>没有符合条件的文章，试试调整筛选条件。</EmptyNote>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((exam) => (
            <li key={exam.id}>
              <ExamCard
                exam={exam}
                ordinal={ordinals.get(exam.id) ?? 0}
                progress={progress.get(exam.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExamCard({
  exam,
  ordinal,
  progress,
}: {
  exam: ExamSummary;
  ordinal: number;
  progress?: ExamProgress;
}) {
  const meta = (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stage-fg-muted">
        <span className="tabular-nums">{ordinal}</span>
        <span className="rounded bg-stage-bg-soft px-1.5 py-0.5 font-medium">
          {exam.category}
        </span>
        <span>{FREQUENCY_LABELS[exam.frequency]}</span>
        {exam.difficultyScore !== undefined ? (
          <span>难度 {exam.difficultyScore}</span>
        ) : null}
        {exam.hasExplanation ? <span>· 含解析</span> : null}
      </div>
      <p className="text-sm font-medium leading-snug">
        {progress ? (
          <span
            aria-hidden
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-stage-primary align-middle"
          />
        ) : null}
        {exam.title}
      </p>
    </>
  );

  if (!exam.interactive) {
    return (
      <div className="h-full rounded-stage-md border border-dashed border-stage-border p-4 opacity-60">
        {meta}
        <p className="mt-2 text-xs text-stage-fg-muted">暂无交互版本</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-stage-md border border-stage-border p-4 transition-colors hover:border-stage-primary">
      <Link href={practiceHref(exam.id)} className="flex-1">
        {meta}
        <span className="sr-only">
          {progress ? "已练习，开始新的一次练习" : "开始练习"}
        </span>
      </Link>

      {progress ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stage-border pt-2 text-xs">
          <Badge tone={progress.bestAccuracy >= 0.75 ? "positive" : "warning"}>
            最佳 {Math.round(progress.bestAccuracy * 100)}%
          </Badge>
          <span className="text-stage-fg-muted">练习 {progress.attempts} 次</span>
          <Link
            href={reviewHref(exam.id, progress.lastRecordId)}
            className="ml-auto text-stage-fg-muted underline-offset-2 transition-colors hover:text-stage-fg hover:underline"
          >
            回顾上次
          </Link>
        </div>
      ) : null}
    </div>
  );
}
