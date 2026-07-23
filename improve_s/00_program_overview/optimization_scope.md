# Optimization Scope

Status: **Baseline findings verified against the repository on 2026-07-23.**
Everything below was confirmed by direct file inspection, not assumed.

---

## 1. Verified repository facts

### Route inventory (7 routes, 0 route handlers, 0 middleware, 0 not-found.tsx)

| Route | File | Current directive |
|---|---|---|
| `/` | `app/page.tsx:10` | `force-dynamic` |
| `/search` | `app/search/page.tsx:14` | `force-dynamic` |
| `/schools/[schoolId]` | `app/schools/[schoolId]/page.tsx:18` | `force-dynamic` |
| `/schools/[schoolId]/programs/[programId]` | `app/schools/[schoolId]/programs/[programId]/page.tsx:7` | `force-dynamic` |
| `/login` | `app/login/page.tsx:1` | `"use client"` |
| `/pilot/school/[slug]` | `app/pilot/school/[slug]/page.tsx:6` | `force-dynamic` |
| `/pilot/program/[program_offering_ref]` | `app/pilot/program/[program_offering_ref]/page.tsx:6` | `force-dynamic` |

Corrections to the original brief:
- **There is no `/explore` route.** Commit `c123ec8` ("Implement Figma Explore
  mobile design") redesigned `/`.
- The school param is `[schoolId]` but carries a **slug** value
  (e.g. `royal_college_of_music`).
- `/pilot/*` is publicly reachable and **unlinked from any navigation**.

### The bottleneck — one function

`loadDirectusData()` at `lib/data.ts:980`:

```
5 × directusFetch(..., limit=-1, cache: "no-store")
    schools, program_offerings, application_requirements,
    audition_requirements, source_records
  → full in-memory mapping
  → getSchoolById / getProgramsBySchoolId / getProgramById / searchPrograms
    filter the whole dataset in JavaScript
```

- `getProgramById` (`lib/data.ts:1366`) pulls the entire database to return one program.
- `searchPrograms` (`lib/data.ts:1382`) does full-table JS filtering.
- React `cache()` dedupes **within one request only**.
- `force-dynamic` + `cache: "no-store"` (`lib/data.ts:165`) means every request
  re-pulls all five collections.

This is the original program's "Pattern B" and "Pattern C" fused at a single
choke point.

**Pattern A (client-side `useEffect` fetching) does not exist anywhere.**
**Pattern D does not apply** — reviewer auth is entirely client-side via
`localStorage` (`lib/directus-auth.tsx:40`), so no server session forces
dynamic rendering. Public pages are already safe to cache.

### Observed performance (dev server — context, not a baseline)

| Date | Dataset | Observed range | Note |
|---|---|---|---|
| 2026-07-22 | 2 schools / 334 programs | **2.6s – 33s** (homepage 31.4s) | Source log **overwritten** — preserved only in `01_phase_0_baseline/report.md` |
| 2026-07-23 | 20 schools / 1,938 programs | **3.4s – 7.7s**, median ≈ 4.4s | Repeat requests show **no warm-cache benefit** |

> ⚠️ **Evidence-handling rule.** `.codex-dev.*.log` matches `*.log` in
> `.gitignore`, is never tracked, and is truncated on every dev-server restart.
> The 2026-07-22 dataset was lost this way. Both sets are transcribed verbatim
> in `01_phase_0_baseline/report.md`, which is the only durable copy.
> **Never cite the live log file as evidence.**

Do not read the 07-23 figures as an improvement — different link conditions,
machine state, and routes make the two sets non-comparable, and both include dev
compile time. What holds across both: every request costs seconds, and repeat
requests get no benefit, consistent with `cache: "no-store"`.

**The original brief's claim of "approximately 1–2 seconds" is stale and must
not be used as a baseline.** Neither dataset supports it.

### Dataset scale — ⚠️ UPDATED 2026-07-23, grew ~6× since the V2 analysis

Authoritative live counts, from `docs/imports/stage-v4-nine-school-verification.json`
(generated 2026-07-23T02:44:08Z against `http://47.86.26.168:8055`):

| Collection | Rows | Was at V2 analysis |
|---|---:|---:|
| `schools` | **20** | 2 |
| `fields` | 60 | — |
| `degree_levels` | 5 | — |
| `program_offerings` | **1,938** | 334 |
| `application_requirements` | **1,938** | — |
| `audition_requirements` | **2,087** | — |
| `source_records` | **17,663** | ~5,069 |

Commit `00b341a` imported nine more schools (Yale, Jacobs, Michigan SMTD,
Northwestern Bienen, USC Thornton, Rice Shepherd, Peabody, Oberlin, Cleveland).
20 school slugs are now live.

**Consequences of the growth:**

1. **The bottleneck got worse, not better.** `loadDirectusData()` now transfers
   ~23,600 rows on **every request** over a link that drops to ~0.2 MB/s. The
   observed 2.6–33s timings were measured at 334 programs. Re-measure — expect
   worse.
2. **A new CPU bottleneck appeared.** The in-memory joins in `lib/data.ts` are
   O(programs × related rows) and were negligible at 334 programs:
   - `sourceRecords.filter(...)` per program (`lib/data.ts:1038`):
     1,938 × 17,663 ≈ **34.2M comparisons**
   - `selectCurrentCycle` per program, twice (`lib/data.ts`): 1,938 × (1,938 +
     2,087) ≈ **7.8M comparisons**
   - **~42M array comparisons per request**, on top of the network transfer.
   This is now a real server-CPU cost and a second reason caching matters.
3. **Static generation is now ~1,958 pages** (20 schools + 1,938 programs), not
   ~336. Build duration over the slow Directus link becomes a genuine risk —
   see Phase `04_` for the fallback.
4. **The "no index will ever be justifiable" claim is retired.** 17,663 source
   records is no longer trivially small. Indexes remain unjustified *today* and
   still require full evidence, but the workstream is **deferred pending
   evidence**, not struck outright.

Redis, Meilisearch, and Algolia remain unjustified — 1,938 programs is still
small, and the fix is removing round trips, not adding infrastructure.

### Data observation to record at baseline (not a bug)

The import verification reports `current_application_rows: 0` for 8 of the 9
new schools — those rows have no `is_current = true`. Pages still render
correctly because `selectCurrentCycle` (`lib/data.ts`) falls back to all
matching rows when none is flagged current, and the frontend verification
recorded PASS for all nine schools.

**Phase `01_` must record this in the baseline.** If `is_current` is populated
later, displayed content will change — QA must not attribute that to the
optimization work.

### Contributing factor: the link, not the query shape

Field allowlists already exist throughout `lib/data.ts` (see the comment at
`lib/data.ts:844`). Someone already did the query-narrowing work. Project
memory records the Directus link (`http://47.86.26.168:8055`, Alibaba Cloud)
dropping to ~0.2 MB/s.

**Therefore the remaining win is eliminating request-time round trips, not
narrowing queries further.**

### Security findings (confirmed, not hypothetical)

1. **Plaintext credentials.** `NEXT_PUBLIC_DIRECTUS_URL` is a bare-IP `http://`
   origin. `lib/directus-auth.tsx:147` POSTs `{email, password}` from the
   browser over unencrypted HTTP. Tokens are persisted in `localStorage`
   (`lib/directus-auth.tsx:64`).
2. **Public-role review gives false assurance.** `DIRECTUS_TOKEN` is set, so
   server reads use a privileged token. The enforcing boundary for the public
   site is the `fields=` allowlist in `lib/data.ts`, not Directus permissions.
   (The public role still matters — for browser→Directus reviewer traffic.)
3. **`evidence_metadata` fetched on every request, every route**
   (`lib/data.ts:977`), ~126KB/row per project memory.
4. **Internal review state reaches client props on public pages.**
   `School.review_record` / `Program.review_records` (`data/types.ts:60`,
   `data/types.ts:210`) are passed into `"use client"` components rendered for
   anonymous visitors — `SchoolProfileCard` (`app/schools/[schoolId]/page.tsx:64`)
   and the 887-line `ProgramDetailSections`. These serialize into the RSC payload.

### Tooling gaps

- **Zero frontend tests.** `npm test` = Python validator + Node importer tests.
  No Playwright / Vitest / Jest.
- **No CI, no `vercel.json`, no `.vercel/`, no GitHub Actions.** No evidence in
  the repo of a Preview or production deployment.
- **No ESLint config, no lint script.**
- **No bundle analyzer.** `next.config.ts` is 3 lines and empty.
- Production dependencies are only `next`, `react`, `react-dom`.
- No production build has been produced in this workspace (`.next/BUILD_ID` absent).

---

## 2. Target architecture

> Fully statically generated site with ISR. Directus is a **build-time and
> revalidation-time** source, not a request-time dependency.

- Public pages prerendered where shape allows; `/search` dynamic over cached data
- Explicit revalidation window instead of `no-store`
- `generateStaticParams` over ~1,958 detail pages (20 schools + 1,938 programs)
- Public DTOs at the Server/Client boundary
- Reviewer components code-split behind the auth check
- Directus reachable over TLS only

---

## 3. In scope

| Area | Phase |
|---|---|
| Baseline measurement + minimal smoke suite | `01_` |
| TLS / credential transport for Directus | `02_` (parallel) |
| Public DTOs, internal-field removal from payloads | `03_` |
| Data Cache, ISR, `generateStaticParams`, payload cut | `04_` ★ |
| Per-entity queries, reviewer JS gating | `04_` / `05_` |
| Dead code, `/pilot` disposition, asset review | `05_` |
| Production verification, reviewer round-trip | `06_` |

## 4. Explicitly out of scope

Do not propose or implement these unless post-Phase-2 measurement demands them
and the owner reopens scope in `logs/decisions.md`:

- PostgreSQL indexes or tuning — **deferred pending evidence.** At 17,663
  source records this is no longer self-evidently unnecessary, but it remains
  unjustified until Phase `04_` measurement shows a database-side cost. Full
  evidence rules still apply (see `skills/backend_engineer_role.md`).
- `pg_stat_statements` enablement
- Redis, Meilisearch, Algolia
- Directus replacement or schema redesign
- Direct PostgreSQL access rewrite
- Hosting migration (Vercel → Alibaba Cloud) — **separate compliance decision**
- Large redesign or abstraction cleanup for its own sake
- Micro-optimization of non-critical informational pages
- On-demand cache invalidation via Directus Flows — **deferred** (see §6)

---

## 5. Re-prioritization rationale

The original Phase 0–4 order assumed the bottleneck was unknown. It is not.
With the diagnosis complete and the owner stating speed as top priority:

| Order | Folder | Was | Why moved |
|---|---|---|---|
| 1 | `01_` baseline | Phase 0 (full) | Keep only what gates need. Route/query inventory is already done — do not redo it. |
| 2 | `04_` speed | Phase 2+3 | Single highest user-visible return. Pulls the `evidence_metadata` cut forward from Phase 1. |
| 3 | `03_` data boundary | Phase 1 | Still important; no longer blocks speed. |
| ∥ | `02_` transport | (missing from original) | Infrastructure, touches no repo files — runs parallel without merge conflicts. |
| 4 | `05_` cleanup | Phase 4 | Unchanged — last. |
| 5 | `06_` verification | Final | Unchanged. |

**Phases 2 and 3 of the original brief are merged.** The original assumed
independent per-route data paths; this repo has one shared loader, so
"benchmark one route then roll out" is not executable. The benchmark unit is
`loadDirectusData()`, not a route.

---

## 6. Deferred

**On-demand cache invalidation (original Phase 5).** Time-based ISR remains
adequate at 20 schools / 1,938 programs. Revisit only if the business requires
faster editorial publishing.

> Note: the deferral is now a closer call than at the V2 analysis. With ~1,958
> statically generated pages, a full rebuild is expensive, so on-demand
> invalidation becomes more attractive as the dataset keeps growing. Re-evaluate
> at the Phase `04_` gate if build duration proves painful.

Accepted trade-off, to be confirmed by the owner at the Phase `04_` gate:
once public pages are ISR-cached, a reviewer's edit is visible in their own
session immediately (the editable cards hold optimistic local state) but does
not appear for other viewers until revalidation.

Estimated if reopened: 2–4 working days AI-assisted.
