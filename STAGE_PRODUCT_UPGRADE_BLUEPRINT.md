# STAGE Competitor-Inspired Product Upgrade Blueprint

**Date:** 2026-07-26
**Author role:** Product strategy / UX architecture / reverse-engineering synthesis
**Downstream consumer:** Claude Opus 5 (UI/UX design + implementation planning)
**Status:** Analysis document. No code was modified. All competitor references are to
mechanisms and interaction contracts — never to their content, branding, or assets.

---

## 0. Executive summary

STAGE is evolving from a **music-school information database** into a **decision-support
platform for music students**. Two reverse-engineered competitors show, in complementary
halves, exactly how to make that transition:

- **Competitor 1 ("Listening Lab", D:\STAGE TARGET1)** proves the value of a
  **closed learning loop**: practice → immutable attempt → derived wrongbook →
  evidence-linked review → redo → mock simulation → band estimate. Its retention comes
  entirely from locally accumulated progress, not accounts or notifications.
- **Competitor 2 ("Comprehensive Platform", D:\STAGE TARGET2)** proves the value of a
  **platform shell**: anonymous-first discovery, aggregate social proof on every card,
  frictionless email-code auth, explainable search, a constraint-driven recommendation
  composer with explicit fallback consent, and a split-pane assessment workspace.

Neither competitor does what STAGE can do: **connect a student profile to versioned,
evidence-backed admissions requirements and close the loop with preparation**. STAGE
already owns the two hardest assets — a structured requirements database with source
provenance, and a working IELTS practice lab. The upgrade is to wire them together:

> **Profile → Match (with reasons) → Gap analysis → Preparation loop → Readiness → Action.**

The single sentence answer to "how should STAGE become a better product":
**adopt Competitor 2's discovery-and-trust shell, adopt Competitor 1's learning-state
machine, and fuse them through a mechanism neither has — the admission-readiness loop,
where every requirement gap becomes a trackable, practicable task.**

---

# PART 1 — Current STAGE FRONT foundation

## 1.1 Stack and structure (from STAGE_FRONT_TECH_AUDIT.md, verified in repo)

- Next.js **15.5** App Router, React **19.2**, TypeScript **5.9** strict, Tailwind **3.4**.
- No third-party UI kit, no animation library. A local primitive layer exists in
  `components/ui` (SectionCard, FactRow, StatusBadge, DeadlineChip, EvidenceAccordion,
  ExpandableSection, ProseBlock, SkeletonCard, Icon).
- Route groups already separate the four product surfaces:

| Route group | Contents | Maturity |
|---|---|---|
| `(marketing)` | Landing page (hero, features, how-it-works, pricing preview, FAQ, CTA), pricing, contact | Polished, recently refined |
| `(explore)` | `/schools`, `/schools/[schoolId]`, `/schools/[schoolId]/programs/[programId]`, `/search`, `/pilot/*` (reviewer QA surfaces), `/login` | Functional; the data-rich core |
| `(ielts)` | `/ielts-lab` shell: overview, browse, suite, history + `/ielts-lab/practice/[examId]` | Recently reached workflow parity with a mature competitor |
| `(product)` | `/dashboard` | Skeleton — the natural home of the future decision-support surface |

## 1.2 Data capabilities (the real moat)

`data/types.ts` + `lib/data.ts` (Directus-backed) already model:

- `School` — identity, location, `detail_sections` (overview/international/tuition/campus/policies)
  each with `body_zh`, `source_urls`, `evidence_quotes`, `last_checked_at`.
- `Program` — degree identity (`DegreeInfo` with slug/category, bachelor→doctorate),
  deadlines (`application_deadline`, `prescreening_deadline`, `audition_date`),
  **structured `LanguageRequirements`** (accepted tests incl. IELTS with minimum score and
  section minimums, waiver policy), **`PrescreenSection` and `AuditionSection`** kept
  strictly separate (repertoire, format, video/file requirements, accompaniment,
  interview/callback), tuition with `CurrencyCode`.
- `SourceRecord` — per-fact provenance (typed official source, accessed date, related field).
- `DataQuality` — confidence level, workflow status, missing fields, review notes.
- A human review workflow (`ReviewStatus`, reviewer components, pilot pages) that keeps
  the data trustworthy.

**This is precisely the "versioned, evidence-backed requirement" substrate that
Competitor 2's adaptation report says a decision platform needs — STAGE already has it.**

## 1.3 IELTS Lab capabilities (verified in `lib/ielts/*`)

- 223 **reading** exams (`exam-index.json`), categories P1–P3, frequency tags
  (high/medium/low), difficulty scores, per-exam question-type taxonomy
  (`question-types.json`, joined at write time).
- Catalog with multi-dimension filters (category, frequency, progress: all/practised/fresh),
  sorts (frequency/difficulty/title), category counts.
- Practice modes: **single**, **endless**, **suite** (composed multi-part mock via
  `composeSuite` / `pickRandomExam` with frequency scopes).
- LocalStorage persistence: `PracticeRecord` with `AnswerComparison` details, `ScoreInfo`,
  `ExamProgress` index, session resume (`session.ts`), history import/export (`history-io.ts`).
- Analytics: score trend, per-question-type stats, weakest-type detection
  (`analytics.ts`), rendered in `PracticeAnalytics` / `PracticeHistory` / `LabOverview`.

