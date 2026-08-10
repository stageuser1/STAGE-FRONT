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

### P5 · 自主设计/交叉专业单开类目,不并入演奏

**判法**:Professional Music(可自主设计课程的交叉专业)归 `Interdisciplinary`。

**理由**:它没有固定的手艺核心,并入 `Music Performance` 会对使用者撒谎 —— 这个专业
不必然与演奏有关。宁可单开一个成员很少的类目,也不要归错。后续遇到 "Individualized
Major"、"Self-Designed" 之类照此。

## 待处理的产品问题(不在归类范畴,记此备忘)

**专业制 vs 乐器制的粒度不均**:Berklee 按专业组织(`performance` 是一个 field),
音乐学院按乐器组织(茱莉亚会有三十来个乐器 field)。同一个浏览页里,两种体系的分组
会畸轻畸重。这不是归类能解决的,需要产品层决定浏览页如何呈现两种粒度。
2026-08-10 运营者裁决:记入产品待办,阶段三不处理。
