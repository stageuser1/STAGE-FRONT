# Phase 4 — Final Verification · Claude Plan

**Status:** ⬜ Not started
**Branch:** none — verification against `main` and production
**Recommended execution position:** 5th — last

---

## Objective

Confirm in **production** that the program achieved what it claimed, that
nothing regressed, and that the system is durable — then close the program with
a documented before/after comparison.

---

## Scope

### In scope
- Production verification of every critical route
- Full before/after comparison vs. the Phase `01_` baseline
- **Reviewer edit round-trip verified live** — never done in this project's history
- Cold vs. warm cache behavior in production
- Cache-invalidation behavior over a full revalidation cycle
- Residual risk register
- Program closure report

### Out of scope
- Any new optimization
- Any deletion
- Hosting migration
- Phase 5 (on-demand cache invalidation) — deferred

---

## Mandatory precondition

**A reviewer test account.**

Project memory records that the reviewer edit round-trip has **never been
verified live** — no reviewer credentials have been available in the repo or
environment. The program cannot certify "reviewer workflows still function"
without one.

If unavailable: this phase closes with **PASS WITH CONDITIONS**, and the
unverified reviewer round-trip is recorded as an open residual risk.

---

## Verification matrix

| Area | Check |
|---|---|
| Routes | All 7 (or the post-`/pilot`-decision set) load in production |
| Rendering | Deployed cache headers confirm the intended mode per route — guards against production-only dynamic rendering |
| Performance | ≥5 runs per route, cold + warm, vs. Phase `01_` baseline |
| Content | HTML diff vs. baseline captures: no approved content lost |
| Citations | Public source citations render and link correctly |
| Security | Anonymous RSC payloads free of internal fields; Directus over TLS |
| Reviewer | Login, edit, save, refresh, logout |
| Cache freshness | Content updated in Directus appears after one revalidation window |
| Mobile | Mobile-first layout verified on a real device or emulation |
| Errors | Loading, empty, error, not-found states |

---

## Cache-freshness test (the one that cannot be skipped)

This is the test that proves the ISR trade-off is acceptable in practice:

1. Record the current public value of a field on one school page.
2. Change it in Directus (with owner permission, on a safe field).
3. Confirm the public page still shows the old value immediately (expected).
4. Wait one full revalidation window.
5. Confirm the public page shows the new value.
6. **Restore the original value.**

Record the actual observed delay. If it materially exceeds the configured
window, investigate before closing the program.

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| **Production-only failure** not reproducible in Preview | Medium | High | Hard | Verify cache headers and rendering mode from the deployed origin, not locally |
| No reviewer account → cannot certify reviewer flows | Medium | Medium | Easy | Obtain before this phase; else close with conditions |
| Cache serving stale content longer than configured | Low | High | Medium | Cache-freshness test above |
| Baseline comparison impossible because Phase `01_` data was thin | Low | High | Easy | Enforced at the Phase `01_` gate |
| Program declared complete without production evidence | Medium | High | Easy | This phase's whole purpose — require artifacts, not assertions |

---

## Rollback plan

If production verification fails, roll back to the last known-good `main`
commit. All phase rollback SHAs are in `logs/rollback_history.md`.

The Phase `04_` rollback remains the cleanest lever: restoring `force-dynamic`
and `cache: "no-store"` reproduces pre-program behavior exactly.

---

## Acceptance criteria

- [ ] All critical routes verified in production
- [ ] Deployed cache headers match the intended rendering mode per route
- [ ] Full before/after comparison complete vs. Phase `01_`
- [ ] No approved content lost anywhere
- [ ] Public citations functional
- [ ] Anonymous payloads free of internal fields
- [ ] Directus reachable only over TLS
- [ ] **Reviewer round-trip verified live** (or recorded as an open condition)
- [ ] Cache-freshness test passed and the observed delay recorded
- [ ] Mobile and desktop verified
- [ ] Residual risk register complete
- [ ] Program closure report written

---

## Claude review verdict

_To be completed at the gate._
