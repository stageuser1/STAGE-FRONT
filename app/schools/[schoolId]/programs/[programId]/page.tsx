import { DataStatusBanner } from "@/components/DataStatusBanner";
import { EmptyState } from "@/components/EmptyState";
import { MobileHeader } from "@/components/MobileHeader";
import { SourceCitationBlock } from "@/components/SourceCitationBlock";
import { ReviewerProgramCards } from "@/components/reviewer/ReviewerProgramCards";
import { getProgramById } from "@/lib/data";

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

  return (
    <>
      <MobileHeader backHref={`/schools/${program.school_id}`} />
      <main className="mx-auto min-h-screen w-full max-w-md space-y-4 bg-gray-50 px-4 py-4">
        <ReviewerProgramCards program={program} section="overview" />

        <DataStatusBanner dataQuality={program.data_quality} />

        <ReviewerProgramCards program={program} section="requirements" />

        <SourceCitationBlock
          dataQuality={program.data_quality}
          sources={program.sources}
        />
      </main>
    </>
  );
}
