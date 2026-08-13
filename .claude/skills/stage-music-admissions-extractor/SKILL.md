---
name: stage-music-admissions-extractor
description: STAGE 院校招生数据抽取规程。当需要把某所音乐/艺术院校的官网招生信息抽取成结构化数据并入库时使用——包括「抽取某某学校」「把这所学校加进库」「处理这所院校」「更新某校招生数据」「核实某校专业清单」,以及对已抽取数据做交叉核对或修正。也用于回答本项目的抽取纪律、契约形状、词表机制、draft/publish 流程相关问题。Make sure to use this skill whenever a university's admissions pages are being turned into STAGE data, even if the user does not name the skill.
---

# STAGE 院校招生数据抽取规程

**本 skill 只做触发与指路,内容正本在仓库里。**

## 立刻做这件事

读 `docs/extraction/EXTRACTION_PROTOCOL.md` 全文,然后照它执行。

配套文档(正本会引用,按需读):

| 文档 | 何时读 |
|---|---|
| `docs/style/CONTENT_STYLE.md` | 写中文译名或面向用户的文案时 |
| `docs/contracts/field-classification-precedents.md` | 定 `field_category` 时 |
| `docs/roadmap/ENGINEERING_BACKLOG.md` | 遇到规程里标着"临时约束"的限制时 |
| `CLAUDE.md` | 全项目固定工作约定 |

## 为什么正本不在这里

内容只存一份。若 skill 与 `docs/` 各存一份全文,两者必然漂移,而"两个真相源悄悄
不一致"正是本项目反复踩过的坑(契约 vs 已失准的 Python 校验器、跨校词表 vs 包内
`fields`)。同时,交叉核对由**另一个模型家族的会话**执行,那些工具不读 Claude Code
的 skill —— 正本放在仓库里,任何 agent 都能被指向同一份文件。

## 五条最容易被跳过的(细节见正本)

1. **终点是 draft。** 不自评 `Verified`、不翻 `review_status`、`publish` 永远是
   运营者本人的动作。
2. **四个硬停点必须停**:抽取计划 ✋ → Mode A 专业索引 ✋ → 预览报告 ✋ →
   运营者 publish ✋。沉默不是同意。
3. **"多条记录看起来该相同"是必须停下核实的时刻,不是可以省事的时刻。** 本项目最贵
   的一次事故就发生在这里(15 个专业套同一份模板,漏掉了整个申报门槛维度,影响
   11/15 个专业)。
4. **运营者说"发布"时,默认动作是把命令回给他,不是代他执行。** 且"发布"二字
   **不等于**"已复核" —— 复核要有他的显式确认语。见正本 §1.4。
5. **改任何 `field_ref` 时同步改词表**(含只是更正拼写)。这道闸门已被两个不同
   执行者各撞过一次 422。

## 取代关系

本 skill 取代插件市场版的 `stage-music-admissions-extractor`。那一版面向
`stage_music_admissions_v2` 契约与 Directus / Obsidian 产出,两者均已退场;现行为
修订版 v3 契约 + OSS 写入 API + draft/publish 分离。**冲突时以
`docs/extraction/EXTRACTION_PROTOCOL.md` 为准。**
