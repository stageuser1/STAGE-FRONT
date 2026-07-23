# Phase 1 — Public Data Boundary · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Branch:** `perf/s2-data-boundary`
**Rollback SHA:** ____________

---

## 1. Completed work

_To be filled by Codex._

Prerequisite check: Phase `04_` report read? ☐
Items already resolved by Phase `04_`: ____________

---

## 2. Changed files

| Type | Files |
|---|---|
| Modified | |
| Added | |
| Deleted | |
| Dependency changes | _expected: none_ |
| Configuration changes | _expected: none_ |
| Database changes | _expected: none — public-role review is documentation only_ |

`git diff --stat`:

```
```

---

## 3. Field classification

| Field | Collection | Classification | Rationale |
|---|---|---|---|
| `review_record` | schools | reviewer-only | internal review state |
| `review_records` | program offerings | reviewer-only | internal review state |
| `evidence_metadata` | source_records | backend-only | internal extraction metadata |
| `confidence_level` | source_records | reviewer-only | AI confidence metadata |
| `source_url` | source_records | **public citation — KEEP** | applicant trust feature |
| `source_title` | source_records | **public citation — KEEP** | applicant trust feature |
| `source_quote` | source_records | _classify_ | check licensing |
| `review_status` | multiple | reviewer-only | |
| | | | |

_Extend as classification proceeds._

---

## 4. Public DTOs defined

```ts
// paste the actual DTO definitions here once written
```

---

## 5. Metrics before / after

### RSC payload — internal field occurrences

| Route | Field | Before (Phase `01_`) | After | 
|---|---|---|---|
| `/` | `review_record` | | |
| `/` | `evidence_metadata` | | |
| school detail | `review_record` | | |
| school detail | `evidence_metadata` | | |
| program detail | `review_records` | | |
| program detail | `evidence_metadata` | | |

**Target: all zero.**

### Payload size

| Route | Before | After | Δ |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

### Timings (must not regress vs. Phase `04_`)

| Route | Phase `04_` median | This phase median | Δ |
|---|---|---|---|
| `/` | | | |
| school detail | | | |
| program detail | | | |

---

## 6. Content preservation evidence

| Page | HTML diff result | Citations render? |
|---|---|---|
| school detail | | |
| program detail | | |

Anything intentionally removed from public view, and the approval reference:

| Removed | Reason | Approved in |
|---|---|---|
| | | |

---

## 7. Reviewer workflow verification

- Login: ☐ pass ☐ fail
- Editable cards visible: ☐ pass ☐ fail
- **Edit saves: ☐ pass ☐ fail**
- Anonymous users see no reviewer controls: ☐ pass ☐ fail

---

## 8. Directus public-role review

Findings: ____________

**Scope statement (required):** the public role governs browser→Directus
reviewer traffic. It does **not** enforce the public-site data boundary, because
server reads use `DIRECTUS_TOKEN`. The public-site boundary is the `fields=`
allowlist in `lib/data.ts`.

---

## 9. `/pilot/*` disposition

Decision: ☐ keep ☐ gate behind auth ☐ remove — execution deferred to Phase `05_`?
Recorded in `logs/decisions.md`: ☐

---

## 10. Remaining issues

_To be filled._
