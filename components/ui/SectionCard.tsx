import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: IconName;
  /** Rendered at the right edge of the header (status badge, chip…). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Standard content card: 12px radius, subtle border + card shadow,
 * zh title with optional en subtitle. The single card primitive for
 * every section on school and program pages.
 */
export function SectionCard({
  title,
  subtitle,
  icon,
  aside,
  children,
  className = "",
  id,
}: SectionCardProps) {
  return (
    <section
      className={`scroll-mt-20 rounded-xl border border-line bg-white p-4 shadow-card md:p-5 ${className}`}
      id={id}
    >
      {title ? (
        <div className="mb-3 flex items-start justify-between gap-3 md:mb-4">
          <div className="flex min-w-0 items-center gap-2">
            {icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name={icon} size={16} />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-6 text-ink-900">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-xs leading-4 text-ink-400">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
