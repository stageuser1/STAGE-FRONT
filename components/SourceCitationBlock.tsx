import type { DataQuality, SourceRecord } from "@/data/types";
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
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            官方来源 Official Source
          </h2>
          <p className="mt-1 text-sm text-gray-600">用于核验本条记录的信息来源</p>
        </div>
        {dataQuality ? (
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {confidenceLabel[dataQuality.confidence]}
          </span>
        ) : null}
      </div>

      {sources.length > 0 ? (
        <div className="mt-4 space-y-3">
          {sources.map((source) => (
            <div
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              key={`${source.title}-${source.url}`}
            >
              <a
                className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
              <div className="mt-2 grid gap-1 text-xs leading-5 text-gray-600">
                <p>访问日期: {source.accessed_at}</p>
                <p>来源类型: {source.source_type.replaceAll("_", " ")}</p>
                <p>{source.notes ?? <MissingDataNote className="text-xs" />}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <MissingDataNote />
        </div>
      )}

      {dataQuality?.status === "extracted_awaiting_review" ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
          需要人工核验
        </p>
      ) : null}
    </section>
  );
}
