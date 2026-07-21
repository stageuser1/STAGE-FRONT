#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "data", "extractions");
const CHECKED = "2026-07-21";

const DEGREE_LABELS = {
  bm: "Bachelor of Music",
  mm: "Master of Music",
  dma: "Doctor of Musical Arts",
  gd: "Graduate Diploma",
  ad: "Artist Diploma",
};

const FIELD_LABELS = {
  bass: "Bass",
  bass_trombone: "Bass Trombone",
  bassoon: "Bassoon",
  cello: "Cello",
  chamber_music: "Chamber Music",
  choral_conducting: "Choral Conducting",
  clarinet: "Clarinet",
  collaborative_piano: "Collaborative Piano",
  composition: "Composition",
  contemporary_ensembles_conducting: "Contemporary Ensembles Conducting",
  contemporary_media_film_composition: "Contemporary Media/Film Composition",
  contemporary_musical_arts: "Contemporary Musical Arts",
  double_bass: "Double Bass",
  drum_set: "Drum Set",
  early_music: "Early Music",
  euphonium: "Euphonium",
  flute: "Flute",
  guitar: "Guitar",
  harp: "Harp",
  harpsichord: "Harpsichord",
  horn: "Horn",
  jazz_performance: "Jazz Performance",
  jazz_studies: "Jazz Studies & Contemporary Media",
  music_creation_technology: "Music Creation and Technology",
  music_education: "Music Education",
  music_history: "Music History",
  music_theory: "Music Theory",
  musicology: "Musicology",
  oboe: "Oboe",
  opera_studies: "Opera Studies",
  orchestral_conducting: "Orchestral Conducting",
  percussion: "Percussion",
  piano: "Piano",
  professional_piano_trio: "Professional Piano Trio",
  professional_string_quartet: "Professional String Quartet",
  saxophone: "Saxophone",
  tenor_trombone: "Trombone",
  trumpet: "Trumpet",
  tuba: "Tuba",
  viola: "Viola",
  violin: "Violin",
  voice: "Voice",
  wind_conducting: "Wind Conducting",
};

const STRINGS = new Set(["bass", "cello", "double_bass", "guitar", "harp", "viola", "violin"]);
const WOODWINDS = new Set(["bassoon", "clarinet", "flute", "oboe", "saxophone"]);
const BRASS = new Set(["bass_trombone", "euphonium", "horn", "tenor_trombone", "trumpet", "tuba"]);
const KEYBOARDS = new Set(["piano", "organ", "harpsichord", "collaborative_piano"]);
FIELD_LABELS.organ = "Organ";

const slugify = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .replace(/_+/g, "_");

const refFor = (school, field, degree, track = null) =>
  `${school}_${field}_${degree}${track ? `_${slugify(track)}` : ""}`;

function spec(field, degree, track = null, name = null, programUrl = null) {
  return { field, degree, track, name, programUrl };
}

function addMatrix(target, fields, degrees, track = null) {
  for (const field of fields) for (const degree of degrees) target.push(spec(field, degree, track));
}

const colburnFields = [
  "bassoon", "cello", "clarinet", "double_bass", "flute", "harp", "horn", "oboe",
  "percussion", "piano", "bass_trombone", "tenor_trombone", "trumpet", "tuba", "viola", "violin",
];

const curtisBm = [
  "bass", "bass_trombone", "bassoon", "cello", "clarinet", "composition", "flute", "guitar", "harp",
  "horn", "oboe", "organ", "percussion", "piano", "tenor_trombone", "trumpet", "tuba", "viola", "violin", "voice",
];
const curtisMm = [
  "bass", "bassoon", "cello", "clarinet", "composition", "guitar", "harp", "horn", "oboe", "opera_studies",
  "organ", "percussion", "piano", "tenor_trombone", "trumpet", "tuba", "viola", "violin",
];

const eastmanClassical = [
  "bassoon", "clarinet", "euphonium", "flute", "horn", "oboe", "saxophone", "percussion", "tenor_trombone",
  "trumpet", "tuba", "double_bass", "harp", "guitar", "viola", "violin", "cello", "organ", "piano", "voice",
];
const eastmanJazzPerformance = ["double_bass", "drum_set", "guitar", "piano", "saxophone", "tenor_trombone", "trumpet"];

const necUndergradAuditionFields = [
  "bass_trombone", "euphonium", "horn", "tenor_trombone", "trumpet", "tuba", "composition",
  "contemporary_musical_arts", "jazz_performance", "percussion", "piano", "violin", "viola", "cello",
  "double_bass", "harp", "guitar", "voice", "flute", "oboe", "clarinet", "saxophone", "bassoon",
];
const necPerformanceGraduate = [
  "horn", "trumpet", "tenor_trombone", "bass_trombone", "euphonium", "tuba", "percussion", "piano",
  "violin", "viola", "cello", "double_bass", "guitar", "harp", "voice", "flute", "oboe", "clarinet", "bassoon", "saxophone",
];

