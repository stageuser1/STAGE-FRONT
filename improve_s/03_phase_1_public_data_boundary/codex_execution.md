# Phase 3 — Public Data Boundary · Codex Execution

**Status:** ✅ **Approved to execute** — owner authorization recorded in
`logs/decisions.md` D-023 (2026-07-24)

**Branch:** `perf/s2-data-boundary` (cut from `main` at `d3fdac5`)

**Prior gate context (do not repeat work):** Phase 2 (`04_phase_2_speed_architecture`)
is closed — school/program/homepage ISR and the `/search` query boundary all
PASS. `evidence_metadata` was reviewed and **kept** in that phase (D-017/C2) —
it is required for citation grouping and is not touched here. See
`phase3_readiness_review.md` for the full findings re-verification.

---

## Owner constraints for this entry (D-023) — read before Batch 0

This phase is **narrower** than the original phase-1 plan drafted before Phase 2.
Exactly four things are in scope:

1. Public DTO type definitions
2. Server-side mapping (Directus row → public DTO)
3. Removing internal review fields from the RSC/client payload boundary
4. Preserving visible content exactly

**Explicitly excluded — do not do these even if they seem like the natural next
step:**

- **No routing changes.** No route added, removed, or restructured. No file
  under `app/*/page.tsx` gets anything beyond a changed prop value passed to an
  existing child component.
- **No authentication changes.** `SchoolProfileCard` and `ProgramDetailSections`
  may load the review record client-side using the **existing**
  `useReviewerAuth` request path (the same one already used for PATCH at
  `components/reviewer/ReviewerEditableCard.tsx:142`). Do not add a new auth
  check, a new token flow, a new session mechanism, or modify
  `lib/directus-auth.tsx`. If achieving the DTO boundary seems to require a new
  auth primitive, **stop and report** — that is out of scope, not a batch to
  improvise.
- **No Directus permission changes.** Batch 5 (public-role review) is
  documentation only. No write to any Directus role, permission, or field
  configuration, under any circumstance.
- **`/pilot/*` stays untouched.** D-007 (keep / gate / remove) remains open,
  deferred to Phase `05_`. No file under `app/pilot/**` changes.

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| `data/types.ts` | Add public DTO types, additive only — existing internal types stay |
| `lib/data.ts` | DTO mapping / field lists for public consumption, additive only |
| `app/schools/[schoolId]/page.tsx` | Change the value passed as the `school` prop to `SchoolProfileCard` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Change the value passed as the `program` prop to `ProgramDetailSections` |
| `components/reviewer/SchoolProfileCard.tsx` | Accept the DTO; client-side review-record load via existing `useReviewerAuth` request path |
| `components/program/ProgramDetailSections.tsx` | Same treatment |
| `improve_s/03_.../report.md`, `improve_s/logs/*` | Write / append |

## Files Codex MUST NOT change

- Any other file under `app/`, `components/`, `lib/`, `data/`
- Anything under `app/pilot/**`
- `lib/directus-auth.tsx` or any other auth-mechanism file
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `.env*`
- Any Directus schema, record, or permission — review only, never write
- `components/SourceCitationBlock.tsx`, `components/school/SchoolVerificationCard.tsx`,
  `components/school/SchoolAdmissionsOverview.tsx` — public citation features,
  do not touch
- `sourceTopicKey()` (`lib/data.ts:755`), `inferredTopicKey()`
  (`lib/school-detail.ts:293`), and the `evidence_metadata` field itself —
  protected under D-017/C2, out of scope for this phase

---

## Batch 0 — Pre-flight

1. Confirm working tree clean on `main` at `d3fdac5` (or later, if the owner
   has since advanced it — reconfirm with `git log -1` before cutting).
2. Cut branch `perf/s2-data-boundary`.
3. Record the rollback SHA in `logs/rollback_history.md` under the `03_` row
   (currently blank).

**No code change in this batch.**

---

## Batch 1 — Public DTO types

Add public DTO types to `data/types.ts` alongside the existing internal types
(`School`, `Program`). These types must **omit** `review_record` /
`review_records` and any other reviewer-only or backend-only field identified
in the field classification (see `report.md` §3 for the working table —
`review_record`, `review_records`, `confidence_level`, `review_status` are
reviewer-only; `source_url`, `source_title` are public citations and must
appear in the DTO).

**No other file changes. No behavior change** — these types are unused until
Batch 2.

```bash
npm run typecheck
npm run build
```

**Verification:** build output identical to Phase 2's final state (same route
table, same rendering modes).

---

## Batch 2 — DTO mapping in `lib/data.ts`

Add mapping functions that take the existing Directus row shape and return the
Batch-1 public DTO. **Additive only** — the existing internal-type-returning
functions used by reviewer paths are untouched.

**Verification:**
- `npm run typecheck`, `npm run build`
- HTML content diff on one school page and one program page (pre- vs
  post-batch) — **must be identical**, since nothing consumes the new mapping
  yet

---

## Batch 3 — `SchoolProfileCard`

