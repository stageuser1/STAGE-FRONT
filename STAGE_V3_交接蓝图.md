# STAGE / 先留学 · 信息资产系统 V3 交接蓝图

> 本文档是四轮评审(认知/工程/压力/社会)的最终收束,所有决策已冻结。
> 交给实现会话时的铁律:**只实现,不重开设计讨论**。发现文档内部矛盾时报告人类拍板,不得自行裁决。

---

## 0. 总架构:一源四投影

```
Directus(后台内容源 / 审核 / 溯源,运行时零依赖)
        ↓
Canonical JSON 包(stage_music_admissions_v3,一校一包)
        ↓ Mode F 发布管线(只消费 review_status=reviewed 的包)
派生/发布层(publishing 块)
        ↓ 静态构建(SSG)
四投影:Web Card+详情页 / Share Card / SEO+聚合页 / AI-ready 层
        ↓
CDN(Vercel / OSS)
```

核心原则(违反任何一条 = 实现被拒收):
1. **一源四投影**:四层共享同一份数据,任何一层不得发明新事实
2. **宁缺毋假**:canonical 里不存在的数字,任何投影都不得显示。缺失 → 降级隐藏,不是编造
3. **事实与判断分开**:编辑观点单独存放、显式标注,永不进入 answer_sentence 和 JSON-LD
4. **反 cloaking 红线**:页面上不存在"人为 CSS 弱化/隐藏的可见文本"。machine-only 仅指 JSON-LD 与 metadata。折叠内容必须真实存在于服务端渲染的 DOM 中(CSS 折叠,非点击后请求)
5. **静态优先**:公开页面构建时生成,用户访问不查 Directus
6. **中文决策优先**:中文名为主,英文名为次(茱莉亚音乐学院 / The Juilliard School)

---

## 1. Schema V3(冻结)

### 1.1 Canonical 事实层(提取 agent 写,v2 全部规则保持)

在现有 v2 collections 上新增:

**schools**
| 字段 | 类型 | 说明 |
|---|---|---|
| name_zh | string | 中文校名,人工审核后入库,非机翻直出 |
| country_code | string(2) | ISO 3166-1 alpha-2 |
| region | string, nullable | 州/省 |
| city | string | 英文城市名,与 city_costs.city 严格�配配 |
| institution_type | enum, nullable | Conservatory \| University School of Music \| Art University \| Other |
| languages_of_instruction | string[] | ISO 639-1 |

**program_offerings**
| 字段 | 类型 | 说明 |
|---|---|---|
| degree_system | enum, nullable | US \| UK \| Bologna \| German_Diplom \| Other |
| instruction_language | string, nullable | 覆盖学校级默认值 |
| tuition_currency | string(3), nullable | ISO 4217 |
| tuition_amount_min / max | number, nullable | 数字,非字符串 |
| tuition_period | enum, nullable | per_year \| per_semester \| total_program |

约束:tuition 三元组要么全空,要么 currency + period 必填。

**application_requirements(或学校级)**
- `estimated_living_cost`(nullable):仅当官方 Cost of Attendance 存在时提取,必须有 source_records 背书。官方数据优先级高于 city_costs 配置表。

**fields / degree_levels 受控词表**
- 补 `label_zh`(一次维护,全库复用)

**source_records**
- 每条必有 `retrieved_at`(ISO 日期)。页面"数据更新时间" = 关联 source_records 的 max(retrieved_at),渲染时计算,不落库。

沿用 v2 全部提取纪律:五态区分(null/Not Required/Optional/Required/conditional)、不合并学位层级、不编造数字、conditional_notes 单独存放、词表不匹配时置 null + review note。

### 1.2 配置层(人工维护)

**city_costs**(首批约 15 城)
| 字段 | 类型 | 必填 |
|---|---|---|
| city | string(50) | 是,与 schools.city 严格匹配 |
| country_code | string(2) | 是,重名消歧 |
| cost_living_min / max | integer (USD/年) | 是 |
| source | string(200) | 是 |
| updated_at | timestamp | 是 |

