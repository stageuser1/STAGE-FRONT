# Phase 3 — Cleanup · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Branch:** `perf/s4-cleanup`
**Rollback SHA:** ____________

---

## 1. Completed work

| Batch | Description | Status | Commit |
|---|---|---|---|
| 1 | Evidence gathering (no deletions) | | |
| 2 | Low-risk deletions | | |
| 3 | `/pilot/*` disposition | | |
| 4 | Reviewer code-splitting | | |
| 5 | Debug sweep | | |
| 6 | Assets and bundle | | |

---

## 2. Changed files

| Type | Files |
|---|---|
| Modified | |
| Added | |
| **Deleted** | |
| Dependency changes | _analyzer devDependency, if pre-authorized — must be removed_ |
| Configuration changes | _`next.config.ts` analyzer, if added — must be removed_ |
| Database changes | _expected: none_ |

`git diff --stat`:

```
```

---

## 3. Deletion evidence table

| File | Grep refs | Route convention? | Dyn. imported? | Deliberate? | Class | Deleted? | Approval ref |
|---|---|---|---|---|---|---|---|
| `data/schools.ts` | | no | | | Low | | |
| `data/programs.ts` | | no | | | Low | | |
| `components/SchoolCard.tsx` | | no | | | Low | | |
| `components/MissingDataNote.tsx` | | no | | | Low | | |
| `components/HomeProgramCard.tsx` | 0 | no | | **YES — memory: kept for reuse** | **Observe only** | **NO** | n/a |
| `lib/demo/school-detail.ts` | | no | | gated by env | Medium | | |
| `app/pilot/**` | | **yes — routes** | | | **High** | | |
| `lib/pilot-data.ts` | | no | | | High | | |
| `components/pilot/**` | | no | | | High | | |

---

## 4. `/pilot/*` disposition

Decision (from Phase `03_`): ☐ keep ☐ gate behind auth ☐ remove
Executed: ☐ Commit: ____________

---

## 5. Reviewer code-splitting

| Component | Lines | Before: shipped to anonymous? | After? |
|---|---|---|---|
| `components/program/ProgramDetailSections.tsx` | 887 | yes | |
| `components/reviewer/ReviewerEditableCard.tsx` | 433 | yes | |
| `components/reviewer/SchoolProfileCard.tsx` | 96 | yes | |

Reviewer still receives the editor after login and can save: ☐ pass ☐ fail

---

## 6. Metrics before / after

### Route-level JavaScript

| Route | Phase `01_` baseline | After Phase `04_` | After this phase | Δ total |
|---|---|---|---|---|
| `/` | | | | |
| `/search` | | | | |
| school detail | | | | |
| program detail | | | | |

### Timings (must not regress)

| Route | Phase `04_` median | This phase median | Δ |
|---|---|---|---|
| `/` | | | |
| school detail | | | |
| program detail | | | |

### Bundle / dependencies

| Item | Before | After |
|---|---|---|
| Production dependencies | 3 (`next`, `react`, `react-dom`) | |
| Shared JS chunk | | |
| Total build output size | | |

> Expectation: **near-zero dependency yield.** There is no icon or utility
> library to trim; icons and markdown are hand-rolled. The real win here is
> maintenance surface.

---

## 7. Debug sweep

| Type | Count found | Removed | Left (with reason) |
|---|---|---|---|
| `console.log` | | | |
| `debugger` | | | |
| Obsolete TODO/FIXME | | | |

---

## 8. Assets and CDN findings

- Unused files in `public/`: ____________
- Image dimensions/formats: ____________
- `next/image` usage: ____________
- Font and CSS delivery: ____________
- Static asset cache headers: ____________
- CDN hit behavior: ____________
- Do public pages still contact Directus unnecessarily? ____________

---

## 9. Analyzer configuration

Added? ☐ Pre-authorized in `logs/decisions.md`? ☐
**Removed before merge? ☐** Verified in `next.config.ts`: ☐

---

## 10. Link-integrity crawl

Pages crawled: ______ Broken links: ______

---

## 11. Remaining issues

_To be filled._
