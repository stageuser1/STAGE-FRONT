import type { ReactNode } from "react";

/**
 * Scalar label/value row (info-row spec: 48px height, 1px #F1F5F9 divider).
 *
 * Hard rule: `value` must be short scalar content — a date, a number, a
 * badge, a short phrase. Sentence-length or multi-line content belongs in
 * a ProseBlock, never here.
 */
export function FactRow({
  label,
  value,
  missingLabel = "暂未收录",
}: {
  label: string;
  value: ReactNode;
  missingLabel?: string;
}) {
  const isMissing = value === null || value === undefined || value === "";
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-line-subtle py-2 last:border-b-0">
      <span className="shrink-0 text-sm text-ink-700">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-ink-900 [overflow-wrap:anywhere]">
        {isMissing ? (
          <span className="font-normal text-ink-400">{missingLabel}</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

/** Grid of short key facts for page headers (2-up mobile, 4-up desktop). */
export function KeyFact({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string | null;
}) {
  const isMissing = value === null || value === undefined || value === "";
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2.5">
      <p className="text-xs leading-4 text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink-900">
        {isMissing ? (
          <span className="font-normal text-ink-400">暂未收录</span>
        ) : (
          value
        )}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] leading-4 text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
