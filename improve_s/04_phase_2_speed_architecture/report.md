# Phase 2 — Speed Architecture · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Branch:** `perf/s1-speed-track`
**Rollback SHA:** ____________

★ Milestone 1 — "Public pages load fast" — is judged from this report.

---

## 1. Completed work

_To be filled by Codex._

| Batch | Description | Status | Commit |
|---|---|---|---|
| 1 | Data Cache — `lib/data.ts:165` | | |
| 2 | Rendering mode — remove `force-dynamic` ×4 | | |
| 3 | Payload cut — `evidence_metadata` | | |
| 4 | `generateStaticParams` ×2 | | |
| 5 | Full measurement | | |

---

## 2. Changed files

| Type | Files |
|---|---|
| Modified | |
| Added | |
| Deleted | |
| Dependency changes | **expected: none** |
| Configuration changes | **expected: none** |
| Database changes | **expected: none** |

`git diff --stat`:

```
```

---

## 3. Batch 1 result ★ (the one-line change)

Revalidation window chosen: ______ seconds

| Route | Baseline median (cold/warm) | After Batch 1 (cold/warm) | Δ |
|---|---|---|---|
| `/` | | | |
| school detail | | | |
| program detail | | | |

Owner reviewed these numbers before Batch 2 proceeded: ☐

---

## 4. Rendering mode — build output

| Route | Baseline | After | Expected | Match? |
|---|---|---|---|---|
| `/` | dynamic | | static / ISR | |
| `/search` | dynamic | | dynamic (cached data) | |
| `/schools/[schoolId]` | dynamic | | static / ISR | |
| `/schools/[schoolId]/programs/[programId]` | dynamic | | static / ISR | |
| `/login` | | | unchanged | |
| `/pilot/*` | dynamic | dynamic | **untouched this phase** | |

Build route table, verbatim:

```
```

---

## 5. `evidence_metadata` investigation (Batch 3)

Does any mapper read `evidence_metadata`? ☐ no ☐ yes — detail: ____________

Action taken: ☐ removed from `sourceRecordFields` ☐ stopped and re-planned

---

## 6. Static generation (Batch 4)

- Pages generated: ______ (expected ~1,958)
- Fallback to schools-only static params applied? ☐ — reason: ____________
- Build duration before: ______  after: ______
- Acceptable? ☐ yes ☐ no — fallback to schools-only static params? ☐

---

## 7. Metrics before / after ★

**Environment:** ☐ local production build ☐ Preview ☐ production
**Link throughput at measurement:** ____________

| Route | Baseline median | Final warm median | Reduction |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

### Directus requests at request time

| Route | Baseline | After | 
|---|---|---|
| `/` | 5 | |
| `/search` | 5 | |
| school detail | 6 | |
| program detail | 6 | |

**Target: 0 on warm static routes.**

### Payload size

| Route | Before | After | Δ |
|---|---|---|---|
| school detail | | | |
| program detail | | | |

---

## 8. Content preservation

| Page | HTML diff | Result |
|---|---|---|
| school detail | | |
| program detail | | |

Reviewer login: ☐ pass ☐ fail Reviewer edit saves: ☐ pass ☐ fail

---

## 9. Owner decision recorded

- ISR staleness trade-off accepted: ☐ — `logs/decisions.md` ref: ______
- Revalidation window: ______ seconds
- Editorial expectation communicated ("published edits appear within ___"): ☐

---

## 10. Remaining issues

_To be filled._

---

## 11. Handoff to Phase `03_`

Items this phase already resolved (so Phase `03_` does not repeat them):

- [ ] `evidence_metadata` removed from the bulk query
- [ ] _other:_ ____________
