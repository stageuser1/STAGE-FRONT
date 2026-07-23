# Phase 0 — Baseline · Report

**Status:** ✅ **ENTRY GATE APPROVED — cleared to execute Batches 0–7**
**Completed:** Not yet — execution pending
**Branch:** `perf/s0-baseline`
**Baseline commit SHA:** `86c1db9ccda8e71a73603454a625652e7df8177b`

> **Entry gate resolved 2026-07-23 — see `logs/decisions.md` D-012.**
> The first run (recorded in §1 below) correctly stopped under S12 because no
> owner approval existed and D-001/D-002/D-004 were open. All three are now
> resolved and Phase 0 is approved. **That stop record is retained as history —
> do not overwrite it.** Sections 3–11 remain to be filled by the execution run.
>
> **Two corrections that apply to the next run:**
> 1. **`npm test` must be run in Batch 2.** The previous run skipped it citing
>    D-002; that was incorrect — `npm test` runs the existing Python validator
>    and Node importer suites and has no dependency on D-002. Expected: PASS,
>    10 tests.
> 2. **Batch 6 follows Path B** (manual checklist written into this report).
>    Create no files. Install nothing.

> This document becomes the reference baseline for the entire program.
> Every later phase compares against the numbers recorded here.

---

## 1. Execution metadata

| Field | Value |
|---|---|
| Branch | `perf/s0-baseline` |
| Baseline SHA | `86c1db9ccda8e71a73603454a625652e7df8177b` |
| Shell | PowerShell |
| Start | 2026-07-23 11:40 +08:00 |
| End | 2026-07-23 11:46 +08:00 |
| Actor | Codex |
| Outcome | Stopped before Batch 1 under S12 |

Completed work:

- Read all documents required by `codex_execution.md`.
- Verified branch `perf/s0-baseline`, clean starting tree, and recorded rollback
  SHA.
- Read both volatile `.codex-dev.*.log` files without modifying them.
- Verified that the stdout content is the same 2026-07-23 session represented
  by Set B; Set C below preserves both files in full, including the empty
  stderr file.
- Checked the Phase 0 entry decisions. D-001, D-002, and D-004 remain open,
  and no owner approval to start Phase 0 is recorded.
- Stopped before typecheck, tests, build, server start, HTTP measurement,
  Directus observation, or RSC capture.

## 2. File accounting

| Type | Files / result |
|---|---|
| Modified | `improve_s/01_phase_0_baseline/report.md`; `improve_s/logs/execution_log.md` |
| Added | none |
| Deleted | none |
| Dependency changes | none |
| Configuration changes | none |
| Database changes | none |
| Application changes | none under `app/`, `components/`, `lib/`, or `data/` |
| Remaining untracked files | none |

`git diff --stat`:

```
 improve_s/01_phase_0_baseline/report.md | 306 +++++++++++++++++++++-----------
 improve_s/logs/execution_log.md         |  91 ++++++++++
 2 files changed, 294 insertions(+), 103 deletions(-)
```

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

**Environment:** ☐ local dev ☐ local production build ☐ Preview ☐ production

**Wall-clock measurement start/end:** not applicable — measurement was not run

**Directus link throughput:** not measured

**Machine state:** not recorded because the measurement session did not start

| Route | Cold runs (ms) | Cold median | Warm runs (ms) | Warm median | Link note |
|---|---|---|---|---|---|
| `/` | not run | n/a | not run | n/a | not measured |
| `/search` | not run | n/a | not run | n/a | not measured |
| `/schools/yale_school_of_music` | not run | n/a | not run | n/a | not measured |
| `/schools/yale_school_of_music/programs/1190` | not run | n/a | not run | n/a | not measured |

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
| `/` | not observed | not observed | not measured |
| `/search` | not observed | not observed | not measured |
| `/schools/yale_school_of_music` | not observed | not observed | not measured |
| `/schools/yale_school_of_music/programs/1190` | not observed | not observed | not measured |

No request was made directly to Directus. Batch 4 did not begin.

## 6. Public exposure baseline

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | `internal_` | `admin_` | Payload bytes |
|---|---|---|---|---|---|---|---|
| `/` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/search` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/schools/yale_school_of_music` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |
| `/schools/yale_school_of_music/programs/1190` | not captured | not captured | not captured | not captured | not captured | not captured | n/a |

Payload files: none. Batch 5 did not begin.

## 7. QA mechanism

Path taken: neither Path A nor Path B. D-002 remains open in
`logs/decisions.md`, so the execution package does not authorize Codex to choose
between a smoke suite and a manual checklist.

Smoke-suite files created: none. Dependency changes: none.

## 8. Known measurement limitations

- No valid local-production timing baseline was produced because execution
  stopped before Batch 2.
- No real-user data is available.
- Preview/production status is unresolved because D-001 remains open.
- Directus link throughput was not measured and is known to vary materially.
- No route substitution was made; no route measurement began.
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
| D-001 | Open | Preview/staging status unresolved |
| D-002 | Open | QA Path A vs. Path B unresolved |
| D-003 | Resolved | Working tree and rollback point established |
| D-004 | Open | Stale 1–2 second baseline not owner-confirmed as discarded |
| D-005 | Open | Not a Phase 0 execution item |
| D-006 | Open | Not a Phase 0 execution item |
| D-007 | Open | Not a Phase 0 execution item |
| D-008 | Open | Not a Phase 0 execution item |
| D-009 | Open | Not blocking Phase 0; required before Phase 4 final verification |
| D-010 | Open | Program execution order unconfirmed |

The package status remains “READY — do not execute until the owner records
approval in `improve_s/logs/decisions.md`.” No such approval entry exists.

## 10. Incomplete or blocked items

- Batch 1: no new action required for branch/rollback setup, but Phase 0 entry
  approval is missing.
- Batch 2: typecheck, 10-test verification, and production build not run.
- Batch 3: timing baseline not run.
- Batch 4: application-side Directus request count not observed.
- Batch 5: anonymous RSC payloads not captured.
- Batch 6: QA mechanism not selected because D-002 is open.
- Batch 7: required data limitation is recorded in §8; no action was taken.
- Phase 0 cannot be completed or sent to its gate without the missing owner
  decisions and approval.

**Stop condition:** S12 — the package is ambiguous/unexecutable without a
recorded Phase 0 approval and a D-002 choice. Proceeding would also violate the
global execution rule that the human owner must authorize the start of each
phase.

## 11. Recommended next phase

Default recommendation after a valid Phase 0 baseline:
**`04_phase_2_speed_architecture`**.

Phase 0 is not complete, so no next phase is authorized. The immediate required
action is for the owner to record the Phase 0 entry approval and resolve D-001,
D-002, and D-004 in `logs/decisions.md`; then Batch 2 can begin without
expanding scope.
