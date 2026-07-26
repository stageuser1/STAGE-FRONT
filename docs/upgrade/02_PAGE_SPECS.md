# 02 — Page specifications

One section per blueprint page P-01 … P-11. Each carries: purpose, wireframes at desktop
and mobile, section-by-section content, exact components, data sources, all five states,
and acceptance criteria.

Conventions used throughout:
`E`/`A` = density ladder (`01_DESIGN_SYSTEM.md` §2) · `⌫` = back · `▸` = disclosure ·
`[  ]` = button · `( )` = chip · Chinese-first copy with English names verbatim.

---

## P-01 Explore — `/schools` + `/search`

**Route group:** `(explore)` · **Family:** Explore · **Density:** E
**Purpose:** anonymous-first discovery that makes the depth of the database visible
before anything is asked of the user.

Today `/schools` is a curated feed with five country chips that *link away* to `/search`,
and `/search` shows nothing until a query exists. The upgrade makes `/schools` the
catalog (always populated) and `/search` the explainable-ranking surface.

### Desktop (1280)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ MobileHeader  STAGE   首页 搜索          [reviewer]                        │
├───────────────────────────────────────────────────────────────────────────┤
│  探索全球音乐教育机会                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 搜索院校、专业、城市或学位…                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  国家/地区  (全部 128)(美国 64)(英国 31)(加拿大 12)(韩国 9)  ← C-05 row 1  │
│  学位       (全部 128)(本科 BM 52)(硕士 MM 48)(文凭 GD 14)(AD 9)(DMA 5)   │
│  专业方向   (全部)(表演 61)(作曲 12)(音乐教育 9)(爵士 8)  … 更多 ▸        │
│  截止时间   (全部)(30天内 7)(90天内 24)(已过 18)                           │
│                                                     [清除全部筛选]         │
├───────────────────────────────────────────────────────────────────────────┤
│  共 128 个项目 · 42 所院校        排序 [最近更新 ▾]   视图 [卡片][列表]     │
│  aria-live="polite" ↑                                                      │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐       │
│  │ HomeSchoolCard / ProgramCard │  │ …                            │       │
│  │  name · country · city       │  │                              │       │
│  │  (BM)(MM)(GD)  已核验         │  │                              │       │
│  │  申请截止 2026年12月1日        │  │                              │       │
│  │  核验于 2026-03-11            │  │                              │       │
│  └──────────────────────────────┘  └──────────────────────────────┘       │
│                                    … (no pagination; full list)            │
└───────────────────────────────────────────────────────────────────────────┘
```

The left icon rail from the blueprint is deferred (**OQ-5**) until five destinations
exist; WP6 adds it. Editorial collections sidebar: specified in §P-01.6, not scheduled.

### Mobile (375)

```
┌───────────────────────────┐
│ STAGE  海外音乐院校招生数据库│
├───────────────────────────┤
│  探索全球音乐教育机会       │
│ ┌───────────────────────┐ │
│ │ 🔍 搜索院校、专业…      │ │
│ └───────────────────────┘ │
│ (全部128)(美国64)(英国31)→│  ← one scrolling row per dimension
│ (本科52)(硕士48)(文凭14) →│
│ [筛选 ▸ 2]                │  ← <details>, collapsed, shows active count
├───────────────────────────┤
│ 共 128 个项目   [排序 ▾]   │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ card                  │ │
│ └───────────────────────┘ │
│ ┌───────────────────────┐ │
│ …                         │
├───────────────────────────┤
│  探索  院校  收藏  我的    │  ← MobileBottomNav (pb-24 clearance)
└───────────────────────────┘
```

Chip rows never wrap on mobile — they scroll (`.no-scrollbar`), matching `FilterChips`.
The dimensions beyond the first two collapse into the existing `<details>` filter panel.

### Sections

1. **Search** — `HeroSearch` (existing) on `/schools`; `SearchInput` (existing) on
   `/search`. Placeholder must state what actually matches: `院校、专业、城市、学位或缩写`.
   Honouring the placeholder is a named blueprint improvement (§7.2).
2. **Filter matrix** — C-05 `FilterChipMatrix`. Dimensions: country · degree slug ·
   major area · deadline window · IELTS demand band (from `accepted_tests`) ·
   tuition band. Counts on every chip, recomputed against the *other* dimensions'
   current selection (so a count is never a lie about what clicking it yields).
   OR within a row, AND across rows.
3. **Result header** — count + `aria-live="polite"`, sort menu
   (最近更新 / 申请截止最近 / 院校名称 / 学费), view toggle (卡片/列表, persisted in
   `sessionStorage`).
4. **Result list** — `HomeSchoolCard` (school mode) or `ProgramCard` (program mode).
   Enriched with: freshness label (C-19), saved chip (C-06 `saved` state, WP5),
   and on `/search` a row of C-08 `MatchReasonTag`.
5. **Zero-result guidance** — `EmptyState` naming the dimension that eliminated
   everything (`"英国 + 爵士" 没有结果 · 移除「爵士」可看到 31 个项目`), with a
   one-click removal link. Never a bare "no results".
6. **Editorial collections (specified, not scheduled).** Left sidebar at ≥1024px listing
   curated sets ("英国音乐学院", "作曲专业"). Requires the `program_collections` proposal
   in `06_DATA_REQUIREMENTS.md` §5.3. Until it exists, the sidebar is absent — not empty.

### Search ranking (`/search`, WP3)

Deterministic tiers before any fuzzy pass, each attaching a reason to the result:

| Tier | Score | Reason label | Matches |
|---|---|---|---|
| 1 | 1100 | 名称完全匹配 | normalized title === query |
| 2 | 1050 | 名称开头匹配 | title startsWith |
| 3 | 1010 | 名称包含 | title includes |
| 4 | 1000 | 学校名称 | school_name match |
| 5 | 950 | 专业方向 | major_area / major_area_zh |
| 6 | 900 | 学位 | degree name / abbreviation / slug |
| 7 | 850 | 城市 / 国家 | city / country |
| 8 | 800 | 中文名称 | name_zh, specialization |
| 9 | 780 | 中文分词匹配 | CJK bigram overlap ≥ 2 |

NFKC-normalize + lowercase + trim before matching. Dedupe by program id, keep the
highest tier, tie-break on `latestCheckedDate` desc then name. Cap at 50 rows with an
explicit `显示前 50 条，请细化条件` note. No fuzzy-search dependency: tier 9 (CJK
bigrams) is the floor, implemented in ~30 lines.

### Data sources

- `getAllSchools()`, `getAllPrograms()` (existing, `revalidate = 900`).
- `loadSearchPagePrograms(query)` (existing) for `/search`.
- `buildFilterOptions(programs)` (existing) — extend to return counts.
- **new** `lib/search/index.ts` — `buildSearchIndex(programs): SearchIndex` (server) and
  `rankSearch(index, query): RankedResult[]` (shared, pure).
- **new** `lib/explore/facets.ts` — `buildFacets(programs, selection): Facet[]` with counts.

### States

| State | Rendering |
|---|---|
| loading | `SkeletonCards variant="school" count={6}`; the chip row renders with counts hidden, not with `0`. |
| empty (no data at all) | `EmptyState` "数据库正在建设中" + link to `/contact`. Distinct from zero-result. |
| zero-result | §5 above, with the offending facet named. |
| anonymous / no-profile | Full catalog renders. One dismissible inline row above the results: `建立档案后可以看到每个项目与你的差距 [2 分钟建立档案]`. Dismissal persists (`stage.profile` → `nudges.exploreDismissedAt`) — no repeating modal (blueprint §7.2). |
| error | Directus failure bubbles to the existing `app/error.tsx`; facet computation failure degrades to an unfaceted list plus an inline `筛选暂不可用` note. |
| stale | Cards older than 180 days show `核验于 … （可能已更新）` in amber. |

### Acceptance criteria

- [ ] `/schools` renders the full published catalog on first paint with no interaction.
- [ ] Every chip shows a count; clicking it yields exactly that many rows.
- [ ] Removing the last active filter returns to the full list without a page reload.
- [ ] `/search?keyword=茱莉亚` returns Juilliard programs, each tagged with the reason
      that matched; searching an abbreviation (`MM`), a city (`New York`) and a Chinese
      major (`作曲`) all return non-empty, reason-tagged results.
- [ ] Filter state lives in the URL; a copied URL reproduces the exact view.
- [ ] 375/768/1280 all render without horizontal page scroll.
- [ ] Keyboard: Tab reaches every chip; Enter toggles; the count line announces changes.

---

## P-02 School detail — `/schools/[schoolId]`

**Route group:** `(explore)` · **Family:** Explore · **Density:** E
**Purpose:** institutional decision context, plus a first read of "do I fit here".

Everything currently on the page is kept: `SchoolHero`, `SchoolProfileCard`,
`SchoolQuickFacts`, 招生要点, `SchoolContentSections` + `EvidenceAccordion`,
`SchoolDegreeLegend`, `AreaProgramIndex`, `SchoolAdmissionsOverview`,
`SchoolVerificationCard`.

### Desktop / mobile (single column already; only insertions shown)

```
   SchoolHero  ▸ SchoolProfileCard  ▸ SchoolQuickFacts
