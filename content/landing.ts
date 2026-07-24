/**
 * STAGE Landing content (docs 03 / 04 §4).
 *
 * Single edit point for all user-facing Landing copy. Plain Chinese strings —
 * NOT i18n translation keys (ADR-12). The IELTS exam-mock labels stay English
 * on purpose (exam-authentic, doc 03 §2.1). No markup inside strings.
 *
 * `stats` values are static, human-maintained editorial placeholders — the
 * Landing is not wired to Directus (ADR-13). Update them by hand.
 */

import type { IconName } from "@/components/ui/Icon";

/* ---------------------------------------------------------------- navigation */

export interface NavLink {
  href: string;
  label: string;
  soon?: boolean;
}

export const nav = {
  brand: "STAGE",
  links: [
    { href: "/schools", label: "院校探索" },
    { href: "/ielts-lab", label: "雅思实验室", soon: true },
    { href: "/dashboard", label: "学习中心", soon: true },
    { href: "/pricing", label: "定价" },
    { href: "/contact", label: "联系我们" },
  ] satisfies NavLink[],
  login: { href: "/dashboard", label: "登录" },
  cta: { href: "/schools", label: "开始使用" },
} as const;

/* --------------------------------------------------------------------- hero */

export const hero = {
  eyebrow: "AI 驱动的音乐教育平台",
  headline: { pre: "属于你的", highlight: "舞台", post: "，从选对院校开始。" },
  subhead:
    "STAGE 汇聚全球顶尖音乐院校的权威招生数据，结合 AI 英语能力评估，帮助你更从容地找到方向、做好准备、完成申请。",
  primaryCta: { href: "/schools", label: "探索院校" },
  secondaryCta: { href: "/ielts-lab", label: "了解雅思实验室" },
  trustLine: "每一条招生要求，均可追溯至官方信息源。",
} as const;

/* -------------------------------------------------- IELTS simulation preview */
/* Exam-authentic English labels (doc 03 §2.1) — do not translate to Chinese. */

export const ieltsPreview = {
  ariaLabel: "STAGE 雅思实验室界面预览",
  urlLabel: "stage.app/ielts-lab",
  examTitle: "IELTS Academic · Reading — Part 2",
  timer: "17:42",
  progressPercent: 62,
  questionLabel: "Q14 · Multiple choice",
  answers: [
    "It reflects a shift in audience expectations.",
    "It was driven mainly by new recording technology.",
    "It emerged from conservatory teaching reforms.",
  ],
  selectedAnswer: 1,
  aiLabel: "AI 智能评估",
  aiScoreLabel: "预估分数",
  aiScore: "7.0",
  aiBandPercent: 78,
  aiFeedback: "同义替换能力：优秀",
} as const;

/* -------------------------------------------------------------- credibility */

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export const credibility = {
  eyebrow: "STAGE 背后的院校数据库",
  // Editorial placeholders — human-maintained, not live data (ADR-13).
  stats: [
    { value: 120, suffix: "+", label: "全球音乐院校" },
    { value: 900, suffix: "+", label: "学位项目" },
    { value: 100, suffix: "%", label: "招生要求均可追溯官方信息源" },
    { value: 15, suffix: "", label: "覆盖国家与地区" },
  ] satisfies Stat[],
} as const;

/* ----------------------------------------------------------------- features */

export type FeatureVisual = "ielts" | "explore" | "dashboard";

export interface Feature {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta: { href: string; label: string };
  visual: FeatureVisual;
  visualSide: "left" | "right";
}

export const features: Feature[] = [
  {
    id: "explore",
    eyebrow: "院校探索",
    title: "每一所院校，均经过验证。",
    body: "按乐器、学位与国家搜索项目，横向比较招生与申请要求、学费信息——每一条数据都能追溯到官方信息源。",
    bullets: ["按乐器、学位、国家筛选", "招生要求与申请要求并列展示", "信息来源可验证，持续更新"],
    cta: { href: "/schools", label: "浏览院校数据库" },
    visual: "explore",
    visualSide: "right",
  },
  {
    id: "ielts-lab",
    eyebrow: "雅思实验室",
    title: "像真实考场一样练习。",
    body: "完整还原 IELTS Academic 考试环境，AI 精确分析你的答题表现，告诉你分数从何而来，以及如何提升。",
    bullets: ["高度还原真实考试环境的限时练习", "每道题目均有 AI 反馈", "四项技能的薄弱环节分析"],
    cta: { href: "/ielts-lab", label: "预览实验室" },
    visual: "ielts",
    visualSide: "left",
  },
  {
    id: "dashboard",
    eyebrow: "学习中心",
    title: "你的整个申请历程，一目了然。",
    body: "测试成绩、收藏院校、截止日期与申请进度，全部集中在一个为申请者设计的工作台中。",
    bullets: ["测试成绩与进步趋势", "收藏院校与项目清单", "申请步骤与截止日期一览"],
    cta: { href: "/dashboard", label: "预览学习中心" },
    visual: "dashboard",
    visualSide: "right",
  },
];

/* --------------------------------------------------------- app preview mocks */

export const appPreview = {
  explore: {
    searchPlaceholder: "搜索院校、项目或乐器",
    results: [
      { name: "茱莉亚学院", meta: "硕士 · 美国", verified: "已验证" },
      { name: "皇家音乐学院", meta: "本科 · 英国", verified: "已验证" },
    ],
  },
  dashboard: {
    tiles: [
      { label: "平均分", value: "7.0" },
      { label: "已完成申请", value: "3" },
    ],
    chartLabel: "成绩趋势",
  },
} as const;

