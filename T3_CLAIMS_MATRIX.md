# T3 声称 ↔ 代码 ↔ 测试 对照表

**目的**:把「文档写下承诺、靠一处独立代码兑现、两者悄悄漂移」这条通道关掉。

这是 `T2_CLAIMS_MATRIX.md` 之后的第二份样本,也是 T3–T6 统一交付标准的一部分。

T3 走了三轮对抗评审(T3-R3 六高危四中危、T3-R4 一高危四中危、T3-R5 两条),
每一轮的发现都是同一个模式:**规则写在文档和代码注释里,但没有任何东西阻止它被改回去**。
「空容器不渲染」在卡片上做到了、详情页漏了;「形态①正向判定」修了 living_cost、
漏了 tuition;「条件不得归错」用关键词表实现,而关键词表可以被绕过。

对抗评审能发现这些,但它靠人力,且只能发现当时存在的那几条。这张表换一种做法:
把所有声称性陈述抽出来,逐条指认**兑现它的代码**与**钉死它的测试**。

- 抽取范围:蓝图 §0.4 / §1.5 / §2.1 / §2.2 / §3 全文,加 T3-R3 / R4 / R5 三轮裁决
- 测试编号:`lib:XX` = `tests/program_v3_rendering.test.mjs`(纯规则,`node --test`);
  `dom:XX` = `tests/dom/program-card-v3.dom.test.tsx`(需要文档才能断言的,`vitest`)
- 两个 runner 的分工沿用本仓库既有约定(见 `vitest.config.mts`):
  **纯规则永不通过组件断言**——组件测试失败时你分不清是规则坏了还是标记坏了

统计:**66 条声称(A–I 九组),全部有代码位置与测试;98 tests OK
(`tests/program_v3_rendering.test.mjs` 54 + `tests/dom/program-card-v3.dom.test.tsx`
44),typecheck 0 error。**

> 写这张表的过程本身就抓到一处漂移:G5(推荐信去重)原本被写成「断言寄生在
> `dom:K1`」,而 `dom:K1` 根本没断言它。矩阵指向一个不存在的断言,正是这张表
> 要消灭的东西——已补 `dom:M4` 专项测试。

> **T3-R6(2026-08-03,跨 ticket 缺陷)。** `cost_estimate_rmb.min`/`.max`
> 的单位是元,T3 的 mock 数据与 `costBlockLine` 的渲染逻辑曾**共享同一个
> 错误假设**(两边都当成「万」),互相印证,61 条声称矩阵与四轮 Codex 评审
> 都没发现——因为没有任何东西不一致。真实 T1b 数据(570000/600000)一接入,
> 生产构建的 Web Card 渲染出「¥570000–600000 万元人民币」(= 57 亿)。
> 由 T5 在做真实数据碰撞时发现并上报。修复:F15/F16(本表)。教训写进了
> `stage-v3-t3-state` 记忆——mock 与代码的一致性不能替代对真实数据的验证,
> 这正是 T2 的教训(六轮评审没发现、真实数据一次跑出来)在 T3 上重演。

> **T3-R7(2026-08-03,Codex 复核 T3-R6 修复本身)。** 第一版修复(除法后
> `toFixed()`)自己就重犯了它声称要防的错:`toFixed()` 是舍入,`9999` 与
> `10001` 都被它显示成干净的「1 万」,契约违反被掩盖而不是被揭穿——函数
> 注释说「只除法不舍入」,代码却在下一行舍入,是这个项目反复出现的
> 「声称与代码不符」家族的又一例,这次说谎的是函数自己的注释。裁决:改
> 为契约校验(`isWanAligned()`),违反 → 整块降级为原币种、`console.warn`
> 留痕,而不是想办法把不该出现的数字显示得好看。新增 F17/F18/F19。
> `toFixed(1)` 与 `toFixed(2)` 的说法不一——核实后确认实现从始至终只有
> `toFixed(2)` 一个版本(从未出现过 `toFixed(1)`),现已随函数整体移除。

> **本轮补测试时抓到一个线上 bug**(见 E6):`Math.ceil(-0.5) === -0`,而 `-0 < 0`
> 为 **false**。当天早些时候刚过期的截止日会被判成「未截止」,渲染出
> 「距截止 **-0** 天」并保持开放态样式。三轮人工评审 + 三轮浏览器目检都没看见它——
> 因为目检永远发生在某个具体时刻,而这个 bug 只在「截止日 = 昨天、且现在过了午夜」
> 这个窗口里出现。**这就是补测试的价值证明**:它不是把已知结论再确认一遍,
> 是把没人想到要看的那一格填上。