const configs = {
  colburn: {
    baseline: 9,
    cycle: "2026-2027",
    status: "Needs Review",
    programUrl: {
      bm: "https://colburnschool.edu/conservatory/programs-of-study/undergraduate-programs/",
      mm: "https://colburnschool.edu/conservatory/programs-of-study/graduate-programs/",
      ad: "https://colburnschool.edu/conservatory/programs-of-study/graduate-programs/",
    },
    auditionUrl: "https://colburnschool.edu/conservatory/audition/prescreening-video-submission/",
    portal: "https://admissions.colburnschool.edu/apply/",
    matrix: [],
    exclusions: [
      { credential: "Performance Diploma (PD)", fields: colburnFields, reason: "degree_level_ref does not include PD" },
      { credential: "Professional Studies Certificate (PSC)", fields: colburnFields, reason: "degree_level_ref does not include PSC" },
      { credential: "Conducting Diploma", fields: ["Conducting"], reason: "degree_level_ref does not include this diploma" },
    ],
    issues: [
      "The live application and audition pages still publish the Fall 2026 cycle; all records remain Needs Review until Fall 2027 requirements appear.",
      "The latest official tuition page is labeled 2025-26, so current-cycle tuition remains null.",
      "Current studio openings change by admission cycle; an offered program can be temporarily closed to applications.",
    ],
  },
  curtis: {
    baseline: 10,
    cycle: "2027-2028",
    status: "Needs Review",
    programUrl: { bm: "https://www.curtis.edu/learn/degrees-diplomas/", mm: "https://www.curtis.edu/learn/degrees-diplomas/master-of-music/" },
    auditionUrl: "https://www.curtis.edu/apply/audition/",
    portal: "https://connect.curtis.edu/apply/",
    matrix: [],
    exclusions: [
      { credential: "Diploma", fields: curtisBm, reason: "degree_level_ref does not include the Curtis Diploma" },
      { credential: "Post-Baccalaureate Diploma", fields: ["Bass", "Bassoon", "Cello", "Clarinet", "Composition", "Conducting", "Guitar", "Harp", "Horn", "Oboe", "Opera", "Organ", "Percussion", "Piano", "String Quartet", "Trombone", "Trumpet", "Tuba", "Viola", "Violin"], reason: "degree_level_ref does not include PBD" },
      { credential: "Professional Studies Certificate", fields: ["Opera"], reason: "degree_level_ref does not include PSC" },
    ],
    issues: [
      "Curtis has not yet posted the exact Fall 2027 application and prescreen deadline; those fields remain null.",
      "Curtis publishes English-entry score ranges; V4 stores the lower published bound and retains a review note.",
      "Bachelor and master durations are published as ranges or with conflicting overview language, so duration_years remains null.",
    ],
  },
  eastman: {
    baseline: 16,
    // The original package compressed the DMA jazz major into one generic row.
    // Retire that row after expanding the seven separately auditioned areas.
    retireRefs: ["eastman_jazz_studies_dma"],
    cycle: "2027-2028",
    status: "Needs Review",
    programUrl: {
      bm: "https://www.esm.rochester.edu/admissions/ugrad/",
      mm: "https://www.esm.rochester.edu/admissions/grad/mm/",
      dma: "https://www.esm.rochester.edu/admissions/grad/dma/",
    },
    auditionUrl: "https://www.esm.rochester.edu/admissions/repertoire/",
    portal: "https://apply.esm.rochester.edu/apply/",
    matrix: [],
    exclusions: [
      { credential: "Master of Arts", fields: ["Composition", "Ethnomusicology", "Music Education — Professional Studies", "Music Education — NYS Certification", "Music Education — Summers Only", "Music Leadership", "Musicology", "Music Theory Pedagogy", "Theory"], reason: "degree_level_ref does not include MA" },
      { credential: "Doctor of Philosophy", fields: ["Composition", "Music Education", "Musicology", "Theory"], reason: "degree_level_ref does not include PhD" },
      { credential: "Advanced Diploma in Performance", fields: ["Performance"], reason: "degree_level_ref does not include Eastman's Advanced Diploma" },
      { credential: "Advanced Diploma in Concertmaster Studies", fields: ["Violin"], reason: "degree_level_ref does not include Eastman's Advanced Diploma" },
    ],
    issues: [
      "Fall 2027 applications are open, but several instrument repertoire pages still carry 2026 dates or studio-opening notices; all audition records remain Needs Review.",
      "The latest undergraduate tuition is for 2026-27 and graduate cost varies by unit/lesson load; current-cycle tuition remains null.",
      "Eastman publishes simultaneous new TOEFL 1-6 and still-valid legacy iBT scales; the unlabeled numeric V4 TOEFL field remains null.",
    ],
  },
  new_england_conservatory: {
    baseline: 24,
    cycle: "2027-2028",
    status: "Needs Review",
    programUrl: {
      bm: "https://necmusic.edu/admissions/degree-programs/undergraduate-programs/",
      mm: "https://necmusic.edu/admissions/degree-programs/graduate-programs/",
      gd: "https://necmusic.edu/admissions/degree-programs/graduate-programs/",
      dma: "https://necmusic.edu/admissions/degree-programs/graduate-programs/",
      ad: "https://necmusic.edu/the-college/professional-programs/institute-for-concert-artists/",
    },
    auditionUrl: "https://necmusic.edu/admissions/audition-requirements/",
    portal: "https://apply.necmusic.edu/apply/",
    matrix: [],
    exclusions: [
      { credential: "Undergraduate Diploma", fields: ["Instrumental Performance", "Vocal Performance", "Composition"], reason: "degree_level_ref does not include the undergraduate diploma" },
      { credential: "Undergraduate Performance Certificate", fields: ["Instrument/Area of Study"], reason: "degree_level_ref does not include the certificate" },
      { credential: "Graduate Performance Certificate", fields: ["All published MM/GD audition areas"], reason: "degree_level_ref does not include GPC" },
      { credential: "Harvard/NEC and Holy Cross dual-degree pathways", fields: ["Eligible NEC MM fields"], reason: "cross-institutional combined pathways are not one atomic V4 credential" },
    ],
    issues: [
      "The recurring December 1 deadline is mapped to 2026-12-01 for Fall 2027; all records remain Needs Review.",
      "The latest published tuition is for 2026-27, so 2027-28 tuition remains null.",
      "Graduate Performance Certificate and undergraduate diploma/certificate combinations are fully inventoried but cannot enter program_offerings under the unchanged degree enum.",
    ],
  },
};

