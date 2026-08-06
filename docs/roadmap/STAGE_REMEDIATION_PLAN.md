# STAGE — Pre-Reconstruction Remediation Plan

**Date:** 2026-07-27
**Author role:** Fable (strategy)
**Input:** `STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md` (Codex, 2026-07-27)
**Position in master roadmap:** this plan inserts a remediation program between
Phase 1 (audit — now complete) and Phase 2 (UX architecture & design system) of
`docs/roadmap/STAGE_UI_RECONSTRUCTION_ROADMAP.md`. Reconstruction does not start
until R1–R5 exit criteria are verified by Codex.

**Standing constraints (binding on every phase and every Opus prompt):**
- No product redesign, no scope expansion, no backend/Directus architecture change.
- IELTS Lab direction unchanged; foundation contracts protected; Speaking scope frozen
  (no recording/microphone/pronunciation/AI examiner/band prediction/scoring).
- Minimal safe fixes only. Anything bigger waits for reconstruction or later.

---

## 1. Triage

### 1.1 Must fix BEFORE reconstruction (blocking)

| Item | Audit ref | Why it can't wait |
|---|---|---|
| Directus delivery re-shaping (bounded route-specific queries, evidence off shared path, timeouts) | P0-2, TD-02..05 | Root cause of the build failure; every later verification step is slow or flaky until this lands. Dataset is growing (20 schools now), so it worsens monotonically. |
| Production dependency vulnerabilities | P0-3 | Three high-severity groups in the deployable tree; upgrading later means re-verifying reconstruction work against a changed framework. |
| Public error-detail leakage | P1-3 | Two-line class of fix; belongs with the dependency/security pass. |
| Baseline security headers (excl. strict CSP) | P1-2 (partial) | Cheap now; full CSP is staged because it must be tested against the legacy IELTS runtime. |
| Reproducible build + startable artifact | P0-1, P2-5, P2-6 | Reconstruction without a green-build baseline means regressions are undetectable. |
| Minimal CI gate + thin route smoke suite | P1-7, TD-24 | This is the regression net reconstruction will be judged against. Without it, Phase 4 of the master roadmap has no definition of "still works". |
| Mobile horizontal overflow | P0-4, TD-12 | Small contained fix (known min-content wrapper pattern); establishes the zero-overflow release invariant *before* design work, so reconstruction inherits a passing baseline, not a broken one. |
| Invalid detail URLs → real 404 | P1-10 | Trivial (`notFound()`); needed for the smoke suite to be meaningful. |
| Launch content: legal links, contact address, claim/count/"coming soon" reconciliation, inert-control ruling | P0-5, P1-9 (partial), TD-27 | Content decisions are Fable/owner work that gates nothing else — but the *decisions* feed reconstruction copy, so make them once, now. |

### 1.2 Handle DURING reconstruction (folded into master-roadmap Phases 2–5)

| Item | Audit ref | Where it lands |
|---|---|---|
| Navigation IA unification (desktop vs mobile destinations, back-target semantics, login flow meaning) | P1-9, TD-15 | Phase 2 sitemap deliverable — fixing nav now would be redone by design. Only outright-broken affordances are handled in R5. |
| Token consolidation, raw-color drift, third pilot palette | P2-2, TD-13/14 | Phase 2 design system + WP-A token migration. |
| Monolith splitting (`lib/data.ts` remainder, 400–1,000-line components) | P2-1, TD-01, TD-11 | Phase 4, extracted along tested seams as each surface is rebuilt. |
| Result-list pagination/virtualization (508-row render) | TD-10 | Needs an approved interaction design; Phase 3 specifies, Phase 4 implements. |
| Payload budget enforcement (JS/RSC/HTML per route) | P1-11, TD-09 | Budgets are *set* in R3 CI as report-only; enforced as gates during Phase 4. |
| Full CSP enforcement | P1-2 | After testing against the iframe runner and reviewer flows; Phase 5 launch prep. |
| Observability + product analytics + uptime checks | P1-6 | Phase 5 launch prep (nothing is publicly deployed until then). |
| Metadata/sitemap/robots/not-found page polish | P2-4, TD-26 | Phase 4 (the not-found *route* ships in R4; its designed experience comes with reconstruction). |
| Component/E2E coverage beyond the thin smoke suite | P2-7 | Grows with each Phase 4 work package. |

