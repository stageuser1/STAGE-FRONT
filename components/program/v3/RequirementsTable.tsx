import type { ProgramV3 } from "@/data/v3/types";
import { ConditionLine, splitApplicationConditions } from "./RequirementsExpand";
import { costBlockLine, sourceUrlForField } from "@/lib/program-v3/format";
import { buildRequirementRows } from "@/lib/program-v3/requirement-rows";

/**
 * §2.2 module 2, "完整要求表" — the un-truncated counterpart to the card's
 * folded preview.
 *
 * Rows are assembled as data and then filtered, rather than each being a
 * component that decides to return `null` mid-render. That is what makes
 * "are there any rows at all?" answerable, so the `<dl>` and the whole
 * `<section>` can be withheld instead of rendering a heading over nothing
 * (ruling T3-R4.2). Nothing here manufactures a placeholder (§3.1).
 *
 * The 年总费用 row lives here rather than in a module of its own, because
 * §2.2's module list is frozen and has no cost module (ruling T3-R3.5).
 *
 * The row list itself moved to `lib/program-v3/requirement-rows.ts` when T7
 * needed the identical rows inside the browse page's 大卡 — same terms, same
 * order, same null-drop rules, one definition. Cost and conditions stay
 * here: each surface renders those differently.
 */
export function RequirementsTable({ program }: { program: ProgramV3 }) {
  const { application, audition } = program;
  const cost = costBlockLine(program.publishing.cost_estimate_rmb);
  const conditions = splitApplicationConditions(application);
  const englishSourceUrl = sourceUrlForField(program, "english", "language");
  const applicationSourceUrl = sourceUrlForField(
    program,
    "application_requirements",
    "application",
  );
  const auditionSourceUrl = sourceUrlForField(program, "audition");

  const rows = buildRequirementRows(program);

  const hasConditions = Boolean(
    conditions.language || conditions.general || audition.conditional_notes,
  );
  if (rows.length === 0 && !cost && !hasConditions) return null;

  return (
    <section aria-labelledby="requirements-heading">
      <h2 className="text-base font-semibold text-ink-900" id="requirements-heading">
        完整要求
      </h2>

      {rows.length > 0 || cost ? (
        <dl className="mt-3">
          {rows.map(({ term, value }) => (
            <div
              className="flex flex-col gap-0.5 border-b border-line-subtle py-2.5 sm:flex-row sm:gap-4"
              key={term}
            >
              <dt className="w-40 shrink-0 text-sm text-ink-500">{term}</dt>
              <dd className="text-sm text-ink-900">{value}</dd>
            </div>
          ))}
          {cost ? (
            <div className="flex flex-col gap-0.5 border-b border-line-subtle py-2.5 sm:flex-row sm:gap-4">
              <dt className="w-40 shrink-0 text-sm text-ink-500">年总费用</dt>
              <dd className="text-sm text-ink-900">
                {cost.headline}
                {cost.compositionNote ? (
                  <span className="mt-0.5 block text-xs leading-4 text-ink-400">
                    {cost.compositionNote}
                  </span>
                ) : null}
                {cost.configEstimateDisclaimer ? (
                  <span className="mt-0.5 block text-xs leading-4 text-ink-400">
                    {cost.configEstimateDisclaimer}
                  </span>
                ) : null}
                {cost.fxDisclaimer ? (
                  <span className="mt-0.5 block text-xs leading-4 text-ink-400">
                    {cost.fxDisclaimer}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* §3.2: conditions ride alongside the values above rather than only
          appearing in the 特殊条件 module further down the page, so a reader
          who stops at the table still sees that a requirement is
          conditional. Each is labelled with the requirement it actually
          qualifies (ruling T3-R4.1). */}
      {hasConditions ? (
        <div className="mt-2 space-y-1">
          <ConditionLine
            label="语言条件说明"
            note={conditions.language}
            sourceUrl={englishSourceUrl}
          />
          <ConditionLine
            label="申请条件说明"
            note={conditions.general}
            sourceUrl={applicationSourceUrl}
          />
          <ConditionLine
            label="试音条件说明"
            note={audition.conditional_notes}
            sourceUrl={auditionSourceUrl}
          />
        </div>
      ) : null}
    </section>
  );
}
