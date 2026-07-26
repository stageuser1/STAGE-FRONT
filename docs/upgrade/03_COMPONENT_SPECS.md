# 03 — Component specifications

C-01 … C-22. Each entry: file path, verdict (from `00_DECISIONS.md` §3), props interface,
visual spec against real tokens, states, interaction, accessibility.

Shared conventions:
- `surface?: Surface` means the component reads `surfaceTokens[surface]` from
  `lib/ui/surface.ts` (`01_DESIGN_SYSTEM.md` §1, Rule 3). Default `"explore"`.
- Chip geometry is fixed product-wide: `inline-flex h-[22px] items-center gap-1
  rounded-full px-2.5 text-xs font-medium`.
- All components are server components unless marked **`"use client"`**.
- No component reads `localStorage` directly; a page-level client container reads it and
  passes data down. This keeps every component below testable as a pure function of props.

---

## C-01 `RecommendationCard` — *new, Phase 2*

`components/match/RecommendationCard.tsx` · App family · E density · `"use client"`

```ts
export interface ReasonRef {
  code: string;                 // "language_met" | "deadline_far" | "field_match" | …
  text: string;                 // rendered Chinese sentence
  evidenceRef?: {               // SourceRecord.record_id + display fields
    recordId?: string | null;
    title: string;
    url: string;
    accessedAt: string;
    quote?: string | null;
  };
}

export interface FitDimension {
  key: "language" | "timing" | "academic" | "budget" | "field";
  label: string;
  /** 0–1. Null = not computable (missing data), rendered as a hatched bar, never 0. */
  score: number | null;
  detail: string;
}

export interface RecommendationCardProps {
  rank: number;
  programId: string;
  schoolId: string;
  programName: string;          // English, verbatim
  programNameZh?: string | null;
  schoolName: string;
  location: string;             // "United States · New York"
  eligibility: "eligible" | "conditional" | "ineligible";
  dimensions: FitDimension[];   // 3–5
  reasons: ReasonRef[];
  risks?: string[];
  lastCheckedAt: string | null;
  saved?: boolean;
  onSave?: (programId: string) => void;
  onDismiss?: (programId: string) => void;
  loading?: boolean;
  stale?: boolean;              // run older than the current profile version
}
```

**Visual.** `surfaceTokens.app.card` + `p-4`. Rank badge: `h-6 w-6 rounded-full
bg-ink-900 text-white text-xs tabular-nums` (near-black, not accent). Title `text-base
font-semibold`; EN name `text-xs text-stage-fg-muted`. Dimension bars: `h-1.5
rounded-full bg-stage-bg-soft` track, `bg-stage-primary` fill, `transition-[width]`.
Reason tags are C-08. Freshness is C-19, right-aligned in the footer.

**States.** `eligible` emerald chip · `conditional` amber chip + one-line reason ·
`ineligible` collapsed behind `显示不符合条件的项目 (N)` (never silently dropped) ·
`loading` → `SkeletonCards variant="program"` · `stale` → amber bar
`档案已更新，这次推荐基于 {date} 的档案 [重新生成]`.

**Interaction.** Card body → P-03. Reason tag → popover with the `SourceRecord` quote and
link. Save/dismiss are optimistic with an undo row.

**A11y.** `<article aria-labelledby>`; rank exposed as text (`第 1 位`), not colour;
dimension bars are `role="meter"` with `aria-valuenow/min/max` and a text value beside
them; popover is a `<details>` so it works without JS.

---

## C-02 `FitPanel` — *new*

`components/fit/FitPanel.tsx` · Explore family · E density · `"use client"`

```ts
export interface FitPanelProps {
  program: PublicProgramDto;
  profile: ProfileV1 | null;          // null = anonymous / not built
  checklist: RequirementItem[];       // from lib/fit/requirements.ts
  bandGap: BandGap;                   // from lib/fit/language.ts
  dimensions: FitDimension[];
  algorithmVersion: string;           // READINESS_ALGORITHM_VERSION
  saved: boolean;
  onToggleSave: () => void;
  /** Deep link target for “去雅思实验室提分”. */
  labHref: string;
}
```

**Visual.** Wrapper: `surfaceTokens.explore.card` + `p-4 md:p-5`, sits in the program
page's existing `lg:sticky lg:top-20` right column with
`order-first lg:order-none` so it leads on mobile. Verdict header: `text-base
font-semibold` + a C-06 chip. Dimension rows use `FactRow` geometry (48px, `border-b
border-line-subtle`) with a state chip in the value slot. Primary CTA
`h-10 rounded-xl bg-ink-900 text-white`; secondary is a bordered white button.

