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
    <section className="rounded-xl border border-line bg-white p-4 shadow-card md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">
            来源与核验{" "}
            <span className="text-xs font-normal text-ink-400">Sources</span>
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            本条记录的官方信息来源
          </p>
        </div>
        {dataQuality ? (
          <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-brand-50 px-2.5 text-xs font-medium text-brand-700">
            {confidenceLabel[dataQuality.confidence]}
          </span>
        ) : null}
      </div>

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
    </section>
  );
}
