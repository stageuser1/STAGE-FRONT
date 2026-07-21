# curtis.v4 V4 Validation Report

Generated: 2026-07-21

## Result

**V4 schema and hard rules: PASS**  
**Hard errors: 0**

## Package counts

| Record type | Count |
|---|---:|
| Program offerings | 38 |
| Current application records | 38 |
| Current audition records | 38 |
| Source records | 233 |
| Decision-critical null fields | 70 |

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

- Bachelor and master durations are published as ranges or with conflicting overview language, so duration_years remains null.
- Curtis has not yet posted the exact Fall 2027 application and prescreen deadline; those fields remain null.
- Curtis publishes English-entry score ranges; V4 stores the lower published bound and retains a review note.
- curtis_bass_bm: application_deadline is null
- curtis_bass_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_bass_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_bass_bm: prescreening_deadline is null
- curtis_bass_mm: application_deadline is null
- curtis_bass_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_bass_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_bass_mm: prescreening_deadline is null
- curtis_bass_trombone_bm: application_deadline is null
- curtis_bass_trombone_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_bass_trombone_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_bass_trombone_bm: prescreening_deadline is null
- curtis_bassoon_bm: application_deadline is null
- curtis_bassoon_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_bassoon_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_bassoon_bm: prescreening_deadline is null
- curtis_bassoon_mm: application_deadline is null
- curtis_bassoon_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_bassoon_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_bassoon_mm: prescreening_deadline is null
- curtis_cello_bm: application_deadline is null
- curtis_cello_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_cello_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_cello_bm: prescreening_deadline is null
- curtis_cello_mm: application_deadline is null
- curtis_cello_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_cello_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_cello_mm: prescreening_deadline is null
- curtis_clarinet_bm: application_deadline is null
- curtis_clarinet_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_clarinet_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_clarinet_bm: prescreening_deadline is null
- curtis_clarinet_mm: application_deadline is null
- curtis_clarinet_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_clarinet_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_clarinet_mm: prescreening_deadline is null
- curtis_composition_bm: application_deadline is null
- curtis_composition_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_composition_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_composition_bm: prescreening_deadline is null
- curtis_composition_mm: application_deadline is null
- curtis_composition_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_composition_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_composition_mm: prescreening_deadline is null
- curtis_flute_bm: application_deadline is null
- curtis_flute_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_flute_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_flute_bm: prescreening_deadline is null
- curtis_guitar_bm: application_deadline is null
- curtis_guitar_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_guitar_mm: application_deadline is null
- curtis_guitar_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_harp_bm: application_deadline is null
- curtis_harp_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_harp_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_harp_bm: prescreening_deadline is null
- curtis_harp_mm: application_deadline is null
- curtis_harp_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_harp_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_harp_mm: prescreening_deadline is null
- curtis_horn_bm: application_deadline is null
- curtis_horn_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_horn_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_horn_bm: prescreening_deadline is null
- curtis_horn_mm: application_deadline is null
- curtis_horn_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_horn_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_horn_mm: prescreening_deadline is null
- curtis_oboe_bm: application_deadline is null
- curtis_oboe_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_oboe_mm: application_deadline is null
- curtis_oboe_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_opera_studies_mm: application_deadline is null
- curtis_opera_studies_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_opera_studies_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_opera_studies_mm: prescreening_deadline is null
- curtis_organ_bm: application_deadline is null
- curtis_organ_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_organ_mm: application_deadline is null
- curtis_organ_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_percussion_bm: application_deadline is null
- curtis_percussion_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_percussion_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_percussion_bm: prescreening_deadline is null
- curtis_percussion_mm: application_deadline is null
- curtis_percussion_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_percussion_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_percussion_mm: prescreening_deadline is null
- curtis_piano_bm: application_deadline is null
- curtis_piano_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_piano_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_piano_bm: prescreening_deadline is null
- curtis_piano_mm: application_deadline is null
- curtis_piano_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_piano_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_piano_mm: prescreening_deadline is null
- curtis_tenor_trombone_bm: application_deadline is null
- curtis_tenor_trombone_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_tenor_trombone_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_tenor_trombone_bm: prescreening_deadline is null
- curtis_tenor_trombone_mm: application_deadline is null
- curtis_tenor_trombone_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_tenor_trombone_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_tenor_trombone_mm: prescreening_deadline is null
- curtis_trumpet_bm: application_deadline is null
- curtis_trumpet_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_trumpet_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_trumpet_bm: prescreening_deadline is null
- curtis_trumpet_mm: application_deadline is null
- curtis_trumpet_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_trumpet_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_trumpet_mm: prescreening_deadline is null
- curtis_tuba_bm: application_deadline is null
- curtis_tuba_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_tuba_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_tuba_bm: prescreening_deadline is null
- curtis_tuba_mm: application_deadline is null
- curtis_tuba_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_tuba_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_tuba_mm: prescreening_deadline is null
- curtis_viola_bm: application_deadline is null
- curtis_viola_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_viola_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_viola_bm: prescreening_deadline is null
- curtis_viola_mm: application_deadline is null
- curtis_viola_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_viola_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_viola_mm: prescreening_deadline is null
- curtis_violin_bm: application_deadline is null
- curtis_violin_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_violin_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_violin_bm: prescreening_deadline is null
- curtis_violin_mm: application_deadline is null
- curtis_violin_mm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_violin_mm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_violin_mm: prescreening_deadline is null
- curtis_voice_bm: application_deadline is null
- curtis_voice_bm: exact current-cycle application deadline is not published; application_deadline left null.
- curtis_voice_bm: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.
- curtis_voice_bm: prescreening_deadline is null
- found, not representable by unchanged degree enum: Diploma — bass, bass_trombone, bassoon, cello, clarinet, composition, flute, guitar, harp, horn, oboe, organ, percussion, piano, tenor_trombone, trumpet, tuba, viola, violin, voice.
- found, not representable by unchanged degree enum: Post-Baccalaureate Diploma — Bass, Bassoon, Cello, Clarinet, Composition, Conducting, Guitar, Harp, Horn, Oboe, Opera, Organ, Percussion, Piano, String Quartet, Trombone, Trumpet, Tuba, Viola, Violin.
- found, not representable by unchanged degree enum: Professional Studies Certificate — Opera.

