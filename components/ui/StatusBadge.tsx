import type { ReviewStatus, WorkflowStatus } from "@/data/types";

/**
 * One status vocabulary for the whole product:
 * 已核验 (verified) · 待核验 (awaiting review) · 需更新 (needs update) ·
 * 已编辑 (human edited) · 草稿 (draft).
 */
const workflowDisplay: Record<
  WorkflowStatus,
  { label: string; className: string }
> = {
  draft: { label: "草稿", className: "bg-ink-100 text-ink-500" },
  extracted_awaiting_review: {
    label: "待核验",
    className: "bg-amber-50 text-amber-700",
  },
  human_reviewed: {
    label: "已核验",
    className: "bg-emerald-50 text-emerald-700",
  },
  published: { label: "已发布", className: "bg-emerald-50 text-emerald-700" },
};

export function WorkflowStatusBadge({
  status,
  className = "",
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  const display = workflowDisplay[status];
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${display.className} ${className}`}
    >
      {display.label}
    </span>
  );
}

const reviewDisplay: Record<string, { label: string; className: string }> = {
  ai_generated: { label: "AI 提取", className: "bg-ink-100 text-ink-500" },
  extracted: { label: "AI 提取", className: "bg-ink-100 text-ink-500" },
  "needs review": { label: "AI 提取", className: "bg-ink-100 text-ink-500" },
  human_checked: { label: "已核验", className: "bg-emerald-50 text-emerald-700" },
  verified: { label: "已核验", className: "bg-emerald-50 text-emerald-700" },
  human_edited: { label: "已编辑", className: "bg-brand-50 text-brand-700" },
  needs_update: { label: "需更新", className: "bg-amber-50 text-amber-700" },
  outdated: { label: "需更新", className: "bg-amber-50 text-amber-700" },
};

export function ReviewStatusBadge({
  status,
}: {
  status: ReviewStatus | null;
}) {
  const display =
    reviewDisplay[status?.trim().toLowerCase() ?? ""] ??
    reviewDisplay.ai_generated;
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${display.className}`}
    >
      {display.label}
    </span>
  );
}
