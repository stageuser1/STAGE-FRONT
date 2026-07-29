# T7 — Speaking 题库来源提案（待业主拍板）

**阶段：** T7（Speaking 模块）· **状态：** 提案，未实施
**日期：** 2026-07-29
**对应审批项：** `STAGE_VISUAL_REPLACEMENT_PLAN.md` §7 增量 #2（Speaking 题库：**新集合或静态语料包，二选一待业主定**）
**约束来源：** 《总纲》§2.6 / §4 / §5-T7 / §6 / §7；`docs/stage-specs/ielts-lab-master-spec.md` 批次三 + 全局规则
**本文范围：** 只回答"题目卡从哪来、字段是什么、怎么录入更新、前端怎么读"。**批准前不建 schema、不写任何应用代码。**

---

## 0. 一句话结论

**推荐方案 B：静态版本化语料包**——新增一个仓库内数据文件 `lib/ielts/speaking-questions.json` 与一个纯函数读取模块 `lib/ielts/speaking-corpus.ts`，沿用 Reading 题库（`exam-index.json` + `lib/ielts/catalog.ts`）已经跑通的先例。**不新建 Directus 集合、不改任何权限、不新增网络依赖。**

三条决定性理由（详细对比见 §3）：

1. **合规守护能真正覆盖到它。** `scripts/guard.mjs` 扫描全仓文本文件（含 `lib/**/*.json`），同行产品名称、`估算`/`模考` 等禁词、分数类表述会在 `npm run guard` 里当场拦下。**Directus 里的内容不在守护脚本的视野内**——题库正是最容易混进第三方题库措辞的地方，把它放在扫不到的地方是这次合规红线上唯一说不通的选择。
2. **这是一个纯本地模块，不该为几百个短句引入一条网络失败路径。** Speaking 全流程的用户数据不上传（业主既定），题目卡是纯文本、无配图、无关系、无媒体。走 Directus 就要为它写一套降级路径、一份空状态、一次 `generateStaticParams` 的网络依赖——而这些复杂度换来的只是"改题目不用发版"。
3. **它可被测试。** 语料包能被 `npm run test:lib` 直接加载校验（id 唯一、part 合法、题干非空、Part 2 专属字段不越界、禁词零命中）。Directus 内容只能靠人工抽查清单。

方案 A（Directus 集合）在 §2 完整给出，字段与工作流同样可执行；若业主更看重"非工程人员随时改题、无需发版"，可直接选 A，两者的前端组件层完全一致，差异只在 `lib/` 的一个读取模块。

---

## 1. 两个方案共有的部分（无论选哪个都成立）

### 1.1 数据模型（字段定义相同，只是承载介质不同）

**题目卡（question card）**

| 字段 | 类型 | 必填 | 说明 / UI 落点 |
|---|---|---|---|
| `id` | string，ASCII kebab，全库唯一 | 是 | **稳定标识，一经发布永不修改**。它是本地素材的挂载键（见 §1.3），改 id 等于让学习者写过的想法片段全部失联 |
| `part` | 1 / 2 / 3 | 是 | 题目页的 Part 1/2/3 分类浏览（批次三 §1） |
| `topic` | string（引用话题 id） | 是 | 话题分组。Part 2 与其配套 Part 3 追问共享同一话题 |
| `text_en` | text | 是 | 英文题干原文，题目卡正文；五步流程每一步页顶都显示它 |
| `gloss_zh` | text | 否 | 可选中文释义。**是"这道题在问什么"的解释，不是参考答案**；缺省时不显示占位 |
| `cue_points_en` | string[] | 仅 `part=2` 可填 | Part 2 卡片的 `You should say:` 分条。Part 1/3 必须留空——没有分条的 Part 2 卡不是一张完整的卡，而 Part 1 出现分条是录入事故 |

**话题（topic）**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string，ASCII kebab，唯一 | 是 | 同样**永不修改** |
| `label_en` | string | 是 | 如 `Hometown` |
| `label_zh` | string | 是 | 如 `家乡`。题目页左侧/顶部的话题筛选按中英双行显示 |
| `source_note` | string | 是 | 该话题下题目的来源与授权说明（见 §1.2）。**不进 UI**，只作内部溯源 |

### 1.2 刻意不存在的字段（两个方案都一样）

**没有** `sample_answer` / `model_answer` / `band` / `score` / `difficulty_band` / `vocabulary_list` / 任何 AI 相关列。