## Warnings

- curtis_bass_bm: duration_years is null
- curtis_bass_bm: language_of_instruction is null
- curtis_bass_mm: duration_years is null
- curtis_bass_mm: language_of_instruction is null
- curtis_bass_trombone_bm: duration_years is null
- curtis_bass_trombone_bm: language_of_instruction is null
- curtis_bassoon_bm: duration_years is null
- curtis_bassoon_bm: language_of_instruction is null
- curtis_bassoon_mm: duration_years is null
- curtis_bassoon_mm: language_of_instruction is null
- curtis_cello_bm: duration_years is null
- curtis_cello_bm: language_of_instruction is null
- curtis_cello_mm: duration_years is null
- curtis_cello_mm: language_of_instruction is null
- curtis_clarinet_bm: duration_years is null
- curtis_clarinet_bm: language_of_instruction is null
- curtis_clarinet_mm: duration_years is null
- curtis_clarinet_mm: language_of_instruction is null
- curtis_composition_bm: duration_years is null
- curtis_composition_bm: language_of_instruction is null
- curtis_composition_mm: duration_years is null
- curtis_composition_mm: language_of_instruction is null
- curtis_flute_bm: duration_years is null
- curtis_flute_bm: language_of_instruction is null
- curtis_guitar_bm: duration_years is null
- curtis_guitar_bm: language_of_instruction is null
- curtis_guitar_mm: duration_years is null
- curtis_guitar_mm: language_of_instruction is null
- curtis_harp_bm: duration_years is null
- curtis_harp_bm: language_of_instruction is null
- curtis_harp_mm: duration_years is null
- curtis_harp_mm: language_of_instruction is null
- curtis_horn_bm: duration_years is null
- curtis_horn_bm: language_of_instruction is null
- curtis_horn_mm: duration_years is null
- curtis_horn_mm: language_of_instruction is null
- curtis_oboe_bm: duration_years is null
- curtis_oboe_bm: language_of_instruction is null
- curtis_oboe_mm: duration_years is null
- curtis_oboe_mm: language_of_instruction is null
- curtis_opera_studies_mm: duration_years is null
- curtis_opera_studies_mm: language_of_instruction is null
- curtis_organ_bm: duration_years is null
- curtis_organ_bm: language_of_instruction is null
- curtis_organ_mm: duration_years is null
- curtis_organ_mm: language_of_instruction is null
- curtis_percussion_bm: duration_years is null
- curtis_percussion_bm: language_of_instruction is null
- curtis_percussion_mm: duration_years is null
- curtis_percussion_mm: language_of_instruction is null
- curtis_piano_bm: duration_years is null
- curtis_piano_bm: language_of_instruction is null
- curtis_piano_mm: duration_years is null
- curtis_piano_mm: language_of_instruction is null
- curtis_tenor_trombone_bm: duration_years is null
- curtis_tenor_trombone_bm: language_of_instruction is null
- curtis_tenor_trombone_mm: duration_years is null
- curtis_tenor_trombone_mm: language_of_instruction is null
- curtis_trumpet_bm: duration_years is null
- curtis_trumpet_bm: language_of_instruction is null
- curtis_trumpet_mm: duration_years is null
- curtis_trumpet_mm: language_of_instruction is null
- curtis_tuba_bm: duration_years is null
- curtis_tuba_bm: language_of_instruction is null
- curtis_tuba_mm: duration_years is null
- curtis_tuba_mm: language_of_instruction is null
- curtis_viola_bm: duration_years is null
- curtis_viola_bm: language_of_instruction is null
- curtis_viola_mm: duration_years is null
- curtis_viola_mm: language_of_instruction is null
- curtis_violin_bm: duration_years is null
- curtis_violin_bm: language_of_instruction is null
- curtis_violin_mm: duration_years is null
- curtis_violin_mm: language_of_instruction is null
- curtis_voice_bm: duration_years is null
- curtis_voice_bm: language_of_instruction is null

## Final assessment

The package is schema-valid and mechanically complete for all V4-representable seeded-field offerings. It remains intentionally unreviewed and not ready for Directus import; named needs-attention items require the independent review pass.