1. Change `app/schools/[schoolId]/page.tsx` to pass the Batch-2 public DTO
   instead of the full `School` object.
2. Change `components/reviewer/SchoolProfileCard.tsx` to accept the DTO type.
3. When `isReviewer` is true (existing client-side auth state from
   `useReviewerAuth`), load the review record via the **existing** request
   helper — the same call path already used for the PATCH at
   `components/reviewer/ReviewerEditableCard.tsx:142` — instead of reading it
   from a server prop.

**Verification:**
- Anonymous view: HTML content diff identical to pre-batch
- Reviewer view: editable cards still render; login flow unaffected (cannot
  fully verify the save round-trip without D-009 credentials — record this
  explicitly as "not verified, same open item as Phase 2," do not claim PASS)
- No new network call target other than the existing Directus reviewer-auth
  endpoint the app already calls

---

## Batch 4 — `ProgramDetailSections`

Same treatment as Batch 3, applied to
`app/schools/[schoolId]/programs/[programId]/page.tsx` and
`components/program/ProgramDetailSections.tsx`. This is an 887-line client
component — diff the rendered output field by field, not just a top-level pass/fail.

**Verification:** same as Batch 3.

---

## Batch 5 — Payload verification (the actual security check)

Capture the RSC payload for every public route (`/`, `/search`, one school
detail, one program detail) as an **anonymous** user. Grep for and report
counts of:

```
review_record   review_records   confidence   internal_   admin_
```

(`evidence_metadata` is expected to appear in server-side data structures per
D-017/C2 — the check here is specifically the **anonymous RSC payload**, where
it must independently still read 0, matching Phase 0's baseline measurement.)

Compare against the Phase 0 baseline capture. **Every count must be zero.**

Then, documentation only, no permission changes: review the Directus public
role's field access and record in `report.md`:
- what it controls (browser→Directus reviewer traffic only)
- what it does not control (the public site, served via `DIRECTUS_TOKEN`,
  bounded by the `fields=` allowlist in `lib/data.ts`)

Reporting the public role as the public-site control would be false assurance
— state the boundary accurately.

---

## Stop conditions

Halt and report — do not improvise a fix — if:
- Any visible content differs between pre- and post-batch HTML
- A public citation stops rendering
- Reviewer login or editable-card rendering breaks (note: the save round-trip
  was already unverified before this phase — that pre-existing gap is not a
  new stop condition, but any *new* breakage is)
- `npm run typecheck` or `npm run build` fails
- A change would require a file outside the §"Files Codex MAY change" list
- Achieving the DTO boundary appears to require a new auth mechanism, a
  routing change, or a Directus permission write
- An RSC payload still contains an internal field after Batch 5

---

## Required report fields

Modified / added / deleted files · `git diff --stat` (confirm confined to the
allowlist) · build + typecheck results · RSC payload before/after table ·
HTML content diff result for both pages, every batch · reviewer flow
verification (explicitly marking the save round-trip as unverified if D-009
credentials are still unavailable) · Directus public-role scope statement ·
remaining issues.

---

## Acceptance criteria

**Build**
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes; route table unchanged from Phase 2's final state
- [ ] `git diff --stat` confined to the allowlist above

**Content preservation**
- [ ] HTML content diff, one school page + one program page: no approved
      content lost, at every batch that touches rendering (3, 4)
- [ ] Public citations (`SourceCitationBlock`, `SchoolVerificationCard`,
      `SchoolAdmissionsOverview`) still render and link correctly
- [ ] Search and filtering still work
- [ ] No route renamed, added, or broken

**Reviewer workflows**
- [ ] Reviewer login works
- [ ] Reviewer sees editable cards
- [ ] Anonymous users see no reviewer controls
- [ ] Edit-saves-successfully: verified if D-009 credentials are available;
      otherwise explicitly reported as unverified, not silently skipped or
      assumed

**Security**
- [ ] Anonymous RSC payload count = 0 for `review_record`, `review_records`,
      `confidence`, `internal_`, `admin_` on every public route
- [ ] `evidence_metadata` still reads 0 in the anonymous RSC payload
      (unchanged from Phase 0/Phase 2 baseline — not newly introduced by this
      phase, just re-confirmed)
- [ ] Public DTOs explicit and typed; no full CMS record crosses to any Client
      Component
- [ ] Directus public-role review recorded with the accurate scope statement

**Performance**
- [ ] Route timings not worse than Phase 2's result (≥5 runs, medians)
- [ ] Payload size reduced or unchanged

**Scope discipline (new for this phase, per D-023)**
- [ ] No routing change anywhere in the diff
- [ ] No authentication-mechanism change anywhere in the diff
- [ ] No Directus permission write anywhere in the diff
- [ ] No file under `app/pilot/**` in the diff

**Rollback triggers:** any approved public content disappears · any public
citation stops rendering · reviewer login or card rendering regresses · an
internal field remains in an anonymous payload after Batch 5 · any excluded
category (routing / auth / Directus permissions / `/pilot/*`) appears in the diff.
