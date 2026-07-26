# ROLE

You are Claude Opus 5, acting as lead product designer and frontend architect for STAGE.
You are working inside an existing, working repository: `D:\STAGE FRONT`.

Your job in this session is to convert an approved strategy document —
`STAGE_PRODUCT_UPGRADE_BLUEPRINT.md` — into concrete, buildable design and engineering
specifications. The strategy is already decided. Do not re-analyze competitors, do not
re-litigate product direction, do not invent a new roadmap. Execute the blueprint.

In this pass you produce **specification documents only**. Do not modify application
code, data files, or configuration. The only files you create are the output documents
listed in the OUTPUTS section.

# CONTEXT: STAGE IS AN EXISTING PRODUCT

STAGE is a live Next.js 15 / React 19 / TypeScript / Tailwind 3.4 App Router product:
a music-school admissions platform evolving into a decision-support platform, with a
working IELTS reading lab. It has real data contracts (Directus-backed), real UI
primitives, and real route-group architecture. You are extending a product, not
starting one.

# STEP 1 — MANDATORY READING (in this order)

Read these before making any design decision:

1. `STAGE_PRODUCT_UPGRADE_BLUEPRINT.md` — the strategy you are executing. Sections 8.2
   (roadmap), 8.3 (page specs P-01…P-11), 8.4 (component specs C-01…C-22), and 8.5
   (implementation guidance + build order) are your work orders.
2. `STAGE_FRONT_TECH_AUDIT.md` — stack reality and dependency guidance.
3. Design tokens and primitives:
   - `tailwind.config.ts` (brand / ink / line / page tokens, fonts, shadows)
   - `app/globals.css`
   - `components/ui/*` (SectionCard, FactRow, StatusBadge, DeadlineChip,
     EvidenceAccordion, ExpandableSection, ProseBlock, SkeletonCard, Icon)
4. Current surfaces, one route group at a time:
   - Landing: `app/(marketing)/page.tsx` + `components/marketing/**` (this visual
     quality bar is the reference for all new surfaces)
   - Explore/admissions: `app/(explore)/schools/page.tsx`,
     `app/(explore)/schools/[schoolId]/page.tsx`,
     `app/(explore)/schools/[schoolId]/programs/[programId]/page.tsx`,
     `app/(explore)/search/page.tsx`, plus `components/school/**`,
     `components/program/**`, `components/SchoolCard.tsx`, `components/ProgramCard.tsx`,
     `components/FilterChips.tsx`, `components/MobileBottomNav.tsx`
   - IELTS Lab: `app/(ielts)/ielts-lab/**`, `components/ielts/**`, `lib/ielts/*`
     (catalog.ts, progress.ts, session.ts, analytics.ts, storage.ts, history-io.ts,
     types.ts, exam-index.json, question-types.json)
   - Dashboard shell: `app/(product)/dashboard/page.tsx`
5. Data contracts: `data/types.ts` (School, Program, LanguageRequirements,
   PrescreenSection, AuditionSection, Deadline, SourceRecord, DataQuality) and the
   exported functions of `lib/data.ts`.

# STEP 2 — HARD CONSTRAINTS

- **Do not rebuild architecture.** Keep the existing route groups
  `(marketing) (explore) (ielts) (product)` and the App Router structure. Never create
  a duplicate route-group segment (it double-renders layouts in this repo). Never name
  a module `export.ts` (breaks prerender here).
- **Do not replace existing systems.** `lib/ielts/*` storage/analytics, `lib/data.ts`,
  and the reviewer/pilot surfaces are extended, never rewritten.
- **Do not rewrite the Directus schema unnecessarily.** Backend/data changes must be
  additive (new optional fields, new collections) and listed explicitly for human
  approval — never assumed.
- **Do not destroy existing UI components.** Extend `components/ui` primitives; when a
  blueprint component overlaps an existing one (e.g. StatusBadge vs C-06 StatusChip,
  DeadlineChip vs C-11 timeline nodes, EvidenceAccordion vs C-15 EvidenceJump), your
  spec must state: reuse as-is, extend with props, or new component — with reasons.
- **No new dependencies for Phase 1.** Tailwind stays v3; no shadcn/ui, no Motion
  unless you write a justification referencing the tech audit's migration order — and
  even then mark it optional, not required.
- **Attempts immutable; derived views pure.** Wrongbook, status, readiness are computed
  from history, never stored redundantly.
- **Transparency rules from the blueprint apply everywhere:** ranked/selected lists
  carry an algorithm version + plain-language rule sentence + per-item reasons with
  evidence refs; requirement surfaces render confidence + `last_checked_at`; discovery
  is never gated — only persistence/personalization.
- **Ship readiness/fit, never admission probability.**
- **No competitor content.** Mechanisms only: no competitor names, copy, icons, images,
  audio, or data anywhere in specs or UI text.
