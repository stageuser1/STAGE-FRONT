# T4 声称 ↔ 代码 ↔ 测试 对照表

**修订记录**:

- **T4-R1**(Codex 2026-08-03)裁定初版不具备结项条件——声称数量报错
  (称 41 条,实数 39 条),且 8 条声称靠一次性人工验证冒充"已被测试钉死"
  (A2/A10/E5 手工 curl、C2 手工全文扫描、G4 手工 XML 校验、A11/I1/I3 完全无测试)。
  8 条里 7 条改为自动化测试,1 条(A10 的外部 schema.org 校验服务调用本身)
  按裁决选项 (b) 移出主表,单列「交付时人工验证项」一节。
- **T4-R2**(Codex 第二轮 2026-08-03)确认数量与 8 条处理全部成立,剩 4 条 P2:
  A6(补 `duration_years: 0` 的用例,此前只测了 `null`)、D1(补断言"核实月份"
  文本真的出现,此前只数了域名出现次数)、H1(收窄声称——`NEXT_PUBLIC_SITE_URL`
  覆盖是 Next 标准环境变量机制,测它等于测框架,不值得为此专门起测试;声称改窄
  为"单一来源 + 三处一致引用",这个既有测试已覆盖)、摘要(F2 标了人工审阅,
  但摘要说"全部有测试",两者矛盾——F2 本身没伪装,是摘要写得不准)。
  本版是这四条的修订结果。
- **T3-R6(跨 ticket,2026-08-03)**:B1 的措辞原本声称"`min`/`max` 字段存的
  是「万」,JSON-LD 不能原样搬"并据此 `× 10_000`——这个措辞本身就是 bug 的
  来源:T3 的渲染代码与这里的 JSON-LD 代码共享了同一个错误的单位假设
  (`min`/`max` 其实已经是元),真实 T1b 数据接入后暴露(¥57 万被两次换算
  成¥5.7 亿)。已随 T3 侧修复同步改正:B1 现在读作"直接用 `cost.min`/
  `cost.max`,不做任何换算"。测试见 `dom:U4`(直接用 T1b 真实数值断言
  `minPrice`/`maxPrice` 不被重复放大)。

**目的**:同 `T2_CLAIMS_MATRIX.md` / `T3_CLAIMS_MATRIX.md` ——
把「文档写下承诺、靠一处独立代码兑现、两者悄悄漂移」这条通道关掉。
每条声称都指认**兑现它的代码**与**钉死它的测试**,不接受只靠人工自测一次就过。

- 抽取范围:T4 ticket 原文五项任务 + 蓝图 §2.4 + 两轮人类裁决(robots/sitemap 范围、本轮矩阵修订)
- 测试编号:`ai:XX` = `tests/program_v3_ai_ready.test.mjs`(纯规则,`node --test`,
  与 T3 的 `lib:XX` 同一个 runner);`dom:XX` = `tests/dom/program-card-v3.dom.test.tsx`
  的 `T` 组(本轮新增,复用 T3 已有的 `card()`/`detail()`/`visibleText()` helper)
- **统计:主表 40 条声称(A–I 九组)。其中 39 条有代码位置 + 自动化测试钉死;
  F2(llms.txt 的描述是否"够完整")是结构性文本判断,自动化断言无法穷举,
  从初版起就诚实标注为「人工审阅」并在行内说明——它没有伪装成测试,这是
  唯一一条不靠自动化测试的主表行。** 另有 **1 条**交付时人工验证项(A10 的
  外部 schema.org 校验器调用本身),单列一节,不计入 40 这个数字(见文末)。
  下面每组标题旁都注了行数,可以逐组加总核对:11+6+3+3+5+4+4+1+3 = 40。

> **数量是怎么错的**:初版摘要写「41 条」,但从未真正逐行数过——A(11)+B(6)+
> C(2)+D(3)+E(5)+F(4)+G(4)+H(1)+I(3) = 39,不是 41。摘要句是凭印象写的,
> 表格本身没错但摘要撒了谎。这次的核对方法改了:文末重新贴一遍分组行数的
> 加总算式,读者可以自己逐组数一遍对不对,不再是"相信作者数对了"。

> **T3 的教训在这里又发生了一次**:T3 的 `T3_CLAIMS_MATRIX.md` 曾经把一条
> 断言指向不存在的测试(`dom:K1` 没断言 G5)。这次不是指向不存在的测试,
> 而是指向**一次性人工动作**却写得像测试——同一类问题的变体:表在说谎,
> 读的人以为已经被自动化保护,其实下次改代码没有任何东西会报错。

---