**States.**

| State | Rendering |
|---|---|
| `no-profile` | Full structure; every dimension value reads `建立档案后可比对`; single CTA `[2 分钟建立档案]` → `/profile?return={pathname}`. |
| `partial` | Computed dimensions render; uncomputable ones read `缺少档案信息 [补全]` linking to the specific step. |
| `complete` | All four dimensions computed; verdict = worst dimension. |
| `unverified-data` | Any input requirement with `state: "unknown"` forces the verdict to `待确认` and shows `部分要求尚未收录，结论可能变化`. |
| `loading` | `SkeletonCards variant="section" count={1}`. |

**Interaction.** Each dimension row is a `<details>` disclosing its computation in one
sentence (`要求 IELTS 6.5 · 你的估算 6.0（来自 12 次阅读练习）· 差 0.5`). CTA order is
fixed: save → close-the-gap → build-profile.

**A11y.** Verdict is announced first in DOM order; `aria-live="polite"` on the verdict
line so a profile edit in another tab (storage event) announces the change.

---

## C-03 `RequirementRow` — *new, built on `ExpandableSection`*

`components/fit/RequirementRow.tsx` · Explore family · E density

```ts
export type RequirementState = "satisfied" | "gap" | "unknown" | "not_required";

export interface RequirementItem {
  key: string;                                   // stable: "language.ielts", "prescreen.video"
  kind: "language" | "prescreen" | "audition" | "documents" | "deadline" | "cost";
  title: string;                                 // "语言成绩"
  titleEn?: string;                              // "English Language"
  state: RequirementState;
  /** One scalar line. Never a sentence. */
  summary: string | null;
  /** Markdown; rendered by ProseBlock when expanded. */
  detail?: string | null;
  evidence?: { title: string; url: string; accessedAt: string; quote?: string | null };
  lastCheckedAt: string | null;
  /** Present only if OQ-1 resolves to “expose”. */
  confidence?: ConfidenceLevel | null;
  /** Rendered as “如何满足” when state === "gap". */
  action?: { label: string; href: string };
}

export interface RequirementRowProps {
  item: RequirementItem;
  surface?: Surface;
  defaultOpen?: boolean;
}
```

**Visual.** Closed row: `min-h-12` grid — `icon | title | state chip | summary | ▸`.
Icon per `kind` (`document` / `mic` / `music` / `list-checks` / `calendar` / `tuition`).
Open: `ProseBlock` for `detail`, then a `bg-ink-50 rounded-lg p-3` evidence block with
blockquote + link + `访问日期`, then the C-19 freshness line. Divider `border-line-subtle`.

**States.** Per `01_DESIGN_SYSTEM.md` §4.2. `unknown` renders neutral with `暂未收录`;
`not_required` renders neutral at `opacity-70`. **`unknown` must never use amber or red.**

**Interaction.** Native `<details>`. When `state === "gap"` and `action` exists, an
inline `[如何满足 →]` button appears in the open body.

**A11y.** `<summary>` carries the full accessible name
(`语言成绩，有差距，IELTS 6.5`); the chip is `aria-hidden` because its text is already in
the name. Icons decorative.

---

## C-04 `BandGapMeter` — *new*

`components/fit/BandGapMeter.tsx` · cross-surface · A density

```ts
export interface BandGap {
  /** Program requirement, parsed from LanguageTest.minimum_score. Null = not recorded. */
  required: number | null;
  /** Learner’s current figure. */
  current: number | null;
  currentSource: "self_reported" | "lab_estimate" | null;
  /** current − required, rounded to 0.5. Null when either side is null. */
  delta: number | null;
  state: "no-estimate" | "below" | "meets" | "exceeds" | "no-requirement";
  /** Provenance of a lab estimate. */
  estimateMeta?: { recordCount: number; computedAt: string; tableVersion: string };
}

export interface BandGapMeterProps {
  gap: BandGap;
  surface?: Surface;
  /** “去雅思实验室提分” target; omitted hides the CTA. */
  ctaHref?: string;
  compact?: boolean;              // dashboard/lab inline variant
}
```

