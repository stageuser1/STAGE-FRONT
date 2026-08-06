# STAGE FRONT — Phase 1 Pre-Launch System Audit

**Audit date:** 2026-07-27  
**Repository:** `D:\STAGE FRONT`  
**Scope:** Read-only audit of the current frontend, its Directus integration, user interactions, performance, and production readiness.

## Executive verdict

STAGE FRONT is **not ready for a production launch in its current state**.

The product has a coherent route structure, a functioning Directus data model, useful loading and empty states, and a substantial set of passing data/import tests. The current Directus dataset also passes the repository's relationship verifier. These are strong foundations.

Launch is blocked by five concrete issues:

1. A clean production build did not finish and did not produce a startable deployment artifact.
2. The main Directus source-record request is approximately 15 MB and took 63.6 seconds during this audit; it is part of the shared bulk-loading path used by public pages.
3. The production dependency tree contains three reported high-severity vulnerability groups.
4. Core search/catalog screens overflow horizontally on a 375 px mobile viewport.
5. Public launch content still contains dead legal links, an example-domain email address, and claims/status copy that conflicts with the live product.

The recommended decision is to close the P0 items and establish a repeatable build/deployment gate **before** beginning the full UI reconstruction.

### Scope guardrails

This audit does not propose a change to STAGE's product direction, a redesign of IELTS Lab, any expansion or contraction of Speaking scope, or a backend-architecture replacement. Recommendations concerning Directus are limited to frontend query shape, delivery behavior, validation, and operational controls.

## Audit method and evidence

The audit included:

- static inspection of the Next.js application, route groups, components, state/storage helpers, Directus adapters, reviewer controls, and import scripts;
- a live interaction pass over the running application, including navigation, filters, search, loading/empty behavior, and mobile-width measurements;
- production build, TypeScript, unit/data test, and dependency security checks;
- read-only Directus response measurements and execution of the repository's existing relationship verifier;
- inspection of generated Next.js artifacts and route payload sizes.

### Verification snapshot

| Check | Result |
|---|---|
| Automated tests | Pass: 89 tests (79 library, 8 importer, 2 validator) |
| Source TypeScript check | Pass after regenerating stale `.next` route types |
| Directus relationship verifier | Pass |
| Current verified data | 20 schools, 1,938 offerings, 1,938 applications, 2,087 auditions, 17,663 sources |
| Broken program relations | 0 |
| Orphan application/audition records | 0 |
| Invalid source scopes | 0 |
| Production build | Fail: did not complete within the audit window |
| Startable production artifact | Fail: `.next/prerender-manifest.json` missing |
| Production dependency audit | Fail: 3 high-severity vulnerability groups |
| UI/component end-to-end tests | Not present |

The relationship result is a point-in-time validation of the current connected dataset. It does not remove the need for a deployment-time check or runtime monitoring.

# 1. System Architecture Summary

## 1.1 Application map

The repository is a single Next.js 15 App Router application using React 19, TypeScript, and Tailwind CSS. There is no `src/` wrapper and no custom application API layer in the current route tree.

```text
app/
├── layout.tsx                         Root metadata, fonts, global AuthProvider
├── error.tsx                          Global client error boundary
├── (marketing)/
│   ├── /                              Landing page
│   ├── /pricing
│   └── /contact
├── (explore)/
│   ├── /schools
│   ├── /schools/[schoolId]
│   ├── /schools/[schoolId]/programs/[programId]
│   ├── /search
│   ├── /login
│   └── pilot school/program routes
├── (product)/
│   ├── /dashboard
│   └── /profile
└── (ielts)/
    ├── /ielts-lab
    ├── /ielts-lab/browse
    ├── /ielts-lab/suite
    ├── /ielts-lab/history
    ├── /ielts-lab/mistakes
    ├── /ielts-lab/review/[recordId]
    └── /ielts-lab/practice/[examId]
```

### Layout and shell hierarchy

