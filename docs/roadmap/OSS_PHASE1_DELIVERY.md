# OSS 迁移阶段一 · 交付报告

> 2026-08-08 · 基线 `pre-oss-migration`(cbfe194)→ 交付 HEAD
> 实现者自检**不作为验收依据**;本报告供独立复核 session 作线索,一切以复核者亲手执行的结果为准。
> 复核提示词见 [OSS_MIGRATION_PROMPTS.md](OSS_MIGRATION_PROMPTS.md) 第 2 节。

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
| (本次) | 验收修正 | 凭据门替换构建期短路、sitemap 加 revalidate、smoke 修复 |

## 2. 构建数字

| 指标 | 基线 | 交付 |
|---|---|---|
| 构建时长 | **4m28s** | **32s**(热构建,`.next/cache` 存在) |
| 院校路由预渲染页数 | **约 1778** | **1**(`/schools`) |
| 全站预渲染总页数 | — | 568(其中 **557 是 IELTS 题库**,不属本迁移范围) |

院校侧从 1778 页降到 1 页;剩余 567 页与本迁移无关。验收标准"院校构建页数 < 50"达成。

**冷构建注意(既有环境问题,不是本次改动引入)**:删除 `.next` 后的冷构建两次都没跑通——第一次在静态生成阶段中途退出(exit 255),第二次卡在 `Creating an optimized production build ...` 超过 10 分钟无进展、被我终止;两次之后紧接着的热构建都立即成功(32s)。症状与 memory 记录的 Google 字体下载抖动一致(`stage-build-font-nondeterminism`:字体下载被 reset 时构建会异常结束)。**未取到指向字体的直接日志证据**——两次失败的输出都停在字体阶段之前/之中,没有打出具体错误行。结论按"高度疑似、未确证"记;Vercel 侧保留 `.next/cache` 可回避。复核者若要核这一条请自行冷构建观察,不要把它当作已确证的结论。

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

## 4. smoke

`npm run smoke` **9/9 PASS**(含 `/search` 308 → `/schools`、`/schools/does-not-exist` 404)。

## 5. 验收中发现并已修复的缺陷(2 个)

这两个都是我在 Step 2/3 写下、自检没抓到、验收才暴露的。

**① sitemap 永远为空。** `app/sitemap.ts` 没有 `revalidate`,Next 把它当完全静态资源,只在构建期生成一次。配合当时的构建期短路,结果是**已发布的学校永远进不了 sitemap**,除非重新部署。已加 `export const revalidate = 3600`。

**② 构建期短路的代价被低估。** 原实现按 `NEXT_PHASE === "phase-production-build"` 短路 OSS 读取(理由是决策 1 的"读取尽量放运行时")。但 `/schools` 与 `sitemap.xml` 是构建期静态生成的,短路把空态烙进产物:`/schools` 要等 ISR(1 小时)才有数据。对一个要承接小红书流量的站,这是真损失。

判据已改为**凭据是否存在**而非构建阶段:Vercel 构建持有 `OSS_*` → 构建期即读真实目录(院校量级两位数,只读 index + 每所一个对象),页面与 sitemap 一上线即正确;本地/CI 无凭据 → 空目录 + 告警,构建照常通过。不违反硬约束 A:没有第二数据源、没有本地 JSON 兜底,空就是空;有凭据而 OSS 不可达时错误照抛,构建响亮失败而不是静默出空站。

修复后实测:`/schools` 构建产物即含数据,sitemap 4 条齐全。

## 6. 需要下一阶段处理的发现

**① unpublish 不是即时的(阻塞级,已写进阶段二提示词与复核标准)。** 三条路由是 ISR,把包翻成 draft **不会**让已缓存页面立即下线——实测已渲染过的页面继续公开返回 200,最长一小时。清空缓存后立即 404,**所以鉴权本身没有漏洞**,但"错误数据被爬前的撤回通道"必须是即时的。阶段二的 unpublish 端点必须同步 `revalidatePath` 掉 `/schools`、`/schools/[slug]`、该校每个专业页、`/sitemap.xml`,复核要实测"unpublish 后立刻 404"。

**② 地域与 Function Region 不同区。** bucket 实际建在 `oss-cn-shenzhen`,Function Region 是 `hkg1`。决策 1 原本要的是同区(`oss-cn-hongkong`)。香港到深圳跨境,延迟与稳定性都不同于同区读取。本机到深圳实测 27–102ms/对象,但**这不是生产路径的数字**(生产是 hkg1 → 深圳),尚未测量。建议部署后测一次线上冷请求耗时再判断是否要处理。

**③ 冒烟数据的最终状态。** RAM 策略按设计不含 `DeleteObject`,我无法物理删除冒烟包。已把 `index/schools.json` 清空为 `{"schools": []}`、冒烟包 `status` 留在 `draft` —— 站点即处于"空库从零开始"的正确状态(决策 4),冒烟包对外完全不可见。要物理删除,请用主账号在 OSS 控制台删 `schools/smoke_test_conservatory.json`。

**④ `.env.local` 与 Vercel 的 `DIRECTUS_*` 变量仍在**,代码侧已零引用,请手工删除。

## 7. 与计划的偏离(均已逐条经运营者确认)

| 偏离 | 说明 |
|---|---|
| 预览路由 `/schools-preview/*` | 计划只说 `?preview=<token>`。Next 15 里页面读 `searchParams` 会让整条路由退化为动态、ISR 失效。改为 middleware 把带 `?preview=` 的请求 rewrite 到 force-dynamic 的预览面,公开 URL 契约不变 |
| 机读端点内部落点 `/schools-json/[slug]` | 目录不能命名为 `[slug].json`(Next 动态段必须占满整段),同样经 middleware 分流;公开 URL 仍是 `/schools/{slug}.json` |
| JSON-LD 用多类型而非单 `Course` | 单换 Course 会让 `applicationDeadline`/`timeToComplete` 变成非法键。改用 `["Course","EducationalOccupationalProgram"]`,validator.schema.org 实测 0 错 0 警告 |
| 删除面大于计划 | Directus 退场牵出 reviewer 编辑面、login 页与只被已删路由消费的孤儿组件簇 |
| `data/v3/mock-programs.ts` 保留 | 计划写了要删,但它是 9 个测试文件的夹具、生产零引用,按"20 包留仓库"同一逻辑保留为夹具 |
| `directus` 字面残留 2 处 | 契约字段 `ready_for_directus_import`(不改语义约束禁止重命名)与 Python validator 的"禁止 Directus ID"守卫文案 |

## 8. 硬约束自检

| 约束 | 状态 |
|---|---|
| A 单一真相源,无本地 JSON fallback | `grep -r "v3/real" app/ lib/ components/` = 0;20 个旧包仅 `tests/fixtures/` 引用 |
| B 旧路由物理删除 | `[schoolId]/`、`pilot/`、`v3-preview/`、`search/`、`login/` 目录均不存在 |
| C 无"兼容"代码 | 无 legacy/fallback 分支 |
| D 每阶段一件事、先计划后写码 | Step 0–3 逐个提交并经确认 |
| E 凭据仅服务端 | `grep -r "NEXT_PUBLIC_OSS"` = 0;`lib/oss/*` 首行 `server-only` |
| F 独立复核 | 待复核 session 执行 |
