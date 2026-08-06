import { Icon } from "@/components/ui/Icon";
import { CompareToggleButton } from "./CompareToggleButton";
import type { ProgramV3 } from "@/data/v3/types";
import {
  freshnessLabel,
  icsDataUri,
  programOfferingRef,
} from "@/lib/program-v3/format";

const TONE_DOT: Record<"green" | "yellow" | "red", string> = {
  green: "bg-stage-green-500",
  yellow: "bg-stage-amber-600",
  red: "bg-stage-red-600",
};

/**
 * §2.1 item 7: freshness flag, then the .ics / compare actions.
 *
 * `status === "unknown"` renders no flag at all (§3.4) — a flag is a claim
 * about whether the data was re-checked, and `unknown` means that claim
 * can't be made. This used to fall back to printing the source domain +
 * 核实月份 here so the row wasn't empty, but T4 added a dedicated
 * `CitationLine` (block 1, next to `answer_sentence_zh`) that prints exactly
 * that on every page regardless of freshness status — so the fallback here
 * was deleted rather than kept as a second copy of the same string.
 *
 * With no status label and no action to offer, the whole bar is absent
 * rather than an empty bordered strip (ruling T3-R3.1).
 */
export function FreshnessBar({
  program,
  showActions = true,
  className = "",
}: {
  program: ProgramV3;
  /** Detail page renders 对比/收藏 as its own final module (§2.2), so it
   * opts out of the duplicate compare/ics actions here. */
  showActions?: boolean;
  className?: string;
}) {
  const flag = program.publishing.freshness_flag;
  const label = freshnessLabel(flag.status, program.application.admission_cycle);
  const ics = icsDataUri(program);

  if (!label && !showActions) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-3 ${className}`}
    >
      {label ? (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-ink-500">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[label.tone]}`}
          />
          {label.text}
        </span>
      ) : null}
      {showActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {ics ? (
            <a
              className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600"
              download={`${program.publishing.slug ?? "deadline"}.ics`}
              href={ics}
            >
              <Icon name="calendar" size={14} />
              订阅截止日
            </a>
          ) : null}
          <CompareToggleButton programRef={programOfferingRef(program)} />
        </div>
      ) : null}
    </div>
  );
}
