# Phase 4 — Final Verification · Acceptance Checklist

```text
PHASE: 4 — Final Production Verification   DATE: ____________
ENVIRONMENT: production                    LAST GOOD SHA: ____________
```

This gate closes the program. Require artifacts, not assertions.

---

## Build status

- [ ] `main` builds cleanly — `npm run typecheck` and `npm run build` pass
- [ ] Deployed commit SHA matches the verified `main` SHA
- [ ] `git diff --stat` confirms **zero application files changed in this phase**

## Tests

- [ ] Smoke suite passes against production (or manual checklist completed)
- [ ] Existing `npm test` passes

## Functional verification — production

| Route | Status | Renders fully | Rendering mode (headers) |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| `/search?country=US` | | | |
| school detail | | | |
| program detail | | | |
| `/login` | | | |
| `/pilot/*` (if retained) | | | |

- [ ] All routes return 200 and render completely
- [ ] **Cache headers match the intended rendering mode** (guards against
      production-only dynamic rendering)
- [ ] Search and filtering work
- [ ] Public citations render and links resolve
- [ ] Loading / empty / error / not-found states behave correctly
- [ ] Mobile verified (mobile-first product)
- [ ] Desktop verified
- [ ] No visual regression vs. Phase `01_`

## Security verification

- [ ] Anonymous RSC payloads: **zero** occurrences of `review_record`,
      `review_records`, `evidence_metadata`, `confidence`, `internal_`, `admin_`
- [ ] Every Directus reference resolves over `https://`
- [ ] No plaintext credential transmission
- [ ] No mixed-content warnings

## Reviewer verification

- [ ] Reviewer test account available
      — if **not**: close with PASS WITH CONDITIONS and log the open risk
- [ ] Login works
- [ ] Editable cards appear
- [ ] **Edit saves and persists in Directus**
- [ ] Token refresh works
- [ ] Logout works
- [ ] Test value restored

## Cache-freshness verification

- [ ] Directus change did **not** appear immediately (expected)
- [ ] Directus change **did** appear after one revalidation window
- [ ] Observed delay: ______ (configured window: ______)
- [ ] Test value restored

## Performance verification — final comparison

| Route | Phase `01_` baseline | Production now | Reduction |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

- [ ] ≥5 runs per route, medians, cold + warm separated
- [ ] Link throughput recorded
- [ ] Directus requests at request time = 0 on warm static routes
- [ ] No metric regressed vs. baseline

## Program closure

- [ ] Full before/after comparison complete
- [ ] Residual risk register complete
- [ ] Deferred items recorded (Phase 5, hosting migration, any conditions)
- [ ] `README.md` status table updated
- [ ] All phase reports complete
- [ ] All decisions logged in `logs/decisions.md`

---

## Rollback trigger

Any production-only failure not reproducible in Preview → roll back to the last
known-good `main`. The Phase `04_` lever (restore `force-dynamic` +
`cache: "no-store"`) reproduces pre-program behavior exactly.

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________

PROGRAM STATUS: ☐ CLOSED  ☐ CLOSED WITH CONDITIONS  ☐ CONTINUING
```
