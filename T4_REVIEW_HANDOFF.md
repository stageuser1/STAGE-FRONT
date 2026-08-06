# T4 移交文档 —— AI-ready 层(JSON-LD / 引用块 / robots / llms.txt / sitemap)

**状态:已结项(已通过评审)。** Codex 第三轮确认性复核通过——T4-R2 的四条修正
全部到位,矩阵行数 40+1 复核一致,无新增问题。

**T4-R1(Codex,2026-08-03)**:初版矩阵数量报错(称 41 条,实数 39 条),且 8 条
声称靠一次性人工验证冒充"已被测试钉死"。已修订:数量改对,8 条里 7 条改成了
自动化测试,1 条(schema.org 外部验证器的那次真实调用本身)移出主表单列一节。

**T4-R2(Codex 第二轮,2026-08-03)**:确认数量与 8 条处理全部成立,指出 4 条 P2:
A6(`duration_years` 只测了 `null`,补 `0` 的用例)、D1(引用块只测了域名出现
次数,没断言核实月份文本真的在)、H1(收窄声称——环境变量覆盖机制是 Next 标准
行为,不专门测试,声称改为"单一来源 + 三处一致引用")、摘要(F2 标了人工审阅
但摘要说"全部有测试",矛盾)。四条均已处理,详见 `T4_CLAIMS_MATRIX.md`。

**T4-R3(Codex 第三轮,2026-08-03,确认性复核)**:只核 T4-R2 的四条,不重审矩阵
其余部分或实现本身——四条修正全部到位,矩阵行数(主表 40 + 人工验证项 1)复核
一致,**无新问题**。**T4 结项。**

| | |
|---|---|
| Ticket | T4(蓝图 §2.4 AI-ready 层) |
| 仓库 | `stagefront`(`D:\STAGE FRONT`) |
| 规格 | `STAGE_V3_交接蓝图.md` §0(核心原则 3/4)/ §2.4 / §2.5(仅供理解 sitemap 范围) |
| 前置状态 | T1 已上线;T2 已交付(Mode F 发布块形状);T3 已交付(Web Card + 详情页,mock-only,Codex 复评未完成) |
| 声称矩阵 | `T4_CLAIMS_MATRIX.md`(40 条声称,39 条自动化测试钉死 + 1 条人工审阅已标注,另有 1 条单列的人工验证项) |
| 测试 | `npm run test:lib` 369 OK(335 既有 + 34)、`npx vitest run` 70 OK(61 既有 + 9)、typecheck 0 error、`npm run build` 产物完整(两轮修订只动了注释与测试文件,未重跑 build) |

---

## 1. 交付范围

**四件事,均已实现:**

| 文件 | 作用 |
|---|---|
| `lib/program-v3/json-ld.ts` | `EducationalOrganization` + `EducationalOccupationalProgram` 映射,`pruneObject` 负责空值省略 |
| `components/program/v3/ProgramJsonLd.tsx` | `<script type="application/ld+json">` 注入器,挂在卡片与详情页上 |
| `components/program/v3/CitationLine.tsx` | 每页可见引用块:来源域名 + 核实月份,挂在导语正下方 |
| `app/robots.ts` | Next `MetadataRoute.Robots`,放行 AI 爬虫,disallow `/api/` 与 `/v3-preview/` |
| `app/sitemap.ts` | Next `MetadataRoute.Sitemap`,目前只输出站点根(见 §3 人类裁决) |
| `lib/program-v3/sitemap-entries.ts` | sitemap 条目生成器(`lastmod = max(retrieved_date)`),已实现已测试,**尚未接入** `app/sitemap.ts` 的调用点 |
| `public/llms.txt` | 站点结构、数据来源、编辑观点隔离说明,中文为主 |
| `lib/site-config.ts` | `SITE_URL` 唯一定义处 |

**顺带修改(T3 既有文件,非新增范围)：**

| 文件 | 改动 | 原因 |
|---|---|---|
| `lib/program-v3/format.ts` | 新增导出 `programDetailHref`(从 `ProgramCardV3.tsx` 移入) | JSON-LD / sitemap-entries 都要拿这个路径,原先它是组件文件的私有导出,挪到 lib 层是更合适的位置,组件文件改为从这里导入并 `export` 以保持既有调用点(`RelatedProgramsSection.tsx`)不变 |
| `components/program/v3/ProgramCardV3.tsx` | 挂 `ProgramJsonLd` + `CitationLine` | §2.4 要求两处都注入 |
| `components/program/v3/ProgramDetailV3.tsx` | 同上 | 同上 |
| `components/program/v3/FreshnessBar.tsx` | 删除「`status === "unknown"` 时打印来源域名」的分支 | 与新增的 `CitationLine` 职责重叠——`CitationLine` 现在无条件打印来源域名 + 核实月份,`FreshnessBar` 原分支只在 unknown 态触发,两者共存会在 unknown 态重复打印同一行。删除后由 `CitationLine` 单独承担这条信息,`npx vitest run` 61 tests 仍全绿,证明没有测试依赖了旧路径 |

**不在范围内**:Share Card / OG(T5)、聚合清单页(T6)、真实 Directus 接线(数据管线在另一仓库)、
生产路由迁移(T3b)。

---

## 2. 人类裁决记录(本轮新增,供后续会话查阅)

