# 06 — Data requirements

Client-side schemas, derived-data functions, and the (small) list of backend proposals.
Everything in Phase 1 is derived or already fetched; **no Directus change is required to
ship WP1–WP6.**

Ground rules carried from the blueprint (§8.5) and enforced throughout:
attempts are immutable · derived views are pure and never stored · every schema is
versioned from day one · every ranked or derived number carries its algorithm version ·
freshness and confidence are rendered, not hidden.

---

## 1. Storage map

| Key | Storage | Schema | Written by | Read by |
|---|---|---|---|---|
| `stage.ielts.practice-records` | local | `PracticeRecord[]` v2.1.0 *(existing)* | `ExamRunner` | review, wrongbook, history, analytics, dashboard, band |
| `stage.ielts.session` | session | `PracticeSession` *(existing)* | suite/endless flows | resume banner, three-state `pending` |
| `stage.ielts.browse` | session | `BrowseState` *(existing)* | `ExamCatalog` | `ExamCatalog` |
| `stage.ielts.mistakes` | session | `WrongbookFilters` **new** | wrongbook | wrongbook |
| `stage.ielts.drafts` | local | `DraftIndex` **new** *(OQ-3)* | `ExamRunner` draft-sync listener | three-state chips |
| `stage.profile` | local | `ProfileV1` **new** | profile flow, suite result | fit, dashboard, explore nudge, lab goal |
| `stage.saved.programs` | local | `SavedProgramV1[]` **new** | Fit Panel save | dashboard, school fit strip |
| `stage.match.runs` | local | `MatchRunV1[]` **new, Phase 2** | match | match history |
| `stage.ui.banners` | local | `Record<string, string>` **new, Phase 2** | `OperatorBanner` | `OperatorBanner` |

**Versioning rule.** The version lives **inside** the payload, never in the key. A
migration must be able to read the old value; a versioned key orphans it instead.
`PracticeRecord.version` already follows this, and every new schema copies it.

**Write discipline.** All writes go through a module in `lib/`; no component calls
`localStorage` directly. Every write is wrapped in try/catch — a quota failure degrades to
in-memory state with a visible notice, never a thrown render.

---

## 2. New client schemas (Phase 1)

### 2.1 `ProfileV1` — `lib/profile/types.ts`

```ts
export const PROFILE_SCHEMA_VERSION = 1;

export type ProfileStepId =
  | "discipline" | "target" | "geography" | "academic" | "english";
export type StepState = "pristine" | "answered" | "skipped";
export type BudgetBand = "lt_20k" | "20_40k" | "40_60k" | "60_80k" | "gt_80k" | "unsure";
export type GpaBand = "lt_3_0" | "3_0_3_4" | "3_5_3_7" | "gt_3_7" | "unsure";

export interface ProfileV1 {
  schemaVersion: 1;
  /** Local, non-identifying: `p-<base36 time>-<base36 random>`. Never a fingerprint. */
  profileId: string;
  createdAt: string;                 // ISO
  updatedAt: string;                 // ISO

  discipline: {
    /** Directus `fields.slug` values — the same vocabulary /search filters on. */
    fieldSlugs: string[];
    /** Free text, the only free-text input in the whole flow. */
    instrument: string | null;
  };

  target: {
    /** Directus degree slugs: bm | mm | dma | gd | ad. */
    degreeSlugs: string[];
    /** "2027-fall" | "2028-fall" | null (未定) — see OQ-8. */
    entryTerm: string | null;
  };

  geography: {
    /** Country names as they appear in `School.country` (the join key today). */
    countries: string[];
    budgetBand: BudgetBand | null;
    /** USD-normalised ceiling implied by the band; null when "unsure". */
    budgetCeilingUsd: number | null;
  };

  academic: {
    currentLevel: DegreeLevel | null;
    graduationYear: number | null;
    gpaBand: GpaBand | null;
  };

  english: {
    hasScore: boolean | null;
    test: "IELTS" | "TOEFL" | "Duolingo" | "none" | null;
    /** The figure compared against requirements. */
    currentOverall: number | null;
    /** Where currentOverall came from — rendered in the UI, never hidden. */
    currentSource: "self_reported" | "lab_estimate" | null;
    targetOverall: number | null;
    /** Written only by the explicit suite-result CTA (Flow F). */
    labEstimate: {
      band: number;
      /** Questions the estimate was computed from — always shown beside the band. */
      questionCount: number;
      recordCount: number;
      computedAt: string;
      tableVersion: string;          // BAND_TABLE_VERSION
    } | null;
  };

  steps: Record<ProfileStepId, StepState>;

  /** Dismissed nudges and action cards, keyed by id → ISO dismissal date. */
  nudges: Record<string, string>;
}
```

