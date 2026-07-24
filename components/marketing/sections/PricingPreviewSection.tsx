import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { pricingPreview } from "@/content/landing";

/**
 * Pricing preview (doc 03 §8). Placeholder tiers — no real pricing claims;
 * prices render as "—"/"免费" with a "具体方案即将公布" note.
 */
export function PricingPreviewSection() {
  return (
    <section aria-label={pricingPreview.title} className="bg-stage-bg-soft">
      <Container>
        <div className="py-20 md:py-28">
          <SectionHeading title={pricingPreview.title} intro={pricingPreview.note} />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {pricingPreview.tiers.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 0.08}>
                <div
                  className={`flex h-full flex-col rounded-stage-lg bg-stage-bg p-6 ${
                    tier.highlighted
                      ? "border-2 border-stage-primary shadow-stage-md"
                      : "border border-stage-border shadow-stage-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-h3-sm font-bold text-stage-fg">
                      {tier.name}
                    </h3>
                    {tier.badge ? (
                      <span className="rounded-full bg-stage-blue-100 px-2.5 py-0.5 text-caption font-medium text-stage-blue-600">
                        {tier.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 font-stage-mono text-h2-sm font-bold text-stage-fg">
                    {tier.price}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Icon
                          name="check"
                          size={16}
                          className="mt-1 shrink-0 text-stage-success"
                        />
                        <span className="text-body text-stage-fg-muted">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta.href}
                    className={`mt-8 inline-flex items-center justify-center rounded-stage-md px-5 py-2.5 text-body font-medium transition ${
                      tier.highlighted
                        ? "bg-stage-primary text-stage-fg-on-dark hover:bg-stage-primary-hover"
                        : "border border-stage-border text-stage-fg hover:bg-stage-blue-50"
                    }`}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
