import { Container } from "@/components/marketing/Container";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { personas } from "@/content/landing";

/**
 * 用户场景区块 (spec §二.7): three cards — 学生 / 家长 / 顾问 — each carrying
 * its 逐字 line from spec §三. No photography: the spec allows a small
 * monochrome stage image per card, and shipping an unlicensed one would be
 * worse than shipping none (spec §一: photography is accent only).
 */
export function PersonaSection() {
  return (
    <section aria-label={personas.title} className="bg-stage-bg">
      <Container>
        <div className="py-stage-section">
          <SectionIntro
            eyebrow={personas.eyebrow}
            title={personas.title}
            subhead={personas.subhead}
            align="center"
          />

          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {personas.cards.map((card) => (
              <li
                key={card.role}
                className="min-w-0 rounded-stage-lg border border-stage-border bg-stage-bg p-6"
              >
                <p className="text-stage-2xs font-medium uppercase tracking-stage-eyebrow text-stage-fg-subtle">
                  {card.role}
                </p>
                <p className="mt-4 text-balance text-stage-h4 font-semibold text-stage-fg">
                  {card.line}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
