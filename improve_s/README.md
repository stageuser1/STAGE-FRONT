# improve_s — STAGE FRONT Optimization Program Control Room

This folder is the **single source of truth** for the STAGE FRONT performance
optimization and architecture governance program.

It contains **documentation and control artifacts only**. No application code,
no configuration, no dependencies live here. Nothing in this folder is imported
by the Next.js app.

---

## Purpose

STAGE FRONT public routes take **3.0–5.2 seconds** to respond, and **transfer
27.32 MB from Directus on every single render** — with no warm-cache benefit
whatsoever. Measured 2026-07-23 on a local production build; this is the
accepted Phase 0 baseline (`01_phase_0_baseline/report.md`, gate D-016).

The cause is confirmed and documented in
`00_program_overview/optimization_scope.md`: all six public routes are
`force-dynamic`, and `loadDirectusData()` re-reads five entire collections
per request.

This program fixes that, then hardens the data boundary and cleans up the
codebase — in controlled phases, each one gated by explicit human approval.

`improve_s/` exists so that every phase has:

- a written plan before any code changes
- an explicit list of files Codex is allowed to touch
- an objective acceptance checklist
- a report with before/after measurements
- a recorded rollback point

If work is not written down here, it did not happen and it is not approved.

---

## Operating model

| Actor | Role | Authority |
|---|---|---|
| **Claude Code** | Planner and reviewer | Writes plans, reviews diffs, diagnoses failures, recommends gate verdicts. **Cannot approve a phase.** |
| **Codex** | Executor | Implements only what an approved plan specifies. Runs builds and tests. Reports results. **Cannot expand scope.** |
| **Human owner** | Stage Gate authority | Approves every phase entry, every merge, every deploy, every deletion. **The only actor who can say PASS.** |

**No phase proceeds without owner acceptance.** A Claude review verdict is a
recommendation, not an approval.

Human availability is approximately **3 hours per day**. The whole process is
designed around that constraint — see `00_program_overview/execution_rules.md`.

---

## Folder map

```
improve_s/
├── README.md                          ← you are here
├── 00_program_overview/               ← scope, rules, gate process (read first)
├── 01_phase_0_baseline/               ← measurement + safety net
├── 02_phase_0_5_security_transport/   ← TLS / credential transport (parallel track)
├── 03_phase_1_public_data_boundary/   ← DTOs, internal-field removal
├── 04_phase_2_speed_architecture/     ← caching, ISR, payload cut  ★ HIGHEST VALUE
├── 05_phase_3_cleanup/                ← dead code, assets, /pilot decision
├── 06_phase_4_final_verification/     ← production sign-off
├── skills/                            ← role definitions for AI execution
└── logs/                              ← execution log, decisions, rollback history
```

Every phase folder contains the same four documents:

| File | Written by | When |
|---|---|---|
| `claude_plan.md` | Claude | Before execution starts |
| `codex_execution.md` | Claude (executed by Codex) | Before execution starts |
| `acceptance_checklist.md` | Claude, verified by owner | At the gate |
| `report.md` | Codex, reviewed by Claude | After execution |

---

## ⚠️ Folder numbering is NOT execution order

The directory names follow the original program's phase numbering so the
documents stay traceable to the source brief. **The recommended execution
order is different**, because the V2 review re-prioritized speed ahead of
comprehensive governance at the owner's direction.

**Recommended execution order:**

```
01_phase_0_baseline
        ↓
04_phase_2_speed_architecture     ★ users feel the improvement here
        ↓
03_phase_1_public_data_boundary
        ↓
05_phase_3_cleanup
        ↓
06_phase_4_final_verification

02_phase_0_5_security_transport   ── runs in PARALLEL from day 1
                                     (infrastructure work, touches no repo files)
```

Rationale is recorded in `00_program_overview/optimization_scope.md`. If the
owner overrides this order, record the decision in `logs/decisions.md`.

---

## Current status

| Phase | Folder | Status |
|---|---|---|
| Program setup | — | ✅ Complete |
| Baseline commit `86c1db9` | — | ✅ Recorded (D-003) |
| Phase 0 — Baseline | `01_` | ✅ **COMPLETE — PASS WITH CONDITIONS (D-016)** |
| Phase 0.5 — Transport security | `02_` | ⬜ Not started (parallel) |
| Phase 1 — Data boundary | `03_` | ⬜ Not started |
| Phase 2 — Speed architecture | `04_` | 🟢 **GATE A PASSED (D-019)** — thesis proven: school route 4,054 ms → **4.5 ms**, 0 Directus requests. Batches 3–6 authorised |
| Phase 3 — Cleanup | `05_` | ⬜ Not started |
| Phase 4 — Final verification | `06_` | ⬜ Not started |

Update this table at every gate. `logs/execution_log.md` holds the detail.

---

## Hard rules

1. `improve_s/` is documentation and control only.
2. No optimization code changes until the owner approves that phase's plan.
3. Every code change happens on a dedicated phase branch, never on `main`.
4. Every phase has a recorded rollback commit before work begins.
5. Codex stops and reports on anything unplanned. It never improvises.
6. No phase is declared successful on subjective impression — metrics
   are compared against the Phase 0 baseline.

---

## Where to start

1. Read `00_program_overview/optimization_scope.md` — what is wrong and why.
2. Read `00_program_overview/execution_rules.md` — how work is performed.
3. Read `00_program_overview/stage_gate_process.md` — how phases are approved.
4. Read `01_phase_0_baseline/report.md` — **the accepted baseline** all later
   phases measure against.
5. Resolve conditions C1–C3 (D-016), then open
   `04_phase_2_speed_architecture/claude_plan.md`.
