#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "data", "pilot", "manhattan_school_of_music.json");
const SCHOOL_REF = "manhattan_school_of_music";
const CHECKED = "2026-07-19";
const CYCLE = "2026-2027";

const URLS = {
  apply: "https://apply.msmnyc.edu/apply/",
  catalog: "https://www.msmnyc.edu/wp-content/uploads/2026/05/2627-Academic-Catalog-2026-29-May-2026.pdf",
  composition: "https://www.msmnyc.edu/programs/composition/",
  compositionAudition: "https://www.msmnyc.edu/programs/composition/prescreening-audition-procedures/",
  international: "https://www.msmnyc.edu/admission/international-applicants/",
  piano: "https://www.msmnyc.edu/programs/piano/",
  pianoAudition: "https://www.msmnyc.edu/programs/piano/prescreening-audition-procedures/",
  scholarships: "https://www.msmnyc.edu/admission/scholarships-financial-aid/types-of-aid/",
  strings: "https://www.msmnyc.edu/programs/strings-and-harp/",
  stringsAudition: "https://www.msmnyc.edu/programs/strings-and-harp/prescreening-audition-procedures/",
};

const programs = [
  {
    ref: `${SCHOOL_REF}_cello_ad`, field: "cello", degree: "ad",
    name: "Cello — Artist Diploma", url: URLS.strings, duration: 1,
    auditionUrl: URLS.stringsAudition, format: "Live Only",
    repertoire: "Prescreen: two contrasting concerto movements and two contrasting solo Bach movements. Final audition: a complete concerto plus four significant recital works spanning broad stylistic periods, including the 20th or 21st century.",
  },
  {
    ref: `${SCHOOL_REF}_cello_bm`, field: "cello", degree: "bm",
    name: "Cello — Bachelor of Music", url: URLS.strings, duration: 4,
    auditionUrl: URLS.stringsAudition, format: "Live or Recorded",
    repertoire: "Prescreen: one concerto movement and two contrasting solo Bach movements. Final audition: a concerto movement or approved extended work, two contrasting Bach movements, and one work of the applicant’s choice.",
  },
  {
    ref: `${SCHOOL_REF}_cello_dma`, field: "cello", degree: "dma",
    name: "Cello — Doctor of Musical Arts", url: URLS.strings, duration: null,
    auditionUrl: URLS.stringsAudition, format: "Live Only",
    repertoire: "Prescreen: two contrasting concerto movements and two contrasting solo Bach movements. Final audition: a complete concerto plus four significant recital works spanning broad stylistic periods, including the 20th or 21st century.",
  },
  {
    ref: `${SCHOOL_REF}_cello_mm`, field: "cello", degree: "mm",
    name: "Cello — Master of Music", url: URLS.strings, duration: 2,
    auditionUrl: URLS.stringsAudition, format: "Live or Recorded",
    repertoire: "Prescreen: two contrasting concerto movements and two contrasting solo Bach movements. Final audition: two concerto movements, three Bach movements, a complete sonata, and a complete 20th- or 21st-century work.",
  },
  {
    ref: `${SCHOOL_REF}_composition_bm`, field: "composition", degree: "bm",
    name: "Composition — Bachelor of Music", url: URLS.composition, duration: 4,
    auditionUrl: URLS.compositionAudition, format: "Multiple Rounds",
    repertoire: "Prescreen portfolio: three to five original contrasting compositions with scores and recordings. Final round: composition project, faculty interview, and portfolio review.",
  },
  {
    ref: `${SCHOOL_REF}_composition_dma`, field: "composition", degree: "dma",
    name: "Composition — Doctor of Musical Arts", url: URLS.composition, duration: null,
    auditionUrl: URLS.compositionAudition, format: "Multiple Rounds",
    repertoire: "Prescreen portfolio: three to five original contrasting compositions with scores and recordings. Final round: composition project, an in-person faculty interview, and portfolio review.",
  },
  {
    ref: `${SCHOOL_REF}_composition_mm`, field: "composition", degree: "mm",
    name: "Composition — Master of Music", url: URLS.composition, duration: 2,
    auditionUrl: URLS.compositionAudition, format: "Multiple Rounds",
    repertoire: "Prescreen portfolio: three to five original contrasting compositions with scores and recordings. Final round: composition project, faculty interview, and portfolio review.",
  },
  {
    ref: `${SCHOOL_REF}_piano_ad`, field: "piano", degree: "ad",
    name: "Piano — Artist Diploma", url: URLS.piano, duration: 1,
    auditionUrl: URLS.pianoAudition, format: "Live Only",
    repertoire: "Prescreen: a 60–70 minute solo recital representing at least three stylistic periods. Final audition: a 60–75 minute solo recital representing at least three stylistic periods.",
  },
  {
    ref: `${SCHOOL_REF}_piano_bm`, field: "piano", degree: "bm",
    name: "Piano — Bachelor of Music", url: URLS.piano, duration: 4,
    auditionUrl: URLS.pianoAudition, format: "Live or Recorded",
    repertoire: "Prescreen: at least two contrasting works totaling 15–20 minutes. Final audition: Baroque repertoire, a complete Classical sonata, a 19th-century work, and a 20th- or 21st-century work.",
  },
  {
    ref: `${SCHOOL_REF}_piano_dma`, field: "piano", degree: "dma",
    name: "Piano — Doctor of Musical Arts", url: URLS.piano, duration: null,
    auditionUrl: URLS.pianoAudition, format: "Live Only",
    repertoire: "Prescreen: a 60–70 minute solo recital representing at least three stylistic periods. Final audition: a 60–75 minute solo recital representing at least three stylistic periods.",
  },
  {
    ref: `${SCHOOL_REF}_piano_mm`, field: "piano", degree: "mm",
    name: "Piano — Master of Music", url: URLS.piano, duration: 2,
    auditionUrl: URLS.pianoAudition, format: "Live or Recorded",
    repertoire: "Prescreen: at least two contrasting works totaling 15–20 minutes. Final audition: a 50–65 minute solo recital covering at least three stylistic periods, including the 20th or 21st century.",
  },
  {
    ref: `${SCHOOL_REF}_violin_ad_classical`, field: "violin", degree: "ad",
    track: "Classical", name: "Violin — Artist Diploma (Classical)",
    url: URLS.strings, duration: 1, auditionUrl: URLS.stringsAudition,
    format: "Live Only",
    repertoire: "Prescreen: two contrasting concerto movements, one sonata movement, and one work of the applicant’s choice. Final audition: a complete concerto and four complete recital works spanning broad stylistic periods, including the 20th or 21st century.",
  },
];

