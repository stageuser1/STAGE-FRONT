# STAGE 数据通道迁移 OSS —— 分阶段执行提示词

> 生成:2026-08-08 · 基线 tag:`pre-oss-migration`(已推送)
> 架构决策见交接文档第三节,本文不复述论证。每个阶段:实现者先出计划、经运营者确认后才写代码;完成后由**独立 session(不同模型家族)**用本文对应的复核提示词验收,实现者自检不作数。

---

## 0. 现状核对(相对交接文档第二节的出入)

审计结论大体属实,以下为修正项,后续提示词均以修正后事实为准:

1. **不止四套路由,还有 `/search`**:`app/(explore)/search/page.tsx` 也直连 Directus(`loadSearchPagePrograms`,revalidate=900)。阶段一必须一并处理。
2. **`/pilot/*` 不是纯 Directus**:`lib/pilot-data.ts` 混用静态 JSON(`data/pilot/manhattan_school_of_music.json`)与 Directus 客户端,且 `force-dynamic`。照删不误。
3. **是 20/20 不是 19/20** 带 NOT FOR PRODUCTION 标记:第 20 个是 `data/v3/real/juilliard-vocal-arts-pilot.json:1991` 的英文变体。
4. **`data/schools.ts`(含 2 所虚构学校)与 `data/programs.ts` 已是孤儿文件**,全仓零引用。阶段一直接删除。
5. **package.json 里没有 Directus SDK 依赖**,Directus 访问是 `lib/directus/client.ts` 手写 fetch;"删依赖"实际是删代码与环境变量。
6. **静态包读取核心在 `data/v3/real-programs.ts`**(readFileSync,不在 lib/ 下),`next.config.ts:26-35` 有对应 `outputFileTracingIncludes` 三条。
7. **UK_music_conservatoires/ 是第四种子方言**(school.json + programs.json 拆分),与 output/ 的 v4 单文件不同。
8. ⚠️ **契约与渲染层不同构**:`data/contract/stage_music_admissions_v3.schema.json` 顶层是单数 `school`,无 `fields`/`degree_levels`/`publishing`;而页面组件经 `lib/program-v3/package-adapter.ts` 消费的实际包形状是复数 `schools` + 上述三键。决策 5(保留页面组件)与决策 7(读写同一校验器)要同时成立,**契约 schema 必须先修订为与渲染层同构的形状**(以 20 个生产包 + package-adapter 的实际消费字段为准)。已列为阶段一 Step 0,**此裁决请运营者确认后再放行阶段一**。
9. Berklee 数据现状:仓库只有 `output/berklee_college_of_music/berklee_college_of_music.json`(v4 单文件)。**Boston Conservatory at Berklee 与 Berklee NYC 无任何数据**,阶段三需先跑抽取。
10. 已有 OSS 先例:`scripts/ielts/listening-oss-assets.mjs`(ossutil,bucket `stage-listening-assets`,`oss-cn-shenzhen`)——仅 IELTS 音频,与本迁移无关,但可参考其凭据管理方式。

---

## 1. 阶段一提示词(数据通道重建 + 路由收敛 + 输出侧)

以下整段交给实现 session:

---

你在 D:\STAGE FRONT(Next.js 15 App Router,Vercel Hobby,Function Region hkg1,构建区域 iad1)执行"数据通道迁移 OSS"阶段一。基线已锁定为 git tag `pre-oss-migration`。**先通读本提示词并读相关代码,产出实施计划,经运营者确认后才动代码。**

### 背景与定论(不要重新论证)