- The root layout wraps every route in the client-side reviewer `AuthProvider`.
- Marketing and product routes share the marketing navigation/footer visual family.
- Explore routes add the reviewer session bar and mobile bottom navigation.
- IELTS uses its own `LabChrome` shell and nested `LabNav`; practice is a full-bleed route.
- There is no custom `not-found` route, middleware, instrumentation entry point, sitemap, robots route, or health endpoint.

### Component organization

Components are grouped by domain:

- shared root/UI primitives;
- marketing sections;
- explore, school, program, fit, reviewer, and pilot components;
- profile and dashboard flows;
- IELTS catalog, runner, history, mistakes, and review components.

This organization is understandable, but several domain components have become page-sized subsystems:

| File/module | Approximate size |
|---|---:|
| `lib/data.ts` | 1,874 lines |
| `ProgramDetailSections.tsx` | 1,050 lines |
| `ExamRunner.tsx` | 562 lines |
| `PracticeHistory.tsx` | 546 lines |
| `SuitePractice.tsx` | 520 lines |
| `ProfileFlow.tsx` | 514 lines |
| `DashboardView.tsx` | 456 lines |
| `ReviewerEditableCard.tsx` | 412 lines |

There are 159 TypeScript/TSX files in the inspected application/library scope; 44 declare `"use client"` (about 28%).

## 1.2 Rendering and state architecture

### Public catalog data

The predominant public data path is:

```text
Next.js server page
  → cached loadDirectusData()
    → five Directus collection requests with limit=-1
      → in-memory normalization and relationship joins
        → large server-rendered page/RSC payload
          → client catalog/filter components
```

The default cache period is 900 seconds. School pages statically generate parameters for all schools. Program pages pre-generate only a small subset and allow other paths dynamically.

Search has a narrower loader than the full catalog, but it still requests complete offerings/application/audition collections and performs filtering and ranking in application memory.

### User state

Profile, saved programs, IELTS records, drafts, and related dashboard state are browser-local. The dashboard explicitly describes its state as local. IELTS offers JSON/Markdown history export and JSON import, but profile and saved-program data have no equivalent recovery path.

### Reviewer state

Reviewer login goes directly from the browser to Directus. Access and refresh tokens are stored in `localStorage`; reviewer edit components read and patch Directus records directly. The UI checks for reviewer/administrator role names, but real authorization depends on correctly configured Directus permissions.

### IELTS runtime

IELTS content is served from a public corpus of legacy JavaScript/explanation assets (approximately 6.34 MB in total). Practice dynamically injects or embeds those assets and communicates with the runner through a message contract. Learner progress and analytics remain local to the browser.

## 1.3 Design-system usage

Two intentional token families coexist:

- explore surfaces: `brand`, `ink`, `line`, `page`;
- application/marketing surfaces: `--stage-*` variables and `stage-*` Tailwind classes.

`lib/ui/surface.ts` maps the explore/application surface choice. This is a useful compatibility seam for reconstruction.

The implementation is not fully tokenized:

- approximately 150 raw or arbitrary color-class occurrences were found;
- pilot screens contain a separate slate/violet treatment;
- repeated button, card, spacing, and border class strings appear despite shared primitives;
- the global stylesheet mixes tokens, marketing atmosphere, animations, and layout helpers.

The risk is visual drift during reconstruction, not an immediate runtime failure.

## 1.4 Architecture risks

- The global reviewer auth provider adds client hydration and local-storage work to marketing, public explore, and IELTS routes.
- `lib/data.ts` combines transport, retry, schema fallback, mapping, validation notes, joins, search, and public DTO construction.
- Whole-collection fetches make build and cold-route reliability dependent on Directus latency and dataset growth.
- In-memory joins repeatedly filter large arrays; their cost grows with both offerings and source records.
- Large client components concentrate interaction, storage, presentation, and business rules in the same files.
- Browser-local product state has no account sync or complete backup path.
- The legacy IELTS asset/runtime boundary is functional but fragile and must be preserved deliberately during UI work.

## 1.5 Architecture recommendations

These recommendations do not require changing Directus backend architecture:

