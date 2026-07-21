# STAGE School Extraction Contract — V4 (`stage_school_extraction_v4`)

Status: **active**. This contract supersedes `stage_music_admissions_v3` (see
`STAGE_pilot_execution_spec.md` §6) and every earlier extraction contract (v2, Modes A–E,
Markdown pre-conversion, Obsidian rendering). V3 remains readable for legacy packages; no new
package may be produced against it.

STAGE is a decision-support product for music-school applicants, not an admissions
encyclopedia. A V4 package contains exactly the information a student needs to decide whether
to pursue a program — identity, deadline, cost, language, prescreening, audition, repertoire —
plus the official evidence for each claim. Nothing else.

---

## 1. Roles

| Agent | Responsibility |
|---|---|
| **Codex (extraction)** | Researches **official school websites only** and outputs one V4 JSON package per school. Never touches Directus, the frontend, or existing data. Never marks anything `Verified`. |
| **Fable (integration)** | Reviews packages, produces Chinese-facing content, maps refs to Directus records, runs validation and import, verifies frontend rendering, deploys. All `Verified` statuses are set in a separate review pass, never by the extracting agent. |

The package is the only interface between the two roles. It therefore contains **no Directus
internal IDs, no frontend-specific data, and no presentation strings** — stable refs only.

## 2. Package envelope

One JSON file per school: `{school_ref}.json`, UTF-8, a single top-level object:

```
schema_version            "stage_school_extraction_v4"   (const)
school                    object                          (§5)
program_offerings         array                           (§6)
application_requirements  array                           (§7)
audition_requirements     array                           (§8)
source_records            array                           (§9)
data_quality              object                          (§10)
workflow_status           object                          (§10)
```

Machine schema: `stage-school-extraction-v4.schema.json`. Valid format example:
`stage-school-extraction-v4.example.json` (format only — values are illustrative and must
never be copied into a real package). Validation rules:
`stage-school-extraction-v4-validation.md`.

## 3. What V4 collects

**Coverage:** the **complete program × degree × track matrix** for every seeded field the
school offers. Degree levels are never merged unless the official page states requirements are
identical. Named tracks that admit separately (e.g. Classical vs. Zukerman violin) are
separate offerings.

**Per offering:** identity (school, field, degree, track, official program name), official
program URL (plus application/audition URLs when readily available), current admission cycle,
last-checked date.

**Decision facts (current cycle):** application deadline; annual tuition + currency;
scholarship availability + short note; accepted English tests + published minimums
(TOEFL/IELTS/Duolingo); language of instruction **only when not obviously English**;
prescreening status + deadline when required; audition status + format; repertoire
requirements (§8.1); concise application-material names (§7.1).

**Evidence:** one source record per consulted page; short quotes for the six evidence-required
claim types (§9).

## 4. What V4 does not collect

Never present in a V4 package, even when the official site publishes it:

- application fees (amount or currency);
- detailed material instructions — quantities, formatting, submission procedures, or long
  descriptions for recommendation letters, essays, résumés, transcripts, portfolios;
- video/audio recording specifications, file formats, upload limits, camera/microphone/framing
  or any technical rules;
- accompanist logistics; interview or callback scheduling logistics;
- curriculum and course lists; faculty rosters; facilities; rankings; housing and safety
  detail; class or studio sizes;
- marketing prose or long descriptive paragraphs;
- raw page archives, page dumps, or per-heading section payloads;
- Directus internal IDs; frontend-specific fields (Chinese names, card summaries, display
  labels) — these are produced downstream by Fable;
- `international_url` and general international-student notes (visa/living-cost context is
  manual reference data outside extraction).

Legacy data already in Directus for these categories remains untouched but is never expanded
and never defines the template.

## 5. School object

```
school_ref         required  slug, [a-z0-9_]
school_name        required  official English name
city               required  official campus city (string)
country            required  (string)
school_type        required  Conservatory | University Music School | Liberal Arts College | Arts University
official_website   required  canonical https URL
```

School-level Chinese content (`intro_zh`, the five `school_detail_sections`) is **not** part
of extraction; Fable produces it during review from the same official pages.

## 6. Program offering records