**Visual.** A 4.0–9.0 track, `h-2 rounded-full`, `bg-ink-100` / `bg-stage-bg-soft`.
Required value = a 2px full-height tick in `ink-900`, labelled below. Current value = a
`h-3 w-3 rounded-full` marker: emerald when `meets`/`exceeds`, amber when `below`.
Gap label `text-xs`: `还差 0.5 分` (amber) / `已达标` (emerald) / `尚无估算` (neutral).
Provenance line, always present when `currentSource === "lab_estimate"`:
`基于 12 次阅读练习估算 · academic-reading-2026-07 · 估算仅供参考`.

**States.** `no-estimate` → track with the requirement tick only + CTA
`[做一套题得到估算]`. `no-requirement` → `该项目未收录雅思最低分` in neutral; no track.

**A11y.** `role="meter"` with `aria-valuemin={4} aria-valuemax={9} aria-valuenow`
and `aria-valuetext="当前估算 6.0，要求 6.5，还差 0.5"`. Position is never the only
signal — the numbers are rendered as text.

---

## C-05 `FilterChipMatrix` — *new (alongside existing `FilterChips`)*

`components/explore/FilterChipMatrix.tsx` · Explore family · E density · `"use client"`

```ts
export interface FacetOption {
  value: string;
  label: string;
  /** Count under the *other* dimensions’ current selection. */
  count: number;
  disabled?: boolean;             // count === 0
}

export interface Facet {
  key: string;                    // "country" | "degree" | "major_area" | "deadline" | …
  label: string;                  // "国家/地区"
  options: FacetOption[];
  multi: boolean;                 // OR within the row
}

export interface FilterChipMatrixProps {
  facets: Facet[];
  selection: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  /** Rows beyond this collapse behind “更多 ▸”. */
  visibleRows?: number;           // default 3
  totalCount: number;
}
```

**Visual.** One row per facet: label column `w-16 shrink-0 text-[13px] text-ink-500` at
≥768px, label above the row below that. Chips `h-8 rounded-full border border-line
bg-white px-2.5 text-[13px]`; selected `bg-brand-600 text-white border-transparent`;
count appended in `text-[11px] opacity-70`. Rows scroll horizontally on mobile
(`.no-scrollbar`), wrap at ≥768px. `[清除全部筛选]` appears only when a selection exists.

**States.** `idle` · `active` (≥1 selection; a summary line names them) ·
`zero-result` (every chip that would still yield 0 is `disabled` with `opacity-40` and
`aria-disabled`, never hidden — a disappearing option is a lie about the corpus).

**Interaction.** OR within a row, AND across rows. Counts recompute on every change.
Selection is mirrored to the URL by the parent page (the component itself is controlled
and URL-agnostic).

**A11y.** Each row is a `<fieldset>` with a `<legend>`; chips are
`<button aria-pressed>`. The result count line owns `aria-live="polite"` — the chips
themselves do not announce.

---

## C-06 `StatusChip` — *new sibling of `StatusBadge`*

`components/ui/StatusChip.tsx` · cross-surface

```ts
export type ProgressState =
  | "unstarted" | "pending" | "completed" | "completed_with_errors"
  | "satisfied" | "gap" | "unknown" | "not_required"
  | "saved";

export interface StatusChipProps {
  state: ProgressState;
  /** Overrides the default Chinese label. */
  label?: string;
  /** e.g. wrong-answer count on a “有错题” chip. */
  count?: number;
  surface?: Surface;
  className?: string;
}
```

**Why not extend `StatusBadge`:** `StatusBadge` renders the *data-workflow* vocabulary
(已核验 / 待核验 / 需更新 / 草稿). C-06 renders *learner-and-requirement* vocabulary.
Same geometry, different meaning; merging them would put two word lists behind one name.

**Visual.** Chip geometry + a leading dot whose **shape** encodes state
(`01_DESIGN_SYSTEM.md` §4.1): hollow ring = unstarted/unknown, half = pending,
solid = completed/satisfied, solid+ring = completed_with_errors/gap. Colours per §4.1.

**Interaction.** None — it is derived output. It is never a button.

**A11y.** Text label always present (no icon-only variant). No `role` needed; it is
content, not status-live.

---

## C-07 `CategoryStatTile` — *extend `LabOverview.CategoryCard` in place*

`components/ielts/LabOverview.tsx` · App family · E density · `"use client"`

```ts
interface CategoryCardProps {
  category: ExamCategory;
  total: number;
  practised: number;
  /** NEW — mean of latest-attempt accuracy across practised exams in this category. */
  accuracy: number | null;        // null = 未开始 (never 0)
  /** NEW — direction vs the previous 5 attempts; null when fewer than 6 exist. */
  trend: "up" | "down" | "flat" | null;
  onRandom: () => void;
}
```

