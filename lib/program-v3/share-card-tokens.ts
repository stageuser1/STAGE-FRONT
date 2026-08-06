/**
 * 分享卡视觉 token —— **过渡方案**(人类裁决 2026-08-03)。
 *
 * 蓝图 §2.3 定义的是一套独立品牌视觉(深蓝 #0A1F4D 底、暖金 #F4C870 重点色)。
 * 本轮不执行那套:分享卡沿用 T3 Web Card 的视觉语言,白底、同一套配色与
 * 灰阶、同样的圆角与角标样式,不做差异化。§2.3 的深蓝+暖金版本待后续独立
 * ticket 落地。
 *
 * 这里的每个色值都是 `tailwind.config.ts` 里 T3 组件实际用到的那个 token 的
 * 值,不是「差不多的蓝」。satori 不认识 Tailwind class,必须写成内联样式,
 * 所以只能把值抄过来——`tests/program_v3_share_card.test.mjs` 的 `sc:V1`
 * 直接读 `tailwind.config.ts` 断言这些值仍然相等,抄错或 T3 改色而这里没跟上
 * 都会让测试失败。
 */

export const SHARE_CARD_COLORS = {
  /** `bg-white` —— ProgramCardV3 的卡面。§2.3 的深蓝底本轮不用。 */
  surface: "#FFFFFF",
  /** `text-ink-900` —— 校名、指标数值等主文字。 */
  ink900: "#0F172A",
  /** `text-ink-700` —— 专业 + 学位。 */
  ink700: "#334155",
  /** `text-ink-500` —— 指标标签、状态条文字。 */
  ink500: "#64748B",
  /** `text-ink-400` —— 英文校名、域名等次级灰阶。 */
  ink400: "#94A3B8",
  /** `bg-ink-100` —— 已截止角标底色。 */
  ink100: "#F1F5F9",
  /** `border-line` —— 卡片描边。 */
  line: "#E2E8F0",
  /** `border-line-subtle` —— 三数字块 / 状态条的分隔线。 */
  lineSubtle: "#F1F5F9",
  /** `text-brand-600` —— 品牌行。 */
  brand600: "#2B46EB",
  /** `text-brand-700` —— 开放中角标文字(DeadlineBadge)。 */
  brand700: "#2237C7",
  /** `bg-brand-50` —— 开放中角标底色(DeadlineBadge)。 */
  brand50: "#EEF1FE",
  /** `bg-red-50` / `text-red-600` —— 临近截止角标(Tailwind 默认红)。 */
  red50: "#FEF2F2",
  red600: "#DC2626",
} as const;

/** `rounded-xl` = 0.75rem = 12px,ProgramCardV3 的卡片圆角。 */
export const SHARE_CARD_RADIUS = 12;

/**
 * 竖版 3:4。**硬约束**,不是视觉偏好:微信分享卡片就是这个比例,横版或
 * 响应式宽卡在群里会被裁切。900×1200 是 3:4 的一个具体尺寸,改尺寸可以,
 * 改比例不行(`sc:L1` 钉死比例本身)。
 */
export const SHARE_CARD_PORTRAIT = { width: 900, height: 1200 } as const;

/** OG image 横版变体,链接预览的事实标准尺寸。 */
export const SHARE_CARD_OG = { width: 1200, height: 630 } as const;

/**
 * 竖版字号。缩略图可读性是功能硬约束:微信群里约 200px 宽,
 * 缩放比 200/900 ≈ 0.222,所以校名 96px → 约 21px,截止日期数值 52px →
 * 约 11.5px,两者在缩略图下仍可辨认(`sc:M1` 手工目检项对应的设计前提)。
 * 任何调小校名或指标数值的改动都要重跑缩略图目检。
 */
export const SHARE_CARD_PORTRAIT_TYPE = {
  brandLine: 30,
  schoolNameZh: 96,
  schoolNameEn: 30,
  program: 46,
  metricLabel: 26,
  metricValue: 52,
  stamp: 26,
  domain: 30,
  badge: 30,
} as const;

/** 横版字号。内容比竖版更精简,尺寸也相应下调。 */
export const SHARE_CARD_OG_TYPE = {
  brandLine: 24,
  schoolNameZh: 68,
  schoolNameEn: 24,
  program: 34,
  metricLabel: 20,
  metricValue: 32,
  stamp: 20,
  domain: 22,
  badge: 24,
} as const;
