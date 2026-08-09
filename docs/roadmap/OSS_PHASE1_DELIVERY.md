# OSS 迁移阶段一 · 交付报告

> 2026-08-08 起,**2026-08-09 生产验收完成** · 基线 `pre-oss-migration`(cbfe194)→ `86dd7b5`
> 实现者自检**不作为验收依据**;本报告供独立复核 session 作线索,一切以复核者亲手执行的结果为准。
> 复核提示词见 [OSS_MIGRATION_PROMPTS.md](OSS_MIGRATION_PROMPTS.md) 第 2 节。
>
> **生产环境实参**:bucket `stage-front-schools-hk` @ `oss-cn-hongkong`,Function Region `hkg1`(同区)。
> 站点 https://www.studyabroadfirst.cn 当前为**空库**,等待阶段三 Berklee 入库。

---

## 1. 提交清单

| Commit | Step | 内容 |
|---|---|---|
| `2d239dc` | Step 0 | 契约按渲染层实际形状重写;新增顶层 `status`/`last_checked` |
| `92d74e4` | Step 0 补 | `field_tiers` 使用约束入留档 |
| `487aa50` | Step 1 | OSS 读通道:client / 唯一校验器 / 三个读函数 |
| `7399052` | Step 2 | 路由收敛为三条 + Directus 与旧路由物理删除 |
| `a2570af` | Step 3 | 输出侧:AI 爬虫关闭、JSON-LD、机读端点、`last_checked`、metadata |
| `4c0bc94` | 工具 | 契约校验 CLI(阶段三入库前置检查) |
| `98226fb` | 验收修正 | 凭据门替换构建期短路、sitemap 加 revalidate、smoke 修复 |
| `be9ca4d` | 文档 | 阶段一交付报告(本文件)初版 |
| `296b1db` | 文档 | 复核提示词对齐实现后事实 |
| `fad5aa1` | 生产事故修复 | OSS 5s 超时快速失败;连接失败绝不降级为 404 |
| `4365e3d` | 文档 | 换桶顺序缺陷修正(迁移期双桶授权、空库捷径) |
| `86dd7b5` | 验收修正 | 预览面补 `generateMetadata`,与上线后逐字相同 |

## 2. 构建数字

| 指标 | 基线 | 交付 |
|---|---|---|
| 构建时长 | **4m28s** | **32s**(热构建,`.next/cache` 存在) |
| 院校路由预渲染页数 | **约 1778** | **1**(`/schools`) |
| 全站预渲染总页数 | — | 568(其中 **557 是 IELTS 题库**,不属本迁移范围) |

院校侧从 1778 页降到 1 页;剩余 567 页与本迁移无关。验收标准"院校构建页数 < 50"达成。

**冷构建正常,期间的三次失败是我自己造成的(过程如实记录)**:为取冷构建时长,我删掉整个 `.next` 后连续三次没跑通(一次 exit 255 停在 `Generating static pages (396/792)`,两次卡在编译阶段十分钟以上)。我一度归因于 memory 里的 `stage-build-font-nondeterminism`,**但实测推翻了**:`fonts.googleapis.com` 返回 200(1.5s),真实字体文件 10.5 MB 从 `fonts.gstatic.com` 下载耗时 3.6s,网络通畅。

真正的原因是**我在验收过程中多次 `taskkill /F /IM node.exe` 打断了正在跑的构建**,留下不一致的中间状态。全部 node 进程清干净、`rm -rf .next` 后重跑,冷构建一次成功:编译 20.5s,`Generating static pages (792/792)`,产物 `artifact: startable`,568 预渲染页、院校路由 1 页——与热构建结果一致。

结论:**构建没有问题,memory 里的字体抖动在本次未复现**;第 2 节的时长数字取自热构建(31–35s),冷构建成功但未精确计时。这段折腾是我的操作失误,写在这里以免复核者按错误线索排查。

## 3. 三条 curl 验收(本地 `next start`,真实 OSS)

冒烟包:`schools/smoke_test_conservatory.json`(一所学校、一个 `voice-bm` 专业,`last_checked: 2026-08-08`),经 `scripts/oss/validate-package.mjs` 过契约。

