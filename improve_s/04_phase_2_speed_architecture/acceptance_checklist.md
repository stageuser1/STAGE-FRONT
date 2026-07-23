# Phase 2 — Speed Architecture · Acceptance Checklist

```text
PHASE: 2 — Speed Architecture (MERGED Phase 2+3)   DATE: ____________
BRANCH: perf/s1-speed-track                        ROLLBACK SHA: ____________
```

★ This is the milestone where users feel the improvement. Judge it strictly.

---

## Build status

- [ ] `npm run typecheck` passes — output attached
- [ ] `npm run build` passes — output attached
- [ ] Build route table captured and compared to the Phase `01_` baseline
- [ ] Build duration recorded — acceptable? ☐
- [ ] Expected page count generated (~1,958: 20 schools + 1,938 programs)
      — or the schools-only fallback was applied and the reason recorded
- [ ] `git diff --stat` confined to the 5 allowed files
- [ ] **Zero dependency changes**
- [ ] **Zero configuration changes**
- [ ] **Zero schema changes**

## Rendering mode verification

> Do not assume ISR happened because a `revalidate` export was added.
> Read the build output.

| Route | Baseline mode | Now | Expected |
|---|---|---|---|
| `/` | dynamic | | static / ISR |
| `/search` | dynamic | | dynamic over cached data |
| `/schools/[schoolId]` | dynamic | | static / ISR |
| `/schools/[schoolId]/programs/[programId]` | dynamic | | static / ISR |

- [ ] All four match expectations
- [ ] Cache headers verified on the deployed/Preview build, not just locally
      (guards against production-only dynamic rendering)

## Tests

- [ ] Smoke suite passes (or manual checklist completed)
- [ ] Existing `npm test` passes

## Functional verification

- [ ] HTML content diff, one school page: **identical**
- [ ] HTML content diff, one program page: **identical**
- [ ] All 7 routes render without error
- [ ] Search and filtering work
- [ ] Public citations still render
- [ ] Mobile and desktop verified
- [ ] Reviewer login works
- [ ] **Reviewer edit still saves**
- [ ] `last_checked` / verification dates display correct values
      (guards against cache masking stale content)

## Performance verification ★

- [ ] ≥5 runs per route, medians reported, cold + warm separated
- [ ] Link throughput recorded alongside measurements

| Route | Baseline median | Now (warm) | Δ |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

- [ ] **Warm TTFB < 1s on all public routes**
- [ ] **Directus request count at request time = 0 on warm static routes**
- [ ] No metric materially regressed
- [ ] Route-level JS not increased without written justification

## Owner decision required at this gate

- [ ] **Owner explicitly accepts the ISR staleness trade-off:**
      a reviewer's edit is visible in their own session immediately (optimistic
      local state) but does not appear for other viewers until revalidation.
      Chosen window: ______ seconds. Recorded in `logs/decisions.md`: ☐

## QA advisory — do NOT flag these as regressions

- [ ] QA informed that "not found" may begin returning **HTTP 404** instead of
      the current 200 + `EmptyState` — this is a legitimate fix
- [ ] QA informed that delayed public visibility of reviewer edits is expected

---

## Rollback triggers

- Stale or incorrect content served to users
- Measurements worse than baseline
- Build output shows an unexpected rendering mode
- Reviewer editing breaks

**Rollback is clean:** restoring `force-dynamic` + `cache: "no-store"`
reproduces prior behavior exactly.

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
