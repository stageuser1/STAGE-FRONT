import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SchoolCard } from "@/components/SchoolCard";
import { SearchBar } from "@/components/SearchBar";
import { getAllPrograms, getAllSchools } from "@/lib/data";
import { buildFilterOptions } from "@/lib/search-options";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [schools, programs] = await Promise.all([
    getAllSchools(),
    getAllPrograms(),
  ]);
  const { countryOptions, majorOptions, degreeOptions } =
    buildFilterOptions(programs);

  return (
    <>
      <MobileHeader subtitle="海外音乐院校招生数据库" />
      <PageShell>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              招生数据 Admissions
            </p>
            <h1 className="mt-1 text-xl font-semibold leading-8 text-ink-900 md:text-2xl">
              搜索学校、专业、学历
            </h1>
          </div>
          <SearchBar
            countryOptions={countryOptions}
            degreeOptions={degreeOptions}
            majorOptions={majorOptions}
          />
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">收录院校</h2>
              <p className="text-sm text-ink-500">
                {schools.length} 所学校 · {programs.length} 个招生项目
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
      </PageShell>
    </>
  );
}
