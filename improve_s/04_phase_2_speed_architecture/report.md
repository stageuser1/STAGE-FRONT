# Phase 2 — Speed Architecture · Report

**Status:** ⛔ **STOPPED in Batch 1 — P2-S8 and unplanned cache-size limit**
**Stopped:** 2026-07-23 18:23 +08:00
**Branch:** `perf/s1-speed-track`
**Rollback SHA:** `742e901bf036daed924ea7732f7b33ec1f800107`
**Shell:** PowerShell
**Environment:** local production build (`next build` + `next start`)

GATE A was not reached. Batches 2–6 were not executed.

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