### 1.3 Document only (no code before or during reconstruction)

| Item | Audit ref | Disposition |
|---|---|---|
| Import partial-commit recovery | P1-5, TD-20 | Ops runbook: backup → dry run → commit → verifier → journal review; rollback rehearsal owned by Codex. No importer rewrite. |
| Local-only learner state | P1-8, TD-16 | Documented limitation + visible copy at launch. Account sync = new feature = out of scope by standing constraint. |
| Reviewer token deep hardening beyond config review | P1-1, TD-17 | R2 does the Directus role/CORS/lifetime *config review + documentation*; moving tokens out of localStorage is an auth redesign — deferred with a written risk acceptance. |
| Concurrent reviewer-edit overwrites | TD-18 | Document collision behavior; version-aware writes only if Directus supports them trivially, else later. |
| IELTS legacy asset/runtime boundary | TD-21/22 | Freeze + contract note. No optimization this cycle. |
| Search truncation false positive at exactly 50 | P2-3 | Note in defect register; fix in passing during Phase 4 search work. |

---

## 2. Fix order — remediation phases R0–R5

**One deliberate deviation from the audit's gate order:** Codex sequenced security
(Gate 1) before Directus delivery (Gate 2). This plan reverses them. Nothing is
publicly deployed yet, so the vulnerability window is theoretical; meanwhile the
delivery fix is the root cause of the unfinishable build, and until it lands, *every*
later phase — including verification of the dependency upgrade itself — runs against
a 63-second data path and an unbuildable app. Fix the thing that makes everything
else verifiable first. The dependency upgrade then gets verified against a fast,
deterministic build instead of a broken one.

```
R0  Baseline freeze                Fable + Codex   (no code)
R1  Directus delivery re-shaping   Opus → Codex    MAXIMUM reasoning
R2  Dependency & security hygiene  Opus → Codex    MEDIUM reasoning
R3  Build reproducibility + CI     Opus → Codex    HIGH reasoning
R4  Mobile overflow + 404s         Opus → Codex    MEDIUM reasoning
R5  Launch content & legal         Fable → Opus → Codex   MEDIUM reasoning
        ↓
Master roadmap Phase 2 (UX architecture & design system) begins
```

R1→R2→R3 are strictly sequential. R4 may run after R1 in parallel with R2/R3.
R5's *decision* work (Fable) starts immediately; its implementation runs last so
reconciled counts reflect the post-R1 data path.

### R0 — Baseline freeze

- **Objective:** lock the evidence and environment so every later phase measures
  against the same baseline.
- **Why now:** the audit's numbers (15 MB / 63.6 s, 89 tests, artifact sizes) are the
  before-picture; without freezing them, R1's improvement claims are unverifiable.
- **Actions:** commit the audit file; record verifier output + payload/latency
  measurements in `docs/roadmap/baseline/`; declare supported Node + package manager
  (executed in R3 as `engines`); confirm Directus backup ownership and schedule one
  restore rehearsal (Codex-owned runbook, §1.3).
- **Expected outcome:** a written baseline any machine can reproduce the checks against.
- **Owner:** Fable (decisions/record) · Codex (verification + backup rehearsal).

### R1 — Directus delivery re-shaping

- **Objective:** make public data loading bounded, route-specific, and deterministic
  — evidence blobs off the shared path, explicit field sets everywhere, timeouts and
  classified failures — without changing any Directus collection or public DTO meaning.
- **Why now:** root cause of P0-1 and P0-2; single highest-leverage fix in the program.
- **Expected outcome:** no public route or build step fetches source-record bodies in
  bulk; largest catalog-path Directus response ≤ 2 MB; every request has an abort
  timeout; cold `/schools` renders within an agreed budget; reviewer-visible behavior
  unchanged; a reviewer save is followed by fresh public data within a defined window.
- **Owner:** Opus (implementation) · Codex (verification: payload/latency re-measurement,
  89-test suite, reviewer round-trip spot check) · Fable (signs the latency/payload budgets).

### R2 — Dependency & security hygiene

- **Objective:** clear the three high-severity production advisory groups, stop leaking
  error internals, and land baseline security headers (deferring strict CSP).
- **Why now:** must precede R3, because CI will pin an audit-clean dependency policy and
  the build gate should be established on the *upgraded* framework, not re-proven after.