**Change from today:** the card currently shows only coverage (`已练习 18/74`). Add the
headline accuracy with **`未开始` semantics** — a category with no attempts must never
render `0%`, which reads as failure rather than absence.

**Visual.** Keep the existing card (`rounded-stage-md border border-stage-border p-4`),
the progress bar and the two action buttons. Insert `text-2xl font-semibold tabular-nums`
accuracy under the title, with `trend` as a `▲ / ▼` glyph + `text-xs` delta.

**Interaction.** Clicking the tile body filters browse to that category
(`/ielts-lab/browse?category=P1`) — the existing `[浏览题库]` link generalised to the
whole tile; the two buttons stay for explicitness.

**A11y.** The existing `role="progressbar"` with `aria-valuenow` is kept. Trend arrows
carry an `sr-only` word (`上升` / `下降`).

---

## C-08 `MatchReasonTag` — *new*

`components/explore/MatchReasonTag.tsx` · cross-surface

```ts
export type ReasonKind =
  | "title_exact" | "title_prefix" | "title_contains"
  | "school" | "field" | "degree" | "location" | "zh_name" | "cjk_ngram"
  | "language_met" | "deadline_far" | "budget_fit" | "field_match";

export interface MatchReasonTagProps {
  kind: ReasonKind;
  /** Rendered label; defaults to the kind’s Chinese label. */
  label?: string;
  /** The field and value that matched — shown in the tooltip. */
  matched?: { field: string; value: string };
  surface?: Surface;
}
```

**Visual.** `inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium
bg-ink-50 text-ink-500` (explore) / `bg-stage-bg-soft text-stage-fg-muted` (app).
Search-tier tags are neutral; fit-reason tags (`language_met`, …) use emerald.
Maximum three tags per card, then `+N`.

**A11y.** `title` + `aria-label` carry the full sentence
(`名称包含「作曲」`). Tooltip content also renders in an `sr-only` span so it is not
hover-only.

---

## C-09 `ConstraintBuilder` — *new, Phase 2*

`components/match/ConstraintBuilder.tsx` · App family · `"use client"`

```ts
export interface Constraint {
  key: "degree" | "country" | "field" | "language" | "budget" | "deadline";
  label: string;
  value: string[] | number | null;
  /** Hard constraints are never relaxed without explicit consent (C-10). */
  hardness: "hard" | "soft";
  /** True when the value was inherited from the profile rather than edited here. */
  fromProfile: boolean;
}

export interface ConstraintBuilderProps {
  constraints: Constraint[];
  onChange: (next: Constraint[]) => void;
  onGenerate: () => void;
  generating: boolean;
  algorithmVersion: string;
  ruleSentence: string;         // rendered verbatim above the CTA
}
```

**States.** `default-from-profile` (a `来自档案` tag on each inherited row) ·
`edited` (a `[恢复档案值]` link appears) · `generating` (CTA disabled, spinner text).

**Interaction.** Hard/soft is a two-state toggle per row with an explicit label
(`必须满足` / `尽量满足`) — never an unlabelled switch. The rule sentence and version are
always visible above the generate button.

---

## C-10 `FallbackConsentDialog` — *new, Phase 2*

`components/match/FallbackConsentDialog.tsx` · App family · `"use client"`

```ts
export interface Relaxation {
  constraintKey: Constraint["key"];
  from: string;                  // "IELTS ≥ 6.5"
  to: string;                    // "IELTS ≥ 6.0"
  gains: number;                 // additional programs unlocked
}

export interface FallbackConsentDialogProps {
  open: boolean;
  shortage: { requested: number; found: number };
  relaxations: Relaxation[];
  onConsent: (accepted: Relaxation[]) => void;
  onCancel: () => void;
}
```

**Visual.** Native `<dialog>` (`showModal`), `max-w-md rounded-stage-lg p-5`, backdrop
`bg-ink-900/40`. Body: shortage sentence, then one checkbox per relaxation stating
exactly what changes and what it yields. Cancel is the default focus.

**Interaction.** Nothing is relaxed until a box is checked and `[按放宽后的条件继续]` is
pressed. Cancelling returns the shortage result unchanged — never an empty screen.

**A11y.** `<dialog>` gives the focus trap and `Esc`; focus returns to the generate button
on close. Title is `aria-labelledby`.

---

## C-11 `DeadlineTimeline` — *new; renders the existing `DeadlineChip`*

