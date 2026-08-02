/**
 * STAGE marketing copy — single edit point for every user-facing string on the
 * (marketing) surface.
 *
 * Authority: `docs/stage-specs/homepage-spec.md` (§二 structure, §三 verbatim
 * copy, §四 mock content) and `docs/stage-specs/ielts-lab-supplement-spec.md`
 * §四 (footer disclaimer), both constrained by
 * `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md` (rulings C7, 小项1–3).
 *
 * Strings marked 逐字 are quoted from the spec and MUST NOT be reworded.
 * Strings marked 补充 are supplementary connective copy the spec does not
 * define; they may be edited, but only to statements that are true of shipped
 * behaviour (spec §五.3: unconfirmed features must not appear in copy).
 *
 * Two hard rules the spec sets for this file (§五.1/§五.6):
 *   - no score / Band / AI-assessment claim of any kind;
 *   - the product is named "IELTS Lab" everywhere, in English, never in a
 *     Chinese translation of it.
 *
 * The credibility figures are NOT here: they are computed at build time from
 * the live catalog by `lib/marketing/stats.ts` (Plan §7 增量 4). Only their
 * labels live below.
 */

/* ---------------------------------------------------------------- navigation */

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Navbar (spec §二.1) with ruling C7 applied: the solid CTA reads
 * 「探索音乐院校」 and must never imply a signup flow. 联系我们 moved to the
 * footer; there is no login entry on the marketing surface.
 */
export const nav = {
  brand: "STAGE",
  links: [
    { href: "/schools", label: "院校与专业" },
    { href: "/ielts-lab", label: "IELTS Lab" },
    { href: "/guides", label: "指南" },
    { href: "/pricing", label: "定价" },
  ] satisfies NavLink[],
  cta: { href: "/schools", label: "探索音乐院校" }, // 逐字 — ruling C7
  menuLabel: { open: "打开菜单", close: "关闭菜单" },
} as const;

/* --------------------------------------------------------------------- hero */

/** 首屏 — every string below is 逐字 from spec §三「首屏」. */
export const hero = {
  eyebrow: "音乐申请 × IELTS 准备",
  headline: { line1: "找到适合你的学校", line2: "也准备好你的 IELTS" },
  subhead:
    "从院校筛选、项目要求，到有据可循的 IELTS 复盘训练，STAGE 帮音乐学生把复杂的申请准备，变成一条更清晰的路径。",
  primaryCta: { href: "/schools", label: "探索音乐院校 →" },
  secondaryCta: { href: "/ielts-lab", label: "体验 IELTS Lab" },
  trustLine: "✓ 每一条招生要求，均可追溯至官方信息源。",
} as const;

/* ------------------------------------------------------- 进行时双截图 mocks */

/**
 * 首屏主图：院校详情页 (spec §四.1). Static, decorative, aria-hidden content —
 * it depicts the real school page, so every row here has a real counterpart.
 */
export const schoolMock = {
  ariaLabel: "STAGE 院校详情页界面示意",
  url: "stage.app/schools/juilliard",
  school: {
    name: "The Juilliard School",
    nameZh: "茱莉亚学院",
    location: "纽约，美国",
  },
  card: {
    title: "硕士 · 钢琴表演",
    verified: "核实于 2026-06",
    rows: [
      { label: "申请截止", value: "2026 年 12 月 1 日" },
      { label: "预筛选录像", value: "指定曲目 3 首" },
    ],
    languageRow: {
      label: "语言要求",
      value: "IELTS 7.0",
      deepLink: "去 IELTS Lab 准备 →",
    },
  },
  source: "来源：juilliard.edu 官方招生页",
} as const;

/**
 * 首屏小卡：IELTS Lab (spec §四.2), resolved to the **neutral opening state**
 * per Plan 小项 (待办决策 1 answered "no"): the "已导入自 …" line is not shown,
 * because no target-import feature exists.
 *
 * The spec's second tag reads 听力复盘. Listening is archived for this program
 * (Plan §2.7), so naming it here would advertise an unshipped module — spec
 * §五.3. It is 阅读复盘, which is what the Lab actually does.
 */
export const labCardMock = {
  ariaLabel: "STAGE IELTS Lab 打开状态示意",
  title: "IELTS Lab",
  status: "正在打开…",
  goal: "目标：IELTS 7.0",
  tags: ["阅读复盘", "弱点分析"],
} as const;

