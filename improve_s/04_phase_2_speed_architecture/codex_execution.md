# Phase 2 — Speed Architecture · Codex Execution Package

**Status:** 🟢 **APPROVED — entry conditions C1, C2, C3 resolved**
**Branch to create:** `perf/s1-speed-track`
**Base / rollback commit:** `86c1db9` (Phase 0 baseline)
**Working directory:** `D:\STAGE FRONT`
**Shell:** PowerShell (primary). State which shell you used in the report.

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

## 2. One documented deviation from C3 — read this

C3 approves a route-by-route model. **Batch 1 cannot be route-scoped, and this
is a property of the codebase, not a choice.**

`directusFetch()` (`lib/data.ts:152`) is the single fetch helper behind
`loadDirectusData()`, which every route calls. There is no per-route fetch layer
to modify. Changing its cache option necessarily affects all routes at once.

**How C3 is still honoured:**

- Batch 1 changes only *how data is fetched*. It changes **no route's rendering
  mode** — all four keep `force-dynamic`, so their request-time behaviour is
  unchanged by design.
- **The benchmark route is the first and only route to change rendering mode**
  (Batch 2). The other three are untouched until the acceptance gate passes.
- Batch 1 is verified by measuring **all four** routes to prove no regression
  anywhere — a stricter check than a route-scoped change would require.

If Batch 1's measurement shows any route regressing, that is stop condition
**P2-S3** and the one-line revert restores the baseline exactly.

---

## 3. Files Codex MAY change — per batch, cumulative

| Batch | Path | Permitted change |
|---|---|---|
| 1 | `lib/data.ts` | **Line 165 only** |
| 2 | `app/schools/[schoolId]/page.tsx` | Remove `force-dynamic` (line 18); add `revalidate` |
| 3 | `app/schools/[schoolId]/page.tsx` | Add `generateStaticParams` |
| 4 | `app/schools/[schoolId]/programs/[programId]/page.tsx` | Remove `force-dynamic` (line 7); add `revalidate`; add `generateStaticParams` |
| 5 | `app/page.tsx` | Remove `force-dynamic` (line 10); add `revalidate` |
| 5 | `app/search/page.tsx` | Remove `force-dynamic` (line 14); add `revalidate` |
| all | `improve_s/04_.../report.md`, `improve_s/logs/*` | Write / append |

**A file becomes writable only in the batch that names it. Touching it earlier
is stop condition P2-S6.**

## 4. Files Codex MUST NOT change

### Inside `lib/data.ts` — only line 165 is writable. Specifically forbidden:

| Location | Why |
|---|---|
| `sourceRecordFields` (line 977) — **including `evidence_metadata`** | **C2: required field.** Removing it visibly regroups citations. |
| `sourceTopicKey()` (line 755) | Consumes `evidence_metadata` → `topic_key` |
| `fetchAuditionRequirements()` (line 947) | The optimistic 403→fallback is deliberate (D-013) |
| `directusFetch()` retry / backoff / timeout (lines 160–189) | Out of scope (D-014) |
| Every other field list, mapper, and accessor | Out of scope |

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

### Batch 1 — Fetch Data Cache ★ (global by necessity — see §2)

In `lib/data.ts:165`, inside `directusFetch`, replace:

```ts
        cache: "no-store",
```

with:

```ts
        next: { revalidate: 900 },
```

