# T7 声称 ↔ 代码 ↔ 测试 对照表

> **状态:已结项(2026-08-05)。** Codex 评审通过;其后按五条人类裁决做的收尾
> (T7-R6 提示句收窄、T7-R7 删重复行、T7-R8 token 追认,以及金标签统一色与
> 「只有 1 所学校」两条确认接受)**无新增逻辑**,人类判定不再复评。
> 未完成的部分不是遗留缺陷,而是文末「已知限制」与
> `T7_REVIEW_HANDOFF.md` §3 的四条**待办**,交后续 ticket。

**目的**:同 `T3_CLAIMS_MATRIX.md` / `T4_CLAIMS_MATRIX.md` / `T5_CLAIMS_MATRIX.md`
—— 把「文档写下承诺、靠一处独立代码兑现、两者悄悄漂移」这条通道关掉。每条声称都
指认**兑现它的代码**与**钉死它的测试**;只做过一次的人工动作不许写进主表冒充测试
(T4-R1 的教训),一律单列到文末「交付时人工验证项」。

- **抽取范围**:T7 ticket 原文(页面结构 / 三层联动 / URL 同步 / 反 cloaking /
  设计 token / 外壳 / 响应式)+ 蓝图 §0 核心原则、§2.1 卡片结构、§3 渲染手册
  + 本轮八条人类裁决(见下)。
- **测试编号**:两个文件、两个 runner。
  - **M/U/T 组**在 `tests/t7_schools_browse.test.mjs`(`node --test
    --experimental-strip-types`,与 T3 的 `lib:` / T4 的 `ai:` 同一个 runner)。
    表内以 `describe` 名 + 用例名定位,例如 `t7:model —「无参数 → 第一所…」`。
  - **D 组**在 `tests/dom/schools-browse.dom.test.tsx`(vitest / jsdom)。反
    cloaking 的断言全部走 `renderToStaticMarkup`(= 没有 JavaScript 的爬虫看到的
    东西),联动与 URL 走 `render()`。
- **统计:主表 37 条声称,全部有代码位置 + 自动化测试钉死。** 另有 **6 条**交付时
  人工验证项,单列一节,**不计入 37**。
  逐组行数:A 6 + B 4 + C 6 + D 6 + E 9 + F 3 + G 3 = **37**。
- **测试用例数:89**(`node --test` 64 + vitest 25)。与声称数不相等是正常的:
  token 组一条声称由几十条逐值用例覆盖,而联动组一条用例常同时钉死两条声称。

> **本版修订(2026-08-05 T7 交付确认)**:三条裁决改了实现 —— T7-R6(提示句收窄,
> A6)、T7-R7(删掉重复的截止日期行,E8/E9)、T7-R8(两处 token 追认,F3)。金标签
> 三色统一(交付确认第 2 条)与 1 所学校(第 5 条)确认为已知限制,留在文末。

## 本轮人类裁决(2026-08-05)

| 编号 | 冲突 | 裁决 |
|---|---|---|
| T7-R1 | `/schools/{s}/{p}` 已是 T3b 的 §2.2 详情页,T7 又要求它渲染浏览页 | **浏览页接管该 URL,§2.2 详情页降级为同页大卡** |
| T7-R2 | `/schools` 已是现有 Directus 探索页 | **整页替换** |
| T7-R3 | T7 的大卡七行缺了 §2.1 冻结的编辑观点/截止角标与 T4 的每页引用块;「详细要求」又是详情页 `RequirementsTable` 的两列形状 | **保 §2.1 全部块,详细要求用 label-value 表** |
| T7-R4 | T7 要求未知 slug「不报错」,而现路由是 404 | **服务端保 404,客户端才回退** |
| T7-R5 | 导航「申请日历」、页脚「数据来源说明」「更新频率」在仓库里没有路由 | **渲染成纯文字,不给 href** |
| T7-R6 | 提示句承诺「可溯源至官网」,但四个溯源模块没有生产入口 | **改为「每条信息标注官网核实时间」**,承诺收窄到能兑现的程度 |
| T7-R7 | 「申请截止日期」在同一张卡上出现两次 | **删掉详细要求表里那行**;只在 T7 卡上过滤,共享定义不动 |
| T7-R8 | 两处实现期补齐的 token | **追认**,纳入冻结 token 集 |

---

