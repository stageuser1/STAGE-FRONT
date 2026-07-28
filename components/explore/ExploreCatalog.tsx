"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { HomeSchoolCard } from "@/components/HomeSchoolCard";
import { Icon } from "@/components/ui/Icon";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import {
  applySelection,
  buildFacets,
  mostRestrictiveFacet,
  type FacetSelection,
} from "@/lib/explore/facets";
import type { ExploreProgram, ExploreSchool } from "@/lib/explore/types";
import { formatDateZh, formatTestScore } from "@/lib/format";
import { FilterChipMatrix } from "./FilterChipMatrix";

type View = "school" | "program";
type SortKey = "updated" | "deadline" | "name" | "tuition";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "最近更新",
  deadline: "申请截止最近",
  name: "院校名称",
  tuition: "学费从低到高",
};

/**
 * The Explore catalog (P-01).
 *
 * Everything published is visible on first paint — no interaction is required
 * to see the corpus, and discovery is never gated. Filtering is client-side
 * over a slim payload, so chip counts can be recomputed live against the other
 * dimensions' selection and always equal what clicking them yields.
 */
export function ExploreCatalog({
  schools,
  programs,
  programsBySchool,
}: {
  schools: ExploreSchool[];
  programs: ExploreProgram[];
  programsBySchool: Record<string, string[]>;
}) {
  const [selection, setSelection] = useState<FacetSelection>({});
  const [view, setView] = useState<View>("school");
  const [sort, setSort] = useState<SortKey>("updated");

  const facets = useMemo(
    () => buildFacets(programs, selection),
    [programs, selection],
  );
  const matched = useMemo(
    () => applySelection(programs, selection),
    [programs, selection],
  );

  const matchedIds = useMemo(
    () => new Set(matched.map((program) => program.id)),
    [matched],
  );

  // A school is shown when at least one of its programs survives the filters.
  const matchedSchools = useMemo(() => {
    const list = schools.filter((school) =>
      (programsBySchool[school.id] ?? []).some((id) => matchedIds.has(id)),
    );
    const sorted = [...list];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "en"));
        break;
      case "deadline":
      case "tuition":
        // Both are program-level orderings; at school level fall back to the
        // school's nearest matching program rather than inventing a value.
        sorted.sort((a, b) => {
          const key = (school: ExploreSchool) => {
            const own = matched.filter((p) => p.schoolId === school.id);
            if (own.length === 0) return Number.POSITIVE_INFINITY;
            if (sort === "tuition") {
              const amounts = own
                .map((p) => p.tuitionAmount)
                .filter((v): v is number => v !== null);
              return amounts.length > 0
                ? Math.min(...amounts)
                : Number.POSITIVE_INFINITY;
            }
            const dates = own
              .map((p) => p.applicationDeadline)
              .filter((v): v is string => Boolean(v))
              .sort();
            return dates[0] ? new Date(dates[0]).getTime() : Number.POSITIVE_INFINITY;
          };
          return key(a) - key(b);
        });
        break;
      default:
        sorted.sort((a, b) =>
          (b.lastCheckedAt ?? "").localeCompare(a.lastCheckedAt ?? ""),
        );
    }
    return sorted;
  }, [schools, programsBySchool, matchedIds, matched, sort]);

  const matchedPrograms = useMemo(() => {
    const sorted = [...matched];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.schoolName.localeCompare(b.schoolName, "en"));
        break;
      case "deadline":
        sorted.sort(
          (a, b) =>
            (a.applicationDeadline ?? "9999").localeCompare(
              b.applicationDeadline ?? "9999",
            ),
        );
        break;
      case "tuition":
        sorted.sort(
          (a, b) =>
            (a.tuitionAmount ?? Number.POSITIVE_INFINITY) -
            (b.tuitionAmount ?? Number.POSITIVE_INFINITY),
        );
        break;
      default:
        sorted.sort((a, b) =>
          (b.lastCheckedAt ?? "").localeCompare(a.lastCheckedAt ?? ""),
        );
    }
    return sorted;
  }, [matched, sort]);

  const blocker = useMemo(
    () => mostRestrictiveFacet(programs, selection),
    [programs, selection],
  );

  const hasFilters = Object.values(selection).some(
    (values) => (values?.length ?? 0) > 0,
  );

  return (
    <>
      <section className="mt-4">
        <FilterChipMatrix
          facets={facets}
          selection={selection}
          onChange={setSelection}
          totalCount={matched.length}
        />
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 md:px-0">
        <p className="text-[13px] text-ink-500" aria-live="polite">
          共 {matched.length} 个项目 · {matchedSchools.length} 所院校
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-ink-500">
            <span className="sr-only sm:not-sr-only">排序</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="排序方式"
              className="h-8 rounded-lg border border-line bg-white px-2 text-[13px] text-ink-900 outline-none focus:border-brand-300"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <div
            role="group"
            aria-label="显示方式"
            className="flex h-8 overflow-hidden rounded-lg border border-line bg-white"
          >
            {(["school", "program"] as View[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`px-2.5 text-[13px] font-medium transition ${
                  view === value
                    ? "bg-brand-600 text-white"
                    : "text-ink-700 hover:text-brand-600"
                }`}
              >
                {value === "school" ? "院校" : "项目"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-3">
        {matched.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              title="没有符合条件的项目"
              description={
                blocker
                  ? `移除「${blocker.label}」筛选后可以看到 ${blocker.wouldYield} 个项目。`
                  : "试着放宽筛选条件。"
              }
              icon="filter"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {blocker ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelection({ ...selection, [blocker.key]: [] })
                  }
                  className="inline-flex h-10 items-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700"
                >
                  移除「{blocker.label}」筛选
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelection({})}
                className="inline-flex h-10 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300"
              >
                清除全部筛选
              </button>
            </div>
          </div>
        ) : view === "school" ? (
          <div className="grid gap-2.5 md:grid-cols-2 md:gap-5">
            {/* The card is the grid item DIRECTLY — no wrapper div. The article
                carries `overflow-hidden`, which resolves its min-content to 0
                and lets it shrink into the track; an intermediate div has
                min-width:auto and would let the card's intrinsic width push the
                whole page sideways on narrow screens. */}
            {matchedSchools.map((school) => (
              <HomeSchoolCard
                key={school.id}
                matchedProgramCount={
                  hasFilters
                    ? (programsBySchool[school.id] ?? []).filter((id) =>
                        matchedIds.has(id),
                      ).length
                    : undefined
                }
                school={school}
              />
            ))}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
            {/* `min-w-0` for the same reason the school view has no wrapper at
                all: a grid item defaults to min-width:auto, so without it the
                card's min-content width becomes the track's floor and pushes
                the document sideways on narrow screens. The list semantics are
                wanted here, so the item is contained rather than removed. */}
            {matchedPrograms.map((program) => (
              <li className="min-w-0" key={program.id}>
                <ExploreProgramCard program={program} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** Program card for the catalog's program view, built on the slim shape. */
function ExploreProgramCard({ program }: { program: ExploreProgram }) {
  const deadline = formatDateZh(program.applicationDeadline);
  return (
    <Link
      className="block rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${program.schoolId}/programs/${program.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-ink-900">
            {program.nameZh ?? program.specialization ?? program.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-ink-400">{program.name}</p>
          <p className="mt-1.5 text-sm leading-5 text-ink-700">
            {program.schoolName}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {program.country} · {program.city}
          </p>
        </div>
        {program.degreeAbbr || program.degreeName ? (
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-brand-600 px-2.5 text-xs font-semibold text-white">
            {program.degreeNameZh ?? program.degreeAbbr ?? program.degreeName}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {program.majorArea ? (
          <span className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500">
            {program.majorAreaZh ?? program.majorArea}
          </span>
        ) : null}
        {program.ieltsMinimum ? (
          <span className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500">
            IELTS {formatTestScore(program.ieltsMinimum)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle pt-3">
        <span className="text-xs text-ink-500">
          {deadline ? `申请截止 ${deadline}` : "申请截止待确认"}
        </span>
        <ConfidenceBadge
          status={program.status}
          lastCheckedAt={program.lastCheckedAt}
        />
      </div>
    </Link>
  );
}