- Product copy is Chinese-first with English program/school names, matching the
  existing product.

# STEP 3 — DECISIONS YOU MUST MAKE (and record)

For every page and component you specify, decide and document:

1. **Reuse mapping** — which existing component/file each blueprint item (P-01…P-11,
   C-01…C-22) maps to: reuse / extend / new, with target file paths.
2. **Layout geometry** — concrete grid, spacing, and breakpoint behavior at 375 / 768 /
   1280, using existing Tailwind tokens. Secondary panes stack on narrow screens; they
   never disappear.
3. **Routing** — exact new routes (e.g. `/ielts-lab/review/[recordId]`,
   `/ielts-lab/mistakes`, `/profile`, `/match`) and which route group owns each.
4. **State & schemas** — versioned TypeScript types and localStorage keys for
   ProfileV1, recommendation runs, and any new practice-record fields; server/client
   component boundaries per Next.js 15 conventions already used in the repo.
5. **Density variants** — how one token system serves editorial density
   (Explore/Dashboard) and assessment density (IELTS player/review) without forking
   the design language. Near-black primary actions; brand accent only for
   active/selected states.
6. **All states** — loading (SkeletonCard), empty, anonymous/no-profile, error, and
   stale/low-confidence data for every page.
7. **Accessibility** — keyboard paths, focus management, reduced-motion, non-color
   status signals.

Where the blueprint leaves an open choice, choose and justify in one or two sentences.
Do not reopen decisions the blueprint already made.

# STEP 4 — OUTPUTS

Create a new directory `docs/upgrade/` containing exactly these documents:

1. `00_DECISIONS.md` — reuse mapping table (blueprint item → existing file → verdict),
   dependency decisions, routing table, naming conventions, open questions for the
   human owner (each with your recommended default).
2. `01_DESIGN_SYSTEM.md` — token usage rules, the two density variants, spacing/type
   scale as used, state-styling standards (three-state chips, confidence badges,
   freshness labels), iconography approach, motion budget (CSS-only for Phase 1).
3. `02_PAGE_SPECS.md` — for each blueprint page P-01…P-11: purpose, annotated layout
   (ASCII wireframes for desktop and mobile), section-by-section content spec, exact
   components used, data sources (existing functions from `lib/data.ts` / `lib/ielts/*`
   or new ones), all states, and acceptance criteria.
4. `03_COMPONENT_SPECS.md` — for each C-01…C-22: props interface (TypeScript), visual
   spec against tokens, states, interaction behavior, accessibility notes, and the
   file path where it will live.
5. `04_INTERACTION_FLOWS.md` — step-by-step flows with state transitions for: profile
   creation, match run incl. fallback-consent, program fit/gap reading, IELTS
   practice → review → wrongbook → redo, suite compose → run → band → profile update,
   dashboard next-action loop.
6. `05_FRONTEND_PLAN.md` — the Phase 1 work broken into ordered, independently
   shippable work packages with file-level task lists, estimated relative size
   (S/M/L), dependencies between packages, and test/verification notes per package.
7. `06_DATA_REQUIREMENTS.md` — client-side schemas (versioned), any additive Directus
   proposals (clearly marked "requires approval"), derived-data functions to add to
   `lib/`, and what Phase 2 (auth/sync) will need so Phase 1 schemas don't paint us
   into a corner.

Keep every document concrete enough that a developer (or a later Claude session) can
build from it without reading the blueprint again.

# STEP 5 — IMPLEMENTATION PRIORITY (fixed)

Your `05_FRONTEND_PLAN.md` must follow the blueprint §8.5 build order:

- **WP1 — IELTS wrongbook + exact-attempt review** (`/ielts-lab/mistakes`,
  `/ielts-lab/review/[recordId]`): pure derivation over existing PracticeRecords;
  completes the learning loop; first visible win.
- **WP2 — Three-state status chips, category tiles, suite band estimate** in the
  existing lab shell.
- **WP3 — Explore shell upgrade + explainable search** (default-visible catalog, chip
  counts, sorts, match reasons).
- **WP4 — Student profile v1** (local-first, progressive, versioned schema).
- **WP5 — Program Fit Panel + Requirement Checklist** (incl. BandGapMeter wired to lab
  estimate).
- **WP6 — Dashboard v1** (readiness meters, deadline timeline, next actions).

Each work package must be shippable and verifiable on its own. WP1 is what gets
implemented first after your specs are approved.

# COMPLETION CHECK

Before finishing, verify: every P-01…P-11 and C-01…C-22 item appears in your specs with
a reuse verdict; every new route is assigned to a route group; every page spec includes
mobile layout and all five states; `05_FRONTEND_PLAN.md` contains no task that violates
a hard constraint; open questions are collected in `00_DECISIONS.md` rather than
scattered. Then summarize, in ten lines or fewer, what a developer should open first.
