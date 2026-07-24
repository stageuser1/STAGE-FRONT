# Phase 2 — Speed Architecture · Report

**Status:** ✅ **Batch 4 homepage ACCEPTED (D-022); `/search` P2-S3 overturned — it is Batch 5’s target**

> **D-020 corrected by D-021, 2026-07-24.** Deleting `generateStaticParams` did
> not produce on-demand ISR — it produced a fully dynamic route (`ƒ`,
> `Cache-Control: private, no-cache`, no HIT, 5 Directus requests on the 2nd
> call). In the App Router, `revalidate` alone does **not** cache a dynamic
> segment; on-demand ISR requires `generateStaticParams` to be **present** with
> `dynamicParams: true`. The corrected fix adds a **small** non-empty
> `generateStaticParams` (no 53 GB build) so unlisted pages generate on demand
> and cache. This is the second Next.js-semantics miss in the phase — both
> caught by the mandatory two-request proof gate. If the corrected form still
> does not cache, the pre-authorized fallback is **Option C: defer the program
> route (leave it dynamic), proceed to Batch 4.** Below is retained history.

> **Batch 3 reviewed 2026-07-24 — see `logs/decisions.md` D-020.**
>
> **The P2-S8 stop is UPHELD — correct, no rule defect.** The 503s came from
> `program_offerings` on the route Batch 3 modified, and the D-014 retry cap was
> exhausted. Codex applied the D-019-narrowed rule correctly and created no
> commit.
>
> **Cause: data-loading strategy at scale, NOT ISR.** ISR is proven (GATE A:
> 898× faster, 0 Directus requests). The failure is arithmetic — 20 school pages
> = 546 MB and built fine; 1,938 program pages = **≈53 GB**. Each render pulls
> the whole 27.32 MB database, and because the fetch Data Cache rejects every
> >2 MB response (D-018) there is **no cross-page deduplication during the
> build**. The 2 MB rejection that was harmless at 20 pages is fatal at 1,938 —
> a gap in the D-018 analysis, corrected in D-020.
>
> **Revised approach: on-demand ISR.** Delete `generateStaticParams`; keep
> `revalidate = 900`. Pages render on first request, then Full-Route-Cache for
> 15 min. Build cost ≈ 0. Pre-authorized fallback; no new scope.
>
> **Must be proven:** second request to a program page must show
> `x-nextjs-cache: HIT`, 0 Directus requests, < 1000 ms.
>
> Below is the prior GATE A record — retained, not overwritten.

> **Reviewed 2026-07-24 — see `logs/decisions.md` D-019.**
>
> **The Phase 2 core thesis is PROVEN.** Benchmark warm median
> **4,054.367 ms → 4.514 ms (898.2× faster)**, **0** Directus requests, **0**
> bytes, `x-nextjs-cache: HIT`, `●` SSG 15m, 20 routes prerendered, 39/39
> content records byte-identical, QA 10/10. D-018's prediction confirmed
> exactly: the >2MB fetch-cache rejections still occurred during static
> generation and did not matter — the Full Route Cache serves warm users
> without contacting Directus.
>
> **The P2-S8 stop is OVERTURNED.** Codex applied the rule correctly as written;
> the rule was over-broad. The 503 hit the **unchanged, still-dynamic program
> route** during content verification — a route GATE A does not cover, outside
> the benchmark window (which recorded 0 Directus calls), and untouched by
> Batch 2's one-file diff. It is the known pre-existing fragility of
> per-request 27.32 MB pulls, not a regression. This is the third such 503 —
> **all three on unfixed dynamic routes, none on a cached route.** It argues for
> proceeding to Batch 3, which removes the failure mode, not for halting.
>
> **P2-S8 has been narrowed** so a transient non-200 on a route not modified by
> the current batch is recorded, not stopped on.
>
> **Reviewer edit round-trip: waived for GATE A**, still required at the phase
> exit gate. Blocked by D-009 (no credentials); cannot plausibly have been broken
> by Batch 2, since reviewer auth is client-side `localStorage` and edits PATCH
> Directus directly from the browser.
>
> **⚠️ Owner note:** with the school page cached, a reviewer's own edit will
> appear to vanish on reload until revalidation (up to 15 min). Inside the
> accepted C1/D-006 trade-off, but sharper than the "other viewers" framing.
>
> **Retained below as the execution record — not overwritten.** The §1 batch
> table predates §13; §13 is authoritative.
**Stopped:** 2026-07-24 11:11 +08:00
**Branch:** `perf/s1-speed-track`
**Rollback SHA:** `742e901bf036daed924ea7732f7b33ec1f800107`
**Shell:** PowerShell
**Environment:** local production build (`next build` + `next start`)

The Batch 1 record below is retained as history. Revised Batch 2 was executed
under D-018 and its authoritative evidence is in §13. The benchmark passed the
Full Route Cache thesis check, but a later required raw-RSC/content-verification
request to the unchanged dynamic program route received Directus HTTP 503.
P2-S8 therefore stopped execution before the full GATE A checklist could pass.
Batches 3–6 were not executed.

---

## 1. Execution metadata