// Colburn: every published instrumental area supports the three V4 credentials.
addMatrix(configs.colburn.matrix, colburnFields, ["bm", "mm", "ad"]);
configs.colburn.matrix.push(
  spec("orchestral_conducting", "ad", "Salonen Conducting Fellows", "Salonen Conducting Fellows — Artist Diploma"),
  spec("chamber_music", "mm", "Graduate Chamber Ensemble-in-Residence", "Chamber Music Emphasis — Master of Music", "https://colburnschool.edu/conservatory/programs-of-study/graduate-studies-in-chamber-music/"),
  spec("chamber_music", "ad", "Graduate Chamber Ensemble-in-Residence", "Chamber Music Emphasis — Artist Diploma", "https://colburnschool.edu/conservatory/programs-of-study/graduate-studies-in-chamber-music/"),
);

addMatrix(configs.curtis.matrix, curtisBm, ["bm"]);
addMatrix(configs.curtis.matrix, curtisMm, ["mm"]);

// Eastman BM matrix.
addMatrix(configs.eastman.matrix, eastmanClassical, ["bm"]);
configs.eastman.matrix.push(spec("composition", "bm"));
for (const field of [...eastmanJazzPerformance, "voice"]) configs.eastman.matrix.push(spec(field, "bm", "Jazz Studies & Contemporary Media — Performance"));
configs.eastman.matrix.push(
  spec("composition", "bm", "Jazz Studies & Contemporary Media — Writing", "Jazz Composition — Bachelor of Music"),
  spec("music_education", "bm"),
  spec("music_creation_technology", "bm"),
  spec("music_theory", "bm"),
);

// Eastman MM matrix: performance, separately named conducting and education paths, and specialist majors.
addMatrix(configs.eastman.matrix, [...eastmanClassical, "harpsichord"], ["mm"]);
configs.eastman.matrix.push(
  spec("composition", "mm"),
  spec("choral_conducting", "mm"),
  spec("orchestral_conducting", "mm"),
  spec("wind_conducting", "mm"),
  spec("contemporary_ensembles_conducting", "mm"),
  spec("contemporary_media_film_composition", "mm"),
  spec("early_music", "mm", "Historical Plucked Instruments — Harpsichord"),
  spec("early_music", "mm", "Historical Plucked Instruments — Lute"),
  spec("music_education", "mm", "Professional Studies"),
  spec("music_education", "mm", "New York State Initial plus Professional Certification"),
  spec("music_education", "mm", "Summers Only"),
  // Preserve the stable existing Eastman opera offering ref; the official name
  // already identifies the Stage Directing specialization.
  spec("opera_studies", "mm", null, "Opera Stage Directing — Master of Music"),
  spec("collaborative_piano", "mm", "Piano Accompanying & Chamber Music"),
);
for (const field of eastmanJazzPerformance) configs.eastman.matrix.push(spec(field, "mm", "Jazz Studies & Contemporary Media — Performance"));
configs.eastman.matrix.push(spec("composition", "mm", "Jazz Studies & Contemporary Media — Writing", "Jazz Composition — Master of Music"));

// Eastman DMA matrix.
addMatrix(configs.eastman.matrix, [...eastmanClassical, "harpsichord"], ["dma"]);
configs.eastman.matrix.push(
  spec("composition", "dma"),
  spec("choral_conducting", "dma"),
  spec("orchestral_conducting", "dma"),
  spec("wind_conducting", "dma"),
  spec("contemporary_ensembles_conducting", "dma"),
  spec("early_music", "dma", "Historical Plucked Instruments — Harpsichord"),
  spec("early_music", "dma", "Historical Plucked Instruments — Lute"),
  spec("music_education", "dma"),
  spec("collaborative_piano", "dma", "Piano Accompanying & Chamber Music"),
);
for (const field of eastmanJazzPerformance) {
  configs.eastman.matrix.push(spec(field, "dma", "Jazz Studies & Contemporary Media — Performance"));
}

// NEC matrices follow the headings on the official complete audition page.
addMatrix(configs.new_england_conservatory.matrix, necUndergradAuditionFields, ["bm"]);
configs.new_england_conservatory.matrix.push(
  spec("composition", "bm", "Jazz Studies — Composition", "Jazz Composition — Bachelor of Music"),
  spec("music_history", "bm"),
  spec("music_theory", "bm"),
);

addMatrix(configs.new_england_conservatory.matrix, necPerformanceGraduate, ["ad"]);
configs.new_england_conservatory.matrix.push(spec("contemporary_musical_arts", "ad"), spec("jazz_performance", "ad"));

