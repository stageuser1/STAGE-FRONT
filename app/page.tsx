import { BrandBanner } from "@/components/BrandBanner";
import { FilterChips, type FilterChipItem } from "@/components/FilterChips";
import { HeroSearch } from "@/components/HeroSearch";
import { HomeSchoolCard } from "@/components/HomeSchoolCard";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import type { Program } from "@/data/types";
import { getAllPrograms, getAllSchools } from "@/lib/data";
import { latestSchoolUpdate } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Canonical country filter set shown on the homepage. */
const countryChips: FilterChipItem[] = [
  { label: "全部", href: "/", active: true },
  { label: "美国", href: "/search?country=US" },
  { label: "英国", href: "/search?country=GB" },
  { label: "加拿大", href: "/search?country=CA" },
  { label: "韩国", href: "/search?country=KR" },
  { label: "筛选", href: "/search", icon: "filter" },
];

export default async function HomePage() {
  const [schools, programs] = await Promise.all([
    getAllSchools(),
    getAllPrograms(),
  ]);

  // Roll programs up under their school (school is the primary entity here).
  const programsBySchool = new Map<string, Program[]>();
  for (const program of programs) {
    const list = programsBySchool.get(program.school_id) ?? [];
    list.push(program);
    programsBySchool.set(program.school_id, list);
  }

  // Most recently updated institutions first — the "最新更新院校" feed.
  const updatedAt = (id: string, school: (typeof schools)[number]) =>
    latestSchoolUpdate(school, programsBySchool.get(id) ?? []) ?? "";
  const feed = [...schools].sort((left, right) =>
    updatedAt(right.id, right).localeCompare(updatedAt(left.id, left)),
  );

  return (
    <>
      <MobileHeader showNotifications subtitle="海外音乐院校招生数据库" />
      <PageShell>
        <section className="space-y-[14px] md:mx-auto md:max-w-2xl">
          <h1 className="px-2 text-[25px] font-bold leading-8 tracking-[0.01em] text-ink-900 md:text-center md:text-[34px] md:leading-[44px]">
            探索全球音乐教育机会
          </h1>
          <HeroSearch />
          <FilterChips ariaLabel="按国家筛选" chips={countryChips} />
        </section>

        <section className="mt-5">
          <BrandBanner />
        </section>

        <section className="mt-2.5">
          <div className="mb-2 px-2">
            <h2 className="text-base font-bold leading-5 text-ink-900">
              精选院校
            </h2>
            <p className="mt-0.5 text-[10px] leading-4 text-ink-500">
              为你精选全球顶尖音乐学府
            </p>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 md:gap-5">
            {feed.map((school) => (
              <HomeSchoolCard
                key={school.id}
                programs={programsBySchool.get(school.id) ?? []}
                school={school}
              />
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
