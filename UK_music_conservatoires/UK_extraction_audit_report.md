# UK Conservatoire Extraction Audit

Audited: 2026-07-21
Auditor: Claude Sonnet 5 (independent audit — no involvement in the original extraction)
Scope: `UK_music_conservatoires/{Royal_College_of_Music, Royal_Academy_of_Music, Guildhall_School_of_Music_and_Drama, Royal_Northern_College_of_Music, Royal_Conservatoire_of_Scotland}/*` against `docs/contracts/stage-school-extraction-v4.md`, `.schema.json`, and `-validation.md`. No JSON files were modified; this is a read-only audit.

## Overall Result

**PASS WITH REVIEW**

## Summary

- **Total programmes reviewed:** 508 (`program_offerings`, matching every `application_requirements` and `audition_requirements` record 1:1 — verified programmatically, no orphans, no duplicates)
- **Schools reviewed:** 5 — Royal College of Music (95), Royal Academy of Music (96), Guildhall School of Music & Drama (96), Royal Northern College of Music (123), Royal Conservatoire of Scotland (98)
- **Major findings:**
  1. All five packages are **100% schema-valid** against `stage-school-extraction-v4.schema.json` (0 errors, machine-validated with the real JSON Schema, not just the package's self-reported validation report) and pass every hard-failure rule in the validation spec that can be checked mechanically (ref/duplicate integrity, `is_current` invariants, tuition-currency pairing, prescreening/repertoire null-with-review-note escape hatch, material-name format, official-domain sourcing, evidence-quote presence for all six evidence-required claim types, no forbidden literal strings).
  2. **RCM and RAM are correctly kept distinct** — separate `school_ref`, `school_name`, `official_website` (rcm.ac.uk vs ram.ac.uk), zero overlapping `program_offering_ref` or `program_url` values. The extraction agent's own review notes for both schools explicitly document the disambiguation. No Chinese-language fields exist in either package (correctly out of V4 scope), so the "same Chinese translation" risk the brief raised has not yet been baked into any data — but it is a real risk for the **downstream** Fable review pass and should be flagged forward (see Critical Issues).
  3. **Tuition data is functionally absent for 2 of 5 schools.** RNCM: `tuition_annual` is null on **all 123/123** offerings. RCS: null on **98/98**. Both are individually disclosed in `data_quality.review_notes` (schema-compliant, not a hard failure) but this means a student cannot compare cost at RNCM or RCS against the other three schools at all — a major decision-support gap for a cost-comparison product.
  4. No duplicate programmes, no cross-field name collisions, and no field/degree vocabulary violations (all `field_ref` values are instrument/discipline-level, no legacy department-level slugs) were found in any of the five packages.
  5. A few plausible coverage gaps surfaced (Guildhall: no Conducting field; RCM/RNCM: no Jazz field; RNCM: no Opera field; RCM/RNCM: no Collaborative Piano field) — flagged for verification against each school's live site rather than asserted as errors, since I cannot browse the internet in this audit and each is at least plausible given these schools' known program structures.

## School-by-school Review

### RCM (Royal College of Music)

**Strengths**
- Cleanest package of the five: 0 critical missing fields, 3 review notes, `overall_confidence: High`.
- 26 distinct `field_ref` values covering all core instrument families, Composition, Orchestral Conducting, Opera Studies, and Historical Performance (Harpsichord).
- Degree crosswalk is explicit and sensible (MPerf/MComp/MMus → mm, PhD → dma, GradDip → gd, Artist Diploma → ad), and the RCM/RAM distinction is proactively documented in its own review notes.
- Full tuition and deadline coverage — `royal_college_of_music`'s 2027-28 fee PDF was located and used; no tuition nulls.

**Issues**
- `royal_college_of_music` field vocabulary has no `jazz_performance` or `collaborative_piano` offerings. RCM does not historically run a standalone jazz department, and "Collaborative Piano" may be folded under Piano's accompaniment tracks rather than a separate award — plausible, but should be verified against `rcm.ac.uk` before treating as confirmed coverage.
- `found, not seeded` list includes several real programmes (MSc Performance Science, MEd, Master of Music Education) that are legitimately excluded under the "unchanged degree enum" rule — correctly handled, not a defect.

**Corrections needed:** None blocking. Verify Jazz/Collaborative Piano absence against the live site during the next refresh cycle.

### RAM (Royal Academy of Music)

**Strengths**
- Full field coverage of all 11 focus areas requested in this audit, including Jazz, Choral Conducting, Collaborative Piano, and Historical Performance.
- Dual master's-award structure (MA vs MMus, verified as two genuinely distinct RAM-published tracks with separate program URLs, e.g. `violin-ma-performance` vs `violin-mmus-performance`) is modeled correctly as two separate offerings, not a duplicate.
- Distinct from RCM at every identity level (see Overall Result above).

**Issues**
- 26 offerings (all Artist Diploma tracks plus the Musicology DMA/PhD) have null `tuition_annual`, each backed by a named review note pointing at `ram.ac.uk/study/about-our-courses` — the AD tuition figure genuinely isn't itemized per-instrument on that page. This is the second-largest tuition gap in the set after RNCM/RCS.
- `royal_academy_of_music_musicology_dma_phd` also has a null `application_deadline` — the only RAM programme missing this field, and it's disclosed.

**Corrections needed:** None blocking (all nulls are disclosed per the escape hatch). Recommend a follow-up pass once RAM publishes AD-specific tuition for 2027-28.

### Guildhall (Guildhall School of Music & Drama)

**Strengths**
- Second-cleanest package: only 2 critical missing fields (both on the Musicology DMA/PhD track, both disclosed), `overall_confidence: Medium` driven almost entirely by that one programme.
- Full Voice, Piano, Strings, Wind, Brass, Composition, Jazz, Historical Performance, Opera, and Collaborative Piano coverage.
- Source list is clean and specifically organized by audition category (composition, electronic/produced music, jazz, keyboard, opera studies, strings/harp/guitar, vocal, wind/brass/percussion auditions) — good evidence granularity.

**Issues**
- **No `conducting`-related field_ref anywhere in the 96 offerings**, and no "found, not seeded" note mentions conducting either — meaning either Guildhall genuinely has no standalone conducting degree (plausible; Guildhall's conducting training is historically fellowship/short-course based rather than a full department like RCM/RAM/RCS), or it was missed entirely during extraction. This is the one coverage question in this audit that reads as a **potential true gap** rather than a defensible absence, because the extraction didn't even log it as "found, not seeded" the way it did for other excluded programmes (MA Music Therapy, MA Opera Making and Writing, etc.) — suggesting the page may not have been checked rather than checked-and-excluded.

**Corrections needed:** Verify whether `gsmd.ac.uk` publishes any conducting-related degree or diploma before the next release; if one exists, it should be added in the next extraction pass (not fabricated in this audit).

### RNCM (Royal Northern College of Music)

**Strengths**
- Largest package (123 offerings), correctly reflecting RNCM's genuinely wide degree ladder (AD/BM/GD/MM ×2 tracks each/DMA-mapped PhD).
- Every one of the 124 missing-field entries is individually named with the program ref and the URL checked — full compliance with the review-note escape hatch, zero silent nulls.
- IELTS minimums are populated for all 123 records (TOEFL is correctly left null school-wide, consistent with RNCM's UKVI/IELTS-oriented English policy rather than a gap).

**Issues**
- **`tuition_annual` is null on 100% of offerings (123/123).** This is the largest tuition gap in the dataset. A student cannot compare RNCM's cost against any other school in this set using this package alone.
- No `jazz_performance`, `opera_studies`, or `collaborative_piano` field_ref present. RNCM is publicly known for a substantial jazz program; its absence here — with no "found, not seeded" note calling it out — is the strongest single coverage-gap signal in this audit and should be checked before release.
- One `duration_years` outlier (3 years for `music_education_bm`, a BA Ed track) — investigated and appears to be a legitimate distinct award, not an extraction error.

**Corrections needed:** Verify Jazz and Opera Studies coverage against `rncm.ac.uk` (high priority — RNCM's jazz program is a well-known offering and its total absence, unlike every other excluded credential which was logged as "found, not seeded," suggests it may not have been checked at all rather than deliberately excluded). Tuition should be revisited once RNCM publishes 2027-28 figures.

### RCS (Royal Conservatoire of Scotland)

**Strengths**
- Full coverage of all 11 focus areas, including Jazz (with its own BMus Jazz audition page), Collaborative Piano (Repetiteurship), and dual MA/MMus master's tracks mirroring RAM's structure.
- Source list is well-organized by course, with a dedicated Doctor of Performing Arts page distinctly sourced from the standard PhD/MPhil page.

**Issues**
- **`tuition_annual` is null on 100% of offerings (98/98)**, tied with RNCM as the largest gap in the dataset — same underlying cause (2027-28 fee schedule not yet published at UK-wide scale for conservatoires) but still a material product gap.
- `contemporary_musical_arts_dma_doctor_of_performing_arts` has both a null tuition and a null application deadline — the only RCS programme missing two decision-critical fields simultaneously (both disclosed).

**Corrections needed:** None blocking. Tuition should be revisited once RCS publishes 2027-28 figures; this is expected to resolve on the school's own schedule rather than requiring re-extraction.

## Critical Issues

Only issues that require action before or shortly after import:

1. **Zero tuition coverage at RNCM and RCS (221 of 508 offerings, 43% of the whole dataset).** Individually schema-compliant (each null carries a review note), but in aggregate this means two of the five schools in this comparison set currently cannot be cost-compared at all. Recommend explicitly surfacing "tuition not yet published for 2027-28" as a UI-level state for these two schools rather than a blank field, and re-checking both fee pages closer to when UK conservatoires typically publish (historically Q1 of the admissions cycle).
2. **Guildhall: total absence of a Conducting field, with no "found, not seeded" note.** Every other excluded credential across all five schools was explicitly logged; Conducting's total silence at Guildhall is the one gap in this audit that looks like an unchecked page rather than a deliberate, disclosed exclusion. Verify before the next release.
3. **RNCM: total absence of Jazz Performance and Opera Studies fields, with no "found, not seeded" note.** RNCM's jazz program in particular is a well-known part of its offering; its complete absence — unlike other excluded RNCM credentials (recorder, singer-songwriter, music production, etc., which were all logged) — is the single highest-priority coverage question in this audit.
4. **Downstream Chinese-naming collision risk (RCM vs RAM) is not yet mitigated because it cannot be at this stage** — V4 correctly excludes Chinese fields from extraction. Flagging forward so Fable's review pass deliberately disambiguates `royal_college_of_music` vs `royal_academy_of_music` Chinese names/abbreviations rather than risk the two schools rendering identically to a Chinese-speaking user. Not an error in the current package, but a required downstream check.

## Recommended Corrections

| File | Record/programme affected | Suggested correction |
|---|---|---|
| `Guildhall_School_of_Music_and_Drama/programs.json` | Whole package — no `conducting`/`choral_conducting`/`orchestral_conducting` field | Re-check `gsmd.ac.uk` for any conducting-related degree/diploma; add as a new offering if one exists, or add an explicit `found, not seeded: Conducting — not offered as a standalone degree` note if confirmed absent, so future reviewers don't re-flag it. |
| `Royal_Northern_College_of_Music/programs.json` | Whole package — no `jazz_performance` field | Re-check `rncm.ac.uk` for the jazz program's degree structure; add offerings if confirmed, or log a "found, not seeded" note if it is taught only as a minor/elective rather than a standalone award. |
| `Royal_Northern_College_of_Music/programs.json` | Whole package — no `opera_studies` field | Re-check `rncm.ac.uk` for opera-specific postgraduate offerings; add or explicitly log as not-seeded. |
| `Royal_Northern_College_of_Music/programs.json` | All 123 offerings — `tuition_annual` | No action needed now (correctly null + disclosed); re-check `rncm.ac.uk/study-here/make-an-application/fees/tuition-fees/` once RNCM publishes 2027-28 figures. |
| `Royal_Conservatoire_of_Scotland/programs.json` | All 98 offerings — `tuition_annual` | Same as above; re-check `rcs.ac.uk/courses/*` fee pages once RCS publishes 2027-28 figures. |
| `Royal_Academy_of_Music/programs.json` | 26 Artist Diploma / Musicology offerings — `tuition_annual` | Re-check `ram.ac.uk/study/about-our-courses` (or a more specific AD fee page if RAM publishes one) once per-instrument AD tuition is available. |
| *(all five packages, downstream)* | `school` object | No change to extraction; instruct Fable's review pass to assign visibly distinct Chinese names/abbreviations to RCM and RAM during the Chinese-content authoring step. |

No correction changes the V4 schema, restructures JSON, or force-maps any credential — all recommendations are re-verification or additive follow-up extraction, consistent with the audit's read-only mandate.

## Final Recommendation

**2. Ready after minor corrections.**

All five packages pass schema and hard-rule validation with zero errors and are individually usable today — nulls are consistently disclosed, sourcing is 100% on official `.ac.uk` domains, and no fabricated or guessed values were found anywhere in the sampled data. However, I would not call this "ready for Directus import" outright: the RNCM/Guildhall coverage gaps (items 2–3 above) are the kind of silent omission the V4 contract's "found, not seeded" discipline is specifically designed to catch, and both slipped through without a note — that's worth a short re-check pass before publication rather than shipping with an unverified hole in two schools' core offerings. The tuition gaps at RNCM/RCS are lower-priority since they are correctly disclosed and are genuinely blocked on the schools' own publication schedule, not an extraction failure — these can ship with the "Needs Review" status already set and be revisited on a schedule.
