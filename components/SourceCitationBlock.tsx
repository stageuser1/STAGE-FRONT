import type { DataQuality, SourceRecord } from "@/data/types";
import { Icon } from "./ui/Icon";
import { MissingDataNote } from "./MissingDataNote";

interface SourceCitationBlockProps {
  sources: SourceRecord[];
  dataQuality?: DataQuality;
}

const confidenceLabel = {
  high: "高可信",
  medium: "中等可信",
  low: "低可信",
};

export function SourceCitationBlock({
  sources,
  dataQuality,
}: SourceCitationBlockProps) {
  return (
    <details className="group rounded-xl border border-line bg-white shadow-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4 md:p-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[15px] font-semibold leading-6 text-ink-900">
            来源与核验
          </span>
          <span className="text-xs leading-4 text-ink-400">
            Sources · {sources.length} 条
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {dataQuality ? (
            <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-brand-50 px-2.5 text-xs font-medium text-brand-700">
              {confidenceLabel[dataQuality.confidence]}
            </span>
          ) : null}
          <Icon
            className="text-ink-400 transition-transform group-open:rotate-180"
            name="chevron-down"
            size={16}
          />
        </span>
      </summary>
      <div className="border-t border-line-subtle px-4 pb-4 md:px-5">
      {sources.length > 0 ? (
        <div className="mt-3 space-y-2">
          {sources.map((source, index) => (
            <div
              className="rounded-lg bg-ink-50 px-3.5 py-3"
              key={`${source.url}-${index}`}
            >
              <a
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
                <Icon name="external" size={14} />
              </a>
              <p className="mt-1 text-xs text-ink-400">
                访问日期 {source.accessed_at}
              </p>
              {source.notes ? (
                <blockquote className="mt-1.5 border-l-2 border-ink-300 pl-2.5 text-xs leading-5 text-ink-500">
                  {source.notes}
                </blockquote>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <MissingDataNote label="来源记录暂未收录" />
        </div>
      )}

      {dataQuality?.status === "extracted_awaiting_review" ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-700">
          <Icon name="alert" size={14} />
          本条记录由 AI 提取，尚待人工核验
        </p>
      ) : null}
      {dataQuality?.review_notes ? (
        <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-500">
          {dataQuality.review_notes}
        </p>
      ) : null}
      </div>
    </details>
  );
}
