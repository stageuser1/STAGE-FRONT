# Phase 2 — Speed Architecture · Codex Execution Package

**Status:** 🔧 **REVISED after Batch 1 (D-018) — re-issued; Batches 0–1 already done**
**Branch:** `perf/s1-speed-track` (exists; Batch 1 committed at `fdf5cc7`)
**Base / rollback commit:** `86c1db9` (Phase 0 baseline)
**Working directory:** `D:\STAGE FRONT`
**Shell:** PowerShell (primary). State which shell you used in the report.

> ## ⚠️ Read the D-018 finding first — `claude_plan.md` top section
> Batch 1 proved the **fetch Data Cache cannot hold these responses** (2MB
> per-entry limit; 4 of 5 collections are 2.77–20.98MB). The caching mechanism
> is therefore the **Full Route Cache** (static/ISR route output, no 2MB limit),
> **not** the fetch Data Cache. Batch 1's change is kept as a *prerequisite*.
> The batch plan below is revised accordingly.

---

## 0. Approved entry decisions

| # | Decision | Approved value |
|---|---|---|
| **C1** | ISR revalidation window | **900 seconds (15 minutes)** |
| **C2** | `evidence_metadata` | **Keep. Do not remove or alter.** Treat as a **required field** for current citation-grouping behaviour. |
| **C3** | Execution order | **1.** Benchmark one route first · **2.** Apply cache architecture change · **3.** Measure before expanding · **4.** Roll out only after acceptance criteria are met |

**C4 (D-001, Preview environment) remains open. It blocks this phase's EXIT
GATE, not its start.** Do not treat its absence as a reason to stop executing.

---

## 1. Read before starting

| Document | Why |
|---|---|
| `04_phase_2_speed_architecture/claude_plan.md` | The approved plan this package implements |
| `01_phase_0_baseline/report.md` | The baseline of record — all comparisons are against §4 and §5 |
| `00_program_overview/execution_rules.md` | Batch discipline, stop conditions |
| `skills/codex_role.md` | Operating boundaries |

**The benchmark route is `/schools/yale_school_of_music`.**
Phase 0 medians for it: **3648.994 ms cold / 4054.367 ms warm.**

---

## 2. Revised mechanism (D-018) — what changed and what did not

**Batch 1 is done and its result is understood: removing `no-store` does not
cache the large responses** (the 2MB fetch-cache limit rejects 4 of 5). It is
kept as the **prerequisite** for static generation — `no-store` opts a route out
of static rendering, so it had to go first.

**The mechanism is the Full Route Cache**, exercised only when a route is
actually statically generated. So the benchmark batch now combines ISR **and**
`generateStaticParams` — the route cache is not testable until the route is
genuinely static.

**C3 is still honoured:** the benchmark route (`/schools/yale_school_of_music`)
is the first and only route to change rendering mode, and GATE A gates rollout.

**One genuine pivot (D-018):** `/search` reads `searchParams`, cannot be
route-cached, and cannot use the fetch Data Cache. It gets its **own batch with a
narrow query boundary** (Batch 5) instead of a cache. This is the only place the
"cache" model changes to "query boundary."

**Revised batch map:**

| Batch | Scope | State |
|---|---|---|
| 0 | Pre-flight | ✅ done (`019a5ed`) |
| 1 | Remove `no-store` (prerequisite) | ✅ done (`fdf5cc7`) |
| 2 | Benchmark: ISR **+** `generateStaticParams` together | ▶ next |
| 🚦 GATE A | Prove warm benchmark = 0 Directus fetches | — |
| 3 | Program route: ISR + `generateStaticParams` | after gate |
| 4 | Homepage `/`: ISR | after gate |
| 5 | `/search`: **query boundary** | after gate |
| 6 | Final measurement | after gate |

---

## 3. Files Codex MAY change — per batch, cumulative

| Batch | Path | Permitted change |
|---|---|---|
| 1 ✅ | `lib/data.ts` | line 165 only — **done** |
| 2 | `app/schools/[schoolId]/page.tsx` | Remove `force-dynamic` (line 18); add `revalidate`; add `generateStaticParams` |
| 3 | `app/schools/[schoolId]/programs/[programId]/page.tsx` | Remove `force-dynamic` (line 7); add `revalidate`; add `generateStaticParams` |
| 4 | `app/page.tsx` | Remove `force-dynamic` (line 10); add `revalidate` |
| 5 | `app/search/page.tsx` | Remove `force-dynamic` (line 14); add `revalidate` |
| 5 | `lib/data.ts` | **ADD a new narrow search-only loader function.** May NOT modify `loadDirectusData`, `directusFetch` (beyond the done line 165), or any existing field list / mapper. New code only. |
| all | `improve_s/04_.../report.md`, `improve_s/logs/*` | Write / append |