| Batch | Timestamp (+08:00) | Description | Status | Commit |
|---|---|---|---|---|
| 0 | completed 2026-07-23 18:10 | Clean pre-flight, branch, rollback point | PASS | `019a5ed` |
| 1 | 2026-07-23 18:11–18:23 | Directus fetch Data Cache, 900 s | **STOPPED during measurement** | stop commit recorded in branch history |
| 2 | not started | Yale benchmark route ISR | Not executed | none |
| 3 | not started | School static params | Not executed | none |

The Batch 1 application change is the single approved replacement in
`lib/data.ts`: `cache: "no-store"` → `next: { revalidate: 900 }`.

---

## 2. File accounting

| Type | Files |
|---|---|
| Modified | `lib/data.ts`; this report; `improve_s/logs/execution_log.md`; `improve_s/logs/rollback_history.md` |
| Added | none |
| Deleted | none |
| Dependency changes | none |
| Configuration changes | none |
| Database / schema changes | none |
| Directus changes | none |

Branch-versus-rollback accounting:

```text
 improve_s/04_phase_2_speed_architecture/report.md | 261 ++++++++++++++--------
 improve_s/logs/execution_log.md                   | 175 +++++++++++++++
 improve_s/logs/rollback_history.md                |   2 +-
 lib/data.ts                                       |   2 +-
 4 files changed, 346 insertions(+), 94 deletions(-)
```

No file outside the approved Batch 0–1 allowlist was changed.

---

## 3. Per-batch validation

| Batch | Typecheck | Build | Tests | QA / content |
|---|---|---|---|---|
| 0 | PASS | PASS, 26,372.993 ms | PASS, 10/10 | Path B 10/10; school/program RSC semantic diff PASS |
| 1 | PASS | PASS, 16,865.633 ms | PASS, 10/10 | Not run after measurement stop |
| 2 | not run | not run | not run | not run |
| 3 | not run | not run | not run | not run |

Batch 0’s school and program RSC captures had exactly the same byte lengths as
Phase 0 (107,114 and 49,640 bytes). Raw hashes differed only because Next.js
regenerates one build ID and two hydration IDs; after normalizing those volatile
IDs, both payloads compared equal.

---

## 4. Rendering mode

Batch 0 and Batch 1 produced the same route table. This is expected for Batch 1
because no route rendering export had changed.

| Route | Batch 0 | Batch 1 |
|---|---|---|
| `/` | `ƒ` dynamic | `ƒ` dynamic |
| `/search` | `ƒ` dynamic | `ƒ` dynamic |
| `/schools/[schoolId]` | `ƒ` dynamic | `ƒ` dynamic |
| `/schools/[schoolId]/programs/[programId]` | `ƒ` dynamic | `ƒ` dynamic |

Batch 1 build route table, verbatim:

