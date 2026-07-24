# Execution Log

Append-only. One entry per execution batch. Newest at the bottom.

**Never delete or rewrite an entry.** If something was wrong, add a correcting
entry — the history of what was believed at the time is part of the evidence.

---

## Entry template

```markdown
### [YYYY-MM-DD] Phase __ · Batch __ — <short description>

- **Actor:** Codex / Claude / Owner
- **Branch:** 
- **Plan reference:** improve_s/__/claude_plan.md — batch __
- **Approved by owner:** yes / no — decisions.md ref: 

**Files modified:** 
**Files added:** 
**Files deleted:** 
**Dependency changes:** 
**Configuration changes:** 
**Database changes:** 

**git diff --stat:**
```
```

**Typecheck:** pass / fail
**Build:** pass / fail
**Tests / smoke:** pass / fail / n-a

**Measurements:**
| Route | Runs | Median | vs. baseline |
|---|---|---|---|

**Outcome:** completed / stopped / reverted
**Stop reason (if stopped):** 
**Blocked or incomplete items:** 
**Commit SHA:** 
```

---

## Log

### [2026-07-23] Program setup — `improve_s/` workspace created

- **Actor:** Claude
- **Branch:** `main` (no commit made)
- **Approved by owner:** yes — workspace creation was explicitly requested

**Files modified:** none
**Files added:** 38 documentation files under `improve_s/`
**Files deleted:** none
**Dependency changes:** none
**Configuration changes:** none
**Database changes:** none

**Typecheck:** not run (no application code touched)
**Build:** not run (no application code touched)
**Tests / smoke:** n/a

**Outcome:** completed

**Notes:**
- Documentation and control structure only. No application code, configuration,
  or dependency was touched. No commit was created.
- Folder numbering follows the original program's phase numbering for
  traceability. **The recommended execution order differs** — see `README.md`
  and `00_program_overview/optimization_scope.md` §5.
- Phase `02_` (security transport) was **added** — it was not in the original
  program.
- Original Phases 2 and 3 are **merged** into `04_phase_2_speed_architecture`,
  because this repository has a single shared data loader rather than
  independent per-route data paths.

**Next action:** owner reviews `00_program_overview/`, then approves
`01_phase_0_baseline/claude_plan.md` to begin.

---

### [2026-07-23] Initialization review — stale facts corrected

- **Actor:** Claude
- **Branch:** `main` (no commit made)
- **Approved by owner:** yes — review explicitly requested

**Files modified:** 12 documentation files under `improve_s/` (no application code)
**Files added:** none
**Files deleted:** none
**Dependency changes:** none · **Configuration changes:** none · **Database changes:** none

**Typecheck / Build / Tests:** not run — no application code touched

**Findings corrected:**

1. **`HEAD` advanced during workspace setup** — `c123ec8` → `00b341a`
   ("Import nine STAGE V4 schools into Directus"). `rollback_history.md`
   corrected; `scripts/import_v4_package.mjs` is no longer a modified file.
2. **Dataset grew ~6×.** Live counts (source:
   `docs/imports/stage-v4-nine-school-verification.json`, 2026-07-23T02:44:08Z):
   20 schools, 1,938 program offerings, 1,938 application requirements,
   2,087 audition requirements, 17,663 source records.
   Previously recorded: 2 schools / 334 programs / ~5,069 sources.
3. **New finding — in-memory join cost is now material.** ~42M array
   comparisons per request from the per-program `sourceRecords.filter(...)`
   (`lib/data.ts:1038`) and two `selectCurrentCycle` scans. Negligible at 334
   programs; a real CPU cost at 1,938.
4. **Static generation estimate revised** ~336 → **~1,958 pages**. Phase `04_`
   Batch 4 gained a documented fallback (schools-only static params).
5. **D-000c revised** — PostgreSQL workstream changed from "struck" to
   "deferred pending evidence"; the absolute claim no longer holds at 17,663
   source records.
6. **Data observation recorded** — `current_application_rows: 0` for 8 of 9 new
   schools. Not a bug: `selectCurrentCycle` falls back to all matching rows, and
   frontend verification passed. Recorded so QA does not later mistake a change
   here for an optimization regression.

**Outcome:** completed. Folder structure verified (10 dirs, 38 files).
Execution order verified as speed-first.

**Next action:** owner resolves D-001…D-010, then approves
`01_phase_0_baseline/` to begin.

---

### [2026-07-23] D-003 resolution and baseline preparation

- **Actor:** Claude
- **Branch:** `main` → `perf/s0-baseline`
- **Approved by owner:** yes — "proceed with D-003 resolution and baseline
  preparation in one controlled operation"

**Files modified:** 5 documentation files under `improve_s/`
**Files added:** 66 (4 scripts, 62 under `output/`) + 38 under `improve_s/`
**Files deleted:** none
**Dependency changes:** none · **Configuration changes:** `.gitignore` only (`tmp/`)
**Database changes:** none · **Application code changes:** none

**Commits created (4, on `main`, local only — nothing pushed):**

| SHA | Message |
|---|---|
| `32bd745` | Add UK conservatoire and nine-school extraction tooling |
| `524efcd` | Add V4 extraction packages for ten schools |
| `e884935` | Ignore local Directus import scratch directory |
| `86c1db9` | Add optimization program control workspace ← **BASELINE** |

**Typecheck / Build / Tests:** not run — no application code touched

**Actions taken:**
1. D-003 recorded in `decisions.md` with the full classification table
2. Four untracked scripts committed (peers already tracked)
3. `output/` committed — 7.8 MB, 62 files, source data for the `00b341a` import
4. `tmp/` gitignored — 34 MB derived scratch, superseded by `docs/imports/`
5. `improve_s/` committed — now version-controlled
6. Branch `perf/s0-baseline` created from `86c1db9`
7. Baseline SHA recorded in `rollback_history.md`

**Incidental finding — D-011 raised and resolved:**
`.codex-dev.stdout.log` was found **already overwritten**. The 2026-07-22
timings (`GET / 200 in 31395ms`) were replaced by a 2026-07-23 verification run.
Both datasets were transcribed verbatim into `01_phase_0_baseline/report.md`
before any further action. A new **Batch 0** was added to the Phase 0 Codex
package, rule **F10** was rewritten, and `optimization_scope.md` now cites the
report rather than the volatile log.

**Outcome:** completed. Repository baseline ready for Phase 0.

**Blocked / carried forward:**
- `output/` remote-visibility and licensing question — **unresolved**, gated by
  the decision not to push (D-003)
- D-001, D-002, D-004…D-010 remain open

**Next action:** owner resolves the remaining open decisions, then approves
`01_phase_0_baseline/codex_execution.md` for Codex.

---

### [2026-07-23] Phase 0 · Entry gate / Batch 0 — stopped before execution

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  entry gate and Batch 0
- **Approved by owner:** no — no Phase 0 approval entry exists in
  `logs/decisions.md`

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database changes:** none

**Application code changes:** none

**git diff --stat:** recorded in the Phase 0 report after the final working-tree
snapshot.

**Typecheck:** not run

**Build:** not run

**Tests / smoke:** not run

**Measurements:** No Phase 0 measurement began. Batch 0 only read and preserved
the existing `.codex-dev.*.log` contents.

**Outcome:** stopped

**Stop condition:** S12 — Phase 0 has no recorded owner entry approval, D-002
does not select QA Path A or Path B, and D-001/D-004 remain unresolved. The
global execution rules require the owner to approve the start of each phase and
require Codex to stop on ambiguity.

**Exact precondition command:**

```powershell
Select-String -LiteralPath 'D:\STAGE FRONT\improve_s\logs\decisions.md' -Pattern '^\| \*\*D-00[1-9]\*\*','^\| \*\*D-010\*\*','Phase 0','01_phase_0_baseline' -Encoding UTF8
```

**Complete command output:**