/* ------------------------------------------------------------------- 数据条 */

/**
 * Labels only (spec §二.4). The figures are computed from the catalog at build
 * time; where reality differs from the spec's illustrative numbers, reality
 * wins (Plan §2.1 数据条).
 */
export const stats = {
  ariaLabel: "STAGE 院校数据库覆盖情况",
  labels: {
    schools: "全球音乐院校",
    programs: "学位项目",
    traceable: "招生要求均可追溯官方信息源",
    countries: "覆盖国家与地区",
  },
} as const;

/* --------------------------------------------------------------- 验证机制区块 */

export const verification = {
  eyebrow: "院校探索", // 逐字
  title: "每一所院校，均经过验证。", // 逐字
  // 补充 — the spec defines no subtitle for this block; this states only what
  // the school pages actually render (source citation + retrieval date).
  subhead:
    "每一条要求都带着它的官方来源和核实日期一起呈现，你可以逐条点回院校官网自己核对。",
  steps: ["来源抓取", "结构化核对", "标注核实日期"], // 逐字
  cta: { href: "/schools", label: "浏览院校与专业" },
  mock: {
    ariaLabel: "STAGE 院校列表页界面示意",
    filtersTitle: "筛选",
    filters: [
      { label: "国家", options: ["美国", "英国", "德国"] },
      { label: "专业方向", options: ["键盘", "弦乐", "声乐"] },
      { label: "学位", options: ["本科", "硕士"] },
      { label: "截止月份", options: ["11 月", "12 月", "1 月"] },
    ],
    cards: [
      { name: "The Juilliard School", meta: "纽约，美国", verified: "核实于 2026-06" },
      { name: "Royal College of Music", meta: "伦敦，英国", verified: "核实于 2026-05" },
      { name: "Manhattan School of Music", meta: "纽约，美国", verified: "核实于 2026-06" },
      { name: "Hochschule für Musik", meta: "柏林，德国", verified: "核实于 2026-04" },
    ],
  },
} as const;

/* ----------------------------------------------------------- IELTS Lab 区块 */

/**
 * 反向定位 (spec §三「IELTS Lab 区块」). The spec allows the wording to be
 * tuned but not the stance; it is quoted unchanged, split into title + body at
 * its own sentence boundary.
 */
export const lab = {
  eyebrow: "IELTS Lab", // 逐字
  title: "我们不做 AI 考官，不做分数预测。", // 逐字
  subhead:
    "我们做的是有据可循的复盘——每一道错题都能定位到原文证据，每一次练习都沉淀为你的弱点档案与提升轨迹。", // 逐字
  /**
   * The four skills (spec §三). `live: false` modules carry a 建设中 marker so
   * the section never reads as a claim that they are usable today (§五.3).
   */
  modules: [
    { name: "Reading", live: true },
    { name: "Listening", live: false },
    { name: "Writing", live: false },
    { name: "Speaking", live: false },
  ],
  liveLabel: "已上线",
  comingLabel: "建设中",
  cta: { href: "/ielts-lab", label: "体验 IELTS Lab" },
  /**
   * Block image (Plan 小项2): the **Reading** evidence review — two panes, a
   * highlighted passage sentence, an error-evidence link. No timestamps, no
   * listening chrome, and no score/Band/assessment element anywhere.
   */
  mock: {
    ariaLabel: "STAGE IELTS Lab 阅读证据复盘界面示意",
    passageTitle: "Passage 2 · The Concert Hall Acoustic",
    paragraphs: [
      {
        marker: "B",
        text: "Early halls were shaped by trial and error rather than by measurement, and their reputations rested largely on the accounts of visiting performers.",
        highlighted: false,
      },
      {
        marker: "C",
        text: "Only after reverberation time could be measured did designers begin to treat the hall itself as an instrument to be tuned.",
        highlighted: true,
      },
      {
        marker: "D",
        text: "The change was gradual, and several older halls were left untouched precisely because musicians preferred their existing sound.",
        highlighted: false,
      },
    ],
    question: {
      label: "Q6 · Matching information",
      stem: "Which paragraph describes the point at which measurement changed hall design?",
      yourAnswer: { label: "你的作答", value: "B" },
      correctAnswer: { label: "正确答案", value: "C" },
      evidenceLink: "Q6 错因证据 · 原文定位 →",
      reason: "错因：把「早期凭经验」误读为「测量之后」。",
    },
  },
} as const;

