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

/**
 * Public verification vocabulary for school-level surfaces:
 * 已核验 / 已发布 (green) · 待核验 (amber) · 需更新 (red). The workflow
 * "draft" bucket is produced by needs_update/outdated review statuses,
 * so it surfaces as 需更新 instead of the internal word 草稿.
 */
const verificationDisplay: Record<
  WorkflowStatus,
  { label: string; className: string }
> = {
  draft: { label: "需更新", className: "bg-red-50 text-red-600" },
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

export function VerificationBadge({
  status,
  className = "",
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  const display = verificationDisplay[status];
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${display.className} ${className}`}
    >
      {display.label}
    </span>
  );
}

/**
 * Violet dashed badge reserved exclusively for development fixtures —
 * demo content must be unmistakable from real data at a glance.
 */
export function PlaceholderBadge({ label = "演示内容" }: { label?: string }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center rounded-full border border-dashed border-violet-300 bg-violet-50 px-2.5 text-xs font-medium text-violet-700">
      {label}
    </span>
  );
}

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
