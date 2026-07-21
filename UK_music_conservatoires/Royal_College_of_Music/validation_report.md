# programs V4 Validation Report

Generated: 2026-07-21

## Result

**V4 schema and hard rules: PASS**  
**Hard errors: 0**

## Package counts

| Record type | Count |
|---|---:|
| Program offerings | 95 |
| Current application records | 95 |
| Current audition records | 95 |
| Source records | 760 |
| Decision-critical null fields | 0 |

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

- Degree crosswalk for STAGE review: MPerf, MComp and MMus map to mm; PhD maps to dma; GradDip maps to gd; Artist Diploma maps to ad.
- RCM and Royal Academy of Music are kept separate through school_ref royal_college_of_music, the official English name, and abbreviation RCM in the supporting documentation.
- found, not seeded: Master of Science in Performance Science; Master of Education; Master of Music Education; marimba principal study; recorder; fortepiano; viola da gamba; lute; historical-instrument variants.

## Warnings

- royal_college_of_music_bass_trombone_ad: language_of_instruction is null
- royal_college_of_music_bass_trombone_bm: language_of_instruction is null
- royal_college_of_music_bass_trombone_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_bass_trombone_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_bassoon_ad: language_of_instruction is null
- royal_college_of_music_bassoon_bm: language_of_instruction is null
- royal_college_of_music_bassoon_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_bassoon_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_cello_ad: language_of_instruction is null
- royal_college_of_music_cello_bm: language_of_instruction is null
- royal_college_of_music_cello_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_cello_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_clarinet_ad: language_of_instruction is null
- royal_college_of_music_clarinet_bm: language_of_instruction is null
- royal_college_of_music_clarinet_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_clarinet_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_composition_ad: language_of_instruction is null
- royal_college_of_music_composition_bm: language_of_instruction is null
- royal_college_of_music_composition_mm_master_of_composition: language_of_instruction is null
- royal_college_of_music_composition_mm_master_of_music_in_composition: language_of_instruction is null
- royal_college_of_music_contemporary_media_film_composition_mm: language_of_instruction is null
- royal_college_of_music_double_bass_ad: language_of_instruction is null
- royal_college_of_music_double_bass_bm: language_of_instruction is null
- royal_college_of_music_double_bass_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_double_bass_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_flute_ad: language_of_instruction is null
- royal_college_of_music_flute_bm: language_of_instruction is null
- royal_college_of_music_flute_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_flute_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_guitar_ad: language_of_instruction is null
- royal_college_of_music_guitar_bm: language_of_instruction is null
- royal_college_of_music_guitar_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_guitar_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_harp_ad: language_of_instruction is null
- royal_college_of_music_harp_bm: language_of_instruction is null
- royal_college_of_music_harp_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_harp_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_harpsichord_ad: language_of_instruction is null
- royal_college_of_music_harpsichord_bm: language_of_instruction is null
- royal_college_of_music_harpsichord_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_harpsichord_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_horn_ad: language_of_instruction is null
- royal_college_of_music_horn_bm: language_of_instruction is null
- royal_college_of_music_horn_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_horn_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_musicology_dma_doctor_of_philosophy: language_of_instruction is null
- royal_college_of_music_oboe_ad: language_of_instruction is null
- royal_college_of_music_oboe_bm: language_of_instruction is null
- royal_college_of_music_oboe_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_oboe_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_opera_studies_ad: language_of_instruction is null
- royal_college_of_music_orchestral_conducting_ad: language_of_instruction is null
- royal_college_of_music_orchestral_conducting_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_orchestral_conducting_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_organ_ad: language_of_instruction is null
- royal_college_of_music_organ_bm: language_of_instruction is null
- royal_college_of_music_organ_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_organ_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_percussion_ad: language_of_instruction is null
- royal_college_of_music_percussion_bm: language_of_instruction is null
- royal_college_of_music_percussion_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_percussion_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_piano_ad: language_of_instruction is null
- royal_college_of_music_piano_bm: language_of_instruction is null
- royal_college_of_music_piano_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_piano_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_saxophone_ad: language_of_instruction is null
- royal_college_of_music_saxophone_bm: language_of_instruction is null
- royal_college_of_music_saxophone_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_saxophone_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_tenor_trombone_ad: language_of_instruction is null
- royal_college_of_music_tenor_trombone_bm: language_of_instruction is null
- royal_college_of_music_tenor_trombone_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_tenor_trombone_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_trumpet_ad: language_of_instruction is null
- royal_college_of_music_trumpet_bm: language_of_instruction is null
- royal_college_of_music_trumpet_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_trumpet_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_tuba_ad: language_of_instruction is null
- royal_college_of_music_tuba_bm: language_of_instruction is null
- royal_college_of_music_tuba_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_tuba_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_viola_ad: language_of_instruction is null
- royal_college_of_music_viola_bm: language_of_instruction is null
- royal_college_of_music_viola_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_viola_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_violin_ad: language_of_instruction is null
- royal_college_of_music_violin_bm: language_of_instruction is null
- royal_college_of_music_violin_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_violin_mm_master_of_performance: language_of_instruction is null
- royal_college_of_music_voice_ad: language_of_instruction is null
- royal_college_of_music_voice_bm: language_of_instruction is null
- royal_college_of_music_voice_gd: language_of_instruction is null
- royal_college_of_music_voice_mm_master_of_music_in_performance: language_of_instruction is null
- royal_college_of_music_voice_mm_master_of_performance: language_of_instruction is null

## Final assessment

The package is schema-valid and mechanically complete for all V4-representable seeded-field offerings. It remains intentionally unreviewed and not ready for Directus import; named needs-attention items require the independent review pass.
