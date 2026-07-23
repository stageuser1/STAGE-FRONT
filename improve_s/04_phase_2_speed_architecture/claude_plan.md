# Phase 2 — Speed Architecture · Claude Plan

**Status:** ⬜ Awaiting owner approval — **blocked on C1, C2, C3 (D-016)**
**Branch:** `perf/s1-speed-track`
**Rollback point:** `86c1db9` (Phase 0 baseline)
**Baseline of record:** `01_phase_0_baseline/report.md` (accepted, D-016)

> ★ **Highest-value phase in the program.** Users feel the improvement here and
> nowhere else. Everything after this is quality, security, and durability.
>
> Merges the original brief's Phases 2 and 3 (D-000b): this repository has one
> shared loader, not independent per-route data paths, so "benchmark one route
> then roll out" is not executable. **The benchmark unit is `loadDirectusData()`.**

---

## Objective

**Remove Directus from the request path.** Serve public routes from cache;
consult Directus only at build time and on revalidation.

**Success = warm TTFB under 1 second with zero Directus requests at request time.**

---

## 0. Measured baseline (from Phase 0 — do not re-derive)

### Per-collection transfer, every render, all routes

| # | Collection | Bytes | Share | Duration |
|---:|---|---:|---:|---:|
| 1 | `schools` | 9,206 | 0.03% | 104 ms |
| 2 | `program_offerings` | 2,076,109 | 7.6% | 1,733 ms |
| 3 | `application_requirements` | 3,090,406 | 11.3% | 2,404 ms |
| 4 | `audition_requirements` (403) | 415 | — | 139 ms |
| 6 | `audition_requirements` (fallback) | **6,415,237** | **23.5%** | 3,850 ms |
| 5 | `source_records` | **15,731,434** | **57.6%** | 3,724 ms |
| | **TOTAL** | **27,322,807** | **100%** | ~3,850 ms wall |

Source: `batch4_d015_home.stdout.txt`. Requests run concurrently via
`Promise.all`, so wall-clock ≈ the slowest, not the sum.

### Timing medians (local production build)

| Route | Cold | Warm | Directus share |
|---|---:|---:|---:|
| `/` | 3718 ms | 5237 ms | ~75–80% |
| `/search` | 3049 ms | 3358 ms | ~78% |
| `/schools/[schoolId]` | 3649 ms | 4054 ms | ~76% |
| `.../programs/[programId]` | 3707 ms | 3691 ms | ~71% |

**Warm is not faster than cold on any route; three of four are slower.** That is
the `cache: "no-store"` signature under controlled conditions.

### The number that frames this phase

> **The homepage transfers 27.32 MB to render a page whose primary entity —
> `schools` — is 9.2 KB, or 0.03% of the payload.**

---

## 1. Server Component migration strategy

### 1.1 Current data-fetching path

**There is no client-side fetching to migrate.** The app already uses Server
Components correctly. Only `app/login/page.tsx` and `app/error.tsx` are client
pages. **Any plan proposing a `useEffect` refactor is wrong for this repo.**

Every public route funnels through one function:

```
app/page.tsx ─┐
app/search/page.tsx ─┤
app/schools/[schoolId]/page.tsx ─┼─→ getAllSchools / getAllPrograms
app/schools/[schoolId]/programs/[programId]/page.tsx ─┤   getSchoolById / getProgramById
                                                       │   getProgramsBySchoolId / searchPrograms
                                                       ↓
                                    loadDirectusData()   lib/data.ts:980
                                    React cache() — dedupes WITHIN one request only
                                                       ↓
                              5 × directusFetch(limit=-1, cache:"no-store")
                                                       ↓
                                     in-memory join + JS filtering
```

Two compounding costs:

1. **Transfer** — 27.32 MB per request (§0).
2. **CPU** — the joins are O(programs × related rows) and were negligible at 334
   programs. At 1,938: `sourceRecords.filter(...)` per program
   (`lib/data.ts:1038`) ≈ 34.2M comparisons, plus two `selectCurrentCycle`
   scans ≈ 7.8M. **~42M array comparisons per request.**

`getProgramById` (`lib/data.ts:1366`) loads the entire database to return one
program. `searchPrograms` (`lib/data.ts:1382`) filters the full dataset in JS.

### 1.2 Target architecture

```
Build / revalidation (once per window)          Request time (every user)
──────────────────────────────────────          ─────────────────────────
Directus → Next.js Data Cache                   Cache → HTML
27.32 MB, ~4 s                                  0 Directus requests
                                                sub-second
```