**Gap vs Competitor 1:** no derived wrongbook surface, no exact-attempt review page with
answer-reveal discipline, no three-state (unstarted/draft/completed) card semantics, no
band estimate, no listening channel. All are additive on the existing storage model.

## 1.4 What must NOT be rebuilt

- The Directus data contract, extraction pipeline, and reviewer workflow.
- The `components/ui` primitives and warm design tokens (`brand`, `ink`, `line`, `page`).
- The marketing shell and its section components.
- The IELTS storage/analytics layer — extend it, don't replace it.
- Route-group architecture (note memory: duplicate route-group segments double layouts;
  `export.ts` naming breaks prerender — keep those conventions).

---

# PART 2/3 — Competitor deep analysis

## 2. Competitor 1 — Listening Lab (虾滑, D:\STAGE TARGET1)

### 2.1 Product positioning

| Dimension | Finding |
|---|---|
| Target user | Self-directed Chinese IELTS learner on Windows, practicing listening daily |
| Problem | Needs a large categorized listening corpus + Chinese explanations + a way to turn errors into progress |
| Value proposition | One integrated corpus: audio + typed questions + answer key + per-question transcript cues + translation + analysis + attempt history |
| Why chosen | Free, offline, complete; distributed through creator's Xiaohongshu community |
| Why users return | Locally accumulated progress: accuracy tiles, derived wrongbook, autosaved drafts, mock-suite band milestones. No account needed — the *data* is the retention |
| Monetization | External (community/courses); VIP corpus unlocked by 7-day signed codes. App is a lead + retention surface, not a store |

### 2.2 User journey (with purpose per step)

```
Entry        Welcome modal (creator links)     → trust + acquisition channel
First use    Filter chips activate catalog      → forces orientation (a defect: blank until click)
Discovery    Part accuracy tiles + filter matrix→ shows state of my practice at a glance
Core action  Player: audio + answers + autosave → zero-cost interruption; drafts always safe
Feedback     Finish → score → hidden answers    → deliberate review, not answer-peeking
Diagnose     Result row → transcript cue jump   → every error explains itself
Remediate    Wrongbook (derived, zero curation) → clear "what next" without user effort
Milestone    4-part mock suite → band estimate  → progress translated into the metric users care about
Retention    3 attempts kept, redo 1-click      → visible evolution, short remediation loop
Conversion   VIP modal (code paste)             → access gate; history survives expiry
```

### 2.3 Information architecture

- 248px sidebar: Library (home/suite/wrongbook) + Tools (export/import/VIP). Flat, 6 items.
- Home = filter matrix (section/frequency/part/type/status) + search + P1–P4 accuracy tiles
  + gallery/list catalog grouped part → frequency.
- Player = separate maximized window; 58/42 questions/transcript split; sticky audio bar;
  fixed 70px bottom question navigator.
- Priority order: my progress first (tiles), then discovery (filters), then content.

### 2.4 Mechanisms worth extracting (the "why it works")

1. **Immutable attempts + derived views.** Wrongbook and status are *computed* from
   attempt history. Nothing to maintain; never inconsistent.
2. **Three-state semantics** (unstarted / draft-pending / completed, with
   completed-with-errors subtype; a new draft coexists with completed history).
3. **Evidence-linked review**: every result row jumps to its transcript cue with
   highlight — the explanation is addressable, not a blob.
4. **Answer-reveal discipline**: correct answers hidden by default, revealed one-by-one
   or all — converts "checking" into "reviewing".
5. **Explainable next-item selection**: novelty first, else highest latest wrong count,
   random tie-break. Trivial to implement, easy to trust.
6. **Band translation**: raw correct-count mapped to the IELTS band scale — progress in
   the user's own currency.
7. **Humane expiry**: entitlement expiry hides content, never deletes user history.

### 2.5 Defects to avoid (confirmed by report)

Blank catalog until a filter is clicked; search narrower than its placeholder promises;
welcome modal re-opens every launch; dead `#` help link; forced audio resume in suite
mode; transcript disappears (not reflows) under 820px; native alert/confirm; DOM-snapshot
persistence; path-as-domain-model; client-embedded license secret.

## 3. Competitor 2 — Comprehensive Platform (九分学长, D:\STAGE TARGET2)

### 3.1 Product positioning

| Dimension | Finding |
|---|---|
| Target user | IELTS candidate preparing for the computer-delivered test; wants "what is being tested right now" |
| Problem | Structured, repeatable, exam-faithful practice + discovery focused on recent/high-frequency material |
| Value proposition | Desktop CBT simulator + curated albums + 7-day high-frequency rankings ("P4 hit rate 70%+", "95% coverage of live bank") + mixed-practice composer |
| Why chosen | Free anonymous browsing shows value first; hit-rate claims create urgency; login costs one email code |
| Why users return | Done/undone progress across albums, weekly-changing rankings, latest-result shortcuts, autosave recovery, mixed practice reducing decision fatigue |
| Monetization | No in-client payment; feature entitlements (mixed practice, expanded rankings) granted via human-reviewed proof upload — conversion happens off-client |

### 3.2 User journey

