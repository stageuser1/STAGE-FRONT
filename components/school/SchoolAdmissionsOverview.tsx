import type { SourceRecord } from "@/data/types";
import { SectionCard } from "@/components/ui/SectionCard";
import { Icon } from "@/components/ui/Icon";

/**
 * School-level admissions overview built from school-wide source
 * records (deadline calendars, fee policy, language policy…).
 * Renders nothing when the school has no school-level sources —
 * empty sections never produce blank cards.
 */
export function SchoolAdmissionsOverview({
  sources,
}: {
  sources: SourceRecord[];
}) {
  if (sources.length === 0) return null;

  return (
    <SectionCard
      icon="document"
      subtitle="School-wide Admissions Policies"
      title="学校招生要点"
    >
      <div className="space-y-1">
        {sources.map((source, index) => (
          <details
            className="group rounded-lg transition hover:bg-ink-50"
            key={`${source.url}-${index}`}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-2 py-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 text-sm font-medium leading-5 text-ink-900">
                {source.title}
              </span>
              <Icon
                className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                name="chevron-down"
                size={16}
              />
            </summary>
            <div className="px-2 pb-3">
              {source.notes ? (
                <blockquote className="border-l-2 border-brand-300 pl-3 text-sm leading-6 text-ink-700">
                  {source.notes}
                </blockquote>
              ) : null}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                <a
                  className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-2 hover:underline"
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  查看官方页面
                  <Icon name="external" size={12} />
                </a>
                <span>访问日期 {source.accessed_at}</span>
              </p>
            </div>
          </details>
        ))}
      </div>
    </SectionCard>
  );
}
