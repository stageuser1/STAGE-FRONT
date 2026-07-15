import Link from "next/link";
import { DataStatusBanner } from "@/components/DataStatusBanner";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader } from "@/components/MobileHeader";
import { ProgramCard } from "@/components/ProgramCard";
import { SchoolProfileCard } from "@/components/reviewer/SchoolProfileCard";
import {
  getProgramsBySchoolId,
  getSchoolById,
} from "@/lib/data";

export const dynamic = "force-dynamic";

interface SchoolPageProps {
  params: Promise<{
    schoolId: string;
  }>;
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = await params;
  const school = await getSchoolById(schoolId);
  const programs = await getProgramsBySchoolId(schoolId);

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
        <SchoolProfileCard programCount={programs.length} school={school} />

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
