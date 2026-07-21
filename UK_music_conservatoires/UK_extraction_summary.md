# UK music conservatoires extraction summary

Last checked: 2026-07-21
Admission cycle: 2027-2028
Schools completed: 5
Program offerings extracted: 508

| School | school_ref | Programmes | Official source URLs | Critical missing fields | Review notes |
|---|---|---:|---:|---:|---:|
| Royal College of Music | `royal_college_of_music` | 95 | 23 | 0 | 3 |
| Royal Academy of Music | `royal_academy_of_music` | 96 | 75 | 26 | 29 |
| Guildhall School of Music & Drama | `guildhall_school_of_music_and_drama` | 96 | 16 | 2 | 4 |
| Royal Northern College of Music | `royal_northern_college_of_music` | 123 | 7 | 124 | 126 |
| Royal Conservatoire of Scotland | `royal_conservatoire_of_scotland` | 98 | 13 | 100 | 102 |

## School packages

- [Royal College of Music](./Royal_College_of_Music/programs.json)
- [Royal Academy of Music](./Royal_Academy_of_Music/programs.json)
- [Guildhall School of Music & Drama](./Guildhall_School_of_Music_and_Drama/programs.json)
- [Royal Northern College of Music](./Royal_Northern_College_of_Music/programs.json)
- [Royal Conservatoire of Scotland](./Royal_Conservatoire_of_Scotland/programs.json)

## Cross-school review points

- Royal College of Music and Royal Academy of Music remain separate through distinct official English names and stable refs: `royal_college_of_music` (RCM) and `royal_academy_of_music` (RAM).
- STAGE V4 has only `bm`, `mm`, `dma`, `gd`, and `ad` degree refs. UK award titles remain verbatim in `official_program_name` and `track_or_concentration`; the explicit crosswalks are listed in each school’s review notes.
- Overseas/international full-time tuition is used where the official 2027-28 source publishes it. Prior-year fees are never carried forward.
- RNCM and RCS still show prior-year tuition on the live pages checked; those current-cycle tuition fields are null and require review when 2027-28 schedules appear.
- Principal-study lists that cannot be represented by the seeded field vocabulary are recorded as `found, not seeded` rather than force-mapped.

## Validation

All five `programs.json` packages pass the STAGE V4 schema and semantic validator with zero hard errors. The final URL audit checked 143 distinct official URLs: 130 returned a reachable/access-controlled HTTP response, and 13 timed out at the automated fetch layer. None returned an HTTP error status; the timed-out official pages were confirmed through official-site indexed results or direct targeted checks.
