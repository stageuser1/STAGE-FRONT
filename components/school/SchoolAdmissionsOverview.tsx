import type { SourceRecord } from "@/data/types";
import { buildSchoolAdmissionsTopics } from "@/lib/school-detail";
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
  const topics = buildSchoolAdmissionsTopics(sources);

  return (
    <SectionCard
      icon="document"
      subtitle="School-wide Admissions Policies"
      title="学校招生要点"
      id="school-admissions-policies"
    >
      <div className="space-y-1">
        {topics.map((topic) => (
          <details
            className="group rounded-lg transition hover:bg-ink-50"
            key={topic.key}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-2 py-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-5 text-ink-900">
                  {topic.title}
                </span>
                <span className="block text-xs leading-4 text-ink-400">
                  {topic.titleEn}
                </span>
              </span>
              <Icon
                className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                name="chevron-down"
                size={16}
              />
            </summary>
            <div className="space-y-3 px-2 pb-3">
              {[...new Set(topic.sources.map((source) => source.url))].map((url) => {
                const pageSources = topic.sources.filter(
                  (source) => source.url === url,
                );
                const quotes = pageSources
                  .map((source) => source.notes)
                  .filter((quote): quote is string => Boolean(quote));
                return (
                  <div className="border-l-2 border-brand-200 pl-3" key={url}>
                    <p className="text-sm font-medium leading-6 text-ink-800">
                      {pageSources[0].title}
                    </p>
                    {quotes.map((quote, index) => (
                      <blockquote
                        className="mt-1 text-sm leading-6 text-ink-700"
                        key={`${url}-${index}`}
                      >
                        {quote}
                      </blockquote>
                    ))}
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                      <a
                        className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-2 hover:underline"
                        href={url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        查看官方页面
                        <Icon name="external" size={12} />
                      </a>
                      <span>
                        访问日期{" "}
                        {pageSources
                          .map((source) => source.accessed_at)
                          .sort()
                          .at(-1)}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </SectionCard>
  );
}