## A. 四层结构与数据 —— 6 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| A1 | 页面自上而下是四层:提示句 → 学校 tab 行 → 专业小卡条 → 大信息卡 | `components/schools/browse/SchoolsBrowse.tsx` | `t7:dom —「提示句 / tab 行 / 小卡条 / 大卡 四层齐备」` |
| A2 | 提示句为「截至 {当前年月} · 已收录 {N} 所音乐院校 · 每条信息标注官网核实时间」(结尾措辞的由来见 A6),**N 从数据算出,不硬编码** | `browseLede()`(`lib/schools-browse/model.ts`) | `t7:model —「提示句的院校数从数据算出,不硬编码」`(1 所 / 2 所两组) |
| A3 | 小卡两行:第一行「{专业中文名} · {学位缩写}」,第二行「截止 {日期}」 | `browseChipTitle()` / `browseChipDeadline()` | `t7:model —「小卡第一行…」`「小卡第二行…」;`t7:dom —「小卡两行…」` |
| A4 | 截止日为 null → 第二行显示「截止日期未公布」(T7 对 §3.1「null 该行不渲染」的**显式覆盖**,理由写在 `browseChipDeadline` 注释里) | `browseChipDeadline()` | `t7:model —「截止日为 null → 「截止日期未公布」…」`;`t7:dom —「截止日为 null 的小卡…」` |
| A5 | 学校与校内专业都按数据自身顺序排列;中文校名缺失回退英文(核心原则 6);没有 `publishing.slug` 的项目不进入模型(它没有可推送的地址) | `buildBrowseModel()` | `t7:model —「按学校分组,校内与校间都保持数据自身顺序」`、`「中文校名为主…」`、`「没有 publishing.slug 的项目不进入模型…」`、`「多校时每所学校只出现一次…」` |
| A6 | 提示句结尾是「每条信息**标注官网核实时间**」,**不是**更强的「可溯源至官网」(裁决 T7-R6):原文证据等四个模块目前没有生产入口,承诺不能大于兑现。恢复后可改回,改回的条件与同步点写在 `T7_REVIEW_HANDOFF.md` 待办 1 | `browseLede()` + 其上方注释 | `t7:model —「提示句不承诺溯源,只承诺标注核实时间」`(断言结尾字串,并断言全句不含「溯源」—— 这条用例存在的意义就是不让它在模块恢复前悄悄改回去) |

## B. 三层联动 —— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| B1 | 页面加载默认选中第一所学校 + 该校第一个专业 | `resolveBrowseSelection()` + `SchoolsBrowsePage` | `t7:model —「无参数 → 第一所学校的第一个专业」`;`t7:dom —「加载即选中第一所第一个…」` |
| B2 | 点学校 tab:小卡条换成该校的,**自动选中该校第一个专业**,大卡同步切换 | `SchoolsBrowse` 的 tab `onClick` | `t7:dom —「点学校 tab:小卡条换成该校的,并自动选中该校第一个专业」` |
| B3 | 点专业小卡:仅大卡切换 | `SchoolsBrowse` 的 chip `onClick` | `t7:dom —「点专业小卡:仅大卡切换,同一时刻仍只有一张可见」` |
| B4 | 同一时刻只有一张大卡可见;选中态以 `data-selected` 落在 tab 与小卡上(供 CSS 画选中样式) | `SchoolsBrowse`(`hidden` + `data-selected`)、`browse.module.css` 的 `[data-selected="true"]` | `t7:dom —「加载即选中…」`、`「点专业小卡…」`、`「选中态标记落在 tab 与小卡上」` |