**A file becomes writable only in the batch that names it. Touching it earlier
is stop condition P2-S6.** The Batch 5 `lib/data.ts` allowance is **additive
only** — a new function for `/search`. Every existing line except 165 stays
frozen, including `sourceRecordFields:977`, `sourceTopicKey:755`, and
`fetchAuditionRequirements:947`.

## 4. Files Codex MUST NOT change

### Inside `lib/data.ts` — line 165 (done) + a new Batch-5 function only. Frozen:

| Location | Why |
|---|---|
| `sourceRecordFields` (line 977) — **including `evidence_metadata`** | **C2: required field.** Removing it visibly regroups citations. |
| `sourceTopicKey()` (line 755) | Consumes `evidence_metadata` → `topic_key` |
| `fetchAuditionRequirements()` (line 947) | The optimistic 403→fallback is deliberate (D-013) |
| `loadDirectusData()` (line 980) | Serves the cached routes; must not change |
| `directusFetch()` retry / backoff / timeout (lines 160–189) | Out of scope (D-014) |
| Every existing field list, mapper, and accessor | Out of scope |

**Batch 5 may ADD a new narrow search loader function** (§5 Batch 5). It may not
modify any existing line except the already-done line 165.

### Everywhere else

- Any `components/**` file
- `lib/pilot-data.ts` · `lib/school-detail.ts` · `lib/format.ts` ·
  `lib/markdown.tsx` · `lib/directus-auth.tsx` · `lib/search-options.ts` ·
  `lib/demo/school-detail.ts`
- `data/types.ts` — DTOs are Phase `03_`
- `app/login/page.tsx` · `app/layout.tsx` · `app/error.tsx` · `app/loading.tsx` ·
  any `loading.tsx`
- `app/pilot/**` — out of scope this phase (D-007)
- `next.config.ts` · `tsconfig.json` · `tailwind.config.ts` ·
  `postcss.config.js` · `package.json` · `package-lock.json` · `.env*`

### Forbidden actions

| # | Forbidden |
|---|---|
| F1 | Installing or removing any dependency |
| F2 | Editing any configuration file |
| F3 | **Any Directus change** — schema, permission, token, record, column |
| F4 | Removing or altering `evidence_metadata` or topic-key logic (**C2**) |
| F5 | Removing the optimistic `audition_requirements` query (D-013) |
| F6 | Adding cache tags or `revalidateTag` — Phase 5, deferred |
| F7 | Changing `directusFetch` retry/backoff/timeout |
| F8 | Any user-visible design, copy, or functional change |
| F9 | Committing to `main`; force-push; rebase; amend |
| F10 | "Fixing" anything discovered in passing — report it |
| F11 | Proceeding past a stop condition |
| F12 | Proceeding past **GATE A** without recorded owner approval |
| F13 | Using a revalidation value other than **900** |

---

## 5. Execution batches

---

### Batch 0 — Pre-flight

```bash
git status --short
```

**Expected:** empty.

```bash
git checkout -b perf/s1-speed-track
```

```bash
git rev-parse HEAD
```

**Expected:** a SHA at or after `86c1db9`. Record it in
`improve_s/logs/rollback_history.md` under Phase `04_` **before Batch 1**.

**Stop if** the tree is not clean (**P2-S7**).

---

### Batch 1 — Remove `no-store` ✅ DONE (`fdf5cc7`)

Already committed: `lib/data.ts:165` is `next: { revalidate: 900 }`. **Do not
revert.** Understood role (D-018): prerequisite for static generation, not the
caching mechanism. The 154 cache-write rejections it produced are expected while
routes remain dynamic and disappear once routes go static. Proceed to Batch 2.

---

### Batch 2 — Benchmark route: ISR **+** `generateStaticParams` ★ decisive experiment

**Only `app/schools/[schoolId]/page.tsx`.** Do the rendering-mode change and
static params **together** — the Full Route Cache is not exercised until the
route is genuinely static, so a mode-only step would be untestable.

