# Phase 0 — Baseline · Acceptance Checklist

```text
PHASE: 0 — Baseline and Safety Net      DATE: ____________
BRANCH: perf/s0-baseline                ROLLBACK SHA: ____________
```

---

## Build status

- [ ] `npm run typecheck` passes — output attached
- [ ] `npm run build` passes — output attached
- [ ] Build route table captured verbatim into `report.md`
- [ ] Rendering mode recorded for all 7 routes

## Tests

- [ ] QA mechanism decided and recorded in `logs/decisions.md`:
      - [ ] Option 1 — smoke suite built (~10 assertions), passing
      - [ ] Option 2 — manual checklist documented, owner accepted the downgrade
- [ ] Existing `npm test` (Python validator + Node importer) still passes

## Functional verification

- [ ] Working tree clean; baseline commit SHA recorded in `logs/rollback_history.md`
- [ ] **No application file was modified** — `git diff --stat` confirms
- [ ] All 7 routes render without error on the local production build
- [ ] RSC payloads captured for every public route as an anonymous user
- [ ] Internal-field occurrence counts recorded (`review_record`,
      `review_records`, `evidence_metadata`, `confidence`, `internal_`, `admin_`)

## Performance verification

- [ ] ≥5 runs per route, per environment
- [ ] Medians reported — **no single-run figures anywhere**
- [ ] Cold and warm reported separately
- [ ] Link throughput recorded alongside each measurement
- [ ] Directus request count per route recorded
- [ ] Environment explicitly labelled (dev / local prod build / Preview / production)
- [ ] The brief's "1–2 second" figure formally discarded in `report.md`

## Blocking preconditions — ✅ RESOLVED AT ENTRY (D-012, 2026-07-23)

- [x] **Preview environment (D-001)**: ☑ **not required for Phase 0** — this
      phase measures a local production build. Verified batch by batch.
      **Still open for the Phase `04_` gate onward** — must be answered before
      Phase `04_` reaches its gate.
- [x] **QA mechanism (D-002)**: ☑ **Path B — manual checklist.** No dependency
      installed, no configuration edited. Batch 6 writes the ten checks into
      `report.md`.
- [x] **Stale baseline (D-004)**: ☑ the "1–2 second" figure is formally
      discarded — contradicted by observation Sets A, B and C.
- [x] **Working tree (D-003)**: ☑ clean; baseline `86c1db9` recorded in
      `logs/rollback_history.md`; branch `perf/s0-baseline` created.
- [ ] Reviewer test account: obtained ☐ / **deferred to before Phase `06_`** ☑
- [ ] Bundle analyzer devDependency: pre-authorized ☐ / **deferred to Phase `05_`** ☑

> Entry approval: **D-012**. Phase 0 execution is authorized.
> Deferred items above do not block this phase.

## Phase-specific gate

- [ ] The baseline is **reproducible** — a second measurement round lands within
      a defensible range of the first, or the variance itself is documented

---

## Rollback trigger

**No valid baseline can be produced** → verdict is FAIL. Do not proceed to
Phase `04_` on an unmeasured or discredited baseline.

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
