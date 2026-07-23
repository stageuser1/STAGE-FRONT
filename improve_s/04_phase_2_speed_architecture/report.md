# Phase 2 — Speed Architecture · Report

**Status:** 🟡 In progress — Batches 0–3 only; hard stop at GATE A
**Completed:** ____________
**Branch:** `perf/s1-speed-track`
**Rollback SHA:** `742e901bf036daed924ea7732f7b33ec1f800107`
**Shell:** PowerShell
**Environment:** local production build (`next build` + `next start`)

★ Milestone 1 — "Public pages load fast" — is judged from this report.

---

## 1. Completed work

_To be filled by Codex._

| Batch | Description | Status | Commit |
|---|---|---|---|
| 0 | Pre-flight, branch, rollback point | Complete (2026-07-23 18:10 +08:00) | pending |
| 1 | Directus fetch Data Cache, 900 s | Not started | |
| 2 | Yale school benchmark route ISR, 900 s | Not started | |
| 3 | Prerender all school pages | Not started | |
| 4–6 | Rollout and final measurement | **Not authorized before GATE A** | n/a |

### Batch 0 validation

- `npm run typecheck`: PASS (exit 0)
- `npm test`: PASS (10/10: 2 Python + 8 Node)
- `npm run build`: PASS (exit 0; 26,372.993 ms)
- Route table: all four measured public routes remained dynamic (`ƒ`)
- Path B QA: PASS, 10/10 checks
- School/program RSC comparison: semantically identical after normalizing only
  volatile Next.js build and hydration IDs; byte lengths exactly matched the
  Phase 0 captures (107,114 and 49,640 bytes)
- Reviewer login/edit round-trip: not required in Batch 0
- Directus, dependency, configuration, and database changes: none

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