- Public routes prerendered where their shape allows
- `/search` stays dynamic (it reads `searchParams`) but renders **over cached data**
- Explicit revalidation window replaces `cache: "no-store"`
- `generateStaticParams` over ~1,958 detail pages (20 schools + 1,938 programs)

**Reviewer state does not block any of this.** Auth is entirely client-side via
`localStorage` (`lib/directus-auth.tsx:40`); no server session forces dynamic
rendering. Public pages are already safe to cache.

### 1.3 Which routes migrate first — and why the order is unusual

Because all four routes share one loader, **the fetch-level cache change fixes
all of them simultaneously.** There is no per-route rollout to sequence.

The sequencing that matters is *by change type*, not by route:

| Order | Change | Blast radius | Risk |
|---:|---|---|---|
| 1 | Fetch Data Cache (`lib/data.ts:165`) | All routes at once | **Very low** — one line, perfectly reversible |
| 2 | Remove `force-dynamic`, add `revalidate` | 4 route files | Low |
| 3 | `generateStaticParams` | 2 detail routes | Medium — build duration |

**Benchmark route for verification: `/schools/yale_school_of_music`.** It is
representative (detail route, 7 Directus requests, real content, source
citations), it has a stable known-good URL from Phase 0, and its Phase 0
medians (3649 ms cold / 4054 ms warm) are the comparison of record.

`/pilot/*` is **out of scope** for this phase. Leave `lib/pilot-data.ts:122`
untouched; disposition is D-007, decided in Phase `03_`/`05_`.

---

## 2. Directus query optimization

### 2.1 The core judgement — read this before planning any query work

**Caching solves the 27.32 MB problem. Query narrowing does not.**

After Batch 1, the 27.32 MB is paid **once per revalidation window**, not once
per request. At any realistic traffic level that is a >99% reduction in Directus
load and removes the transfer entirely from user-perceived latency.

Query narrowing only improves the **cache-miss path** — the revalidation itself.
That is worth something (faster builds, less link pressure) but it is
second-order, and it carries far more regression risk because it requires
proving, field by field, that nothing rendered depends on what is removed.

**Recommendation: do the caching in this phase. Do not narrow queries in this
phase.** Narrowing is proposed below as an evidence-gated follow-up, not as
Phase 2 work.

### 2.2 Field allowlist strategy — already done, correctly

There are **no `fields=*` patterns in the codebase.** Explicit allowlists
already exist throughout `lib/data.ts` (see the comment at `lib/data.ts:844`).
Someone did this work already. **Nothing to fix here.**

The remaining bulk is not sloppy field selection — it is **row volume**:
17,663 source records, 2,087 audition requirements, 1,938 programs.

### 2.3 Relationship depth reduction

Current expansion is one level and already narrow — `program_offerings` expands
`school_id`, `field_id`, `degree_level_id` to named sub-fields only
(`lib/data.ts:852-885`). **No unbounded relation expansion exists.** No change
proposed.

### 2.4 Request count reduction

| Route | Now | After Batch 1 (warm) |
|---|---:|---:|
| `/` | 6 | **0** |
| `/search` | 6 | **0** |
| school detail | 7 | **0** |
| program detail | 7 | **0** |

The 6th request is the documented `audition_requirements` fallback (D-013). It
persists on the revalidation path. **Do not remove the optimistic query** — the
`"field" in record` detection is deliberate and activates when the columns are
added (`skills/backend_engineer_role.md`).

### 2.5 Evidence-gated follow-up (NOT Phase 2 work)

Recorded so it is not lost, and so nobody attempts it inside this phase.
Each requires proving no visible change first:

| Opportunity | Size | Blocker to resolve first |
|---|---:|---|
| `/` and `/search` may not need per-program `sources` at all — `latestSchoolUpdate` (`lib/format.ts`) uses only `max(accessed_at)` | up to 15.73 MB | Needs a server-side aggregate or denormalized column; changes the data contract |
| `/` and `/search` may not need full `audition_requirements` — but `ProgramCard` reads `program.data_quality`, which derives from audition `review_status` | up to 6.42 MB | Must prove `data_quality` is unchanged for every program |
| Per-entity queries so `getProgramById` stops loading the database | n/a | Only matters on the revalidation path once caching lands |

**Do not attempt any of these in Phase 2.**

### 2.6 PostgreSQL

**No index work.** Deferred pending evidence (D-000c). The demonstrated
bottleneck is round trips and row volume, not query execution. Nothing in the
Phase 0 baseline points at the database.