- 数据唯一真相源:阿里云 OSS,区域 `oss-cn-hongkong`,私有 bucket(名称由运营者提供,先用环境变量占位)。运行时(hkg1)同区读取;构建期(iad1)读 OSS 只用于白名单枚举,量要小。
- Directus 彻底退场,物理删除;路由收敛为三条:`/schools`、`/schools/[slug]`、`/schools/[slug]/[programSlug]`。
- 新库从空开始;仓库里 `data/v3/real/` 的 20 个包**留在原地,不迁移不删除,但不再被任何代码读取**。
- 保留现有页面组件与视觉(`components/schools/browse/*`、`components/program/v3/*` 等),只换数据通道。
- 渲染:白名单预渲染 + `dynamicParams = true` + ISR `revalidate = 3600`。
- 硬约束:不许任何 fallback 到本地 JSON;不许"兼容旧格式"分支;旧路由物理删除;OSS AccessKey 只在服务端,严禁 `NEXT_PUBLIC_` 前缀、严禁被客户端组件 import。

### Step 0 —— 修订契约 schema(前置,单独提交;运营者已批准,附加约束见下)

`data/contract/stage_music_admissions_v3.schema.json` 目前与渲染层不同构(单数 `school`,缺 `fields`/`degree_levels`/`publishing`)。以 `lib/program-v3/package-adapter.ts` 的实际消费字段 + `data/v3/real/*.json` 的实际形状为准修订契约。**附加约束(运营者裁决):只如实描述现状——不新增业务字段、不改字段语义、不调整层级结构,任何"顺手优化"不做。** 唯二例外是本迁移必需的顶层 `status` 与 `last_checked`(下述)。修订后契约应做到:顶层 `schema_version, schools, fields, degree_levels, program_offerings, application_requirements, audition_requirements, source_records, publishing, data_quality, workflow_status`,并新增顶层 `status`("draft" | "published")与 `last_checked`(date)。`additionalProperties: false`,required 明确。用 20 个现有包 + ajv(strict mode)做一次全量校验,校验通过率与差异写进提交信息(现有包不必全过——它们不入新库——但差异清单要留档 `docs/roadmap/CONTRACT_V3_REVISION_NOTES.md`)。

### Step 1 —— OSS 读通道

- 新增依赖 `ali-oss`(仅服务端使用)。
- 新建 `lib/oss/client.ts`:从 `process.env.OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET / OSS_REGION`(region 默认 `oss-cn-hongkong`)构造客户端;文件顶部加 `import "server-only"`。
- 新建 `lib/oss/schools.ts`,只暴露三个读函数:
  - `readSchoolIndex()`:读 `index/schools.json`(对象键结构:`{ generated_at, schools: [{ slug, name, status, program_slugs: [...] }] }`,由写入端维护,阶段二实现;本阶段可手工上传一份空索引 `{ "generated_at": ..., "schools": [] }`)。
  - `readSchoolPackage(slug)`:读 `schools/{slug}.json`,读到后用 ajv 按修订版契约校验,校验失败视同不存在(记 console.error,返回 null)——**读写同一校验器**,校验器放 `lib/contract/validate.ts`,ajv 编译一次复用。
  - `readPublishedSchoolPackage(slug)`:在上者基础上过滤 `status === "published"`;draft 只有当调用方传入的 previewToken 与 `process.env.PREVIEW_TOKEN` 相等时返回,并由页面层加 `noindex`。
- 数据经 `lib/program-v3/package-adapter.ts` 现有适配逻辑喂给页面组件;适配器如需小改(如从"读全部 20 包"改为"按 slug 读单包"),改适配器,不改组件。

### Step 2 —— 路由收敛

保留并改造(全部走 OSS 读通道,`export const revalidate = 3600`):

