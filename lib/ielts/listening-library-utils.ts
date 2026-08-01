/**
 * Every decision the Listening library list makes, as pure functions.
 *
 * Same rule B3 set for the question components and B4 for the practice page:
 * this repository proves logic under `node --test`, so a judgement made inside
 * a component body is a judgement nobody can assert. The library owns four —
 * what a stored record says about a set, whether a row survives the filters,
 * what the URL says the filters are, and what the URL should say — and all four
 * live here.
 *
 * No React, no storage, no fixture import.
 */
import { scoreAttempt } from "./listening-scoring.ts";
import type {
  Attempt,
  ListeningFrequency,
  ListeningPart,
  ListeningSetSummary,
  QuestionGroup,
  ScoringRule,
} from "./listening-types.ts";

export type GroupType = QuestionGroup["type"];

/**
 * One row of the list.
 *
 * `ListeningSetSummary` deliberately carries no `questionGroups` — the reason
 * that type gives is that a list page would otherwise ship the whole bank — but
 * the 题型 filter has to know which group types a set contains. So the page
 * resolves the *type names* on the server and hands them down: five short
 * strings per set instead of the groups themselves, which keeps the summary's
 * intent intact. See the note on the route for why this is not a change to the
 * source contract.
 */
export interface LibraryRow extends ListeningSetSummary {
  types: GroupType[];
}

/* --------------------------------------------------------------------------
 * Display copy
 *
 * `listening-types.ts` ships no label maps on purpose. What a band or a group
 * type is *called* is a UI decision, made in the batch that renders it.
 * ----------------------------------------------------------------------- */

/**
 * The export's three bands, verbatim. `非高频` rather than `低频` because that
 * is the word the approved bank screen uses; `components/ielts/ExamCatalog.tsx`
 * carries the same note about the Reading side of the same disagreement.
 */
export const FREQUENCY_LABELS: Record<ListeningFrequency, string> = {
  high: "高频",
  mid: "次高频",
  low: "非高频",
};

export const FREQUENCIES: readonly ListeningFrequency[] = ["high", "mid", "low"];

export const GROUP_TYPE_ORDER: readonly GroupType[] = [
  "form_completion",
  "mcq_single",
  "mcq_multi",
  "map_labelling",
  "matching",
];

/* --------------------------------------------------------------------------
 * What a stored record says about a set
 * ----------------------------------------------------------------------- */

/**
 * The three things a row can be, from its stored attempt alone.
 *
 * `in_progress` is a *display* state with no chip of its own: the filter row is
 * the export's four (全部 / 未练习 / 已练习 / 待重测) and a set whose draft is
 * open is none of them. It is shown in the status column and reachable only
 * under 全部 — see `matchesStatus`, which states the same thing from the
 * filter's side.
 */
export type LibraryStatus = "fresh" | "in_progress" | "practised";

export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = {
  fresh: "未练习",
  in_progress: "进行中",
  practised: "已练习",
};

/**
 * A set's state, read off the record the practice page left behind.
 *
 * Nothing is inferred beyond what the record says. A submitted attempt means
 * the paper was handed in; an in-progress one means it was opened and written
 * on; no record at all means untouched. There is no fourth answer available
 * here, and inventing one would be inventing data.
 */
export function libraryStatus(attempt: Attempt | null): LibraryStatus {
  if (attempt === null) return "fresh";
  return attempt.status === "submitted" ? "practised" : "in_progress";
}

/**
 * The button's word, per state.
 *
 * Three words for three different acts: a paper never opened is *started*, a
 * draft is *continued*, a handed-in paper is practised *again*. One label for
 * all three would hide from the candidate that the third one starts over.
 */
export type LibraryAction = "start" | "resume" | "again";

export const LIBRARY_ACTION_LABELS: Record<LibraryAction, string> = {
  start: "开始练习",
  resume: "继续练习",
  again: "再次练习",
};

export function libraryAction(status: LibraryStatus): LibraryAction {
  switch (status) {
    case "fresh":
      return "start";
    case "in_progress":
      return "resume";
    case "practised":
      return "again";
  }
}