---

## 3. ISR and cache strategy

### 3.1 Recommended window: **900 seconds (15 minutes)**

Set it in **one place** — `directusFetch` (`lib/data.ts:165`) — as the single
source of truth, and mirror it in the route-level `revalidate` exports.

**Why 900 s:**

| Factor | Reasoning |
|---|---|
| Editorial rhythm | Admissions data changes on a cycle basis, not minute to minute. Imports arrive in batches (9 schools in one commit). |
| Reviewer expectation | 15 minutes is a defensible "your edit appears shortly" promise without on-demand invalidation. |
| Revalidation cost | 27.32 MB per window. At 900 s: ~96 refreshes/day ≈ 2.6 GB/day. At 3600 s: ~656 MB/day. Both acceptable; 900 s buys freshness cheaply. |
| Link fragility | Revalidation over a link that can drop to ~0.2 MB/s may take minutes. **Stale-while-revalidate means users never wait for it** — they get the cached page while the refresh happens in the background. |

**Consider 3600 s later** if revalidation proves expensive in practice. Start
conservative on freshness; loosen with evidence.

### 3.2 Trade-offs the owner is accepting (C1 / D-006)

**The one that matters:** once public pages are cached, a reviewer's edit is
visible **in their own session immediately** — the editable cards hold
optimistic local state — but **does not appear for other viewers until
revalidation.**

| Trade-off | Effect | Mitigation |
|---|---|---|
| Editorial latency | Up to ~15 min for other viewers | Document the expectation; on-demand invalidation stays deferred (D-000d) |
| Compounded staleness | Page-level and fetch-level timers can stack; worst case approaches 2× the window | Set both to the same value; treat ~30 min as the true worst case |
| Cache masking bad content | A wrong value persists for the window | Bounded window; QA verifies `last_checked` dates post-deploy |
| Build duration | ~1,958 pages over a slow link | Documented fallback in Batch 4 |

### 3.3 Invalidation approach

**Time-based only. On-demand invalidation stays deferred (D-000d).**

Three levers, in order of preference:

1. **Time-based expiry** — the default path, 900 s.
2. **Redeploy** — a deployment clears the Data Cache; the existing escape hatch
   for "publish this now."
3. **On-demand `revalidateTag`** — Phase 5, deferred. Do **not** implement it in
   this phase, and do not add cache tags "ready for later" — untested
   infrastructure is a liability.

> Note the deferral is a closer call than at the V2 analysis: at ~1,958 pages a
> full rebuild is expensive. Re-evaluate at this phase's gate if build duration
> proves painful.

---

## 4. `evidence_metadata` handling (condition C2)

### 4.1 What was found at the Phase 0 gate

Phase 04's original Batch 3 said: *"If nothing reads it: remove. If something
reads it: stop and report."* **Something reads it.**

```
lib/data.ts:977         evidence_metadata requested in sourceRecordFields
        ↓
lib/data.ts:755         sourceTopicKey() parses it, extracts ONE string: topic_key
        ↓
lib/data.ts:750         attached as SourceRecord.topic_key
        ↓
lib/school-detail.ts:293  inferredTopicKey() groups source citations into topic
                          sections on the school detail page — with a fallback
                          inference from related_field/title/url when absent
```

### 4.2 Two facts that resolve C2

1. **It is a performance question, not a security one.** Batch 5 measured
   `evidence_metadata` at **0 occurrences in every anonymous RSC payload**. It
   never reaches the client. It does not affect Phase `03_`'s scope.
2. **Removing it would cause a visible change.** The fallback in
   `inferredTopicKey` produces *different* groupings, not identical ones.
   Citations would regroup on the school page — prohibited by Global
   Constraint 1.

### 4.3 Decision: **keep it. Take no action in Phase 2.**

Caching removes the cost from the request path regardless, which is the entire
point of this phase. Removing the field would trade a visible regression for an
improvement only on the revalidation path.

**Explicitly forbidden in this phase:**
- Removing `evidence_metadata` from `sourceRecordFields` (`lib/data.ts:977`)
- Changing `sourceTopicKey()` or `inferredTopicKey()`
- Adding a Directus column or changing the schema to hold `topic_key`

### 4.4 Safe optimization path, if revalidation cost later justifies it

Gated on evidence, and on proving byte-identical output:

1. **Measure first.** Determine what share of the 15.73 MB `source_records`
   payload `evidence_metadata` actually is — by comparing a with/without probe
   on the revalidation path only.
