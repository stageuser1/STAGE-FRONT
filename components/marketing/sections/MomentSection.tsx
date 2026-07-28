import { Container } from "@/components/marketing/Container";
import { LabOpeningCard } from "@/components/marketing/mocks/LabOpeningCard";
import { SchoolDetailMock } from "@/components/marketing/mocks/SchoolDetailMock";

/**
 * 进行时双截图 (spec §二.3): the school detail page with the IELTS Lab card
 * being summoned over its lower right — the moment the two products meet.
 *
 * The overlap only exists from lg up; below that the card stacks underneath, so
 * nothing is ever pushed outside the viewport (Plan §4.1.3).
 */
export function MomentSection() {
  return (
    <section aria-label="STAGE 使用中的界面" className="bg-stage-bg">
      <Container>
        <div className="pb-stage-section pt-stage-section-tight">
          <div className="relative mx-auto max-w-[900px]">
            <SchoolDetailMock />
            <div className="mx-auto mt-4 max-w-[19rem] lg:absolute lg:bottom-8 lg:right-0 lg:mt-0 lg:w-[15.5rem]">
              <LabOpeningCard />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
