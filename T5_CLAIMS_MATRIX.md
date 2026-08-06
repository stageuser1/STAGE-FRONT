# T5 声称 ↔ 代码 ↔ 测试 对照表

**修订记录**:

- **T5-R2**(Codex 第二轮 2026-08-04)两条 P1 + 四条 P2,本版为处理结果:
  ①`tokenize()` 把连续拉丁字符当成不可断开 token,`A×300`/中英混排的长英文段被
  判成「一行放得下」、`truncated: false`,而 U4 只查高度不查宽度所以漏网 ——
  已加强制断字,U4 补横向断言(并新增 U4b),R 组补两个真实渲染用例;
  ②`qr_domain` 被说成「蓝图 §1.4 的第 8 个字段」,而 §1.4 只有 7 个 —— 保留该
  字段但走正式流程承认它是 T5 扩展:数据字典、`data/v3/types.ts`、`sc:A4`、A4 行措辞
  四处同步;③A1 只验 mock,补真实项目跑同一套字段契约;④H1 声称「完整 payload」
  实际只查几个字符串,已补齐;⑤R2 只查深色像素,改为查「是否偏离底色」;
  ⑥R3 用黑方块冒充二维码,改为渲染真二维码并从成品 PNG 解码。
- **T5-R1**(Codex 第一轮 2026-08-04)核心实现通过,四条待处理 + 两条收窄。本版是处理
  结果:①极长校名溢出保护(改实现 + 新增真实渲染像素断言 R 组);②真实数据
  四条逐字段断言(H3/H3b);③A1 补 payload 全字段断言(A4);④B1 收窄为
  「按传入配置的 priority 排序」,生产一致性交给人工项 M1(不让测试连生产
  Directus —— 网络/权限/数据变更三重脆弱性会让 CI 无故变红);⑤I1 收窄为
  「metadataBase 引用单一来源、无站外硬编码」,实际 meta 渲染交给人工项 M3。
- 修 ① 的过程中,新增的像素断言当场抓到两个原先看不见的缺陷:满内边距下
  `height: 100%` 的盒模型让内容整体下移(二维码有 24px 被裁在画布外),以及
  行高估算偏低导致换行校名把页脚压出画布。两者都已修,并各自留下断言。

**目的**:同 `T3_CLAIMS_MATRIX.md` / `T4_CLAIMS_MATRIX.md` —— 把「文档写下承诺、
靠一处独立代码兑现、两者悄悄漂移」这条通道关掉。每条声称都指认**兑现它的代码**
与**钉死它的测试**;只做过一次的人工动作不许写进主表冒充测试(T4-R1 的教训),
一律单列到文末「交付时人工验证项」。

- 抽取范围:T5 ticket 原文四项任务 + 蓝图 §1.2 / §1.4 / §2.3 + 本轮的人类裁决
  (视觉过渡方案、费用单位归属 T5-R1、二维码回退 T5-R2)+ 实现中新增的五条自裁
  记录(T5-R3…R7,全部列在 `T5_REVIEW_HANDOFF.md` §6 等待确认)
- 测试编号:`sc:XX` 分布在三个文件 ——
  - **A–I 组**在 `tests/program_v3_share_card.test.mjs`(`node --test
    --experimental-strip-types`,与 T3 的 `lib:` / T4 的 `ai:` 同一个 runner)
  - **S/T/U 组**在 `tests/dom/share-card-v3.dom.test.tsx`(vitest)。放在那边**不是
    因为需要 document**(这个文件一次都没调用 `render()`),而是因为模板是 `.tsx`,
    strip-types 解析不了 JSX,也解析不了 mock fixture 的 `@/` 值导入
  - **R 组**在 `tests/dom/share-card-render.dom.test.tsx`(vitest,`@vitest-environment
    node`):**真的把 PNG 画出来再逐像素检查**。字体用 `tests/fixtures/fonts/` 下的
    离线子集,不联网(理由同 T5-R1 第 4 条:测试不该依赖外部服务)
