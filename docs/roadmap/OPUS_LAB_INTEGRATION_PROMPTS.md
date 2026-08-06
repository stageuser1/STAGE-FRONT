# Opus Stage Prompts — E-track (IELTS Lab × Staff Platform integration)

**Owner rulings (E0, 2026-08-02):** blueprint approved as written; **E2 is merged with B1** (community card + beacons + lab events land as ONE customer-repo change).
**How to use:** one fresh Claude Code session per stage, in order E1 → E2 → E3. E1 runs in `D:\stage-staff\stage-staff`; E2 runs in `D:\STAGE FRONT`; E3 is cross-system verification/ops with no code changes.
**Model & reasoning:** E1 = Opus, HIGH · E2 = Opus, MEDIUM · E3 = Opus, LOW (fast mode acceptable).
Governing document: `docs/roadmap/STAGE_LAB_STAFF_INTEGRATION_BLUEPRINT.md` in the STAGE FRONT repo ("the E-Blueprint") — copy it into the stage-staff repo for E1.

---

## E1 — Staff-side expansion: vocabulary v2 + Lab dashboard  ·  Opus, HIGH

```
You are executing stage E1 of the STAGE Lab×Staff integration track, in the
stage-staff repository (the app lives at the repo's stage-staff/ directory).

READ FIRST: the E-Blueprint (STAGE_LAB_STAFF_INTEGRATION_BLUEPRINT.md — §6 event
model, §7 dashboard, §9 risks are binding); this repo's README (event contract),
src/lib/events.ts, db/schema.sql, db/views.sql, scripts/migrate.mjs; the S-Plan
page-cap and data-boundary rules it references.

MISSION: extend the existing pipeline for IELTS Lab analytics. Integration, not
rebuild — the existing 8 event kinds, tables, views, and pages stay untouched
except where this prompt names them.

TASKS
1. Vocabulary v2 in src/lib/events.ts — add exactly three kinds (payload keys via
   the EXISTING field-spec types only, no free text):
   - lab_module_view      { section }
   - lab_practice_start   { section, contentId: slug ≤48 }
   - lab_practice_submit  { section, contentId: slug ≤48,
                            questionCount?: int 1–60, accuracyPct?: int 0–100 }
   `section` reuses the existing SECTION enum (listening|reading|writing|speaking).
   The existing 8 kinds are byte-for-byte unchanged.
2. Database migration for the kind storage. `event_kind` is a Postgres ENUM and
   scripts/migrate.mjs wraps everything in one BEGIN/COMMIT — ALTER TYPE ... ADD
   VALUE has transactional restrictions (a value added in a transaction cannot be
   used in that same transaction). Decide and implement ONE of:
   (a) an idempotent pre-transaction step in migrate.mjs that adds the enum values
       outside the main transaction, or
   (b) convert kind to TEXT with a CHECK constraint listing the allowed kinds
       (keeping the DB-level last-line-of-defence the schema comments promise).
   Requirements either way: migration is idempotent, re-runnable, and safe on the
   LIVE production database that already contains rows (test this explicitly by
   seeding a scratch DB with old-vocabulary rows, then migrating). Update the
   CHECK constraints that mirror the application contract.
3. New aggregation views in db/views.sql, following the existing unique-visitor
   nesting discipline and its comment style:
   - v_lab_modules_weekly: per ISO week × section — unique viewers, starters,
     submitters (nested counts, same visitor-dedup rule as v_funnel_weekly)
   - v_lab_content_top: per ISO week × section × contentId — starts, submits
   - v_lab_accuracy_dist: per ISO week × section — histogram buckets of
     accuracyPct (10-point buckets), reading/listening rows only
4. Dashboard: ONE new unified "IELTS Lab" page (this is the 5th and last page —
   per-module dashboards are explicitly forbidden): four-module weekly usage
   comparison, per-module view→start→submit mini-funnel, top content by
   contentId (render the slug; do NOT call Directus for titles), accuracy
   histogram. Plus: one summary card on the Overview page (weekly lab-active
   visitors + module split), and a Lab paragraph in the weekly-report composer
   (lab weekly actives, hottest module, starts, submits) added to its Markdown
   output. Follow the existing page/query/style patterns exactly.
5. Fixtures: extend the seed script to generate plausible v2 events (all four
   sections, varied contentIds and accuracy) so the new page demos fully;
   everything still seeded=true and removable by db:unseed.
6. Tests: extend the node --test suite — new kinds accepted, unknown still
   rejected, accuracyPct boundary values (0, 100, 101→reject), section enum
   enforcement, and a migration-idempotency test if the harness allows.
7. README: update the canonical event contract section — E2 will code against
   this text. State clearly which events the customer site emits and when.

CONSTRAINTS: no new npm dependencies; no user tables; no Directus access of any
kind; append-only preserved (no update/delete paths); accuracy is a raw percent
and must never be converted to or labelled as an IELTS band anywhere, including
the dashboard (standing C1 ruling); no realtime.

VERIFY: typecheck/build/tests green; migrate twice in a row on a scratch DB with
pre-existing data — second run is a no-op; seed → all five pages render; unseed
→ lab page shows its empty state, not zeros presented as data.

FINISH: commit(s) on main (do not push unless the remote is configured). Report:
migration approach chosen (a or b) and why, contract diff, page walkthrough,
open items for E3.
```

---

## E2 — Customer-site instrumentation + community card (merged B1)  ·  Opus, MEDIUM