2. **Check nested selection.** Directus generally cannot select a property
   inside a JSON column via `fields`. Verify before assuming; if it can,
   `evidence_metadata.topic_key` is the clean fix.
3. **Route-scoped narrowing.** `topic_key` is used **only** by
   `lib/school-detail.ts` — the school detail page. `/`, `/search`, and the
   program page never read it. A route-specific query could omit it for three of
   four routes.
4. **Prove equivalence.** Any change must produce an identical rendered
   citation grouping on the school page, verified by HTML diff.

**None of this happens in Phase 2.**

---

## 5. Execution batches

Each batch = one commit on `perf/s1-speed-track`, separately revertable,
**measured before the next begins**.

### Batch 1 — Fetch Data Cache ★ the whole phase in one line

`lib/data.ts:165`: replace `cache: "no-store"` with `next: { revalidate: 900 }`.
**Touch no other line.**

Measure `/`, `/search`, `/schools/yale_school_of_music`, and the program route —
5 cold + 5 warm each, medians, against Phase 0.

> ⚠️ **Expected complication — not a failure.** `export const dynamic =
> "force-dynamic"` changes the default fetch-cache behaviour for a route. Batch 1
> may therefore show **little or no improvement on its own**, with the win
> arriving only after Batch 2 removes `force-dynamic`. **This is diagnostic, not
> a stop condition.** Record the result and proceed to Batch 2. Do not "fix" it.

**Rollback:** revert one line.

### Batch 2 — Rendering mode

Remove `export const dynamic = "force-dynamic"` from the four public routes
(`app/page.tsx:10`, `app/search/page.tsx:14`,
`app/schools/[schoolId]/page.tsx:18`,
`app/schools/[schoolId]/programs/[programId]/page.tsx:7`); add
`export const revalidate = 900`.

**Verify in the build output, do not assume:** `/`, school, and program routes
static/ISR; `/search` dynamic (it reads `searchParams`) but serving cached data.

**This is where the improvement should appear if Batch 1 alone did not deliver it.**

**Rollback:** restore four one-line exports.

### Batch 3 — `evidence_metadata`: measure only

**No code change.** Record what the earlier "remove `evidence_metadata`"
instruction has been superseded by (§4, C2). Confirm in the report that the
field is retained deliberately.

> The original Batch 3 ("remove the field") is **cancelled** by D-016 / §4.3.

### Batch 4 — `generateStaticParams`

Add to both detail routes. ~1,958 pages (20 schools + 1,938 programs). Record
build duration and page count.

**Fallback if build duration is unacceptable:** static params for the 20 school
pages only, leaving program pages to `dynamicParams` (generated on first
request, then cached). Keeps the win on the highest-traffic pages without a
1,938-page build over a slow link. **Record the reason if the fallback is used.**

**Rollback:** remove the two functions.

### Batch 5 — Full measurement

All four routes, 5 cold + 5 warm, medians, vs. Phase 0. Plus: Directus request
count per route (target **0** warm), build duration, page count, route-level JS.

---

## 6. Codex execution instructions

Full package to be written to `codex_execution.md` on approval. Binding
constraints:

### Files Codex MAY change

| Path | Permitted change |
|---|---|
| `lib/data.ts` | **Line 165 only** — the fetch cache option |
| `app/page.tsx` | Remove `force-dynamic`; add `revalidate` |
| `app/search/page.tsx` | Remove `force-dynamic`; add `revalidate` |
| `app/schools/[schoolId]/page.tsx` | Remove `force-dynamic`; add `revalidate`; add `generateStaticParams` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Same |
| `improve_s/04_.../report.md`, `improve_s/logs/*` | Write / append |

### Files Codex MUST NOT change

- **Any other line of `lib/data.ts`** — including `sourceRecordFields:977`,
  `sourceTopicKey:755`, `fetchAuditionRequirements:947`, and every field list
- Any `components/**` file
- `lib/pilot-data.ts`, `lib/school-detail.ts`, `lib/format.ts`,
  `lib/markdown.tsx`, `lib/directus-auth.tsx`
- `data/types.ts` — DTOs are Phase `03_`
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `.env*`
- `app/login/page.tsx`, `app/layout.tsx`, `app/error.tsx`, `app/loading.tsx`
- Any Directus schema, permission, record, or column

### Forbidden actions

