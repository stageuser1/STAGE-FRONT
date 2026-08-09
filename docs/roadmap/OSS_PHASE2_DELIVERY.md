# OSS 迁移阶段二 · 交付报告(写入 API + 预览面 404 可区分)

> 2026-08-09 · `bd18dcb` → `89d63cc` · 生产实测完成 · **即时撤回五面闭环已由运营者人工验证(第 3.3b 节)**
> 实现者自检**不作为验收依据**;本报告供独立复核 session 作线索,一切以复核者亲手执行的结果为准。
> 复核提示词见 [OSS_MIGRATION_PROMPTS.md](OSS_MIGRATION_PROMPTS.md) 第 4 节。
>
> 生产:https://www.studyabroadfirst.cn · bucket `stage-front-schools-hk` @ `oss-cn-hongkong` · Function Region `hkg1`

---

## 1. 提交清单

| Commit | 内容 |
|---|---|
| `e7343c3` | 复核判据顺序入总则(线上实测 > 源码推断) |
| `5d80eef` | 裁决记录:硬约束 D 豁免与边界、索引重建、整体失效 |
| `4500736` | 写入 API 三端点 + 预览面四态可区分 |
| `d4093d4` | CLAUDE.md 固定工作约定(提交后立即 push 等) |
| `89d63cc` | 机读端点改 `no-store`(CDN 缓存打穿撤回通道) |

## 2. 交付内容

**三个端点**(`app/api/schools/…`,全部 `force-dynamic`):

- `POST /api/schools` —— 整包写入,强制 draft
- `POST /api/schools/{slug}/publish`
- `POST /api/schools/{slug}/unpublish`

**关键设计**:

- 鉴权 Bearer + sha256 定长比较(不泄露 token 长度);**失败关闭** —— 环境变量未配置时一律 401。这条在本轮真实生效过:生产上 `SCHOOLS_WRITE_TOKEN` 曾被误删,结果是"谁都写不进去"而不是"谁都能写"。
- 整包拒绝:任何字段不合规都不写入任何内容,422 列出全部 `instancePath`。
- `status` 强制 draft;覆盖 published 会降回 draft 并显式 `previous_status` + `notice`。
- 写入期保留字守卫,与读取侧共用同一份 `RESERVED_PROGRAM_SLUGS`。
- 索引**重建**而非读-改-写(裁决 6):幂等,丢失更新在结构上不可能发生。
- `revalidate` 覆盖:动态路由整体失效 **+ 本次涉及的具体路径**(见第 4 节 ②)。

**预览面四态可区分**:`ok` / `missing` / `invalid` / `forbidden`。token 有效时 `missing` 给出 bucket+region、`invalid` 给出具体字段路径;**token 无效一律 `notFound()`**。

## 3. 生产实测记录

### 3.1 写入闸门

```
① 无 token                → 401  {"error":"unauthorized"}
② 错 token                → 401
③ 三处违规(缺字段/状态非法/空 URL) → 422,violations = 3,全部报出:
     (顶层)                          must have required property 'last_checked'
     /status                          must be equal to one of the allowed values
     /program_offerings/0/program_url must NOT have fewer than 1 characters
④ publishing.programs[0].slug = "share-card" → 422
     /publishing/programs/0/slug  slug "share-card" 命中保留字…(T3b-R1)
⑤ 合规包 POST             → 200
     {"slug":"smoke_test_conservatory","status":"draft","programs":1,
      "last_checked":"2026-08-08","previous_status":"draft"}
```

### 3.2 发布链路(**先确认起点真的 200 过**)

```
draft 态(起点)  院校页 404 · 专业页 404 · 机读 404 · sitemap 0 条 · 浏览页 0 处
publish          {"slug":"…","status":"published","changed":true}
publish 后       院校页 200 · 专业页 200 · 机读 200 · sitemap 2 条 · 浏览页 1 处
                 机读端点 Cache-Control: no-store
```

### 3.3 阻塞项:即时撤回

