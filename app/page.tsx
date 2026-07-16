import { MobileHeader } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SearchBar, type SearchFilterOption } from "@/components/SearchBar";
import { getAllPrograms } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const programs = await getAllPrograms();
  const countryOptions = uniqueOptions(programs.map((program) => program.country));
  const majorOptions = uniqueOptions(programs.map((program) => program.major_area));

  return (
    <>
      <MobileHeader subtitle="海外音乐院校招生数据库" />
      <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-4">
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-700">
              招生数据 Admissions
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-7 text-gray-900">
              搜索学校、专业、学历
            </h1>
          </div>
          <SearchBar
            countryOptions={countryOptions}
            degreeOptions={degreeOptions}
            majorOptions={majorOptions}
          />
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                最新更新项目
              </h2>
              <p className="text-sm text-gray-600">
                共 {programs.length} 个项目
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
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
