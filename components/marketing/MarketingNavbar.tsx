import Link from "next/link";
import { nav } from "@/content/landing";
import { MarketingMobileMenu } from "./MarketingMobileMenu";

/**
 * Marketing top bar (doc 03 §1). Server component; only the mobile menu is
 * interactive/client. Sticky with a translucent blurred surface and a subtle
 * hairline.
 */
export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stage-border bg-stage-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-stage items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="text-h3 font-bold tracking-tight text-stage-fg"
          aria-label="STAGE 首页"
        >
          STAGE
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="主导航"
        >
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-stage-sm px-3 py-2 text-body text-stage-fg-muted transition hover:text-stage-fg"
            >
              {link.label}
              {link.soon ? (
                <span className="rounded-full bg-stage-blue-100 px-1.5 py-0.5 text-caption font-medium text-stage-blue-600">
                  即将上线
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={nav.login.href}
            className="rounded-stage-md px-4 py-2 text-body font-medium text-stage-fg transition hover:bg-stage-blue-50"
          >
            {nav.login.label}
          </Link>
          <Link
            href={nav.cta.href}
            className="rounded-stage-md bg-stage-primary px-4 py-2 text-body font-medium text-stage-fg-on-dark transition hover:bg-stage-primary-hover"
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