/* -------------------------------------------------------------- 用户场景区块 */

export interface Persona {
  role: string;
  line: string;
}

export const personas = {
  eyebrow: "用户场景",
  // 补充 — the spec names the three cards but no section heading.
  title: "三种准备方式，同一份可核对的事实。",
  subhead: "学生、家长和顾问看的是同一批数据，只是各自关心的那一行不一样。",
  cards: [
    { role: "学生", line: "查清曲目要求，别练错方向" }, // 逐字
    { role: "家长", line: "看懂每一笔费用和每一个截止日期" }, // 逐字
    { role: "顾问", line: "可追溯的数据，敢直接发给客户" }, // 逐字
  ] satisfies Persona[],
} as const;

/* ------------------------------------------------------------------- 转化区 */

/**
 * 重复首屏双 CTA，主次不变 (spec §二.8). The heading re-uses the hero's own
 * 逐字 headline rather than introducing new copy.
 */
export const conversion = {
  title: `${hero.headline.line1}，${hero.headline.line2}。`,
  primaryCta: hero.primaryCta,
  secondaryCta: hero.secondaryCta,
  trustLine: hero.trustLine,
} as const;

/* ---------------------------------------------------------- 过渡页（小项1） */

export interface TransitionItem {
  title: string;
  body: string;
}

/** /guides — nav 指南 must not be a dead link (Plan 小项1). */
export const guides = {
  eyebrow: "指南",
  title: "音乐留学申请指南。",
  body: "指南正在按主题整理，先上线的是与院校数据直接相关的几篇。整理完成前，下面每个主题的事实依据都已经在院校与专业页面里，可以先去查。",
  status: "整理中",
  items: [
    {
      title: "申请时间线怎么排",
      body: "预筛选、正式申请、试音三个截止日期之间的先后关系，以及它们在不同国家的常见排法。",
    },
    {
      title: "预筛选录像怎么准备",
      body: "指定曲目、录制格式与提交方式的差别，以及哪些学校把预筛选和正式申请写在同一个截止日期上。",
    },
    {
      title: "语言成绩与豁免政策",
      body: "各校对 IELTS 的最低总分与小分要求，以及常见的豁免条件。",
    },
    {
      title: "试音曲目要求怎么读",
      body: "曲目清单里「指定」「任选」「同风格替换」这些措辞的实际含义。",
    },
  ] satisfies TransitionItem[],
  cta: { href: "/schools", label: "先去看院校与专业" },
} as const;

/** /glossary — footer 术语库 must not be a dead link (Plan 小项1). */
export const glossary = {
  eyebrow: "术语库",
  title: "申请术语，先说清楚。",
  body: "术语库正在建立，收录申请材料里反复出现、中英文对应关系又容易错的词。建立完成前，院校与专业页面里的每个术语都保留了英文原文，可以直接对照官方页面。",
  status: "整理中",
  items: [
    {
      title: "Prescreening 预筛选",
      body: "正式试音之前提交的录像评审环节，通过后才会收到试音邀请。",
    },
    {
      title: "Repertoire 曲目要求",
      body: "学校规定的演奏内容，通常区分指定曲目与自选曲目。",
    },
    {
      title: "Graduate Diploma / Artist Diploma",
      body: "研究生层级的两类文凭课程，与硕士学位并列但不等同。",
    },
    {
      title: "Conditional Offer 有条件录取",
      body: "在补齐语言成绩等条件后才生效的录取结果。",
    },
  ] satisfies TransitionItem[],
  cta: { href: "/schools", label: "去院校与专业页面对照" },
} as const;

/* -------------------------------------------------------------------- 页脚 */

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

/**
 * Footer (spec §二.9 + supplement-spec §四). Carries the guide items, 术语库,
 * 联系我们, 备案信息, the three official IELTS links (external, new window),
 * the trademark disclaimer 逐字, and the oversized STAGE wordmark that closes
 * the page.
 */
