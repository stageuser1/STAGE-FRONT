# 05 — Frontend plan (Phase 1)

Six work packages in the blueprint's fixed build order (§8.5). Each is independently
shippable and independently verifiable. Sizes are relative: **S** ≈ 1 focused day,
**M** ≈ 2–3 days, **L** ≈ 4–6 days, for one developer already familiar with the repo.

**Constraints that bound every task below** (from `00_DECISIONS.md`):
no new npm dependency · Tailwind stays v3 · no duplicate route-group segment ·
no module named `export.ts` · attempts immutable and all derived views pure ·
never gate discovery · readiness/fit only, never admission probability ·
no competitor content of any kind.

Verification commands available in this repo:

```bash
npm run typecheck
```

```bash
npm run build
```

There is no frontend test runner (`npm test` runs the Python validator and the Node
importer tests only). Adding one is out of scope; **WP1 introduces
`node --test`-compatible unit tests for the new pure `lib/` modules only**, wired into
the existing `test:importer` pattern — no new dependency, since `node --test` is built in.

---

## Dependency graph

```
WP1 ──► WP2 ──► WP5 ──► WP6
              ╲       ╱
WP3 ───────────╲     ╱
                 WP4
```

| Package | Depends on | Reason |
|---|---|---|
| WP1 | — | pure derivation over existing records |
| WP2 | WP1 (`status.ts`, `wrongbook.ts`) | chips and tiles consume the same derivations |
| WP3 | — | independent; Explore surface only |
| WP4 | — (WP2 for the band prefill) | profile is standalone; the suite hand-off lands with WP2 |
| WP5 | WP4 (profile), WP2 (band estimate) | the fit panel compares profile to requirement |
| WP6 | WP4, WP5 | dashboard reads profile + readiness + saves |

WP3 can run in parallel with WP1/WP2 by a second developer — they share no files.

---

## WP1 — IELTS wrongbook + exact-attempt review  ·  **L**

The first visible win. Pure derivation over `PracticeRecord`s that already exist in
learners' browsers; nothing new is written.

### Files

**New — `lib/`**

| File | Contents | Size |
|---|---|---|
| `lib/ielts/wrongbook.ts` | `WrongbookEntry`, `WrongQuestion`, `buildWrongbook(records, filters?)`, `wrongbookCount(records)` | S |
| `lib/ielts/status.ts` | `ExamStatus` union, `examStatus(progress, draft?)`, `statusLabel()` | S |
| `lib/ielts/corpus.ts` | `"use client"`; `loadExplanation(examId)`, `loadExamData(examId)` — script-tag injection into the existing registries, memoised, with an in-flight promise map | M |
| `lib/ielts/review.ts` | `buildResultRows(record, examData?)` — joins `answerComparison` + `questionDisplayMap` + question types into `ResultRow[]`; `attemptsForExam(records, examId)` | S |

**New — routes**

| File | Contents | Size |
|---|---|---|
| `app/(ielts)/ielts-lab/(shell)/review/[recordId]/page.tsx` | server shell: `metadata`, awaits `params`, renders `<AttemptReview recordId>`. **No `generateStaticParams`** (ids are local). | S |
| `app/(ielts)/ielts-lab/(shell)/mistakes/page.tsx` | server shell rendering `<Wrongbook exams={getAllExams()} />` | S |

**New — components**

| File | Size |
|---|---|
| `components/ielts/review/AttemptReview.tsx` (`"use client"` container: reads records, owns reveal state) | M |
| `components/ielts/review/ResultTable.tsx` + `RevealControl.tsx` (C-14) | M |
| `components/ielts/review/EvidenceJump.tsx` (C-15) | S |
| `components/ielts/review/AttemptPager.tsx` (C-16) | S |
| `components/ielts/review/QuestionNavigator.tsx` (C-17, review mode) | M |
| `components/ielts/Wrongbook.tsx` (`"use client"`: filters, session persistence, rows) | M |

**Edited**

| File | Change | Size |
|---|---|---|
| `components/ielts/LabNav.tsx` | add `错题本` section with a count badge | S |
| `components/ielts/ExamRunner.tsx` | post-submit `[查看逐题回顾]` link; replace `window.confirm` with an inline confirm row; visible handshake-failure state | S |
| `components/ielts/PracticeHistory.tsx` | `在题目中回顾` gains a sibling `逐题回顾` link to the new route | S |
| `components/ui/Icon.tsx` | add `flag`, `list-checks` | S |