function schoolSource(url, sourceType, relatedField, sourceQuote = null) {
  return {
    school_ref: SCHOOL_REF,
    program_offering_ref: null,
    source_url: url,
    source_type: sourceType,
    retrieved_date: CHECKED,
    source_quote: sourceQuote,
    related_field: relatedField,
    confidence_level: "High",
  };
}

function programSource(program, url, sourceType, relatedField, sourceQuote = null) {
  return {
    school_ref: null,
    program_offering_ref: program.ref,
    source_url: url,
    source_type: sourceType,
    retrieved_date: CHECKED,
    source_quote: sourceQuote,
    related_field: relatedField,
    confidence_level: "High",
  };
}

const sourceRecords = [
  schoolSource(
    URLS.apply,
    "Application Requirements Page",
    "application_deadline",
    "The Fall 2026 College Application is due on December 1, 2025.",
  ),
  schoolSource(
    URLS.catalog,
    "Deadline/Fee Page",
    "tuition_annual",
    "Full-time Tuition (12–18 credits): $60,800 per academic year.",
  ),
  schoolSource(
    URLS.international,
    "English Language Requirements Page",
    "english_language_tests",
  ),
  schoolSource(
    URLS.international,
    "English Language Requirements Page",
    "ielts_minimum",
    "TOEFL and IELTS scores are not accepted as an alternative to the DET requirement.",
  ),
  schoolSource(
    URLS.international,
    "English Language Requirements Page",
    "toefl_minimum",
    "Manhattan School of Music has no minimum English test score requirements in order to apply.",
  ),
  schoolSource(
    URLS.scholarships,
    "Application Requirements Page",
    "scholarships_available",
  ),
];

for (const program of programs) {
  const isComposition = program.field === "composition";
  const inPersonOnly = program.format === "Live Only";
  sourceRecords.push(
    programSource(program, program.url, "Official Program Page", "official_program_name"),
    programSource(
      program,
      program.auditionUrl,
      "Audition Requirements Page",
      "audition_format",
    ),
    programSource(
      program,
      program.auditionUrl,
      "Audition Requirements Page",
      "audition_required",
      isComposition
        ? "Applicants who pass the prescreening round will be scheduled for an audition."
        : inPersonOnly
          ? "DMA & AD programs require an in-person audition."
          : "In-person and recorded Final Auditions are available.",
    ),
    programSource(
      program,
      program.auditionUrl,
      "Audition Requirements Page",
      "prescreening_deadline",
      "Prescreen Deadline: December 1.",
    ),
    programSource(
      program,
      program.auditionUrl,
      "Audition Requirements Page",
      "prescreening_required",
      isComposition
        ? "Prescreening: Scores and Recordings."
        : program.field === "piano"
          ? "All piano applicants must submit a prescreening video."
          : "Prescreening videos are required for all Viola, Violin, and Cello applicants.",
    ),
    programSource(
      program,
      program.auditionUrl,
      "Audition Requirements Page",
      "repertoire_summary",
    ),
  );
}

