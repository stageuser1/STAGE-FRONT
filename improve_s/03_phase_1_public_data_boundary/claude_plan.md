# Phase 1 — Public Data Boundary · Claude Plan

**Status:** ⬜ Not started
**Branch:** `perf/s2-data-boundary`
**Recommended execution position:** 3rd — **after** `04_phase_2_speed_architecture`

> **Re-prioritized.** The original program ran this before the speed work.
> The owner's stated top priority is response speed, and this phase does not
> block it. One item *has been pulled forward* into Phase `04_`: removing
> `evidence_metadata` from the bulk query, because it is both a payload cut and
> a performance win. Confirm what Phase `04_` actually did before starting here.

---

## Objective

Internal metadata never reaches public rendering or client-delivered payloads
unless explicitly approved. Approved public content is unchanged.

---

## Confirmed findings (verified — these are not hypotheses)

| # | Finding | Location |
|---|---|---|
| 1 | `School.review_record` passed to a `"use client"` component on a public page | `app/schools/[schoolId]/page.tsx:64` → `SchoolProfileCard` |
| 2 | `Program.review_records` passed to the 887-line `ProgramDetailSections` client component | `app/schools/[schoolId]/programs/[programId]/page.tsx` |
| 3 | `evidence_metadata` in the bulk source-record query | `lib/data.ts:977` — *may already be resolved by Phase `04_`* |
| 4 | Public-role review gives false assurance while `DIRECTUS_TOKEN` is in use | `lib/data.ts:153` |
| 5 | `/pilot/*` is a publicly reachable, unlinked surface rendering `PilotReviewerPanel` | `app/pilot/**` |

Type definitions: `data/types.ts:60` (`School.review_record`),
`data/types.ts:210` (`Program.review_records`).

---

## Scope

### In scope
- Field classification: public / public citation / reviewer-only / backend-only /
  restricted
- Public DTOs at the Server→Client boundary
- Removing internal fields from RSC payloads on public routes
- Directus public-role review, **with an accurate statement of what it controls**
- `/pilot/*` disposition decision (keep / gate / remove) — execution may defer
  to Phase `05_`

### Out of scope
- Rendering or caching changes (Phase `04_`)
- Transport security (Phase `02_`)
- Directus schema changes
- Dead-code deletion (Phase `05_`)

---

## Files involved

| Path | Expected change |
|---|---|
| `lib/data.ts` | DTO mapping; field lists; stop attaching `review_record`/`review_records` to public shapes |
| `data/types.ts` | Public DTO types alongside existing internal types |
| `app/schools/[schoolId]/page.tsx` | Pass a DTO, not the full `School`, to `SchoolProfileCard` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Pass a DTO, not the full `Program` |
| `components/reviewer/SchoolProfileCard.tsx` | Accept the DTO; fetch reviewer record client-side after auth |
| `components/program/ProgramDetailSections.tsx` | Same |

**Exact allowlist is fixed per batch in `codex_execution.md`.**

---

## Implementation strategy

Reviewer components currently receive review state as props from the server.
Since reviewer auth is **already entirely client-side**
(`lib/directus-auth.tsx`), those components can fetch their own review record
after authentication — the same path `ReviewerEditableCard` already uses to
PATCH (`components/reviewer/ReviewerEditableCard.tsx:142`).

1. **Batch 1** — Define public DTO types in `data/types.ts`. No behavior change.
2. **Batch 2** — Map to DTOs in `lib/data.ts`; keep internal types for reviewer paths.
3. **Batch 3** — `SchoolProfileCard`: accept DTO; load the review record client-side when `isReviewer`.
4. **Batch 4** — `ProgramDetailSections`: same treatment.
5. **Batch 5** — Verify: capture RSC payloads, diff against the Phase `01_` capture.
6. **Batch 6** — Directus public-role review (documentation only).

---

## Do not over-remove

**Public source citations are a product feature, not a leak.**
`SourceCitationBlock`, `SchoolVerificationCard`, and `SchoolAdmissionsOverview`
support applicant trust and must keep working.

| Category | Treatment |
|---|---|
| Public citation URLs | **Keep** |
| Internal scraping / extraction records | Remove |
| Reviewer-only evidence | Remove |
| Licensed / restricted source text | Restrict pending review |
| AI confidence + validation metadata | Remove |

---

## Risks

| Risk | P | I | Detect | Mitigation |
|---|---|---|---|---|
| **Content loss when allowlists tighten** | High | High | **Hard** | HTML content diff on one school + one program page for **every** batch |
| Accidental removal of public citations | Medium | High | Medium | Explicit keep-list above; QA verifies citations render |
| Reviewer editing breaks when props become DTOs | Medium | High | Easy | Verify reviewer flow after each batch; reviewer test account required |
| Directus permission change breaks reviewer reads | Medium | Medium | Easy | Documentation-only in this phase; no permission writes without separate approval |
| Phase `04_` already changed some of this | High | Low | Easy | Re-read `04_.../report.md` before planning batches |

---

## Rollback plan

Each batch is a separate revertable commit on `perf/s2-data-boundary`.
Rollback SHA recorded in `logs/rollback_history.md` before Batch 1.
No schema, dependency, or config changes are involved.

---

## Acceptance criteria

- [ ] Public DTOs explicit and typed
- [ ] `review_record` / `review_records` / `evidence_metadata` / confidence
      metadata **absent** from every anonymous RSC payload — proven by script
- [ ] Public pages display complete approved content (HTML diff clean)
- [ ] Public citations still render and link correctly
- [ ] Reviewer workflows still function (login, edit, save)
- [ ] Search and filters still function
- [ ] Directus public-role reviewed, with an accurate statement of scope
- [ ] `npm run typecheck` and `npm run build` pass
- [ ] No route or visual regression

---

## Claude review verdict

_To be completed at the gate._