## A. JSON-LD 结构化数据(§2.4 第 1 项)—— 11 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| A1 | `EducationalOrganization`(学校)+ `EducationalOccupationalProgram`(专业)从 canonical 自动映射,不手写不硬编码 | `lib/program-v3/json-ld.ts`(`buildSchoolJsonLd` / `buildProgramJsonLd`) | `ai:B1–B8` |
| A2 | 注入位置:详情页与卡片列表页,`<script type="application/ld+json">` | `components/program/v3/ProgramJsonLd.tsx`,挂载于 `ProgramCardV3.tsx` 与 `ProgramDetailV3.tsx` | **`dom:T1`(9 个 fixture 的卡片各恰好 1 个合法 JSON-LD `<script>`)、`dom:T2`(9 个 fixture 的详情页同样各 1 个)——改用 `renderToStaticMarkup` 直接断言渲染输出,不再依赖手工 curl 一次性验证(T4-R1 前是手工) |
| A3 | 中文名为主(`name`),英文名降级为 `alternateName`(核心原则 6);中文名缺失时不重复输出 | `buildSchoolJsonLd` | `ai:B1` `ai:B2` |
| A4 | `country_code` 为 null → `addressCountry` 整键消失,不填空字符串 | `buildSchoolJsonLd` + `pruneObject` | `ai:B3` |
| A5 | `educationalCredentialAwarded` 组合学位中文名 + 缩写,两个真实字段的拼接,不是编造 | `buildProgramJsonLd` | `ai:B4` |
| A6 | `timeToComplete` 是 ISO 8601 时长(`PnY`);`duration_years` 为 null 或 0 时整键消失(不产出 `P0Y`) | `iso8601Years` | **`ai:B5`(T4-R2 前只断言了 `null` 一种输入;0 是真实可能值——数据填错,或按学期计的项目在提取阶段被错误折算成 0 年,不是构造性输入——现已补上 `duration_years: 0` 的用例,同一断言覆盖两个 falsy 输入)** |
| A7 | `applicationDeadline` 为 null 时整键消失 | `buildProgramJsonLd` | `ai:B6` |
| A8 | `pageUrl`(即当前可用路由,见 I 组)为 null 时(Mode F 未生成 slug),`url`/`@id` 都不输出,不指向列表页兜底 | `buildProgramJsonLd` | `ai:B7` |
| A9 | `url` 存在时是绝对地址(`SITE_URL` + 路径),`@id` 是 `url` 加 `#program` 后缀 | `buildProgramJsonLd` | `ai:B8` |
| A10 | JSON-LD 只使用 schema.org 认识的属性名 | `buildProgramJsonLd` / `buildSchoolJsonLd` | **`ai:A10`(离线属性白名单回归护栏,pinned 自 2026-08-03 的一次外部验证器人工核实——见文末「交付时人工验证项」,那次核实本身不是测试,但它的结论已经变成了可重复运行的自动化断言)** |
| A11 | `</script>` 在序列化时被转义(只转义 `<`,`>` 保留原样也安全——HTML 解析器认标签边界只看字面量 `<`),防止 canonical 里的自由文本(校名/专业名)提前闭合 `<script>` 标签 | `ProgramJsonLd.tsx`(`.replace(/</g, "\\u003c")`) | **`dom:T7`(此前完全无测试;现用含字面量 `</script><script>alert(1)</script>` 的对抗性校名渲染,断言序列化输出里找不到未转义的 `</script`,且危险字符串仍是一个能被 `JSON.parse` 正确解析出的合法字符串值)** |

## B. 费用只在形态①②输出的 JSON-LD 门槛(ticket 原文第 5 点)—— 6 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| B1 | 形态①(官方 CoA)→ `offers` 输出,`priceSpecification.minPrice/maxPrice` 是**实际人民币金额** | `buildProgramJsonLd`(直接用 `cost.min`/`cost.max`) | `ai:D1` `dom:U4` |
| B2 | 形态②(config_estimate)→ 同样输出 `offers` | 同上,复用 T3 的 `costBlockLine` 分类器 | `ai:D2` |
| B3 | 形态③(非 CNY,如 GBP/USD 学费)→ **不输出** `offers`,即使这是一个真实数字 | 同上 | `ai:D3` |
| B4 | CNY 标记但 `fx_rate`/`fx_snapshot_date` 缺失 → 判定降级为③,不输出 `offers`(与 Web Card 的降级判定同一套逻辑,不是另造一套) | `costBlockLine`(T3 既有函数,T4 直接复用) | `ai:D4` |
| B5 | 只有学费、没有生活费组件(或反之)→ 判定降级为③(T3-R5.2 同一判定,JSON-LD 不重新发明规则) | 同上 | `ai:D5` |
| B6 | `cost_estimate_rmb` 为 null → 不输出 `offers` | `buildProgramJsonLd` | `ai:D6` |

