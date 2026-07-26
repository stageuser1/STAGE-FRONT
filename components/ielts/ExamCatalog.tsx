"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  FREQUENCY_LABELS,
  SORT_LABELS,
  countByDimension,
  filterExams,
  sortExams,
  type ProgressFilter,
  type SortKey,
} from "@/lib/ielts/catalog";
import { loadDrafts } from "@/lib/ielts/draft";
import { buildProgressIndex, pickRandomExam } from "@/lib/ielts/progress";
import { practiceHref, reviewHref } from "@/lib/ielts/session";
import {
  buildLatestWrongIndex,
  examStatus,
  type ExamStatus,
} from "@/lib/ielts/status";
import { loadRecords } from "@/lib/ielts/storage";
import type {
  ExamCategory,
  ExamFrequency,
  ExamProgress,
  ExamSummary,
} from "@/lib/ielts/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { Badge, EmptyNote } from "./ui";

const FREQUENCIES: ExamFrequency[] = ["high", "medium", "low"];
const SORT_KEYS: SortKey[] = ["default", "frequency", "difficulty", "title"];

const PROGRESS_LABELS: Record<ProgressFilter, string> = {
  all: "全部",
  fresh: "未练习",
  practised: "已练习",
  wrong: "有错题",
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
  // Wrong-answer counts of each exam's latest attempt, and any in-flight
  // drafts: together these turn the old binary "practised" dot into the
  // four-state card semantics.
  const [wrongIndex, setWrongIndex] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [draftIds, setDraftIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const records = loadRecords();
    setProgress(buildProgressIndex(records));
    setWrongIndex(buildLatestWrongIndex(records));
    setDraftIds(new Set(loadDrafts().keys()));

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
  const errorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [examId, wrong] of wrongIndex) if (wrong > 0) ids.add(examId);
    return ids;
  }, [wrongIndex]);

  const activeFilters = useMemo(
    () => ({
      search: state.search,
      category: state.category,
      frequency: state.frequency,
      progress: state.progress,
      practised: practisedIds,
      withErrors: errorIds,
    }),
    [state, practisedIds, errorIds],
  );

  const visible = useMemo(
    () => sortExams(filterExams(exams, activeFilters), state.sort),
    [exams, activeFilters, state.sort],
  );

  // Counted against the other dimensions' selection, so a chip's number always
  // equals what clicking it yields.
  const categoryCounts = useMemo(
    () => countByDimension(exams, "category", activeFilters),
    [exams, activeFilters],
  );
  const frequencyCounts = useMemo(
    () => countByDimension(exams, "frequency", activeFilters),
    [exams, activeFilters],
  );
  const progressCounts = useMemo(
    () => countByDimension(exams, "progress", activeFilters),
    [exams, activeFilters],
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
            全部 {categoryCounts.get("all") ?? 0}
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              active={state.category === value}
              onClick={() => setState((prev) => ({ ...prev, category: value }))}
            >
              {value} {categoryCounts.get(value) ?? 0}
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
              {FREQUENCY_LABELS[value]} {frequencyCounts.get(value) ?? 0}
            </Chip>
          ))}
          <span className="mx-1 w-px bg-stage-border" aria-hidden />
          {(Object.keys(PROGRESS_LABELS) as ProgressFilter[]).map((value) => (
            <Chip
              key={value}
              active={state.progress === value}
              onClick={() => setState((prev) => ({ ...prev, progress: value }))}
            >
              {PROGRESS_LABELS[value]}{" "}
              {value === "all" ? exams.length : progressCounts.get(value) ?? 0}
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
                status={examStatus(
                  progress.get(exam.id),
                  draftIds.has(exam.id)
                    ? { examId: exam.id, updatedAt: "", answered: 0, total: 0 }
                    : undefined,
                  wrongIndex.get(exam.id),
                )}
                wrongCount={wrongIndex.get(exam.id) ?? 0}
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
  status,
  wrongCount,
}: {
  exam: ExamSummary;
  ordinal: number;
  progress?: ExamProgress;
  status: ExamStatus;
  wrongCount: number;
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
      {/* Three-state semantics replace the old binary "practised" dot: the
          card now says which of unstarted / in-progress / done / has-errors
          it is, in words as well as colour. */}
      <div className="mb-1.5">
        <StatusChip
          surface="app"
          state={status}
          count={status === "completed_with_errors" ? wrongCount : undefined}
        />
      </div>
      <p className="text-sm font-medium leading-snug">{exam.title}</p>
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
