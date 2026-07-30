"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  filterExams,
  sortExams,
  type CatalogFilters,
} from "@/lib/ielts/catalog";
import { buildProgressIndex, pickRandomExam } from "@/lib/ielts/progress";
import { isDueForRetest } from "@/lib/ielts/retest";
import { practiceHref, startEndless } from "@/lib/ielts/session";
import { buildLatestWrongIndex } from "@/lib/ielts/status";
import { loadRecords } from "@/lib/ielts/storage";
import type {
  ExamCategory,
  ExamFrequency,
  ExamProgress,
  ExamSummary,
} from "@/lib/ielts/types";
import { Icon } from "@/components/ui/Icon";
import {
  BUTTON_SECONDARY_SM,
  Badge,
  accuracyText,
  splitTitle,
} from "./ui";

const FREQUENCIES: ExamFrequency[] = ["high", "medium", "low"];

/**
 * Frequency wording for this screen.
 *
 * `FREQUENCY_LABELS` in lib/ielts/catalog.ts calls the third band 低频; the
 * approved export and this screen's spec call it 非高频. The shared map is left
 * alone rather than renamed under every other caller, so the two words describe
 * one band — worth unifying once someone decides which is canonical.
 */
const FREQUENCY_PILL_LABELS: Record<ExamFrequency, string> = {
  high: "高频",
  medium: "次高频",
  low: "非高频",
};

/**
 * Row status, in the export's three states.
 *
 * Narrower than `ExamStatus` from lib/ielts/status.ts on purpose: that type
 * carries a `pending` (进行中) draft state and labels its terminal states
 * 已完成 / 有错题, while the export's bank column is 未练习 / 已练习 / 待重测.
 * 待重测 is the state that module cannot express — it depends on how old the
 * attempt is, not only on whether it has wrong answers.
 */
type RowStatus = "fresh" | "practised" | "retest";

const STATUS_ORDER: RowStatus[] = ["fresh", "practised", "retest"];

const STATUS_LABELS: Record<RowStatus, string> = {
  fresh: "未练习",
  practised: "已练习",
  retest: "待重测",
};

/**
 * Dot colour per state. The export's note, verbatim: 已练习=核实绿 ·
 * 待重测=品牌蓝 · 未练习=中性（不用警示色）— an untouched passage is an
 * entrance, not a failure (master-spec 全局规则 §7).
 */
const STATUS_DOT: Record<RowStatus, string> = {
  fresh: "bg-stage-neutral-300",
  practised: "bg-stage-green-500",
  retest: "bg-stage-blue-500",
};

/**
 * Browse state, mirrored to sessionStorage.
 *
 * Filters survive leaving the catalog and coming back; losing them turns "check
 * one thing in my history" into "set up the same four filters again".
 */
const BROWSE_STATE_KEY = "stage.ielts.browse";

interface BrowseState {
  search: string;
  category: ExamCategory | "all";
  frequency: ExamFrequency | "all";
  /** Question-type *label*, matched against the server-resolved per-exam list. */
  type: string | "all";
  status: RowStatus | "all";
}

const INITIAL_STATE: BrowseState = {
  search: "",
  category: "all",
  frequency: "all",
  type: "all",
  status: "all",
};

function readBrowseState(): BrowseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BROWSE_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BrowseState>;
    // Spread over the defaults so a state written by an older build — which had
    // `progress` and `sort` instead of `type` and `status` — cannot leave a
    // field undefined.
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return null;
  }
}

