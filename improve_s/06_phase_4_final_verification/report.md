# Phase 4 — Final Verification · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Environment:** production
**Verified commit SHA:** ____________

> This is the program closure report.

---

## 1. Completed work

| Batch | Description | Status |
|---|---|---|
| 1 | Production route verification | |
| 2 | Performance comparison | |
| 3 | Cache header / rendering-mode audit | |
| 4 | Content and security verification | |
| 5 | Reviewer round-trip | |
| 6 | Cache-freshness test | |
| 7 | Closure | |

---

## 2. Changed files

**Expected: none.** This is a verification phase.

`git diff --stat`:

```
```

---

## 3. Production route verification

| Route | Status | Renders fully | Cache headers | Mode matches intent? |
|---|---|---|---|---|
| `/` | | | | |
| `/search` | | | | |
| `/search?country=US` | | | | |
| school detail | | | | |
| program detail | | | | |
| `/login` | | | | |
| `/pilot/*` (if retained) | | | | |

---

## 4. Final performance comparison ★

**Baseline source:** `01_phase_0_baseline/report.md`
**Link throughput at measurement:** ____________

| Route | Baseline median | Production now (warm) | Reduction |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

### Directus requests at request time

| Route | Baseline | Now |
|---|---|---|
| `/` | 5 | |
| `/search` | 5 | |
| school detail | 6 | |
| program detail | 6 | |

### Route-level JavaScript

| Route | Baseline | Now | Δ |
|---|---|---|---|
| `/` | | | |
| school detail | | | |
| program detail | | | |

---

## 5. Content and security verification

| Page | HTML diff vs. baseline | Result |
|---|---|---|
| school detail | | |
| program detail | | |

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` |
|---|---|---|---|---|
| `/` | | | | |
| `/search` | | | | |
| school detail | | | | |
| program detail | | | | |

**All must be zero.**

- Directus over TLS: ☐ confirmed
- Mixed-content warnings: ☐ none
- Public citations render and resolve: ☐ confirmed

---

## 6. Reviewer round-trip (first live verification in project history)

- Test account available: ☐ yes ☐ no
- Login: ☐ pass ☐ fail
- Editable cards appear: ☐ pass ☐ fail
- **Edit saves and persists: ☐ pass ☐ fail**
- Token refresh: ☐ pass ☐ fail
- Logout: ☐ pass ☐ fail
- Test value restored: ☐

If not verified, record as an **open condition**: ____________

---

## 7. Cache-freshness test

| Step | Result |
|---|---|
| Original value | |
| Changed in Directus at | |
| Old value still served immediately? | ☐ yes (expected) |
| New value appeared at | |
| **Observed delay** | |
| Configured revalidation window | |
| Value restored | ☐ |

---

## 8. Program before / after summary

| Metric | Before (Phase `01_`) | After | Change |
|---|---|---|---|
| Homepage response | | | |
| School detail response | | | |
| Program detail response | | | |
| Directus requests per page view | 5–6 | | |
| Internal fields in public payloads | present | | |
| Credential transport | plaintext HTTP | | |
| Routes with `force-dynamic` | 6 | | |
| Unreferenced files | ~5 confirmed | | |
| Production dependencies | 3 | | |

---

## 9. Residual risk register

| Risk | Status | Owner | Note |
|---|---|---|---|
| Reviewer round-trip verification | | | |
| `localStorage` token storage | | | |
| China field performance (CDN PoP) | | | out of scope — hosting migration is a separate decision |
| ISR staleness for non-editing viewers | accepted | owner | window: ______ |
| No CI / automated regression gate | | | |

---

## 10. Deferred items

- **Phase 5 — on-demand cache invalidation** via Directus Flows. Not required at
  the scale current when the program started (20 schools, 1,938 programs).
  Estimated 2–4 working days if reopened. Reopen if the business requires faster
  editorial publishing than the ISR window provides, **or** if the dataset keeps
  growing and full-rebuild cost becomes painful — the dataset already grew ~6×
  in a single day (commit `00b341a`).
- **Hosting migration** (Vercel → Alibaba Cloud) — separate compliance and
  infrastructure decision, explicitly excluded from this program.
- _Other:_ ____________

---

## 11. Recommendations after closure

_To be filled._

---

## 12. Program status

☐ CLOSED ☐ CLOSED WITH CONDITIONS ☐ CONTINUING

Owner signature / date: ____________
