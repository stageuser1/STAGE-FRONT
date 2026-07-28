import { Icon } from "@/components/ui/Icon";
import { schoolMock as d } from "@/content/landing";

/**
 * 首屏主图 — the school detail page in a dark browser frame (spec §四.1).
 *
 * A hand-built mock, not a screenshot: static markup, no logic, no data
 * fetching. The frame chrome is dark as the spec asks; the page inside it is
 * the light, hairline-ruled surface the real school page actually is (T0).
 * Every row has a real counterpart on that page — deadline, prescreen,
 * language requirement, verification badge, source citation — so the mock
 * claims nothing that does not exist (spec §五.3). No score, Band or
 * assessment element appears anywhere (spec §五.1).
 *
 * Decorative: marked aria-hidden, with an sr-only sibling label.
 */
export function SchoolDetailMock() {
  return (
    <div>
      <span className="sr-only">{d.ariaLabel}</span>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-stage-lg border border-stage-border bg-stage-bg"
      >
        {/* dark browser frame */}
        <div className="flex items-center gap-2 bg-stage-surface-dark px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-stage-pill bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-stage-pill bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-stage-pill bg-white/15" />
          <span className="mx-auto truncate rounded-stage-pill bg-white/10 px-3 py-1 font-stage-mono text-stage-2xs text-stage-fg-on-dark-muted">
            {d.url}
          </span>
        </div>

        {/* the page */}
        <div className="p-5 sm:p-7">
          <h3 className="text-stage-h4 font-semibold text-stage-fg sm:text-stage-h3">
            {d.school.name}
          </h3>
          <p className="mt-1 text-stage-xs text-stage-fg-muted">
            {d.school.nameZh} · {d.school.location}
          </p>

          <div className="mt-5 rounded-stage-lg border border-stage-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-stage-sm font-semibold text-stage-fg">
                {d.card.title}
              </p>
              <span className="inline-flex items-center gap-1 rounded-stage-pill border border-stage-green-100 bg-stage-green-50 px-2.5 py-0.5 text-stage-2xs font-medium text-stage-green-700">
                <Icon name="check" size={12} />
                {d.card.verified}
              </span>
            </div>

            <dl className="mt-4 divide-y divide-stage-border border-y border-stage-border">
              {d.card.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <dt className="shrink-0 text-stage-2xs text-stage-fg-subtle">
                    {row.label}
                  </dt>
                  <dd className="text-right text-stage-xs text-stage-fg-body">
                    {row.value}
                  </dd>
                </div>
              ))}

              {/* language row — highlighted, carries the deep link */}
              <div className="-mx-2 rounded-stage-sm bg-stage-primary-soft px-2 py-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-stage-2xs text-stage-fg-subtle">
                    {d.card.languageRow.label}
                  </dt>
                  <dd className="text-right text-stage-xs font-medium text-stage-fg">
                    {d.card.languageRow.value}
                  </dd>
                </div>
                <div className="relative mt-1.5">
                  <span className="text-stage-2xs font-medium text-stage-primary">
                    {d.card.languageRow.deepLink}
                  </span>
                  {/* 进行时元素：光标悬停于深链之上 */}
                  <CursorGlyph />
                </div>
              </div>
            </dl>

            <p className="mt-4 flex items-center gap-1.5 text-stage-2xs text-stage-fg-subtle">
              {d.source}
              <Icon name="external" size={12} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The hovering pointer that makes the mock read as in-progress (spec §四.1). */
function CursorGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="15"
      height="15"
      className="absolute left-[7.5rem] top-2.5 drop-shadow-sm"
      aria-hidden="true"
    >
      <path
        d="M2 1.5 13 8.2l-4.6.9L6.6 13.5z"
        fill="var(--stage-neutral-0)"
        stroke="var(--stage-blue-950)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
