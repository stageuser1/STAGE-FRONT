# T3b 声称 ↔ 代码 ↔ 测试 对照表

**结项**(2026-08-05)。Codex 规则层评审共两轮:第一轮发现 slug 保留字冲突
(见下方「Codex 规则层评审」一节),已修复并回归;**第二轮确认通过,不再开新
轮次**。收尾状态:`test:lib` 423/423、`vitest run` 93/93、`tsc --noEmit` 0 error、
`npm run build` 全量生产构建成功(详见各节 M1/回归记录)。

**范围**:把 V3 前端从 `/v3-preview`(disallowed,mock 数据)迁到蓝图 §2.2 的
生产路由 `/schools/{school-slug}/{program-slug}`,按人类 2026-08-05 的三条裁决
执行部分迁移(而非全量替换),并完成 sitemap/robots/QR 的收尾接线。

## 人类裁决记录(2026-08-05)

- **T3b-R1**:`program_offerings` 缺少 `slug` 列一事,先用只读 API 核对 Directus
  实际 schema(而非只看 TS interface),确认后不阻塞 T3b,记为前置 ticket
  **T3c**(见下方「T3c 移交」)。
- **T3b-R2**:redirect/迁移策略选方案(a)——**部分迁移,双路由并存**。有
  `publishing.slug` 的项目(目前仅茱莉亚 4 条)走新路由；其余继续走旧的
  `/schools/{schoolId}/programs/{programId}`(Directus 直出,数字 ID)。不做
  全量 301 redirect,因为多数项目目前根本没有可映射的目标 slug。
- **T3b-R3**:列表路由不新建，`/schools`(`ExploreCatalog`)保持现状作为事实
  上的列表页。

## 勘察确认的事实(先于任何代码改动核实,详见交接对话)

- **Directus 只读 API 现场核对**(`/fields/program_offerings`,凭据取自
  `.env.local`):`program_offerings` 的字段列表里**确实没有 `slug`**。同时核对
  `/collections`:Directus **没有 `publishing` 集合**——V3 的 Mode F publishing
  块目前完全是线下产出(Night Processor)、手工复制进仓库的静态 JSON
  (`data/v3/real/juilliard-vocal-arts-pilot.json`),不是从 Directus 读出来的。
  这比「加一列」量级更大，T3c 的范围需要包含「Mode F 产物如何进 Directus 并
  成为查询源」，不只是加字段。
- 旧路由的 `schoolId` 段本来就是 slug(`School.id` 取自 `schools.slug`)；只有
  `programId` 段是数字 Directus 主键。新旧路由的实际差异只在第二段。
- Next.js 路由消歧:新路由复用既有的 `[schoolId]` 目录名(没有新增
  `[schoolSlug]` 造成同级动态段命名冲突),在其下新增 `[programSlug]` 目录，
  与旧路由的静态 `programs/` 目录同级但互不冲突 —— 静态段永远优先于动态段，
  `/schools/x/programs/*` 恒定进旧路由，`/schools/x/{非"programs"的任意值}`
  进新路由。已用生产构建实测验证（见下方 M1）。

---

## 变更清单