- Installing or removing any dependency
- Editing any configuration file
- Any Directus change of any kind
- Removing `evidence_metadata` or altering topic-key logic (§4.3)
- Removing the optimistic `audition_requirements` query (D-013)
- Adding cache tags or `revalidateTag` (Phase 5, deferred)
- Changing `directusFetch`'s retry/backoff/timeout logic
- "Fixing" anything discovered in passing — report it instead

### Validation commands — after **every** batch

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
npm test
```

Then: the Path B ten-check manual QA checklist (`01_phase_0_baseline/report.md`
§7), an HTML content diff on one school and one program page against the Phase 0
RSC captures in `01_phase_0_baseline/payloads/`, and a reviewer login + edit
round-trip after Batches 2 and 4.

### Stop conditions

Phase 0's S1–S13 carry over unchanged, including the D-013 known-403 exception
and the D-014 bounded retry protocol for raw connectivity failures. Additionally:

| # | Condition |
|---|---|
| P2-S1 | Any visible content difference vs. the Phase 0 payload captures |
| P2-S2 | A route's rendering mode differs from this plan's expectation |
| P2-S3 | Any measured route gets **slower** than Phase 0 |
| P2-S4 | Reviewer login or edit round-trip breaks |
| P2-S5 | Build duration exceeds 30 minutes (use the Batch 4 fallback, report it) |

**Batch 1 showing no improvement is NOT a stop condition** — see Batch 1.

---

## 7. Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| Reviewer edits invisible to other viewers | High | Medium | Medium | Inherent to ISR; owner accepts at C1/D-006; 900 s window |
| `force-dynamic` masks Batch 1's effect | **High** | Low | Easy | Anticipated above; proceed to Batch 2, do not fix |
| Shared loader — one line reaches every route | High | Medium | Medium | Small batches; measure each; per-batch revert |
| Cache serves stale/wrong content | Medium | High | **Hard** | Bounded window; QA verifies `last_checked` post-deploy |
| Production-only dynamic rendering | Medium | Medium | **Hard** | Assert mode from build output **and** deployed cache headers |
| ~1,958-page build over a slow link | Medium | Medium | Easy | Batch 4 fallback to schools-only |
| Revalidation stampede — 27.32 MB refresh | Medium | Low | Medium | Stale-while-revalidate; users never wait |
| 404 semantics change under prerendering | Medium | Low | Medium | Pages currently return **200** with `EmptyState` (`app/schools/[schoolId]/page.tsx:31`); tell QA in advance |

---

## 8. Acceptance criteria

- [ ] Build output shows `/`, school, and program routes as static/ISR
- [ ] `/search` dynamic, serving cached data
- [ ] **Warm TTFB < 1 s on all four routes**
- [ ] **Directus request count = 0 at request time on warm static routes**
- [ ] Measured against Phase 0 medians, ≥5 runs, cold and warm separated
- [ ] HTML content diff vs. Phase 0 payloads: identical on school and program pages
- [ ] Reviewer login works; reviewer edits still save
- [ ] Path B ten-check QA checklist passes
- [ ] `npm run typecheck`, `npm run build`, `npm test` pass after every batch
- [ ] No dependency, configuration, or Directus change
- [ ] `evidence_metadata` retained; topic-key grouping unchanged
- [ ] Owner has accepted the ISR staleness trade-off (C1 / D-006)
- [ ] Rollback commit recorded before Batch 1

---

## 9. Entry conditions — must be resolved before Batch 1

| # | Condition | Status |
|---|---|---|
| **C1** | **D-006** — revalidation window + staleness acceptance. **This plan recommends 900 s (§3.1).** Batch 1 cannot start undecided. | ⬜ Open |
| **C2** | `evidence_metadata` — **resolved by this plan (§4): keep it, no action.** Owner to confirm. | 🟡 Proposed |
| **C3** | **D-010** — execution order confirmed | ⬜ Open |
| **C4** | **D-001** — Preview environment. Blocks this phase's **exit gate**, not its start. | ⬜ Open |

---

## 10. Expected outcome

| Metric | Baseline | Target |
|---|---:|---:|
| Directus requests per request-time render | 6–7 | **0** |
| Transfer per render | 27.32 MB | **0** (warm) |
| Warm TTFB, school detail | 4054 ms | **< 1000 ms** |
| Warm TTFB, `/` | 5237 ms | **< 1000 ms** |
| Directus share of render | ~75–80% | ~0% |
| Route-level JS | unchanged | unchanged — not this phase's target |

Hypotheses until measured. The mechanism is well understood; the magnitude is
not yet proven in this environment.
