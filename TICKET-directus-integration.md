# TICKET: Connect STAGE FRONT to Directus (minimum integration)

**Repo:** `D:/STAGE FRONT`
**Goal:** Existing Directus data → existing STAGE FRONT display. Nothing else.
**Reviewed and approved plan.** Decisions below are final — do not revisit them during implementation.

## Hard constraints (out of scope — do not do)

- No UI redesign, no new components, no new pages, no new features.
- No Directus schema changes.
- No new architecture (no SDK dependency, no GraphQL, no state library, no API routes).
- Do not rename or change the exported function signatures' names in `lib/data.ts` — only make them async.
- Do not modify `data/types.ts` interfaces. The adapter conforms to them, not the reverse.

## Confirmed decisions (final)

1. **Status mapping** (Directus `review_status` → frontend status):
   - `Extracted` → `extracted_awaiting_review`
   - `Needs Review` → `extracted_awaiting_review`
   - `Verified` → `human_reviewed`  ← NOT `published`
   - `Outdated` → `draft`
   - Aggregate per program: take the **weakest** status across the program_offering row + its current application_requirements row + its current audition_requirements row (order weak→strong: `draft` < `extracted_awaiting_review` < `human_reviewed` < `published`).
2. **Routing / IDs:** school routes use the Directus `schools.slug`. The adapter sets `School.id = slug` and `Program.school_id = slug` (never the numeric Directus school ID). `Program.id` = `String(program_offerings.id)`.
3. **Fetch strategy:** parallel fetches of the needed collections with native server-side `fetch`, joined in memory in the adapter. Do not rely on Directus deep reverse-relation queries. In-memory `searchPrograms()` filtering stays byte-for-byte identical.

## Files to touch

| File | Change |
|---|---|
| `lib/data.ts` | Rewrite internals: Directus fetch + join + adapter. Same exports, now async. |
| `.env.example` | New: `DIRECTUS_URL=`, `DIRECTUS_TOKEN=` (token line commented as optional). |
| `app/page.tsx` | `await` the data call. No other change. |
| `app/search/page.tsx` | `await` the data call. No other change. |
| `app/schools/[schoolId]/page.tsx` | `await`. Route param now receives a slug — confirm lookups match on slug. |
| `app/schools/[schoolId]/programs/[programId]/page.tsx` | `await`. School matched by slug, program by stringified numeric ID. |

No other file changes. If the directory segment is literally named `[schoolId]`, keep the segment name (renaming to `[slug]` is optional cosmetic churn — skip it).

## Environment

- `DIRECTUS_URL` — server-only, required. Fail fast with a clear error message if missing.
- `DIRECTUS_TOKEN` — server-only, optional; send as `Authorization: Bearer` only if set. Never use a `NEXT_PUBLIC_` prefix for either.
- Add `.env.example`; do not commit `.env.local`.

## Fetch layer (inside lib/data.ts)

One shared helper:

```ts
async function directusFetch<T>(path: string): Promise<T> {
  const base = process.env.DIRECTUS_URL;
  if (!base) throw new Error("DIRECTUS_URL is not set");
  const headers: HeadersInit = {};
  if (process.env.DIRECTUS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIRECTUS_TOKEN}`;
  }
  const res = await fetch(`${base}${path}`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Directus ${res.status} on ${path}`);
  const json = await res.json();
  return json.data as T; // unwrap { data: ... } envelope exactly once, here
}
```

Collections to fetch (parallel, `Promise.all`):

- `/items/schools?limit=-1&fields=id,slug,school_name,city,country,official_website`
- `/items/program_offerings?limit=-1&fields=*,school_id.id,school_id.slug,school_id.school_name,school_id.city,school_id.country,field_id.slug,field_id.field_name,degree_level_id.slug,degree_level_name` *(adjust the expanded field list to actual need; `field_id.field_name` and `degree_level_id.degree_level_name` are the display values)*
- `/items/application_requirements?limit=-1`
- `/items/audition_requirements?limit=-1`
- `/items/source_records?limit=-1`

Cache the joined result per request naturally via Next fetch caching (`revalidate: 3600`); no extra caching layer.

## Join + adapter rules

**Current-cycle selection (critical):** `application_requirements` and `audition_requirements` are one row per admission cycle. For each program_offering pick the row where `is_current === true`; if none, fall back to the row with the lexicographically greatest `admission_cycle`; if none exist at all, use `null` and emit the null-safe empty shape the components already tolerate.

**Field mapping** (Directus → frontend `Program`, conforming exactly to `data/types.ts` — read that file first and match its nested shapes precisely):

| Frontend | Source |
|---|---|
| `id` | `String(program_offerings.id)` |
| `school_id` | expanded school relation `.slug` |
| `school_name` / `country` / `city` | expanded school relation |
| `name` | `official_program_name` |
| `degree_level` | expanded `degree_level_id.degree_level_name` |
| `major_area` | expanded `field_id.field_name`; if the relation is null, fall back to `official_program_name` (search assumes non-null string) |
| `duration` | `duration_years` |
| `application_url` | `application_url` |
| `deadline` | current app-req `application_deadline` as `YYYY-MM-DD` string, else `null` |
| `language_requirements` | current app-req: `english_language_tests`, `toefl_minimum`, `ielts_minimum`, `duolingo_minimum`, `english_waiver_policy` — shape per `data/types.ts` |
| `audition_requirements` | current audition-req row; `repertoire_summary` is the display field — shape per `data/types.ts` |
| `cost_aid` | only `application_fee` + `application_fee_currency` exist in Directus; all other cost/aid subfields → null-safe defaults |
| `sources` | `source_records` where `program_offering_id` matches, plus school-wide records where `school_id` matches the program's school; map `source_url`, `source_title`, `source_quote`, `retrieved_date`, `confidence_level` per the frontend source shape |
| `data_quality` | derived: status from the aggregate weakest-status rule above; confidence from the lowest `confidence_level` among linked source_records (default a safe middle value per the type); `review_notes` empty array/null per type |

`School` mapping: `id = slug`, `name = school_name`, `country`, `city`, `website_url = official_website`, `status`/`data_quality` derived with the same status map applied to the school's programs (weakest across its programs; if the type expects a per-school status and the school has no programs, use `extracted_awaiting_review`).

**Normalization guarantees:** relation fields may arrive as objects or bare numbers depending on expansion — handle both. All IDs stringified. All dates `YYYY-MM-DD` or `null`. Every nested object null-safe (missing requirements row must never throw at render).

## Acceptance checklist (implementer runs all; do not self-accept)

1. `npm run build` passes with no type errors against unmodified `data/types.ts`.
2. Home page lists Manhattan School of Music programs from Directus (local sample arrays no longer the source).
3. `/schools/manhattan-school-of-music` (actual slug per Directus) renders school + its programs.
4. Program detail page renders deadline badge, language requirement block, audition/repertoire summary, and source citations for a Manhattan program.
5. Search by country and by major returns Manhattan programs; empty-filter search returns all.
6. A program offering with no current audition_requirements row renders without runtime error.
7. `DIRECTUS_TOKEN` (if used) does not appear in the client bundle (`grep` the `.next` client output).
8. `data/sample/*` files untouched (may remain in repo, just unused by `lib/data.ts`).
9. Status pipeline spot-check: a `Verified` offering shows as `human_reviewed` in `DataStatusBanner`, and `published` never appears.

## Process note

Per project workflow: this ticket's diff must be reviewed by a different model family (or at minimum a separate uninvolved agent session) than the implementer before acceptance. Implementer self-review does not count. Include in the handoff to the reviewer: the diff, build output, and screenshots or route dumps for checklist items 2–5.
