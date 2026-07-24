# Phase 3 (`03_phase_1_public_data_boundary`) — Readiness Review & Execution Plan

**Prepared by:** Claude · **Date:** 2026-07-24
**Status:** ⬜ Awaiting owner approval to open the entry gate
**Branch to cut:** `perf/s2-data-boundary` (from current `main` tip, `d3fdac5`)
**Scope discipline:** review only — no code executed, no scope expansion, Phase 2 not revisited except to confirm what it already closed.

---

## 0. Phase 2 closure recap (context only — not reopened)

Confirmed from `04_phase_2_speed_architecture/report.md` and `logs/decisions.md` D-017→D-022:

| Item | Status |
|---|---|
| School ISR | ✅ PASS (898× warm speedup, 0 Directus requests) |
| Program on-demand ISR | ✅ PASS (D-021, small `generateStaticParams` + `dynamicParams: true`) |
| Homepage ISR | ✅ PASS (D-022) |
| `/search` query boundary | ✅ PASS (Batch 5) |
| Reviewer edit/save round-trip | 🟡 **Not executed** — no reviewer credentials exist (D-009). Login UI verified PASS; PATCH round-trip unverified. |
| D-001 Preview environment | 🟡 **Still open** — carried to the Phase 2 exit gate, not resolved there either. |

**Both open items are formally non-blocking for Phase 3** per the owner's framing in this request, and independently per D-019/D-022 (they gate *Phase `06_` final verification*, not Phase 3 entry). Carried forward, not solved here.

I re-verified the underlying code directly rather than trusting the plan documents' line numbers, since two Phase 2 corrections (D-018, D-021) happened precisely because inference replaced measurement. Findings below are current as of `d3fdac5`.

---

## 1. Objective of Phase 3

Ensure internal/reviewer-only data never reaches anonymous public rendering or client-delivered payloads, while leaving every piece of approved public content — including source citations — exactly as it renders today.

