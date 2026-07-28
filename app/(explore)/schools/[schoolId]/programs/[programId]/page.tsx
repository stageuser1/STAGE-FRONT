import { notFound } from "next/navigation";
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

/** Program ids are Directus primary keys and are always numeric. */
const PROGRAM_ID = /^\d+$/;

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { schoolId, programId } = await params;

  // Shape first: Directus answers 400 ("Invalid numeric value") for a
  // non-numeric id on this collection, which would surface as a 500 — a worse
  // answer than 200 for a URL that is simply wrong. A segment that cannot be a
  // program id is a bad URL and gets the same 404 as an id with no record.
  // Anything numeric still goes to the loader, so a real lookup failure stays a
  // real lookup failure rather than a guess made here.
  if (!PROGRAM_ID.test(programId)) {
    notFound();
  }

  const program = await getProgramById(schoolId, programId);
  // Mapped once and shared: the detail sections and the fit panel must read
  // exactly the same public shape, or the checklist could disagree with the
  // section it summarises.
  const dto = program ? toPublicProgramDto(program) : null;

  // No such program under this school — including a real program reached
  // through the wrong school segment — is a bad URL and answers 404 rather
  // than a successful page (audit P1-10). `not-found.tsx` next to this file
  // keeps the presentation that used to render here. A program that exists but
  // is missing fields still renders, with its own in-page missing-data notes.
  if (!program || !dto) {
    notFound();
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