1. Define small, route-specific public DTOs and request only the fields/relations each route needs.
2. Remove source evidence metadata from catalog/list payloads; fetch evidence only on the detail or reviewer surface that displays it.
3. Paginate or bound public collection reads rather than using `limit=-1`.
4. Add request cancellation/timeouts, structured error classification, and measurable latency budgets.
5. Move reviewer auth hydration to the reviewer-enabled route boundary instead of the root layout.
6. Split monoliths by responsibility only after behavior is covered by tests and the P0 launch path is stable.
7. Preserve the `surface` token seam through reconstruction; consolidate visual primitives incrementally after parity.

# 2. Critical Issues

Priority definitions:

- **P0:** launch blocker; must be resolved and verified before public release.
- **P1:** important reliability, security, usability, or operational risk.
- **P2:** maintainability or quality improvement that can follow a stable launch baseline.

## P0 — Launch blockers

### P0-1: Production build is not reproducible or startable

`npm run build` remained in static generation for more than seven minutes and did not complete. Although a build ID was emitted, the build lacked `.next/prerender-manifest.json`; `next start` failed with `ENOENT`.

The repository already raises `staticPageGenerationTimeout` to 300 seconds and comments that a source query has historically been about 20 MB/27 seconds. This treats the symptom but does not make the build deterministic.

**Impact:** No deployable artifact was proven. A launch cannot safely rely on a build that may time out or leave a partial `.next` directory.

**Required exit evidence:** A clean install and clean production build complete within a declared time budget, the artifact starts successfully, and a route smoke test passes.

### P0-2: Directus bulk loading exceeds safe latency and payload budgets

The public bulk loader requests five complete collections. Live measurements during this audit included:

| Request | Payload | Wall time |
|---|---:|---:|
| Schools | ~0.01 MB | 3.9 s |
| Program offerings | ~1.98 MB | 9.67 s |
| Source records | ~15 MB | 63.63 s |

Requests have two attempts and a fixed 250 ms retry delay, but no abort timeout. Source records are joined in memory across offerings and schools.

**Impact:** Build stalls, cold-page latency, memory pressure, failure amplification, and worsening behavior as the dataset grows.

**Required exit evidence:** Route-specific bounded queries, source evidence removed from list/catalog paths, request timeout behavior, and measured build/cold-route budgets.

### P0-3: High-severity production dependency vulnerabilities

`npm audit --omit=dev` reported three high-severity vulnerability groups affecting the installed production tree, including Next.js 15.5.20 and transitive PostCSS/Sharp packages.

**Impact:** Known denial-of-service, request-handling, cache, image, and native-library advisories remain in the deployable dependency graph.

**Required exit evidence:** Upgrade to patched supported versions, repeat audit, run all tests, build, and route smoke tests.

### P0-4: Core mobile search/catalog layouts overflow horizontally

At a 375 px viewport:

- the school catalog's program view had a document scroll width of 505 px;
- search results had a document scroll width of 734 px;
- search rendered a card wrapper approximately 718 px wide.

The search page reintroduces a wrapper around `ProgramCard` even though the catalog implementation records that this wrapper pattern causes min-content overflow. A filtered catalog also rendered 508 program rows at once.

**Impact:** Core discovery content is clipped/off-canvas on common phones and large result sets create responsiveness risk.

**Required exit evidence:** No horizontal overflow at 320/375/390 px across catalog, filtered program view, search results, school detail, and program detail; keyboard/touch smoke tests pass.

### P0-5: Public launch content and legal/contact destinations are unfinished

- Privacy and terms/service links use `href="#"`.
- The public contact address is `hello@stage.example`.
- Marketing counts are editorial placeholders and do not match the current connected data.
- FAQ/navigation copy says dashboard and IELTS are coming soon/under development while both are live.
- Marketing makes broad IELTS/AI/four-skill claims that are not demonstrated by the current reading-focused corpus and static/local feedback implementation.

**Impact:** Broken legal/contact flows and contradictory or unverifiable claims undermine launch compliance and trust.

**Required exit evidence:** Approved legal URLs, a real monitored contact destination, and a product/content sign-off against live capabilities and current data.

## P1 — Important issues

### P1-1: Reviewer credentials are exposed to browser storage risk

