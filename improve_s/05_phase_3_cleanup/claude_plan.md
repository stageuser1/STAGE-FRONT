# Phase 3 — Cleanup · Claude Plan

**Status:** ⬜ Not started
**Branch:** `perf/s4-cleanup`
**Recommended execution position:** 4th — after `03_phase_1_public_data_boundary`

---

## Objective

Remove obsolete implementation layers and reduce maintenance surface, without
deleting anything that is retained on purpose.

---

## ⚠️ Expectation setting

The original program's Phase 4B anticipated trimming icon libraries and large
utility packages. **Those do not exist here.**

- Production dependencies are exactly three: `next`, `react`, `react-dom`
- Icons are hand-rolled SVG (`components/ui/Icon.tsx`)
- Markdown is hand-rolled (`lib/markdown.tsx`) — no `react-markdown`

**Realistic dependency/bundle yield: near zero.** The genuine win in this phase
is *maintenance surface*, not bytes. Plan accordingly and do not manufacture
work to hit a bundle target.

---

## Confirmed cleanup candidates (verified by import-path grep)

| Candidate | Evidence | Risk |
|---|---|---|
| `data/schools.ts` (46 lines) | No `from "@/data/schools"` anywhere | Low |
| `data/programs.ts` (10 lines) | No `from "@/data/programs"` anywhere | Low |
| `components/SchoolCard.tsx` | Unreferenced; memory records it as removed from home | Low |
| `components/MissingDataNote.tsx` | Unreferenced | Low |
| `components/HomeProgramCard.tsx` | Unreferenced — **but project memory records it as deliberately "kept for reuse"** | **Observe only** |
| `lib/demo/school-detail.ts` | Dev-only fixtures, gated by `NODE_ENV` / `NEXT_PUBLIC_DEMO_SCHOOL_CONTENT` | Medium — owner decides |
| `/pilot/*` subtree (2 routes, `lib/pilot-data.ts`, 2 components, `data/pilot/`) | Publicly reachable, unlinked from navigation | **High — owner decides** |
| `pilot/reduced-data-model` branch (local + origin) | Stale | Low |
| `.codex-dev.*.log` files | Build noise in the repo root | Low |

`components/school/SchoolAdmissionsOverview.tsx`, `SchoolContentSections.tsx`,
`SchoolDegreeLegend.tsx` — project memory notes these were de-emphasized in the
2026-07-20 reduction but **are still rendered** by
`app/schools/[schoolId]/page.tsx`. **Do not delete. Verify before touching.**

---

## Risk classification (required before any deletion)

| Class | Rule |
|---|---|
| **Low risk** | Zero references by import path; no dynamic import; no route convention; not named in project memory as intentional |
| **Medium risk** | Referenced only by dev-only or gated code |
| **High risk** | Public surface, reviewer functionality, or anything project memory records as deliberate |
| **Observe only** | Unreferenced but intentionally retained — **document, do not delete** |

**High-risk items must not be deleted without explicit written TPM/owner approval.**

---

## Evidence rule

Static analysis output is **not** authority. `knip` and `ts-prune` produce false
positives against Next.js route conventions, dynamic imports, scripts, and
config files.

Every deletion requires:
1. Import-path grep showing zero references
2. Confirmation it is not a Next.js route convention file
3. Confirmation it is not dynamically imported
4. **Check against project memory / commit history for deliberate retention**
5. Build passes after deletion
6. Link-integrity check passes

`components/HomeProgramCard.tsx` is the canonical example of why step 4 exists.

---

## Scope

### In scope
- Deletion of confirmed low-risk unreferenced files
- `/pilot/*` disposition execution (per the Phase `03_` decision)
- Reviewer component code-splitting so anonymous visitors do not download the
  editor bundles (`ProgramDetailSections` 887 lines, `ReviewerEditableCard` 433 lines)
- `console.log` / `debugger` / obsolete TODO sweep
- `public/` unused asset review
- Before/after bundle measurement
- CDN and asset cache-header review

### Out of scope
- **Hosting migration** — separate compliance decision
- Abstraction cleanup for its own sake
- Micro-optimization of non-critical pages
- Any behavior change

---

## Bundle analyzer

Requires adding `@next/bundle-analyzer` and editing `next.config.ts`.
**Both need explicit written owner pre-authorization.** The temporary
configuration must be documented and removed before merge — an analyzer config
leaking into production builds is a real (if low-probability) risk.

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| **False-positive deletion** of an intentionally-kept file | Medium | Medium | Medium | The 6-step evidence rule; "observe only" class; owner approval per deletion |
| Deleting a component still rendered on a live route | Low | High | Easy | Import-path grep + build + link crawl per batch |
| `/pilot/*` removal breaks something unknown | Low | Medium | Easy | Separate batch, separate revert |
| Analyzer config reaching production | Low | Medium | Easy | Document; remove before merge; verify build output |
| Phase manufactures work to hit a bundle target that is not achievable | Medium | Low | Easy | Expectation set above: near-zero dependency yield |

---

## Rollback plan

Small batches, each a separate revert commit. Rollback SHA recorded before
Batch 1. Core routes tested after every batch.

---

## Acceptance criteria

- [ ] Every deletion has documented 6-step evidence
- [ ] High-risk and "observe only" items untouched unless separately approved
- [ ] `npm run typecheck` and `npm run build` pass after every batch
- [ ] Link-integrity crawl over all generated pages passes
- [ ] Route-level JS reduced or the lack of reduction justified in writing
- [ ] Asset and CDN findings documented
- [ ] Public and reviewer workflows still function
- [ ] Final bundle/timing comparison vs. Phase `01_` complete
- [ ] Analyzer configuration removed (if added)

---

## Claude review verdict

_To be completed at the gate._
