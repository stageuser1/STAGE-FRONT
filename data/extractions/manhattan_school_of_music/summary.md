# Manhattan School of Music — Fresh V4 Extraction Summary

Retrieved and checked: 2026-07-21  
Official entry point: https://www.msmnyc.edu/admission/  
Admission cycle represented: 2026–2027

## Outcome

The fresh extraction contains **170 confirmed, V4-representable program combinations**. It was rebuilt from the live official MSM site rather than patched from the previous package or derived from the unresolved audit.

The authoritative JSON passes the V4 JSON Schema with zero hard errors. Every included offering has exactly one current application record and one current audition record.

## Confirmed V4 matrix

| Credential | Count |
|---|---:|
| BM | 41 |
| MM | 79 |
| DMA | 27 |
| AD | 23 |
| **Total** | **170** |

| Division / track | BM | MM | DMA | AD | Total |
|---|---:|---:|---:|---:|---:|
| Classical | 20 | 23 | 22 | 19 | 84 |
| Classical – Vocal Specialization | 0 | 0 | 1 | 1 | 2 |
| Classical – Instrumental Specialization | 0 | 0 | 1 | 1 | 2 |
| Jazz Arts | 18 | 20 | 1 | 0 | 39 |
| Orchestral Performance | 0 | 15 | 0 | 0 | 15 |
| Contemporary Performance | 0 | 19 | 0 | 0 | 19 |
| Pinchas Zukerman Performance Program | 2 | 2 | 2 | 2 | 8 |
| Musical Theatre | 1 | 0 | 0 | 0 | 1 |
| **Total** | **41** | **79** | **27** | **23** | **170** |

Collaborative Piano DMA and AD are each split into the official Vocal and Instrumental specializations. Jazz doctoral study is represented as the dedicated current `Jazz Arts Advancement` DMA rather than stale instrument-level DMA labels on the general doctoral landing page.

## Shared current-cycle facts

- Priority application deadline: 2025-12-01
- 2026–2027 annual tuition: USD 60,800
- Institutional scholarships: available; admitted auditioning students are automatically considered
- English test: Duolingo only; TOEFL and IELTS are not accepted; MSM states no minimum score is required to apply
- Application materials are stored as concise names only
- BM auditions may be live or recorded; most MM auditions may be live or recorded; DMA and AD auditions are live, with official program exceptions applied

## Confirmed official offerings that V4 cannot encode

These are not unresolved-audit carryovers. They were found again on current official MSM pages and intentionally kept out of `program_offerings` because `degree_level_ref` only permits `bm`, `mm`, `dma`, `gd`, and `ad`.

### Professional Studies — 41 combinations

- Classical (24): Bass Trombone, Bassoon, Cello, Clarinet, Composition, Double Bass, Flute, Guitar, Harp, Horn, Oboe, Percussion, Piano, Saxophone, Tenor Trombone, Trumpet, Tuba, Viola, Violin, Voice, Orchestral Conducting, Organ, Collaborative Piano – Vocal Specialization, Collaborative Piano – Instrumental Specialization
- Orchestral Performance (15): Bass Trombone, Bassoon, Cello, Clarinet, Double Bass, Flute, Harp, Horn, Oboe, Percussion, Tenor Trombone, Trumpet, Tuba, Viola, Violin
- Pinchas Zukerman Performance Program (2): Violin, Viola

Official sources:

- https://www.msmnyc.edu/admission/postgraduate-studies/
- https://www.msmnyc.edu/programs/collaborative-piano/
- https://www.msmnyc.edu/programs/orchestral-performance/
- https://www.msmnyc.edu/programs/other-academics/pinchas-zukerman/

### Professional Performance Diploma — 39 combinations

- Classical (22): Bass Trombone, Bassoon, Cello, Clarinet, Double Bass, Flute, Guitar, Harp, Horn, Oboe, Organ, Percussion, Piano, Saxophone, Tenor Trombone, Trumpet, Tuba, Viola, Violin, Voice, Collaborative Piano – Vocal Specialization, Collaborative Piano – Instrumental Specialization
- Orchestral Performance (15): Bass Trombone, Bassoon, Cello, Clarinet, Double Bass, Flute, Harp, Horn, Oboe, Percussion, Tenor Trombone, Trumpet, Tuba, Viola, Violin
- Pinchas Zukerman Performance Program (2): Violin, Viola

Official sources:

- https://www.msmnyc.edu/admission/professional-performance-diploma/
- https://www.msmnyc.edu/programs/collaborative-piano/
- https://www.msmnyc.edu/programs/orchestral-performance/
- https://www.msmnyc.edu/programs/other-academics/pinchas-zukerman/

### Online BFA in Performing Arts — 1 combination

The current online degree-completion BFA is official and open for Spring 2027, but `bfa` is absent from V4.

Official source: https://www.msmnyc.edu/admission/college-programs/online-degree-completion-program-bfa-in-performing-arts/

## Evidence conflicts kept outside confirmed programs

- Nine Jazz Arts PS labels—Bass, Guitar, Piano, Saxophone, Trombone, Trumpet, Vibraphone, Violin, and Viola—appear on the generic postgraduate page, but the dedicated current Jazz Arts page lists only BM, MM, and DMA. They remain unresolved and are not included.
- Organ AD is mentioned on the generic postgraduate page, but the current Artist Diploma majors page and Organ audition page omit it. It remains unresolved and is not included.
- The joint MM/EdM Music and Music Education pathway is a cross-institutional pathway, not a separate atomic MSM field × credential × track offering, and is excluded.

## Repertoire gaps retained explicitly

MSM confirms the following program offerings but does not provide a current matching major-specific repertoire section at the checked official audition URL:

- Jazz Arts Cello — BM and MM
- Jazz Arts Harmonica — BM and MM
- Classical Guitar — AD

Their five audition records are present, `audition_required` is `Yes`, `repertoire_summary` is null, and the required program-ref plus checked-URL review note is recorded. No repertoire was guessed.

## Source policy and exclusions

All source records use MSM-controlled `msmnyc.edu` pages. The package excludes application fees, detailed application instructions, recording/file-format specifications, camera or microphone rules, accompaniment and interview logistics, curriculum, facilities, rankings, and marketing copy. No Directus IDs or import actions are present.