## C. editorial_notes 永不进入 JSON-LD(铁律,§0.3 / §1.3,ticket 原文明确点名)—— 3 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| C1 | `program.editorial_note` 及**其余全部自由文本字段**(语言豁免政策、国际生备注、申请/试音条件说明、曲目全文、视频要求、成绩单要求、原文引用、`answer_sentence_zh` 本身)在 `json-ld.ts` 里没有任何读取路径 | `lib/program-v3/json-ld.ts` 全文不出现这些字段名 | **`ai:C1`——kitchen-sink fixture:12 个自由文本字段各配一条独立哨兵文本,逐条断言哨兵文本与字段名均不出现在序列化输出里(T4-R1 前只测了 `editorial_note` 一个字段,覆盖窄于声称本身)** |
| C2 | 隔离不是靠把整个对象清空实现的——理应映射出来的字段(校名、专业名、城市、学位、截止日、费用)在同一个 kitchen-sink fixture 上确实原样出现 | 同上 | `ai:C2`(新增:正向断言,证明 C1 的"什么都不出现"不是因为函数把所有东西都吞了) |
| C3 | 隔离在费用形态①/②/无费用、`editorial_note` 有值/为 null 的交叉组合下都成立,不是只在一个固定 fixture 上凑巧成立 | 同上 | `ai:C3`(新增:3 种组合各跑一遍哨兵扫描) |

## D. 每页可见引用块(§2.4 第 2 项,反 cloaking)—— 3 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| D1 | `answer_sentence_zh` + 来源域名 + 核实月份,固定位置、正常可见,不用 CSS 弱化/隐藏 | `components/program/v3/CitationLine.tsx`,挂在导语正下方(卡片块 1 / 详情页模块 1) | `dom:M1`(块序断言,字面量 `"1b 引用块"` 紧跟在 `"1a 导语"` 之后)、`dom:K2`(全 fixture 扫描 CSS 隐藏/截断类名)、**`dom:T9`(T4-R2 新增:此前 `M1`/`K2` 只证明了位置与"没被隐藏",`T6` 只数了域名出现次数,没有任何断言确认"核实月份"这四个字背后的实际月份文本真的渲染出来了——3 个 fixture 分别覆盖 `last_verified` 直接给出、另一个不同的 `last_verified`〔证明不是巧合命中同一个硬编码字符串〕、以及 `last_verified` 为 null 回退到 `latestRetrievedDate(sources)` 的路径)** |
| D2 | 不得把同一句 `answer_sentence_zh` 在同一页面重复渲染两次 | `ProgramCardV3.tsx` 只渲染一次;`ProgramDetailV3.tsx` 是独立页面,各自渲染各自一次 | `dom:T8`(此前是手工 grep 数一次;现断言该句在卡片 `visibleText` 与详情页 `visibleText` 里各自恰好出现 1 次) |
| D3 | `FreshnessBar` 不再重复打印「来源:xxx」——已删除其 `status === "unknown"` 时的打印分支,信息来源收敛为 `CitationLine` 一处 | `components/program/v3/FreshnessBar.tsx` | `dom:T6`(此前是手工 grep 数一次;现断言同一域名字符串在卡片可见文本里恰好出现 1 次) |

## E. robots.txt + GPTBot 可达性(§2.4 第 3 项)—— 5 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| E1 | 通配规则(`*`)放行常规抓取(`Allow: /`) | `app/robots.ts` | `ai:F1`(数据形状)+ `ai:F4`(Next 真实序列化文本) |
| E2 | Disallow 只列真正不该抓的路径:`/api/`(尚不存在,面向未来)、`/v3-preview/`(mock 预览路由,蓝图「预览路由」示例本身) | 同上 | `ai:F1` `ai:F4` |
| E3 | GPTBot / ClaudeBot / PerplexityBot / Google-Extended 等具名放行,规则内容与通配规则一致 | 同上 | `ai:F2` `ai:F4` |
| E4 | `sitemap` 字段指向 `SITE_URL/sitemap.xml` | 同上 | `ai:F3` `ai:F4` |
| E5 | robots 的 disallow 只影响是否该抓,不影响页面本身是否 SSR 全文——两者独立:即使 `/v3-preview` 被 disallow,该页面本身仍然是无需 JS 即可读到完整导语与完整曲目原文的 SSR 页面 | Next SSR(无 JS 依赖),`ProgramCardV3`/`ProgramDetailV3` | **`dom:T3`(卡片可见 DOM 含完整 `answer_sentence_zh`)、`dom:T4`(详情页可见 DOM 含完整曲目原文,§3.3 的截断只发生在卡片,详情页从不截断)——此前是一次性 `curl -A GPTBot` 手工命令,现用 `renderToStaticMarkup` 直接断言渲染输出。等价性说明:仓库里没有任何基于 User-Agent 的中间件或分支逻辑(已确认 `middleware.ts` 不存在),所以 SSR 输出不会因请求头是否为 GPTBot 而不同,`renderToStaticMarkup` 断言与真实 curl 断言的是同一件事** |