Directus access and refresh tokens are stored as plaintext in `localStorage`, and the browser talks directly to Directus. Any successful same-origin script injection could read them. The frontend role-name check is not a security boundary.

**Recommendation:** Confirm least-privilege Directus roles/CORS, reduce token lifetime and exposure, apply a strong CSP, and perform a focused reviewer threat review. Do not treat UI role checks as authorization.

### P1-2: No security-header policy is present

No middleware or deployment policy was found for CSP, HSTS, frame restrictions, referrer policy, or permissions policy.

**Recommendation:** Define headers at the application or deployment layer and test the reviewer/IELTS legacy runtime against them before enforcement.

### P1-3: Public error output may disclose implementation details

The global error boundary displays `error.message` and the Next.js digest to users.

**Recommendation:** Show a stable public message/reference ID while sending technical detail to protected monitoring.

### P1-4: Reviewer writes and public reads have no explicit cache-invalidation contract

Public Directus reads revalidate every 15 minutes. Reviewer patches call `router.refresh()`, but a refresh can still consume cached data. There is no tag-based invalidation or documented propagation expectation.

**Recommendation:** Define freshness expectations and introduce explicit frontend cache invalidation for successful reviewer changes.

### P1-5: Import batches can leave partial committed state

The V4 importer has dry-run, idempotent natural-key upserts, protected status handling, and journals. However, the nine-school batch executes sequentially and reports `partial_commit_possible=true` after a failure. There is no cross-batch transaction or automatic rollback.

**Recommendation:** Require dry run, pre-import backup, journal retention, post-import verification, and an exercised rollback runbook.

### P1-6: No production observability or product analytics integration was found

There is no error reporting, tracing, service-health telemetry, deployment health check, or production product-analytics integration. IELTS "analytics" is local learner progress logic, not operational telemetry.

**Impact:** Failures, regressions, slow Directus calls, and funnel breakage may be invisible after launch.

### P1-7: No CI/deployment gate is present

No checked-in CI workflow, deployment configuration, runtime version declaration, or automated route smoke suite was found.

**Recommendation:** Gate release on install, audit policy, typecheck, tests, clean build, start, and representative route smoke checks.

### P1-8: Learner state is device-local and incompletely recoverable

Clearing storage, changing browsers, or changing devices loses profile and saved-program state. IELTS offers export/import, but the wider product state does not. Some persistence helpers silently catch storage failures.

**Recommendation:** Make the limitation explicit at launch, surface storage-write failure to the user, and document recovery/support expectations. This audit does not prescribe a backend redesign.

### P1-9: Navigation semantics are inconsistent

- Desktop explore navigation exposes fewer primary destinations than the mobile bottom navigation.
- Search and school header back actions lead to the marketing homepage rather than the school catalog.
- "Login" routes to the local dashboard rather than an authentication flow.
- The notification bell is visible but has no action.
- "About" points to Contact.

**Impact:** Users lose context and encounter controls whose labels do not match behavior.

### P1-10: Invalid detail URLs render successful responses

Missing school/program records render an in-page state rather than invoking Next.js `notFound()`.

**Impact:** Invalid URLs can return HTTP 200, weakening SEO, monitoring, cache behavior, and link-integrity detection.

### P1-11: Public page payloads are excessive

Generated artifacts from the incomplete build included:

| Route artifact | Approximate size |
|---|---:|
| `/schools.html` | 1.43 MB |
| `/schools.rsc` | 1.14 MB |
| Manhattan school HTML | 573 KB |
| Juilliard school HTML | 379 KB |
| Colburn school HTML | 175 KB |
| Landing HTML | 113 KB |

The school catalog sends slim but still complete school/program data to a client filter. Recharts also produces a large emitted chunk (about 384 KB raw), though it is loaded separately.

**Recommendation:** Establish route payload budgets, keep charting dynamically scoped, and move filtering/pagination boundaries toward smaller server responses.

## P2 — Improvements

### P2-1: Monolithic modules increase change risk

`lib/data.ts` and multiple 400–1,000 line client components combine unrelated responsibilities. This will make a visual reconstruction harder to review and test.