---

## A. 反 cloaking 红线(§0.4 / §1.5)

页面上不存在人为 CSS 弱化或隐藏的可见文本;machine-only 仅指 JSON-LD 与 metadata。

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| A1 | 折叠区内容**真实存在于服务端渲染的 DOM**,是 CSS 折叠而非点击后请求 | `RequirementsExpand`(`<details>`,无 fetch) | `dom:K1`(断言 `<details>` 无 `open`,但材料/曲目/英语要求全在其 `textContent` 里) |
| A2 | 原文证据同受此约束 | `SourceEvidenceList` | `dom:K3` |
| A3 | **任何**可见文本都不得被 CSS 截短或隐藏,不分重要性(T3-R3.9) | 全部组件(无 `truncate`) | `dom:K2`(九个 fixture × 六类禁用类名全扫) |
| A4 | JSON-LD 是唯一的 machine-only 投影,**不得**用它满足可见性断言 | `ProgramJsonLd`(T4) | `visibleText()` 在断言前剥离 `<script>`,`dom:` 全组共用 |

## B. §3.1 缺失降级:null → 不渲染,且永不出现占位符

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| B1 | 字段为 null → 该行/该块**不渲染**,禁止「暂无」「N/A」占位 | 各组件条件渲染 | `lib:A1` `lib:A3` `dom:S1`(九 fixture × 卡片与详情页 × 七个禁用词全扫) |
| B2 | 格式化函数对 null 返回 null,不回落到字符串 | `formatDateZh` / `formatYearMonth*` / `costBlockLine` / `deadlineState` | `lib:A1` |
| B3 | 无法解析的输入同样返回 null,不原样输出 | 同上(正则不匹配即 null) | `lib:A2` |
| B4 | **「该块不渲染」指容器本身不进 DOM**,空壳 `<div>`/`<dl>` 不算(T3-R3.1) | 块组件自持间距 + 返回 `null`;`KeyNumbers` 自持 `<dl>` | `dom:J1` `dom:J2` `dom:J4` |
| B5 | 详情页同受此约束,不只是卡片(T3-R4.2) | `RequirementsTable`(行数组化)、`RepertoireSection`、`RelatedProgramsSection` | `dom:J3` |
| B6 | 相关专业按 href **先过滤再判空**,不在 `.map()` 里返回 null | `RelatedProgramsSection` | `dom:Q3` |
| B7 | `null ≠ Not Required`:`Unknown` 渲染为无,不渲染成「无需」 | `fiveStateZh` / `auditionFormatZh` | `lib:B1` |
| B8 | 词表外的值一律不采信 | 同上(`?? null`) | `lib:B2` |
| B9 | 只有显式 `Not Required` 才产出「无需」措辞 | `FIVE_STATE_ZH` | `lib:B3` |
| B10 | 第五态 `Conditional` 不落到需要/无需任一侧(T3-R3.8) | `FIVE_STATE_ZH.Conditional = "有条件要求"` | `lib:B4` |
| B11 | 无单位的数字不是事实:申请费缺币种 → **整行不渲染**(T3-R3.2) | `RequirementsTable` 的 `push("申请费", …)` | `dom:O1` |
| B12 | 中文名缺失回退英文是**降级不是编造**(核心原则 6,Codex 该条判断不采纳) | `ProgramCardV3` / `ProgramDetailV3` 的 `??` | `dom:O2` |

## C. §3.2 条件字段:归错比啰嗦更糟(T3-R4.1 / R5.1)