```
program_offering_ref     required  {school_ref}_{field_ref}_{degree_level_ref}[_{track_slug}]
school_ref               required
field_ref                required  seeded vocabulary slug (instrument/discipline level)
degree_level_ref         required  seeded slug: bm | mm | dma | gd | ad
track_or_concentration   nullable  official track name; track_slug = lowercase [a-z0-9_] of it
official_program_name    required
program_url              required  official program page
application_url          nullable  optional when readily available
audition_url             nullable  optional when readily available
duration_years           nullable  optional when readily available
language_of_instruction  nullable  array of language names; null when obviously English
last_checked             required  YYYY-MM-DD (date the pages were read)
review_status            optional  "Extracted" | "Needs Review"   (default Extracted)
```

**Ref rules (unchanged from V3):** refs are stable strings, never Directus IDs, never changed
once assigned. `field_ref` and `degree_level_ref` must come from the seeded vocabularies
supplied to the session. Fields are seeded at **instrument/discipline granularity** (`violin`,
`cello`, `composition`) — department-level slugs (the legacy `juilliard_music_area_*` family)
are forbidden for new extraction. Offerings whose field or degree is not seeded are reported
under `data_quality.review_notes` as `found, not seeded: <name>` — never force-mapped, never
invented.

## 7. Application requirement records

Exactly **one record per offering per admission cycle**; exactly one with
`is_current: true` per offering.

```
program_offering_ref     required
admission_cycle          required  YYYY-YYYY (academic year of entry; Fall 2027 intake = "2027-2028")
is_current               required  boolean
application_deadline     nullable  YYYY-MM-DD; null ⇒ needs_attention on current cycle
deadline_notes           nullable  ONLY when the deadline genuinely varies (early action, rolling…)
tuition_annual           nullable  number; null ⇒ needs_attention on current cycle
tuition_currency         nullable  ISO code from the schema enum; required when tuition_annual set
scholarships_available   required  Yes | No | Unknown
scholarship_note         nullable  one short sentence
english_language_tests   nullable  array from: TOEFL, IELTS, Duolingo, Cambridge, PTE, Other
toefl_minimum            nullable  0–120
ielts_minimum            nullable  0–9, steps of 0.5
duolingo_minimum         nullable  10–160
required_materials       nullable  concise material names only (§7.1)
conditional_notes        nullable  short, decision-relevant only
review_status            optional  "Extracted" | "Needs Review"
```

Generic labels ("English Language Proficiency") are invalid as test entries — the enum forces
real test names; an unnamed requirement is expressed as `["Other"]` plus a review note.

### 7.1 Concise application-material names

`required_materials` is a flat array of short requirement names — a checklist, not
instructions. Recommended vocabulary:

`Online application` · `Recommendation letters` · `Résumé/CV` · `Essay/Personal statement` ·
`Transcripts` · `Portfolio` · `Interview` · `Prescreen materials` · `Writing sample`

Rules: each entry ≤ 40 characters, no sentences, no quantities, no formatting or submission
detail. `"Recommendation letters"` is valid; `"Three letters of recommendation submitted via
Acceptd by December 1"` is a contract violation. Entries outside the recommended vocabulary
are allowed but flagged `needs_attention` for reviewer confirmation. Navigation headings
copied from page menus (the legacy Juilliard failure) are a hard validation failure.

## 8. Audition requirement records

Exactly **one record per offering per admission cycle** — prescreening and audition facts are
columns of the same record, **never two rows** (this retires the legacy Juilliard dual-row
structure permanently). Exactly one `is_current: true` per offering.

```
program_offering_ref     required
admission_cycle          required  YYYY-YYYY
is_current               required  boolean
prescreening_required    required  Yes | No | Varies | Unknown
prescreening_deadline    nullable  required by validator when prescreening_required = Yes
audition_required        required  Yes | No | Varies | Unknown
audition_format          required  Live Only | Recorded Only | Live or Recorded | Regional | Multiple Rounds | Unknown
repertoire_summary       nullable  see §8.1 — required for audition-based programs
repertoire_structured    nullable  see §8.1 — optional, one canonical shape only
conditional_notes        nullable  short, decision-relevant only
review_status            optional  "Extracted" | "Needs Review"
```

### 8.1 Repertoire

Repertoire is a core publication field.