/* ------------------------------------------------------------- how it works */

export interface Step {
  number: string;
  title: string;
  body: string;
}

export const howItWorks = {
  title: "从初步搜索到最终试听。",
  steps: [
    { number: "01", title: "发现", body: "找到匹配你乐器、水平与目标的项目。" },
    { number: "02", title: "准备", body: "在雅思实验室中提升英语成绩，直到达到录取标准。" },
    { number: "03", title: "跟进", body: "在学习中心管理申请要求、截止日期与进度。" },
  ] satisfies Step[],
} as const;

/* ---------------------------------------------------------- pricing preview */

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
  badge?: string;
}

export const pricingPreview = {
  title: "为认真申请者准备的简单方案。",
  note: "具体方案即将公布",
  tiers: [
    {
      name: "基础版",
      price: "免费",
      features: ["浏览完整院校数据库", "查看招生与申请要求", "追溯官方信息源"],
      cta: { href: "/pricing", label: "了解详情" },
    },
    {
      name: "申请者版",
      price: "—",
      features: ["包含基础版全部功能", "雅思实验室完整练习", "AI 弱项分析与反馈"],
      cta: { href: "/pricing", label: "了解详情" },
      highlighted: true,
      badge: "最受欢迎",
    },
    {
      name: "完整版",
      price: "—",
      features: ["包含申请者版全部功能", "申请进度与截止日期管理", "优先获取新功能"],
      cta: { href: "/pricing", label: "了解详情" },
    },
  ] satisfies PricingTier[],
} as const;

/* ----------------------------------------------------------------------- faq */

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq = {
  title: "常见问题",
  items: [
    {
      question: "STAGE 的招生数据从哪里来？",
      answer:
        "STAGE 的每一条招生与申请要求都来自院校官方网站等权威信息源，并标注核验状态。我们持续跟踪官方更新，确保你看到的信息可追溯、可信赖。",
    },
    {
      question: "STAGE 是留学中介吗？",
      answer:
        "不是。STAGE 是一个信息与备考平台，不代办申请、不收取中介佣金。我们提供经过验证的院校数据与 AI 备考工具，帮助你自己做出更明智的决定。",
    },
    {
      question: "目前覆盖哪些国家和院校？",
      answer:
        "我们已收录全球多所音乐院校与数百个学位项目，覆盖美国、英国、加拿大等多个国家与地区，并在持续扩充。",
    },
    {
      question: "雅思实验室是什么？",
      answer:
        "雅思实验室是一个高度还原 IELTS Academic 考试环境的练习平台，配合 AI 分析你的答题表现，指出薄弱环节并给出提升建议。",
    },
    {
      question: "雅思实验室和学习中心什么时候上线？",
      answer:
        "两个模块正在开发中，即将陆续推出。你可以先从免费的院校数据库开始，了解目标院校的招生要求。",
    },
    {
      question: "STAGE 收费吗？",
      answer:
        "浏览院校数据库始终免费。更完整的备考与申请管理功能将采用订阅方案，具体定价即将公布。",
    },
  ] satisfies FaqItem[],
} as const;

/* ----------------------------------------------------------------------- cta */

export const cta = {
  title: "世界的舞台，比你想象的更近。",
  body: "从每一位认真申请者都需要的院校数据库开始。",
  button: { href: "/schools", label: "探索院校" },
} as const;

/* -------------------------------------------------------------------- footer */

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

export const footer = {
  tagline: "为全球申请者打造的音乐教育平台。",
  columns: [
    {
      title: "产品",
      links: [
        { href: "/schools", label: "院校探索" },
        { href: "/ielts-lab", label: "雅思实验室" },
        { href: "/dashboard", label: "学习中心" },
        { href: "/pricing", label: "定价" },
      ],
    },
    {
      title: "公司",
      links: [
        { href: "/contact", label: "联系我们" },
        { href: "/contact", label: "关于我们" },
      ],
    },
  ] satisfies FooterColumn[],
  contactTitle: "联系方式",
  contactEmail: "hello@stage.example", // TODO(content): real address
  copyright: "© 2026 STAGE. 保留所有权利。",
  legal: [
    { href: "#", label: "隐私政策" }, // TODO(content): legal pages
    { href: "#", label: "服务条款" },
  ],
} as const;

/* --------------------------------------------------------- teaser / metadata */

export const teasers = {
  "ielts-lab": {
    eyebrow: "雅思实验室",
    title: "雅思实验室即将上线。",
    body: "完整还原考试环境的 AI 雅思练习平台正在开发中。在此期间，你可以先探索院校数据库，明确目标院校的语言要求。",
    cta: { href: "/schools", label: "探索院校" },
  },
  dashboard: {
    eyebrow: "学习中心",
    title: "学习中心即将上线。",
    body: "集中管理成绩、收藏院校与申请进度的工作台正在开发中。在此期间，你可以先探索院校数据库。",
    cta: { href: "/schools", label: "探索院校" },
  },
  contact: {
    eyebrow: "联系我们",
    title: "与 STAGE 取得联系。",
    body: "对院校数据、合作或产品有任何疑问，欢迎通过邮件与我们联系。",
    email: "hello@stage.example", // TODO(content): real address
  },
} as const;