`application_requirements.conditional_notes` 是**表级**字段,可以是关于作品集、
申请费、截止日的条件,不专属英语。

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| C1 | 条件说明必须与基础值**合并展示**,不得被吞掉 | `ConditionLine` + `RequirementsExpand` | `dom:N2` `dom:N4`(九 fixture 的每条非空 conditional_notes 都断言上页) |
| C2 | **默认独立成行**;并入英语行是窄例外(判定方向,非词表) | `conditionIsPurelyLanguage()` | `lib:G1` `dom:N1` |
| C3 | 并入需**同时**满足:命中语言词 **且** 不命中任何其他材料词 | 同上(两道闸门) | `lib:G1` `lib:G2` |
| C4 | **否决优先于命中**:同时出现两类词时否决必须赢 | `OTHER_REQUIREMENT_HINTS` veto | `lib:G4`(此条一旦改回「命中即并入」会先失败) |
| C5 | Codex 构造的绕过串一律不并入 | 同上 | `lib:G1`(12 条:含其原始两条 +「面试用英语进行」+ 英文构造) |
| C6 | 保守规则没把真语言条件全否掉 | 同上 | `lib:G2`(5 条纯语言条件仍并入) |
| C7 | 大小写不影响判定 | `toLowerCase()` | `lib:G5` |
| C8 | 详情页条件行**逐条标明它限定的是哪项要求** | `ConditionLine` 的 `label` | `dom:N3` |
| C9 | 豁免细则指向官网来源;**无匹配来源则不给链接**,不指向任意页 | `sourceUrlForField()` | `lib:H1` `lib:H2` |

## D. §3.3 长文本

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| D1 | 曲目要求按**字符**截断,常量 80,禁止纯 CSS 截断 | `truncateChars` / `REPERTOIRE_TRUNCATE_LENGTH` | `lib:C1` `lib:C2` `dom:P1` |
| D2 | 恰好 80 不截断,81 才截断 | 同上(`<=` 边界) | `lib:C2` |
| D3 | 按字符而非码元:代理对不被劈开 | `Array.from()` | `lib:C3` |
| D4 | 截断位置跨设备一致 | 纯字符串运算,不依赖字体度量 | `lib:C4` |
| D5 | **无详情页出口时不截断**,整段展示(T3-R4.4) | `RequirementsExpand` 的 `detailHref` 分支 | `dom:P2` |
| D6 | 展开区 `pre-wrap` + max-height 200px + 内滚动 | `RepertoireSection` / 无 slug 分支 | 见残留风险(计算样式未自动化) |

## E. §3.4 时间态与 freshness

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| E1 | 截止角标三态由前端 `now()` vs deadline 计算 | `deadlineState()` | `lib:D1`–`D5` |
| E2 | 与 freshness **无关** | 函数签名不含 freshness 入参 | `lib:D6`(四种 freshness 下结果恒等) |
| E3 | 已过 → closed;30 天内 → closing;超过 → open | 同上 | `lib:D1` `lib:D2` `lib:D3` `lib:D5` |
| E4 | 截止当天仍算开放 | 同上 | `lib:D4` |
| E5 | 角标**客户端计算,不进 SSR**;事实(日期)必须进 SSR(T3-R3.7) | `DeadlineBadge`(`"use client"` + `useEffect`) | `dom:L1`(日期在)`dom:L2`(角标不在)`dom:L3`(水合后出现)`dom:L4` |
| **E6** | **刚过期的截止日必须判 closed,不得因 `-0` 判成开放** | `deadlineState()` 改按日历日,`Math.round` + midnight floor | `lib:D1b`(三个时刻)**← 本轮抓到的线上 bug** |
| E7 | 天数在一天之内不抖动(同一截止日任何时刻同一读数) | 同上 | `lib:D1c`(四个时刻读数恒等) |
| E8 | `freshness=unknown` → **不渲染状态旗** | `freshnessLabel()` 返回 null | `lib:E1` |
| E9 | unknown 时不得出现任何「未检测到变更」类表述 | 同上 | `lib:E2`(该措辞只允许存在于 current_season 一处) |
| E10 | `outdated_season` 把「上一申请季」前置(人类裁决的措辞) | `FRESHNESS_LABEL` | `lib:E3`(并断言不以「官网核实」开头) |
| E11 | `changed` 措辞不含申请季,色调为红 | 同上 | `lib:E4` |
| E12 | 核实**月份**只到月不到日(§3.4 原文) | `formatYearMonthZh()` | `lib:E5` |
| E13 | `days_since_update` 仅内部参考,不参与任何渲染判定 | 组件不读该字段 | `lib:D6` + 代码中无引用 |