**badge_rules**(初始 3 条)
| 字段 | 类型 | 说明 |
|---|---|---|
| rule_name | string(50) | 唯一标识 |
| condition_field | string(50) | 事实字段路径 |
| condition_value | string(50) | 触发值 |
| operator | enum | eq \| contains \| not_eq |
| output_label | string(20) | 中文标签 |
| priority | int(1-5) | 1 最高 |
| badge_type | enum | success \| warning \| info |

初始规则:① 试音形式=纯视频 → 「免现场试音」/「预筛可视频提交」;② 英语要求=Not Required → 「免语言成绩」;③ 申请费=0 → 「免申请费」。标签只标例外(免/可),不标常态(需要)。

**fx_snapshot**(月度一行)
- base=USD, target=CNY, rate (decimal 6,4), snapshot_date

**share_card_metric_rules**
- 分享卡 3 指标选取优先级:语言要求 > 预筛/试音 > 截止日期 > 总费用。字段缺失按序补位,永不超过 3 个。

### 1.3 编辑层(新增 collection,人工撰写,可整体为空)

**editorial_notes**
| 字段 | 说明 |
|---|---|
| program_offering_ref / school_ref | 二选一 |
| short_positioning | 一句定位,≤20 字 |
| key_difficulty | 主要难点,≤30 字,可空 |
| author, written_at | |

约束:所有投影中必须带「编辑观点」前缀标识;为空则该行不渲染;**永不进入 answer_sentence 和 JSON-LD**。

### 1.4 派生/发布层(Mode F 生成)

**publishing.programs[]**
| 字段 | 说明 |
|---|---|
| answer_sentence_zh | 可见导语,正常渲染,禁止 CSS 隐藏。生成失败 → 前端隐藏该行,无占位符 |
| slug | 生成即冻结,永不变更(改名走 redirect) |
| field_tiers | 默认全局配置,个别覆盖,通常为空对象 |

answer_sentence 中文模板:
```
[学校中文名]的[专业中文名][学位]项目,[语言要求],[预筛/试音/作品集要求],
[申请季]的申请截止日期为[日期],一年总费用约[RMB区间]。
```
硬校验:句中出现的每一个数字必须能在 canonical(或 cost_estimate 派生结果)中找到,否则生成失败。语言要求存在豁免/条件时不得简化为绝对结论。不加营销形容词。

**cost_estimate_rmb**
```json
{
  "min": 550000, "max": 660000, "currency": "CNY",
  "components": [
    {"item": "tuition", "value": 53300, "source_type": "official"},
    {"item": "living_cost", "value_min": 28000, "value_max": 35000, "source_type": "config_estimate"}
  ],
  "fx_rate": 7.12, "fx_snapshot_date": "2026-07-01",
  "methodology_version": "v3"
}
```
规则:
- source_type ∈ official | config_estimate。生活费来自 city_costs 时,前端小字**强制**追加「生活费为第三方估算,非院校官方数据」
- 官方 CoA 存在 → 用官方数,source_type=official
- city_costs 或 fx 缺失 → 整块降级为只显示原币种学费,不强拼人民币
- 汇率不做波动监控,只标注月份 + 免责语「按 YYYY-MM 月均汇率估算,实际以缴费时点为准」

**badges[]**
- 全量有序数组(按 priority 排序),`{label, type, priority}`
- UI 端按 max_display=2 截断(slice,前端一行代码);聚合页与 AI 层消费全量
- 无命中 → 空数组,前端整行不渲染
- 不拆分为 badges_all/badges_display 双字段(已否决)

**freshness_flag**
```
status: current_season | outdated_season | changed | unknown
last_verified: date
days_since_update: int(仅内部参考,不参与状态判定)
```
判定逻辑(与天数无关):
- 本申请季内校验过 且 diff 未检测到官网变更 → current_season(绿)
- 数据来自上一申请季 → outdated_season(黄)
- diff 管线检测到官网页面变更、待重提取 → changed(红)
- 无法确定 → unknown
注意:**申请是否截止不属于 freshness**。截止判断是前端用 now() vs deadline 的纯计算(见渲染手册 §3.4)。