### 3.1 院校页 SSR 含校名

```
GET /schools/smoke_test_conservatory     status=200  time=0.419s  bytes=25138
<title>冒烟测试音乐学院 招生信息 · STAGE</title>
本页数据核对至 <!-- -->2026-08-08
"@type":"EducationalOrganization"        ×1
```

`本页数据核对至` 与日期之间的 `<!-- -->` 是 React 的文本节点分隔注释,不是缺陷(第一次 grep 因此漏匹配,已核实)。

### 3.2 专业页含 Course JSON-LD

```
GET /schools/smoke_test_conservatory/voice-bm    status=200  time=0.088s  bytes=31336
<title>冒烟测试音乐学院 声乐 (BM) 申请要求 · STAGE</title>
"@type":["Course","EducationalOccupationalProgram"]
```

核心事实均在 SSR HTML 中(非客户端 JS):截止日期 `2026-12-01`、费用 `550000`、`TOEFL`、`预筛`、`声乐` 各命中。

### 3.3 机读端点与 draft 语义

published 态:

```
GET /schools/smoke_test_conservatory.json   200  application/json
    payload: status=published  last_checked=2026-08-08  offerings=1  publishing.programs=1
GET /sitemap.xml → 4 条:/、/schools、/schools/{slug}、/schools/{slug}/voice-bm
```

翻成 draft 后(缓存干净的实例上实测):

| 请求 | 结果 | 期望 |
|---|---|---|
| `.json` 端点 | 404 | 404 ✓ |
| 院校页 无 token | 404 | 404 ✓ |
| 院校页 错 token | 404 | 404 ✓ |
| 院校页 对 token | 200,`<meta name="robots" content="noindex, nofollow">`,校名在 SSR | 200 ✓ |
| 专业页 对 token | 200 | 200 ✓ |

## 4. smoke 与最终空库状态

`npm run smoke` **9/9 PASS**(含 `/search` 308 → `/schools`、`/schools/does-not-exist` 404),published 态与最终空库态各跑一次,均 9/9。

清理后的最终状态实测(`index/schools.json` 已清空、冒烟包留在 draft):

```
/schools                            200,冒烟校名残留 0 处
/sitemap.xml                        仅 2 条:/ 与 /schools
/schools/smoke_test_conservatory      404
/schools/smoke_test_conservatory.json 404
```

即站点处于"空库从零开始"的正确状态(决策 4),等待阶段三 Berklee 入库。

## 5. 验收中发现并已修复的缺陷(2 个)

这两个都是我在 Step 2/3 写下、自检没抓到、验收才暴露的。

**① sitemap 永远为空。** `app/sitemap.ts` 没有 `revalidate`,Next 把它当完全静态资源,只在构建期生成一次。配合当时的构建期短路,结果是**已发布的学校永远进不了 sitemap**,除非重新部署。已加 `export const revalidate = 3600`。

**② 构建期短路的代价被低估。** 原实现按 `NEXT_PHASE === "phase-production-build"` 短路 OSS 读取(理由是决策 1 的"读取尽量放运行时")。但 `/schools` 与 `sitemap.xml` 是构建期静态生成的,短路把空态烙进产物:`/schools` 要等 ISR(1 小时)才有数据。对一个要承接小红书流量的站,这是真损失。

判据已改为**凭据是否存在**而非构建阶段:Vercel 构建持有 `OSS_*` → 构建期即读真实目录(院校量级两位数,只读 index + 每所一个对象),页面与 sitemap 一上线即正确;本地/CI 无凭据 → 空目录 + 告警,构建照常通过。不违反硬约束 A:没有第二数据源、没有本地 JSON 兜底,空就是空;有凭据而 OSS 不可达时错误照抛,构建响亮失败而不是静默出空站。

修复后实测:`/schools` 构建产物即含数据,sitemap 4 条齐全。

## 5b. 生产环境事故与最终验收(2026-08-09)

第 3–4 节是**本地** `next start` 的结果。推送到 Vercel 后暴露了本地测不出的问题,以下是完整经过与线上实测。

### ① 生产事故:跨境不可达(已修复)

首个部署上线后,**全部院校页 500**。Vercel 运行时日志:

