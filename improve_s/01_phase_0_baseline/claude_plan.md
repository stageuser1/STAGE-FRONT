# Phase 0 — Baseline and Safety Net · Claude Plan

**Status:** ⬜ Not started — awaiting owner approval
**Branch:** `perf/s0-baseline`
**Recommended execution position:** 1st (before `04_phase_2_speed_architecture`)

---

## Objective

Produce a **valid, reproducible performance baseline** and a minimal regression
safety net, so that every later phase can be judged against evidence rather
than impression.

---

## Scope

### In scope
- Clean working tree; recorded baseline commit SHA
- Timing measurements: ≥5 runs per critical route, medians, cold + warm
- Rendering-mode and cache-mode record per route (from build output)
- Directus request-count record per route
- Minimal smoke suite (~10 assertions) — *pending owner decision, see below*
- Resolution of the three blocking preconditions
- `report.md` as the reference baseline for the whole program

### Explicitly NOT in scope
- **Route inventory and query audit** — already complete in
  `00_program_overview/optimization_scope.md`. Do not redo this work.
- Any code change to application behavior
- Bundle analyzer setup — deferred to Phase `05_` unless the owner
  pre-authorizes the dependency now
- PostgreSQL investigation — deferred pending evidence (see D-000c)

---

## Blocking preconditions (resolve in this phase or formally waive)

| # | Precondition | Resolution needed |
|---|---|---|
| 1 | **Preview environment** — no `vercel.json`, no `.vercel/`, no CI in repo | Confirm one exists (record URL), create one, or formally downgrade all gates to local production builds and rewrite the criteria |
| 2 | **Zero frontend tests** | Build the smoke suite here, or formally downgrade QA sign-off to a manual checklist |
| 3 | **Stale baseline** — brief claims 1–2s; logs show 2.6–33s | Discard the brief's figure. This phase produces the real one. |
| 4 | Dirty working tree — 6 untracked entries (`improve_s/`, `output/`, `tmp/`, 4 scripts); **no modified tracked files** as of `00b341a` | Commit or stash so a clean rollback point exists |
| 5 | Reviewer test account | Not blocking here; **mandatory before Phase `06_`** |

---

## Files involved

**No application files are modified in this phase.**

| Path | Action |
|---|---|
| `improve_s/01_phase_0_baseline/report.md` | Written |
| `improve_s/logs/*` | Updated |
| `tests/` or `e2e/` (new smoke suite) | Created **only if** owner approves option 1 above — requires a devDependency |

---

## Implementation strategy

1. **Clean the tree.** Commit or stash the 6 outstanding items. Record the
   baseline SHA in `logs/rollback_history.md`.
2. **Produce a local production build.** `npm run build` has never been run in
   this workspace (`.next/BUILD_ID` absent). Capture the build output table —
   it gives the current rendering mode for every route.
3. **Measure.** For `/`, `/search`, one real school page
   (`/schools/royal_college_of_music`), and one real program page: 5 runs each,
   cold and warm, on the local production build. Record medians **and link
   throughput** at the time of measurement.
4. **Count Directus requests per route.** Expected: 5 bulk reads on every
   route, plus 1 quote fetch on detail pages.
5. **Capture RSC payloads** for each public route as an anonymous user and
   store them — these become the Phase `03_` before-comparison.
6. **Smoke suite** (if approved): ~10 assertions — each public route returns
   200 and renders its key heading; a school page lists its programs; a program
   page shows requirement content; `/login` renders.
7. **Write `report.md`.**

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| No Preview environment exists → most gates unexecutable | High | High | Easy | Resolve or formally waive **in this phase**, before any code change |
| Link variance corrupts the baseline | High | High | Medium | ≥5 runs, medians, record throughput each time |
| Baseline is taken on a dirty tree → rollback is not reproducible | Medium | High | Easy | Clean tree first, no exceptions |
| Smoke suite needs a devDependency, colliding with the no-install rule | High | Low | Easy | Explicit written owner pre-authorization |
| Phase expands into re-doing the completed route audit | Medium | Medium | Easy | Scope section above is binding |

---

## Rollback plan

Read-only phase — nothing to roll back in application code. If the smoke suite
is added and causes friction, delete it; it is isolated from `app/`.

**The phase FAILS rather than proceeding** if no valid baseline can be produced.
Proceeding on the discredited "1–2s" figure is not an option.

---

## Acceptance criteria

- [ ] Clean working tree; baseline commit SHA recorded
- [ ] `npm run build` succeeds; build output table captured
- [ ] ≥5 runs per route, medians recorded, cold + warm separated
- [ ] Link throughput recorded alongside measurements
- [ ] Rendering mode + cache mode documented per route
- [ ] Directus request count documented per route
- [ ] RSC payloads captured for all public routes
- [ ] Preview environment question resolved or formally waived
- [ ] QA mechanism decided (smoke suite or manual checklist)
- [ ] **No application behavior changed**
- [ ] `report.md` complete

---

## Claude review verdict

_To be completed at the gate._
