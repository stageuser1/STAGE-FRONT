import { Container } from "@/components/marketing/Container";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { faq } from "@/content/landing";

/**
 * FAQ (doc 03 §9). Native <details>/<summary> accordion — no JS library. The
 * shared `name` makes it single-open (HTML exclusive accordion) where
 * supported, degrading gracefully to multi-open elsewhere.
 */
export function FaqSection() {
  return (
    <section aria-label={faq.title} className="bg-stage-bg">
      <Container>
        <div className="py-20 md:py-28">
          <SectionHeading title={faq.title} />
          <div className="mx-auto mt-12 max-w-[720px]">
            {faq.items.map((item) => (
              <Reveal key={item.question}>
                <details
                  name="faq"
                  className="group border-b border-stage-border"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-body font-medium text-stage-fg [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <Icon
                      name="chevron-down"
                      size={20}
                      className="shrink-0 text-stage-fg-muted transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 text-body text-stage-fg-muted">
                    {item.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
