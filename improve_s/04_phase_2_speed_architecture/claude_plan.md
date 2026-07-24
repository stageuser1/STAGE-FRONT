# Phase 2 — Speed Architecture · Claude Plan

**Status:** 🔧 **REVISED after Batch 1 finding (D-018)** — mechanism corrected; re-issued for execution
**Branch:** `perf/s1-speed-track`
**Rollback point:** `86c1db9` (Phase 0 baseline); Batch 1 committed at `fdf5cc7`
**Baseline of record:** `01_phase_0_baseline/report.md` (accepted, D-016)

---

## ⚠️ Batch 1 finding — the fetch Data Cache cannot hold these responses (D-018)

**What happened:** Batch 1 switched `directusFetch` to `next: { revalidate: 900 }`.
The build passed, but during measurement Next.js emitted 154 cache-write
rejections:

> `Failed to set Next.js data cache … items over 2MB can not be cached`

| Collection | Cache-item bytes | Over 2MB? |
|---|---:|:---:|
| `source_records` | 20,976,456 | ✗ rejected |
| `audition_requirements` fallback | 8,555,082 | ✗ rejected |
| `application_requirements` | 4,122,101 | ✗ rejected |
| `program_offerings` | 2,769,823 | ✗ rejected |
| `schools` | 9,206 | ✓ cached |

**Four of five collections cannot enter the Next.js Data Cache.** The fetch-level
cache has a hard 2MB-per-entry limit, and `loadDirectusData()` returns five
monolithic blobs, four of which are 2.77–20.98MB.

**This invalidates the *Batch 1 mechanism*, not the *phase thesis*.** The
distinction is the whole pivot:

| Cache layer | Stores | 2MB limit? | Our payloads |
|---|---|:---:|---|
| **fetch Data Cache** (`next: {revalidate}`) | raw fetch responses | **Yes** | 4/5 rejected — **dead end** |
| **Full Route Cache** (static / ISR route output) | the rendered RSC/HTML | **No** | ~50–130KB per route — **fits easily** |

A statically-generated route runs its fetches at **build / revalidation time**
and caches the **rendered output** (~107KB for the school page — measured in
Phase 0). At request time it performs **zero** Directus fetches, so the 2MB
fetch-cache rejection is irrelevant. The 27.32MB is consumed once per window
during a background render, never on the user's request.

**Batch 1's change is still correct and is kept** — not as the caching
mechanism, but as a **prerequisite**: `cache: "no-store"` opts a route *out* of
static generation, so it had to go before any route could become static. It
simply was never sufficient on its own, and the plan wrongly presented it as the
load-bearing step.

**Consequence for `/search`:** it reads `searchParams`, so it is unavoidably
dynamic and **cannot** use the Full Route Cache. Its only caching option is the
fetch Data Cache — which rejects the payload. `/search` therefore needs a
**query boundary** (a narrow, search-specific projection), not a cache. This is
the one place the phase genuinely pivots to "query boundary + cacheable
fragment." See §5 Batch 5.

**Rejected alternative — custom `cacheHandler` to raise the 2MB limit.** It
would require a `next.config.ts` change plus an untested infrastructure
component, and it treats the symptom: caching and deserializing a 27MB blob per
window is itself wasteful. The Full Route Cache needs no config change and
stores 100KB, not 27MB. **Out of scope; do not pursue.**

**Second, separate finding — 2× HTTP 503 (the literal P2-S8 trigger).** During
39 rapid full-database renders, the audition fallback returned 503 twice. This
is transient host stress (`503 Service Unavailable`), *corroborating* why
per-request full-DB fetches must stop — not an independent blocker. Handled like
D-014: not ambient instability to design around, but real evidence the Directus
host struggles under repeated full loads. ISR replaces 39 measurement renders
with **one background render per 15-minute window**, which is far gentler.

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

### 1.2 Target architecture — corrected mechanism (D-018)

```
Build / revalidation (once per window)          Request time (every user)
──────────────────────────────────────          ─────────────────────────
Directus → render → FULL ROUTE CACHE            Route Cache → HTML
27.32 MB in, ~107 KB out                        0 Directus requests
(fetch Data Cache NOT used — 2MB limit)         sub-second
```

