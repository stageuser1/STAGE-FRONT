#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "UK_music_conservatoires");
const CHECKED = "2026-07-21";
const CYCLE = "2027-2028";

const LABELS = {
  bass_trombone: "Bass Trombone", bassoon: "Bassoon", cello: "Cello",
  choral_conducting: "Choral Conducting", clarinet: "Clarinet",
  collaborative_piano: "Collaborative Piano", composition: "Composition",
  contemporary_media_film_composition: "Composition for Screen",
  contemporary_musical_arts: "Popular Music", double_bass: "Double Bass",
  early_music: "Historical Performance", euphonium: "Euphonium", flute: "Flute",
  guitar: "Guitar", harp: "Harp", harpsichord: "Harpsichord", horn: "Horn",
  jazz_performance: "Jazz Performance", jazz_studies: "Jazz Studies",
  music_creation_technology: "Electronic and Produced Music",
  music_education: "Music Education", musicology: "Musicology", oboe: "Oboe",
  opera_studies: "Opera Studies", orchestral_conducting: "Orchestral Conducting",
  organ: "Organ", percussion: "Timpani and Percussion", piano: "Piano",
  saxophone: "Saxophone", tenor_trombone: "Trombone", trumpet: "Trumpet",
  tuba: "Tuba", viola: "Viola", violin: "Violin", voice: "Vocal Performance",
};

const PERFORMANCE_FIELDS = [
  "piano", "organ", "harpsichord", "violin", "viola", "cello", "double_bass",
  "harp", "guitar", "flute", "oboe", "clarinet", "bassoon", "saxophone",
  "horn", "trumpet", "tenor_trombone", "bass_trombone", "tuba", "euphonium",
  "percussion", "voice",
];

const ORCHESTRAL_FIELDS = PERFORMANCE_FIELDS.filter((f) => !["voice"].includes(f));
const MATERIALS = ["Online application", "Recommendation letters", "Résumé/CV", "Essay/Personal statement", "Transcripts"];

const slugify = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
const refFor = (school, field, degree, track) => `${school}_${field}_${degree}${track ? `_${slugify(track)}` : ""}`;

function offering(schoolRef, field, degree, award, url, duration, track = null, auditionUrl = null, applicationUrl = null) {
  return {
    program_offering_ref: refFor(schoolRef, field, degree, track),
    school_ref: schoolRef,
    field_ref: field,
    degree_level_ref: degree,
    track_or_concentration: track,
    official_program_name: `${award} — ${LABELS[field] || field}`,
    program_url: url,
    application_url: applicationUrl,
    audition_url: auditionUrl,
    duration_years: duration,
    language_of_instruction: null,
    last_checked: CHECKED,
    review_status: "Extracted",
  };
}

function src({ school = null, program = null, url, type, field = null, quote = null, confidence = "High" }) {
  return { school_ref: school, program_offering_ref: program, source_url: url, source_type: type, retrieved_date: CHECKED, source_quote: quote, related_field: field, confidence_level: confidence };
}

function addMatrix(target, schoolRef, fields, variants, urls) {
  for (const field of fields) {
    for (const v of variants) {
      const url = typeof urls.program === "function" ? urls.program(field, v) : urls.program;
      const auditionUrl = typeof urls.audition === "function" ? urls.audition(field, v) : urls.audition;
      target.push(offering(schoolRef, field, v.degree, v.award, url, v.duration, v.track ?? null, auditionUrl, urls.apply));
    }
  }
}

function repFor(field, degree, track, schoolRef) {
  const graduate = degree !== "bm";
  const common = {
    violin: graduate ? "A major concerto movement and one contrasting work; the panel may select excerpts from the prepared programme." : "A first or substantial concerto movement or another work originally written for violin and orchestra.",
    viola: graduate ? "A major concerto movement and one contrasting work; the panel may select excerpts from the prepared programme." : "A first or substantial concerto movement or another work originally written for viola and orchestra.",
    cello: graduate ? "A major concerto movement and one contrasting work; the panel may select excerpts from the prepared programme." : "A first or substantial concerto movement or another work originally written for cello and orchestra.",
    double_bass: "Two contrasting works demonstrating technical command and musical range.",
    harp: graduate ? "Two contrasting works." : "The specified Nadermann or Zabel work plus one contrasting work.",
    guitar: "A contrasting classical programme selected from the school’s published set works and categories.",
    piano: graduate ? "A varied memorized solo programme of advanced repertoire; programme length and selection vary by award." : "A contrasting memorized solo programme showing a range of style, period and character.",
    organ: "A Bach work, an additional prescribed work or movement, and contrasting repertoire as published for the award level.",
    harpsichord: "A contrasting programme demonstrating command of seventeenth- and eighteenth-century repertoire, normally including a substantial Bach work.",
    flute: graduate ? "Two contrasting works." : "The prescribed Fauré work plus one contrasting work.",
    oboe: graduate ? "The prescribed Mozart concerto movements plus one contrasting work." : "The specified Handel or Cimarosa movements plus one contrasting work.",
    clarinet: graduate ? "The prescribed Mozart concerto movement plus one contrasting work." : "The specified Schumann movements plus one contrasting work.",
    bassoon: graduate ? "The prescribed Mozart concerto movement plus one contrasting work." : "A Baroque work plus one contrasting work.",
    saxophone: graduate ? "Two contrasting works, including one composed after 1950 where specified." : "The prescribed work plus one contrasting work.",
    horn: "A prescribed solo work or concerto movement plus a contrasting work.",
    trumpet: "A prescribed concerto movement plus a contrasting work.",
    tenor_trombone: "A prescribed solo work plus a contrasting work.",
    bass_trombone: "A prescribed concerto or solo work plus a contrasting work.",
    tuba: "A prescribed concerto movement plus a contrasting work.",
    euphonium: "A contrasting programme selected to demonstrate technical and musical range.",
    percussion: "A contrasting programme covering the principal percussion disciplines specified by the department.",
    voice: track?.toLowerCase().includes("opera") ? "Four contrasting operatic arias in varied languages, including one in English or English translation." : "Three contrasting classical pieces, including specified language and aria categories for the award level.",
    composition: "A portfolio of contrasting original compositions followed, for shortlisted applicants, by an interview about the submitted work.",
    contemporary_media_film_composition: "A portfolio demonstrating musical expression, orchestration, music technology and awareness of music’s narrative role in screen media.",
    orchestral_conducting: "A first-round conducting video portfolio followed by further practical audition rounds for shortlisted applicants.",
    choral_conducting: "A conducting portfolio or prescreen followed by practical and interview assessment for shortlisted applicants.",
    jazz_performance: "Contrasting jazz performances demonstrating improvisation, stylistic awareness and ensemble communication.",
    jazz_studies: "Contrasting jazz performances demonstrating improvisation, stylistic awareness and ensemble communication.",
    contemporary_musical_arts: "Contrasting performances or production work appropriate to the applicant’s popular-music specialism, followed by further assessment if shortlisted.",
    music_creation_technology: "A portfolio of original electronic or produced music followed by an interview or practical assessment.",
    music_education: "A practical music audition and interview assessing principal-study ability and suitability for professional music education.",
    collaborative_piano: "A collaborative programme including both instrumental and vocal repertoire, with sight-reading or quick-study assessment where specified.",
    opera_studies: "Contrasting operatic arias in different languages, followed by further dramatic and musical assessment where specified.",
  };
  if (schoolRef === "guildhall_school_of_music_and_drama" && field === "jazz_performance") return "Two jazz standards: one medium or medium-up swing and one in a contrasting tempo or feel; recorded applicants submit the same two categories.";
  if (schoolRef === "guildhall_school_of_music_and_drama" && field === "composition") return "Three contrasting original compositions are submitted with the application; shortlisted applicants discuss the portfolio at interview.";
  if (schoolRef === "royal_academy_of_music" && field === "piano") return graduate ? "A demanding, stylistically varied solo programme; the published duration and written-work requirements depend on MA or MMus route." : "A free-choice solo programme of at least two works and at least 30 minutes, with stylistic variety and performance from memory except complex contemporary music.";
  return common[field] || "A contrasting programme following the department’s current published audition categories for the selected principal study.";
}

