/**
 * Faceted filtering for the Explore catalog.
 *
 * The contract that makes a chip count honest: each dimension's counts are
 * computed against the OTHER dimensions' current selection, so the number on a
 * chip always equals the number of rows clicking it produces. Counting against
 * the whole corpus instead would promise results the filter cannot deliver.
 *
 * Pure; no React, no Directus, no JSON imports.
 */
import { daysUntil } from "@/lib/format";
import type { ExploreProgram } from "./types";

export type FacetKey =
  | "country"
  | "degree"
  | "major_area"
  | "deadline"
  | "ielts";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  disabled: boolean;
}

export interface Facet {
  key: FacetKey;
  label: string;
  options: FacetOption[];
}

export type FacetSelection = Partial<Record<FacetKey, string[]>>;

/** Deadline buckets, evaluated against the nearest recorded deadline. */
const DEADLINE_BUCKETS: Array<{
  value: string;
  label: string;
  test: (days: number | null) => boolean;
}> = [
  { value: "30", label: "30 天内", test: (d) => d !== null && d >= 0 && d <= 30 },
  { value: "90", label: "90 天内", test: (d) => d !== null && d >= 0 && d <= 90 },
  { value: "future", label: "仍可申请", test: (d) => d !== null && d >= 0 },
  { value: "past", label: "已截止", test: (d) => d !== null && d < 0 },
];

/** IELTS demand bands, from the recorded minimum score. */
const IELTS_BUCKETS: Array<{
  value: string;
  label: string;
  test: (score: number | null) => boolean;
}> = [
  { value: "lte6", label: "6.0 及以下", test: (s) => s !== null && s <= 6 },
  { value: "6.5", label: "6.5", test: (s) => s !== null && s > 6 && s <= 6.5 },
  { value: "gte7", label: "7.0 及以上", test: (s) => s !== null && s > 6.5 },
];

function nearestDeadlineDays(program: ExploreProgram): number | null {
  const days = [
    program.applicationDeadline,
    program.prescreeningDeadline,
  ]
    .map(daysUntil)
    .filter((value): value is number => value !== null);
  if (days.length === 0) return null;
  // Future deadlines first; if all are past, the least-past one represents it.
  const future = days.filter((value) => value >= 0).sort((a, b) => a - b);
  return future.length > 0 ? future[0] : Math.max(...days);
}

function ieltsMinimum(program: ExploreProgram): number | null {
  if (!program.ieltsMinimum) return null;
  const match = /(\d+(?:\.\d+)?)/.exec(program.ieltsMinimum);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 && value <= 9 ? value : null;
}

/** Every value a program has for one dimension (usually 0 or 1). */
function valuesFor(program: ExploreProgram, key: FacetKey): string[] {
  switch (key) {
    case "country":
      return program.country ? [program.country] : [];
    case "degree":
      return program.degreeSlug ? [program.degreeSlug] : [];
    case "major_area":
      return program.majorArea ? [program.majorArea] : [];
    case "deadline": {
      const days = nearestDeadlineDays(program);
      return DEADLINE_BUCKETS.filter((bucket) => bucket.test(days)).map(
        (bucket) => bucket.value,
      );
    }
    case "ielts": {
      const score = ieltsMinimum(program);
      return IELTS_BUCKETS.filter((bucket) => bucket.test(score)).map(
        (bucket) => bucket.value,
      );
    }
  }
}

/** OR within a dimension, AND across dimensions. */
export function matchesSelection(
  program: ExploreProgram,
  selection: FacetSelection,
  ignore?: FacetKey,
): boolean {
  for (const key of Object.keys(selection) as FacetKey[]) {
    if (key === ignore) continue;
    const selected = selection[key];
    if (!selected || selected.length === 0) continue;
    const values = valuesFor(program, key);
    if (!values.some((value) => selected.includes(value))) return false;
  }
  return true;
}

export function applySelection(
  programs: ExploreProgram[],
  selection: FacetSelection,
): ExploreProgram[] {
  return programs.filter((program) => matchesSelection(program, selection));
}

function labelFor(
  key: FacetKey,
  value: string,
  programs: ExploreProgram[],
): string {
  switch (key) {
    case "degree": {
      const match = programs.find((p) => p.degreeSlug === value);
      return match?.degreeNameZh
        ? `${match.degreeNameZh} ${match.degreeAbbr ?? ""}`.trim()
        : match?.degreeName ?? value.toUpperCase();
    }
    case "major_area": {
      const match = programs.find((p) => p.majorArea === value);
      return match?.majorAreaZh ? `${match.majorAreaZh} ${value}` : value;
    }
    case "deadline":
      return DEADLINE_BUCKETS.find((b) => b.value === value)?.label ?? value;
    case "ielts":
      return IELTS_BUCKETS.find((b) => b.value === value)?.label ?? value;
    default:
      return value;
  }
}

const FACET_LABELS: Record<FacetKey, string> = {
  country: "国家/地区",
  degree: "学位",
  major_area: "专业方向",
  deadline: "申请截止",
  ielts: "雅思要求",
};

/** Fixed dimension order — the sequence a learner narrows in. */
export const FACET_ORDER: FacetKey[] = [
  "country",
  "degree",
  "major_area",
  "deadline",
  "ielts",
];

export function buildFacets(
  programs: ExploreProgram[],
  selection: FacetSelection,
): Facet[] {
  return FACET_ORDER.map((key) => {
    // The pool this dimension is counted against excludes its own selection.
    const pool = programs.filter((program) =>
      matchesSelection(program, selection, key),
    );

    const counts = new Map<string, number>();
    for (const program of pool) {
      for (const value of valuesFor(program, key)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    // Every value present in the whole corpus is offered, even at count 0 —
    // a chip that vanishes tells the user nothing about why.
    const allValues = new Set<string>();
    for (const program of programs) {
      for (const value of valuesFor(program, key)) allValues.add(value);
    }

    const ordered =
      key === "deadline"
        ? DEADLINE_BUCKETS.map((b) => b.value).filter((v) => allValues.has(v))
        : key === "ielts"
          ? IELTS_BUCKETS.map((b) => b.value).filter((v) => allValues.has(v))
          : [...allValues].sort((a, b) =>
              labelFor(key, a, programs).localeCompare(
                labelFor(key, b, programs),
                "zh-CN",
              ),
            );

    return {
      key,
      label: FACET_LABELS[key],
      options: ordered.map((value) => {
        const count = counts.get(value) ?? 0;
        const selected = selection[key]?.includes(value) ?? false;
        return {
          value,
          label: labelFor(key, value, programs),
          count,
          // A selected chip is never disabled — the user must be able to undo it.
          disabled: count === 0 && !selected,
        };
      }),
    };
  });
}

/** Names the single most restrictive dimension, for zero-result guidance. */
export function mostRestrictiveFacet(
  programs: ExploreProgram[],
  selection: FacetSelection,
): { key: FacetKey; label: string; wouldYield: number } | null {
  const active = (Object.keys(selection) as FacetKey[]).filter(
    (key) => (selection[key]?.length ?? 0) > 0,
  );
  if (active.length === 0) return null;

  let best: { key: FacetKey; label: string; wouldYield: number } | null = null;
  for (const key of active) {
    const without: FacetSelection = { ...selection, [key]: [] };
    const yielded = applySelection(programs, without).length;
    if (!best || yielded > best.wouldYield) {
      best = { key, label: FACET_LABELS[key], wouldYield: yielded };
    }
  }
  return best;
}