```
Error [RequestError]: connect ETIMEDOUT 112.74.1.117:443
```

bucket 当时建在 `oss-cn-shenzhen`,Function Region 是 `hkg1` —— **香港到深圳跨境,TCP 连不上**。不是延迟问题,是不可达。构建期(iad1,美东)走国际线路反而通,所以构建成功、运行时全挂,本地(境内)也一切正常 —— 三个环境的结论互相矛盾,只有线上日志能定位。

诊断过程中我犯过一个错:黑盒探测时看到"页面路由必挂、机读端点正常",据此推断"问题在索引读取路径",还用了 17s∶31s 的 2 倍关系佐证。日志出来后证明是错的 —— 连接是**时好时坏**的,不同 lambda 实例解析到的 OSS IP 不同,拿到不通那个 IP 的实例就一直超时。以观察到的巧合过度归因,记在这里。

**修复**:bucket 迁到 `oss-cn-hongkong`(即决策 1 原本的要求),与 hkg1 同区。因为库是空的(只有一个空索引 + 一个孤儿 draft 冒烟包),迁移退化成"新桶留空即可" —— `readSchoolIndex()` 读不到索引会按空库处理,这是被捕获的正常分支。

**顺带修掉的文档缺陷**:换桶顺序初稿写的是"改 RAM 策略 → 迁对象 → 切变量",实际执行时第 2 步一保存,子账号立刻失去旧桶权限,迁移脚本读不了源端、线上构建随即 403 失败(运营者实际踩到)。已改为**迁移全程新旧双桶授权,验收通过后再收回最小权限**,并补了空库捷径。

### ② 代码加固(`fad5aa1`)

事故暴露的不只是地域:客户端**没设超时**,用户要等 16–31 秒才拿到 500,故障被拖成"页面卡死"。

- `ali-oss` 超时设为 **5 秒**。同区读几 KB JSON 正常在百毫秒内,超过必是网络问题,应立刻暴露。
- 错误分类抽为纯函数 `lib/oss/errors.ts`:**只有 `404`/`NoSuchKey` 算"对象不存在"**,`ETIMEDOUT`/`AccessDenied`/`503` 一律抛出。配 5 项离线测试,其一直接用本次事故的错误对象当输入。这组测试防的是反方向的诱惑:日后有人为"让页面别 500"把 catch 放宽成"任何错误都当不存在",会让已发布的院校在网络抖动时显示"学校未找到" —— 静默的数据丢失比诚实的 500 危险得多。

### ③ 迁香港后的线上实测

| 探测项 | 迁移前(深圳) | 迁移后(香港) |
|---|---|---|
| 院校页(走索引读取) | **500 / 31.4s** | **404 / 0.62s** |
| 预览路由(force-dynamic) | **500 / 17.0s** | **404 / 0.90s** |
| 机读端点(不存在的 key) | 500 / 16.5s(冷)后转正常 | 404 / 0.92s |
| 稳定性抽样 8 个全新 slug | — | **8/8 全部 404,0.61–0.89s,零超时** |

### ④ draft 全链路验收(线上,`?preview=`)

上传 draft 包到香港桶后,在**生产环境**实测:

```
A. draft 门禁(公开面必须全部拒绝)
   院校页 无 token          404   0.70s
   院校页 错 token          404
   专业页 无 token          404
   机读端点 无 token        404
   机读端点 带 preview token 404   ← 机读面无预览语义,设计如此

B. 预览面全链路(?preview=<token>)
   院校页  200  0.67s  21605B
     <title>冒烟测试音乐学院 招生信息 · STAGE</title>
     <meta name="robots" content="noindex, nofollow">
     本页数据核对至 2026-08-08
     校名在 SSR 1 处 | EducationalOrganization JSON-LD 1 处
   专业页  200  0.60s  22157B
     <title>冒烟测试音乐学院 声乐 (BM) 申请要求 · STAGE</title>
     <meta name="robots" content="noindex, nofollow">
     "@type":["Course","EducationalOccupationalProgram"]
     核心事实均在 SSR HTML:2026-12-01 / 550000 / TOEFL / 预筛 / 声乐

C. draft 不得进入任何公开索引面
   /schools 浏览页含冒烟校名   0 处
   sitemap                     仅 / 与 /schools 两条
   robots                      六个 AI 爬虫全部 Disallow: /
```