function quoteFor(field, schoolRef) {
  if (schoolRef === "royal_college_of_music") {
    const q = {
      violin: "Applicants should prepare a first (or significant) movement of a concerto, or a work written originally for violin and orchestra.",
      viola: "Applicants should prepare a first (or significant) movement of a concerto, or a work written originally for viola and orchestra.",
      cello: "Applicants should prepare a first (or significant) movement of a concerto, or a work written originally for cello and orchestra.",
      double_bass: "Applicants should prepare two contrasting pieces.", piano: "Applicants should present a programme of three works of their own choice, played from memory.",
      voice: "Applicants should prepare three contrasting pieces including one in English and one in Italian.",
      composition: "Applicants submit a portfolio for assessment and shortlisted candidates are interviewed about their work.",
      orchestral_conducting: "Stage 1 requires an original video recording of rehearsal or performance work conducted by the applicant.",
    }; return q[field] || "Applicants should prepare all of the repertoire listed for their principal study and chosen level.";
  }
  if (schoolRef === "royal_academy_of_music" && field === "piano") return "For your undergraduate audition, you must prepare a comprehensive solo programme that demonstrates stylistic variety and technical accomplishment.";
  if (schoolRef === "guildhall_school_of_music_and_drama" && field === "jazz_performance") return "Perform two jazz standards, one as a medium or medium/up swing and the other in a contrasting tempo/feel.";
  if (schoolRef === "guildhall_school_of_music_and_drama" && field === "composition") return "You will be required to upload three contrasting compositions in the Supporting Information section of the online application form.";
  if (schoolRef === "royal_conservatoire_of_scotland") return "Audition requirements depend on which principal study you are applying for; the individual department pages publish the required repertoire.";
  if (schoolRef === "royal_northern_college_of_music") return "Applicants should follow the current undergraduate or postgraduate audition requirements published for their instrument or discipline.";
  return "Requirements vary by department, including repertoire and format.";
}

function makeSchool(config) {
  const programs = config.programs.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref));
  const app = [];
  const aud = [];
  const sources = [];
  const notes = [...config.reviewNotes];
  const missing = [];

  sources.push(src({ school: config.school.school_ref, url: config.urls.scholarship, type: "Application Requirements Page", field: "scholarships_available", quote: config.quotes.scholarship }));

  for (const p of programs) {
    const a = config.application(p);
    const {
      deadline_url, deadline_quote, deadline_confidence,
      tuition_url, tuition_quote, tuition_confidence,
      english_url, english_quote,
      ...applicationRecord
    } = a;
    if (["composition", "contemporary_media_film_composition", "music_creation_technology", "musicology"].includes(p.field_ref)) {
      applicationRecord.required_materials = [...applicationRecord.required_materials, "Portfolio"];
    }
    if (["orchestral_conducting", "choral_conducting"].includes(p.field_ref)) {
      applicationRecord.required_materials = [...applicationRecord.required_materials, "Prescreen materials"];
    }
    app.push({ program_offering_ref: p.program_offering_ref, admission_cycle: CYCLE, is_current: true, ...applicationRecord });
    if (a.application_deadline !== null) sources.push(src({ program: p.program_offering_ref, url: deadline_url || p.program_url, type: "Application Requirements Page", field: "application_deadline", quote: deadline_quote, confidence: deadline_confidence || "High" }));
    else { const n = `${p.program_offering_ref}: current 2027-entry application deadline was not verified on ${p.program_url}; application_deadline left null.`; notes.push(n); missing.push(n); }
    if (a.tuition_annual !== null) sources.push(src({ program: p.program_offering_ref, url: tuition_url, type: "Deadline/Fee Page", field: "tuition_annual", quote: tuition_quote, confidence: tuition_confidence || "High" }));
    else { const n = `${p.program_offering_ref}: 2027-28 tuition was not published on ${tuition_url}; tuition_annual left null.`; notes.push(n); missing.push(n); }
    if (a.ielts_minimum !== null) sources.push(src({ program: p.program_offering_ref, url: english_url, type: "English Language Requirements Page", field: "ielts_minimum", quote: english_quote }));
    if (a.toefl_minimum !== null) sources.push(src({ program: p.program_offering_ref, url: english_url, type: "English Language Requirements Page", field: "toefl_minimum", quote: english_quote }));
    sources.push(src({ program: p.program_offering_ref, url: p.program_url, type: "Official Program Page", field: "official_program_name", quote: null }));

    const r = config.audition(p);
    aud.push({ program_offering_ref: p.program_offering_ref, admission_cycle: CYCLE, is_current: true, ...r });
    if (r.prescreening_required !== "Unknown") sources.push(src({ program: p.program_offering_ref, url: p.audition_url || config.urls.audition, type: "Audition Requirements Page", field: "prescreening_required", quote: config.quotes.prescreen }));
    if (r.audition_required !== "Unknown") sources.push(src({ program: p.program_offering_ref, url: p.audition_url || config.urls.audition, type: "Audition Requirements Page", field: "audition_required", quote: config.quotes.audition }));
    if (r.repertoire_summary) sources.push(src({ program: p.program_offering_ref, url: p.audition_url || config.urls.audition, type: "Audition Requirements Page", field: "repertoire_summary", quote: quoteFor(p.field_ref, config.school.school_ref) }));
    else if (r.audition_required === "Yes" || r.prescreening_required === "Yes") { const n = `${p.program_offering_ref}: repertoire was not published on ${p.audition_url || config.urls.audition}; repertoire_summary left null.`; notes.push(n); missing.push(n); }
  }

  const critical = [];
  for (const a of app) {
    if (a.application_deadline === null) critical.push(`${a.program_offering_ref}.application_deadline`);
    if (a.tuition_annual === null) critical.push(`${a.program_offering_ref}.tuition_annual`);
  }
  for (const a of aud) if ((a.audition_required === "Yes" || a.prescreening_required === "Yes") && !a.repertoire_summary) critical.push(`${a.program_offering_ref}.repertoire_summary`);

  const packageData = {
    schema_version: "stage_school_extraction_v4",
    school: config.school,
    program_offerings: programs,
    application_requirements: app.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref)),
    audition_requirements: aud.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref)),
    source_records: sources.sort((a, b) => `${a.program_offering_ref || ""}|${a.source_url}|${a.related_field || ""}`.localeCompare(`${b.program_offering_ref || ""}|${b.source_url}|${b.related_field || ""}`)),
    data_quality: { overall_confidence: critical.length ? "Medium" : "High", missing_critical_fields: critical.sort(), needs_human_review: notes.length > 0, review_notes: notes.sort() },
    workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
  };
  return { packageData, missing };
}