`components/dashboard/DeadlineTimeline.tsx` · cross-surface · E density

```ts
export interface DeadlineNode {
  id: string;
  programId: string;
  schoolId: string;
  programLabel: string;
  kind: "application" | "prescreening" | "audition";
  date: string;                 // ISO yyyy-mm-dd
  daysUntil: number;            // from lib/format.daysUntil
}

export interface DeadlineTimelineProps {
  nodes: DeadlineNode[];
  /** Window in days; default 90. Rendered in the header as “未来 90 天”. */
  windowDays?: number;
  surface?: Surface;
  emptyHref?: string;           // “去收藏项目”
}
```

**Visual.** ≥768px: horizontal axis `h-px bg-line` with a `今天` marker
(`w-0.5 h-4 bg-ink-900`) and nodes as dots above their `DeadlineChip` label; overlapping
nodes stack vertically. <768px: a vertical list, nearest first, each row = chip + program
name + `还有 N 天`. **It reflows; it never hides.**

**States.** `empty` (no saved program with a date in window) → `EmptyState` with a CTA ·
`upcoming` · `overdue` nodes render muted (`ink-100/ink-500`) after the 今天 marker's left
side, matching `DeadlineChip`'s existing "expired is history, not an alarm" rule.

**Legend note (required).** Because `Deadline.audition_date` is always `null` today
(`lib/data.ts`), the legend must read `试音日期暂未收录` rather than implying none exist.

**A11y.** Rendered as an ordered list in DOM order regardless of visual axis; each node is
a link to its program page with an accessible name of
`Manhattan School of Music 预筛选截止 2026年11月1日，还有 98 天`.

---

## C-12 `ReadinessMeter` — *new*

`components/dashboard/ReadinessMeter.tsx` · App family · E density

```ts
export interface ReadinessDimension {
  key: "language" | "timing" | "materials" | "budget";
  label: string;
  /** 0–1, or null when inputs are missing. Null renders hatched, never 0. */
  score: number | null;
  note: string;                 // “IELTS 6.5 要求 · 估算 6.0”
}

export interface ReadinessMeterProps {
  programId: string;
  schoolId: string;
  programLabel: string;
  schoolName: string;
  dimensions: ReadinessDimension[];
  overall: "building" | "ready" | "gaps" | "stale";
  algorithmVersion: string;
  /** Age of the cached program snapshot, days. */
  snapshotAgeDays: number | null;
}
```

**Visual.** One row per program: name (truncate) + four segmented bars
(`h-1.5 flex-1 rounded-full`), each split into 4 ticks so a partial score is countable
without reading a number. Overall state as a C-06 chip on the right. `规则说明 ▸` at the
section level (not per row) discloses the weighting sentence + version.

**States.** `building` (profile incomplete → hatched bars + `补全档案`) · `ready` ·
`gaps` (worst dimension named) · `stale` (`snapshotAgeDays > 30` → amber
`信息可能已更新`).

**A11y.** Each dimension is `role="meter"` with `aria-valuetext` carrying `note`; the
overall chip text is part of the row's accessible name.

---

## C-13 `ActionCard` — *new*

`components/dashboard/ActionCard.tsx` · App family · E density

```ts
export interface ActionItem {
  id: string;                    // stable, used for dismissal
  kind: "ielts_gap" | "deadline" | "profile_hole" | "weak_type" | "stale_data";
  icon: IconName;
  /** Imperative. “提高雅思 0.5 分”, not “你的雅思偏低”. */
  title: string;
  /** Why-line MUST cite evidence: a requirement + freshness, or a stat + sample size. */
  why: string;
  cta: { label: string; href: string };
  priority: number;              // lower first
}

export interface ActionCardProps {
  item: ActionItem;
  state?: "new" | "done" | "dismissed";
  onDismiss?: (id: string) => void;
}
```

**Visual.** `surfaceTokens.app.card` + `p-4`, icon in a `h-8 w-8 rounded-stage-sm
bg-stage-primary/10` tile, title `text-sm font-semibold`, why-line `text-xs
text-stage-fg-muted`, CTA as a full-width secondary button at `sm`, inline at `md+`.

**States.** `new` · `done` (emerald check, auto-hides on next load) · `dismissed`
(persisted in `stage.profile.nudges`, with an `已隐藏的建议 (N) ▸` disclosure so nothing
is unrecoverable).

**A11y.** `<article>` with the title as heading; the dismiss control is a labelled button
(`忽略：提高雅思 0.5 分`), not a bare `×`.

