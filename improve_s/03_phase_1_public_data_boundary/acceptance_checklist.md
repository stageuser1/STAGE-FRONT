# Phase 1 — Public Data Boundary · Acceptance Checklist

```text
PHASE: 1 — Public Data Boundary        DATE: ____________
BRANCH: perf/s2-data-boundary          ROLLBACK SHA: ____________
```

---

## Build status

- [ ] `npm run typecheck` passes — output attached
- [ ] `npm run build` passes — output attached
- [ ] Build route table **unchanged** from Phase `04_` final state
      (this phase must not alter rendering modes)
- [ ] `git diff --stat` confined to the batch allowlist

## Tests

- [ ] Smoke suite passes (or manual checklist completed)
- [ ] Existing `npm test` passes

## Functional verification — content preservation

> This is the highest-risk area in the program. A missing field looks like a
> page that renders fine.

- [ ] HTML content diff, one school page: **no approved content lost**
- [ ] HTML content diff, one program page: **no approved content lost**
- [ ] Public source citations still render and link correctly
      (`SourceCitationBlock`, `SchoolVerificationCard`, `SchoolAdmissionsOverview`)
- [ ] Search and filtering still work
- [ ] Empty / loading / error states unchanged
- [ ] Mobile and desktop both verified
- [ ] No route renamed or broken

## Functional verification — reviewer workflows

- [ ] Reviewer login works
- [ ] Reviewer sees editable cards
- [ ] **A reviewer edit saves successfully**
- [ ] Review status badges display correctly for reviewers
- [ ] Anonymous users see no reviewer controls

## Security verification

- [ ] Anonymous RSC payload count = **0** for every public route:

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | `internal_` | `admin_` |
|---|---|---|---|---|---|---|
| `/` | | | | | | |
| `/search` | | | | | | |
| school detail | | | | | | |
| program detail | | | | | | |

- [ ] Public DTOs are explicit and typed
- [ ] No full CMS record crosses to any Client Component
- [ ] `NEXT_PUBLIC_*` variables reviewed — only the Directus URL and the demo flag
- [ ] Directus public-role reviewed, **with an accurate statement** that it does
      not enforce the public-site boundary while `DIRECTUS_TOKEN` is in use

## Performance verification

- [ ] Route timings **not worse** than the Phase `04_` result (≥5 runs, medians)
- [ ] Payload size reduced or unchanged
- [ ] Route-level JS not increased without written justification

---

## Rollback triggers

- Any approved public content disappears from a page
- Any public citation stops rendering
- Reviewer edit round-trip fails
- An internal field remains in an anonymous payload after Batch 5

---

```text
CLAUDE RECOMMENDED VERDICT: ______________________
OWNER VERDICT: PASS / PASS WITH CONDITIONS / FAIL / DEFER
CONDITIONS (if any): _______________________________
OWNER SIGNATURE / DATE: ____________________________
```
