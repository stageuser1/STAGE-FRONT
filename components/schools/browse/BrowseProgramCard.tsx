import { Icon } from "@/components/ui/Icon";
import { CompareToggleButton } from "@/components/program/v3/CompareToggleButton";
import { ProgramJsonLd } from "@/components/program/v3/ProgramJsonLd";
import { splitApplicationConditions } from "@/components/program/v3/RequirementsExpand";
import type { ProgramV3 } from "@/data/v3/types";
import {
  auditionFormatZh,
  costBlockLine,
  fiveStateZh,
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
 * `sourceUrlForField`(来源链接)。空值降级同样是 T3 的:
 * 每一块自己判断该不该出现,不留空壳(裁决 T3-R3.1)。
 *
 * 与 T3 卡片的结构差异,都是人类裁决的直接结果:
 *
 * 1. 「详细要求」是常展开的 label-value 表,不是 `<details>` 折叠区
 *    (2026-08-05)—— T7 规格给的就是两列表格的形状。
 * 2. **「详细要求」只有三行**(2026-08-06):申请材料清单、曲目要求、
 *    英语要求。这是蓝图 §1.5 给 expand(30 秒层)划的范围。此前这里调用
 *    `buildRequirementRows()` 展开 20 多行,那是 §1.5 **3 分钟层**(详情页
 *    `RequirementsTable`)的字段全集,2026-08-05 折叠详情页时被一并带了
 *    进来 —— 规格疏漏,不是取值错误。那份共享定义一行未动,其余字段仍在
 *    canonical 里,以后恢复详情页时原样可用。
 * 3. 曲目要求做 §3.3 的 80 字截断,「完整要求」链到**官网原页**
 *    (2026-08-06)。站内没有下一跳(详情页已折进本卡),官网原页才是真正
 *    有全文的地方;找不到来源 URL 时回退成印全文,而不是留一个点不开的
 *    省略号 —— 与裁决 T3-R4.4 同一条规则。
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

  // 块 6:详细要求 —— **只有三行**(裁决 2026-08-06,§1.5 tier 归位)。
  //
  // 这里原先直接用 `buildRequirementRows(program)`,展开 20 多行(申请季、
  // 申请费、推荐信、简历、个人文书、作品集、成绩单要求、TOEFL、IELTS、豁免
  // 政策、国际生说明、预筛是否要求/截止、是否试音、视频/文件格式/伴奏/面试
  // 要求、曲目要求,外加两条条件说明),其中大量是英文原文整段照搬。
  //
  // 成因是规格疏漏而不是取值错误:`buildRequirementRows` 是给蓝图 §1.5 的
  // **3 分钟层**(详情页 `RequirementsTable`,§2.2 模块 2)写的字段全集;
  // 2026-08-05 把详情页折进这张卡时,那个全集被一并带了进来。而 §1.5 给
  // expand(30 秒层)划的只有三项:材料清单、曲目要求、英语要求。
  //
  // 那份共享定义**一行未动** —— 它仍然是详情页的定义,以后恢复详情页时原样
  // 可用;这里只是不再调用它。其余字段仍在 canonical 里,没有删数据、没有删
  // 组件。
  const englishScores = buildEnglishRequirementLine(application);
  // 语言条件并回英语要求行(裁决 2026-08-06)。
  //
  // 「TOEFL 102」而不说「设有豁免条件」,对中国学生是完全不同的两件事 ——
  // 很多人正是靠豁免政策申请的。这条信息的决策价值极高,而它只占一行。
  //
  // 展示的是**信号 + 去处**,不是整段原文:全文仍在官网,外链送过去。这既是
  // §3.2 的合并形态,也避免把刚压掉的英文长段落又搬回卡上。
  //
  // 措辞按事实分档,不合并成一句:`english_waiver_policy` 字面就是豁免政策,
  // 说「设有豁免条件」有依据;而 `conditions.language` 是语言条件说明,它**不
  // 一定**是豁免(可能是「须在入学前提交」这类附加条件),对它说「豁免」就是
  // 一句 canonical 没有做过的断言。
  const conditions = splitApplicationConditions(application);
  const englishConditionLabel = application.english_waiver_policy
    ? "设有豁免条件"
    : conditions.language
      ? "设有语言条件说明"
      : null;
  // hint 列表按**实际承载这个事实的 `related_field`** 写,不是按字段的中文名
  // 猜。canonical 里英语要求是挂在 `toefl_minimum` / `ielts_minimum` /
  // `duolingo_minimum` 上的,没有哪条 source_record 的 `related_field` 叫
  // `english` 或 `language` —— 只写那两个 hint 的话链接恒为 null,而 §3.1 会
  // 让这一行悄悄退化成没有去处的一句话。(旧的「语言条件说明」行就是这样,
  // 它在真实数据上从来没有渲染出过链接。)
  const englishConditionHref = sourceUrlForField(
    program,
    "english",
    "language",
    "waiver",
    "toefl",
    "ielts",
    "duolingo",
  );
  const materials =
    application.required_materials.length > 0
      ? application.required_materials.join("、")
      : null;

  // 曲目要求:§3.3 的 80 字截断 + 「完整要求」外链。
  //
  // 截断的前提是有一个下一跳可以送读者过去。详情页已被 2026-08-05 裁决折进
  // 这张卡,站内没有下一跳了 —— 所以链接指向**官网原页**(该专业试音/曲目
  // 要求的 source_url),那是真正有全文的地方,而不是一个站内死链。
  // 找不到任何来源 URL 时**回退成印全文**,而不是留一个点不开的省略号:
  // 与裁决 T3-R4.4(无下一跳的项目印全文)同一条规则。
  const repertoireHref = sourceUrlForField(program, "repertoire", "audition");
  const repertoire = audition.repertoire_summary;
  const repertoireTruncated =
    repertoire !== null && repertoireHref !== null && repertoire.length > 80;

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

      {/* 6. 详细要求 —— 只有三行(§1.5 expand 层) */}
      {materials || repertoire || englishScores || englishConditionLabel ? (
        <div className={styles.requirements}>
          <dl>
            {materials ? (
              <div className={styles.requirementRow}>
                <dt className={styles.requirementLabel}>申请材料清单</dt>
                <dd className={styles.requirementValue}>{materials}</dd>
              </div>
            ) : null}
            {repertoire ? (
              <div className={styles.requirementRow}>
                <dt className={styles.requirementLabel}>曲目要求</dt>
                <dd className={styles.requirementValue}>
                  {repertoireTruncated ? (
                    <>
                      {repertoire.slice(0, 80)}…{" "}
                      <a
                        className={styles.link}
                        href={repertoireHref as string}
                        rel="noreferrer"
                        target="_blank"
                      >
                        完整要求
                      </a>
                    </>
                  ) : (
                    repertoire
                  )}
                </dd>
              </div>
            ) : null}
            {englishScores || englishConditionLabel ? (
              <div className={styles.requirementRow}>
                <dt className={styles.requirementLabel}>英语要求</dt>
                <dd className={styles.requirementValue}>
                  {englishScores}
                  {englishScores && englishConditionLabel ? " · " : null}
                  {englishConditionLabel ? (
                    <>
                      {englishConditionLabel}
                      {englishConditionHref ? (
                        <>
                          ,详见{" "}
                          <a
                            className={styles.link}
                            href={englishConditionHref}
                            rel="noreferrer"
                            target="_blank"
                          >
                            官网来源
                          </a>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
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

/**
 * 英语要求合并成一行(裁决 2026-08-06):五态 + 各项最低分 + 豁免条件。
 *
 * 原先这是四到五行(「英语要求」「TOEFL 最低分」「IELTS 最低分」「多邻国最低
 * 分」「语言豁免政策」)。合并不丢事实,只去掉重复的 label。
 *
 * 豁免/条件说明**不在这里** —— 它由调用处渲染成「设有豁免条件,详见 官网来源」
 * (信号 + 外链),因为它要带一个 `<a>`,而这个函数返回纯字符串。整段豁免原文
 * 不上卡:全文在官网,链接送过去。
 *
 * 五态放在最前且**只在明确时才出现**:`english_requirement_status` 是唯一
 * 能断言「不要求」的字段(§5,裁决 R8),而空的分数只意味着「没查到」。
 * `fiveStateZh` 把 `Unknown` 渲染成「未知」—— 那是一个占位符而不是事实,
 * 所以这里直接不渲染它(§3.1)。
 */
function buildEnglishRequirementLine(
  application: ProgramV3["application"],
): string | null {
  const parts: string[] = [];

  if (
    application.english_requirement_status !== null &&
    application.english_requirement_status !== "Unknown"
  ) {
    parts.push(fiveStateZh(application.english_requirement_status) as string);
  }

  const scores = [
    application.toefl_minimum !== null ? `TOEFL ${application.toefl_minimum}` : null,
    application.ielts_minimum !== null ? `IELTS ${application.ielts_minimum}` : null,
    application.duolingo_minimum !== null
      ? `多邻国 ${application.duolingo_minimum}`
      : null,
  ].filter(Boolean);
  if (scores.length > 0) parts.push(scores.join(" / "));

  return parts.length > 0 ? parts.join(" · ") : null;
}