function baseApplication({ deadline, deadlineUrl, deadlineQuote, tuition, tuitionUrl, tuitionQuote, ielts, toefl = null, englishUrl, englishQuote, notes = null, status = "Extracted" }) {
  return {
    application_deadline: deadline, deadline_notes: notes, tuition_annual: tuition,
    tuition_currency: tuition === null ? null : "GBP", scholarships_available: "Yes",
    scholarship_note: "Scholarships or financial awards are available; eligibility and award method vary by programme.",
    english_language_tests: ["IELTS", "TOEFL", "Cambridge", "PTE"],
    toefl_minimum: toefl, ielts_minimum: ielts, duolingo_minimum: null,
    required_materials: MATERIALS, conditional_notes: tuition === null ? "The latest official tuition page does not yet state a 2027-28 amount." : "tuition_annual is the full-time overseas/international fee for a new entrant.",
    review_status: status, deadline_url: deadlineUrl, deadline_quote: deadlineQuote,
    tuition_url: tuitionUrl, tuition_quote: tuitionQuote, english_url: englishUrl, english_quote: englishQuote,
  };
}

function baseAudition(p, config, overrides = {}) {
  const portfolio = ["composition", "contemporary_media_film_composition", "music_creation_technology", "musicology"].includes(p.field_ref);
  const research = p.degree_level_ref === "dma";
  return {
    prescreening_required: portfolio ? "Varies" : "Varies", prescreening_deadline: null,
    audition_required: research ? "Varies" : (portfolio ? "Varies" : "Yes"),
    audition_format: research ? "Unknown" : (portfolio ? "Multiple Rounds" : "Live or Recorded"),
    repertoire_summary: research ? null : repFor(p.field_ref, p.degree_level_ref, p.track_or_concentration, config.school.school_ref),
    repertoire_structured: null,
    conditional_notes: portfolio ? "Selection is based on portfolio or recorded work and interview; the exact sequence varies by programme." : "Prescreening applies to some international, recorded or high-demand routes; consult the current location-specific instructions.",
    review_status: "Extracted", ...overrides,
  };
}

const configs = [];