## C. URL 同步 —— 6 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| C1 | 切换用 `history.pushState` 更新到 `/schools/{school-slug}/{program-slug}`;school-slug 取 `schools.slug`,program-slug 取 `publishing.slug` | `browseHref()`;`SchoolsBrowse.select()` | `t7:model —「browseHref 就是 /schools/{school}/{program}」`;`t7:dom —「切换用 pushState 写 …」`、`「点学校 tab…」`(断言 `location.pathname`) |
| C2 | 直接访问该 URL:页面加载即选中对应学校与专业 | `SchoolsBrowsePage`(server)把 params 交给 `resolveBrowseSelection` | `t7:model —「完全匹配的一对 slug 原样选中」`;`t7:dom —「直达 URL:首屏即选中对应学校与专业」` |
| C3 | 监听 `popstate`,选中态跟着地址栏走 | `SchoolsBrowse` 的 `useEffect` + `parseBrowsePath()` | `t7:dom —「popstate:选中态跟着地址栏走,不 push 新记录」`(真实前进/后退见人工项 H2) |
| C4 | slug 不存在或不匹配 → 回退到第一所第一个,不报错不空白;学校对、专业错时保留学校 | `resolveBrowseSelection()` | `t7:model —「学校对、专业不存在…」`、`「学校也不存在 → 整体回退…」`、`「解析 → 回退 是一条闭环」`;`t7:dom —「popstate 到解析不出来的地址…」` |
| C5 | **裁决 T7-R4**:C4 的回退是**客户端**契约;服务端对没生成过的 slug 仍然 404,不把垃圾 URL 变成 200 | `app/(explore)/schools/[schoolId]/[programSlug]/page.tsx` 的 `notFound()` | 人工项 H3(curl 实测) |
| C6 | 首屏不 push(否则后退键第一下原地打转) | `SchoolsBrowse`:`select()` 只在交互里调用,`useEffect` 里只 `setState` | `t7:dom —「首屏不 push …」` |

## D. 反 cloaking(核心原则 4,硬红线)—— 9 条