---

## C-14 `ResultTable` + `RevealControl` — *new*

`components/ielts/review/ResultTable.tsx`, `RevealControl.tsx` · App family · A density · `"use client"`

```ts
export interface ResultRow {
  questionId: string;            // "q3"
  displayNo: string;             // "3" from questionDisplayMap, else the id
  questionType?: string;
  typeLabel?: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  marked?: boolean;
  /** Tier 2/3 explanation, loaded lazily by lib/ielts/corpus.ts. */
  explanation?: { text: string; paragraphLabel?: string } | null;
}

export interface ResultTableProps {
  rows: ResultRow[];
  /** Controlled reveal set; the page owns it so “reveal all” is one state change. */
  revealed: ReadonlySet<string>;
  onReveal: (questionId: string) => void;
  onRevealAll: () => void;
  onRequestExplanation: (questionId: string) => void;
  explanationStatus: Record<string, "idle" | "loading" | "ready" | "unavailable">;
}

export interface RevealControlProps {
  revealed: boolean;
  onReveal: () => void;
  /** Accessible name context: “第 3 题的正确答案”. */
  questionLabel: string;
}
```

**Visual.** ≥768px: a real `<table>`, header `text-xs text-stage-fg-muted`, rows
`min-h-9 border-b border-stage-border`. <768px: `<ul>` of stacked cards, one label/value
pair per line. Masked answer renders as `●●●` (`tracking-widest text-stage-fg-muted`)
plus an inline `[显示]`. Verdict column: `✓` emerald / `✗` amber, **with** the words
正确/错误 in an `sr-only` span. Unanswered renders `（未作答）`, matching `history-io`.

**States.** `masked` (default, always, on every mount) · `partially revealed` ·
`fully revealed` (the all-button flips to `[隐藏全部答案]`).

**Interaction.** Revealing **inserts** the answer text into the DOM — never a CSS blur or
`color: transparent`, which screen readers and copy-paste defeat. Reveal state is never
persisted. Row click → `EvidenceJump` (C-15).

**A11y.** `RevealControl` is `aria-expanded` + `aria-controls` pointing at the answer
cell; the cell is `aria-live="polite"` so the revealed value is announced once.

---

## C-15 `EvidenceJump` — *new (lab); `EvidenceAccordion` reused unchanged (explore)*

`components/ielts/review/EvidenceJump.tsx` · App family · A density · `"use client"`

```ts
export interface EvidenceJumpProps {
  questionId: string;
  status: "idle" | "loading" | "ready" | "unavailable";
  explanation?: { text: string; paragraphLabel?: string } | null;
  /** Opens the vendored runner at this attempt for the full passage view. */
  runnerHref: string;
  onRequest: () => void;
}
```

**Behaviour.** `idle` → a `原文定位 ▸` disclosure that triggers `onRequest` on first open
(lazy corpus load, `lib/ielts/corpus.ts`). `ready` → the paragraph label
(`Paragraph C`) as a chip plus the Chinese explanation in a `ProseBlock`-style body, and
a `[在原题中查看高亮]` link to `runnerHref`. `unavailable` → `这篇暂无解析` in neutral
tone plus the same runner link.

**Why the passage is not re-rendered here:** the passage HTML, its anchors and the
highlight machinery live in the vendored runtime. STAGE quotes the explanation and hands
off to the runner for the full highlighted passage. Re-implementing it would duplicate
`readingHighlightShared.js` for no additional user capability.

**A11y.** `<details>`; the summary's accessible name includes the question number.

---

## C-16 `AttemptPager` — *new*

`components/ielts/review/AttemptPager.tsx` · App family · A density · `"use client"`

```ts
export interface AttemptSummary {
  recordId: string;
  createdAt: string;
  accuracy: number;              // 0–1
  correct: number;
  total: number;
  mode?: PracticeMode;
}

export interface AttemptPagerProps {
  attempts: AttemptSummary[];     // same examId, newest first
  currentId: string;
  /** Navigates to /ielts-lab/review/{id}; the page is the source of truth. */
  onSelect: (recordId: string) => void;
}
```

**Visual.** `◀ 第 2 次 / 共 3 次 · 2026-07-24 · 62% ▶` in a `min-h-9` bordered row;
the middle is a `<select>` at ≥3 attempts so a learner can jump, not just step.

**States.** `single` → the row renders as static text (`仅一次作答`), no disabled arrows.
`multi` → arrows + select.