### ⑤ 验收中发现并修复的第三个缺陷(`86dd7b5`)

预览面只导出了静态 `robots`,没有 `generateMetadata` —— 复核者在 `?preview=` 里看到的是**根布局的默认标题**。而阶段三的人工复核正是拿预览逐页核对的、标题本身也在核对范围内,等于这一项没法核。已把院校/专业的 title+description 抽为单一来源(`lib/program-v3/page-metadata.ts`),公开面与预览面共用,预览面只额外叠加 noindex;配测试钉住"逐字相同、只差 noindex"。上表 B 段的标题即修复后的线上实测结果。

### ⑥ 唯一未做的验收项:published → 200

三条 curl 里"published 包返回 200"这一条**在生产上没做**,这是我的决定,理由如下:

发布一所虚构的"冒烟测试音乐学院"意味着它会**公开可见**(robots 对普通搜索引擎放行)。而本报告第 6 节记录的发现是:**阶段二的 unpublish + revalidatePath 尚不存在,所以我没有即时撤回手段** —— 翻回 draft 后已缓存的页面最长仍公开一小时。也就是说,一旦发布,我无法在爬虫可能到访的窗口内把它撤下来。

用假数据换一条验收记录,代价是虚构院校信息可能被搜索引擎收录 —— 这与本项目"数据未复核前不放行 AI 爬虫"的整体谨慎口径相悖。**该链路的其余部分已被 draft+preview 全覆盖**(OSS 读取、契约校验、渲染、JSON-LD、last_checked、metadata),缺的只是 `status === "published"` 这一个布尔分支,而它在本地 `next start` 上已实测通过(第 3 节)。

建议:这条留到**阶段三 Berklee 真实数据入库时**用真数据补齐 —— 那时发布本来就是目标,不需要为验收制造假数据。

---

## 6. 需要下一阶段处理的发现

**① unpublish 不是即时的(阻塞级,已写进阶段二提示词与复核标准)。** 三条路由是 ISR,把包翻成 draft **不会**让已缓存页面立即下线——实测已渲染过的页面继续公开返回 200,最长一小时。清空缓存后立即 404,**所以鉴权本身没有漏洞**,但"错误数据被爬前的撤回通道"必须是即时的。阶段二的 unpublish 端点必须同步 `revalidatePath` 掉 `/schools`、`/schools/[slug]`、该校每个专业页、`/sitemap.xml`,复核要实测"unpublish 后立刻 404"。

**② 地域跨境 —— 已在 2026-08-09 解决**,详见第 5b 节 ①。bucket 迁至 `oss-cn-hongkong`,与 hkg1 同区,线上实测 8/8 零超时、0.61–0.89s。旧的深圳桶 `stage-front-schools` 建议留几天回退期后由主账号删除;RAM 策略在验收通过后应收回成**只授权新桶**(迁移期的双桶授权是临时状态)。

**③ 冒烟数据的最终状态。** RAM 策略按设计不含 `DeleteObject`,我无法物理删除冒烟包。**香港新桶**里现状:`index/schools.json` 为 `{"schools": []}`,`schools/smoke_test_conservatory.json` 留在 `draft` 作孤儿对象(运营者已确认可留)。站点即"空库从零开始"的正确状态(决策 4)。要物理删除请用主账号在控制台操作;旧深圳桶里还有一份同名对象,一并删桶即可。

**④ `.env.local` 与 Vercel 的 `DIRECTUS_*` 变量**:Vercel 侧运营者已清理(清理触发的 403 构建失败见第 5b 节 ①)。本地 `.env.local` 仍有残留,代码侧零引用,可随手删。

**⑤ `graceful-fs` 构建警告(无需处理,已查证)。** 构建日志有 `Module not found: Can't resolve 'graceful-fs' in node_modules/mz`,来自 ali-oss 依赖链。`mz/fs.js` 是 `try { require('graceful-fs') } catch { require('fs') }`,graceful-fs 不是 mz 声明的依赖,webpack 看不见 try/catch 兜底所以报 warning 而非 error,运行时回落到 Node 内置 fs。OSS 读写在构建期与运行时均已实证正常。加装该依赖只为消一条装饰性警告,不建议。

