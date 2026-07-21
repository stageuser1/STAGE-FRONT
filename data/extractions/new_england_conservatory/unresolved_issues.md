# Unresolved Issues

Checked: 2026-07-21

## Current-cycle and interpretation issues

- The recurring December 1 deadline is mapped to 2026-12-01 for Fall 2027; all records remain Needs Review.
- The latest published tuition is for 2026-27, so 2027-28 tuition remains null.
- Graduate Performance Certificate and undergraduate diploma/certificate combinations are fully inventoried but cannot enter program_offerings under the unchanged degree enum.

## Official credentials outside the unchanged V4 degree enum

- **Undergraduate Diploma** — Instrumental Performance, Vocal Performance, Composition. degree_level_ref does not include the undergraduate diploma.
- **Undergraduate Performance Certificate** — Instrument/Area of Study. degree_level_ref does not include the certificate.
- **Graduate Performance Certificate** — All published MM/GD audition areas. degree_level_ref does not include GPC.
- **Harvard/NEC and Holy Cross dual-degree pathways** — Eligible NEC MM fields. cross-institutional combined pathways are not one atomic V4 credential.

No unsupported credential was force-mapped. The authoritative JSON remains limited to degree_level_ref values BM, MM, DMA, GD, and AD, while program_matrix.md preserves the complete institutional inventory.
