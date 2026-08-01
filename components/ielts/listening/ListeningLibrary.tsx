"use client";

/**
 * Listening 题库 — the list, its four filter rows and its search box.
 *
 * Layout only, in the sense B3 set for the question components: every judgement
 * it makes is `lib/ielts/listening-library-utils.ts`'s, and the two it cannot
 * push down there — reading localStorage, and writing the query string — are
 * isolated in one effect each.
 *
 * The rows arrive as props. This component never constructs a
 * `ListeningSetSource`; the route above it does that once, exactly as the
 * practice page does, so swapping the fixture for a real backend touches two
 * lines in one file and nothing here.
 *
 * Two columns the export draws are deliberately not filled in.
 *
 * 平均 renders an em dash on every row. A cohort average is a number produced
 * by a population of attempts, and Phase 1 has no attempt store — every record
 * is one browser's localStorage. Printing anything else would be presenting an
 * invention as a measurement; the same reasoning removed the cohort column from
 * the Reading catalog (ruling C4).
 *
 * 套题匹配 is rendered inert. There is no suite behind it for Listening yet,
 * and ruling C6's treatment for an action with nothing behind it is a muted,
 * unclickable control that says so, not a live button that does nothing.
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import {
  BUTTON_DISABLED_SM,
  BUTTON_SECONDARY_SM,
  Badge,
  accuracyText,
} from "@/components/ielts/ui";
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  INITIAL_FILTERS,
  LIBRARY_ACTION_LABELS,
  LIBRARY_STATUS_LABELS,
  STATUS_FILTERS,
  STATUS_FILTER_LABELS,
  attemptAccuracy,
  availableTypes,
  filterRows,
  libraryAction,
  libraryStatus,
  parseLibraryParams,
  serializeLibraryParams,
  type LibraryFilters,
  type LibraryRow,
  type LibraryStatus,
} from "@/lib/ielts/listening-library-utils";
import { parseStoredAttempt } from "@/lib/ielts/listening-persist";
import { GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { LISTENING_PARTS } from "@/lib/ielts/listening-types";
import type { Attempt, ScoringRule } from "@/lib/ielts/listening-types";

import { readStoredAttempt } from "./useAttemptStorage";

/** Dot colour per state — the export's note: 已练习 green, 未练习 neutral. */
const STATUS_DOT: Record<LibraryStatus, string> = {
  fresh: "bg-stage-neutral-300",
  in_progress: "bg-stage-blue-500",
  practised: "bg-stage-green-500",
};

export function practiceHref(setId: string): string {
  return `/ielts-lab/practice/listening/${encodeURIComponent(setId)}`;
}