- `repertoire_summary` is **required (non-null) whenever `audition_required` or
  `prescreening_required` is `Yes`**. If the official site truly does not publish repertoire,
  the value stays null and `data_quality.review_notes` must name the program and the URL
  checked — a silent null is a hard validation failure.
- The summary is concise but musically complete: preserve number of pieces, repertoire
  categories, periods, languages, durations, memorization and other special musical
  constraints **when officially stated**. Omit logistics (recording specs, scheduling,
  accompanist rules — §4).
- `repertoire_structured` is optional and allowed **only** in the single canonical shape
  `{"prescreen": [string], "audition": [string]}`, and only when the official page genuinely
  separates prescreen and audition repertoire and the split improves presentation. Any other
  shape (including the legacy section-object arrays) is a hard failure. When
  `repertoire_structured` is present, `repertoire_summary` is still required.

## 9. Source records

Official sources only. One record per consulted page; additional records per claim when a
quote targets a specific field.

```
school_ref            nullable  set for school-wide facts
program_offering_ref  nullable  set for program-specific facts (at least one of the two)
source_url            required
source_type           required  Official Program Page | Application Requirements Page |
                                Audition Requirements Page | International Students Page |
                                English Language Requirements Page | Deadline/Fee Page
retrieved_date        required  YYYY-MM-DD
source_quote          nullable  ≤ 2 sentences; REQUIRED for the six claim types below
related_field         nullable  canonical: the exact V4 field name the quote supports
confidence_level      required  High | Medium | Low
```

**Six evidence-required claim types** — every stated value of these must be backed by a
source record whose `related_field` names it (program-scoped or school-wide) and which
carries a `source_quote`:

1. `application_deadline`
2. `tuition_annual`
3. `toefl_minimum` / `ielts_minimum` / `duolingo_minimum`
4. `prescreening_required` / `prescreening_deadline`
5. `audition_required`
6. `repertoire_summary`

`related_field` values are **canonical field names only** (or null for a general page record)
— machine slugs, page-heading slugs, and free text are invalid. School-wide facts (one
deadline for all programs) are stored once as a school-level source, copied into each cycle
record, never duplicated per program. Contradictory sources: record both, set
`confidence_level: "Low"`, add a review note — never silently pick one.

## 10. Truth, nulls, and status

- **Never guess.** Anything the official site does not state is `null` (open fields) or
  `Unknown` (enums that include it) — never `"N/A"`, `"not specified"`, or an inferred value.
  Every decision-critical null on a current cycle gets a `data_quality.review_notes` entry
  naming the program and the URL checked. A fabricated value is a hard failure of the package.
- **Statuses.** Codex may use only `Extracted` or `Needs Review` on records.
  `workflow_status` is always `{"extraction_status": "complete", "review_status":
  "unreviewed", "ready_for_directus_import": false}`. `Verified` and `Outdated` exist only in
  Directus and are set exclusively by the separate review pass (reviewer separation rule,
  V3 §1.5, retained).
- **Dates** `YYYY-MM-DD`; **cycles** `YYYY-YYYY`. Legacy cycle keys
  (`juilliard_fall_2027`) are forbidden.

## 11. Ordering and duplicate keys (retained from V3)

`program_offerings` sorted by `program_offering_ref`; requirement arrays sorted by
(`program_offering_ref`, `admission_cycle` desc); `source_records` school-level first, then by
`program_offering_ref`, then `source_url`. No two offerings share a ref; no two requirement
records share (`program_offering_ref`, `admission_cycle`); no two sources share
(`source_url`, `related_field`, scope ref).

## 12. Downstream (Fable-side, informative)

The importer maps refs to Directus by natural key (school `slug`, `program_offering_ref`,
(`program_offering_id`, `admission_cycle`), source triple), writes only V4-active fields,
never touches frozen legacy columns, sets `review_status` from the package
(`Extracted`/`Needs Review`), and enforces verified-record protection and the
single-`is_current` invariant exactly as specified in the V3 pilot spec §8 — those mechanics
carry forward unchanged. Chinese-facing fields (`program_name_zh`, `card_summary_zh`,
`field_name_zh`, `intro_zh`, `school_detail_sections`) are added by Fable during review before
publication.
