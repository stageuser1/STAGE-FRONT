import Link from "next/link";
import { Icon } from "./ui/Icon";
import { ReviewerHeaderLink } from "./ReviewerHeaderLink";

interface MobileHeaderProps {
  subtitle?: string;
  backHref?: string;
  /** Show the notification bell on the right (homepage top bar). */
  showNotifications?: boolean;
}

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/search", label: "搜索" },
];

/**
 * App top bar. Mobile: wordmark (or back chevron + wordmark).
 * ≥768px it gains inline navigation links and the reviewer entry.
 */
export function MobileHeader({
  subtitle,
  backHref,
  showNotifications = false,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-md items-center gap-3 px-4 py-2 md:max-w-3xl md:px-6 lg:max-w-5xl">
        {backHref ? (
          <Link
            aria-label="返回"
            className="flex h-11 w-11 -ml-2 shrink-0 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-brand-600"
            href={backHref}
          >
            <Icon name="chevron-left" size={22} />
          </Link>
        ) : null}
        <Link className="min-w-0 py-1" href="/">
          <p className="text-[22px] font-extrabold leading-6 tracking-tight text-brand-600">
            STAGE
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs leading-4 text-ink-500">
              {subtitle}
            </p>
          ) : null}
        </Link>

        <nav
          aria-label="主导航"
          className="ml-6 hidden items-center gap-1 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-600"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="hidden md:block">
            <ReviewerHeaderLink />
          </div>
          {showNotifications ? (
            <button
              aria-label="通知"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-brand-600"
              type="button"
            >
              <Icon name="bell" size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Shared page shell so every route uses the same responsive column. */
export function PageShell({
  children,
  className = "",
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  /** "wide" for index pages, "reading" for detail pages. */
  width?: "wide" | "reading";
}) {
  const widthClasses =
    width === "reading"
      ? "max-w-md md:max-w-2xl lg:max-w-3xl"
      : "max-w-md md:max-w-3xl lg:max-w-5xl";
  return (
    <main
      className={`mx-auto min-h-screen w-full px-4 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6 ${widthClasses} ${className}`}
    >
      {children}
    </main>
  );
}