This is a **data boundary** phase, not a performance phase (that was Phase 2) and not a dead-code phase (that's Phase `05_`). Its only success condition: anonymous visitors receive zero internal fields, and nothing a real user can currently see changes.

---

## 2. Current public data exposure findings (re-verified against `d3fdac5`)

| # | Finding | Location (current) | Verified how |
|---|---|---|---|
| 1 | `SchoolProfileCard` (`"use client"`) receives the **full `School` object**, including `school.review_record`, as a prop from the server component | [app/schools/[schoolId]/page.tsx:76](app/schools/[schoolId]/page.tsx:76) → [components/reviewer/SchoolProfileCard.tsx:19-26](components/reviewer/SchoolProfileCard.tsx:19) | Read both files directly; `review_record` is dereferenced at line 26 unconditionally, not behind an `isReviewer` check |
| 2 | `ProgramDetailSections` (large client component) receives the **full `Program` object**, including `review_records` | [app/schools/[schoolId]/programs/[programId]/page.tsx:52](app/schools/[schoolId]/programs/[programId]/page.tsx:52) | Grepped import + prop pass |
| 3 | `evidence_metadata` in the bulk source-record query | [lib/data.ts:977](lib/data.ts:977) | **Resolved as "keep" by Phase 2 D-017 (C2)** — it is a required field for citation grouping (`sourceTopicKey`, `lib/data.ts:755`; `inferredTopicKey`, `lib/school-detail.ts:293`). This is a security non-issue: Phase 0 Batch 5 measured it at 0 occurrences in every anonymous RSC payload. **No action in Phase 3** — see §5 forbidden changes. |
| 4 | Public-role review would give false assurance while `DIRECTUS_TOKEN` drives all server reads | [lib/data.ts:152-157](lib/data.ts:152) | Confirmed: `directusFetch()` attaches `Authorization: Bearer` from `DIRECTUS_TOKEN` unconditionally when set. The Directus public role governs *browser→Directus* traffic (reviewer auth path only), not server-side reads. |
| 5 | `/pilot/*` is a publicly reachable, unlinked surface | `app/pilot/school/[slug]/page.tsx`, `app/pilot/program/[program_offering_ref]/page.tsx` (+ `loading.tsx` siblings) | Confirmed both routes exist and are unauthenticated by default (no gate found in either file). Disposition is **D-007, still open** — not decided by this review; see §5. |

**Everything in the original `claude_plan.md` findings table still holds.** Line numbers shifted slightly from Phase 2 batches (e.g. `lib/data.ts` grew — a `/search` loader was added additively) but no finding was invalidated. `review_record`/`review_records` still flow through the RSC boundary exactly as documented.

---

## 3. Exact risks

| Risk | P | I | Detection difficulty | Why |
|---|---|---|---|---|
| **Silent content loss when allowlists tighten** | High | High | **Hard** — a missing field renders as a page that *looks* fine | This is the risk D-002 flagged explicitly as the weakest point in the whole program, because QA here is a manual checklist (Path B), not automated. A field silently dropped from a public DTO produces no error, no console warning, no failed build — just quietly incomplete content. |
| Accidental removal of a public citation | Medium | High | Medium | `SourceCitationBlock`, `SchoolVerificationCard`, `SchoolAdmissionsOverview` are explicitly public-facing trust features, not internal metadata, and are easy to conflate with the reviewer-only fields sitting next to them in the same record. |
| Reviewer editing breaks once props become DTOs | Medium | High | Easy (fails loudly) | `SchoolProfileCard`/`ProgramDetailSections` currently read review state from server props; moving to client-side fetch changes a working code path. Note: the reviewer round-trip is **already unverified** from Phase 2 (D-009 blocked) — Phase 3 cannot newly break what was never confirmed working, but it also can't claim success without a credentialed test. |
| Directus public-role review misrepresented as the site's security boundary | Medium | Medium | Easy, if checked | Documentation-only risk: the deliverable must state plainly that the public role does not enforce the public-site boundary while `DIRECTUS_TOKEN` is in use. Getting this wrong would create false assurance, which is explicitly what Phase 3 exists to avoid. |
| Scope creep into Phase 2 or Phase 5 territory | Low | Medium | Easy | `evidence_metadata` removal (Phase 2's domain, already closed as "keep") and dead-code deletion (Phase 5's domain) are both adjacent and must not be pulled into this phase. |
| `/pilot/*` disposition drifts from documentation-only into an actual code change | Low | Medium | Easy | D-007 is open. Phase 3 may *recommend* a disposition but execution is explicitly deferrable to Phase `05_` per the existing plan. |

---

## 4. Allowed changes

Unchanged from the existing, already-reviewed `codex_execution.md` allowlist — I am not widening it:

| Path | Permitted action |
|---|---|
| `data/types.ts` | Add public DTO types, alongside existing internal types (additive only) |
| `lib/data.ts` | DTO mapping / field lists for public consumption |
| `app/schools/[schoolId]/page.tsx` | Change what's passed to `SchoolProfileCard` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Change what's passed to `ProgramDetailSections` |
| `components/reviewer/SchoolProfileCard.tsx` | Accept a DTO; load review record client-side when `isReviewer`, via the existing `request` helper pattern already used at `components/reviewer/ReviewerEditableCard.tsx:142` |
| `components/program/ProgramDetailSections.tsx` | Same treatment |
| `improve_s/03_.../report.md`, `improve_s/logs/*` | Write / append (documentation) |
| Directus public role | **Review only — read, never write** |

---

## 5. Forbidden changes

- Any file under `app/`, `components/`, `lib/`, `data/` **not** listed in §4
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `.env*`
- Any Directus schema, record, or permission write
- `components/SourceCitationBlock.tsx`, `components/school/SchoolVerificationCard.tsx`, `components/school/SchoolAdmissionsOverview.tsx` — public citation features, do not touch
- **`evidence_metadata` removal or alteration** — closed by D-017/C2 as a required field; re-litigating this is a Phase-2 regression, not Phase 3 scope
- **`sourceTopicKey()` (`lib/data.ts:755`) and `inferredTopicKey()` (`lib/school-detail.ts:293`)** — unchanged, per the same D-017 protection
- Any rendering-mode or caching change (ISR windows, `generateStaticParams`, `revalidate` values) — Phase 2's domain, closed
- Dead-code deletion — Phase `05_`'s domain
- **`/pilot/*` code changes** — D-007 is open; this phase may record a disposition recommendation in `logs/decisions.md` but must not execute keep/gate/remove without a new decision entry
- Any dependency install or `package.json` edit (Path B / D-002 QA discipline carries forward)

---

## 6. Batch execution plan for Codex

Unchanged in structure from the existing `codex_execution.md` (already well-designed for this risk profile) — presented here as the sequence I'd authorize, with the Phase-2-closure context folded in:

| Batch | Scope | Key verification |
|---|---|---|
| **0** | Pre-flight: cut `perf/s2-data-boundary` from `d3fdac5`; record rollback SHA in `logs/rollback_history.md` (currently blank for this phase) | Rollback point recorded before Batch 1 |
| **1** | Define public DTO types in `data/types.ts`. No behavior change. | `npm run typecheck`, `npm run build` — output identical to Phase 2 final state |
| **2** | Map Directus rows to public DTOs in `lib/data.ts`. Keep internal types for reviewer paths. | typecheck, build, **HTML content diff** on one school page + one program page — must be identical |
| **3** | `SchoolProfileCard`: accept DTO; load review record client-side when `isReviewer` (existing `request` helper pattern) | Anonymous view identical; reviewer view still editable — **note: full save round-trip still blocked on D-009 credentials**, verify what's verifiable (login, editable-card rendering) and say so explicitly, don't claim more |
| **4** | `ProgramDetailSections` (887-line client component): same treatment, field-by-field diff given the size | Same as Batch 3 |
| **5** | Payload verification: capture anonymous RSC payload for every public route; grep for `review_record`, `review_records`, `evidence_metadata`, `confidence`, `internal_`, `admin_`; compare to Phase 0's baseline capture | **Every count must be zero** except `evidence_metadata`, which is expected present in the fetch layer but must independently confirm 0 occurrences in the *anonymous RSC payload itself* (as Phase 0 already measured) |
| **6** | Directus public-role review — documentation only, no permission writes | `report.md` states plainly what the public role does and does not control (see finding #4 above) |

**Not batched here, left to the owner:** whether to also resolve D-007 (`/pilot/*` disposition) inside this phase or explicitly defer it to Phase `05_` as the existing plan allows. My recommendation: **defer** — Phase 3's allowlist and risk profile is already tightly scoped around the DTO boundary; folding in a `/pilot/*` decision (which touches routing/auth, not data shaping) would blur that scope for no benefit, since D-007 doesn't block anything until Phase `05_`.

---

## 7. Acceptance criteria

Carried from the existing, already-sound `acceptance_checklist.md` — I'm not weakening or padding it:

**Build**
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes; route table **unchanged** from Phase 2's final state (this phase must not alter rendering modes)
- [ ] `git diff --stat` confined to the §4 allowlist

**Content preservation** (highest-risk area — see §3)
- [ ] HTML content diff, one school page + one program page: no approved content lost
- [ ] Public citations (`SourceCitationBlock`, `SchoolVerificationCard`, `SchoolAdmissionsOverview`) still render and link correctly
- [ ] Search and filtering still work
- [ ] No route renamed or broken

**Reviewer workflows**
- [ ] Reviewer login works
- [ ] Reviewer sees editable cards
- [ ] Anonymous users see no reviewer controls
- [ ] Edit-saves-successfully: verify if D-009 credentials are available by then; otherwise report explicitly as "not verified — same open item carried from Phase 2," not silently skipped

**Security** (the actual point of this phase)
- [ ] Anonymous RSC payload count = **0** for `review_record`, `review_records`, `confidence`, `internal_`, `admin_` on every public route (`/`, `/search`, school detail, program detail)
- [ ] Public DTOs explicit and typed; no full CMS record crosses to any Client Component
- [ ] Directus public-role review recorded with the accurate scope statement (does not enforce the public-site boundary while `DIRECTUS_TOKEN` is in use)

**Performance** (must not regress what Phase 2 achieved)
- [ ] Route timings not worse than Phase 2's result (≥5 runs, medians)
- [ ] Payload size reduced or unchanged

**Rollback triggers:** any approved public content disappears · any public citation stops rendering · reviewer edit-flow regresses from its current (already-limited) state · an internal field remains in an anonymous payload after Batch 5.

---

## 8. What I did not do

Per the request: no code was executed, no file under `app/`, `components/`, `lib/`, or `data/` was modified, and Phase 2 was read only to confirm what it already closed (its own decisions were not reopened). This document itself, plus recording the Batch 0 rollback SHA when the branch is cut, are the only writes this review makes.

---

## Recommendation

**Ready to open the Phase 3 entry gate**, with two carried-forward, non-blocking conditions already logged (reviewer edit/save verification, D-001 Preview) and one scope call flagged for the owner: defer `/pilot/*` disposition (D-007) to Phase `05_` as currently planned, rather than deciding it here.
