# 契约修订留档:stage_music_admissions_v3.schema.json(2026-08-08)

阶段一 Step 0(裁决:按渲染层实际形状如实修订,不新增业务字段、不改语义、不调层级;唯二例外 `status` / `last_checked`)。

## 修订依据

- **实测**:对 `data/v3/real/` 全部 20 个生产包(20 schools / 514 fields / 75 degree_levels / 1778 program_offerings / 1778 application_requirements / 1778 audition_requirements / 12782 source_records / 1778 publishing.programs)逐字段盘点类型与取值域。
- **渲染层**:`lib/program-v3/package-adapter.ts` 的 `CanonicalPackage` 接口 + `data/v3/types.ts` 的类型定义(FiveState / YesNoVariesUnknown / AuditionFormat / BadgeType / FreshnessStatus / CostSourceType / CostComponentV3 等枚举照搬,不自造词表)。

## 与旧契约的差异

| 项 | 旧契约 | 新契约 | 依据 |
|---|---|---|---|
| 顶层 school | 单数对象 `school` | 数组 `schools`(minItems=maxItems=1) | 20 包全部为数组;adapter 取 `pkg.schools[0]` |
| 顶层集合 | 缺 `fields`、`degree_levels`、`publishing` | 三者补齐为 required | 20 包全部具备;adapter 依赖三者 |
| 新增 | — | 顶层 `status`("draft"/"published")、`last_checked`(date) | OSS 迁移裁决批准的唯二新增 |
| admission_cycle | pattern `^\d{4}-\d{4}$` | 自由字符串 | 实测含 "Fall 2026" |
| workflow_status.review_status | const "unreviewed" | enum ["unreviewed","reviewed"] | 20 包实测全为 "reviewed"(T1b 翻转);新抽取默认 unreviewed |
| tuition_currency 等货币枚举 | 19 国货币白名单 | 自由字符串 | 实测仅 USD/null;白名单是旧契约发明,渲染层不校验 |
| english_language_tests | 6 值枚举 | 自由字符串数组 | 实测含 "Cambridge English"/"SAT…"/"ACT" 等枚举外值 |
| 行级 review_status / notes / _note 等约 30 列 | 旧契约未描述 | 全部纳入(additionalProperties:false 下必须穷举) | 实测存在 |
| publishing.programs[] | 未描述 | slug(pattern `^[a-z0-9][a-z0-9_-]*$`,实测含下划线如 `bass_trombone-ad`)、answer_sentence_zh、field_tiers(自由对象,实测 1778 条全为空对象、代码零消费)、cost_estimate_rmb、badges、freshness_flag | 实测 + types.ts |

> **field_tiers 使用约束(运营者裁决 2026-08-08)**:目前无任何消费方。阶段四如需使用,须先补数据、再把契约里的自由对象收紧为明确类型;不要仅因契约允许就随意写入。
| cost_estimate_rmb | 未描述 | 三态:null / 完整估价(min,max,currency,components,methodology_version)/ **免学费变体**(funding_policy,components,methodology_version,无 min/max/currency) | 免学费变体是实测发现:juilliard `voice-dma` 一条 |
| timeline_structured / repertoire_structured / conditional_notes_structured | 未描述 | timeline 有稳定结构(milestones[].label 必填,date/date_text/date_options/conditional/qualifier/status 可选);repertoire/conditional 结构多形,如实收为自由对象 | 实测 |

## 全量校验结果(ajv 2020-12,strict,allErrors)

- **20/20 包:唯一失败项是缺新增的顶层 `status` 与 `last_checked`**;为每包补上这两个字段后 **20/20 全部通过**。
- 除此之外零残差 —— 契约与 20 个包及渲染层完全同构。
- 旧包不入新库、不回填这两个字段,留在 `data/v3/real/` 原处不动。

## 依赖

本次引入 `ajv` + `ajv-formats`(dependencies):Step 0 校验即用,Step 1 的 `lib/contract/validate.ts` 与阶段二写入 API 是同一校验器,属计划内依赖。