┌────────────────────────────────────────────────────┐
│ ★ NEW — 与你的匹配  (C-02 lite: SchoolFitStrip)     │
│   ┌──────────┬──────────┬──────────┬────────────┐  │
│   │ 可申请 12 │ 有差距 4 │ 待确认 2 │ 语言 6.5   │  │
│   └──────────┴──────────┴──────────┴────────────┘  │
│   规则：按你的档案（学位 MM · 语言 IELTS 6.0）比对   │
│   本校 18 个项目的语言与截止要求 · readiness-v1     │
│   [完善档案]  或  [查看差距明细 ▸]                   │
└────────────────────────────────────────────────────┘
   招生要点 (existing)  ▸ 内容分区 (existing)
┌────────────────────────────────────────────────────┐
│ 招生项目  按专业方向浏览，共 18 个项目               │
│  (Performance 9)(Composition 3)(Jazz 2) …           │
│  ★ NEW — each AreaProgramIndex row gains a C-06 chip│
│     Master of Music, Violin      已满足 · 截止 12/1  │
│     Master of Music, Composition 有差距 · 语言 6.5   │
└────────────────────────────────────────────────────┘
   来源与核验 (existing)
```

### Sections

1. **Fit strip (new, `components/fit/SchoolFitStrip.tsx`)** — placed directly under
   `SchoolQuickFacts`, above 招生要点. Four counts across this school's programs:
   可申请 / 有差距 / 待确认 / 语言门槛(最低要求). One plain-language rule sentence and
   the algorithm version. Renders in **no-profile** state as the same strip with counts
   replaced by `—` and a build-profile CTA — the visible hole is the invitation
   (blueprint §3.2).
2. **Freshness on section headers** — each `SchoolContentSections` card gains a C-19
   badge from `detail_sections[key].last_checked_at` (already in the data, currently
   unrendered).
3. **Program index status** — `AreaProgramIndex` rows gain a C-06 chip derived from the
   requirement checklist for that program (satisfied / gap / unknown).

### Data sources

`getSchoolById`, `getProgramsBySchoolId`, `buildSchoolDetailViewModel` (all existing) +
**new** `lib/fit/school-fit.ts::summariseSchoolFit(programs, profile)` — a pure fold over
`buildRequirementChecklist` per program.

### States

| State | Rendering |
|---|---|
| loading | Existing `loading.tsx` (route-level). The fit strip is client-only: skeleton row until the profile is read from localStorage. |
| empty | School with zero programs keeps today's `EmptyState`; fit strip is hidden entirely (nothing to compare). |
| no-profile | Fit strip renders with `—` counts + CTA (never hidden). |
| error | Fit computation is pure and cannot throw on valid data; a thrown error renders an inline `匹配暂不可用` note and leaves the rest of the page intact (error boundary around the strip only). |
| stale | `SchoolVerificationCard` (existing) plus per-section freshness badges. |

### Acceptance criteria

- [ ] No existing section is removed, reordered above the hero, or restyled.
- [ ] Fit strip renders for anonymous users with `—` and a CTA.
- [ ] Every `detail_sections` card shows its `last_checked_at`.
- [ ] Program index chips agree with the program page's checklist for the same program.

---

## P-03 Program detail — `/schools/[schoolId]/programs/[programId]`

**Route group:** `(explore)` · **Family:** Explore · **Density:** E
**Purpose:** THE decision page — "does this fit me, and what do I do next".

The page already has a two-column grid (`lg:grid-cols-[minmax(0,1fr)_320px]`) with
`SourceCitationBlock` in a sticky right column. The Fit Panel joins that column above it.

### Desktop (1280)

```
┌──────────────────────────────────────────┬─────────────────────────┐
│ header card (degree chip, names, school) │  ┌───────────────────┐  │
│ ────────────────────────────────────────  │  │ C-02 FitPanel     │  │
│ 决策摘要 (existing KeyFact grid, 3-up)     │  │ ─────────────────  │  │
│  预筛选 │ 试音/曲目 │ 费用                 │  │ 总体：有 1 项差距  │  │
│  申请截止│ 语言要求  │ 地点                 │  │                    │  │
│ ────────────────────────────────────────  │  │ 语言   有差距 ▸    │  │
│ ★ NEW  申请清单 Requirement Checklist      │  │ 时间   充裕  ▸    │  │
│  ┌────────────────────────────────────┐   │  │ 学术   待确认 ▸   │  │
│  │ ● 语言成绩   有差距                 │   │  │ 预算   有差距 ▸   │  │
│  │   IELTS 6.5 要求 · 你的估算 6.0     │   │  │ ─────────────────  │  │
│  │   [C-04 BandGapMeter ───●──┼──]     │   │  │ C-04 BandGapMeter │  │
│  │   ▸ 展开：完整要求 + 官方原文 + 来源 │   │  │  6.0 ▲    ▼ 6.5   │  │
│  ├────────────────────────────────────┤   │  │ ├────●───┼──────┤  │
│  │ ● 预筛选     已满足                 │   │  │ 还差 0.5 分        │  │
│  │   不需要预筛选 · 核验于 2026-03-11  │   │  │ [去雅思实验室提分] │  │
│  ├────────────────────────────────────┤   │  │ ─────────────────  │  │
│  │ ● 现场试音   待确认                 │   │  │ 申请截止 12月1日   │  │
│  │   要求暂未收录 ▸                    │   │  │ 预筛选 11月1日     │  │
│  ├────────────────────────────────────┤   │  │ [加入我的清单]     │  │
│  │ ● 申请材料   3 项 ▸                 │   │  └───────────────────┘  │
│  └────────────────────────────────────┘   │  ┌───────────────────┐  │
│ ────────────────────────────────────────  │  │ 来源与核验 (exist)│  │
│ ▸ 曲目与试音  ▸ 费用明细  ▸ 申请与资格     │  └───────────────────┘  │
└──────────────────────────────────────────┴─────────────────────────┘
```

### Mobile (375)

```
┌───────────────────────────┐
│ ⌫  STAGE                  │
│ header card               │
│ 决策摘要 (2-up KeyFacts)   │
├───────────────────────────┤
│ ★ C-02 FitPanel  (full w) │  ← the decision leads; it does NOT drop to the bottom
│   总体：有 1 项差距        │
│   语言 有差距 · 时间 充裕  │
│   [BandGapMeter]          │
│   [去雅思实验室提分]       │
├───────────────────────────┤
│ ★ 申请清单 (rows, ▸)      │
├───────────────────────────┤
│ ▸ 曲目与试音               │
│ ▸ 费用明细                 │
│ ▸ 申请与资格               │
│ ▸ 来源与核验               │
└───────────────────────────┘
```

Implementation: render the Fit Panel once, in the right column, and use
`order-first lg:order-none` on the wrapper so it moves above the detail sections below
`lg`. One instance, two positions — never a duplicated component.

### Sections

1. **Fit Panel (C-02)** — verdict header; four dimension rows (语言 / 时间 / 学术 / 预算),
   each expandable to its computation; `BandGapMeter`; deadline chips (existing
   `DeadlineChip`); primary CTA `[加入我的清单]`; secondary `[去雅思实验室提分]`
   deep-linking to `/ielts-lab/suite?target=6.5&from=program:<id>`.
2. **Requirement Checklist (new)** — `SectionCard title="申请清单"` containing C-03 rows:
   `language` · `prescreen` · `audition` · `documents` · `deadline` · `cost`.
   Each row: state chip, one-line summary, `▸` expanding to full prose (`ProseBlock`),
   the evidence quote, source link and `核验于`. Rows reuse the data already mapped into
   `PublicProgramDto` — **no new fetch**.
3. **Existing sections unchanged** — 曲目与试音, 费用明细, 申请与资格 keep their
   `ExpandableSection` wrappers and reviewer-editable cards. The checklist *summarises*;
   the sections remain the authoritative detail, and the checklist's `▸` scrolls to them
   where a full card already exists (`scroll-mt-20` is already on `SectionCard`).

### Data sources

- `getProgramById` → `toPublicProgramDto` (existing).
- **new, pure:** `lib/fit/requirements.ts::buildRequirementChecklist(program, profile)`,
  `lib/fit/language.ts::ieltsGap(program, profile)`,
  `lib/fit/dimensions.ts::scoreDimensions(program, profile)`.
- Profile from `lib/profile/storage.ts` (client, after mount).
- Lab band estimate from `profile.english.labEstimate` (written by WP2, read here).
- **needs OQ-7:** `last_checked_at` on the DTO.

### States

| State | Rendering |
|---|---|
| loading | Route `loading.tsx` for the server half; the Fit Panel is client-only and shows a `SkeletonCards variant="section" count={1}` until localStorage is read. |
| empty | Program not found → existing `EmptyState`. A program with no requirement data at all renders the checklist with every row `待确认` plus one `MissingDataNote` — the page never disappears. |
| no-profile | Fit Panel renders its full structure with each dimension showing `建立档案后可比对` and a single CTA `[2 分钟建立档案]` returning to this URL (`/profile?return=…`). Checklist rows still render with the *requirement* (what the school asks) and state `待确认` for the personal half. Requirements are public; only the comparison needs a profile. |
| error | Fit Panel wrapped in its own error boundary → `匹配暂不可用，要求信息仍可查看`. |
| stale | Each checklist row shows `核验于 …`; > 180 days appends `（可能已更新）`. Rows whose underlying field is null show `暂未收录` (`MissingDataNote`), never `0` or `不需要`. |

### Acceptance criteria

- [ ] Checklist state for a program with `ielts_minimum = 6.5` and profile estimate 6.0
      is `gap`, and the meter reads `还差 0.5 分`.
- [ ] A program with `prescreening_required = "No"` renders `不需要`, not `已满足`.
- [ ] A program with `ielts_minimum = null` renders `待确认` in neutral tone — never amber/red.
- [ ] Every expanded row shows a source link and an accessed date when one exists.
- [ ] Anonymous users see all requirements and no personal comparison.
- [ ] At 375 the Fit Panel appears above the detail sections; nothing is hidden.
- [ ] Reviewer mode still edits every existing card (no regression in `ProgramDetailSections`).

---

## P-04 Profile builder — `/profile`

**Route group:** `(product)` · **Family:** App · **Density:** E
**Purpose:** capture matching inputs at minimum friction, local-first, always skippable.

### Desktop / mobile (one column, max-w-xl — identical structure)

```
┌───────────────────────────────────────┐
│           ● ● ○ ○ ○   第 2 / 5 步      │  ← C-22 progress dots
│                                        │
│   你的目标学位是？                      │
│   可以多选，之后随时可改                 │
│                                        │
│   (本科 BM) (硕士 MM) (文凭 GD)        │
│   (艺术家文凭 AD) (博士 DMA)           │
│                                        │
│   入学学期                              │
│   (2027 秋) (2028 秋) (未定)           │
│                                        │
│   ─────────────────────────────        │
│   [上一步]        [跳过]     [下一步]   │
│                                        │
│   已自动保存 · 12:04                    │
└───────────────────────────────────────┘
```

### The five steps

| # | Question | Input | Writes |
|---|---|---|---|
| ① | 你主修什么？ | field chips (from `buildFilterOptions().majorOptions`) + free-text instrument | `discipline` |
| ② | 目标学位与入学学期 | degree chips + term chips | `target` |
| ③ | 目标国家与预算 | country chips + budget band stepper | `geography` |
| ④ | 学术背景 | current level, graduation year, GPA band | `academic` |
| ⑤ | 英语情况 | 有成绩? → test → current / target score steppers | `english` |

One question group per screen. Chips and steppers only; free text only for instrument.
Every step has a visible `[跳过]` that writes `steps[id] = "skipped"` and advances.

### Interaction contract

- **Autosave on every change** (C1 draft contract): write-through to `stage.profile`,
  plus `visibilitychange` flush. Last-saved time is displayed.
- `?return=<path>` — on completion or on `[完成]`, `router.replace(returnPath)`.
  Default `/dashboard`.
- Re-entry resumes at the first `pristine` step; a completed profile opens step ① in
  edit mode with all values populated.
- Editable forever from `/dashboard` and from the Fit Panel's `[完善档案]`.
- No account, no email, no network call. A single line states it:
  `档案保存在本机浏览器，未上传。`

### Data sources

**new** `lib/profile/types.ts` (`ProfileV1`), `lib/profile/storage.ts`
(`loadProfile` / `saveProfile` / `patchProfile` / `clearProfile`),
`lib/profile/derive.ts` (`profileCompleteness(profile): 0..1`).
Option lists come from existing catalog data via a server component that passes
`majorOptions` / `countryOptions` / `degreeOptions` as props (no client Directus access).

### States

| State | Rendering |
|---|---|
| loading | Skeleton step card until localStorage is read (`profile === null` ≠ no profile). |
| empty (first run) | Step ① with an intro line: `5 个问题，大约 2 分钟。每一步都可以跳过。` |
| anonymous | This *is* the anonymous surface. No auth prompt anywhere in Phase 1. |
| error | localStorage write failure (quota/private mode) → persistent inline banner: `无法保存到本机浏览器，本次填写在离开页面后会丢失。` The flow still works in memory. |
| stale | A profile whose `schemaVersion` is older than current runs `migrateProfile()`; an unmigratable version renders `档案格式已更新，请重新填写` with the old JSON offered as a download. Never silently discarded. |

### Acceptance criteria

- [ ] Every step is skippable and the profile is usable when all five are skipped.
- [ ] Reloading mid-flow resumes at the same step with the same values.
- [ ] `stage.profile` always contains `schemaVersion: 1`.
- [ ] `/profile?return=/schools/x/programs/y` returns exactly there on finish.
- [ ] Keyboard-only completion is possible; focus moves to the new step's heading on
      advance (`tabIndex={-1}` + `.focus()`), and the step change is announced.
- [ ] No network request is made by this page.

---

## P-05 Match — `/match` *(specified; Phase 2)*

**Route group:** `(product)` · **Family:** App · **Density:** E
**Purpose:** constraint-driven shortlist with total transparency.

```
┌──────────────────┬──────────────────────────────────────────────┐
│ C-09 约束条件     │ 规则：先筛掉不满足硬性条件的项目，再按        │
│                   │ 语言/时间/预算/方向四个维度打分排序。         │
│ 学位 MM   [硬]    │ 算法版本 match-v1 · 基于 2026-07-26 的档案    │
│ 国家 US/GB [硬]   │ ────────────────────────────────────────────  │
│ 语言 6.0  [软]    │  ① C-01 RecommendationCard                   │
│ 预算 ≤$60k [软]   │     Manhattan School of Music · MM Violin     │
│                   │     符合 · 语言▓▓▓▓ 时间▓▓▓ 预算▓▓            │
│ [生成推荐]        │     (语言达标)(截止充裕)(方向匹配)  ← C-08     │
│                   │     [查看] [收藏] [不感兴趣]                  │
│ 历史运行 ▾        │  ② …                                          │
└──────────────────┴──────────────────────────────────────────────┘
```

Mobile: constraints collapse into a `<details>` above the results.

- Shortage → C-10 `FallbackConsentDialog` naming exactly which constraint would be
  relaxed and by how much. **Never silent.**
- `[换一批]` re-runs excluding every previously shown program id.
- Each run is an immutable snapshot in `stage.match.runs`; history is browsable.
- Every card links to P-03; every reason carries an evidence ref.

### Data sources

`lib/profile/storage.ts` (constraint seeds) · `lib/search/index.ts` (candidate set) ·
`lib/fit/dimensions.ts` (scoring, shared with P-03 so the two can never disagree) ·
**new** `lib/match/run.ts::runMatch()` and `lib/match/storage.ts` (`stage.match.runs`).

### States

| State | Rendering |
|---|---|
| loading | Constraint panel skeleton while the profile is read; results area shows `SkeletonCards variant="program" count={3}` while generating. |
| empty | No run yet → the constraint panel plus a rule-sentence card explaining what pressing 生成推荐 will do. Never an empty results grid. |
| anonymous / no-profile | Panel renders with nothing prefilled plus `先建立档案可以自动填入条件 [建立档案]`. Manual constraint entry still works — matching is not gated on a profile. |
| error | A failed run leaves the previous run visible and shows an inline `生成失败 [重试]`; a stored run that fails to parse is skipped with `一次历史运行无法读取`. |
| stale | A run whose `profileVersion`/`profileSnapshot` differs from the current profile shows an amber bar `档案已更新，这次推荐基于 {date} 的档案 [重新生成]`. The run itself is never rewritten. |

### Acceptance criteria

- [ ] No hard constraint is ever relaxed without a checked box in C-10.
- [ ] Cancelling the shortage dialog still shows the under-target results, never nothing.
- [ ] `[换一批]` produces a new `runId` and excludes every previously shown program.
- [ ] The algorithm version and rule sentence are visible on the results header.
- [ ] Ineligible items are collapsed behind a disclosure, never dropped from the run.
- [ ] A card's dimension scores match the Fit Panel on that program's own page.

Work-package scheduling is deferred to Phase 2 (§8.2 item 2.1). The schema is fixed now —
`06_DATA_REQUIREMENTS.md` §4 — so Phase-1 storage decisions do not paint it into a corner.

---

## P-06 Dashboard — `/dashboard`

**Route group:** `(product)` · **Family:** App · **Density:** E
**Purpose:** product home. "What should I do next" answered in five seconds.
**Replaces:** the `ComingSoon` teaser body (route and layout untouched; `teasers.dashboard`
in `content/landing.ts` becomes unused and is deleted in the same commit).

### Desktop (1280)

```
┌───────────────────────────────────────────────────────────────────┐
│  下一步                                          档案完成度 80% ▸  │
│  ┌────────────────────┬────────────────────┬────────────────────┐ │
│  │ C-13 ActionCard    │ C-13 ActionCard    │ C-13 ActionCard    │ │
│  │ 提高雅思 0.5 分     │ 11月1日 预筛选截止 │ 补全预算区间        │ │
│  │ 3 个项目要求 6.5    │ MSM · MM Violin    │ 影响 2 个维度评估   │ │
│  │ 你的最弱题型：匹配   │ 还有 98 天         │                    │ │
│  │ [去练习匹配题]      │ [查看要求]         │ [完善档案]         │ │
│  └────────────────────┴────────────────────┴────────────────────┘ │
├───────────────────────────────────────────────────────────────────┤
│  申请准备度                             规则说明 ▸  readiness-v1   │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ MSM · MM Violin      语言▓▓▓░ 时间▓▓▓▓ 材料▓▓░░ 预算▓▓▓░ │ ← C-12
│  │ Juilliard · MM Comp  语言▓▓░░ 时间▓▓▓░ 材料░░░░ 预算▓░░░ │    │
│  └───────────────────────────────────────────────────────────┘    │
├──────────────────────────────────┬────────────────────────────────┤
│  截止时间线 (未来 90 天)  C-11    │  雅思快照                       │
│  今天│      ●        ●      ●    │  估算 6.0  ▁▂▃▂▄▅  ← recharts  │
│  ────┼──────┼────────┼──────┼──  │  目标 6.5 · 差 0.5             │
│      7/26  11/1     12/1  12/15   │  最近 12 次练习 · 平均 68%      │
│            预筛选   申请   试音    │  最弱题型：信息匹配 52%         │
│                                   │  [继续练习] [错题本 7]         │
└──────────────────────────────────┴────────────────────────────────┘
```

### Mobile (375) — same order, single column

```
下一步 (ActionCards stacked, max 3 visible + “更多 ▾”)
申请准备度 (C-12 rows, meters wrap under the name)
截止时间线 (vertical axis, newest at top)
雅思快照 (stat tiles 2-up + sparkline)
档案完成度 (bottom, dismissible)
```

`DeadlineTimeline` switches from a horizontal axis to a vertical list below `md` — it
reflows, it does not disappear.

### Sections

1. **Next actions (C-13)** — generated by `lib/dashboard/actions.ts`, max 3 shown, each
   with an imperative title, a why-line citing its evidence (a requirement + its
   freshness, or a lab statistic + its sample size), and a one-click CTA that resolves it.
   Generators: IELTS gap → lab; nearest deadline → program; profile hole → `/profile`;
   weakest question type → `/ielts-lab/browse?type=…`; stale saved program → its page.
2. **Readiness meters (C-12)** — one row per saved/shortlisted program, four segments
   (语言 / 时间 / 材料 / 预算). `规则说明 ▸` discloses the weighting in plain language
   plus `READINESS_ALGORITHM_VERSION`.
3. **Deadline timeline (C-11)** — next 90 days from `Deadline` across saved programs.
   Node types: 申请 / 预筛选 / 试音. **Note:** `audition_date` is hard-coded `null` in
   `lib/data.ts`, so the 试音 node cannot populate until the backend proposal in
   `06_DATA_REQUIREMENTS.md` §5.4 lands — the legend states this rather than implying
   no auditions exist.
4. **IELTS snapshot** — band estimate + trend sparkline (`buildTrend`, recharts, already
   lazy-loaded), attempt count, weakest type (`weakestType`), wrongbook count badge.
5. **Profile completeness** — `profileCompleteness()` as a thin meter + CTA.

### Data sources

`lib/profile/storage.ts` · `lib/profile/saved.ts` · `lib/ielts/storage.ts` ·
`lib/ielts/analytics.ts` (`buildTrend`, `buildQuestionTypeStats`, `weakestType`) ·
`lib/ielts/band.ts` (new) · `lib/ielts/wrongbook.ts` (new) ·
**new** `lib/dashboard/readiness.ts`, `lib/dashboard/actions.ts`.

Saved programs are stored as `{programId, schoolId, savedAt, snapshot}` where `snapshot`
carries the few display fields (names, deadlines, ielts minimum) needed to render the
dashboard **without a Directus round-trip**; the snapshot is refreshed whenever the
program page is visited, and its age is shown.

### States

| State | Rendering |
|---|---|
| loading | Skeletons for all four regions (client-only data). |
| empty (no profile, no saves, no practice) | A single onboarding card with three ordered entries: 建立档案 → 收藏项目 → 开始练习. Not four empty modules. |
| partial empty | Each region has its own empty copy and CTA; regions with data render normally. |
| anonymous | Identical to "no profile" — Phase 1 has no accounts. One line: `数据保存在本机浏览器。` |
| error | Per-region error boundary; a failed region shows `此模块暂不可用` and the rest renders. |
| stale | Saved-program snapshots older than 30 days show `信息可能已更新 · 打开项目页刷新`. |

### Acceptance criteria

- [ ] With an empty local state, the page shows the three-step onboarding and no zeros.
- [ ] Every action card's CTA lands on a surface that can actually close it.
- [ ] Readiness discloses its rule sentence and version without leaving the page.
- [ ] The timeline shows a 今天 marker and orders nodes chronologically.
- [ ] Band estimate never appears without its sample size and the word 估算.
- [ ] No Directus request is made by this page.

---

## P-07 IELTS Lab overview + browse — `/ielts-lab`, `/ielts-lab/browse`

**Route group:** `(ielts)/(shell)` · **Family:** App · **Density:** E
**Purpose:** keep the existing shell; add goal context, honest per-category accuracy,
three-state cards and the wrongbook entrance.

### Overview additions

```
┌──────────────────────────────────────────────────────────┐
│ 雅思实验室   223 篇真题阅读 · 记录保存在本机               │
│ ★ NEW 目标横幅                                            │
│   你收藏的 3 个项目要求 IELTS 6.5 · 当前估算 6.0           │
│   [查看差距]                        (hidden without goal)  │
├──────────────────────────────────────────────────────────┤
│ [随机练习] [无尽模式] [套题模式] [浏览题库] ★[错题本 7]    │
├──────────────────────────────────────────────────────────┤
│ 已练习 42 · 平均 68% · 时长 310 分钟 · 连续 4 天           │
├──────────────────────────────────────────────────────────┤
│ 阅读分类  ★ C-07 now shows accuracy, not only coverage    │
│ ┌──────────┬──────────┬──────────┐                       │
│ │ P1 阅读   │ P2 阅读   │ P3 阅读   │                      │
│ │ 正确率 74%│ 正确率 61%│ 未开始    │  ← “未开始” not “0%” │
│ │ 已练 18/74│ 已练 12/78│ 0/71      │                      │
│ │ ▓▓▓▓░░░░ │ ▓▓▓░░░░░ │ ░░░░░░░░ │                      │
│ │ [浏览][随机]                                            │
│ └──────────┴──────────┴──────────┘                       │
└──────────────────────────────────────────────────────────┘
```

### Browse additions

- Each exam card gains a **C-06 chip** (未开始 / 进行中 / 已完成 / 有错题) replacing the
  bare blue dot that currently marks "practised".
- Filter chips gain **counts**, computed against the other active filters.
- A `有错题` progress filter joins `全部 / 未练习 / 已练习`.
- Nav (`LabNav`) gains a fifth item `错题本` with a count badge.

### Data sources

`getAllExams`, `buildProgressIndex`, `practisedByCategory`, `computeStats` (existing) ·
**new** `lib/ielts/status.ts::examStatus()`, `lib/ielts/wrongbook.ts::buildWrongbook()` ·
`lib/ielts/band.ts` for the goal banner · `lib/profile/storage.ts` for the target band.

### States

| State | Rendering |
|---|---|
| loading | `records === null` → skeleton tiles. Today the page renders nothing for stats until loaded; keep that discipline and add skeletons. |
| empty | Category tiles read `未开始` (not `0%`); recent-practice card keeps its existing `EmptyNote`. |
| no-profile / no goal | Goal banner hidden entirely (there is no goal to state). Everything else renders. |
| error | Corrupt localStorage already degrades to `[]` in `loadRecords`; add a one-line notice `无法读取本机练习记录` when a parse error was swallowed. |
| stale | n/a (corpus is static, records are local). |

### Acceptance criteria

- [ ] A category with zero attempts shows 未开始, never 0%.
- [ ] Every exam card's chip agrees with `examStatus()` for that exam.
- [ ] Filter counts sum to the visible result count.
- [ ] Wrongbook badge count equals the wrongbook page's entry count.
- [ ] Existing browse state persistence (`stage.ielts.browse`) still restores.

---

## P-08 IELTS practice player — `/ielts-lab/practice/[examId]` *(reduced scope)*

**Route group:** `(ielts)` (sibling of `(shell)`) · **Family:** App · **Density:** A

**Scope constraint — read `00_DECISIONS.md` §1.1 first.** The passage, questions, timer,
question navigator, highlights and in-attempt autosave all live inside the vendored
iframe runner. STAGE owns the surrounding bar and everything after submit. Rebuilding
the in-frame UI means forking a 124KB vendored runtime and is **not** Phase 1 work.

### What STAGE's chrome does (current, kept)

```
┌──────────────────────────────────────────────────────────────┐
│ ← 退出 │ A Brief History of Tea      P1 · 套题 2/3   练习记录 │  ← STAGE
├──────────────────────────────────────────────────────────────┤
│ (after submit) ResultPanel: 正确率 / 得分 / 用时 / 按题型     │  ← STAGE
│                [下一篇 · P3] [套题概览]                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                    ▓▓▓  iframe: the runner  ▓▓▓               │  ← vendored
│         (passage · questions · timer · navigator · drafts)     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Phase 1 changes (all in `ExamRunner.tsx`, all host-side)