```
Entry        Highlights carousel ("P4 hit-rate ≥70%")     → value claim before any commitment
Anonymous    Catalog: albums sidebar + unit list w/ 平均   → aggregate accuracy = social proof + calibration
             (my accuracy column shows "—" when logged out)→ visible hole that login fills (brilliant nudge)
First gate   Click practice → email + 6-digit code         → auth at the exact moment of need; auto-account
Core action  Timer setup → split-pane exam → autosave      → exam fidelity + zero-loss continuity
Feedback     Submit → review (correct/wrong nav, analysis, → attempt becomes study material
             translations, own highlights carried over)
Targeting    High-frequency rows (rank, movement, 7-day    → "what to do next" answered by data
             reports, my vs average accuracy)
Composer     Mixed practice modal: channel/difficulty/     → constraints visible; shortage requires
             undone-only/high-freq + seed → preview →       explicit consent; reshuffle excludes prior
             reshuffle → start                               items — trust through transparency
Retention    Done states, latest result, calendar/stats,    → progress + operator-controlled freshness
             banners, auto-update
```

### 3.3 Information architecture

- Three-layer geometry: **64px icon rail** (亮点 highlights / 听阅 listen-read / 写作
  writing / 科普 coming-soon / feedback / settings) → **~270px floating sidebar**
  (search, weekly activity, album list) → **rounded main canvas** (45px tab bar, banners,
  scrolling unit list). User-selectable pastel background palettes (6 themes).
- Exam/review surfaces switch to institutional chrome (deep blue exam / burgundy review),
  60px header, 55px footer, resizable split panes.
- Priority: value claims first (highlights rail entry), then collections, then units with
  aggregate metrics right-aligned; personal columns visible-but-empty when anonymous.

### 3.4 Mechanisms worth extracting

1. **Anonymous-first + status enrichment**: public entities + authenticated status batch
   = personalized cards. Discovery is never behind login; *persistence* is.
2. **Email-code auth contract**: masked email, 6 cells, paste distribution, auto-focus,
   auto-submit, 60s resend, remembered email, auto-account-creation.
3. **Explainable search pipeline**: NFKC normalize → deterministic tiers (title exact 1100
   → prefix 1050 → contains 1010 → topic/keyword 1000…780 → aggregate 720 → CJK n-grams)
   → Fuse.js fuzzy floor → dedupe → tie-break → **match reasons shown to users**.
4. **Constraint builder + fallback consent**: user constraints are hard by default; the
   system explains shortages and asks permission to relax. Composition is an immutable
   snapshot with an ID; reshuffle excludes prior items.
5. **Aggregate vs personal metric pairing** (平均 vs 我的) on every content row.
6. **High-frequency ranking display**: rank + movement + 7-day activity + accuracy pair —
   urgency with visible evidence.
7. **Versioned content integrity**: `partCode + partVersion + contentHash`; never silently
   mix revisions; reviews stay valid after content changes.
8. **Operational completeness**: maintenance, forced update, empty, error, entitlement,
   unsupported-type states are all designed, not accidental.

### 3.5 Defects/warnings

Mock "intensive practice" shipped as dead code; hidden statistics/pack surfaces;
desktop-only 980×620 hard minimum; opaque server ranking; writing has no scoring
("暂不评分"); proof-upload gating creates operational review cost; missing favicon asset;
sandbox disabled.

---

# PART 4 — Interaction logic: the transferable contracts

## 4.1 From the listening product (learning loop)

| Contract | Rule |
|---|---|
| Draft autosave | Save on change, on section transition, on visibility-hidden; show last-saved time; restore explicitly on re-entry; clear only after confirmed submission |
| Attempt lifecycle | Finish → normalize (NFKC, trim, lowercase, alternatives) → score → persist immutable attempt with per-question details → lock state |
| Status derivation | unstarted / pending(draft) / completed / completed-with-errors — computed, never stored redundantly |
| Wrongbook | Derived: any latest attempt with wrong > 0; sorted by latest wrong time; filters mirror catalog dimensions |
| Review | Answers hidden by default; reveal-one / reveal-all; row → evidence jump with highlight; exact attempt addressable by ID; redo one click away |
| Suite | One item per part; novelty-first selection, wrong-count fallback; fixed duration; results sync back into the same tracker; band estimate table |
| Progress tiles | One accuracy tile per category, from latest attempts; "not started" not "0%" |

## 4.2 From the comprehensive platform (discovery + conversion)

| Contract | Rule |
|---|---|
| Access model | Public: catalog + aggregates. Authenticated: personal status, saves, history, composer. Auth prompt opens *at the blocked action* and returns to it after success |
| Card enrichment | Public payload + per-user status batch merged client-side; anonymous shows the empty personal column as an implicit login incentive |
| Filters | OR within dimension, AND across dimensions; counts on chips; sort by difficulty/recency; personal filters (done/undone) trigger login when anonymous |
| Search | Deterministic tiers before fuzzy; reasons attached to results; versioned index; dedupe by canonical ID; max ~50 rows |
| Composer | Visible constraints → server/rule composition → preview → consent-gated fallback → immutable snapshot → reshuffle-with-exclusions |
| Freshness | Every dynamic number carries its window ("last 7 days") and update time |
| States | Design loading/empty/anonymous/error/maintenance/unsupported for every surface |

---

# PART 5 — Screen-level reverse engineering (screenshots + code)