/**
 * A submitted attempt's accuracy as a [0,1] ratio, or `null`.
 *
 * `null` for an unsubmitted attempt and for no attempt at all, because in both
 * cases there is no score — not a zero. The caller prints an em dash.
 *
 * Marking happens here rather than being read back from the record because a
 * stored `Attempt` holds answers and no score: the shape is B1's and this batch
 * does not change it. The cost is that the list needs the answer key, which is
 * the same trade the practice route already makes and documents.
 */
export function attemptAccuracy(
  attempt: Attempt | null,
  rules: ScoringRule[] | undefined,
): number | null {
  if (attempt === null || attempt.status !== "submitted") return null;
  if (rules === undefined || rules.length === 0) return null;
  const report = scoreAttempt(attempt, rules);
  if (report.total === 0) return null;
  return report.correct / report.total;
}

/* --------------------------------------------------------------------------
 * Filters
 * ----------------------------------------------------------------------- */

export type FrequencyFilter = ListeningFrequency | "all";
export type PartFilter = ListeningPart | "all";
export type TypeFilter = GroupType | "all";

/**
 * The 状态 row's chips.
 *
 * `retest` is one of them because the export prints it, and it matches nothing
 * — see `matchesStatus`.
 */
export type StatusFilter = "all" | "fresh" | "practised" | "retest";

export const STATUS_FILTERS: readonly StatusFilter[] = [
  "all",
  "fresh",
  "practised",
  "retest",
];

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "全部",
  fresh: "未练习",
  practised: "已练习",
  retest: "待重测",
};

export interface LibraryFilters {
  search: string;
  frequency: FrequencyFilter;
  part: PartFilter;
  type: TypeFilter;
  status: StatusFilter;
}

export const INITIAL_FILTERS: LibraryFilters = {
  search: "",
  frequency: "all",
  part: "all",
  type: "all",
  status: "all",
};

/**
 * Substring, case-insensitive, over both titles.
 *
 * Both, because a set carries an English name and a Chinese one and a candidate
 * who remembers only the Chinese one must still find it. `toLowerCase` is a
 * no-op over CJK, which costs nothing and keeps one code path.
 */
export function matchesSearch(row: LibraryRow, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;
  return (
    row.title.toLowerCase().includes(needle) ||
    row.titleZh.toLowerCase().includes(needle)
  );
}

/**
 * Whether a row's state satisfies the 状态 chip.
 *
 * `retest` matches nothing, on purpose. The re-test queue is a later phase and
 * the rule it will use — how wrong, how long ago — is not decidable from a
 * localStorage draft. Guessing one here would put a number on screen that no
 * system behind it agrees with, so the chip renders the empty state instead and
 * says nothing false.
 *
 * `in_progress` is likewise matched by no chip but 全部: the chip row is the
 * export's four and none of them means "opened but not handed in".
 */
export function matchesStatus(
  status: LibraryStatus,
  filter: StatusFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "fresh":
      return status === "fresh";
    case "practised":
      return status === "practised";
    case "retest":
      return false;
  }
}

/** Every facet, ANDed. A row shows only if it satisfies all five. */
export function matchesFilters(
  row: LibraryRow,
  filters: LibraryFilters,
  status: LibraryStatus,
): boolean {
  if (!matchesSearch(row, filters.search)) return false;
  if (filters.frequency !== "all" && row.frequency !== filters.frequency) {
    return false;
  }
  if (filters.part !== "all" && row.part !== filters.part) return false;
  // "contains", not "is": a set is a list of groups and the chip asks which
  // kinds of question it holds, not which kind it is made entirely of.
  if (filters.type !== "all" && !row.types.includes(filters.type)) return false;
  return matchesStatus(status, filters.status);
}

/**
 * The visible rows, in the order the source gave them.
 *
 * No sort. The bank has one ordering — the source's — and the export's list
 * offers no sort control; imposing one here would be this module inventing a
 * ranking the data does not carry.
 */