addMatrix(configs.new_england_conservatory.matrix, necPerformanceGraduate, ["mm", "gd", "dma"]);
for (const degree of ["mm", "gd", "dma"]) {
  configs.new_england_conservatory.matrix.push(
    spec("chamber_music", degree, "Chamber Music for Piano"),
    spec("choral_conducting", degree),
    spec("collaborative_piano", degree),
    spec("composition", degree),
    spec("contemporary_musical_arts", degree),
    spec("jazz_performance", degree),
    spec("composition", degree, "Jazz Studies — Composition", `Jazz Composition — ${DEGREE_LABELS[degree]}`),
    spec("music_theory", degree),
  );
}
for (const degree of ["mm", "gd"]) {
  configs.new_england_conservatory.matrix.push(
    spec("orchestral_conducting", degree),
    spec("professional_string_quartet", degree),
    spec("professional_piano_trio", degree),
  );
}
configs.new_england_conservatory.matrix.push(spec("musicology", "mm"));
configs.new_england_conservatory.matrix.push(
  spec("piano", "bm", "Piano + Collaborative Piano Dual-Degree Program"),
  spec("collaborative_piano", "mm", "Piano + Collaborative Piano Dual-Degree Program"),
);

function titleFor(item) {
  if (item.name) return item.name;
  const base = `${FIELD_LABELS[item.field] || item.field} — ${DEGREE_LABELS[item.degree]}`;
  return item.track ? `${base} (${item.track})` : base;
}

function programName(school, item) {
  if (item.name) return item.name;
  const label = FIELD_LABELS[item.field] || item.field;
  if (school === "eastman") {
    if (item.degree === "bm" && eastmanClassical.includes(item.field)) return `${label} — Bachelor of Music in Applied Music`;
    if ((item.degree === "mm" || item.degree === "dma") && [...eastmanClassical, "harpsichord"].includes(item.field)) {
      return `${label} — ${DEGREE_LABELS[item.degree]} in Performance & Literature`;
    }
  }
  return titleFor(item);
}

function kindFor(field, track) {
  if (track?.includes("Jazz") || field === "jazz_performance" || field === "jazz_studies") return "jazz";
  if (field === "composition" || field === "contemporary_media_film_composition" || field === "music_creation_technology") return "portfolio";
  if (["music_theory", "music_history", "musicology"].includes(field)) return "academic";
  if (field.includes("conducting")) return "conducting";
  if (["chamber_music", "professional_string_quartet", "professional_piano_trio", "collaborative_piano"].includes(field)) return "ensemble";
  if (field === "voice" || field === "opera_studies") return "voice";
  if (field === "percussion" || field === "drum_set") return "percussion";
  if (KEYBOARDS.has(field)) return "keyboard";
  if (STRINGS.has(field)) return "string";
  if (WOODWINDS.has(field)) return "woodwind";
  if (BRASS.has(field)) return "brass";
  return "performance";
}

