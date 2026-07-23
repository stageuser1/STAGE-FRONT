# Phase 0 — Baseline · Report

**Status:** 🟡 **S7 STOP REVIEWED (D-014) — correctly triggered; ONE bounded retry of Batch 4 authorized**
**Completed:** No — Batches 0–3 complete and valid; Batch 4 attempt 1 failed; retry pending; Batches 5–7 not executed
**Branch:** `perf/s0-baseline`
**Baseline commit SHA:** `86c1db9ccda8e71a73603454a625652e7df8177b`

> **Entry gate resolved 2026-07-23 — see `logs/decisions.md` D-012.**
> The first run (recorded in §1 below) correctly stopped under S12 because no
> owner approval existed and D-001/D-002/D-004 were open. All three are now
> resolved and Phase 0 is approved. **That stop record is retained as history —
> do not overwrite it.** Sections 3–11 now describe the stopped execution run.
>
> **Two corrections applied to this run:**
> 1. **`npm test` must be run in Batch 2.** The previous run skipped it citing
>    D-002; that was incorrect — `npm test` runs the existing Python validator
>    and Node importer suites and has no dependency on D-002. Expected: PASS,
>    10 tests.
> 2. **Batch 6 follows Path B.** The run stopped before Batch 6, so no checklist
>    or smoke-suite file was created and nothing was installed.

> This document is **not yet a valid program baseline** — Batch 4 stopped on a
> new S7 condition. No later phase may treat the partial measurements as an exit gate
> until Phase 0 completes and the owner signs `acceptance_checklist.md`.

> **Batch 3 S7 stop — OVERTURNED as a false positive. See `logs/decisions.md` D-013.**
>
> The 403 on `audition_requirements` followed by a successful retry is the
> documented `fetchAuditionRequirements()` fallback (`lib/data.ts:947`), recorded
> before this run in the source comment at `lib/data.ts:939-945` and in
> `skills/backend_engineer_role.md`. It is **expected behaviour and a valid
> baseline observation**, not an error class requiring a halt.
>
> **Codex applied S7 correctly as written.** The defect was in the Phase 0
> package: S7 read "errors mid-measurement", broader than the governing rule in
> `execution_rules.md` §5 ("any Directus error class **not previously seen**").
> S7 has been rewritten and a narrow "Known Directus behaviour" exception added.
>
> **Batch 3 is complete and its data is valid — do not re-run it.** All 40
> timings returned HTTP 200. Resume at **Batch 4**.
>
> **Do not "fix" the 403.** No Directus permission change, no added columns, no
> removal of the optimistic query.
>
> **Batch 4 resume attempt — new valid S7 stop.** The first Batch 4 render
> reported `Directus request failed on /items/schools … fetch failed`. This is
> not the narrow D-013 exception. No retry or fix was attempted; Batches 5–7
> were not executed.
>
> **Reviewed — see `logs/decisions.md` D-014.** S7 was **correctly triggered,
> and correctly so this time** — unlike D-013, there is no rule defect. A raw
> `fetch failed` with no HTTP response received on `schools`, the load-bearing
> first request in `loadDirectusData()`, is exactly what S7 exists to catch.
> Codex was right to stop without attempting any fix.
>
> **Assessment: suspected transient network degradation, not a structural
> block.** Batch 3's probe fetched `schools` successfully in 107 ms only ~16
> minutes earlier over the same link; this failure took 11.04 s to surface
> (a slow hang-then-fail, not an instant refusal); no repository, environment,
> or Directus configuration changed in between; and the link
> (`http://47.86.26.168:8055`) is already documented elsewhere in this program
> as prone to degrading to ~0.2 MB/s. This is one data point, not confirmed —
> it must be verified by a successful retry, not assumed.
>
> **ONE retry of Batch 4 is authorized**, under the bounded protocol added to
> `codex_execution.md` ("Retry protocol for raw connectivity failures"): wait
> ≥60 s, retry exactly as specified, cap 2 total attempts. If the retry also
> fails with a raw connectivity error, **stop again and escalate as a
> suspected infrastructure issue** — do not attempt a third try, and do not
> weaken S7 to tolerate it. If the retry succeeds, proceed through Batch 7 and
> **keep this failed attempt's artifacts as baseline evidence** of link
> fragility, per D-014.
>
> **S7's wording is unchanged this time — no rule defect.** Do not confuse this
> retry protocol with the D-013 exception: D-013 means *do not stop* on a
> specific documented 403 pattern; this protocol means *stop, then follow a
> bounded, verified resume procedure* for a raw connectivity failure.

