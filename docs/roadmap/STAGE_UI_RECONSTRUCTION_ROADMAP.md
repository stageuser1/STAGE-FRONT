# STAGE — Full Product UI Reconstruction Roadmap

**Date:** 2026-07-27
**Author role:** Fable (strategy)
**Supersedes:** the "IELTS Lab Foundation → IELTS Lab UI MVP" sequencing. Does **not**
supersede the upgrade specs in `docs/upgrade/00–06` — those are carried forward as
inputs to Phase 2/3.

**Standing constraints (restated, binding on every phase):**
- STAGE positioning unchanged. No new product features. No backend/Directus redesign.
- No restart of foundation work (Reading/Listening/Writing/Speaking foundations are done;
  Speaking scope stays frozen — no recording, microphone, pronunciation analysis,
  AI examiner, band prediction, or scoring integration).
- The deferred Speaking live-model 20-answer traceability audit belongs to future AI
  integration work and is **not** on this roadmap.

---

## 1. Ruling: full-site reconstruction vs. IELTS Lab UI first

**Ruling: reconstruct the full site in one program; the IELTS Lab UI is a workstream
inside it, not a separate prior project.**

Why:

1. **The repo already runs two token families split by route group** (Explore family
   `brand/ink/line/page` vs. App family `stage-*` variables — `00_DECISIONS.md` §1.2).
   Building the IELTS Lab UI first would harden the App family in ~10 more surfaces,
   then the full-site pass would either re-do them or permanently ship a two-skin
   product. Sequencing Lab-first maximizes rework.
2. **The Lab's product surfaces are already specified inside the upgrade blueprint**
   (P-07…P-11, C-14…C-18). There is no independent "IELTS Lab UI spec" to build against;
   splitting it out would mean forking the spec set.
3. **The user journey is one funnel**: land → explore → see requirement gap → practise
   in the lab → watch the gap close. The Lab's value proposition depends on the Explore
   surfaces rendering the gap; a polished Lab inside an unreconstructed shell doesn't
   test the thesis.
4. **One Claude Design engagement, one design system.** Two sequential design passes
   would produce two systems and a reconciliation project.

**What is preserved:** inside Phase 3/4, the Lab screens are still a coherent internal
milestone (design and implement them as a block), so the original "IELTS Lab UI" goal
ships — just inside the unified system, not before it.

---

## 2. Ruling: audit before reconstruction

**Ruling: yes — a full system audit runs first, but strictly time-boxed (one phase,
fixed deliverables), because its outputs are inputs the design phase cannot proceed
safely without.**

The audit is not a formality. Known open risks that must be converted into written
constraints or fixed before design/implementation:

| Area | Known open issue |
|---|---|
| Directus round-trip | Reviewer edit round-trip never verified against live Directus (no credentials in repo). |
| Data flow | Blob-column hazard: `program_payload` ~117KB/row, `requirement_sections` ~89KB/row, `evidence_metadata` ~126KB/row — any `fields=*` fetch regresses to ~69MB/render. Policy exists in `lib/data.ts`; audit must verify no surface violates it. |
| Data hygiene | Mixed review-status vocabularies in live rows ("Extracted" vs snake_case); `missing_fields` always `[]`; `section_minimums` always mapped `null`. |
| Build stability | `npm run build` intermittently times out (300s/page) on cold cache from heavy Directus responses over a slow link; full build ~25 min. Needs a documented re-run policy and, if possible, a mitigation before launch prep. |
| Tooling | No ESLint config exists; Next build's check is the only lint. |
| Dead/placeholder UI | MobileBottomNav 收藏/对比 are inert placeholders with no routes; `HomeProgramCard`, `SchoolAdmissionsOverview` etc. exist but unrendered. |
| Architecture | Vendored iframe runner owns timer/navigator/drafts (124KB runtime) — design must treat the in-attempt surface as host-chrome-only. Route-group rules (no duplicate `/ielts-lab` groups, `practice/` outside `(shell)`, no reserved-word basenames) must be handed to design/implementation as hard constraints. |
| Env | Port 3000 often held by stale node.exe returning 500s (`autoPort:true` workaround); screenshots hang on this machine — QA must use `read_page`/`javascript_tool`. |

Designing screens before these are written down risks specifying UI that the data layer
cannot feed, or that violates constraints the repo learned the hard way.

