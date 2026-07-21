# Sonnet Independent Review — Colburn, Curtis, Eastman, NEC (V4 Extraction Packages)

Reviewed: 2026-07-21
Reviewer: Claude Sonnet 5 (independent review pass — no involvement in the original extraction or the prior Codex fallback audit)
Scope: `data/extractions/{colburn,curtis,eastman,new_england_conservatory}/*.v4.json` and their accompanying `summary.md`, `program_matrix.md`, `unresolved_issues.md`, `validation_report.md`. No regeneration, no restructuring, no schema changes were performed.

## Overall approval status

**Conditionally approved — release with minor corrections applied.**

All four packages are schema-valid (Draft 2020-12), internally consistent (deterministic refs, one current application/audition record per offering, no duplicate natural keys), and every decision-critical null is accompanied by an explicit review note rather than a silent gap. One real data-quality defect was found (below) and has been corrected in this pass. No critical or blocking issues remain.

| School | Offerings | Applications | Auditions | Sources | Schema | Verdict |
|---|---:|---:|---:|---:|---|---|
| Colburn School | 51 | 51 | 51 | 368 | PASS | Approved |
| Curtis Institute of Music | 38 | 38 | 38 | 233 | PASS | Approved |
| Eastman School of Music | 112 | 112 | 112 | 785 | PASS | Approved (1 fix applied) |
| New England Conservatory | 141 | 141 | 141 | 986 | PASS | Approved |

## 1. Program completeness

Degree × field × specialization coverage is credible and matches each school's own published program lists cross-checked against `program_matrix.md`:

- **Colburn** (51 offerings, AD/BM/MM only, no doctoral programs — correct, Colburn does not offer a doctorate) covers all 17 studio instruments plus Chamber Music and Orchestral Conducting (Salonen Conducting Fellows).
- **Curtis** (38, BM/MM only — correct, Curtis has no doctoral programs) covers all standard orchestral instruments, Composition, Opera Studies, Organ, and Guitar.
- **Eastman** (112, BM/MM/DMA) is the most granular package: it correctly splits the Jazz Studies & Contemporary Media track out from Double Bass, Drum Set, Guitar, Piano, Saxophone, Tenor Trombone, Trumpet, Voice, and Composition wherever Eastman's own site treats them as separately-auditioned tracks, plus academic fields (Music Theory, Musicology-adjacent MM/DMA, Music Education, Conducting subtypes).
- **NEC** (141, AD/BM/MM/GD/DMA — the widest span of any of the four) is the only package that models Jazz as its own top-level field (`jazz_performance`, `jazz composition`) rather than a track under each instrument; this is a reasonable and internally consistent modeling choice given NEC's own site structure, and it does not conflict with Eastman's different (but also internally consistent) choice.

No obvious missing major/program category was found for any of the four schools. Credentials that exist at each school outside the current V4 degree enum (Performance Diploma, Professional Studies Certificate, Post-Baccalaureate Diploma, MA, PhD, Advanced Diploma variants, Undergraduate/Graduate Performance Certificates, dual-degree pathways) are correctly excluded from `program_offerings` rather than force-mapped, and are fully inventoried in each `unresolved_issues.md` — this is the right call under the "unchanged V4 schema" constraint and should not block release.

## 2. Data accuracy

