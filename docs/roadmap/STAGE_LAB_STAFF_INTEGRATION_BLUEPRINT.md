# IELTS Lab × Staff Platform 集成蓝图（E 轨 v1）

**日期：** 2026-08-02 · **性质：** 规划文档，不含代码，未动任何仓库
**基于实地审计：** `D:\STAGE FRONT`（客户站）与 `D:\stage-staff\stage-staff`（Staff 平台）只读检查，以下所有"现状"陈述均对照真实代码，非推断。
**上位文档：** `STAGE_BUSINESS_PLATFORM_BLUEPRINT.md`（B 轨 v2，事件词表纪律）、`STAGE_STAFF_PLATFORM_PLAN.md`（S 轨，页面上限与数据边界）。本文不推翻其中任何裁决。

---

## 1. 现状架构图（审计后的真实版本）

```
客户站 STAGE FRONT（Vercel）                Staff 平台 stage-staff（独立仓库/Vercel/Neon）
┌─────────────────────────────┐            ┌──────────────────────────────────┐
│ IELTS Lab（四科全部已上线）    │            │ POST /api/ingest（nodejs runtime） │
│  Reading  → vendored iframe  │            │  · 来源白名单 INGEST_ALLOWED_ORIGINS│
│  Listening→ 静态源+OSS 音频   │   ✗ 断链    │  · 限流 / payload 白名单校验        │
│  Writing  → 本地会话/草稿     │  （无任何   │ stage_staff.growth_events         │
│  Speaking → 本地会话/导出     │   埋点存在）→│  （append-only，enum 8 种事件）     │
│ 全部数据 localStorage 本地优先 │            │ v_events/visitors/funnel_weekly    │
│ lib/growth/ 不存在            │            │ v_weekly_report + 手工社群周录      │
└─────────────────────────────┘            │ 看板 4 页 + 录入表单（fixture 演示中）│
                                            └──────────────────────────────────┘
```

**头号事实：两边之间目前是断链。** B 轨的 B1（埋点+社群引导卡）从未实施——客户站没有访客 ID、没有 beacon、没有任何事件发出。Staff 侧的管道、校验、聚合、看板全部就绪但只有 fixture 数据。所以本蓝图的本质不是"打通四科"，而是**把从未落地的那一次客户站接入做对，并让它一次覆盖四科**。

**第二号事实：Staff 契约天生就是四科感知的。** `src/lib/events.ts` 的 `SECTION` 枚举 = `["listening","reading","writing","speaking"]`，`lab_first_practice`/`review_opened` 均携带该字段。管道不需要任何重建即可按科目聚合——缺的只是更细的三类事件（见 §6）。

## 2. Staff 平台审计（五问五答，均已核实）

1. **事件接收在哪：** `src/app/api/ingest/route.ts`（`runtime="nodejs"`、`force-dynamic`），唯一公网写路径；来源白名单 + 按 IP 固定窗口限流 + 载荷大小上限。
2. **事件 schema：** `src/lib/events.ts` —— 8 种事件（`lab_first_practice / lab_active_day / suite_complete / review_opened / community_card_shown / community_card_click / qr_page_view / visit`），每种有 payload 键白名单（slug/enum/int/route 四种字段类型），**刻意不存在自由文本字段**。
3. **存储表：** `stage_staff.growth_events`（append-only，`event_kind` 为 **PostgreSQL ENUM**，库级 CHECK 与应用契约互为冗余防线）+ `stage_staff.community_weekly_metrics`（手工周录）。含 `seeded` 标记列，fixture 可一键清除。
4. **Neon 查询方式：** 四个 SQL 视图 —— `v_events_weekly`、`v_visitors_weekly`、`v_funnel_weekly`（**按去重访客数计数，保证漏斗层层嵌套**，注释明言原始计数不得当漏斗读）、`v_weekly_report`（与手工社群数 FULL OUTER JOIN）。日级新鲜度，无实时。
5. **看板消费：** 4 页 + 表单全部 `force-dynamic` 直查视图；连接池 max 3；Directus 零凭据（内容页是纯跳转，S1b 裁决）。

**结论：S1/S1b/S2 的地基完全够用，一行不需要重建。**

## 3. 四科模块审计