| 文件 | 改动 |
|---|---|
| `lib/program-v3/format.ts` | `programDetailHref()` 从 `/v3-preview/{schoolSlug}/{slug}` 改为 `/schools/{schoolSlug}/{slug}`。**唯一路径来源**，其余全部消费者（卡片、JSON-LD、sitemap、微信/二维码）零改动即可跟随。**注意**：本次改动与另一会话正在修复的 `cost_estimate_rmb` 单位问题共享此文件；仅动了 `programDetailHref` 这一处，未触碰 `yuanToWanZh`/`costBlockLine` 等函数 |
| `data/v3/real-programs.ts` | 移除 `-t1b` 预览专用后缀（现在导出未加后缀的真实 `juilliard` slug）；新增 `findProductionProgramV3()`、`relatedProductionProgramsV3()`；改用相对导入（`../../lib/program-v3/*.ts`）+ JSON `with {type:"json"}` 属性，使其可被 `node --test` 直接解析的 `app/sitemap.ts` 链路加载 |
| `data/v3/preview-registry.ts` | 把 `-t1b` 碰撞规避后缀从 `real-programs.ts` 挪到这里（`suffixedRealProgramsV3`），只在拼预览面注册表时加，不再污染生产数据源 |
| `app/(explore)/schools/[schoolId]/[programSlug]/page.tsx` | **新增**。生产详情页，数据源 `findProductionProgramV3`/`relatedProductionProgramsV3`，复用 `/v3-preview` 已验证的渲染组件；`backHref` 指向 `/schools/{schoolId}`（学校主页，同旧路由模式） |
| `.../[programSlug]/not-found.tsx` | **新增**，镜像旧路由的 404 呈现 |
| `.../[programSlug]/opengraph-image.tsx` | **新增**，镜像 `/v3-preview` 的 OG 图路由，数据源换成 `realProgramsV3` |
| `.../[programSlug]/share-card/route.tsx` | **新增**，镜像 `/v3-preview` 的分享卡路由 |
| `app/sitemap.ts` | 从「只列根域名」改为「根域名 + `buildProgramSitemapEntries(realProgramsV3)`」，即根 + 4 条茱莉亚真实项目；改用相对导入以维持 `node --test` 兼容 |
| `app/robots.ts` | 仅更新注释以反映裁决 T3b-R2（部分迁移，`/v3-preview` 不退场）；`disallow` 数组本身无需改动，因为 `/schools/` 从未被 disallow 过 |
| `tests/program_v3_ai_ready.test.mjs` | E2 断言、G1/G4（`app/sitemap.ts` 真实行为）改为期望根 + 4 条 `/schools/juilliard/...`，且断言 mock 不出现 |
| `tests/program_v3_share_card.test.mjs` | 6 处 `qr_url`/`config.link`/`config.imgUrl` 断言从 `/v3-preview/juilliard/...` 改为 `/schools/juilliard/...`；同步一处过时注释 |

未改动、按裁决刻意保留原状：`data/v3/mock-programs.ts`、`lib/program-v3/json-ld.ts`（均在另一会话的编辑范围内，且本轮无需改动其内容）、`/v3-preview` 全部路由文件、`app/(explore)/schools/[schoolId]/programs/[programId]/`（旧路由）、`app/(explore)/schools/page.tsx`（列表页）。

---

## 声称 ↔ 代码 ↔ 测试