## F. llms.txt(§2.4 第 4 项,ticket 原文第 4 点)—— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| F1 | 根目录 `public/llms.txt`,中文为主,点名站点定位「先留学 / studyabroadfirst.cn」 | `public/llms.txt` | `ai:H1` |
| F2 | 描述内容结构(学校/专业)、数据来源与更新频率 | 同上 | 人工审阅(结构性文本,无法用断言穷举「描述得够不够」——这条从初版就诚实标注为人工审阅,不在 T4-R1 指出的 8 条假装已测试之列,原样保留) |
| F3 | 说明每条信息可溯源至官网来源与核实日期 | 同上 | `ai:H2` |
| F4 | 声明编辑观点与事实的隔离(呼应 C 组铁律,写进给 AI 读的说明里,不只是代码里) | 同上 | `ai:H3` |

## G. sitemap.xml(§2.4 第 5 项)—— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| G1 | `lastmod` 接 `max(retrieved_date)`,不接构建时间 | `lib/program-v3/sitemap-entries.ts`(`buildProgramSitemapEntries`,用 T3 既有的 `latestRetrievedDate`) | `ai:E2` |
| G2 | 只收录真实存在内容的页面:无 slug(Mode F 未产出)或无 `sources` 的 program 不产生条目 | 同上 | `ai:E1` |
| G3 | 生成器已就绪,但 `app/sitemap.ts` **目前不调用它**——只输出站点根一条,不收录 `/v3-preview` 的 9 个 mock 页面(见 I 组「人类裁决」) | `app/sitemap.ts` | `ai:G1` |
| G4 | 产出的 `sitemap.xml` 是合法 XML,符合 sitemaps.org schema(`urlset` 根元素 + 正确命名空间) | Next 内置 `MetadataRoute.Sitemap` 序列化(`resolveSitemap`) | **`ai:G4`——离线导入 Next 内部真实序列化函数 `resolveSitemap`(`next/dist/build/webpack/loaders/metadata/resolve-route-data.js`),对其真实产出的 XML 字符串跑 `jsdom` 的 `DOMParser`,断言 0 个 `parsererror`、根元素与命名空间正确、`<loc>` 与预期一致。此前是手工 curl 一个本地 dev server 再手动跑 jsdom,现在同一断言链路完全离线可重跑,不需要服务器** |

## H. 站点绝对地址(支撑 A/E/G 组,非 ticket 直接条目,但缺了会让上面全部失真)—— 1 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| H1 | `SITE_URL` 由 `lib/site-config.ts` 单一来源导出,JSON-LD / robots / sitemap 三处均引用该来源,不各自硬编码域名 | `lib/site-config.ts` | `ai:B8`(JSON-LD 的 `url` 确实拼出这个值)、`ai:F3`(robots 的 `sitemap` 字段同样拼出这个值)、`ai:G1`(sitemap 的根条目同样拼出这个值)——三处分别断言,合起来就是"单一来源、处处一致" |

> **T4-R2 收窄**:初版这条还声称"可用 `NEXT_PUBLIC_SITE_URL` 覆盖",但从未有
> 任何测试验证过环境变量覆盖真的生效——设置环境变量再重新加载模块的测试成本
> 明显高于它的价值,而且这本质是在测 Next.js 自己的标准环境变量机制,不是测
> 这个仓库的代码。**已收窄为上面这条(单一来源 + 三处一致引用),这是既有测试
> 实际覆盖的范围。** 环境变量覆盖能力仍然是真实的实现能力,写在
> `lib/site-config.ts` 的代码注释里作为实现说明,不再作为矩阵声称。