**Tests (new, `node --test`)**

`tests/ielts_wrongbook.test.mjs` · `tests/ielts_status.test.mjs` · `tests/ielts_review.test.mjs`
— fixtures are hand-written `PracticeRecord` literals. Add
`"test:lib": "node --test tests/ielts_*.test.mjs"` to `package.json` scripts and include
it in `test`.

### Verification

- [ ] `npm run typecheck` and `npm run build` clean.
- [ ] `npm run test:lib` covers: latest-attempt-only rule; perfect-latest-after-failure
      exclusion; failed-latest-after-perfect inclusion; empty `answerComparison`;
      pre-2.1.0 record without `frequency`/`category`; suite record grouping.
- [ ] Manual, in the browser pane at 375 / 768 / 1280:
      practise a passage → review → every answer masked → reveal one → reveal all →
      expand 原文定位 → wrongbook lists it → redo successfully → it leaves the wrongbook.
- [ ] Network tab: no corpus script is fetched until a row is expanded.
- [ ] Keyboard-only pass through the navigator and the reveal controls.
- [ ] Verify the route did **not** create a second `/ielts-lab` group (check that the lab
      chrome and the runner render exactly once — the known double-layout failure mode).

---

## WP2 — Three-state chips, category tiles, suite band estimate  ·  **M**

### Files

**New**

| File | Contents | Size |
|---|---|---|
| `components/ui/StatusChip.tsx` (C-06) | three-state + requirement-state chip | S |
| `lib/ui/surface.ts` | the two class maps (`01_DESIGN_SYSTEM.md` §1) | S |
| ~~`lib/ielts/band.ts`~~ | ~~table version, conversion table, raw→band helper, learner-level helper~~ **[2026-07-28] 作废 — ruling C1**: file deleted in stage T1; the requirement parser and the requirement-vs-learner gap type moved to `lib/fit/gap.ts` | S |
| `lib/ielts/draft.ts` *(OQ-3)* | `saveDraft/loadDrafts/clearDraft` over `stage.ielts.drafts` | S |
| `components/fit/BandGapMeter.tsx` (C-04) | used here by the suite result and the lab goal banner; reused by WP5 | M |

**Edited**

| File | Change | Size |
|---|---|---|
| `components/ielts/ExamCatalog.tsx` | C-06 chip per card (replaces the bare dot); chip counts on filters; new `有错题` progress filter | M |
| `components/ielts/LabOverview.tsx` | C-07: accuracy with `未开始` semantics + trend; ~~goal banner~~ → **[2026-07-28] ruling C1**: the estimate-driven goal banner is replaced by the learner's own 目标分数设定卡 (one input per subject, 4.0–9.0, step 0.5); wrongbook button | M |
| `components/ielts/SuitePractice.tsx` | C-18 compose → preview → start split; ~~band estimate block; the profile-update CTA~~ → **[2026-07-28] ruling C1**: both removed; the result is 总分 / 正确率 / 总用时 / 分篇明细 | M |
| `components/ielts/ExamRunner.tsx` | `SIMULATION_DRAFT_SYNC` listener → `lib/ielts/draft.ts`; `上次作答保存于` in the bar | S |
| `lib/ielts/catalog.ts` | `countBy(exams, dimension, activeFilters)` for chip counts | S |

~~**Tests:** `tests/ielts_band.test.mjs` — exact table boundaries, the scaling branch and
`total = 0`.~~ **[2026-07-28] 作废 — ruling C1** (`docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`):
the test file was deleted with the module it covered. The comparison rules that survive it
are covered by `tests/fit_requirements.test.mjs` and `tests/profile_migrate.test.mjs`.

### Verification

- [ ] A category with zero attempts renders `未开始`, never `0%`.
- [ ] Every chip count equals the number of rows that chip yields.
- [ ] A suite of 40 questions with 27 correct reports 6.5 with the table version visible.
- [ ] A suite of 39 questions reports `按 39 题折算` and never silently maps as if 40.
- [ ] Starting an attempt and leaving mid-way flips that exam's chip to `进行中`; submitting
      clears the draft and flips it to `已完成` / `有错题`.
- [ ] `npm run typecheck && npm run build`.

---

