import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared "coming soon" teaser body (doc 01 §3) for the /dashboard and
 * /ielts-lab placeholder routes. One section: eyebrow + headline + paragraph +
 * CTA back to the school database. No waitlist form in Phase 1.
 */
export function ComingSoon({
  eyebrow,
  title,
  body,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <section aria-label={eyebrow} className="relative overflow-hidden bg-stage-bg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-stage-sky-100 to-transparent" />
      </div>
      <Container className="relative">
        <div className="mx-auto max-w-2xl py-24 text-center md:py-32">
          <span className="inline-block rounded-full bg-stage-blue-100 px-3 py-1 text-caption font-medium text-stage-blue-600">
            即将上线
          </span>
          <p className="mt-6 text-caption font-medium uppercase text-stage-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-h2-sm font-bold text-stage-fg md:text-h2">
            {title}
          </h1>
          <p className="mt-4 text-body-lg text-stage-fg-muted">{body}</p>
          <Link
            href={cta.href}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-stage-md bg-stage-primary px-6 py-3 text-body font-medium text-stage-fg-on-dark transition hover:bg-stage-primary-hover"
          >
            {cta.label}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