export const footer = {
  columns: [
    {
      title: "指南",
      links: [
        { href: "/guides", label: "申请时间线怎么排" },
        { href: "/guides", label: "预筛选录像怎么准备" },
        { href: "/guides", label: "语言成绩与豁免政策" },
        { href: "/guides", label: "试音曲目要求怎么读" },
      ],
    },
    {
      title: "产品",
      links: [
        { href: "/schools", label: "院校与专业" },
        { href: "/ielts-lab", label: "IELTS Lab" },
        { href: "/pricing", label: "定价" },
        { href: "/glossary", label: "术语库" },
      ],
    },
    {
      title: "关于",
      links: [{ href: "/contact", label: "联系我们" }],
    },
  ] satisfies FooterColumn[],

  officialTitle: "IELTS 官方入口",
  officialLinks: [
    { href: "https://www.ielts.org/", label: "雅思官方网站 ielts.org" },
    { href: "https://www.britishcouncil.org/", label: "British Council" },
    { href: "https://ielts.idp.com/", label: "IDP IELTS" },
  ],

  /**
   * 逐字 from ielts-lab-supplement-spec.md §四. Plan 小项3: ship as written and
   * mark it in-page for legal review — the marker is rendered as a real HTML
   * comment by MarketingFooter.
   */
  disclaimer:
    "IELTS® 是英国文化教育协会（British Council）、IDP IELTS Australia 与剑桥大学英语考评部（Cambridge Assessment English）的注册商标。STAGE 与上述机构不存在任何关联、认可或合作关系。",
  disclaimerReviewMarker: "法务口径待核实",

  /**
   * The anonymous-statistics disclosure (Business Blueprint §5, B0').
   *
   * One line, on the site's only legal surface, saying exactly what is
   * collected: a random local identifier and which pages/features were used.
   * It is accurate by construction — the event contract has no field a name,
   * an address or a piece of writing could travel in.
   */
  analyticsNote:
    "本站以匿名方式统计页面与功能的使用情况，用于改进产品。统计仅包含一个随机生成的本机标识与访问的功能名称，不含姓名、联系方式或你写下的任何内容；练习记录与草稿始终只保存在本机浏览器。",

  filingTitle: "备案信息",
  // No ICP number has been issued yet; stating one would be a fabrication.
  filingNote: "ICP 备案完成后在此公示。",
  filingLink: { href: "https://beian.miit.gov.cn/", label: "工信部备案管理系统" },

  copyright: "© 2026 STAGE. 保留所有权利。",
  wordmark: "STAGE",
} as const;

/* ------------------------------------------------ /pricing（过渡页，维持） */
/* Plan §2.1: the pricing transition page is unchanged. The two strings that
 * carried banned claims (the Chinese product name, and an AI-analysis feature)
 * are corrected here — that is the §五.1/§五.6 red line, not a redesign of the
 * page. */

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
      features: ["包含基础版全部功能", "IELTS Lab 完整练习", "弱点档案与提升追踪"],
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
        "不是。STAGE 是一个信息与备考平台，不代办申请、不收取中介佣金。我们提供经过验证的院校数据与结构化的备考工具，帮助你自己做出更明智的决定。",
    },
    {
      question: "目前覆盖哪些国家和院校？",
      answer:
        "我们已收录全球多所音乐院校与数百个学位项目，覆盖美国、英国、加拿大等多个国家与地区，并在持续扩充。",
    },
    {
      question: "IELTS Lab 是什么？",
      answer:
        "IELTS Lab 是一个结构化的 IELTS 练习与复盘系统：每一道错题都能定位到原文证据，练习记录会沉淀为你的弱点档案与提升轨迹。它不做评分，也不预测分数。",
    },
    {
      question: "IELTS Lab 目前有哪些科目？",
      answer:
        "Reading 已经可以使用，其余科目仍在建设中。院校数据库始终免费，可以先从目标院校的招生要求开始。",
    },
    {
      question: "STAGE 收费吗？",
      answer:
        "浏览院校数据库始终免费。更完整的备考与申请管理功能将采用订阅方案，具体定价即将公布。",
    },
  ] satisfies FaqItem[],
} as const;

export const cta = {
  title: "世界的舞台，比你想象的更近。",
  body: "从每一位认真申请者都需要的院校数据库开始。",
  button: { href: "/schools", label: "探索院校" },
} as const;

/* ----------------------------------------------------------------- /contact */

export const teasers = {
  contact: {
    eyebrow: "联系我们",
    title: "与 STAGE 取得联系。",
    body: "对院校数据、合作或产品有任何疑问，欢迎通过邮件与我们联系。",
    email: "hello@stage.example", // TODO(content): real address
  },
} as const;
