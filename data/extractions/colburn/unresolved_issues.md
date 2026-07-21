# Unresolved Issues

Checked: 2026-07-21

## Current-cycle and interpretation issues

- The live application and audition pages still publish the Fall 2026 cycle; all records remain Needs Review until Fall 2027 requirements appear.
- The latest official tuition page is labeled 2025-26, so current-cycle tuition remains null.
- Current studio openings change by admission cycle; an offered program can be temporarily closed to applications.

## Official credentials outside the unchanged V4 degree enum

- **Performance Diploma (PD)** — bassoon, cello, clarinet, double_bass, flute, harp, horn, oboe, percussion, piano, bass_trombone, tenor_trombone, trumpet, tuba, viola, violin. degree_level_ref does not include PD.
- **Professional Studies Certificate (PSC)** — bassoon, cello, clarinet, double_bass, flute, harp, horn, oboe, percussion, piano, bass_trombone, tenor_trombone, trumpet, tuba, viola, violin. degree_level_ref does not include PSC.
- **Conducting Diploma** — Conducting. degree_level_ref does not include this diploma.

No unsupported credential was force-mapped. The authoritative JSON remains limited to degree_level_ref values BM, MM, DMA, GD, and AD, while program_matrix.md preserves the complete institutional inventory.