1. Remove line 18 `export const dynamic = "force-dynamic";`
2. Add `export const revalidate = 900;`
3. Add `generateStaticParams` returning one `{ schoolId }` per school.
   **`School.id` IS the URL slug** (`lib/data.ts:1305`), so the value is
   `school.id` (e.g. `yale_school_of_music`). Source from the existing
   `getAllSchools()`; add no new query. The key must be `schoolId`.

```bash
npm run typecheck && npm run build && npm test
```

**Capture the route table verbatim.** Expected: `/schools/[schoolId]` now **SSG/
ISR** (`●` or `○`, not `ƒ`); build prerenders **20 school pages**; the other
three routes still `ƒ`.

**THE decisive measurement:** a **warm** request to
`/schools/yale_school_of_music` must perform **zero** Directus fetches (confirm
via the diagnostics subscriber — expect no `[P0_DIRECTUS_START]` lines on the
warm hit) and return **< 1000 ms**.

> This is the D-018 thesis check. If a warm request still fetches Directus, the
> Full Route Cache is not doing its job — **stop under P2-S2 and return to
> Claude.** Do not proceed to rollout on a failed thesis.

**Fallback:** build > 30 min → **P2-S5**, report and stop.

**Commit:** `Phase 2 Batch 2: benchmark route SSG/ISR + static params`

---

## 🚦 GATE A — Benchmark acceptance (C3 step 4 + D-018 thesis)

**STOP HERE. Do not start Batch 3 without recorded owner approval in
`logs/decisions.md`.** (**F12**)

| Criterion | Target |
|---|---|
| **Warm benchmark performs 0 Directus fetches** (D-018) | **0** — the thesis check |
| Benchmark warm TTFB | **< 1000 ms** (Phase 0: 4054 ms) |
| Benchmark rendering mode | SSG/ISR, confirmed in build output |
| Content identical | HTML diff vs. `01_phase_0_baseline/payloads/school_yale.rsc` |
| Other three routes | Not regressed |
| Reviewer login + edit round-trip | Works |
| QA checklist | Path B ten checks pass |
| Build / typecheck / tests | Pass |

**Rollout proceeds only if the owner records approval.** If the benchmark fails,
revert to `fdf5cc7` (Batch 1 state) and return to Claude — the mechanism, not
just this route, is then in question.

> ## ✅ GATE A PASSED WITH CONDITIONS — 2026-07-24 (D-019)
>
> **Thesis proven:** benchmark warm median **4,054 ms → 4.514 ms (898× faster)**,
> **0** Directus requests, **0** bytes, `x-nextjs-cache: HIT`, `●` SSG 15m,
> 20 routes prerendered, 39/39 content records identical, QA 10/10.
>
> **Batches 3–6 are AUTHORISED.** No further GATE A approval is needed between
> them; the phase exit gate governs.
>
> Two carried conditions (neither blocks Batch 3): reviewer edit round-trip
> (needs D-009 credentials) and C4/D-001 Preview — both due at the **exit gate**.
> Also retry the interrupted program-route RSC diff during Batch 3.

---

### Batch 3 — Program detail route — ⚠️ **REVISED BY D-020: on-demand ISR**

> **The first attempt failed and its approach is withdrawn.** Bulk static
> generation of 1,938 pages means ≈**53 GB** of build-time Directus transfer —
> the host returned 503 at `0/1962` in 54 s, twice. **Do not attempt
> `generateStaticParams` on this route again.**

**Starting point:** the working tree already carries the failed attempt.
**Edit it — do not revert it, do not `git checkout` it.**

**Only `app/schools/[schoolId]/programs/[programId]/page.tsx`:**

1. **Delete** the `generateStaticParams` function entirely.
2. **Remove `getAllPrograms`** from the `@/lib/data` import (keep
   `getProgramById`).
3. **Keep** `export const revalidate = 900;` exactly as is.

Resulting diff vs. `fa43c9c` should be only: `force-dynamic` → `revalidate = 900`.

```bash
npm run typecheck && npm run build && npm test
```

**Expected build:** completes quickly. Route table shows
`/schools/[schoolId]/programs/[programId]` as **`ƒ`** with **no** prerendered
program paths. That is correct — `ƒ` here does **not** mean uncached.

