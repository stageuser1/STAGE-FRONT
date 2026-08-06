import type { ProgramV3 } from "@/data/v3/types";
import {
  formatYearMonthZh,
  latestRetrievedDate,
  sourceDomain,
} from "@/lib/program-v3/format";

/**
 * T4 §2.4 "每页可见引用块": 来源域名 + 核实月份, rendered next to
 * `answer_sentence_zh` (same block, not a new one — see ProgramCardV3 /
 * ProgramDetailV3 for placement). Plain visible text, no CSS truncation or
 * hiding — this line exists specifically so a human or an AI crawler reading
 * the rendered DOM can attribute the sentence above it.
 *
 * `FreshnessBar` used to render this same "来源:xxx · 核实于 xxx" string
 * itself, but only when `freshness_flag.status === "unknown"` (i.e. never
 * for the common case). Centralizing it here means every page gets the
 * citation regardless of freshness state, and FreshnessBar's own fallback
 * branch was removed so the two components don't ever print the same line
 * twice on one page.
 */
export function CitationLine({
  program,
  className = "",
}: {
  program: ProgramV3;
  className?: string;
}) {
  const domain = program.sources[0]
    ? sourceDomain(program.sources[0].source_url)
    : null;
  const verifiedMonth = formatYearMonthZh(
    program.publishing.freshness_flag.last_verified ?? latestRetrievedDate(program),
  );
  if (!domain && !verifiedMonth) return null;

  return (
    <p className={`text-xs text-ink-400 ${className}`}>
      {domain ? `来源:${domain}` : null}
      {domain && verifiedMonth ? " · " : null}
      {verifiedMonth ? `核实于 ${verifiedMonth}` : null}
    </p>
  );
}
