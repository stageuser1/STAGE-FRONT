import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Collapsed-by-default disclosure bar for second-tier decision detail
 * (repertoire, cost breakdown, eligibility…). The summary row is the
 * only thing visible while scanning; opening it reveals the existing
 * cards unchanged, so reviewer editing keeps working inside.
 */
export function ExpandableSection({
  title,
  subtitle,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Short scannable preview shown on the closed bar (e.g. "USD 53,300 /年"). */
  hint?: string | null;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-card transition hover:border-brand-300 md:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold leading-6 text-ink-900">
            {title}
          </span>
          {subtitle ? (
            <span className="text-xs leading-4 text-ink-400">{subtitle}</span>
          ) : null}
          {hint ? (
            <span className="text-xs leading-4 text-ink-500 group-open:hidden">
              {hint}
            </span>
          ) : null}
        </span>
        <Icon
          className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
          name="chevron-down"
          size={16}
        />
      </summary>
      <div className="mt-2 space-y-2 md:space-y-3">{children}</div>
    </details>
  );
}