#### ★ Decisive verification — prove the cache, do not assume it

Start the production server and request
`/schools/yale_school_of_music/programs/1190` **twice**:

| Request | Expected |
|---|---|
| 1st (cold) | HTTP 200, ~4 s, full Directus load — **normal** |
| **2nd (warm)** | **`x-nextjs-cache: HIT`, 0 Directus requests, < 1000 ms** |

Confirm zero `[P2_DIRECTUS_START]` lines during the second request.

> **If the second request does NOT cache — STOP and report.** Do not improvise,
> do not add `generateStaticParams` back. The next option requires a new
> owner decision.

Then: the interrupted program-route RSC semantic diff vs.
`01_phase_0_baseline/payloads/program_1190.rsc`, and Path B QA. Measure all four
routes.

**Commit:** `Phase 2 Batch 3: program detail route on-demand ISR`

---

### Batch 4 — Homepage `/`

**Only `app/page.tsx`.** Remove `force-dynamic` (line 10); add
`export const revalidate = 900;`. `/` is a single fixed route — **no
`generateStaticParams`**. Expected: one prerendered page, warm request 0 Directus
fetches. Measure all four routes.

**Commit:** `Phase 2 Batch 4: homepage SSG/ISR`

---

### Batch 5 — `/search`: query boundary (the D-018 pivot)

`/search` cannot be route-cached (dynamic on `searchParams`) and cannot use the
fetch Data Cache (payload rejected). Give it a **narrow, search-specific data
path**.

1. **Add a new loader function to `lib/data.ts`** (additive only — see §3/§4)
   that returns only the fields `/search` renders: program `name`, `name_zh`,
   `school_name`, `country`, `city`, `degree`, `major_area`, `major_area_zh`,
   `specialization`, `data_quality`, `id`, `school_id`. **It must not request
   `source_records`.** It needs audition data only to the extent `data_quality`
   requires it — replicate that derivation minimally, or reuse existing mappers
   without modifying them.
2. Point `app/search/page.tsx` at the new loader. Remove `force-dynamic`
   (line 14); add `export const revalidate = 900;`.

**`/search` stays dynamic (`ƒ`) in the build output — correct and expected**
(reads `searchParams`). **P2-S2 does not apply to `/search`.** The goal is a
smaller working set, not a static route.

**Hard requirement:** the rendered `/search` output must be **byte-identical**
to Phase 0 `payloads/search.rsc` (after normalizing volatile build/hydration
IDs). Any visible difference is **P2-S1** — stop.

Measure `/search` cold and warm; record its new Directus request size vs. the
27.32 MB baseline.

**Commit:** `Phase 2 Batch 5: search query boundary`

---

### Batch 6 — Final measurement

All four routes, 5 cold + 5 warm, medians, vs. Phase 0 §4. Plus:

- Directus request count per route (**target: 0 warm** on `/`, school, program;
  **reduced payload** on `/search`)