```
unpublish        {"slug":"…","status":"draft","changed":true}
立刻复查(不等待) 院校页 404 · 专业页 404 · 机读 404 · sitemap 0 条 · 浏览页 0 处
```

**五个面同时即时下线**,无需等待任何 revalidate 周期。

### 3.3b 人工验证:即时撤回五面闭环(复核要求项,2026-08-09)

复核结论中唯一的缺口是"即时撤回五面闭环需人工验证"。由**运营者本人**在浏览器中逐面确认,实现者只负责调 API 与采集响应头。

**公开窗口:07:34:21Z → 07:38:06Z,共 3 分 45 秒。**

| 面 | published(人工确认) | unpublish 后(人工确认) |
|---|---|---|
| ① 院校页 `/schools/smoke_test_conservatory` | 200 | 404 |
| ② 专业页 `/schools/smoke_test_conservatory/voice-bm` | 200 | 404 |
| ③ 机读端点 `/schools/smoke_test_conservatory.json` | 200,载荷含 `"status":"published"`(截图存档) | 404 |
| ④ `/sitemap.xml` | 含 smoke_test 两条(截图存档) | 0 条 |
| ⑤ 浏览页 `/schools` | 列表出现「冒烟测试音乐学院」 | 0 处 |

实现者侧的服务端复查与人工结果一致。

**机读端点响应头两次采集对照**(本项核心证据):

```
$ curl -sSI https://www.studyabroadfirst.cn/schools/smoke_test_conservatory.json
--- published,07:34:45Z ---
HTTP/1.1 200 OK
Age: 0
Cache-Control: no-store
Content-Type: application/json
Date: Sun, 09 Aug 2026 07:34:45 GMT
Server: Vercel
X-Matched-Path: /schools-json/[slug]
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::hkg1::xn5nn-1786260885669-2791f89113b3

--- unpublish 后 31 秒,07:38:37Z ---
HTTP/1.1 404 Not Found
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Type: application/json
Date: Sun, 09 Aug 2026 07:38:37 GMT
Server: Vercel
X-Matched-Path: /schools-json/[slug]
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::hkg1::pg8mz-1786261117877-9db70c504958
```

二次请求同样 `404` / `MISS`,排除瞬时结果。**两次采集都是 `X-Vercel-Cache: MISS`、`Age: 0`,没有任何 CDN 缓存介入** —— 正是 `no-store` 修复要达成的效果。对照修复前的实测,同一位置曾是 `X-Vercel-Cache: HIT` / `Age: 63`,撤回后仍供着 published 副本(见第 4 节 ③)。

`X-Matched-Path: /schools-json/[slug]` 顺带确认了 middleware 把公开 URL `/schools/{slug}.json` 正确分流到了内部落点。

### 3.4 预览四态

token 有效:

```
① ok       200  <title>冒烟测试音乐学院 招生信息 · STAGE</title>
② missing  200  「OSS 里没有这个包」+ bucket stage-front-schools-hk / region oss-cn-hongkong
③ invalid  200  「包未通过契约校验」+ 字段路径 last_checked、/program_offerings/0/program_url
④ forbidden 404
```

安全边界(**同长度 slug 必须逐字相同**):

```
错 token · 23 字符:  存在的 draft 包 9507 字节  ==  不存在 9507 字节
错 token · 21 字符:  契约不合规的包 9501 字节  ==  不存在 9501 字节
无 token · 23 字符:  存在的 draft 包 11615 字节 == 不存在 11615 字节
```

字节差异只跟 slug 长度走,与"包是否存在"无关 —— **无存在性泄露**。

### 3.5 离线单测

18 项 API 单测(鉴权 4 + 写入闸门 14)+ 502 lib + 123 dom,全绿;`tsc --noEmit` 0 错。

## 4. 实测中发现并修复的三个缺陷