> ### ⚠ 2026-08-06 口径修正:红线的范围是**本页**,不是全站
>
> **原口径(2026-08-05 结项时):** 每个 URL 都渲染全站内容 —— 所有学校的小卡条、
> 所有专业的大卡。1 所 4 个专业时这没有代价。
>
> **实测代价(2026-08-06,20 所 1778 个专业):** 单页 HTML **8.49 MB**
> (每个专业向每一页贡献约 4.9 KB),1778 个页面共 **14.74 GB**。Vercel 构建
> 两次在**第 929 页**因 `ENOSPC` 崩溃(每页体积恒定,所以崩溃点确定,与崩在
> peabody 的哪个专业无关)。比构建更要紧的是:这 8.49 MB 会原样发给每个访问者,
> 移动端 4G 下载再解析 1778 张卡的 DOM,页面在真实用户手里不可用 —— 构建撞墙
> 只是早期预警。
>
> **修正后:每个 URL 只承载一所学校。** 本校全部专业的完整卡片在 SSR DOM 里
> (校内切专业仍是零转场);其余 19 所只出 tab 名与真实 `<a href>`,点击是一次
> 页面跳转。实测单页平均 **0.43 MB**、最大 0.90 MB(peabody,167 个专业)、
> 全量 **0.89 GB** —— 单页降 95%,总量降 94%。
>
> **为什么这不是让步。** 蓝图 §0 原则 4 说的是「**本页**的折叠内容必须在 SSR
> DOM 中」,防的是「给爬虫看的和给人看的不一样」。收窄之后,每个 URL 下人和
> 爬虫读到的仍然**完全相同**:本校全部专业。爬虫顺着 tab 行的 `<a href>` 到达
> 其余每一所 —— 那是正常站点结构,不是隐藏。原先「全站内容出现在每一页」是对
> 这条原则过度的理解。
>
> **取舍依据是访问频率:** 校内切专业(比较同校不同学位)是高频动作,保持零
> 转场;跨校切换是低频的(读者已经决定看另一所了),付一次跳转。不该为低频
> 路径让每个页面重 19 倍。

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| D1 | **本校**全部专业的完整卡片内容都在服务端渲染的 HTML 中(修正后口径,见上) | `SchoolsBrowse` 对本页承载的那一所无条件渲染小卡条与全部大卡;`scopeToSchool()` 决定承载哪一所 | `t7:dom —「四个专业的大卡全部在服务端 HTML 里,不是只有选中那个」`(`renderToStaticMarkup`,4 张 `<article>` + 四个学位中文名 + 四条各自的 JSON-LD 地址);`t7:dom —「逐校:本校专业数 == 该页 <article> 数 == JSON-LD 块数,且 20 所 tab 链接齐全」`(全量语料逐校渲染 20 次,逐校加总 == 1778) |
| D1b | 其余 19 所以**真实 `<a href>`** 出现在 tab 行,爬虫可顺着到达每一所 —— 这是收窄之后红线仍然成立的前提 | `SchoolsBrowse` tab 行:当前校渲染 `<button>`,其余渲染 `<a href={school.href}>`;`href` 由 `buildBrowseModel()` 写入,指向该校第一个专业 | `t7:dom —「跨校 tab 是真实 <a href>,指向该校第一个专业」`(断言 `tagName === "A"` 与 href 值);`t7:dom —「一页只含本校大卡,别校以可跟随的链接出现」`;全量不变量测试逐校核对 20 个 tab 链接齐全 |
| D2 | 曲目要求做 §3.3 的 **80 字截断**,「完整要求」链到**官网原页**(裁决 2026-08-06,取代下方 D3 的旧规则) | `BrowseProgramCard`:`repertoireHref = sourceUrlForField(program, "repertoire", "audition")`,超过 80 字且有来源 URL 时截断 + 外链 | `t7:dom —「曲目要求 80 字截断 + 「完整要求」外链,链到官网原页」`(断言前 80 字在、全文不在、`href` 是真实站外地址) |
| D3 | ~~曲目不做截断,因为没有下一跳~~ **已被 2026-08-06 裁决取代。** 站内确实没有下一跳(详情页已折进本卡),但**官网原页**是真正有全文的地方,链过去比在卡上铺一整段英文原文更接近读者要的东西。**找不到来源 URL 时仍回退成印全文** —— 那时才真的没有去处,与 T3-R4.4 同一条规则,所以那条裁决没有被推翻,只是不再适用于有来源 URL 的情形 | `BrowseProgramCard` 文件头第 3 条 | 同 D2(测试覆盖截断分支;回退分支由 `repertoireHref === null` 保证,当前语料无此例) |
| D3b | **「详细要求」只有三行**:申请材料清单、曲目要求、英语要求(蓝图 §1.5 的 expand/30 秒层)。此前调用 `buildRequirementRows()` 展开 20 多行 —— 那是 §1.5 **3 分钟层**(详情页 `RequirementsTable`,§2.2 模块 2)的字段全集,2026-08-05 折叠详情页时被一并带进卡片。**规格疏漏,不是取值错误**;那份共享定义一行未动,其余字段仍在 canonical 里,恢复详情页时原样可用 | `BrowseProgramCard` 不再 import `buildRequirementRows`;`buildEnglishRequirementLine()` 把五态 + TOEFL/IELTS/多邻国合并成一行,豁免信号与外链由调用处渲染(见 D3c) | `t7:dom —「详细要求只有三行,3 分钟层的字段不在卡上」`(逐张卡断言 `<dt>` 恰为那三个,且条件说明区不存在);`lib/program-v3/requirement-rows.ts` 的 T3 既有测试全绿,证明共享定义未被改动 |
| D3c | **语言条件并回英语要求行**(裁决 2026-08-06,是三行里唯一带外链的):「TOEFL 102 · IELTS 7.5 · 设有豁免条件,详见 官网来源」。写「TOEFL 102」却不说有豁免条件,对中国学生是完全不同的两件事 —— 很多人正是靠豁免政策申请的。**展示信号 + 去处,不搬整段原文**(全文在官网)。措辞按事实分档:`english_waiver_policy` 字面就是豁免政策 → 「设有豁免条件」;只有 `conditions.language` 时 → 「设有语言条件说明」,因为语言条件不一定是豁免,对它说「豁免」就是一句 canonical 没做过的断言 | `BrowseProgramCard` 的 `englishConditionLabel` / `englishConditionHref`。hint 列表按**实际承载该事实的 `related_field`** 写(`toefl`/`ielts`/`duolingo` 等),不按字段中文名猜 —— 只写 `english`/`language` 时链接恒为 null,旧的「语言条件说明」行在真实数据上从未渲染出过链接 | `t7:dom —「英语要求行带豁免信号与官网外链」`(逐张卡断言分数与豁免信号同行、`<a>` 文案为「官网来源」、href 是 `https?://` 站外地址、整行 < 120 字 —— 最后一条防止整段英文豁免原文从这里回来) |
| D4 | 每个专业的**材料清单**全条在 HTML 里 | `BrowseProgramCard` 直接 `required_materials.join("、")`(2026-08-06 起不再经 `buildRequirementRows()`) | `t7:dom —「每个专业的材料清单全条在 HTML 里」` |
| D5 | **校内**切换只是显隐(`hidden` 属性),**不替换 innerHTML、不点击后 fetch**;跨校是一次真实导航(见 D1b),不是同页切换 | `SchoolsBrowse`:`hidden={...}`,没有条件渲染、没有 `fetch`/`innerHTML`;跨校 tab 是 `<a href>`,不带 `onClick` | `t7:dom —「未选中的卡片是 hidden 属性,不是被从 DOM 里摘掉」`;`t7:dom —「四个专业的大卡全部在服务端 HTML 里」`(切换前后 `<article>` 恒为 4);`t7:dom —「跨校 tab 是真实 <a href>…」`(断言点击不改写 URL —— 那是浏览器导航的事) |
| D6 | 页面上没有任何 CSS 弱化/隐藏的**可见文本**:唯一的隐藏是「未选中的那几张卡/小卡条」,这是 T7 规格指定的实现方式;JSON-LD 是 machine-only 的合法例外(§0.4) | `browse.module.css` 无 `opacity`/`line-clamp`/`text-overflow`/`visibility:hidden`;`ProgramJsonLd` | 人工项 H4(逐条目检) |