- `app/(explore)/schools/page.tsx`:浏览页,从索引 + published 包构建 `buildBrowseModel` 输入。
- 新 `app/(explore)/schools/[slug]/page.tsx`:院校页(可复用现有 school 展示组件;若现有组件只在 Directus 路线存在,以静态包路线的组件为准重接)。
- `app/(explore)/schools/[slug]/[programSlug]/page.tsx`:专业页,由 `[schoolId]/[programSlug]` 改名迁移,保留 `assertNoReservedSlugCollisions` 保留字逻辑与 `opengraph-image.tsx`、`share-card/route.tsx`。
- 三条路由:`dynamicParams = true`;`generateStaticParams` 读仓库内白名单文件 `data/prerender-whitelist.ts`(初始为空数组;构建期不请求 OSS,避免 iad1 跨洋读)。404 逻辑:OSS 无此对象或非 published → `notFound()`。
- `/search`:**下线(运营者裁决,不迁 OSS)**。物理删除 `app/(explore)/search/` 全目录及 `loadSearchPagePrograms` 等专属数据代码;移除所有导航/页面里指向 `/search` 的入口(全仓 grep `"/search"` 清零,IELTS 等无关命中除外);在 `next.config.ts` 加 `redirects()` 项:`/search` → `/schools`,`permanent: true`(308)。重建等数据量上来后另立项。

物理删除(整个目录/文件,不是弃用):