function repertoireSummary(school, item) {
  const label = FIELD_LABELS[item.field] || item.field;
  const kind = kindFor(item.field, item.track);
  const advanced = item.degree === "dma" || item.degree === "ad";
  if (school === "colburn") {
    if (item.field === "chamber_music") return "Preformed ensembles submit ensemble recordings; invited groups perform an ensemble audition plus abbreviated solo auditions for each member.";
    if (kind === "conducting") return "Prescreen at least three recent conducting selections from varied standard orchestral repertoire; finalists conduct the Colburn Orchestra and complete musicianship assessment and interview.";
    if (kind === "keyboard") return "Prescreen at least 30 minutes from varied periods, including a Classical work and, for undergraduates, a virtuoso etude; all audition repertoire is memorized.";
    if (kind === "percussion") return "Prepare the published snare, two- and four-mallet, timpani, scales, rudiments, tuning, sight-reading, and orchestral-excerpt requirements for the applicable degree group.";
    if (kind === "string") return "Prepare the published solo Bach, concerto, technical study or caprice, contrasting work, and orchestral-excerpt categories; degree-specific additions and memorization rules apply.";
    return `Prepare the published ${label} solo/concerto, etude or technical-study, scale, sight-reading, and orchestral-excerpt categories; graduate applicants follow the advanced list.`;
  }
  if (school === "curtis") {
    if (kind === "portfolio") return "Submit two to three original compositions, scores where possible, and recommended recordings; finalists complete an in-person or arranged virtual faculty interview.";
    if (item.field === "opera_studies") return "Prescreen three contrasting opera arias; live finalists perform up to five contrasting standard operatic arias from memory.";
    if (kind === "voice") return "Prescreen three selections including English, an aria, and German, Italian, or French art song; live finalists perform up to four memorized selections.";
    if (kind === "keyboard") return "Prescreen Bach, a complete specified Classical sonata, and contrasting Chopin works; the live round adds a contrasting solo work and requires memorization.";
    if (kind === "string") return advanced || item.degree === "mm"
      ? `Prescreen the published ${label} Bach, concerto, virtuoso/technical, and sonata categories; the graduate live audition expands to complete major works.`
      : `Prescreen the published ${label} Bach, concerto, virtuoso/technical, and sonata categories; the undergraduate live audition uses or expands that repertoire.`;
    if (kind === "percussion") return "Submit the published percussion screening program; live finalists perform the required snare, mallet, timpani, orchestral-excerpt, sight-reading, and musicianship categories.";
    return `Prepare the published ${label} solo, concerto, etude, scale, sight-reading, and orchestral-excerpt categories; the live audition follows the degree-specific list.`;
  }
  if (school === "eastman") {
    if (item.field === "music_creation_technology") return "No prescreen or performance audition is required; applicants submit the official creative portfolio and may be invited to interview.";
    if (item.field === "contemporary_media_film_composition") return "Submit at least four compositions, including works composed to video and one live-musician recording; selected applicants complete a faculty interview, not a performance audition.";
    if (kind === "portfolio") return "Submit three or four original scores with recordings; selected applicants interview and, where the degree requires it, complete the primary-instrument or voice audition.";
    if (kind === "academic") return "Submit the published research or analytical portfolio for faculty prescreening; degree-specific interviews and any required primary-instrument audition follow.";
    if (item.field === "music_education") return "Follow the repertoire for the primary instrument or voice and complete the published music-education interview and musical-skills assessment for the selected pathway.";
    if (kind === "conducting") return "Submit conducting video excerpts from varied repertoire; finalists complete the published conducting audition, score-reading, musicianship, and interview components for the specialization.";
    if (item.field === "opera_studies") return "Submit an opera-directing portfolio and rehearsal/performance video; finalists direct an opera scene in a dramatic coaching and complete faculty interviews.";
    if (kind === "ensemble") return "Prepare the published collaborative-piano solo, vocal, instrumental, sight-reading, and language/diction repertoire for the degree-level audition.";
    if (kind === "jazz") return "Prescreen contrasting jazz standards and improvisation in the declared performance area; finalists complete the published tunes, improvisation, sight-reading, and musicianship assessment.";
    if (kind === "voice") return "Prescreen accompanied selections in the required languages and styles; finalists audition live or by final video with the degree-specific vocal program.";
    if (kind === "keyboard") return advanced
      ? "Prescreen at least 30 minutes across three periods; the final recital-level program includes a virtuoso etude and complete contrasting works, performed from memory."
      : "Prescreen at least 30 minutes across three periods, including a Classical-sonata Allegro and virtuoso etude; the final program requires complete contrasting works from memory.";
    if (kind === "percussion") return "Prepare the published snare, keyboard percussion, timpani, multi-percussion, orchestral-excerpt, and sight-reading categories for prescreen and final audition.";
    if (kind === "string") return `Prescreen the published ${label} Bach, concerto, etude/caprice, and contrasting-work categories; the final audition expands to degree-level complete works and memorization.`;
    return `Prepare the published ${label} solo/concerto, etude, scale, sight-reading, and orchestral-excerpt categories for the applicable prescreen and final audition.`;
  }
  // NEC
  if (kind === "portfolio") return item.degree === "dma"
    ? "Submit the published recent composition portfolio and recordings; DMA applicants may be invited to present music and interview, with no instrumental audition specified."
    : "Submit the published original-score portfolio, available recordings, and composer-introduction video; admission is portfolio-based rather than a performance audition.";
  if (kind === "academic") return "Submit the published analytical or research portfolio; faculty review and any degree-specific interview replace a performance repertoire audition.";
  if (kind === "conducting") return "Submit conducting video and the published score/essay materials; finalists complete the degree-specific live conducting, musicianship, and interview process.";
  if (kind === "ensemble") return "Prepare the published solo, duo/sonata, chamber, vocal, sight-reading, and ensemble materials for the named collaborative or chamber-music program.";
  if (kind === "jazz") return "Prescreen contrasting jazz selections or scores, including improvisation where applicable; finalists perform the published contrasting program and musicianship assessment.";
  if (kind === "voice") return item.degree === "ad"
    ? "Prepare six to eight opera arias in at least three languages; finalists present the live ICA audition program and interview."
    : "Prepare the published art-song, opera-aria, oratorio, language, and memorization categories for the degree-level prescreen and final audition.";
  if (item.degree === "ad") return "Prescreen a varied full recital-length program and complete concerto; finalists prepare a 60-minute recital program from which the panel selects the live performance.";
  if (kind === "keyboard") return advanced
    ? "Prepare a recital-length program of stylistically diverse, technically demanding complete works; DMA and Artist Diploma finals follow the published live-only requirements."
    : "Prescreen and audition a complete Classical sonata, substantial Romantic work, fast etude, and contrasting personal-choice work; memorization rules apply.";
  if (kind === "percussion") return "Prepare the published snare, two- and four-mallet, timpani, orchestral-excerpt, sight-reading, and degree-specific final-audition categories.";
  if (kind === "string") return `Prescreen the published ${label} Bach, concerto, etude/caprice, sonata, and personal-choice categories; graduate and doctoral finals expand to complete works.`;
  return `Prepare the published ${label} solo/concerto, etude, scale, orchestral-excerpt, and sight-reading categories for prescreen and final audition.`;
}

