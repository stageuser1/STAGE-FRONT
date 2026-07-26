import { REASON_LABELS, type ReasonKind } from "@/lib/search";
import { surfaceTokens, type Surface } from "@/lib/ui/surface";

/**
 * Why a result matched (C-08).
 *
 * Search that cannot explain itself is indistinguishable from search that is
 * broken. Every ranked result carries at least one of these.
 */
export function MatchReasonTag({
  kind,
  label,
  matched,
  surface = "explore",
}: {
  kind: ReasonKind;
  label?: string;
  /** The field and value that matched; surfaced to AT, not hover-only. */
  matched?: { field: string; value: string };
  surface?: Surface;
}) {
  const t = surfaceTokens[surface];
  const text = label ?? REASON_LABELS[kind];
  const detail = matched ? `${text}：${matched.value}` : text;

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium ${t.neutral}`}
      title={detail}
    >
      {text}
      {/* The tooltip's content is also available to screen readers and to
          anyone who cannot hover. */}
      <span className="sr-only">：{matched?.value ?? ""}</span>
    </span>
  );
}