**A11y.** `<nav aria-label="作答次数">`; arrows are buttons with
`aria-label="上一次作答"` / `"下一次作答"`; the current attempt has `aria-current="true"`.

---

## C-17 `QuestionNavigator` — *new, **review mode only***

`components/ielts/review/QuestionNavigator.tsx` · App family · A density · `"use client"`

> **Scope.** The live-attempt navigator belongs to the vendored runner
> (`00_DECISIONS.md` §1.1). This component navigates a **stored attempt** on the review
> and wrongbook pages, where STAGE owns the DOM.

```ts
export interface NavigatorCell {
  questionId: string;
  displayNo: string;
  state: "correct" | "wrong" | "unanswered";
  marked?: boolean;
}

export interface QuestionNavigatorProps {
  cells: NavigatorCell[];
  currentId?: string;
  onSelect: (questionId: string) => void;
  /** Optional part grouping when reviewing a suite. */
  groups?: Array<{ label: string; questionIds: string[] }>;
}
```

**Visual.** `min-h-9 min-w-9` cells (36px floor, blueprint), `rounded-stage-sm`,
`text-xs tabular-nums`, wrapped in a flex-wrap grid; horizontal scroll only below 320px.
`correct` emerald-50/700, `wrong` amber-50/700, `unanswered` neutral with a dashed border.
Marked questions carry a corner dot. Current cell gets a 2px `ring-stage-primary`.

**Non-colour encoding (required):** `✓` / `✗` / `–` glyph inside each cell, so state is
readable in greyscale.

**A11y.** A `role="group"` of buttons; Left/Right/Home/End move focus via roving
`tabIndex`; Enter/Space selects and scrolls the matching row into view with
`scrollIntoView({block:"center", behavior: prefersReducedMotion ? "auto" : "smooth"})`.
Each button's accessible name: `第 3 题，错误`.

---

## C-18 `SuiteComposerCard` — *extend `SuitePractice.tsx`*

`components/ielts/SuitePractice.tsx` · App family · E density · `"use client"`

```ts
interface SuiteComposerProps {
  scope: FrequencyScope;
  onScopeChange: (s: FrequencyScope) => void;
  /** NEW — preview before commitment. */
  preview: ExamSummary[] | null;
  onCompose: () => void;           // draw/redraw the whole preview
  onReroll: (index: number) => void;
  onStart: () => void;             // locks the snapshot into SuiteSession
  shortage: { category: ExamCategory; scope: FrequencyScope } | null;
  ruleSentence: string;
}
```

**Change from today:** `composeSuite` currently draws *and immediately starts* the
session. Split into compose → preview → start, so the learner sees the three passages
before committing (C2 pattern) — the reroll machinery already exists and is reused.

**States.** `idle` (scope chips + `[抽取三篇]`) · `composed` (preview rows + per-row
`[换一篇]` + `[重新抽取]` + `[开始套题]`) · `shortage` (names the category and scope that
failed, offers the next-wider scope) · `active` / `finished` (existing `ActiveSuite`).

**Interaction.** `[开始套题]` freezes the composition. After start, reroll is disabled
for entries that already have a `recordId` (existing rule, kept).

---

## C-19 `ConfidenceBadge` — *new*

`components/ui/ConfidenceBadge.tsx` · cross-surface

```ts
export interface ConfidenceBadgeProps {
  /** Public workflow state; always available. */
  status: WorkflowStatus;
  /** ISO date. Null renders 暂未收录. */
  lastCheckedAt: string | null;
  /** Gated on OQ-1. Omitted until the owner rules. */
  confidence?: ConfidenceLevel | null;
  /** Client-derived (OQ-6), not DataQuality.missing_fields (always [] today). */
  missingCount?: number;
  surface?: Surface;
  /** Source shown in the tooltip. */
  source?: { title: string; url: string };
}
```

**Visual.** `inline-flex items-center gap-1.5 text-xs`: a 6px dot (emerald / amber /
hollow `ink-300`), the status word, `·`, then `核验于 2026年3月11日`. Older than 180 days
appends `（可能已更新）` in `amber-700`. `missingCount > 0` appends `· {n} 项待补充`.

**States.** `high` / `medium` / `low` / `missing` per `01_DESIGN_SYSTEM.md` §4.3.

**A11y.** The whole badge is one `<span>` with a complete sentence as its text; the
tooltip content also renders `sr-only` (never hover-only). Not a link — the link lives in
the evidence block beside it.

---

## C-20 `AuthCodeInput` — *new, **Phase 2 only***