### P2-2: Visual primitives and tokens are only partially consolidated

Two valid surface families coexist, but raw colors and duplicated utility strings bypass them. Pilot styling forms a third local pattern.

### P2-3: Search truncation messaging can be a false positive

The interface reports truncation when the ranked result count is exactly 50, but the ranking function already limits the list to 50. The caller cannot distinguish exactly 50 matches from more than 50.

### P2-4: Metadata and discoverability coverage is incomplete

Dynamic school/program/search metadata, sitemap, robots policy, manifest, and a custom not-found experience are absent.

### P2-5: Generated route types can become stale

The first TypeScript check failed because `.next/types` referenced deleted pilot/IELTS/Speaking routes. A build regenerated the route types and source TypeScript then passed.

**Recommendation:** Clean generated output before CI typecheck/build. Do not restore deleted Speaking routes merely to satisfy stale generated types.

### P2-6: Runtime/package discipline is incomplete

The package does not declare a Node engine or module type. Test execution emits module-type warnings, and the local installation contained extraneous packages not represented by the lockfile.

### P2-7: Automated interaction coverage is absent

The data/import suite is valuable, but there are no component, accessibility, or end-to-end tests for navigation, filters, storage, reviewer edits, or IELTS practice flows.

# 3. Technical Debt Register

| ID | Area | Debt/evidence | Consequence | Recommended disposition |
|---|---|---|---|---|
| TD-01 | Data | `lib/data.ts` contains transport, schema fallbacks, mapping, joins, search, and DTO construction | High regression surface | Split by responsibility after P0 behavior is covered |
| TD-02 | Data | Five `limit=-1` bulk reads | Dataset growth directly degrades build/runtime | Replace with bounded route-specific field sets |
| TD-03 | Data | Source evidence metadata loaded on shared public path | ~15 MB/63.6 s request | Fetch evidence only where displayed |
| TD-04 | Data | Repeated array filtering for joins | Superlinear CPU cost as sources grow | Index records in memory as an interim frontend fix |
| TD-05 | Reliability | No fetch abort timeout | Requests can occupy build/runtime indefinitely | Add timeout, typed errors, and telemetry |
| TD-06 | Reliability | Audition schema fallback catches any error | Non-schema failures can be retried/misclassified | Fall back only on the expected unknown-field response |
| TD-07 | Reliability | Source-quote enrichment silently falls back | Missing evidence can be invisible | Record structured degradation and surface reviewer diagnostics |
| TD-08 | Rendering | Root layout is client-hydrated for reviewer auth | Unneeded JS/work on all surfaces | Scope provider to reviewer-enabled routes |
| TD-09 | Rendering | Large public page/RSC payloads | Slow transfer/parse/hydration | Add payload budgets and smaller DTOs |
| TD-10 | Rendering | Hundreds of filtered rows render at once | Mobile responsiveness risk | Bound/paginate/virtualize after interaction design is approved |
| TD-11 | Components | Several 400–1,000 line client components | Harder isolated testing and reconstruction | Extract behavior seams after parity tests exist |
| TD-12 | UI | Wrapper/min-content overflow pattern recurs | Broken mobile layout | Add `min-width: 0`/grid containment at shared boundary and test |
| TD-13 | UI | Repeated card/button class strings | Visual drift | Consolidate primitives within existing design direction |
| TD-14 | Design | Raw colors coexist with two token families | Theme inconsistency | Route new work through surface/token mapping |
| TD-15 | Navigation | Desktop/mobile destination sets differ | Discoverability inconsistency | Define one information architecture contract |
| TD-16 | State | Product state uses local storage | Device loss/no sync | Document limitation; add visible persistence failure handling |
| TD-17 | Reviewer | Tokens stored in local storage | XSS credential theft risk | Reduce exposure and harden reviewer surface |
| TD-18 | Reviewer | GET assertion then PATCH is not atomic | Concurrent edits can still overwrite | Document collision behavior; consider version-aware writes if supported |
| TD-19 | Cache | Reviewer refresh does not invalidate shared cache | Verified edits may appear stale | Add explicit frontend invalidation contract |
| TD-20 | Import | Batch can partially commit | Operational repair burden | Mandatory backup, journal, verifier, rollback rehearsal |
| TD-21 | IELTS | Legacy script/iframe/message bridge | Fragile CSP/runtime boundary | Freeze and contract-test; do not redesign in this phase |
| TD-22 | Assets | Corpus ships ~6.34 MB of public JS/text assets | Deployment/cache footprint | Preserve file contracts; measure caching before any optimization |
| TD-23 | Images | No Next Image pipeline; current pages are mostly CSS/placeholder visual media | Future reconstruction could introduce unbudgeted image cost | Set image format/size/LCP budgets before adding production imagery |
| TD-24 | Quality | No UI/E2E/accessibility suite | Regressions likely during reconstruction | Add a thin critical-flow suite before large UI changes |
| TD-25 | Operations | No CI, health check, monitoring, or deployment manifest | Failures discovered late | Establish minimum release pipeline |
| TD-26 | SEO | Invalid detail paths return in-page 200; metadata sparse | Indexing/monitoring ambiguity | Use proper 404s and route metadata |
| TD-27 | Content | Placeholder/contradictory public copy | Trust/compliance risk | Product/legal content sign-off before launch |
| TD-28 | Tooling | Stale `.next` types break standalone typecheck | False failures and developer confusion | Clean generated artifacts in checks |
| TD-29 | Tooling | Node version/module contract unspecified | Environment drift | Pin supported Node/package-manager versions |

