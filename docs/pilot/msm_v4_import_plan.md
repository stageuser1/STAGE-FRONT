# Manhattan School of Music V4 → Directus import plan

Status: **dry-run verified, not committed**. Blocked only on write credentials.

## What this covers

`manhattan_school_of_music.v4.json` (170 confirmed program offerings, schema
`stage_school_extraction_v4`) reviewed and mapped to the live Directus at
`47.86.26.168:8055`. Tooling: `scripts/import_v4_package.mjs`.

## Why import didn't run

1. **No `DIRECTUS_TOKEN`.** Not in `.env.local`, `.env`, or process env.
   Directus read access works anonymously; every write needs a bearer token.
2. Resolved during mapping, not a live blocker anymore — documented here for
   the record:
   - **28 of 33 field slugs this package needs were unseeded** (only cello,
     composition, piano, violin, voice existed). Per the package's own
     `data_quality.review_notes`: *"Instrument and discipline field refs were
     deterministically normalized from current official MSM major labels
     because no separate seeded field-vocabulary file was supplied with the
     V4 contract."* i.e. this is expected — seeding new vocabulary as schools
     are onboarded is exactly what happened for the original 6 MSM/Juilliard
     field rows too. The script's `--seed-fields` flag creates the missing 28
     rows (English name + category only; Chinese names are a later review-pass
     step per contract §12, not blocking).
   - **19 of the 23 already-imported MSM programs would have been duplicated.**
     The original MSM import used a different track-slug convention
     (`cello_bm`, `violin_bm_zukerman`) than this V4 package
     (`cello_bm_classical`, `violin_bm_pinchas_zukerman_performance_program`).
     Fixed with an explicit, evidence-based alias table in the script
     (`ALIAS_REF_MAP`) confirmed by matching each existing row's
     `field_id`/`degree_level_id`/`official_program_name` against its V4
     counterpart — not guessed. This makes the upsert correctly update all 23
     existing rows in place (preserving their Directus IDs and any human
     review) instead of creating parallel duplicates.

## Verified dry-run plan (read-only, live data, `docs/pilot/msm_v4_dry_run_report.json`)

| Collection | Create | Update | Skip |
|---|---:|---:|---:|
| schools | 0 | 0 | 1 *(MSM record already matches — reused, not touched)* |
| fields | 28 | 0 | 0 |
| program_offerings | 147 | 22 | 1 |
| application_requirements | 147 | 23 | 0 |
| audition_requirements | 147 | 22 | 1 |
| source_records | 881 | 60 | 0 |

Program_offerings 147+22+1 = 170, matching the package exactly — **no
duplicates**, all 23 existing MSM programs correctly matched. Juilliard
(school id 1) is never queried or touched; the import is scoped entirely to
MSM (school id 2) via slug lookup.

### Conflicts (8) — protected, will NOT be overwritten

All 8 are on rows already `human_checked` (Directus's legacy "reviewed"
status), which the importer treats as protected exactly like `Verified`:

- `manhattan_school_of_music_violin_bm_classical` (program_offerings, id 3):
  `application_url`, `language_of_instruction`, `last_checked`,
  `official_program_name`, `track_or_concentration` — incoming V4 values
  differ but are skipped.
- `manhattan_school_of_music_violin_bm_pinchas_zukerman_performance_program`
  (audition_requirements, id 4): `conditional_notes`, `repertoire_summary`,
  `review_status` — same protection.

These surface in the report for a human reviewer to resolve manually if the
V4 values should supersede the protected ones; the importer will never do
this automatically.

## To actually run it

```
# 1. Add credentials (not committed — keep in .env.local or export directly)
DIRECTUS_TOKEN=<token>

# 2. Re-run dry-run to confirm nothing drifted since this plan was written
node scripts/import_v4_package.mjs data/extractions/manhattan_school_of_music/manhattan_school_of_music.v4.json --dry-run --report docs/pilot/msm_v4_dry_run_report.json

# 3. Commit (creates the 28 field rows + upserts all program/application/audition/source records)
node scripts/import_v4_package.mjs data/extractions/manhattan_school_of_music/manhattan_school_of_music.v4.json --commit --seed-fields --report docs/pilot/msm_v4_commit_report.json
```

After a real commit, MSM should show **170** program_offerings (up from 23),
Juilliard's count unchanged. Then verify the frontend (school detail, program
list, program detail, application/audition/repertoire sections, source
citations) before committing/pushing any code changes.