---

## 1. Execution metadata

| Field | Value |
|---|---|
| Branch | `perf/s0-baseline` |
| Baseline SHA | `86c1db9ccda8e71a73603454a625652e7df8177b` |
| Shell | PowerShell |
| Start | 2026-07-23 11:59 +08:00 |
| Resume attempt | 2026-07-23 approximately 12:20 +08:00 |
| End | 2026-07-23 12:22 +08:00 |
| Actor | Codex |
| Outcome | Batches 0–3 valid under D-013; Batch 4 stopped under S7 on a new `schools` fetch failure |

Completed work:

- Batch 0 verified that both volatile logs still match the durable Set C
  transcription; neither live log was modified.
- Batch 1 verified the approved branch, rollback SHA, and clean tree.
- Batch 2 passed typecheck, all 10 tests, and the production build.
- Batch 3 captured 5 cold and 5 warm 200-response timings for each required
  route on a local production build.
- D-013 confirmed the Batch 3 `audition_requirements` 403 → fallback 200 as an
  expected baseline observation and authorized resume at Batch 4.
- The first Batch 4 homepage render failed to fetch `schools` from Directus.
  This new error is outside D-013 and triggered S7 before any valid Batch 4
  route observation was completed.

Prior attempt retained as history: the 2026-07-23 11:40–11:46 run stopped
before Batch 1 under S12 because approval and decisions D-001/D-002/D-004 had
not yet been recorded. D-012 subsequently approved execution and resolved
those Phase 0 preconditions.

## 2. File accounting

| Type | Files / result |
|---|---|
| Modified | `improve_s/01_phase_0_baseline/report.md`; `improve_s/logs/execution_log.md` |
| Added | Six Batch 3 and two Batch 4 local-server stdout/stderr measurement artifacts listed below |
| Deleted | none |
| Dependency changes | none |
| Configuration changes | none |
| Database changes | none |
| Application changes | none under `app/`, `components/`, `lib/`, or `data/` |
| Remaining untracked files | none |

Added measurement artifacts:

- `improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stderr.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stderr.txt`
- `improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stderr.txt`
- `improve_s/01_phase_0_baseline/batch4_home.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_home.stderr.txt`

`git diff --stat` after the stop-record commit: empty (clean working tree).

Branch versus rollback SHA `86c1db9` after staging the stop record:

```text
 .../01_phase_0_baseline/acceptance_checklist.md    |  23 +-
 .../batch3_probe_server_20260723_1208.stderr.txt   |   0
 .../batch3_probe_server_20260723_1208.stdout.txt   |  24 +
 .../batch3_server_20260723_1201.stderr.txt         |   0
 .../batch3_server_20260723_1201.stdout.txt         |  10 +
 .../batch3_server_20260723_1203.stderr.txt         |   0
 .../batch3_server_20260723_1203.stdout.txt         |  10 +
 .../01_phase_0_baseline/batch4_home.stderr.txt     |   5 +
 .../01_phase_0_baseline/batch4_home.stdout.txt     |  18 +
 improve_s/01_phase_0_baseline/codex_execution.md   |  46 +-
 improve_s/01_phase_0_baseline/report.md            | 463 ++++++++++----
 improve_s/README.md                                |   3 +-
 improve_s/logs/decisions.md                        | 277 ++++++++-
 improve_s/logs/execution_log.md                    | 684 +++++++++++++++++++++
 improve_s/logs/rollback_history.md                 |  33 +-
 15 files changed, 1473 insertions(+), 123 deletions(-)
```

This branch-level stat includes the approved entry-gate and rollback
documentation commits that preceded the execution batches.