- **Expected outcome:** `npm audit --omit=dev` clean of high severity (or explicitly
  risk-accepted by Fable in writing); public error UI shows a stable message + reference
  ID only; HSTS/frame/referrer/permissions headers active; Directus reviewer role/CORS/
  token-lifetime config reviewed and documented.
- **Owner:** Opus (implementation) · Codex (audit re-run, regression pass) · Fable
  (risk acceptance for anything unpatched).

### R3 — Build reproducibility + CI gate

- **Objective:** a clean install + clean build that completes inside a declared budget,
  starts under `next start`, and a CI pipeline that gates every future commit on it.
- **Why now:** this is the regression net; reconstruction (master Phase 4) must not
  begin without it. It comes after R1/R2 because they change what "green" means.
- **Expected outcome:** same commit builds twice to a startable artifact; CI runs locked
  install → audit policy → typecheck (on cleaned generated output) → 89 tests → build →
  start → route smoke suite (~10 routes incl. one invalid-ID 404 and an IELTS entry);
  Node/package-manager pinned; rollback steps documented; route payload sizes reported
  (report-only budgets).
- **Owner:** Opus (implementation) · Codex (verification: two clean runs on a second
  machine/environment) · Fable (declares the build-time budget).

### R4 — Mobile overflow + honest 404s

- **Objective:** zero horizontal document overflow at 320/375/390 px on catalog,
  filtered program view, search, school detail, program detail; invalid school/program
  URLs return HTTP 404.
- **Why now:** small, contained, known root cause (the wrapper min-content pattern the
  catalog code already documents); establishes the release invariant *before* design
  baselines are captured, and gives the smoke suite its 404 check.
- **Expected outcome:** measured `document.scrollWidth === viewport width` on all five
  surfaces at all three widths; `notFound()` on missing records; no visual redesign —
  containment fixes only.
- **Owner:** Opus (implementation) · Codex (width measurements + regression).

### R5 — Launch content & legal

- **Objective:** every public claim, count, label, and destination is true and approved.
- **Why now:** decisions (legal URLs, contact address, which capability claims stand,
  the fate of each inert control) are owner/Fable work with zero engineering dependency
  — but implementation runs last so counts reflect live data via the post-R1 path.
- **Expected outcome:** real privacy/terms destinations; monitored contact address;
  marketing counts derived from live data or removed; "coming soon" labels match
  reality; IELTS claims limited to the demonstrated reading-focused corpus with local
  feedback; inert controls removed or given approved behavior per Fable's ruling sheet.
- **Owner:** Fable (content decision sheet — prerequisite) · Opus (implementation) ·
  Codex (content-vs-behavior conformance pass).

**Program exit:** Codex re-runs the audit's failed checks. All five P0s show PASS;
the remaining P1/P2 register is annotated per §1.2/§1.3. Fable signs the gate; master
roadmap Phase 2 begins.

---

## 3. Opus execution prompts

Reasoning-level assignments and rationale:

| Phase | Level | Why this level |
|---|---|---|
| R1 | **Maximum** | Reshapes the query layer inside a 1,874-line module that mixes transport, retries, schema fallbacks, joins, and DTO construction — under a hard "no observable behavior change" contract. The invariants are subtle and historically earned: blob columns that must never be bulk-fetched, a catch-and-retry 403 fallback for unknown fields, tolerant status vocabulary reads, per-detail evidence attachment. A wrong simplification here silently changes public data meaning. Highest regression surface in the program. |
| R2 | **Medium** | Mechanical dependency upgrades plus two contained code changes (error boundary, headers). The work is verification-heavy, not design-heavy; the risk is missed regressions, which the prompt addresses with explicit re-verification steps rather than deeper reasoning. |
| R3 | **High** | Diagnosing residual build nondeterminism and designing a CI gate involves cross-cutting judgment (what to gate, what to report, how to keep the pipeline honest on a slow link) but operates on well-defined success criteria, not fragile internal contracts. |
| R4 | **Medium** | Known failure pattern with a documented fix (`min-width: 0` containment at the shared wrapper boundary) plus a standard `notFound()` change. Contained blast radius; needs care and measurement, not deep design. |
| R5 | **Medium** | Copy and link wiring from an approved decision sheet. The discipline required is *restraint* — implement exactly the sheet, invent nothing (especially legal text) — which the prompt enforces explicitly. |

---

