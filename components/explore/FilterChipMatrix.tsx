"use client";

import { useState } from "react";
import type { Facet, FacetKey, FacetSelection } from "@/lib/explore/facets";

/**
 * Labelled multi-row filter matrix with live counts (C-05).
 *
 * A sibling of `FilterChips`, not a replacement: that one is a single scrolling
 * row of links where the URL drives filtering, and it stays. This is the
 * controlled multi-dimension control — OR within a row, AND across rows.
 *
 * Rows scroll horizontally below `md` and wrap above it, so a long dimension
 * never reflows the results underneath it.
 */
export function FilterChipMatrix({
  facets,
  selection,
  onChange,
  visibleRows = 3,
  totalCount,
}: {
  facets: Facet[];
  selection: FacetSelection;
  onChange: (next: FacetSelection) => void;
  visibleRows?: number;
  totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? facets : facets.slice(0, visibleRows);
  const hiddenCount = facets.length - shown.length;

  const activeCount = Object.values(selection).reduce(
    (sum, values) => sum + (values?.length ?? 0),
    0,
  );

  function toggle(key: FacetKey, value: string) {
    const current = selection[key] ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...selection, [key]: next });
  }

  return (
    <div className="min-w-0 space-y-2">
      {shown.map((facet) => (
        <fieldset
          key={facet.key}
          // min-w-0 on both the row and the scroller: a flex child defaults to
          // min-width:auto, which lets it grow to its content instead of
          // clipping — the chip row would then push the whole PAGE sideways
          // rather than scrolling inside itself.
          className="flex min-w-0 flex-col gap-1.5 md:flex-row md:items-start md:gap-3"
        >
          <legend className="sr-only">{facet.label}</legend>
          <span
            aria-hidden
            className="shrink-0 px-2 text-[13px] leading-8 text-ink-500 md:w-20 md:px-0"
          >
            {facet.label}
          </span>
          <div className="no-scrollbar -mx-4 flex min-w-0 gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {facet.options.map((option) => {
              const active = selection[facet.key]?.includes(option.value) ?? false;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  aria-disabled={option.disabled}
                  disabled={option.disabled}
                  onClick={() => toggle(facet.key, option.value)}
                  className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                    active
                      ? "border-transparent bg-brand-600 text-white"
                      : "border-line bg-white text-ink-900 hover:border-brand-300 hover:text-brand-600"
                  } ${option.disabled ? "cursor-not-allowed opacity-40 hover:border-line hover:text-ink-900" : ""}`}
                >
                  {option.label}
                  <span
                    className={`text-[11px] tabular-nums ${active ? "opacity-80" : "opacity-60"}`}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3 px-2 md:px-0">
        {hiddenCount > 0 && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[13px] font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            更多筛选（{hiddenCount}）▾
          </button>
        ) : null}
        {expanded && facets.length > visibleRows ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[13px] font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            收起筛选 ▴
          </button>
        ) : null}
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-[13px] text-ink-500 underline-offset-2 hover:text-brand-600 hover:underline"
          >
            清除全部筛选（{activeCount}）
          </button>
        ) : null}
        <span className="ml-auto text-[13px] text-ink-500">
          共 {totalCount} 个项目
        </span>
      </div>
    </div>
  );
}
