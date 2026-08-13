# 工程待办

已知的、被暂时绕开的工程问题。每条写明:**当前如何绕开**、**绕开的代价**、
**修好之后哪些临时约束可以撤掉**。

存在的意义是防止"绕开"变成"默认":抽取规程里若有一条限制是为了迁就某个缺陷,
那条限制必须在这里有对应条目,否则它会以"规程就是这么写的"的形式永久化。

---

## B1 · 适配器不读 `is_current`,取数组首条

**现象**:`lib/program-v3/package-adapter.ts` 取 `application_requirements` 与
`audition_requirements` 时用的是 `.find(r => r.program_offering_ref === …)`,
完全不读 `is_current`。契约建模的是"一个专业可有多个招生周期、其中一个为当前",
渲染层却只认数组顺序。

**当前如何绕开**:抽取规程规定**一个专业当前只能有一条 application/audition
记录**(见 `docs/extraction/EXTRACTION_PROTOCOL.md` §3 R11 与 §5)。

**代价**:
- 历史周期数据无法入库 —— 想保留"去年截止日期是几号"就会踩到这个缺陷;
- 这是**渲染层缺陷倒逼数据层让步**,方向是反的;
- 新人读规程只会看到"只能有一条",不会知道原因,久而久之成为"设计"。

**修好之后**:抽取端可以正常携带多周期数据,规程 §3 R11 的那条临时约束应当删除。

**修法**:适配器改为优先取 `is_current === true` 的记录;若无,取最新
`admission_cycle`;仍无则回退首条并 `console.warn`。同时补一条测试:包内含
两个周期、`is_current` 在后一条时,渲染取的是后一条。

**发现于** 2026-08-10(Berklee 抽取时顺带发现,当时因每专业只有一条记录而无影响)。

---

## B2 · TOEFL 新计分制在页面上显示为个位数

**现象**:TOEFL 2026-01-21 改版后满分制不同,新制最低分是个位数(Berklee BM 为
`4`)。契约的 `toefl_minimum` 是单一数字,页面直接渲染成"TOEFL 4",对不了解改版的
读者显得离谱。

**当前如何绕开**:填新制值,旧制(72)写进 `conditional_notes`(裁决 2026-08-10)。

**代价**:页面上那个数字会被误读为"要求极低"。

**修法方向**(未定):渲染层识别新制分值区间并加注"(新制)",或在英语要求行旁
显示改版说明。需要产品决定呈现方式,不是纯技术问题。

---

## B3 · 专业制与乐器制的粒度不均

**现象**:Berklee 按专业组织(`performance` 是一个 field),音乐学院按乐器组织
(茱莉亚会有三十来个乐器 field)。同一个浏览页里两种体系的分组畸轻畸重。

**当前如何绕开**:不处理(裁决 2026-08-10,阶段三不动)。

**修法方向**(未定):需要产品层决定浏览页如何同时呈现两种粒度。归类层面无解,
见 `docs/contracts/field-classification-precedents.md` 末节。

---

## B4 · 研究生项目的 interview 被契约字段强制命名为 audition

**现象**: Berklee NYC 研究生项目官网要求 self-recorded interview,部分申请人再参加
招生团队的 live interview;官网没有将该流程称为 audition。v3 契约却强制每条
`program_offering` 提供 `audition_url`,且 `audition_requirements` 只有试音语义。

**当前如何绕开**:按运营者裁决,暂以官方面试页填入 `audition_url`,
`audition_required` 填 `Unknown`,并在记录 notes 中明确“本项目为面试制(interview)
非试音制,字段名为契约限制”。

**代价**:消费端可能把面试要求误显示为试音要求,也无法用现有字段准确表达
面试轮次、录制方式与入选后 live interview 的关系。

**修法方向**:契约增加独立的 interview requirement 结构与来源类型,并让适配器分别渲染
audition 与 interview;修复前不得把面试语义静默改写成试音语义。

**发现于** 2026-08-13(Berklee NYC 研究生抽取)。