```text
Route (app)                                      Size  First Load JS
┌ ƒ /                                         1.85 kB         108 kB
├ ○ /_not-found                                 994 B         103 kB
├ ○ /login                                    2.69 kB         109 kB
├ ƒ /pilot/program/[program_offering_ref]     3.97 kB         110 kB
├ ƒ /pilot/school/[slug]                        161 B         106 kB
├ ƒ /schools/[schoolId]                       1.13 kB         113 kB
├ ƒ /schools/[schoolId]/programs/[programId]  9.28 kB         121 kB
└ ƒ /search                                   1.85 kB         108 kB
+ First Load JS shared by all                  102 kB
  ├ chunks/255-3981a3d1f3561bd8.js            46.2 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js       54.2 kB
  └ other shared chunks (total)               1.99 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

ISR verification: **not performed** because Batch 2 was not authorized after
the Batch 1 stop.

---

## 5. Timing measurements

Phase 0 medians remain the only valid complete timing dataset:

| Route | Phase 0 cold | Phase 0 warm | Batch 1 |
|---|---:|---:|---|
| `/` | 3718.076 ms | 5237.129 ms | incomplete |
| `/search` | 3048.691 ms | 3358.273 ms | incomplete |
| `/schools/yale_school_of_music` | 3648.994 ms | 4054.367 ms | incomplete |
| `/schools/yale_school_of_music/programs/1190` | 3707.178 ms | 3691.290 ms | incomplete |

The required 40-request Batch 1 set exceeded the 10-minute command timeout and
was invalidated by the stop evidence below. No partial medians are reported.
Link throughput was not derived; the observed response sizes and repeated
request activity provide the relevant mechanism evidence.

---

## 6. Directus request observations and stop evidence

A process-local Node diagnostics subscriber observed request activity without
editing application or configuration files. During the incomplete Batch 1
session it recorded 198 Directus attempts and 198 completions:

- 157 HTTP 200
- 39 expected initial `audition_requirements` HTTP 403 responses
- **2 unexpected fallback `audition_requirements` HTTP 503 responses**

The two 503 responses trigger **P2-S8**. They are outside the D-013
403→successful-fallback exception.

Next.js also emitted 154 cache-write rejections:

| Collection | Observed cache item bytes | Rejections |
|---|---:|---:|
| `program_offerings` | 2,769,823 | 39 |
| `application_requirements` | 4,122,101 | 39 |
| `audition_requirements` fallback | 8,555,082 | 37 |
| `source_records` | 20,976,456 | 39 |

Representative framework message:

```text
Failed to set Next.js data cache for <Directus request>, items over 2MB can not be cached
```

This is an unplanned architectural constraint: four of the five bulk responses
cannot enter Next.js Data Cache. The approved one-line mechanism therefore does
not remove Directus from the request path.

---

## 7. Build duration and page count

| Batch | Build duration | Generated static pages |
|---|---:|---:|
| 0 | 26,372.993 ms | 4 framework/static pages; benchmark route dynamic |
| 1 | 16,865.633 ms | 4 framework/static pages; benchmark route dynamic |
| 2 | not run | not measured |
| 3 | not run | not measured; expected 20 school pages was not tested |

No build exceeded 30 minutes.

---

## 8. Content verification

| Batch | School page | Program page | Path B QA |
|---|---|---|---|
| 0 | semantic RSC diff identical | semantic RSC diff identical | PASS, 10/10 |
| 1 | not run after stop | not run after stop | not run after stop |

No visible-content difference was observed before the stop.

---

## 9. Reviewer workflow verification

- `/login` returned HTTP 200 and rendered the login form in Batch 0.
- Reviewer login plus edit/save round-trip: **not executed**.
- The user and package forbid any Directus record modification, so no test edit
  was attempted before the Batch 1 stop.

---

## 10. GATE A summary

**GATE A was not reached.**

| Criterion | Target | Result |
|---|---|---|
| Benchmark warm TTFB | < 1000 ms | Not measured |
| Warm benchmark Directus requests | 0 | Not satisfied; bulk responses were rejected from Data Cache |
| Benchmark rendering mode | Static / ISR | Not tested; route remained dynamic in Batch 1 |
| Content identical | school RSC diff | Batch 0 PASS; post-change not run |
| Other three routes | not regressed | Not established |
| Reviewer login + edit | works | Not verified |
| Path B QA | 10 checks pass | Batch 0 PASS; Batch 1 not run |
| Typecheck / build / tests | pass | PASS through Batch 1 |

**GATE A criteria are not satisfied.**

---

## 11. Known limitations

- The Batch 1 timing command buffered results in memory and timed out before
  emitting a complete table; partial values are deliberately not treated as
  evidence.
- C4 / D-001 Preview remains open, but it did not cause this stop.
- The cache-size limit is framework behavior observed in the local production
  build; no dependency or configuration change was attempted.
- `evidence_metadata` and topic-key grouping were untouched.

---

## 12. Incomplete or blocked items

- Batch 1 measurement, content diff, and Path B QA: incomplete due stop.
- Batches 2 and 3: not executed.
- ISR verification and 20-school prerender page count: not executed.
- GATE A: not reached and criteria not satisfied.
- Batches 4–6: not executed and remain prohibited without owner approval.
- Required next step: return the cache-size evidence to Claude/owner for a
  revised approved architecture. Codex did not improvise a fix.

---

## 13. Revised Batch 2 execution under D-018 — authoritative addendum

This section supersedes the earlier statements that Batch 2 was not executed.
The preceding sections remain unchanged as the historical Batch 1 stop record.

### 13.1 Execution metadata

| Field | Value |
|---|---|
| Batch | Revised Batch 2 only |
| Date / window | 2026-07-24 11:03–11:11 +08:00 |
| Branch | `perf/s1-speed-track` |
| Starting HEAD | `64af4f4991e86f2ebb7421ad4394857eef29b2ee` (D-018 documentation commit) |
| Batch 1 prerequisite | `fdf5cc7` retained; not rerun |
| Shell | PowerShell |
| Environment | Local production build (`next build` + `next start`) |
| Outcome | Core benchmark PASS; mandatory stop under P2-S8 during later content verification |

### 13.2 File accounting

Application change before the stop:

| Type | Files |
|---|---|
| Modified | `app/schools/[schoolId]/page.tsx`; this report; `improve_s/logs/execution_log.md` |
| Added | none |
| Deleted | none |
| Dependency changes | none |
| Configuration changes | none |
| Database / schema changes | none |
| Directus changes | none |
| Other route changes | none |

The application diff is exactly:

```text
 app/schools/[schoolId]/page.tsx | 16 ++++++++++++++--
 1 file changed, 14 insertions(+), 2 deletions(-)
