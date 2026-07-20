# ChatGPT Work extraction specification

This replaces Modes A–E, Markdown pre-conversion, Obsidian rendering, source inventories, extraction plans, repair loops, batch packaging, and model handoffs in the active path—those remain in the repo but are marked frozen at the top of their files with a one-line pointer to this spec.

Inputs provided to each session: school name + slug; official website; admissions homepage; optional program-list URLs; target admission cycle; the seeded `fields` and `degree_levels` vocabularies (slugs + aliases); this JSON contract (§6); one valid example package.

Session procedure:

1. **Discover.** Navigate from the admissions homepage to the authoritative program list. Identify every offering matching the seeded vocabulary at the (field × degree level) grain. List non-matching majors/degrees separately as "found, not seeded"—never force-map, never invent slugs.
2. **Index + single pause.** Output a concise table: ref, official name, URL, plus the not-seeded list. Pause once for human confirmation. This is the only pause in the session.
3. **Extract** all confirmed programs: the §6 program-level fields, then one current-cycle application record and one current-cycle audition record per program. School-wide facts (e.g. one deadline or tuition figure for all programs) are copied into each program's cycle record and backed by a single school-level source record. Degree levels are never merged unless the page states the requirements are identical. Anything not stated → `null`/`Unknown`—inference is prohibited. Pages that cannot be reached → `null` + a `review_notes` entry naming the URL.
4. **Provenance.** One `source_records` row per consulted page (`retrieved_date` = today). Add `source_quote` (≤2 sentences) only for: deadlines, tuition/fees, language-test minimums, prescreening/audition status. Contradictory sources → record both, set `confidence_level: "Low"`, add a review note; never silently pick one.
5. **Self-validate** against §7's rules (checklist form), fix mechanical issues, set `workflow_status.extraction_status: "complete"`, leave `review_status: "unreviewed"` and `ready_for_directus_import: false`.
6. **Output** exactly one JSON code block containing the package. No commentary inside the block. The session never marks anything `Verified`.

No legacy extraction-pipeline entry point exists in this repository. The predecessor renderer and create-only importer found during inspection are outside this repository and are not part of the active path.
