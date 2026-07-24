import { Container } from "@/components/marketing/Container";
import { StatItem } from "@/components/marketing/StatItem";
import { Reveal } from "@/components/motion/Reveal";
import { credibility } from "@/content/landing";

/**
 * Credibility band (doc 03 §3) — replaces the school-logo carousel with a
 * data-coverage stats row. Numbers are static editorial placeholders (ADR-13).
 */
export function CredibilitySection() {
  return (
    <section
      aria-label={credibility.eyebrow}
      className="border-y border-stage-border bg-stage-bg"
    >
      <Container>
        <div className="py-16 md:py-20">
          <Reveal className="text-center">
            <span className="text-caption font-medium uppercase text-stage-fg-muted">
              {credibility.eyebrow}
            </span>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            {credibility.stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <StatItem
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