## F. §3.6 费用块三形态:一律正向判定

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| F1 | 形态①:官方 CoA 生活费 + 学费 + FX 齐全 | `costBlockLine()` | `lib:F1` |
| F2 | 形态②:`config_estimate` 生活费,**强制**输出第三方估算免责语 | 同上(类型上不可缺) | `lib:F2` `dom:R1` |
| F3 | 形态①② **一律**带汇率月份免责语 | `CostBlockLine` 联合类型把 `fxDisclaimer` 定为 `string` | `lib:F3` `dom:R1` |
| F4 | 形态③ 不带汇率与构成措辞 | `tuitionOnlyLine()` | `lib:F4` `dom:R2` |
| F5 | `fx_rate` 或 `fx_snapshot_date` 任一缺失 → 降级形态③(T3-R3.4) | `costBlockLine()` 双检查 | `lib:F5` `lib:F6` |
| F6 | `fx_rate` 非有限/非正/字符串 → 不当成有效汇率 | `Number.isFinite` + `> 0` + `typeof` | `lib:F7`(五种坏值) |
| F7 | 降级时币种取自 **component**,不取自块(块仍标 CNY) | `tuitionOnlyLine()` 读 `tuition.currency` | `lib:F8` `dom:R2` |
| F8 | 形态①/② **不得靠反推**,须直接读 `components[].source_type`(T3-R4.3) | `living.source_type` 正向分支 | `lib:F9` `lib:F11` |
| F9 | 无生活费组件 → 不判形态①,降级 | 同上 | `lib:F9` |
| F10 | 无学费组件 → 不判形态①②;无学费可显示 → **整块消失**(T3-R5.2) | `!tuition \|\| !living` → `tuitionOnlyLine` → null | `lib:F10` `dom:R3` |
| F11 | 生活费 `source_type` 越界 → 降级,不猜测 | 同上 | `lib:F11` |
| F12 | 完全无学费的形态③ → null(不输出 0) | `tuitionOnlyLine()` | `lib:F12` |
| F13 | 构成小字**只能来自** component 自带的 `composition_note`,前端不编写 | `living.composition_note ?? null` | `lib:F13` |
| F14 | 学费周期如实渲染,不假定按年 | `PERIOD_SUFFIX_ZH` | `lib:F14` |
| **F15** | `cost_estimate_rmb.min`/`.max` 单位是**元**,不是万(T3-R6) | `costBlockLine()` 内联除以 10,000 | `lib:F15`(T1b 真实数值 570000/600000 → 「57–60 万」)`dom:U2` `dom:U3` |
| **F16** | JSON-LD 的 `offers.priceSpecification` 直接用 `cost.min`/`.max`,**不再 ×10000** | `lib/program-v3/json-ld.ts` 的 `minPrice`/`maxPrice` | `dom:U4` |
| **F17** | `min`/`max` 必须是万的整数倍(§1.4/T2-R2 契约);违反契约 → **拒绝显示**,整块降级为原币种学费,不是"想办法显示得好看"(T3-R7.1) | `isWanAligned()`,`costBlockLine()` 在构建①②返回值前校验 | `lib:F17`(9999/10001/12345 三个真正暴露过旧实现`toFixed()`舍入行为的输入,均断言降级) |
| **F18** | 只要 `min`/`max` 任一侧违反契约,**整体**降级,不能一侧合规就放行 | 同上 | `lib:F18` |
| **F19** | 合规输入(含 T1b 真实取值)不被契约校验误伤 | 同上 | `lib:F19` |

## G. §2.1 卡片结构冻结为七块

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| G1 | 七块顺序冻结,不得重排 | `ProgramCardV3` | `dom:M1`(按 DOM 结构断言块序列) |
| G2 | 状态条之后**不得有第八块或游离 CTA**(T3-R3.6) | 同上(尾部链接已并入块 2/块 6) | `dom:M2` `dom:M3` |
| G3 | 金标签 UI 截断为前 2 个,截断在前端 | `BadgeRow` 的 `slice(0, 2)` | `dom:M1`(块 4 存在);全量数组归聚合页与 AI 层 |
| G4 | 材料清单**严格数据驱动,零硬编码** | `buildMaterialsChecklist()` | `dom:M4`(稀疏 fixture 无清单)`dom:J4` |
| G5 | `required_materials` 已含推荐信时不重复追加(T3-R3.11) | `RECOMMENDATION_IN_PROSE` 去重 | `dom:M4`(散文含「两封推荐信」→ 无「推荐信 ×2」;散文未提 → 补「三封推荐信」) |
| G6 | 语义化 HTML:`<article>` + `<dl><dt><dd>` | `ProgramCardV3` / `KeyNumbers` | `dom:M1` `dom:J2`(选择器依赖这些标签) |

