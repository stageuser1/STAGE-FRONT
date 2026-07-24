import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { AppPreviewCard } from "@/components/marketing/AppPreviewCard";
import { IeltsSimPreview } from "@/components/marketing/IeltsSimPreview";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import type { Feature } from "@/content/landing";

/**
 * One data-driven feature section, rendered three times (doc 03 §4–6).
 * Alternating two-column layout; background alternates via `index` parity.
 * Server component; content comes only from the passed Feature.
 */
export function FeatureSection({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  const soft = index % 2 === 1;
  const visualRight = feature.visualSide === "right";

  return (
    <section
      aria-label={feature.eyebrow}
      className={soft ? "bg-stage-bg-soft" : "bg-stage-bg"}
    >
      <Container>
        <div className="grid items-center gap-10 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
          {/* text */}
          <Reveal
            className={`min-w-0 ${visualRight ? "lg:order-1" : "lg:order-2"}`}
          >
            <span className="text-caption font-medium uppercase text-stage-primary">
              {feature.eyebrow}
            </span>
            <h2 className="mt-3 text-balance text-h2-sm font-bold text-stage-fg md:text-h2">
              {feature.title}
            </h2>
            <p className="mt-4 max-w-[38ch] text-body-lg text-stage-fg-muted">
              {feature.body}
            </p>
            <ul className="mt-6 space-y-3">
              {feature.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stage-blue-50 text-stage-success">
                    <Icon name="check" size={14} />
                  </span>
                  <span className="text-body text-stage-fg">{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              href={feature.cta.href}
              className="mt-8 inline-flex items-center gap-1.5 text-body font-medium text-stage-primary transition hover:text-stage-primary-hover"
            >
              {feature.cta.label}
              <Icon name="arrow-right" size={18} />
            </Link>
          </Reveal>

          {/* visual */}
          <Reveal
            delay={0.12}
            className={`min-w-0 ${visualRight ? "lg:order-2" : "lg:order-1"}`}
          >
            <FeatureVisual feature={feature} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function FeatureVisual({ feature }: { feature: Feature }) {
  if (feature.visual === "ielts") {
    return (
      <div className="mx-auto max-w-[460px]">
        <IeltsSimPreview scale="compact" />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[460px]">
      <AppPreviewCard variant={feature.visual} />
    </div>
  );
}
