import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { IeltsSimPreview } from "@/components/marketing/IeltsSimPreview";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { hero } from "@/content/landing";

/**
 * Hero (doc 03 §2). Two-column ≥ lg (text / IELTS mock), stacked below.
 * Cloud-gradient atmosphere is layered blurred blobs (not an image), with
 * ambient float loops disabled under reduced motion (globals.css).
 */
export function HeroSection() {
  return (
    <section
      aria-label="STAGE 简介"
      className="relative overflow-hidden bg-stage-bg"
    >
      {/* cloud atmosphere (doc 02 §2.3) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-stage-sky-100 to-transparent" />
        <div className="stage-animate-drift absolute -left-24 top-10 h-72 w-72 rounded-full bg-stage-sky-300/40 blur-3xl" />
        <div className="stage-animate-float-slow absolute right-0 top-32 h-80 w-80 rounded-full bg-stage-blue-400/20 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="text-caption font-medium uppercase text-stage-primary">
                {hero.eyebrow}
              </span>
              <h1 className="mt-4 text-balance text-display-sm font-bold text-stage-fg md:text-display">
                {hero.headline.pre}
                <span className="bg-stage-gradient-text bg-clip-text text-transparent">
                  {hero.headline.highlight}
                </span>
                {hero.headline.post}
              </h1>
              <p className="mt-6 max-w-[34ch] text-body-lg text-stage-fg-muted">
                {hero.subhead}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={hero.primaryCta.href}
                  className="inline-flex items-center justify-center gap-2 rounded-stage-md bg-stage-primary px-6 py-3 text-body font-medium text-stage-fg-on-dark transition hover:bg-stage-primary-hover"
                >
                  {hero.primaryCta.label}
                  <Icon name="arrow-right" size={18} />
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-stage-md border border-stage-border px-6 py-3 text-body font-medium text-stage-fg transition hover:bg-stage-blue-50"
                >
                  {hero.secondaryCta.label}
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-caption tracking-normal text-stage-fg-muted">
                <Icon name="check" size={16} className="text-stage-success" />
                {hero.trustLine}
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.15}>
              <div className="relative mx-auto max-w-[560px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 shadow-stage-glow"
                />
                <div className="stage-animate-float lg:[transform:perspective(1600px)_rotateY(-2deg)]">
                  <IeltsSimPreview />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