| | Reading | Listening | Writing | Speaking |
|---|---|---|---|---|
| **用户流程** | 题库 → vendored iframe 做题 → STAGE 结果面板 → 复盘/错题本 | 静态源目录 → 题库 → 练习路由 → OSS 音频播放 → 交卷/复盘 | 任务列表 → 双栏写作（Hide Task/自动保存）→ 完成本次练习 | 五步流程（题目→想法→构建→巩固→独立表达）|
| **可用数据** | 正确率、题型、用时（`practice-records` v2.1.0） | 得分、set id（`listening-persist` 落 `stage.ielts.history`） | 字数、任务 id、完成时间（`stage.ielts.writing.*`） | 完成事件、维度覆盖（`stage.ielts.speaking`，可导出） |
| **存储位置** | 全部 localStorage，本地优先（既定架构，不是缺陷） | 同左 | 同左 | 同左 |
| **现有埋点** | **无** | **无** | **无** | **无** |
| **缺失埋点** | 模块曝光、开练、交卷（含正确率） | 同左（+可选放弃事件，见 §6 裁决） | 模块曝光、开练、完成（无评分维度，合规） | 模块曝光、开练、完成（无任何评分，合规） |
| **推荐接入点（全部在 UI 层）** | 交卷：宿主 chrome 处理 `PRACTICE_COMPLETE` 消息处（**iframe 内零改动**）；开练：进入 practice 路由 | 交卷：练习页交卷处理器（**`StaticListeningSource`/契约/runner/OSS 一概不碰**） | 「完成本次练习」处理器 | 「独立表达」完成处理器 |

## 4. 当前缺口（全部缺口，仅此四项）

1. 客户站零埋点（B1 未实施）——访客 ID、beacon 模块、事件发射全部不存在。
2. 事件词表缺三类通用事件：模块曝光、开练、交卷（现有 8 种覆盖的是获客漏斗与首练，不覆盖"哪科被用、哪套题热、成绩分布"）。
3. Staff 看板无 Lab 视图（现有 4 页面向增长漏斗与周报）。
4. `event_kind` 是 DB ENUM——加新事件需要一次谨慎的枚举迁移（§9 风险 1）。

## 5. 推荐的统一分析架构

**一句话：零新系统。** 四科 → 同一个 `lib/growth/` 发射器 → 同一个 `/api/ingest` → 同一张 `growth_events` 表 → 新增两三个 SQL 视图 → Staff 看板一个统一 Lab 视图。模块间差异全部表达为 **payload 里的 `section` 字段**，绝不表达为四套事件名、四张表或四个看板。

事件只从 UI/产品层发出（结果面板、交卷处理器、路由曝光），**禁止**进入数据适配器、`StaticListeningSource`、契约、评分逻辑。fire-and-forget（`sendBeacon` 优先）、静默失败、环境变量未设时整体 no-op——离线或 ingest 宕机时用户体验零影响。

## 6. 事件模型建议（词表 v2 = 现有 8 种原样保留 + 新增 3 种，共 11 种，仍在 ≤12 纪律内）

| 新事件 | payload（全部走现有字段类型白名单） | 回答的业务问题 |
|---|---|---|
| `lab_module_view` | `{ section }` | 有多少人进 Lab、四科各被多少人用（去重访客口径） |
| `lab_practice_start` | `{ section, contentId: slug≤48 }` | 多少人开练、哪些内容被选 |
| `lab_practice_submit` | `{ section, contentId, questionCount?: int, accuracyPct?: int 0–100 }` | 完成率、内容热度、成绩分布 |

**裁决与否决：**
- **不采用按科目展开的事件名**（`reading_view`×4 等 16 个名字）——`section` 维度已存在于契约，名字爆炸只会让 ENUM 迁移和视图翻倍。提示词中的候选模型按此收敛。
- `accuracyPct` 是**原始正确率整数**，Writing/Speaking 不携带（合规：Speaking 无任何评分；全平台 C1 裁决——永不换算成 Band 刻度，看板同样禁止）。
- **`listening_abandon`、`listening_audio_loaded`：v1 不加。** 放弃率可由 start−submit 差值近似；音频加载属于工程监控不属于商业数据。符合"不加不必要事件"。
- 隐私红线不变：payload 无自由文本、无 PII，`contentId` 是题目 slug；访客 ID 为随机不透明串。
- 与现有事件的关系：`lab_first_practice`（首练）、`lab_active_day`、`suite_complete`、`review_opened` 原样保留，新事件不替代它们；`visit` 仍主要由 Vercel Analytics 承担。

## 7. 看板集成建议

