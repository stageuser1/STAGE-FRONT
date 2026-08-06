# Opus Stage Prompts — STAGE Staff Platform (S-track) + B1

**How to use:** one fresh Claude Code session (Opus) per prompt. Order: S1 → S2 (S1b anytime; B1 only after T3 is complete AND the owner approves). S1/S2 run in the NEW `stage-staff` repository and never touch the STAGE Front repo. Reasoning level is stated per prompt. The governing plan is `docs/roadmap/STAGE_STAFF_PLATFORM_PLAN.md` in the STAGE Front repo (referred to as "the S-Plan"); copy it into the new repo in S1.

---

## S1 — Growth data backend (new repo scaffold)  ·  Reasoning: HIGH

```
You are executing stage S1 of the STAGE Staff Platform track (S-track).

CONTEXT: STAGE is a music-education platform (Next.js customer site + Directus content
backend). The customer site is local-first and anonymous; a parallel growth track will
send ≤8 kinds of anonymous funnel events. You are building the internal data backend
that receives and aggregates them. Read the S-Plan first (docs/roadmap/
STAGE_STAFF_PLATFORM_PLAN.md — copy provided in this repo or pasted below); its §2–§4
rulings are binding.

MISSION: scaffold the `stage-staff` repository — one Next.js app containing the event
ingest endpoint, its own Postgres schema, weekly aggregation views, and fixtures. No
dashboard pages yet (that is S2).

TASKS
1. Scaffold a minimal Next.js (App Router, TypeScript, Tailwind) project. No extra
   dependencies beyond a Postgres client. Keep the dependency list defensible line by
   line.
2. Provision-ready DB layer for a small independent managed Postgres (NOT the Directus
   database — zero connection strings pointing at it, ever). Single append-only table
   for events with: id, event kind (enum of the 8 vocabulary items below), anonymous
   visitor id, ISO timestamp, schemaVersion, and a small JSON payload column. Add a
   second tiny table for manually-entered weekly community metrics (S2 will write it).
   Event vocabulary (frozen v1): lab_first_practice, lab_active_day, suite_complete,
   review_opened, community_card_shown, community_card_click, qr_page_view, visit
   (visit is normally covered by Vercel Analytics; accept it here for completeness).
3. POST /api/ingest — the ONLY public write path. Hard requirements:
   - strict payload validation against the vocabulary (unknown kind → 400, never stored)
   - no PII by construction: reject payloads containing extra fields beyond the
     contract; visitor id is an opaque random string, never validated against anything
   - basic abuse resistance: per-IP rate limit (in-memory or edge-config level is
     fine), payload size cap, same-origin/allowed-origin check with the customer
     site's domain configurable via env
   - append-only: no update or delete path exists in the app at all
4. Weekly aggregation as SQL views (or a single query module): events per kind per ISO
   week, unique visitor ids per week, funnel counts. Day-level freshness is fine;
   nothing realtime.
5. Fixtures + a seed script generating ~4 weeks of plausible fake events so S2 can be
   built and demoed without waiting for real traffic (B1 lands later). Mark fixture
   data clearly (e.g. a seeded flag) so it can be wiped in one statement.
6. Retention stance documented in the README: raw events kept 12 months then pruned
   (do not implement the pruner yet; document it).
7. Verification: typecheck + build green; a small node --test suite for payload
   validation (valid kinds accepted, unknown rejected, oversized rejected, PII-shaped
   extra fields rejected); README documenting env vars, the event contract (this is
   the canonical copy the customer-site B1 stage will code against), and the security
   posture.

CONSTRAINTS
- This repo never imports from or deploys with the STAGE Front repo.
- No auth system, no user tables, no CRM fields, no payment anything.
- No queue, no ORM beyond a thin client, no analytics SDK.
- If any decision seems to need a bigger architecture, STOP and flag it in the report
  instead of building it (S-Plan §8: nothing in this track justifies VERY HIGH scope).

FINISH: commit(s) on main of the new repo with clear messages; do not push unless the
remote is already configured by the owner. Report: what was built, the event contract
as implemented, security measures, open questions for the Codex security review.
```

---

## S1b — Directus Insights content-ops board  ·  Reasoning: LOW

```
You are executing stage S1b of the STAGE Staff Platform track: configure a content-ops
dashboard inside the EXISTING Directus admin using Insights panels only. This is
configuration work — no repository files change, no schema changes, strictly read-only
panels.

CONTEXT: Directus holds STAGE's schools/programs/requirements content. Staff need a
zero-code view of content coverage. The S-Plan (docs/roadmap/STAGE_STAFF_PLATFORM_PLAN.md
in the STAGE Front repo) §4 defines the need; decision point: if these panels cover it,
the custom staff app's Content page becomes just a link here.

TASKS
1. Inventory the relevant collections (schools, program offerings, application/audition
   requirements, source records) READ-ONLY — do not alter any collection, field, role,
   or permission.
2. Build one Insights dashboard with panels for: published school count; published
   program count by degree level; count of programs missing each decision-critical
   field (application deadline, language minimum, tuition, prescreening flag); items
   not re-verified in >180 days.
3. Screenshot/read back each panel's numbers and sanity-check two of them against a
   direct filtered listing.
4. Document the dashboard (name, where to find it, what each panel means, refresh
   expectations) in a short markdown note delivered in the report — the owner will file
   it under docs/ops.

CONSTRAINTS: no schema edits, no new roles, no API keys created, nothing deleted. If a
desired panel is impossible without schema change, note it in the report as a future
S-track item — do not implement it.

FINISH: report with the panel list, verification numbers, and the markdown note.
```