### C1-S1: Library home (虾滑首页总览)
- **Purpose:** orient + route to next practice. **User goal:** "where am I, what next?"
- **Hierarchy:** title → creator link → filter matrix (版本/频次/Part/题型/状态/展示) →
  search + destructive clear → P1–P4 accuracy tiles ("未开始") → catalog.
- **Components:** sidebar nav, filter chip row (label column 64px), stat tile, exercise
  card (part, frequency dot, types, status), search input.
- **Interaction:** chips toggle (OR/AND semantics); tiles reflect latest attempts.
- **Lesson:** progress-first home works; blank-until-filter does not. Counts on chips
  ("单选 / 42篇") double as corpus transparency.

### C1-S2: Suite page (套题匹配)
- **Purpose:** one-click mock composition. Single card: explanation of the selection rule
  in plain language ("随机组成 P1-P4…优先没做过的题…优先抽错得多的题…完成后自动估分") +
  one black CTA. **Lesson:** stating the algorithm in one sentence *is* the trust UI.

### C1-S3: Wrongbook (错题本)
- **Purpose:** remediation queue. Filter rows (scope/type/section/part/frequency) +
  search + result count ("0/0 篇") + empty state.
- **Lesson:** the remediation surface reuses the exact catalog filter vocabulary — one
  mental model everywhere.

### C2-S1: Catalog (听阅)
- **Purpose:** discovery with proof. Rail → sidebar (search, 一周动态 hot lists, album
  cards with 0/84 progress) → main list (Part tabs with counts, banner rows:
  source-reveal + login prompt, unit rows: EN title + CN subtitle + 我的 —/平均 72.91%).
- **Lesson:** every row pairs personal and aggregate metrics; anonymous users see the
  shape of what login unlocks. Albums (editorial collections) organize a large corpus
  by intent ("7月高频") not just taxonomy.

### C2-S2: Highlights (亮点)
- **Purpose:** value proposition as a full-screen carousel ("听力P4热榜命中率达70%以上",
  "95%覆盖在考题库", CTA 好奇 →, 1/2 pager). **Lesson:** a dedicated "why this product"
  surface inside the app, operator-updatable.

### C2-S3: Writing catalog (写作)
- **Purpose:** visual task discovery. Type tabs (数据图19/流程图1/地图3/示意图2) + login
  banner + source banner + 3-col image-led grid with category chips.
- **Lesson:** when the content is visual (charts/maps), the card *is* the thumbnail —
  directly applicable to audition/repertoire and program-type browsing.

### C2-S4/5: Coming-soon (科普) + settings popover
- Honest placeholder surface for roadmap items; settings popover = 6 theme swatches,
  login/register, update check, terms. **Lesson:** roadmap transparency and lightweight
  personalization (theme) build product feel cheaply.

---

# PART 6 — Technical reality check

Classification of everything above against STAGE's actual stack (Next.js 15 + Directus +
localStorage IELTS lab; no auth backend yet, no recommendation service):

### A. Simple UI patterns — replicate immediately (days each)
- Filter chip matrix with counts; OR/AND semantics (extend existing `FilterChips`).
- Category stat tiles ("not started" semantics) — extend `LabOverview`.
- Three-state status chips on cards (derive from existing `ExamProgress`).
- Aggregate-vs-personal metric pairing on cards (aggregate = static editorial data initially).
- Suite explanation card with plain-language algorithm statement (already have `composeSuite`).
- Highlights/"why STAGE" carousel; coming-soon surfaces; theme accent picker.
- Deadline chips/timeline (have `DeadlineChip`, `Deadline` data).
- Answer-reveal discipline + reveal-one/all in result panel (extend `ResultPanel`).

### B. Medium product features — this quarter's build
- **Derived wrongbook** for IELTS Lab (pure function over existing `PracticeRecord`s).
- **Exact-attempt review route** (`/ielts-lab/review/[recordId]` exists as helper
  `reviewHref` — needs full page with per-question evidence jump).
- **Explainable client-side search** over schools/programs (deterministic tiers + CJK
  n-grams + reasons; corpus is small enough to ship the index to the client).
- **Student profile (local-first)**: instrument, degree target, countries, budget,
  IELTS current/target — localStorage first, Directus-backed later.
- **Requirement checklist + gap computation** per program (pure functions over existing
  `LanguageRequirements` / `PrescreenSection` / `AuditionSection` / `Deadline`).
- **Rule-based recommendation runs** with reasons + immutable snapshot (client/server
  function, versioned JSON output; no ML needed).
- **Band estimation + goal linkage** (static mapping table; join to program IELTS minima).
- **Listening channel for IELTS Lab** — the runtime pattern exists (unified reading page);
  listening adds audio player + transcript-cue model (larger, needs licensed content).

### C. Advanced systems — postpone / infrastructure-dependent
- Accounts + email-code auth + cross-device sync (needs auth service; Directus can back
  it, but session design, rate limiting, and token transport need a real security pass).
- Server-side status enrichment batches; telemetry with consent.
- Admission-**chance** estimation (probabilistic claims need data volume + methodology +
  disclaimers; ship *readiness/fit*, not *probability*, until then).
- Entitlements/premium gating; operator banner CMS; offline content packs (skip — STAGE
  is web-first; content-hash versioning of requirements is the part to keep).
- Real-time "high-frequency" analytics (requires usage telemetry; editorial curation
  substitutes in the meantime).

---

# PART 7 — STAGE opportunity analysis

