# 00 — Decisions

**Date:** 2026-07-26
**Source of truth:** `STAGE_PRODUCT_UPGRADE_BLUEPRINT.md` §8 (executed, not re-litigated).
**Scope of this pass:** specification only. No application code, data, or config changed.

This document records what maps to what, what gets built new, what does not get built,
and every question that needs the human owner rather than a designer.

> **[2026-07-28] Supersession — ruling C1, see `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`.**
> The band-estimate system is abolished. Every specification and acceptance criterion in
> `docs/upgrade/00–06` that assumes a raw→band conversion, a stored practice estimate, an
> estimate provenance line, or the suite-result CTA that wrote one is **void**, whether or
> not it carries an individual note below. What replaced it: a programme requirement is
> compared only against figures the learner entered themselves (a self-reported score and
> self-set targets); with none entered the state is 待确认, rendered neutral — never 0,
> never a warning colour. Delivered in stage T1; the plan document is authoritative where
> the two disagree. History here is annotated, not rewritten.

---

## 1. Three facts that constrain everything below

These were verified in the repository and are not in the blueprint. Every later
document depends on them.

### 1.1 The IELTS player is a vendored iframe, not STAGE React

`components/ielts/ExamRunner.tsx` hosts `public/ielts/reading-exams/reading-practice-unified.html`
in a same-origin `<iframe>` and bridges a `postMessage` protocol (`lib/ielts/messages.ts`).
The runner (`public/ielts/runtime/unifiedReadingPage.js`, 124KB) **owns**:

- the passage + question rendering, highlights, notes, drag-and-drop
- the timer (141 `Timer` references)
- the question navigator / palette (`question-nav`, `QuestionNav`)
- draft autosave inside the attempt
- scoring against its own answer key

STAGE owns only the chrome around the frame plus persistence, review and routing.

**Consequence:** blueprint items C-17 (`QuestionNavigator`) and most of P-08 (sticky bars,
bottom navigator, in-attempt autosave indicator) **cannot be built as STAGE components
for the live player** without forking the vendored runtime. They are re-scoped:
C-17 is built as a *review-mode* navigator over a stored attempt (which STAGE does own),
and P-08 is reduced to host-chrome changes. See §5 and `02_PAGE_SPECS.md` P-08.

### 1.2 The repo already runs two token families, split by route group

| Family | Tokens | Font | Route groups |
|---|---|---|---|
| **Explore family** | `brand.*` `ink.*` `line.*` `page` | Inter / PingFang system stack | `(explore)` |
| **App family** | `stage-*` CSS variables | `font-stage-sans` (Noto Sans SC) | `(marketing)` `(ielts)` `(product)` |

`components/ielts/ui.tsx` documents this explicitly and refuses a third family.
`app/(product)/layout.tsx` already renders the marketing chrome, so **Dashboard, Profile
and Match are App-family surfaces**, while Program/School/Search stay Explore-family.

**Decision — do not unify in Phase 1.** Unification is a repo-wide churn with no user
value and high regression risk against a recently refined landing page. Instead:

1. A new component inherits the family of the route group it lives in.
2. The ~6 components that must render in *both* families take a
   `surface?: "explore" | "app"` prop that switches a small class map exported from a
   new `lib/ui/surface.ts`. Nothing else varies.
3. **Status colours are already shared** — both families use Tailwind's default
   `emerald-50/700`, `amber-50/700`, `red-50/600`. Status semantics therefore need no
   surface switch; only neutral surface/border/muted-text do.

Full rules in `01_DESIGN_SYSTEM.md` §2.

### 1.3 Requirement confidence is deliberately not public

`data/types.ts` comments state that `PublicDataQualityDto` carries `status` only, and
that `ConfidenceLevel`, `missing_fields` and review notes are reviewer-only by design.
`DataQuality.missing_fields` is also **always `[]`** — `lib/data.ts` never populates it.