- **统计:主表 59 条声称(A–I + R/S/T/U,共 13 组),全部有代码位置 + 自动化
  测试钉死。** 另有 **4 条**交付时人工验证项(含蓝图 §4 规定的品牌目检),单列
  一节,**不计入 59**。
  逐组行数:A 4 + B 11 + C 4 + D 4 + E 4 + F 4 + G 2 + H 7 + I 1 + R 4 + S 6 + T 2
  + U 6 = **59**。
- 测试用例数:**59**(`node --test` 41 + vitest 14 + vitest-node 4)。两个数相等
  是巧合而非一一对应:有的声称由同一条用例同时钉死(B6/B7 都由 `sc:B6` 覆盖),
  也有的声称需要多条用例(B5 由 `sc:B4` + `sc:B5` 两条覆盖)。行内均已标注。

> 数量核对方式沿用 T4-R1 之后的做法:上面这条加总算式可以逐组数一遍,不需要
> 「相信作者数对了」。

---

## A. share_card_payload 装配(§1.4)—— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| A1 | payload 全部由 canonical + publishing 派生,类型里没有任何可承载编辑观点的字段。**字段集合恰为蓝图 §1.4 的七个(`name_zh`/`name_en`/`program_zh`/`degree_abbr`/`metrics`/`verified_stamp`/`qr_url`)+ T5 扩展 `qr_domain`** —— 两个集合在测试里分开声明,`qr_domain` 不冒充蓝图定义(T5-R2 #2) | **本仓库内的正式契约记录**:`data/v3/types.ts`(`ShareCardPayloadV3` 的类型注释)与 `T5_REVIEW_HANDOFF.md` §9「`share_card_payload` 字段契约」;实现在 `lib/program-v3/share-card.ts`(`buildShareCardPayload`)。**跨仓库**:同一条记录也已写入数据字典 `D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor\references\directus_collections_reference.md` 的 “`share_card_payload` — implemented as 8 fields” 小节 —— 该文件**不在 stagefront 仓库内**(stagefront 没有 `references/` 目录),写绝对路径就是为了不让这一格指向一个在本仓库打不开的路径 | **`sc:A4`(`BLUEPRINT_PAYLOAD_FIELDS` + `T5_PAYLOAD_EXTENSIONS` 分开断言,再整体 `deepEqual`;多出第九个字段就是「投影发明新事实」的入口)**、`sc:E1` |
| A2 | 中文校名缺失 → 回退英文校名(核心原则 6 / 裁决 T3-R3.2),`name_en` 仍是英文名本身 | `buildShareCardPayload` | `sc:A1` |
| A3 | 中文专业名缺失 → 回退 `official_program_name`;学位缩写取 `degree_abbreviation` | 同上 | `sc:A2` |
| A4 | 中文齐全时用中文,域名取自 `SITE_URL`;**mock 与真实数据跑同一个字段契约函数** `assertPayloadContract`(字段集合、类型、非空、metrics ≤3 且无空位、`metric_key` 必须来自配置层)—— 只在 mock 上验证过的契约,证明不了真实项目也守规矩(T5-R2 #3)| 同上 | `sc:A3` `sc:A4`(mock)+ `sc:H1`(真实四条) |

## B. 指标选取(§1.2 share_card_metric_rules)—— 11 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| B1 | **指标按传入配置的 `priority` 升序取值**(本仓库镜像的那份配置即「语言要求 > 预筛/试音 > 截止日期 > 总费用」) | `shareCardMetrics` + `data/v3/share-card-metric-rules.ts` | `sc:B1` |
| B2 | 本仓库镜像的四行配置解析出的实际顺序 = 语言要求 > 预筛/试音 > 截止日期 > 总费用 | `shareCardMetrics` | `sc:B1` |
| B3 | 顺序由 `priority` 列决定,不是数组书写顺序(把数组倒序后结果不变) | 同上 | `sc:B3` |
| B4 | **永不超过 3 个**:四条都有值时最低优先级被挤掉 | `SHARE_CARD_MAX_METRICS` + `shareCardMetrics` | `sc:B2` |
| B5 | **永不出现空位**:缺失的规则整条消失、由低优先级补位,不产生占位符;全缺时返回空数组而不是三个空位 | 同上 | `sc:B4` `sc:B5`(5 种组合逐条断言 label/value 非空且不只有分隔符) |
| B6 | 语言要求:分数优先(TOEFL/IELTS/Duolingo 原始数字),显式 `Not Required` 才允许「无需」措辞(§3.1) | `METRIC_VALUE.language_requirement` | `sc:B6` |
| B7 | 语言要求:`Required` 无分数 → 「需要语言成绩」;`Conditional` → 「有条件要求」;`Optional`/`Unknown` → 整条让位 | 同上 | `sc:B6` |
| B8 | 三项语言分数齐全时按 TOEFL / IELTS / Duolingo 固定顺序拼接 | 同上 | `sc:B7` |
| B9 | 预筛/试音:两字段各自可缺,能说多少说多少;`Varies` 不自造措辞(五态词表里没有对应词),两者皆未知则整条消失 | `METRIC_VALUE.prescreening_audition` | `sc:B8`(5 种输入) |
| B10 | 总费用直接复用 T3 的 `costBlockLine().headline`,包括形态③自限定的「学费,不含生活费」——分享卡不另造一套费用措辞或降级判定(裁决 T5-R1) | `METRIC_VALUE.total_cost` → `lib/program-v3/format.ts` | `sc:B9` |
| B11 | `enabled: false` 的规则不参与选取;`fallback_when_missing: false` 时不许低优先级顶位(但仍不留空位,只是少一条) | `shareCardMetrics` | `sc:B10` `sc:B11` |

## C. 核实戳 —— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| C1 | `freshness_flag.status === "changed"` 时不盖核实戳,改用 T3 状态条的同一句「官网内容有变更,信息更新中」(裁决 T5-R4) | `shareCardVerifiedStamp` | `sc:C1` |
| C2 | 否则「官网核实 YYYY年M月」,月份来自 `last_verified` | 同上 | `sc:C2` |
| C3 | `last_verified` 缺失 → 回退 `max(retrieved_date)`,与 T4 引用块同一个来源函数(`latestRetrievedDate`) | 同上 | `sc:C3` |
| C4 | 两者都没有 → `null`,整个戳不渲染,不写「暂无」(§3.1) | 同上 | `sc:C4` |

## D. 二维码 —— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| D1 | slug 存在 → 二维码指向**该项目**详情页绝对地址,不是一律指首页(人类 2026-08-03 明确要求) | `shareCardQrUrl` | `sc:D1` |
| D2 | slug 缺失 → 回退站点首页,保证版式完整(裁决 T5-R2,已知过渡处理,见移交文档待办) | 同上 | `sc:D2` |
| D3 | 路径经 `programDetailHref()` 单一定义处取得,`lib/program-v3/share-card.ts` 源码内不出现任何预览路由前缀字面量(同 T4 的 I1,T3b 迁移只改一处) | 同上 + `lib/program-v3/format.ts` | `sc:D3`(源码扫描) |
| D4 | 生成的二维码是**真的能扫**的二维码,不是一堆装饰方块 | `lib/program-v3/qr.ts`(`qrcode`,纠错级 M) | `sc:D4`(SVG → sharp 位图 → `jsQR` 解码,断言解回同一个 URL)+ 人工验证项 M2(从最终 PNG 里裁剪解码) |

## E. editorial_notes 永不进入分享卡(§0.3 铁律)—— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| E1 | `editorial_note` 与其余全部自由文本(豁免政策、国际生备注、申请/试音条件说明、曲目全文、视频/伴奏/特别说明、成绩单要求、原文引用、`answer_sentence_zh`)都不出现在 payload 里 | `lib/program-v3/share-card.ts` 全文无这些字段的读取路径 | `sc:E1`(13 处哨兵 + 13 个字段名逐条扫描,手法同 T4 的 `ai:C1`) |
| E2 | 隔离不是靠把对象清空实现的:该映射的字段确实原样出现 | 同上 | `sc:E2`(正向对照) |
| E3 | 源码层面没有 `program.editorial_note` 的读取路径 | 同上 | `sc:E3`(源码扫描) |
| E4 | 微信分享的标题/描述同样不含任何编辑观点 | `lib/wechat/share-config.ts` | `sc:E4` |

## F. 微信 JS-SDK 分享(ticket 第四项)—— 4 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| F1 | 标题 = 中文校名 + 专业 + 学位;`link` 与 `imgUrl` 都是绝对地址,`imgUrl` 指向竖版分享卡路由 | `buildWechatShareConfig` | `sc:F1` |
| F2 | 描述 = 分享卡上的同一批指标、同一套措辞,不另写营销文案 | 同上 | `sc:F2` |
| F3 | 指标为空 → 退到 Mode F 导语;导语也没有 → 退到品牌行。三级都不是新造的事实 | 同上 | `sc:F3` |
| F4 | 无 slug → 返回 `null`,整块不接入(没有落地页就不配分享,不拿首页冒充项目页) | 同上 + `app/(explore)/v3-preview/[schoolSlug]/[programSlug]/page.tsx` 的 `wechatShare ? … : null` | `sc:F4` |

> **后端依赖(需人类安排,本轮不自建)**:`wx.config()` 的签名四元组必须由服务端
> 用 `jsapi_ticket` 计算,依赖公众号 `appSecret`,不能进前端。组件因此写成
> 「配了签名接口就接、没配就完全不动作」:未设置
> `NEXT_PUBLIC_WECHAT_JSSDK_SIGNATURE_ENDPOINT` 时既不加载 JS-SDK 也不发请求
> (当前仓库正是这个状态)。接口契约写在
> `components/program/v3/WechatShareSetup.tsx` 顶部注释里。

## G. 视觉:过渡方案,沿用 T3 视觉语言 —— 2 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| G1 | 分享卡用的每个色值都是 T3 组件实际在用的那个 Tailwind token 的值,不是「差不多的蓝」 | `lib/program-v3/share-card-tokens.ts` | `sc:G1`(读 `tailwind.config.ts`,逐个色值断言仍能找到 —— T3 改色而这里没跟上会失败) |
| G2 | 本轮**不执行** §2.3 的深蓝 #0A1F4D + 暖金 #F4C870 品牌视觉;卡面是白底 | 同上 | `sc:G2` |

## H. 真实数据(T1b 茱莉亚包)—— 7 条

这一组存在的理由:T5 是本仓库第一次让真实数据参与前端渲染,而真实包的形状与
T3 mock 有四处差异(逐条见 `T5_REVIEW_HANDOFF.md` §3)。这些用例把「真实数据也
成立」变成可重跑的断言,而不是"我跑过一次没崩"。

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| H1 | 真实 canonical 包(集合形状)能装配出 4 条项目,**每条的 payload 都满足与 mock 完全相同的字段契约**(T5-R2 #4:此前声称「完整 payload」但只查了三个字符串非空 + `qr_url` 前缀;现跑 `assertPayloadContract` 同一个函数,并逐条断言 `qr_url` 的完整值)| `lib/program-v3/package-adapter.ts` + `data/v3/real-programs.ts` | `sc:H1` |
| H2 | 真实数据同样 ≤3 指标、无空位 | `shareCardMetrics` | `sc:H2` |
| H3 | **四条真实项目逐字段断言**:校名(茱莉亚学院)、英文名、专业(声乐,取自受控词表 `field_name_zh`)、四个不同的学位缩写、三条指标的实际取值(BM 是 TOEFL 73 / IELTS 6,MM 与 GD 是 89 / 6.5,DMA 是 102 / 7.5)、核实戳、二维码地址 | 同上 | **`sc:H3`(T5-R1 #2:此前只深测了 voice-bm 一条,而四条里 DMA 最特殊;现四条全部逐字段钉死,并先断言这四个 slug 就是包里的全部)** |
| H3b | 四条的费用形态:BM/MM/GD 是 CNY 块(min 570000 / max 600000 元,渲染为「¥57–60 万元人民币」——移交文档 §0.2 记录的单位缺陷已于 T3-R6〔2026-08-03〕修复),DMA 的 `cost_estimate_rmb` 为 null | 同上 | `sc:H3b` |
| H4 | 真实包缺 `english_requirement_status` 一列 → 判为 `Unknown`;**不因为有 TOEFL 分数就反推成 `Required`**(那是前端发明五态) | `lib/program-v3/package-adapter.ts`(`fiveState`) | `sc:H4` |
| H5 | 真实包的 DMA(`cost_estimate_rmb` 为 null)不产生费用指标 | `METRIC_VALUE.total_cost` | `sc:H5` |
| H6 | 真实包没有 `editorial_note`(§1.6:提取 agent 禁止写编辑层),分享卡输出里也不出现任何编辑层字段 | `lib/program-v3/package-adapter.ts`(硬编码 `editorial_note: null`) | `sc:H6` |

## I. OG image 的绝对地址来源 —— 1 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| I1 | **`metadataBase` 引用 `SITE_URL` 这一个来源,源码里不存在站外域名硬编码。**(T5-R1 #5 收窄:此前声称的是「实际渲染出的 og:image 主机名正确」,而测试只能读源码 —— 真正渲染出的 meta 由框架注入,归人工项 M3。修复前这里硬编码的是一个本站以外的域名,外部抓到的分享图链接会指向我们不控制的主机) | `app/layout.tsx`(`metadataBase: new URL(SITE_URL)`) | `sc:I1`(源码断言) |

## S. 分享卡模板(§2.3 内容结构与禁止项)—— 6 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| S1 | 13 个 fixture(T3 的 9 个 mock 边界用例 + T1b 的 4 条真实数据)竖版与横版都能构树,且都画出品牌行/校名(前缀)/专业/域名 | `lib/program-v3/share-card-template.tsx` | `sc:S1`(校名断言取前 8 字前缀 —— 极长校名会被三级保护截断,断全名会与 U 组的行为冲突) |
| S2 | 每张卡画出来的指标 ≤3,且每条指标的标签与值都实际出现在树里 | 同上 | `sc:S2`(与 `sc:B4`/`sc:B5` 互补:那两条测数据层,这条测「画出来的」) |
| S3 | 中文校名缺失时英文名只画一次(`name_zh` 已回退成英文名,不再重复一行) | `englishNameLine` | `sc:S3` |
| S4 | §2.3 禁止项在树里一律不存在:学校介绍、排名、校友、编辑观点、难度星级 | 模板只读 `ShareCardPayloadV3` | `sc:S4`(13 个 fixture × 竖/横两版 × 6 个禁止词 + 三个 fixture 的编辑观点实际内容) |
| S5 | 曲目全文、豁免政策、导语等长自由文本不会漏进分享卡 | 同上 | `sc:S5` |
| S6 | 字体子集所需的文本收集会展开函数组件(不展开的话品牌行/指标/页脚全部收不到字形,出图变豆腐块且**不报错**) | `collectElementText` | `sc:S6` |

## T. 截止角标沿用 T3 样式(§2.3 / §3.4)—— 2 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| T1 | 三态判定用 T3 的 `deadlineState()`,措辞与 `components/program/v3/DeadlineBadge.tsx` 一字不差(开放中 / 距截止 N 天 / 本季已截止,查看下季),配色用同一组 token | `shareCardDeadlineChip` + `SHARE_CARD_COLORS` | `sc:T1`(既断言本侧输出,又扫描 `components/program/v3/DeadlineBadge.tsx` 源码 —— 任一侧改措辞都会失败) |
| T2 | 没有截止日 → 没有角标(不画空角标) | 同上 | `sc:T2` |

## R. 真实渲染:溢出与页脚保护(T5-R1 #1)—— 4 条

这一组把 PNG **真的画出来**再逐像素检查。六个用例专门覆盖极长校名:
7 字常规中文名、14 字中文全称(「曼海姆国立音乐与表演艺术大学」)、49 字德文
全称、80 字病态中文、**200 字无空格全英文**、**中英混排超长**(后两条是
T5-R2 #1 的回归)。

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| R1 | 六个用例渲染出来都是 900×1200 | `renderShareCardPortrait` / 模板 | `sc:R1` |
| R2 | 画布外框 24px 内没有任何**偏离底色**的像素(不只是深色)—— 浅灰分隔线、`brand-50` 角标底这类浅色内容溢出同样会被抓到(T5-R2 #5)。排除卡片自身的 1px 描边与 12px 圆角 | `fitSchoolName` + 固定高度盒子 + `boxSizing: border-box` | `sc:R2` |
| R3 | 页脚仍在画布内:左侧有域名文字;右侧的二维码**能从成品 PNG 里裁出来用 jsQR 解回 `qr_url`**(T5-R2 #6:此前贴的是固定黑方块,只能证明"有像素")。**极长校名不会把页脚挤出去** | `schoolNameHeightBudget` + `lib/program-v3/qr.ts` | `sc:R3`(与 `sc:D4` 同一解码手法,起点换成最终产物) |
| R4 | 校名与下方文字之间存在整行空白 —— 行盒重叠(当年 `lineHeight: 1.15` 那个 bug)会让这条失败,而元素树断言当时全部通过 | `SCHOOL_NAME_LINE_HEIGHT` | `sc:R4` |

> **这组测试当场抓到的两个缺陷**(都已修,写在这里是因为它们说明了为什么这组
> 必须存在):① `height: 100%` + `padding` 在 satori 的默认 content-box 下让内容
> 整体下移,二维码有 24px 被裁在画布外;② 非校名文字的行高按 1.25 估算偏低
> (卡面几乎全是中文,实际约 1.4),预算多算约 29px,14 字校名换行后把页脚压出
> 画布。两者在元素树层面都完全看不出来。

## U. 尺寸与字号(硬约束)—— 5 条

| # | 声称 | 代码 | 测试 |
|---|---|---|---|
| U1 | 竖版严格 3:4(900×1200)。这是微信分享卡的比例硬约束,不是视觉偏好 | `SHARE_CARD_PORTRAIT` | `sc:U1`(断言比例本身,改尺寸可以、改比例会失败)+ `sc:R1`(真实产物的实际像素尺寸) |
| U2 | OG 横版 1200×630 | `SHARE_CARD_OG` | `sc:U2` |
| U3 | 校名**三级溢出保护**:①按宽度与高度预算降字号 → ②预算不够时减行 → ③仍排不下则截断加省略号(省略号保证落在允许的行数之内,不会被裁掉变成无提示截断) | `fitSchoolName` | **`sc:U3`(四种输入分别触发第 0/1/2/3 级)** |
| U4 | **无论校名多长,校名块既不超高也不超宽**:块高 ≤ 高度预算、行数 ∈ [1, maxLines],且把最终文本按同一套规则重排后**每一行的宽度都 ≤ 可用宽度**(T5-R2 #1:此前只查高度,连续拉丁字符被当成不可断开 token 时的横向溢出整个漏网)| `fitSchoolName` + `layoutLines`(超宽 token 按字符强制断开)+ `schoolNameHeightBudget` | **`sc:U4`(含 500 字中文、300 字拉丁、无空格长复合词、中英混排、空字符串)** |
| U4b | 超宽单 token(300 字母长词、中英混排长英文段)必须被判为**需要截断**并留下省略号 —— 否则「不超宽不超高」在悄悄丢字的实现下也能成立 | 同上 | **`sc:U4b`** |
| U5 | 同一输入永远得到同一结果:纯函数、无随机、与渲染环境无关 | `fitSchoolName` | `sc:U5` |

---

## 交付时人工验证项(非持续保障)

这一节**不计入上面 59 条**。它们是一次性人工动作,下次改代码不会自动重跑。

| # | 验证内容 | 验证方式 | 验证时间 | 失效条件 |
|---|---|---|---|---|
| M1 | **仓库里的配置镜像与生产 Directus 一致**(`share_card_metric_rules` 四行:metric_key / priority / label_zh / enabled / fallback_when_missing) | `curl` 生产 Directus `GET /items/share_card_metric_rules`,与 `data/v3/share-card-metric-rules.ts` 文件头表格逐列比对 | 2026-08-03 | **① 有人在 Directus 里改了 `share_card_metric_rules`**(调优先级、停用某条、加第五条、改中文标签)——仓库镜像不会自动跟着变;**② `badge_rules` 变更**——同属配置层、同样以仓库镜像的方式被消费,改动同样不会自动传导;**③ T3b 做完构建期回填**之后这一条才会消失。**这条刻意不写成自动化测试**:让测试连生产 Directus 会引入网络、权限、数据变更三重脆弱性,CI 会经常无故变红,而它验的是"外部系统此刻的状态",本来就不是代码不变量(T5-R1 #4 的裁定) |
| M2 | 最终 PNG 里的二维码能扫 | 从三张成品 PNG 裁剪二维码区域 → `sharp` 转位图 → `jsQR` 解码,三张分别解回自己项目的详情页 URL(茱莉亚 mock / 茱莉亚真实 / 曼哈顿) | 2026-08-03 | `sc:D4` 已经把「SVG 层的码正确」自动化了;这一条额外覆盖「码被画进图之后仍可解」,改版式(二维码尺寸/位置/留白)后应重做 |
| M3 | **实际渲染出的 `og:image` / `twitter:image` meta 存在,且主机名是 `SITE_URL`** | 生产构建后 `curl` 详情页,grep `og:image` / `twitter:image`;2026-08-04 复核结果:`https://www.studyabroadfirst.cn/v3-preview/juilliard/voice-bm/opengraph-image-…`(修复前是站外域名) | 2026-08-04 | Next 的 `opengraph-image` 约定注入由框架完成,仓库里没有代码可以断言"渲染出来的那一行 meta";`sc:I1` 只能断言源码引用了单一来源(T5-R1 #5 的收窄)。升级 Next、改动 `app/layout.tsx` 的 metadata、或改动图片路由文件名后应重做 |
| M4 | **品牌目检(蓝图 §4 规定 T5 的评审方式 = 人工目检,品牌判断不外包给模型)** | 24 张成品 PNG(12 竖版 + 12 横版)+ 12 张 200px 缩略图,人工逐张看 | 待人类执行 | 每次改版式都要重做。样张路径见 `T5_REVIEW_HANDOFF.md` |

---

## 回归结果

- `npm run test:lib`:**410 tests**(T3/T4 既有 369 + T5 的 41),0 fail
- `npx vitest run`:**88 tests**(T3/T4 既有 70 + T5 元素树 14 + T5 真实渲染 4),0 fail
- `npx tsc --noEmit`:0 error
- `npm run build`:产物完整;两个图片路由各预生成 12 条路径
  (`/v3-preview/[schoolSlug]/[programSlug]/share-card` 与 `…/opengraph-image`),
  构建期取字体子集成功
- 24 张成品(12 竖版 + 12 横版)重新生成并逐张核对尺寸,0 张异常

**状态:规则层已通过评审(Codex 第四轮确认,2026-08-04),T5 结项。**

评审历程:T5-R1(五条)→ T5-R2(六条)→ T5-R3(一条 P1 + 两处措辞)→
第四轮确认性复核通过。三轮修订的处理结果分别记在 `T5_REVIEW_HANDOFF.md`
§7 / §8 / §10。

**通过的是本表覆盖的规则层**(59 条声称,全部有代码位置 + 自动化测试)。
**视觉不在本表范围内**:按蓝图 §4,T5 的视觉评审方式是人工目检,且本轮视觉是
过渡方案,最终视觉规格待人类另行下发。文末「交付时人工验证项」的 4 条同样不在
自动化保障范围内,改动相关代码时需按各自的失效条件重做。

结项遗留事项(`english_requirement_status` 缺失、二维码首页回退、
存图按钮、extractor 仓库无版本控制)见 `T5_REVIEW_HANDOFF.md` §11 ——
原五条中的费用单位错配已于 T3-R6(2026-08-03)修复,不再是开放项。
