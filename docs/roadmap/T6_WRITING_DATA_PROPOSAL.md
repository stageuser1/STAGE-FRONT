# T6 — Writing 数据契约提案（待业主批准）

**阶段：** T6（Writing 模块）· **状态：** 提案，未实施
**日期：** 2026-07-29
**对应审批项：** `STAGE_VISUAL_REPLACEMENT_PLAN.md` §7 增量 #1（Writing 任务库）
**约束来源：** 《总纲》§2.6 / §4 / §5-T6 / §6；`docs/stage-specs/ielts-lab-writing-spec.md`（UI 权威）；`ielts-lab-master-spec.md` 全局规则
**本文范围：** 只描述"要新增什么数据、前端怎么读、内容怎么录"。批准前不建 schema、不写任何应用代码。

---

## 0. 一句话结论

新增 **两张互相关联的 Directus 集合**（`ielts_writing_sets` 练习单元 + `ielts_writing_tasks` 单个任务），**一个公开可读的图片文件夹**，以及 **一个新的前端读取模块 `lib/writing-data.ts`**。不改动、不删除任何既有集合、字段、权限或路由。

为什么是两张表而不是一张：写作界面把 **Task 1 与 Task 2 放在同一次会话里切换**（规格 §三底部），任务卡上的"难度 / 预计用时 / `2 tasks` / 策略提示"全部是**会话级**属性，而"题干 / 图型 / 配图 / 目标字数 / 参考范文"全部是**任务级**属性。一张表会逼编辑在两行里重复填一遍会话级字段并保持同步——这正是数据漂移的来源。1:N 拆分让每个字段只有一个填写位置。

---

## 1. 集合 A：`ielts_writing_sets`（练习单元 = 任务列表页的一张卡）

| 字段 | 类型 | 必填 | 说明 / UI 落点 |
|---|---|---|---|
| `id` | 主键（沿用实例默认：uuid 或自增） | 是 | 内部标识，不进 URL |
| `slug` | string，唯一 | 是 | ASCII kebab，进路由 `/ielts-lab/writing/{slug}`。**一经发布不得修改**（改了等于换了一个页面，会作废学习者的本地草稿） |
| `title_en` | string | 是 | 卡片标题（英文，简述话题）。规格 §二.3 第一行 |
| `title_zh` | string | 否 | 可选中文副题；缺省时卡片只显示英文，不显示占位 |
| `difficulty` | enum：`foundation` / `standard` / `advanced` | 是 | 中性三档。UI 逐字 `基础` / `标准` / `进阶`，配色为浅蓝 / 浅灰 / 深蓝（规格 §二.3 与 §五.6：**严禁红色**） |
| `estimated_minutes` | integer | 是 | 预计用时。Task 1 约 20，Task 2 约 40，双任务单元 60 |
| `strategy_hint_zh` | text，**长度上限 120 字** | 是 | 策略提示卡。**编辑规则见 §4**，上限本身就是防线：一行放不下一个段落 |
| `publish_status` | enum：`draft` / `published` | 是，默认 `draft` | 前端只读 `published`。字段值为英文，永不出现在 UI 文案里（《总纲》§4.2.3 禁词） |
| `sort` | integer | 否 | Directus 手动排序。列表与分页按 `sort,id` 稳定排序，避免每次构建顺序抖动 |
| `tasks` | O2M → `ielts_writing_tasks.set_id` | — | 关系字段，非人工录入 |

**`task_count` 不设字段。** 卡片上的 `{N} tasks` 由 `tasks` 关系的行数派生。手填计数迟早会和实际行数对不上，而这个数字是学习者点进去之前唯一的预期来源。

**`word_target` 不放在这里。** 目标字数是任务级的（150 / 250），见集合 B。

---

## 2. 集合 B：`ielts_writing_tasks`（单个任务 = 写作界面的一个 Tab）

| 字段 | 类型 | 必填 | 说明 / UI 落点 |
|---|---|---|---|
| `id` | 主键 | 是 | — |
| `set_id` | M2O → `ielts_writing_sets` | 是 | 所属练习单元 |
| `position` | integer（1 或 2） | 是 | 底部 Tab 顺序与 `{X}/{Y} tasks` 进度的分母来源 |
| `task_kind` | enum：`task_1` / `task_2` | 是 | 分类标签 `全部` / `Task 1` / `Task 2` 的筛选依据 |
| `figure_kind` | enum：`data_chart` / `process` / `map` / `diagram` | `task_1` 时必填，`task_2` 时须留空 | 小作文图型：`数据图` / `流程图` / `地图` / `示意图`（master-spec §题库列表 Writing 附加规则、writing-spec §三左栏） |
| `prompt_en` | text | 是 | 英文题干原文。左栏正文 |
| `word_target` | integer | 是 | 150 / 250。驱动左栏 `Write at least {N} words.` 与右栏 `{当前字数} / {目标字数} words` |
| `figure_image` | file（M2O → `directus_files`） | `task_1` 时必填 | 图表 / 流程图 / 地图 / 示意图。托管方案见 §5 |
| `figure_alt_zh` | text | 有 `figure_image` 时必填 | 图片替代文本。无障碍硬性要求（《总纲》§4.1.4），也是图片加载失败时的兜底 |
| `model_answer_en` | text | 否 | **参考范文，可选**。消费规则见 §3 |
| `model_answer_note_zh` | text | 否 | 范文的方法论批注（可选）。同样受 §3 解锁规则约束 |
| `model_answer_source` | string | 否 | 范文来源 / 授权说明。有 `model_answer_en` 时必填——溯源原则对范文同样适用 |

