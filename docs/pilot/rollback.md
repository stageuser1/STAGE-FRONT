# Pilot rollback

Do not run rollback against production merely to demonstrate it. The pilot demonstrates the targeted procedure against a journal-listed test record and preserves the output under `docs/pilot/reports/`.

## Full schema restore

1. Preserve a fresh current snapshot.
2. Ask Directus to calculate the diff from `docs/pilot/schema_before/snapshot.json`.
3. Review the returned diff and apply it with `POST /schema/apply` using the baseline snapshot/diff accepted by the Directus 12 schema API.

This restores metadata and schema state, including field visibility. It can be broader than necessary if unrelated schema work happened after the pilot, so the targeted method below is preferred.

## Targeted schema rollback

Delete only the objects listed in `docs/pilot/schema_diff.md`, in dependency-safe order:

1. Delete relations `schools.city_ref` and `cities.country_ref`.
2. Delete the added fields on existing collections: `schools.city_ref`, `program_offerings.faculty_list`, `program_offerings.program_offering_ref`, `application_requirements.tuition_annual`, `application_requirements.tuition_currency`, `application_requirements.scholarships_available`, `application_requirements.scholarship_note`, and `audition_requirements.prescreening_required`.
3. Delete the added `cities` collection, then `countries`.
4. PATCH every field under **Newly hidden fields** in `schema_diff.md` with `meta.hidden: false`.

No legacy field is renamed or deleted by the migration.

## Pilot data rollback

The import reports contain `package_rows` plus a journal with every created/updated id and previous value:

- Created rows: delete the recorded id in reverse dependency order (`source_records`, cycle rows, programs, school only if created).
- Updated rows: PATCH the exact `before` object from the journal.
- Reference rows: unlink `schools.city_ref`, delete the `cities` row, then delete the `countries` row if no other city uses it.
- Prefix fallback: pilot program rows can be selected by `program_offering_ref` beginning with `manhattan_school_of_music_`; review the selection before deletion because the pilot intentionally upserts pre-existing rows.

Never delete a pre-existing program merely because its ref has the pilot prefix. Use the journal's `created` actions to distinguish additive records from protected baseline rows.