## WP3 — Explore shell upgrade + explainable search  ·  **L**

Independent of WP1/WP2. Explore family only.

### Files

**New**

| File | Contents | Size |
|---|---|---|
| `lib/search/normalize.ts` | NFKC + lowercase + trim + CJK bigram generation | S |
| `lib/search/index.ts` | `SEARCH_INDEX_VERSION`, `buildSearchIndex(programs)`, `rankSearch(index, query)` returning `{program, score, reasons}` | M |
| `lib/explore/facets.ts` | `buildFacets(programs, selection)` with cross-dimension counts | M |
| `components/explore/FilterChipMatrix.tsx` (C-05) | `"use client"`, controlled | M |
| `components/explore/MatchReasonTag.tsx` (C-08) | | S |
| `components/explore/SortMenu.tsx` · `ViewToggle.tsx` | native `<select>` + button group | S |
| `components/ui/ConfidenceBadge.tsx` (C-19) | freshness-only until **OQ-1** | S |

**Edited**

| File | Change | Size |
|---|---|---|
| `app/(explore)/schools/page.tsx` | becomes the catalog: full list by default, facet matrix, sort, count line with `aria-live`, profile nudge row | L |
| `app/(explore)/search/page.tsx` | ranked results with reason tags; zero-result guidance naming the offending facet; honest placeholder | M |
| `components/HomeSchoolCard.tsx`, `components/ProgramCard.tsx` | C-19 freshness line; optional reason-tag row | S |
| `lib/search-options.ts` | return counts alongside options | S |
| `lib/data.ts` | **mapping only** — add `last_checked_at` to `PublicProgramDto` (**OQ-7**). No Directus query change. | S |
| `data/types.ts` | add the field to the DTO interface | S |

**Tests:** `tests/search_rank.test.mjs` — tier ordering; exact beats prefix beats
contains; abbreviation (`MM`), city (`New York`), Chinese major (`作曲`) all match; CJK
bigram floor; dedupe; 50-row cap.

### Verification

- [ ] `/schools` shows the full published catalog with zero interaction.
- [ ] Every chip carries a count; clicking yields exactly that count.
- [ ] A URL with filters, copied to a new tab, reproduces the view.
- [ ] Searching by name / abbreviation / city / Chinese major each returns reason-tagged
      results; the placeholder promises nothing that fails.
- [ ] Zero-result names the dimension to remove and offers a one-click removal.
- [ ] 375 / 768 / 1280 with no horizontal page scroll; chip rows scroll, page does not.
- [ ] `npm run build` — confirm the search index does not bloat the client bundle beyond
      the current `/search` payload (check `.next` route sizes before/after).

---

## WP4 — Student profile v1  ·  **M**

### Files

**New**

| File | Contents | Size |
|---|---|---|
| `lib/profile/types.ts` | `PROFILE_SCHEMA_VERSION`, `ProfileV1`, step ids, budget bands | S |
| `lib/profile/storage.ts` | `loadProfile/saveProfile/patchProfile/clearProfile`, `visibilitychange` flush, quota-failure signalling | M |
| `lib/profile/migrate.ts` | `migrateProfile(unknown): ProfileV1 \| "unmigratable"` — day-one, even at v1 | S |
| `lib/profile/derive.ts` | `profileCompleteness`, `targetBand`, `nudgeState` | S |
| `lib/profile/saved.ts` | `stage.saved.programs` with the display snapshot | S |
| `app/(product)/profile/page.tsx` | server: passes option lists (`buildFilterOptions`) to the client flow | S |
| `components/profile/ProfileFlow.tsx` | `"use client"` state machine over the five steps | M |
| `components/profile/ProfileStep.tsx` (C-22) | | S |
| `components/profile/steps/*.tsx` | five step bodies (chips/steppers only) | M |

**Edited**

| File | Change | Size |
|---|---|---|
| `components/MobileBottomNav.tsx` | `我的` → `/profile` (currently `/login`, which is reviewer CMS auth and must not be presented to learners) | S |
| ~~`components/ielts/SuitePractice.tsx`~~ | ~~wire the profile-update CTA to `patchProfile`~~ **[2026-07-28] 作废 — ruling C1**: the suite result writes nothing to the profile | S |