## E. 大卡复用 T3 逻辑(裁决 T7-R3 / T7-R7)—— 9 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| E1 | 大卡保留 §2.1 的全部块:导语 · 引用块 · 校名/专业 + 截止角标 · 编辑观点 · 金标签 · 三数字块 · 详细要求 · 状态条 + 按钮 | `BrowseProgramCard` | `t7:dom —「§2.1 的块都在…」` |
| E2 | **T3 卡片的业务逻辑一行未改**:取值全部来自 T3 已钉死的纯函数(`costBlockLine` 费用三形态 §3.6、`auditionFormatZh`/`fiveStateZh`、`freshnessLabel` §3.4、`deadlineState`、`splitApplicationConditions` 裁决 T3-R4.1、`sourceUrlForField`),新文件里没有写任何业务规则 | `BrowseProgramCard`、`BrowseDeadlineChip` 的 import 列表 | T3 原有 **98 条**测试全绿(`npm run test:lib` 487 通过、`vitest` 118 通过,含 T3 全套);`t7:dom —「§2.1 的块都在…」` |
| E3 | 「详细要求」的行与详情页 `RequirementsTable` **同一份定义**(同样的项、同样的顺序、同样的 null 丢弃规则),不是复制一份 | `lib/program-v3/requirement-rows.ts`(从 `RequirementsTable` 原样提出),两处共用 | T3 既有的 `RequirementsTable` 测试全绿(证明提取是行为等价的);`t7:dom —「详细要求是常展开的 label-value…」` |
| E4 | 详细要求是常展开的 label-value 表,**不是 `<details>` 折叠区** | `BrowseProgramCard` + `.requirementRow` | `t7:dom —「详细要求是常展开的 label-value,没有 <details> 折叠区」` |
| E5 | 空值降级仍是 T3 的:没有内容的块整块不渲染,不留空壳、不出现「暂无」「N/A」占位(§3.1 / 裁决 T3-R3.1) | `BrowseProgramCard` 每块自带的 `? :` 判断 | `t7:dom —「空值降级仍是 T3 的:没有内容的块整块不渲染,不留空壳」` |
| E6 | 截止角标由前端 `now()` 计算(§3.4 / 裁决 T3-R3.7):**不在 SSR HTML 里,但日期在**(所以不是 cloaking 例外) | `BrowseDeadlineChip`(`useEffect` + `deadlineState`) | `t7:dom —「截止角标由前端 now() 算…」` |
| E7 | JSON-LD 每张卡一块,一页多块(T4 §2.4);T3b 的保留字校验与 `generateStaticParams` 原样保留,sitemap / llms.txt 指向的地址仍逐条可达 | `ProgramJsonLd`;`productionProgramRouteParams()` 未改 | `t7:dom —「JSON-LD 每张卡一块…」`;T4 既有测试全绿 |
| E8 | 「申请截止日期」不在详细要求表里重复(裁决 T7-R7):三数字块已印过一次,同卡再印没有信息增量。删的是重复的行,不是事实 —— 日期本身仍在卡上 | `BrowseProgramCard` 的 `.filter((row) => row.term !== "申请截止日期")` | `t7:dom —「「申请截止日期」只在三数字块出现一次,详细要求表里不再重复」` |
| E9 | 该过滤**只发生在 T7 这张卡上**:共享的 `buildRequirementRows` 与详情页 `RequirementsTable`(§2.2 模块 2,那边没有三数字块)一行未动。过滤依赖的不变量(行与格子同由 `formatDateZh(application_deadline)` 决定,不存在「行被删、格子也没有」的空档)写在过滤处注释里 | `lib/program-v3/requirement-rows.ts` 未改;`BrowseProgramCard` 过滤处注释 | `t7:dom —「共享的行定义本身没被改动 —— 详情页那边仍有「申请截止日期」」`;T3 既有 `RequirementsTable` 测试全绿 |

