# T5 移交文档 —— Share Card / OG 图片服务 / 微信分享

**状态:规则层已通过评审(Codex 第四轮确认,2026-08-04),T5 结项。
视觉为过渡方案,最终视觉规格待人类另行下发。**

「通过评审」的范围要说清楚:**通过的是规则层** —— 指标选取、字段契约、降级
路径、溢出保护、editorial_notes 隔离、二维码可扫性、真实数据一致性,这些有
自动化测试钉死的部分。**视觉不在本次评审范围内**:蓝图 §4 规定 T5 的视觉评审
方式是人工目检(品牌判断不外包给模型),而本轮视觉本身是过渡方案(见 §0.1),
最终视觉规格待人类另行下发。样张路径见 §5。

评审历程:Codex 第一轮(T5-R1)五条见 §7,第二轮(T5-R2)六条见 §8,
第三轮(T5-R3)一条 P1 + 两处措辞见 §10,第四轮确认性复核通过。

**结项遗留事项见 §11。**

---

## 0. 先看这两条

### 0.1 视觉是过渡方案

**T5 视觉为过渡方案,沿用 T3 视觉语言;最终视觉规格待人类另行下发。**

本轮执行的范围:白底,配色/字号层级/圆角/灰阶辅助文字与 `ProgramCardV3` 同一套
token,截止角标沿用 T3 `DeadlineBadge` 的三态样式与措辞。色值取自
`tailwind.config.ts` 里 T3 实际在用的 token,由 `sc:G1` 持续断言两边不漂移;
§2.3 的深蓝 #0A1F4D 与暖金 #F4C870 由 `sc:G2` 断言未出现在本轮实现里。

### 0.2 费用单位缺陷 —— 已解决(T3-R6,2026-08-03)

**此条曾是阻塞级,T5 结项时尚未修复;现已由 T3 侧修复并验证,T5 侧零改动。**
保留下面的原始记录作为发现过程的存档;当前状态见段末。

`cost_estimate_rmb.min/max` 的单位曾有两套说法:

| 出处 | 单位 | 证据 |
|---|---|---|
| 蓝图 §1.4 示例 | **元** | `"min": 550000, "max": 660000` |
| Mode F 真实产出(T1b 茱莉亚包) | **元** | `"min": 570000, "max": 600000` |
| T3 的 mock fixture(修复前) | **万元** | `min: 55, max: 66` |
| T3 的渲染器 `costBlockLine`(修复前) | 当作**万元** | `` `¥${cost.min}–${cost.max} 万元人民币` `` |
| T4 的 JSON-LD(修复前) | 当作**万元** | `cost.min * 10_000` |

后果曾在预览页上可见:真实茱莉亚数据在 Web Card 上渲染成
**「¥570000–600000 万元人民币」**(实测 `curl` 生产构建的
`/v3-preview/juilliard-t1b/voice-bm` 得到该字符串),JSON-LD 里的价格则被再乘
10000。**蓝图与真实数据本来就是一致的,偏离的是 T3 的 mock 与渲染器,以及跟着
T3 走的 T4。**

按人类 2026-08-03 的裁决,**T5 未自行修**:总费用指标直接复用
`costBlockLine().headline`,分享卡与 Web Card 永远显示同一个数,修复落在 T3/T2
一处、两个投影同时生效。

> 附带说明:本轮(T5 结项时)12 张样张里没有一张因此出错 —— 真实茱莉亚的三条
> 项目里语言/预筛/截止三条指标齐全,总费用是第四优先级,压根没进卡面;DMA 的
> `cost_estimate_rmb` 本身是 `null`。这是运气,不是设计,所以当时仍记为阻塞级。

**修复结果(T3-R6,2026-08-03 同日修复):** `costBlockLine()` 改用
`yuanToWanZh()` 把元折算为万再显示;`json-ld.ts` 去掉 `× 10_000`,直接用
`cost.min`/`cost.max`(它们本来就是元)。**验证:T5 未改任何一行代码**——
`buildShareCardPayload(voiceBm)` 强制费用指标浮现后,`total_cost` 正确读出
「¥57–60 万元人民币」,与 Web Card 一致。`sc:H3b` 钉住的真实取值
(min 570000 / max 600000)未变,继续在 T3 侧的回归测试
(`tests/dom/program-card-v3.dom.test.tsx` 的 `U1`–`U5`)里作为不经过 mock 的
真实数据断言。T5-R1(总费用指标复用 `costBlockLine`,不分叉)裁决被验证为
正确方向:上游一修,T5 自动对齐,零改动。