- **The caching mechanism is the Full Route Cache (static/ISR), not the fetch
  Data Cache.** It stores the ~50–130KB rendered output and has no 2MB limit.
- `/`, `/schools/[schoolId]`, `.../programs/[programId]` → statically generated
  with `revalidate`; **prerendered, zero request-time fetches**.
- `/search` reads `searchParams` → **cannot** be route-cached → gets a **narrow
  query boundary** instead (Batch 5). It renders dynamically, but over a small
  working set, not 27.32MB.
- Removing `cache: "no-store"` (Batch 1) is the **prerequisite** that lets a
  route be static — kept, but not the mechanism.
- `generateStaticParams` over ~1,958 detail pages (20 schools + 1,938 programs).

**Reviewer state does not block any of this.** Auth is entirely client-side via
`localStorage` (`lib/directus-auth.tsx:40`); no server session forces dynamic
rendering. Public pages are already safe to cache.

### 1.3 Which routes migrate first — corrected (D-018)

The fetch-cache change (Batch 1, done) was **not** the mechanism — it is a
prerequisite. The mechanism is per-route static generation, which **must be
proven on the benchmark before rollout**, because Batch 1 disproved the
assumption that a single global change would fix everything.

Corrected sequencing:

| Order | Change | Route(s) | Risk |
|---:|---|---|---|
| 1 (done) | Remove `no-store` → `revalidate` — prerequisite | loader | Very low, reversible |
| 2 | `force-dynamic`→ISR **+** `generateStaticParams` together | **benchmark only** | Medium — this is the decisive experiment |
| **GATE A** | Prove request-time Directus = 0 on the benchmark | — | — |
| 3 | Same, program route | program detail | Medium |
| 4 | Same, homepage | `/` | Low |
| 5 | **Query boundary** | `/search` | Medium — new data path |

**Benchmark route for verification: `/schools/yale_school_of_music`.** It is
representative (detail route, 7 Directus requests, real content, source
citations), it has a stable known-good URL from Phase 0, and its Phase 0
medians (3649 ms cold / 4054 ms warm) are the comparison of record.

**GATE A is now doubly important:** it must confirm the Full Route Cache
actually removes Directus from the request path despite the 2MB fetch-cache
rejection. If a warm benchmark request still hits Directus, the phase thesis is
wrong and everything stops. That is the single most important measurement in the
program.

`/pilot/*` is **out of scope** for this phase. Leave `lib/pilot-data.ts:122`
untouched; disposition is D-007, decided in Phase `03_`/`05_`.

---

## 2. Directus query optimization

### 2.1 The core judgement — CORRECTED after Batch 1 (D-018)

**Route-level caching solves the 27.32 MB problem for 3 of 4 routes. `/search`
needs a query boundary. Query narrowing is otherwise still not required.**

For the three static-shape routes, the Full Route Cache pays the 27.32MB **once
per revalidation window** during a background render and serves ~107KB output at
request time — a >99% reduction in request-time Directus load, removed entirely
from user-perceived latency. The 2MB fetch-cache limit does not touch this path.

**`/search` is the exception, and the one place the phase pivots.** It cannot be
route-cached (dynamic on `searchParams`) and cannot use the fetch Data Cache
(payload rejected). So `/search` gets a **narrow, search-specific query** — the
"query boundary" — sized to what the results list actually needs. This is both
faster uncached and small enough to become fetch-cacheable if desired.

For the three static routes, **do not narrow queries** — the route cache makes
it unnecessary, and narrowing carries regression risk. Narrowing beyond
`/search` remains an evidence-gated follow-up, not Phase 2 work.

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

> **The batch structure below is REVISED by D-018.** The authoritative,
> step-by-step version is in `codex_execution.md`. This is the rationale.

### Batch 1 — Remove `no-store` (DONE, `fdf5cc7`) — prerequisite, not mechanism

Already committed. Kept. Its role is corrected: it enables static generation, it
does not itself cache the large responses (the 2MB limit rejects them). No
revert. The phase builds forward from here.

### Batch 2 — Benchmark route: ISR **+** `generateStaticParams` together ★ decisive experiment

On `app/schools/[schoolId]/page.tsx` **only**: remove `force-dynamic`, add
`export const revalidate = 900`, and add `generateStaticParams` for the 20
schools — **in one batch**, because the Full Route Cache is only exercised when
the route is actually statically generated. Splitting them would leave an
untestable intermediate state.