## 3. Build and test results

| Check | Exit code / result | Output |
|---|---|---|
| `npm run typecheck` | 0 — PASS | `tsc --noEmit`; no diagnostics; 1.755 s |
| `npm test` | 0 — PASS | 10/10 tests: 2 Python validator + 8 Node importer; 3.094 s |
| `npm run build` | 0 — PASS | Next.js 15.5.20 production build |
| Route table | captured below | Six public/pilot routes are dynamic (`ƒ`); `/login` and `/_not-found` are static (`○`) |
| Build duration | 17.617 s | 2026-07-23 12:00:31–12:00:48 +08:00 |
| Warnings | none | No build warning was emitted |

The test command emitted two non-failing
`System.Management.Automation.RemoteException` wrapper lines around the Python
`unittest` summary. The Python suite still reported `OK`, the Node suite
reported 8 passes and 0 failures, and the package command exited 0.

Complete build route table (verbatim):

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

## 4. Timing baseline

**Environment:** ☐ local dev ☑ local production build ☐ Preview ☐ production

**Wall-clock measurement start/end:** 2026-07-23 12:03:32–12:06:17 +08:00
(165.149 s)

**Directus link throughput:** no valid byte-rate could be produced. The
application-side byte-count probe stopped under S7 after observing a Directus
403, and its installed diagnostics channel did not expose response-body chunk
sizes. No direct Directus query was made. The per-render end-to-end durations
below are the only valid network-condition proxy from this stopped run.

**Machine state:** no intentional heavy workload was started alongside the
measurement. After the run, total CPU was 10.4%; the machine had 15.94 GB
visible RAM and 2.68 GB free physical RAM. Windows Defender
(`MsMpEng`) was the largest non-system process by cumulative CPU and used
approximately 555 MB working set.

| Route | Cold runs (ms) | Cold median | Warm runs (ms) | Warm median | Link note |
|---|---|---|---|---|---|
| `/` | 3718.076, 3436.724, 3623.326, 6365.277, 8052.986 | **3718.076 ms** | 9490.978, 6872.603, 5237.129, 4076.979, 3537.454 | **5237.129 ms** | Same local-production session; valid byte-rate unavailable after S7 |
| `/search` | 3048.691, 3188.943, 2952.741, 3111.590, 2991.556 | **3048.691 ms** | 3682.700, 3327.073, 3549.827, 3358.273, 3315.171 | **3358.273 ms** | Same local-production session; valid byte-rate unavailable after S7 |
| `/schools/yale_school_of_music` | 3324.729, 3648.994, 3266.326, 4698.626, 4885.535 | **3648.994 ms** | 5049.444, 4170.443, 3941.928, 4054.367, 3861.516 | **4054.367 ms** | Same local-production session; valid byte-rate unavailable after S7 |
| `/schools/yale_school_of_music/programs/1190` | 3918.926, 3707.178, 3624.230, 3736.154, 3613.488 | **3707.178 ms** | 3503.749, 3712.279, 3691.290, 3784.770, 3602.065 | **3691.290 ms** | Same local-production session; valid byte-rate unavailable after S7 |

All 40 official timing responses were HTTP 200. An earlier formatting-failed
measurement command made one preliminary `/` request (HTTP 200, 4460.188 ms)
before aborting locally; it is excluded from the table. The local server was
restarted before the official cold series, and both server logs were retained.

### Prior evidence — PRESERVED VERBATIM

> ⚠️ `.codex-dev.*.log` matches the `*.log` rule in `.gitignore` and is
> **never tracked**. It is truncated every time the dev server restarts.
> **Set A below was already lost this way** between 2026-07-22 and 2026-07-23.
> Both sets are transcribed here because this report is the only durable copy.
> Never cite the live log file as evidence — copy its contents in.

#### Set A — `.codex-dev.stdout.log`, 2026-07-22, dev server
**Dataset at the time: 2 schools, 334 programs, ~5,069 source records.**
**Source file has since been OVERWRITTEN — this transcription is all that remains.**

