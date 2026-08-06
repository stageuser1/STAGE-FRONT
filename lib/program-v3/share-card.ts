import type {
  ProgramV3,
  ShareCardMetricKey,
  ShareCardMetricRuleV3,
  ShareCardMetricV3,
  ShareCardPayloadV3,
} from "@/data/v3/types";
// 值导入一律走相对路径 + 显式 .ts:`npm run test:lib` 用
// `node --test --experimental-strip-types` 直接跑这些模块,它不解析 `@/`
// 这个打包器别名(理由与 json-ld.ts / sitemap-entries.ts 的注释相同)。
import { SHARE_CARD_METRIC_RULES } from "../../data/v3/share-card-metric-rules.ts";
import { SITE_URL } from "../site-config.ts";
import {
  auditionFormatZh,
  costBlockLine,
  formatDateZh,
  formatYearMonthZh,
  latestRetrievedDate,
  programDetailHref,
  sourceDomain,
} from "./format.ts";

/**
 * §2.3 投影三:Share Card 的数据层(`share_card_payload`,§1.4)。
 *
 * 这一层只做「从 publishing + canonical 里挑事实」,不做任何渲染决定,也
 * 不接触 `editorial_note`——§0.3 的铁律在类型层面就成立:本文件全文没有
 * `editorial_note` 的读取路径,`ShareCardPayloadV3` 也没有能承载它的字段。
 *
 * 所有取值函数都复用 T3 的 `lib/program-v3/format.ts`(`costBlockLine`、
 * `formatDateZh`、`auditionFormatZh`…),不在这里另起一套措辞或另一套降级
 * 判定。分享卡与 Web Card 因此永远不会对同一个项目说出两个不同的数字。
 */

export const SHARE_CARD_MAX_METRICS = 3;

/** 品牌行文案,§2.3 逐字规定。 */
export const SHARE_CARD_BRAND_LINE = "先留学 · 不鸽,只先到";

/**
 * 每条规则的取值函数。返回 `null` = 该指标在这个项目上没有事实支撑,
 * 于是它整条消失(由下一优先级的规则补位),**不产出占位符**(§3.1)。
 *
 * 措辞纪律:
 * - 只有显式 `Not Required` 才允许出现「无需」类措辞(§3.1);
 * - `Unknown` / null 一律等于「没有」,不猜、不写「暂无」;
 * - 数字全部来自 canonical 字段本身,分享卡不做任何换算或估算。
 */
const METRIC_VALUE: Record<
  ShareCardMetricKey,
  (program: ProgramV3) => string | null
> = {
  /**
   * 语言要求。分数优先(TOEFL 100 / IELTS 7 是 canonical 里的原始数字),
   * 没有分数时退到五态本身。
   *
   * 刻意**不**在这里追加「设有豁免」之类的补充:分享卡三个指标各只有一行,
   * 而豁免细则是 §3.2 明确要求带链接与条件说明的内容,压缩成四个字反而
   * 比不写更容易被误读为绝对结论。分数本身是事实陈述(官网写的最低分),
   * 不是「必须考」的绝对结论;完整豁免政策在详情页(扫码即达)。
   * ——裁决 T5-R3
   */
  language_requirement: (program) => {
    const app = program.application;
    if (app.english_requirement_status === "Not Required") {
      return "无需语言成绩";
    }
    const scores = [
      app.toefl_minimum !== null ? `TOEFL ${app.toefl_minimum}` : null,
      app.ielts_minimum !== null ? `IELTS ${app.ielts_minimum}` : null,
      app.duolingo_minimum !== null ? `Duolingo ${app.duolingo_minimum}` : null,
    ].filter((s): s is string => s !== null);
    if (scores.length > 0) return scores.join(" / ");
    if (app.english_requirement_status === "Required") return "需要语言成绩";
    if (app.english_requirement_status === "Conditional") return "有条件要求";
    // Optional 与 Unknown:前者「可选」在没有分数时说不出有效信息,
    // 后者根本没判定 —— 两者都让位给下一条规则。
    return null;
  },

  /**
   * 预筛 / 试音。两个字段各自可缺,能说多少说多少。
   *
   * `prescreening_required === "Varies"` 不单独成句:五态词表里没有对应
   * 措辞,自己造一个(「视情况而定」)就是发明事实。此时若试音形式已知,
   * 就只说试音形式。
   */
  prescreening_audition: (program) => {
    const audition = program.audition;
    const format = auditionFormatZh(audition.audition_format);
    const prescreening =
      audition.prescreening_required === "Yes"
        ? "需预筛"
        : audition.prescreening_required === "No"
          ? "无需预筛"
          : null;
    if (prescreening && format) return `${prescreening} · ${format}`;
    return prescreening ?? format ?? null;
  },

  /** 截止日期。T3 的 `formatDateZh`,同一格式,`null` 直接消失。 */
  deadline: (program) => formatDateZh(program.application.application_deadline),

  /**
   * 总费用。直接复用 T3 的 `costBlockLine` —— 三形态判定、降级路径、
   * 「学费,不含生活费」这类自限定措辞全部是 T3 已裁决的结果,分享卡
   * 不重新发明(裁决 T5-R1)。
   *
   * 历史记录(已解决,T3-R6/T3-R7,2026-08-03):`costBlockLine` 曾把
   * `cost_estimate_rmb.min/max` 当「万元」渲染,而蓝图 §1.4 与 Mode F 真实
   * 产出的单位是「元」。修复落在 T3 一处(`isWanAligned()` 契约校验 +
   * 违约即降级),分享卡沿用同一个函数,零改动自动对齐——验证方式与结果
   * 见 `T5_REVIEW_HANDOFF.md` §0.2/§11.2。
   */
  total_cost: (program) =>
    costBlockLine(program.publishing.cost_estimate_rmb)?.headline ?? null,
};

