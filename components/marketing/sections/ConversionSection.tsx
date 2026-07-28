import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { conversion } from "@/content/landing";

/**
 * 转化区 (spec §二.8): the hero's two CTAs repeated, primary and secondary
 * unchanged. The heading re-uses the hero's 逐字 headline rather than
 * introducing copy the spec does not define.
 */
export function ConversionSection() {
  return (
    <section aria-label={conversion.title} className="bg-stage-bg-soft">
      <Container>
        <div className="mx-auto flex max-w-stage-narrow flex-col items-center py-stage-section text-center">
          <h2 className="text-balance text-stage-h3 font-semibold text-stage-fg sm:text-stage-h2">
            {conversion.title}
          </h2>

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={conversion.primaryCta.href}
              className="inline-flex items-center justify-center rounded-stage-sm bg-stage-primary px-6 py-3 text-stage-sm font-medium text-stage-fg-on-dark transition-colors duration-stage-base hover:bg-stage-primary-hover"
            >
              {conversion.primaryCta.label}
            </Link>
            <Link
              href={conversion.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-stage-sm border border-stage-border-strong bg-stage-bg px-6 py-3 text-stage-sm font-medium text-stage-fg transition-colors duration-stage-base hover:bg-stage-primary-soft"
            >
              {conversion.secondaryCta.label}
            </Link>
          </div>

          <p className="mt-6 text-stage-xs text-stage-fg-muted">
            {conversion.trustLine}
          </p>
        </div>
      </Container>
    </section>
  );
}