```
GET /                                          200 in 31395ms
GET /schools/royal_conservatoire_of_scotland   200 in 28318ms
GET /schools/royal_college_of_music            200 in 29400ms
GET /schools/.../programs/1090                 200 in 27263ms
```
Full observed range that day: **2.6s – 33s**.

#### Set B — `.codex-dev.stdout.log`, 2026-07-23, dev server (127.0.0.1:3100)
**Dataset at the time: 20 schools, 1,938 programs, 17,663 source records.**
Captured during the nine-school frontend verification run.

```
next dev --hostname 127.0.0.1 --port 3100   ▲ Next.js 15.5.20   Ready in 5.7s

GET /                                                          200 in 7672ms
GET /schools/yale_school_of_music                              200 in 5289ms
GET /schools/yale_school_of_music                              200 in 5415ms
GET /schools/yale_school_of_music                              200 in 4335ms
GET /schools/yale_school_of_music                              200 in 4150ms
GET /schools/yale_school_of_music                              200 in 3598ms
GET /schools/jacobs_school_of_music                            200 in 4819ms
GET /schools/university_of_michigan_smtd                       200 in 4512ms
GET /schools/northwestern_bienen_school_of_music               200 in 3909ms
GET /schools/usc_thornton_school_of_music                      200 in 5405ms
GET /schools/rice_shepherd_school_of_music                     200 in 3725ms
GET /schools/peabody_institute                                 200 in 4245ms
GET /schools/oberlin_conservatory_of_music                     200 in 3384ms
GET /schools/cleveland_institute_of_music                      200 in 4811ms
GET /schools/yale_school_of_music/programs/1190                200 in 4877ms
GET /schools/yale_school_of_music/programs/1190                200 in 6321ms
GET /schools/jacobs_school_of_music/programs/1264              200 in 4607ms
GET /schools/university_of_michigan_smtd/programs/1331         200 in 4413ms
GET /schools/northwestern_bienen_school_of_music/programs/1410 200 in 4424ms
GET /schools/usc_thornton_school_of_music/programs/1486        200 in 3758ms
GET /schools/rice_shepherd_school_of_music/programs/1561       200 in 4236ms
GET /schools/peabody_institute/programs/1631                   200 in 4083ms
GET /schools/oberlin_conservatory_of_music/programs/1799       200 in 4091ms
GET /schools/cleveland_institute_of_music/programs/1834        200 in 4814ms
```
Observed range: **3.4s – 7.7s**, median ≈ 4.4s. Repeat requests to the same
school (5.4 / 4.3 / 4.2 / 3.6s) show **no warm-cache benefit** — consistent
with `cache: "no-store"` re-pulling everything each time.

#### Set C — mandatory Batch 0 read, 2026-07-23 11:45 +08:00

The live stdout file is the same 2026-07-23 dev-server session represented by
Set B. It is preserved again here in full because Set B transcribed only the
timing lines. The final terminal control sequence is rendered as
`<ESC>[?25h`. The stderr file was zero bytes.

`.codex-dev.stdout.log` — 1,881 bytes, last written 2026-07-23 10:45:26 +08:00:

