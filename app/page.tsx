import { BrandBanner } from "@/components/BrandBanner";
import { FilterChips, type FilterChipItem } from "@/components/FilterChips";
import { HeroSearch } from "@/components/HeroSearch";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SchoolCard } from "@/components/SchoolCard";
import { getAllPrograms, getAllSchools } from "@/lib/data";
import { buildFilterOptions } from "@/lib/search-options";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [schools, programs] = await Promise.all([
    getAllSchools(),
    getAllPrograms(),
  ]);
  const { countryOptions, majorOptions } = buildFilterOptions(programs);

  const countryChips: FilterChipItem[] = [
    { label: "全部", href: "/", active: true },
    ...countryOptions.map((option) => ({
      label: option.label,
      href: `/search?country=${encodeURIComponent(option.value)}`,
    })),
    { label: "筛选", href: "/search", icon: "filter" as const },
  ];

  const areaChips: FilterChipItem[] = majorOptions.map((option) => {
    const count = programs.filter(
      (program) => program.major_area === option.value,
    ).length;
    return {
      label: `${option.label} · ${count}`,
      href: `/search?major_area=${encodeURIComponent(option.value)}`,
    };
  });

  return (
    <>
      <MobileHeader subtitle="海外音乐院校招生数据库" />
      <PageShell>
        <section className="space-y-4 md:mx-auto md:max-w-2xl">
          <h1 className="text-[28px] font-bold leading-9 text-ink-900 md:text-center md:text-[34px] md:leading-[44px]">
            探索全球音乐院校
          </h1>
          <HeroSearch />
          <FilterChips ariaLabel="按国家筛选" chips={countryChips} />
        </section>

        <section className="mt-6">
          <BrandBanner />
        </section>

        <section className="mt-8">
          <div className="mb-3 px-1">
            <h2 className="text-[17px] font-semibold leading-6 text-ink-900 md:text-lg">
              收录院校
            </h2>
            <p className="mt-0.5 text-[13px] leading-5 text-ink-500">
              {schools.length} 所学校 · {programs.length} 个招生项目
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                programs={programs.filter(
                  (program) => program.school_id === school.id,
                )}
                school={school}
              />
            ))}
          </div>
        </section>

        {areaChips.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 px-1 text-[17px] font-semibold leading-6 text-ink-900 md:text-lg">
              专业方向
            </h2>
            <FilterChips ariaLabel="按专业方向浏览" chips={areaChips} />
          </section>
        ) : null}
      </PageShell>
    </>
  );
}
