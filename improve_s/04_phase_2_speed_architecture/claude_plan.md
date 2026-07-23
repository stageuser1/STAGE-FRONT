# Phase 2 — Speed Architecture · Claude Plan

**Status:** ⬜ Not started
**Branch:** `perf/s1-speed-track`
**Recommended execution position:** **2nd — immediately after `01_phase_0_baseline`**

> ★ **This is the highest-value phase in the program.** Users feel the
> improvement here and nowhere else. Everything after this is quality,
> security, and durability.
>
> This phase merges the original program's Phase 2 and Phase 3. The original
> assumed independent per-route data paths and prescribed "benchmark one route,
> then roll out." This repository has **one shared loader**, so that model is
> not executable. **The benchmark unit is `loadDirectusData()`, not a route.**

---

## Objective

**Zero Directus round trips at request time on warm public routes.**
Directus becomes a build-time and revalidation-time source, not a request-time
dependency.

---

## Why this works (mechanism)

React's `cache()` — currently wrapping `loadDirectusData` at `lib/data.ts:980` —
dedupes only **within** a single request. Next.js 15's **fetch Data Cache**
(`next: { revalidate: N }`) persists **across** requests.

So switching `directusFetch` off `cache: "no-store"` (`lib/data.ts:165`) means
even legitimately-dynamic routes serve from cached data in milliseconds.
Removing `force-dynamic` then lets the static-shaped routes prerender entirely.

`/search` reads `searchParams` and stays dynamic — but it renders dynamically
**over cached data**, which is the point.

---

## Expected impact (hypothesis until measured)

| Metric | Now | After |
|---|---|---|
| Directus requests per page view | 5–6 **every** request | 0 warm / 5 per revalidation window |
| TTFB, detail pages | 2.6–33s observed | sub-second warm; >80% reduction |
| Homepage | 31.4s observed cold | prerendered, sub-second |
| `/search` | full dataset fetch per query | dynamic render over cached data |

---

## Files involved

| Path | Change |
|---|---|
| `lib/data.ts:165` | `cache: "no-store"` → `next: { revalidate: N }` |
| `lib/data.ts:977` | Remove `evidence_metadata` from `sourceRecordFields` — **after confirming what `mapSource` reads from it** |
| `app/page.tsx:10` | Remove `force-dynamic`; add `revalidate` |
| `app/search/page.tsx:14` | Remove `force-dynamic`; add `revalidate` |
| `app/schools/[schoolId]/page.tsx:18` | Remove `force-dynamic`; add `revalidate` + `generateStaticParams` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx:7` | Same |

**Out of this phase:** `lib/pilot-data.ts:122` — leave `/pilot/*` untouched;
its disposition is decided in Phase `03_`/`05_`.

---

## Implementation sequence

Each batch is one commit, separately revertable, measured before proceeding.

### Batch 1 — Data Cache ★ the single highest-return change
`lib/data.ts:165`: replace `cache: "no-store"` with `next: { revalidate: 900 }`
(15 minutes; tune once the owner sets an editorial expectation).
**Touch no other line.** Build, measure, compare to baseline.

> This one-line change should demonstrate most of the total win. It is the
> cleanest possible first gate for the owner to judge the program by.

### Batch 2 — Rendering mode
Remove `force-dynamic` from the four public routes; add explicit `revalidate`
exports. Build; **verify in the build output** that `/`, school, and program
pages are marked static/ISR and `/search` is dynamic. Do not assume — read the
table.

### Batch 3 — Payload cut
Confirm what `mapSource` actually reads from `evidence_metadata`. If nothing,
remove it from `sourceRecordFields` (`lib/data.ts:977`). If something is needed,
fetch it per-detail-page the way `attachSourceQuotes` (`lib/data.ts:815`)
already does.

### Batch 4 — Static params
Add `generateStaticParams` to both detail routes — **~1,958 pages** (20 schools
+ 1,938 programs, live counts 2026-07-23). Expect a substantially longer build;
measure it.

**Fallback if build duration is unacceptable:** static params for the 20 school
pages only, leaving program pages to `dynamicParams` (generated on first
request, then cached). This keeps the win on the highest-traffic pages without
a 1,938-page build over a 0.2 MB/s link.

### Batch 5 — Measure everything
All routes, 5 runs, cold + warm, vs. the Phase `01_` baseline.

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| **Reviewer edits invisible to other viewers under ISR** | Medium | Medium | Medium | Short window (start 15 min); document editorial expectation; owner must accept at this gate |
| Shared-loader blast radius — one file reaches every route | High | Medium | Medium | Small batches; measure after each; per-batch revert |
| Cache masking stale or wrong content on a trust-critical admissions product | Medium | High | Hard | Bounded revalidate window; QA verifies `last_checked` dates post-deploy |
| Production-only dynamic rendering — a route silently opts out | Medium | Medium | **Hard** | Assert rendering mode from build output **and** from deployed cache headers |
| `generateStaticParams` lengthens builds over a slow link | Medium | Low | Easy | Measure build time; if unacceptable, reduce to schools only |
| `evidence_metadata` turns out to be read by a mapper | Medium | Medium | Easy | Confirm before removing; per-detail-page fetch as fallback |
| 404 semantics change when routes prerender | Medium | Low | Medium | Note: pages currently return **HTTP 200** with an `EmptyState` (`app/schools/[schoolId]/page.tsx:31`). Fixing this is legitimate — tell QA in advance. |

---

## Rollback plan

**Genuinely clean.** Restoring `force-dynamic` and `cache: "no-store"`
reproduces current behavior exactly. No schema change, no dependency change, no
config change is involved anywhere in this phase.

Rollback SHA recorded in `logs/rollback_history.md` before Batch 1.
Each batch reverts independently.

---

## Acceptance criteria

- [ ] Build output shows the three static-shaped routes as prerendered/ISR
- [ ] Warm TTFB < 1s on all public routes (local production build, and Preview
      if available)
- [ ] Directus request count at request time = 0 on warm static routes
- [ ] HTML content diff on one school page + one program page: **identical**
- [ ] Reviewer login works; reviewer edits still save
- [ ] **Owner explicitly accepts the ISR staleness trade-off** — recorded in
      `logs/decisions.md`
- [ ] `npm run typecheck` and `npm run build` pass
- [ ] Smoke suite passes (or manual checklist completed)
- [ ] No dependency, config, or schema change

---

## Claude review verdict

_To be completed at the gate._
