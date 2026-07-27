import { EmptyState } from "@/components/EmptyState";
import { FitPanel } from "@/components/fit/FitPanel";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramDetailSections } from "@/components/program/ProgramDetailSections";
import { SourceCitationBlock } from "@/components/SourceCitationBlock";
import {
  getProgramById,
  getProgramRouteParams,
  toPublicProgramDto,
} from "@/lib/data";

export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getProgramRouteParams(3);
}

interface ProgramPageProps {
  params: Promise<{
    schoolId: string;
    programId: string;
  }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { schoolId, programId } = await params;
  const program = await getProgramById(schoolId, programId);
  // Mapped once and shared: the detail sections and the fit panel must read
  // exactly the same public shape, or the checklist could disagree with the
  // section it summarises.
  const dto = program ? toPublicProgramDto(program) : null;

  if (!program || !dto) {
    return (
      <>
        <MobileHeader backHref={`/schools/${schoolId}`} />
        <PageShell>
          <EmptyState
            actionHref="/search"
            actionLabel="搜索项目"
            description="这个项目暂未收录，或链接已失效。"
            icon="music"
            title="项目未找到"
          />
        </PageShell>
      </>
    );
  }

  return (
    <>
      <MobileHeader backHref={`/schools/${program.school_id}`} />
      <PageShell>
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0 lg:order-none">
            <ProgramDetailSections program={dto} />
          </div>
          {/* The fit panel is the decision, so on narrow screens it leads
              rather than dropping below the prose. One instance, two
              positions — never a duplicated component. */}
          <div className="order-first space-y-4 lg:sticky lg:top-20 lg:order-none">
            <FitPanel program={dto} />
            <SourceCitationBlock
              dataQuality={program.data_quality}
              sources={program.sources}
            />
          </div>
        </div>
      </PageShell>
    </>
  );
}
