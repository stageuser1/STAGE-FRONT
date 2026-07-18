import type { SourceRecord } from "@/data/types";
import { Icon } from "./Icon";

/**
 * Inline evidence viewer: collapsed by default, expands to show the
 * source quote, URL and retrieved date next to the content it supports.
 * Native <details> so it works without client JS in public mode.
 */
export function EvidenceAccordion({
  sources,
  title = "查看来源与证据",
}: {
  sources: SourceRecord[];
  title?: string;
}) {
  if (sources.length === 0) return null;
  return (
    <details className="group rounded-lg border border-line-subtle bg-ink-50">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-ink-700 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <Icon className="text-ink-400" name="document" size={16} />
          {title}（{sources.length}）
        </span>
        <Icon
          className="text-ink-400 transition-transform group-open:rotate-180"
          name="chevron-down"
          size={16}
        />
      </summary>
      <div className="space-y-2 border-t border-line-subtle px-3 py-2.5">
        {sources.map((source, index) => (
          <div className="text-sm" key={`${source.url}-${index}`}>
            <a
              className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-2 hover:underline"
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {source.title}
              <Icon name="external" size={14} />
            </a>
            <p className="mt-0.5 text-xs text-ink-400">
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
    </details>
  );
}