## F. 设计 token —— 3 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| F1 | 全部色值、字号、字重、圆角、边框、间距按 T7 给定的确定值,一处未自行发挥 | `components/schools/browse/browse.module.css` | `t7:tokens —` 共 **44 条**逐值用例(10 色值 + 6 字号 + 25 形状/间距 + 断点/滚动条/字重集合);渲染后是否落到正确元素上见人工项 H1 |
| F2 | 字重只有 500(大卡主标题、数字块数值、小卡第一行)与 700(STAGE 标识)两个非默认档 | 同上 | `t7:tokens —「字重只有 500 与 700 两个非默认档」`(取全表 `font-weight` 集合,断言恰为 400/500/700) |
| F3 | 两个实现期补齐的值已由人类**追认**(裁决 T7-R8),纳入冻结 token 集,在声明处标注「实现期补齐(追认 2026-08-05)」:桌面端左右 padding 24px(规格只给了移动端 16px 与 1200px 宽),小卡 `box-sizing: border-box`(补偿选中态 1.5px 边框,免得选中时挤动邻居)。改动它们与改动其余 token 同性质,都是规格变更 | `browse.module.css` 文件头 + 两处标注 | `t7:tokens` 的 `「移动端左右 padding」`、`「小卡选中边框」`(24px 与 border-box 本身随 F1 的整表核对) |

## G. 响应式与横向滚动 —— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| G1 | tab 行与小卡条保持横向滚动,滚动条隐藏但可滑动 | `.tabRow` / `.chipRow` 的 `overflow-x: auto` + `scrollbar-width: none` + `::-webkit-scrollbar` | `t7:tokens —「tab 行与小卡条隐藏滚动条但仍可横向滚动」`;人工项 H5 |
| G4 | **右缘 40px 渐隐提示**(裁决 2026-08-06):滚动条隐藏后没有任何线索说明右边还有内容(20 所里 14 所在屏外)。渐隐带在可滚动时出现、滚到底时消失;不用箭头按钮(会增加一次点击)。**滚动能力本身一直是好的** —— 真浏览器 1200/768/375 三个宽度实测:`overflow-x: auto` 生效、祖先无 `overflow` 约束、`touch-action: auto`、键盘聚焦最后一个 tab 自动滚入视野、`maxScrollLeft` 分别为 4275/…/5069,最后一项都能完整看到 | `SchoolsBrowse` 的 `HScroller`(量出 `data-overflow`,`ResizeObserver` 缺失时退回 window resize);`.scrollerWrap::after`(`pointer-events: none`,不吃点击);`.tabRow/.chipRow` 的 `scroll-padding-inline: 40px` | `t7:dom —「每个横向滚动行都有遮罩外壳,且遮罩不吃点击」`、`「遮罩不改变 SSR 内容」`。**「滚到底遮罩消失」jsdom 验不了**(不做布局,元素宽度恒为 0),已在真浏览器三个宽度实测通过,记为人工项 H6 |
| G2 | 内容区左右 padding 16px;大卡内边距 32px → 20px | `@media (max-width: 767px)` | `t7:tokens —「移动端左右 padding」`、`「移动端大卡内边距」`、`「移动端断点是 767px」`;人工项 H5 |
| G3 | 三数字块三列 → 纵向堆叠;详细要求 label-value 左右两列 → 上下两行 | 同上 | `t7:tokens` 相应条目;人工项 H5(实测 `grid-template-columns` 单列、`flex-direction: column`) |

---

## 交付时人工验证项(6 条,不计入主表 34)

这些是**在这台机器上做过一次**的动作,不是每次 CI 都会重跑的断言。按 T4-R1 的
教训单列,不许混进主表。