**问题**:蓝图把「预览路由」列为 robots.txt 该 disallow 的路径示例,而 `/v3-preview`
恰好是当前唯一可用的路由(T3b 生产路由迁移尚未做)。如果 disallow `/v3-preview`,
sitemap 里再收录 `/v3-preview` 页面就自相矛盾(等于告诉引擎"别抓但请收录")。

**裁决**:disallow `/v3-preview`,`sitemap.xml` 暂时只输出站点根(不收录 9 个 mock 页面)。

**理由**(人类选择的选项原文):mock 数据(虚构的茱莉亚/RCM 录取数字)不应进入索引;
`buildProgramSitemapEntries()` 生成器已经实现且测试覆盖(`T4_CLAIMS_MATRIX.md` G 组),
等 T3b 上线真实 `/schools/` 路由后再回填 `app/sitemap.ts` 的调用点与 `app/robots.ts`
的放行规则——**这是 T3b 完成、真实数据灌入后的动作,不属于 T4 遗漏**。

---

## 3. 自测

见 `T4_CLAIMS_MATRIX.md` 末尾「交付时人工验证项」与「回归结果」两节。四项自测要求
现在的状态:

1. **schema.org validator**:0 错误 0 警告(2026-08-03 手工跑的,过程中删除了两个
   schema.org 不认识的字段 `inLanguage`/`unitText`)。这次真实的外部验证器调用本身
   是**唯一**保留在「人工验证项」里的东西——它的结论已经变成 `ai:A10` 的离线属性
   白名单测试,以后 json-ld.ts 改字段会被自动挡住,但"重新跑一次真实的
   validator.schema.org"这件事本身还是要人工做。
2. **curl 模拟 GPTBot UA**:T4-R1 后**不再是手工步骤**——`dom:T3`/`dom:T4` 用
   `renderToStaticMarkup` 直接断言渲染输出含完整导语与完整曲目原文,等价于 curl
   看到的东西(仓库里没有任何 UA 分支逻辑,已确认 `middleware.ts` 不存在)。
3. **sitemap XML schema 校验**:T4-R1 后**不再是手工步骤**——`ai:G4` 离线导入 Next
   内部真实序列化函数 `resolveSitemap`,对其产出的真实 XML 跑 jsdom `DOMParser`。
4. **editorial_notes 全文搜索**:T4-R1 后**大幅加强**——`ai:C1` 的 fixture 从只测
   `editorial_note` 一个字段,扩到 12 个自由文本字段各配独立哨兵,另加 `ai:C2`(正向
   断言真正该映射的字段确实在)与 `ai:C3`(费用形态 × editorial_note 状态的交叉组合)。

---

## 4. 遗留事项(T4 结项后仍然有效,不是缺陷,是明确的分工边界)

T4 结项**不等于**这些事项已经解决——它们是明确移交给后续工作的边界,逐条列在这里
方便后续会话查阅,不需要重新翻一遍矩阵去找。

1. **sitemap 回填 + robots 放行 `/schools/`(待 T3b)**:`app/sitemap.ts` 目前只输出
   站点根一条,`app/robots.ts` 目前 disallow `/v3-preview/`(§2 人类裁决)。
   `lib/program-v3/sitemap-entries.ts` 里的 `buildProgramSitemapEntries()` 生成器
   **已经实现、已经测试**(`ai:E1`/`ai:E2`,lastmod = max(retrieved_date)),真实
   `/schools/{school-slug}/{program-slug}` 路由上线、真实数据灌入后,回填只是
   两处小改动:`app/sitemap.ts` 改为调用这个生成器并传入真实 program 列表,
   `app/robots.ts` 把 disallow 列表换成放行 `/schools/`。**这不是 T4 遗漏,是
   T3b 完成之后才有意义做的事**——T4 交付时还没有真实路由和真实数据可接。
2. **T3b 生产路由迁移**:`/v3-preview/{school}/{program}` → `/schools/{school-slug}/{program-slug}`。
   JSON-LD 的 `url`/`@id`、sitemap 生成器都只通过 `programDetailHref()`(`lib/program-v3/format.ts`,
   唯一定义处,`ai:I1a`/`ai:I1b` 已断言两处消费者的源码里都没有硬编码 `v3-preview` 字面量)
   取路径,T3b 只需改这一处,不需要碰 T4 的代码。
3. **M1(schema.org 外部 validator)—— 唯一不受自动化保护的人工验证项**:
   见 `T4_CLAIMS_MATRIX.md`「交付时人工验证项」一节。2026-08-03 手工在
   `validator.schema.org` 跑过一次,0 错误 0 警告(过程中移除了 `inLanguage`/
   `unitText` 两个 schema.org 不认识的属性)。这个结论已经变成 `ai:A10` 的离线
   属性白名单测试,**但白名单本身不会自动跟外部验证器同步**——**失效条件**:
   `lib/program-v3/json-ld.ts` 的字段映射发生变化(新增/删除属性、改变某个
   属性挂在哪个 `@type` 下)时,必须重新人工跑一次 `validator.schema.org`,
   再照结果更新 `SCHEMA_ORG_ALLOWED_PROPERTIES` 白名单——不能只改白名单让
   测试通过而不重新验证。
4. **T3 本身仍未结项**(Codex 复评未完成,见 `T3_REVIEW_HANDOFF.md`)——T4 建在 T3 组件上,
   如果 T3 复评推翻了卡片/详情页结构,`ProgramJsonLd`/`CitationLine` 的挂载点需要跟着复核。

**已标记为已评审。**