**Time-box rule:** the audit produces the four deliverables in Phase 1 and stops. It
does not fix cosmetic issues, refactor, or expand scope. Bugs found are registered and
triaged into Phase 4/5, except **launch-blocking data-integrity or connectivity defects**,
which are fixed inside Phase 1.

---

## 3. Execution phases

### Phase 1 — System audit & production readiness baseline

**Responsible:** Codex (audit execution) · Fable (synthesis and triage)
**Dependencies:** none — can start immediately.

**Objective:** produce a verified, written picture of what the current system actually
is — architecture, data flow, defects, performance — so that design and implementation
proceed against facts, not assumptions.

**Deliverables:**
1. **Frontend architecture map** — route groups, layouts, token-family boundaries,
   server/client rendering split per route, the iframe-runner boundary contract.
2. **Component inventory** — reconciled against `03_COMPONENT_SPECS.md`: what exists,
   what's rendered, what's orphaned (candidates for deletion in Phase 4), which family
   each lives in.
3. **Defect & risk register** — interaction bugs from walking every user flow (home →
   school → program; search; lab overview → practice → history → review; login;
   marketing pages), Directus connection audit (field-list policy compliance, reviewer
   round-trip test with real credentials, status-vocabulary reconciliation), and the
   dead-UI list. Each entry triaged: *fix now* / *fix in Phase 4* / *accept*.
4. **Performance & production-readiness baseline** — RSC payload sizes per route, build
   stability findings + re-run policy, cache behaviour, error/empty/loading-state
   coverage, lint/CI gap statement, env/config checklist.

**Exit criterion:** Fable signs a one-page **Design Constraints Brief** distilled from
1–4 — the binding input to Phase 2.

---

### Phase 2 — UX architecture & design system definition

**Responsible:** Fable (information architecture, prioritization) · Claude Design
(design system)
**Dependencies:** Phase 1 Design Constraints Brief.

**Objective:** one information architecture and one design system covering all three
scopes (Landing, Main Platform, IELTS Lab), resolving the two-token-family split at the
specification level.

**Deliverables:**
1. **Unified sitemap & navigation model** — the full route map (existing routes from
   `00_DECISIONS.md` §4 plus Landing/onboarding), entry points, and the cross-surface
   funnel (explore ↔ lab ↔ dashboard). Inert nav placeholders either get routes in this
   map or are removed from it.
