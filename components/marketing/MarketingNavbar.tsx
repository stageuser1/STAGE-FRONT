import Link from "next/link";
import { nav } from "@/content/landing";
import { MarketingMobileMenu } from "./MarketingMobileMenu";

/**
 * Marketing top bar (homepage-spec §二.1): STAGE wordmark left, the four
 * section links right, one solid CTA at the far right.
 *
 * Ruling C7: the CTA reads 「探索音乐院校」 and goes to the school catalog. It
 * is not a signup affordance, and there is no login entry here — 联系我们 lives
 * in the footer. Server component; only the mobile menu is interactive.
 */
export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stage-border bg-stage-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-stage items-center justify-between gap-4 px-6 md:px-8">
        <Link
          href="/"
          className="shrink-0 text-h3-sm font-bold tracking-stage-wordmark text-stage-fg"
          aria-label="STAGE 首页"
        >
          {nav.brand}
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <nav className="flex items-center gap-1" aria-label="主导航">
            {nav.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-stage-sm px-3 py-2 text-stage-sm text-stage-fg-muted transition-colors duration-stage-base hover:text-stage-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={nav.cta.href}
            className="ml-4 rounded-stage-sm bg-stage-primary px-4 py-2 text-stage-sm font-medium text-stage-fg-on-dark transition-colors duration-stage-base hover:bg-stage-primary-hover"
          >
            {nav.cta.label}
          </Link>
        </div>

        <div className="lg:hidden">
          <MarketingMobileMenu />
        </div>
      </div>
    </header>
  );
}
