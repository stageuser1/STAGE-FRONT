# STAGE V4 Package Validation Specification

Normative rules for validating a `stage_school_extraction_v4` package. Supersedes the V3
validation spec (`STAGE_pilot_execution_spec.md` §7). The existing
`scripts/validate_package.py` targets V3 and must be extended to V4 before the first V4
import; this document is the specification for that work — no script changes are part of the
contract itself.

Three outcome classes, unchanged in spirit from V3:

- **HARD FAILURE** — exit 1; the package is rejected; nothing is imported.
- **NEEDS ATTENTION** — exit 0; flagged in both reports; the importer sets
  `review_status: "Needs Review"` on the affected records.
- **WARNING** — exit 0; listed only.

Deterministic output ordering; human-readable report (FAIL / NEEDS ATTENTION / WARN /
SUMMARY with per-program null rates on decision fields) plus machine JSON report.

---

## 1. Hard failures

### Structure and schema
1. Invalid JSON; wrong or missing `schema_version` (must be exactly
   `stage_school_extraction_v4`).
2. Any violation of `stage-school-extraction-v4.schema.json`: missing required keys, unknown
   keys (`additionalProperties: false` — this automatically rejects every retired V3/legacy
   field such as `application_fee`, `application_fee_currency`, `recommendation_letters`
   counts, `resume_required`, `essay_required`, `portfolio_required`,
   `transcript_requirements`, `video_requirements`, `file_format_requirements`,
   `accompaniment_requirements`, `interview_or_callback_requirements`, `special_notes`,
   `faculty_list`, `international_url`, `english_waiver_policy`,
   `international_applicant_notes`, and any `*_zh` field), wrong types, enum values not
   matching exact casing.
3. Malformed dates (not `YYYY-MM-DD`) or cycles (not `YYYY-YYYY`); legacy cycle keys
   (anything matching `[a-z]+_fall_[0-9]{4}` or otherwise non-conforming).
4. Any Directus internal ID anywhere in the package.

### Refs and vocabularies
5. `field_ref` or `degree_level_ref` not in the seeded vocabulary supplied to the session.
6. `field_ref` from the legacy department-level family (prefix `juilliard_music_area_` or any
   slug the vocabulary marks as department-level) — instrument/discipline slugs only.
7. `program_offering_ref` not equal to
   `{school_ref}_{field_ref}_{degree_level_ref}` (+ `_{track_slug}` when
   `track_or_concentration` is non-null and needed for uniqueness).
8. A requirements or source record whose `program_offering_ref` does not appear in
   `program_offerings`.
9. Duplicate `program_offering_ref`; duplicate (`program_offering_ref`, `admission_cycle`) in
   either requirements array; duplicate (`source_url`, `related_field`, scope ref) in
   `source_records`.

### Cycle invariants
10. A program with zero or more than one `is_current: true` application record.
11. A program with zero or more than one `is_current: true` audition record.
    (One record of each type per program per cycle — the dual-audition-row structure is
    permanently invalid.)

### Value rules
12. `tuition_annual` present without `tuition_currency`.
13. `toefl_minimum` outside 0–120; `ielts_minimum` outside 0–9 or not a multiple of 0.5;
    `duolingo_minimum` outside 10–160.
14. `prescreening_required = "Yes"` with null `prescreening_deadline` **and** no
    `data_quality.review_notes` entry naming that program.
15. **Repertoire required:** `audition_required = "Yes"` or `prescreening_required = "Yes"`
    with null `repertoire_summary` **and** no `review_notes` entry naming that program and the
    URL checked.
16. `repertoire_structured` present but not exactly
    `{"prescreen": [...], "audition": [...]}` (schema-enforced), or present while
    `repertoire_summary` is null.
17. `required_materials` entry longer than 40 characters, or containing sentence punctuation
    (`.`, `;`, `:`) or a digit — these indicate instructions/quantities, not a material name.
    Entries that are navigation/page headings (e.g. `Overview`, `Faculty`, `How to Upload`,
    `Application Timeline`) are invalid material names.
18. The literal strings `"unknown"`, `"N/A"`, `"n/a"`, `"not specified"`, `"TBD"` as field
    values (nulls and enum `Unknown` are the only unknown representations).
19. Any record `review_status` other than `Extracted` / `Needs Review`; any
    `workflow_status` value other than the fixed
    `complete` / `unreviewed` / `false` triple. `Verified` anywhere in a package is a hard
    failure (reviewer-separation rule).

### Evidence rules
20. A stated (non-null) value of any of the six evidence-required claim types —
    `application_deadline`; `tuition_annual`; `toefl_minimum`/`ielts_minimum`/
    `duolingo_minimum`; `prescreening_required`/`prescreening_deadline`;
    `audition_required`; `repertoire_summary` — with no supporting source record. A source
    supports a claim when its `related_field` names that field (for the minimums, any of the
    three minimum fields or `english_language_tests`) and it is scoped to that program or
    school-level.
21. A source record supporting one of the six claim types with a null or empty
    `source_quote`, or a quote longer than 2 sentences / 400 characters.
22. A source record with both `school_ref` and `program_offering_ref` null.
23. A non-null `related_field` outside the canonical list in the schema (free text, page
    headings, and machine slugs such as `juilliard_schoolwide_*` are invalid).
24. A `source_url` not on an official school domain (the school's `official_website` host or
    a subdomain of it); rankings sites, aggregator sites, and third-party portals are not
    official sources. (Application portals such as Acceptd/Slideroom linked from official
    pages: record the official page, not the portal.)

## 2. Needs attention (exit 0; importer sets `Needs Review`)

1. Null `application_deadline` on a current cycle.
2. Null `tuition_annual` on a current cycle.
3. Null `repertoire_summary` permitted via review note (rule 15's escape hatch used).
4. `scholarships_available: "Unknown"` on a current cycle **with** no review note.
5. `confidence_level: "Low"` on any source backing one of the six claim types.
6. A `required_materials` entry outside the recommended vocabulary (`Online application`,
   `Recommendation letters`, `Résumé/CV`, `Essay/Personal statement`, `Transcripts`,
   `Portfolio`, `Interview`, `Prescreen materials`, `Writing sample`) — legal, but the
   reviewer must confirm it is a material name and not smuggled detail.
7. Any `data_quality.review_notes` entry (each is surfaced individually).
8. `audition_format: "Unknown"` while `audition_required: "Yes"`.
9. Contradictory sources recorded for the same claim (two sources, same `related_field`,
   same scope, different implied values — detected when both quotes are present).

## 3. Warnings (exit 0)

1. Null `duration_years`, `application_url`, `audition_url`.
2. Null `language_of_instruction` (expected for anglophone schools).
3. Null optional notes (`deadline_notes`, `scholarship_note`, `conditional_notes`).
4. Null `required_materials` (empty checklist — acceptable when the school publishes none).
5. `english_language_tests` containing `"Other"` (must be paired with a review note naming
   the actual requirement; absence of that note upgrades this to needs-attention).
6. A `found, not seeded` review note (informational; feeds vocabulary maintenance).

## 4. Summary metrics

The SUMMARY section reports, per program and package-wide: decision-field null rate
(deadline, tuition, English minimums, prescreen status/deadline, audition status/format,
repertoire), evidence coverage (each of the six claim types: backed / not stated), material
vocabulary conformance, and counts by review status. These metrics are the reviewer's
starting point and are copied into the import report unchanged.