```

The route now imports the existing `getAllSchools()`, exports
`revalidate = 900`, and maps each existing school to
`{ schoolId: school.id }` from `generateStaticParams()`. The prior
`dynamic = "force-dynamic"` export was removed. No new query was added.

### 13.3 Build, typecheck, and tests

| Check | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0, 8,966.583 ms |
| `npm run build` | PASS, exit 0, 104,839.844 ms |
| `npm test` | PASS, exit 0, 10/10 tests (2 Python + 8 Node), 3,126.975 ms |
| 30-minute build stop threshold | Not triggered; build completed in 1m 44.840s |

The expected >2 MB fetch Data Cache rejection warnings occurred during static
generation for the four large collections. They did not prevent Full Route
Cache output from being generated. No unexpected Directus HTTP status occurred
during the build.

Batch 2 build route table, verbatim:

```text
Route (app)                                      Size  First Load JS  Revalidate  Expire
┌ ƒ /                                         1.85 kB         108 kB
├ ○ /_not-found                                 994 B         103 kB
├ ○ /login                                    2.69 kB         109 kB
├ ƒ /pilot/program/[program_offering_ref]     3.97 kB         110 kB
├ ƒ /pilot/school/[slug]                        161 B         106 kB
├ ● /schools/[schoolId]                       1.13 kB         113 kB         15m      1y
├   ├ /schools/juilliard                                                     15m      1y
├   ├ /schools/manhattan_school_of_music                                     15m      1y
├   ├ /schools/colburn                                                       15m      1y
├   └ [+17 more paths]
├ ƒ /schools/[schoolId]/programs/[programId]  9.28 kB         121 kB
└ ƒ /search                                   1.85 kB         108 kB
+ First Load JS shared by all                  102 kB
  ├ chunks/255-3981a3d1f3561bd8.js            46.2 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js       54.2 kB
  └ other shared chunks (total)               1.99 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

### 13.4 Static generation result

- Build progress completed `Generating static pages (24/24)`.
- `/schools/[schoolId]` is `●` SSG with `Revalidate 15m`.
- `.next/prerender-manifest.json` contains exactly **20** concrete one-level
  school routes.
- The generated set includes
  `/schools/yale_school_of_music`.
- The manifest contains all 20 existing school slugs; the build route table
  reports three explicitly and `[+17 more paths]`.
- `/`, `/search`, and
  `/schools/[schoolId]/programs/[programId]` remain `ƒ`, as revised Batch 2
  requires.
- A local production request returned `x-nextjs-cache: HIT`,
  `x-nextjs-prerender: 1`, and
  `Cache-Control: s-maxage=900, stale-while-revalidate=31535100`.

This confirms `generateStaticParams()` used the expected `school.id` values
and that its output entered the Full Route Cache.

### 13.5 Benchmark timing — before / after

Route: `/schools/yale_school_of_music`

| Phase | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Median |
|---|---:|---:|---:|---:|---:|---:|
| Batch 2 first/cold set | 34.580 ms | 5.639 ms | 4.430 ms | 5.251 ms | 4.533 ms | **5.251 ms** |
| Batch 2 warm set | 4.235 ms | 4.514 ms | 4.265 ms | 23.896 ms | 4.874 ms | **4.514 ms** |

Every request returned HTTP 200 and a 197,174-byte HTML response.

| Comparison | Phase 0 | Revised Batch 2 | Change |
|---|---:|---:|---:|
| Cold/first-set median | 3,648.994 ms | 5.251 ms | 99.856% lower |
| Warm median | 4,054.367 ms | **4.514 ms** | **99.889% lower; 898.2× faster** |
| Warm target | — | `< 1000 ms` | PASS by 995.486 ms |

The current result is a local-production Full Route Cache hit. It is not a
Preview or production-deployment measurement.

### 13.6 Directus request comparison

The production server ran with the same process-local `diagnostics_channel`
observer approach used by Phase 0; no application or configuration file was
edited.

| Benchmark request-time metric | Phase 0 | Revised Batch 2 warm window |
|---|---:|---:|
| Directus requests per school-detail render | 7 | **0** |
| Directus response transfer per render | 27,322,807 bytes | **0 bytes** |
| Observer starts during 5 cold + 5 warm benchmark requests | n/a | **0** |
| Observer completions during benchmark requests | n/a | **0** |

The observer log contained no `[P2_DIRECTUS_START]` or
`[P2_DIRECTUS_END]` line before or during the ten benchmark requests. This is
the D-018 thesis result: the large fetch responses remain uncacheable in the
fetch Data Cache, but warm users are served the already-rendered route output
and do not contact Directus.

The later QA/content-verification window exercised unchanged dynamic routes and
recorded 31 Directus starts/completions: 24 HTTP 200, 6 expected initial
`audition_requirements` HTTP 403 responses, and **1 fallback HTTP 503**. The
non-200 outside D-013 was:

```text
[P2_DIRECTUS_END] id=31 status=503 path=/items/audition_requirements?limit=-1&fields=id,program_offering_id,is_current,admission_cycle,review_status,prescreening_deadline,prescreening_required,Prescreening_required,audition_required,repertoire_summary,repertoire_structured,audition_format,video_requirements,file_format_requirements,accompaniment_requirements,interview_or_callback_requirements,special_notes,conditional_notes,notes
```

That event occurred during a raw RSC capture of the still-dynamic program route,
not during the cached benchmark window. It triggered P2-S8. No retry or
Directus change was attempted.

### 13.7 Content and QA verification

School content comparison against
`01_phase_0_baseline/payloads/school_yale.rsc`:

- Phase 0 RSC: 64 Flight records, 107,114 bytes.
- Batch 2 prerendered RSC: 66 physical lines / 64 normalized Flight records,
  107,225 bytes.