### Prompt R1 — Directus delivery re-shaping (MAXIMUM reasoning)

```
You are Opus, implementing remediation phase R1 for STAGE FRONT (D:\STAGE FRONT), a
Next.js 15 App Router app over a live Directus instance. Read
STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md (sections P0-2, 1.2, 1.5, TD-02..TD-07,
TD-19) and docs/roadmap/STAGE_REMEDIATION_PLAN.md §R1 before writing any code.

GOAL
Make public Directus data loading bounded, route-specific, and deterministic. The
audit measured the shared bulk loader fetching five complete collections with
limit=-1, including a ~15 MB / 63.6 s source-records request, joined in memory and
shared by public pages and the build.

TASKS
1. Remove source-record bodies from every catalog/list/search path. Evidence
   (source quotes, evidence metadata) may only be fetched on the detail or reviewer
   surface that displays it, filtered by the specific record IDs needed (the
   attachSourceQuotes per-detail pattern in lib/data.ts is the model — extend that
   approach, do not reinvent it).
2. Replace shared whole-collection reads with route-specific loaders using explicit
   field lists and bounded queries (pagination or filtered fetches). No public code
   path may issue fields=* or an unbounded limit=-1 against program_offerings,
   application_requirements, audition_requirements, or source_records.
3. Add an AbortController-based timeout to every Directus request (pick one default,
   e.g. 30s, as a named constant), classify failures (timeout / HTTP / schema-
   fallback / network) into typed errors, and keep the existing two-attempt retry
   only for retryable classes.
4. Where in-memory joins remain, index by key (Map) instead of repeated Array.filter
   scans over large arrays.
5. Reviewer-to-public freshness: after a successful reviewer PATCH, invalidate the
   affected cached public data (Next.js revalidateTag/revalidatePath on the tags/
   paths you introduce) so router.refresh() serves fresh data. Document the
   propagation expectation in a short comment where the invalidation happens.

PROTECTED CONTRACTS — behavior that must NOT change
- Public DTO shapes and meanings (data/types.ts), route contracts, and everything a
  user or reviewer currently sees. This is a delivery-shape change only.
- The audition_requirements optimistic query with catch-and-retry fallback for
  unknown fields (Directus 403s on prescreen_repertoire/audition_repertoire until
  the admin adds them; "field" in record detection must keep working).
- Tolerant reads of mixed review-status vocabulary ("Extracted" vs snake_case).
- Reviewer edit components' direct read/patch behavior and field-level patches.
- Directus collections/relations: no schema changes, no new collections, no backend
  work of any kind.
- IELTS Lab: do not touch lib/ielts/*, components/ielts/*, public/ielts/* — the lab
  does not use this data path. Speaking scope is frozen; ignore any stale generated
  route types referencing deleted Speaking routes (never restore routes for them).

KNOWN HAZARDS (repo history — take these as fact)
- Blob columns that must never be bulk-fetched: program_offerings.program_payload
  (~117KB/row), application_requirements.requirement_sections (~89KB/row),
  source_records.evidence_metadata (~126KB/row), plus ~2KB source_quote on 17k+
  source_records rows. One careless fields=* regresses a render to ~69MB.
- lib/data.ts is ~1,874 lines mixing transport, retry, schema fallback, mapping,
  joins, search, and DTO construction. You may extract loaders into new lib/ modules
  for clarity, but do NOT attempt a full responsibility split in this phase — that
  is scheduled after reconstruction. Minimal safe restructuring only.
- Never name any module export.ts / import.ts / class.ts / new.ts (reserved-word
  basenames break the React Client Manifest).
- The Directus link is slow (source measured at 63s); design so a single slow
  request cannot stall a page or the build indefinitely.

VERIFICATION (all required before you declare done)
- npm test → all 89 tests pass unmodified. If a test encodes the old bulk-loading
  shape, discuss in your summary rather than silently rewriting it.
- npx tsc typecheck passes (delete stale .next/types first if it references removed
  routes — do not "fix" code to satisfy stale generated types).
- Start the dev server (use .claude/launch.json; port 3000 is often held by a stale
  node.exe — autoPort is configured) and verify /, /schools, one school detail, one
  program detail, /search render with correct data. Verify via fetched HTML/read_page
  (screenshots hang on this machine).
- Measure and report: per-request payload sizes and wall times on the new catalog
  path (target: largest catalog-path response ≤ 2 MB; no source-record bodies on any
  list path), and cold-render time of /schools.
- Report the before/after numbers against the audit baseline (15 MB / 63.6 s) in
  your final summary.

Do not run npm run build in this phase (it is proven flaky pre-R3; R3 owns it).
Commit in reviewable increments with clear messages; do not push.
```

