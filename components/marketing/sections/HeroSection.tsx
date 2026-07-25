import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { HeroAtmosphere } from "@/components/marketing/HeroAtmosphere";
import { IeltsSimPreview } from "@/components/marketing/IeltsSimPreview";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { hero } from "@/content/landing";

/**
 * Hero (doc 03 §2). Centered, typography-led composition: eyebrow → two-line
 * headline → supporting copy → two CTAs, with the IELTS mock beneath the text
 * group (rising out of the cloud band, not competing with it).
 *
 * The luminous sky/grid/glow/cloud atmosphere lives in <HeroAtmosphere/> (an
 * original CSS system, tunable via the --hero-* vars on .stage-hero). Clouds
 * step rightward with hero scroll and fade the blue into a clean white section
 * two. All ambient/scroll motion is disabled under prefers-reduced-motion.
 */
export function HeroSection() {
  return (
    <section
      aria-label="STAGE 简介"
      className="stage-hero relative isolate overflow-hidden bg-stage-bg"
    >
      <HeroAtmosphere />

      <Container className="relative z-10">
        <div className="pb-24 pt-16 md:pb-32 md:pt-24">
          {/* Text + CTA group — centered, typography-led */}
          <Reveal>
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <span className="text-caption font-medium uppercase tracking-[0.14em] text-stage-primary">
                {hero.eyebrow}
              </span>
              <h1 className="mt-5 font-bold leading-[1.08] tracking-[-0.03em] text-stage-fg text-[2.125rem] sm:text-[3.25rem] lg:text-[4.5rem]">
                <span className="block">{hero.headline.line1}</span>
                <span className="block">{hero.headline.line2}</span>
              </h1>
              <p className="mt-6 max-w-[36rem] text-body-lg text-stage-fg-muted">
                {hero.subhead}
              </p>
              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href={hero.primaryCta.href}
                  className="inline-flex items-center justify-center gap-2 rounded-stage-md bg-stage-primary px-6 py-3 text-body font-medium text-stage-fg-on-dark shadow-stage-sm transition hover:bg-stage-primary-hover"
                >
                  {hero.primaryCta.label}
                  <Icon name="arrow-right" size={18} />
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-stage-md border border-stage-border bg-stage-bg/70 px-6 py-3 text-body font-medium text-stage-fg backdrop-blur-sm transition hover:bg-stage-bg"
                >
                  {hero.secondaryCta.label}
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-caption tracking-normal text-stage-fg-muted">
                <Icon name="check" size={16} className="text-stage-success" />
                {hero.trustLine}
              </p>
            </div>
          </Reveal>

          {/* Product preview — beneath the text, rising above the cloud band */}
          <Reveal delay={0.15}>
            <div className="relative mx-auto mt-16 min-w-0 max-w-[880px] md:mt-20">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 shadow-stage-glow"
              />
              <div className="stage-animate-float">
                <IeltsSimPreview />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