export function ExamCatalog({
  exams,
  /**
   * Question-type labels per exam id, resolved on the server (the type index is
   * 26KB and the client only needs the words).
   */
  typeLabels = {},
  /** Every type label in the corpus, in index order — the filter row's options. */
  typeOptions = [],
}: {
  exams: ExamSummary[];
  typeLabels?: Record<string, string[]>;
  typeOptions?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [state, setState] = useState<BrowseState>(INITIAL_STATE);
  const [progress, setProgress] = useState<Map<string, ExamProgress>>(
    () => new Map(),
  );
  // Wrong-answer count of each exam's latest attempt. With the attempt's own
  // timestamp (carried on ExamProgress) this is what separates 待重测 from
  // 已练习.
  const [wrongIndex, setWrongIndex] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const records = loadRecords();
    setProgress(buildProgressIndex(records));
    setWrongIndex(buildLatestWrongIndex(records));

    const saved = readBrowseState();
    // An explicit ?category= is a deliberate request and outranks whatever the
    // learner last had selected.
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

  const statusById = useMemo(() => {
    const map = new Map<string, RowStatus>();
    for (const exam of exams) {
      const entry = progress.get(exam.id);
      if (!entry) {
        map.set(exam.id, "fresh");
        continue;
      }
      const wrong = wrongIndex.get(exam.id) ?? 0;
      map.set(
        exam.id,
        wrong > 0 && isDueForRetest(entry.lastAttemptAt) ? "retest" : "practised",
      );
    }
    return map;
  }, [exams, progress, wrongIndex]);

  /**
   * The two dimensions lib/ielts/catalog.ts cannot express, applied on top of
   * the ones it can: question type is per-exam data resolved on the server, and
   * `RowStatus` is a different partition from its `ProgressFilter`.
   */
  const matchesLocal = useMemo(() => {
    return (exam: ExamSummary) => {
      if (state.type !== "all") {
        if (!(typeLabels[exam.id] ?? []).includes(state.type)) return false;
      }
      if (state.status !== "all") {
        if (statusById.get(exam.id) !== state.status) return false;
      }
      return true;
    };
  }, [state.type, state.status, typeLabels, statusById]);

  const visible = useMemo(() => {
    const shared: CatalogFilters = {
      search: state.search,
      category: state.category,
      frequency: state.frequency,
    };
    // "default" is the corpus order; the export's bank offers no sort control.
    return sortExams(filterExams(exams, shared).filter(matchesLocal), "default");
  }, [exams, state.search, state.category, state.frequency, matchesLocal]);

  /**
   * Frequency tallies, counted against every other active filter but this one,
   * so a pill's number always equals what clicking it yields.
   */
  const frequencyCounts = useMemo(() => {
    const pool = filterExams(exams, {
      search: state.search,
      category: state.category,
    }).filter(matchesLocal);
    const counts = new Map<ExamFrequency, number>();
    for (const exam of pool) {
      counts.set(exam.frequency, (counts.get(exam.frequency) ?? 0) + 1);
    }
    return counts;
  }, [exams, state.search, state.category, matchesLocal]);

  function practiseRandom() {
    const pick = pickRandomExam(visible, progress);
    if (pick) router.push(practiceHref(pick.id));
  }

  /**
   * Endless mode's entry point.
   *
   * It lived on the overview's header until the four-card rebuild removed that
   * row; the export gives it no home, so it moves here beside the other two
   * practice modes rather than becoming unreachable.
   */
  function practiseEndless() {
    const pick = pickRandomExam(visible, progress);
    if (!pick) return;
    startEndless(pick.id);
    router.push(practiceHref(pick.id, "endless"));
  }

  const noResults = visible.length === 0;

  return (
    <div className="grid content-start gap-[18px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <h1 className="flex-1 text-stage-h2 font-bold leading-[1.15] text-stage-fg">
          Reading 题库
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={practiseRandom}
            disabled={noResults}
            className={`${BUTTON_SECONDARY_SM} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            随机练习
          </button>
          <Link href="/ielts-lab/suite" className={BUTTON_SECONDARY_SM}>
            套题练习
          </Link>
          <button
            type="button"
            onClick={practiseEndless}
            disabled={noResults}
            title="连续刷题，做完自动进入下一篇"
            className={`${BUTTON_SECONDARY_SM} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            无尽模式
          </button>
        </div>
      </div>

      <SearchField
        value={state.search}
        onChange={(next) => setState((prev) => ({ ...prev, search: next }))}
      />

      <div className="grid gap-3">
        <FacetRow label="频次">
          <FilterPill
            selected={state.frequency === "all"}
            onClick={() => setState((prev) => ({ ...prev, frequency: "all" }))}
          >
            全部
          </FilterPill>
          {FREQUENCIES.map((value) => (
            <FilterPill
              key={value}
              selected={state.frequency === value}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  frequency: prev.frequency === value ? "all" : value,
                }))
              }
              count={frequencyCounts.get(value) ?? 0}
            >
              {FREQUENCY_PILL_LABELS[value]}
            </FilterPill>
          ))}
        </FacetRow>

        <FacetRow label="Part">
          <FilterPill
            selected={state.category === "all"}
            onClick={() => setState((prev) => ({ ...prev, category: "all" }))}
          >
            全部
          </FilterPill>
          {CATEGORIES.map((value) => (
            <FilterPill
              key={value}
              selected={state.category === value}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  category: prev.category === value ? "all" : value,
                }))
              }
            >
              {value}
            </FilterPill>
          ))}
        </FacetRow>

        <FacetRow label="题型">
          <FilterPill
            selected={state.type === "all"}
            onClick={() => setState((prev) => ({ ...prev, type: "all" }))}
          >
            全部
          </FilterPill>
          {typeOptions.map((label) => (
            <FilterPill
              key={label}
              selected={state.type === label}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  type: prev.type === label ? "all" : label,
                }))
              }
            >
              {label}
            </FilterPill>
          ))}
          {/* Reference for the vocabulary these pills and the row tags use.
              Labelled rather than icon-only: the shared Icon set has no
              circle-help glyph, and a bare "?" needs the accessible name. */}
          <Link
            href="/ielts-lab/question-types"
            aria-label="题型说明"
            title="题型说明"
            className="grid h-8 w-8 flex-none place-items-center rounded-stage-pill border border-stage-border text-stage-xs text-stage-fg-muted transition-colors duration-stage-fast hover:bg-stage-bg-soft hover:text-stage-fg"
          >
            <span aria-hidden>?</span>
          </Link>
        </FacetRow>

        <FacetRow label="状态">
          <FilterPill
            selected={state.status === "all"}
            onClick={() => setState((prev) => ({ ...prev, status: "all" }))}
          >
            全部
          </FilterPill>
          {STATUS_ORDER.map((value) => (
            <FilterPill
              key={value}
              selected={state.status === value}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  status: prev.status === value ? "all" : value,
                }))
              }
            >
              {STATUS_LABELS[value]}
            </FilterPill>
          ))}
        </FacetRow>
      </div>

      {/* The row is a seven-column table and cannot compress far; below its
          natural width it scrolls inside this container rather than pushing the
          page sideways. The export is desktop-only and defines no narrow form. */}
      <div className="overflow-x-auto">
        <div className="min-w-[860px] overflow-hidden rounded-stage-lg border border-stage-border">
          {noResults ? (
            <p className="px-[18px] py-7 text-center text-stage-sm text-stage-fg-subtle">
              没有符合条件的文章，试试调整筛选条件。
            </p>
          ) : (
            <ul>
              {visible.map((exam, index) => (
                <ExamRow
                  key={exam.id}
                  exam={exam}
                  types={typeLabels[exam.id] ?? []}
                  progress={progress.get(exam.id)}
                  status={statusById.get(exam.id) ?? "fresh"}
                  last={index === visible.length - 1}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Full-width search box: 44px tall, leading glyph, blue focus ring. */
function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3.5 transition-colors duration-stage-fast ease-stage-standard focus-within:border-stage-blue-500 focus-within:shadow-stage-focus">
      <span aria-hidden className="grid flex-none text-stage-fg-subtle">
        <Icon name="search" size={18} />
      </span>
      <span className="sr-only">搜索题目</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索题目"
        className="min-w-0 flex-1 bg-transparent text-stage-sm text-stage-fg outline-none placeholder:text-stage-fg-subtle"
      />
    </label>
  );
}

/** One filter row: fixed-width group name, then its pills. */
function FacetRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="w-11 flex-none text-stage-xs text-stage-fg-subtle">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Selectable filter pill, at the export's `Tag` sizes.
 *
 * A local component rather than the shared `Chip` from ./ui: that one is 13px on
 * 12px padding with muted unselected text, and this screen's spec is the
 * export's 15px on 14px padding with body-coloured unselected text. The two
 * should converge, but not by restyling Chip under its other callers.
 */
function FilterPill({
  selected,
  onClick,
  count,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  /** Tally shown after the label. Omitted entirely when undefined. */
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-[34px] flex-none items-center gap-1.5 whitespace-nowrap rounded-stage-pill border px-3.5 text-stage-sm font-medium transition-colors duration-stage-fast ease-stage-standard ${
        selected
          ? "border-stage-primary bg-stage-primary text-stage-fg-on-dark"
          : "border-stage-border bg-stage-bg text-stage-fg-body hover:border-stage-border-strong hover:bg-stage-bg-soft"
      }`}
    >
      {children}
      {count !== undefined ? (
        <span className="ml-0.5 font-stage-mono text-[11px] opacity-75">
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * One catalog row (master-spec 批次二 §2).
 *
 * Columns: title (English main + Chinese subtitle) · Part · question type ·
 * my accuracy · status · 开始练习 · enter arrow. There is deliberately no
 * cohort-average column: ruling C4 removed it, and no record or catalog entry
 * carries such a figure — the same reasoning that keeps it off the overview.
 *
 * The whole row is clickable via a stretched link on the title; 开始练习 sits
 * above that overlay so it stays its own target.
 */
function ExamRow({
  exam,
  types,
  progress,
  status,
  last,
}: {
  exam: ExamSummary;
  types: string[];
  progress?: ExamProgress;
  status: RowStatus;
  last: boolean;
}) {
  const { en, zh } = splitTitle(exam.title);
  const accuracy = progress?.lastAccuracy ?? null;
  const primaryType = types[0];
  const extraTypes = types.length - (primaryType ? 1 : 0);

  const cells = (
    <>
      <span className="grid min-w-0">
        <span className="truncate text-stage-sm font-medium text-stage-fg">
          {en}
        </span>
        {zh ? (
          <span className="mt-0.5 truncate text-stage-2xs text-stage-fg-subtle">
            {zh}
          </span>
        ) : null}
      </span>

      <Badge tone="neutral">{exam.category}</Badge>

      <span className="flex items-center gap-1.5">
        {primaryType ? <Badge tone="neutral">{primaryType}</Badge> : null}
        {extraTypes > 0 ? <Badge tone="neutral">+{extraTypes}</Badge> : null}
      </span>

      <span
        className={`font-stage-mono text-stage-xs ${
          accuracy === null ? "text-stage-fg-subtle" : "text-stage-fg-body"
        }`}
      >
        我的 {accuracyText(accuracy)}
      </span>

      <span className="inline-flex items-center gap-1.5 text-stage-2xs text-stage-fg-subtle">
        <span
          aria-hidden
          className={`inline-block h-2 w-2 flex-none rounded-stage-pill ${STATUS_DOT[status]}`}
        />
        {STATUS_LABELS[status]}
      </span>
    </>
  );

  const rowClass = `grid grid-cols-[minmax(0,1.7fr)_auto_auto_150px_auto_auto_auto] items-center gap-3.5 px-[18px] py-3.5 ${
    last ? "" : "border-b border-stage-border"
  }`;

  // p2-high-26 has no interactive dataset. A row that looks startable but
  // cannot start would be worse than one that says so.
  if (!exam.interactive) {
    return (
      <li className={`${rowClass} bg-stage-bg-soft`}>
        {cells}
        <span className="whitespace-nowrap text-stage-2xs text-stage-fg-subtle">
          暂无交互版本
        </span>
        <span aria-hidden />
      </li>
    );
  }

  return (
    <li
      className={`relative cursor-pointer transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-bg-soft ${rowClass}`}
    >
      {/* display:contents so the cells stay direct grid items; the stretched
          ::after is absolutely positioned and so claims no cell of its own. */}
      <Link
        href={practiceHref(exam.id)}
        className="contents after:absolute after:inset-0 after:content-['']"
      >
        {cells}
      </Link>

      {/* Same destination as the row, kept focusable and named: the stretched
          overlay makes the row clickable for pointers, not for keyboards. */}
      <Link
        href={practiceHref(exam.id)}
        className={`relative ${BUTTON_SECONDARY_SM} bg-stage-bg`}
      >
        开始练习
      </Link>

      <span aria-hidden className="grid text-stage-neutral-400">
        <Icon name="chevron-right" size={16} />
      </span>
    </li>
  );
}
