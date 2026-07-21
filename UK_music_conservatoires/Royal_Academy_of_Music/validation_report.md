# programs V4 Validation Report

Generated: 2026-07-21

## Result

**V4 schema and hard rules: PASS**  
**Hard errors: 0**

## Package counts

| Record type | Count |
|---|---:|
| Program offerings | 96 |
| Current application records | 96 |
| Current audition records | 96 |
| Source records | 742 |
| Decision-critical null fields | 26 |

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

- Degree crosswalk for STAGE review: MA and MMus map to mm; MPhil/PhD maps to dma; Advanced Artist/Opera Diploma maps to ad.
- RCM and Royal Academy of Music are kept separate through school_ref royal_academy_of_music, the official English name, and abbreviation RAM in the supporting documentation.
- found, not seeded: Musical Theatre Performance; Musical Direction and Coaching; Répétiteur; Accordion; Baroque viola; natural horn; cornett; sackbut; theorbo; viola da gamba.
- royal_academy_of_music_bass_trombone_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_bass_trombone_ad: tuition_annual is null
- royal_academy_of_music_bassoon_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_bassoon_ad: tuition_annual is null
- royal_academy_of_music_cello_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_cello_ad: tuition_annual is null
- royal_academy_of_music_choral_conducting_mm: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_choral_conducting_mm: tuition_annual is null
- royal_academy_of_music_clarinet_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_clarinet_ad: tuition_annual is null
- royal_academy_of_music_double_bass_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_double_bass_ad: tuition_annual is null
- royal_academy_of_music_flute_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_flute_ad: tuition_annual is null
- royal_academy_of_music_guitar_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_guitar_ad: tuition_annual is null
- royal_academy_of_music_harp_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_harp_ad: tuition_annual is null
- royal_academy_of_music_harpsichord_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_harpsichord_ad: tuition_annual is null
- royal_academy_of_music_horn_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_horn_ad: tuition_annual is null
- royal_academy_of_music_musicology_dma_phd: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_musicology_dma_phd: application_deadline is null
- royal_academy_of_music_musicology_dma_phd: current 2027-entry application deadline was not verified on https://www.ram.ac.uk/study/about-our-courses; application_deadline left null.
- royal_academy_of_music_musicology_dma_phd: tuition_annual is null
- royal_academy_of_music_oboe_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_oboe_ad: tuition_annual is null
- royal_academy_of_music_opera_studies_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_opera_studies_ad: tuition_annual is null
- royal_academy_of_music_orchestral_conducting_mm: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_orchestral_conducting_mm: tuition_annual is null
- royal_academy_of_music_organ_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_organ_ad: tuition_annual is null
- royal_academy_of_music_percussion_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_percussion_ad: tuition_annual is null
- royal_academy_of_music_piano_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_piano_ad: tuition_annual is null
- royal_academy_of_music_saxophone_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_saxophone_ad: tuition_annual is null
- royal_academy_of_music_tenor_trombone_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_tenor_trombone_ad: tuition_annual is null
- royal_academy_of_music_trumpet_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_trumpet_ad: tuition_annual is null
- royal_academy_of_music_tuba_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_tuba_ad: tuition_annual is null
- royal_academy_of_music_viola_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_viola_ad: tuition_annual is null
- royal_academy_of_music_violin_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_violin_ad: tuition_annual is null
- royal_academy_of_music_voice_ad: 2027-28 tuition was not published on https://www.ram.ac.uk/study/about-our-courses; tuition_annual left null.
- royal_academy_of_music_voice_ad: tuition_annual is null

## Warnings