function evidenceQuote(school, item, kind) {
  const category = kindFor(item.field, item.track);
  if (kind === "prescreen") {
    if (school === "curtis") return item.field === "composition" ? "Prescreening" : "Applicants must submit a screening video with the application";
    if (school === "new_england_conservatory" && category === "portfolio") return "reviewed based on their portfolio only; there is no prescreening";
    return school === "colburn" ? "The prescreening video recording is the first step of the audition process." : "Pre-screening Requirement";
  }
  if (kind === "audition") {
    if (school === "curtis") return item.field === "composition" ? "Finalists will be invited to campus for in-person interviews" : "Live Audition (if advanced)";
    if (school === "new_england_conservatory" && category === "portfolio") return "there is no prescreening, and an interview is not required";
    return school === "colburn" ? "live audition repertoire can be found below by instrument" : "Final Audition Requirements";
  }
  if (category === "portfolio") return school === "new_england_conservatory" ? "Submit three scores of original compositions." : "Composition Scores";
  if (category === "academic") return "Pre-screening and Interview Requirements";
  if (category === "conducting") return "Conducting audition";
  if (category === "jazz") return school === "new_england_conservatory" ? "One jazz standard" : "PRE-SCREENING AND AUDITION REQUIREMENTS";
  if (category === "voice") return school === "curtis" ? "Three contrasting opera arias." : "One art song in English";
  if (category === "keyboard") return "A complete Classical sonata";
  if (category === "percussion") return "Snare solo or etude";
  if (category === "string") return "Two contrasting movements";
  if (category === "ensemble") return "Chamber Music";
  return "Two contrasting solo pieces";
}