# 4. UI Reconstruction Constraints

These constraints should be handed intact from Fable strategy to Claude Design and Opus implementation.

## Product and scope constraints

1. Preserve STAGE's current product direction and the school/program discovery hierarchy.
2. Do not redesign IELTS Lab in this reconstruction. Treat its navigation, corpus identifiers, record schema, import/export behavior, and runner message contract as protected interfaces.
3. Do not add, restore, remove, or reinterpret Speaking functionality as part of frontend reconstruction. Deleted/stale generated Speaking routes are not a scope signal.
4. Do not replace Directus or change its backend architecture. Query-shape and delivery fixes must work against the existing collections and relations.

## Route and behavior constraints

5. Preserve public route contracts and deep links for schools, programs, search, dashboard/profile, pilot pages, and IELTS record/exam IDs.
6. Preserve reviewer status semantics, protected record handling, field-level patch behavior, and source-evidence visibility.
7. Preserve current loading, empty, error, and missing-record meanings even if their presentation changes later.
8. Preserve local-storage keys, record versions, migration rules, and IELTS import/export compatibility unless a separately planned migration exists.
9. Do not convert server routes/layouts into client components merely for visual convenience.
10. Do not send Directus reviewer objects, tokens, or source-record blobs through public client props.

## Design-system constraints

11. Treat the explore and application token families as an existing compatibility boundary. New components should select a surface explicitly rather than hard-code a third palette.
12. Establish behavior and visual baselines before consolidating primitives. A token cleanup must not silently change hierarchy, status colors, focus states, or data meaning.
13. Retain semantic HTML, visible keyboard focus, labelled form controls, reduced-motion behavior, and mobile safe-area handling.
14. Remove inert controls or give them an approved behavior; do not preserve fake affordances for visual symmetry.

## Responsive and performance constraints

15. Core flows must be tested at 320, 375, 390, 768, 1024, and a representative desktop width.
16. Zero horizontal document overflow is a release invariant.
17. Set budgets before reconstruction for initial JS, route RSC/HTML, number of rendered result rows, LCP imagery, and Directus response size/latency.
18. Future imagery must use an intentional responsive image pipeline. Current placeholder/CSS visuals do not validate production image performance.
19. Keep Recharts and other heavy interaction libraries route-scoped/dynamically loaded.

## Content and evidence constraints

20. Counts, AI claims, skill coverage, verification language, "live/soon" labels, and source evidence must reflect observable product behavior and current data.
21. Design must distinguish verified, awaiting-review, unavailable, and degraded-source states without implying certainty.
22. Legal/contact destinations require owner-approved real URLs and addresses; presentation work cannot substitute for that approval.

