import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { ProgramDetailSections } from "@/components/program/ProgramDetailSections";
import { SourceCitationBlock } from "@/components/SourceCitationBlock";
import { getProgramById } from "@/lib/data";

export const dynamic = "force-dynamic";

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
      <PageShell width="reading">
        <div className="space-y-4 md:space-y-5">
          <ProgramDetailSections program={program} />
          <SourceCitationBlock
            dataQuality={program.data_quality}
            sources={program.sources}
          />
        </div>
      </PageShell>
    </>
  );
}