**Invariants.**
- `currentOverall` and `currentSource` move together. A lab estimate never overwrites a
  self-reported score without the explicit CTA in Flow F.
- `labEstimate` is retained even when `currentSource === "self_reported"`, so the
  dashboard can show both ("你填写 6.5 · 练习估算 6.0").
- Nothing in this object identifies a person. No name, no email, no birthdate. If a field
  like that is ever proposed, it needs the same review as a backend change.

**Migration:** `lib/profile/migrate.ts` exists from day one.
`schemaVersion > PROFILE_SCHEMA_VERSION` → refuse to write, show a refresh banner.
`< current` → field-by-field upgrade. Unrecognisable → offer a JSON download, then reset.

### 2.2 `SavedProgramV1` — `lib/profile/saved.ts`

```ts
export const SAVED_SCHEMA_VERSION = 1;

export interface SavedProgramV1 {
  schemaVersion: 1;
  programId: string;
  schoolId: string;
  savedAt: string;
  /**
   * Display snapshot, so the dashboard renders with ZERO Directus round-trips.
   * Refreshed every time the program page is visited; its age is shown to the user
   * (`信息可能已更新` past 30 days). It is a cache, never a source of truth.
   */
  snapshot: {
    capturedAt: string;
    programName: string;
    programNameZh: string | null;
    schoolName: string;
    degreeLabel: string | null;
    country: string;
    city: string;
    applicationDeadline: string | null;
    prescreeningDeadline: string | null;
    auditionDate: string | null;        // always null until §5.4 lands
    ieltsMinimum: string | null;        // raw string, parsed at read time
    tuitionAnnual: number | null;
    tuitionCurrency: string | null;
    lastCheckedAt: string | null;
    workflowStatus: WorkflowStatus;
  };
}
```

### 2.3 `DraftIndex` — `lib/ielts/draft.ts` *(OQ-3, WP2)*

```ts
export const DRAFT_SCHEMA_VERSION = 1;

export interface DraftEntry {
  examId: string;
  updatedAt: string;
  /** Count only — STAGE does not mirror the runner's answer state. */
  answered: number;
  total: number;
}

export type DraftIndex = { schemaVersion: 1; drafts: Record<string, DraftEntry> };
```

Cleared for an exam when a `PracticeRecord` for it is written. A draft older than 30 days
is dropped on read — a month-old draft resurfacing as 进行中 would be a bug, not a feature
(the same reasoning that put `PracticeSession` in `sessionStorage`).

### 2.4 `WrongbookFilters` — session only

```ts
export interface WrongbookFilters {
  search: string;
  category: ExamCategory | "all";
  frequency: ExamFrequency | "all";
  questionType: string | "all";
  sort: "recent" | "most_wrong" | "title";
}
```

---

## 3. Derived-data functions to add to `lib/`

Every function below is **pure**: arguments in, value out, no storage access, no React.
This is the existing convention in `lib/ielts/progress.ts` and `analytics.ts`, and it is
what makes the derived views trivially unit-testable.

### 3.1 `lib/ielts/wrongbook.ts`

```ts
export interface WrongQuestion {
  questionId: string;
  displayNo?: string;
  questionType?: string;
  typeLabel?: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
}

export interface WrongbookEntry {
  examId: string; title: string;
  category: ExamCategory | ""; frequency?: ExamFrequency | "";
  latestRecordId: string; latestAttemptAt: string; latestAccuracy: number;
  wrongCount: number; totalQuestions: number; attempts: number;
  questions: WrongQuestion[];
  /** True when the exam no longer resolves in the catalog. */
  orphaned?: boolean;
}

export function buildWrongbook(
  records: readonly PracticeRecord[],
  options?: { exams?: readonly ExamSummary[]; filters?: WrongbookFilters },
): WrongbookEntry[];

export function wrongbookCount(records: readonly PracticeRecord[]): number;
```

