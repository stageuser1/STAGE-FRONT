import type { ReactNode } from "react";
import { DataStatusBanner } from "@/components/DataStatusBanner";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { EmptyState } from "@/components/EmptyState";
import { LanguageRequirementBlock } from "@/components/LanguageRequirementBlock";
import { MobileHeader } from "@/components/MobileHeader";
import { MissingDataNote } from "@/components/MissingDataNote";
import { SourceCitationBlock } from "@/components/SourceCitationBlock";
import { getProgramById } from "@/lib/data";

interface ProgramPageProps {
  params: Promise<{
    schoolId: string;
    programId: string;
  }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { schoolId, programId } = await params;
  const program = getProgramById(schoolId, programId);

  if (!program) {
    return (
      <>
        <MobileHeader backHref={`/schools/${schoolId}`} />
        <main className="mx-auto min-h-screen w-full max-w-md bg-gray-50 px-4 py-5">
          <EmptyState
            actionHref="/search"
            actionLabel="搜索项目"
            description="这个项目 ID 暂未匹配到本地样例记录。"
            title="项目未找到"
          />
        </main>
      </>
    );
  }

  const tuition =
    program.cost_aid.tuition_amount === null
      ? null
      : `${program.cost_aid.currency} ${program.cost_aid.tuition_amount.toLocaleString()}`;
  const englishSummary =
    program.language_requirements.accepted_tests.length > 0
      ? program.language_requirements.accepted_tests
          .map((test) => test.test_name)
          .join(" / ")
      : null;

  return (
    <>
      <MobileHeader backHref={`/schools/${program.school_id}`} />
      <main className="mx-auto min-h-screen w-full max-w-md space-y-4 bg-gray-50 px-4 py-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-blue-700">
                项目概览
              </p>
              <h1 className="mt-2 text-xl font-semibold leading-tight text-gray-900">
                {program.name}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                {program.school_name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {program.country} · {program.city}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {program.degree_level}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">关键信息</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <DetailRow label="学历" value={program.degree_level} />
            <DetailRow label="学制" value={program.duration} />
            <DetailRow
              label="截止日期"
              value={<DeadlineBadge deadline={program.deadline} />}
            />
            <DetailRow
              label="英语要求"
              value={englishSummary ?? <MissingDataNote />}
            />
            <DetailRow label="学费" value={tuition ?? <MissingDataNote />} />
          </div>
        </section>

        <DataStatusBanner dataQuality={program.data_quality} />

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              申请截止日期
            </h2>
            <DeadlineBadge deadline={program.deadline} />
          </div>
          <div className="mt-3 grid gap-1 text-sm">
            <DetailRow
              label="申请截止"
              value={program.deadline.application_deadline}
            />
            <DetailRow
              label="预筛选 Prescreening"
              value={program.deadline.prescreening_deadline}
            />
            <DetailRow label="试音 Audition" value={program.deadline.audition_date} />
          </div>
          {program.deadline.notes ? (
            <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
              {program.deadline.notes}
            </p>
          ) : null}
        </section>

        <LanguageRequirementBlock requirements={program.language_requirements} />

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            预筛选 / 试音 Prescreening & Audition
          </h2>
          <div className="mt-3 grid gap-1 text-sm">
            <DetailRow
              label="预筛选"
              value={formatBoolean(program.audition_requirements.prescreening_required)}
            />
            <DetailRow
              label="试音"
              value={formatBoolean(program.audition_requirements.audition_required)}
            />
            <DetailRow label="形式" value={program.audition_requirements.format} />
            <DetailRow
              label="曲目要求"
              value={program.audition_requirements.repertoire_requirements}
            />
          </div>
          {program.audition_requirements.notes ? (
            <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
              {program.audition_requirements.notes}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            学费与奖学金 Tuition & Aid
          </h2>
          <div className="mt-3 grid gap-1 text-sm">
            <DetailRow label="学费" value={tuition} />
            <DetailRow label="周期" value={program.cost_aid.tuition_period} />
            <DetailRow
              label="申请费"
              value={
                program.cost_aid.application_fee === null
                  ? null
                  : `${program.cost_aid.currency} ${program.cost_aid.application_fee}`
              }
            />
            <DetailRow
              label="奖学金"
              value={formatBoolean(program.cost_aid.scholarships_available)}
            />
          </div>
          {program.cost_aid.notes ? (
            <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
              {program.cost_aid.notes}
            </p>
          ) : null}
        </section>

        <SourceCitationBlock
          dataQuality={program.data_quality}
          sources={program.sources}
        />
      </main>
    </>
  );
}

function formatBoolean(value: boolean | null): string | null {
  if (value === null) {
    return null;
  }

  return value ? "是" : "否";
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className="max-w-48 text-right font-semibold text-gray-900">
        {value ?? <MissingDataNote />}
      </span>
    </div>
  );
}