理由是硬约束，不是偏好：批次三 §3 的核心规则是"右栏内容只能来源于左栏用户自己的片段"。**只要数据层里存在一个"参考答案"字段，它迟早会被渲染到某个页面上，那一刻答案构建页的全部意义就失效了。** 字段不存在，这条路就走不通。同理，Writing 模块里那种"完成后解锁范文"的机制**不移植到 Speaking**——Speaking 的产出是学习者自己的表达，没有"标准答案"这个概念。

《总纲》标准的绝对范围冻结在此同步声明：**无录音、无麦克风、无发音分析、无 AI 考官、无分数预测、无评分**——这些在数据层同样没有任何字段可以落脚。

### 1.3 内容来源与授权（两个方案的同一条纪律）

- 题目卡由 STAGE **自行撰写**：话题维度参考公开考试大纲的题型结构，题干为自有措辞，**不逐字复制任何第三方题库、机经、押题资料**。
- 每个话题必须填 `source_note`（如"自撰，基于公开大纲话题分类"），内部可追溯。
- 全仓守护脚本对同行产品名称零容忍；方案 B 下语料文件被自动扫描，方案 A 下需在录入清单里人工核对（§2.4 第 8 条）。

### 1.4 用户素材：两个方案都 100% 本地

新键 `stage.ielts.speaking`，payload 内含 `schemaVersion`，由新模块 `lib/ielts/speaking-session.ts` 独占读写（组件内不出现 `localStorage`，沿用 `writing-session.ts` 先例、《总纲》§6.3）。

存放：按 `questionId` 分组的 `{ 九维度片段, 答案草稿, 记忆巩固进度, 独立表达完成事件 }`。**九维度想法、答案草稿、自查勾选全部只留在浏览器，不上传、不进 Directus。** 导出/导入（批次三 §6）是这些数据离开浏览器的唯一途径，且由用户主动触发、落到本地文件。

**孤儿素材纪律（重要，两个方案同样适用）：** 题目下架 / 改 id 后，本地素材不会跟着消失。模块必须能渲染"该题目已不在题库中"的状态并**保留素材可读、可导出**，绝不静默删除学习者写过的东西。这也是 §1.1 强调 id 永不修改的原因。

---

## 2. 方案 A：新建 Directus 集合

### 2.1 集合

沿用 T6 的 1:N 形状：`ielts_speaking_topics`（话题）+ `ielts_speaking_questions`（题目卡）。

`ielts_speaking_topics`：`id` · `slug`(唯一) · `label_en` · `label_zh` · `source_note` · `publish_status`(`draft`/`published`) · `sort` · `questions`(O2M)

`ielts_speaking_questions`：`id` · `topic_id`(M2O) · `slug`(唯一) · `part`(enum `part_1`/`part_2`/`part_3`) · `text_en` · `gloss_zh` · `cue_points_en`(JSON 数组) · `publish_status` · `sort`

比 Writing 少了整整一层复杂度：**没有文件、没有图片、没有公开文件夹**，因此**零权限变更**——这是方案 A 相对 T6 唯一真正便宜的地方。

### 2.2 读取路径

新模块 `lib/speaking-data.ts`，与 `lib/writing-data.ts` 同构：走 `lib/directus/client.ts` 既有 transport、显式字段白名单、`cache()` 包裹 loader、逐字段 DTO 映射。不放 `lib/ielts/`（那是 `test:lib` 用 `--experimental-strip-types` 直接加载的纯函数层，引入 Directus 依赖会污染这条路径）。

```
readAllItems("ielts_speaking_topics", {
  fields: "slug,label_en,label_zh,sort,
           questions.slug,questions.part,questions.text_en,questions.gloss_zh,questions.cue_points_en",
  filter: { "filter[publish_status][_eq]": "published" },
  sort: "sort,id",
})
```

题库整体只有几百条短文本，一次全量读取即可，题目页与五步流程页共用同一份负载。

### 2.3 降级

Directus 不可达 → `logDirectusDegradation` + 空状态，不让构建失败（与 Writing 一致）。代价：**`generateStaticParams` 会在后端抖动时产出空列表，整个 Speaking 模块在那次构建里消失**——学习者本地已有的素材会集体进入 §1.4 的"孤儿"状态。这是方案 A 最不舒服的一点。

### 2.4 更新工作流

编辑在 Directus 后台改文案 → 改 `publish_status` 为 `published` → 站点重新构建 → 上线。发布前逐条核对：