| # | 声称 | 代码 | 测试/验证 |
|---|---|---|---|
| 1 | 有 `publishing.slug` 的真实项目(茱莉亚 4 条)在 `/schools/{school-slug}/{program-slug}` 可访问，渲染真实数据 | `app/(explore)/schools/[schoolId]/[programSlug]/page.tsx` | M1（生产构建实测，见下）；`npm run build` 产出 `/schools/juilliard/{voice-bm,voice-mm,voice-gd,voice-dma}` 四个静态页 |
| 2 | 旧路由 `/schools/{schoolId}/programs/{programId}` 完全未改动、继续服务 Directus 直出的项目 | 未触碰 `app/(explore)/schools/[schoolId]/programs/[programId]/*` | `npm run build` 输出同时含旧路由（如 `/schools/manhattan_school_of_music/programs/3`）与新路由，互不冲突；`git diff` 该目录为空 |
| 3 | 两套路由的 URL 形状不会相互吞掉 —— 静态 `programs/` 段优先于动态 `[programSlug]` | 目录结构：`[schoolId]/programs/[programId]/` 与 `[schoolId]/[programSlug]/` 同级 | M1：生产构建成功、路由表两者并列且各自静态生成期望的路径，无 Next 路由冲突报错 |
| 4 | `programDetailHref()` 是新 URL 的唯一来源，所有下游消费者（卡片、JSON-LD、sitemap、微信分享/二维码）跟随，无需各自改动 | `lib/program-v3/format.ts` | `npm run build` 后抽查 `.next/server/app/schools/juilliard/voice-bm.html`：JSON-LD `@id`/`url`、OG 图链接、分享卡链接均为 `/schools/juilliard/voice-bm...`（见下方 M1 摘录） |
| 5 | `/v3-preview` 预览面行为不变，`-t1b` 碰撞规避后缀继续生效 | `data/v3/preview-registry.ts` 的 `suffixedRealProgramsV3` | M1：`.next/server/app/v3-preview/` 下同时存在 `juilliard/`（T3 mock）与 `juilliard-t1b/`（真实数据）两个目录 |
| 6 | sitemap 只收有生产路由的真实项目（根 + 4 条茱莉亚），mock 项目不进 sitemap | `app/sitemap.ts` | `tests/program_v3_ai_ready.test.mjs` G1/G4；M1：`.next/server/app/sitemap.xml.body` 实测只有 5 条 `<url>` |
| 7 | robots.ts 放行 `/schools/`，`/v3-preview/` 保持 disallow | `app/robots.ts`（未改动 disallow 数组，只更新注释） | `tests/program_v3_ai_ready.test.mjs` F1-F4（原有测试未改，仍全绿）；M1：`.next/server/app/robots.txt` 实测无 `/schools/` 的 Disallow 行 |
| 8 | 分享卡/OG 二维码（`shareCardQrUrl`）对新路由项目指向真实的 `/schools/...` 详情页 | `lib/program-v3/share-card.ts`（未改动，靠 `programDetailHref` 传导） | `tests/program_v3_share_card.test.mjs` sc:D1/D4（含二维码真实解码回同一 URL）、sc:F1/F2（微信分享 `link`/`imgUrl`）；M1 实测 HTML 抽取到的绝对地址 |
| 9 | 该改动不触碰另一会话正在修复的 `cost_estimate_rmb` 单位逻辑 | `lib/program-v3/format.ts` 的 diff 只含 `programDetailHref` 一处 | 人工核对 diff；`data/v3/mock-programs.ts`、`lib/program-v3/json-ld.ts` 零改动（`git status` 可查） |
| 10 | 全部既有 V3 自动化测试（node --test 与 vitest）在改动后仍然全绿 | 见「变更清单」中的测试文件改动 | 结项时复测(含下方 Codex 规则层评审新增的 9 条):`npm run test:lib`:423/423 通过；`npm run test:dom`:93/93 通过；`npx tsc --noEmit`:0 错误；`npm run build`:全量生产构建成功 |

---

## 交付时人工验证项(未自动化，按 T4/T5 惯例单列，不计入上表)

- **M1**:`npm run build` 全量生产构建 + 对生成的静态产物人工抽查(路由表、`sitemap.xml.body`、`robots.txt`、`voice-bm.html` 内嵌的 JSON-LD/OG/分享卡链接)。已执行,记录在案(2026-08-05),细节见上表引用处。这是一次性人工核对,不是钉死的自动化断言——若未来有人改动 `next build` 的产物路径或格式,这条不会自动报警。
- **M2**:开发服务器人工访问 `http://localhost:3000/schools/juilliard/voice-bm`,`get_page_text` 抽取可见文本人工比对(专业名、TOEFL/IELTS 分数、截止日期、费用等)与真实包字段一致。已执行(2026-08-05)。

---

## T3c 移交(下一张票,不在 T3b 范围内)

**标题**:publishing 数据流水线 —— Mode F 产物如何流到前端(不是「加个 slug 列」)

**现状确认**(T3b-R1 核实结果,只读 API 现场核对,凭据 `.env.local`):
1. Directus `program_offerings` 集合**没有 `slug` 字段**(字段全列表见 T3b 交接对话)。
2. Directus **没有 `publishing` 集合**。T2 的 Mode F 流程产出的 `publishing` 块
   (含 `slug`/`answer_sentence_zh`/`cost_estimate_rmb`/`badges`/`freshness_flag`
   等)目前完全在 Directus 之外:跑在另一台机器(Night Processor)上,产物是
   静态 JSON,人肉复制进本仓库(`data/v3/real/*.json`)。