Blueprint ground rule 11 ("confidence is a UI citizen") therefore collides with an
existing deliberate boundary. Resolved as **OQ-1** in §7; until the owner rules, every
spec renders freshness (`last_checked_at`) + workflow status, and derives "missing"
client-side from null fields rather than reading `missing_fields`.

---

## 2. Reuse mapping — pages (P-01 … P-11)

Verdict key: **reuse** (no change) · **extend** (same file, additive) · **new**.

| # | Blueprint page | Existing file(s) | Verdict | Target path |
|---|---|---|---|---|
| P-01 | Explore | `app/(explore)/schools/page.tsx`, `app/(explore)/search/page.tsx`, `components/HomeSchoolCard.tsx`, `components/FilterChips.tsx` | **extend** | same paths + new `components/explore/*` |
| P-02 | School detail | `app/(explore)/schools/[schoolId]/page.tsx`, `components/school/**` | **extend** | same path; new `components/fit/SchoolFitStrip.tsx` |
| P-03 | Program detail | `app/(explore)/schools/[schoolId]/programs/[programId]/page.tsx`, `components/program/ProgramDetailSections.tsx` | **extend** | same paths; new `components/fit/*` in the existing right column |
| P-04 | Profile builder | — | **new** | `app/(product)/profile/page.tsx` + `components/profile/*` |
| P-05 | Match | — | **new** (Phase 2) | `app/(product)/match/page.tsx` + `components/match/*` |
| P-06 | Dashboard | `app/(product)/dashboard/page.tsx` (ComingSoon teaser) | **extend** (replace body, keep route + layout) | same path + `components/dashboard/*` |
| P-07 | Lab overview / browse | `components/ielts/LabOverview.tsx`, `components/ielts/ExamCatalog.tsx` | **extend** | same paths |
| P-08 | Practice player | `components/ielts/ExamRunner.tsx` | **extend, reduced scope** (see §1.1) | same path |
| P-09 | Attempt review | `reviewHref()` in `lib/ielts/session.ts` (iframe replay only) | **new page, keep existing replay** | `app/(ielts)/ielts-lab/(shell)/review/[recordId]/page.tsx` |
| P-10 | Wrongbook | — | **new** | `app/(ielts)/ielts-lab/(shell)/mistakes/page.tsx` |
| P-11 | Suite runner + result | `components/ielts/SuitePractice.tsx` | **extend** | same path |

**P-09 note.** The existing `reviewHref()` (`/ielts-lab/practice/[examId]?review=<id>`)
replays an attempt *inside the runner*. It is kept and relabelled "在原题中回顾"; the new
`/ielts-lab/review/[recordId]` is the STAGE-native, evidence-linked review. Two surfaces,
two jobs — the runner shows the paper, STAGE shows the analysis.

---

## 3. Reuse mapping — components (C-01 … C-22)

