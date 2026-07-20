import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { AreaProgramIndex } from "@/components/school/AreaProgramIndex";
import { SchoolAdmissionsOverview } from "@/components/school/SchoolAdmissionsOverview";
import { SchoolContentSections } from "@/components/school/SchoolContentSections";
import { SchoolDegreeLegend } from "@/components/school/SchoolDegreeLegend";
import { SchoolHero } from "@/components/school/SchoolHero";
import { SchoolQuickFacts } from "@/components/school/SchoolQuickFacts";
import { SchoolVerificationCard } from "@/components/school/SchoolVerificationCard";
import { SchoolProfileCard } from "@/components/reviewer/SchoolProfileCard";
import { FactRow } from "@/components/ui/FactRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { getProgramsBySchoolId, getSchoolById } from "@/lib/data";
import { areaAnchorId } from "@/lib/format";
import { buildSchoolDetailViewModel } from "@/lib/school-detail";

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

  const detail = buildSchoolDetailViewModel(school, programs);
  const hasVerifiedSchoolContent = detail.sections.some(
    (section) => section.body !== null,
  );

  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell className="space-y-4 md:space-y-5">
        <div>
          <SchoolHero
            lastSourceDate={detail.lastSourceDate}
            monogram={detail.monogram}
            status={school.status}
          />
          <div className="relative z-[1] -mt-8 px-2 md:px-4">
            <SchoolProfileCard programCount={programs.length} school={school} />
          </div>
        </div>

        <SchoolQuickFacts facts={detail.quickFacts} />

        {hasVerifiedSchoolContent && detail.highlights.length > 0 ? (
          <SectionCard
            id="admissions-highlights"
            subtitle="Admissions Highlights"
            title="招生要点"
          >
            <div className="grid gap-0">
              {detail.highlights.map((highlight) => (
                <FactRow
                  key={highlight.label}
                  label={highlight.label}
                  value={highlight.value}
                />
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-ink-400">
              以上日期汇总自该校已收录项目，各项目要求不同，请以项目页为准。
            </p>
          </SectionCard>
        ) : null}

        {hasVerifiedSchoolContent ? (
          <>
            <SchoolContentSections sections={detail.sections} />
            <SchoolDegreeLegend degrees={detail.degrees} />
          </>
        ) : null}

        <section className="scroll-mt-24" id="programs">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-[17px] font-semibold leading-6 text-ink-900 md:text-lg">
                招生项目
              </h2>
              <p className="mt-0.5 text-[13px] leading-5 text-ink-500">
                按专业方向浏览，共 {programs.length} 个项目
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
              href="/search"
            >
              搜索项目
            </Link>
          </div>

          {detail.areas.length > 1 ? (
            <nav
              aria-label="专业方向导航"
              className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1"
            >
              {detail.areas.map((area) => (
                <a
                  className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
                  href={`#${areaAnchorId(area.name)}`}
                  key={area.name}
                >
                  {area.nameZh ?? area.name}
                  <span className="text-xs text-ink-400">{area.count}</span>
                </a>
              ))}
            </nav>
          ) : null}

          {programs.length > 0 ? (
            <AreaProgramIndex programs={programs} />
          ) : (
            <EmptyState
              description="该学校暂未收录招生项目，收录后会在此展示。"
              icon="music"
              title="项目待收录"
            />
          )}
        </section>

        {hasVerifiedSchoolContent ? (
          <SchoolAdmissionsOverview sources={school.sources ?? []} />
        ) : null}

        <SchoolVerificationCard
          lastSourceDate={detail.lastSourceDate}
          sourceCount={detail.sourceCount}
          status={school.status}
        />
      </PageShell>
    </>
  );
}