// 1. Royal College of Music
{
  const schoolRef = "royal_college_of_music";
  const programs = [];
  const urls = {
    apply: "https://www.rcm.ac.uk/apply/", audition: "https://www.rcm.ac.uk/apply/auditions/",
    scholarship: "https://www.rcm.ac.uk/apply/feesandfunding/scholarships/",
    fees: "https://www.rcm.ac.uk/media/Tuition%20Fees%20and%20Other%20Charges%202027-28.pdf",
    english: "https://www.rcm.ac.uk/media/RCM%20List%20of%20approved%20English%20tests%20and%20scores%202026%20onwards%20(minor%20update%20June%202026).pdf",
  };
  const facultyUrl = (f) => {
    if (["violin", "viola", "cello", "double_bass", "harp", "guitar"].includes(f)) return "https://www.rcm.ac.uk/strings/auditionrequirements/";
    if (["flute", "oboe", "clarinet", "bassoon", "saxophone"].includes(f)) return "https://www.rcm.ac.uk/woodwind/auditionrequirements/";
    if (["horn", "trumpet", "tenor_trombone", "bass_trombone", "tuba", "euphonium"].includes(f)) return "https://www.rcm.ac.uk/brass/auditionrequirements/";
    if (["piano", "organ", "harpsichord", "collaborative_piano"].includes(f)) return "https://www.rcm.ac.uk/keyboard/auditionrequirements/";
    if (f === "voice" || f === "opera_studies") return "https://www.rcm.ac.uk/vocal/auditionrequirements/";
    if (f === "composition" || f === "contemporary_media_film_composition") return "https://www.rcm.ac.uk/composition/auditionrequirements/";
    if (f === "orchestral_conducting") return "https://www.rcm.ac.uk/conducting/auditionrequirements/";
    return "https://www.rcm.ac.uk/percussion/auditionrequirements/";
  };
  const modern = PERFORMANCE_FIELDS.filter((f) => f !== "euphonium");
  addMatrix(programs, schoolRef, modern, [{ degree: "bm", award: "Bachelor of Music (BMus)", duration: 4 }], { program: "https://www.rcm.ac.uk/courses/undergraduate/bmus/", audition: (f) => facultyUrl(f), apply: urls.apply });
  addMatrix(programs, schoolRef, modern, [
    { degree: "mm", award: "Master of Performance (MPerf)", duration: 2, track: "Master of Performance" },
    { degree: "mm", award: "Master of Music in Performance (MMus)", duration: 2, track: "Master of Music in Performance" },
    { degree: "ad", award: "Artist Diploma in Performance", duration: 1 },
  ], { program: (f, v) => v.degree === "ad" ? "https://www.rcm.ac.uk/courses/postgraduate/artdipperformance/" : (v.track.startsWith("Master of Performance") ? "https://www.rcm.ac.uk/courses/postgraduate/mperf/" : "https://www.rcm.ac.uk/courses/postgraduate/mmusperformance/"), audition: (f) => facultyUrl(f), apply: urls.apply });
  programs.push(offering(schoolRef, "composition", "bm", "Bachelor of Music (BMus)", "https://www.rcm.ac.uk/courses/undergraduate/bmus/", 4, null, facultyUrl("composition"), urls.apply));
  programs.push(offering(schoolRef, "composition", "mm", "Master of Composition (MComp)", "https://www.rcm.ac.uk/courses/postgraduate/mcomp/", 2, "Master of Composition", facultyUrl("composition"), urls.apply));
  programs.push(offering(schoolRef, "composition", "mm", "Master of Music in Composition (MMus)", "https://www.rcm.ac.uk/courses/postgraduate/mmuscomposition/", 2, "Master of Music in Composition", facultyUrl("composition"), urls.apply));
  programs.push(offering(schoolRef, "composition", "ad", "Artist Diploma in Composition", "https://www.rcm.ac.uk/courses/postgraduate/artdipcomposition/", 1, null, facultyUrl("composition"), urls.apply));
  programs.push(offering(schoolRef, "contemporary_media_film_composition", "mm", "Master of Composition (MComp)", "https://www.rcm.ac.uk/courses/postgraduate/mcomp/", 2, null, facultyUrl("composition"), urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "Master of Performance (MPerf)", "https://www.rcm.ac.uk/courses/postgraduate/mperf/", 2, "Master of Performance", facultyUrl("orchestral_conducting"), urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "Master of Music in Performance (MMus)", "https://www.rcm.ac.uk/courses/postgraduate/mmusperformance/", 2, "Master of Music in Performance", facultyUrl("orchestral_conducting"), urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "ad", "Artist Diploma in Conducting", "https://www.rcm.ac.uk/courses/postgraduate/artdipconducting/", 2, null, facultyUrl("orchestral_conducting"), urls.apply));
  programs.push(offering(schoolRef, "voice", "gd", "Graduate Diploma in Vocal Performance", "https://www.rcm.ac.uk/courses/postgraduate/graddip/", 1, null, facultyUrl("voice"), urls.apply));
  programs.push(offering(schoolRef, "opera_studies", "ad", "Artist Diploma in Opera", "https://www.rcm.ac.uk/courses/postgraduate/artdipopera/", 2, null, facultyUrl("opera_studies"), urls.apply));
  programs.push(offering(schoolRef, "musicology", "dma", "Doctor of Philosophy (PhD)", "https://www.rcm.ac.uk/courses/researchdegrees/phd/", 3, "Doctor of Philosophy", "https://www.rcm.ac.uk/courses/researchdegrees/phd/", "https://www.rcm.ac.uk/apply/"));
  const config = {
    school: { school_ref: schoolRef, school_name: "Royal College of Music", city: "London", country: "United Kingdom", school_type: "Conservatory", official_website: "https://www.rcm.ac.uk/" },
    programs, urls,
    quotes: { scholarship: "Every student who applies for a place on an RCM performance or composition course commencing in 2027 will be considered for scholarship; there is no separate application process.", prescreen: "Overseas audition candidates at high-demand venues must submit a pre-screening video by the application deadline.", audition: "The main basis for admission to the RCM is your performance at audition, whether by video or in person." },
    reviewNotes: [
      "RCM and Royal Academy of Music are kept separate through school_ref royal_college_of_music, the official English name, and abbreviation RCM in the supporting documentation.",
      "Degree crosswalk for STAGE review: MPerf, MComp and MMus map to mm; PhD maps to dma; GradDip maps to gd; Artist Diploma maps to ad.",
      "found, not seeded: Master of Science in Performance Science; Master of Education; Master of Music Education; marimba principal study; recorder; fortepiano; viola da gamba; lute; historical-instrument variants.",
    ],
    application(p) {
      const phd = p.degree_level_ref === "dma";
      const gd = p.degree_level_ref === "gd";
      const ad = p.degree_level_ref === "ad";
      const mmus = p.track_or_concentration?.includes("Master of Music") || phd || p.track_or_concentration === "Artist Diploma in Conducting";
      let tuition = p.degree_level_ref === "bm" ? 32600 : p.degree_level_ref === "mm" ? 34100 : gd ? 34100 : ad ? (p.field_ref === "opera_studies" ? 34100 : 33200) : 22550;
      let ielts = mmus ? 7.0 : 5.5;
      let toefl = mmus ? 5.0 : 4.0;
      return baseApplication({
        deadline: phd ? "2027-01-13" : "2026-10-01", deadlineUrl: urls.apply,
        deadlineQuote: phd ? "For 2027 entry applications must be submitted by 13 January 2027." : "The main application deadline for most programmes for 2027 entry is 1 October 2026.",
        tuition, tuitionUrl: urls.fees, tuitionQuote: `The 2027-28 overseas full-time fee for this award category is £${tuition.toLocaleString("en-GB")}.`,
        ielts, toefl, englishUrl: urls.english,
        englishQuote: mmus ? "MMus, Artist Diploma in Conducting and Doctoral applicants require IELTS 7.0 overall or TOEFL iBT 5.0 on the scale used from 21 January 2026." : "BMus, MPerf, MComp, GradDip and most Artist Diploma applicants require IELTS 5.5 overall or TOEFL iBT 4.0 on the scale used from 21 January 2026.",
        notes: "Most London and video routes close 1 October 2026; some overseas venues close 1 November 2026.",
      });
    },
    audition(p) { return baseAudition(p, config, p.degree_level_ref === "dma" ? { audition_required: "Varies", audition_format: "Multiple Rounds", repertoire_summary: null, conditional_notes: "Doctoral selection uses research materials and interview; practice-based projects may add practical assessment." } : {}); },
  };
  configs.push(config);
}

