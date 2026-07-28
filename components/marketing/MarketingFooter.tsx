import Link from "next/link";
import { Container } from "@/components/marketing/Container";
import { Icon } from "@/components/ui/Icon";
import { footer } from "@/content/landing";

/**
 * Marketing footer (homepage-spec §二.9 + ielts-lab-supplement-spec §四).
 *
 * Carries, in order: the guide items / 术语库 / 联系我们 link columns, the three
 * official IELTS entry points (external, new window, rel="noopener"), the
 * IELTS® trademark disclaimer 逐字, the 备案信息 row, and the oversized STAGE
 * wordmark that closes the page.
 *
 * Plan 小项3: the disclaimer ships as written and is marked in-page for legal
 * review. React strips JSX comments from the output, so the marker is emitted
 * as a real HTML comment — that is the whole reason for the dangerouslySet
 * call below, and the string it renders is a constant from content/landing.ts.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-stage-border bg-stage-bg">
      <Container>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-14 md:grid-cols-4">
          {footer.columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <h2 className="text-stage-2xs font-medium uppercase tracking-stage-eyebrow text-stage-fg-subtle">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-stage-xs text-stage-fg-muted transition-colors duration-stage-base hover:text-stage-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="min-w-0">
            <h2 className="text-stage-2xs font-medium uppercase tracking-stage-eyebrow text-stage-fg-subtle">
              {footer.officialTitle}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {footer.officialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-stage-xs text-stage-fg-muted transition-colors duration-stage-base hover:text-stage-fg"
                  >
                    {link.label}
                    <Icon name="external" size={12} />
                    <span className="sr-only">（在新窗口打开）</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stage-border py-8">
          <p className="max-w-stage-measure text-stage-2xs leading-relaxed text-stage-fg-subtle">
            {footer.disclaimer}
          </p>
          <div
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: `<!-- ${footer.disclaimerReviewMarker} -->`,
            }}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-stage-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-stage-2xs text-stage-fg-subtle">
            {footer.copyright}
          </p>
          <p className="text-stage-2xs text-stage-fg-subtle">
            {footer.filingTitle}：{footer.filingNote}{" "}
            <a
              href={footer.filingLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors duration-stage-base hover:text-stage-fg"
            >
              {footer.filingLink.label}
              <span className="sr-only">（在新窗口打开）</span>
            </a>
          </p>
        </div>
      </Container>

      {/* Oversized wordmark closing the page (spec §二.9). Clipped, never
          scrollable: the wrapper hides any overflow at narrow widths. */}
      <div aria-hidden="true" className="overflow-hidden">
        <p className="select-none whitespace-nowrap text-center text-[19vw] font-bold leading-[0.82] tracking-[0.06em] text-stage-fg">
          {footer.wordmark}
        </p>
      </div>
    </footer>
  );
}