```
You are executing stage E2 of the STAGE Lab×Staff integration track, in the
STAGE FRONT customer repository. This is the ONLY growth/analytics change that
touches this repo, and it also delivers the community guidance card (former B1,
merged here by owner ruling). Small code, strict discipline.

READ FIRST: docs/roadmap/STAGE_LAB_STAFF_INTEGRATION_BLUEPRINT.md (§5 emission
rules, §6 events, §10 do-not-touch — binding); docs/roadmap/
STAGE_VISUAL_REPLACEMENT_PLAN.md §4 gates + §6 preservation list (still apply);
docs/roadmap/STAGE_BUSINESS_PLATFORM_BLUEPRINT.md v2 §2 (card placements);
docs/ops/WECHAT_PRIVATE_DOMAIN_PLAYBOOK.md §2–3 (card purpose and tone); the
stage-staff README event contract as updated by E1 (canonical payload shapes).

MISSION
1. lib/growth/ emitter (~50 lines budget): anonymous visitor id (random opaque
   string, created once, stored under a stage.growth.* localStorage key with
   schemaVersion inside the payload, never regenerated, no PII); a fire-and-
   forget send function (navigator.sendBeacon preferred, fetch keepalive
   fallback) posting the E1 contract shape to the ingest URL from an env var;
   silent failure; total no-op when the env is unset. Analytics must never
   block, delay, or break the user experience — offline changes nothing.
2. Emission points — UI layer ONLY (result panels, submit handlers, route/page
   components). Forbidden locations: data adapters, StaticListeningSource, any
   lib/ielts contract or scoring module, the vendored iframe runtime.
   - lab_module_view {section}: on entering each module's main surface
     (reading browse, listening library, writing task list, speaking flow entry)
   - lab_practice_start {section, contentId}: reading practice route entry;
     listening practice route entry; writing task open; speaking question chosen
   - lab_practice_submit: reading — in the host chrome's PRACTICE_COMPLETE
     handler (iframe untouched) with questionCount + accuracyPct; listening —
     submit handler with the same; writing — 完成本次练习 handler (no accuracy);
     speaking — 独立表达 completion (no accuracy)
   - existing-vocabulary events per the B-track rules: lab_first_practice
     {section} on a visitor's first-ever submit, lab_active_day once per
     visitor per calendar day on lab surfaces, suite_complete, review_opened,
     community_card_shown/click, qr_page_view
   Each event fires exactly once per its rule — no retries, no queues.
3. Community guidance card (merged B1): one component, App-family visual
   language, three placements — result panel after first submit, review page,
   dismissible thin banner on the lab overview (dismissal persists via the
   existing nudge pattern). QR image is a static asset the owner provides
   (WeCom group live QR); value-proposition copy follows the playbook §3 tone
   and every Lab copy red line (guard stays green: no 估算/Band/倒计时/模考/
   待核验/待公布 wording).
4. One-line anonymous-statistics disclosure on the site's privacy/legal surface.

CONSTRAINTS: no new npm dependency; no mechanism changes (records, sessions,
routing, LabNav, vendored player, listening source/contracts/OSS all untouched);
npm run typecheck / build / test / guard all green; route table unchanged;
zero behavioural difference when the ingest env is unset.

VERIFY: run a local mock ingest (or the stage-staff dev deployment) and walk the
full flow in the browser pane — module view, start, submit for each of the four
modules, card shown/click — confirming each event's payload shape and fire-once
rule via the mock's log (use read_page/javascript_tool; screenshots hang on this
machine). Then unset the env and confirm the lab behaves identically with zero
network attempts. Confirm no preservation-list file was touched.

FINISH: one focused commit on main (no push). Report: files touched (expect
≤ ~12 given four modules + card), event evidence table (event → trigger →
observed payload), guard/gate results.
```

---

## E3 — End-to-end verification, cutover, first real report  ·  Opus, LOW (fast mode acceptable)

```
You are executing stage E3 of the STAGE Lab×Staff integration track — production
verification and cutover. No code changes in either repo; configuration and
verification only. If you find a defect, report it for a fix session rather than
patching ad hoc.

READ FIRST: the E-Blueprint §8–§9; the E1 and E2 stage reports; the stage-staff
README (env vars, unseed discipline).

TASKS, in order
1. Configuration check on the stage-staff Vercel project: INGEST_ALLOWED_ORIGINS
   lists the real customer-site production origin(s) (missing this makes every
   event 403 — E-Blueprint risk 6); STAFF_DATABASE_URL present; access
   protection still active (curl an unauthenticated request → blocked).
   On the customer-site project: the ingest URL env var points at the staff
   deployment.
2. Production smoke: on the live customer site, perform one scripted pass —
   visit each module, start one practice, submit one (reading or listening),
   trigger the community card. Then query the staff database views (or the Lab
   page) and confirm each expected event arrived exactly once with sane
   payloads.
3. Cutover: run db:unseed against production (it deletes only seeded=true rows —
   verify row counts before/after: real rows from step 2 survive). Confirm the
   Lab page now shows the real trickle and its empty-state handling looks
   correct rather than fake-populated.
4. First real weekly report: generate it from the report page; confirm the Lab
   paragraph renders with real (small) numbers and every manual field is
   clearly empty rather than fabricated. Save the Markdown output into the
   weekly reports location per docs/ops/WECHAT_PRIVATE_DOMAIN_PLAYBOOK.md §6.
5. Write a short verification report: config state, event evidence table,
   unseed before/after counts, report sample, and any defects found (with
   repro) for follow-up sessions.

CONSTRAINTS: read-only on both codebases; no schema changes; no re-seeding
production after cutover; do not "fix" anything inline — defects go in the
report.

FINISH: deliver the verification report (file in the STAGE FRONT repo under
docs/roadmap/E3_VERIFICATION_REPORT.md is fine) and state plainly: integrated /
integrated-with-defects / blocked.
```