1. **Post-submit CTA gains a review link** — `[查看逐题回顾]` → `/ielts-lab/review/<recordId>`
   (the new native review), beside the existing `[在原题中回顾]` replay.
2. **Exit honesty** — the existing `window.confirm` is replaced by an inline confirm row
   in the STAGE bar (`确定退出？本次作答不会保存 [退出] [继续作答]`). Native dialogs are
   a named competitor defect.
3. **Draft capture (OQ-3, WP2)** — add `SIMULATION_DRAFT_SYNC` to the message switch,
   writing `{examId, updatedAt, answered}` to `stage.ielts.drafts`. This is what makes
   the `pending` state real across the catalog. Display `上次作答保存于 …` in the bar.
4. **Suite context line** already exists and is kept.

Explicitly **not** in Phase 1: sticky audio bar, transcript split pane, STAGE-rendered
question navigator, STAGE-owned timer. Listening (blueprint 2.4) brings the split pane
with it and reflows below `md` when it arrives.

### States

| State | Rendering |
|---|---|
| loading | Existing `加载中…` in the bar while the handshake completes; add a skeleton over the frame area after 3s and an explicit failure notice after the 20-attempt handshake budget expires (`题目加载失败 [重新加载]`). Today the handshake gives up silently. |
| empty | Non-interactive exam → `notFound()` (existing). |
| no-profile | No effect; practice never requires a profile. |
| error | Handshake timeout → notice above; message from an untrusted origin is dropped (existing `isTrustedRunnerEvent`). |
| stale | Reviewing an old record replays stored answers/comparison, not the live key (existing `sendReplayRecord` behaviour) — keep it and label the panel 回顾模式. |

