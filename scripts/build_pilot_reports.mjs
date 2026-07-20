#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACKAGE_PATH = path.join(ROOT, "data", "pilot", "manhattan_school_of_music.json");
const IMPORT_PATH = path.join(ROOT, "docs", "pilot", "import_commit.json");
const COMPARISON_PATH = path.join(ROOT, "docs", "pilot", "comparison.md");
const CROSS_REVIEW_PATH = path.join(ROOT, "docs", "pilot", "cross_review_packet.md");

const packageText = await readFile(PACKAGE_PATH, "utf8");
const packageData = JSON.parse(packageText);
const importReport = JSON.parse(await readFile(IMPORT_PATH, "utf8"));
const journalByKey = new Map(
  importReport.journal.map((entry) => [`${entry.collection}:${entry.identity}`, entry]),
);

function display(value) {
  if (value === null || value === undefined) return "`null`";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "empty array";
  return String(value).replaceAll("|", "\\|");
}

function previous(collection, identity, field, current) {
  const entry = journalByKey.get(`${collection}:${identity}`);
  if (!entry) return `unchanged (${display(current)})`;
  if (entry.action === "create") return "not previously collected";
  if (Object.hasOwn(entry.before ?? {}, field)) return display(entry.before[field]);
  return `unchanged (${display(current)})`;
}

function sourceFor(ref, field) {
  return packageData.source_records.find((source) =>
    source.related_field === field &&
    (source.program_offering_ref === ref || source.school_ref === packageData.school.school_ref),
  ) ?? null;
}

function link(url) {
  return url ? `[official source](${url})` : "—";
}

const applications = new Map(
  packageData.application_requirements.map((row) => [row.program_offering_ref, row]),
);
const auditions = new Map(
  packageData.audition_requirements.map((row) => [row.program_offering_ref, row]),
);

const comparison = [
  "# Manhattan School of Music pilot comparison",
  "",
  "Comparison date: 2026-07-19. The live baseline contained 21 MSM program/cycle rows. The pilot intentionally covers the first 12 exact seeded matches, including 10 updated existing identities and 2 newly represented composition identities; the count difference is the specified cap, not data loss.",
  "",
  "## Coverage summary",
  "",
  "| Measure | Previous live baseline | Reduced pilot | Result |",
  "|---|---:|---:|---|",
  "| MSM programs in Directus | 21 | 12 in package; 23 total MSM rows after 2 creates | Existing rows preserved |",
  "| Current application rows for pilot refs | 10 existing | 12 | Exactly one per ref |",
  "| Current audition rows for pilot refs | 10 existing | 12 | Exactly one per ref |",
  "| Annual tuition | Not previously collected | USD 60,800 for every pilot ref | Source-backed addition |",
  "| Teaching language | Empty arrays on matched rows | `null` for every pilot ref | Correct missing state; official pages do not state it |",
  "| TOEFL / IELTS minimums | `null` | `null` | Unchanged; these tests are not accepted alternatives |",
  "",
  "## Per-program values",
  "",
  "Every changed value below is backed by the linked official program, application, tuition, or audition page. `unchanged` means the importer found no value-level diff for that field. Repertoire summaries were reduced to the current active text field; frozen structured requirements were not touched.",
  "",
  "| Program ref | Identity: previous → pilot | Deadline: previous → pilot | Prescreen: previous → pilot | Audition format: previous → pilot | Tuition: previous → pilot | Language/minimums: previous → pilot | Evidence |",
  "|---|---|---|---|---|---|---|---|",
];

for (const program of packageData.program_offerings) {
  const ref = program.program_offering_ref;
  const app = applications.get(ref);
  const audition = auditions.get(ref);
  const appIdentity = `${ref}:${app.admission_cycle}`;
  const auditionIdentity = `${ref}:${audition.admission_cycle}`;
  comparison.push([
    `| \`${ref}\``,
    `${previous("program_offerings", ref, "official_program_name", program.official_program_name)} → ${display(program.official_program_name)}`,
    `${previous("application_requirements", appIdentity, "application_deadline", app.application_deadline)} → ${display(app.application_deadline)}`,
    `${previous("audition_requirements", auditionIdentity, "prescreening_required", audition.prescreening_required)} / ${previous("audition_requirements", auditionIdentity, "prescreening_deadline", audition.prescreening_deadline)} → ${audition.prescreening_required} / ${audition.prescreening_deadline}`,
    `${previous("audition_requirements", auditionIdentity, "audition_format", audition.audition_format)} → ${display(audition.audition_format)}`,
    `${previous("application_requirements", appIdentity, "tuition_annual", app.tuition_annual)} → ${app.tuition_currency} ${app.tuition_annual}`,
    `${previous("program_offerings", ref, "language_of_instruction", program.language_of_instruction)}; TOEFL/IELTS unchanged null → language ${display(program.language_of_instruction)}; TOEFL/IELTS null`,
    `${link(program.program_url)} · ${link(sourceFor(ref, "application_deadline")?.source_url)} · ${link(sourceFor(ref, "tuition_annual")?.source_url)} · ${link(sourceFor(ref, "prescreening_required")?.source_url)} |`,
  ].join(" | "));
}

