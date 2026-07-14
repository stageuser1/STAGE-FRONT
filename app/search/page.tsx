import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips, type FilterChipItem } from "@/components/FilterChips";
import { MobileHeader } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchBar } from "@/components/SearchBar";
import type { DegreeLevel, ProgramSearchQuery } from "@/data/types";
import { searchPrograms } from "@/lib/data";

interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    country?: string;
    degree_level?: string;
    major_area?: string;
  }>;
}

function getDegreeLevel(value?: string): DegreeLevel | null {
  if (value === "bachelor" || value === "master") {
    return value;
  }

  return null;
}

function buildHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const next = { ...current, ...patch };

  Object.entries(next).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query: ProgramSearchQuery = {
    keyword: params.keyword ?? null,
    country: params.country ?? null,
    degree_level: getDegreeLevel(params.degree_level),
    major_area: params.major_area ?? null,
  };
  const programs = await searchPrograms(query);
  const current = {
    keyword: params.keyword,
    country: params.country,
    degree_level: params.degree_level,
    major_area: params.major_area,
  };
  const chips: FilterChipItem[] = [
    {
      label: "US",
      href: buildHref(current, {
        country: params.country === "US" ? undefined : "US",
      }),
      active: params.country === "US",
    },
    {
      label: "GB",
      href: buildHref(current, {
        country: params.country === "GB" ? undefined : "GB",
      }),
      active: params.country === "GB",
    },
    {
      label: "AT",
      href: buildHref(current, {
        country: params.country === "AT" ? undefined : "AT",
      }),
      active: params.country === "AT",
    },
    {
      label: "Bachelor",
      href: buildHref(current, {
        degree_level:
          params.degree_level === "bachelor" ? undefined : "bachelor",
      }),
      active: params.degree_level === "bachelor",
    },
    {
      label: "Master",
      href: buildHref(current, {
        degree_level: params.degree_level === "master" ? undefined : "master",
      }),
      active: params.degree_level === "master",
    },
    {
      label: "Voice",
      href: buildHref(current, {
        major_area: params.major_area === "Voice" ? undefined : "Voice",
      }),
      active: params.major_area === "Voice",
    },
  ];

  return (
    <>
      <MobileHeader backHref="/" />
      <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-4">
        <section className="space-y-3">
          <SearchBar initialValue={params.keyword ?? ""} />
          <FilterChips chips={chips} />
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">搜索结果</h1>
              <p className="text-sm text-gray-600">
                共 {programs.length} 个项目
              </p>
            </div>
            <Link
              className="flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-blue-700"
              href="/search"
            >
              清除筛选
            </Link>
          </div>

          {programs.length > 0 ? (
            <div className="space-y-3">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref="/search"
              actionLabel="清除筛选"
              description="试试清除筛选，或搜索其他学校、专业、学历。"
              title="没有找到匹配的项目"
            />
          )}
        </section>
      </main>
    </>
  );
}