**问题的真实形状**:现在能工作,是因为只有茱莉亚一所学校、一次手工复制。
链条是「人跑 Mode F → 人核对产物 → 人复制 JSON 进 `data/v3/real/` → 提交」,
四步全靠人。学校数一旦从 1 涨到几十,这条链在**哪一步先断**、**用什么方式
接住**,是 T3c 要回答的问题,不是"加一列"能概括的。T3b 已经把"有 slug 的
项目如何变成可访问的生产页面"这一半做完并测试钉死(路由/sitemap/robots/QR
全部接好),T3c 只需要扩大「有 slug 的项目集合」,前端侧无需再动。

**T3c 需要回答的问题**(按数据在链条上流动的顺序):

1. **Mode F 的产物落在哪里,以什么形态,谁/什么触发它更新?**
   现在是"人在另一台机器上跑一次,产出一个 JSON 文件"。几十所学校时,是
   仍然逐校手动触发,还是有批处理/调度?产物版本谁来对,产物出错(例如
   `cost_estimate_rmb` 单位那类问题)在进前端之前谁把关?
2. **前端(或它背后的存储)怎么拿到这份数据?** 至少三条可能路径(不互斥,
   也可能有本清单未列出的第四条):
   - **(A)写回 Directus**:给 `program_offerings` 加 `slug` 列(及决定
     `publishing` 块其余字段是否也建对应集合/字段),Mode F 跑完之后通过
     Directus API 写回。前端继续走现在的「构建期/请求期读 Directus」老路径,
     `data/v3/real-programs.ts` 这一层可能整体消失,`adaptCanonicalPackage`
     的输入变成 Directus 查询结果而不是本地 JSON。
   - **(B)静态文件、构建时读取**:保留"Mode F 产出 JSON 文件"这个形态,但
     不再手工复制进仓库——改成构建期从某个存储(对象存储 / 独立 git 仓库 /
     内部文件服务器)自动拉取,`realProgramsV3` 这层的读取逻辑基本不变,变的
     是「JSON 从哪来」这一步从人手换成自动化拉取。
   - **(C)保持手工,但工具化**:仍然是"人复制文件进仓库"这个动作本身,但
     围绕它加校验/半自动化——例如一个脚本读 Night Processor 的输出目录、
     跑 schema 校验(字段契约、单位、必填项)、生成 diff 摘要供人确认,再
     一键提交,而不是纯手工复制粘贴。降低出错率,但存储形态和"人是链路里
     一环"这两点都不变。
3. **无论选哪条路径,`school.slug`/`program_offerings.slug` 的生成规则和
   唯一性范围是什么?** 全局唯一还是 per-school?谁负责在 Mode F 产出阶段
   还是灌数阶段做唯一性检查?（T3/T3b 的既有纪律是"slug 生成即冻结,不得
   修改已生成的 slug"——这条纪律在新流水线里由谁、在哪一步强制执行,需要
   跟着流水线设计一起定。）
4. **存量与新增如何区分?** 一次性回填(处理已有几所学校的存量数据)与常态
   增量(每次新处理一所学校/项目)可能需要不同的机制,还是同一套流程两种
   场景通用?

本节**不推荐方案**——这是需要单独想清楚的决策,T3c 的第一步应当是把上面
三条路径的取舍写成一份独立的裁决记录,而不是直接开始实现。

---

## Codex 规则层评审(2026-08-05):slug 保留字冲突 —— 前端已修,需 T2 侧同步