## 7. 与计划的偏离(均已逐条经运营者确认)

| 偏离 | 说明 |
|---|---|
| bucket 地域改回 `oss-cn-hongkong` | 首次实建误用深圳,生产不可达;迁回决策 1 原本要求的同区(第 5b 节 ①) |
| 预览路由 `/schools-preview/*` | 计划只说 `?preview=<token>`。Next 15 里页面读 `searchParams` 会让整条路由退化为动态、ISR 失效。改为 middleware 把带 `?preview=` 的请求 rewrite 到 force-dynamic 的预览面,公开 URL 契约不变 |
| 机读端点内部落点 `/schools-json/[slug]` | 目录不能命名为 `[slug].json`(Next 动态段必须占满整段),同样经 middleware 分流;公开 URL 仍是 `/schools/{slug}.json` |
| JSON-LD 用多类型而非单 `Course` | 单换 Course 会让 `applicationDeadline`/`timeToComplete` 变成非法键。改用 `["Course","EducationalOccupationalProgram"]`,validator.schema.org 实测 0 错 0 警告 |
| 删除面大于计划 | Directus 退场牵出 reviewer 编辑面、login 页与只被已删路由消费的孤儿组件簇 |
| `data/v3/mock-programs.ts` 保留 | 计划写了要删,但它是 9 个测试文件的夹具、生产零引用,按"20 包留仓库"同一逻辑保留为夹具 |
| `directus` 字面残留 | 已收敛为**可机械核对的豁免清单**,见第 7b 节(复核裁决 2026-08-09) |

## 7b. `directus` 字面残留豁免清单(复核裁决 2026-08-09)

原表述"字面残留 2 处"不准确也不可核对 —— 它漏掉了数据文件里的大量出现,又把已删除脚本算了进去。改为按目录分类的显式清单,复核者可逐条 grep 验证。

**零豁免区(必须 0 命中)**:`app/` `lib/` `components/` `scripts/` `tests/` `middleware.ts` `next.config.ts` `package.json`

```bash
grep -rni directus app lib components scripts tests middleware.ts next.config.ts package.json | grep -v node_modules | wc -l
# 期望:0(2026-08-09 实测 0)
```

**豁免区**,逐条列明理由:

| 位置 | 命中数 | 豁免理由 |
|---|---|---|
| `data/contract/stage_music_admissions_v3.schema.json` | 2 | 契约字段名 `ready_for_directus_import`。Step 0 的裁决是"只如实描述现状、不改语义",重命名字段就是改语义;且运营者 2026-08-09 明确裁定**维持不动** |
| `data/v3/real/` 20 个包 | 42 | 保留的测试夹具。命中来自 `ready_for_directus_import` 值与 `data_quality.review_notes` 里记录出处的原文。**这些是历史语料,改动即篡改记录** |
| `data/extractions/` `data/examples/` | 25 | 保留的 v4 归档与示例,同上 |
| `docs/` | 4413 | 历史文档与本迁移自身的记录。删掉就没法追溯为什么迁移 |

清点口径:命中数为 2026-08-09 实测值(`grep -rni directus <目录> | wc -l`),含注释与字符串。数字变化本身不是问题,**零豁免区破零才是**。

---

## 8. 硬约束自检

| 约束 | 状态 |
|---|---|
| A 单一真相源,无本地 JSON fallback | `grep -r "v3/real" app/ lib/ components/` = 0;20 个旧包仅 `tests/fixtures/` 引用 |
| B 旧路由物理删除 | `[schoolId]/`、`pilot/`、`v3-preview/`、`search/`、`login/` 目录均不存在 |
| C 无"兼容"代码 | 无 legacy/fallback 分支 |
| D 每阶段一件事、先计划后写码 | Step 0–3 逐个提交并经确认 |
| E 凭据仅服务端 | `grep -r "NEXT_PUBLIC_OSS"` = 0;`lib/oss/*` 首行 `server-only` |
| F 独立复核 | 待复核 session 执行 |
