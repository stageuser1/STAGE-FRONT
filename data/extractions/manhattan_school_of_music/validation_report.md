# Manhattan School of Music V4 Validation Report

Generated: 2026-07-21  
Authoritative package: `manhattan_school_of_music.v4.json`

## Result

**V4 schema: PASS**  
**Hard errors: 0**  
**Schema-representable program matrix: PASS**  
**Full MSM credential matrix: NEEDS REVIEW** because V4 has no PS, PPD, or BFA degree enum.

Validation used `docs/contracts/stage-school-extraction-v4.schema.json` and the hard-failure rules in `docs/contracts/stage-school-extraction-v4-validation.md`.

## Package counts

| Record type | Count |
|---|---:|
| Program offerings | 170 |
| Current application records | 170 |
| Current audition records | 170 |
| Source records | 941 |

### Programs by credential

| Credential | Count |
|---|---:|
| BM | 41 |
| MM | 79 |
| DMA | 27 |
| AD | 23 |
| **Total** | **170** |

### Programs by official division/track

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

## Hard-rule checks

| Check | Result | Detail |
|---|---|---|
| JSON parse | PASS | Valid UTF-8 JSON |
| V4 JSON Schema | PASS | 0 schema errors |
| Schema version | PASS | `stage_school_extraction_v4` |
| Duplicate program refs | PASS | 0 |
| Duplicate field × degree × track combinations | PASS | 0 |
| Deterministic program refs | PASS | 170 of 170 conform |
| Orphan requirement/source refs | PASS | 0 |
| Duplicate application cycle records | PASS | 0 |
| Duplicate audition cycle records | PASS | 0 |
| Duplicate source triples | PASS | 0 |
| Missing current application records | PASS | 0 |
| Missing current audition records | PASS | 0 |
| Current records per program | PASS | Exactly one application and one audition record |
| Tuition/currency pairing | PASS | 170 of 170 paired |
| Material-name limits | PASS | No digit, sentence punctuation, or over-40-character item |
| Prohibited/legacy fields | PASS | 0 |
| Directus IDs | PASS | 0 |
| `Verified` values | PASS | 0 |
| Official-domain sources | PASS | 941 of 941 on `msmnyc.edu` |
| Evidence-required stated claims | PASS | All stated claims have scoped or school-level URL/quote evidence |
| Evidence quote limits | PASS | All evidence quotes are nonempty and no longer than 400 characters/two sentences |

## Needs-attention findings

Five audition records use V4's explicit null-repertoire escape hatch. Each program is confirmed, but no current matching major-specific repertoire section was found; each record is named with the checked official URL in `data_quality.review_notes`:

- `manhattan_school_of_music_cello_bm_jazz_arts`
- `manhattan_school_of_music_cello_mm_jazz_arts`
- `manhattan_school_of_music_harmonica_bm_jazz_arts`
- `manhattan_school_of_music_harmonica_mm_jazz_arts`
- `manhattan_school_of_music_guitar_ad_classical`

All 170 program, application, and audition records use `Needs Review`. This is intentional because the live MSM pages still expose the 2026–2027 general college cycle on the 2026-07-21 retrieval date and because reviewer separation forbids `Verified`.

Two concise official material labels fall outside the contract's recommended vocabulary and therefore require reviewer confirmation: `Repertoire list` and `Personal photo`.

## Credential-vocabulary boundary

The following current official programs are separated from the confirmed JSON matrix because the V4 enum cannot represent their credentials:

- Professional Studies (PS): 41 combinations
- Professional Performance Diploma (PPD): 39 combinations
- Online BFA in Performing Arts: 1 combination

They were not force-mapped to `gd`. Nine generic-page Jazz PS labels and one Organ AD label remain evidence conflicts and are also excluded pending official clarification. See `summary.md` for the full accounting.

## Final assessment

The authoritative JSON is schema-valid with zero hard errors and complete for all current MSM combinations expressible in V4. It is not import-ready: `workflow_status.ready_for_directus_import` is correctly `false`, and the unrepresentable/current-cycle issues require human review.
