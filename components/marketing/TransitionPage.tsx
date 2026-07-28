import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import type { TransitionItem } from "@/content/landing";

/**
 * The shared body for the 指南 and 术语库 transition pages (Plan 小项1, built on
 * the /pricing precedent): a real route so no nav or footer link is dead, and
 * an honest statement of what is not there yet.
 *
 * Discipline: each planned item is listed with a 整理中 marker so the page
 * never reads as a claim that the content exists (spec §五.3), and every page
 * hands the reader on to something that does exist today.
 */
export function TransitionPage({
  eyebrow,
  title,
  body,
  status,
  items,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  status: string;
  items: readonly TransitionItem[];
  cta: { href: string; label: string };
}) {
  return (
    <section aria-label={title} className="bg-stage-bg">
      <Container>
        <div className="py-stage-section">
          <div className="max-w-stage-narrow">
            <p className="text-stage-2xs font-medium uppercase tracking-stage-eyebrow text-stage-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-balance text-stage-h2 font-semibold text-stage-fg sm:text-stage-h1">
              {title}
            </h1>
            <p className="mt-4 max-w-stage-measure text-stage-sm text-stage-fg-muted sm:text-stage-body">
              {body}
            </p>
          </div>

          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.title}
                className="min-w-0 rounded-stage-lg border border-stage-border bg-stage-bg p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-stage-sm font-semibold text-stage-fg">
                    {item.title}
                  </h2>
                  <span className="shrink-0 rounded-stage-pill border border-stage-border bg-stage-bg-soft px-2 py-0.5 text-stage-2xs text-stage-fg-subtle">
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-stage-xs text-stage-fg-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>

          <Link
            href={cta.href}
            className="mt-10 inline-flex items-center justify-center rounded-stage-sm bg-stage-primary px-6 py-3 text-stage-sm font-medium text-stage-fg-on-dark transition-colors duration-stage-base hover:bg-stage-primary-hover"
          >
            {cta.label}
          </Link>
        </div>
      </Container>
    </section>
  );
}