---

## S2 — Staff v0 application (4 pages + manual entry)  ·  Reasoning: MEDIUM

```
You are executing stage S2 of the STAGE Staff Platform track, in the `stage-staff`
repository created by S1. Read the S-Plan (§4 is your page contract) and the S1 README
(event contract, views).

MISSION: build Staff v0 — four pages plus one manual-entry form, on top of S1's data.

PAGES (S-Plan §4, binding)
1. Overview: this-week key numbers (lab_first_practice count, community_card
   shown/click, manually-entered weekly community adds and cumulative size) with a
   simple cumulative trend line. A plain link out to Vercel Analytics for traffic.
2. Growth funnel: weekly funnel visit→first practice→card click→joins(manual) with
   week-over-week deltas. Charts stay simple (bars/lines, one lightweight chart lib at
   most — prefer plain SVG/CSS if adequate).
3. Content coverage: EITHER a summary card set fed by read-only Directus API calls
   (counts only, service token with read-only scope, env-configured) OR — if S1b's
   Insights board proved sufficient (check the S1b report) — a single page linking
   there. Implement whichever the S1b decision selected; do not build both.
4. Weekly report: compose the weekly one-pager from the template in
   docs/ops/WECHAT_PRIVATE_DOMAIN_PLAYBOOK.md §6 (copy the template into this repo),
   auto-filling every number the database knows, leaving manual fields editable, with
   one-click copy-as-Markdown. This page is the track's main deliverable.
+ Manual entry form: weekly community numbers (new joins, cumulative, per-group),
   writing to S1's manual-metrics table. Idempotent per ISO week (re-submitting a week
   overwrites that week's row and says so).

ACCESS PROTECTION: platform-level first (Vercel team authentication or password
protection if the plan allows); otherwise a shared-secret Basic Auth middleware under
30 lines, secret via env. No user accounts, no roles.

VISUAL: reuse the STAGE App-family visual language — the owner will provide
docs/roadmap/T0_TOKEN_MAP.md from the STAGE Front repo; mirror its tokens as this
app's Tailwind theme. Density is utilitarian; no marketing polish. Chinese UI copy,
numbers with tabular-nums.

CONSTRAINTS: read-only against Directus (never a write token); no new tables beyond
S1's two; no realtime; no user-level drill-down (per-user data does not exist by
design — do not fake it); fixture data must render the full demo.

VERIFY: typecheck/build green; with S1 fixtures seeded, all four pages render
plausible numbers; manual form round-trip works and is idempotent; report page's
Markdown output matches the ops template field-for-field; access protection actually
blocks an unauthenticated request (curl check).

FINISH: commit(s) on main; report with page walkthrough (read_page text extracts are
fine), env var list for deployment, and anything deferred.
```

---

## B1 — Customer-site touchpoint + beacons  ·  Reasoning: MEDIUM
**GATE: run only after T-track stage T3 is complete AND the owner has approved this change to the customer repo.**

```
You are executing stage B1 of the STAGE growth track, inside the STAGE Front customer
repository. This is the ONLY growth-track change that touches this repo. It is small;
the discipline requirements are not.

READ FIRST: docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md (T-track constitution —
§4 gates and §6 preservation list apply to you); docs/roadmap/
STAGE_BUSINESS_PLATFORM_BLUEPRINT.md v2 (§2 architecture, §4 event vocabulary);
docs/roadmap/STAGE_STAFF_PLATFORM_PLAN.md §5; the S1 README's event contract (the
canonical shape you must emit); docs/ops/WECHAT_PRIVATE_DOMAIN_PLAYBOOK.md §2–3 (what
the community card is for).

MISSION
1. lib/growth/ module (≤ ~50 lines): anonymous visitor id (random, generated once,
   stored in localStorage under a stage.growth.* key with schemaVersion in the
   payload, never regenerated, no PII); a fire-and-forget beacon function posting the
   S1 contract events to the configured ingest URL (env), navigator.sendBeacon
   preferred, silent failure — analytics must NEVER break or delay the user
   experience; no-op when the env is unset (dev default).
2. Emit exactly these events at these moments: lab_first_practice (first-ever practice
   submit), lab_active_day (once per visitor per calendar day on lab pages),
   suite_complete, review_opened, community_card_shown / community_card_click,
   qr_page_view.
3. Community guidance card: one component, App-family visual language, shown at the
   three high-intent moments defined in the blueprint (after first submit on the
   result panel, on the review page, dismissible banner on the lab overview). QR image
   is a static asset provided by the owner (WeCom group live QR); include the value
   proposition copy per the playbook §3 tone, and follow every Lab copy red line
   (guard must stay green — no 估算/Band/倒计时/模考/待核验/待公布 wording).
4. A one-line anonymous-statistics disclosure added to the site's privacy/legal
   surface.

CONSTRAINTS (violating any of these fails the stage)
- No mechanism changes: records, sessions, routing, the vendored player, LabNav are
  untouched. The card and beacons are additive.
- No new npm dependency. No blocking network calls. Zero impact when offline.
- npm run typecheck / build / test / guard all green; route table unchanged.
- Dismissal of the overview banner persists (existing nudge-dismissal pattern).

VERIFY: with a local mock ingest (or the real S1 dev deployment), exercise the funnel
and confirm each event fires exactly once per its rule (use the browser pane +
read_page/javascript_tool — screenshots hang on this machine); confirm the Lab works
identically with the ingest URL unset; guard green.

FINISH: single focused commit on main (no push). Report: files touched (expect ≤ ~8),
event-firing evidence, and confirmation that no preservation-list item was touched.
```
