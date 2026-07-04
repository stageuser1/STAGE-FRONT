import type { Deadline } from "@/data/types";

interface DeadlineBadgeProps {
  deadline?: Deadline | string | null;
}

function getDateValue(deadline?: Deadline | string | null): string | null {
  if (!deadline) {
    return null;
  }

  if (typeof deadline === "string") {
    return deadline;
  }

  return (
    deadline.application_deadline ??
    deadline.prescreening_deadline ??
    deadline.audition_date
  );
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const value = getDateValue(deadline);

  if (!value) {
    return (
      <span className="inline-flex shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
        日期待确认
      </span>
    );
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return (
      <span className="inline-flex shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
        日期待确认
      </span>
    );
  }

  const now = new Date();
  const daysUntil = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const tone =
    daysUntil < 0
      ? "border-red-200 bg-red-50 text-red-600"
      : daysUntil <= 60
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}
