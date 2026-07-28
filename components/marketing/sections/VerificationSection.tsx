import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { SchoolListMock } from "@/components/marketing/mocks/SchoolListMock";
import { verification } from "@/content/landing";

/**
 * 验证机制区块 (spec §二.5): 左文右图, with the three-step provenance flow
 * 来源抓取 → 结构化核对 → 标注核实日期 (逐字, spec §三).
 *
 * The arrows are decorative and never carry meaning on their own — the steps
 * are a numbered ordered list, so the sequence survives without them.
 */
export function VerificationSection() {
  return (
    <section aria-label={verification.title} className="bg-stage-bg">
      <Container>
        <div className="grid items-center gap-10 py-stage-section lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <SectionIntro
              eyebrow={verification.eyebrow}
              title={verification.title}
              subhead={verification.subhead}
            />

            <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2">
              {verification.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="text-stage-xs text-stage-fg-subtle"
                    >
                      →
                    </span>
                  ) : null}
                  <span className="rounded-stage-pill border border-stage-border bg-stage-bg-soft px-3 py-1.5 text-stage-xs text-stage-fg-body">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <Link
              href={verification.cta.href}
              className="mt-8 inline-flex items-center gap-1.5 text-stage-sm font-medium text-stage-primary transition-colors duration-stage-base hover:text-stage-primary-hover"
            >
              {verification.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="min-w-0">
            <SchoolListMock />
          </div>
        </div>
      </Container>
    </section>
  );
}
