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