export function filterRows(
  rows: readonly LibraryRow[],
  filters: LibraryFilters,
  statusOf: (setId: string) => LibraryStatus,
): LibraryRow[] {
  return rows.filter((row) => matchesFilters(row, filters, statusOf(row.id)));
}

/**
 * The group types actually present in the bank, in a fixed order.
 *
 * The chip row is built from this rather than from all five type names, so it
 * cannot offer a filter that is guaranteed to return nothing. With one fixture
 * set that is four chips, and 单选 is absent because no set uses it — which is
 * the truth about this bank, not a gap in the list.
 */
export function availableTypes(rows: readonly LibraryRow[]): GroupType[] {
  const present = new Set<GroupType>();
  for (const row of rows) for (const type of row.types) present.add(type);
  return GROUP_TYPE_ORDER.filter((type) => present.has(type));
}

/* --------------------------------------------------------------------------
 * The URL
 *
 * Filter state lives in the query string so a filtered list can be shared, and
 * so Back and Forward move between filter states rather than off the page.
 * These two functions are the whole contract: `serializeLibraryParams` writes
 * only what differs from the default, and `parseLibraryParams` accepts only
 * what it wrote — anything else reads as the default rather than as an error,
 * because a hand-edited URL must not be able to break the list.
 * ----------------------------------------------------------------------- */

const PARAM_KEYS = {
  search: "q",
  frequency: "freq",
  part: "part",
  type: "type",
  status: "status",
} as const;

function isFrequency(value: string): value is ListeningFrequency {
  return value === "high" || value === "mid" || value === "low";
}

function isPart(value: string): value is `${ListeningPart}` {
  return value === "1" || value === "2" || value === "3" || value === "4";
}

function isGroupType(value: string): value is GroupType {
  return (GROUP_TYPE_ORDER as readonly string[]).includes(value);
}

function isStatusFilter(value: string): value is StatusFilter {
  return (STATUS_FILTERS as readonly string[]).includes(value);
}

/**
 * Filters read out of a query string.
 *
 * Takes the string rather than a `URLSearchParams` so it is testable without a
 * DOM shim and so the caller can pass whatever its router hands it.
 */
export function parseLibraryParams(
  query: string | URLSearchParams,
): LibraryFilters {
  const params =
    typeof query === "string" ? new URLSearchParams(query) : query;

  const frequency = params.get(PARAM_KEYS.frequency) ?? "";
  const part = params.get(PARAM_KEYS.part) ?? "";
  const type = params.get(PARAM_KEYS.type) ?? "";
  const status = params.get(PARAM_KEYS.status) ?? "";

  return {
    search: params.get(PARAM_KEYS.search) ?? "",
    frequency: isFrequency(frequency) ? frequency : "all",
    // The one parameter that is not its own value: a Part is a number in the
    // type and a digit in a URL.
    part: isPart(part) ? (Number(part) as ListeningPart) : "all",
    type: isGroupType(type) ? type : "all",
    status: isStatusFilter(status) && status !== "all" ? status : "all",
  };
}

/**
 * Filters as a query string, defaults omitted.
 *
 * Omitting them is what makes the round trip stable: an unfiltered list is the
 * bare route, and `parse(serialize(f))` is `f` for every `f` this module can
 * produce. Key order is fixed so two identical filter states always compare
 * equal as strings — the library uses exactly that comparison to tell its own
 * writes apart from a Back button.
 */
export function serializeLibraryParams(filters: LibraryFilters): string {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search !== "") params.set(PARAM_KEYS.search, search);
  if (filters.frequency !== "all") {
    params.set(PARAM_KEYS.frequency, filters.frequency);
  }
  if (filters.part !== "all") params.set(PARAM_KEYS.part, String(filters.part));
  if (filters.type !== "all") params.set(PARAM_KEYS.type, filters.type);
  if (filters.status !== "all") params.set(PARAM_KEYS.status, filters.status);
  return params.toString();
}