/**
 * §1.2 的指标选取:按 priority 升序取值,**最多 3 个,永不出现空位**。
 *
 * `fallback_when_missing` 的语义(四行种子当前全为 `true`):
 * - `true` —— 本条没有值时,允许更低优先级的规则顶上它的位置;
 * - `false` —— 本条没有值时,不许别人顶替,该位置直接不存在,卡片少显示
 *   一个指标(仍然不是空位)。
 *
 * 后一分支目前在生产配置里跑不到,但它是这一列唯一说得通的含义,写出来
 * 并被测试钉住,好过把这一列当装饰忽略掉。
 */
export function shareCardMetrics(
  program: ProgramV3,
  rules: ShareCardMetricRuleV3[] = SHARE_CARD_METRIC_RULES,
): ShareCardMetricV3[] {
  const ordered = rules
    .filter((rule) => rule.enabled)
    .slice()
    .sort((a, b) => a.priority - b.priority);

  const metrics: ShareCardMetricV3[] = [];
  for (const rule of ordered) {
    if (metrics.length >= SHARE_CARD_MAX_METRICS) break;
    const value = METRIC_VALUE[rule.metric_key](program);
    if (value === null || value === "") {
      if (rule.fallback_when_missing) continue;
      break;
    }
    metrics.push({
      metric_key: rule.metric_key,
      label: rule.label_zh,
      value,
    });
  }
  return metrics;
}

/**
 * 核实戳。
 *
 * `freshness_flag.status === "changed"` 时不说「核实」——T3 的状态条在同样
 * 的数据上说的是「官网内容有变更,信息更新中」,分享卡照抄这句措辞,而不是
 * 一边说变更中一边盖一个核实戳(裁决 T5-R4)。
 *
 * 日期来源与 T4 的 `CitationLine` 一致:`last_verified`,缺失时回退到
 * `max(retrieved_date)`;两者都没有则整个戳不渲染。
 */
export function shareCardVerifiedStamp(program: ProgramV3): string | null {
  if (program.publishing.freshness_flag.status === "changed") {
    return "官网内容有变更,信息更新中";
  }
  const month = formatYearMonthZh(
    program.publishing.freshness_flag.last_verified ??
      latestRetrievedDate(program),
  );
  return month ? `官网核实 ${month}` : null;
}

/**
 * 二维码目标地址(裁决 T5-R2,人类 2026-08-03 拍板)。
 *
 * slug 存在 → 该项目详情页绝对地址(**必须**指向本项目,不得一律指首页);
 * slug 缺失(Mode F 未生成详情页)→ 站点首页,保证版式完整、不出现空洞。
 * 后者是已知过渡处理,待 T3b 真实路由上线后重新评估,见移交文档。
 *
 * 路径经由 T3 的 `programDetailHref()` 单一定义处取得,本文件不出现任何
 * 预览路由前缀的字面量(`sc:D3` 扫描源码断言这一点)—— 与 T4 的 I1 同一条
 * 纪律:T3b 迁移生产路由时只改 `format.ts` 那一处。
 */
export function shareCardQrUrl(program: ProgramV3): string {
  const href = programDetailHref(program);
  return href ? `${SITE_URL}${href}` : SITE_URL;
}

/** §1.4 `share_card_payload` 的完整装配。 */
export function buildShareCardPayload(
  program: ProgramV3,
  rules: ShareCardMetricRuleV3[] = SHARE_CARD_METRIC_RULES,
): ShareCardPayloadV3 {
  return {
    // 核心原则 6:中文优先;中文缺失回退英文是降级,不是编造(T3-R3.2)。
    name_zh: program.school.school_name_zh ?? program.school.school_name,
    name_en: program.school.school_name,
    program_zh:
      program.offering.program_name_zh ?? program.offering.official_program_name,
    degree_abbr: program.offering.degree_abbreviation,
    metrics: shareCardMetrics(program, rules),
    verified_stamp: shareCardVerifiedStamp(program),
    qr_url: shareCardQrUrl(program),
    qr_domain: sourceDomain(SITE_URL),
  };
}
