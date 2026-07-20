# Directus pilot schema diff

Generated from the committed before/after snapshots. No fields were deleted, renamed, or type-changed.

## Added collections

- `cities`
- `countries`

## Added fields

- `application_requirements.scholarship_note`
- `application_requirements.scholarships_available`
- `application_requirements.tuition_annual`
- `application_requirements.tuition_currency`
- `audition_requirements.prescreening_required`
- `cities.city_name`
- `cities.country_ref`
- `cities.id`
- `cities.last_reviewed`
- `cities.living_cost_band`
- `cities.living_cost_currency`
- `cities.living_cost_monthly_est`
- `countries.country_name`
- `countries.id`
- `countries.last_reviewed`
- `countries.notes`
- `countries.post_study_work`
- `countries.visa_summary`
- `program_offerings.faculty_list`
- `program_offerings.program_offering_ref`
- `schools.city_ref`

## Newly hidden fields

- `application_requirements.application_fee`
- `application_requirements.application_fee_currency`
- `application_requirements.duolingo_minimum`
- `application_requirements.english_waiver_policy`
- `application_requirements.essay_required`
- `application_requirements.international_applicant_notes`
- `application_requirements.portfolio_required`
- `application_requirements.recommendation_letters`
- `application_requirements.required_materials`
- `application_requirements.resume_required`
- `application_requirements.transcript_requirements`
- `audition_requirements.accompaniment_requirements`
- `audition_requirements.file_format_requirements`
- `audition_requirements.interview_or_callback_requirements`
- `audition_requirements.repertoire_structured`
- `audition_requirements.special_notes`
- `audition_requirements.video_requirements`
- `program_offerings.application_url`
- `program_offerings.audition_url`
- `program_offerings.card_summary_zh`
- `program_offerings.department`
- `program_offerings.international_url`
- `program_offerings.program_name_zh`
- `schools.card_image`
- `schools.intro_zh`
- `schools.logo`
- `schools.ranking_position`
- `schools.ranking_source`
- `schools.region`
- `schools.school_name_zh`
- `source_records.raw_markdown`
- `source_records.source_title`

## Existing collection row-count changes during M1-M3

- None; all pre-existing collection counts are unchanged.

## Compatibility notes

- The live `audition_requirements.Prescreening_required` typo is retained; canonical lowercase `prescreening_required` was added and backfilled.
- Existing legacy review-status values are retained byte-for-byte. New pilot writes use `Extracted`, `Needs Review`, `Verified`, or `Outdated`.
- Existing `program_offerings.import_ref` values were used as the stable backfill when present, preserving reviewed identities.
