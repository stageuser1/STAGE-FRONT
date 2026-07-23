# Phase 2 — Speed Architecture · Codex Execution

**Status:** ⬜ Not started — do not execute until the owner approves
`claude_plan.md` and Phase `01_` has produced a valid baseline.

**Branch:** `perf/s1-speed-track`

---

## Files Codex MAY change

| Path | Permitted action |
|---|---|
| `lib/data.ts` | **Only** lines 165 and 977, per the batch specs below |
| `app/page.tsx` | Remove `force-dynamic`; add `revalidate` |
| `app/search/page.tsx` | Remove `force-dynamic`; add `revalidate` |
| `app/schools/[schoolId]/page.tsx` | Remove `force-dynamic`; add `revalidate` + `generateStaticParams` |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | Same |
| `improve_s/04_.../report.md`, `improve_s/logs/*` | Write / append |

## Files Codex MUST NOT change

- Any `components/**` file
- `lib/pilot-data.ts` — `/pilot/*` stays out of this phase
- `lib/school-detail.ts`, `lib/format.ts`, `lib/markdown.tsx`, `lib/directus-auth.tsx`
- `data/types.ts` — DTOs are Phase `03_`
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `.env*`
- Any Directus schema, record, or permission
- `app/login/page.tsx`, `app/layout.tsx`, `app/error.tsx`, `app/loading.tsx`

**No dependency may be installed. No configuration may be edited.**

---

## Batch 1 — Data Cache ★ START HERE

In `lib/data.ts:165`, inside `directusFetch`, replace:

```ts
cache: "no-store",
```

with an explicit revalidation window:

```ts
next: { revalidate: 900 },
```

**Change nothing else. Not one other line.**

```bash
npm run typecheck
```

```bash
npm run build
```

Start the production server and measure `/`, one school page, and one program
page — **5 runs each, cold then warm**. Report medians against the Phase `01_`
baseline.

**Stop and report** if the build output or timings show anything unexpected.

> This single line should demonstrate most of the total win. Do not proceed to
> Batch 2 until the owner has seen these numbers.

---

## Batch 2 — Rendering mode

Remove `export const dynamic = "force-dynamic";` from:
- `app/page.tsx:10`
- `app/search/page.tsx:14`
- `app/schools/[schoolId]/page.tsx:18`
- `app/schools/[schoolId]/programs/[programId]/page.tsx:7`

Add an explicit `export const revalidate = 900;` to each.

```bash
npm run build
```

**Capture the build route table verbatim.** Verify:
- `/`, `/schools/[schoolId]`, `/schools/[schoolId]/programs/[programId]` →
  static or ISR
- `/search` → dynamic (it reads `searchParams`) but serving from cached data

**Stop if** any route's mode differs from the plan's expectation.

---

## Batch 3 — Payload cut

**First, investigate — do not edit yet.** Read `mapSource` and every consumer
of `SourceRecord` in `lib/data.ts`. Report exactly what, if anything, reads
`evidence_metadata`.

- **If nothing reads it:** remove `"evidence_metadata"` from `sourceRecordFields`
  (`lib/data.ts:977`).
- **If something reads it:** stop and report. Do not remove it. Claude will
  re-plan a per-detail-page fetch modelled on `attachSourceQuotes`
  (`lib/data.ts:815`).

**Verification:** typecheck, build, and an HTML content diff on one school page
and one program page — must be identical.

---

## Batch 4 — Static params

Add `generateStaticParams` to both detail routes. Source the slugs and ids from
the existing loader — **~1,958 pages** (20 schools + 1,938 programs).

```bash
npm run build
```

Record **build duration** and confirm the expected page count is generated.

**Stop if** build time becomes unacceptable — report it; the fallback is
schools-only static params.

---

## Batch 5 — Full measurement

All public routes, 5 runs each, cold and warm, vs. the Phase `01_` baseline.
Also record: Directus request count per route, build duration, build page count.

---

## Verification steps required after EVERY batch

1. `npm run typecheck`
2. `npm run build`
3. Smoke suite (or manual checklist)
4. HTML content diff on one school page + one program page
5. Reviewer login + edit round-trip (Batches 2 and 4 especially)

---

## Stop conditions

Halt and report if: build or typecheck fails; any visible content differs; a
route's rendering mode is not what the plan expected; timings get **worse**;
reviewer editing breaks; `evidence_metadata` turns out to be read by a mapper;
a change would need a file outside the allowlist.

---

## Required report fields

Modified / added / deleted files · dependency changes (**expected: none**) ·
configuration changes (**expected: none**) · database changes (**expected:
none**) · `git diff --stat` · build + typecheck results · build route table ·
timing tables per batch · Directus request counts · build duration · remaining
issues.
