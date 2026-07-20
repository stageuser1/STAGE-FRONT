# Pilot current-state inspection

Inspection date: 2026-07-19 (Asia/Shanghai). This document records the system before the reduced-data pilot migration. Raw Directus evidence is in `schema_before/`.

## Frontend repository

- Repository: `stageuser1/STAGE-FRONT`, checked out at `D:\STAGE FRONT`.
- Framework: Next.js 15 App Router with React 19 and TypeScript 5.7.
- Package manager: npm (`package-lock.json`).
- Routing: filesystem routes under `app/`; existing public detail routes are `/schools/[schoolId]` and `/schools/[schoolId]/programs/[programId]`.
- Existing program page: `app/schools/[schoolId]/programs/[programId]/page.tsx`, rendered through `components/program/ProgramDetailSections.tsx`.
- Data adapter: `lib/data.ts` reads Directus with server-side `fetch` from `DIRECTUS_URL`; the reviewer client uses `NEXT_PUBLIC_DIRECTUS_URL`. Public reads use `/items/...` queries and `cache: "no-store"`.
- Reviewer authentication: `lib/directus-auth.tsx` authenticates directly to Directus and stores the short-lived access token in browser local storage.
- Feature flags: no repository convention existed. The controlled `/pilot/...` route prefix is therefore the specification-defined boundary and leaves all existing routes untouched.
- Styling: Tailwind CSS 3 with tokens in `tailwind.config.ts` and global styles in `app/globals.css`.
- Commands before this task: `npm run typecheck`, `npm run build`, `npm run dev`, `npm start`. There was no unit-test command.

## Directus

- Endpoint: `http://47.86.26.168:8055`.
- Version: Directus 12.1.1, PostgreSQL.
- Script authentication: static bearer token in `DIRECTUS_TOKEN`. The token can read and mutate schema and data, so it operates as the project's administrative script credential; no role-permission mutation is required.
- Snapshot mechanism before this task: the Git repository had none. A one-off v2 importer and snapshot existed outside Git at `D:\STAGE_import_test`, so the deterministic decision rule selected a new repository-owned REST migration script.
- Fresh raw backups: `docs/pilot/schema_before/{collections,fields,relations,snapshot,row_counts}.json`.

Pre-migration user-collection counts:

| Collection | Rows |
|---|---:|
| `application_requirements` | 185 |
| `audition_requirements` | 334 |
| `degree_levels` | 5 |
| `fields` | 13 |
| `program_offerings` | 185 |
| `schools` | 2 |
| `source_records` | 5,069 |

Relevant live-schema compatibility findings:

- `program_offerings.import_ref` was already unique and contained stable package refs, but the target `program_offering_ref` field was absent.
- `audition_requirements` used the typo `Prescreening_required`; a canonical lowercase field was absent.
- Program/application/audition review dropdowns retained legacy values (`ai_generated`, `human_checked`, `human_edited`, `needs_update`), while `source_records` already used the v3 values.
- Existing reviewed values must remain byte-for-byte intact. The migration therefore adds canonical fields and backfills them without deleting or renaming legacy fields; the importer treats legacy `human_checked` as protected review state.

## Seeded vocabulary and prior tooling

- Live fields: `cello`, `composition`, `opera_studies`, `piano`, `violin`, `voice`, plus seven Juilliard-specific area slugs. The committed validator vocabulary mirrors the full live list.
- Live degree levels: `ad`, `bm`, `dma`, `gd`, `mm`.
- The vendored reference `directus_collections_reference.md` was found in `D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor\references`, outside Git.
- The active legacy envelope was `stage_music_admissions_v2`.
- Existing validator/rendering logic was found outside Git in `D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor\scripts\render_obsidian.py`.
- A create-only v2 importer was found at `D:\STAGE_import_test\import_directus.mjs`; it had no natural-key upsert, deterministic diff, cycle handling, or complete reviewed-value protection, so it is reference material rather than the active adapter.

## Reviewer interface

Review happens in the custom Next.js UI, not primarily through Directus presets. `ReviewerEditableCard` was embedded in the existing program detail page and could edit legacy/frozen fields. It used legacy status values and did not perform an optimistic concurrency check. The pilot aligns this custom interface to the active field list, canonical statuses, supporting-source display, and conflict behavior.

## Tests and CI

- No `.github/workflows` or other CI configuration was present.
- No pre-existing unit tests or test runner were present.
- Acceptance therefore runs locally through the npm scripts added by the pilot, Python `unittest`, `node:test`, TypeScript, Next build, Directus verification, and browser checks.

## Pilot school baseline

- Manhattan School of Music exists in Directus as school id `2`, canonical slug `manhattan_school_of_music` (not `msm`). Reusing the live slug avoids duplicating reviewed data.
- The baseline has 21 program rows, 21 current application rows, and 21 current audition rows for cycle `2026-2027`.
- One program row and one audition row use legacy `human_checked`; those are treated as previously verified/protected baseline values.
- The prior v2 package at `D:\STAGE_import_test\manhattan_school_of_music_stage_admissions.json` contains 22 offerings, of which 21 were imported. The unimported `composition_unspecified` record is not a seeded v3 identity.
- The current 2026–27 official catalog contains no Opera Studies offering, so the prior `opera_studies_ad` record is not part of the current live extraction index.

## Program-index fallback decision

Official MSM pages were reachable. The index confirmation was posted once; no response arrived in the confirmation window. Per the execution specification, the pilot proceeds with exact seeded matches only and caps the package at the first 12 sorted refs. Non-seeded and over-cap offerings are retained in `data_quality.review_notes`.
