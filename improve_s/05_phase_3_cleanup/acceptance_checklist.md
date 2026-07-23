# Phase 3 — Cleanup · Acceptance Checklist

```text
PHASE: 3 — Cleanup and Delivery        DATE: ____________
BRANCH: perf/s4-cleanup                ROLLBACK SHA: ____________
```

---

## Build status

- [ ] `npm run typecheck` passes after **every** batch
- [ ] `npm run build` passes after **every** batch
- [ ] Build route table unchanged from Phase `04_` (cleanup must not alter rendering)
- [ ] Analyzer configuration removed before merge (if it was added) — verified in `next.config.ts`
- [ ] `git diff --stat` matches the approved deletion list exactly

## Tests

- [ ] Smoke suite passes after every batch
- [ ] Existing `npm test` passes

## Deletion evidence — one row per deleted file

| File | 1. Grep | 2. Not route convention | 3. Not dyn. imported | 4. Not deliberate | 5. Build | 6. Link crawl | Owner approved |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

- [ ] **Every** deletion has all six evidence steps recorded
- [ ] **Every** deletion has written owner approval in `logs/decisions.md`
- [ ] High-risk items untouched unless separately approved
- [ ] `components/HomeProgramCard.tsx` **not deleted** (observe-only —
      deliberately retained per project memory)
- [ ] `SchoolAdmissionsOverview` / `SchoolContentSections` / `SchoolDegreeLegend`
      **not deleted** (still rendered by the school page)
- [ ] Public citation components untouched

## Functional verification

- [ ] All 7 routes load (or the documented post-`/pilot`-decision set)
- [ ] Link-integrity crawl over all generated pages — **zero broken links**
- [ ] Search and filtering work
- [ ] Public citations render
- [ ] Mobile and desktop verified
- [ ] Reviewer login works
- [ ] **Reviewer edit still saves** (critical after code-splitting)
- [ ] Anonymous users no longer download reviewer editor bundles

## Performance verification

- [ ] Route timings not worse than Phase `04_` (≥5 runs, medians)
- [ ] Route-level JS reduced, or the lack of reduction justified in writing

| Route | JS before | JS after | Δ |
|---|---|---|---|
| `/` | | | |
| school detail | | | |
| program detail | | | |

- [ ] Bundle comparison vs. Phase `01_` complete
      _(reminder: near-zero dependency yield is expected and acceptable —
      only 3 production dependencies exist)_
- [ ] Static asset cache headers documented
- [ ] CDN hit behavior documented

---

## Rollback triggers

- Any unexplained build error after a deletion batch
- Any missing route or broken link
- Reviewer workflow breaks after code-splitting
- A deleted file turns out to be referenced

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