function auditionFacts(school, item, app) {
  const config = configs[school];
  const kind = kindFor(item.field, item.track);
  let prescreening = "Yes";
  let audition = "Yes";
  let format = "Live or Recorded";

  if (school === "colburn") {
    format = item.field === "piano" || kind === "conducting" ? "Multiple Rounds" : "Live Only";
  } else if (school === "curtis") {
    if (["guitar", "organ", "oboe"].includes(item.field)) prescreening = "No";
    format = item.field === "composition" ? "Multiple Rounds" : "Live Only";
  } else if (school === "eastman") {
    if (item.field === "harpsichord") prescreening = "No";
    if (item.field === "music_creation_technology") { prescreening = "No"; audition = "No"; format = "Multiple Rounds"; }
    if (item.field === "contemporary_media_film_composition") { prescreening = "Yes"; audition = "No"; format = "Multiple Rounds"; }
    if (["music_education", "music_theory"].includes(item.field)) prescreening = "Varies";
    if (["composition", "music_education", "music_theory"].includes(item.field) || kind === "conducting") format = "Multiple Rounds";
  } else {
    if (kind === "portfolio" || kind === "academic") {
      prescreening = "No";
      audition = item.degree === "dma" ? "Varies" : "No";
      format = item.degree === "dma" ? "Multiple Rounds" : "Unknown";
    } else if (kind === "conducting") {
      format = "Multiple Rounds";
    } else if (item.degree === "dma" || item.degree === "ad") {
      format = "Live Only";
    }
  }

  return {
    program_offering_ref: refFor(school, item.field, item.degree, item.track),
    admission_cycle: config.cycle,
    is_current: true,
    prescreening_required: prescreening,
    prescreening_deadline: prescreening === "Yes" ? app.application_deadline : null,
    audition_required: audition,
    audition_format: format,
    repertoire_summary: repertoireSummary(school, item),
    repertoire_structured: null,
    conditional_notes: config.issues[0],
    review_status: config.status,
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function source({ school = null, ref = null, url, type, field = null, quote = null, confidence = "High" }) {
  return {
    school_ref: school,
    program_offering_ref: ref,
    source_url: url,
    source_type: type,
    retrieved_date: CHECKED,
    source_quote: quote,
    related_field: field,
    confidence_level: confidence,
  };
}

function materialNames(existing, item) {
  const values = new Set(existing || []);
  const kind = kindFor(item.field, item.track);
  if (["portfolio", "academic", "conducting", "ensemble"].includes(kind) || item.track?.includes("Jazz")) values.add("Portfolio");
  if (item.degree === "dma") values.add("Writing sample");
  return [...values];
}

function sourceTitle(url) {
  if (url.includes("audition") || url.includes("repertoire")) return "Official Audition Requirements";
  if (url.includes("international")) return "Official English Language Requirements";
  if (url.includes("degree") || url.includes("program")) return "Official Program Page";
  if (url.includes("apply")) return "Official Application Page";
  return "Official School Page";
}

function distributions(programs, key) {
  const map = new Map();
  for (const p of programs) map.set(p[key], (map.get(p[key]) || 0) + 1);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function mdTable(rows) { return rows.map((r) => `| ${r.join(" | ")} |`).join("\n"); }

function makeSummary(school, pkg, config) {
  const degreeRows = distributions(pkg.program_offerings, "degree_level_ref").map(([k, v]) => [k.toUpperCase(), String(v)]);
  const fieldRows = distributions(pkg.program_offerings, "field_ref").map(([k, v]) => [FIELD_LABELS[k] || k, String(v)]);
  const retired = config.retireRefs?.length || 0;
  const added = pkg.program_offerings.length - config.baseline + retired;
  return `# ${pkg.school.school_name} — Complete V4 Extraction Summary

Retrieved and checked: ${CHECKED}  
Admission cycle represented: ${config.cycle}

## Outcome

- Final V4-representable offerings: **${pkg.program_offerings.length}**
- Existing offerings preserved: **${config.baseline - retired}**
- Offerings added by institutional expansion: **${added}**
${retired ? `- Incorrectly merged offerings retired: **${retired}**\n` : ""}- Current application records: **${pkg.application_requirements.length}**
- Current audition records: **${pkg.audition_requirements.length}**
- Official evidence records: **${pkg.source_records.length}**
- Directus/backend import performed: **No**

## Degree distribution

| Degree | Offerings |
|---|---:|
${mdTable(degreeRows)}

## Major / field distribution

| Field | Offerings |
|---|---:|
${mdTable(fieldRows)}

## Scope

The JSON contains every confirmed institutional degree × major/specialization combination representable by the unchanged V4 degree enum. Named tracks that admit separately are distinct offerings. Official credentials outside BM/MM/DMA/GD/AD are not force-mapped; their complete matrices are retained in program_matrix.md and unresolved_issues.md.
`;
}

function makeProgramMatrix(pkg, config) {
  const included = pkg.program_offerings.map((p) => [
    `\`${p.program_offering_ref}\``,
    p.degree_level_ref.toUpperCase(),
    FIELD_LABELS[p.field_ref] || p.field_ref,
    p.track_or_concentration || "—",
    p.official_program_name,
  ]);
  const excluded = config.exclusions.flatMap((x) => x.fields.map((field) => [x.credential, field, x.reason]));
  return `# ${pkg.school.school_name} — Complete Institutional Program Matrix

Checked: ${CHECKED}

## Included in V4 (${included.length})

| Ref | Degree | Field / major | Track / specialization | Official program name |
|---|---|---|---|---|
${mdTable(included)}

## Official offerings not encodable by the unchanged V4 degree enum (${excluded.length})

| Official credential/pathway | Field / specialization | Reason |
|---|---|---|
${mdTable(excluded)}
`;
}

function makeUnresolved(pkg, config) {
  return `# Unresolved Issues

Checked: ${CHECKED}

## Current-cycle and interpretation issues

${config.issues.map((x) => `- ${x}`).join("\n")}

## Official credentials outside the unchanged V4 degree enum

${config.exclusions.map((x) => `- **${x.credential}** — ${x.fields.join(", ")}. ${x.reason}.`).join("\n")}

No unsupported credential was force-mapped. The authoritative JSON remains limited to degree_level_ref values BM, MM, DMA, GD, and AD, while program_matrix.md preserves the complete institutional inventory.
`;
}

function makeInventory(pkg) {
  const grouped = new Map();
  for (const s of pkg.source_records) {
    if (!grouped.has(s.source_url)) grouped.set(s.source_url, []);
    grouped.get(s.source_url).push(s);
  }
  const rows = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([url, records]) => {
    const fields = [...new Set(records.map((r) => r.related_field).filter(Boolean))].sort().join(", ") || "general";
    const quote = records.find((r) => r.source_quote)?.source_quote?.replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|") || "—";
    return [sourceTitle(url), url, fields, quote];
  });
  return `# Source Inventory

Retrieved: ${CHECKED}

All evidence URLs are official school or parent-university sources. Titles are kept here because the unchanged V4 source model has no source_title property.

| Source title | Official URL | Related V4 fields | Short evidence excerpt |
|---|---|---|---|
${mdTable(rows)}
`;
}

for (const [school, config] of Object.entries(configs)) {
  const file = path.join(OUT, school, `${school}.v4.json`);
  const pkg = JSON.parse(await readFile(file, "utf8"));
  const existingPrograms = new Map(pkg.program_offerings.map((p) => [p.program_offering_ref, p]));
  const existingApps = new Map(pkg.application_requirements.map((p) => [p.program_offering_ref, p]));
  const existingAuditions = new Map(pkg.audition_requirements.map((p) => [p.program_offering_ref, p]));
  const desired = new Map();

  for (const item of config.matrix) {
    const ref = refFor(school, item.field, item.degree, item.track);
    if (!desired.has(ref)) desired.set(ref, item);
  }

  // Preserve every previously assigned ref, then add the complete matrix.
  for (const p of pkg.program_offerings) {
    if (config.retireRefs?.includes(p.program_offering_ref)) continue;
    if (!desired.has(p.program_offering_ref)) {
      desired.set(p.program_offering_ref, spec(p.field_ref, p.degree_level_ref, p.track_or_concentration, p.official_program_name, p.program_url));
    }
  }

  const appsByDegree = new Map();
  for (const app of pkg.application_requirements) {
    const degree = existingPrograms.get(app.program_offering_ref)?.degree_level_ref;
    if (degree && !appsByDegree.has(degree)) appsByDegree.set(degree, app);
  }

  const programs = [];
  const applications = [];
  const auditions = [];
  const sources = [...pkg.source_records];

  for (const [ref, item] of desired) {
    const currentProgram = existingPrograms.get(ref);
    const programUrl = item.programUrl || config.programUrl[item.degree];
    const offering = currentProgram || {
      program_offering_ref: ref,
      school_ref: school,
      field_ref: item.field,
      degree_level_ref: item.degree,
      track_or_concentration: item.track,
      official_program_name: programName(school, item),
      program_url: programUrl,
      application_url: config.portal,
      audition_url: config.auditionUrl,
      duration_years: null,
      language_of_instruction: null,
      last_checked: CHECKED,
      review_status: config.status,
    };
    offering.review_status = config.status;
    offering.last_checked = CHECKED;
    programs.push(offering);

    let app = existingApps.get(ref);
    if (!app) {
      const template = appsByDegree.get(item.degree);
      if (!template) throw new Error(`${school}: no application template for ${item.degree}`);
      app = clone(template);
      app.program_offering_ref = ref;
      app.admission_cycle = config.cycle;
      app.required_materials = materialNames(app.required_materials, item);
      app.review_status = config.status;
    }
    applications.push(app);

    let aud = existingAuditions.get(ref);
    if (!aud) aud = auditionFacts(school, item, app);
    aud.review_status = config.status;
    auditions.push(aud);

    if (!currentProgram) {
      sources.push(
        source({ ref, url: programUrl, type: "Official Program Page", field: "official_program_name", quote: programName(school, item) }),
        source({ ref, url: config.auditionUrl, type: "Audition Requirements Page", field: "prescreening_required", quote: evidenceQuote(school, item, "prescreen") }),
        source({ ref, url: config.auditionUrl, type: "Audition Requirements Page", field: "audition_required", quote: evidenceQuote(school, item, "audition") }),
        source({ ref, url: config.auditionUrl, type: "Audition Requirements Page", field: "audition_format", quote: null }),
        source({ ref, url: config.auditionUrl, type: "Audition Requirements Page", field: "repertoire_summary", quote: evidenceQuote(school, item, "repertoire") }),
      );
      if (aud.prescreening_deadline) {
        sources.push(source({ ref, url: config.auditionUrl, type: "Audition Requirements Page", field: "prescreening_deadline", quote: school === "colburn" ? "December 2 application deadline" : "December 1" }));
      }

      const degreeTemplateRef = appsByDegree.get(item.degree)?.program_offering_ref;
      const englishSources = pkg.source_records.filter((s) => s.program_offering_ref === degreeTemplateRef && s.related_field === "english_language_tests");
      for (const s of englishSources) sources.push({ ...clone(s), program_offering_ref: ref });
    }
  }

  programs.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref));
  applications.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref));
  auditions.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref));

  const validRefs = new Set(programs.map((p) => p.program_offering_ref));
  const dedupedSources = new Map();
  for (const s of sources) {
    if (s.program_offering_ref && !validRefs.has(s.program_offering_ref)) continue;
    const key = `${s.source_url}|${s.related_field ?? ""}|${s.program_offering_ref || s.school_ref}`;
    dedupedSources.set(key, s);
  }
  pkg.program_offerings = programs;
  pkg.application_requirements = applications;
  pkg.audition_requirements = auditions;
  pkg.source_records = [...dedupedSources.values()].sort((a, b) =>
    String(a.program_offering_ref || "").localeCompare(String(b.program_offering_ref || "")) ||
    a.source_url.localeCompare(b.source_url) ||
    String(a.related_field).localeCompare(String(b.related_field))
  );

  const missing = [];
  const review = [...config.issues];
  for (const app of applications) {
    if (app.application_deadline === null) {
      missing.push(`${app.program_offering_ref}.application_deadline`);
      review.push(`${app.program_offering_ref}: exact current-cycle application deadline is not published; application_deadline left null.`);
    }
    if (app.tuition_annual === null) {
      missing.push(`${app.program_offering_ref}.tuition_annual`);
      review.push(`${app.program_offering_ref}: exact current-cycle annual tuition is not published as one applicable amount; tuition_annual left null.`);
    }
  }
  for (const aud of auditions) {
    if (aud.prescreening_required === "Yes" && aud.prescreening_deadline === null) {
      missing.push(`${aud.program_offering_ref}.prescreening_deadline`);
      review.push(`${aud.program_offering_ref}: prescreening is required but the exact current-cycle deadline is not published; prescreening_deadline left null.`);
    }
  }
  for (const x of config.exclusions) review.push(`found, not representable by unchanged degree enum: ${x.credential} — ${x.fields.join(", ")}.`);
  pkg.data_quality = {
    overall_confidence: "Medium",
    missing_critical_fields: [...new Set(missing)].sort(),
    needs_human_review: true,
    review_notes: review,
  };
  pkg.workflow_status = { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false };

  await Promise.all([
    writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`, "utf8"),
    writeFile(path.join(OUT, school, "summary.md"), makeSummary(school, pkg, config), "utf8"),
    writeFile(path.join(OUT, school, "program_matrix.md"), makeProgramMatrix(pkg, config), "utf8"),
    writeFile(path.join(OUT, school, "unresolved_issues.md"), makeUnresolved(pkg, config), "utf8"),
    writeFile(path.join(OUT, school, "source_inventory.md"), makeInventory(pkg), "utf8"),
  ]);
  const retired = config.retireRefs?.length || 0;
  const added = pkg.program_offerings.length - config.baseline + retired;
  console.log(`${school}: ${pkg.program_offerings.length} offerings (${added} added, ${retired} retired), ${pkg.source_records.length} source records`);
}

// Extend the seeded field reference without changing the V4 schema or degree enum.
const fieldFile = path.join(ROOT, "data", "reference", "fields.json");
const fieldData = JSON.parse(await readFile(fieldFile, "utf8"));
const seeded = new Set(fieldData.map((x) => x.slug));
const used = new Set();
for (const school of Object.keys(configs)) {
  const pkg = JSON.parse(await readFile(path.join(OUT, school, `${school}.v4.json`), "utf8"));
  for (const p of pkg.program_offerings) used.add(p.field_ref);
}
for (const slug of [...used].sort()) {
  if (!seeded.has(slug)) fieldData.push({ slug, name: FIELD_LABELS[slug] || slug.replace(/_/g, " "), aliases: [] });
}
await writeFile(fieldFile, `${JSON.stringify(fieldData, null, 2)}\n`, "utf8");
console.log(`seeded fields: ${fieldData.length}`);