# 5. Production Readiness Checklist

`PASS` means verified during this audit. `PARTIAL` means a foundation exists but the launch condition is unmet. `FAIL` means a required check failed. `MISSING` means no implementation/evidence was found.

## Build and release

- [ ] **FAIL — Clean production build completes.** Current build did not finish.
- [ ] **FAIL — Production artifact starts.** Prerender manifest was missing.
- [x] **PASS — Source TypeScript compiles after fresh route-type generation.**
- [x] **PASS — Current automated test suite passes (89 tests).**
- [ ] **MISSING — UI/end-to-end smoke suite covers critical routes.**
- [ ] **MISSING — CI gates install, typecheck, tests, audit, build, start, and smoke checks.**
- [ ] **MISSING — Supported Node and package-manager versions are pinned.**
- [ ] **MISSING — Deployment configuration and rollback procedure are documented.**
- [ ] **MISSING — Bundle/HTML/RSC performance budgets are enforced.**

## Directus and data

- [x] **PASS — Current relationship verifier reports no broken/orphan relations.**
- [x] **PASS — Importer has dry-run, idempotent upsert behavior, protected statuses, and journals.**
- [ ] **FAIL — Public query latency/payload is within budget.** Source query measured ~15 MB/63.6 s.
- [ ] **MISSING — Frontend Directus requests have abort timeouts.**
- [ ] **PARTIAL — Retry handling exists, but backoff/error classification is limited.**
- [ ] **MISSING — Reviewer writes explicitly invalidate affected public cache entries.**
- [ ] **PARTIAL — Import rollback instructions exist, but automatic transaction/rollback does not.**
- [ ] **MISSING — Pre-import Directus backup and tested restore are mandatory operational gates.**
- [ ] **MISSING — Post-deploy relationship verification is automated.**

## Security and privacy

- [ ] **FAIL — Production dependency audit is clear of high-severity findings.**
- [ ] **MISSING — CSP/HSTS/frame/referrer/permissions headers are defined and tested.**
- [ ] **PARTIAL — Directus token is server-only where used server-side; reviewer tokens remain in browser local storage.**
- [ ] **MISSING — Directus reviewer roles, field permissions, CORS, and token lifetime have documented production review evidence.**
- [ ] **FAIL — Public error UI hides internal messages/digests.**
- [ ] **MISSING — Security incident/contact process is documented.**
- [ ] **MISSING — Data-retention/privacy implications of browser-local learner data are documented.**

## User experience and content

- [ ] **FAIL — Core pages have no horizontal overflow on supported mobile widths.**
- [x] **PASS — Catalog filters and keyword search work in the audited happy path.**
- [x] **PASS — Major catalog/search/profile/dashboard/IELTS empty or loading states exist.**
- [ ] **PARTIAL — Error states exist, but global output exposes technical detail and route-specific recovery varies.**
- [ ] **FAIL — All visible buttons and links have meaningful destinations/actions.**
- [ ] **FAIL — Legal and contact destinations are production-ready.**
- [ ] **FAIL — Public claims, counts, and availability labels have product/legal sign-off.**
- [ ] **MISSING — Keyboard, screen-reader, and automated accessibility acceptance tests.**
- [ ] **PARTIAL — Reduced-motion CSS exists; full interaction accessibility was not proven.**
- [ ] **MISSING — Invalid school/program URLs return an HTTP 404.**

## Monitoring and operations

- [ ] **MISSING — Error reporting is connected and release-tagged.**
- [ ] **MISSING — Directus request latency/error metrics and alerts exist.**
- [ ] **MISSING — Application health/readiness endpoint or equivalent synthetic check exists.**
- [ ] **MISSING — Product analytics/events are defined with consent/privacy review.**
- [ ] **MISSING — Uptime monitoring covers landing, catalog, search, a detail page, and an IELTS entry point.**
- [ ] **MISSING — Backup frequency, retention, ownership, restore objective, and restore test are documented.**
- [ ] **MISSING — Launch-day rollback owner and decision threshold are documented.**

# 6. Recommended Fix Order