**Rule:** group by `examId`; take the record with the greatest `createdAt`; include iff
that record has ≥ 1 `answerComparison` entry with `isCorrect === false`; sort by
`latestAttemptAt` desc. Records arrive newest-first but the comparison is explicit —
an imported history may not be sorted (the same defensive choice `buildProgressIndex`
already makes).

### 3.2 `lib/ielts/status.ts`

```ts
export type ExamStatus =
  | "unstarted" | "pending" | "completed" | "completed_with_errors";

export function examStatus(
  progress: ExamProgress | undefined,
  draft?: DraftEntry,
  latestWrongCount?: number,
): ExamStatus;
```

Precedence: `draft` present → `pending` (a fresh draft coexists with completed history,
per the C1 contract) → else no progress → `unstarted` → else wrong > 0 →
`completed_with_errors` → else `completed`.

### 3.3 `lib/ielts/band.ts`

```ts
export const BAND_TABLE_VERSION = "academic-reading-2026-07";

/** Raw correct (out of 40) → band. Boundaries are inclusive lower bounds. */
export const ACADEMIC_READING_TABLE: ReadonlyArray<[minCorrect: number, band: number]>;

export interface BandEstimate {
  band: number;
  correct: number;
  total: number;
  /** True when `total !== 40` and the score was scaled. */
  scaled: boolean;
  tableVersion: string;
}

export function estimateBand(correct: number, total: number): BandEstimate | null;
export function bandFromRecords(records: readonly PracticeRecord[], limit?: number): BandEstimate | null;
```

`estimateBand` returns `null` for `total <= 0`. Scaling is `round(correct / total * 40)`,
and the UI must render `按 {total} 题折算` whenever `scaled` is true. **Pending OQ-2.**

### 3.4 `lib/ielts/corpus.ts` *(client-only)*

```ts
"use client";
export function loadExplanation(examId: string): Promise<ReadingExplanation | null>;
export function loadExamData(examId: string): Promise<ReadingExamData | null>;
```

Injects `/ielts/runtime/readingExplanationRegistry.js` (once) then
`/ielts/reading-explanations/{examId}.js`, and reads
`window.__READING_EXPLANATION_DATA__.get(examId)`. Same shape for the exam registry.
Memoised per exam with an in-flight promise map; resolves `null` on load failure so the
caller degrades to tier 1. **Never** called during render — only from an event handler.

Shapes consumed (verified against the shipped corpus):

```ts
interface ReadingExplanation {
  schemaVersion: "ReadingExplanationV1";
  examId: string;
  meta: { title: string; category: string; noteType?: string };
  passageNotes: Array<{ label: string; text: string }>;
  /**
   * VERIFIED against the shipped corpus: an ARRAY of section groups, each with
   * its own items — not a single { items } object. `explanationByQuestion`
   * flattens the groups and tolerates both shapes.
   */
  questionExplanations: Array<{
    sectionTitle: string;
    mode: string;
    questionRange: { start: number; end: number };
    items: Array<{ questionId: string; questionNumber: number; text: string }>;
    text: string;
  }>;
}

interface ReadingExamData {
  schemaVersion: "ReadingExamSourceV1";
  examId: string;
  passage: { blocks: Array<{ blockId: string; kind: string; html: string }> };
  questionGroups: Array<{ groupId: string; kind: string; questionIds: string[]; bodyHtml: string }>;
  answerKey: Record<string, string | string[]>;
  questionOrder: string[];
  questionDisplayMap: Record<string, string>;   // "q7" → "7"
}
```

### 3.5 `lib/fit/*`

```ts
// parse.ts — the messy-string boundary. Every requirement string enters here.
export function parseBandScore(raw: string | null):
  { overall: number | null; sectionNote: string | null; original: string | null };
export function parseTuition(raw: string | number | null):
  { amount: number | null; original: string | null };

// requirements.ts
export function buildRequirementChecklist(
  program: PublicProgramDto,
  profile: ProfileV1 | null,
): RequirementItem[];

// language.ts
export function ieltsGap(program: PublicProgramDto, profile: ProfileV1 | null): BandGap;

// dimensions.ts
export const READINESS_ALGORITHM_VERSION = "readiness-v1";
export const READINESS_RULE_SENTENCE =
  "按语言成绩、剩余时间、材料完整度、预算四个维度与该项目的公开要求比对；" +
  "任何一项缺少数据时不计分，并标注为待确认。";
export function scoreDimensions(
  program: PublicProgramDto,
  profile: ProfileV1 | null,
): FitDimension[];

// school-fit.ts
export function summariseSchoolFit(
  programs: PublicProgramDto[],
  profile: ProfileV1 | null,
): { eligible: number; gap: number; unknown: number; minIelts: number | null };
```