2. **Token unification decision + spec** — the earlier "do not unify" ruling was scoped
   to the incremental Phase-1 build; a full-site reconstruction is exactly the repo-wide
   churn that ruling was avoiding piecemeal. Recommendation: converge on **one** token
   family (superset of `stage-*`, absorbing Explore's `brand/ink/line/page`), with a
   written migration table old-token → new-token. Status colours are already shared and
   stay as-is.
3. **Design-system spec** — typography (bilingual: Chinese-first, English subtitle
   pattern), spacing, color, component grammar (cards, chips, badges, expandables),
   motion rules (CSS-only, `prefers-reduced-motion`), building on `01_DESIGN_SYSTEM.md`.
4. **User-flow specs** — first-visit onboarding, explore→decision, lab practice loop,
   review loop; revalidating `04_INTERACTION_FLOWS.md` against audit findings.
5. **Screen inventory with build priority** — the definitive list Phase 3 designs
   against, each screen tagged with its data contract (from `06_DATA_REQUIREMENTS.md`)
   and its constraints (iframe boundary, blob policy).

**Exit criterion:** screen inventory + design system approved by the owner; open
questions OQ-1…OQ-8 from `00_DECISIONS.md` either ruled or defaults confirmed.

---

### Phase 3 — Claude Design full-site UI creation

**Responsible:** Claude Design (screens) · Fable (review against strategy/constraints)
**Dependencies:** Phase 2 design system + screen inventory.

**Objective:** production-grade visual design for every screen in the inventory, in the
unified system.

**Design order (funnel-priority):**
1. **Explore core** — Homepage, school list, school detail, program detail, search.
   This is the decision-making product; it leads.
2. **IELTS Lab block** — Lab dashboard/overview, browse, practice host-chrome, review,
   history, mistakes, suite, four-skill surfaces (Reading/Listening live; Writing/
   Speaking surfaces render foundation-layer content only — no scoring/recording UI).
3. **Landing & onboarding** — brand presentation, first-run flow into profile builder.
4. **Product shell** — dashboard, profile, navigation chrome, empty/error/loading
   states as first-class designs.

**Deliverables:** per-screen designs (mobile-first + desktop), covering default, empty,
loading, error, and "missing data admitted honestly" states; a redlines/handoff package
mapping every design element to a design-system token and to its data contract.

**Hard constraints handed to design:** in-attempt practice surface is host-chrome only
(runner owns timer/navigator); no screen may require data outside the audited field
lists; no new product features; band numbers always labelled 估算 with version; no
admission-probability UI.

**Exit criterion:** owner approves the design package; Fable confirms zero
constraint violations.

---

### Phase 4 — Implementation

**Responsible:** Opus (implementation) · Fable (work-package sequencing, scope control)
**Dependencies:** Phase 3 handoff package; Phase 1 defect register (fix-in-Phase-4 items).

**Objective:** implement the approved designs as incremental, individually verifiable
work packages — reconstruction of the UI layer only, on top of the existing data layer,
foundations, and Directus schema.

**Work-package order (mirrors design order):**
- **WP-A Token migration + shell** — new unified tokens land first with the migration
  table; both old families aliased during transition so packages can land incrementally.
- **WP-B Explore core** (homepage, school/program detail, search)
- **WP-C IELTS Lab block** (all lab surfaces; runner host-chrome only)
- **WP-D Landing + onboarding + profile**
- **WP-E Product shell + dashboard**
- **WP-F Cleanup** — delete orphaned components/dead UI from the Phase 1 inventory,
  remove old-token aliases.

**Standing rules:** route-group rules from `00_DECISIONS.md` §4 are inviolable; no new
dependencies without a ruling (Tailwind stays v3; reuse installed `recharts`); Chinese-
first copy conventions; localStorage keys per the namespacing table; every package ends
with a passing build (re-run once on schools-page-timeout-only failures per the Phase 1
build policy) and a QA pass of the affected flows.

**Exit criterion:** all screens implemented, defect-register "Phase 4" items closed,
full build green.

---

### Phase 5 — QA & launch preparation

**Responsible:** Codex (QA execution) · Fable (launch readiness ruling)
**Dependencies:** Phase 4 complete.

**Objective:** verify the reconstructed product end-to-end and close the
production-readiness gaps identified in Phase 1.

**Deliverables:**
1. **Full regression sweep** — every user flow from the Phase 1 flow list re-walked on
   the new UI; mobile + desktop; dark-mode/responsive checks. (On this machine:
   text-based verification — `read_page`/`javascript_tool`/server HTML — screenshots hang.)
2. **Design-fidelity QA** — implemented screens checked against the Phase 3 package.
3. **Performance verification** — RSC payload sizes re-measured against the Phase 1
   baseline; build stability re-checked; no `fields=*` regressions.
4. **Production-readiness closure** — lint/CI decision executed, env/config checklist,
   error monitoring stance, rollback notes, stale-port and cache operational notes
   written into `docs/`.
5. **Launch checklist** signed by Fable.

**Exit criterion:** launch checklist fully green; residual risks explicitly accepted in
writing.

---

## 4. Sequencing summary

```
Phase 1  Audit & baseline            (Codex → Fable)      — starts now
Phase 2  UX architecture & system    (Fable + Claude Design)
Phase 3  Full-site UI design         (Claude Design, Fable review)
Phase 4  Implementation WP-A…WP-F    (Opus, Fable sequencing)
Phase 5  QA & launch prep            (Codex, Fable sign-off)
```

Phases are sequential at the gate level, but Phase 2 work on flows/IA may begin against
early Phase 1 findings; only the Design Constraints Brief gates Phase 2's *exit*, and
only Phase 2's exit gates Phase 3.

## 5. Top risks

| Risk | Mitigation |
|---|---|
| Audit sprawls into a refactor | Time-box; fixed deliverables; register-and-triage rule. |
| Token migration destabilizes a recently refined landing page | WP-A aliasing; landing page migrates in WP-D with its own regression pass; the `landing-refine` worktree branch is reconciled before WP-A starts. |
| Design specifies data the layer can't feed | Every screen in the Phase 2 inventory carries its data contract; Fable rejects screens without one. |
| Iframe runner boundary violated by ambitious practice-screen design | Constraint stated in Phase 3 brief; Fable review checkpoint. |
| Slow flaky builds mask real regressions in Phase 4/5 | Phase 1 build policy (documented re-run rule + payload baseline) distinguishes infrastructure flake from code failure. |
| Scope creep via "while we're at it" features | Standing constraint: reconstruction changes presentation and flow only; any new capability goes to a post-launch backlog. |