1. `slug` 为 ASCII kebab、唯一，且确认此后永不修改（§1.1）。
2. `part` 与内容匹配；`part_2` 行 `cue_points_en` 已填，`part_1`/`part_3` 行留空。
3. `text_en` 是完整可独立作答的题干，无中文混入、无内部批注。
4. `gloss_zh`（若填）是"在问什么"的解释，**不含任何可直接背诵的英文成句**。
5. 话题 `source_note` 已填，授权状态明确。
6. 全部字段无分数 / band / 评分 / 考官 / 录音 / AI 类表述。
7. 全部字段无 `估算`、`倒计时`、`模考`、`待核验`、`待公布`、`雅思实验室`。
8. **全部字段无同行产品名称**——守护脚本扫不到 Directus，此条只能人工把关。

---

## 3. 方案 B：静态版本化语料包（推荐）

### 3.1 文件

新增 `lib/ielts/speaking-questions.json`，单文件、版本化信封：

```json
{
  "corpusVersion": 1,
  "generatedAt": "2026-07-29",
  "topics": [
    {
      "id": "hometown",
      "labelEn": "Hometown",
      "labelZh": "家乡",
      "sourceNote": "自撰，基于公开大纲话题分类",
      "questions": [
        { "id": "hometown-p1-01", "part": 1, "textEn": "…", "glossZh": "…" },
        { "id": "hometown-p2-01", "part": 2, "textEn": "Describe …",
          "cuePointsEn": ["…", "…", "…"], "glossZh": null },
        { "id": "hometown-p3-01", "part": 3, "textEn": "…", "glossZh": null }
      ]
    }
  ]
}
```

`corpusVersion` 在信封里而不在文件名里——与本地存储"版本号放 payload 内"的既有纪律一致，将来换形状时旧读取器能识别而不是把文件当陌生数据丢掉。

**体量预算：** v1 目标 20–30 个话题 / 200–350 张卡，纯短文本，预计 60–110 KB（对照：现有 `exam-index.json` 55 KB、`question-types.json` 26 KB，均已被客户端组件静态 import）。若超过 **150 KB**，按 Part 拆三个文件并在题目页按需 `import()`——这是一条预先写下的红线，不是将来临时决定的事。

### 3.2 读取路径

新模块 `lib/ielts/speaking-corpus.ts`——**纯函数、静态 import、零网络**，与 `catalog.ts` 完全同构：

```ts
import corpus from "./speaking-questions.json";
export function getSpeakingTopics(): SpeakingTopic[]
export function getSpeakingQuestions(part?: 1 | 2 | 3): SpeakingQuestion[]
export function getSpeakingQuestion(id: string): SpeakingQuestion | null
export const SPEAKING_CORPUS_VERSION: number
```

放在 `lib/ielts/` 是正确的（不像 `writing-data.ts` 必须避开）：它没有 Directus 依赖，因此能被 `npm run test:lib` 的 `--experimental-strip-types` 直接加载——这正是下一节能成立的前提。

### 3.3 更新工作流

改仓库里的 JSON → `npm run test:lib` → `npm run guard` → commit → 部署。**改题目需要一次发版**，这是方案 B 唯一的实质代价。

换来的是一条 Directus 给不了的机器化校验（新增 `tests/ielts_speaking_corpus.test.mjs`）：

1. 全部 `id` 唯一、ASCII kebab、非空。
2. `part` ∈ {1,2,3}；`cuePointsEn` **仅** Part 2 可有且非空。
3. `textEn` 非空、无中文字符；`glossZh` 可空但不可为空串。
4. 每个 `topic` 有 `labelEn`/`labelZh`/`sourceNote`，`questions` 非空。
5. 全语料禁词零命中（分数 / band / 评分 / 考官 / 录音 / AI / `估算` / `模考` …）。
6. **id 只增不改**：与上一版语料的 id 集合比对，删除或改名必须是显式操作（测试给出明确失败信息，提醒孤儿素材后果）。

第 6 条尤其重要——它把"改 id 会毁掉学习者素材"从一条人工须知变成一道自动关卡。

### 3.4 路由与渲染

新增两条路由，全在既有 `(shell)` 组内（《总纲》§6.1，不新建路由组）：

| 路由 | 文件 | 渲染 |
|---|---|---|
| `/ielts-lab/speaking` | `app/(ielts)/ielts-lab/(shell)/speaking/page.tsx` | 静态（题目浏览） |
| `/ielts-lab/speaking/[questionId]` | `.../speaking/[questionId]/page.tsx` | 静态 + `generateStaticParams`（五步流程） |