**Scoring contract for `scoreDimensions`** — deliberately simple, fully explainable,
and never a single blended number in the UI:

| Dimension | Score | Null when |
|---|---|---|
| `language` | `1` if current ≥ required; else `max(0, 1 − (required − current) / 2)` | requirement or current missing |
| `timing` | `1` if > 180 days to the nearest deadline; `0.6` if > 90; `0.3` if > 30; `0` if past | no deadline recorded |
| `materials` | share of checklist items in `satisfied` or `not_required` | no requirement data |
| `budget` | `1` if tuition ≤ ceiling; else `max(0, 1 − (tuition − ceiling)/ceiling)` | tuition or budget band missing |

`null` renders as a hatched bar and the words 待确认 — **never `0`**. A missing fact and a
failed check must never look the same.

### 3.6 `lib/dashboard/*`

```ts
export function buildReadiness(
  saved: SavedProgramV1[], profile: ProfileV1 | null, records: PracticeRecord[],
): ReadinessMeterProps[];

export function buildActions(
  input: { profile: ProfileV1 | null; saved: SavedProgramV1[]; records: PracticeRecord[] },
): ActionItem[];

export function upcomingDeadlines(
  saved: SavedProgramV1[], windowDays?: number,
): DeadlineNode[];
```

`buildActions` runs each generator inside its own try/catch: one throwing generator
contributes zero items and never takes the feed down.

### 3.7 `lib/search/*` and `lib/explore/facets.ts`

```ts
export const SEARCH_INDEX_VERSION = 1;

export interface SearchDoc {
  programId: string; schoolId: string;
  title: string; titleZh: string | null; school: string;
  field: string | null; fieldZh: string | null;
  degree: string | null; degreeAbbr: string | null; degreeSlug: string | null;
  city: string; country: string; specialization: string | null;
  /** Precomputed CJK bigrams for the tier-9 floor. */
  ngrams: string[];
}

export interface SearchIndex { version: number; builtAt: string; docs: SearchDoc[] }

export interface RankedResult {
  programId: string; score: number;
  reasons: Array<{ kind: ReasonKind; field: string; value: string }>;
}

export function buildSearchIndex(programs: Program[]): SearchIndex;   // server
export function rankSearch(index: SearchIndex, query: string, limit?: number): RankedResult[];

export function buildFacets(
  programs: Program[], selection: Record<string, string[]>,
): Facet[];
```

Counts are computed per dimension **against the other dimensions' current selection**, so
a chip's count always equals the number of rows clicking it produces.

---

## 4. Phase 2 schemas, fixed now

Defined here so Phase 1 storage decisions do not paint Phase 2 into a corner.

```ts
export const MATCH_SCHEMA_VERSION = 1;
export const MATCH_ALGORITHM_VERSION = "match-v1";

export interface MatchRunV1 {
  schemaVersion: 1;
  runId: string;                       // `run-<base36 time>-<rand>`
  createdAt: string;
  /** Snapshot of the inputs — a run must stay readable after the profile changes. */
  profileVersion: number;
  profileId: string;
  profileSnapshot: ProfileV1;
  algorithmVersion: string;
  searchIndexVersion: number;
  constraints: Array<{
    key: string; value: unknown; hardness: "hard" | "soft"; fromProfile: boolean;
  }>;
  /** Empty unless the learner explicitly consented (C-10). */
  relaxations: Array<{ constraintKey: string; from: string; to: string; gains: number }>;
  /** Ids excluded because a previous run in this chain already showed them. */
  excluded: string[];
  items: Array<{
    programId: string; schoolId: string; rank: number;
    eligibility: "eligible" | "conditional" | "ineligible";
    dimensions: Array<{ key: string; score: number | null; weight: number; detail: string }>;
    reasons: Array<{
      code: string; text: string;
      evidenceRef?: { recordId?: string | null; title: string; url: string; accessedAt: string };
    }>;
  }>;
}
```

