# T7 移交与评审交接 —— 院校与专业浏览页

**状态**:**已结项**(2026-08-05)。Codex 评审已通过;此后按五条人类裁决
(T7-R6…R8 与两条「确认接受」)做的收尾**无新增逻辑**,人类判定不再复评。
**日期**:2026-08-05
**声称矩阵**:`T7_CLAIMS_MATRIX.md`(主表 34 条 + 人工验证项 6 条)

---

## 1. 这个 ticket 做了什么

`/schools` 与 `/schools/{school-slug}/{program-slug}` 现在是**同一张四层浏览页**:
顶部提示句 → 学校 tab 行 → 专业小卡条 → 大信息卡。两个 URL 渲染完全相同的 DOM
(全部学校的小卡条、全部专业的大卡),params 只决定哪一张先可见。

大卡保留蓝图 §2.1 的全部块,取值全部来自 T3 已钉死的纯函数 —— **T3 的业务逻辑
一行未改**,凭证是 T3/T4/T5 原有测试一条未动、全部仍绿。

---

## 2. 本轮人类裁决(共 8 条)

前 5 条在实现开始前拍板,后 3 条在交付确认时拍板。

| 编号 | 冲突 / 问题 | 裁决 |
|---|---|---|
| T7-R1 | `/schools/{s}/{p}` 已是 T3b 的 §2.2 详情页 | 浏览页接管该 URL,详情页降级为同页大卡 |
| T7-R2 | `/schools` 已是现有 Directus 探索页 | 整页替换 |
| T7-R3 | T7 的大卡缺 §2.1 的编辑观点/截止角标与 T4 引用块;详细要求又是详情页表格的形状 | 保 §2.1 全部块,详细要求用 label-value 表 |
| T7-R4 | T7 要求未知 slug「不报错」,现路由是 404 | 服务端保 404,客户端才回退 |
| T7-R5 | 三个导航/页脚项在仓库里没有路由 | 渲染成纯文字,不给 href |
| T7-R6 | 提示句承诺「可溯源至官网」,但四个溯源模块没有生产入口 | **改为「每条信息标注官网核实时间」**,承诺收窄到能兑现的程度(见待办 1) |
| T7-R7 | 「申请截止日期」在同一张卡上出现两次 | 删掉详细要求表里那行;**只在 T7 卡上过滤,共享定义不动** |
| T7-R8 | 两处实现期补齐的 token(桌面端左右 padding 24px、小卡 `box-sizing`) | 追认,纳入冻结 token 集,标注「实现期补齐」 |

---

## 3. 待办(交给后续 ticket,不是 T7 的遗留 bug)

### 待办 1 —— 恢复四个模块的生产入口,然后改回提示句

裁决 T7-R1 把 §2.2 详情页折进了同页大卡,代价是这四个模块失去了生产入口:

| 模块 | §2.2 编号 | 组件(仍在仓库里) | 现状 |
|---|---|---|---|
| 曲目/作品集细则 | 模块 3 | `components/program/v3/RepertoireSection.tsx` | 曲目正文已在大卡的详细要求表里印全文;`video_requirements` 等分项也在。**细则模块本身**无入口 |
| **原文证据(`source_quote`)** | 模块 4 | `components/program/v3/SourceEvidenceList.tsx` | **无入口** —— 四条里最要紧的一条 |
| 特殊条件 | 模块 5 | `components/program/v3/SpecialConditionsSection.tsx` | 条件说明已在大卡底部逐条呈现;独立模块无入口 |
| 相关专业 | 模块 6 | `components/program/v3/RelatedProgramsSection.tsx` | 无入口(同校专业已由小卡条覆盖,但 `related_program_refs` 的语义不等于同校) |

`ProgramDetailV3` 本体也还在,目前只挂在 `/v3-preview`(dev-only)。

**恢复之后**,`browseLede()`(`lib/schools-browse/model.ts`)结尾可以改回
「每条信息可溯源至官网」。两处需要同步:该函数的字符串与它上方的注释,以及
`tests/t7_schools_browse.test.mjs` 里 `t7:model —「提示句不承诺溯源…」` 那条用例
—— 那条用例存在的意义就是不让这句话在模块恢复之前悄悄改回去。

### 待办 2 —— 三个导航/页脚项的目标页

`申请日历`、`数据来源说明`、`更新频率` 现在是纯文字(裁决 T7-R5)。对应页面建好后,
把 `SchoolsBrowse.tsx` 里的 `<span>` 换成 `<a href>`;`t7:dom —「外壳:导航当前项、
无路由的项渲染成纯文字…」` 那条用例会立刻变红,提醒同步改断言。

### 待办 3 —— `(explore)` 布局的 `MobileBottomNav`

移动端会与 T7 自带页脚同时出现。改布局会动到其他页面,按 ticket 的「不改其他页面」
留在原处。

### 待办 4 —— 数据铺开

真实数据只有 1 所学校,tab 行只有一个 tab。多校联动由测试里合成的第二所学校覆盖
(`twoSchools()` / `withSecondSchool()`),生产数据里尚无第二所可看。属数据铺开
范围,不是 T7 的问题。

---

## 4. 给评审者的三个着力点

1. **反 cloaking 是这个 ticket 的硬红线**,也是最值得攻击的地方。断言在
   `tests/dom/schools-browse.dom.test.tsx` 的 `t7:dom — 反 cloaking` 组,全部走
   `renderToStaticMarkup`;人工 curl 结果在矩阵人工项 H3。攻击角度:有没有哪条
   数据只有在选中时才进 DOM?`hidden` 之外还有没有别的弱化?
2. **「T3 逻辑一行未改」这句话是否成立**。唯一动过 T3 文件的两处:
   `RequirementsTable` 改调 `lib/program-v3/requirement-rows.ts`(整段原样搬出),
   `CompareToggleButton` 加了 `className` 样式接缝与 `data-active`。两者都由 T3
   原有测试全绿背书,但值得逐行核对搬运是否真的等价。
3. **裁决 T7-R7 的过滤范围**。`BrowseProgramCard` 过滤掉「申请截止日期」行时依赖
   一个不变量:该行与三数字块的截止格子都由
   `formatDateZh(application.application_deadline)` 决定,所以不存在「行被删了、
   格子也没有」的空档。这个不变量写在过滤处的注释里 —— 请核对它是否真的成立。