**五步不是五条路由**：横向步骤条常驻页顶、步骤为客户端状态，因为四、五两步依赖的全部内容都在 localStorage 里，服务端无从渲染，拆路由只会制造五个空壳。

方案 B 下 `generateStaticParams` 从静态文件读，构建产物**逐次可复现**；方案 A 下它依赖一次网络请求。

### 3.5 增量性声明（ADDITIVE ONLY）

| 对象 | 变更 |
|---|---|
| `lib/ielts/speaking-questions.json` · `speaking-corpus.ts` · `speaking-session.ts` | **新建** |
| `tests/ielts_speaking_corpus.test.mjs` | **新建** |
| 上表两条路由 + 组件 | **新建** |
| Directus 集合 / 字段 / 权限 / 角色 / 流程 | **零改动** |
| 既有路由 / 既有本地存储键 / `lib/ielts/*` 既有模块 | **零改动** |
| npm 依赖 / Tailwind 版本 / `next.config.ts` | **零改动** |

回滚 = 回滚这次提交，系统状态与批准前完全一致（方案 A 还需额外删两张集合）。

---

## 4. 逐项对比

| 维度 | A：Directus 集合 | B：静态语料包（推荐） |
|---|---|---|
| 改题目是否需要发版 | **否**（A 唯一实质优势） | 是 |
| 非工程人员可否直接编辑 | 可（后台表单） | 需改 JSON + 提 commit |
| 合规守护脚本覆盖 | **扫不到**，只能人工清单 | **全文自动扫描** |
| 机器化内容校验 | 无 | `test:lib` 六条断言，含 id 稳定性 |
| 构建确定性 | 依赖网络；抖动时模块整体消失 | 逐次可复现 |
| 运行时失败路径 | 需降级 + 空状态 + 日志 | 无（文件在包里） |
| 权限 / schema 变更 | 两张新集合，零权限变更 | 零 |
| 前端新增模块 | `lib/speaking-data.ts`（Directus 层） | `lib/ielts/speaking-corpus.ts`（纯函数） |
| 与 Reading 题库的一致性 | 不一致（Reading 是静态的） | **一致** |
| 与 Writing 的一致性 | 一致 | 不一致（Writing 有配图，必须走 Directus） |
| 组件层差异 | **无**——两方案的页面组件完全相同 | 同左 |
| 回滚成本 | 回滚代码 + 删两张集合 | 回滚代码 |

**Writing 走 Directus 是因为它有配图文件、有难度/时长/策略提示这类需要编辑反复调的元数据；Speaking 只有短文本。** 用同一个理由把 Speaking 也推进 Directus，是把一次性的架构决定当成了惯例。

---

## 5. 需要业主拍板的四点

1. **方案 A 还是方案 B**——本文推荐 **B**（理由见 §0、§4）。若业主预期上线后会**频繁**（月度以上）替换题目、且希望由非工程人员操作，选 A 是合理的，本文的 §2 可直接作为实施依据。
2. **v1 语料规模**——建议 20–30 个话题 / 200–350 张卡（Part 1 约 60%、Part 2 约 15%、Part 3 约 25%）。是否接受这个量级，或先以更小规模（如 8–10 话题）验证流程？
3. **Part 2 的 `cue_points_en` 是否在 v1 就有**——建议有（没有分条的 Part 2 卡不完整）。
4. **`gloss_zh` 是否在 v1 就有**——建议**部分有**：只给题干中出现生僻概念的题写释义，其余留空不显示占位。若业主要求全覆盖，录入工作量约翻倍。

字段名、枚举值、中文标签均可由业主直接修改。**本文获批后即为 T7 Phase B 的实施依据；未获批不写任何应用代码。**

---

## 6. 附：Phase B 已知的两个实现要点（不需批准，一并报备）

1. **`独立表达` 事件进不了现有时间线的现成通道。** `PracticeHistory` 的时间线完全由 `PracticeRecord`（`type: "reading"`）派生，而 `独立表达` 没有正确率、没有题目对照、没有用时统计。**不会**为它伪造一条 `PracticeRecord`——那会污染正确率均值、题型分析与错题本。做法是：时间线改为合并两个来源（既有 records + `stage.ielts.speaking` 里的完成事件），`PracticeRecord` 的形状与既有数据零改动（《总纲》§6.3 本地存储契约）。
2. **导出/导入覆盖 Speaking 全量素材**，沿用 `lib/ielts/history-io.ts` 的信封先例（`format` + `version` + 载荷），入口低调放在 Speaking 板块的设置角落（批次三 §6）。往返无损由 §5-T7 验收把关。