- `app/(explore)/schools/[schoolId]/` 全目录(含 programs/[programId])
- `app/(explore)/pilot/`、`app/(explore)/v3-preview/`
- `lib/directus/`(client.ts、collections.ts)、`lib/data.ts` 及其消费面、`lib/pilot-data.ts`
- `data/schools.ts`、`data/programs.ts`(孤儿)、`data/pilot/`、`data/v3/preview-registry.ts` 及 mock
- `data/v3/real-programs.ts`(readFileSync 通道;**data/v3/real/*.json 数据文件保留**)
- `next.config.ts` 中三条 `./data/v3/real/**` 的 `outputFileTracingIncludes`(IELTS 两条保留)
- 环境变量引用 `DIRECTUS_URL` / `DIRECTUS_TOKEN` 的所有残留;`.env.example` 同步(新增 OSS_* 与 PREVIEW_TOKEN 占位)
- 全仓 grep `directus`(不区分大小写)必须为 0 命中(docs/ 与 memory 除外)。

### Step 3 —— 输出侧

- JSON-LD:院校页 `EducationalOrganization`、专业页 `Course`,从包数据映射(复用/扩展 `lib/program-v3/json-ld.ts`),禁止硬编码值。
- 机读端点:`app/schools/[slug].json/route.ts`(或 route handler 等价物)返回 published 包原文,draft 一律 404(**不认 preview token**,机读面只有 published)。`Content-Type: application/json`,`Cache-Control: s-maxage=3600`。
- 每页显示 `last_checked`(来自包顶层字段),位置与样式与现有"数据截至"类元素一致(参考现有 program 详情页的 retrieved_date 展示)。
- 核心信息(学费、截止日期、试音要求等)必须出现在 SSR HTML 中——用 `curl | grep` 可验,不依赖客户端 JS。
- `app/sitemap.ts`:只含三条收敛路由中 published 的页面;空库时只有 `/schools` 等静态项。
- `app/robots.ts`:保持现有 AI 爬虫 disallow 名单不动;`/v3-preview/`、`/pilot/` 的 disallow 项随路由删除一并清理;新增 disallow `?preview=` 不必(靠 noindex meta)。llms.txt 本阶段不做。

### 验收标准(全部满足才算完成)

1. `npx next build` 成功;构建产物页面数相对基线(约 1800 页)降到 **< 50 页**,构建时长显著低于 4m28s,两个数字写进交付报告。
2. 全仓无 `directus` 代码命中;无任何本地 JSON fallback 分支(重点检查 lib/oss/、页面 error 路径)。
3. `grep -r "NEXT_PUBLIC_OSS" .` 为 0;`lib/oss/*` 均含 `server-only`。
4. 三条 curl(对 `next start` 本地实例或 preview 部署,先手工上传一份符合修订版契约的最小测试包 `schools/_smoke-test.json`,status=published,验收后删除):
   - `curl -s http://localhost:3000/schools/_smoke-test | grep '<h1'` —— 院校页 SSR 含校名;
   - `curl -s http://localhost:3000/schools/_smoke-test/<programSlug> | grep 'application/ld+json'` —— 专业页含 Course JSON-LD;
   - `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/schools/_smoke-test.json` —— published 返 200;将包 status 改 draft 后重传,同一 URL 返 404,而 `/schools/_smoke-test?preview=$PREVIEW_TOKEN` 返 200 且 HTML 含 `noindex`。
5. 交付报告:改动文件清单、删除清单、构建数字、三条 curl 输出原文、遗留问题。

每完成一个 Step 单独 commit,消息用 `feat(oss1)` / `chore(oss1)` 前缀。

---

## 2. 阶段一独立复核提示词

以下整段交给复核 session(不同模型家族,不看实现者的自检):

---

你是独立复核者,在 D:\STAGE FRONT 验收"OSS 迁移阶段一"。实现者的报告仅作线索,一切以你亲手执行的结果为准。基线是 git tag `pre-oss-migration`,先 `git diff pre-oss-migration --stat` 总览改动。

逐项核查,每项给 PASS/FAIL 与证据:

1. **路由收敛**:`app/(explore)` 下与院校相关的路由只剩 `/schools`、`/schools/[slug]`、`/schools/[slug]/[programSlug]`(及其 opengraph-image / share-card / not-found 附属)。确认 `pilot/`、`v3-preview/`、`[schoolId]/` 目录已物理不存在;`/search` 要么走 OSS 数据要么已删除,不许残留 Directus 调用。
2. **Directus 归零**:`grep -ri directus app/ lib/ components/ data/ scripts/ next.config.ts package.json` 命中数为 0(docs 除外)。`lib/directus/`、`lib/data.ts`、`lib/pilot-data.ts` 不存在。`/search`:`app/(explore)/search/` 目录不存在,`curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/search` 返 308 且 Location 为 `/schools`,站内无残留 `/search` 入口链接。
3. **无 fallback**:通读 `lib/oss/*.ts` 与三条路由 page.tsx,确认不存在读本地 JSON 的分支、不存在 "兼容/legacy/fallback" 语义的代码路径。`data/v3/real-programs.ts` 已删,但 `data/v3/real/*.json` 20 个文件仍在且无代码引用(`grep -r "v3/real" app/ lib/ components/` 为 0)。
4. **凭据安全**:`grep -r "NEXT_PUBLIC_OSS" .` 为 0;`lib/oss/client.ts` 首行有 `server-only`;确认没有任何 `"use client"` 文件 import lib/oss(可用 `grep -rl "lib/oss" components/ app/` 后逐个查文件头)。
5. **读写同一校验器**:`lib/contract/validate.ts` 用 ajv 加载 `data/contract/stage_music_admissions_v3.schema.json`,且 `lib/oss/schools.ts` 读取路径确实过这个校验;schema 顶层含 `status` 与 `last_checked`,`additionalProperties:false`。
6. **构建**:亲自跑 `npx next build`,记录页面数与耗时,确认 < 50 页且无 ENOSPC/字体类失败;对比 `next.config.ts` 的 `outputFileTracingIncludes` 已不含 `data/v3/real`。
7. **三条 curl**:按阶段一验收第 4 条亲自执行(自己构造/上传 smoke 包,不用实现者留下的),原文粘贴输出。重点对抗性检查:draft 包不带 token 时,页面 404 且 `.json` 端点 404;带 token 时 HTML `<meta name="robots"` 含 noindex;JSON-LD 的值确实来自包数据(改包里学费数字→重新验证页面变化)而非硬编码。
8. **sitemap/robots**:`curl /sitemap.xml` 不含 draft 与已删路由;robots 仍禁 AI 爬虫。
9. **视觉未回归**:抽查专业详情页与浏览页,与 `pre-oss-migration` 基线截图/DOM 结构对比,组件层未被重写(git diff components/ 应接近于零或仅 props 适配)。

产出:逐项 PASS/FAIL 表 + 阻塞性问题清单。任何一条 FAIL 即打回,不给"有条件通过"。

---

## 3. 阶段二提示词(写入 API)

以下整段交给实现 session(前提:阶段一已通过独立复核):

---

你在 D:\STAGE FRONT 执行"OSS 迁移阶段二:写入 API"。阶段一已上线 OSS 读通道(`lib/oss/`、`lib/contract/validate.ts`)。**先出计划,确认后动代码。** 不做录入 UI。

### 端点设计(定论)

1. `POST /api/schools` —— `app/api/schools/route.ts`
   - 鉴权:`Authorization: Bearer <token>` 对比 `process.env.SCHOOLS_WRITE_TOKEN`,常量时间比较,失败 401。
   - Body:完整的 v3 canonical 包(修订版契约)。用 `lib/contract/validate.ts` 的同一 ajv 校验器,strict;**任何字段不合规整体拒绝(422),响应体列出每个失败字段的 instancePath + message,禁止部分写入**。
   - 写入语义:`status` 强制写为 `"draft"`(无论请求里写什么,覆盖之),`last_checked` 若缺省则拒绝(422)。对象键 `schools/{slug}.json`,slug 取包内 school slug,须过保留字校验(复用阶段一的 `assertNoReservedSlugCollisions` 逻辑,拒绝 `programs`/`share-card`/`opengraph-image`/`index` 等)。写包成功后**原子更新** `index/schools.json`(读-改-写,带 OSS 的 x-oss-meta 或 If-Match ETag 防并发覆盖;失败则整体报 500 并说明索引未更新)。
   - 同 slug 重复 POST = 整包覆盖(draft 迭代的正常路径);若线上已是 published,覆盖后自动降回 draft 并在响应中显式提示 `"previous_status": "published"`。
2. `POST /api/schools/[slug]/publish` —— 翻转 `status` 为 `"published"`,同步索引;404 当 slug 不存在。同鉴权。发布是人工动作:只由运营者手工 curl 触发,任何脚本/agent 不得自动调用。
3. `POST /api/schools/[slug]/unpublish` —— 对称回撤(错误数据被爬前的撤回通道)。
4. 所有端点 `export const dynamic = "force-dynamic"`;写成功后调用 `revalidatePath("/schools")`、`revalidatePath("/schools/[slug]", "page")` 等使 ISR 失效(publish/unpublish 也要),并 revalidate sitemap。

### 约束

- OSS 凭据仍只经 `lib/oss/client.ts`;新增写函数放 `lib/oss/write.ts`(`server-only`)。
- OSS bucket 与 RAM 子账号由运营者手工创建(已裁决),操作清单见本文档第 7 节;实现者不代办、不写额外 setup 文档。
- 不新增计划外抽象:没有 ORM、没有队列、没有 webhook。

### 验收标准

1. 单测(仓库现有测试框架)覆盖:401 无 token / 422 缺字段(断言响应列出字段路径)/ 422 多余字段(additionalProperties)/ 200 draft 写入 / publish 翻转 / 保留字 slug 拒绝 / published 被覆盖降级提示。
2. 三条 curl 实录(本地 `next start` + 真实 OSS 测试 bucket 或前缀):
   - 无 token POST → 401;
   - 删掉 `last_checked` 的包 POST → 422 且响应体含该字段路径;
   - 合规包 POST → 200,随即 `curl /schools/<slug>.json` 为 404(draft),`POST .../publish` 后同 URL 200,页面 1 小时内(或手动 revalidate 后)可见。
3. 交付报告同阶段一格式。

---

## 4. 阶段二独立复核提示词

---

你是独立复核者,验收 D:\STAGE FRONT 的"OSS 迁移阶段二:写入 API"。以 `git diff <阶段一验收 commit>` 为范围,亲手执行为准。

1. **鉴权**:读 `app/api/schools/route.ts`,确认 Bearer 比较是常量时间(非 `===` 直接比较可接受性自行判断并说明);无 token、错 token 均 401,响应不泄漏 token 存在性。
2. **整体拒绝**:构造一个 3 处不合规的包(缺 required、类型错、多余字段),POST 后断言 422 且**三处全部**出现在响应里;随后 GET OSS 确认对象未被写入、索引未变——半写入是最高级别 FAIL。
3. **draft 强制**:POST 一个 `status: "published"` 的包,读回 OSS 对象断言 status 是 draft。
4. **发布链路**:draft 期间 `/schools/<slug>` 404、`.json` 404、sitemap 不含;publish 后三者反转;unpublish 再反转回来。带 `?preview=` 的 draft 页含 noindex。
5. **并发**:同 slug 两个并发 POST(可用 `curl &` 或脚本),确认索引最终一致、无丢失更新;做不到就确认代码里有 ETag/If-Match 防护并说明其行为。
6. **凭据**:`grep -r "NEXT_PUBLIC_" app/api lib/oss` 为 0;写 token 不出现在任何客户端可达代码。
7. 亲跑全部单测;`npx next build` 通过。

产出 PASS/FAIL 表,任何半写入、鉴权绕过、draft 泄漏为阻塞性 FAIL。

---

## 5. 阶段三提示词(Berklee 入库与发布,操作性)

---

你在 D:\STAGE FRONT 执行"阶段三:Berklee 三校入库"。这是数据操作阶段,不写业务代码;发现代码 bug 记录并停下,不顺手修。

### 数据现状与范围(运营者裁决 2026-08-08)

- **三校(含 Berklee College of Music 主校)全部按新流程重新抽取**,不复用 `output/berklee_college_of_music/` 的 v4 抽取件;旧抽取件留在原处不动,不纳入本轮迁移。不写 v4→v3 转换脚本。
- 三校均需先取官方 admissions 页面 Markdown,用 `stage-music-admissions-extractor` skill 抽取。

### 步骤(每校独立走完一轮)

1. **抽取**:从官方页面 Markdown 直接产出符合修订版契约(`data/contract/stage_music_admissions_v3.schema.json`)的 v3 canonical 包,本地 `node scripts/oss/validate-package.mjs <file>` 过 ajv(该校验脚本是本阶段唯一允许新增的脚本,复用 `lib/contract/validate.ts` 的同一 schema)。`last_checked` 写实际核对日期,`status` 由 API 强制为 draft。
2. **入库**:`curl -X POST https://<站点>/api/schools -H "Authorization: Bearer $SCHOOLS_WRITE_TOKEN" -d @<file>` → 期待 200;422 则修数据重来,不改校验器。
3. **人工复核**:用 `/schools/<slug>?preview=$PREVIEW_TOKEN` 逐页核对:校名、学费(注意历史教训:单位"元 vs 万"级别的量纲错误)、截止日期、试音要求、外链可点。复核记录写 `docs/data-review/berklee/<slug>.md`(逐字段勾选表)。三校辨析是小红书引流主题,**三校的 slug、校名、城市字段要与笔记口径一致**。
4. **发布**:复核通过后由运营者本人执行 publish curl(你只准备好命令,不代执行)。发布后验证:页面公开可见、`.json` 端点 200、sitemap 收录、JSON-LD 有效(Google Rich Results Test 或 schema.org validator)、`last_checked` 展示正确。
5. **收尾**:三校全部 published 后,评估 `data/prerender-whitelist.ts` 是否加入三校 slug(加入则 commit 并重新部署);向运营者提交三校上线报告(URL 清单 + 复核记录链接)。llms.txt 与 robots 放行 AI 爬虫**仍不做**,留待运营者对数据复核完成度的单独裁决。

### 完成定义

三所学校 published、可从 `/schools` 浏览页进入、机读端点可用、复核记录留档。任何一校数据不全宁可停在 draft,不许为赶时间发布未复核内容。

---

## 6. 裁决记录(2026-08-08,运营者)

1. **契约修订:批准**,按渲染层实际形状修订;附加约束——只如实描述现状,不新增字段、不改语义、不调层级,任何"顺手优化"不做(已并入阶段一 Step 0)。
2. **/search:阶段一下线**,物理删除 + 移除入口 + 308 永久重定向 `/schools`,不迁 OSS;重建另立项(已并入阶段一 Step 2)。
3. **OSS bucket 与 RAM 子账号由运营者手工创建**,凭据只进 Vercel 环境变量;操作清单见第 7 节。
4. **Berklee 三校(含主校)不复用 output/ 现有 v4 抽取件**,阶段三全部重新抽取、走新写入 API 入库;旧抽取件保留原处,不纳入本轮迁移(已并入阶段三)。

---

## 7. 运营者操作清单:OSS bucket + RAM 子账号 + Vercel 环境变量

### 7.1 创建 bucket(阿里云控制台 → 对象存储 OSS)

| 选项 | 取值 | 说明 |
|---|---|---|
| Bucket 名称 | 建议 `stage-schools-data`(全局唯一,记下实际名) | |
| 地域 | **华南香港 `oss-cn-hongkong`** | 与 Vercel hkg1 同区 |
| 存储类型 | 标准存储 | |
| 读写权限 | **私有** | 一切读写走服务端签名,不开公共读 |
| 版本控制 | **开启** | 误覆盖可回滚,是 draft 迭代的安全网 |
| 服务端加密 | OSS 完全托管(SSE-OSS)即可 | |
| 其余(日志、CDN、跨域等) | 全部默认/关闭 | 不需要 |

无需预建目录;对象键 `schools/{slug}.json` 与 `index/schools.json` 由代码首次写入时自动生成。建议手工上传一份空索引到 `index/schools.json`,内容:`{"generated_at":"2026-08-08T00:00:00Z","schools":[]}`。

### 7.2 创建 RAM 子账号(RAM 控制台 → 用户)

1. 创建用户,建议登录名 `stage-schools-rw`;勾选 **仅"OpenAPI 调用访问"**(创建 AccessKey),不开控制台登录。
2. 创建后立刻保存 AccessKey ID / Secret(Secret 只显示一次)。
3. 不挂系统策略(如 AliyunOSSFullAccess),改为创建**自定义权限策略**(策略名建议 `stage-schools-bucket-rw`),JSON 如下(把 `stage-schools-data` 换成实际 bucket 名),然后授权给该用户:

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:GetObject",
        "oss:PutObject",
        "oss:HeadObject"
      ],
      "Resource": "acs:oss:*:*:stage-schools-data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "oss:ListObjects",
        "oss:GetBucketInfo"
      ],
      "Resource": "acs:oss:*:*:stage-schools-data"
    }
  ]
}
```

说明:无 DeleteObject(下架用 unpublish 翻状态,不物理删;真要删去控制台用主账号)、无跨 bucket 权限(IELTS 音频 bucket 不受影响)。

### 7.3 Vercel 环境变量(项目 Settings → Environment Variables)

全部只勾 **Production + Preview**(不需要区分),**均为服务端变量,不带 NEXT_PUBLIC_ 前缀**:

| 变量名 | 值 | 启用阶段 |
|---|---|---|
| `OSS_ACCESS_KEY_ID` | RAM 子账号 AccessKey ID | 阶段一 |
| `OSS_ACCESS_KEY_SECRET` | RAM 子账号 AccessKey Secret(标记 Sensitive) | 阶段一 |
| `OSS_BUCKET` | 实际 bucket 名,如 `stage-schools-data` | 阶段一 |
| `OSS_REGION` | `oss-cn-hongkong` | 阶段一 |
| `PREVIEW_TOKEN` | 自生成随机串(如 `openssl rand -hex 24`),draft 预览用 | 阶段一 |
| `SCHOOLS_WRITE_TOKEN` | 另一个独立随机串,写入 API 鉴权用,**与 PREVIEW_TOKEN 不同值**(标记 Sensitive) | 阶段二 |

本地开发:同一组变量写进 `.env.local`(已在 .gitignore);`.env.example` 由阶段一实现者补占位名。旧的 `DIRECTUS_URL` / `DIRECTUS_TOKEN` 在阶段一验收通过后从 Vercel 删除。
