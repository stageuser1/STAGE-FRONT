import Link from "next/link";

interface MobileHeaderProps {
  subtitle?: string;
  backHref?: string;
}

export function MobileHeader({ subtitle, backHref }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-14 w-full max-w-md items-center gap-3 px-4 py-2.5">
        {backHref ? (
          <Link
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-base font-semibold text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
            href={backHref}
          >
            &lt;
          </Link>
        ) : null}
        <Link className="min-w-0 py-1" href="/">
          <p className="text-lg font-bold leading-tight tracking-normal text-blue-900">
            STAGE
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs leading-4 text-gray-600">
              {subtitle}
            </p>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
