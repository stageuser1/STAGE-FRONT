import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchInput } from "@/components/SearchInput";
import { Icon } from "@/components/ui/Icon";
import type { DegreeLevel, ProgramSearchQuery } from "@/data/types";
import { loadSearchPagePrograms } from "@/lib/data";
import {
  buildFilterOptions,
  type SearchFilterOption,
} from "@/lib/search-options";

export const revalidate = 900;

interface SearchParams {
  keyword?: string;
  country?: string;
  degree?: string;
  degree_level?: string;
  major_area?: string;
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>;
}

function getDegreeLevel(value?: string): DegreeLevel | null {
  if (
    value === "bachelor" ||
    value === "master" ||
    value === "doctorate" ||
    value === "diploma" ||
    value === "certificate"
  ) {
    return value;
  }

  return null;
}

/** /search URL with one param changed; empty values drop the param. */
function searchHref(
  params: SearchParams,
  overrides: Partial<SearchParams>,
): string {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  for (const key of [
    "keyword",
    "country",
    "degree",
    "degree_level",
    "major_area",
  ] as const) {
    const value = merged[key];
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `/search?${text}` : "/search";
}

function FilterGroup({
  label,
  options,
  params,
  paramKey,
}: {
  label: string;
  options: SearchFilterOption[];
  params: SearchParams;
  paramKey: "country" | "degree" | "major_area";
}) {
  if (options.length === 0) return null;
  const current = params[paramKey] ?? "";
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium leading-[18px] text-ink-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = current === option.value;
          return (
            <Link
              className={
                active
                  ? "flex min-h-9 items-center rounded-full bg-brand-600 px-3.5 text-sm font-semibold text-white"
                  : "flex min-h-9 items-center rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
              }
              href={searchHref(params, {
                [paramKey]: active ? "" : option.value,
              })}
              key={option.value}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query: ProgramSearchQuery = {
    keyword: params.keyword ?? null,
    country: params.country ?? null,
    // New slug-based degree filter (bm/mm/gd/ad/dma) keeps GD and AD
    // distinct; the legacy bucket param keeps old links working.
    degree_slug: params.degree ?? null,
    degree_level: getDegreeLevel(params.degree_level),
    major_area: params.major_area ?? null,
  };
  const hasSelectedFilter = Boolean(
    query.country || query.degree_slug || query.degree_level || query.major_area,
  );
  const hasQuery = hasSelectedFilter || Boolean(query.keyword?.trim());
  const { allPrograms, matchedPrograms } = await loadSearchPagePrograms(
    hasQuery ? query : null,
  );
  const { countryOptions, majorOptions, degreeOptions } =
    buildFilterOptions(allPrograms);

  const hiddenParams: Record<string, string> = {};
  if (params.country) hiddenParams.country = params.country;
  if (params.degree) hiddenParams.degree = params.degree;
  if (params.degree_level) hiddenParams.degree_level = params.degree_level;
  if (params.major_area) hiddenParams.major_area = params.major_area;

  const activeChips = [
    params.keyword?.trim()
      ? {
          label: `“${params.keyword.trim()}”`,
          href: searchHref(params, { keyword: "" }),
        }
      : null,
    params.country
      ? {
          label: params.country,
          href: searchHref(params, { country: "" }),
        }
      : null,
    params.major_area
      ? {
          label:
            majorOptions.find((option) => option.value === params.major_area)
              ?.label ?? params.major_area,
          href: searchHref(params, { major_area: "" }),
        }
      : null,
    params.degree
      ? {
          label:
            degreeOptions.find((option) => option.value === params.degree)
              ?.label ?? params.degree.toUpperCase(),
          href: searchHref(params, { degree: "" }),
        }
      : null,
    params.degree_level
      ? {
          label: params.degree_level,
          href: searchHref(params, { degree_level: "" }),
        }
      : null,
  ].filter((chip): chip is { label: string; href: string } => chip !== null);

  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell>
        <section className="sticky top-14 z-[5] -mx-4 bg-page/95 px-4 pb-3 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none">
          <SearchInput
            defaultValue={params.keyword ?? ""}
            hiddenParams={hiddenParams}
          />
        </section>

        {activeChips.length > 0 ? (
          <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4">
            {activeChips.map((chip) => (
              <Link
                className="flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-[13px] font-medium text-brand-700 transition hover:bg-brand-100"
                href={chip.href}
                key={chip.href}
              >
                {chip.label}
                <Icon name="close" size={12} />
              </Link>
            ))}
            <Link
              className="flex min-h-8 shrink-0 items-center rounded-full px-2 text-[13px] font-medium text-ink-500 hover:text-brand-600"
              href="/search"
            >
              清除全部
            </Link>
          </div>
        ) : null}

        <details
          className="group mt-3 rounded-2xl border border-line bg-white shadow-card"
          open={!hasQuery}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Icon className="text-brand-600" name="filter" size={16} />
              筛选
              {hasSelectedFilter ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                  {[params.country, params.degree, params.major_area].filter(
                    Boolean,
                  ).length || 1}
                </span>
              ) : null}
            </span>
            <Icon
              className="text-ink-400 transition-transform group-open:rotate-180"
              name="chevron-down"
              size={16}
            />
          </summary>
          <div className="space-y-4 border-t border-line-subtle px-4 py-4">
            <FilterGroup
              label="国家/地区"
              options={countryOptions}
              paramKey="country"
              params={params}
            />
            <FilterGroup
              label="专业方向"
              options={majorOptions}
              paramKey="major_area"
              params={params}
            />
            <FilterGroup
              label="学位"
              options={degreeOptions}
              paramKey="degree"
              params={params}
            />
          </div>
        </details>

        <section className="mt-5">
          <div className="mb-3 px-1">
            <h1 className="text-[17px] font-semibold leading-6 text-ink-900 md:text-lg">
              搜索结果
            </h1>
            <p className="mt-0.5 text-[13px] leading-5 text-ink-500">
              {hasQuery
                ? `找到 ${matchedPrograms.length} 个项目`
                : "输入关键词或选择筛选条件"}
            </p>
          </div>

          {matchedPrograms.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              {matchedPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref={hasQuery ? "/search" : "/"}
              actionLabel={hasQuery ? "清除筛选" : "返回首页"}
              description={
                hasQuery
                  ? "请尝试更换关键词，或调整专业方向、学位、国家筛选条件。"
                  : "输入关键词，或在上方筛选面板中选择专业方向、学位、国家。"
              }
              title={hasQuery ? "没有找到匹配的项目" : "开始搜索"}
            />
          )}
        </section>
      </PageShell>
    </>
  );
}
