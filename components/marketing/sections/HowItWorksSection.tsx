import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { howItWorks } from "@/content/landing";

/**
 * How STAGE works (doc 03 §7): three numbered step cards connected by a
 * hairline on desktop, staggered entrance.
 */
export function HowItWorksSection() {
  return (
    <section aria-label={howItWorks.title} className="bg-stage-bg">
      <Container>
        <div className="py-20 md:py-28">
          <SectionHeading title={howItWorks.title} />
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-8 hidden h-px bg-stage-border md:block"
            />
            {howItWorks.steps.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.08}>
                <div className="relative rounded-stage-lg border border-stage-border bg-stage-bg p-6 shadow-stage-sm">
                  <span className="font-stage-mono text-h3 font-bold text-stage-primary">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-h3-sm font-bold text-stage-fg">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-body text-stage-fg-muted">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
