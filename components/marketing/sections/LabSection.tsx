import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { ReadingEvidenceMock } from "@/components/marketing/mocks/ReadingEvidenceMock";
import { lab } from "@/content/landing";

/**
 * IELTS Lab 区块 (spec §二.6): 右文左图, opening on the reverse-positioning
 * statement — no AI examiner, no score prediction, evidence-backed review
 * instead (逐字, spec §三).
 *
 * The four skills are listed as the spec asks, each carrying its real status:
 * only Reading is usable today, so the other three are marked 建设中 rather
 * than presented as available (spec §五.3). Status is carried by text, not by
 * colour alone (Plan §6.8).
 */
export function LabSection() {
  return (
    <section aria-label={lab.title} className="bg-stage-bg-soft">
      <Container>
        <div className="grid items-center gap-10 py-stage-section lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0 lg:order-2">
            <SectionIntro
              eyebrow={lab.eyebrow}
              title={lab.title}
              subhead={lab.subhead}
            />

            <ul className="mt-8 grid grid-cols-2 gap-2.5">
              {lab.modules.map((module) => (
                <li
                  key={module.name}
                  className="min-w-0 rounded-stage-md border border-stage-border bg-stage-bg px-3.5 py-3"
                >
                  <p className="truncate text-stage-sm font-medium text-stage-fg">
                    {module.name}
                  </p>
                  <p
                    className={`mt-1 text-stage-2xs ${
                      module.live ? "text-stage-green-700" : "text-stage-fg-subtle"
                    }`}
                  >
                    {module.live ? lab.liveLabel : lab.comingLabel}
                  </p>
                </li>
              ))}
            </ul>

            <Link
              href={lab.cta.href}
              className="mt-8 inline-flex items-center gap-1.5 text-stage-sm font-medium text-stage-primary transition-colors duration-stage-base hover:text-stage-primary-hover"
            >
              {lab.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="min-w-0 lg:order-1">
            <ReadingEvidenceMock />
          </div>
        </div>
      </Container>
    </section>
  );
}