**没有的字段（刻意）：** 任何分数、band、评分标准、"预计得分"、正确率、全体平均、AI 相关字段。集合里不存在这些列，UI 就永远无法在未来某次改动中"顺手"把它们渲染出来。

---

## 3. 参考范文与解锁规则

### 3.1 规则（规格 §四，已是全 Lab 统一规则）

参考范文必须以"学习者已完成自己的写作并点击**完成本次练习**"为解锁条件；写作区为空或字数为 0 时不可见。

### 3.2 前端如何消费

范文**不进入写作界面的页面负载**。三段式：

1. `/ielts-lab/writing/{slug}` （写作界面）——服务端只投递 `hasModelAnswer: boolean`，不投递范文正文。页面上没有任何可揭示的范文 DOM。
2. 点击「完成本次练习」→ 本地会话写入 `completedAt` 与该任务的 `wordCount`（`lib/ielts/writing-session.ts`，见 §7）。**字数为 0 的任务不写 `completedAt`**，因此空草稿不可能解锁。
3. 解锁后出现「查看参考范文」入口，跳转到独立路由 `/ielts-lab/writing/{slug}/model`。该路由在渲染前读取本地会话；未完成（或直接输 URL 进入）时不渲染范文，显示逐字提示 `先完成你自己的写作，再看参考范文。` 与返回写作界面的按钮。

### 3.3 诚实的边界（请业主知悉）

STAGE 目前是纯静态站点，Lab 下没有任何 route handler / 服务端会话。因此"解锁"是**客户端纪律**，不是服务端鉴权：范文正文存在于 `/model` 路由的静态负载里，一个懂开发者工具的人可以绕过判断读到它。

现有阅读复盘的「遮罩揭示」是同一量级的纪律（内容在负载里、由前端遮罩）。本方案比遮罩更严一档——**写作界面本身的负载里没有范文**，必须主动导航到另一个路由才会下载。要做到服务端强制，需要引入 route handler + 学习者身份，那是 T6 范围之外的架构变更。

**建议：** v1 内容录入阶段 `model_answer_en` 一律留空，模块先以"仅助力草稿管理与过程追踪"上线（规格 §五.8 的范围声明）。字段先建好，等有了自有授权范文再逐条填入——填入当天不需要任何代码改动。

---

## 4. `strategy_hint_zh` 的编辑规则（写进 Directus 字段说明）

**允许**：审题方法、结构思路、常见陷阱提醒。
例：`先比较各类别的整体走势，再挑一两处最大差异展开，不要逐个数据复述。`

**禁止**：
- 任何可直接抄进答案的英文句子、短语、连接词模板
- 针对本题的段落骨架填空（如"第一段写 ___，第二段写 ___"配上现成措辞）
- 范文片段、结论句、观点句
- 任何分数导向表述（"这样写能到 X 分"）

**结构性防线**：字段长度上限 120 字（Directus 校验），前端映射层再校验一次——超长的提示视为编辑事故，**丢弃该提示并记一条 `logDirectusDegradation`**，卡片照常渲染其余部分。一行放不下一篇范文，这比事后人工抽查可靠。

---

## 5. 图片托管

**方案（推荐）：Directus Files + 一个公开可读文件夹。**

- 图片上传到 Directus 文件夹 `ielts-writing`，该文件夹对 Directus **public 角色开放只读**。这是本提案**唯一的权限变更**，且只覆盖这一个文件夹，不涉及任何既有集合的权限。
- 前端 URL：`${NEXT_PUBLIC_DIRECTUS_URL}/assets/{file_id}`（该环境变量已存在，`.env.example` 已声明，reviewer 登录路径在用）。
- 用原生 `<img>`，显式 `width` / `height` / `loading="lazy"` / `alt={figure_alt_zh}`。尺寸从 `directus_files` 自带的 `width` / `height` 元数据读取（关系字段展开即可，**不新增字段**），因此不需要 `next/image`、不需要改 `next.config.ts` 的 `images.remotePatterns`、不引入新依赖。
- 图片格式建议 PNG 或 SVG；SVG 由编辑上传前自查（不含外链、不含脚本）。