**Immutability.** A run is append-only. Re-running or reshuffling creates a new `runId`
carrying `excluded`; no code path mutates a stored run.

### What Phase 2 (auth + sync) will need — and why Phase 1 already satisfies it

| Requirement | Phase 1 provision |
|---|---|
| Attribute local data to an account without a rewrite | `PracticeRecord.userKey` already exists (`"local"`); `ProfileV1.profileId` and `MatchRunV1.profileId` mirror it |
| Migrate schemas server-side | every payload carries `schemaVersion`; `migrateProfile` exists from day one |
| Merge two devices without data loss | `mergeRecords` already de-duplicates on id with the *existing* record winning; profile merge will follow the same "local wins on conflict, surface the difference" rule |
| Replay a recommendation after requirements change | `MatchRunV1` stores its inputs, not references |
| Server-enforced authorization | nothing in Phase 1 stores a secret, a token, or a permission; there is nothing to un-embed later |

---

## 5. Backend / Directus proposals — **REQUIRES APPROVAL**

None of these is needed for WP1–WP6. Each is additive and listed so it is never
introduced silently.

### 5.1 Expose `last_checked` on the public program DTO — **frontend only, no schema change** *(OQ-7)*

`program_offerings.last_checked` is already queried (`offeringFields`) and already sits in
`review_records.offering.values`. It just never reaches `PublicProgramDto`. Add:

```ts
// data/types.ts → PublicProgramDto
last_checked_at: string | null;   // max(sources[].accessed_at, offering.last_checked)
```

Mapping change in `toPublicProgramDto` only. **Approval needed** because it moves a field
across a deliberately field-by-field public boundary.

### 5.2 `application_requirements.ielts_section_minimums` (text) — **schema addition**

`LanguageTest.section_minimums` exists in `data/types.ts` but `mapLanguageTests` always
maps it to `null`, because there is no column. Programs commonly require
"6.5 overall, no band below 6.0", and Phase 1 can only surface that if it happens to be
embedded in the `ielts_minimum` string (`parseBandScore` handles that case, and keeps the
original text visible).

Until this lands, `BandGapMeter` compares overall only and states
`另有单项要求 ▸` when the raw string contains one.

### 5.3 `program_collections` + `program_collection_items` — **schema addition**

Editorial albums for P-01's sidebar (blueprint C2-S1 lesson).

```
program_collections:  id, slug, title_zh, title_en, description_zh,
                      cover_note, sort, is_published, updated_at
program_collection_items: id, collection_id, program_offering_id, sort, note_zh
```

The sidebar is **not built** until this exists. An empty sidebar is worse than none.

### 5.4 `audition_requirements.audition_date` (date) — **schema addition**

`Deadline.audition_date` is hard-coded `null` in `lib/data.ts` because no column supplies
it. `DeadlineTimeline` therefore has a node type it can never plot, and its legend must
say so. This is the single highest-value backend addition for the dashboard.

### 5.5 Populate `DataQuality.missing_fields` — **pipeline change** *(OQ-6)*

Currently always `[]`. Until it is populated, "missing" is derived client-side from a
fixed list of decision-critical nulls: application deadline, IELTS minimum, tuition,
prescreening required, audition format. That derivation lives in `lib/fit/requirements.ts`
and should be **deleted** the day the field carries real data — two sources of truth for
"what is missing" is worse than one imperfect one.

---

## 6. Privacy and safety notes

1. **Nothing leaves the browser in Phase 1.** No profile, no records, no derived
   estimate. `/profile` and `/dashboard` make zero network requests — this is an
   acceptance criterion, not an aspiration.
2. **No identifying fields** are collected. Instrument and country are preferences, not
   identity. Adding a name or an email requires the same review as a backend change.
3. **No client-embedded secrets.** Nothing in Phase 1 stores a token or an entitlement;
   there is nothing to un-embed when accounts arrive (a named competitor defect).
4. **Export before destruction.** Any flow that clears local data offers a JSON export
   first — `history-io.ts` already sets this precedent, and the profile migration path
   follows it.
5. **The band estimate is never presented as a test score.** Always 估算, always with its
   question count and table version.
6. **Provenance is never dropped to make a screen tidier.** If a fact renders, its
   `last_checked_at` renders with it.
