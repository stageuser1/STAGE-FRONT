# Phase 3 — Cleanup · Codex Execution

**Status:** ⬜ Not started — do not execute until the owner approves
`claude_plan.md` and Phase `03_` has merged.

**Branch:** `perf/s4-cleanup`

---

## Deletion is owner-approved per file

**Codex may not delete anything that is not on an owner-approved list.**
Approval is recorded in `logs/decisions.md` before the batch runs.

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| Owner-approved deletion list only | Delete |
| `components/program/ProgramDetailSections.tsx` | Code-split reviewer portion |
| `components/reviewer/ReviewerEditableCard.tsx` | Support dynamic import |
| `app/schools/[schoolId]/page.tsx`, `.../programs/[programId]/page.tsx` | Wire dynamic imports |
| `next.config.ts` | **Analyzer only, with written pre-authorization, removed before merge** |
| `improve_s/05_.../report.md`, `improve_s/logs/*` | Write / append |

## Files Codex MUST NOT change or delete

- `components/school/SchoolAdmissionsOverview.tsx`, `SchoolContentSections.tsx`,
  `SchoolDegreeLegend.tsx` — **still rendered** by the school page
- `components/SourceCitationBlock.tsx`, `components/school/SchoolVerificationCard.tsx`
  — public citation features
- `components/HomeProgramCard.tsx` — **observe only**, deliberately retained
- Anything not on the approved deletion list
- `package.json` — except the analyzer devDependency, if pre-authorized
- `.env*`, Directus schema/records/permissions

---

## Batch 1 — Evidence gathering (no deletions)

For each candidate, run and record:

```bash
git grep -n "from \"@/data/schools\""
```

Repeat per candidate module path. For each, record all six evidence steps:

1. Import-path grep result
2. Next.js route convention? (`page.tsx`, `layout.tsx`, `loading.tsx`,
   `error.tsx`, `not-found.tsx`, `route.ts`)
3. Dynamically imported anywhere?
4. **Named in project memory or commit history as deliberately retained?**
5. _(after deletion)_ build passes
6. _(after deletion)_ link crawl passes

Produce a classification table: Low / Medium / High / Observe-only.

**Deliver this to the owner. Delete nothing in this batch.**

---

## Batch 2 — Low-risk deletions (approved list only)

Expected candidates pending approval:
- `data/schools.ts`
- `data/programs.ts`
- `components/SchoolCard.tsx`
- `components/MissingDataNote.tsx`

```bash
npm run typecheck
```

```bash
npm run build
```

Then a link-integrity crawl over all generated pages.

**Stop on any unexplained error. Do not "fix" it — revert the batch and report.**

---

## Batch 3 — `/pilot/*` disposition

**Only if the owner approved removal or gating in Phase `03_`.**
Affects: `app/pilot/**`, `lib/pilot-data.ts`, `components/pilot/**`,
`data/pilot/**`. Separate batch, separate revert commit.

---

## Batch 4 — Reviewer code-splitting

Dynamically import reviewer components so anonymous visitors do not download
them. Measure route-level JS before and after.

**Verification:** anonymous page renders identically; **reviewer still gets the
editor after login and can still save an edit.**

---

## Batch 5 — Debug sweep

Find and report `console.log`, `debugger`, obsolete TODO/FIXME. Report first;
remove only what the owner approves.

---

## Batch 6 — Assets and bundle

Review `public/` for unused files, image dimensions/formats, `next/image` usage,
font and CSS delivery, static asset cache headers, CDN hit behavior.

Bundle analyzer **only with written pre-authorization**. If added: document the
temporary config in `report.md` and **remove it before merge**.

---

## Verification after EVERY batch

1. `npm run typecheck`
2. `npm run build`
3. Smoke suite (or manual checklist)
4. All 7 routes load
5. Link-integrity crawl

---

## Stop conditions

Halt and report if: any unexplained build error; any route disappears or 404s
unexpectedly; a link crawl finds a broken link; reviewer workflow breaks; a
deletion candidate turns out to be referenced; a change would touch a file
outside the allowlist.

---

## Required report fields

Deletion evidence table (all 6 steps per file) · modified / added / **deleted**
files · dependency changes · configuration changes (analyzer — added and
removed) · `git diff --stat` · build + typecheck results per batch · link crawl
results · bundle before/after · route-level JS before/after · remaining issues.
