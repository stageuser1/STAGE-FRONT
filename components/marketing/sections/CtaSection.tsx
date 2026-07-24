import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { Reveal } from "@/components/motion/Reveal";
import { cta } from "@/content/landing";

/**
 * Final CTA band (doc 03 §10). Dark gradient surface inset within the
 * container, with one slow ambient glow drift (disabled under reduced motion).
 */
export function CtaSection() {
  return (
    <section aria-label={cta.title} className="bg-stage-bg">
      <Container>
        <div className="py-20 md:py-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-stage-lg bg-stage-gradient-cta px-6 py-16 text-center md:px-12 md:py-20">
              <div
                aria-hidden="true"
                className="stage-animate-drift pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-stage-blue-500/25 blur-3xl"
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-balance text-h2-sm font-bold text-stage-fg-on-dark md:text-h2">
                  {cta.title}
                </h2>
                <p className="mt-4 text-body-lg text-stage-fg-on-dark-muted">
                  {cta.body}
                </p>
                <Link
                  href={cta.button.href}
                  className="mt-8 inline-flex items-center justify-center rounded-stage-md bg-stage-white px-7 py-3 text-body font-medium text-stage-navy-900 transition hover:bg-stage-blue-50"
                >
                  {cta.button.label}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