---

## 1. 变更文件清单

### 新增 —— 数据与规则层

| 文件 | 作用 |
|---|---|
| `data/v3/share-card-metric-rules.ts` | §1.2 配置层四行规则在仓库里的镜像(2026-08-03 从生产 Directus 原样读回,含 `fallback_when_missing` 的真实取值)|
| `lib/program-v3/share-card.ts` | `share_card_payload` 生成:指标选取、核实戳、二维码地址。纯函数,不接触 `editorial_note` |

### 新增 —— 图片服务

| 文件 | 作用 |
|---|---|
| `lib/program-v3/share-card-tokens.ts` | 视觉 token(色值/尺寸/字号),过渡方案的说明也在这里 |
| `lib/program-v3/share-card-template.tsx` | 竖版与横版的元素树(satori 输入)+ 截止角标 + 校名字号降档 + 文本收集 |
| `lib/program-v3/share-card-image.tsx` | 出图:`ImageResponse`,竖版 900×1200 / 横版 1200×630 |
| `lib/program-v3/share-card-font.ts` | 按图上实际文字取 Noto Sans SC 子集(见 §4 的依赖说明)|
| `lib/program-v3/qr.ts` | 二维码 SVG → data URI(纠错级 M)|
| `app/(explore)/v3-preview/[schoolSlug]/[programSlug]/share-card/route.tsx` | 竖版 3:4 PNG 路由 |
| `app/(explore)/v3-preview/[schoolSlug]/[programSlug]/opengraph-image.tsx` | OG 横版,走 Next 约定自动注入 `og:image` |

### 新增 —— 微信

| 文件 | 作用 |
|---|---|
| `lib/wechat/share-config.ts` | 标题/描述/缩略图/链接(纯函数,可测)|
| `components/program/v3/WechatShareSetup.tsx` | JS-SDK 前端接入;未配置签名接口时完全不动作 |

### 新增 —— 真实数据接入(自测需要)

| 文件 | 作用 |
|---|---|
| `lib/program-v3/package-adapter.ts` | canonical 包(集合形状)→ `ProgramV3`(已装配形状)。**不是生产接线**,生产灌数仍是 T3b |
| `data/v3/real/juilliard-vocal-arts-pilot.json` | T1b 真实包原样复制(114KB,未编辑任何字段)|
| `data/v3/real-programs.ts` | 适配后的 4 条真实项目;school slug 加 `-t1b` 后缀以免与 mock 撞车 |
| `data/v3/preview-registry.ts` | 预览面注册表 = 9 个 mock + 4 条真实,详情页/分享卡/OG 三个路由共用 |

### 修改

| 文件 | 改动 |
|---|---|
| `data/v3/types.ts` | 新增 `ShareCardMetricKey/RuleV3/MetricV3/PayloadV3` 四个类型 |
| `app/(explore)/v3-preview/page.tsx`、`…/[schoolSlug]/[programSlug]/page.tsx` | 改查预览注册表;详情页挂 `WechatShareSetup` |
| `app/layout.tsx` | `metadataBase` 从硬编码的站外域名改为 `SITE_URL`(见矩阵 I1)|
| `package.json` | 新增依赖 `qrcode`(生产)、`jsqr` + `@types/qrcode`(开发)|

### 测试

