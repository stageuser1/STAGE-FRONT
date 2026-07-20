# Manhattan School of Music school-detail completion

Checked against official MSM pages on 2026-07-20.

## Directus storage

- Reuses `schools.id = 2` / `slug = manhattan_school_of_music`.
- Adds one nullable JSON field, `schools.school_detail_sections`. The value has five named keys (`overview`, `international`, `tuition`, `campus`, `policies`); each stores `body_zh`, `source_urls`, short `evidence_quotes`, `last_checked_at`, and an applicable `admission_cycle` or `academic_year`.
- Keeps `schools.intro_zh` synchronized with the overview for compatibility and sets `schools.last_checked_at`.
- Retains all existing school-level evidence rows. Their `evidence_metadata.topic_key` values are populated so the frontend can consolidate multiple excerpts under one meaningful topic.
- Adds stable `import_ref` source rows for the official overview, admission entry point, tuition overview, campus, international-applicant policy, and student-visa evidence.

Run the idempotent updater with an administrator token:

```powershell
$env:DIRECTUS_ENV_FILE = 'path-to-env-with-directus-token'
node scripts/complete_msm_school_detail.mjs
```

A second run should report `"writes": 0`.

## Official sources

- https://www.msmnyc.edu/admission/
- https://www.msmnyc.edu/about/
- https://www.msmnyc.edu/admission/international-applicants/
- https://www.msmnyc.edu/admission/tuition-overview/
- https://www.msmnyc.edu/admission/scholarships-financial-aid/types-of-aid/
- https://www.msmnyc.edu/campus/
- https://www.msmnyc.edu/campus/student-affairs/housing-residential-life/about-andersen-hall/
- https://www.msmnyc.edu/admission/dates-deadlines/college-dates-deadlines/
- https://www.msmnyc.edu/admission/general-audition-information/

Cycle-specific admissions evidence is labeled `Fall 2026`; costs are labeled `2026-2027`. The displayed summaries do not present passed application deadlines as permanent requirements.
