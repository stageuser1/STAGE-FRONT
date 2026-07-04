import Link from "next/link";
import { DataStatusBanner } from "@/components/DataStatusBanner";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader } from "@/components/MobileHeader";
import { MissingDataNote } from "@/components/MissingDataNote";
import { ProgramCard } from "@/components/ProgramCard";
import { getProgramsBySchoolId, getSchoolById } from "@/lib/data";

interface SchoolPageProps {
  params: Promise<{
    schoolId: string;
  }>;
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = await params;
  const school = getSchoolById(schoolId);
  const programs = getProgramsBySchoolId(schoolId);

  if (!school) {
    return (
      <>
        <MobileHeader backHref="/" />
        <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-5">
          <EmptyState
            actionHref="/"
            actionLabel="返回首页"
            description="这个学校 ID 暂未匹配到本地样例记录。"
            title="学校未找到"
          />
        </main>
      </>
    );
  }

  return (
    <>
      <MobileHeader backHref="/" />
      <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-blue-700">
                学校信息
              </p>
              <h1 className="mt-2 text-xl font-semibold leading-tight text-gray-900">
                {school.name}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {school.country} · {school.city}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {programs.length} 个项目
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">官方网站</span>
              <span className="max-w-44 truncate text-right font-semibold">
                {school.website_url ? (
                  <a
                    className="text-blue-700 underline-offset-2 hover:underline"
                    href={school.website_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {school.website_url}
                  </a>
                ) : (
                  <MissingDataNote />
                )}
              </span>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <DataStatusBanner dataQuality={school.data_quality} />
        </div>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">已收录项目</h2>
              <p className="text-sm text-gray-600">
                共 {programs.length} 个项目
              </p>
            </div>
            <Link className="text-sm font-semibold text-blue-700" href="/search">
              搜索项目
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
              description="该学校样例下暂未收录项目。"
              title="暂无项目"
            />
          )}
        </section>
      </main>
    </>
  );
}
