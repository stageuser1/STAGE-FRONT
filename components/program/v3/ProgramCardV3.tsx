import type { ProgramV3 } from "@/data/v3/types";
import { programDetailHref } from "@/lib/program-v3/format";
import { BadgeRow } from "./BadgeRow";
import { CitationLine } from "./CitationLine";
import { DeadlineBadge } from "./DeadlineBadge";
import { EditorialNoteLine } from "./EditorialNoteLine";
import { FreshnessBar } from "./FreshnessBar";
import { KeyNumbers } from "./KeyNumbers";
import { ProgramJsonLd } from "./ProgramJsonLd";
import { RequirementsExpand } from "./RequirementsExpand";

export { programDetailHref };

/**
 * §2.1: the Web Card. Vertical structure is frozen at exactly seven blocks —
 * do not add an eighth or reorder them without a blueprint change.
 *
 *   1 导语 · 2 校名/专业 + 截止角标 · 3 编辑观点 · 4 金标签
 *   5 三数字块 · 6 折叠区 · 7 状态条 + 动作按钮
 *
 * `<article>` + `<dl>` per the semantic-HTML requirement; everything is
 * server-rendered, with no data fetched on interaction.
 *
 * Blocks 3, 4, 5 and 6 own their own spacing and return `null` when they
 * have nothing to say, so an absent block leaves no element and no gap
 * behind (ruling T3-R3.1) — §3.1 asks for the block not to render, which an
 * empty wrapper `<div>` would not satisfy.
 *
 * The route to the detail page is block 2's title and block 6's footer link
 * (ruling T3-R3.6); there is deliberately no trailing CTA after block 7.
 */
export function ProgramCardV3({ program }: { program: ProgramV3 }) {
  const detailHref = programDetailHref(program);
  const title =
    program.offering.program_name_zh ?? program.offering.official_program_name;
  // 蓝图核心原则 6:中文名为主、英文名为次。中文缺失时回退英文是降级,
  // 不是编造 —— 与 T2-R7 的字段回退规则一致(裁决 T3-R3.2)。
  const schoolNameZh = program.school.school_name_zh ?? program.school.school_name;

  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-card">
      {/* AI-ready 层:JSON-LD 结构化数据,不改变可见渲染(T4 §2.4)。 */}
      <ProgramJsonLd pageUrl={detailHref} program={program} />

      {/* 1. answer_sentence_zh — visible, never CSS-hidden (§0.4). */}
      {program.publishing.answer_sentence_zh ? (
        <p className="text-xs leading-5 text-ink-500">
          {program.publishing.answer_sentence_zh}
        </p>
      ) : null}
      {/* 每页可见引用块(T4 §2.4):来源域名 + 核实月份,与导语同属块 1,
          固定可见、不作 CSS 弱化。FreshnessBar(块 7)不再重复渲染来源域名,
          见该文件的裁决说明。 */}
      <CitationLine className="mt-0.5" program={program} />

      {/* 2. 校名/专业(主) · 英文名/学位/城市(次) + 截止角标 */}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-ink-900">
            {detailHref ? (
              <a className="hover:text-brand-600" href={detailHref}>
                {schoolNameZh} · {title}
              </a>
            ) : (
              <>
                {schoolNameZh} · {title}
              </>
            )}
          </h3>
          {/* No CSS truncation: the anti-cloaking red line does not grade
              text by importance, so a visually shortened string is a
              violation regardless of which line it sits on (ruling
              T3-R3.9). This wraps instead. */}
          <p className="mt-0.5 text-xs leading-4 text-ink-400">
            {program.school.school_name} · {program.offering.degree_level_name_zh}
            {" · "}
            {program.school.city}
          </p>
        </div>
        <DeadlineBadge deadline={program.application.application_deadline} />
      </div>

      {/* 3. 编辑观点行 */}
      <EditorialNoteLine className="mt-2" note={program.editorial_note} />

      {/* 4. 金标签行 */}
      <BadgeRow badges={program.publishing.badges} className="mt-2" />

      {/* 5. 三数字块 */}
      <KeyNumbers className="mt-3" program={program} />

      {/* 6. 折叠区:材料 / 曲目 / 英语要求(含条件说明) */}
      <RequirementsExpand
        className="mt-3"
        detailHref={detailHref}
        program={program}
      />

      {/* 7. 状态条 + 动作按钮 */}
      <FreshnessBar className="mt-3" program={program} />
    </article>
  );
}