```text
improve_s\logs\decisions.md:34:| **D-001** | Does a Preview/staging environment exist? If not: create one, or formally downgrade all Preview-dependent gates to local production builds | All phase gates | ⬜ Open |
improve_s\logs\decisions.md:35:| **D-002** | QA mechanism: build a smoke suite in Phase `01_` (requires a devDependency), or downgrade QA sign-off to a manual checklist | Every gate's QA criterion | ⬜ Open |
improve_s\logs\decisions.md:36:| **D-003** | How to clean the dirty working tree — commit or stash the 6 outstanding items | Phase `01_` Batch 1 | ✅ **RESOLVED** — see D-003 below |
improve_s\logs\decisions.md:37:| **D-004** | Confirm the "1–2 second" baseline from the original brief is discarded | All performance gates | ⬜ Open |
improve_s\logs\decisions.md:38:| **D-005** | Transport security approach: A (TLS on Directus) / B (server-side proxy) / C (both) | Phase `02_` | ⬜ Open |
improve_s\logs\decisions.md:39:| **D-006** | Revalidation window for ISR, and acceptance of the staleness trade-off | Phase `04_` gate | ⬜ Open |
improve_s\logs\decisions.md:40:| **D-007** | `/pilot/*` disposition: keep / gate behind auth / remove | Phases `03_`, `05_` | ⬜ Open |
improve_s\logs\decisions.md:41:| **D-008** | Bundle analyzer devDependency + `next.config.ts` edit — pre-authorize? | Phase `05_` | ⬜ Open |
improve_s\logs\decisions.md:42:| **D-009** | Reviewer test account — obtain before Phase `06_` | Phase `06_` | ⬜ Open |
improve_s\logs\decisions.md:43:| **D-010** | Confirm execution order: `01_` → `04_` → `03_` → `05_` → `06_`, with `02_` in parallel | Program sequence | ⬜ Open |
improve_s\logs\decisions.md:108:### D-003 · [2026-07-23] — Working tree handling before Phase 0
improve_s\logs\decisions.md:113:- **Question:** how to clean the working tree so Phase 0 has a reproducible
improve_s\logs\decisions.md:131:| `improve_s/` | 244 KB, 38 files | **Commit** | Program source of truth; Phase 0 writes to its logs and needs a tracked baseline to diff against |
improve_s\logs\decisions.md:140:- `main` advances by 4 commits before the Phase 0 branch is cut
improve_s\logs\decisions.md:142:- The Phase 0 rollback point becomes unambiguous
improve_s\logs\decisions.md:167:- **Question:** the Phase 0 package cited `.codex-dev.*.log` as baseline
improve_s\logs\decisions.md:173:2026-07-23 by the nine-school verification run, before Phase 0 began.
improve_s\logs\decisions.md:176:1. Both datasets transcribed verbatim into `01_phase_0_baseline/report.md`
improve_s\logs\decisions.md:179:2. New **Batch 0** added to `01_phase_0_baseline/codex_execution.md`: transcribe
improve_s\logs\decisions.md:188:are context; Phase 0 Batch 3 produces the real baseline.
```

**Current `git status --short`:**

```text
 M improve_s/01_phase_0_baseline/report.md
 M improve_s/logs/execution_log.md
```

**Blocked or incomplete items:** Batches 1–7 remain incomplete except for the
pre-existing D-003 branch/rollback setup and Batch 7's report-only limitation
note. The owner must record Phase 0 entry approval and resolve D-001, D-002,
and D-004 before execution can resume.

**Commit SHA:** none — stopped documentation remains uncommitted

---

### [2026-07-23] Phase 0 · Entry gate — APPROVED

- **Actor:** Claude (assessment) / Owner (approval)
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/claude_plan.md`
- **Approved by owner:** yes — decisions.md ref: **D-012**

**Files modified:** 4 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none
**Dependency changes:** none · **Configuration changes:** none
**Database changes:** none · **Application code changes:** none

**Typecheck / Build / Tests:** not run — this is a gate decision, not execution

**Decisions resolved:**

| # | Resolution |
|---|---|
| **D-001** | Preview environment **not required for Phase 0** — verified batch by batch; Phase 0 measures a local production build. **Remains open for Phase `04_` gate onward.** |
| **D-002** | **Path B — manual checklist.** No devDependency, no config edit. |
| **D-004** | "1–2 second" baseline **formally discarded** — contradicted by Sets A, B, C. |
| **D-012** | **Phase 0 entry gate APPROVED.** Batches 0–7 authorized. |

**Correction issued to Codex:**
The previous entry-gate run recorded `npm test` as "not run — D-002 is open;
package path is unresolved." **Incorrect.** `npm test` runs
`python -m unittest tests.test_validator` and `node --test` over two existing
files in `tests/`. It has no dependency on D-002 and **must run in Batch 2**
(expected: PASS, 10 tests). Recorded in D-002 and in the Phase 0 report header.

**Status changes:**
- `01_phase_0_baseline/report.md` — status ⛔ Stopped → ✅ Entry gate approved.
  The prior stop record in §1 is **retained as history**, per the append-only rule.
- `01_phase_0_baseline/acceptance_checklist.md` — blocking preconditions marked resolved
- `README.md` — Phase 0 status table updated

**Outcome:** completed. Phase 0 cleared for Codex execution.

**Blocked / carried forward:**
- **D-001 for later gates** — a Preview environment (or formally rewritten exit
  criteria) is required before the Phase `04_` gate. Do not let `04_` reach its
  gate with this open.
- **D-002 recommendation** — revisit the automated smoke suite before Phase `03_`,
  where silent content loss is the top regression risk and manual checking is weak.
- `output/` remote-visibility / licensing question — still gates `git push`
- D-005, D-006, D-007, D-008, D-009, D-010 remain open; none blocks Phase 0

**Next action:** Codex executes
`improve_s/01_phase_0_baseline/codex_execution.md`, Batches 0–7.

---

### [2026-07-23] Phase 0 · Batch 0 — volatile log evidence verified

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 0
- **Approved by owner:** yes — decisions.md ref: **D-012**

**Files modified:** `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database changes:** none

**Application code changes:** none

**Evidence verification:**
- `.codex-dev.stdout.log`: 1,881 bytes; SHA-256
  `6B1DE3B7E5D6B79DD1D65EEFF27D375F7B01C6DAE74078CFCB6AB15BEDD3E5FD`
- `.codex-dev.stderr.log`: 0 bytes; SHA-256
  `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855`
- Both files match the complete Set C already transcribed in
  `01_phase_0_baseline/report.md`; no duplicate transcription was added.
- Neither volatile file was modified, deleted, truncated, or used as the
  authoritative baseline.

**Typecheck:** not run — not part of Batch 0

**Build:** not run — not part of Batch 0

**Tests / smoke:** n/a

**Outcome:** completed

**Blocked or incomplete items:** none for Batch 0

**Commit SHA:** recorded by the Batch 0 commit

---

### [2026-07-23] Phase 0 · Batch 1 — baseline branch and clean tree verified

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 1
- **Approved by owner:** yes — decisions.md refs: **D-003**, **D-012**

**Files modified:** `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database changes:** none

**Application code changes:** none

**Verification:**
- Branch: `perf/s0-baseline`
- Program rollback SHA:
  `86c1db9ccda8e71a73603454a625652e7df8177b`
- Rollback SHA is recorded in `improve_s/logs/rollback_history.md`.
- The rollback SHA is an ancestor of the current branch.
- The branch contains only approved Phase 0 gate/documentation commits after
  the rollback point.
- `git status --short` returned empty before this batch report was written.
- Remaining untracked files: none.

**Typecheck:** not run — begins in Batch 2

**Build:** not run — begins in Batch 2

**Tests / smoke:** not run — begins in Batch 2

**Outcome:** completed

**Blocked or incomplete items:** none for Batch 1

**Commit SHA:** recorded by the Batch 1 commit

---

### [2026-07-23] Phase 0 · Batch 2 — typecheck, tests, and production build

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 2
- **Approved by owner:** yes — decisions.md ref: **D-012**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database changes:** none

**Application code changes:** none

**Typecheck:** pass — exit 0; 1.755 s; no diagnostics

**Build:** pass — exit 0; 17.617 s; all six public/pilot routes dynamic;
complete route table recorded in the Phase 0 report; no warnings

**Tests / smoke:** pass — 10/10 tests (2 validator + 8 importer); exit 0;
3.094 s

**Measurements:** n/a — timing begins in Batch 3

**Outcome:** completed

**Blocked or incomplete items:** none for Batch 2

**Commit SHA:** recorded by the Batch 2 commit

---

### [2026-07-23] Phase 0 · Batch 3 — timing captured; stopped on Directus 403

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 3
- **Approved by owner:** yes — decisions.md ref: **D-012**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:**
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stderr.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stderr.txt`
- `improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stdout.txt`
- `improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stderr.txt`

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none. The probe used a process-local
`NODE_OPTIONS=--import=data:...` diagnostics subscriber and did not edit any
environment or configuration file.

**Database changes:** none

**Application code changes:** none

**git diff --stat for this staged stop record:**

```text
 .../batch3_probe_server_20260723_1208.stderr.txt   |   0
 .../batch3_probe_server_20260723_1208.stdout.txt   |  24 +++
 .../batch3_server_20260723_1201.stderr.txt         |   0
 .../batch3_server_20260723_1201.stdout.txt         |  10 +
 .../batch3_server_20260723_1203.stderr.txt         |   0
 .../batch3_server_20260723_1203.stdout.txt         |  10 +
 improve_s/01_phase_0_baseline/report.md            | 201 ++++++++++++++-------
 improve_s/logs/execution_log.md                    | 155 ++++++++++++++++
 8 files changed, 331 insertions(+), 69 deletions(-)
```

The final numbers differ slightly after inserting this stat block; the
authoritative branch-versus-rollback accounting is in the Phase 0 report.

**Typecheck:** pass in Batch 2

**Build:** pass in Batch 2

**Tests / smoke:** 10/10 tests pass in Batch 2; Batch 6 manual QA not reached

**Measurements:**

| Route | Cold median | Warm median | HTTP result |
|---|---:|---:|---|
| `/` | 3718.076 ms | 5237.129 ms | 10/10 HTTP 200 |
| `/search` | 3048.691 ms | 3358.273 ms | 10/10 HTTP 200 |
| `/schools/yale_school_of_music` | 3648.994 ms | 4054.367 ms | 10/10 HTTP 200 |
| `/schools/yale_school_of_music/programs/1190` | 3707.178 ms | 3691.290 ms | 10/10 HTTP 200 |

All individual timing runs and the machine/session context are recorded in
`01_phase_0_baseline/report.md`.

**Outcome:** stopped

**Stop condition:** **S7** — Directus returned HTTP 403 for the initial
`audition_requirements` collection request during the application-side
measurement probe. The application issued a fallback request that returned
200, and the page returned 200, but the execution package requires an
immediate stop on any Directus error mid-measurement.

**Exact command that triggered and displayed the stop evidence:**

```powershell
$started=Get-Date
$format="%{http_code}`t%{time_total}`t%{size_download}"
$metric=& curl.exe -sS --max-time 120 -o NUL -w $format 'http://localhost:3000/'
$code=$LASTEXITCODE
$ended=Get-Date
"APP_PROBE=$metric"
"APP_PROBE_START=$($started.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
"APP_PROBE_END=$($ended.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
"APP_PROBE_WALL_MS=$([math]::Round(($ended-$started).TotalMilliseconds,3))"
'PROBE_LOG:'
Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch3_probe_server_20260723_1208.stdout.txt'
'PROBE_STDERR_BYTES=' + (Get-Item -LiteralPath 'improve_s\01_phase_0_baseline\batch3_probe_server_20260723_1208.stderr.txt').Length
exit $code
```

**Complete command output:**

```text
APP_PROBE=200	3.945555	254146
APP_PROBE_START=2026-07-23 12:09:09 +08:00
APP_PROBE_END=2026-07-23 12:09:13 +08:00
APP_PROBE_WALL_MS=3962.896
PROBE_LOG:
[P0_DIAG_READY]

> stage-front@0.1.0 start
> next start

[P0_DIAG_READY]
   ▲ Next.js 15.5.20
   - Local:        http://localhost:3000
   - Network:      http://192.168.5.170:3000

 ✓ Starting...
 ✓ Ready in 677ms
[P0_DIRECTUS_START] id=1 collection=schools method=GET
[P0_DIRECTUS_START] id=2 collection=program_offerings method=GET
[P0_DIRECTUS_START] id=3 collection=application_requirements method=GET
[P0_DIRECTUS_START] id=4 collection=audition_requirements method=GET
[P0_DIRECTUS_START] id=5 collection=source_records method=GET
[P0_DIRECTUS_END] id=1 collection=schools status=200 body_bytes=0 duration_ms=107
[P0_DIRECTUS_END] id=4 collection=audition_requirements status=403 body_bytes=0 duration_ms=160
[P0_DIRECTUS_START] id=6 collection=audition_requirements method=GET
[P0_DIRECTUS_END] id=3 collection=application_requirements status=200 body_bytes=0 duration_ms=1399
[P0_DIRECTUS_END] id=2 collection=program_offerings status=200 body_bytes=0 duration_ms=1902
[P0_DIRECTUS_END] id=6 collection=audition_requirements status=200 body_bytes=0 duration_ms=2302
[P0_DIRECTUS_END] id=5 collection=source_records status=200 body_bytes=0 duration_ms=2970
PROBE_STDERR_BYTES=0
```

No response bodies, request headers, or credentials were logged.

**Current `git status --short` captured immediately after stopping the local
server and before writing this stop record:**

```text
?? improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stderr.txt
?? improve_s/01_phase_0_baseline/batch3_probe_server_20260723_1208.stdout.txt
?? improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stderr.txt
?? improve_s/01_phase_0_baseline/batch3_server_20260723_1201.stdout.txt
?? improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stderr.txt
?? improve_s/01_phase_0_baseline/batch3_server_20260723_1203.stdout.txt
```

The application-side probe server was stopped and port 3000 was confirmed
free. The `pktmon` counters-only alternative was blocked by local command
policy before execution; no packet filter or capture file was created.

**Blocked or incomplete items:** valid Directus link throughput; Batch 4
four-route request/byte baseline; Batch 5 RSC captures; Batch 6 manual
checklist; formal Batch 7 completion. No fix was attempted, and Batches 4–7
were not executed.

**Commit SHA:** recorded by the Batch 3 stop-record commit

---

### [2026-07-23] Phase 0 · Batch 3 S7 stop — reviewed and OVERTURNED

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `01_phase_0_baseline/codex_execution.md` — Batch 3, S7
- **Approved by owner:** yes — decisions.md ref: **D-013**

**Files modified:** 3 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none
**Dependency changes:** none · **Configuration changes:** none
**Database changes:** none · **Directus permission changes:** none
**Application code changes:** none

**Typecheck / Build / Tests:** not re-run — this is a gate review, not execution

**Findings:**

1. **S7 was correctly triggered as written — Codex is not at fault.** It applied
   the rule literally, halted without attempting a fix, preserved six artifacts,
   and reported. Correct discipline.
2. **The rule was defective.** S7 read "errors mid-measurement", contradicting
   the governing rule in `execution_rules.md` §5 condition 3 ("any Directus error
   class **not previously seen**"). Drafting error in the Phase 0 package,
   authored by Claude.
3. **The 403 is expected behaviour**, documented in three places before the run:
   `lib/data.ts:939-945`, `skills/backend_engineer_role.md`, and project memory.
   It is `fetchAuditionRequirements()` requesting two columns that do not exist
   in Directus, catching the 403, and re-requesting the base field list.
4. **Not a permissions regression** — the fallback returned 200; all other
   collections returned 200 on first request.
5. **Valuable baseline data recovered from the probe:** Directus wall-clock time
   ≈ **2,970 ms** per render (concurrent, bounded by `source_records`) against a
   ~3.6–3.7 s page render — **~80% of render time is Directus round trips.**
   Per-collection: schools 107 ms · application_requirements 1,399 ms ·
   program_offerings 1,902 ms · audition_requirements 403 @160 ms then
   200 @2,302 ms · source_records 2,970 ms.

**Corrections applied to `01_phase_0_baseline/codex_execution.md`:**
- S7 rewritten to match `execution_rules.md` §5 condition 3
- "Known Directus behaviour" section added with the exact expected signature
- Exception scoped narrowly: S7 still fires if the fallback also fails, if a 403
  appears on any other collection, if a 403 has no following retry, on any
  non-403 4xx or any 5xx, or if Directus is unreachable

**Status changes:**
- `report.md` — ⛔ Stopped → 🟢 cleared to resume at Batch 4. Batch 3 recorded
  as **complete and valid**; the stop record is retained as history.
- Link byte-rate recorded as a **measurement limitation**, not a re-run trigger
  (`body_bytes=0`; instrumentation did not expose body chunk sizes).

**Outcome:** completed. Stop overturned as a false positive.

**Explicitly NOT authorized:** re-running Batches 0–3; any Directus permission
or schema change to "fix" the 403; removing the optimistic query.

**Next action:** Codex resumes at **Batch 4** and runs through Batch 7.
Batch 6 remains Path B.

---

### [2026-07-23] Phase 0 · Batch 4 — stopped on new Directus `schools` fetch failure

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 4 and revised S7
- **Approved by owner:** yes — decisions.md refs: **D-012**, **D-013**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:**
- `improve_s/01_phase_0_baseline/batch4_home.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_home.stderr.txt`

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none. The application-side observer used a
process-local `NODE_OPTIONS=--import=data:...` diagnostics subscriber and did
not edit any environment or configuration file.

**Database changes:** none

**Application code changes:** none

**git diff --stat for the Batch 4 stop record:**

```text
 .../01_phase_0_baseline/batch4_home.stderr.txt     |   5 +
 .../01_phase_0_baseline/batch4_home.stdout.txt     |  18 +++
 improve_s/01_phase_0_baseline/report.md            | 126 +++++++++++--------
 improve_s/logs/execution_log.md                    | 138 +++++++++++++++++++++
 4 files changed, 237 insertions(+), 50 deletions(-)
```

**Typecheck / Build / Tests:** not rerun — Batches 0–3 were explicitly not to
be rerun; their prior results remain valid.

**Measurements:** no valid Batch 4 route measurement completed. The first
homepage attempt returned a localhost HTTP 200 in 11038.552 ms with only 15,395
bytes, while the production server reported a Directus `schools` fetch failure.

**Outcome:** stopped

**Stop condition:** **S7** — Directus failed on the `schools` collection with
`fetch failed`. This is a new error outside the narrow D-013 exception, which
applies only to an `audition_requirements` 403 immediately followed by a
successful fallback on the same collection.

**Exact request-and-evidence command:**

```powershell
$listener=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1
if(-not $listener){
  'SERVER_READY=False'
  Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_home.stdout.txt'
  Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_home.stderr.txt'
  exit 1
}
$started=Get-Date
$format="%{http_code}`t%{time_total}`t%{size_download}"
$metric=& curl.exe -sS --max-time 120 -o NUL -w $format 'http://localhost:3000/'
$code=$LASTEXITCODE
Start-Sleep -Seconds 1
$ended=Get-Date
"ROUTE=/"
"APP_METRIC=$metric"
"START=$($started.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
"END=$($ended.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
'SERVER_OUTPUT:'
Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_home.stdout.txt'
'STDERR_BYTES='+(Get-Item -LiteralPath 'improve_s\01_phase_0_baseline\batch4_home.stderr.txt').Length
$pidToStop=[int]$listener.OwningProcess
Stop-Process -Id $pidToStop -Force
```

**Complete request command output:**

```text
ROUTE=/
APP_METRIC=200	11.038552	15395
START=2026-07-23 12:22:15 +08:00
END=2026-07-23 12:22:27 +08:00
SERVER_OUTPUT:
[P0_DIAG_READY]

> stage-front@0.1.0 start
> next start

[P0_DIAG_READY]
   ▲ Next.js 15.5.20
   - Local:        http://localhost:3000
   - Network:      http://192.168.5.170:3000

 ✓ Starting...
 ✓ Ready in 685ms
[P0_DIRECTUS_START] id=1 collection=schools method=GET
[P0_DIRECTUS_START] id=2 collection=program_offerings method=GET
[P0_DIRECTUS_START] id=3 collection=application_requirements method=GET
[P0_DIRECTUS_START] id=4 collection=audition_requirements method=GET
[P0_DIRECTUS_START] id=5 collection=source_records method=GET
[P0_DIRECTUS_START] id=6 collection=audition_requirements method=GET
STDERR_BYTES=329
```

**Complete server stderr:**

```text
Error: Directus request failed on /items/schools?limit=-1&fields=id,slug,school_name,city,country,official_website,review_status,intro_zh,school_detail_sections: fetch failed
    at f (D:\STAGE FRONT\.next\server\chunks\993.js:1:594)
    at async (D:\STAGE FRONT\.next\server\chunks\993.js:1:5326) {
  digest: '173315409'
}
```

**Current `git status --short` captured immediately after stopping the server
and before writing this stop record:**

```text
?? improve_s/01_phase_0_baseline/batch4_home.stderr.txt
?? improve_s/01_phase_0_baseline/batch4_home.stdout.txt
```

The local server was stopped and port 3000 was confirmed free. The volatile
`.codex-dev.*.log` hashes remain unchanged.

**Blocked or incomplete items:** Batch 4 four-route request/byte baseline;
Batch 5 RSC captures; Batch 6 manual checklist; formal Batch 7 completion.
Batches 5–7 were not executed.

**Commit SHA:** recorded by the Batch 4 stop-record commit

---

### [2026-07-23] Phase 0 · Batch 4 S7 stop — reviewed, correctly triggered, bounded retry authorized

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `01_phase_0_baseline/codex_execution.md` — Batch 4, S7,
  new "Retry protocol for raw connectivity failures" section
- **Approved by owner:** yes — decisions.md ref: **D-014**

**Files modified:** 3 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none
**Dependency changes:** none · **Configuration changes:** none
**Database changes:** none · **Directus permission changes:** none
**Application code changes:** none

**Typecheck / Build / Tests:** not re-run — this is a gate review, not execution

**Findings:**

1. **S7 was correctly triggered — and correctly so, unlike D-013.** No rule
   defect this time. `fetch failed` on `/items/schools` means no HTTP response
   was ever received on the load-bearing first collection in
   `loadDirectusData()` (`lib/data.ts:980`). There is no documented fallback for
   this, unlike the audition-fields case. `directusFetch()` (`lib/data.ts:152`)
   had already retried internally once (250 ms backoff) before surfacing the
   final error — Codex saw the failure after two internal attempts.
2. **Suspected transient network degradation, not a structural block** —
   supported but not confirmed:
   - Batch 3's diagnostic probe fetched `schools` successfully in 107 ms only
     ~16 minutes earlier over the same `DIRECTUS_URL`
     (`batch3_probe_server_20260723_1208.stdout.txt`)
   - 11.04 s to fail is a slow hang-then-timeout, not an instant refusal —
     consistent with a degraded link rather than a closed port/revoked token
   - `git status` was clean before and after; nothing in the repository or
     environment changed between the two attempts
   - The link (`http://47.86.26.168:8055`) is already documented elsewhere in
     this program (`optimization_scope.md`) as prone to dropping to ~0.2 MB/s
   - One data point only — requires verification by retry, not assumption
3. **Bounded retry authorized, capped at 2 total Batch 4 attempts** (the failed
   attempt already counts as #1). 60 s cool-down before retry. If attempt 2
   also fails with a raw connectivity error: stop again, do not attempt a
   third try, escalate as a suspected infrastructure issue rather than
   continuing to retry.
4. **If the retry succeeds:** the failed attempt's artifacts are kept as
   baseline evidence (link fragility data), not discarded, and Batch 4
   proceeds through Batch 7 under the existing plan.

**Documentation changes:**
- `codex_execution.md` — new "Retry protocol for raw connectivity failures
  (D-014)" subsection added after the stop conditions table, explicitly
  distinguished from the D-013 "Known Directus behaviour" exception (D-013 = do
  not stop on a documented pattern; this protocol = do stop, then a bounded
  verified resume procedure)
- **S7's wording unchanged** — no defect found this time
- `report.md` header updated: 🟡 reviewed, one bounded retry authorized

**Outcome:** completed. Batch 4 stop upheld as correct; a single, conditioned
retry is authorized — not an open-ended retry loop, and not a rule change.

**Explicitly NOT authorized:** any change to `directusFetch` retry/backoff/
timeout behavior; any Directus permission, token, or network configuration
change; any change to `loadDirectusData()` concurrency or fail-fast behavior;
a third Batch 4 attempt without a fresh owner decision.

**Next action:** Codex may retry Batch 4 once, per the protocol. On success,
continue through Batch 7. On a second raw-connectivity failure, stop and
escalate to the owner as a suspected infrastructure issue.

---

### [2026-07-23] Phase 0 · Batch 4 attempt 2 — retry failed; D-014 cap exhausted

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 4 and D-014 retry protocol
- **Approved by owner:** yes — decisions.md ref: **D-014**

**Retry protocol compliance:**
- Attempt 1 failed at 2026-07-23 12:22 +08:00.
- Attempt 2 began at 2026-07-23 14:58 +08:00.
- Cool-down exceeded the required 60 seconds by more than two hours.
- Exactly one retry was made.
- Attempt 1 artifacts were retained unchanged:
  - `batch4_home.stdout.txt` SHA-256
    `DA5B80035BFF85DC645C9ABBB035FC1D194984F0A6351394E9404B1A29D4A26E`
  - `batch4_home.stderr.txt` SHA-256
    `B5004CE685F93CF8DFA8F79B15F327DA338959777AE4E54328877AA499F7CE3D`
- No third attempt was made.

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:**
- `improve_s/01_phase_0_baseline/batch4_retry_home.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_retry_home.stderr.txt`

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none. The process-local diagnostics subscriber was
the same observation method approved for Batch 4 and did not edit any file.

**Database changes:** none

**Application code changes:** none

**git diff --stat for the Batch 4 retry stop record:**

```text
 .../batch4_retry_home.stderr.txt                   |   5 +
 .../batch4_retry_home.stdout.txt                   |  18 +++
 improve_s/01_phase_0_baseline/report.md            |  81 ++++++++----
 improve_s/logs/execution_log.md                    | 146 +++++++++++++++++++++
 4 files changed, 224 insertions(+), 26 deletions(-)
```

**Typecheck / Build / Tests:** not rerun — Batches 0–3 were explicitly not to
be rerun and remain valid.

**Measurements:** no valid Batch 4 route measurement completed. The retry
homepage request returned localhost HTTP 200 in 11006.122 ms with 15,395 bytes,
while the production server again reported raw Directus `schools` fetch
failure.

**Outcome:** stopped — suspected Directus host/link infrastructure issue

**Stop condition:** **S7** — the single D-014-authorized retry failed with the
same raw connectivity failure as attempt 1. No Directus HTTP completion was
observed for `schools`. The two-attempt cap is exhausted.

**Exact retry request-and-evidence command:**

```powershell
$listener=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1
if(-not $listener){
  'SERVER_READY=False'
  Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_retry_home.stdout.txt'
  Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_retry_home.stderr.txt'
  exit 1
}
$started=Get-Date
$format="%{http_code}`t%{time_total}`t%{size_download}"
$metric=& curl.exe -sS --max-time 120 -o NUL -w $format 'http://localhost:3000/'
$code=$LASTEXITCODE
Start-Sleep -Seconds 2
$ended=Get-Date
"ROUTE=/"
"APP_METRIC=$metric"
"START=$($started.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
"END=$($ended.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
'SERVER_OUTPUT:'
Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_retry_home.stdout.txt'
'STDERR:'
Get-Content -LiteralPath 'improve_s\01_phase_0_baseline\batch4_retry_home.stderr.txt'
$pidToStop=[int]$listener.OwningProcess
Stop-Process -Id $pidToStop -Force
```

**Complete retry command output:**

```text
ROUTE=/
APP_METRIC=200	11.006122	15395
START=2026-07-23 14:58:06 +08:00
END=2026-07-23 14:58:19 +08:00
SERVER_OUTPUT:
[P0_DIAG_READY]

> stage-front@0.1.0 start
> next start

[P0_DIAG_READY]
   ▲ Next.js 15.5.20
   - Local:        http://localhost:3000
   - Network:      http://192.168.5.170:3000

 ✓ Starting...
 ✓ Ready in 6.9s
[P0_DIRECTUS_START] id=1 collection=schools method=GET
[P0_DIRECTUS_START] id=2 collection=program_offerings method=GET
[P0_DIRECTUS_START] id=3 collection=application_requirements method=GET
[P0_DIRECTUS_START] id=4 collection=audition_requirements method=GET
[P0_DIRECTUS_START] id=5 collection=source_records method=GET
[P0_DIRECTUS_START] id=6 collection=audition_requirements method=GET
STDERR:
Error: Directus request failed on /items/schools?limit=-1&fields=id,slug,school_name,city,country,official_website,review_status,intro_zh,school_detail_sections: fetch failed
    at f (D:\STAGE FRONT\.next\server\chunks\993.js:1:594)
    at async (D:\STAGE FRONT\.next\server\chunks\993.js:1:5326) {
  digest: '173315409'
}
```

**Current `git status --short` captured immediately after stopping the retry
server and before writing this stop record:**

```text
?? improve_s/01_phase_0_baseline/batch4_retry_home.stderr.txt
?? improve_s/01_phase_0_baseline/batch4_retry_home.stdout.txt
```

The local server was stopped and port 3000 was confirmed free. The volatile
`.codex-dev.*.log` hashes remain unchanged.

**Blocked or incomplete items:** Batch 4 four-route request/byte baseline;
Batch 5 RSC captures; Batch 6 manual checklist; formal Batch 7 completion.
Batches 5–7 were not executed. A third Batch 4 attempt is prohibited by D-014
without a fresh owner decision after infrastructure review.

**Commit SHA:** recorded by the Batch 4 retry stop-record commit

---

### [2026-07-23] Phase 0 · Batch 4 — D-014 causal correction; one further attempt authorized

- **Actor:** Owner (causal disclosure) / Claude (assessment)
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `01_phase_0_baseline/codex_execution.md` — Batch 4 retry protocol
- **Approved by owner:** yes — decisions.md ref: **D-015**

**Files modified:** 3 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none (all 4 Batch 4 artifacts retained per instruction)
**Dependency changes:** none · **Configuration changes:** none
**Database changes:** none · **Directus permission changes:** none
**Application code changes:** none

**Disclosure:** both Batch 4 failures (initial attempt and the D-014-authorized
retry) occurred because the owner manually stopped the server environment
during those windows. Directus was unavailable by operator action, not ambient
network degradation. The environment has since been restored. `git status`
confirms no application code, Directus configuration, permission, or dependency
changed at any point.

**Assessment:**
1. **D-014's "suspected transient network degradation" hypothesis is
   retracted** — it was an unconfirmed inference, now superseded by the
   disclosed cause. S7 was still correctly triggered on both attempts;
   Codex's conduct was correct throughout.
2. **The two failures no longer count as link/network instability evidence.**
   They must not be cited to support the ~0.2 MB/s flaky-link hypothesis in
   `optimization_scope.md`. Reclassified to a narrower, still-valid value:
   `loadDirectusData()` has no graceful-degradation path when Directus is
   unreachable for any reason, and `directusFetch()`'s error is an
   undifferentiated `fetch failed` regardless of cause — both retained as
   observations, not action items.
3. **One further Batch 4 attempt authorized**, as a resumption under a
   disclosed and resolved cause — not a third attempt at D-014's unexplained
   two-attempt cap. That general cap is unchanged for future, genuinely
   unexplained S7 stops. If this new attempt also fails, it is new evidence
   requiring a fresh decision.

**Status changes:**
- `report.md` — ⛔ retry-cap-exhausted → 🟡 cause identified, one further
  attempt authorized. All prior stop/retry records retained as history; a new
  blockquote appended, nothing overwritten.
- All four Batch 4 artifacts retained unmodified, per instruction.

**Outcome:** completed. Continuation decision resolved.

**Explicitly NOT authorized:** any application code, Directus permission,
configuration, or dependency change; a second further retry without a fresh
decision if this next attempt also fails; redefinition of the general
two-attempt retry cap for future unexplained failures.

**Next action:** Codex retries Batch 4 once, per D-015. On success, continue
through Batch 7. On failure, stop under S7 and return to the owner as new,
unexplained evidence.

---

### [2026-07-23] Phase 0 · Batch 4 — completed under D-015

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 4
- **Approved by owner:** yes — decisions.md ref: **D-015**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:**
- `improve_s/01_phase_0_baseline/batch4_d015_home.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_home.stderr.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_search.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_search.stderr.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_school.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_school.stderr.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_program.stdout.txt`
- `improve_s/01_phase_0_baseline/batch4_d015_program.stderr.txt`

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none. Observation used a process-local Node
diagnostics subscriber and did not edit environment or configuration files.

**Database / Directus changes:** none

**Application code changes:** none

**git diff --stat for Batch 4:**

```text
 .../batch4_d015_home.stderr.txt                    |   0
 .../batch4_d015_home.stdout.txt                    |  24 ++++
 .../batch4_d015_program.stderr.txt                 |   0
 .../batch4_d015_program.stdout.txt                 |  26 +++++
 .../batch4_d015_school.stderr.txt                  |   0
 .../batch4_d015_school.stdout.txt                  |  26 +++++
 .../batch4_d015_search.stderr.txt                  |   0
 .../batch4_d015_search.stdout.txt                  |  24 ++++
 improve_s/01_phase_0_baseline/report.md            | 144 +++++++++++----------
 improve_s/logs/execution_log.md                    |  80 ++++++++++++
 10 files changed, 256 insertions(+), 68 deletions(-)
```

**Typecheck / Build / Tests:** not rerun — Batches 0–3 were explicitly not to
be rerun and remain valid.

**Measurements:**

| Route | App result | Directus attempts | Approx. Directus response bytes |
|---|---|---:|---:|
| `/` | HTTP 200; 4979.844 ms; 254,146 bytes | 6 | 27,322,807 |
| `/search` | HTTP 200; 4459.706 ms; 73,791 bytes | 6 | 27,322,807 |
| `/schools/yale_school_of_music` | HTTP 200; 4585.244 ms; 198,471 bytes | 7 | 27,323,892 |
| `/schools/yale_school_of_music/programs/1190` | HTTP 200; 3846.071 ms; 99,601 bytes | 7 | 27,325,319 |

Each route made the five initial bulk reads plus the expected
`audition_requirements` 403 → fallback 200. Each detail route made one
additional filtered `source_records` quote request. All final collection
responses were HTTP 200, and all four server stderr artifacts were empty.

The two earlier operator-outage attempts remain preserved unchanged and are
not included in the valid Batch 4 baseline.

**Outcome:** completed

**Stop condition:** none

**Blocked or incomplete items:** Batch 5 RSC captures; Batch 6 manual
checklist; formal Batch 7 completion.

**Commit SHA:** recorded by the Batch 4 completion commit

---

### [2026-07-23] Phase 0 · Batch 5 — anonymous RSC payload capture

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 5
- **Approved by owner:** yes — decisions.md refs: **D-012**, **D-015**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:**
- `improve_s/01_phase_0_baseline/batch5_server.stdout.txt`
- `improve_s/01_phase_0_baseline/batch5_server.stderr.txt`
- `improve_s/01_phase_0_baseline/payloads/home.rsc`
- `improve_s/01_phase_0_baseline/payloads/home.headers.txt`
- `improve_s/01_phase_0_baseline/payloads/search.rsc`
- `improve_s/01_phase_0_baseline/payloads/search.headers.txt`
- `improve_s/01_phase_0_baseline/payloads/school_yale.rsc`
- `improve_s/01_phase_0_baseline/payloads/school_yale.headers.txt`
- `improve_s/01_phase_0_baseline/payloads/program_1190.rsc`
- `improve_s/01_phase_0_baseline/payloads/program_1190.headers.txt`

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database / Directus changes:** none

**Application code changes:** none

**git diff --stat for Batch 5:**

```text
 .../01_phase_0_baseline/batch5_server.stderr.txt   |  0
 .../01_phase_0_baseline/batch5_server.stdout.txt   | 10 +++
 .../01_phase_0_baseline/payloads/home.headers.txt  |  9 +++
 improve_s/01_phase_0_baseline/payloads/home.rsc    | 73 +++++++++++++++++++
 .../payloads/program_1190.headers.txt              |  9 +++
 .../01_phase_0_baseline/payloads/program_1190.rsc  | 41 +++++++++++
 .../payloads/school_yale.headers.txt               |  9 +++
 .../01_phase_0_baseline/payloads/school_yale.rsc   | 64 +++++++++++++++++
 .../payloads/search.headers.txt                    |  9 +++
 improve_s/01_phase_0_baseline/payloads/search.rsc  | 78 ++++++++++++++++++++
 improve_s/01_phase_0_baseline/report.md            | 72 ++++++++++++++-----
 improve_s/logs/execution_log.md                    | 84 ++++++++++++++++++++++
 12 files changed, 441 insertions(+), 17 deletions(-)
```

**Capture method:** anonymous `curl` requests with `RSC: 1`; no cookies,
reviewer session, or Directus request. All four returned HTTP 200 and
`Content-Type: text/x-component`. Batch 5 server stderr was empty.

**Marker measurements:**

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | `internal_` | `admin_` | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 0 | 0 | 0 | 0 | 0 | 0 | 128,717 |
| `/search` | 0 | 0 | 0 | 0 | 0 | 0 | 36,791 |
| `/schools/yale_school_of_music` | 1 | 0 | 0 | 1 | 0 | 0 | 107,114 |
| `/schools/yale_school_of_music/programs/1190` | 1 | 1 | 0 | 1 | 0 | 0 | 49,640 |

The Flight capture method is valid and S10 is not triggered: both detail
routes contain internal review/confidence markers. Zero counts for
`evidence_metadata`, `internal_`, and `admin_` are recorded exactly as
observed.

**Typecheck / Build / Tests:** not rerun — no application code changed and the
approved Batch 5 verification is the payload capture itself.

**Outcome:** completed

**Stop condition:** none

**Blocked or incomplete items:** Batch 6 manual checklist and formal Batch 7
completion.

**Commit SHA:** recorded by the Batch 5 commit

---

### [2026-07-23] Phase 0 · Batch 6 — Path B manual QA mechanism

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 6 Path B
- **Approved by owner:** yes — decisions.md ref: **D-002**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database / Directus changes:** none

**Application code changes:** none

**git diff --stat for Batch 6:**

```text
 improve_s/01_phase_0_baseline/report.md | 34 ++++++++++++++++-----
 improve_s/logs/execution_log.md         | 53 +++++++++++++++++++++++++++++++++
 2 files changed, 79 insertions(+), 8 deletions(-)
```

**QA mechanism:** completed. The report now defines all ten approved manual
checks: homepage status/hero/cards; search status/filter; school
status/name/program count; program status/requirements/citations; login
status/form.

No smoke-suite file was created, nothing was installed, and the checklist
items remain unchecked until a human/manual QA pass executes them.

**Typecheck / Build / Tests:** not rerun — Batch 6 is documentation-only Path B
and no application code changed.

**Outcome:** completed

**Stop condition:** none

**Blocked or incomplete items:** formal Batch 7 completion.

**Commit SHA:** recorded by the Batch 6 commit

---

### [2026-07-23] Phase 0 · Batch 7 — data observation and execution completion

- **Actor:** Codex
- **Branch:** `perf/s0-baseline`
- **Plan reference:** `improve_s/01_phase_0_baseline/codex_execution.md` —
  Batch 7 and final report requirements
- **Approved by owner:** yes — decisions.md refs: **D-012**, **D-015**

**Files modified:**
- `improve_s/01_phase_0_baseline/report.md`
- `improve_s/logs/execution_log.md`

**Files added:** none

**Files deleted:** none

**Dependency changes:** none

**Configuration changes:** none

**Database / Directus changes:** none

**Application code changes:** none

**git diff --stat for Batch 7 before final commit:**

```text
 improve_s/01_phase_0_baseline/report.md | 48 +++++++++++---------
 improve_s/logs/execution_log.md         | 79 +++++++++++++++++++++++++++++++++
 2 files changed, 107 insertions(+), 20 deletions(-)
```

**Required data observation:** formally recorded and retained:
`docs/imports/stage-v4-nine-school-verification.json` reports
`current_application_rows: 0` for 8 of the 9 newly imported schools. Those rows
have no `is_current = true`; pages render through `selectCurrentCycle` fallback.
If `is_current` is populated later, resulting content changes must not be
attributed to optimization work.

No action was taken on the data.

**Phase 0 execution summary:**
- Batches 0–7 completed.
- Typecheck passed.
- All 10 existing tests passed.
- Production build passed; all six public/pilot routes are dynamic.
- Four-route cold/warm timing baseline captured.
- Directus request count and approximate response-byte baseline captured.
- Four anonymous raw RSC/Flight payloads captured.
- Path B ten-check manual QA mechanism documented.
- No application, Directus, dependency, or configuration change was made.

**Correction to the preceding Batch 6 entry:** its embedded stat was captured
before the final report text settled. The authoritative Batch 6 commit output
was:

```text
 improve_s/01_phase_0_baseline/report.md | 40 ++++++++++++++++++-------
 improve_s/logs/execution_log.md         | 53 +++++++++++++++++++++++++++++++++
 2 files changed, 82 insertions(+), 11 deletions(-)
```

The earlier pre-commit stat remains in place under the append-only policy.

**Typecheck / Build / Tests:** not rerun — no application code changed in
Batch 7; Batch 2 results remain authoritative.

**Outcome:** completed — Phase 0 execution package ready for Claude review and
owner gate decision

**Stop condition:** none active

**Blocked or incomplete items:** none within approved Batches 0–7. Owner
acceptance remains required before any later phase.

**Commit SHA:** recorded by the Batch 7 completion commit

---

### [2026-07-23] Phase 0 · EXIT GATE — PASS WITH CONDITIONS

- **Actor:** Claude (review) / Owner (verdict)
- **Branch:** `perf/s0-baseline`
- **Approved by owner:** yes — decisions.md ref: **D-016**

**Files modified:** 4 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none — re-verified at the gate

**Verdict:** **PASS WITH CONDITIONS.** All eight batches delivered and
evidenced. Spot-verified independently: RSC payload marker counts, retained
artifacts, and an empty `git diff --stat 86c1db9 HEAD -- app components lib data`.

**Confirmed baseline for Phase `04_`:**
- **27.32 MB transferred per page render**, every request, all four routes
- **6 Directus requests** (`/`, `/search`) / **7** (detail routes) per render
- Directus wall-clock ≈ **2.7–3.9 s** of a **3.8–5.0 s** render (~75–80%)
- All six public/pilot routes **dynamic (`ƒ`)**; zero caching
- Medians: `/` 3718 ms cold / 5237 ms warm · `/search` 3049 / 3358 ·
  school 3649 / 4054 · program 3707 / 3691 — **warm is not faster than cold**
- Internal markers in anonymous RSC: `review_record` 1 (school), 1 (program);
  `review_records` 1 (program); `confidence` 1 each on both detail routes;
  `evidence_metadata`, `internal_`, `admin_` **0 everywhere**

**Accepted limitation:** link byte-rate never obtained (D-013); superseded by
per-collection durations and measured per-render transfer volume. No re-run.

**New finding at the gate (C2):** `evidence_metadata` **is** consumed —
`lib/data.ts:755` extracts `topic_key`, used by `lib/school-detail.ts:293` for
citation grouping. Phase `04_` Batch 3 will hit its stop-and-report path.
Pure performance concern, not security (0 occurrences in all RSC payloads).

**Conditions:** C1 (D-006) · C2 (`evidence_metadata`) · C3 (D-010) block
Phase `04_` **starting**. C4 (D-001 Preview) blocks it **finishing**.

**Governance note:** three S7 stops across the phase, all correctly triggered;
Codex never fixed, never expanded scope, never touched application code. One
exposed a real defect in Claude's package wording (D-013), corrected. The stop
machinery worked as designed.

**Outcome:** completed. Phase 0 closed.

**Next action:** owner resolves C1, C2, C3, then authorizes
`04_phase_2_speed_architecture`.

---

### [2026-07-23] Phase 2 · Planning — execution plan written

- **Actor:** Claude
- **Branch:** `perf/s0-baseline` (planning only; `perf/s1-speed-track` not yet created)
- **Approved by owner:** planning was requested; **the plan itself is not yet approved**

**Files modified:** `improve_s/04_phase_2_speed_architecture/claude_plan.md`
**Files added:** none · **Files deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none

**Typecheck / Build / Tests:** not run — planning only

**New evidence derived at planning time** (from `batch4_d015_home.stdout.txt`,
already captured in Phase 0 but not previously broken out):

Per-collection transfer per render —
`source_records` 15,731,434 B (**57.6%**) · `audition_requirements` fallback
6,415,237 B (**23.5%**) · `application_requirements` 3,090,406 B (11.3%) ·
`program_offerings` 2,076,109 B (7.6%) · `schools` **9,206 B (0.03%)** ·
audition 403 415 B. Total 27,322,807 B.

**The homepage transfers 27.32 MB to render a page whose primary entity is
9.2 KB.**

**Principal planning judgement:** caching solves the 27.32 MB problem; query
narrowing does not. After the fetch-cache change the transfer is paid once per
revalidation window rather than once per request — a >99% reduction in Directus
load at any realistic traffic level, and removed entirely from user-perceived
latency. Query narrowing only improves the cache-miss path, is second-order, and
carries materially more regression risk. **Phase 2 therefore does caching only.**
Narrowing opportunities (up to 15.73 MB from `sources` on `/` and `/search`, up
to 6.42 MB from `audition_requirements`) are recorded as evidence-gated
follow-ups and explicitly excluded from this phase.

**Field allowlists were found already correct** — no `fields=*` anywhere, one
level of narrow relation expansion. The bulk is row volume, not field selection.
No allowlist work is proposed.

**C2 resolved in-plan:** keep `evidence_metadata`. It is consumed
(`lib/data.ts:755` → `topic_key` → `lib/school-detail.ts:293` citation
grouping), removal would visibly regroup citations (Global Constraint 1), and
Batch 5 measured 0 occurrences in every anonymous RSC payload — a performance
question, not a security one. The original Batch 3 ("remove the field") is
cancelled and replaced by a measure-only batch.

**C1 recommendation:** revalidation window **900 s**, set in `lib/data.ts:165`
as the single source of truth and mirrored in route exports.

**Anticipated complication recorded:** `force-dynamic` alters default
fetch-cache behaviour, so Batch 1 may show little improvement until Batch 2
removes it. Documented as diagnostic, explicitly **not** a stop condition, so
Codex does not halt or attempt a fix.

**Outcome:** completed. Plan ready for owner review.

**Blocked:** C1, C2, C3 must be resolved before Batch 1. C4 (Preview) blocks the
exit gate, not the start.

**Next action:** owner reviews the plan and resolves C1–C3. On approval, Claude
writes `04_phase_2_speed_architecture/codex_execution.md`.

---

### [2026-07-23] Phase 2 · Entry approved (D-017); Codex package issued

- **Actor:** Owner (approval) / Claude (package)
- **Branch:** `perf/s0-baseline` (planning); `perf/s1-speed-track` to be created in Batch 0
- **Approved by owner:** yes — decisions.md ref: **D-017**

**Files modified:** `04_phase_2_speed_architecture/codex_execution.md`,
`logs/decisions.md`, `logs/execution_log.md`, `README.md`
**Files added:** none · **Files deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none

**Typecheck / Build / Tests:** not run — packaging only

**Approved:** C1 = **900 s** · C2 = **keep `evidence_metadata`** (protected
field) · C3 = **benchmark-first rollout**. D-006 and D-010 closed as a result.

**Package structure:** Batches 0–3 authorised (pre-flight → fetch Data Cache →
benchmark route ISR → benchmark `generateStaticParams`), then a **hard stop at
GATE A** requiring recorded owner approval before Batches 4–6 expand to the
other three routes. GATE A implements C3 step 4.

**Documented deviation from C3:** Batch 1 cannot be route-scoped —
`directusFetch()` is the single fetch helper behind `loadDirectusData()`, which
every route calls; there is no per-route fetch layer. C3 is still honoured
because Batch 1 changes no route's rendering mode (all four keep
`force-dynamic`), the benchmark route is the first and only route to change
mode, and Batch 1 is verified by measuring all four routes for no regression.

**Two foreseeable false stops pre-empted in the package**, both recorded as
explicitly NOT stop conditions: Batch 1 showing little improvement until
`force-dynamic` is removed at Batch 2, and `/search` correctly remaining
dynamic because it reads `searchParams`.

**C2 enforcement:** only line 165 of `lib/data.ts` is writable for the whole
phase. `sourceRecordFields` (line 977, containing `evidence_metadata`),
`sourceTopicKey()` (line 755) and `inferredTopicKey()`
(`lib/school-detail.ts:293`) are named individually as forbidden. The original
"remove the field" batch is cancelled.

**Outcome:** completed. Phase 2 cleared for execution through GATE A.

**Blocked / carried forward:** C4 (D-001 Preview) still blocks the Phase `04_`
exit gate, not its start. D-005, D-007, D-008, D-009 remain open; none blocks
this phase.

**Next action:** Codex executes `04_phase_2_speed_architecture/codex_execution.md`
Batches 0–3, then stops at GATE A.

---

### [2026-07-23] Phase 2 · Batch 0 — pre-flight complete

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` —
  Batch 0
- **Approved by owner:** yes — D-017
- **Rollback SHA:** `742e901bf036daed924ea7732f7b33ec1f800107`
- **Commit:** `019a5ed` (`Phase 2 Batch 0: record rollback point`)

**Files modified:** `improve_s/04_phase_2_speed_architecture/report.md`;
`improve_s/logs/rollback_history.md`

**Files added / deleted:** none

**Dependency / configuration / database / Directus changes:** none

**Validation:**
- `npm run typecheck`: PASS
- `npm run build`: PASS in 26,372.993 ms; all four measured routes remained `ƒ`
- `npm test`: PASS, 10/10
- Path B QA: PASS, 10/10
- School and program RSC payloads: semantic diff PASS after normalizing only
  Next.js volatile build/hydration IDs; byte lengths matched Phase 0 exactly

**Outcome:** completed

**Stop condition:** none

---

### [2026-07-23] Phase 2 · Batch 1 — STOPPED: Data Cache item limit and unexpected Directus 503

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` —
  Batch 1
- **Approved by owner:** yes — D-017
- **Batch commit:** stop commit recorded in branch history; the one-line
  application diff is preserved for Claude/owner review

**Approved application diff applied:**

```diff
-        cache: "no-store",
+        next: { revalidate: 900 },
```

No other application line changed.

**Validation completed before measurement:**
- `npm run typecheck`: PASS
- `npm run build`: PASS in 16,865.633 ms; all four measured routes remained `ƒ`
- `npm test`: PASS, 10/10

**Stop conditions:**

1. **P2-S8** — two unexpected HTTP 503 responses from the fallback
   `audition_requirements` request. D-013 permits only the known initial 403
   followed by a successful fallback.
2. **Global unexpected architecture issue** — Next.js rejected all four large
   Directus bulk responses from Data Cache because each item exceeded its
   2 MB item limit. The approved one-line mechanism therefore cannot remove
   Directus from the request path.

**Exact timing command:**

```powershell
$routes=@('/','/search','/schools/yale_school_of_music','/schools/yale_school_of_music/programs/1190')
$sessionStart=Get-Date
$rows=@()
foreach($route in $routes){
  foreach($phase in @('cold','warm')){
    for($run=1;$run -le 5;$run++){
      $metric=& curl.exe -sS --max-time 120 -o NUL -w '%{http_code}`t%{time_total}`t%{size_download}' ('http://localhost:3000'+$route)
      $parts=$metric -split '`t'
      $rows += [pscustomobject]@{
        Route=$route; Phase=$phase; Run=$run; Http=$parts[0]
        Ms=[math]::Round(([double]$parts[1])*1000,3); Bytes=[int64]$parts[2]
      }
      if($LASTEXITCODE -ne 0 -or $parts[0] -ne '200'){
        $rows | Format-Table -AutoSize
        exit 1
      }
    }
  }
}
```

**Complete direct command result:**

```text
command timed out after 604044 milliseconds
```

The timing command buffered the table until completion, so no partial medians
are treated as valid evidence.

**Process-local observer summary for that incomplete session:**

```text
DIRECTUS_STARTS=198
DIRECTUS_ENDS=198
DIRECTUS_200=157
DIRECTUS_403=39
DIRECTUS_OTHER=2
CACHE_REJECTION_LINES=154

Collection                  Bytes Occurrences
application_requirements  4122101          39
audition_requirements     8555082          37
program_offerings         2769823          39
source_records           20976456          39
```

The two other Directus completions were:

```text
[P2_DIRECTUS_END] 503 /items/audition_requirements?...base-field-list...
[P2_DIRECTUS_END] 503 /items/audition_requirements?...base-field-list...
```

The corresponding application errors were:

```text
Error: Directus 503 on /items/audition_requirements?...base-field-list...
Error: Directus 503 on /items/audition_requirements?...base-field-list...
```

Representative cache rejection:

```text
Failed to set Next.js data cache for <Directus request>, items over 2MB can not be cached
```

**Measurement window:** server diagnostics created 2026-07-23 18:12:10 +08:00;
last server output 18:22:55 +08:00.

**Content diff / Path B QA after Batch 1:** not run. The stop was observed
during the required timing step; the stop protocol forbids continuing.

**Reviewer workflow:** not run. Batch 2 was not reached.

**Server cleanup:** production server stopped; port 3000 confirmed free; zero
remaining `curl` processes.

**Files modified at stop:**
- `lib/data.ts`
- `improve_s/04_phase_2_speed_architecture/report.md`
- `improve_s/logs/execution_log.md`

**Files added / deleted:** none

**Dependency / configuration / database / Directus changes:** none

**Current application diff at stop:**

```text
 lib/data.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

**Outcome:** stopped in Batch 1. GATE A was not reached. GATE A criteria are
not satisfied.

**Blocked / incomplete:** Batch 1 measurements and post-change QA; all of
Batches 2–3; ISR verification; all GATE A performance criteria. Batches 4–6
remain prohibited.

**Next action:** Claude/owner reviews the 2 MB Data Cache constraint and the
unexpected 503 evidence and issues a revised approved plan. Codex does not
improvise a cache redesign or retry the unexpected Directus error.

---

### [2026-07-23] Phase 2 · Batch 1 P2-S8 stop — reviewed; mechanism corrected (D-018)

- **Actor:** Claude (review) / Owner (review requested)
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/claude_plan.md`, `codex_execution.md`
- **Approved by owner:** review requested — decisions.md ref: **D-018**

**Files modified:** 3 documentation files under `improve_s/`
(`claude_plan.md`, `codex_execution.md`, `logs/decisions.md`) + this log
**Files added:** none · **Files deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none — Batch 1's `fdf5cc7` stands, no revert

**Typecheck / Build / Tests:** not run — documentation review only

**Finding:** Batch 1's fetch-cache change triggered 154 Next.js "items over 2MB
cannot be cached" rejections. Four of five Directus collections
(20.98 / 8.56 / 4.12 / 2.77 MB) exceed the fetch Data Cache's 2MB per-entry
limit; only `schools` (9.2 KB) fits. The one-line fetch-cache change therefore
cannot remove Directus from the request path.

**Assessment:** the Batch 1 *mechanism* is invalidated; the Phase 2 *thesis* is
not. The caching layer that matters is the **Full Route Cache** (static/ISR
route output, ~107 KB, no 2MB limit), not the fetch Data Cache. A static route
runs its fetches at build/revalidation and serves cached output; request-time
Directus fetches drop to zero regardless of the fetch-cache rejection. Batch 1's
`no-store` removal is kept as the *prerequisite* for static generation.

**Pivot:** partial and targeted. Three of four routes need no pivot — route
caching was always the plan, just wrongly sequenced behind the fetch cache. Only
`/search` (unavoidably dynamic) pivots to a **query boundary**: a new narrow
search-only loader that never requests `source_records`.

**503s:** the literal P2-S8 trigger (2× on the audition fallback during 39 rapid
full-DB renders) was a correct stop but is transient host stress, handled like
D-014 going forward. ISR replaces 39 renders with one background render per
window.

**Documents revised:** `claude_plan.md` (finding section + corrected mechanism
§1.2/§1.3/§2.1 + revised batches §5); `codex_execution.md` (status, §2 revised
mechanism, §3/§4 allowlist with additive-only Batch 5 `lib/data.ts` allowance,
§5 batches, §8 stop conditions). Revised batch order: 2 = benchmark ISR +
static params together → GATE A (with 0-Directus-fetch thesis check) → 3 program
→ 4 homepage → 5 `/search` query boundary → 6 final.

**Rejected:** custom `cacheHandler` to raise the 2MB limit — config change +
untested infra, treats the symptom.

**C2 unaffected:** `evidence_metadata` untouched; `/search` projection never
requests `source_records`.

**Outcome:** completed. Phase 2 re-issued for execution from Batch 2.

**Next action:** Codex executes revised Batch 2 (benchmark ISR + static params),
then stops at GATE A. GATE A now requires proof that a warm benchmark request
performs 0 Directus fetches — the D-018 thesis check.

---

### [2026-07-24] Phase 2 · Revised Batch 2 — benchmark SSG/ISR passed; P2-S8 stop during content verification

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` —
  revised Batch 2 under D-018
- **Approved by owner:** yes — user requested revised Batch 2 only
- **Starting HEAD:** `64af4f4991e86f2ebb7421ad4394857eef29b2ee`
- **Batch 1 prerequisite:** `fdf5cc7` retained; not rerun

**Files modified:**
- `app/schools/[schoolId]/page.tsx`
- `improve_s/04_phase_2_speed_architecture/report.md`
- `improve_s/logs/execution_log.md`

**Files added / deleted:** none

**Dependency / configuration / database / schema / Directus changes:** none

**Other route changes:** none

**Application diff:**

```text
 app/schools/[schoolId]/page.tsx | 16 ++++++++++++++--
 1 file changed, 14 insertions(+), 2 deletions(-)
```

The route removed `dynamic = "force-dynamic"`, added `revalidate = 900`, and
added `generateStaticParams()` using the existing `getAllSchools()` and
`{ schoolId: school.id }`. No new query was added.

**Typecheck:** PASS, exit 0, 8,966.583 ms

**Build:** PASS, exit 0, 104,839.844 ms. Build output marked
`/schools/[schoolId]` as `●` SSG with `15m` revalidation and reported three
paths plus `[+17 more paths]`. `.next/prerender-manifest.json` contains exactly
20 concrete school routes including `/schools/yale_school_of_music`. `/`,
`/search`, and the program route remained dynamic.

**Tests:** PASS, exit 0, 10/10 (2 Python validator + 8 Node importer),
3,126.975 ms.

**Benchmark measurements — local production build:**

| Phase | Runs (ms) | Median | Phase 0 median | Change |
|---|---|---:|---:|---:|
| Cold/first set | 34.580, 5.639, 4.430, 5.251, 4.533 | 5.251 ms | 3,648.994 ms | 99.856% lower |
| Warm | 4.235, 4.514, 4.265, 23.896, 4.874 | **4.514 ms** | 4,054.367 ms | **99.889% lower; 898.2× faster** |

All ten benchmark requests returned HTTP 200. Response headers included
`x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, and
`Cache-Control: s-maxage=900`.

**D-018 thesis check:** PASS. The process-local diagnostics subscriber recorded
zero Directus starts and zero completions during the five cold/first and five
warm benchmark requests. Phase 0 was 7 Directus requests and 27,322,807 bytes
per school-detail render; revised Batch 2 warm request-time values are 0
requests and 0 Directus bytes.

**Content / QA:**
- Yale prerendered RSC contains the same 39 page-content Flight records as the
  Phase 0 capture after normalizing only the static-generation protocol record
  and deterministic one-record ID shift. Only root/infrastructure records
  differ.
- Path B QA passed 10/10: homepage hero + 20 school links; search and country
  filter state; Yale name + 76-program count; program 1190 requirements +
  citations; hydrated login form.
- Reviewer login UI passed. Authenticated login plus edit/save was not run
  because no credentials were supplied and Directus modification is forbidden.

**Stop condition — P2-S8:** During the later required raw-RSC content
verification of the unchanged dynamic program route, the Directus observer
recorded one fallback `audition_requirements` HTTP 503. The post-benchmark QA
window totals were 31 starts/completions: 24 HTTP 200, 6 expected initial 403,
and 1 HTTP 503. The new program RSC diff is incomplete.

The 503 was found when buffered diagnostics were reviewed. A malformed local
router-state-header probe had already run before that review; it produced a
framework 500 and zero Directus requests. Once P2-S8 was identified, the
server was stopped, port 3000 was confirmed free, no retry was attempted, and
no Directus or other fix was made.

**Outcome:** stopped in revised Batch 2 after the benchmark-specific GATE A
thesis criteria passed but before the full gate checklist could be accepted.

**GATE A:** NOT PASSED. Blocking items are P2-S8 and the prohibited/unavailable
authenticated reviewer edit round-trip. Batch 3 and later batches were not
started and remain prohibited.

**Commit SHA:** recorded by this Batch 2 commit

---

### [2026-07-24] Phase 2 · GATE A — reviewed: thesis PROVEN; P2-S8 overturned; Batches 3–6 authorised

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` — GATE A
- **Approved by owner:** yes — decisions.md ref: **D-019**

**Files modified:** 3 documentation files under `improve_s/`
**Files added:** none · **Files deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none — Batch 2's `7fa0171` stands

**Typecheck / Build / Tests:** not re-run — gate review, not execution

**Verified independently at the gate:** the Batch 2 application diff is exactly
one file (`app/schools/[schoolId]/page.tsx`, +14/−2) — `force-dynamic` removed,
`revalidate = 900` added, `generateStaticParams` mapping `school.id`. No other
route, loader, or field list touched. `evidence_metadata` untouched (C2 held).

**Result — thesis PROVEN:**

| Metric | Phase 0 | Batch 2 warm |
|---|---:|---:|
| Warm median | 4,054.367 ms | **4.514 ms** (898.2× faster) |
| Directus requests | 7 | **0** |
| Directus bytes | 27,322,807 | **0** |
| Mode | `ƒ` | **`●` SSG 15m**, cache HIT |

D-018 confirmed exactly: >2MB fetch-cache rejections still occurred during
static generation and were irrelevant — the Full Route Cache serves warm users
without contacting Directus. Content 39/39 records identical; QA 10/10.

**P2-S8 stop OVERTURNED.** The 503 was on the unchanged, still-dynamic program
route during content verification — outside GATE A's scope, outside the
benchmark window (0 Directus calls), and untouched by Batch 2. Third such 503;
all three on routes still doing per-request full-DB pulls, none on a cached
route. Evidence for proceeding to Batch 3, not for halting. Codex applied the
rule correctly; the rule was over-broad and has been narrowed.

**Reviewer edit round-trip waived for GATE A**, required at the phase exit gate
(blocked by D-009). Reviewer auth is client-side; Batch 2 cannot plausibly have
affected it.

**Owner note surfaced:** cached school pages mean a reviewer's own edit appears
to vanish on reload until revalidation (≤15 min) — inside the accepted C1/D-006
trade-off, but sharper than its original "other viewers" framing.

**Outcome:** completed. **GATE A: PASS WITH CONDITIONS.**

**Next action:** Codex executes **Batch 3** (program detail route: ISR +
`generateStaticParams`, ~1,938 pages, with the empty-array/`dynamicParams`
fallback if the build is too slow), and retries the interrupted program-route
RSC semantic diff. Then Batches 4–6 without further gate approval.

---

### [2026-07-24] Phase 2 · Batch 3 — STOPPED after D-014 retry exhaustion

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Starting SHA:** `fa43c9c93302c91abe943979498cf315d875ba05`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` · Batch 3
- **Owner authorization:** D-019
- **Shell:** PowerShell
- **Execution window:** ended 2026-07-24 11:36 +08:00

**Application change attempted:** only
`app/schools/[schoolId]/programs/[programId]/page.tsx`:

- replaced `dynamic = "force-dynamic"` with `revalidate = 900`
- imported existing `getAllPrograms()`
- added `generateStaticParams()` mapping every program to
  `{ schoolId: program.school_id, programId: program.id }`

**File accounting before this log entry:** 1 application file modified,
11 insertions / 2 deletions. No added or deleted files. No dependency,
configuration, schema, database, or Directus changes.

**Verification:**

| Check | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| First `npm run build` | FAIL during prerender; 54,431.263 ms |
| D-014 wait | completed, 60 seconds |
| Single permitted build retry | FAIL during prerender; 74,966.990 ms |
| `npm test` | NOT RUN — stop condition had fired |
| Runtime/content/Directus warm comparison | NOT RUN — no valid production build |

The first build received Directus HTTP 503 from `program_offerings` while
prerendering `/schools/manhattan_school_of_music/programs/3`. After the required
60-second wait, the single permitted retry received the same HTTP 503 class
while prerendering `/schools/peabody_institute/programs/1789`.

The retry build announced `Generating static pages (0/1962)`. The input dataset
contains 1,938 program params, but the build did not complete, so there is no
successful Batch 3 route table or finalized set of generated program routes.
The >2 MB fetch Data Cache rejection messages were the expected D-018 condition
and were not treated as the stop.

**Stop condition:** P2-S8, with the D-014 bounded retry protocol exhausted.
No implementation fallback was applied because the approved fallback is for a
build exceeding 30 minutes; both failures were Directus non-200 responses on
the route modified by Batch 3.

**Outcome:** Batch 3 acceptance criteria NOT PASSED. No commit created. No
runtime measurement, content diff, QA checklist, or Batch 4+ work was performed.

---

### [2026-07-24] Phase 2 · Batch 3 P2-S8 stop — reviewed: stop upheld; approach revised (D-020)

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s1-speed-track`
- **Approved by owner:** yes — decisions.md ref: **D-020**

**Files modified:** 4 documentation files under `improve_s/`
**Files added / deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none by this review — the failed Batch 3 attempt
remains uncommitted in the working tree and will be *edited*, not reverted.

**Typecheck / Build / Tests:** not run — gate review

**Stop upheld — no rule defect.** 503s from `program_offerings` on the route
Batch 3 modified, D-014 cap exhausted. The D-019-narrowed P2-S8 covers exactly
this. Codex was correct and created no commit.

**Cause — data-loading at scale, not ISR:**

| | Pages | Build-time transfer | Result |
|---|---:|---:|---|
| Batch 2 schools | 20 | 546 MB | ✅ 104.8 s |
| Batch 3 programs | 1,938 | **≈53 GB** | ❌ 503 at `0/1962` in 54 s |

Each render pulls the full 27.32 MB database; the fetch Data Cache rejects every
>2 MB response (D-018), so **no cross-page deduplication occurs during a build**.
The 2 MB rejection was harmless at 20 pages and fatal at 1,938 — a gap in the
D-018 analysis, now corrected. ISR itself is proven and untouched (GATE A).

**Decision:** on-demand ISR for the program route — delete
`generateStaticParams`, keep `revalidate = 900`. Pre-authorized fallback, no new
scope, no new data path. Rejected: bulk static generation (53 GB, demonstrated
to collapse the host); partial top-N generation (no traffic data exists — Phase 0
recorded no analytics, so any N is arbitrary). Deferred: route-specific narrow
loader — correct long-term but a genuinely new data path, and already Batch 5's
pattern for `/search`; doing it here too would double the phase's risk.

**Limitations accepted and recorded:** first visitor per page per window still
pays ~4 s / 27.32 MB; a full crawl of 1,938 pages would still move ≈53 GB spread
over time; each trafficked page re-pulls 27.32 MB per window. Common remedy if
503s recur once live: the deferred narrow loader — never a Directus change.

**Verification required (Batch 1 lesson):** without `generateStaticParams` the
build marks the route `ƒ`; it must be *proven* the output is still
Full-Route-Cached — second request must show `x-nextjs-cache: HIT`, 0 Directus
requests, < 1000 ms. If not, stop and report; do not improvise.

**Outcome:** completed. Revised Batch 3 authorised.

**Next action:** Codex edits the working-tree program route (delete
`generateStaticParams`, drop `getAllPrograms` import, keep `revalidate = 900`),
builds, runs the two-request cache verification, completes the interrupted RSC
diff and Path B QA, then commits. Batches 4–6 follow under D-019.

---

### [2026-07-24] Phase 2 · revised Batch 3 — STOPPED: on-demand route output was not cached

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Starting SHA:** `3034b8f`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` · revised Batch 3
- **Owner authorization:** D-020
- **Shell:** PowerShell
- **Execution window:** ended 2026-07-24 11:53 +08:00

**Application change:** only
`app/schools/[schoolId]/programs/[programId]/page.tsx`:

- deleted the rejected `generateStaticParams()` function
- removed `getAllPrograms` from the import
- kept `export const revalidate = 900`

The resulting application diff versus `fa43c9c` is exactly one line:
`dynamic = "force-dynamic"` → `revalidate = 900`. The school route was not
modified. No Directus, loader, dependency, configuration, schema, database,
design, or content change was made.

**Static verification:**

| Check | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0, 89.4 s |
| `npm test` | PASS, exit 0, 10/10 (2 Python + 8 Node) |
| Program build mode | `ƒ`, no prerendered program paths, as revised plan expected |
| Static pages generated | 24/24; only the existing 20 school paths are parameterized |

**Decisive local-production verification:**

Route:
`/schools/yale_school_of_music/programs/1190`

| Request | HTTP | Time | `x-nextjs-cache` | `Cache-Control` | Directus starts |
|---|---:|---:|---|---|---:|
| First | 200 | 3,698.460 ms | absent | `private, no-cache, no-store, max-age=0, must-revalidate` | 6 |
| Second | 200 | 3,465.152 ms | **absent** | `private, no-cache, no-store, max-age=0, must-revalidate` | **5** |

Both responses were 99,601 bytes. The process-local diagnostics subscriber
recorded 11 Directus starts and 11 completions in total. The first request made
the four bulk collection requests, the expected `audition_requirements`
403→fallback request, and one source-quote request. The second again made the
four bulk requests plus the expected audition fallback. There were no
unexpected Directus statuses or errors.

**Stop condition:** D-020's explicit decisive condition. The second request did
not return `x-nextjs-cache: HIT`, did not perform zero Directus requests, and
did not complete under 1,000 ms. The generated response was therefore not
stored in the Full Route Cache.

**Outcome:** revised Batch 3 acceptance criteria NOT PASSED. The interrupted
program RSC semantic diff, Path B QA, four-route measurement, and commit were
not performed because the plan requires an immediate stop on this result.
`generateStaticParams` was not restored, no narrow loader was created, Batch 4
was not started, and no fix was improvised. The next option requires a new
owner decision.

---

### [2026-07-24] Phase 2 · Batch 3 verification — D-020 corrected by D-021

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s1-speed-track`
- **Approved by owner:** yes — decisions.md ref: **D-021**

**Files modified:** 4 documentation files under `improve_s/`
**Files added / deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes:** none by this review — the working-tree program
route (D-020 form: no `generateStaticParams`) will be edited by Codex next.

**Typecheck / Build / Tests:** not run — gate review

**Finding:** with `generateStaticParams` deleted, the program route built and
passed typecheck but rendered **fully dynamic** — 2nd request: no
`x-nextjs-cache`, 5 Directus requests, `Cache-Control: private, no-cache`.
Verified the route uses **no dynamic API**, so nothing forces it dynamic; the
cause is the **absent `generateStaticParams`**. In the App Router `revalidate`
alone does not cache a dynamic segment — on-demand ISR requires
`generateStaticParams` present + `dynamicParams: true`.

**D-020 error owned:** "delete the function → on-demand ISR" was wrong; that is
pure dynamic rendering. Second Next.js-semantics correction in the phase (D-018
= build-time dedup; D-021 = on-demand-cache trigger). Both caught by the
two-request proof gate — which is exactly why it exists.

**Decision (D-021):** add a **small** non-empty `generateStaticParams` +
`dynamicParams = true`, keep `revalidate = 900`. Build prerenders only the small
subset (no 53 GB — D-020's bulk finding stands); every other page generates
on-demand and Full-Route-Caches. Prove with the two-request test on a
non-prebuilt page. **If it still does not cache → Option C: revert to dynamic,
defer program-route optimization to the narrow loader, proceed to Batch 4.** No
third mechanism without a new decision.

**Rejected:** removing a "dynamic blocker" (none exists); bulk generateStaticParams
(D-020); data-loader rewrite (out of scope).

**Outcome:** completed. Re-revised Batch 3 authorised with a hard fallback.

**Next action:** Codex edits the program route (small `generateStaticParams` +
`dynamicParams = true`), builds, runs the two-request cache proof; commits if it
caches, else takes Option C and proceeds to Batch 4.

---

### [2026-07-24] Phase 2 · corrected Batch 3 — PASSED under D-021

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Starting SHA:** `6d3e381e1e6c26cc2e32b60da6bba1fd418860f0`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` · corrected Batch 3
- **Owner authorization:** D-021
- **Shell:** PowerShell
- **Execution window:** ended 2026-07-24 12:25 +08:00

**Application change:** only
`app/schools/[schoolId]/programs/[programId]/page.tsx`:

- replaced `dynamic = "force-dynamic"` with `revalidate = 900`
- added explicit `dynamicParams = true`
- re-imported the existing `getAllPrograms()`
- added `generateStaticParams()` returning only `programs.slice(0, 3)`

The build pre-rendered exactly three program pages (IDs 3, 4, and 5), not all
1,938. No narrow loader, Directus change, dependency, configuration, schema,
database, other-route, design, copy, or functional change was made.

**Static verification:**

| Check | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0, 106 s |
| `npm test` | PASS, exit 0, 10/10 |
| Program build mode | `●` SSG/ISR |
| Revalidation | `15m` / 900 seconds |
| Static pages | 27/27 total; 3 program pages |

The expected greater-than-2 MB fetch-cache rejection messages appeared during
generation. No Directus HTTP failure occurred during the build.

**Decisive local-production verification:**

Route:
`/schools/yale_school_of_music/programs/1190`
(confirmed absent from the three-page static subset).

| Request | HTTP | Time | `x-nextjs-cache` | Directus starts |
|---|---:|---:|---|---:|
| First | 200 | 7,208.520 ms | `MISS` | 6 |
| Second | 200 | **89.313 ms** | **`HIT`** | **0** |

The second response also returned `x-nextjs-prerender: 1` and
`Cache-Control: s-maxage=900`. The observer log remained at exactly 12 lines
across the second request, proving zero new Directus activity. Runtime and QA
totals were 26 starts/completions: 21 HTTP 200, 5 documented initial audition
HTTP 403 responses, zero unexpected statuses, and zero errors.

**Content and QA:**

- Program 1190 RSC semantic diff: PASS; 17/17 page-content Flight records
  byte-identical after deterministic static-render ID remapping.
- Path B: PASS, 10/10, including the hydrated reviewer login form.
- Local server stopped; port 3000 confirmed free.
- Temporary process-local observer artifacts removed.

**Outcome:** corrected Batch 3 acceptance criteria PASSED. The non-prebuilt
program page is on-demand ISR and its second request met all required targets:
cache HIT, zero Directus requests, and under 1,000 ms. No Batch 4 work started.

---

### [2026-07-24] Phase 2 · Batch 4 — STOPPED under P2-S3

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Starting SHA:** `0abc021ed38b7879535ea164582c74435d816af6`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` · Batch 4
- **Owner authorization:** D-019 and current owner instruction
- **Shell:** PowerShell
- **Execution window:** ended 2026-07-24 12:45 +08:00

**Application change:** only `app/page.tsx`:

```diff
-export const dynamic = "force-dynamic";
+export const revalidate = 900;
```

No `generateStaticParams` was added. No other application route, loader,
dependency, configuration, schema, database, Directus setting or record,
design, copy, or functionality was changed.

**Static validation:**

| Check | Result |
|---|---|
| `git diff --check` | PASS |
| `npm run typecheck` | PASS, exit 0, 1,824.240 ms |
| `npm run build` | PASS, exit 0, 96,227.668 ms |
| `npm test` | PASS, exit 0, 10/10 |
| Homepage build mode | `○` static, 15m / 900 s |
| Static pages | 28/28; one more than Batch 3 |

The expected D-018 greater-than-2 MB fetch-cache rejection warnings appeared
during generation. No unexpected Directus status or error occurred.

**Local-production cache and timing results:**

| Route | First-set median | Warm median | Warm cache / Directus |
|---|---:|---:|---|
| `/` | 7.229 ms | **4.593 ms** | 10/10 HIT; **0 Directus starts** |
| `/search` | **4,014.133 ms** | 3,074.536 ms | dynamic; 5 starts/request |
| school | 3.103 ms | 3.120 ms | HIT; **0 starts** |
| program 1190 | 2.581 ms | 2.549 ms | first request MISS; next 9 HIT; warm **0 starts** |

The homepage improved from the Phase 0 warm median of 5,237.129 ms to
4.593 ms (−99.912%, 1,140.2× faster) and passed the `<1000 ms`, HIT, and
zero-Directus targets.

**Stop condition:** `/search`, which Batch 4 did not modify, had a first-set
median of 4,014.133 ms against the Phase 0 cold median of 3,048.691 ms
(+31.667%). P2-S3 says to stop when any measured route becomes slower and does
not contain an unchanged-route exception. The warm search median improved by
8.449%, but that does not erase the first-set failure.

**Content and QA:**

- Homepage RSC semantic diff: PASS, 49/49 page-content records identical.
- Yale school RSC semantic diff: PASS, 39/39.
- Program 1190 RSC semantic diff: PASS, 17/17.
- Path B: PASS, 10/10, including hydrated country-filter state and login form.
- Reviewer authenticated edit/save: not executed; credentials unavailable and
  Directus modification explicitly forbidden. Existing D-019 exit-gate carry.

Observer totals across measurement and QA: 66 starts, 66 completions, 53 HTTP
200, 13 documented initial audition HTTP 403, zero unexpected status, zero
errors. Homepage measurement added zero observer activity.

**Outcome:** Batch 4 homepage implementation passed its direct criteria, but
Batch 4 acceptance is **STOPPED / NOT ACCEPTED under P2-S3**. No commit was
created. No Batch 5+ work was started. The server was stopped, port 3000 was
confirmed free, and all temporary observer artifacts were removed.

---

### [2026-07-24] Phase 2 · Batch 4 — homepage ACCEPTED; /search P2-S3 overturned (D-022)

- **Actor:** Claude (review) / Owner (decision)
- **Branch:** `perf/s1-speed-track`
- **Approved by owner:** yes — decisions.md ref: **D-022**

**Files modified by this review:** 4 documentation files under `improve_s/`
**Files added / deleted:** none
**Dependency / configuration / database / Directus changes:** none
**Application code changes by this review:** none — Batch 4's verified
`app/page.tsx` (one line: `force-dynamic` → `revalidate = 900`) is left
uncommitted for Codex to commit as its own Batch 4 commit.

**Typecheck / Build / Tests:** not run — gate review

**Homepage accepted:** warm 5,237 ms → **4.593 ms** (~1,140×), 10/10 cache HIT,
0 Directus requests. Verified: Batch 4 diff is one line in `app/page.tsx`;
`/search` has an empty diff (untouched); school (Batch 2) and program (Batch 3,
`0abc021`, `slice(0,3)` + `dynamicParams`) ISR verifications remain passing.

**P2-S3 stop overturned.** It fired on `/search`, which Batch 4 did not modify.
Two grounds: (a) no mechanism — Batch 4 changed only `app/page.tsx`; `/search`
shares only the untouched loader, so making the homepage static cannot slow it;
(b) by median `/search` improved (warm 3,074 ms vs Phase 0 3,358 ms). The
4,014 ms was a single first-set reading on a still-dynamic 27.32 MB route over a
variable link — variance, compared wrongly against a median. `/search`'s slowness
is exactly what Batch 5's query boundary targets.

**P2-S3 narrowed** (parallel to D-019's P2-S8): median-to-median only; a single
high-variance reading on a route the batch did not modify is recorded, not
stopped on; it still fires if a modified route's median regresses.

**Outcome:** completed. Batch 4 accepted; Batch 5 authorised.

**Next action:** Codex commits the verified homepage change as
`Phase 2 Batch 4: homepage ISR`, then executes Batch 5 — the `/search` query
boundary (additive narrow search loader in `lib/data.ts`; `/search` stays `ƒ`;
output must be byte-identical to `payloads/search.rsc`).

---

### [2026-07-24] Phase 2 · Batch 5 — `/search` query boundary executed

- **Actor:** Codex
- **Branch:** `perf/s1-speed-track`
- **Plan reference:** `04_phase_2_speed_architecture/codex_execution.md` · Batch 5
- **Authorization:** D-019 and D-022

**Batch 4 prerequisite:** committed separately as `ef52760`
(`Phase 2 Batch 4: homepage SSG/ISR`).

**Files modified:** `app/search/page.tsx`, `lib/data.ts`,
`improve_s/04_phase_2_speed_architecture/report.md`,
`improve_s/logs/execution_log.md`

**Files added / deleted:** none
**Dependency / configuration / database / schema / Directus changes:** none

**Implementation:** added the search-only `loadSearchPagePrograms()` function
without modifying any existing loader, mapper, accessor, or field list. The
route now reads three narrow projections (`program_offerings`,
`application_requirements`, `audition_requirements`) and never requests
`source_records`. `app/search/page.tsx` uses the new boundary, removes
`force-dynamic`, and exports `revalidate = 900`; the build correctly keeps the
route `ƒ` dynamic because it reads `searchParams`.

**Validation:**

- `git diff --check`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS, 78,339.145 ms, 29/29 pages; `/search` remains `ƒ`
- `npm test`: PASS, 10/10
- Path B: PASS, 10/10 with hydrated filter and login checks
- Phase 0 default search RSC comparison: PASS; 36,791 raw bytes on both sides,
  normalized SHA-256 identical
  (`f925c45810483f205fe96b851ce91c8914b29aeccc05d23e3b28b878a71f26fe`)

**Measurements:**

| Metric | Phase 0 | Batch 5 |
|---|---:|---:|
| Cold median | 3,048.691 ms | **1,002.507 ms** |
| Warm median | 3,358.273 ms | **120.266 ms** |
| Cold Directus requests | 6 | **3** |
| Warm Directus requests | 6 | **0** |
| Cold Directus bytes | 27,322,807 | **2,851,860** |
| Cold byte reduction | — | **24,470,947 / 89.562%** |

Every cold sample recorded exactly 3 starts and 3 HTTP 200 completions. The
five-request warm set added zero Directus activity.

**Recorded unchanged-route observation:** one already-known raw
`program_offerings` `fetch failed` occurred during cold on-demand QA of program
1190. The page subsequently rendered correctly. It did not occur on `/search`
or in the Batch 5 measurement window; under D-019 it is recorded and no
unrelated fix was attempted.

**Outcome:** Batch 5 technical criteria PASS. Reviewer authenticated edit/save
remains the D-019 exit-gate carry because credentials were not supplied and
Directus writes are forbidden. Batch 6 was not started. Server stopped; port
3000 confirmed free; temporary observer removed.

---
