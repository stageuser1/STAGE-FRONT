# colburn.v4 V4 Validation Report

Generated: 2026-07-21

## Result

**V4 schema and hard rules: PASS**  
**Hard errors: 0**

## Package counts

| Record type | Count |
|---|---:|
| Program offerings | 51 |
| Current application records | 51 |
| Current audition records | 51 |
| Source records | 368 |
| Decision-critical null fields | 51 |

## Hard-rule coverage

- JSON Schema Draft 2020-12 compatibility
- Seeded field and degree vocabularies
- Deterministic refs and duplicate detection
- One current application and audition record per offering
- Prohibited/legacy fields and Directus IDs
- Official-domain and source natural-key checks
- Required evidence quotes for deadline, tuition, English minimums, prescreen, audition, and repertoire
- Material-name constraints and explicit critical-null review notes

## Hard failures

- None

## Needs attention

- Current studio openings change by admission cycle; an offered program can be temporarily closed to applications.
- The latest official tuition page is labeled 2025-26, so current-cycle tuition remains null.
- The live application and audition pages still publish the Fall 2026 cycle; all records remain Needs Review until Fall 2027 requirements appear.
- colburn_bass_trombone_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bass_trombone_ad: tuition_annual is null
- colburn_bass_trombone_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bass_trombone_bm: tuition_annual is null
- colburn_bass_trombone_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bass_trombone_mm: tuition_annual is null
- colburn_bassoon_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bassoon_ad: tuition_annual is null
- colburn_bassoon_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bassoon_bm: tuition_annual is null
- colburn_bassoon_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_bassoon_mm: tuition_annual is null
- colburn_cello_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_cello_ad: tuition_annual is null
- colburn_cello_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_cello_bm: tuition_annual is null
- colburn_cello_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_cello_mm: tuition_annual is null
- colburn_chamber_music_ad_graduate_chamber_ensemble_in_residence: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_chamber_music_ad_graduate_chamber_ensemble_in_residence: tuition_annual is null
- colburn_chamber_music_mm_graduate_chamber_ensemble_in_residence: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_chamber_music_mm_graduate_chamber_ensemble_in_residence: tuition_annual is null
- colburn_clarinet_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_clarinet_ad: tuition_annual is null
- colburn_clarinet_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_clarinet_bm: tuition_annual is null
- colburn_clarinet_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_clarinet_mm: tuition_annual is null
- colburn_double_bass_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_double_bass_ad: tuition_annual is null
- colburn_double_bass_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_double_bass_bm: tuition_annual is null
- colburn_double_bass_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_double_bass_mm: tuition_annual is null
- colburn_flute_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_flute_ad: tuition_annual is null
- colburn_flute_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_flute_bm: tuition_annual is null
- colburn_flute_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_flute_mm: tuition_annual is null
- colburn_harp_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_harp_ad: tuition_annual is null
- colburn_harp_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_harp_bm: tuition_annual is null
- colburn_harp_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_harp_mm: tuition_annual is null
- colburn_horn_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_horn_ad: tuition_annual is null
- colburn_horn_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_horn_bm: tuition_annual is null
- colburn_horn_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_horn_mm: tuition_annual is null
- colburn_oboe_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_oboe_ad: tuition_annual is null
- colburn_oboe_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_oboe_bm: tuition_annual is null
- colburn_oboe_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_oboe_mm: tuition_annual is null
- colburn_orchestral_conducting_ad_salonen_conducting_fellows: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_orchestral_conducting_ad_salonen_conducting_fellows: tuition_annual is null
- colburn_percussion_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_percussion_ad: tuition_annual is null
- colburn_percussion_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_percussion_bm: tuition_annual is null
- colburn_percussion_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_percussion_mm: tuition_annual is null
- colburn_piano_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_piano_ad: tuition_annual is null
- colburn_piano_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_piano_bm: tuition_annual is null
- colburn_piano_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_piano_mm: tuition_annual is null
- colburn_tenor_trombone_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tenor_trombone_ad: tuition_annual is null
- colburn_tenor_trombone_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tenor_trombone_bm: tuition_annual is null
- colburn_tenor_trombone_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tenor_trombone_mm: tuition_annual is null
- colburn_trumpet_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_trumpet_ad: tuition_annual is null
- colburn_trumpet_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_trumpet_bm: tuition_annual is null
- colburn_trumpet_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_trumpet_mm: tuition_annual is null
- colburn_tuba_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tuba_ad: tuition_annual is null
- colburn_tuba_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tuba_bm: tuition_annual is null
- colburn_tuba_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_tuba_mm: tuition_annual is null
- colburn_viola_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_viola_ad: tuition_annual is null
- colburn_viola_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_viola_bm: tuition_annual is null
- colburn_viola_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_viola_mm: tuition_annual is null
- colburn_violin_ad: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_violin_ad: tuition_annual is null
- colburn_violin_bm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_violin_bm: tuition_annual is null
- colburn_violin_mm: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.
- colburn_violin_mm: tuition_annual is null
- found, not representable by unchanged degree enum: Conducting Diploma — Conducting.
- found, not representable by unchanged degree enum: Performance Diploma (PD) — bassoon, cello, clarinet, double_bass, flute, harp, horn, oboe, percussion, piano, bass_trombone, tenor_trombone, trumpet, tuba, viola, violin.
- found, not representable by unchanged degree enum: Professional Studies Certificate (PSC) — bassoon, cello, clarinet, double_bass, flute, harp, horn, oboe, percussion, piano, bass_trombone, tenor_trombone, trumpet, tuba, viola, violin.

