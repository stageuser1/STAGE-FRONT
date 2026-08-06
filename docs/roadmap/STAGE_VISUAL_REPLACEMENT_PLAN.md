# STAGE 视觉替换计划（权威约束总纲）

**日期：** 2026-07-28 · **状态：** 已经业主确认，进入执行
**执行方式：** 每个阶段由独立的 Claude Code 会话（Opus）完成，提示词见 `docs/roadmap/OPUS_STAGE_PROMPTS.md`
**本文地位：** 所有替换工作的最高约束。与任何其他文档（含 `docs/stage-specs/`、`docs/upgrade/`）冲突时，以本文的裁决记录为准。

---

## 0. 权威关系与总原则

1. **这不是融合，是替换。** `design-reference/`（视觉设计导出）与 `docs/stage-specs/`（脱敏版产品规格）是唯一权威的视觉与交互标准。现有工程中所有视觉呈现——布局、组件样式、交互细节、文案——只要新规格有对应定义，一律以新规格为准，不与现状调和。
2. **非视觉层是地基，不动。** 数据接口、状态管理逻辑、路由架构（route groups 不变、不得新建重复路由组）、`lib/ielts/*` 与 `lib/data.ts` 的现有能力，原样保留（详见 §6 保留清单）。
3. **前端设计优先。** 前端设计与后端/数据结构不对齐时，调整后端支撑前端；但后端改动必须是**增量式**（新增字段/集合），不得删除或破坏现有结构，且**每一项都需业主人工批准后才能实施**（见 §7）。
4. **合规红线。** 任何规格文档、代码注释、UI 文案中不得出现同行产品名称（守护脚本见 §4.2）。`docs/upgrade/00–06` 仍是有效的实施参考（组件契约、状态纪律、可达性标准），但视觉与文案层面凡与新规格冲突处失效。

## 1. 裁决记录（新标准的组成部分，不得再议）

