import type { ReviewStatus } from "@/data/types";

const statusDisplay: Record<
  string,
  { label: string; className: string }
> = {
  ai_generated: { label: "AI", className: "bg-gray-100 text-gray-700" },
  extracted: { label: "AI", className: "bg-gray-100 text-gray-700" },
  "needs review": { label: "AI", className: "bg-gray-100 text-gray-700" },
  human_checked: {
    label: "Verified",
    className: "bg-emerald-50 text-emerald-700",
  },
  verified: {
    label: "Verified",
    className: "bg-emerald-50 text-emerald-700",
  },
  human_edited: {
    label: "Edited",
    className: "bg-blue-50 text-blue-700",
  },
  needs_update: {
    label: "Needs Update",
    className: "bg-amber-50 text-amber-700",
  },
  outdated: {
    label: "Needs Update",
    className: "bg-amber-50 text-amber-700",
  },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus | null }) {
  const display =
    statusDisplay[status?.trim().toLowerCase() ?? ""] ??
    statusDisplay.ai_generated;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${display.className}`}
    >
      {display.label}
    </span>
  );
}