## Gate 0 — Freeze and record the baseline

- Keep this audit, the current verifier output, test result, and measured payload/latency figures with the release record.
- Declare supported runtime versions and a representative production-like environment.
- Confirm Directus backup ownership and perform a restore rehearsal before any import or launch migration.

**Exit condition:** The team can reproduce the audit checks without relying on one developer machine.

## Gate 1 — Remove immediate security exposure

- Upgrade Next.js and affected production dependencies to patched supported versions.
- Re-run the dependency audit, typecheck, tests, and interaction smoke checks.
- Stop exposing raw error messages/digests to public users.
- Define the production security-header policy, testing the legacy IELTS runtime and reviewer functions before enforcement.

**Exit condition:** No unaccepted high-severity production advisories and no known public diagnostic leakage.

## Gate 2 — Make Directus delivery bounded and build-safe

- Replace the shared bulk query with route-specific field sets.
- Keep source evidence out of catalog/search payloads and load it only when needed.
- Bound/paginate collection requests, introduce request timeouts, and classify retryable failures.
- Reduce repeated in-memory scans as an interim frontend optimization.
- Define reviewer-to-public cache invalidation/freshness behavior.

**Exit condition:** Directus requests and cold routes meet agreed payload/latency budgets, and failure behavior is deterministic.

## Gate 3 — Establish a reproducible release pipeline

- Clean generated output before checking/building.
- Make clean build and `next start` succeed.
- Add CI for locked install, dependency policy, typecheck, tests, build, start, and representative route smoke tests.
- Add deployment rollback instructions and an automated post-deploy relationship check.

**Exit condition:** The same commit repeatedly produces a startable artifact and passes smoke checks.

## Gate 4 — Repair core launch UX and content

- Fix mobile overflow in search and filtered catalog views and verify all core widths.
- Correct navigation destinations/labels and remove or complete inert controls.
- Return proper 404 responses for invalid detail routes.
- Replace example contact/legal destinations.
- Reconcile counts, capability claims, and "live/soon" language with the actual product.

**Exit condition:** All critical discovery paths are usable on mobile and all launch-facing content is approved.

## Gate 5 — Harden reviewer and import operations

- Verify least-privilege Directus roles/fields and reviewer CORS/token policy.
- Define token/session handling and concurrent-edit expectations.
- Require backup → dry run → commit → verifier → journal review for imports.
- Exercise a partial-import recovery procedure.

**Exit condition:** A reviewer/import failure can be detected, contained, and recovered without guesswork.

## Gate 6 — Add observability and recovery

- Connect protected error reporting and Directus latency/error telemetry.
- Add uptime/synthetic checks and launch alerts.
- Define privacy-reviewed product events.
- Document browser-local data limitations and user-facing recovery/export behavior.

**Exit condition:** The launch team can detect and diagnose broken routes, slow data, and funnel failures.

## Gate 7 — Begin UI reconstruction under explicit budgets

- Capture desktop/mobile visual and behavioral baselines.
- Protect route, storage, reviewer, and IELTS contracts with a thin end-to-end suite.
- Use the existing surface/token seam, server boundaries, and route-specific DTOs.
- Enforce zero horizontal overflow and agreed JS/RSC/image budgets on every reconstructed flow.

**Exit condition:** Reconstruction can proceed without reopening the launch architecture or changing protected product scopes.

## Gate 8 — Reduce P2 debt incrementally

- Split monolithic modules along tested responsibility boundaries.
- Consolidate repeated primitives and remove raw color drift.
- Complete metadata/sitemap/not-found coverage.
- Resolve tooling warnings and package-install drift.

These changes should follow, not precede, the P0/P1 reliability baseline.

---

## Handoff statement

The current product has valid data relationships and meaningful working flows, but the delivery path is too large and slow, the production build is unproven, and core mobile/content/security gates remain open. Fable strategy should treat P0 closure as the precondition for reconstruction planning. Claude Design should work within the protected routes, surfaces, data states, and IELTS/Speaking constraints above. Opus implementation should begin only with measurable build, Directus, mobile, and regression-test gates in place.