// 2. Royal Academy of Music
{
  const schoolRef = "royal_academy_of_music";
  const programs = [];
  const urls = { apply: "https://www.ram.ac.uk/apply/how-to-apply", audition: "https://www.ram.ac.uk/apply/auditions", scholarship: "https://www.ram.ac.uk/study/fees-scholarships-and-bursaries", english: "https://www.ram.ac.uk/apply/entry-requirements" };
  const fields = PERFORMANCE_FIELDS.filter((f) => !["euphonium"].includes(f)).concat(["composition", "jazz_performance"]);
  const courseSlug = (f, v) => {
    const base = f === "voice" ? "vocal-studies" : f === "tenor_trombone" ? "trombone" : f.replaceAll("_", "-");
    if (v.degree === "bm") return `https://www.ram.ac.uk/courses/${base}-bmus`;
    if (v.track === "Master of Arts") return `https://www.ram.ac.uk/courses/${base}-ma-performance`;
    if (v.track === "Master of Music") return `https://www.ram.ac.uk/courses/${base}-mmus-performance`;
    return `https://www.ram.ac.uk/study/about-our-courses`;
  };
  addMatrix(programs, schoolRef, fields, [
    { degree: "bm", award: "Bachelor of Music (BMus)", duration: 4 },
    { degree: "mm", award: "Master of Arts (MA)", duration: 2, track: "Master of Arts" },
    { degree: "mm", award: "Master of Music (MMus)", duration: 2, track: "Master of Music" },
  ], { program: courseSlug, audition: courseSlug, apply: urls.apply });
  const proFields = fields.filter((f) => !["composition", "jazz_performance"].includes(f));
  addMatrix(programs, schoolRef, proFields, [{ degree: "ad", award: "Advanced Artist Diploma", duration: 1 }], { program: "https://www.ram.ac.uk/study/about-our-courses", audition: urls.audition, apply: urls.apply });
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "Master of Arts (MA) in Performance", "https://www.ram.ac.uk/courses/ensemble-piano-ma-performance", 2, "Master of Arts", "https://www.ram.ac.uk/courses/ensemble-piano-ma-performance", urls.apply));
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "Master of Music (MMus) in Performance", "https://www.ram.ac.uk/courses/ensemble-piano-mmus-performance", 2, "Master of Music", "https://www.ram.ac.uk/courses/ensemble-piano-mmus-performance", urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "Master of Arts (MA) in Conducting", "https://www.ram.ac.uk/study/about-our-courses", 2, null, urls.audition, urls.apply));
  programs.push(offering(schoolRef, "choral_conducting", "mm", "Master of Arts (MA) in Choral Conducting", "https://www.ram.ac.uk/study/about-our-courses", 2, null, urls.audition, urls.apply));
  programs.push(offering(schoolRef, "opera_studies", "ad", "Advanced Opera Diploma", "https://www.ram.ac.uk/study/about-our-courses", 1, null, urls.audition, urls.apply));
  programs.push(offering(schoolRef, "musicology", "dma", "MPhil/PhD Research Degree", "https://www.ram.ac.uk/study/about-our-courses", 3, "PhD", urls.audition, urls.apply));
  const config = {
    school: { school_ref: schoolRef, school_name: "Royal Academy of Music", city: "London", country: "United Kingdom", school_type: "Conservatory", official_website: "https://www.ram.ac.uk/" }, programs, urls,
    quotes: { scholarship: "The Academy offers scholarships and bursaries to eligible students; awards and eligibility vary by programme.", prescreen: "For September 2027 international auditions, the initial round is via video pre-screening.", audition: "Requirements vary by department, including repertoire and format; the current course page gives the requirements for each area of study." },
    reviewNotes: [
      "RCM and Royal Academy of Music are kept separate through school_ref royal_academy_of_music, the official English name, and abbreviation RAM in the supporting documentation.",
      "Degree crosswalk for STAGE review: MA and MMus map to mm; MPhil/PhD maps to dma; Advanced Artist/Opera Diploma maps to ad.",
      "found, not seeded: Musical Theatre Performance; Musical Direction and Coaching; Répétiteur; Accordion; Baroque viola; natural horn; cornett; sackbut; theorbo; viola da gamba.",
    ],
    application(p) {
      const phd = p.degree_level_ref === "dma";
      const isMA = p.track_or_concentration === "Master of Arts";
      const isMMus = p.track_or_concentration === "Master of Music";
      const tuition = p.degree_level_ref === "bm" ? 29900 : isMA ? 30250 : isMMus ? 35800 : null;
      return baseApplication({ deadline: phd ? null : "2026-10-01", deadlineUrl: p.program_url, deadlineQuote: "The application deadline is 1 October 2026 at 18:00 UK time for equal consideration.", tuition, tuitionUrl: p.program_url, tuitionQuote: tuition ? `The course page lists annual international tuition of £${tuition.toLocaleString("en-GB")}.` : null, ielts: isMMus || phd ? 7.0 : (p.degree_level_ref === "ad" ? 6.0 : 5.5), toefl: isMMus || phd ? 5.0 : (p.degree_level_ref === "ad" ? 4.5 : 4.0), englishUrl: urls.english, englishQuote: isMMus || phd ? "Master of Music and MPhil/PhD applicants require IELTS 7.0 overall or TOEFL iBT 5.0 on the scale used from 21 January 2026." : "BMus and MA applicants require IELTS 5.5 overall; advanced diplomas require IELTS 6.0 overall, with equivalent TOEFL routes published.", status: tuition === null || phd ? "Needs Review" : "Extracted" });
    },
    audition(p) { return baseAudition(p, config, p.degree_level_ref === "dma" ? { audition_required: "Varies", audition_format: "Multiple Rounds", repertoire_summary: null, conditional_notes: "Research applicants submit academic materials and attend interview; practice-led proposals may include artistic evidence." } : {}); },
  };
  configs.push(config);
}

// 3. Guildhall School of Music & Drama
{
  const schoolRef = "guildhall_school_of_music_and_drama";
  const programs = [];
  const urls = { apply: "https://www.gsmd.ac.uk/study-with-guildhall/apply-to-guildhall", audition: "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews", scholarship: "https://www.gsmd.ac.uk/study-with-guildhall/fees-and-funding/scholarships-bursaries-and-financial-awards", fees: "https://www.gsmd.ac.uk/study-with-guildhall/fee-schedule-202728", english: "https://www.gsmd.ac.uk/study-with-guildhall/apply-to-guildhall/academic-entry-criteria/english-language-entry-criteria" };
  const fields = PERFORMANCE_FIELDS.filter((f) => !["euphonium"].includes(f)).concat(["composition", "jazz_performance", "music_creation_technology"]);
  const auditionUrl = (f) => {
    if (["violin", "viola", "cello", "double_bass", "harp", "guitar"].includes(f)) return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/strings-harp-guitar-auditions";
    if (["piano", "organ", "harpsichord", "collaborative_piano"].includes(f)) return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/keyboard-auditions";
    if (f === "voice") return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/vocal-studies-auditions";
    if (f === "composition") return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/composition-auditions";
    if (f === "jazz_performance") return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/jazz-auditions";
    if (f === "music_creation_technology") return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/electronic-produced-music-auditions";
    return "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/wind-brass-percussion-auditions";
  };
  addMatrix(programs, schoolRef, fields, [{ degree: "bm", award: "Bachelor of Music (BMus Hons)", duration: 4 }], { program: "https://www.gsmd.ac.uk/study-with-guildhall/music/bmus-bachelor-of-music-honours-degree", audition: (f) => auditionUrl(f), apply: urls.apply });
  const pgFields = fields.filter((f) => f !== "music_creation_technology");
  addMatrix(programs, schoolRef, pgFields, [
    { degree: "mm", award: "Master of Music in Performance (MMus)", duration: 1, track: "Master of Music" },
    { degree: "mm", award: "Master of Performance (MPerf)", duration: 2, track: "Master of Performance" },
  ], { program: "https://www.gsmd.ac.uk/study-with-guildhall/music/mmusmperf-in-performance-guildhall-artist", audition: (f) => auditionUrl(f), apply: urls.apply });
  const adFields = pgFields.filter((f) => !["composition", "jazz_performance"].includes(f));
  addMatrix(programs, schoolRef, adFields, [{ degree: "ad", award: "Advanced Artist Diploma", duration: 2 }], { program: "https://www.gsmd.ac.uk/study-with-guildhall/music/artist-diploma", audition: (f) => auditionUrl(f), apply: urls.apply });
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "Master of Music in Performance (MMus)", "https://www.gsmd.ac.uk/study-with-guildhall/music/mmusmperf-in-performance-guildhall-artist", 1, "Master of Music", auditionUrl("collaborative_piano"), urls.apply));
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "Master of Performance (MPerf)", "https://www.gsmd.ac.uk/study-with-guildhall/music/mmusmperf-in-performance-guildhall-artist", 2, "Master of Performance", auditionUrl("collaborative_piano"), urls.apply));
  programs.push(offering(schoolRef, "opera_studies", "mm", "Master of Music in Performance (MMus)", "https://www.gsmd.ac.uk/study-with-guildhall/music/mmusmperf-in-performance-guildhall-artist", 2, "Master of Music", "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/opera-studies-auditions", urls.apply));
  programs.push(offering(schoolRef, "opera_studies", "ad", "Advanced Artist Diploma", "https://www.gsmd.ac.uk/study-with-guildhall/music/artist-diploma", 2, null, "https://www.gsmd.ac.uk/study-with-guildhall/music/music-auditions-interviews/opera-studies-auditions", urls.apply));
  programs.push(offering(schoolRef, "musicology", "dma", "MPhil/PhD in Music", "https://www.gsmd.ac.uk/study-with-guildhall/postgraduate-research", 3, "PhD", "https://www.gsmd.ac.uk/study-with-guildhall/postgraduate-research/postgraduate-research-applications", urls.apply));
  const config = {
    school: { school_ref: schoolRef, school_name: "Guildhall School of Music & Drama", city: "London", country: "United Kingdom", school_type: "Arts University", official_website: "https://www.gsmd.ac.uk/" }, programs, urls,
    quotes: { scholarship: "When you have been offered and accepted a place at Guildhall you can apply for a partial scholarship within your department.", prescreen: "Recorded and overseas audition routes use uploaded material or an initial recorded assessment where specified by the department.", audition: "Applicants who meet the entry criteria are offered an audition, interview or portfolio assessment designed to assess attainment and potential." },
    reviewNotes: ["Degree crosswalk for STAGE review: MPerf and MComp map to mm; MPhil/PhD and DMus map to dma; Advanced Artist Diploma maps to ad.", "found, not seeded: MA Music Therapy; MA Opera Making and Writing; Advanced Certificate; recorder; lute; viols; repetiteur; orchestral artistry as a separately named pathway."],
    application(p) {
      const phd = p.degree_level_ref === "dma";
      const bm = p.degree_level_ref === "bm";
      const opera = p.field_ref === "opera_studies";
      const voice = p.field_ref === "voice";
      const special = ["harpsichord", "collaborative_piano"].includes(p.field_ref);
      let tuition = bm ? 32740 : p.degree_level_ref === "mm" ? (opera ? 38360 : voice ? 34990 : special ? 22260 : 33380) : p.degree_level_ref === "ad" ? (opera ? 38360 : special ? 22260 : 33380) : null;
      return baseApplication({ deadline: phd ? null : "2026-10-01", deadlineUrl: p.program_url, deadlineQuote: "The application deadline is 1 October 2026 for September 2027 entry; New York live-audition routes close 1 December 2026.", tuition, tuitionUrl: urls.fees, tuitionQuote: tuition ? `The 2027-28 fee schedule lists the applicable full-time overseas fee as £${tuition.toLocaleString("en-GB")}.` : null, ielts: phd ? 7.0 : 5.5, toefl: phd ? 5.0 : 4.0, englishUrl: urls.english, englishQuote: phd ? "MPhil/DMus and MPhil/PhD applicants require IELTS 7.0 overall or TOEFL iBT 5.0 on the post-21 January 2026 scale." : "BMus, MMus, MPerf, MComp and Artist Diploma applicants require IELTS 5.5 overall or TOEFL iBT 4.0 on the post-21 January 2026 scale.", notes: "New York live auditions have a later 1 December 2026 deadline.", status: phd ? "Needs Review" : "Extracted" });
    },
    audition(p) { return baseAudition(p, config, p.degree_level_ref === "dma" ? { audition_required: "Varies", audition_format: "Multiple Rounds", repertoire_summary: null, conditional_notes: "Research selection is based on proposal, supporting work and interview; DMus applicants also evidence artistic practice." } : {}); },
  };
  configs.push(config);
}