- Static generation adds one preload record and shifts subsequent Flight
  record IDs by one. After removing that protocol-only record and applying the
  deterministic ID shift, **all 39 page-content records checked
  (`8`, `1a`–`3f`) are byte-identical**.
- Only root/infrastructure records `0` and `13` differ, as expected when the
  route changes from dynamic rendering to prerendered output.
- The served HTML contains the same school name, 76-program count, requirement
  data, and citation content. No visible school-content difference was found.

Path B checklist:

| # | Check | Result |
|---:|---|---|
| 1 | `/` HTTP 200 + hero heading | PASS |
| 2 | `/` lists school cards | PASS, 20 school links |
| 3 | `/search` HTTP 200 | PASS |
| 4 | `/search?country=US` HTTP 200 + filter state | PASS; filter state rendered, existing exact-match behavior returned 0 items |
| 5 | Yale school HTTP 200 + school name | PASS |
| 6 | Yale page lists program count | PASS, 76 |
| 7 | Program 1190 HTTP 200 | PASS |
| 8 | Program requirement content | PASS |
| 9 | Program source citations | PASS |
| 10 | `/login` HTTP 200 + hydrated login form | PASS in browser: email, password, and login controls present |

The unchanged program page rendered valid HTML with requirement and citation
content before the raw-RSC verification request hit the later Directus 503.
The planned new raw program RSC semantic diff is therefore **incomplete under
P2-S8**. Batch 0's prior program RSC semantic diff remains PASS, and Batch 2 did
not modify the program route or its data path.

### 13.8 Reviewer workflow

- `/login` returned HTTP 200.
- Hydrated UI showed the reviewer email field, password field, and login
  button.
- Authenticated reviewer login and an edit/save round-trip were **not
  executed**: no reviewer credentials were supplied, and the user explicitly
  prohibited Directus modification. No record write was attempted.

### 13.9 P2-S8 stop handling

The Directus 503 was discovered when the buffered server diagnostics were
reviewed after the content-verification requests. One subsequent malformed
local router-state-header probe had already run before that review; it produced
a framework 500 (`router state header ... could not be parsed`) and made zero
Directus requests. Once the P2-S8 evidence was identified:

- the local production server was stopped;
- port 3000 was confirmed free;
- no retry was attempted;
- no code, configuration, dependency, schema, record, permission, or Directus
  change was made;
- no Batch 3 work started.

### 13.10 GATE A summary

| Criterion | Target | Result |
|---|---|---|
| Warm benchmark Directus fetches | 0 | **PASS — 0 starts / 0 completions** |
| Benchmark warm TTFB | < 1000 ms | **PASS — 4.514 ms median** |
| Benchmark rendering mode | SSG/ISR | **PASS — `●`, 15m, cache HIT** |
| Static params | one per school | **PASS — 20 concrete routes including Yale** |
| School content identical | no visible change | **PASS — 39/39 content records identical after protocol normalization** |
| Other three routes | not regressed | Build modes unchanged; Path B HTTP/content checks PASS |
| Reviewer login + edit round-trip | works | **INCOMPLETE — login UI PASS; auth/edit prohibited/unavailable** |
| QA checklist | 10 checks pass | **PASS — 10/10** |
| Typecheck / build / tests | pass | **PASS / PASS / 10/10** |
| No forbidden change | none | **PASS** |
| No unexpected Directus status | required by P2-S8 | **FAIL — fallback HTTP 503 during program RSC verification** |

**GATE A verdict: NOT PASSED / owner approval not requested from this run.**
The Full Route Cache thesis and all benchmark-specific targets passed, but the
mandatory P2-S8 stop and the prohibited/unavailable authenticated edit
round-trip leave the complete gate unsatisfied. Per F12, Batch 3 and later
batches remain prohibited.

### 13.11 Known limitations

- This is a local production build, not Preview; C4 / D-001 remains open for
  the phase exit gate.
- Link throughput was not independently measured. The decisive warm window
  made zero Directus requests, so request-time Directus transfer is exactly
  zero regardless of link rate.
- Static generation still performs the 27.32 MB bulk Directus load and emits
  the expected >2 MB fetch Data Cache rejection warnings; the Full Route Cache
  removes that cost from warm request time, not from build/revalidation.
- `/search?country=US` returns zero items because the existing search code
  exact-matches `US` against stored country names such as `United States`.
  This pre-existing behavior was not changed or fixed in Batch 2.

### 13.12 Incomplete or blocked items

- New program-page raw RSC semantic diff: interrupted by P2-S8.
- Authenticated reviewer login + edit/save round-trip: not executed because no
  credentials were provided and Directus modification is forbidden.
- Full GATE A acceptance: not achieved.
- Batch 3 and all later work: not started and prohibited pending a new
  Claude/owner decision.

---

## 14. Batch 3 execution under D-019 — STOPPED

This section supersedes the pre-D-019 gate status in sections 13.10–13.12.
D-019 approved Gate A and authorized Batch 3. Codex executed only Batch 3 on
`perf/s1-speed-track`, starting at
`fa43c9c93302c91abe943979498cf315d875ba05`, using PowerShell.