- Final build route table
- Build duration and page count
- Route-level JS vs. Phase 0 §3 (expected unchanged — not this phase's target)

**Commit:** `Phase 2 Batch 6: final measurement`

---

## 6. Validation commands — after EVERY batch

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
npm test
```

**Expected:** exit 0 · exit 0 · **10/10 tests** (2 Python validator + 8 Node importer).

Then, after every batch:

1. **Path B QA checklist** — the ten checks in `01_phase_0_baseline/report.md` §7
2. **HTML content diff** — one school page and one program page against the
   Phase 0 captures in `01_phase_0_baseline/payloads/`
3. **Reviewer login + edit round-trip** — required after Batches 2, 4 and 5

---

## 7. Rollback procedure

Every batch is one commit and reverts independently.

### Single batch

```bash
git revert --no-edit <batch-commit-sha>
```

```bash
npm run typecheck && npm run build
```

### Back to the benchmark-only state (undo rollout, keep the benchmark)

```bash
git revert --no-edit <batch5-sha> <batch4-sha>
```

### Full phase rollback — restores pre-Phase-2 behaviour exactly

```bash
git checkout main
```

```bash
git branch -D perf/s1-speed-track
```

**The Phase 2 rollback is genuinely clean.** Restoring `cache: "no-store"` and
the four `force-dynamic` exports reproduces the Phase 0 baseline exactly. **No
schema, dependency, or configuration change occurs anywhere in this phase**, so
nothing outside git needs undoing.

### If the site is misbehaving and the cause is unclear

Revert the **most recent route batch** first — each route change is independent.
Batch 1 (`no-store` removal) is a prerequisite for the later batches; revert it
only if you are rolling the whole phase back, and only *after* the route batches
that depend on it.

### After any rollback

1. Verify `npm run build` passes
2. Verify all four routes return HTTP 200
3. Record the event in `improve_s/logs/rollback_history.md` using the R-template:
   what was reverted, the trigger, the symptom, the diagnosis, what changes
   before the next attempt

---

## 8. Stop conditions

Phase 0's **S1–S13 carry over unchanged**, including the **D-013 known-403
exception** (`audition_requirements` 403 immediately followed by a successful
retry — record it, do not stop) and the **D-014 bounded retry protocol** for raw
connectivity failures (stop, wait 60 s, retry once, cap 2 attempts, then
escalate).

Additional Phase 2 conditions:

| # | Condition |
|---|---|
| **P2-S1** | Any visible content difference vs. the Phase 0 payload captures |
| **P2-S2** | A route's rendering mode differs from this package's expectation (**`/search` staying dynamic is expected, not a violation**) |
| **P2-S3** | Any measured route becomes **slower** than its Phase 0 median |
| **P2-S4** | Reviewer login or edit round-trip breaks |
| **P2-S5** | Build duration exceeds 30 minutes |
| **P2-S6** | A change would touch a file not yet writable in the current batch |
| **P2-S7** | Working tree not clean at Batch 0 |
| **P2-S8** | An unexpected non-200 from Directus **on the route modified by the current batch**, or on a revalidation render of an already-converted route, outside the D-013 exception |

> **P2-S8 NARROWED by D-019 — read carefully.**
>
> Three 503s have now occurred (2× Batch 1, 1× Batch 2 QA). **Every one was on a
> route still doing per-request full-database fetches. None occurred on a cached
> route** — by construction one cannot. A 503 is transient host stress from
> 27.32 MB pulls, not a permissions or schema fault.
>
> **DO NOT STOP** when a transient non-200 occurs on a route **not modified by
> the current batch** (e.g. the still-dynamic program route during Batch 2
> verification). Record it as a baseline observation and continue — it is
> evidence about the routes not yet fixed, and it argues for proceeding, not
> halting.
>
> **DO STOP** when: the non-200 is on the route the current batch modified; or a
> **revalidation** render of a converted route fails; or the D-014 protocol
> (wait 60 s, retry once, cap 2 attempts) is exhausted.
>
> **Never respond to a 503 by changing Directus.** (F3)

**Explicitly NOT stop conditions:**

- The 154 Next.js cache-write rejections from Batch 1 while routes are still
  dynamic (expected; they vanish as routes go static — D-018)
- `/search` remaining dynamic in the build output (see Batch 5)
- The documented `audition_requirements` 403 → fallback 200 (D-013)

On a stop: write to `logs/execution_log.md`, do not attempt a fix, do not
continue to the next batch.

---

## 9. Report requirements

Write to `improve_s/04_phase_2_speed_architecture/report.md`. Every section
mandatory — write "none" rather than omitting.

1. **Execution metadata** — branch, rollback SHA, shell, per-batch timestamps
2. **File accounting** — modified / added / deleted; dependency, configuration,
   database changes (**all expected: none**); `git diff --stat`
3. **Per-batch results** — commit SHA, typecheck, build, tests, measurements
4. **Rendering mode table** — per route, per batch, from build output verbatim
5. **Timing table** — 5 cold + 5 warm × 4 routes × batch, medians, vs. Phase 0
6. **Directus request counts** — per route, before and after
7. **Build duration and page count** — per batch
8. **Content verification** — HTML diff results
9. **Reviewer workflow verification**
10. **GATE A summary** — the criteria table, filled
11. **Known limitations**
12. **Incomplete or blocked items**

---

## 10. Package provenance

Prepared 2026-07-23 by Claude against `HEAD` on `perf/s0-baseline`, implementing
the approved `claude_plan.md` with owner decisions C1 = 900 s, C2 = keep
`evidence_metadata`, C3 = benchmark-first rollout.

**If `HEAD` has moved when you execute this, stop and request a refresh** —
`HEAD` has already moved unexpectedly once in this program, and the dataset grew
~6× in a single day.
