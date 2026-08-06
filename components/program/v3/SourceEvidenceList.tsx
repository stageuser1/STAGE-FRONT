import type { SourceRecordV3 } from "@/data/v3/types";
import { sourceDomain } from "@/lib/program-v3/format";

/**
 * §2.2 "原文证据(source_quote 可展开)". Each quote is fully in the DOM;
 * `<details>` only toggles visibility, matching the same CSS-fold-not-fetch
 * rule as the card's item 6 (§0.4). Records with no quote are skipped —
 * there is nothing to expand.
 */
export function SourceEvidenceList({ sources }: { sources: SourceRecordV3[] }) {
  const withQuotes = sources.filter((s) => s.source_quote);
  if (withQuotes.length === 0) return null;

  return (
    <section aria-labelledby="source-evidence-heading">
      <h2 className="text-base font-semibold text-ink-900" id="source-evidence-heading">
        原文证据
      </h2>
      <ul className="mt-3 space-y-2">
        {withQuotes.map((source) => (
          <li key={`${source.source_url}-${source.related_field}`}>
            <details className="group rounded-lg border border-line-subtle">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-2 px-3.5 py-2.5 text-sm text-ink-700 marker:content-none">
                {/* Wraps rather than CSS-truncates: the anti-cloaking red
                    line applies to every visible string, not only the
                    important ones (ruling T3-R3.9). */}
                <span className="min-w-0 break-words">
                  {source.related_field} · {sourceDomain(source.source_url)}
                </span>
                <span className="ml-2 shrink-0 text-ink-400 transition group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="border-t border-line-subtle px-3.5 py-3">
                <blockquote className="max-h-[200px] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-ink-600">
                  {source.source_quote}
                </blockquote>
                <p className="mt-2 text-xs text-ink-400">
                  核实于 {source.retrieved_date} ·{" "}
                  <a
                    className="text-brand-600 hover:underline"
                    href={source.source_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看来源
                  </a>
                </p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