### 14.1 File accounting

Application file modified:

- `app/schools/[schoolId]/programs/[programId]/page.tsx`

Documentation file modified:

- `improve_s/logs/execution_log.md`
- this report

Added files: none. Deleted files: none. Dependency, configuration, schema,
database, and Directus changes: none.

The application diff replaces `force-dynamic` with `revalidate = 900` and adds
`generateStaticParams()` from the existing `getAllPrograms()`, returning
`{ schoolId: program.school_id, programId: program.id }`.

### 14.2 Verification results

| Check | Result |
|---|---|
| Typecheck | PASS, exit 0 |
| Build attempt 1 | FAIL, Directus HTTP 503, 54,431.263 ms |
| D-014 wait | 60 seconds |
| Build attempt 2 (only permitted retry) | FAIL, Directus HTTP 503, 74,966.990 ms |
| Tests | NOT RUN — P2-S8 stop |
| Content diff / Path B QA | NOT RUN — no valid production build |
| Warm route measurement | NOT RUN — no valid production build |

Attempt 1 failed while prerendering
`/schools/manhattan_school_of_music/programs/3`. Attempt 2 failed while
prerendering `/schools/peabody_institute/programs/1789`. Both failures were
Directus HTTP 503 responses from `program_offerings` on the route modified by
Batch 3. The D-014 retry cap is exhausted, so P2-S8 requires a stop.

### 14.3 Generated-route and Directus comparison

The program dataset supplied 1,938 static params. Next.js announced 1,962
total static pages for the build and was at `0/1962` when the retry failed.
Because neither build completed, the number of finalized Batch 3 program routes
is **0** and no Batch 3 route table exists.

| Program-detail request metric | Phase 0 | Batch 3 warm |
|---|---:|---:|
| Directus requests per render | 7 | NOT MEASURED |
| Directus response bytes per render | 27,322,807 | NOT MEASURED |

The expected target was 0 warm Directus requests, but it cannot be claimed:
the failed build prevented starting a production server. The repeated >2 MB
fetch Data Cache rejection messages were expected under D-018 and were not the
stop condition.

### 14.4 Outcome

**Batch 3 acceptance criteria: NOT PASSED.** Typecheck passed and the approved
route-only implementation is present in the working tree, but build, content
integrity, warm-cache, and zero-Directus verification could not complete.
No commit was created. No Batch 4+ work was performed.

---

## 15. Corrected Batch 3 execution under D-021 — PASSED

This section supersedes section 14 for the final Batch 3 outcome. D-021
approved a small non-empty static subset plus on-demand fill. Codex executed
only corrected Batch 3 on `perf/s1-speed-track`, starting at
`6d3e381e1e6c26cc2e32b60da6bba1fd418860f0`, using PowerShell. The execution
completed at 2026-07-24 12:25 +08:00.

### 15.1 File accounting

Application file modified:

- `app/schools/[schoolId]/programs/[programId]/page.tsx`

Documentation files modified:

- `improve_s/04_phase_2_speed_architecture/report.md`
- `improve_s/logs/execution_log.md`

Added files: none. Deleted files: none. Dependency, configuration, schema,
database, Directus, and other-route changes: none.

The application change:

- removes `dynamic = "force-dynamic"`
- keeps `revalidate = 900`
- adds `dynamicParams = true`
- imports the existing `getAllPrograms()`
- returns only `programs.slice(0, 3)` from `generateStaticParams()`

No narrow loader was created. The route does not enumerate all 1,938 programs.

### 15.2 Static verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0, 106 s |
| `npm test` | PASS, exit 0, 10/10 (2 Python + 8 Node) |
| Program rendering mode | PASS, `●` SSG/ISR |
| Revalidation | PASS, `15m` / 900 seconds |
| Static pages generated | PASS, 27/27 total |
| Program pages prebuilt | PASS, exactly 3 |

The three prebuilt program routes were:

```text
/schools/manhattan_school_of_music/programs/3
/schools/manhattan_school_of_music/programs/4
/schools/manhattan_school_of_music/programs/5
```

The decisive Yale route
`/schools/yale_school_of_music/programs/1190` was therefore confirmed
non-prebuilt.

Program-route build-table excerpt:

```text
├ ● /schools/[schoolId]/programs/[programId]         9.28 kB         121 kB         15m      1y
├   ├ /schools/manhattan_school_of_music/programs/3                                 15m      1y
├   ├ /schools/manhattan_school_of_music/programs/4                                 15m      1y
├   └ /schools/manhattan_school_of_music/programs/5                                 15m      1y
```

The expected greater-than-2 MB fetch Data Cache rejection warnings appeared
during static generation. No Directus HTTP failure occurred during the build.

### 15.3 Decisive non-prebuilt cache verification

Local production route:
`/schools/yale_school_of_music/programs/1190`

| Request | HTTP | Time | `x-nextjs-cache` | Directus starts | Result |
|---|---:|---:|---|---:|---|
| First | 200 | 7,208.520 ms | `MISS` | 6 | expected on-demand generation |
| Second | 200 | **89.313 ms** | **`HIT`** | **0** | PASS |