| # | 验证项 | 做法 | 结果 |
|---|---|---|---|
| H1 | **token 真的落到了正确的元素上**(测试只证明值出现在样式表里) | `npm run build` + `npm start`,在 1280px 下用 `getComputedStyle` 读实际值 | ✅ 主标题 24px/500/`rgb(27,31,39)`;大卡 padding 32px、圆角 10px、边框 `rgb(229,231,235)`、底 白;导航高 64px、底线 `rgb(232,235,255)`;小卡选中 `rgb(43,68,255)` 边框 + `rgb(245,246,255)` 底;详细要求 label 13px / value 15px、分隔线 `rgb(240,242,245)`;三数字块 3 列 |
| H2 | **浏览器真实前进/后退** | 同一会话内点小卡两次 → `history.back()` ×2 → `history.forward()` | ✅ URL 与大卡逐步同步:`voice-bm → voice-dma → voice-gd →(后退)voice-dma →(后退)voice-bm →(前进)voice-dma`,每步都恰好一张卡可见 |
| H3 | **curl 验反 cloaking + 服务端 404** | `curl` 取 `/schools`、`/schools/juilliard/voice-dma`、`/schools/juilliard/voice-gd` 的原始 HTML | ✅ 三个入口的 HTML 完全等价:各 4 张 `<article>`、4 块 JSON-LD;BM/MM/GD/DMA 四条曲目全文与四条材料清单全在;无 `…` 截断符;`/schools/juilliard/nope` 与 `/schools/nope/nope` 均 **404**<br>**⚠ 2026-08-06 起这条人工验证的口径变了,尚未重做:**收窄后「三个入口 HTML 完全等价」只在**同一所学校内部**成立(茱莉亚的三个入口仍各含它自己的 4 张卡);跨校入口应当各含**本校**的卡片数,并互相以 `<a href>` 链接。重做时要验的是:①`/schools/{A}/...` 的 `<article>` 数 == A 校专业数;②该页含全部 20 个 tab 链接;③顺着某个链接 curl 到 B 校,同样成立。自动化部分已由 `t7:dom —「逐校:…」`覆盖,人工项待新构建上线后补 |
| H4 | **无 CSS 弱化文本**目检 | 通读 `browse.module.css` | ✅ 无 `opacity` 弱化、无 `line-clamp` / `text-overflow` / `visibility:hidden`;唯一隐藏是未选中卡片/小卡条的 `hidden` 属性 |
| H5 | **移动端断点实测** | 视口 375×812 重载后读计算样式 | ✅ 内容区左右 16px;大卡 padding 20px;三数字块 `grid-template-columns: 302px`(单列);详细要求行 `flex-direction: column`;小卡条 `overflow-x: auto` 且 `offsetHeight-clientHeight = 0`(滚动条隐藏)、`scrollWidth > clientWidth`(可滑);`documentElement.scrollWidth = 375`,页面不横向溢出 |
| H6 | **控制台无报错** | 生产构建下读 console | ✅ 无 error |

---

## 已知代价与遗留(不是测试项,是交付说明)

1. **§2.2 详情页的模块 3–6 从生产页面消失**:裁决 T7-R1「详情页降级为同页大卡」
   的直接后果 —— 曲目/作品集细则、**原文证据(`source_quote`)**、特殊条件、
   相关专业四个模块不再有生产入口(组件与 `/v3-preview` 路由都还在)。
   **已处理**(裁决 T7-R6):提示句从「可溯源至官网」收窄为「标注官网核实时间」,
   不让承诺大于兑现。**恢复入口是一条待办**,逐模块清单与恢复后的同步点见
   `T7_REVIEW_HANDOFF.md` 待办 1。
2. **金标签失去 tone 区分**:T3 的 `success/warning/info` 三色在 T7 的 token 表里
   没有对应色,现在统一渲染成浅蓝底 + 主蓝字。**已确认接受**(交付确认第 2 条):
   三态是蓝图给未来预留的,当前数据只有一种 badge 类型,统一色更干净。
   ——(原第 3 条「截止日期出现两次」已按裁决 T7-R7 修掉,见 E8/E9,不再是限制。)
3. **`(explore)` 布局仍会在移动端叠加 `MobileBottomNav`**,与 T7 自带的页脚同时
   出现。改布局会动到其他页面,已按 ticket 的「不改其他页面」留在原处。
4. **提示句的「截至 {年月}」是构建时的月份**(SSG),不是访问时的。理由与选择
   写在 `browseLede()` 注释里。
5. **`data/v3/real-programs.ts` 只有 1 所学校**,所以 tab 行实际只有一个 tab、
   提示句是「已收录 1 所音乐院校」。**已确认**(交付确认第 5 条)属数据铺开范围,
   不是 T7 的问题。多校联动由测试里合成的第二所学校覆盖(`twoSchools()` /
   `withSecondSchool()`)。
