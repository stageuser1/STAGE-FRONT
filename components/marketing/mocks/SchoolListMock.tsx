import { Icon } from "@/components/ui/Icon";
import { verification } from "@/content/landing";

/**
 * 验证区块配图 — the school catalog page (spec §四.3): filter rail on the left,
 * school cards on the right, every card carrying its verification date.
 *
 * Hand-built and static. Shows breadth and the verification badge, nothing
 * else — no score, Band or assessment element (spec §五.1). Decorative,
 * aria-hidden.
 */
export function SchoolListMock() {
  const d = verification.mock;
  return (
    <div>
      <span className="sr-only">{d.ariaLabel}</span>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-stage-lg border border-stage-border bg-stage-bg"
      >
        <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[9.5rem_1fr]">
          {/* filter rail */}
          <div className="border-r border-stage-border bg-stage-bg-soft p-3 sm:p-4">
            <p className="text-stage-2xs font-medium tracking-stage-eyebrow text-stage-fg-subtle">
              {d.filtersTitle}
            </p>
            <div className="mt-3 space-y-3">
              {d.filters.map((filter) => (
                <div key={filter.label}>
                  <p className="text-stage-2xs font-medium text-stage-fg-body">
                    {filter.label}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {filter.options.map((option) => (
                      <li
                        key={option}
                        className="flex items-center gap-1.5 text-stage-2xs text-stage-fg-subtle"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-stage-xs border border-stage-border-strong" />
                        <span className="truncate">{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* result cards */}
          <div className="p-3 sm:p-4">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {d.cards.map((card) => (
                <li
                  key={card.name}
                  className="min-w-0 rounded-stage-md border border-stage-border p-3"
                >
                  <p className="truncate text-stage-xs font-medium text-stage-fg">
                    {card.name}
                  </p>
                  <p className="mt-0.5 truncate text-stage-2xs text-stage-fg-subtle">
                    {card.meta}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-stage-pill border border-stage-green-100 bg-stage-green-50 px-2 py-0.5 text-stage-2xs text-stage-green-700">
                    <Icon name="check" size={11} />
                    {card.verified}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
