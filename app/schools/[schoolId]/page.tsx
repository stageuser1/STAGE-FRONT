import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { AreaProgramIndex } from "@/components/school/AreaProgramIndex";
import { SchoolAdmissionsOverview } from "@/components/school/SchoolAdmissionsOverview";
import { SchoolProfileCard } from "@/components/reviewer/SchoolProfileCard";
import { getProgramsBySchoolId, getSchoolById } from "@/lib/data";

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
        <PageShell>
          <EmptyState
            actionHref="/"
            actionLabel="返回首页"
            description="这个学校暂未收录，或链接已失效。"
            icon="school"
            title="学校未找到"
          />
        </PageShell>
      </>
    );
  }

  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell className="space-y-4 md:space-y-5">
        <SchoolProfileCard programCount={programs.length} school={school} />

        <SchoolAdmissionsOverview sources={school.sources ?? []} />

        <section>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">招生项目</h2>
              <p className="text-sm text-ink-500">
                按专业方向浏览，共 {programs.length} 个项目
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              href="/search"
            >
              搜索项目
            </Link>
          </div>
          {programs.length > 0 ? (
            <AreaProgramIndex programs={programs} />
          ) : (
            <EmptyState
              description="该学校暂未收录招生项目，收录后会在此展示。"
              icon="music"
              title="暂无项目"
            />
          )}
        </section>
      </PageShell>
    </>
  );
}
