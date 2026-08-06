import { Icon } from "@/components/ui/Icon";
import { CompareToggleButton } from "@/components/program/v3/CompareToggleButton";
import { ProgramJsonLd } from "@/components/program/v3/ProgramJsonLd";
import { splitApplicationConditions } from "@/components/program/v3/RequirementsExpand";
import type { ProgramV3 } from "@/data/v3/types";
import {
  auditionFormatZh,
  costBlockLine,
  formatDateZh,
  formatYearMonthZh,
  freshnessLabel,
  icsDataUri,
  latestRetrievedDate,
  programDetailHref,
  programOfferingRef,
  sourceDomain,
  sourceUrlForField,
} from "@/lib/program-v3/format";
import { buildRequirementRows } from "@/lib/program-v3/requirement-rows";
import { BrowseDeadlineChip } from "./BrowseDeadlineChip";
import styles from "./browse.module.css";

const TONE_DOT: Record<"green" | "yellow" | "red", string> = {
  green: "bg-stage-green-500",
  yellow: "bg-stage-amber-600",
  red: "bg-stage-red-600",
};

/**
 * T7 的大信息卡 —— §2.1 Web Card 的全部七块,换成 T7 的外层布局与 token。
 *
 * **没有一条业务规则写在这个文件里。** 每个取值都来自 T3 已经钉死的那些
 * 纯函数:`costBlockLine`(费用三形态 §3.6)、`auditionFormatZh` /
 * `fiveStateZh`(枚举中文化)、`freshnessLabel`(§3.4 状态机)、
 * `deadlineState`(角标三态,在 `BrowseDeadlineChip` 里)、
 * `splitApplicationConditions`(条件归属,裁决 T3-R4.1)、
 * `sourceUrlForField`(条件说明的来源链接)、`buildRequirementRows`
 * (完整要求表的行,与详情页同一份定义)。空值降级同样是 T3 的:
 * 每一块自己判断该不该出现,不留空壳(裁决 T3-R3.1)。
 *
 * 与 T3 卡片的两处结构差异,都是 2026-08-05 人类裁决的直接结果:
 *
 * 1. 「详细要求」是常展开的 label-value 表,不是 `<details>` 折叠区 ——
 *    T7 规格给的就是两列表格的形状(移动端上下两行、分隔线 #F0F2F5)。
 * 2. 曲目要求印全文,不做 §3.3 的 80 字截断 —— 截断的前提是有一个
 *    「完整要求」页可以送读者过去,而详情页已被裁决降级为这张同页大卡,
 *    没有下一跳了。这与裁决 T3-R4.4(无详情页的项目印全文)是同一条规则,
 *    不是新开的例外。
 *
 * 反 cloaking:整张卡片全量服务端渲染,没有任何一段文字靠交互才进入 DOM。
 * 外层的显隐由 `SchoolsBrowse` 用 `hidden` 属性控制,只切换可见性,
 * 不替换 innerHTML、不发请求。
 */