Both responses were 98,366 bytes. The second response also returned
`x-nextjs-prerender: 1` and
`Cache-Control: s-maxage=900, stale-while-revalidate=31535100`.

The process-local diagnostics observer had 12 event lines after request 1
(6 starts and 6 completions). It still had exactly 12 lines after request 2:
**zero new Directus starts, completions, or errors**. Across the entire runtime
verification and QA window it recorded 26 starts and 26 completions:
21 HTTP 200, 5 documented initial audition-query HTTP 403 responses, zero
unexpected statuses, and zero request errors.

Against the Phase 0 program warm median of 3,691.290 ms, the verified warm hit
was 97.580% lower and 41.3 times faster. The `< 1000 ms` target passed by
910.687 ms.

### 15.4 Content and Path B verification

The on-demand-generated RSC was compared with
`01_phase_0_baseline/payloads/program_1190.rsc` using a Flight-record parser.
After remapping only the deterministic record IDs introduced by static
rendering, **17/17 program page-content records were byte-identical**. Text,
requirements, citations, and rendered program data had zero mismatches.

Path B passed 10/10:

1. Homepage HTTP 200 and hero heading present.
2. Homepage contains 20 school links.
3. `/search` HTTP 200.
4. `/search?country=US` HTTP 200 with US filter state.
5. Yale school page HTTP 200 with school name.
6. Yale page contains 76 program links.
7. Yale program 1190 HTTP 200.
8. Program requirement content present.
9. Program source citations present.
10. `/login` HTTP 200; hydrated UI contains email, password, and login controls.

### 15.5 Outcome

**Corrected Batch 3 acceptance criteria: PASSED.** The route is ISR-capable,
the non-prebuilt page entered the Full Route Cache, and the second request met
all three decisive requirements: `x-nextjs-cache: HIT`, zero Directus
requests, and response time below 1,000 ms.

The local production server was stopped, port 3000 was confirmed free, and the
temporary diagnostics module and event log were removed. No Batch 4 work was
started.

## 16. Batch 4 execution — STOPPED under P2-S3

Codex executed only Batch 4 on `perf/s1-speed-track`, starting at
`0abc021ed38b7879535ea164582c74435d816af6`, using PowerShell. The execution
window ended at 2026-07-24 12:45 +08:00.

The approved homepage change itself passed every static-rendering, cache,
content, build, test, and warm-performance target. The required all-route
measurement nevertheless found that the unchanged `/search` route's first-set
median was 31.667% slower than the Phase 0 cold median. P2-S3 says to stop when
**any measured route** becomes slower and provides no unchanged-route
exception. No rerun, search change, or Batch 5 work was attempted.

### 16.1 File accounting

Application file modified:

- `app/page.tsx`

Documentation files modified:

- `improve_s/04_phase_2_speed_architecture/report.md`
- `improve_s/logs/execution_log.md`

Added files: none. Deleted files: none. Dependency, configuration, schema,
database, Directus, design, copy, and other-route changes: none.

The application diff is exactly:

```diff
-export const dynamic = "force-dynamic";
+export const revalidate = 900;
```

No `generateStaticParams` was added. Because P2-S3 stopped acceptance, no
Batch 4 commit was created; the scoped change and stop documentation remain
uncommitted for review.

### 16.2 Static validation

| Check | Result |
|---|---|
| `git diff --check` | PASS |
| `npm run typecheck` | PASS, exit 0, 1,824.240 ms |
| `npm run build` | PASS, exit 0, 96,227.668 ms |
| `npm test` | PASS, exit 0, 10/10 (2 Python + 8 Node), 3,195.448 ms |
| 30-minute build threshold | PASS; 96.228 s |
| Homepage rendering mode | PASS, `○` static |
| Homepage revalidation | PASS, `15m` / 900 seconds |
| Static pages generated | PASS, 28/28 (27 in Batch 3 plus homepage) |

Build route table:

```text
Route (app)                                             Size  First Load JS  Revalidate  Expire
┌ ○ /                                                1.85 kB         108 kB         15m      1y
├ ○ /_not-found                                        994 B         103 kB
├ ○ /login                                           2.69 kB         109 kB
├ ƒ /pilot/program/[program_offering_ref]            3.97 kB         110 kB
├ ƒ /pilot/school/[slug]                               161 B         106 kB
├ ● /schools/[schoolId]                              1.13 kB         113 kB         15m      1y
├   ├ /schools/juilliard                                                            15m      1y
├   ├ /schools/manhattan_school_of_music                                            15m      1y
├   ├ /schools/colburn                                                              15m      1y
├   └ [+17 more paths]
├ ● /schools/[schoolId]/programs/[programId]         9.28 kB         121 kB         15m      1y
├   ├ /schools/manhattan_school_of_music/programs/3                                 15m      1y
├   ├ /schools/manhattan_school_of_music/programs/4                                 15m      1y
├   └ /schools/manhattan_school_of_music/programs/5                                 15m      1y
└ ƒ /search                                          1.85 kB         108 kB
```