| 文件 | 内容 |
|---|---|
| `tests/program_v3_share_card.test.mjs` | A–I 组,41 条(`node --test`)|
| `tests/dom/share-card-v3.dom.test.tsx` | S/T/U 组,14 条(vitest,元素树层)|
| `tests/dom/share-card-render.dom.test.tsx` | **R 组,4 条(vitest + `@vitest-environment node`):真的出 PNG,逐像素断言不溢出、页脚不被挤压**(T5-R1 #1)|
| `tests/fixtures/fonts/` | R 组用的离线字体子集(Noto Sans SC,OFL,两个字重各 32KB)+ `charset.txt` + 许可证 |
| `scripts/build-share-card-test-font.mjs` | 生成上面那份子集的脚本 |
| `tests/dom/setup.ts`(改) | 加 DOM 存在性判断 —— 这个 setup 对所有 vitest 文件生效,而 R 组跑在 node 环境,原来的 `Element.prototype` stub 会直接抛错 |

---

## 2. 自测结果

- `npm run test:lib`:**410 tests**(既有 369 + T5 的 41),0 fail
- `npx vitest run`:**88 tests**(既有 70 + T5 元素树 14 + T5 真实渲染 4),0 fail
- `npx tsc --noEmit`:0 error
- `npm run build`:产物完整;`share-card` 与 `opengraph-image` 两个路由各预生成
  12 条路径,构建期取字体子集成功
- **12 个 fixture 各出一张竖版 + 一张横版,24 张全部 HTTP 200、尺寸校验通过**
  (竖版 900×1200、横版 1200×630,`sharp` 逐张读 metadata 核对)

边界覆盖(ticket 要求的清单逐条对照):

| 边界 | 覆盖它的 fixture | 结果 |
|---|---|---|
| 费用形态①官方 CoA | 茱莉亚声乐 BM | 指标满 3 条,费用被挤出(优先级 4)|
| 费用形态②config 估算 | 茱莉亚钢琴 BM / 曼哈顿声乐 MM | 同上 |
| 费用形态③原币种 | 茱莉亚歌剧 MM(USD)、RCM 钢琴(GBP)、mdw 声乐(EUR)| mdw 那张只有费用一条指标,原样显示「EUR 1,500/学期(学费,不含生活费)」|
| 无费用数据 | 曼哈顿作曲 MM | 只剩截止日期一条指标,不补空位 |
| badges 0 / 1 / 3 | 全部 9 个 mock | 分享卡**不画 badges**(§2.3 内容结构里没有这一项),因此 0/1/3 三种情况出图一致 —— 这是设计如此,不是漏渲染 |
| 截止已过 | 曼哈顿作曲 MM、茱莉亚真实四条 | 角标置灰「本季已截止,查看下季」|
| 截止未过 / 临近 | 茱莉亚声乐 BM(开放中)、歌剧 MM(距截止 18 天)| 三态齐全 |
| 无截止日 | mdw 声乐 MA | 不画角标,截止指标整条消失 |
| 中文校名缺失 | mdw 两条 | 回退英文名,英文行不重复;字号按高度预算降档到两行 |
| 极长校名(T5-R1 #1) | 14 字中文全称 / 49 字德文全称 / 80 字病态输入 | 三级保护(降字号 → 减行 → 截断加省略号),**优先不截断**:预算够就降字号排全名,只有再降也排不下才截断。真实渲染的像素断言确认没溢出、页脚完整 |
| slug 缺失 | RCM 作曲 MM | **没有详情页 → 没有图片路由**(与 T4 的 A8/G2 同一纪律);其 payload 与二维码回退首页的行为由 `sc:D2` 钉住 |
| 真实数据 | 茱莉亚 T1b 四条 | 见下节 |

缩略图可读性(功能硬约束):12 张竖版各缩到 200px 宽,校名与截止日期均可辨认。
样张见 §5;这一条最终仍需人工目检确认(矩阵 M4)。

---

## 3. 真实数据与 mock 的形状差异(ticket 明确要求报告)

用 T1b 的茱莉亚包(`schema_version: stage_music_admissions_v3`)跑通,发现四处与
T3 mock 不一致。**没有一处是在适配器里"补"上的** —— 缺的就是缺的。

| # | 差异 | 影响 | 处理 |
|---|---|---|---|
| ① | 真实包是**集合形状**(schools/program_offerings/application_requirements… 各一个数组,靠 `program_offering_ref` 互引),T3 mock 是**已装配的单条记录** | 真实数据无法直接进 T3 组件 | 写了 `package-adapter.ts` 做装配。**这不是生产接线**,只为 T5 自测与样张存在 |
| ② | `program_offerings.program_name_zh` 为 **null**,中文专业名实际在受控词表 `fields[].field_name_zh`(「声乐」) | 不处理的话卡上会显示 `Voice Bachelor of Music` 而不是「声乐」 | 回退到 `field_name_zh` —— 这正是 Mode F 生成 answer_sentence 时用的同一列,不是前端另找了个名字 |
| ③ | `application_requirements` **没有 `english_requirement_status` 这一列**(T3 mock 有,且 T3 的英语要求行依赖它) | 五态判定在真实数据上一律 `Unknown` | 映射为 `Unknown`(等同 null:不渲染、不点亮「免语言成绩」)。**绝不由「有 TOEFL 分数」反推成 Required** —— 那是前端发明五态。`sc:H4` 钉住这条。**需要 T1/T2 确认:是 schema 少了这一列,还是提取阶段没写?** |
| ④ | 费用单位 | 见 §0.2 | 已由 T3-R6(2026-08-03)修复,T5 侧零改动自动对齐 |

另外两点观察(不是缺陷,供 T3b 参考):

- 真实包的 `freshness_flag.status` 四条都是 `unknown`、`last_verified` 是跑管线
  当天。核实戳因此显示「官网核实 2026年8月」,而真正的官网抓取日期是
  `source_records.retrieved_date`(2026-07-17)。`last_verified` 到底该写"跑管线
  的日期"还是"官网核实的日期",建议 T2 明确 —— 现在这两个语义在真实数据里是
  混的。
- 真实包的 `school_name_zh` 是「茱莉亚学院」,T3 mock 写的是「茱莉亚音乐学院」。
  以真实包(人工审核入库)为准,mock 那份只是 fixture。

---

## 4. 依赖与已知限制

### 4.1 字体:构建期从 Google Fonts 取子集

satori 没有系统字体可用,必须显式喂字体;卡面主体是中文校名,缺字就是整图报废。
所以按**这张图实际要画的字符**去 `fonts.googleapis.com/css2?...&text=` 取
Noto Sans SC 的 TrueType 子集(每张几 KB),进程内缓存。

- 为什么不把字体放进仓库:全量 CJK 字体约 8–10MB/字重;预切「常用 3500 字」子集
  则会在遇到生僻校名时**静默出豆腐块**,而校名是这张图的视觉主体。
- 为什么这不算新增外部依赖:这个仓库的构建本来就依赖 fonts.googleapis.com
  (`app/layout.tsx` 用 `next/font/google`)。
- 失败行为:抛错,不降级。没有中文字体的分享卡不是"差一点",是不能出。
- 图片路由是构建期静态生成,所以取字体发生在构建时,不是每个用户请求一次。

### 4.2 微信签名接口(需人类安排)

`wx.config()` 需要服务端用 `jsapi_ticket` 算的签名四元组,依赖公众号
`appSecret`,不能进前端 —— 属于 ticket 明确划出去的范围。前端已按
「有接口就接、没接口完全不动作」实现:

- 未设置 `NEXT_PUBLIC_WECHAT_JSSDK_SIGNATURE_ENDPOINT` → 不加载 JS-SDK、不发请求
  (当前状态)。
- 配置后接口需满足:接受 `?url=<当前页完整 URL,不含 hash>`,返回
  `{appId, timestamp, nonceStr, signature}`,签名必须**对这个 url** 计算
  (微信校验极严,多一个查询参数就 invalid signature)。

### 4.3 微信缩略图会被居中裁成方图

`imgUrl` 用的是竖版分享卡。微信把 `imgUrl` 居中裁成小方图:900×1200 居中裁出的
900×900 保留中文校名与指标,裁掉顶部品牌行与底部二维码;1200×630 居中裁出的
630×630 会切掉左对齐校名的一截。当前实现选的是竖版。蓝图没有规定专用方形缩略图,
本轮没有新增第三种尺寸。

### 4.4 待办(人类要求记录)

> **slug 缺失时二维码指向首页,用户可能预期落到该项目详情页 —— 属于已知的
> 过渡处理,待 T3b 真实路由上线、slug 覆盖率提高后重新评估,届时可改为 §3.1 的
> 不渲染方案。**

补充:slug 存在时二维码指向该项目详情页,不会一律指首页(`sc:D1` 钉住,并额外
断言它 ≠ 首页)。

### 4.5 存图按钮

按产品决策,**上线首周不开放**。本轮只做图片生成与 OG 接入,前端没有任何指向
分享卡路由的下载/保存入口。

---

## 5. 样张路径(人工目检用)

> tmp/ 在 .gitignore 里,样张不进版本库。需要重新生成:`npm run build` →
> `npm run start` → 逐个 `curl` 下面的路由。

- **竖版 3:4(12 张)**:`D:\STAGE FRONT\tmp\t5\samples\portrait_*.png`
- **OG 横版(12 张)**:`D:\STAGE FRONT\tmp\t5\samples\og_*.png`
- **200px 缩略图(12 张,可读性目检用)**:`D:\STAGE FRONT\tmp\t5\thumbs\thumb200_*.png`

其中 `*juilliard-t1b_*` 四张是 T1b 的**真实数据**,其余是 T3 的 mock 边界用例。

在线查看(需 `npm run build && npm run start`):

- 预览列表(13 张 Web Card,末尾四条是真实数据):`http://localhost:3000/v3-preview`
- 竖版分享卡:`http://localhost:3000/v3-preview/{schoolSlug}/{programSlug}/share-card`
- OG 图:详情页 HTML 里的 `og:image` 链接

## 6. 本轮的自裁记录(超出蓝图明文的部分,请确认)

蓝图对这几点没有明文,我按最保守的方向做了裁决并写进代码注释。**如果任何一条
与你的判断不符,改起来都只是一处:**

| 编号 | 裁决 | 理由 |
|---|---|---|
| T5-R1 | 总费用指标复用 `costBlockLine`,不在 T5 分叉单位逻辑 | 人类 2026-08-03 裁决,见 §0.2;已被 T3-R6 验证为正确方向(上游修复后 T5 零改动自动对齐) |
| T5-R2 | slug 缺失 → 二维码指首页;slug 存在 → 必须指该项目 | 人类 2026-08-03 裁决 |
| T5-R3 | 语言指标只写分数(如「TOEFL 73 / IELTS 6」),**不**追加「设有豁免」之类的补充 | 分享卡每条指标只有一行,豁免细则按 §3.2 需要条件说明与来源链接,压缩成四个字比不写更容易被读成绝对结论。分数本身是官网写的最低分,是事实陈述;完整豁免政策在详情页(扫码即达) |
| T5-R4 | `freshness = changed` 时核实戳改用 T3 的「官网内容有变更,信息更新中」 | 同一份数据下 T3 状态条说的就是这句;一边说变更中、一边盖核实戳会自相矛盾 |
| T5-R5 | `prescreening_required = "Varies"` 不单独成句(此时只说试音形式,两者都未知则整条消失) | 五态/三态词表里没有 Varies 的中文措辞,自己造一个就是发明事实 |
| T5-R6 | 校名字号按「最多两行」确定性降档,下限 44px | 固定画布 + 不定长校名;不降档时德文全称会把页脚整个顶出画布。纯函数、可复现,不是"看着调" |
| T5-R7 | 预览面加了一层注册表,真实数据用 `-t1b` 后缀的 school slug 与 mock 区分 | 真实包的 slug(`juilliard` / `voice-bm`)与 T3 mock 完全撞车。数据本身一个字没改,后缀只在预览面存在 |

---

**不要标记为已评审。** 按蓝图 §4,T5 的评审是人工目检。

---

## 7. T5-R1(Codex 2026-08-04)处理结果

| # | 评审意见 | 处理 |
|---|---|---|
| 1(P1) | 极长校名无溢出保护,只降到 44px 就停;测试必须断言渲染后不溢出、不挤压页脚 | **改实现 + 新增真实渲染断言。** `fitSchoolName` 变成三级:①按宽度**与高度预算**降字号(新增 `schoolNameHeightBudget`,把品牌行/英文名/专业/指标/页脚逐块算出来,剩下多少才是校名能用的高度)→ ②预算不够就减行 → ③仍排不下就截断加省略号,省略号保证落在允许行数内。校名块另加固定高度 + `overflow: hidden` 作结构性兜底。新增 R 组(`tests/dom/share-card-render.dom.test.tsx`):**真的出 PNG,逐像素**断言尺寸、外框 24px 无内容、页脚左右两侧都在画布内、文字行之间有分隔空白。U3 声称已按新行为重写,并补 U4(高度不超预算,含 500 字/300 字病态输入)、U5(确定性) |
| 2(P2) | 真实数据只深测 voice-bm,DMA 最特殊却没测 | `sc:H3` 改为四条**逐字段**断言(校名/英文名/专业/学位缩写/三条指标取值/核实戳/二维码地址),并先断言这四个 slug 就是包里的全部;新增 `sc:H3b` 覆盖费用形态(BM/MM/GD 的 CNY 块实际取值,DMA 的 null) |
| 3(P2) | A1 声称范围大于 `sc:A3`/`sc:E1` 的实际断言 | 新增 `sc:A4`:整个 payload `deepEqual`,并断言字段集合恰好是 §1.4 列的 8 个 —— 多出第九个字段就是「投影发明新事实」的入口 |
| 4 | B1 收窄,不要让测试连生产 Directus | 声称改为「指标按传入配置的 `priority` 升序取值」;生产一致性移交人工项 M1,失效条件写明 `share_card_metric_rules` **或 `badge_rules`** 变更时需重新人工核对,并写明为什么刻意不自动化 |
| 5 | I1 收窄,实际 meta 渲染归人工项 | 声称改为「`metadataBase` 引用 `SITE_URL` 单一来源,源码无站外硬编码」;实际渲染出的 meta 归 M3,M3 里记了 2026-08-04 的复核结果 |

### 修 #1 时,新的像素断言当场抓到两个原先看不见的缺陷

两个都已修,记在这里是因为它们说明了「元素树断言 ≠ 渲染正确」:

1. **盒模型**:satori 默认 content-box,`height: 100%` + `padding: 64` 让内容总高
   等于画布高 + 上下内边距,底部被推出画布 —— 二维码有 24px 被裁在画布外。
   已加 `boxSizing: border-box`。
2. **行高估算**:非校名文字按 1.25 估算,而卡面几乎全是中文、实际行盒约 1.4,
   高度预算多算约 29px;14 字中文校名换行后把页脚压出画布。估算改为 1.4,并把
   指标行内边距(0.3→0.2 倍)、指标区上边距(40→32)、二维码(180→160)一并
   收紧,给换行校名腾出竖向预算。

上述两条在元素树层面完全看不出来,`sc:S1`–`S6` 当时全部通过。

**不要标记为已评审。** 下一步:Codex 复评,只核这五条。

---

## 8. T5-R2(Codex 第二轮 2026-08-04)处理结果

| # | 评审意见 | 处理 |
|---|---|---|
| 1(P1) | `tokenize()` 把连续拉丁字符当成不可拆分 token,`A×300`、中英混排的长英文段被判成「一行放得下」、`truncated: false`;U4 只查高度不查宽度所以没抓到 | **`layoutLines` 与截断那一趟都加了强制断字**:单个 token 自身超过行宽时按字符拆开(排版引擎的做法)。顺带修掉一处度量不一致 —— `approximateEmWidth` 把空格按 0.62em 计、而打包按 0.3em 计,两者现在共用同一个 `SPACE_EM`。`sc:U4` 补横向断言(重排后每行宽度 ≤ 可用宽度、行数 ≤ 声称行数),新增 `sc:U4b`(超宽单 token 必须被判为需截断并留省略号 —— 否则"不超宽不超高"在悄悄丢字的实现下也成立)。R 组补两个真实渲染用例:200 字无空格全英文、中英混排超长 |
| 2(P1) | `qr_domain` 被说成「蓝图 §1.4 的第 8 个字段」,而 §1.4 只有 7 个 —— 测试在验证一份不存在的规格 | **保留字段,走正式流程承认它是扩展**,四处同步:①数据字典(**跨仓库**,见 §9)新增「`share_card_payload` — implemented as 8 fields」小节,写明第 8 个是 T5 扩展、非 §1.4 定义,并写明后续新增字段必须先改扩展清单;②`data/v3/types.ts` 的类型注释同一条记录;③`sc:A4` 改为 `BLUEPRINT_PAYLOAD_FIELDS`(7)+ `T5_PAYLOAD_EXTENSIONS`(1)分开声明再整体断言;④矩阵 A1/A4 行措辞更正 |
| 3(P2) | A1 只验证 mock payload,证明不了真实项目也符合完整字段约束 | 抽出 `assertPayloadContract(payload, label)`:字段集合、每个字段的类型与非空、metrics ≤3 且每条 label/value 去空白后非空、`metric_key` 必须来自配置层规则、`verified_stamp` 为 `string \| null`、`qr_url` 绝对地址。**mock(`sc:A4`)与真实四条(`sc:H1`)跑同一个函数** |
| 4(P2) | H1 声称「完整 payload」但只查了若干字符串和 `qr_url` 前缀 | 选「补齐断言」:`sc:H1` 改跑 `assertPayloadContract`,并逐条断言 `qr_url` 的完整值(不再只比前缀) |
| 5(P2) | R2 声称「外框无任何内容」但只查深色像素,浅色内容漏网 | 改为**偏离底色**判定(与 `#FFFFFF` 的任一通道差 > 6 即算内容),浅灰分隔线、`brand-50` 角标底这类浅色溢出同样会被抓到。排除卡片自身的 1px 描边与 12px 圆角区域,并在注释里说明为什么这两处不算溢出 |
| 6(P2) | R3 用固定黑方块冒充二维码,只能证明有像素 | 渲染**真二维码**(`qrDataUri(payload.qr_url)`),再从**成品 PNG** 裁出二维码区域、放大 3 倍、用 jsQR 解码,断言解回 `payload.qr_url`。与 `sc:D4` 同一解码手法,起点从 SVG 换成最终产物 —— 一次同时证明「它在画布内」「它是二维码」「它能扫」 |

**不要标记为已评审。** 下一步:Codex 第三轮复评,只核这六条。

---

## 9. `share_card_payload` 字段契约(本仓库内的正式记录)

> 这一节存在的理由:数据字典在**另一个仓库**,stagefront 的读者打不开它。
> 矩阵不该指向一个在本仓库不存在的路径 —— 那正是前几轮反复出现的「表在说谎」
> 的同一形态(Codex 第三轮 T5-R3)。

### 契约

`share_card_payload` **实现为 8 个字段**:

| 来源 | 字段 |
|---|---|
| 蓝图 §1.4(七个,逐字写死) | `name_zh`、`name_en`、`program_zh`、`degree_abbr`、`metrics`、`verified_stamp`、`qr_url` |
| **T5 扩展(一个)** | `qr_domain` —— 二维码旁用文字印出的裸域名,由生成 `qr_url` 的同一个 `SITE_URL` 派生,不引入任何新事实 |

**`qr_domain` 不是蓝图 §1.4 的定义。** 初版测试把八个字段一起说成「§1.4 定义」,
等于在验证一份不存在的规格。

**后续再往 `share_card_payload` 加字段的规则**:先改扩展清单(本节 + `types.ts`
的类型注释 + 数据字典三处同步),再改断言;**不许把字段数改大之后仍称
「§1.4 定义」**。

### 这条记录写在哪几处

| 位置 | 是否在本仓库 |
|---|---|
| 本节 | ✅ |
| `data/v3/types.ts` — `ShareCardPayloadV3` 的类型注释 | ✅ |
| `tests/program_v3_share_card.test.mjs` — `BLUEPRINT_PAYLOAD_FIELDS` / `T5_PAYLOAD_EXTENSIONS` 两个常量(`sc:A4` 分开断言) | ✅ |
| 数据字典 `D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor\references\directus_collections_reference.md` 的 “`share_card_payload` — implemented as 8 fields” 小节 | ❌ **跨仓库** |

### 关于那份跨仓库的数据字典

**已经写进去了**(2026-08-04,位于「Ownership of the `publishing` block」小节
之后)。Codex 第三轮怀疑「没写成功或写到了 stagefront 的同名路径下」——
复核结果:stagefront 没有 `references/` 目录,当时的编辑用的就是绝对路径,
内容确实落在 extractor 仓库那份文件里。真正的问题是**矩阵引用写成了相对路径**,
在 stagefront 里打不开;已改为绝对路径并标明跨仓库。

⚠️ **待办(需人工处理)**:`D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor`
**不是 git 仓库**(该目录下没有 `.git`),所以这条字典改动没有版本记录、也不会
随任何提交走。需要人工确认它被纳入 extractor 的正式版本管理,否则下次同步/覆盖
时可能悄悄丢失。

---

## 10. T5-R3(Codex 第三轮 2026-08-04)处理结果

| # | 评审意见 | 处理 |
|---|---|---|
| 1(P1) | `qr_domain` 的数据字典登记缺失,疑似写到了 stagefront 的同名路径 | 复核:改动**确实在** extractor 仓库那份文件里(stagefront 无 `references/` 目录,当时用的就是绝对路径)。按选项 (a) 处理:矩阵 A1 的引用改为**绝对路径 + 标明跨仓库**,同时在本仓库内建立正式记录(§9 + `types.ts` 类型注释),矩阵 A1 首先指向这两处**本仓库内真实存在**的位置。另记待办:extractor 目录不是 git 仓库,该字典改动无版本记录,需人工纳管 |
| 2 | R1 仍写「四个用例」,实际六个 | 已改 |
| 3 | M4 仍写「上面 39 条」,实际 59 条 | 已改 |

**不要标记为已评审。** 下一步:Codex 第四轮确认性复核,只核这一条 + 两处措辞。

---

## 11. 结项遗留事项

T5 结项时挂账的五条。**没有一条是 T5 的未完成项** —— 前四条要么归属别的
ticket、要么是已裁决的过渡处理或产品决策;最后一条是流程风险,优先级高于
其余各项。

**状态更新(2026-08-03):11.2(费用单位)已由 T3-R6 修复并验证,不再是开放
项 —— 保留在此列表中是存档,不是待办。其余四条仍开放。**

### 11.1 ⚠️ 最高优先级:extractor 仓库无版本控制

`D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor` **不是 git 仓库**
(该目录下没有 `.git`)。

影响面比 T5 大得多:那个目录里放着**数据字典**
(`references/directus_collections_reference.md`,四投影共同的字段契约来源)、
Mode F 发布脚本、受控词表种子。T5 补进数据字典的
「`share_card_payload` — implemented as 8 fields」小节(见 §9)因此**没有任何
版本记录**,被覆盖或回滚都不会留痕。

**需人工处理**:把该目录纳入版本管理,并确认 §9 那条记录在纳管后仍在。
在此之前,stagefront 侧的两份同文记录(`data/v3/types.ts` 的类型注释、本文档
§9)是这条契约唯一有版本追溯的副本。

### 11.2 费用单位错配(元 / 万)—— 已解决(T3-R6,2026-08-03)

详见 §0.2。曾经的状况:蓝图 §1.4 与 Mode F 真实产出的单位是**元**,而 T3 的
mock 与 `costBlockLine` 渲染器、以及跟着 T3 走的 T4 JSON-LD 当作**万元**。

T5 按人类 2026-08-03 的裁决**未分叉**:总费用指标直接复用
`costBlockLine().headline`,分享卡与 Web Card 永远显示同一个数。

**已修复,已验证。** T3-R6(同日)在上游修好后,分享卡自动对齐,**T5 侧无需
任何改动** —— 验证方式:`buildShareCardPayload` 对真实茱莉亚包强制费用指标
浮现,`total_cost` 正确输出「¥57–60 万元人民币」。这条不再是遗留事项。

`sc:H3b` 钉住了真实包的实际取值(min 570000 / max 600000),这个数字将来被
悄悄改掉会立刻失败。T3 侧另有 `tests/dom/program-card-v3.dom.test.tsx` 的
`U1`–`U5` 直接读同一份真实包做回归。

### 11.3 `english_requirement_status` 缺失 —— 归 T2b

真实 canonical 包的 `application_requirements` 没有这一列(T3 mock 有,且 T3
的英语要求行依赖它),详见 §3 差异 ③。

T5 的处理:映射为 `Unknown`(等同 null:不渲染、不点亮「免语言成绩」),
**绝不由「有 TOEFL 分数」反推成 `Required`** —— 那是前端发明五态,`sc:H4`
钉住这条。**待 T2b 明确:是 schema 少了这一列,还是提取阶段没写。**

### 11.4 二维码在 slug 缺失时指向首页 —— 过渡处理,待 T3b 后重新评估

人类 2026-08-03 裁决(T5-R2):slug 缺失时二维码指向站点首页,保证版式完整、
不出现空洞;**slug 存在时必须指向该项目详情页,不得一律指首页**(`sc:D1`
钉住,并额外断言它 ≠ 首页)。

> 用户可能预期扫码落到该项目详情页 —— 属于已知的过渡处理,待 T3b 真实路由
> 上线、slug 覆盖率提高后重新评估,届时可改为 §3.1 的不渲染方案。

### 11.5 存图按钮未做 —— 产品决策

**上线首周不开放。** 本轮只做图片生成与 OG 接入,前端没有任何指向分享卡路由的
下载/保存入口。这是产品决策,不是遗漏;要开放时补一个入口即可,图片服务本身
已经就位。
