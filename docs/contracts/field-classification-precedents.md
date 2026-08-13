# `field_category` 归类先例

契约 `data/contract/stage_music_admissions_v3.schema.json` 的 `field_category` 枚举。
本文件记录**判断题的判法与理由**,给后续学校的同类归类当先例 —— 目的是让不同学校的
同类专业落进同一个类目,而不是各凭当时的直觉。

新增一个类目前先读这里;若新专业与某条先例同类,照先例走,不要另起炉灶。

## 枚举现状(2026-08-10)

原有 8 值(古典/爵士演奏体系):`Music Performance`、`Composition/Theory`、`Conducting`、
`Chamber Music`、`Music Education`、`Jazz Studies`、`Musicology`、`Musical Theatre`

2026-08-10 新增 6 值(现代音乐院校):`Music Production/Technology`、`Screen Scoring`、
`Music Business`、`Music Therapy`、`Songwriting`、`Interdisciplinary`

扩充起因:Berklee 的 15 个 BM 专业里,音乐商业、制作工程、音乐治疗、影视/游戏配乐、
词曲创作等一个都套不进原有 8 值。**硬塞进最接近的类目就是造假**,所以扩枚举。

## 原则

**分类跟着实际专业走,不跟着理想分类法走。** 先看有哪些真实专业,再决定需要哪些类目;
不要先设计一套漂亮的分类体系再往里塞。

## 先例

### P1 · 制作/工程类不细分

**判法**:`Music Production/Technology` 一个类目,涵盖录音、制作、电子音乐设计、
音频工程。

**理由**:Berklee 有三个此类专业(Electronic Production and Design、Independent
Recording and Production、Music Production and Engineering),本质都是制作/工程手艺。
拆成"技术"与"制作"会造出几个只有一名成员的类目,对浏览页分组毫无好处。
**类目要为分组服务,不是为分类学服务。**

### P2 · 影视与游戏配乐同类

**判法**:Film and Media Scoring、Game and Interactive Media Scoring 同归 `Screen Scoring`。

**理由**:两者的手艺(为动态影像配乐、与画面同步)相同,媒介差异不构成分组差异。
后续遇到 "Scoring for Visual Media"、"Media Composition" 之类一并归此。

### P3 · 体裁优先于职能(爵士作曲归 Jazz Studies)

**判法**:Jazz Composition 归 `Jazz Studies`,不归 `Composition/Theory`。

**理由**:选爵士作曲的人是先认同爵士这个体裁、再选择作曲这个职能。与 Global Jazz
Performance 同组,对使用者更有用。**判断题**,反向也说得通;后续所有 "Jazz X" 专业
一律照此归 `Jazz Studies`,以保持一致。

### P4 · 写作+制作的混合专业归 Composition/Theory

**判法**:Contemporary Writing and Production 归 `Composition/Theory`,不归
`Music Production/Technology`。

**理由**:该专业的核心是写作与编配,制作是其载体。**判断题**,归制作类也说得通。
后续遇到名字里同时出现 writing/composition 与 production 的专业,以**谁是核心手艺**
为准:写作为核心归 Composition/Theory,录音棚工艺为核心归 Music Production/Technology。

### P5 · `professional_music`：音乐+创意产业/媒介的融合型学位

**判法**:`professional_music` / `Interdisciplinary` 用于官方谱系明确属于音乐与创意产业/媒介融合的本科专业；不用于标准音乐系谱系的 BA in Music。

**理由**:这类学位的官方谱系不是纯音乐系,核心是把音乐与创意产业、影视/游戏、流行音乐
或其他媒介实践结合；并入 `Music Performance` 或 `Musicology` 都会误导使用者。当前成员
为 Berklee Professional Music、HKBU BMus Creative Industries、EdUHK JS8685，以及 HKMU
BA(Hons) in New Music and Interactive Entertainment。
判断看官方学位谱系,不看课程内容占比或名称表面相似。此前 Berklee Professional Music
的自主设计特征仍是其自身成员理由,不是该值的唯一适用条件。

### P5a · 综合大学音乐教育学位归 Music Education