The expected greater-than-2 MB fetch Data Cache rejection warnings occurred
during static generation. They are the known D-018 behavior and did not prevent
the homepage Full Route Cache output. No Directus HTTP failure occurred.

### 16.3 Cache and Directus verification

Local production, `http://127.0.0.1:3000`:

| Route | Cache result | Directus starts in first set | Directus starts in warm set |
|---|---|---:|---:|
| `/` | 10/10 `x-nextjs-cache: HIT` | **0** | **0** |
| `/search` | no route-cache header; dynamic as planned | 25 | 25 |
| `/schools/yale_school_of_music` | 10/10 `HIT` | **0** | **0** |
| `/schools/yale_school_of_music/programs/1190` | first request `MISS`; next 9 `HIT` | 6 | **0** |

The homepage responses were all HTTP 200 and 252,007 bytes. The ten measured
homepage requests added zero observer events, proving zero request-time
Directus fetches and zero Directus response bytes.

Across the complete runtime, content, and QA window, the process-local observer
recorded 66 starts and 66 completions: 53 HTTP 200 responses, 13 documented
initial `audition_requirements` HTTP 403 responses followed by fallback, zero
unexpected statuses, and zero request errors. `/search` made five starts per
request because the small `schools` response was already in the fetch Data
Cache while the four greater-than-2 MB responses remained uncacheable.

### 16.4 Timing comparison

Environment: local production build. The first set is the first five requests
per route in this server session; the warm set is the following five. Link
byte-rate remained unavailable, as in Phase 0.

| Route | Set | Runs (ms) | Median | Phase 0 median | Change |
|---|---|---|---:|---:|---:|
| `/` | first | 56.084, 7.229, 4.659, 13.422, 4.472 | **7.229** | 3,718.076 | **−99.806%; 514.3× faster** |
| `/` | warm | 4.593, 4.348, 4.334, 6.884, 9.795 | **4.593** | 5,237.129 | **−99.912%; 1,140.2× faster** |
| `/search` | first | 5,051.551, 4,656.458, 4,014.133, 3,892.509, 3,679.738 | **4,014.133** | 3,048.691 | **+31.667%; P2-S3** |
| `/search` | warm | 3,273.298, 3,074.536, 3,061.670, 2,967.521, 4,328.677 | **3,074.536** | 3,358.273 | −8.449% |
| school | first | 11.714, 3.103, 3.153, 2.896, 2.759 | **3.103** | 3,648.994 | −99.915% |
| school | warm | 3.120, 9.073, 3.134, 2.649, 2.844 | **3.120** | 4,054.367 | −99.923% |
| program | first | 3,218.927, 3.611, 2.385, 2.065, 2.581 | **2.581** | 3,707.178 | −99.930% |
| program | warm | 2.165, 2.549, 2.167, 3.139, 3.417 | **2.549** | 3,691.290 | −99.931% |

The program first-set median includes one expected on-demand `MISS`
(3,218.927 ms, six Directus starts) followed by four `HIT`s. It is not a claim
that an uncached program request is 2.581 ms.

The Batch 4 homepage target passed by 995.407 ms and improved its warm median
from 5,237.129 ms to 4.593 ms. Batch acceptance still stops because P2-S3 is
route-global as written.

### 16.5 Content and Path B verification

RSC semantic comparisons against the Phase 0 captures passed after removing
only the static-render preload record and remapping deterministic Flight record
IDs:

- Homepage: **49/49** structured page-content records byte-identical.
- Yale school: **39/39** page-content records byte-identical.
- Yale program 1190: **17/17** records byte-identical (15 structured records
  plus 2 length-prefixed text payloads).

Path B passed 10/10:

1. Homepage HTTP 200 and hero heading present.
2. Homepage contains 20 school links.
3. `/search` HTTP 200.
4. `/search?country=US` HTTP 200 with a hydrated active `US` chip and filtered
   result state.
5. Yale school page HTTP 200 with school name.
6. Yale page reports 76 programs.
7. Yale program 1190 HTTP 200.
8. Program requirement content present.
9. Program source citations present.
10. `/login` HTTP 200; hydrated UI contains one email input, one password
    input, and one login submit control.

Authenticated reviewer login plus edit/save was not executed. No credentials
were supplied, and the user explicitly forbids Directus modification. D-019
already carries this verification to the Phase 2 exit gate.

### 16.6 Stop and acceptance status

**Batch 4 acceptance: STOPPED / NOT ACCEPTED under P2-S3.**

- Homepage static/ISR implementation: PASS.
- Homepage warm cache: PASS, 10/10 HIT, zero Directus.
- Build, typecheck, tests, Path B, and semantic content checks: PASS.
- Required all-route performance comparison: **FAIL under P2-S3** because the
  unchanged `/search` first-set median was slower than Phase 0.
- Reviewer authenticated edit/save: incomplete under the existing D-019
  exit-gate carry.
- Commit: none.
- Batch 5+: not started.

The local server was stopped, port 3000 was confirmed free, and all temporary
observer and server-log files were removed. Resolution of the P2-S3 stop
belongs to Claude and the owner; Codex did not improvise a retry or exemption.
