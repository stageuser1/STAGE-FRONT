# Phase 1 — Public Data Boundary · Codex Execution

**Status:** ⬜ Not started — do not execute until the owner approves
`claude_plan.md` and Phase `04_` has been merged.

**Branch:** `perf/s2-data-boundary`

---

## Prerequisite

Read `04_phase_2_speed_architecture/report.md` first. The `evidence_metadata`
removal was pulled forward into that phase. **Do not repeat work already done.**

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| `data/types.ts` | Add public DTO types |
| `lib/data.ts` | DTO mapping, field lists |
| `app/schools/[schoolId]/page.tsx` | Change props passed to `SchoolProfileCard` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Change props passed to `ProgramDetailSections` |
| `components/reviewer/SchoolProfileCard.tsx` | Accept DTO; client-side review-record load |
| `components/program/ProgramDetailSections.tsx` | Same |
| `improve_s/03_.../report.md`, `improve_s/logs/*` | Write / append |

## Files Codex MUST NOT change

- Any other file under `app/`, `components/`, `lib/`, `data/`
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `.env*`
- Any Directus schema, record, or permission — **review only, never write**
- `components/SourceCitationBlock.tsx`, `components/school/SchoolVerificationCard.tsx`,
  `components/school/SchoolAdmissionsOverview.tsx` — **public citation features, do not touch**

---

## Batch 1 — Public DTO types

Add public DTO types to `data/types.ts` alongside the existing internal types.
**No other file changes. No behavior change.**

```bash
npm run typecheck
```

```bash
npm run build
```

**Verification:** build output identical to Phase `04_` final state.

---

## Batch 2 — DTO mapping in `lib/data.ts`

Map Directus rows to public DTOs for public consumption. Keep the internal
types available for reviewer paths.

**Verification:** typecheck, build, and an HTML content diff on one school page
and one program page — **must be identical**.

---

## Batch 3 — `SchoolProfileCard`

Change it to accept the public DTO. When `isReviewer` is true, load the review
record client-side using the existing `request` helper from `useReviewerAuth`
(the same path already used for PATCH at
`components/reviewer/ReviewerEditableCard.tsx:142`).

**Verification:** anonymous view identical; reviewer view still editable and saves.

---

## Batch 4 — `ProgramDetailSections`

Same treatment. This is the 887-line client component — proceed carefully and
diff the rendered output field by field.

**Verification:** anonymous view identical; reviewer view still editable and saves.

---

## Batch 5 — Payload verification

Capture the RSC payload for every public route as an **anonymous** user.
Grep for and report counts of:

```
review_record   review_records   evidence_metadata   confidence   internal_   admin_
```

Compare against the Phase `01_` baseline capture. **Every count must be zero.**

---

## Batch 6 — Directus public-role review (documentation only)

Review the public role's field access. **Make no permission changes.**

Record in `report.md`, explicitly:
- what the public role controls (browser→Directus reviewer traffic)
- what it does **not** control (the public site, which is served using
  `DIRECTUS_TOKEN` and bounded by the `fields=` allowlist in `lib/data.ts`)

Reporting the public role as the public-site control would be false assurance.

---

## Stop conditions

Halt and report if: any visible content differs; a public citation stops
rendering; reviewer edit fails; typecheck or build fails; a change would need a
file outside the allowlist; an RSC payload still contains an internal field
after Batch 5.

---

## Required report fields

Modified / added / deleted files · dependency changes · configuration changes ·
database changes · `git diff --stat` · build + typecheck results ·
RSC payload before/after table · HTML content diff result · reviewer flow
verification · remaining issues.