| # | 裁决 |
|---|---|
| **C1** | **封杀 Band 估算体系。** 废除 `labEstimate`、估算分数展示、raw→band 换算表。BandGapMeter 改为对比项目要求 vs 用户**自填**分数（自报成绩/自设目标分，沿用"目标分数由用户自设"方案）。`docs/upgrade` 中 WP2/WP5/WP6 相关验收标准同步作废并改写。 |
| **C2** | **做题界面暂缓。** Reading/Listening 做题界面维持现有 vendored iframe 方案，不重写、不 fork。两份做题界面规格归档为未来参考；其中属于 STAGE 自有 chrome 的部分（结果过渡页、逐字文案）照常实施。 |
| **C3+C6** | **Lab 导航与错题本机制暂缓变更。** 维持现有 `(shell)` 顶部导航（总览/题库/套题练习/练习记录/错题本）与错题本纯派生机制；不做左侧栏、不建复盘队列。规格中的左侧栏 IA 仅作视觉语言来源，不作结构依据。 |
| **C4** | **不做"全体平均正确率"。** 该需求删除（无遥测数据，编辑填数违反溯源原则）。 |
| **C5** | **"待核验"禁词仅限 IELTS Lab 界面。** 院校侧 `StatusBadge`/`ConfidenceBadge` 的"高/中/待核验"数据透明体系不受影响，继续使用。 |
| **C7** | **导航栏 CTA 改为「探索音乐院校」**，不暗示注册流程。定价页维持已确认的过渡页方案。 |
| 引导细条 | "个性化引导细条"样式未定稿，由执行方选用简洁细线条样式（细边框、小按钮、可关闭），不阻塞。 |
| 小项1 | 导航"指南"与页脚"术语库"：按定价页先例各建**过渡页**，保住导航结构。 |
| 小项2 | 首页 IELTS Lab 区块配图：**改用 Reading 证据复盘图**（双栏原文高亮 + 错因证据链接，无时间戳），替代原规格的听力复盘大图。 |
| 小项3 | IELTS® 商标免责声明：先按补充规格 §四逐字上线，页内以 HTML 注释标注"待法务核实"。 |
| 小项4 | `docs/stage-specs/` 已替换为脱敏 ASCII 文件名版本，原件已移出仓库（`D:\STAGE-ARCHIVE\stage-specs-original\`）。 |

## 2. 范围盘点（新规格模块 → 被替换的现有文件）

### 2.1 首页（`docs/stage-specs/homepage-spec.md`）→ 阶段 T2

| 模块 | 被替换文件 | 处置 |
|---|---|---|
| 导航栏 | `components/marketing/MarketingNavbar.tsx`、`MarketingMobileMenu.tsx` | 重写；CTA 按 C7 |
| 首屏 | `app/(marketing)/page.tsx`、`components/marketing/HeroAtmosphere.tsx`、`content/landing.ts` | 重写，逐字文案照搬 |
| 进行时双截图 | `AppPreviewCard.tsx`、`IeltsSimPreview.tsx` | 重写为受控 mock 组件；Lab 小卡取"中性打开状态"（不含"已导入自…"）；Lab 区块配图按小项2 |
| 数据条 | `StatItem.tsx` + landing 内容 | 数字构建时从 Directus 实取，与文案不符时以实数为准 |
| 验证机制/Lab/用户场景/转化区 | `components/marketing/sections/**` | 重写，「小标签→大标题→副标题→内容」骨架 |
| 页脚 | `MarketingFooter.tsx` | 重写：指南细项/术语库/联系/备案 + 超大 STAGE 字标 + IELTS® 免责声明 + 官方链接（新窗口） |
| 指南/术语库过渡页 | 无（新建 `app/(marketing)/guides/page.tsx`、`app/(marketing)/glossary/page.tsx`） | 按 `app/(marketing)/pricing` 先例 |
| 旧文案 | `content/landing.ts` 全量（含"雅思实验室"、"AI 分析你的答题表现"等宣称） | 全量替换，清除 AI 分析类宣称 |

不动：`app/(marketing)/pricing`（过渡页维持）、`contact`（仅随壳换样式）。

### 2.2 C1 落地（横切，先于一切重皮）→ 阶段 T1

| 现状 | 处置 |
|---|---|
| `lib/ielts/band.ts` + `tests/ielts_band.test.mjs` | 删除 |
| `SuitePractice.tsx` 估算分数块 + `[用这个估算更新我的档案]` | 移除；结果只留总分/正确率/总用时/分篇明细 |
| `LabOverview.tsx` 目标横幅（含估算） | 替换为**目标分数设定卡**：每科自填 4.0–9.0 步进 0.5，标签逐字`我的目标分数`，说明逐字`目标分数由你自己设定，仅用于个人规划参考。` |
| `DashboardView.tsx` 雅思快照估算 | 改为原生指标（正确率趋势/练习量/最弱题型）+ 自填目标分对照 |
| `components/fit/BandGapMeter.tsx` | 重做：要求 vs 自填值，无估算来源行 |
| `lib/fit/dimensions.ts`、`requirements.ts`、`lib/dashboard/actions.ts`、`readiness.ts` | language 维度只读自填值；缺失 → 待确认 |
| `lib/profile/types.ts` 等 | Profile schema v1→v2：删 `english.labEstimate` 与 `currentSource:"lab_estimate"`，新增分科目标；`migrateProfile` 处理迁移（估算来源的 currentOverall 置空，自报值保留） |
| `docs/upgrade/*` 中 OQ-2 与估算相关验收标准 | 文档同步改写 |

### 2.3 IELTS Lab 现有界面重皮（`ielts-lab-master-spec.md` + `ielts-lab-supplement-spec.md`，扣除 C2/C3/C4/C6 缓行项）→ 阶段 T3

| 模块 | 被替换文件 | 处置 |
|---|---|---|
| 应用壳视觉 | `LabChrome.tsx`、`LabNav.tsx`、`components/ielts/ui.tsx` | 重皮；**导航条目/结构不变**；全站命名统一 "IELTS Lab" |
| 学习总览 | `LabOverview.tsx` | 重写 body：继续条 / 核心指标行四卡 / Reading 模块卡（副标题+事实性要点；其余科目随模块上线才出现，不设占位）/ 最近练习列表 ≤5 条 / 目标分数设定卡（T1 的数据层）/ 新手引导三步横幅（逐字：`选科目`/`去练习`/`复盘巩固`，第三步严禁分数导向表述）|
| 题库列表 | `ExamCatalog.tsx` | 行式布局：标题(英+中)·Part·题型·我的正确率(未练 `—`)·三态状态点·搜索占位逐字`搜索题目`；**无全体平均列（C4）**；筛选/计数逻辑保留 |
| 套题练习 | `SuitePractice.tsx` | 重皮 + 去估算；compose→preview→start 机制不动 |
| 结果过渡页 | `ResultPanel.tsx` | 按 Reading 规格 §三：正确率/`用时 {MM} 分 {SS} 秒`/逐题结果列表/「返回题库」次 +「查看复盘」主（有错题更突出）；交卷确认逐字`还有 {N} 题未作答，确定交卷？` |
| 练习记录 | `PracticeHistory.tsx`、`PracticeAnalytics.tsx` | 时间线视图（练习/复盘/重测事件流）+ 提升追踪折线图（Y 轴正确率，严禁分数刻度）；页名维持"练习记录" |
| 错题本 | `Wrongbook.tsx` | 仅重皮，派生机制不变 |

### 2.4 Reading 证据复盘升级 → 阶段 T4

`components/ielts/review/*`（AttemptReview 为主）升级为双栏模板：左栏原文（`lib/ielts/corpus.ts` `loadExamData` 的 passage.blocks，段落高亮定位，无时间戳）· 右栏题目与作答；遮罩揭示纪律、AttemptPager/QuestionNavigator/EvidenceJump 逻辑保留。展开前不得预取 corpus 脚本。

### 2.5 题型说明参考页 → 阶段 T5

新建 `(shell)/question-types` 页。左侧科目切换（当前仅 Reading 生效）、右侧题型列表：中英名（如 `匹配题 Matching`）+ 大白话说明 + 当前题库题量（来自 `lib/ielts/question-types.json` + `exam-index.json` 实数）。页面标题逐字`题型说明`。入口：题库筛选"题型"维度旁 `?` 图标。严禁混入真题内容或答案。

### 2.6 新科目模块（新建，数据报批后实施）→ 阶段 T6/T7

- **T6 Writing**（`ielts-lab-writing-spec.md`）：任务列表页 + 写作界面；范文以"完成自己的写作"为解锁条件；Hide Task；Task1/2 会话切换。**阻塞于后端增量 #1。**
- **T7 Speaking**（master-spec 批次三）：五步流程（题目→个人想法九维度→答案构建溯源→记忆巩固→独立表达）+ 导出/导入；纯本地数据。**题库来源阻塞于后端增量 #2。**

### 2.7 缓行归档（本阶段不实施）

Listening 全模块（做题/复盘/套题/会话历史）· 原生 Reading/Listening 做题界面 · 复盘队列 + 左侧栏 IA · Reading 套题会话历史。

## 3. 阶段与顺序

| 阶段 | 内容 | 前置 |
|---|---|---|
| T0 | 设计基座：从 `design-reference/STAGE IELTS Lab.html` 提取视觉规范并更新 App family `stage-*` tokens；建 guard 脚本 | — |
| T1 | C1 废估算 + Profile v2 | T0 可并行，但须先于 T2/T3 |
| T2 | 首页替换 + 指南/术语库过渡页 | T0、T1 |
| T3 | Lab 现有界面重皮 + 命名清洗 | T0、T1 |
| T4 | Reading 证据复盘升级 | T3 |
| T5 | 题型说明参考页 | T3 |
| T6 | Writing 模块 | 后端增量 #1 获批 |
| T7 | Speaking 模块 | 后端增量 #2 获批 |

## 4. 通用验收门槛（每阶段必过）

### 4.1 工程门槛

1. `npm run typecheck`、`npm run build`、`npm run test`（含 `test:lib`）全绿。
2. 构建路由表与改动前一致（本阶段声明的新增路由除外）；无路由退化为动态渲染。
3. 375 / 768 / 1280 无横向页面滚动（用 read_page / javascript_tool 验证——**本机浏览器截图会挂起，禁止依赖截图**）。
4. 键盘可达、`prefers-reduced-motion` 生效、状态不单靠颜色。
5. 无新 npm 依赖；Tailwind 维持 v3；无文件命名为 `export.ts`；无新建含 `ielts-lab` 的路由组；新组件中无 `window.confirm/alert`。

### 4.2 Guard 脚本（T0 建立，此后每阶段跑）

`scripts/guard.mjs`，加入 `package.json` scripts（`npm run guard`），检查项：

1. **同行名称零命中（全仓，含 docs/）。** 黑名单以 base64 存储于脚本内（禁止明文），解码后逐一全文匹配（含大小写变体）：
   `["6Jm+5ruR5ZCs5Yqb","5Lmd5YiG5a2m6ZW/","SUVMVFMgTWFzdGVy","T25lSUVMVFM=","TW9ja0lFTFRT","VmVyc2Vv","TGFuZ2FyZA=="]`
2. **估算体系零残留（全仓代码）：** `labEstimate`、`estimateBand`、`BAND_TABLE`。
3. **Lab 禁词（仅 `components/ielts/**`、`app/(ielts)/**` 的 UI 字符串）：** `估算`、`倒计时`、`模考`、`待核验`、`待公布`、`雅思实验室`。院校侧不检查（C5）。
4. **结构守护：** 重复 `ielts-lab` 路由组、`export.ts` 文件名。

排除目录：`node_modules`、`.next`、`design-reference`（第三方导出物）、`scripts/guard.mjs` 自身。

### 4.3 交付纪律

- 每阶段完成且验收通过后在 `main` 上 commit（沿用仓库现有提交风格，如 `feat(ui): …`），**不 push**，不改无关文件。
- 阶段报告：改了什么、验收结果逐项、遗留问题；发现超出本阶段范围的问题只记录不顺手修。

## 5. 各阶段专项验收

- **T0**：token 对照表产出（`docs/roadmap/T0_TOKEN_MAP.md`：新旧值映射+设计出处说明）；变更后全站构建通过且 **Explore family 视觉零变化**；`npm run guard` 可运行且当前仓库通过（若首页旧文案含禁词，在 T2 前对 guard 做白名单标注并在 T2 移除）。
- **T1**：全仓 grep `labEstimate|estimateBand|BAND_TABLE` 零命中；v1 档案自动迁移 v2（自报分保留、估算来源置空）且 `tests/profile_migrate.test.mjs` 覆盖；BandGapMeter 仅呈现要求 vs 自填值；套题结果无任何分数换算；`docs/upgrade` 相关验收标准已改写。
- **T2**：逐字文案与规格逐条比对（徽章/双句标题/副标题/信任行/三卡/验证三步）；导航 CTA=「探索音乐院校」，无注册暗示；数据条为实取数字；页脚免责声明逐字 + 官方外链新窗口 + 超大字标；两处截图 mock 无估算/Band/AI 评估元素；指南、术语库、定价三个过渡页可达且样式一致；`content/landing.ts` 无"雅思实验室"与 AI 分析类宣称。
- **T3**：逐页对照规格；总览无估算卡、目标分数卡文案逐字、无科目占位卡；题库无全体平均列、未练显示 `—` 非 0；结果过渡页按钮/确认文案逐字；LabNav 条目与改前完全一致（C6 证据）；错题本行为回归（最近一次全对即出列）。
- **T4**：左栏原文懒加载（行展开前无 corpus 脚本请求）；错题「查看证据」→ 左栏滚动+段落高亮；遮罩纪律保持（首屏全遮、揭示不持久化）；练习记录数据零改动。
- **T5**：每题型中英名+说明+实数题量；无真题内容；`?` 入口就位。
- **T6/T7**：解锁条件手工路径验证（写作为空/字数 0 时范文不可见；Speaking 答案构建无 AI 生成按钮、独立表达无录音元素）；Writing 无红色警示、无评分文案；Speaking 导出/导入往返无损。

## 6. 非视觉层保留清单（替换时不得连带破坏）

1. **路由架构**：四个 route group 与全部现有路由；`practice/[examId]` 留在 `(shell)` 外；404 语义（`notFound()` 修复）不回退。
2. **Vendored 播放器链路**：`public/ielts/**`、`ExamRunner` postMessage 桥 + 握手重试 + `isTrustedRunnerEvent`、`lib/ielts/messages.ts`。
3. **本地存储契约**：`stage.*` 全部键名、payload 内版本号、`PracticeRecord` v2.1.0 不可变追加、`stage.profile` 迁移机制（T1 经由该机制升 v2）。
4. **`lib/` 纯函数层**：`lib/ielts/*` 全部、`lib/data.ts` 与 `data/types.ts` 公共字段边界、`lib/search/*`、`lib/explore/*`、`lib/fit/*`（仅按 T1 改输入源）、`lib/profile/*` 机制、`lib/dashboard/*`。
5. **Reviewer 体系**：`lib/directus-auth.tsx`、`components/reviewer/**`、School/Program 页所有可编辑卡的编辑路径（最高回归风险点，T2/T3 后必须抽查）。
6. **院校侧数据透明词汇**：`StatusBadge`/`ConfidenceBadge`/来源引用块的"已核验/待核验/核验于"体系（C5）。
7. **工程约束**：CI 门、构建确定性（保留 `.next/cache`，Google 字体下载重置会导致 build 假成功）、无新依赖、移动端溢出修复。
8. **交互纪律**（蓝图标准继续适用）：五态页面契约、`null ≠ 0`、遮罩揭示、状态非仅颜色、键盘可达。

## 7. 后端/数据增量审批清单（未批不动，批后仍为增量式）

| # | 增量 | 内容 | 状态 |
|---|---|---|---|
| 1 | Writing 任务库（新集合，如 `ielts_writing_tasks`） | Task1/Task2、图型分类（数据图/流程图/地图/示意图）、题干、配图、难度、预计用时、策略提示（仅方法论） | **需要人工批准** — T6 会话先产出数据契约提案并停下等批 |
| 2 | Speaking 题库（新集合或静态语料包，二选一待业主定） | Part1/2/3 题目卡；用户素材全部本地不上传 | **需要人工批准** — T7 会话同上 |
| 3 | Listening 语料（音频+transcript+时间戳+题目数据） | 缓行备案，排期时再批 | 暂不申请 |
| 4 | 首页数据条取数 | 现有 `getAllSchools/getAllPrograms` 构建时计算，无 schema 变更 | 无需批准，已报备 |
| 5 | `docs/upgrade/06 §5` 原有待批项 | 与本次无直接依赖 | 维持原状 |

## 8. 环境注意事项（每个执行会话必读）

- Windows 10 / PowerShell 5.1；Bash 工具可用于 POSIX 脚本。
- **浏览器面板截图在本机会挂起**：QA 一律用 `read_page` / `javascript_tool` / `get_page_text`。
- dev server 用浏览器面板的 preview 机制启动，不用 Bash 起服务。
- 构建偶发"exit 0 但无产物"：与 Google 字体下载重置有关，保留 `.next/cache` 可避免；build 后核实产物存在。
- `docs/stage-specs/` 已是脱敏 ASCII 文件名版本；原件在仓库外，不要找回、不要引用其内容细节。