**备选（若不愿开放公开文件夹）：** 图片作为仓库资产放 `public/ielts/writing/{slug}-{position}.png`，集合里只存文件名。好处是零权限变更、构建确定、Directus 宕机也不影响；代价是新增题目必须走一次部署。两种方案的前端字段差异只有一个（`figure_image` 关系 vs `figure_file` 字符串），改动成本很低——**请业主择一**。

---

## 6. 前端读取路径

### 6.1 新模块 `lib/writing-data.ts`（唯一新增的数据模块）

沿用 `lib/data.ts` 已确立的四条纪律，不复制它的体量：

1. **走既有 transport**：`readAllItems` / `readItems` / `countItems`（`lib/directus/client.ts`），自动获得超时预算、失败分类、重试纪律、分页与 `directus:{collection}` 缓存标签。**不新增 fetch 代码。**
2. **显式字段白名单**：查询里逐列点名，永远不出现 `fields=*`、不出现 `limit=-1`。
3. **`cache()` 包裹的路由级 loader**：`loadWritingSets()`（列表页）、`loadWritingSetBySlug(slug)`（写作界面 / 范文页）。
4. **逐字段显式 DTO 映射**：内部行形状不越过公开边界，新增内部字段不会自动泄漏到客户端组件。

之所以不写进 `lib/data.ts`：那个文件是院校 / 项目域的 2,000 行，Writing 与它零共享映射逻辑。之所以不写进 `lib/ielts/`：该目录目前是**纯函数层**，`npm run test:lib` 直接以 `--experimental-strip-types` 加载它；引入 Directus 依赖会污染这条测试路径（《总纲》§6.4 保留项）。

不改 `REVALIDATABLE_COLLECTIONS`——reviewer 不写 Writing 数据，没有需要失效的写路径。

### 6.2 读取内容

```
readAllItems("ielts_writing_sets", {
  fields: "id,slug,title_en,title_zh,difficulty,estimated_minutes,strategy_hint_zh,sort,
           tasks.id,tasks.position,tasks.task_kind,tasks.figure_kind,tasks.word_target",
  filter: { "filter[publish_status][_eq]": "published" },
  sort: "sort,id",
})
```

列表页**不读** `prompt_en`、不读 `figure_image`、不读范文——卡片不渲染它们。写作界面按 slug 单条读取时才带上 `tasks.prompt_en`、`tasks.figure_image.{id,width,height}`、`tasks.figure_alt_zh`；范文正文只在 `/model` 路由的读取里出现。这与 `collections.ts` 里"list 只读聚合、detail 才读正文"的既有分层一致。

### 6.3 公开 DTO 字段清单（跨越服务端 → 客户端组件的全部字段）

`PublicWritingSetSummaryDto`（列表卡片）：
```
slug, title_en, title_zh, difficulty, estimated_minutes,
strategy_hint, task_count, task_kinds[]
```

`PublicWritingTaskDto`（写作界面的一个 Tab）：
```
position, task_kind, figure_kind, prompt_en, word_target,
figure: { url, width, height, alt } | null
```

`PublicWritingSetDto`（写作界面）：
```
slug, title_en, title_zh, difficulty, estimated_minutes,
tasks: PublicWritingTaskDto[], has_model_answer: boolean
```

`PublicWritingModelAnswerDto`（仅 `/model` 路由）：
```
position, task_kind, model_answer, model_answer_note, model_answer_source
```

`publish_status`、`sort`、`id`、以及任何 Directus 内部列**不进任何 DTO**。

### 6.4 路由与渲染

新增路由三条，全部在既有 `(shell)` 组内（《总纲》§6.1 路由架构不变，不新建路由组）：

| 路由 | 文件 | 渲染 |
|---|---|---|
| `/ielts-lab/writing` | `app/(ielts)/ielts-lab/(shell)/writing/page.tsx` | 静态 |
| `/ielts-lab/writing/[setSlug]` | `.../writing/[setSlug]/page.tsx` | 静态 + `generateStaticParams` |
| `/ielts-lab/writing/[setSlug]/model` | `.../writing/[setSlug]/model/page.tsx` | 静态（仅在批准范文字段时建） |

**分页在客户端做。** 规格 §二.4 要求 `Previous 1 2 Next` + `共 {N} 项`；若用 `?page=` searchParam，Next 会把该路由降级为动态渲染，直接违反《总纲》§4.1.2。因此列表页构建时取全部已发布单元，由客户端组件切页。语料规模是几十条，代价可忽略。

**Directus 不可达时的降级：** 列表页捕获失败、`logDirectusDegradation` 记一行、渲染空状态，**不让构建失败**。Writing 是新增可选模块，它的后端抖动不应该拖垮首页与院校侧的构建产物。（这与院校侧路由"失败即构建失败"的策略不同，是一个刻意的差异，请业主确认接受。）