sourceRecords.sort((a, b) => {
  const scopeA = a.program_offering_ref ?? "";
  const scopeB = b.program_offering_ref ?? "";
  return scopeA.localeCompare(scopeB) ||
    a.source_url.localeCompare(b.source_url) ||
    String(a.related_field).localeCompare(String(b.related_field));
});

const packageData = {
  schema_version: "stage_music_admissions_v3",
  school: {
    school_ref: SCHOOL_REF,
    school_name: "Manhattan School of Music",
    city: "New York",
    country: "United States",
    school_type: "Conservatory",
    official_website: "https://www.msmnyc.edu/",
  },
  program_offerings: programs.map((program) => ({
    program_offering_ref: program.ref,
    school_ref: SCHOOL_REF,
    field_ref: program.field,
    degree_level_ref: program.degree,
    track_or_concentration: program.track ?? null,
    official_program_name: program.name,
    program_url: program.url,
    duration_years: program.duration,
    language_of_instruction: null,
    faculty_list: null,
    last_checked: CHECKED,
  })),
  application_requirements: programs.map((program) => ({
    program_offering_ref: program.ref,
    admission_cycle: CYCLE,
    is_current: true,
    application_deadline: "2025-12-01",
    deadline_notes: "Priority application deadline for Fall 2026 admission.",
    tuition_annual: 60800,
    tuition_currency: "USD",
    scholarships_available: "Yes",
    scholarship_note: "All full-time students are eligible for institutional scholarships; awards consider performance and financial need.",
    english_language_tests: ["Duolingo"],
    toefl_minimum: null,
    ielts_minimum: null,
    conditional_notes: "International applicants whose first language is not English must submit the Duolingo English Test; TOEFL and IELTS are not accepted alternatives.",
  })),
  audition_requirements: programs.map((program) => ({
    program_offering_ref: program.ref,
    admission_cycle: CYCLE,
    is_current: true,
    prescreening_required: "Yes",
    prescreening_deadline: "2025-12-01",
    audition_required: "Yes",
    audition_format: program.format,
    repertoire_summary: program.repertoire,
    conditional_notes: program.field === "composition"
      ? (program.degree === "dma"
          ? "DMA applicants must interview in person; the composition audition has prescreen, project, and interview/portfolio stages."
          : "BM and MM faculty interviews may be in person or by Zoom; the composition audition has prescreen, project, and interview/portfolio stages.")
      : (program.format === "Live Only"
          ? "The final audition must be in person."
          : "The final audition may be completed in person or by recording."),
  })),
  source_records: sourceRecords,
  data_quality: {
    overall_confidence: "High",
    missing_critical_fields: [
      "language_of_instruction for all pilot offerings; the reviewed official pages do not explicitly state the teaching language",
    ],
    needs_human_review: true,
    review_notes: [
      "The program-index confirmation window elapsed without a response; the deterministic exact-match fallback was applied.",
      "The pilot is capped at the first 12 exact matched seeded offerings in stable program_offering_ref order; 11 additional exact matches were intentionally omitted from this pilot package.",
      "Official program pages were reachable. The application and prescreen dates use the 2026–2027 admission cycle and the official Fall 2026 deadline year; program pages state December 1 without repeating the year.",
      "Found but not seeded because no exact field/degree identity was confirmed in the current seed vocabulary and cap: Musical Theatre, Orchestral Performance, Jazz Arts, brass, Collaborative Piano, Conducting, Contemporary Performance, Guitar, Percussion, woodwinds, Double Bass, Harp, Viola, and non-degree/certificate variants.",
    ],
  },
  workflow_status: {
    extraction_status: "complete",
    review_status: "unreviewed",
    ready_for_directus_import: false,
  },
};

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(packageData, null, 2)}\n`, "utf8");
process.stdout.write(`${OUTPUT}\nprograms=${programs.length}\nsources=${sourceRecords.length}\n`);