```text

> stage-front@0.1.0 dev
> next dev --hostname 127.0.0.1 --port 3100

   ▲ Next.js 15.5.20
   - Local:        http://127.0.0.1:3100
   - Network:      http://127.0.0.1:3100
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 5.7s
 ○ Compiling / ...
 ✓ Compiled / in 811ms (621 modules)
 GET / 200 in 7672ms
 ○ Compiling /schools/[schoolId] ...
 ✓ Compiled /schools/[schoolId] in 885ms (651 modules)
 GET /schools/yale_school_of_music 200 in 5289ms
 ✓ Compiled /schools/[schoolId]/programs/[programId] in 459ms (682 modules)
 GET /schools/yale_school_of_music/programs/1190 200 in 4877ms
 GET /schools/yale_school_of_music 200 in 5415ms
 GET /schools/yale_school_of_music 200 in 4335ms
 GET /schools/yale_school_of_music 200 in 4150ms
 GET /schools/yale_school_of_music 200 in 3598ms
 GET /schools/jacobs_school_of_music 200 in 4819ms
 GET /schools/university_of_michigan_smtd 200 in 4512ms
 GET /schools/northwestern_bienen_school_of_music 200 in 3909ms
 GET /schools/usc_thornton_school_of_music 200 in 5405ms
 GET /schools/rice_shepherd_school_of_music 200 in 3725ms
 GET /schools/peabody_institute 200 in 4245ms
 GET /schools/oberlin_conservatory_of_music 200 in 3384ms
 GET /schools/cleveland_institute_of_music 200 in 4811ms
 GET /schools/yale_school_of_music/programs/1190 200 in 6321ms
 GET /schools/jacobs_school_of_music/programs/1264 200 in 4607ms
 GET /schools/university_of_michigan_smtd/programs/1331 200 in 4413ms
 GET /schools/northwestern_bienen_school_of_music/programs/1410 200 in 4424ms
 GET /schools/usc_thornton_school_of_music/programs/1486 200 in 3758ms
 GET /schools/rice_shepherd_school_of_music/programs/1561 200 in 4236ms
 GET /schools/peabody_institute/programs/1631 200 in 4083ms
 GET /schools/oberlin_conservatory_of_music/programs/1799 200 in 4091ms
 GET /schools/cleveland_institute_of_music/programs/1834 200 in 4814ms
<ESC>[?25h
```

`.codex-dev.stderr.log` — 0 bytes, last written
2026-07-23 10:35:31 +08:00:

```text
```

#### Reading A against B — do not over-interpret

B is **faster than A despite ~6× more data**. Do not conclude the problem
improved. Confounders: different link conditions, different machine state, dev
compile time included in both, different routes. What B does establish, and
what matters:

- Every request still costs **3.4–7.7s** at the current dataset size
- **Repeat requests show no improvement** — nothing is cached
- Both sets are **dev-server** figures and are *not* a production baseline

**This is context, not the baseline.** Batch 3 produces the real one against a
local production build.

> **The original brief's "approximately 1–2 seconds" claim is formally
> discarded.** Neither Set A nor Set B supports it.
> Confirmed by: ____________ on ____________

---

## 5. Directus request baseline

| Route | Request count | Collections | Approx. response bytes |
|---|---|---|---|
| `/` | Batch 3 trace: 6 valid attempts; Batch 4 attempt invalid | Batch 3: `schools`, `program_offerings`, `application_requirements`, `audition_requirements` (403), `audition_requirements` fallback (200), `source_records`; Batch 4 stopped on `schools` fetch failure | unavailable |
| `/search` | not observed in Batch 4 — stopped under S7 | not observed | not measured |
| `/schools/yale_school_of_music` | not observed in Batch 4 — stopped under S7 | not observed | not measured |
| `/schools/yale_school_of_music/programs/1190` | not observed in Batch 4 — stopped under S7 | not observed | not measured |

No request was made directly to Directus. The application-side probe was
performed as the Batch 3 link-throughput observation. D-013 validates its five
initial collection reads plus the expected sixth `audition_requirements`
fallback request.

The Batch 4 resume attempt started the same six request attempts, but no
successful response-completion records were emitted. Server stderr reported:

```text
Error: Directus request failed on /items/schools?...: fetch failed
```

The localhost response was HTTP 200 in 11038.552 ms but only 15,395 bytes,
consistent with the rendered error response rather than a valid homepage. This
is outside the narrow D-013 exception and triggered S7 before a valid Batch 4
render was completed.

