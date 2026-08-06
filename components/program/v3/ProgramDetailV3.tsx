import type { ProgramV3 } from "@/data/v3/types";
import { CitationLine } from "./CitationLine";
import { CompareToggleButton } from "./CompareToggleButton";
import { FavoriteToggleButton } from "./FavoriteToggleButton";
import { FreshnessBar } from "./FreshnessBar";
import { ProgramJsonLd } from "./ProgramJsonLd";
import { RelatedProgramsSection } from "./RelatedProgramsSection";
import { RepertoireSection } from "./RepertoireSection";
import { RequirementsTable } from "./RequirementsTable";
import { SourceEvidenceList } from "./SourceEvidenceList";
import { SpecialConditionsSection } from "./SpecialConditionsSection";
import { Icon } from "@/components/ui/Icon";
import {
  icsDataUri,
  programDetailHref,
  programOfferingRef,
} from "@/lib/program-v3/format";

/**
 * §2.2: the detail page ("3 分钟层"). Module order is frozen and nothing may
 * be inserted between modules (ruling T3-R3.5):
 *
 *   导语 → 完整要求表 → 曲目/作品集细则 → 原文证据 → 特殊条件
 *   → 相关专业 → 对比/收藏入口
 *
 * The header carries only the program's identity and 导语 (module 1). The
 * cost figure lives inside 完整要求表 as one more `<dt>/<dd>` pair rather
 * than as a block of its own, since §2.2 enumerates no cost module and
 * inventing one would break the frozen order.
 *
 * `<article>` root, server-rendered in full.
 */
export function ProgramDetailV3({
  program,
  relatedPrograms,
}: {
  program: ProgramV3;
  relatedPrograms: ProgramV3[];
}) {
  const title =
    program.offering.program_name_zh ?? program.offering.official_program_name;
  const schoolNameZh = program.school.school_name_zh ?? program.school.school_name;
  const ics = icsDataUri(program);
  const compareRef = programOfferingRef(program);

  return (
    <article className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* AI-ready 层:JSON-LD 结构化数据,不改变可见渲染(T4 §2.4)。 */}
      <ProgramJsonLd pageUrl={programDetailHref(program)} program={program} />

      <header>
        <h1 className="text-xl font-semibold text-ink-900">
          {schoolNameZh} · {title}
        </h1>
        <p className="mt-1 text-sm leading-5 text-ink-500">
          {program.school.school_name} · {program.offering.degree_level_name_zh}
          {" · "}
          {program.school.city}
        </p>

        {/* 模块 1:导语 + 可见引用块(来源域名 + 核实月份, T4 §2.4)。
            卡片已渲染同一句导语与引用块;详情页是该程序自己的落地页,
            重复渲染同一句话是必要的(它是这个页面的模块 1),而不是
            "同一页面出现两次"——不违反"不要重复渲染同一句话两次"。 */}
        {program.publishing.answer_sentence_zh ? (
          <p className="mt-3 text-sm leading-6 text-ink-600">
            {program.publishing.answer_sentence_zh}
          </p>
        ) : null}
        <CitationLine className="mt-1" program={program} />
      </header>

      {/* 模块 2:完整要求表 */}
      <RequirementsTable program={program} />

      {/* 模块 3:曲目/作品集细则 */}
      <RepertoireSection audition={program.audition} />

      {/* 模块 4:原文证据 */}
      <SourceEvidenceList sources={program.sources} />

      {/* 模块 5:特殊条件 */}
      <SpecialConditionsSection
        application={program.application}
        audition={program.audition}
      />

      {/* 模块 6:相关专业 */}
      <RelatedProgramsSection programs={relatedPrograms} />

      {/* 模块 7:对比/收藏入口。状态条与动作按钮同处一块,沿用 §2.1 item 7
          在卡片上已确立的配对关系。 */}
      <section>
        <FreshnessBar program={program} showActions={false} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ics ? (
            <a
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600"
              download={`${program.publishing.slug ?? "deadline"}.ics`}
              href={ics}
            >
              <Icon name="calendar" size={16} />
              订阅截止日
            </a>
          ) : null}
          <CompareToggleButton programRef={compareRef} />
          <FavoriteToggleButton programRef={compareRef} />
        </div>
      </section>
    </article>
  );
}