**share_card_payload**
- `{name_zh, name_en, program_zh, degree_abbr, metrics[≤3], verified_stamp, qr_url}`
- 由 share_card_metric_rules 计算,渲染为品牌模板图

### 1.5 Tier 四档

| tier | 归属 |
|---|---|
| glance | 3 秒区:校名/定位、截止日、总费用、试音形式、状态角标 |
| expand | 折叠区:材料清单、曲目要求、英语要求(含条件) |
| machine-only | 仅 JSON-LD 与 metadata,**不存在隐藏可见文本** |
| internal-only | confidence、review_notes 等,不出现在任何公开投影 |

### 1.6 工作流规则

- 提取 agent(Mode A/B)禁止写 publishing 块与 editorial_notes
- Mode F 只消费 review_status=reviewed 的包
- 提取者不自评(v2 规则保持):评审由不同模型家族/独立会话执行

---

## 2. 四投影渲染蓝图

### 2.1 投影一:Web Card(已有定稿视觉,V3 mockup 为验收标准)

纵向结构(自上而下,顺序冻结):
1. answer_sentence_zh 导语(灰色小字,正常可见)
2. 中文校名 · 专业(主)/ 英文名 · 学位 · 城市(次,muted)+ 右上截止角标
3. 编辑观点行(有则显示,带「编辑观点」标识)
4. 金标签行(badges 前 2 个,空则整行不渲染)
5. 三数字块:申请截止 / 年总费用¥区间(含构成与免责小字)/ 试音形式
6. **申请材料与试音要求(折叠区,DOM 真实存在)**:材料 checklist(动态渲染)、曲目要求(JS 80 字截断 + 完整要求链接)、英语要求(含条件说明)
7. 状态条(freshness 旗 + 来源域名)+ 动作按钮(订阅截止日 .ics / 加入对比)

语义化要求:`<article>`,字段用 `<dl><dt><dd>` 或表格,服务端渲染全量 DOM。

### 2.2 投影二:详情页(3 分钟层)

模块顺序:导语 → 完整要求表 → 曲目/作品集细则(pre-wrap)→ 原文证据(source_quote 可展开)→ 特殊条件 → 相关专业 → 对比/收藏入口。URL 问题式:`/schools/{slug}/{program-slug}`。

### 2.3 投影三:Share Card(品牌资产,非网页截图)

- 尺寸 3:4,导出为图片;品牌色:深蓝 #0A1F4D 底、白色主文字、浅蓝 #C2D6F8 辅助、暖金 #F4C870 仅一处重点(截止日期)
- 内容:品牌行(先留学 · 不鸽,只先到)→ 中文校名(大)→ 专业+学位 → ≤3 指标 → 核实戳 + 域名 + 二维码
- 禁止:学校介绍、排名、校友、多图、>3 指标、无来源的"难度星级"
- 同一图片服务同时产出 OG image(横版变体);微信内配 JS-SDK 分享

### 2.4 投影四:AI-ready 层

- JSON-LD:EducationalOrganization(学校)+ EducationalOccupationalProgram(专业),字段从 canonical 自动映射
- 每页引用块:answer_sentence + 来源 + 核实时间(可见,固定位置)
- robots.txt 放行 GPTBot/ClaudeBot/PerplexityBot 等;根目录 llms.txt 描述站点结构
- sitemap lastmod 接 max(retrieved_at)

### 2.5 聚合清单页(SEO/GEO 程序化页面)

- 由 badges 全量数组 + 截止月份等维度自动生成:如 /可视频试音的美国音乐学院、/免语言成绩的音乐学院、/12月截止的音乐专业
- 结构:一句总结句(带日期与数量,如"截至 2026 年 8 月,美国有 X 所…")+ 卡片列表
- **准入门槛:命中学校 ≥ 3 所才生成**,防低质重复页
- 三模型交火评审对象:页面模板、总结句生成规则、URL 与内链结构