**Tests:** `tests/profile_migrate.test.mjs` — unknown version, missing fields, a
hand-rolled object, a newer version (must refuse to write). **[2026-07-28] extended for
ruling C1:** v1 → v2 keeps a self-reported score and the learner's target, blanks a score
whose source was the abolished estimate, drops the stored estimate object, and starts
per-subject targets empty rather than inventing them.

### Verification

- [ ] Every step skippable; a fully skipped profile is valid and persists.
- [ ] Reload mid-flow resumes at the same step with the same values.
- [ ] `?return=` returns exactly there.
- [ ] Private-mode / quota failure shows the banner and does not break the flow.
- [ ] DevTools Network: zero requests from `/profile`.
- [ ] Keyboard-only completion; focus lands on each new step heading.
- [ ] `stage.profile` payload contains `schemaVersion: 1`.

---

## WP5 — Program Fit Panel + Requirement Checklist  ·  **L**

The first strategic fusion: requirements data meets learner profile meets lab estimate.

### Files

**New — `lib/fit/` (all pure, all unit-tested)**

| File | Contents | Size |
|---|---|---|
| `lib/fit/parse.ts` | `parseBandScore("6.5 (no band below 6.0)") → {overall: 6.5, sectionNote: "…"}`; tuition/duration parsing | M |
| `lib/fit/requirements.ts` | `RequirementItem`, `RequirementState`, `buildRequirementChecklist(program, profile)` | L |
| `lib/fit/language.ts` | `ieltsGap(program, profile): BandGap` | S |
| `lib/fit/dimensions.ts` | `READINESS_ALGORITHM_VERSION`, `scoreDimensions(program, profile)` + the plain-language rule sentence | M |
| `lib/fit/school-fit.ts` | `summariseSchoolFit(programs, profile)` | S |

**New — components**

| File | Size |
|---|---|
| `components/fit/FitPanel.tsx` (C-02, `"use client"`) | L |
| `components/fit/RequirementRow.tsx` (C-03) | M |
| `components/fit/RequirementChecklist.tsx` | S |
| `components/fit/SchoolFitStrip.tsx` (P-02) | M |

**Edited**

| File | Change | Size |
|---|---|---|
| `app/(explore)/schools/[schoolId]/programs/[programId]/page.tsx` | mount `<FitPanel>` above `<SourceCitationBlock>` in the existing right column; add `order-first lg:order-none` | S |
| `components/program/ProgramDetailSections.tsx` | insert the checklist `SectionCard` after the decision bar. **Reviewer editing paths must not be touched.** | M |
| `app/(explore)/schools/[schoolId]/page.tsx` | mount `<SchoolFitStrip>` under `SchoolQuickFacts`; freshness badges on section headers | M |
| `components/school/AreaProgramIndex.tsx` | C-06 chip per program row | S |

**Tests:** `tests/fit_requirements.test.mjs` — the five state-derivation rules from
`04_INTERACTION_FLOWS.md` Flow C; prose `minimum_score`; null requirement → `unknown`
(never `gap`); `"No"` prescreening → `not_required`; empty profile → all `unknown` with
the requirement still rendered.

### Verification

- [ ] Requirement 6.5 + estimate 6.0 → `gap`, meter reads `还差 0.5 分`.
- [ ] `ielts_minimum = null` → `待确认` in neutral tone (never amber/red).
- [ ] `prescreening_required = "No"` → `不需要` (never `已满足`).
- [ ] Anonymous: every requirement visible, no personal comparison, one CTA.
- [ ] 375: the Fit Panel renders above the detail sections; nothing hidden.
- [ ] Reviewer login still edits every existing card on the program page (regression check
      against `ReviewerEditableCard` — this is the highest-risk edit in the package).
- [ ] `npm run typecheck && npm run build`.

---

## WP6 — Dashboard v1  ·  **L**

### Files

**New**

| File | Contents | Size |
|---|---|---|
| `lib/dashboard/readiness.ts` | `buildReadiness(savedPrograms, profile, records)` | M |
| `lib/dashboard/actions.ts` | the five generators from Flow G, priority-sorted, dismissal-aware | M |
| `lib/dashboard/deadlines.ts` | `upcomingDeadlines(saved, windowDays)` | S |
| `components/dashboard/DashboardView.tsx` (`"use client"` container) | M |
| `components/dashboard/ActionCard.tsx` (C-13) | S |
| `components/dashboard/ReadinessMeter.tsx` (C-12) | M |
| `components/dashboard/DeadlineTimeline.tsx` (C-11) | L |
| `components/dashboard/IeltsSnapshot.tsx` | reuses `buildTrend` + the already-lazy recharts import | M |
| `components/dashboard/OnboardingCard.tsx` | the three-step empty state | S |