### Acceptance criteria

- [ ] Submitting still writes exactly one `PracticeRecord` per passage; suite entries
      still carry `SuiteRef`.
- [ ] The post-submit panel links to the new review route with the correct record id.
- [ ] No `window.confirm` remains in this component.
- [ ] A handshake that never completes shows a visible failure state.

---

## P-09 Attempt review — `/ielts-lab/review/[recordId]` *(new)*

**Route group:** `(ielts)/(shell)` · **Family:** App · **Density:** A
**Purpose:** turn one attempt into learning. Exact, immutable, addressable by id.

### Desktop (1280)

```
┌────────────────────────────────────────────────────────────────────┐
│ 总览 题库 套题练习 练习记录 错题本            ← LabNav (shell)       │
├────────────────────────────────────────────────────────────────────┤
│ ⌫ 练习记录                                                          │
│ A Brief History of Tea 茶叶简史          P1 · 高频 · 2026-07-24     │
│ ┌──────────┬──────────┬──────────┬──────────────────────────────┐  │
│ │ 正确率    │ 得分      │ 用时      │ 本篇折合  6.0 估算            │  │
│ │ 62%      │ 8/13     │ 17:42    │ (band contribution, labelled) │  │
│ └──────────┴──────────┴──────────┴──────────────────────────────┘  │
│ ◀ 第 2 次 / 共 3 次  2026-07-24 62% ▶      ← C-16 AttemptPager     │
├────────────────────────────────────────────────────────────────────┤
│ C-17 QuestionNavigator (review mode)                                │
│ [1✓][2✓][3✗][4✓][5✗][6✓][7✓][8✗][9✓][10✓][11✗][12✓][13✓]         │
├────────────────────────────────────────────────────────────────────┤
│ 逐题结果                    [全部显示答案]   ← C-14 RevealControl   │
│ ┌──┬────────────┬──────────────┬──────────┬──────┬─────────────┐  │
│ │# │ 题型        │ 我的作答      │ 正确答案  │ 结果 │ 解析         │  │
│ ├──┼────────────┼──────────────┼──────────┼──────┼─────────────┤  │
│ │1 │ 信息匹配    │ viii         │ ●●●[显示]│  ✓  │ 原文定位 ▸  │  │
│ │3 │ 信息匹配    │ vi           │ ●●●[显示]│  ✗  │ 原文定位 ▸  │  │
│ │  │  ▸ 展开：解析全文（中文）+ 段落引用                          │  │
│ └──┴────────────┴──────────────┴──────────┴──────┴─────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ 按题型  信息匹配 3/8 · 单项选择 4/4 · 判断题 1/1                     │
├────────────────────────────────────────────────────────────────────┤
│ [重做这篇]  [在原题中回顾]  [加入错题练习]  [返回记录]               │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile (375)

```
⌫ 练习记录
A Brief History of Tea         P1 · 2026-07-24
正确率 62%   8/13   17:42          (2-up stat tiles)
◀ 第 2/3 次 ▶
[1✓][2✓][3✗][4✓][5✗][6✓][7✓]…    ← horizontal scroll, 36px cells
[全部显示答案]
┌──────────────────────────┐
│ #3  信息匹配        ✗    │      ← table becomes stacked rows
│ 我的作答  vi             │
│ 正确答案  ●●●  [显示]     │
│ 原文定位 ▸               │
└──────────────────────────┘
…
[重做这篇] [在原题中回顾] [返回记录]
```

### Answer-reveal discipline (the point of this page)

- Correct answers are **masked by default** (`●●●`), one `[显示]` per row, plus one
  `[全部显示答案]`. Revealing inserts the text into the DOM (never CSS-blur), so screen
  readers do not read a hidden answer.
- Reveal state is per-page-visit and never persisted — re-opening a review starts masked.
- Wrong rows are **not** auto-revealed. Checking is not reviewing.

### EvidenceJump (C-15) — how the reading explanation is reached

The corpus already ships per-question Chinese explanations with paragraph-level location
cues at `public/ielts/reading-explanations/<examId>.js`, registered through
`public/ielts/runtime/readingExplanationRegistry.js` (`__READING_EXPLANATION_DATA__.get(id)`).
`lib/ielts/corpus.ts` (new, client-only) loads them on demand:

```
loadExplanation(examId)
  → inject <script src="/ielts/runtime/readingExplanationRegistry.js"> (once)
  → inject <script src="/ielts/reading-explanations/{examId}.js">
  → window.__READING_EXPLANATION_DATA__.get(examId)
  → { passageNotes[], questionExplanations.items[{questionId, questionNumber, text}] }