`components/auth/AuthCodeInput.tsx` · App family · `"use client"`

```ts
export interface AuthCodeInputProps {
  email: string;                 // masked for display: a***@gmail.com
  length?: number;               // default 6
  onComplete: (code: string) => void;
  onResend: () => void;
  resendCooldownSeconds: number; // 60
  status: "idle" | "verifying" | "error" | "success";
  errorMessage?: string;
}
```

Contract: six cells, auto-advance, backspace steps back, **paste distributes across
cells**, auto-submit on the sixth character, 60s resend countdown, remembered email.

> **Explicitly not Phase 1, and not built on `lib/directus-auth.tsx`.** That module is
> reviewer/CMS authentication. Learner auth needs server-enforced authorization, rate
> limiting and a real session design (`00_DECISIONS.md` §8, blueprint Part 6 §C).

**A11y.** One `<input inputMode="numeric" autoComplete="one-time-code">` per cell inside
a labelled group; the error is `role="alert"`; the countdown is `aria-live="off"`
(polling noise) with the state announced only on change.

---

## C-21 `OperatorBanner` — *new, Phase 2*

`components/ui/OperatorBanner.tsx` · cross-surface

```ts
export interface OperatorBannerProps {
  id: string;
  version: number;               // dismissal is keyed by id+version
  tone: "info" | "warning" | "promo";
  icon?: IconName;
  text: string;
  cta?: { label: string; href: string };
  dismissible?: boolean;
  surface?: Surface;
}
```

Dismissal persists per `id@version` in `stage.ui.banners`, so re-publishing a banner with
a new version shows again while a re-render never does. **No repeating modals** — this is
an inline bar, never an overlay (blueprint §7.2 defect list).

---

## C-22 `ProfileStep` — *new*

`components/profile/ProfileStep.tsx` · App family · E density · `"use client"`

```ts
export interface ProfileStepProps {
  stepId: "discipline" | "target" | "geography" | "academic" | "english";
  index: number;                 // 1-based
  total: number;                 // 5
  title: string;
  hint?: string;
  state: "pristine" | "answered" | "skipped";
  children: ReactNode;           // chips / steppers only
  onBack?: () => void;
  onSkip: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  /** ISO timestamp of the last autosave; rendered as “已自动保存 · 12:04”. */
  savedAt: string | null;
}
```

**Visual.** `max-w-xl mx-auto`, `surfaceTokens.app.card` + `p-5 md:p-6`. Progress dots
above the title: `h-1.5 w-1.5 rounded-full`, filled = answered, ring = current, hollow =
pending, plus the text `第 2 / 5 步` (never dots alone). Footer:
`[上一步]` left, `[跳过]` + `[下一步]` right; on mobile the two right buttons are full
width, stacked, primary on top.

**States.** `pristine` / `answered` / `skipped` (the dot renders as a small dash and the
step is revisitable).

**Interaction.** Autosave fires on every child change and on `visibilitychange`;
`savedAt` updates in place. `[跳过]` is always enabled — no step can trap the learner.

**A11y.** The step title is `<h2 tabIndex={-1}>` and receives focus on step change;
progress is `role="progressbar" aria-valuenow={index} aria-valuemax={total}`; the step
region is `aria-live="polite"` so the new question is announced once.

---

## Appendix — components explicitly reused unchanged

| Component | Used by | Change |
|---|---|---|
| `SectionCard` | P-02, P-03, P-06 | none |
| `FactRow` / `KeyFact` | P-03 decision bar, C-02 rows | none |
| `ProseBlock` | C-03 detail, C-15 body | none |
| `ExpandableSection` | C-03 base, P-03 sections | none |
| `EvidenceAccordion` | P-02/P-03 source blocks | none — the lab's C-15 is a different mechanism, not a replacement |
| `DeadlineChip` | C-11 node labels, C-02 | none |
| `SkeletonCards` | every loading state | none |
| `EmptyState` / `EmptyNote` | every empty state | none |
| `StatusBadge` (`WorkflowStatusBadge`, `VerificationBadge`, `PlaceholderBadge`) | data-workflow status everywhere | none — C-06 is additive |
| `ielts/ui.tsx` `Card` `StatTile` `Tabs` `Badge` | P-07, P-09, P-10, P-11 | none |
| `FilterChips` | mobile chip row on `/schools` | none — C-05 is the desktop matrix |
| `SourceCitationBlock` | P-03 right column | none |
| `MissingDataNote` | P-03 unknown fields | none |
