# Pilot browser verification

Verified on 2026-07-19 with the Codex in-app browser against the local Next.js development server at `http://127.0.0.1:3100`, using the live Directus dataset.

## Desktop — 1280 × 900

- `/pilot/school/manhattan_school_of_music` rendered the Manhattan School of Music heading and exactly 12 linked pilot program cards.
- `/pilot/program/manhattan_school_of_music_cello_bm` rendered:
  - deadline `Dec 1, 2025`;
  - prescreen `Yes · due Dec 1`;
  - cost `$60,800 /yr tuition` plus `Aid available`;
  - audition `Yes · Live or Recorded`;
  - missing language as an em dash, with Duolingo shown as the accepted test.
- `/pilot/program/manhattan_school_of_music_composition_bm` rendered the same deadline and tuition, `Yes · Multiple Rounds`, and the correct missing-language state.
- Repertoire opened and exposed the stored Cello BM repertoire and conditional note; a second click closed it.
- Existing routes `/schools/manhattan_school_of_music` and `/schools/manhattan_school_of_music/programs/5` still rendered successfully.

## Mobile — 380 × 820

- The browser-reported document client width and scroll width were both 365 px, proving there was no horizontal overflow after scrollbar allocation.
- The five decision atoms formed a 2-column grid at x positions 16 and 187 px, with the fifth atom on the third row.
- Atom widths were 161 px and the accordions remained full-width with ≥44 px summary targets.
- Eight intentionally missing values were present in the page DOM, including the decision-bar language em dash and optional cost-detail totals.

## Reviewer and runtime checks

- A temporary Directus Reviewer account was created for the test and deleted immediately afterward.
- The audition editor exposed only active fields, displayed sources read-only, and offered Save, Cancel, Mark Verified, and Mark Needs Update.
- A marker appended to Cello BM `repertoire_summary` was saved, survived a full reload, and appeared in the public Repertoire accordion.
- The original repertoire was then restored through the same interface and verified after reload. No test marker remains.
- `tab.dev.logs()` returned no application console warnings or errors for the pilot index, both program pages, mobile page, existing routes, or the final reviewer state.
- The automation host emitted intermittent Statsig telemetry timeouts to `ab.chatgpt.com`; these were outside the tested page and did not appear in page console logs.

Result: **PASS**.