## 7.1 Copy (proven, low-risk)
- The **entire learning-state machine** from C1 (drafts, immutable attempts, derived
  wrongbook, review discipline, suite, band table) → IELTS Lab.
- The **discovery shell** from C2 (rail + contextual sidebar + canvas; anonymous-first;
  filter/sort contracts; state completeness) → Explore.
- The **search pipeline** with match reasons → school/program search.
- The **constraint composer + fallback consent** → recommendation builder.
- The **plain-language algorithm statement** → everywhere STAGE ranks or selects.

## 7.2 Improve (they do it; STAGE does it better)
- Default catalog visible (kill C1's blank-until-filter).
- Search that honors its placeholder (names, aliases, disciplines, cities, IDs).
- Persistent onboarding dismissal; no repeating modals.
- Real responsive web design (both competitors are desktop-only Electron).
- **Evidence beyond claims**: C2 asserts "95% coverage"; STAGE shows `SourceRecord` +
  `last_checked_at` + confidence on every fact — provenance as UI, not marketing.
- **Transparent recommendation**: C2's server ranking is opaque; STAGE exposes
  eligibility / fit dimensions / confidence / freshness separately, never one magic number.
- Accessibility: keyboard alternatives, reduced motion, reflow (not hide) secondary panes.

## 7.3 Combine (the strategic move)

**The Admission-Readiness Loop** — fusing four assets no competitor holds together:

```
Student Profile ──────────────┐
  (instrument, degree target,  │
   countries, budget,          ▼
   academic, IELTS score)   Match Engine ──► Recommendation run (immutable, versioned)
                               │                 items: eligibility + fit dimensions
Requirements DB ───────────────┘                 + reasons + evidence links
  (language minima, prescreen,                       │
   audition, deadlines, tuition,                     ▼
   evidence + confidence)                      Gap Analysis per program
                                                 "IELTS 6.5 required — you estimate 6.0"
                                                 "Prescreening video due Nov 1"
                                                     │
IELTS Lab ◄──────────────────────────────────────────┘
  practice → wrongbook → suite → band estimate ──► updates Profile ──► readiness recomputed
                                                     │
Dashboard ◄──────────────────────────────────────────┘
  deadlines timeline + readiness meters + next actions
```

The IELTS band estimate (C1's mechanic) stops being a vanity metric: it is an **input to
admission readiness**. The wrongbook stops being generic: it is **the path to closing a
named requirement gap for a named program**. This is the flywheel neither competitor has.

## 7.4 Create uniquely
- **Evidence-linked recommendations**: every reason cites a `SourceRecord` (C1's
  result→transcript-cue jump, transplanted to admissions: reason → official source quote).
- **Requirement checklist as progress object**: three-state semantics (C1) applied to
  application tasks (unstarted / in-progress / satisfied), derived from profile + data.
- **Confidence-honest UI**: `DataQuality.confidence` and `missing_fields` rendered as
  first-class states ("we haven't verified 2026 fees yet") — trust through admitted gaps.
- **Audition/prescreen prep surfaces**: the structured `PrescreenSection`/`AuditionSection`
  data rendered as C2-style visual task cards (repertoire, format, video specs).

---

# PART 8 — THE BLUEPRINT

## 8.1 Product architecture — future STAGE user journey

```
                    (anonymous)                              (identified: local profile → later account)
Landing ──► Explore schools/programs ──► School page ──► Program page
   │            │  filters+search           │   fit strip     │  requirement checklist + gaps
   │            │  aggregate signals        │                 │  evidence accordions (exists)
   │            ▼                           ▼                 ▼
   │        "Build your profile" (progressive, 5 steps, skippable, local-first)
   │            │
   │            ▼
   │        Match page: constraint builder ──► recommendation run ──► shortlist
   │            │        (consent-gated fallback)   (reasons + evidence + dimensions)
   │            ▼
   │        Dashboard (product home): readiness meters, deadline timeline, next actions
   │            │
   │            ├──► IELTS Lab: browse / practice / review / wrongbook / suite / history
   │            │       └── band estimate ──► profile ──► readiness recomputed
   │            └──► Saved list / comparisons / application checklists
   ▼
Pricing / account (Phase 2+: email-code auth, sync, premium)
```

Navigation model (C2 translation, web-responsive):
- Desktop: slim icon rail (Explore / Match / Dashboard / IELTS Lab / Saved) + contextual
  sidebar per surface + main canvas. Mobile: existing `MobileBottomNav` extended to the
  same five destinations; sidebar becomes a sheet.

## 8.2 Feature roadmap

### Phase 1 — Highest-value, current-foundation (no backend changes)
| # | Feature | Source mechanism | Builds on |
|---|---|---|---|
| 1.1 | IELTS wrongbook + exact-attempt review + reveal discipline | C1 loop | `PracticeRecord`, `reviewHref` |
| 1.2 | Three-state status + category tiles + suite band estimate | C1 | `ExamProgress`, `composeSuite`, `LabOverview` |
| 1.3 | Explore shell upgrade: default-visible catalog, chip counts, sorts, aggregate signals | C2 shell | `/schools`, `FilterChips`, `SchoolCard` |
| 1.4 | Explainable search (tiers + CJK n-grams + match reasons) | C2 search | `/search`, `lib/search` |
| 1.5 | Student profile v1 (local-first, progressive) | C2 composer inputs | new `lib/profile` |
| 1.6 | Program requirement checklist + gap strip (incl. IELTS gap vs lab estimate) | unique fusion | `LanguageRequirements`, program page |
| 1.7 | Dashboard v1: deadlines timeline + readiness + next actions | unique fusion | `(product)/dashboard`, `Deadline` |

### Phase 2 — Growth
| # | Feature | Source |
|---|---|---|
| 2.1 | Recommendation runs v1: constraint builder → rule-based scoring → immutable snapshot → shortlist with reasons/evidence; fallback consent | C2 composer + C1 explainability |
| 2.2 | Email-code auth + account sync of profile/records/saves (server-enforced authz) | C2 auth contract |
| 2.3 | Saved/compare lists with status enrichment | C2 |
| 2.4 | IELTS listening channel (licensed content; transcript-cue review, intensive mode) | C1 |
| 2.5 | Highlights/"why STAGE" surface + honest coming-soon pages + theme accent | C2 |
| 2.6 | Aggregate usage signals on cards (once telemetry exists; editorial until then) | C2 |

### Phase 3 — Advanced intelligence
| # | Feature |
|---|---|
| 3.1 | Readiness scoring v2: multi-dimension (eligibility/academic/language/timing/cost) with confidence + freshness; versioned algorithm |
| 3.2 | Preparation plan generator (mixed-practice pattern applied to application tasks: "this week: 2 P3 readings on your weakest type + record prescreen video draft") |
| 3.3 | Premium entitlements (server-issued; expiry never deletes history) |
| 3.4 | Popularity/"trending programs" signals with defined windows; chance calibration only when data justifies it |
| 3.5 | Requirement change tracking: content-hash versioning; "this program's 2027 requirements changed since your run" |

## 8.3 Page-level replication specification

Conventions: all pages responsive (mobile-first reflow, never hide-on-narrow); all
dynamic numbers carry window + freshness; every surface designs loading/empty/anonymous/
error states; Chinese-first copy with EN program names, matching current product.

---

**P-01 Explore (upgrade of `/schools` + `/search`)**
- **Purpose:** anonymous-first discovery with visible proof of data depth.
- **Layout:** rail + contextual sidebar (search, saved collections, editorial albums e.g.
  "UK conservatoires", "Composition programs") + main canvas with tab bar (All / by
  degree level), filter chips with counts, sort menu, card list/grid toggle.
- **Sections:** search; filter matrix (country, degree level, discipline, tuition band,
  IELTS demand band, deadline window); result list; empty/zero-result guidance.
- **Components:** SchoolCard/ProgramCard (enriched), FilterChipMatrix, MatchReasonTag,
  SortMenu, ViewToggle, StatusChip (saved/viewed).
- **Interaction:** default shows all published content; chips OR-within/AND-across with
  live counts; search results annotated with match reasons; personal filters prompt
  profile creation (Phase 1) or login (Phase 2).
- **Data:** existing `getAllSchools`/`searchPrograms` DTOs + client search index
  (id, names, aliases, city/country, discipline terms, degree slugs).

**P-02 School detail (upgrade of `/schools/[schoolId]`)**
- **Purpose:** institutional decision context. **Add:** fit strip under hero (needs
  profile): eligibility snapshot across this school's programs; freshness badges from
  `last_checked_at`; program index grouped by area (exists) with three-state checklist
  status per program.
- Keep: `SchoolHero`, `SchoolQuickFacts`, detail sections with `EvidenceAccordion`.

**P-03 Program detail (upgrade of `/schools/[schoolId]/programs/[programId]`)**
- **Purpose:** THE decision page — "does this fit me and what do I do next".
- **Layout:** existing detail sections + new right-column (desktop) / top-strip (mobile)
  **Fit Panel**.
- **Sections:** Fit Panel (eligibility verdict per dimension; IELTS gap meter wired to
  lab estimate; deadline countdown chips); Requirement Checklist (language / prescreen /
  audition / documents as three-state rows, each expandable to full detail + evidence
  quote + source link); existing prose sections.
- **Components:** FitPanel, RequirementRow, BandGapMeter, DeadlineChip (exists),
  EvidenceLink, ConfidenceBadge, MissingDataNote (exists).
- **Interaction:** checklist rows expand; "estimate my band" CTA deep-links into IELTS
  Lab suite; "add to my list" saves; unresolved data shows confidence-honest state.
- **Data:** `Program` (all requirement sections exist), profile, IELTS lab estimate.

**P-04 Profile builder (new, `/profile` or modal-flow)**
- **Purpose:** capture matching inputs at minimum friction.
- **Layout:** 5 progressive steps, each skippable, progress dots, ~1 question per screen:
  ① instrument/discipline ② target degree + entry term ③ countries/regions + budget band
  ④ academic background ⑤ English status (has score? which test? current + target).
- **Interaction:** chips/steppers, no free text where avoidable; autosave every change
  (C1 draft contract); completion returns to originating page; editable forever from
  dashboard. **Data:** local `ProfileV1` (versioned schema for future sync).

**P-05 Match (new, `/match`)**
- **Purpose:** constraint-driven shortlist generation with total transparency.
- **Layout:** left constraint panel (from profile, editable inline: hard vs soft toggle
  per constraint) → generate CTA → main results: shortlist cards ranked, each with
  reasons; header states algorithm version + plain-language rule sentence (C1-S2 lesson).
- **Interaction:** shortage → consent dialog before relaxing any hard constraint
  (never silent); reshuffle excludes prior items; run saved as immutable snapshot in
  history; every card links to P-03.
- **Components:** ConstraintBuilder, RecommendationCard, FallbackConsentDialog,
  RunHistoryList. **Data:** recommendation run record
  `{runId, profileVersion, algorithmVersion, constraints, items[{programId, eligibility, dimensions, reasons[{code, text, evidenceRef}], rank}]}`.

**P-06 Dashboard (upgrade of `(product)/dashboard`)**
- **Purpose:** product home; answers "what should I do next" in 5 seconds.
- **Sections:** ① readiness meters per saved/shortlisted program ② deadline timeline
  (next 90 days: application/prescreen/audition, from `Deadline`) ③ next actions feed
  ("close your IELTS gap: practice your weakest type — Matching", "verify Berklee fee
  data updated") ④ IELTS snapshot tile (band estimate + trend sparkline from
  `buildTrend`) ⑤ profile completeness nudge.
- **Components:** ReadinessMeter, DeadlineTimeline, ActionCard, StatTile, TrendSparkline.

**P-07 IELTS Lab overview/browse (upgrade)**
- Keep current shell. **Add:** category accuracy tiles with "未开始" semantics; band goal
  banner ("target 6.5 for 3 of your programs — current estimate 6.0"); three-state chips
  on exam cards; wrongbook entry with count badge.

**P-08 IELTS practice player (upgrade of `practice/[examId]`)**
- Adopt C1 workspace geometry translated to web: sticky top bar (progress/timer),
  scrollable question area, fixed bottom question navigator (min 36px cells,
  answered/bookmarked/current states), draft autosave with last-saved indicator, pause
  honesty (never force-resume). Listening (Phase 2.4) adds sticky audio bar + optional
  58/42 transcript split that **reflows below** on narrow screens.

**P-09 IELTS review (new, `/ielts-lab/review/[recordId]`)**
- **Purpose:** turn one attempt into learning. Exact attempt, immutable.
- **Sections:** score summary + band contribution; per-question table (my answer /
  hidden correct answer / result), reveal-one + reveal-all; explanation jump per row
  (reading: passage location highlight; listening later: transcript cue + seek);
  attempt pager (multiple attempts); redo CTA.
- **Components:** ResultTable, RevealControl, AttemptPager, EvidenceJump.

**P-10 IELTS wrongbook (new, `/ielts-lab/mistakes`)**
- **Purpose:** derived remediation queue, zero curation.
- **Layout:** same filter vocabulary as browse (category/frequency/type) + search +
  result count; rows grouped by exam with latest-wrong-first sort; expand → per-question
  wrong answers → review / redo actions; empty state celebrates ("no mistakes under
  these filters").
- **Data:** pure derivation over `PracticeRecord`s (`wrong > 0` in latest attempt).

**P-11 Suite runner + result (upgrade of `suite`)**
- Composition preview before start (C2 pattern: see the parts, reshuffle, then commit);
  timed run; result page with band estimate table, per-part breakdown, sync into records,
  and — the fusion step — "update my profile estimate" CTA that recomputes program gaps.

## 8.4 Component-level specification

Reuse-first: extend `components/ui` primitives; tokens stay in the warm STAGE palette
(near-black primary actions, brand accent reserved for active/selected — same discipline
C1 uses with orange).

| # | Name | Purpose | Structure | States | Interaction |
|---|---|---|---|---|---|
| C-01 | `RecommendationCard` | Explain why a program fits | Rank badge · school/program names · eligibility verdict · 3–5 dimension bars · reason tags (each evidence-linked) · risk notes · freshness badge · CTA row (view / save / dismiss) | eligible / conditional / ineligible-shown-on-request; loading; stale-run | Reason tag → evidence popover with `SourceRecord` quote; card → P-03 |
| C-02 | `FitPanel` | Program-page decision strip | Verdict header · dimension rows (language/timing/academic/budget) · BandGapMeter · deadline chips · primary CTA | no-profile (CTA to build) / partial / complete / unverified-data | Dimension row expands to computation detail |
| C-03 | `RequirementRow` | One requirement as a task | Type icon · title · three-state chip · summary line · expander (full text, evidence quote, source link, `last_checked_at`) | satisfied / gap / unknown / not-required | Expand; "how to close this" action when gap |
| C-04 | `BandGapMeter` | IELTS requirement vs estimate | Target tick · current estimate marker · gap label · CTA | no-estimate / below / meets / exceeds | CTA deep-links to lab suite |
| C-05 | `FilterChipMatrix` | Catalog filtering | Label column + wrapped chip rows, counts per chip, clear-all | idle / active / zero-result | OR within row, AND across rows; counts update live |
| C-06 | `StatusChip` | Three-state progress | Dot + label | unstarted / pending / completed / completed-with-errors | none (derived) |
| C-07 | `CategoryStatTile` | Per-category accuracy | Category label · big value · sublabel | not-started ("未开始") / value / trend arrow | Click filters catalog to category |
| C-08 | `MatchReasonTag` | Search/reco transparency | Small tag with reason text | title-match / topic / alias / fuzzy | Tooltip shows matched field |
| C-09 | `ConstraintBuilder` | Reco inputs | Constraint rows (value + hard/soft toggle) · generate CTA · algorithm sentence | default-from-profile / edited / generating | Inline edit; hard constraints never silently relaxed |
| C-10 | `FallbackConsentDialog` | Honest shortage handling | Explanation of shortage · what would be relaxed · consent / cancel | — | Explicit opt-in only |
| C-11 | `DeadlineTimeline` | Time pressure at a glance | Horizontal/vertical time axis · deadline nodes (type-colored) · today marker | empty / upcoming / overdue | Node → program page |
| C-12 | `ReadinessMeter` | Per-program readiness | Program label · segmented meter per dimension · overall label | building / ready / gaps / stale | → gap detail |
| C-13 | `ActionCard` | Next-step feed item | Icon · imperative title · why-line (evidence/freshness) · CTA | new / done / dismissed | One-click to the surface that closes it |
| C-14 | `ResultTable` + `RevealControl` | Attempt review | Rows: question / my answer / correct (masked) / verdict; reveal-one buttons + reveal-all | masked / partially / fully revealed | Row → EvidenceJump |
| C-15 | `EvidenceJump` | Answer→explanation link | Inline link/icon on result rows | available / none | Scroll+highlight target passage (later: audio seek) |
| C-16 | `AttemptPager` | Attempt history | Prev/next + timestamp + score | single / multi | Switches immutable attempt views |
| C-17 | `QuestionNavigator` | Fixed bottom exam nav | Numbered cells ≥36px · part groups | current / answered / bookmarked / correct / wrong (review) | Click jumps; keyboard accessible |
| C-18 | `SuiteComposerCard` | Mock composition | Rule sentence · part slots preview · reshuffle · start | idle / composed / shortage | Reshuffle excludes prior; start locks snapshot |
| C-19 | `ConfidenceBadge` | Data honesty | Level dot + "verified {date}" | high / medium / low / missing | Tooltip: source + missing fields |
| C-20 | `AuthCodeInput` (Phase 2) | Email-code login | Email step → 6 cells | idle / countdown / error / success | Paste-distribution, auto-advance, auto-submit, 60s resend |
| C-21 | `OperatorBanner` (Phase 2) | Announcements | Icon · text · CTA · dismiss | info / warning / promo | Dismiss persisted per banner version |
| C-22 | `ProfileStep` | Progressive profiling | Question · chip/stepper input · skip · progress dots | pristine / answered / skipped | Autosave on change |

## 8.5 Implementation guidance for Claude Opus 5

**Design-system ground rules**
1. Extend, never fork, the existing token set (`tailwind.config.ts`: `brand`, `ink`,
   `line`, `page`; warm off-white surfaces). Follow C1's accent discipline: near-black
   primary buttons, brand accent only for active/selected/brand moments.
2. Keep two density contexts under one system (both competitors split "friendly catalog"
   vs "focused workspace"): Explore/Dashboard = editorial density; IELTS
   player/review = compact assessment density. Same tokens, a density variant — not a
   second visual language.
3. Tech-audit sequence if new deps are wanted: Tailwind v4 first, then shadcn/ui
   (reconcile with existing `components/ui` names one-by-one), then Motion in leaf
   client components only. None is required for Phase 1.
4. Responsive: mobile reflows everything; secondary panes stack below (never disappear);
   `MobileBottomNav` is the small-screen rail. Test at 375, 768, 1280.
5. States are part of the spec: every page ships loading (`SkeletonCard`), empty,
   anonymous/no-profile, error, and stale-data variants.
6. Accessibility: keyboard paths for all navigation and any drag interaction; focus
   traps in dialogs; `prefers-reduced-motion` respected; status never color-only.

**Data/logic ground rules**
7. Attempts are immutable; status/wrongbook/readiness are pure derivations. Never store
   what can be computed from history.
8. Every ranked or selected list carries: algorithm version, plain-language rule
   sentence, and per-item reasons with evidence refs (`SourceRecord.record_id`).
9. Profile, recommendation runs, and practice records get versioned schemas from day
   one (they will migrate to server sync in Phase 2).
10. Drafts: save on change/transition/visibility-hidden; clear only after confirmed
    submit; show last-saved time.
11. Freshness and confidence are UI citizens: `last_checked_at`, `ConfidenceLevel`,
    `missing_fields` render on every requirement surface.
12. Never gate discovery; gate persistence and personalization. Auth (Phase 2) opens at
    the blocked action and returns to it.
13. Do not copy competitor content, names, icons, images, audio, or copy text. Mechanism
    only. No client-embedded secrets; server-enforced authorization when accounts land.

**Suggested build order (Phase 1)**
① IELTS wrongbook + review route (pure derivation — fastest visible win, completes the
C1 loop) → ② three-state chips + tiles + band table → ③ Explore shell upgrade + search
reasons → ④ Profile v1 → ⑤ Program Fit Panel + Requirement Checklist → ⑥ Dashboard v1.
Each step is independently shippable; ⑤–⑥ deliver the strategic fusion.

**Definition of done for the upgrade**
A student with no account can: land → explore with visible data depth → build a 2-minute
profile → see per-program requirement gaps citing official sources → be told their IELTS
gap → practice toward it in the lab → watch the gap close on their dashboard → know
exactly which deadline is next. Every number on that path shows where it came from and
when it was last verified.