> **编号提醒**:这一条 Codex 裁决人类命名为「T3b-R1」,但本文档 §「人类裁决记录」
> 里**已经存在**一个同名的 T3b-R1(勘察阶段关于 `program_offerings` 缺 `slug` 列
> 的裁决)。两者是完全不同的两件事,共用编号是本项目反复出现过的「矩阵/编号
> 语义不清」问题(参见 T3-R4 对 F16 的处理)。本节内文用「本条」指代,**不
> 重用 T3b-R1 这个标识**;是否要给勘察阶段那条重新编号,留给下一次评审这份
> 文档的人决定,本轮不单方面重命名别的会话写的裁决记录。

**发现**(Codex,规则层评审,六项通过一项阻塞):`publishing.slug` 若恰好等于
`"programs"`,该项目自己的详情页 `/schools/{school}/programs` 能正确命中新路由
(因为只有 3 段,旧路由的 `programs/[programId]/` 需要第 4 段才成立);但它的
分享卡与 OG 图子路径(`/schools/{school}/programs/share-card`、
`/schools/{school}/programs/opengraph-image`)会因为 Next.js「静态段优先于
动态段」的解析顺序,被优先匹配进旧路由 `/schools/{schoolId}/programs/{programId}`
(把 `"share-card"`/`"opengraph-image"` 当成 `programId`)。微信抓取到的不是图片,
是详情页处理结果或 404。

**前端侧修复(本轮已做)**:

| 文件 | 改动 |
|---|---|
| `data/v3/real-programs.ts` | 新增 `RESERVED_PROGRAM_SLUGS`(`programs`/`share-card`/`opengraph-image`,扫实际路径段所得)、`assertNoReservedSlugCollisions()`(校验函数,导出供测试注入)、`productionProgramRouteParams()`(三条生产路由共用的 `generateStaticParams` 实现,命中保留字即 `throw`,构建期失败,不静默跳过) |
| `.../[programSlug]/page.tsx`、`opengraph-image.tsx`、`share-card/route.tsx` | 三处 `generateStaticParams` 均改为零参包装函数 `function generateStaticParams() { return productionProgramRouteParams(); }`(不是各自重新实现一遍,也**不是**直接把 `generateStaticParams` 赋值成 `productionProgramRouteParams` 本身——那样做 `tsc` 能过,但 `next build` 会崩:Next 调用 `generateStaticParams` 时传的是一个 props 对象而不是零参,直接赋值会让这个 props 对象顶替掉 `productionProgramRouteParams` 的可选参数默认值,`programs.filter(...)` 当场 `TypeError`。这条只有跑一次真实 `next build` 才会暴露,`tsc --noEmit` 全程无异议) |
| `tests/program_v3_reserved_slugs.test.mjs` | 新增,9 条:真实语料(4 条茱莉亚 slug)不命中保留字;三个保留字各自触发 `throw` 且报错信息点名违规 slug 与来源(Mode F/T2);单条命中不牵连语料里其余合规 slug;失败必须是 `throw` 而非静默丢弃路由;三条路由源码均复用同一份 `productionProgramRouteParams`(源码正则断言,防止某条路由各自重新实现一份从而漏掉校验);保留字清单与磁盘上实际路径段逐一比对(防清单本身漂移) |

**回归**:`test:lib` 423/423(含新增 9 条),`vitest run` 93/93,`tsc --noEmit` 0 error,
**`npm run build` 全量生产构建成功**(三条路由各自正确产出 4 个真实 slug 的静态页/图片,
旧路由 `/schools/{schoolId}/programs/{programId}` 与新路由并存无冲突)。

> 这次的 `npm run build` 不是可选的锦上添花,是抓出了一个 `tsc --noEmit` 全程
> 无异议、但会让生产构建直接崩溃的真实 bug(见下)——只有真跑一次构建才会
> 暴露。**一般教训**:`tsc --noEmit` 干净不等于 Next 的文件约定导出
> (`generateStaticParams`/`generateMetadata` 等)在运行时安全——这些是被
> Next 自己的运行时按特定调用约定调用的,TS 只做结构性检查,链路里任何一处
> `as` 断言都可能压掉本该拦下这个 bug 的类型错误。已记入项目记忆
> `nextjs-client-manifest-gotchas.md`(见该文件「Assigning generateStaticParams
> directly...」条目),本文档不重复展开细节,只留此指向。