**Change nothing else. Not one other line.** `cache` and `next.revalidate` are
mutually exclusive — the old option is replaced, not supplemented.

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
npm test
```

Then start the production server and measure **all four routes**, 5 cold + 5
warm each:

| # | Route |
|---|---|
| 1 | `/` |
| 2 | `/search` |
| 3 | `/schools/yale_school_of_music` ← benchmark |
| 4 | `/schools/yale_school_of_music/programs/1190` |

Report medians against Phase 0 §4.

> ⚠️ **Batch 1 showing little or no improvement is EXPECTED and is NOT a stop
> condition.** `export const dynamic = "force-dynamic"` alters the default
> fetch-cache behaviour, so the benefit may not appear until Batch 2 removes it
> from the benchmark route. **Record the result and proceed. Do not attempt a
> fix. Do not remove `force-dynamic` early.**

**Stop only if** a route gets **slower** than Phase 0 (**P2-S3**), or build /
typecheck / tests fail.

**Commit:** `Phase 2 Batch 1: enable Directus fetch Data Cache (900s)`

---

### Batch 2 — Benchmark route only: rendering mode

**Only `app/schools/[schoolId]/page.tsx`. Do not touch the other three routes.**

Remove line 18:

```ts
export const dynamic = "force-dynamic";
```

Add in its place:

```ts
export const revalidate = 900;
```

```bash
npm run build
```

**Capture the route table verbatim.** Expected:

- `/schools/[schoolId]` → **ISR** (no longer `ƒ`)
- `/`, `/search`, `/schools/[schoolId]/programs/[programId]` → **still `ƒ`**, unchanged

Measure all four routes again (5 cold + 5 warm).

**Expected:** the benchmark route improves materially; the other three are
roughly unchanged. **This is where the win should appear.**

**Stop if** the benchmark route's mode is not ISR (**P2-S2**), any route
regresses (**P2-S3**), or content differs (**P2-S1**).

**Commit:** `Phase 2 Batch 2: benchmark route ISR (900s)`

---

### Batch 3 — Benchmark route: `generateStaticParams`

**Only `app/schools/[schoolId]/page.tsx`.**

Add `generateStaticParams` returning one entry per school. **`School.id` IS the
URL slug** (`lib/data.ts:1305`), so the param value is `school.id` — e.g.
`yale_school_of_music`. Source it from the existing `getAllSchools()` in
`@/lib/data`; add no new query.

The returned key must be `schoolId`, matching the directory name.

```bash
npm run build
```

Record **build duration** and **page count** (expected: 20 school pages
prerendered).

**Fallback:** if build duration exceeds 30 minutes (**P2-S5**), report it and
stop — do not silently reduce scope.

Measure all four routes.

**Commit:** `Phase 2 Batch 3: prerender 20 school pages`

---

## 🚦 GATE A — Benchmark acceptance (C3 step 4)

**STOP HERE. Do not start Batch 4 without recorded owner approval in
`logs/decisions.md`.** (**F12**)

Write a gate summary into `report.md` covering:

| Criterion | Target |
|---|---|
| Benchmark warm TTFB | **< 1000 ms** (Phase 0: 4054 ms) |
| Benchmark Directus requests at request time, warm | **0** (Phase 0: 7) |
| Benchmark rendering mode | Static / ISR, confirmed in build output |
| Content identical | HTML diff vs. `01_phase_0_baseline/payloads/school_yale.rsc` |
| Other three routes | Not regressed |
| Reviewer login + edit round-trip | Works |
| QA checklist | Path B ten checks pass |
| Build / typecheck / tests | Pass |

**Rollout proceeds only if the owner records approval.** If the benchmark fails
its criteria, revert to the Batch 1 commit and return to Claude.

---

### Batch 4 — Expand to program detail route

**Only `app/schools/[schoolId]/programs/[programId]/page.tsx`** — the route most
similar to the benchmark.

Remove `force-dynamic` (line 7); add `export const revalidate = 900;`; add
`generateStaticParams` returning `{ schoolId, programId }` pairs.
`Program.school_id` is the school slug and `Program.id` is the numeric offering
id as a string (e.g. `"1190"`). Source from the existing `getAllPrograms()`.

**Expected page count: ~1,938.** Record build duration.

**Fallback if the build is too slow:** return an **empty array** from
`generateStaticParams` and rely on `dynamicParams` to generate pages on first
request, then cache. This keeps ISR without a 1,938-page build. **Record the
reason in the report if used.**

Measure all four routes.

**Commit:** `Phase 2 Batch 4: program detail route ISR`

---

### Batch 5 — Expand to `/` and `/search`

Two files, one commit.

- `app/page.tsx` — remove `force-dynamic` (line 10); add `export const revalidate = 900;`
- `app/search/page.tsx` — remove `force-dynamic` (line 14); add `export const revalidate = 900;`

**`/search` will remain dynamic (`ƒ`) in the build output because it reads
`searchParams`. That is correct and expected** — it now renders dynamically over
*cached* data. Do not attempt to force it static (**P2-S2** does not apply to
`/search`).

Measure all four routes.

**Commit:** `Phase 2 Batch 5: homepage and search ISR`

---

### Batch 6 — Final measurement

All four routes, 5 cold + 5 warm, medians, vs. Phase 0 §4. Plus:

- Directus request count per route (**target: 0 warm**)
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

Revert **Batch 1** first. It is the single line that changes caching behaviour
globally; reverting it restores request-time Directus reads on every route.

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
| **P2-S8** | Any Directus request returns an unexpected non-200 outside the D-013 exception |

**Explicitly NOT stop conditions:**

- Batch 1 showing little or no improvement (see Batch 1)
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
