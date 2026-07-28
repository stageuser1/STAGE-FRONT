import { labCardMock as d } from "@/content/landing";

/**
 * 首屏小卡 — the IELTS Lab card being summoned from the school page
 * (spec §四.2), resolved to the **neutral opening state**: no "已导入自 …"
 * line, because no target-import feature exists (Plan §2.1 / spec §六.1).
 *
 * Light surface, overlapping the main mock. No score, Band, progress-assessment
 * or AI element (spec §五.1). Decorative, aria-hidden.
 */
export function LabOpeningCard() {
  return (
    <div>
      <span className="sr-only">{d.ariaLabel}</span>
      <div
        aria-hidden="true"
        className="rounded-stage-lg border border-stage-border bg-stage-bg p-4 shadow-stage-md"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-stage-xs font-semibold text-stage-fg">
            {d.title}
          </span>
          <span className="shrink-0 text-stage-2xs text-stage-fg-subtle">
            {d.status}
          </span>
        </div>
        <p className="mt-3 text-stage-sm font-medium text-stage-fg">{d.goal}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {d.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-stage-pill bg-stage-primary-soft px-2 py-0.5 text-stage-2xs text-stage-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