export function BrowseProgramCard({ program }: { program: ProgramV3 }) {
  const { application, audition } = program;
  const pageUrl = programDetailHref(program);

  // 块 1:导语 + 可见引用块(T4 §2.4:来源域名 + 核实月份)
  const citationDomain = program.sources[0]
    ? sourceDomain(program.sources[0].source_url)
    : null;
  const citationMonth = formatYearMonthZh(
    program.publishing.freshness_flag.last_verified ?? latestRetrievedDate(program),
  );

  // 块 2:中文名为主、英文名为次(核心原则 6 / 裁决 T3-R3.2)
  const schoolNameZh = program.school.school_name_zh ?? program.school.school_name;
  const title =
    program.offering.program_name_zh ?? program.offering.official_program_name;

  // 块 5:三数字块 —— 列数跟着实际存在的格子走,不留死列
  const deadlineText = formatDateZh(application.application_deadline);
  const cost = costBlockLine(program.publishing.cost_estimate_rmb);
  const auditionFormat = auditionFormatZh(audition.audition_format);
  const keyCells = [deadlineText, cost, auditionFormat].filter(Boolean).length;

  // 块 6:详细要求。共享定义 + 曲目全文(见文件头第 2 条),减去与三数字块
  // 重复的那一行 —— 见下。
  const rows = buildRequirementRows(program).filter(
    // 「申请截止日期」在这张卡上已经由三数字块印过一次,同卡再印一遍没有
    // 信息增量(人类裁决 2026-08-05, T7 交付确认第 3 条)。
    //
    // 过滤在这里、不在 `buildRequirementRows` 里:那份定义是详情页
    // `RequirementsTable`(§2.2 模块 2)与本卡共用的,而详情页上没有三数字块,
    // 删掉就等于让完整要求表少一行事实。这一行的取舍是**这个页面**的排版
    // 问题,不是那份定义的问题。
    //
    // 两者永远同生同灭,所以过滤不会造成「表里没有、数字块也没有」:两处
    // 都由 `formatDateZh(application.application_deadline)` 决定,截止日为
    // null 时这一行本来就不存在,三数字块的格子也不会渲染。
    (row) => row.term !== "申请截止日期",
  );
  if (audition.repertoire_summary) {
    rows.push({ term: "曲目要求", value: audition.repertoire_summary });
  }
  const conditions = splitApplicationConditions(application);
  const conditionLines = [
    {
      label: "语言条件说明",
      note: conditions.language,
      href: sourceUrlForField(program, "english", "language"),
    },
    {
      label: "申请条件说明",
      note: conditions.general,
      href: sourceUrlForField(program, "application_requirements", "application"),
    },
    {
      label: "试音条件说明",
      note: audition.conditional_notes,
      href: sourceUrlForField(program, "audition"),
    },
  ].filter((line) => Boolean(line.note));

  // 块 7:状态条 + 动作按钮
  const freshness = freshnessLabel(
    program.publishing.freshness_flag.status,
    application.admission_cycle,
  );
  const ics = icsDataUri(program);
  const badges = program.publishing.badges.slice(0, 2);

  return (
    <article className={styles.card}>
      {/* AI-ready 层:JSON-LD,不改变可见渲染(T4 §2.4)。一页多块是合法用法。 */}
      <ProgramJsonLd pageUrl={pageUrl} program={program} />

      {/* 1. 导语 + 引用块 */}
      {program.publishing.answer_sentence_zh ? (
        <p className={styles.lead}>{program.publishing.answer_sentence_zh}</p>
      ) : null}
      {citationDomain || citationMonth ? (
        <p className={styles.citation}>
          {citationDomain ? `来源:${citationDomain}` : null}
          {citationDomain && citationMonth ? " · " : null}
          {citationMonth ? `核实于 ${citationMonth}` : null}
        </p>
      ) : null}

      {/* 2. 校名 · 专业 + 右上截止角标 */}
      <div className={styles.titleRow}>
        <h2 className={styles.title}>
          {schoolNameZh} · {title}
        </h2>
        <BrowseDeadlineChip deadline={application.application_deadline} />
      </div>
      <p className={styles.subline}>
        {program.school.school_name} · {program.offering.degree_level_name_zh} ·{" "}
        {program.school.city}
      </p>

      {/* 3. 编辑观点行(§1.3:永远带标识,永不并入导语) */}
      {program.editorial_note ? (
        <p className={styles.editorial}>
          <span className={`${styles.pill} ${styles.pillMuted}`}>编辑观点</span>
          <span>{program.editorial_note.short_positioning}</span>
          {program.editorial_note.key_difficulty ? (
            <span>· {program.editorial_note.key_difficulty}</span>
          ) : null}
        </p>
      ) : null}

      {/* 4. 金标签行 */}
      {badges.length > 0 ? (
        <div className={styles.badgeRow}>
          {badges.map((badge) => (
            <span className={styles.pill} key={badge.label}>
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}

      {/* 5. 三数字块 */}
      {keyCells > 0 ? (
        <dl
          className={styles.keyNumbers}
          style={{ "--t7-key-columns": keyCells } as React.CSSProperties}
        >
          {deadlineText ? (
            <div>
              <dt className={styles.keyLabel}>申请截止</dt>
              <dd className={styles.keyValue}>{deadlineText}</dd>
            </div>
          ) : null}
          {cost ? (
            <div>
              <dt className={styles.keyLabel}>年总费用</dt>
              <dd className={styles.keyValue}>{cost.headline}</dd>
              {cost.compositionNote ? (
                <dd className={styles.keyNote}>{cost.compositionNote}</dd>
              ) : null}
              {cost.configEstimateDisclaimer ? (
                <dd className={styles.keyNote}>{cost.configEstimateDisclaimer}</dd>
              ) : null}
              {cost.fxDisclaimer ? (
                <dd className={styles.keyNote}>{cost.fxDisclaimer}</dd>
              ) : null}
            </div>
          ) : null}
          {auditionFormat ? (
            <div>
              <dt className={styles.keyLabel}>试音形式</dt>
              <dd className={styles.keyValue}>{auditionFormat}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* 6. 详细要求 */}
      {rows.length > 0 || conditionLines.length > 0 ? (
        <div className={styles.requirements}>
          {rows.length > 0 ? (
            <dl>
              {rows.map((row) => (
                <div className={styles.requirementRow} key={row.term}>
                  <dt className={styles.requirementLabel}>{row.term}</dt>
                  <dd className={styles.requirementValue}>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {conditionLines.length > 0 ? (
            <div className={styles.conditionList}>
              {conditionLines.map((line) => (
                <p className={styles.condition} key={line.label}>
                  {line.label}:{line.note}
                  {line.href ? (
                    <>
                      ,详见{" "}
                      <a
                        className={styles.link}
                        href={line.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        官网来源
                      </a>
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 7. 状态条 + 动作按钮 */}
      {freshness || ics ? (
        <div className={styles.statusRow}>
          {freshness ? (
            <span className={styles.status}>
              <span
                aria-hidden
                className={`${styles.statusDot} ${TONE_DOT[freshness.tone]}`}
              />
              {freshness.text}
            </span>
          ) : (
            <span />
          )}
          <div className={styles.actions}>
            {ics ? (
              <a
                className={styles.button}
                download={`${program.publishing.slug ?? "deadline"}.ics`}
                href={ics}
              >
                <Icon name="calendar" size={14} />
                订阅截止日
              </a>
            ) : null}
            <CompareToggleButton
              className={styles.button}
              programRef={programOfferingRef(program)}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