**① ali-oss 被 Next 打包后 `list()` 崩溃。** 抛 `ReferenceError: name is not defined`,导致索引重建失败、POST 与 publish 返回 500(但对象已写入,状态不一致)。同一份代码在未打包的 Node 里 `list()` 完全正常(已实测),所以是打包破坏。修:`next.config.ts` 加 `serverExternalPackages: ["ali-oss"]`,顺带消掉 `graceful-fs` 那条 `Module not found` 警告。

**② 裁决 7 的"整体失效"不充分 —— 阻塞项本来会假绿。** `revalidatePath("/schools/[slug]", "page")` 清不掉具体路径上已缓存的页面:unpublish 之后 `/schools/{slug}` 仍返回 200。

这一条差点漏掉,原因值得记下来:**我第一次测撤回时看到 404 就准备记通过,但那个 404 是发布之前就缓存好的 —— 页面从来没真正 200 过。** 在一个本来就是 404 的页面上测"撤回后变 404",测不出任何东西。清缓存重启、确认页面真的 200 之后再测,才暴露出问题。这条教训已写进 [CLAUDE.md](../../CLAUDE.md)。

修:整体失效**之上**再补具体路径(`/schools/{slug}` 与每个 `/schools/{slug}/{programSlug}`),覆盖写时失效**新旧专业 slug 的并集**(专业改名后的旧页面不能留成 200)。裁决 7 的整体失效部分保留,它管的是跨页影响。

**③ CDN 缓存把撤回通道打穿(只在生产可见)。** 机读端点 `/schools/{slug}.json` 在 unpublish 之后仍返回 200,而院校页、专业页、sitemap、浏览页都已即时下线。证据:`X-Vercel-Cache: HIT`、`Age: 63`;带随机 query 绕开缓存键则正确 404 —— 源站逻辑没问题,是我在阶段一给它加的 `s-maxage=3600` 让 CDN 供着旧副本,而 `revalidatePath` 管不到显式 `Cache-Control` 造成的 CDN 条目。

修:改 `no-store`。本端点用可缓存性换**即时可撤回性** —— 它服务机器消费者、量级很低,每次多一次同区 OSS 读(百毫秒级)可以承受;而错误数据在撤回后还能被抓走一小时,正是这套 draft/published 设计要防的头号风险。

**本地 `next start` 测不出这一条(没有 CDN)** —— 又一个"线上实测优先于本地"的实例。

## 5. 遗留与移交

**① OSS 里留下的测试对象**(RAM 策略无 `DeleteObject`,需主账号在控制台删):

| 对象 | 状态 | 用途 |
|---|---|---|
| `schools/smoke_test_conservatory.json` | draft | 冒烟包,阶段一、二反复使用 |
| `schools/preview_probe_invalid.json` | **契约不合规** | **故意留下**,用于验证预览面 `invalid` 诊断;复核者会需要它 |
| `schools/review_codex_20260809.json` | draft | 阶段一独立复核者留下的探针 |

三者都不进索引公开面(draft 与不合规都被过滤),站点对外仍是空库。

**② `revalidatePath` 与 CDN 的边界值得记住**:`revalidatePath` 能失效 Next 的 ISR 条目,但**管不到由显式 `Cache-Control` 头产生的 CDN 缓存**。任何"必须能即时撤回"的响应都不应带 `s-maxage`。阶段三若新增输出面(如 llms.txt、RSS),这条要一并适用。

**③ 阶段三前置**:发布是人工动作,`publish` 端点只由运营者手工 curl 触发,任何脚本或 agent 不得自动调用。

## 6. 硬约束自检

| 约束 | 状态 |
|---|---|
| A 单一真相源,无本地 fallback | 写入端只写 OSS;读取端未改 |
| B/C 无兼容代码 | 无 |
| D 不新增计划外抽象 | **一次有记录的豁免**:写入路由的 deps 缝(裁决 5),边界为"仅限写入路由,不得扩散到读取侧"——本轮读取侧未引入任何 deps |
| E 凭据仅服务端 | `lib/oss/write.ts`、`lib/api/deps.ts` 均 `server-only`;`grep NEXT_PUBLIC_.*TOKEN` 为 0 |
| F 独立复核 | 待复核 session 执行 |
