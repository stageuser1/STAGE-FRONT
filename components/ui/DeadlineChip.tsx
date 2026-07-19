import { daysUntil, formatDateZh } from "@/lib/format";

interface DeadlineChipProps {
  /** Required label: 申请截止 / 预筛选截止 / 试音日期… never unlabeled. */
  label: string;
  date: string | null | undefined;
  className?: string;
}

/**
 * Labeled deadline chip. Each chip shows exactly one kind of deadline —
 * an application deadline is never silently substituted with a
 * prescreening deadline.
 */
export function DeadlineChip({ label, date, className = "" }: DeadlineChipProps) {
  const formatted = formatDateZh(date);
  if (!formatted) {
    return (
      <span
        className={`inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2.5 text-xs font-medium text-ink-500 ${className}`}
      >
        {label} · 日期待确认
      </span>
    );
  }

  // Urgency semantics: red only for imminent deadlines (<30 days);
  // past dates are muted — an expired deadline is history, not an alarm.
  const days = daysUntil(date);
  const tone =
    days !== null && days < 0
      ? "bg-ink-100 text-ink-500"
      : days !== null && days < 30
        ? "bg-red-50 text-red-600"
        : days !== null && days <= 60
          ? "bg-amber-50 text-amber-700"
          : "bg-brand-50 text-brand-700";

  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${tone} ${className}`}
    >
      {label} {formatted}
      {days !== null && days < 0 ? "（已过）" : null}
    </span>
  );
}