## Warnings

- colburn_bass_trombone_ad: duration_years is null
- colburn_bass_trombone_ad: language_of_instruction is null
- colburn_bass_trombone_bm: duration_years is null
- colburn_bass_trombone_bm: language_of_instruction is null
- colburn_bass_trombone_mm: duration_years is null
- colburn_bass_trombone_mm: language_of_instruction is null
- colburn_bassoon_ad: duration_years is null
- colburn_bassoon_ad: language_of_instruction is null
- colburn_bassoon_bm: duration_years is null
- colburn_bassoon_bm: language_of_instruction is null
- colburn_bassoon_mm: duration_years is null
- colburn_bassoon_mm: language_of_instruction is null
- colburn_cello_ad: duration_years is null
- colburn_cello_ad: language_of_instruction is null
- colburn_cello_bm: language_of_instruction is null
- colburn_cello_mm: language_of_instruction is null
- colburn_chamber_music_ad_graduate_chamber_ensemble_in_residence: duration_years is null
- colburn_chamber_music_ad_graduate_chamber_ensemble_in_residence: language_of_instruction is null
- colburn_chamber_music_mm_graduate_chamber_ensemble_in_residence: duration_years is null
- colburn_chamber_music_mm_graduate_chamber_ensemble_in_residence: language_of_instruction is null
- colburn_clarinet_ad: duration_years is null
- colburn_clarinet_ad: language_of_instruction is null
- colburn_clarinet_bm: duration_years is null
- colburn_clarinet_bm: language_of_instruction is null
- colburn_clarinet_mm: duration_years is null
- colburn_clarinet_mm: language_of_instruction is null
- colburn_double_bass_ad: duration_years is null
- colburn_double_bass_ad: language_of_instruction is null
- colburn_double_bass_bm: duration_years is null
- colburn_double_bass_bm: language_of_instruction is null
- colburn_double_bass_mm: duration_years is null
- colburn_double_bass_mm: language_of_instruction is null
- colburn_flute_ad: duration_years is null
- colburn_flute_ad: language_of_instruction is null
- colburn_flute_bm: duration_years is null
- colburn_flute_bm: language_of_instruction is null
- colburn_flute_mm: duration_years is null
- colburn_flute_mm: language_of_instruction is null
- colburn_harp_ad: duration_years is null
- colburn_harp_ad: language_of_instruction is null
- colburn_harp_bm: duration_years is null
- colburn_harp_bm: language_of_instruction is null
- colburn_harp_mm: duration_years is null
- colburn_harp_mm: language_of_instruction is null
- colburn_horn_ad: duration_years is null
- colburn_horn_ad: language_of_instruction is null
- colburn_horn_bm: duration_years is null
- colburn_horn_bm: language_of_instruction is null
- colburn_horn_mm: duration_years is null
- colburn_horn_mm: language_of_instruction is null
- colburn_oboe_ad: duration_years is null
- colburn_oboe_ad: language_of_instruction is null
- colburn_oboe_bm: duration_years is null
- colburn_oboe_bm: language_of_instruction is null
- colburn_oboe_mm: duration_years is null
- colburn_oboe_mm: language_of_instruction is null
- colburn_orchestral_conducting_ad_salonen_conducting_fellows: duration_years is null
- colburn_orchestral_conducting_ad_salonen_conducting_fellows: language_of_instruction is null
- colburn_percussion_ad: duration_years is null
- colburn_percussion_ad: language_of_instruction is null
- colburn_percussion_bm: duration_years is null
- colburn_percussion_bm: language_of_instruction is null
- colburn_percussion_mm: duration_years is null
- colburn_percussion_mm: language_of_instruction is null
- colburn_piano_ad: duration_years is null
- colburn_piano_ad: language_of_instruction is null
- colburn_piano_bm: language_of_instruction is null
- colburn_piano_mm: language_of_instruction is null
- colburn_tenor_trombone_ad: duration_years is null
- colburn_tenor_trombone_ad: language_of_instruction is null
- colburn_tenor_trombone_bm: duration_years is null
- colburn_tenor_trombone_bm: language_of_instruction is null
- colburn_tenor_trombone_mm: duration_years is null
- colburn_tenor_trombone_mm: language_of_instruction is null
- colburn_trumpet_ad: duration_years is null
- colburn_trumpet_ad: language_of_instruction is null
- colburn_trumpet_bm: duration_years is null
- colburn_trumpet_bm: language_of_instruction is null
- colburn_trumpet_mm: duration_years is null
- colburn_trumpet_mm: language_of_instruction is null
- colburn_tuba_ad: duration_years is null
- colburn_tuba_ad: language_of_instruction is null
- colburn_tuba_bm: duration_years is null
- colburn_tuba_bm: language_of_instruction is null
- colburn_tuba_mm: duration_years is null
- colburn_tuba_mm: language_of_instruction is null
- colburn_viola_ad: duration_years is null
- colburn_viola_ad: language_of_instruction is null
- colburn_viola_bm: duration_years is null
- colburn_viola_bm: language_of_instruction is null
- colburn_viola_mm: duration_years is null
- colburn_viola_mm: language_of_instruction is null
- colburn_violin_ad: duration_years is null
- colburn_violin_ad: language_of_instruction is null
- colburn_violin_bm: language_of_instruction is null
- colburn_violin_mm: language_of_instruction is null

## Final assessment

The package is schema-valid and mechanically complete for all V4-representable seeded-field offerings. It remains intentionally unreviewed and not ready for Directus import; named needs-attention items require the independent review pass.
