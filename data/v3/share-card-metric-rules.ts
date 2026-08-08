import type { ShareCardMetricRuleV3 } from "./types";

/**
 * 配置层 `share_card_metric_rules`(蓝图 §1.2)在仓库里的镜像。
 *
 * **这不是重新设计的规则表**——四行内容是 2026-08-03 从生产 旧 CMS
 * (`GET /items/share_card_metric_rules`)原样读回来的,包括 `priority`、
 * `label_zh`、`enabled` 与 `fallback_when_missing` 四列的实际取值:
 *
 * | id | metric_key | priority | label_zh | enabled | fallback_when_missing |
 * |----|------------|---------|---------|---------|----------------------|
 * | 1 | language_requirement | 1 | 语言要求 | true | true |
 * | 2 | prescreening_audition | 2 | 预筛/试音 | true | true |
 * | 3 | deadline | 3 | 截止日期 | true | true |
 * | 4 | total_cost | 4 | 总费用 | true | true |
 *
 * 之所以镜像而不是运行时查询:核心原则 5「静态优先,用户访问不查 旧 CMS」。
 * 图片服务在构建期跑,旧 CMS 在运行时零依赖。真正的构建期回填(从 旧 CMS
 * 读这张表、生成这个模块)属于 T3b 的真实数据接入,不在 T5 范围;届时只需
 * 替换这个数组的来源,消费它的 `shareCardMetrics()` 不变——它已经完全
 * 数据驱动(读 priority 排序、读 enabled 过滤、读 label_zh 显示),
 * 没有把这四个 key 的顺序或标签硬编码在逻辑里。
 */
export const SHARE_CARD_METRIC_RULES: ShareCardMetricRuleV3[] = [
  {
    metric_key: "language_requirement",
    priority: 1,
    label_zh: "语言要求",
    enabled: true,
    fallback_when_missing: true,
  },
  {
    metric_key: "prescreening_audition",
    priority: 2,
    label_zh: "预筛/试音",
    enabled: true,
    fallback_when_missing: true,
  },
  {
    metric_key: "deadline",
    priority: 3,
    label_zh: "截止日期",
    enabled: true,
    fallback_when_missing: true,
  },
  {
    metric_key: "total_cost",
    priority: 4,
    label_zh: "总费用",
    enabled: true,
    fallback_when_missing: true,
  },
];
