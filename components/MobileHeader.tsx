import Link from "next/link";
import { Icon } from "./ui/Icon";

interface MobileHeaderProps {
  subtitle?: string;
  backHref?: string;
}

/** App top bar — mobile-first, widens with the page shell on desktop. */
export function MobileHeader({ subtitle, backHref }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-12 w-full max-w-md items-center gap-3 px-4 py-2 md:max-w-3xl md:px-6 lg:max-w-5xl">
        {backHref ? (
          <Link
            aria-label="返回"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-brand-600"
            href={backHref}
          >
            <Icon name="chevron-left" size={20} />
          </Link>
        ) : null}
        <Link className="min-w-0 py-1" href="/">
          <p className="text-lg font-bold leading-tight text-brand-600">
            STAGE
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs leading-4 text-ink-500">
              {subtitle}
            </p>
          ) : null}
        </Link>
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
      className={`mx-auto min-h-screen w-full px-4 py-4 md:px-6 md:py-6 ${widthClasses} ${className}`}
    >
      {children}
    </main>
  );
}