comparison.push(
  "",
  "## Discrepancy disposition",
  "",
  "- Program names/tracks were normalized to the current official department naming while retaining the durable pre-existing refs. No protected `human_checked`/`Verified` pilot record was overwritten.",
  "- Tuition and scholarships are newly collected active fields. The prior baseline held `null`/`Unknown`; the official 2026–27 catalog and aid page support the pilot values.",
  "- Repertoire and format changes follow the current instrument/degree audition pages. Degree levels were kept separate, including the in-person-only DMA/AD distinction.",
  "- Language of instruction remains `null`, because the consulted official pages do not explicitly state it. The package records this as a missing critical field and the UI renders an em dash.",
  "- Zero critical-field errors were found in the package-to-source review performed by the implementing model. Independent verification is still required; no pilot record was marked Verified.",
  "",
);

const packet = [
  "# MSM pilot cross-review packet",
  "",
  `Package: \`data/pilot/manhattan_school_of_music.json\`  `,
  `SHA-256: \`${createHash("sha256").update(packageText).digest("hex")}\`  `,
  "Prepared: 2026-07-19  ",
  "Required reviewer: separate session, ideally a different model family.",
  "",
  "Verify each stored value directly against the linked official source. Do not infer unstated values. Record any mismatch before changing Directus. All rows intentionally remain Extracted or Needs Review.",
  "",
  "| Program ref | Critical claim | Stored value | Official source | Source quote / page evidence |",
  "|---|---|---|---|---|",
];

function identityEvidence(program) {
  if (program.field_ref === "composition") {
    return "Page heading: “Composition.” Degree list: “Bachelor of Music, Master of Music, Doctor of Musical Arts.”";
  }
  if (program.field_ref === "piano") {
    return "Page heading: “Piano.” Degree list: “Bachelor of Music, Master of Music, Doctor of Musical Arts, Artist Diploma.”";
  }
  return "Page heading: “Strings and Harp.” Majors include Cello and Violin; degrees include BM, MM, DMA, and Artist Diploma.";
}

for (const program of packageData.program_offerings) {
  const ref = program.program_offering_ref;
  const app = applications.get(ref);
  const audition = auditions.get(ref);
  const deadlineSource = sourceFor(ref, "application_deadline");
  const tuitionSource = sourceFor(ref, "tuition_annual");
  const toeflSource = sourceFor(ref, "toefl_minimum");
  const ieltsSource = sourceFor(ref, "ielts_minimum");
  const prescreenSource = sourceFor(ref, "prescreening_required");
  const prescreenDeadlineSource = sourceFor(ref, "prescreening_deadline");
  const identitySource = sourceFor(ref, "official_program_name");
  const rows = [
    ["Identity", `${program.official_program_name}; field=${program.field_ref}; degree=${program.degree_level_ref}; track=${display(program.track_or_concentration)}`, identitySource?.source_url, identityEvidence(program)],
    ["Application deadline", app.application_deadline, deadlineSource?.source_url, deadlineSource?.source_quote],
    ["Annual tuition", `${app.tuition_currency} ${app.tuition_annual}`, tuitionSource?.source_url, tuitionSource?.source_quote],
    ["Language minimums", `tests=${app.english_language_tests.join(", ")}; TOEFL=${display(app.toefl_minimum)}; IELTS=${display(app.ielts_minimum)}`, toeflSource?.source_url ?? ieltsSource?.source_url, `${toeflSource?.source_quote ?? ""} ${ieltsSource?.source_quote ?? ""}`.trim()],
    ["Prescreen status/deadline", `${audition.prescreening_required}; ${audition.prescreening_deadline}`, prescreenSource?.source_url, `${prescreenSource?.source_quote ?? ""} ${prescreenDeadlineSource?.source_quote ?? ""}`.trim()],
  ];
  for (const [claim, stored, url, quote] of rows) {
    packet.push(`| \`${ref}\` | ${claim} | ${display(stored)} | ${link(url)} | ${display(quote)} |`);
  }
}

packet.push(
  "",
  "## Known review points",
  "",
  "- `language_of_instruction` is null for every pilot program because no consulted official page explicitly states it.",
  "- DMA duration is null for Cello, Composition, and Piano because the catalog pages reviewed did not state a program length clearly enough to store without inference.",
  "- The prescreen pages state December 1; the 2025 year is anchored to the official Fall 2026 application cycle page. Confirm that cross-page cycle join.",
  "- Composition uses `Multiple Rounds` because the official process has prescreen, project, and interview/portfolio stages; BM/MM interviews may be in person or Zoom, an option not represented by the fixed audition-format enum.",
  "- This pilot used the deterministic no-response fallback and stops after the first 12 exact refs. Eleven additional exact matches and non-seeded offerings are outside this packet.",
  "",
);

await writeFile(COMPARISON_PATH, `${comparison.join("\n")}\n`, "utf8");
await writeFile(CROSS_REVIEW_PATH, `${packet.join("\n")}\n`, "utf8");
process.stdout.write(`${COMPARISON_PATH}\n${CROSS_REVIEW_PATH}\n`);