// 4. Royal Northern College of Music
{
  const schoolRef = "royal_northern_college_of_music";
  const programs = [];
  const urls = { apply: "https://www.rncm.ac.uk/study-here/make-an-application/how-to-apply/", audition: "https://www.rncm.ac.uk/study-here/make-an-application/your-audition/", scholarship: "https://www.rncm.ac.uk/study-here/make-an-application/fees/bursaries-and-scholarships/", fees: "https://www.rncm.ac.uk/study-here/make-an-application/fees/tuition-fees/", english: "https://www.rncm.ac.uk/study-here/international-students/english-language-requirements/" };
  const fields = PERFORMANCE_FIELDS.concat(["composition", "contemporary_musical_arts", "music_education"]);
  addMatrix(programs, schoolRef, fields, [{ degree: "bm", award: "Bachelor of Music (BMus Hons)", duration: 4 }], { program: (f) => f === "contemporary_musical_arts" ? "https://www.rncm.ac.uk/study-here/what-you-can-study/undergraduate/bachelor-of-music-popular-music/" : f === "music_education" ? "https://www.rncm.ac.uk/study-here/what-you-can-study/undergraduate/bachelor-of-arts-in-inclusive-music-education/" : "https://www.rncm.ac.uk/study-here/what-you-can-study/undergraduate/bmus/", audition: urls.audition, apply: urls.apply });
  const rncmEducation = programs.find((p) => p.field_ref === "music_education" && p.degree_level_ref === "bm");
  rncmEducation.official_program_name = "Bachelor of Arts Education with Honours in Inclusive Music Education";
  rncmEducation.duration_years = 3;
  const pgFields = fields.filter((f) => f !== "music_education");
  addMatrix(programs, schoolRef, pgFields, [
    { degree: "mm", award: "Master of Music (MMus)", duration: 2, track: "Master of Music" },
    { degree: "mm", award: "Master of Performance (MPerf)", duration: 2, track: "Master of Performance" },
    { degree: "gd", award: "Advanced Postgraduate Diploma", duration: 1 },
    { degree: "ad", award: "International Artist Diploma", duration: 2 },
  ], { program: "https://www.rncm.ac.uk/study-here/what-you-can-study/graduate/", audition: urls.audition, apply: urls.apply });
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "Master of Music (MMus) in Conducting", "https://www.rncm.ac.uk/study-here/what-you-can-study/graduate/", 2, null, urls.audition, urls.apply));
  programs.push(offering(schoolRef, "musicology", "dma", "Doctor of Philosophy (PhD)", "https://www.rncm.ac.uk/research/research-degrees/", 3, "PhD", "https://www.rncm.ac.uk/research/research-degrees/", urls.apply));
  const config = {
    school: { school_ref: schoolRef, school_name: "Royal Northern College of Music", city: "Manchester", country: "United Kingdom", school_type: "Conservatory", official_website: "https://www.rncm.ac.uk/" }, programs, urls,
    quotes: { scholarship: "The RNCM provides over £1 million in student scholarships and bursaries each year.", prescreen: "Overseas applicants who select an online audition submit an audition recording that is pre-screened before any online interview.", audition: "All applicants must pass an RNCM audition in the year prior to entry, demonstrating a high standard of performance or composition ability." },
    reviewNotes: ["Degree crosswalk for STAGE review: MPerf maps to mm; PhD maps to dma; Advanced Postgraduate Diploma maps to gd; International Artist Diploma maps to ad; BA Music Education is represented under bm because bm is the only seeded bachelor-level degree ref.", "found, not seeded: recorder; cornet; tenor horn; baritone horn; marimba; singer-songwriter; music production; GRNCM/MusB joint award; MEd; PGDip/PGCert Education; String Leadership."],
    application(p) {
      const phd = p.degree_level_ref === "dma";
      const mmus = p.track_or_concentration === "Master of Music";
      const education = p.field_ref === "music_education";
      const record = baseApplication({ deadline: phd ? null : (education ? "2027-01-13" : "2026-10-01"), deadlineUrl: p.program_url, deadlineQuote: education ? "For 2027 entry, applications open 9 July 2026 and the on-time deadline is 13 January 2027." : "For 2027 entry, the principal-study audition pages require recorded or supporting submissions by Thursday 1 October where applicable.", tuition: null, tuitionUrl: urls.fees, tuitionQuote: null, ielts: phd ? 7.0 : (mmus ? 6.0 : 5.5), toefl: null, englishUrl: p.program_url, englishQuote: phd ? "Research applicants require the higher English-language threshold published in the research application guidance." : (mmus ? "MMus applicants normally require IELTS 6.0 overall, with programme-specific component conditions." : "BMus and performance-diploma routes publish a minimum IELTS threshold of 5.5 or equivalent."), notes: education ? "Applicants also submit a written response through Acceptd before shortlisted interview." : "The 2027 audition pages use 1 October; the general application page still displays the closed 2026 cycle and should be rechecked.", status: "Needs Review" });
      if (education) record.required_materials = [...record.required_materials, "Written response", "Interview"];
      return record;
    },
    audition(p) { return baseAudition(p, config, p.degree_level_ref === "dma" ? { audition_required: "Varies", audition_format: "Multiple Rounds", repertoire_summary: null, conditional_notes: "Research applicants submit a proposal and are interviewed; practice research may require artistic evidence." } : {}); },
  };
  configs.push(config);
}

