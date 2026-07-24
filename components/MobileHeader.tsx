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
  { href: "/schools", label: "首页" },
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
    <header className="relative z-10 bg-white">
      <div className="mx-auto flex h-[94px] w-full max-w-[402px] items-center gap-3 px-6 pt-1 md:max-w-3xl md:px-6 lg:max-w-5xl">
        {backHref ? (
          <Link
            aria-label="返回"
            className="flex h-11 w-11 -ml-2 shrink-0 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-brand-600"
            href={backHref}
          >
            <Icon name="chevron-left" size={22} />
          </Link>
        ) : null}
        <Link className="min-w-0 translate-y-2 py-1" href="/schools">
          <p className="text-[24px] font-extrabold leading-7 tracking-[-0.035em] text-brand-600">
            STAGE
          </p>
          {subtitle ? (
            <p className="mt-2 truncate text-sm leading-5 tracking-[0.04em] text-ink-500">
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
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#171717] transition hover:bg-ink-100 hover:text-brand-600"
              type="button"
            >
              <Icon name="bell" size={28} />
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
      ? "max-w-[402px] md:max-w-2xl lg:max-w-3xl"
      : "max-w-[402px] md:max-w-3xl lg:max-w-5xl";
  return (
    <main
      className={`mx-auto min-h-screen w-full px-4 pb-24 pt-[5px] md:px-6 md:pb-10 md:pt-6 ${widthClasses} ${className}`}
    >
      {children}
    </main>
  );
}
