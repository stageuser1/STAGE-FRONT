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
