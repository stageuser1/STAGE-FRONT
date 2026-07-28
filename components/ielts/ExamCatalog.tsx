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
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  Chip,
  EmptyNote,
  FIELD,
  PageHeader,
  StatusDot,
  Tag,
  accuracyText,
  splitTitle,
} from "./ui";

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
 * Filters and list position survive leaving the catalog and coming back;
 * losing them turns "check one thing in my history" into "set up the same four
 * filters again".
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

export function ExamCatalog({
  exams,
  /**
   * Question-type labels per exam id, resolved on the server (the type index
   * is 26KB and the client only needs the words).
   */
  typeLabels = {},
}: {
  exams: ExamSummary[];
  typeLabels?: Record<string, string[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [state, setState] = useState<BrowseState>(INITIAL_STATE);
  const [progress, setProgress] = useState<Map<string, ExamProgress>>(
    () => new Map(),
  );
  // Wrong-answer counts of each exam's latest attempt, and any in-flight
  // drafts: together these turn the old binary "practised" dot into the
  // four-state row semantics.
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
    // An explicit ?category= (the overview's Part links) is a deliberate
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
      <PageHeader
        title="题库"
        subtitle={`共 ${exams.length} 篇 · 已练习 ${practisedIds.size} 篇`}
        actions={
          <button
            type="button"
            onClick={practiseRandom}
            disabled={visible.length === 0}
            className={BUTTON_PRIMARY}
          >
            从结果中随机练习
          </button>
        }
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={state.search}
            onChange={(event) =>
              setState((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder="搜索题目"
            aria-label="搜索题目"
            className={`min-w-0 flex-1 ${FIELD}`}
          />
          <label className="flex items-center gap-2 text-stage-xs text-stage-fg-muted">
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
              className={FIELD}
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
          <span className="mx-1 w-px self-stretch bg-stage-border" aria-hidden />
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
          <span className="mx-1 w-px self-stretch bg-stage-border" aria-hidden />
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
        <p className="text-stage-xs text-stage-fg-muted">
          匹配 {visible.length} 篇
        </p>
        {isFiltered ? (
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({ ...INITIAL_STATE, sort: prev.sort }))
            }
            className={BUTTON_QUIET}
          >
            清除筛选
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyNote>没有符合条件的文章，试试调整筛选条件。</EmptyNote>
      ) : (
        <ul className="overflow-hidden rounded-stage-lg border border-stage-border">
          {visible.map((exam) => (
            <li
              key={exam.id}
              className="border-b border-stage-border last:border-b-0"
            >
              <ExamRow
                exam={exam}
                types={typeLabels[exam.id] ?? []}
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

/**
 * One catalog row (master-spec 批次二 §2).
 *
 * Columns: title (English main + Chinese subtitle) · Part · question type ·
 * my accuracy · status dot · enter arrow. There is deliberately no
 * cohort-average column — ruling C4 removed it, because STAGE has no telemetry
 * and an editor-typed figure would violate its provenance rule.
 *
 * The whole row is clickable via a stretched link on the title, so the
 * secondary "回顾上次" link can sit inside the row without nesting anchors.
 */
function ExamRow({
  exam,
  types,
  progress,
  status,
  wrongCount,
}: {
  exam: ExamSummary;
  types: string[];
  progress?: ExamProgress;
  status: ExamStatus;
  wrongCount: number;
}) {
  const { en, zh } = splitTitle(exam.title);
  const shownTypes = types.slice(0, 2);
  const extraTypes = types.length - shownTypes.length;

  const identity = (
    <>
      <p className="truncate text-stage-xs font-medium text-stage-fg">{en}</p>
      {zh ? (
        <p className="truncate text-stage-2xs text-stage-fg-subtle">{zh}</p>
      ) : null}
    </>
  );

  const tags = (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <Tag>{exam.category}</Tag>
      {shownTypes.map((type) => (
        <Tag key={type}>{type}</Tag>
      ))}
      {extraTypes > 0 ? <Tag>+{extraTypes}</Tag> : null}
      <span className="text-stage-2xs text-stage-fg-subtle">
        {FREQUENCY_LABELS[exam.frequency]}
        {exam.difficultyScore !== undefined
          ? ` · 难度 ${exam.difficultyScore}`
          : ""}
      </span>
    </div>
  );

  if (!exam.interactive) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-stage-bg-soft px-4 py-3">
        <div className="min-w-0 flex-1 opacity-70">{identity}</div>
        {tags}
        <span className="text-stage-2xs text-stage-fg-subtle">暂无交互版本</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-stage-fast hover:bg-stage-bg-soft">
      <div className="min-w-0 flex-1">
        <Link
          href={practiceHref(exam.id)}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {identity}
          <span className="sr-only">
            {progress ? "已练习，开始新的一次练习" : "开始练习"}
          </span>
        </Link>
      </div>

      {tags}

      {/* Accuracy of the latest attempt. "—" when unpractised: absent data is
          not a zero score. */}
      <div className="flex shrink-0 items-center gap-4">
        <span className="w-14 text-right text-stage-xs font-semibold tabular-nums text-stage-fg">
          <span className="sr-only">我的正确率 </span>
          {accuracyText(progress?.lastAccuracy ?? null)}
        </span>
        <span className="w-20">
          <StatusDot
            status={status}
            count={status === "completed_with_errors" ? wrongCount : undefined}
          />
        </span>
        {progress ? (
          <Link
            href={reviewHref(exam.id, progress.lastRecordId)}
            className={`relative ${BUTTON_QUIET}`}
          >
            回顾上次
          </Link>
        ) : null}
        <span aria-hidden className="text-stage-fg-subtle">
          →
        </span>
      </div>
    </div>
  );
}