| # | Blueprint component | Nearest existing | Verdict | File path | Reason |
|---|---|---|---|---|---|
| C-01 | `RecommendationCard` | `ProgramCard.tsx` | **new** (composes ProgramCard) | `components/match/RecommendationCard.tsx` | Rank/reasons/dimensions are a different information contract; ProgramCard stays the plain catalog card. Phase 2. |
| C-02 | `FitPanel` | — | **new** | `components/fit/FitPanel.tsx` | No equivalent. Mounts in the existing `lg:sticky` right column of the program page. |
| C-03 | `RequirementRow` | `FactRow`, `ExpandableSection` | **new**, built *on* `ExpandableSection` | `components/fit/RequirementRow.tsx` | FactRow is scalar-only by contract; a requirement is scalar + state + evidence + prose. |
| C-04 | `BandGapMeter` | — | **new** | `components/fit/BandGapMeter.tsx` | Cross-surface (`surface` prop): program page + dashboard + lab. |
| C-05 | `FilterChipMatrix` | `components/FilterChips.tsx` | **extend + new** | keep `FilterChips` (link chips); add `components/explore/FilterChipMatrix.tsx` | `FilterChips` is a single scrolling row of `<Link>`s with no counts and no rows. The matrix is a labelled multi-row control. Both stay: FilterChips remains the compact mobile row. |
| C-06 | `StatusChip` | `ui/StatusBadge.tsx` | **new sibling** | `components/ui/StatusChip.tsx` | `StatusBadge` renders *data-workflow* vocabulary (已核验/待核验). C-06 renders *learner-progress* vocabulary (未开始/进行中/已完成). Merging them would overload one word list with two meanings. |
| C-07 | `CategoryStatTile` | `LabOverview.CategoryCard`, `ielts/ui.tsx StatTile` | **extend** `CategoryCard` in place | `components/ielts/LabOverview.tsx` | The card already exists with progress bar + actions; it needs accuracy + "未开始" semantics, not a rewrite. |
| C-08 | `MatchReasonTag` | — | **new** | `components/explore/MatchReasonTag.tsx` | Used by search results (WP3) and later by C-01. |
| C-09 | `ConstraintBuilder` | — | **new** (Phase 2) | `components/match/ConstraintBuilder.tsx` | |
| C-10 | `FallbackConsentDialog` | — | **new** (Phase 2) | `components/match/FallbackConsentDialog.tsx` | Native `<dialog>`; no dependency. |
| C-11 | `DeadlineTimeline` | `ui/DeadlineChip.tsx` | **new**, *renders* DeadlineChip | `components/dashboard/DeadlineTimeline.tsx` | Chip = one date; timeline = an axis of many. DeadlineChip is reused verbatim as the node label. |
| C-12 | `ReadinessMeter` | — | **new** | `components/dashboard/ReadinessMeter.tsx` | |
| C-13 | `ActionCard` | — | **new** | `components/dashboard/ActionCard.tsx` | |
| C-14 | `ResultTable` + `RevealControl` | `PracticeHistory.QuestionRow` (read-only list) | **new** | `components/ielts/review/ResultTable.tsx`, `RevealControl.tsx` | The history row shows the answer immediately; reveal discipline is the opposite contract. History row is left unchanged. |
| C-15 | `EvidenceJump` | `ui/EvidenceAccordion.tsx` | **new** (lab), **reuse** (explore) | `components/ielts/review/EvidenceJump.tsx` | EvidenceAccordion is for `SourceRecord[]` on admissions pages and is reused there as-is. The lab's "jump to explanation/passage" is a different mechanism over corpus data. |
| C-16 | `AttemptPager` | — | **new** | `components/ielts/review/AttemptPager.tsx` | |
| C-17 | `QuestionNavigator` | runner-owned (see §1.1) | **new, review-mode only** | `components/ielts/review/QuestionNavigator.tsx` | Live-attempt navigation stays inside the iframe. |
| C-18 | `SuiteComposerCard` | `SuitePractice.tsx` (compose + reroll already exist) | **extend** | `components/ielts/SuitePractice.tsx` | Needs the plain-language rule sentence, a pre-start preview, and the band table. Machinery exists. |
| C-19 | `ConfidenceBadge` | `SourceCitationBlock` confidence pill | **new** | `components/ui/ConfidenceBadge.tsx` | Extracted so freshness can appear inline on rows, not only inside the sources block. Blocked on **OQ-1** for the confidence level itself; ships freshness-only until resolved. |
| C-20 | `AuthCodeInput` | `lib/directus-auth.tsx` (reviewer CMS auth — unrelated) | **new** (Phase 2) | `components/auth/AuthCodeInput.tsx` | Explicitly **not** Phase 1. Reviewer auth is not learner auth and must not be reused as one. |
| C-21 | `OperatorBanner` | — | **new** (Phase 2) | `components/ui/OperatorBanner.tsx` | |
| C-22 | `ProfileStep` | — | **new** | `components/profile/ProfileStep.tsx` | |

### Primitives reused unchanged (no verdict needed, listed so nobody re-invents them)