## 6. Public exposure baseline

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | `internal_` | `admin_` | Payload bytes |
|---|---|---|---|---|---|---|---|
| `/` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/search` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/schools/yale_school_of_music` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/schools/yale_school_of_music/programs/1190` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |

Payload files: none. Batch 5 did not begin because the resumed execution
stopped under S7 in Batch 4.

## 7. QA mechanism

Approved path: **Path B — manual checklist** (D-002).

Execution status: Batch 6 was not reached because resumed execution stopped
under S7 in Batch 4, so the ten-item manual checklist was not added.

Smoke-suite files created: none. Dependency changes: none.

## 8. Known measurement limitations

- The four-route local-production timing set is complete, but Phase 0 did not
  produce a valid overall baseline because the required request-count,
  response-byte, public-exposure, and QA batches remain incomplete after the
  new Batch 4 S7 stop.
- No real-user data is available.
- D-001 formally permits local production for Phase 0 only. Preview remains
  unresolved and blocks later phase gates.
- Directus link throughput is known to vary materially. D-013 accepts that a
  valid byte-rate was not produced because the diagnostics channel exposed no
  response-body byte counts; per-collection durations are the approved proxy.
- The Batch 4 resume attempt encountered a new `schools` fetch failure. Its
  11-second localhost response and 15,395-byte error output are not baseline
  request-count or response-byte measurements.
- No route substitution was made; all four planned routes returned HTTP 200.
- The homepage timing spread was wide (3436.724–9490.978 ms across official
  cold/warm runs), but the median remained computable. The other routes were
  materially tighter.
- One preliminary homepage probe (HTTP 200, 4460.188 ms) was excluded after a
  local output-delimiter error; the server was restarted before official runs.
- The preserved Set A and Set B figures are local development-server context,
  not a production baseline.
- `docs/imports/stage-v4-nine-school-verification.json` reports
  `current_application_rows: 0` for 8 of the 9 newly imported schools — those
  rows carry no `is_current = true`. Pages still render because
  `selectCurrentCycle` (`lib/data.ts`) falls back to all matching rows, and
  frontend verification recorded PASS. **If `is_current` is populated later,
  displayed content will change — this must not be attributed to the
  optimization work.**

## 9. Blocking precondition status

| Decision | Status at stop | Effect on Phase 0 |
|---|---|---|
| D-001 | Resolved for Phase 0 only | Local production is approved for Phase 0; Preview remains open for later gates |
| D-002 | Resolved | Path B manual checklist approved |
| D-003 | Resolved | Working tree and rollback point established |
| D-004 | Resolved | Unsupported 1–2 second figure formally discarded |
| D-005 | Open | Not a Phase 0 execution item |
| D-006 | Open | Not a Phase 0 execution item |
| D-007 | Open | Not a Phase 0 execution item |
| D-008 | Open | Not a Phase 0 execution item |
| D-009 | Open | Not blocking Phase 0; required before Phase 4 final verification |
| D-010 | Open | Program execution order unconfirmed |
| D-012 | Approved | Authorized Batches 0–7; does not override stop conditions |
| D-013 | Resolved | Validated Batch 3 and authorized resume at Batch 4; exception covers only `audition_requirements` 403 → fallback 200 |

Entry and resume approvals were valid. The current blocker is a new S7
`schools` fetch failure outside D-013, not a missing owner decision.

## 10. Incomplete or blocked items

- Batches 0–2: completed and committed.
- Batch 3: complete and valid under D-013. All 40 timing requests returned
  HTTP 200; the expected `audition_requirements` fallback is baseline data.
- Batch 4: stopped on its first route because the `schools` Directus request
  failed. No valid four-route request/byte baseline was produced.
- Batch 5: anonymous RSC payloads not captured.
- Batch 6: Path B was approved, but the manual checklist was not written
  because the batch was not reached.
- Batch 7: the required `is_current` limitation remains recorded in §8 from the
  prior report; Batch 7 was not formally reached in this execution.
- Phase 0 cannot be completed or sent to its exit gate until Claude/owner
  review the new Batch 4 S7 evidence and approve a refreshed execution package
  or other disposition.

**Stop condition:** S7 — Directus failed the Batch 4 `schools` request with
`fetch failed`. This is not the known `audition_requirements` 403 → fallback
200 signature authorized by D-013. No retry, permission change, or fix was
attempted.

## 11. Recommended next phase

Default recommendation after a valid Phase 0 baseline remains
**`04_phase_2_speed_architecture`**.

Phase 0 is incomplete, so no next phase is authorized. The immediate action is
Claude/owner review of the new Batch 4 `schools` fetch-failure evidence and a
refreshed, explicitly approved Phase 0 execution package or disposition. Codex
must not resume Batches 4–7 under the current stopped run.