**判法**:官方学位谱系含 Bachelor of Education (Music) / 音乐教育学位的本科项目使用
跨校 `field_ref` `music_education`,归 `Music Education`。

**理由**:EdUHK JS8001 是 BA(CDA) 与 BEd(Music) 的官方五年双学位,且音乐教育是学位
结构的一部分；它不是普通 BA in Music,也不是以创意产业/媒介为核心的融合型 BMus。
后续按官方学位谱系判断,不因课程同时含表演、数字音乐或艺术管理内容改类。

### P6 · 音乐剧写作与制作归 Musical Theatre

**判法**:`Writing and Production for Musical Theater` 归 `Musical Theatre`,使用
跨校 `field_ref` `musical_theater_writing_production`。

**理由**:该专业的核心对象是音乐剧的协作创作与制作,官网明确覆盖 bookwriting、lyric
writing、musical narrative、作曲技巧、demo recording 与舞台制作;它不是一般词曲创作,
也不是以录音棚/音频工程为核心的制作专业。归入 `Musical Theatre` 能保留其真实的
创作媒介与职业语境,避免误导性地并入 `Songwriting` 或 `Music Production/Technology`。
这是 Berklee NYC 本轮的归类裁决,后续同类"音乐剧写作/作曲/制作"专业照此判断。

### P7 · 音乐剧表演与音乐剧写作/制作分开

**判法**:面向表演训练的 `Theater: Musical Theater` 本科项目使用新增跨校
`field_ref` `musical_theater`,归 `Musical Theatre`;面向音乐剧协作创作与制作的
`Writing and Production for Musical Theater` 继续使用 `musical_theater_writing_production`。

**理由**:两者都以音乐剧为媒介,但使用者进入专业的核心手艺不同:前者是表演训练
(acting、singing、movement/dance),后者是 bookwriting、lyric writing、作曲与制作。
若复用同一个 `field_ref`,浏览页会把"成为音乐剧表演者"与"创作/制作音乐剧"混成一个
领域,误导专业选择。此裁决由 Boston Conservatory at Berklee 本科抽取确认,
后续同类表演向音乐剧项目照此使用 `musical_theater`。

### P8 · 综合大学 BA in Music 统一归 Musicology

**判法**:综合大学的标准 `BA in Music` / `Bachelor of Arts (Major in Music)` 统一使用
跨校 `field_ref` `music`,归 `Musicology`。不因课程同时含表演、作曲或音乐科技内容而改归
`Music Performance` 或 `Composition/Theory`。

**理由**:这类项目的核心是综合大学音乐系的学术型/综合型音乐学位,而不是独立音乐学院的
术科演奏项目,也不是学生自行设计的跨学科专业。`professional_music` 专用于 Berklee
式的 Professional Music 自主设计专业,不得复用于综合大学 BA in Music。后续 CUHK、HKBU
及英国线同形态项目照此判法,以避免 `Interdisciplinary` 类目被级联污染。

**词表变更**:2026-08-13 新增 `music`。

### P9 · 指挥独立归类

**判法**:以指挥为官方招生单位/专业的本科项目使用跨校 `field_ref` `conducting`,归
`Conducting`；不因同时要求钢琴、读谱或音乐理论而改归 `Music Performance` 或
`Composition/Theory`。

**理由**:指挥是官网明确的核心招生手艺，考试中的钢琴、总谱阅读与合唱/管弦乐指挥是
同一指挥训练链条内的组成部分。K-Arts Orchestral Conducting 为首个成员。

**词表变更**:2026-08-13 新增 `conducting`。

## 待处理的产品问题(不在归类范畴,记此备忘)

**专业制 vs 乐器制的粒度不均**:Berklee 按专业组织(`performance` 是一个 field),
音乐学院按乐器组织(茱莉亚会有三十来个乐器 field)。同一个浏览页里,两种体系的分组
会畸轻畸重。这不是归类能解决的,需要产品层决定浏览页如何呈现两种粒度。
2026-08-10 运营者裁决:记入产品待办,阶段三不处理。