- royal_academy_of_music_bass_trombone_ad: language_of_instruction is null
- royal_academy_of_music_bass_trombone_bm: language_of_instruction is null
- royal_academy_of_music_bass_trombone_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_bass_trombone_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_bassoon_ad: language_of_instruction is null
- royal_academy_of_music_bassoon_bm: language_of_instruction is null
- royal_academy_of_music_bassoon_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_bassoon_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_cello_ad: language_of_instruction is null
- royal_academy_of_music_cello_bm: language_of_instruction is null
- royal_academy_of_music_cello_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_cello_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_choral_conducting_mm: language_of_instruction is null
- royal_academy_of_music_clarinet_ad: language_of_instruction is null
- royal_academy_of_music_clarinet_bm: language_of_instruction is null
- royal_academy_of_music_clarinet_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_clarinet_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_collaborative_piano_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_collaborative_piano_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_composition_bm: language_of_instruction is null
- royal_academy_of_music_composition_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_composition_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_double_bass_ad: language_of_instruction is null
- royal_academy_of_music_double_bass_bm: language_of_instruction is null
- royal_academy_of_music_double_bass_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_double_bass_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_flute_ad: language_of_instruction is null
- royal_academy_of_music_flute_bm: language_of_instruction is null
- royal_academy_of_music_flute_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_flute_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_guitar_ad: language_of_instruction is null
- royal_academy_of_music_guitar_bm: language_of_instruction is null
- royal_academy_of_music_guitar_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_guitar_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_harp_ad: language_of_instruction is null
- royal_academy_of_music_harp_bm: language_of_instruction is null
- royal_academy_of_music_harp_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_harp_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_harpsichord_ad: language_of_instruction is null
- royal_academy_of_music_harpsichord_bm: language_of_instruction is null
- royal_academy_of_music_harpsichord_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_harpsichord_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_horn_ad: language_of_instruction is null
- royal_academy_of_music_horn_bm: language_of_instruction is null
- royal_academy_of_music_horn_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_horn_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_jazz_performance_bm: language_of_instruction is null
- royal_academy_of_music_jazz_performance_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_jazz_performance_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_musicology_dma_phd: language_of_instruction is null
- royal_academy_of_music_oboe_ad: language_of_instruction is null
- royal_academy_of_music_oboe_bm: language_of_instruction is null
- royal_academy_of_music_oboe_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_oboe_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_opera_studies_ad: language_of_instruction is null
- royal_academy_of_music_orchestral_conducting_mm: language_of_instruction is null
- royal_academy_of_music_organ_ad: language_of_instruction is null
- royal_academy_of_music_organ_bm: language_of_instruction is null
- royal_academy_of_music_organ_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_organ_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_percussion_ad: language_of_instruction is null
- royal_academy_of_music_percussion_bm: language_of_instruction is null
- royal_academy_of_music_percussion_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_percussion_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_piano_ad: language_of_instruction is null
- royal_academy_of_music_piano_bm: language_of_instruction is null
- royal_academy_of_music_piano_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_piano_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_saxophone_ad: language_of_instruction is null
- royal_academy_of_music_saxophone_bm: language_of_instruction is null
- royal_academy_of_music_saxophone_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_saxophone_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_tenor_trombone_ad: language_of_instruction is null
- royal_academy_of_music_tenor_trombone_bm: language_of_instruction is null
- royal_academy_of_music_tenor_trombone_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_tenor_trombone_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_trumpet_ad: language_of_instruction is null
- royal_academy_of_music_trumpet_bm: language_of_instruction is null
- royal_academy_of_music_trumpet_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_trumpet_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_tuba_ad: language_of_instruction is null
- royal_academy_of_music_tuba_bm: language_of_instruction is null
- royal_academy_of_music_tuba_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_tuba_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_viola_ad: language_of_instruction is null
- royal_academy_of_music_viola_bm: language_of_instruction is null
- royal_academy_of_music_viola_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_viola_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_violin_ad: language_of_instruction is null
- royal_academy_of_music_violin_bm: language_of_instruction is null
- royal_academy_of_music_violin_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_violin_mm_master_of_music: language_of_instruction is null
- royal_academy_of_music_voice_ad: language_of_instruction is null
- royal_academy_of_music_voice_bm: language_of_instruction is null
- royal_academy_of_music_voice_mm_master_of_arts: language_of_instruction is null
- royal_academy_of_music_voice_mm_master_of_music: language_of_instruction is null

## Final assessment

The package is schema-valid and mechanically complete for all V4-representable seeded-field offerings. It remains intentionally unreviewed and not ready for Directus import; named needs-attention items require the independent review pass.
