import { appPreview } from "@/content/landing";
import { Icon } from "@/components/ui/Icon";

/**
 * Light-surface product mock card (doc 03 §4/§6) for the Explore and Dashboard
 * feature sections. Decorative, static, aria-hidden. Token-pure.
 */
export function AppPreviewCard({ variant }: { variant: "explore" | "dashboard" }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-stage-lg border border-stage-border bg-stage-bg p-5 shadow-stage-md"
    >
      {variant === "explore" ? <ExploreMock /> : <DashboardMock />}
    </div>
  );
}

function ExploreMock() {
  const { searchPlaceholder, results } = appPreview.explore;
  return (
    <div>
      <div className="flex items-center gap-2 rounded-stage-md border border-stage-border bg-stage-bg-soft px-3 py-2.5">
        <Icon name="search" size={18} className="text-stage-fg-muted" />
        <span className="text-body text-stage-fg-muted">{searchPlaceholder}</span>
      </div>
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li
            key={r.name}
            className="flex items-center justify-between gap-3 rounded-stage-md border border-stage-border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-body font-medium text-stage-fg">
                {r.name}
              </p>
              <p className="mt-0.5 text-caption tracking-normal text-stage-fg-muted">
                {r.meta}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stage-blue-50 px-2.5 py-1 text-caption tracking-normal text-stage-success">
              <Icon name="check" size={14} />
              {r.verified}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardMock() {
  const { tiles, chartLabel } = appPreview.dashboard;
  return (
    <div className="flex gap-4">
      <div className="hidden shrink-0 flex-col gap-2 sm:flex">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-8 w-8 rounded-stage-sm ${
              i === 0 ? "bg-stage-blue-500" : "bg-stage-blue-50"
            }`}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-medium uppercase text-stage-fg-muted">
          {chartLabel}
        </p>
        <div className="mt-2 rounded-stage-md border border-stage-border p-3">
          <svg
            viewBox="0 0 240 80"
            className="h-20 w-full"
            fill="none"
            preserveAspectRatio="none"
          >
            <polyline
              points="0,64 40,52 80,58 120,36 160,40 200,20 240,12"
              stroke="var(--stage-blue-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-stage-md border border-stage-border px-3 py-2.5"
            >
              <p className="font-stage-mono text-h3-sm font-bold text-stage-fg">
                {t.value}
              </p>
              <p className="mt-0.5 text-caption tracking-normal text-stage-fg-muted">
                {t.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