## I. 路由依赖(§2.4 的 url 字段用哪个路由,ticket 原文第 5 点的明确处理方式)—— 3 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| I1 | `lib/program-v3/json-ld.ts` 与 `lib/program-v3/sitemap-entries.ts` 的源码里**不出现硬编码的 `v3-preview` 字面量**——两者都只通过 `programDetailHref()`(`lib/program-v3/format.ts`,唯一定义处)取路径,T3b 迁移生产路由时只需改这一处 | 两个文件本身;`programDetailHref` 定义于 `lib/program-v3/format.ts` | **此前完全无测试;现有 `ai:I1a`(扫描 `json-ld.ts` 源码)、`ai:I1b`(扫描 `sitemap-entries.ts` 源码)——两者都断言源码字符串里不含 `"v3-preview"` 子串** |
| I2 | **人类裁决(2026-08-03)**:`robots.txt` disallow `/v3-preview/`,`sitemap.xml` 暂不收录 `/v3-preview` 下的 9 个 mock 页面,只列站点根;真正的回填(放行 `/schools/`、接入 `buildProgramSitemapEntries()`)是 T3b 生产路由迁移 + 真实数据灌入之后的事,不属于 T4 遗漏 | `app/robots.ts`、`app/sitemap.ts` | `ai:F1`(disallow 列表实际内容)、`ai:G1`(sitemap 只有根一条) |
| I3 | `buildProgramJsonLd` 的 `url`/`@id` 完全由调用者传入的 `pageUrl` 参数决定,不是在函数内部拼接某个固定路由前缀——T3b 迁移路由后,只要调用点传入新路径,JSON-LD 自动跟着变,不需要改 `json-ld.ts` 本身 | `buildProgramJsonLd` | **此前完全无测试;现有 `ai:I3`——传入一个假想的、当前尚不存在的未来路径(`/schools/juilliard/voice-bm`),断言 `url`/`@id` 原样反映这个假想路径** |

---

## 交付时人工验证项(非持续保障)

这一节的东西**不计入上面「40 条声称」**——它们不是被自动化测试钉死的规则,
是一次性的人工验证事件。列在这里是为了诚实:下次有人改了相关代码,这里的东西
不会自动重新检查,需要人工重新做一遍。

| # | 验证内容 | 验证方式 | 验证时间 | 失效条件(什么时候需要重新做一遍) |
|---|---|---|---|---|
| M1 | JSON-LD 输出通过 schema.org 官方结构化数据验证器 | 浏览器交互:打开 `validator.schema.org`,粘贴 `buildProgramJsonLd` 对茱莉亚声乐 BM fixture 的实际渲染输出("代码段"模式,通过 CodeMirror API 注入,`运行测试`) | 2026-08-03 | `lib/program-v3/json-ld.ts` 的字段映射发生变化(新增/删除属性、改变某个属性挂在哪个 `@type` 下)时,应重新跑一次这个手工验证,并同步更新 `tests/program_v3_ai_ready.test.mjs` 里 `SCHEMA_ORG_ALLOWED_PROPERTIES` 这个白名单(`ai:A10` 断言的对象)。**不要只改白名单让测试通过——白名单要跟着一次新的真实验证结果走,不能凭空加属性名** |

首次提交时这次验证发现 2 处不合规,均已在代码里移除,不是留着让读者自己判断:
`inLanguage`(不是 `EducationalOccupationalProgram` 认识的属性)、`unitText`
(不是 `PriceSpecification` 认识的属性)。移除后复测 **0 错误 0 警告**,这个
干净状态就是 `ai:A10` 白名单当前锁定的内容。

---

## 回归结果

- `npm run test:lib`:412 tests, 0 fail(此数会随 T3/T5 各自的 lib 测试增减而变;
  T4 自己的 `tests/program_v3_ai_ready.test.mjs` 恒为 34 个 `test()`,T3-R6 只改了
  其中一条的注释与 fixture 数值,未增减用例数)
- `npx vitest run tests/dom/program-card-v3.dom.test.tsx`:44 tests(T3 既有 30 +
  T4 dom `T` 组 9 个:`T1`–`T9` + T3-R6 新增 `U` 组 5 个:`U1`–`U5`),0 fail
- `npx tsc --noEmit`:0 error
- `npm run build`:产物完整(T4-R1 版已验证过一次;R1/R2 两轮都只改了注释与
  测试文件,未改动任何被打进产物的运行时代码路径,故不重复跑全量 build——
  测试与 typecheck 已覆盖两轮的全部实际代码改动)

**不要标记为已评审。** 本文档是实现自测记录的第三版(T4-R1 + T4-R2 修订后),
评审是另一个独立会话/模型的事(沿用 T1–T3 的分工协议,见蓝图 §4)。
下一步:Codex 第三轮只做确认性复核,只核 T4-R2 这四条(A6/D1/H1/摘要),
不重审矩阵其余部分,也不重审 T4 的实现本身——若无新增高于 P2 的问题,T4 结项。