export function ListeningLibrary({
  rows,
  /**
   * Answer keys per set id.
   *
   * The 我的 column is a percentage, a stored `Attempt` holds answers and no
   * score, and marking lives in `scoreAttempt` — so the list has to mark. The
   * practice route already ships the same keys to the browser and records why:
   * there is no attempt endpoint, the material is written for this repository,
   * and a candidate must be able to hand a paper in offline. The seam is
   * unchanged — a backend that must withhold answers would return a stored
   * score for this column instead, and the route above is where that swap is
   * made.
   */
  rulesById,
}: {
  rows: LibraryRow[];
  rulesById: Record<string, ScoringRule[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<LibraryFilters>(INITIAL_FILTERS);
  /**
   * The last query string this component itself put in the URL.
   *
   * It is what separates our own write from someone else's navigation. Without
   * it the two effects below would chase each other: the writer pushes a
   * string, the reader sees the URL change and adopts it, and adopting it
   * re-runs the writer.
   */
  const written = useRef<string>("");

  /* ---- localStorage: what has been practised ------------------------- */

  const [attempts, setAttempts] = useState<Map<string, Attempt | null>>(
    () => new Map(),
  );

  useEffect(() => {
    // After mount, because localStorage does not exist during the server
    // render. Until it resolves every row reads 未练习, which is what an
    // untouched browser would say anyway — no flash of a wrong score, because
    // a null attempt has no score to print.
    setAttempts(
      new Map(rows.map((row) => [row.id, parseStoredAttempt(readStoredAttempt(row.id))])),
    );
  }, [rows]);

  const statusOf = useCallback(
    (setId: string): LibraryStatus => libraryStatus(attempts.get(setId) ?? null),
    [attempts],
  );

  /* ---- the URL -------------------------------------------------------- */

  // Adopt the URL when something other than this component moved it: the first
  // paint of a shared link, and every Back or Forward after that.
  useEffect(() => {
    const query = searchParams.toString();
    if (query === written.current) return;
    written.current = query;
    setFilters(parseLibraryParams(query));
  }, [searchParams]);

  // And write our own changes out. `replace` rather than `push`: a filter row
  // is not a place, and a chip per history entry would make Back a rewind
  // through eleven pill clicks instead of a way off the page.
  useEffect(() => {
    const query = serializeLibraryParams(filters);
    if (query === written.current) return;
    written.current = query;
    router.replace(query === "" ? pathname : `${pathname}?${query}`);
  }, [filters, pathname, router]);

  const update = useCallback(
    (patch: Partial<LibraryFilters>) =>
      setFilters((previous) => ({ ...previous, ...patch })),
    [],
  );

  /* ---- the list ------------------------------------------------------- */

  const types = useMemo(() => availableTypes(rows), [rows]);
  const visible = useMemo(
    () => filterRows(rows, filters, statusOf),
    [rows, filters, statusOf],
  );

  return (
    <div className="grid content-start gap-[18px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <h1 className="flex-1 text-stage-h2 font-bold leading-[1.15] text-stage-fg">
          Listening 题库
        </h1>
        <span aria-disabled title="即将上线" className={BUTTON_DISABLED_SM}>
          套题匹配
        </span>
      </div>

      <label className="flex h-11 items-center gap-2.5 rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3.5 transition-colors duration-stage-fast ease-stage-standard focus-within:border-stage-blue-500 focus-within:shadow-stage-focus">
        <span aria-hidden className="grid flex-none text-stage-fg-subtle">
          <Icon name="search" size={18} />
        </span>
        <span className="sr-only">搜索题目</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="搜索题目"
          className="min-w-0 flex-1 bg-transparent text-stage-sm text-stage-fg outline-none placeholder:text-stage-fg-subtle"
        />
      </label>

      <div className="grid gap-3">
        <FacetRow label="频次">
          <FilterPill
            selected={filters.frequency === "all"}
            onClick={() => update({ frequency: "all" })}
          >
            全部
          </FilterPill>
          {FREQUENCIES.map((value) => (
            <FilterPill
              key={value}
              selected={filters.frequency === value}
              // A selected pill clicked again clears its facet, so every filter
              // can be undone where it was set.
              onClick={() =>
                update({
                  frequency: filters.frequency === value ? "all" : value,
                })
              }
            >
              {FREQUENCY_LABELS[value]}
            </FilterPill>
          ))}
        </FacetRow>

        <FacetRow label="Part">
          <FilterPill
            selected={filters.part === "all"}
            onClick={() => update({ part: "all" })}
          >
            全部
          </FilterPill>
          {LISTENING_PARTS.map((value) => (
            <FilterPill
              key={value}
              selected={filters.part === value}
              onClick={() =>
                update({ part: filters.part === value ? "all" : value })
              }
            >
              P{value}
            </FilterPill>
          ))}
        </FacetRow>

        <FacetRow label="题型">
          <FilterPill
            selected={filters.type === "all"}
            onClick={() => update({ type: "all" })}
          >
            全部
          </FilterPill>
          {types.map((value) => (
            <FilterPill
              key={value}
              selected={filters.type === value}
              onClick={() =>
                update({ type: filters.type === value ? "all" : value })
              }
            >
              {GROUP_TYPE_LABELS[value]}
            </FilterPill>
          ))}
        </FacetRow>

        <FacetRow label="状态">
          {STATUS_FILTERS.map((value) => (
            <FilterPill
              key={value}
              selected={filters.status === value}
              onClick={() =>
                update({
                  status: filters.status === value ? "all" : value,
                })
              }
            >
              {STATUS_FILTER_LABELS[value]}
            </FilterPill>
          ))}
        </FacetRow>
      </div>

      {/* The row is a seven-column table and cannot compress far; below its
          natural width it scrolls inside this container rather than pushing
          the page sideways, matching the Reading bank. */}
      <div className="overflow-x-auto">
        <div className="min-w-[860px] overflow-hidden rounded-stage-lg border border-stage-border">
          {visible.length === 0 ? (
            <p className="px-[18px] py-7 text-center text-stage-sm text-stage-fg-subtle">
              没有符合条件的题目，试试调整筛选条件。
            </p>
          ) : (
            <ul>
              {visible.map((row, index) => (
                <SetRow
                  key={row.id}
                  row={row}
                  status={statusOf(row.id)}
                  accuracy={attemptAccuracy(
                    attempts.get(row.id) ?? null,
                    rulesById[row.id],
                  )}
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
 * The same local component `ExamCatalog` defines, for the same reason: the
 * shared `Chip` in ./ui is 13px on 12px padding, and this screen's spec is
 * 15px on 14px. The two should converge — but by a decision about `Chip`, not
 * by one bank screen quietly restyling it under the other.
 */
function FilterPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
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
    </button>
  );
}

/**
 * One library row.
 *
 * Columns: title (English over Chinese) · Part · primary type · 我的 · 平均 ·
 * status · action · enter arrow. The whole row is clickable through a stretched
 * link on the title; the action button sits above that overlay so it stays its
 * own target and keeps its own word.
 */
function SetRow({
  row,
  status,
  accuracy,
  last,
}: {
  row: LibraryRow;
  status: LibraryStatus;
  /** [0,1] from a submitted attempt, or `null` — never a zero standing in. */
  accuracy: number | null;
  last: boolean;
}) {
  const href = practiceHref(row.id);
  const primaryType = row.types[0];
  const extraTypes = row.types.length - (primaryType ? 1 : 0);

  return (
    <li
      className={`relative grid cursor-pointer grid-cols-[minmax(0,1.7fr)_auto_auto_110px_110px_auto_auto_auto] items-center gap-3.5 px-[18px] py-3.5 transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-bg-soft ${
        last ? "" : "border-b border-stage-border"
      }`}
    >
      {/* display:contents so the cells stay direct grid items; the stretched
          ::after is absolutely positioned and claims no cell of its own. */}
      <Link
        href={href}
        className="contents after:absolute after:inset-0 after:content-['']"
      >
        <span className="grid min-w-0">
          <span className="truncate text-stage-sm font-medium text-stage-fg">
            {row.title}
          </span>
          <span className="mt-0.5 truncate text-stage-2xs text-stage-fg-subtle">
            {row.titleZh} · {row.questionCount} 题
          </span>
        </span>

        <Badge tone="neutral">Part {row.part}</Badge>

        <span className="flex items-center gap-1.5">
          {primaryType ? (
            <Badge tone="neutral">{GROUP_TYPE_LABELS[primaryType]}</Badge>
          ) : null}
          {extraTypes > 0 ? <Badge tone="neutral">+{extraTypes}</Badge> : null}
        </span>

        <span
          className={`font-stage-mono text-stage-xs ${
            accuracy === null ? "text-stage-fg-subtle" : "text-stage-fg-body"
          }`}
        >
          我的 {accuracyText(accuracy)}
        </span>

        {/* No population of attempts exists in Phase 1, so there is no average
            to report. The column keeps its place in the grid and says so. */}
        <span
          title="暂无数据"
          className="font-stage-mono text-stage-xs text-stage-fg-subtle"
        >
          平均 —
        </span>

        <span className="inline-flex items-center gap-1.5 text-stage-2xs text-stage-fg-subtle">
          <span
            aria-hidden
            className={`inline-block h-2 w-2 flex-none rounded-stage-pill ${STATUS_DOT[status]}`}
          />
          {LIBRARY_STATUS_LABELS[status]}
        </span>
      </Link>

      {/* Same destination as the row, kept focusable and named: the stretched
          overlay makes the row clickable for pointers, not for keyboards. */}
      <Link href={href} className={`relative ${BUTTON_SECONDARY_SM} bg-stage-bg`}>
        {LIBRARY_ACTION_LABELS[libraryAction(status)]}
      </Link>

      <span aria-hidden className="grid text-stage-neutral-400">
        <Icon name="chevron-right" size={16} />
      </span>
    </li>
  );
}
