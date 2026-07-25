import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramDetailSections } from "@/components/program/ProgramDetailSections";
import { SourceCitationBlock } from "@/components/SourceCitationBlock";
import { getAllPrograms, getProgramById } from "@/lib/data";

export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams() {
  const programs = await getAllPrograms();
  return programs.slice(0, 3).map((program) => ({
    schoolId: program.school_id,
    programId: program.id,
  }));
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

  if (!program) {
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
        <div className="gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <ProgramDetailSections program={program} />
          </div>
          <div className="mt-4 lg:sticky lg:top-20 lg:mt-0">
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