- **新增一个统一「IELTS Lab」页**（S 计划 ≤5 页上限内的第 5 页，且是唯一的 Lab 视图——明确否决任何单科看板）：四科使用对比（周去重访客）、每科 曝光→开练→交卷 小漏斗、Top 内容（按 `contentId` 计数，标题在看板里用 slug 展示即可，不回连 Directus）、正确率分布直方图（Reading/Listening）。
- **总览页加一张摘要卡**：本周 Lab 活跃访客 + 四科占比一行。
- **周报生成器加一个 Lab 段落**：四个数字（Lab 周活跃、最热科目、开练数、完成数），自动拼装进现有模板。
- 支撑上述内容新增 2–3 个 SQL 视图（`v_lab_modules_weekly`、`v_lab_content_top`、`v_lab_accuracy_dist`），沿用现有"去重访客嵌套"口径注释纪律。

## 8. 实施阶段（沿用既定的分会话执行模式）

| 阶段 | 内容 | 仓库 | 前置 | 推理强度 |
|---|---|---|---|---|
| **E0 批准** | 本蓝图 + 词表 v2 冻结 + 一个业主决策：E2 是否与 B1 的社群引导卡合并为对客户仓库的**一次性**改动（推荐合并，少碰一次仓库） | 无 | 业主 | — |
| **E1 Staff 侧扩容** | `events.ts` 词表 v2 + `event_kind` 枚举迁移（§9 风险 1）+ 新视图 + Lab 页/总览卡/周报段 + fixture 扩展 + 测试 | stage-staff | E0 | **HIGH**（含 DB 迁移与契约变更；其余页面装配为 MEDIUM，按包内最高计） |
| **E2 客户站接入** | `lib/growth/` 发射器（访客 ID + sendBeacon + no-op 保护）+ 四科 UI 层各 2–3 个发射点 +（若合并）B1 社群引导卡 | STAGE FRONT | E0 + 业主对客户仓库的既定批准闸门 | **MEDIUM**（代码量小，纪律要求高：guard 必须绿、保留清单不可触碰） |
| **E3 验证与切真** | 端到端验证（本地 mock + 生产灰跑）→ `db:unseed` 清 fixture → 第一份含 Lab 段落的真实周报 | 两侧只读 | E1+E2 上线 | **LOW** |

E1 可立即并行于客户站的任何在途工作（独立仓库）；E2 是唯一触碰客户仓库的环节，沿用 B1 的原有闸门。

## 9. 风险

1. **ENUM 迁移的事务性**（最实际的一个）：`migrate.mjs` 把整个 schema 包在 BEGIN/COMMIT 里，而 `ALTER TYPE … ADD VALUE` 对事务有版本敏感的限制（新值同事务内不可用）。E1 必须显式处理：要么把枚举扩展放在事务外的独立幂等步骤，要么评估把 `kind` 改为 TEXT+CHECK（同样保留库级防线）。这是 E1 定为 HIGH 的主因。
2. **fixture 污染真实周报**：Lab 视图上线时库里还有演示数据——E3 的 unseed 必须发生在第一份真实周报之前（`seeded` 标记保证只删假数据）。
3. **口径错误比断链更糟**：模块漏斗必须沿用 `v_funnel_weekly` 的去重访客嵌套口径，否则"开练数>曝光数"这类不自洽数字会毁掉周报可信度。
4. **发射点越界**：Listening 的诱惑是把事件放进 source/adapter（那里最"方便"）——被 §5 明令禁止，E2 验收需逐点核对发射位置在 UI 层。
5. **双计**：`lab_module_view` 按页面进入发射即可，看板一律用去重访客口径消化重复；不在客户端做复杂去重逻辑（保持 ≤50 行纪律）。
6. **来源白名单**：`INGEST_ALLOWED_ORIGINS` 目前未指向真实客户域名，E2 上线前必须配置，否则事件全部 403——这是个一分钟的配置项，但漏了会表现为"埋点全无数据"的假故障。

## 10. 明确不碰清单

- Staff 侧：不重建 ingest/表/视图/看板架构；不加用户表（visitor_id 无 join 目标是设计特性）；不接 Directus（内容页保持纯跳转，零凭据）。
- 客户站：不改 Listening 的 `StaticListeningSource`/契约/runner/评分/OSS 架构；不改 Reading 的 vendored iframe；不改任何 `stage.*` 本地存储契约与本地优先架构；不加作文云存储、不加 AI 评估；Speaking 五禁（录音/麦克风/AI 考官/打分/Band 预测）继续有效。
- 全局：不建独立分析系统；不做单科看板；不做逐点击遥测/会话回放；不采集 PII；正确率永不换算 Band（C1）；guard 全绿是 E2 的硬验收。