`SectionCard` · `FactRow` / `KeyFact` · `ProseBlock` · `ExpandableSection` ·
`EvidenceAccordion` · `DeadlineChip` · `SkeletonCards` · `Icon` · `EmptyState` ·
`MissingDataNote` · `SourceCitationBlock` · `ielts/ui.tsx` (`Card`, `StatTile`, `Tabs`,
`Badge`, `EmptyNote`).

### Icon set additions required

`Icon.tsx` has no glyph for: wrongbook, target/goal, chart/trend, sparkle/insight.
Add `flag`, `target`, `trend`, `list-checks` to `IconName` using the same 24×24
stroke-2 grammar. No icon library dependency.

---

## 4. Routing table

| Route | Route group | Rendering | New? | Notes |
|---|---|---|---|---|
| `/schools` | `(explore)` | server + client filter island | extend | P-01 catalog |
| `/schools/[schoolId]` | `(explore)` | server | extend | P-02 |
| `/schools/[schoolId]/programs/[programId]` | `(explore)` | server shell + client sections | extend | P-03 |
| `/search` | `(explore)` | server | extend | P-01 search half; explainable ranking |
| `/ielts-lab` | `(ielts)/(shell)` | server page + client body | extend | P-07 |
| `/ielts-lab/browse` | `(ielts)/(shell)` | server + `Suspense` client | extend | P-07 |
| `/ielts-lab/suite` | `(ielts)/(shell)` | client body | extend | P-11 |
| `/ielts-lab/history` | `(ielts)/(shell)` | client body | reuse | — |
| **`/ielts-lab/mistakes`** | `(ielts)/(shell)` | server page + client body | **new** | P-10 wrongbook |
| **`/ielts-lab/review/[recordId]`** | `(ielts)/(shell)` | server page + client body | **new** | P-09; no `generateStaticParams` (ids are local) |
| `/ielts-lab/practice/[examId]` | `(ielts)` (sibling of `(shell)`) | client | extend | P-08; **must not move into `(shell)`** |
| `/dashboard` | `(product)` | client body | extend | P-06 |
| **`/profile`** | `(product)` | client | **new** | P-04 |
| **`/match`** | `(product)` | client | **new, Phase 2** | P-05 |

**Route-group rules that must not be broken** (repo history):

1. Never add a second top-level group that also declares `/ielts-lab` — Next composes
   both layouts and the lab chrome (and the runner iframe) renders twice.
2. `practice/[examId]` stays outside `(shell)` so a timed attempt never carries the
   section tabs.
3. Never name a module `export.ts` — a client component importing a reserved-word
   basename is dropped from the React Client Manifest and the route fails to prerender.
   (`lib/ielts/history-io.ts` carries this scar and its warning comment.)

---

## 5. Scope decisions the blueprint left open