**Edited**

| File | Change | Size |
|---|---|---|
| `app/(product)/dashboard/page.tsx` | replace the `ComingSoon` body with `<DashboardView />`; keep the route and the `(product)` layout | S |
| `content/landing.ts` | delete the now-unused `teasers.dashboard` | S |
| `components/ui/Icon.tsx` | add `target`, `trend` | S |
| `components/MobileBottomNav.tsx` | five destinations (探索 / 搜索 / 实验室 / 学习中心 / 我的); retire the inert `收藏` placeholder | S |

Optional in this package (**OQ-5**): `components/explore/ExploreRail.tsx`, a
`lg:`-only icon rail — now that five real destinations exist.

**Tests:** `tests/dashboard_actions.test.mjs` — each generator's trigger condition and
its silence when the condition is false; dismissal; the all-clear card; a throwing
generator not taking the others down.

### Verification

- [ ] Empty local state → the three-step onboarding, no zeros, no empty modules.
- [ ] Each action card's CTA reaches a surface that can actually close it, and the card
      disappears once the underlying condition stops being true (no "mark done" anywhere).
- [ ] Readiness discloses its rule sentence and `READINESS_ALGORITHM_VERSION` in place.
- [ ] The timeline shows a 今天 marker, reflows to a vertical list below `md`, and its
      legend states that 试音日期暂未收录.
- [ ] ~~Band estimate never renders without its sample size and the word 估算.~~
      **[2026-07-28] 作废 — ruling C1** (`docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md`).
      Replaced by: `/dashboard` renders native practice metrics (accuracy + attempt count,
      accuracy trend with both sample sizes, weakest question type) and the learner's own
      self-reported score and self-set targets, labelled as self-set.
- [ ] DevTools Network: zero Directus requests from `/dashboard`.
- [ ] `npm run typecheck && npm run build`.

---

## Cross-package verification checklist

Run before each package is called done:

1. `npm run typecheck` — clean.
2. `npm run build` — clean, and confirm no route regressed into dynamic rendering that
   was previously static (compare the build's route table).
3. `npm run test` + `npm run test:lib` — green.
4. Browser pane at **375 / 768 / 1280** for every touched page; no horizontal page scroll.
5. Keyboard-only pass on every new interactive surface; visible focus throughout.
6. `prefers-reduced-motion: reduce` — no animation runs.
7. localStorage cleared → every touched page renders its loading state, then its empty
   state, and never a `0` standing in for "not started".
8. Reviewer login → every pre-existing editable card on School/Program still saves.
9. Grep guard before commit — these must return nothing new:
   - a second route-group directory declaring `ielts-lab`
   - any file named `export.ts`
   - `window.confirm` / `window.alert` in a *new* component
   - a new entry in `package.json` dependencies

> **Note on screenshots:** on this machine the browser pane's screenshot action hangs;
> verify with `read_page` / `javascript_tool` instead, and capture evidence as extracted
> text rather than images.

---

## What is deliberately **not** in this plan

| Item | Why | Where it lives |
|---|---|---|
| `/match` + recommendation runs (P-05, C-01, C-09, C-10) | Blueprint Phase 2 (§8.2 item 2.1) | specced in `02`/`03`, schema fixed in `06` §4 |
| Email-code auth (C-20), account sync | Needs a real auth service and a security pass | Phase 2.2 |
| IELTS listening channel | Licensed content + audio model | Phase 2.4 |
| Aggregate accuracy per exam ("平均" column) | Requires telemetry STAGE does not collect; editorial numbers would be fabricated | Phase 2.6 |
| Editorial collections sidebar on Explore | Needs `program_collections` (approval required) | `06` §5.3 |
| STAGE-rendered live question navigator / timer | Owned by the vendored runner; forking it is not a Phase 1 trade | `00` §1.1 |
| Tailwind v4 / shadcn/ui / Motion migration | Not required by any package here | tech audit's own sequence |
| Token-family unification | Repo-wide churn, no user value, high regression risk | `00` §1.2 |
