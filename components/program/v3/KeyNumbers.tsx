import type { ProgramV3 } from "@/data/v3/types";
import { CostCell } from "./CostBlock";
import {
  auditionFormatZh,
  costBlockLine,
  formatDateZh,
} from "@/lib/program-v3/format";

/**
 * §2.1 item 5: the 三数字块 (申请截止 / 年总费用 / 试音形式).
 *
 * Owns its own `<dl>` so that when all three numbers are absent the element
 * itself never reaches the DOM (ruling T3-R3.1) — §3.1 asks for "该块不
 * 渲染", and an empty `<dl>` with a top border is a rendered block that
 * happens to be empty, which reads as a data hole rather than as absence.
 *
 * The column count follows the number of cells actually present, so one
 * surviving number does not sit in a third of a grid with two dead columns.
 */
export function KeyNumbers({
  program,
  className = "",
}: {
  program: ProgramV3;
  className?: string;
}) {
  const deadlineText = formatDateZh(program.application.application_deadline);
  const cost = costBlockLine(program.publishing.cost_estimate_rmb);
  const auditionFormat = auditionFormatZh(program.audition.audition_format);

  const cells = [
    deadlineText !== null,
    cost !== null,
    auditionFormat !== null,
  ].filter(Boolean).length;
  if (cells === 0) return null;

  const columns =
    cells === 1 ? "grid-cols-1" : cells === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <dl
      className={`grid ${columns} gap-3 border-t border-line-subtle pt-3 ${className}`}
    >
      {deadlineText ? (
        <div>
          <dt className="text-xs text-ink-500">申请截止</dt>
          <dd className="mt-0.5 text-base font-semibold text-ink-900">
            {deadlineText}
          </dd>
        </div>
      ) : null}
      {cost ? <CostCell line={cost} /> : null}
      {auditionFormat ? (
        <div>
          <dt className="text-xs text-ink-500">试音形式</dt>
          <dd className="mt-0.5 text-base font-semibold text-ink-900">
            {auditionFormat}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