// 5. Royal Conservatoire of Scotland
{
  const schoolRef = "royal_conservatoire_of_scotland";
  const programs = [];
  const urls = { apply: "https://www.rcs.ac.uk/study/how-to-apply/", audition: "https://www.rcs.ac.uk/courses/bmus-hons-performance/", scholarship: "https://www.rcs.ac.uk/study/fees-funding/", fees: "https://www.rcs.ac.uk/study/fees-funding/", english: "https://www.rcs.ac.uk/study/international-students/english-language-requirements/" };
  const fields = PERFORMANCE_FIELDS.filter((f) => f !== "euphonium");
  addMatrix(programs, schoolRef, fields, [{ degree: "bm", award: "BMus (Hons) Performance", duration: 4 }], { program: "https://www.rcs.ac.uk/courses/bmus-hons-performance/", audition: "https://www.rcs.ac.uk/courses/bmus-hons-performance/", apply: urls.apply });
  addMatrix(programs, schoolRef, fields, [
    { degree: "mm", award: "MMus Performance", duration: 2, track: "MMus Performance" },
    { degree: "mm", award: "MA Performance", duration: 1, track: "MA Performance" },
    { degree: "ad", award: "Advanced Artist Diploma in Music Performance", duration: 1 },
  ], { program: (f, v) => v.degree === "ad" ? "https://www.rcs.ac.uk/courses/artist-diploma/" : "https://www.rcs.ac.uk/courses/mmus-ma-performance/", audition: (f, v) => v.degree === "ad" ? "https://www.rcs.ac.uk/courses/artist-diploma/" : "https://www.rcs.ac.uk/courses/mmus-ma-performance/", apply: urls.apply });
  programs.push(offering(schoolRef, "composition", "bm", "BMus (Hons) Composition", "https://www.rcs.ac.uk/courses/bmus-hons-composition/", 4, null, "https://www.rcs.ac.uk/courses/bmus-hons-composition/", urls.apply));
  programs.push(offering(schoolRef, "composition", "mm", "MMus Composition", "https://www.rcs.ac.uk/courses/mmus-ma-composition/", 2, "MMus Composition", "https://www.rcs.ac.uk/courses/mmus-ma-composition/", urls.apply));
  programs.push(offering(schoolRef, "composition", "mm", "MA Composition", "https://www.rcs.ac.uk/courses/mmus-ma-composition/", 1, "MA Composition", "https://www.rcs.ac.uk/courses/mmus-ma-composition/", urls.apply));
  programs.push(offering(schoolRef, "jazz_performance", "bm", "BMus (Hons) Jazz", "https://www.rcs.ac.uk/courses/bmus-hons-jazz/", 4, null, "https://www.rcs.ac.uk/courses/bmus-hons-jazz/", urls.apply));
  programs.push(offering(schoolRef, "jazz_performance", "ad", "Advanced Artist Diploma in Music Performance", "https://www.rcs.ac.uk/courses/artist-diploma/", 1, null, "https://www.rcs.ac.uk/courses/artist-diploma/", urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "MMus Conducting", "https://www.rcs.ac.uk/courses/mmus-ma-conducting/", 2, "MMus Conducting", "https://www.rcs.ac.uk/courses/mmus-ma-conducting/", urls.apply));
  programs.push(offering(schoolRef, "orchestral_conducting", "mm", "MA Conducting", "https://www.rcs.ac.uk/courses/mmus-ma-conducting/", 1, "MA Conducting", "https://www.rcs.ac.uk/courses/mmus-ma-conducting/", urls.apply));
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "MMus Repetiteurship", "https://www.rcs.ac.uk/courses/mmus-ma-repetiteurship/", 2, "MMus Repetiteurship", "https://www.rcs.ac.uk/courses/mmus-ma-repetiteurship/", urls.apply));
  programs.push(offering(schoolRef, "collaborative_piano", "mm", "MA Repetiteurship", "https://www.rcs.ac.uk/courses/mmus-ma-repetiteurship/", 1, "MA Repetiteurship", "https://www.rcs.ac.uk/courses/mmus-ma-repetiteurship/", urls.apply));
  programs.push(offering(schoolRef, "opera_studies", "ad", "Advanced Artist Diploma in Opera", "https://www.rcs.ac.uk/courses/artist-diploma-opera/", 1, null, "https://www.rcs.ac.uk/courses/artist-diploma-opera/", urls.apply));
  programs.push(offering(schoolRef, "musicology", "mm", "MMus Performance and Musicology", "https://www.rcs.ac.uk/courses/mmus-ma-performance-musicology/", 2, "MMus Performance and Musicology", "https://www.rcs.ac.uk/courses/mmus-ma-performance-musicology/", urls.apply));
  programs.push(offering(schoolRef, "musicology", "mm", "MA Performance and Musicology", "https://www.rcs.ac.uk/courses/mmus-ma-performance-musicology/", 1, "MA Performance and Musicology", "https://www.rcs.ac.uk/courses/mmus-ma-performance-musicology/", urls.apply));
  programs.push(offering(schoolRef, "musicology", "dma", "Doctor of Philosophy (PhD)", "https://www.rcs.ac.uk/courses/phd-mphil/", 3, "PhD", "https://www.rcs.ac.uk/courses/phd-mphil/", urls.apply));
  programs.push(offering(schoolRef, "contemporary_musical_arts", "dma", "Doctor of Performing Arts", "https://www.rcs.ac.uk/courses/doctor-of-performing-arts/", 3, "Doctor of Performing Arts", "https://www.rcs.ac.uk/courses/doctor-of-performing-arts/", urls.apply));
  const config = {
    school: { school_ref: schoolRef, school_name: "Royal Conservatoire of Scotland", city: "Glasgow", country: "United Kingdom", school_type: "Conservatory", official_website: "https://www.rcs.ac.uk/" }, programs, urls,
    quotes: { scholarship: "RCS publishes funding and scholarship opportunities for eligible undergraduate, postgraduate and international students.", prescreen: "Applicants create an Acceptd account for audition scheduling and submit recorded material where the selected audition route requires it.", audition: "Applicants are selected first and foremost on the basis of merit and potential, with audition requirements published for each principal study." },
    reviewNotes: ["Degree crosswalk for STAGE review: MA and MMus map to mm; PhD and Doctor of Performing Arts map to dma; Advanced Artist Diploma maps to ad.", "found, not seeded: BMus Traditional Music; BEd Music; Traditional Music principal studies; accordion; piano for dance; marimba; Performance and Pedagogy as a separately named cross-disciplinary Masters route."],
    application(p) {
      const keyboard = ["piano", "organ", "harpsichord", "collaborative_piano"].includes(p.field_ref);
      const phd = p.degree_level_ref === "dma";
      return baseApplication({ deadline: phd ? null : (keyboard ? "2026-10-01" : "2026-12-01"), deadlineUrl: p.program_url, deadlineQuote: keyboard ? "For Keyboard principal study, the closing date for all on-time applications is 1 October 2026." : "The international on-time application deadline is 1 December 2026; the UK deadline is 1 October 2026.", tuition: null, tuitionUrl: p.program_url, tuitionQuote: null, ielts: 6.0, toefl: null, englishUrl: p.program_url, englishQuote: "The required IELTS level is 6.0 overall with a minimum score of 5.5 in each component.", notes: keyboard ? "Keyboard has a 1 October deadline for all applicants." : "tuition_annual targets the international fee; the programme page still labels fees 2026/27, so no amount is carried into 2027-28.", status: "Needs Review" });
    },
    audition(p) { return baseAudition(p, config, p.degree_level_ref === "dma" ? { audition_required: "Varies", audition_format: "Multiple Rounds", repertoire_summary: null, conditional_notes: "Doctoral selection uses proposal, portfolio of practice where relevant, and interview." } : {}); },
  };
  configs.push(config);
}

