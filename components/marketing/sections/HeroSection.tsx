import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { hero } from "@/content/landing";

/**
 * 首屏 (spec §二.2): 徽章 → 双句大标题 → 副标题 → 双 CTA → 信任行.
 *
 * Typography-led and centred, on the low-saturation ambient wash the T0 token
 * map parked for this stage (`--stage-ambient-sky`). No decorative graphics
 * competing with the type (spec §五.4), no shadow, no scroll-linked motion —
 * the section is a pure server component with zero client JS.
 *
 * All copy is 逐字 from spec §三 and comes only from content/landing.ts.
 */
export function HeroSection() {
  return (
    <section
      aria-label="STAGE 简介"
      className="relative isolate overflow-hidden bg-stage-ambient-hero"
    >
      <Container>
        <div className="mx-auto flex max-w-stage-narrow flex-col items-center py-stage-section text-center">
          <p className="text-stage-2xs font-medium uppercase tracking-stage-eyebrow text-stage-primary">
            {hero.eyebrow}
          </p>

          <h1 className="mt-5 text-balance text-stage-d1 font-semibold text-stage-fg">
            <span className="block">{hero.headline.line1}</span>
            <span className="block">{hero.headline.line2}</span>
          </h1>

          <p className="mt-6 max-w-stage-measure text-stage-sm text-stage-fg-muted sm:text-stage-body">
            {hero.subhead}
          </p>

          <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={hero.primaryCta.href}
              className="inline-flex items-center justify-center rounded-stage-sm bg-stage-primary px-6 py-3 text-stage-sm font-medium text-stage-fg-on-dark transition-colors duration-stage-base hover:bg-stage-primary-hover"
            >
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-stage-sm border border-stage-border-strong bg-stage-bg px-6 py-3 text-stage-sm font-medium text-stage-fg transition-colors duration-stage-base hover:bg-stage-primary-soft"
            >
              {hero.secondaryCta.label}
            </Link>
          </div>

          <p className="mt-6 text-stage-xs text-stage-fg-muted">
            {hero.trustLine}
          </p>
        </div>
      </Container>
    </section>
  );
}
