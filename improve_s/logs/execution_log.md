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