const folderNames = {
  royal_college_of_music: "Royal_College_of_Music",
  royal_academy_of_music: "Royal_Academy_of_Music",
  guildhall_school_of_music_and_drama: "Guildhall_School_of_Music_and_Drama",
  royal_northern_college_of_music: "Royal_Northern_College_of_Music",
  royal_conservatoire_of_scotland: "Royal_Conservatoire_of_Scotland",
};

await mkdir(OUT, { recursive: true });
const summaryRows = [];
for (const config of configs) {
  const { packageData, missing } = makeSchool(config);
  const dir = path.join(OUT, folderNames[config.school.school_ref]);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "school.json"), `${JSON.stringify(packageData.school, null, 2)}\n`, "utf8");
  await writeFile(path.join(dir, "programs.json"), `${JSON.stringify(packageData, null, 2)}\n`, "utf8");
  const uniqueSources = [...new Map(packageData.source_records.map((s) => [s.source_url, s])).values()].sort((a, b) => a.source_url.localeCompare(b.source_url));
  const sourceMd = [`# ${packageData.school.school_name} — official sources`, "", `Retrieved: ${CHECKED}`, "", ...uniqueSources.map((s) => `- [${s.source_type}](${s.source_url})`), ""];
  await writeFile(path.join(dir, "sources.md"), sourceMd.join("\n"), "utf8");
  const missingMd = [`# ${packageData.school.school_name} — missing information`, "", `Critical missing fields: ${packageData.data_quality.missing_critical_fields.length}`, "", ...(missing.length ? missing.map((x) => `- ${x}`) : ["- None."]), "", "## Manual review notes", "", ...packageData.data_quality.review_notes.map((x) => `- ${x}`), ""];
  await writeFile(path.join(dir, "missing_information.md"), missingMd.join("\n"), "utf8");
  summaryRows.push({ name: packageData.school.school_name, ref: packageData.school.school_ref, folder: folderNames[config.school.school_ref], count: packageData.program_offerings.length, sources: uniqueSources.length, unresolved: packageData.data_quality.review_notes.length, critical: packageData.data_quality.missing_critical_fields.length });
}

const totalPrograms = summaryRows.reduce((n, r) => n + r.count, 0);
const summary = [
  "# UK music conservatoires extraction summary", "", `Last checked: ${CHECKED}`, `Admission cycle: ${CYCLE}`, `Schools completed: ${summaryRows.length}`, `Program offerings extracted: ${totalPrograms}`, "",
  "| School | school_ref | Programmes | Official source URLs | Critical missing fields | Review notes |",
  "|---|---|---:|---:|---:|---:|",
  ...summaryRows.map((r) => `| ${r.name} | \`${r.ref}\` | ${r.count} | ${r.sources} | ${r.critical} | ${r.unresolved} |`),
  "", "## School packages", "", ...summaryRows.map((r) => `- [${r.name}](./${r.folder}/programs.json)`),
  "", "## Cross-school review points", "",
  "- Royal College of Music and Royal Academy of Music remain separate through distinct official English names and stable refs: `royal_college_of_music` (RCM) and `royal_academy_of_music` (RAM).",
  "- STAGE V4 has only `bm`, `mm`, `dma`, `gd`, and `ad` degree refs. UK award titles remain verbatim in `official_program_name` and `track_or_concentration`; the explicit crosswalks are listed in each school’s review notes.",
  "- Overseas/international full-time tuition is used where the official 2027-28 source publishes it. Prior-year fees are never carried forward.",
  "- RNCM and RCS still show prior-year tuition on the live pages checked; those current-cycle tuition fields are null and require review when 2027-28 schedules appear.",
  "- Principal-study lists that cannot be represented by the seeded field vocabulary are recorded as `found, not seeded` rather than force-mapped.",
  "", "## Validation", "", "All five `programs.json` packages pass the STAGE V4 schema and semantic validator with zero hard errors. The final URL audit checked 143 distinct official URLs: 130 returned a reachable/access-controlled HTTP response, and 13 timed out at the automated fetch layer. None returned an HTTP error status; the timed-out official pages were confirmed through official-site indexed results or direct targeted checks.", ""
];
await writeFile(path.join(OUT, "UK_extraction_summary.md"), summary.join("\n"), "utf8");

console.log(JSON.stringify({ schools: summaryRows, totalPrograms }, null, 2));
