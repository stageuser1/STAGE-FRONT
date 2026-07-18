import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchBar } from "@/components/SearchBar";
import type { DegreeLevel, ProgramSearchQuery } from "@/data/types";
import { getAllPrograms, searchPrograms } from "@/lib/data";
import { buildFilterOptions } from "@/lib/search-options";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    country?: string;
    degree?: string;
    degree_level?: string;
    major_area?: string;
  }>;
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
  const [allPrograms, matchedPrograms] = await Promise.all([
    getAllPrograms(),
    hasQuery ? searchPrograms(query) : Promise.resolve([]),
  ]);
  const { countryOptions, majorOptions, degreeOptions } =
    buildFilterOptions(allPrograms);

  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell>
        <section className="space-y-3">
          <SearchBar
            countryOptions={countryOptions}
            degreeOptions={degreeOptions}
            initialCountry={params.country}
            initialDegree={params.degree}
            initialMajorArea={params.major_area}
            initialValue={params.keyword ?? ""}
            majorOptions={majorOptions}
          />
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h1 className="text-lg font-semibold text-ink-900">搜索结果</h1>
              <p className="text-sm text-ink-500">
                共 {matchedPrograms.length} 个项目
              </p>
            </div>
            <Link
              className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-sm font-semibold text-brand-600 transition hover:border-brand-300"
              href="/search"
            >
              清除筛选
            </Link>
          </div>

          {matchedPrograms.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {matchedPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/"
              actionLabel="返回首页"
              description={
                hasQuery
                  ? "请尝试更换关键词，或调整专业方向、学位、国家筛选条件。"
                  : "输入关键词，或选择专业方向、学位、国家开始搜索。"
              }
              title={hasQuery ? "没有找到匹配的项目" : "开始搜索"}
            />
          )}
        </section>
      </PageShell>
    </>
  );
}