```

Same pattern with `readingExamRegistry.js` + `/ielts/reading-exams/{examId}.js` yields
`questionDisplayMap` (real question numbers instead of `q7`) and `questionGroups[].kind`.

Tiering, so the page is never blocked on corpus availability:

| Tier | Available when | Renders |
|---|---|---|
| 1 | always (record only) | number, type, my answer, correct answer, verdict |
| 2 | explanation file exists (`hasExplanation`) | `原文定位 ▸` expanding to the Chinese explanation + paragraph label |
| 3 | exam dataset loaded | real display numbers; passage paragraph quoted inline |

Tier 3 is optional in WP1; tiers 1–2 are the ship bar. Full passage rendering with
scroll-highlight stays in the runner (`[在原题中回顾]`) — STAGE does not re-implement it.

### Data sources

`getRecord(recordId)` (existing, localStorage) · `loadRecords()` for sibling attempts of
the same `examId` (C-16 pager) · `questionTypeOf` / `questionTypeLabel` (existing) ·
`buildQuestionTypeStats([record])` (existing) · `lib/ielts/band.ts` (new) ·
`lib/ielts/corpus.ts` (new).

### States

| State | Rendering |
|---|---|
| loading | Skeleton summary + table (record is client-only). |
| empty | Unknown `recordId` → `EmptyNote` "找不到这条练习记录，可能已被删除或来自其他浏览器" + `[返回记录]` + `[导入记录]`. Never a 404 page — the id may be valid on another device. |
| no-profile | No effect. The band-contribution tile shows the estimate without a target line. |
| error | Explanation script fails to load → the row keeps tiers 1 and shows `解析暂不可用`; the page never fails as a whole. |
| stale | A record predating `questionType` storage resolves types from the live corpus (existing fallback) and labels the table `题型按当前题库推断`. |

### Acceptance criteria

- [ ] Correct answers are masked on first paint; `[全部显示答案]` reveals all.
- [ ] The pager moves between attempts of the same exam without changing the record data.
- [ ] A record with `answerComparison = {}` renders the summary and an explicit
      "这条记录没有逐题数据" row — it does not crash or render an empty table.
- [ ] Explanation loading is lazy: no corpus script is fetched until a row is expanded.
- [ ] Keyboard: navigator cells are buttons, arrow keys move between them, Enter scrolls
      the matching row into view and focuses it.
- [ ] At 375 the table is stacked rows; no horizontal page scroll.

---

## P-10 Wrongbook — `/ielts-lab/mistakes` *(new)*

**Route group:** `(ielts)/(shell)` · **Family:** App · **Density:** A
**Purpose:** derived remediation queue with zero curation.

### Desktop / mobile

```
┌───────────────────────────────────────────────────────────┐
│ 错题本      来自最近一次练习仍有错题的 7 篇文章             │
│ 规则：每篇只看最近一次作答，错题数 > 0 即进入错题本；        │
│       重做后自动移出。                                     │
├───────────────────────────────────────────────────────────┤
│ 🔍 搜索标题…                              [排序 最近错题 ▾]│
│ 分类 (全部 7)(P1 3)(P2 3)(P3 1)                            │
│ 频次 (全部 7)(高频 5)(次高频 2)(低频 0)                     │
│ 题型 (全部)(信息匹配 12)(判断题 5)(摘要填空 3)              │
│                                            [清除筛选]      │
├───────────────────────────────────────────────────────────┤
│ 共 7 篇 · 23 道错题                                        │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ▸ A Brief History of Tea      P1 高频  5 错 / 13      │ │
│ │   最近作答 2026-07-24 62%      [回顾] [重做]           │ │
│ │   ── expanded ──────────────────────────────────────  │ │
│ │   #3  信息匹配   我: vi     正确: ●●● [显示]   解析 ▸ │ │
│ │   #5  信息匹配   我: (未作答) 正确: ●●● [显示]        │ │
│ └───────────────────────────────────────────────────────┘ │
│ …                                                          │
└───────────────────────────────────────────────────────────┘
```

Filter vocabulary is **identical to browse** (category / frequency / type + search +
count) — one mental model everywhere, which is the whole lesson of C1-S3.

### Derivation rule (must be stated in the UI, verbatim above)

For each `examId`: take the record with the greatest `createdAt`. Include the exam if
that record has ≥ 1 `answerComparison` entry with `isCorrect === false`. Sort by that
record's `createdAt` descending. Nothing is stored; redoing a passage successfully
removes it from the list on the next render.

### Data sources

`loadRecords()` · **new** `lib/ielts/wrongbook.ts::buildWrongbook(records, filters)` ·
`getAllExams()` for frequency/category when a record predates those fields ·
`questionTypeOf` / `questionTypeLabel` · `lib/ielts/corpus.ts` for the explanation tier.

Filters persist in `sessionStorage` under `stage.ielts.mistakes`, matching the browse
page's behaviour.

### States

| State | Rendering |
|---|---|
| loading | Skeleton rows. |
| empty — no history at all | `EmptyNote` "还没有练习记录。完成一篇阅读后，这里会自动收集错题。" + `[去题库]`. |
| empty — history but no mistakes | **Celebratory:** "最近一次作答里没有错题 🎉 继续保持。" + `[随机练习]`. |
| empty — filtered to nothing | "这些条件下没有错题。" + `[清除筛选]` (distinct from the two above). |
| no-profile | No effect. |
| error | Same swallowed-parse notice as P-07. |
| stale | Records missing `frequency`/`category` (pre-2.1.0) resolve from the live corpus; if the exam has left the corpus, the row renders with `题库中已无此篇` and only the review action. |

### Acceptance criteria

- [ ] An exam whose latest attempt is 100% correct is absent, even with earlier failures.
- [ ] An exam whose latest attempt has errors is present, even if an earlier attempt was perfect.
- [ ] Redoing a passage successfully removes it after the next load.
- [ ] Filter counts sum to the header count.
- [ ] Correct answers are masked here too (same reveal discipline as P-09).
- [ ] Nothing is written to localStorage by this page except session filters.

---

## P-11 Suite runner + result — `/ielts-lab/suite`

**Route group:** `(ielts)/(shell)` · **Family:** App · **Density:** E (compose) → A (result)
**Purpose:** a full three-passage mock, previewed before commitment, with a band estimate
that feeds the profile.

### Compose (before start) — C-18

```
┌─────────────────────────────────────────────────────────┐
│ 套题练习                                                 │
│ 规则：随机组成 P1 → P2 → P3 三篇；优先没做过的篇目；     │
│ 完成后按雅思阅读评分表估算分数。                          │
│ 出题范围 (仅高频)(高频+次高频)(全部题目)                  │
│                                                          │
│ 预览                                     [重新抽取]      │
│  P1  A Brief History of Tea      高频  13 题  [换一篇]   │
│  P2  The Lost City               高频  13 题  [换一篇]   │
│  P3  What makes a musical expert 高频  14 题  [换一篇]   │
│                                                          │
│ [开始套题]        (locks the composition snapshot)       │
└─────────────────────────────────────────────────────────┘
```

Preview-before-commit is new; `composeSuite`/`pickRandomExam`/reroll already exist and
are reused. `[开始套题]` freezes the composition into the existing `SuiteSession`.

### Result (after all three)

```
┌─────────────────────────────────────────────────────────┐
│ 套题成绩                       高频+次高频 · 3/3 篇       │
│ 总分 27/40 · 正确率 68% · 总用时 58:12                   │
│                                                          │
│ 估算分数  6.5                                            │
│ 依据：雅思学术类阅读评分表 academic-reading-2026-07       │
│ 27/40 → 6.5 · 估算仅供参考，不等同于真实考试成绩          │
│  ┌──────────────────────────────────────────────┐       │
│  │ 分数区间表 ▸  (collapsed raw→band table)      │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│ 分篇明细                                                 │
│  P1  A Brief History of Tea   9/13  69%  [逐题回顾]      │
│  P2  The Lost City            10/13 77%  [逐题回顾]      │
│  P3  What makes a musical…     8/14  57%  [逐题回顾]      │
│                                                          │
│ ★ [用这个估算更新我的档案]   ← the fusion step            │
│   更新后，3 个项目的语言差距会重新计算                     │
│ [开始新套题]                                              │
└─────────────────────────────────────────────────────────┘
```

`[用这个估算更新我的档案]` writes
`profile.english.labEstimate = {band, recordCount, computedAt, algorithmVersion}` and
`profile.english.currentSource = "lab_estimate"`. It is **explicit** — a suite result
never silently rewrites the learner's stated score.

### Data sources

`composeSuite`, `pickRandomExam`, `startSuite`, `loadSessionOfKind`, `saveSession`
(existing) · `loadRecords` (existing) · **new** `lib/ielts/band.ts::estimateBand(correct, total)` ·
`lib/profile/storage.ts::patchProfile`.

Suite total scaling: if `total !== 40` the raw score is scaled proportionally and the
result is labelled `按 {total} 题折算` — never silently mapped as if it were a full paper.

### States

| State | Rendering |
|---|---|
| loading | Existing `加载套题状态…`; keep. |
| empty | No active suite → the compose card (existing behaviour). |
| shortage | `当前范围内没有足够的题目` (existing) — extended to name the missing category. |
| no-profile | The update-profile CTA reads `[建立档案并保存这个估算]` and routes to `/profile?return=/ielts-lab/suite`. |
| error | A deleted mid-suite record already degrades correctly (existing `记录已删除` row); keep. |
| stale | A suite composed before a corpus change: entries whose exam id no longer resolves show `题库中已无此篇` with a reroll. |

### Acceptance criteria

- [ ] The composition is visible and rerollable before `[开始套题]`, and immutable after.
- [ ] The band estimate always shows its table version and the 估算 disclaimer.
- [ ] `[用这个估算更新我的档案]` is the only path from a suite result to the profile.
- [ ] Per-passage rows link to the new review route.
- [ ] Abandoning a suite keeps every completed passage in history (existing behaviour).