## H. §2.2 详情页

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| H1 | 模块顺序冻结:导语 → 完整要求表 → 曲目 → 原文证据 → 特殊条件 → 相关专业 → 对比/收藏 | `ProgramDetailV3` | `dom:Q1`(标题序列精确断言) |
| H2 | 要求表**之前不得插入**其它模块(T3-R3.5) | 同上(header 只留身份 + 导语) | `dom:Q1` |
| H3 | 编辑观点与金标签不出现在详情页(§2.2 未列入,故未另造模块) | 同上 | `dom:Q2` |
| H4 | 费用并入完整要求表,不另立模块 | `RequirementsTable` 的费用行 | `dom:Q1`(标题序列中无费用模块) |
| H5 | 曲目细则 `pre-wrap` | `RepertoireSection` | 见残留风险 |
| H6 | URL 为 `/{school-slug}/{program-slug}` 形态 | `programDetailHref()` | 见 T3b(生产路由未迁移) |

## I. 身份、来源与订阅

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| I1 | 「数据更新时间」= max(retrieved_date),**渲染时计算不落库** | `latestRetrievedDate()` | `lib:H3` |
| I2 | 无来源 → 返回 null,不编造 | 同上 | `lib:H3` |
| I3 | 来源域名去 www;坏 URL 原样返回不抛错 | `sourceDomain()` | `lib:H4` |
| I4 | 对比/收藏键**包含学校**,不同学校的同专业同学位不得撞键 | `programOfferingRef()` | `lib:I1` |
| I5 | 无截止日 → 不生成 `.ics` | `icsDataUri()` | `lib:I2` |
| I6 | `.ics` 内含该截止日期 | 同上 | `lib:I3` |

---

## 怎么用这张表

**每次改代码或改文档时**:若改动触及上表任一行,同时更新代码、文档措辞与测试三者;
只改其中两者,第三者会失败。这是刻意的。

**新增声称时**:先写测试再写文档。一条没有测试编号的声称,是下一轮评审的原料。

**T4–T6 交付模板**:每个 ticket 完成时附一张同构的表。T4 已在同一目录开工
(`ProgramJsonLd` / `CitationLine`),它改动了 `FreshnessBar` 与 `ProgramCardV3`——
上表的 `dom:` 组正是防止这类改动无声破坏 T3 保证的东西,已验证 T4 当前状态全绿。

---

## 已知残留风险(评估后接受,不再加固)

1. **计算样式未自动化**(D6 / H5)。`dom:K2` 扫的是 markup 里的类名,不是浏览器
   计算后的 `getComputedStyle`。`max-height` / `pre-wrap` / `opacity` 这类只有真实
   排版才能确认的性质,目前靠浏览器目检(本轮已跑,`violations: []`)。
   要自动化需引入无头浏览器,判定为收益不抵成本。

2. **mock 不是真实数据 —— 这条风险已经兑现过一次。** T2 的教训是「六轮对抗
   评审没发现的缺陷,真实数据一次跑出来了」(Directus 把 decimal 序列化成
   字符串);T3-R6 是同一件事在 T3 上重演:mock 与 `costBlockLine` 共享同一个
   错误的单位假设,61 条声称、四轮评审都没发现,直到 T1b 真实包(2026-08-03
   接入,`data/v3/real/juilliard-vocal-arts-pilot.json`)一渲染就现形。
   现状:**T1b 一个真实包已进前端**(`data/v3/real-programs.ts`,仍只挂在
   `/v3-preview`),但仍只是一个学校、一个 Vocal Arts pilot——大部分组合
   (其它学校、其它费用来源国、大规模真实数据的分布)仍未验证。上表的绿色
   **不能替代**继续接更多真实数据这一步。

3. **条件归属仍是启发式**。C2–C7 钉死的是**判定方向**(默认独立、否决优先),
   不是词表完备性。词表外的同义词(如「面谈用英语进行」)仍会误并——
   已裁决接受,根治挂在 T2b(字段级拆分)。扩充 `OTHER_REQUIREMENT_HINTS`
   永远安全,扩充 `LANGUAGE_CONDITION_HINTS` 才会重开风险,这条不对称性
   写在函数注释里。

4. **这张表本身也会漂移**。与 T2 矩阵不同,本表没有「表与代码一致性」的自动校验
   (T2 的 C10/C14 那种)。测试编号是人工维护的。已知,接受。