- Degree naming (`degree_level_ref` values bm/mm/dma/gd/ad) is applied consistently and correctly against each school's actual credential structure (e.g., Colburn/Curtis correctly have no `dma`; NEC correctly has all five).
- Cross-checked `program_offering_ref` counts against `program_offerings`/`application_requirements`/`audition_requirements` arrays for all four schools — one-to-one, no duplicates, no orphans (verified programmatically).
- Degree totals in each `summary.md` sum correctly to the stated offering count (Colburn 18+16+17=51; Curtis 20+18=38; Eastman 33+37+42=112; NEC 22+27+28+31+33=141).
- **Issue found (corrected in this pass):** In `eastman.v4.json`, 19 offerings that share an instrument/field with a non-jazz counterpart but differ only by `track_or_concentration: "Jazz Studies & Contemporary Media — Performance"` (double_bass, guitar, piano, saxophone, tenor_trombone, trumpet ×3 degree levels each, plus voice ×1) had an `official_program_name` **identical** to their non-jazz sibling — the jazz distinction lived only in `track_or_concentration`, not in the display name. This is inconsistent with how the package treats the otherwise-identical Composition jazz track (which correctly gets a distinct name, "Jazz Composition — Bachelor of Music") and with the Drum Set/Early Music tracks (which correctly append the concentration in parentheses). Since `official_program_name` is the field most likely to be surfaced directly on cards/lists in the frontend, two rows with the same display name and different `track_or_concentration` values risked reading as accidental duplicates to a user or to a naive frontend renderer that doesn't show `track_or_concentration`. **Fix applied:** appended the concentration in parentheses to all 19 affected `official_program_name` values, e.g. `"Double Bass — Bachelor of Music in Applied Music (Jazz Studies & Contemporary Media — Performance)"`, matching the convention already used elsewhere in the same file. No `program_offering_ref`, `field_ref`, `degree_level_ref`, URL, or other field was touched; offering/application/audition/source counts are unchanged (112/112/112/785).
- No other suspicious entries, mismatched degree/field pairs, or naming collisions were found in Colburn, Curtis, or NEC.

## 3. Evidence quality

- Spot-checked `source_records` for all four schools: deadline, tuition, English-minimum, and scholarship fields are backed by direct quotes from official `.edu` domains with `retrieved_date` and `confidence_level` populated (e.g., Colburn's `application_deadline` is backed by the quote "Conservatory Application (Deadline: December 2, 2025)" from the school's own admissions page).
- Fields left `null` (current-cycle `tuition_annual`, `duration_years` where the school publishes a range, `language_of_instruction`) are consistently accompanied by a named reason in `conditional_notes` / `deadline_notes` / the package's `data_quality.review_notes` rather than being silently absent — this is good practice and matches what `unresolved_issues.md` claims.
- No unsupported assumptions were found: every credential excluded from the V4 enum (PD, PSC, PBD, MA, PhD, Advanced Diploma variants, GPC, dual-degree pathways) is named with its source fields rather than guessed at or dropped silently.
- All four packages correctly stamp `review_status: "Needs Review"` on every offering because each live source still publishes the prior admissions cycle (Fall 2026) rather than the cycle the packages target (Fall/2026-2027 or later) — this is an honest, conservative choice, not a data defect.

## 4. STAGE readiness

- All four JSON files are structurally suitable for frontend consumption: consistent key shapes across offerings, stable deterministic refs, and no legacy/prohibited fields or raw Directus IDs present (per each `validation_report.md`).
- `workflow_status.ready_for_directus_import` is correctly `false` and `review_status` is correctly `"unreviewed"` in all four packages — this accurately reflects that current-cycle tuition/deadline values are still pending official publication, not that the data is unusable. The frontend can safely consume these packages today provided it respects `review_status: "Needs Review"` per offering (i.e., surfaces a "verify before relying on this" indicator) rather than treating nulls as broken data.
- The one field-level defect found (Eastman jazz-track naming) has been corrected; no other fields require correction before frontend use.

## Recommended fixes

1. ~~Fix 19 Eastman `official_program_name` values that collided with their non-jazz sibling.~~ **Done** — applied in this review pass, JSON re-validated as well-formed, record counts unchanged.
2. No other corrections recommended. Current-cycle tuition/deadline nulls should remain null until the schools publish the applicable cycle — do not backfill from 2025-26/2026-27 figures, since that would misrepresent the current cycle's cost/deadline as confirmed when it is not.

## Release recommendation

**Approved for STAGE frontend consumption as "Needs Review" data**, i.e. importable/displayable now with the existing per-offering `review_status` flag surfaced to users, and re-checked once each school publishes its next admissions cycle (Fall 2027 pages are not yet fully live as of 2026-07-21 for several of these schools). Not yet appropriate to flip `ready_for_directus_import` to `true` until that cycle refresh — that gate should remain owned by whoever re-verifies deadlines/tuition against the live Fall 2027 pages, not by this review.