---

### Prompt R2 — Dependency & security hygiene (MEDIUM reasoning)

```
You are Opus, implementing remediation phase R2 for STAGE FRONT (D:\STAGE FRONT).
Prerequisite: R1 (Directus delivery re-shaping) is merged. Read
STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md sections P0-3, P1-1, P1-2, P1-3 first.

GOAL
Clear high-severity production dependency advisories, stop exposing error internals
to users, and add baseline security headers. Strict CSP is explicitly OUT of scope
(it must be tested against the legacy IELTS iframe runtime later — do not add a CSP
in this phase).

TASKS
1. Run npm audit --omit=dev. Upgrade Next.js (currently 15.5.20) and the affected
   transitive PostCSS/Sharp packages to the nearest patched versions within the same
   major line. Do NOT jump a major version of Next, React, or Tailwind (Tailwind
   stays v3). If a high-severity advisory cannot be cleared without a major bump,
   STOP for that item, document it precisely (package, advisory, why blocked), and
   continue with the rest — Fable signs risk acceptances, not you.
2. app/error.tsx: replace the rendered error.message and digest with a stable
   user-facing message (Chinese-first, matching existing copy conventions) plus the
   digest shown only as an opaque reference ID. Log full detail to the console/server
   as appropriate. Keep the existing retry affordance.
3. Add baseline security headers via next.config headers(): HSTS,
   X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin,
   a Permissions-Policy denying camera/microphone/geolocation, and
   X-Frame-Options: SAMEORIGIN (the IELTS runner iframe is same-origin — verify it
   still loads after adding this; if it breaks, report rather than weakening headers
   silently). No Content-Security-Policy header in this phase.
4. Write docs/security/reviewer-directus-review.md documenting the current reviewer
   auth posture for the config review: where tokens live (localStorage), what the
   frontend role check does and does not guarantee, and a checklist for the Directus
   admin (least-privilege role fields, CORS origins, token lifetime). This is
   documentation only — do not change the auth implementation.

PROTECTED CONTRACTS
- No API changes, no component rewrites, no auth redesign, no CSP.
- IELTS Lab untouched except verifying the practice runner still works. Speaking
  scope frozen.

VERIFICATION
- npm audit --omit=dev: zero high-severity, or each residual documented as above.
- npm test → 89 tests pass. Typecheck passes.
- Dev-server smoke: /, /schools, one school detail, one program detail, /search,
  /ielts-lab, and one /ielts-lab/practice/[examId] attempt loads with the runner
  iframe functioning (verify via read_page/fetched HTML — screenshots hang on this
  machine). Confirm headers present with curl -I.
- Trigger the error boundary (temporary throw in a scratch route or dev check) and
  confirm no message/stack/digest-as-error is rendered; remove the scratch after.
- Report every version bump old→new and the audit delta in your final summary.

Do not run npm run build (R3 owns it). Commit in reviewable increments; do not push.
```

---

### Prompt R3 — Build reproducibility + CI gate (HIGH reasoning)

