import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchBar, type SearchFilterOption } from "@/components/SearchBar";
import type { DegreeLevel, ProgramSearchQuery } from "@/data/types";
import { getAllPrograms, searchPrograms } from "@/lib/data";

interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    country?: string;
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
    degree_level: getDegreeLevel(params.degree_level),
    major_area: params.major_area ?? null,
  };
  const hasSelectedFilter = Boolean(
    query.country || query.degree_level || query.major_area,
  );
  const [allPrograms, matchedPrograms] = await Promise.all([
    getAllPrograms(),
    hasSelectedFilter ? searchPrograms(query) : Promise.resolve([]),
  ]);
  const countryOptions = uniqueOptions(
    allPrograms.map((program) => program.country),
  );
  const majorOptions = uniqueOptions(
    allPrograms.map((program) => program.major_area),
  );

  return (
    <>
      <MobileHeader backHref="/" />
      <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-4">
        <section className="space-y-3">
          <SearchBar
            countryOptions={countryOptions}
            degreeOptions={degreeOptions}
            initialCountry={params.country}
            initialDegreeLevel={query.degree_level ?? undefined}
            initialMajorArea={params.major_area}
            initialValue={params.keyword ?? ""}
            majorOptions={majorOptions}
          />
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">搜索结果</h1>
              <p className="text-sm text-gray-600">
                共 {matchedPrograms.length} 个项目
              </p>
            </div>
            <Link
              className="flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-blue-700"
              href="/"
            >
              清除筛选
            </Link>
          </div>

          {matchedPrograms.length > 0 ? (
            <div className="space-y-3">
              {matchedPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/"
              actionLabel="返回首页"
              description={
                hasSelectedFilter
                  ? "请调整乐器、学位或国家后重试。"
                  : "请至少选择乐器、学位或国家中的一项。"
              }
              title={hasSelectedFilter ? "没有找到匹配的项目" : "请选择筛选条件"}
            />
          )}
        </section>
      </main>
    </>
  );
}

const degreeOptions: SearchFilterOption[] = [
  { label: "本科", value: "bachelor" },
  { label: "硕士", value: "master" },
  { label: "博士", value: "doctorate" },
  { label: "文凭", value: "diploma" },
  { label: "证书", value: "certificate" },
];

function uniqueOptions(values: string[]): SearchFilterOption[] {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));
}