---

## 3. 渲染手册(空值 / 边缘态,前端验收标准)

### 3.1 缺失降级总则
- 字段为 null → 该行/该块**不渲染**。禁止显示"暂无""不需要""N/A"占位
- null ≠ 不要求。只有明确 Not Required 才可显示「无需」类措辞或点亮金标签
- 降级词表:「不适用」(该字段对此项目无意义)、「已过期,查看下季」(上季数据)

### 3.2 条件字段
- conditional_notes 与基础值合并展示但不混淆:如「TOEFL 89 · 仅国际生,豁免细则见官网来源(链接)」。官网写了豁免条件则必须已被提取;没写则链接指向来源页,不自行编写豁免规则

### 3.3 长文本
- 曲目要求:JS 按字符截断(常量 80 字)+「完整要求」链接,禁止纯 CSS 截断(截断位置需跨设备一致)
- 展开区:white-space: pre-wrap,最大高度 200px + 内滚动

### 3.4 时间态
- 截止角标三态(前端 now() 计算,与 freshness 无关):开放中 / 距截止 N 天 / 「本季已截止,查看下季」(置灰)
- freshness 旗按 §1.4 状态机渲染:绿「官网核实 · YYYY 申请季 · 未检测到变更」/ 黄 / 红「官网内容有变更,信息更新中」

### 3.5 动态列表
- 材料清单严格数据驱动,零硬编码;数量后缀(推荐信 ×2)从字段渲染;列表为空 → 整行不渲染

### 3.6 费用块
- 三种形态:① 官方 CoA + 汇率齐全 → ¥区间 + 构成小字;② 仅 city_costs → ¥区间 + 「生活费为第三方估算」;③ 均缺 → 原币种学费。均带汇率月份免责语(形态①②)

---

## 4. 会话分工与评审协议

角色功能化,模型可按可用性轮换,但**同一 ticket 的评审者必须是不同模型家族或至少独立会话,不接受实现者自评**。

| Ticket | 实现 | 评审 |
|---|---|---|
| T1 数据字典落库:migration + validation 更新 + 存量包迁移(补空 publishing、版本号 v3) | 会话 A | 会话 B(不同模型家族,核对 migration ↔ 本文档 §1 一致性) |
| T2 Mode F 发布脚本(answer_sentence 生成+数字校验、cost/badges/freshness 计算) | 会话 A | 会话 B(重点:数字可溯、降级路径全覆盖) |
| T3 Web Card + 详情页组件 | 会话 C | 会话 D(验收标准 = V3 mockup + §3 手册逐条) |
| T4 JSON-LD 注入器 + llms.txt + robots + sitemap | 会话 C | Rich Results Test + 会话 D 抽查 |
| T5 Share Card / OG 图片服务 + 微信 JS-SDK | 会话 C | 人工目检(品牌判断不外包) |
| T6 SEO 聚合清单页 | 三模型交火:一实现、一评审、一红队(专攻低质页/内链/重复内容风险) | |

人类保留拍板项:city_costs 生活费区间来源、editorial_notes 撰写、聚合页维度选择、任何 schema 变更请求(原则上拒绝,本文档已冻结)。

## 5. 验收清单(上线前逐条)

- [ ] 茱莉亚示例包走通 提取→评审→Mode F→四投影 全链路
- [ ] 随机 10 页:View Source 确认折叠内容在 DOM;无任何隐藏可见文本
- [ ] Rich Results Test 通过;curl 模拟 GPTBot UA 可取全文
- [ ] null 字段页面无占位符泄漏;截止已过的项目角标置灰
- [ ] 费用块三形态各找一个真实案例验证
- [ ] 分享卡缩略图状态下校名与截止日可读
- [ ] 聚合页均 ≥3 校;无空壳页进 sitemap
- [ ] AI 引用基线:20 个目标问题 × (ChatGPT/Perplexity/Kimi/豆包/元宝) 记录当前提及率,存档为月度对照基线