```
You are Opus, implementing remediation phase R3 for STAGE FRONT (D:\STAGE FRONT).
Prerequisites: R1 and R2 are merged. Read STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md
sections P0-1, P1-7, P2-5, P2-6 and docs/roadmap/STAGE_REMEDIATION_PLAN.md §R3.

GOAL
A clean production build that completes deterministically inside a declared budget,
starts under next start, and a CI pipeline gating every commit on it.

CONTEXT
- Pre-R1, builds stalled in static generation because school/program pages fetched
  huge Directus payloads over a slow link; staticPageGenerationTimeout was raised to
  300s as a symptom patch. R1 shrank the data path; your job is to prove the build
  is now deterministic and remove crutches that are no longer needed.
- Historical failure signature: 3× "took more than 300 seconds" on schools pages on
  a cold cache, then clean 263/263 on re-run. Full build historically ~25 min; it
  should be far faster post-R1 — measure it.

TASKS
1. Add npm scripts: a clean script that removes .next (and stale generated types)
   before typecheck/build; wire typecheck to run against cleaned output.
2. Run the full build twice from clean. Both must complete and produce
   .next/prerender-manifest.json. Then next start and smoke the routes. If the build
   still stalls, diagnose which route/fetch stalls it (build output order, targeted
   logging) and fix within R1's bounded-query rules — do not raise timeouts, do not
   switch pages to force-dynamic as a blanket fix. A targeted rendering-strategy
   change for a page that shouldn't be static (e.g. reducing generateStaticParams
   breadth for program pages) is acceptable if you state the trade-off.
3. Reassess staticPageGenerationTimeout: lower it to a value with headroom over the
   measured per-page worst case, and record the measurement in the config comment.
4. package.json: add engines (current Node major on this machine — check node -v)
   and pin the package manager; note the extraneous-packages finding by doing a
   clean npm ci verification.
5. Create .github/workflows/ci.yml gating: npm ci → npm audit --omit=dev (fail on
   high) → clean typecheck → npm test → npm run build → next start + smoke.
   Smoke suite: a small script (script or Playwright-free node fetch checks) that
   asserts HTTP 200 + a content marker on ~10 routes: /, /pricing, /contact,
   /schools, one school detail, one program detail, /search?q=piano, /dashboard,
   /ielts-lab, /ielts-lab/browse — and HTTP 404 on /schools/does-not-exist (if R4
   has not landed yet, mark the 404 check as expected-fail with a comment referencing
   R4, and flip it when R4 merges).
   IMPORTANT: CI needs Directus reachable; if the instance (http://47.86.26.168:8055)
   is not reachable from CI runners, structure the workflow so build+smoke run in an
   environment with access (self-hosted runner or documented manual gate) and say so
   plainly in the workflow comments — do not fake it with mocks.
6. Write docs/ops/release.md: build budget (from your measurements), the build/start/
   smoke procedure, rollback steps (previous artifact/commit), and the post-deploy
   step: run the existing Directus relationship verifier after any deploy that
   follows an import.
7. Report route artifact sizes (HTML/RSC for the top routes) against the audit's
   table (schools.html was 1.43 MB) as a report-only budget table in release.md —
   enforcement comes during reconstruction, not now.

PROTECTED CONTRACTS
- No changes to public routes, DTOs, reviewer behavior, IELTS Lab, or Speaking scope.
- Never restore deleted routes to satisfy stale generated types — clean the types.

VERIFICATION
- Two consecutive from-clean builds complete; artifact starts; smoke passes.
- Report both build wall times, the worst per-page generation time, and the artifact
  size table in your final summary.

Commit in reviewable increments; do not push unless asked.
```

---

### Prompt R4 — Mobile overflow + honest 404s (MEDIUM reasoning)

```
You are Opus, implementing remediation phase R4 for STAGE FRONT (D:\STAGE FRONT).
Prerequisite: R1 merged (R2/R3 may land in parallel). Read
STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md sections P0-4, P1-10, TD-12 first.

GOAL
Zero horizontal document overflow on core discovery surfaces at mobile widths, and
real HTTP 404s for invalid detail URLs. Containment fixes only — no visual redesign,
no spacing/typography/color changes, no component rewrites. Reconstruction handles
aesthetics later; you are fixing broken, not beautifying.

MEASURED FAILURES (audit, 375px viewport)
- School catalog program view: document scrollWidth 505px.
- Search results: scrollWidth 734px; a wrapper around ProgramCard measured ~718px.
- The search page reintroduces a wrapper pattern around ProgramCard that the catalog
  code itself documents as causing min-content overflow. Read the catalog
  implementation's existing comments about this before fixing search — apply the
  documented containment pattern (min-width: 0 / proper grid or flex containment at
  the shared boundary), don't invent a new one.

TASKS
1. Fix horizontal overflow at 320/375/390px on: /schools (school view AND filtered
   program view), /search results, school detail, program detail. Root-cause each
   overflow (min-content propagation, fixed widths, unwrapped flex rows) rather than
   applying overflow-x: hidden — hiding scroll clips content and is not acceptable.
   An inner table/code region may scroll within its own container; the document must
   not.
2. Invalid school/program IDs: call Next.js notFound() from the detail pages when
   the record doesn't exist, instead of rendering an in-page state with HTTP 200.
   Keep the existing in-page missing-data presentation for partial data on valid
   records — only fully-missing records become 404s.
3. If R3's smoke suite already exists, flip its 404 expected-fail check to active.

PROTECTED CONTRACTS
- No changes to data loading, DTOs, reviewer surfaces, IELTS Lab, Speaking scope.
- Do not change what content renders — only how it is contained.

VERIFICATION (screenshots hang on this machine — use read_page/javascript_tool)
- Dev server via .claude/launch.json. For each of the five surfaces at 320, 375,
  390px (resize_window then javascript_tool):
  document.documentElement.scrollWidth === window.innerWidth. Report the matrix
  (5 surfaces × 3 widths) in your final summary.
- Also verify 768px and desktop are unchanged (no regression from containment).
- curl -s -o NUL -w "%{http_code}" on /schools/does-not-exist and a bad program URL
  → 404. Valid detail URLs still 200 with correct content.
- npm test passes; typecheck passes.

Commit in reviewable increments; do not push.
```