**The measurement that matters:** a **warm** request to
`/schools/yale_school_of_music` must perform **zero** Directus fetches
(confirmed via the diagnostics subscriber) and return in **< 1s**. That single
result validates or refutes the corrected thesis.

**Rollback:** revert the one file.

### 🚦 GATE A — as in D-017, plus the D-018 thesis check

Add one criterion: **"Warm benchmark request performs 0 Directus fetches despite
the 2MB Data Cache rejection."** If that fails, stop the entire phase — the
approach does not work and needs re-planning, not rollout.

### Batch 3 — Program detail route — **REVISED (D-020): on-demand ISR**

**Bulk static generation is abandoned for this route.** The first attempt failed
twice with Directus 503 at `0/1962` in 54 s. Cause is arithmetic, not ISR:

| | Pages | Build-time transfer | Result |
|---|---:|---:|---|
| Batch 2 (schools) | 20 | 546 MB | ✅ 104.8 s |
| Batch 3 (programs) | 1,938 | **≈53 GB** | ❌ host 503 |

Each render pulls the whole 27.32 MB database, and — because the fetch Data
Cache rejects every >2 MB response (D-018) — **there is no cross-page
deduplication during the build.** The 2 MB rejection that was harmless at 20
pages is fatal at 1,938. D-018 was right that it is irrelevant to warm
request-time performance (GATE A proved that); it missed that the same rejection
also removes build-time dedup.

**Revised approach — delete `generateStaticParams`, keep `revalidate = 900`.**
Nothing prerendered at build; each page renders on first request and is then
Full-Route-Cached for 15 minutes. Build cost for this route ≈ 0.

This is also the better architecture here: prerendering 1,938 pages spends 53 GB
generating pages nobody may visit; on-demand pays only for pages requested.

**Must be proven, not assumed** (the Batch 1 lesson): request a program page
**twice**; the second must return `x-nextjs-cache: HIT`, **0** Directus
requests, **< 1000 ms**. If it does not cache, stop and report.

**Accepted limitations** — all with the same remedy, the deferred narrow loader:
- First visitor per page per window still pays ~4 s / 27.32 MB
- A crawler over all 1,938 pages would still trigger ≈53 GB, spread over time
- Each trafficked page re-pulls 27.32 MB per window

**Escalation if 503s recur once live:** the route-specific narrow loader — *not*
a longer window, and never a Directus change.

### Batch 4 — Homepage `/`

Remove `force-dynamic`, add `revalidate`. `/` is a single fixed route — no
`generateStaticParams` needed. It becomes one prerendered page.

### Batch 5 — `/search`: query boundary (the pivot)

`/search` cannot be route-cached and cannot use the fetch Data Cache. Give it a
**narrow, search-specific data path** that loads only what the results list and
filters read — verified in Phase 2 planning as: program `name`/`name_zh`,
`school_name`, `country`/`city`, `degree`, `major_area`/`major_area_zh`,
`specialization`, `data_quality`. **It does not need `source_records` at all**,
and needs audition data only insofar as `data_quality` derives from it.

This is a genuinely new data path, so it carries the most regression risk in the
phase. Options, in order of preference:
1. A new narrow loader function in `lib/data.ts` for search only, leaving
   `loadDirectusData()` untouched for the cached routes.
2. If that proves large, reuse `loadDirectusData()` but confirm `/search`
   rendering is unchanged.

**Whichever is chosen, the rendered `/search` output must be byte-identical to
Phase 0** (verified against `payloads/search.rsc`). Remove `force-dynamic`; add
`revalidate` (the fetch may now be small enough to cache).

**Rollback:** revert the search route and any new loader function.

### Batch 6 — Full measurement

All four routes, 5 cold + 5 warm, medians, vs. Phase 0. Plus: Directus request
count per route (target **0** warm on the three static routes; **reduced** on
`/search`), build duration, page count, route-level JS.

> **`evidence_metadata` (C2):** untouched throughout, on every route including
> the new `/search` query. The original "remove the field" batch stays
> cancelled. The `/search` projection simply never requests `source_records`, so
> the question does not arise there.

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
