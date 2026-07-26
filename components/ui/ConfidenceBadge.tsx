import type { ConfidenceLevel, WorkflowStatus } from "@/data/types";
import { formatDateZh } from "@/lib/format";
import { surfaceTokens, type Surface } from "@/lib/ui/surface";

/**
 * Data honesty, rendered inline (C-19).
 *
 * Freshness is a first-class citizen: if a fact renders, when it was last
 * verified renders with it. A value older than the staleness window is FLAGGED
 * rather than hidden — an admitted gap is the point of the product.
 *
 * `confidence` is optional and currently unused by callers: `DataQuality`
 * marks the raw confidence level reviewer-only, and whether to expose it
 * publicly is open question OQ-1. Until that is answered the badge renders
 * workflow status plus the date, which are already public.
 */
const STALE_AFTER_DAYS = 180;

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: "需更新",
  extracted_awaiting_review: "待核验",
  human_reviewed: "已核验",
  published: "已核验",
};

const STATUS_TONE: Record<WorkflowStatus, string> = {
  draft: "text-amber-700",
  extracted_awaiting_review: "text-amber-700",
  human_reviewed: "text-emerald-700",
  published: "text-emerald-700",
};

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "高可信",
  medium: "中等可信",
  low: "低可信",
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export function ConfidenceBadge({
  status,
  lastCheckedAt,
  confidence,
  missingCount,
  surface = "explore",
  source,
  className = "",
}: {
  status: WorkflowStatus;
  lastCheckedAt: string | null;
  confidence?: ConfidenceLevel | null;
  missingCount?: number;
  surface?: Surface;
  source?: { title: string; url: string };
  className?: string;
}) {
  const t = surfaceTokens[surface];
  const age = daysSince(lastCheckedAt);
  const stale = age !== null && age > STALE_AFTER_DAYS;
  const formatted = formatDateZh(lastCheckedAt);

  const sentence = [
    STATUS_LABELS[status],
    formatted ? `核验于 ${formatted}` : "暂未收录核验日期",
    stale ? "可能已更新" : null,
    missingCount && missingCount > 0 ? `${missingCount} 项待补充` : null,
    source ? `来源：${source.title}` : null,
  ]
    .filter(Boolean)
    .join("，");

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 text-xs ${t.muted} ${className}`}
      title={sentence}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          formatted
            ? status === "human_reviewed" || status === "published"
              ? "bg-emerald-500"
              : "bg-amber-500"
            : "border border-current"
        }`}
      />
      <span className={STATUS_TONE[status]}>{STATUS_LABELS[status]}</span>
      {confidence ? <span>· {CONFIDENCE_LABELS[confidence]}</span> : null}
      <span>· {formatted ? `核验于 ${formatted}` : "核验日期暂未收录"}</span>
      {stale ? <span className="text-amber-700">（可能已更新）</span> : null}
      {missingCount && missingCount > 0 ? (
        <span>· {missingCount} 项待补充</span>
      ) : null}
      <span className="sr-only">{sentence}</span>
    </span>
  );
}