**中间走过的弯路(留痕,不是掩盖)**:第一版修复为了让 `generateStaticParams`
满足 Next 生成的路由类型校验器,用了 `as` 类型断言把 `productionProgramRouteParams`
直接赋值给 `generateStaticParams`。`tsc --noEmit` 通过,`test:lib`/`vitest` 全绿,
但 `npm run build` 当场报错 `TypeError: a.filter is not a function`——Next.js
调用 `generateStaticParams` 时传的是一个 props 对象,不是零个参数,直接赋值
让这个 props 对象顶替了 `productionProgramRouteParams(programs = realProgramsV3)`
的默认值(JS 默认参数只在实参为 `undefined` 时才生效),`programs.filter(...)`
随即崩溃。改为零参包装函数(`function generateStaticParams() { return
productionProgramRouteParams(); }`)后构建通过。测试文件里对应的正则断言也
从「必须是直接赋值」改成了「必须是这个具体形状的包装函数」。

**当前语料无存量问题**:4 条真实 `publishing.slug`(`voice-bm`/`voice-mm`/`voice-gd`/
`voice-dma`)均不命中保留字,已由 `program_v3_reserved_slugs.test.mjs` 的
「真实语料不命中」测试钉住。

### 需 T2 侧同步(本轮不做,只上报)

**Mode F 生成 `publishing.slug` 时应该在源头拒绝保留字,不是等前端拦。**

**为什么前端拦不够**:§13 —— slug **生成即冻结**,Mode F 复跑沿用已有 slug、
永不重新计算。这意味着前端的保留字校验只能防住*尚未生成*的 slug;一旦某个
真实项目已经被 Mode F 生成了 `slug: "programs"` 并写回 canonical 包,这条前端
校验能做的只是让构建**失败**(不会让站点带着错误路由悄悄上线),但**不能**
自己挑一个新 slug 顶替——slug 是发布契约的一部分,前端无权重新赋值,只能
报错等人处理(改名走 redirect,或退回给 Mode F 重新生成)。

**保留字清单**(与前端 `RESERVED_PROGRAM_SLUGS` 保持同步,理由见该常量的
代码注释):

| 保留字 | 冲突来源 |
|---|---|
| `programs` | 与 `/schools/{schoolId}/` 下已存在的旧路由静态目录 `programs/` 同名,静态段优先于 `[programSlug]` 动态段 |
| `share-card` | 与 `[programSlug]/` 自身的子路由 `share-card/route.tsx` 同名 |
| `opengraph-image` | 与 `[programSlug]/` 自身的 Next 约定文件 `opengraph-image.tsx` 产生的路由段同名 |

**这份清单会随前端路由树变化而变化** —— 若前端新增子路由(如未来的
`twitter-image`、另一种图片变体、某个 API 路由),清单需要同步扩充,否则
同一个 bug 会为新出现的路径段重演一次。**前端这一侧的同步已经是自动化断言,
不是靠人记得**:`tests/program_v3_reserved_slugs.test.mjs`「the reserved list
still equals the real on-disk path segments」这条会实际扫描
`app/(explore)/schools/[schoolId]/` 与 `.../[programSlug]/` 目录树,和
`RESERVED_PROGRAM_SLUGS` 逐一比对,清单与磁盘路径段有出入就会红。**T2 侧没有
这层保护**——若 Mode F 那边的保留字判断是独立维护的一份拷贝,前端这边测试
通过不代表两侧一致。T2 侧的校验逻辑理想情况下应该**引用
前端仓库导出的这份清单**而不是自己维护一份副本(两份清单各自维护会重蹈
`cost_estimate_rmb` 单位 bug 的覆辙——两处各自实现同一件事,只要有一处漏改
就会漂移)。若做不到跨仓库引用,至少需要在两边各自的文档里互相标注对方的
存在,并在任一侧改动保留字清单时提醒检查另一侧。
