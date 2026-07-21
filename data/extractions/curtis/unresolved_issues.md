# Unresolved Issues

Checked: 2026-07-21

## Current-cycle and interpretation issues

- Curtis has not yet posted the exact Fall 2027 application and prescreen deadline; those fields remain null.
- Curtis publishes English-entry score ranges; V4 stores the lower published bound and retains a review note.
- Bachelor and master durations are published as ranges or with conflicting overview language, so duration_years remains null.

## Official credentials outside the unchanged V4 degree enum

- **Diploma** — bass, bass_trombone, bassoon, cello, clarinet, composition, flute, guitar, harp, horn, oboe, organ, percussion, piano, tenor_trombone, trumpet, tuba, viola, violin, voice. degree_level_ref does not include the Curtis Diploma.
- **Post-Baccalaureate Diploma** — Bass, Bassoon, Cello, Clarinet, Composition, Conducting, Guitar, Harp, Horn, Oboe, Opera, Organ, Percussion, Piano, String Quartet, Trombone, Trumpet, Tuba, Viola, Violin. degree_level_ref does not include PBD.
- **Professional Studies Certificate** — Opera. degree_level_ref does not include PSC.

No unsupported credential was force-mapped. The authoritative JSON remains limited to degree_level_ref values BM, MM, DMA, GD, and AD, while program_matrix.md preserves the complete institutional inventory.