| Decision | Ruling | Why |
|---|---|---|
| C-17 / P-08 in-attempt UI | **Out of Phase 1.** Host chrome only: exam title, mode, attempt state, exit confirm, and a "上次作答" resume note. | The runner owns the timer, navigator and drafts; replicating them means forking a 124KB vendored runtime. Not a Phase-1 trade. |
| Three-state `pending` | Phase 1 derives `pending` **only** from an unfinished `SuiteSession`/`EndlessSession` entry. | It is the only draft signal STAGE currently owns. The runner emits `SIMULATION_DRAFT_SYNC` (declared in `RunnerMessageType`) — capturing it gives true drafts. See **OQ-3**. |
| P-01 editorial "albums" sidebar | **Specified, not scheduled.** WP3 ships search + filter matrix + counts + sorts + rail; collections need editorial content that does not exist. | Shipping an empty sidebar is worse than not shipping it. Data contract is defined in `06_DATA_REQUIREMENTS.md` §6 so it can land without rework. |
| Aggregate "average accuracy" per exam (C2's 平均 column) | **Not in Phase 1.** Personal column only. | Requires telemetry STAGE does not collect. Editorial substitutes would be fabricated numbers on a product whose whole thesis is provenance. |
| Band estimate wording | ~~Always 估算 / "estimate", always with its input count and the algorithm version. Never "your IELTS score".~~ **[2026-07-28] 作废 — superseded by ruling C1**, see `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`. There is no estimate to word: the whole score-estimation system was deleted in stage T1. The learner's own self-reported score and self-set targets are the only band figures the product holds. | Reading-only corpus; a 4-skill band cannot be claimed. |
| Admission probability | Never shipped. Readiness/fit only, per blueprint. | — |
| `/match` in Phase 1 | No. Specified for Phase 2 (blueprint §8.2 item 2.1). | WP1–WP6 is the Phase 1 build order and does not include it. |
| New dependencies | **None.** Tailwind stays v3; no shadcn/ui, no Motion. `recharts@3.10` is already installed and already lazy-loaded — reuse it for trend/sparkline, add nothing. | Tech audit's migration order (Tailwind v4 → shadcn → Motion) is a separate project, and none of it is required by any Phase 1 work package. |
| Motion | CSS only (`transition`, existing `stage-animate-*` keyframes), all under `prefers-reduced-motion`. | Same as above. |

---

## 6. Naming conventions

**Directories (new).**

```
components/
  explore/     P-01 catalog + search UI            (Explore family)
  fit/         C-02..C-04, requirement checklist    (Explore family, surface-aware)
  profile/     C-22 + profile builder               (App family)
  match/       C-01, C-09, C-10 (Phase 2)           (App family)
  dashboard/   C-11..C-13                           (App family)
  ielts/review/ C-14..C-17                          (App family)
lib/
  profile/     ProfileV1 schema, storage, derive
  fit/         pure requirement/gap/readiness functions
  search/      explainable search index + ranking
  ielts/       (existing) + wrongbook.ts, status.ts, band.ts, corpus.ts
  ui/          surface.ts (class maps only — no components)
```

**Files:** PascalCase for components, kebab-case for `lib` modules.
**Never** `export.ts`, `import.ts`, `class.ts`, `new.ts` (reserved-word basenames).

**localStorage / sessionStorage keys** — all namespaced `stage.<domain>.<name>`, all
carrying a schema version *inside* the payload (never in the key, so a migration reads
the old value instead of orphaning it):

| Key | Storage | Owner | New? |
|---|---|---|---|
| `stage.ielts.practice-records` | local | `lib/ielts/storage.ts` | existing |
| `stage.ielts.session` | session | `lib/ielts/session.ts` | existing |
| `stage.ielts.browse` | session | `ExamCatalog.tsx` | existing |
| `stage.ielts.mistakes` | session | wrongbook filters | new |
| `stage.profile` | local | `lib/profile/storage.ts` | new |
| `stage.saved.programs` | local | `lib/profile/saved.ts` | new (WP5) |
| `stage.match.runs` | local | `lib/match/storage.ts` | new (Phase 2) |

**Versioned constants:** `PROFILE_SCHEMA_VERSION`, `READINESS_ALGORITHM_VERSION`,
~~the band-table version constant,~~ `SEARCH_INDEX_VERSION`, `MATCH_ALGORITHM_VERSION` —
exported from their own module, rendered in the UI wherever a ranked or derived number
appears.

> **[2026-07-28] 作废（部分）— superseded by ruling C1**, see
> `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`. The band-table version constant and
> the module that exported it no longer exist; the conversion table it versioned was
> deleted in stage T1. `PROFILE_SCHEMA_VERSION` is now **2**: the profile's English
> block holds a self-reported score and per-subject self-set targets, and the estimate
> field and its source value are gone. The `lib/ielts/band.ts` entry in the directory
> map above is likewise obsolete — the requirement parser and the requirement-vs-learner
> gap type now live in `lib/fit/gap.ts`.

**Copy:** Chinese-first, English program/school names verbatim, English subtitle in the
existing `text-xs text-ink-400` slot (`申请材料 Application Requirements` pattern).

---

## 7. Open questions for the human owner

Each has a recommended default so implementation is never blocked waiting.

| # | Question | Recommended default | Blocks |
|---|---|---|---|
| **OQ-1** | Should `DataQuality.confidence` become public on program/school pages? `data/types.ts` currently marks it reviewer-only, but blueprint rule 11 wants confidence rendered everywhere. | **Expose it**, coarsened to three labels (高/中/待核验) alongside `last_checked_at`. Admitted gaps are the product's differentiator. Until ruled: ship C-19 with freshness + workflow status only. | C-19, P-03 |
| **OQ-2** | ~~Is the IELTS Academic Reading raw→band table in `lib/ielts/band.ts` acceptable as an *estimate* (labelled, versioned, disclaimed)?~~ **[2026-07-28] 已裁决并作废 — superseded by ruling C1**, see `docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`. The owner's answer was **no**: the table, the conversion helper, the stored estimate and every surface that rendered one were deleted in stage T1. A programme's requirement is now compared only against figures the learner entered themselves; with none entered the state is 待确认, rendered neutral. | ~~C-04, P-11, WP2~~ closed |
| **OQ-3** | Capture the runner's `SIMULATION_DRAFT_SYNC` message to get true draft state (three-state `pending` on every card)? Adds a listener + a `stage.ielts.drafts` key. | **Yes, in WP2.** It is ~40 lines and it is the difference between honest three-state semantics and a partial one. | C-06, P-07 |
| **OQ-4** | Should `/profile` require no navigation away from the originating page (modal flow) or be a real route? | **Real route** `/profile` with a `?return=` param; a modal over the Explore surface would cross token families and trap focus over reviewer chrome. | P-04 |
| **OQ-5** | Explore surface: is a desktop left rail (≥1024px) wanted now, or does `MobileHeader`'s inline nav suffice until Match/Dashboard exist? | **Defer the rail to WP6**, when there are five real destinations. WP3 ships the catalog upgrade inside the existing shell. | P-01 |
| **OQ-6** | Which fields count as "missing" for MissingDataNote, given `DataQuality.missing_fields` is always `[]`? | Derive client-side from a fixed list of decision-critical nulls (deadline, IELTS minimum, tuition, prescreen required, audition format). Populating `missing_fields` server-side is a separate data-pipeline task. | P-03, C-19 |
| **OQ-7** | Does the owner want `last_checked_at` added to `PublicProgramDto`? (Frontend mapping change in `toPublicProgramDto`, no Directus change.) | **Yes** — derive as `max(sources[].accessed_at, offering.last_checked)`. Every requirement surface needs it. | P-02, P-03, C-19 |
| **OQ-8** | Entry-term options for the profile (P-04 step ②). Which cycles should be offered? | 2027 秋 / 2028 秋 / 未定 — matching the `admission_cycle` values seen in `application_requirements`. Confirm against real cycle data. | P-04 |

---

## 8. Backend / Directus proposals

**None are required for Phase 1.** Everything in WP1–WP6 is derived client-side or from
already-fetched Directus fields.

Additive proposals for later, listed here so they are not smuggled in silently — each
**requires approval** before anyone touches the schema (full detail in
`06_DATA_REQUIREMENTS.md` §5):

1. `program_offerings.last_checked` — already exists; only needs to reach the public DTO (no schema change).
2. `application_requirements.ielts_section_minimums` (text) — the frontend type
   `LanguageTest.section_minimums` exists but `lib/data.ts` always maps it to `null`.
3. `program_collections` + `program_collection_items` — editorial albums for P-01.
4. `application_requirements.audition_date` — `Deadline.audition_date` is hard-coded
   `null` today, so DeadlineTimeline can only ever plot two of its three node types.

---

## 9. Definition of done for Phase 1 (unchanged from blueprint, restated as a checklist)

A student with no account can:
land → explore with visible data depth → build a 2-minute profile → see per-program
requirement gaps citing official sources → be told their IELTS gap → practise toward it
in the lab → watch the gap close on the dashboard → know which deadline is next —
and every number on that path shows where it came from and when it was last verified.