---

### Prompt R5 — Launch content & legal implementation (MEDIUM reasoning)

```
You are Opus, implementing remediation phase R5 for STAGE FRONT (D:\STAGE FRONT).
Prerequisites: R1–R4 merged, AND the Fable content decision sheet exists at
docs/roadmap/R5_CONTENT_DECISIONS.md. If that file does not exist or leaves any
required value TBD, STOP and report — do not proceed with placeholders, and do not
invent legal text, URLs, addresses, or claims under any circumstances. Read
STAGE_FRONT_PHASE_1_PRE_LAUNCH_AUDIT.md sections P0-5, P1-9, TD-27 first.

GOAL
Make every public claim, count, label, and destination true and owner-approved.

TASKS (each item takes its value from the decision sheet — you choose none of them)
1. Replace href="#" privacy/terms links with the approved destinations. If the sheet
   provides page copy, create the routes in the (marketing) group per its structure;
   if it provides external URLs, link them.
2. Replace hello@stage.example with the approved monitored address everywhere it
   appears (grep the repo — footer, contact page, any metadata).
3. Marketing counts: per the sheet, either derive from live data via the R1
   bounded loaders (e.g. school/program counts — small count queries, never bulk
   fetches) or remove the figures. No hardcoded editorial numbers remain.
4. Reconcile availability labels: dashboard and IELTS Lab are live — remove/replace
   "coming soon / under development" copy in FAQ, nav, and marketing sections per
   the sheet.
5. Capability claims: adjust IELTS/AI/four-skill marketing copy to the sheet's
   approved wording (the product today demonstrates a reading-focused corpus with
   static/local feedback; claims must not exceed that). Do not soften or strengthen
   beyond the exact approved wording. NOTE: copy changes only — no IELTS Lab code,
   and nothing that touches Speaking scope (frozen).
6. Inert controls, per the sheet's ruling for each: remove (bell icon, if so ruled;
   收藏/对比 bottom-nav placeholders) or wire to an approved existing destination.
   Removing a nav item must not break the bottom-nav layout at mobile widths (R4's
   zero-overflow invariant holds).
7. "Login" label/destination: implement exactly the sheet's ruling (e.g. relabel to
   match its actual dashboard behavior). Do not build any authentication.

PROTECTED CONTRACTS
- Copy conventions: Chinese-first, English names verbatim, existing subtitle pattern.
- No new features, no auth, no IELTS/Speaking changes, no data-layer changes beyond
  the count queries in task 3.

VERIFICATION
- grep confirms no href="#" legal links, no stage.example, no stale "coming soon"
  for live features.
- Rendered check (read_page/fetched HTML) of /, /pricing, /contact, footer, FAQ:
  content matches the decision sheet line-by-line; counts match a manual Directus
  count query.
- R4 width matrix re-run on any page whose nav/footer changed.
- npm test + typecheck pass; run the R3 smoke suite.
- Final summary: a table mapping each decision-sheet item → implementing commit.

Commit in reviewable increments; do not push.
```

---

## 4. Codex verification gates

After each Opus phase, Codex verifies the phase's exit evidence before the next
strictly-dependent phase starts. Final program gate: re-run the audit's failed
checks (build ×2, start, payload/latency measurements, mobile widths, audit scan,
content conformance); all five P0s PASS; Fable signs and master-roadmap Phase 2 opens.