---

## 7. 本地存储（无需后端，一并报备）

新键 `stage.ielts.writing`，payload 内含 `schemaVersion`，经新模块 `lib/ielts/writing-session.ts` 读写，**组件内不出现 `localStorage`**。与既有键（`stage.ielts.practice-records` / `.drafts` / `.session` / `.browse` / `.mistakes` / `.onboarding`、`stage.profile`、`stage.saved.programs`）无冲突，不触碰任何既有键的 payload（《总纲》§6.3 本地存储契约）。

存放内容：每个 `setSlug` 的 `{ schemaVersion, updatedAt, tasks: { [position]: { text, wordCount } }, completedAt }`。学习者的作文正文**只留在浏览器**，不上传、不进 Directus——这一点不需要后端配合，但请业主知悉这是刻意的设计。

---

## 8. 增量性声明（ADDITIVE ONLY）

| 对象 | 变更 |
|---|---|
| `ielts_writing_sets` | **新建** |
| `ielts_writing_tasks` | **新建** |
| `directus_files` 下的 `ielts-writing` 文件夹 | **新建**，public 角色只读（唯一权限变更） |
| `schools` / `program_offerings` / `application_requirements` / `audition_requirements` / `source_records` / `fields` / `degree_levels` / `directus_users` / 任何既有集合 | **零改动**——不加字段、不改类型、不改权限、不改关系 |
| 既有 Directus 权限、角色、流程、Webhook | **零改动** |
| 既有前端路由 | **零改动**，仅新增上表三条 |
| npm 依赖 / Tailwind 版本 / `next.config.ts` | **零改动** |

回滚方式：删掉两张新集合与新文件夹，前端新增路由随代码回滚一并消失，既有系统状态与批准前完全一致。

---

## 9. 内容录入校验清单

每个练习单元发布（`publish_status` 改 `published`）前逐条核对：

**单元级**
1. `slug` 为 ASCII kebab、全库唯一，且确认此后不会再改。
2. `title_en` 是话题简述，不是题干原文的复制。
3. `difficulty` 三档之一；心里清楚它只表达"相对难度"，UI 不会用红色渲染它。
4. `estimated_minutes` 与任务组成一致（单 Task 1 ≈ 20，单 Task 2 ≈ 40，双任务 ≈ 60）。
5. `strategy_hint_zh` 通过 §4 全部四条禁止项自查；≤120 字；不含任何英文成句。
6. 该单元下 `tasks` 行数正确（1 或 2），`position` 从 1 连续编号、无重复。

**任务级**

7. `task_kind` 与 `word_target` 匹配（`task_1`→150，`task_2`→250；若刻意不同，确认是有意为之）。
8. `task_1` 行：`figure_kind` 已选且与配图实际类型一致；`figure_image` 已上传；`figure_alt_zh` 写清"图里有什么"而不是"这是一张图"。
9. `task_2` 行：`figure_kind` 与 `figure_image` 均留空。
10. `prompt_en` 是完整可独立作答的题干，无残缺、无中文混入、无内部批注。
11. `prompt_en` 与配图为**自有或已获授权**内容，不来自第三方题库；来源已在内部记录。
12. 全部字段中不含任何同行产品名称（《总纲》§4.2.1 守护脚本会全仓扫描，包括新集合导出的任何文档）。
13. 全部字段中不含"估算""倒计时""模考""待核验""待公布""雅思实验室"及任何分数 / 评分 / band 表述。

**范文（仅当填写时）**

14. `model_answer_source` 已填，授权状态明确。
15. 范文正文里不含分数标注、不含"考官"字样、不含 AI 生成声明。
16. 已知悉 §3.3：解锁是客户端纪律，范文正文在 `/model` 路由的静态负载中可被技术手段读取。

**发布后**

17. 站点重新构建后，`/ielts-lab/writing` 出现该卡片、`共 {N} 项` 计数正确、`{N} tasks` 与实际行数一致。
18. 图片在无 Directus 登录态的浏览器隐身窗口中能正常加载（验证公开文件夹权限生效）。

---

## 10. 需要业主拍板的四点

1. **两张集合 vs 一张集合**——本文推荐两张（理由见 §0）。
2. **图片托管**——Directus 公开文件夹（推荐）vs 仓库 `public/ielts/writing/`（§5）。
3. **`model_answer_*` 三个字段是否现在就建**——推荐"建字段、v1 留空"（§3.3）。若否决，Phase B 不建 `/model` 路由，写作界面也不出现任何范文入口。
4. **Writing 列表在 Directus 不可达时降级为空状态而非构建失败**（§6.4）——是否接受这个与院校侧不同的策略。

字段名、枚举值、中文标签均可由业主直接修改；本文批准后即为 T6 Phase B 的实施依据。
