import type { CostBlockLine } from "@/lib/program-v3/format";

/**
 * The 年总费用 cell of the card's 三数字块 (§2.1 item 5 / §3.6).
 *
 * Takes an already-resolved `CostBlockLine` rather than the raw estimate:
 * the caller has to test for `null` anyway to decide whether the enclosing
 * block renders at all (ruling T3-R3.1), and resolving it twice would let
 * the container and the cell disagree about whether cost exists.
 *
 * Both disclaimers are driven by the resolved form, so 形态② can never lose
 * its 「生活费为第三方估算」 line and 形态①② can never lose the fx month.
 */
export function CostCell({ line }: { line: CostBlockLine }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">年总费用</dt>
      <dd className="mt-0.5 text-base font-semibold text-ink-900">
        {line.headline}
      </dd>
      {line.compositionNote ? (
        <p className="mt-0.5 text-xs leading-4 text-ink-400">
          {line.compositionNote}
        </p>
      ) : null}
      {line.configEstimateDisclaimer ? (
        <p className="mt-0.5 text-xs leading-4 text-ink-400">
          {line.configEstimateDisclaimer}
        </p>
      ) : null}
      {line.fxDisclaimer ? (
        <p className="mt-0.5 text-xs leading-4 text-ink-400">
          {line.fxDisclaimer}
        </p>
      ) : null}
    </div>
  );
}
