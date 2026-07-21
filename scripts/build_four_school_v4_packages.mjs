#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_ROOT = path.join(ROOT, "data", "extractions");
const CHECKED = "2026-07-21";

const DEGREE_LABELS = {
  bm: "Bachelor of Music",
  mm: "Master of Music",
  dma: "Doctor of Musical Arts",
  gd: "Graduate Diploma",
  ad: "Artist Diploma",
};

const FIELD_LABELS = {
  cello: "Cello",
  composition: "Composition",
  opera_studies: "Opera Studies",
  piano: "Piano",
  violin: "Violin",
  voice: "Vocal Performance",
};

const MATERIALS = [
  "Online application",
  "Recommendation letters",
  "Résumé/CV",
  "Essay/Personal statement",
  "Transcripts",
  "Prescreen materials",
];

const slugify = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .replace(/_+/g, "_");

function source({ schoolRef = null, programRef = null, url, type, field = null, quote = null, confidence = "High" }) {
  return {
    school_ref: schoolRef,
    program_offering_ref: programRef,
    source_url: url,
    source_type: type,
    retrieved_date: CHECKED,
    source_quote: quote,
    related_field: field,
    confidence_level: confidence,
  };
}

function offeringRef(schoolRef, field, degree, track = null) {
  const base = `${schoolRef}_${field}_${degree}`;
  return track ? `${base}_${slugify(track)}` : base;
}

function program({ schoolRef, field, degree, name, programUrl, applicationUrl, auditionUrl, duration = null, track = null, status = "Extracted" }) {
  return {
    ref: offeringRef(schoolRef, field, degree, track),
    field,
    degree,
    track,
    name: name || `${FIELD_LABELS[field]} — ${DEGREE_LABELS[degree]}`,
    programUrl,
    applicationUrl,
    auditionUrl,
    duration,
    status,
  };
}

const configs = [
  {
    school: {
      school_ref: "colburn",
      school_name: "Colburn School",
      city: "Los Angeles",
      country: "United States",
      school_type: "Conservatory",
      official_website: "https://colburnschool.edu/",
    },
    cycle: "2026-2027",
    description: "A highly selective, fully subsidized instrumental conservatory in Los Angeles; the live site still publishes the Fall 2026 cycle, so applicants should re-check before acting.",
    urls: {
      apply: "https://colburnschool.edu/conservatory/apply-to-the-conservatory/application-requirements/",
      portal: "https://admissions.colburnschool.edu/apply/",
      openings: "https://colburnschool.edu/conservatory/apply-to-the-conservatory/current-openings/",
      undergrad: "https://colburnschool.edu/conservatory/programs-of-study/undergraduate-programs/",
      graduate: "https://colburnschool.edu/conservatory/programs-of-study/graduate-programs/",
      audition: "https://colburnschool.edu/conservatory/audition/prescreening-video-submission/",
      international: "https://colburnschool.edu/conservatory/apply-to-the-conservatory/international-students/",
      cost: "https://colburnschool.edu/conservatory/cost-financial-aid/",
      scholarship: "https://colburnschool.edu/conservatory/apply-to-the-conservatory/",
    },
    sourceTitles: {
      apply: "Application Requirements",
      portal: "Colburn Application Management",
      openings: "Current Openings",
      undergrad: "Undergraduate Programs",
      graduate: "Graduate Programs",
      audition: "Prescreening Video Submission",
      international: "International Students",
      cost: "Cost and Financial Aid",
      scholarship: "Apply to the Conservatory",
    },
    deadline: "2025-12-02",
    deadlineQuote: "Conservatory Application (Deadline: December 2, 2025)",
    tuition: null,
    tuitionQuote: null,
    scholarshipQuote: "All students receive full tuition scholarship, as well as grants that cover housing and meals.",
    status: "Needs Review",
    programs: [],
    applicationFor(p) {
      const english = p.degree === "bm"
        ? { tests: ["TOEFL", "IELTS"], toefl: 79, ielts: 6.0, duolingo: null }
        : p.degree === "mm"
          ? { tests: ["TOEFL", "IELTS"], toefl: 86, ielts: 6.5, duolingo: null }
          : { tests: ["TOEFL", "IELTS"], toefl: 65, ielts: 6.0, duolingo: null };
      return {
        application_deadline: this.deadline,
        deadline_notes: "The live page still identifies this as the Fall 2026 application deadline.",
        tuition_annual: null,
        tuition_currency: null,
        scholarships_available: "Yes",
        scholarship_note: "All admitted Conservatory students receive full tuition scholarships and housing-and-meal grants.",
        english_language_tests: english.tests,
        toefl_minimum: english.toefl,
        ielts_minimum: english.ielts,
        duolingo_minimum: english.duolingo,
        required_materials: MATERIALS,
        conditional_notes: "English minimums vary by credential; the latest posted cost page is for 2025-26, so current-cycle tuition is not copied forward.",
        review_status: "Needs Review",
      };
    },
    auditionFor(p) {
      const reps = {
        cello: "Prescreen and live audition use the same memorized program: two contrasting solo Bach movements; a specified Popper etude or Piatti caprice; a listed concerto movement; one virtuoso piece; and one contrasting short lyrical work.",
        piano_bm: "Prescreen: at least 30 minutes from varied periods, including a virtuoso etude and a Classical work. Virtual and final live rounds use the same categories; all audition repertoire is memorized.",
        piano_grad: "Prescreen: at least 30 minutes from varied periods, including a Classical work. Virtual and final live rounds use the same categories; all audition repertoire is memorized.",
        violin: "Prescreen and live audition use the same memorized program: one Dont or Gaviniès etude or Paganini caprice; one Bach movement; the specified movement(s) of one listed concerto; and one virtuoso work.",
      };
      const key = p.field === "piano" ? (p.degree === "bm" ? "piano_bm" : "piano_grad") : p.field;
      return {
        prescreening_required: "Yes",
        prescreening_deadline: this.deadline,
        audition_required: "Yes",
        audition_format: p.field === "piano" ? "Multiple Rounds" : "Live Only",
        repertoire_summary: reps[key],
        repertoire_structured: null,
        conditional_notes: "Requirements are the current live Colburn posting for the Fall 2026 cycle.",
        review_status: "Needs Review",
      };
    },
    reviewNotes: [
      "The live Colburn application and audition pages still publish the Fall 2026 cycle (December 2, 2025 deadline) on 2026-07-21; all records remain Needs Review until Fall 2027 requirements appear.",
      "The cost page labels its $62,000 tuition figure as 2025-26; it was not copied into 2026-27 tuition_annual.",
      "found, not seeded: Performance Diploma (PD) and Professional Studies Certificate (PSC).",
      "found, not seeded: bassoon, clarinet, conducting, double bass, flute, harp, horn, oboe, percussion, tenor trombone, trumpet, tuba, and viola.",
      "found, not represented: the separately admitting two-year Graduate Chamber Ensemble-in-Residence / Chamber Music Emphasis; the generic ensemble application does not publish a supported seeded-instrument mapping.",
    ],
    unresolved: [
      "Fall 2027 application dates and openings are not yet published; the package preserves the still-live Fall 2026 cycle.",
      "The current-cycle tuition amount is unresolved because the cost page is labeled 2025-26.",
      "Colburn publishes Artist Diploma duration as a two-to-four-year range, which cannot be represented as a single duration_years value.",
      "The Graduate Chamber Ensemble-in-Residence / Chamber Music Emphasis admits separately, but cannot be mapped to seeded-instrument offerings without inventing the ensemble membership.",
    ],
  },
  {
    school: {
      school_ref: "curtis",
      school_name: "Curtis Institute of Music",
      city: "Philadelphia",
      country: "United States",
      school_type: "Conservatory",
      official_website: "https://www.curtis.edu/",
    },
    cycle: "2027-2028",
    description: "A tuition-free, audition-led conservatory in Philadelphia; degree placement follows artistic admission, and the exact Fall 2027 application deadline is not yet posted.",
    urls: {
      apply: "https://www.curtis.edu/apply/applying/",
      portal: "https://connect.curtis.edu/apply/",
      programs: "https://www.curtis.edu/learn/degrees-diplomas/",
      mm: "https://www.curtis.edu/learn/degrees-diplomas/master-of-music/",
      audition: "https://www.curtis.edu/apply/audition/",
      aid: "https://www.curtis.edu/apply/financial-aid/",
    },
    sourceTitles: {
      apply: "How to Apply",
      portal: "Curtis Application Portal",
      programs: "Degrees & Diplomas",
      mm: "Master of Music",
      audition: "Audition",
      aid: "Financial Aid",
    },
    deadline: null,
    deadlineQuote: null,
    tuition: 0,
    tuitionQuote: "Tuition is free for all students—always.",
    scholarshipQuote: "All students at Curtis Institute of Music receive merit-based, full-tuition scholarships regardless of their financial situation.",
    status: "Needs Review",
    programs: [],
    applicationFor(p) {
      return {
        application_deadline: null,
        deadline_notes: "Curtis states that 2027 audition dates will be available in September and currently gives only an early-December application window.",
        tuition_annual: 0,
        tuition_currency: "USD",
        scholarships_available: "Yes",
        scholarship_note: "Every student receives a merit-based full-tuition scholarship; need-based aid may assist with living expenses.",
        english_language_tests: ["TOEFL", "IELTS", "Cambridge"],
        toefl_minimum: 79,
        ielts_minimum: 6.5,
        duolingo_minimum: null,
        required_materials: p.field === "composition" || p.field === "opera_studies" ? [...MATERIALS, "Portfolio"] : MATERIALS,
        conditional_notes: "Curtis publishes TOEFL 79-80 and IELTS 6.5-7.0 ranges for degree entry; V4 stores the lower published bound and flags the range for review.",
        review_status: "Needs Review",
      };
    },
    auditionFor(p) {
      const reps = {
        cello_bm: "Prescreen: a Bach-suite prelude plus another movement, a specified concerto movement, a virtuoso piece or etude, and a Beethoven/Brahms/Schubert sonata movement. Live undergraduate audition uses the prescreen repertoire; concerto and Bach are memorized.",
        cello_mm: "Prescreen: a Bach-suite prelude plus another movement, a specified concerto movement, a virtuoso piece or etude, and a Beethoven/Brahms/Schubert sonata movement. Live graduate audition requires a complete Bach suite and complete concerto plus the published additional repertoire.",
        composition: "Prescreen portfolio: two to three original compositions, with scores where possible and accompanying recordings strongly recommended. Finalists complete a faculty interview, normally in person with a virtual option if needed.",
        piano: "Prescreen: a complete Bach prelude and fugue; one complete specified Classical sonata; and one slow and one fast Chopin work. Live audition adds one contrasting solo work; all repertoire is memorized.",
        violin_bm: "Prescreen: one major-concerto movement, one Mozart-concerto movement with cadenza, two solo Bach movements, and one Paganini caprice, all memorized. Live undergraduate audition requires the complete concerto, Mozart concerto, Bach work, and caprice.",
        violin_mm: "Prescreen: one major-concerto movement, one Mozart-concerto movement with cadenza, two solo Bach movements, and one Paganini caprice. Live graduate audition adds a complete listed sonata and a new commissioned solo work.",
        voice: "Prescreen: three selections—one in English, one aria, and one German, Italian, or French art song. Live audition: up to four memorized selections including English and an opera or oratorio aria.",
        opera: "Prescreen: three contrasting opera arias. Live audition: up to five contrasting arias from the standard operatic repertoire, performed from memory.",
      };
      const key = p.field === "cello" ? `cello_${p.degree}`
        : p.field === "violin" ? `violin_${p.degree}`
          : p.field === "voice" ? "voice"
            : p.field === "opera_studies" ? "opera"
              : p.field;
      return {
        prescreening_required: "Yes",
        prescreening_deadline: null,
        audition_required: "Yes",
        audition_format: p.field === "composition" ? "Multiple Rounds" : "Live Only",
        repertoire_summary: reps[key],
        repertoire_structured: null,
        conditional_notes: "The exact Fall 2027 prescreen deadline and audition dates are not yet published.",
        review_status: "Needs Review",
      };
    },
    reviewNotes: [
      "Curtis says 2027 audition dates will be available in September; the exact Fall 2027 application and prescreen deadline is not yet published, so those fields are null.",
      "Curtis publishes TOEFL 79-80 and IELTS 6.5-7.0 ranges for degree entry; the lower published bound is stored because V4 has only one numeric minimum field.",
      "Degree placement is evaluated after artistic admission; applicants are not guaranteed their requested academic credential solely by passing the audition.",
      "found, not seeded: Diploma, Post-Baccalaureate Diploma, and Professional Studies Certificate in Opera.",
      "found, not seeded: bass, bass trombone, bassoon, clarinet, conducting, flute, guitar, harp, horn, oboe, organ, percussion, string quartet, trombone, trumpet, tuba, and viola.",
    ],
    unresolved: [
      "The exact December 2026 application/prescreen deadline for Fall 2027 is not yet posted.",
      "Curtis publishes English-entry score ranges rather than one unambiguous minimum; V4 cannot preserve both bounds.",
      "Bachelor of Music duration is published as a three-to-five-year range, which cannot be represented as one duration_years value.",
      "Curtis also says the Master of Music takes two years while its degree overview allows two to three years; duration_years is null pending interpretation.",
    ],
  },
  {
    school: {
      school_ref: "eastman",
      school_name: "Eastman School of Music",
      city: "Rochester",
      country: "United States",
      school_type: "University Music School",
      official_website: "https://www.esm.rochester.edu/",
    },
    cycle: "2027-2028",
    description: "A university-based conservatory with broad performance and scholarly options; Fall 2027 is open, but several studio repertoire pages still carry Fall 2026 availability notes.",
    urls: {
      admissions: "https://www.esm.rochester.edu/admissions/",
      portal: "https://apply.esm.rochester.edu/apply/",
      undergrad: "https://www.esm.rochester.edu/admissions/ugrad/",
      graduate: "https://www.esm.rochester.edu/admissions/grad/",
      programs: "https://www.esm.rochester.edu/admissions/program-list/",
      audition: "https://www.esm.rochester.edu/admissions/repertoire/",
      international: "https://www.esm.rochester.edu/admissions/international/",
      ugCost: "https://www.esm.rochester.edu/financialaid/cost-of-attendance-undergraduate/",
      gradCost: "https://www.esm.rochester.edu/financialaid/cost-of-attendance-graduate/",
      aid: "https://www.esm.rochester.edu/financialaid/prospective/",
    },
    sourceTitles: {
      admissions: "Admissions",
      portal: "Eastman Application Portal",
      undergrad: "Undergraduate Admissions",
      graduate: "Graduate Admissions",
      programs: "Eastman Program Degrees Available",
      audition: "Prescreening, Audition, and Interview Requirements",
      international: "International Applicants",
      ugCost: "Financing the Cost of an Eastman Undergraduate Education",
      gradCost: "Graduate Cost of Attendance",
      aid: "Prospective Students — Financial Aid",
    },
    deadline: "2026-12-01",
    deadlineQuote: "December 1: Final Application deadline for Fall 2027",
    tuition: null,
    tuitionQuote: null,
    scholarshipQuote: "All undergraduate applicants are automatically considered for merit scholarships; graduate applicants recommended for admission are automatically considered for scholarships and stipends.",
    status: "Needs Review",
    programs: [],
    applicationFor(p) {
      const isBm = p.degree === "bm";
      const english = isBm
        ? { ielts: 6.5, duolingo: 115 }
        : p.degree === "dma"
          ? { ielts: 7.0, duolingo: 130 }
          : { ielts: 6.5, duolingo: 120 };
      return {
        application_deadline: this.deadline,
        deadline_notes: null,
        tuition_annual: null,
        tuition_currency: null,
        scholarships_available: "Yes",
        scholarship_note: isBm
          ? "Undergraduate applicants are automatically considered for merit scholarships."
          : "Graduate applicants recommended for admission are automatically considered for scholarships and stipends.",
        english_language_tests: ["TOEFL", "IELTS", "Duolingo", "Cambridge"],
        toefl_minimum: null,
        ielts_minimum: english.ielts,
        duolingo_minimum: english.duolingo,
        required_materials: [
          ...MATERIALS,
          ...(p.degree === "dma" ? ["Writing sample"] : []),
          ...(p.field === "composition" || p.field === "opera_studies" ? ["Portfolio"] : []),
        ],
        conditional_notes: isBm
          ? "The latest tuition is for 2026-27, not this 2027-28 cycle. TOEFL is null because Eastman publishes both the new 1–6 scale and still-valid legacy iBT scores; V4 cannot label both scales."
          : "TOEFL is null because Eastman publishes both the new 1–6 scale and still-valid legacy iBT scores; V4 cannot label both scales. Graduate tuition varies with required units and applied lessons.",
        review_status: "Needs Review",
      };
    },
    auditionFor(p) {
      const reps = {
        cello_bm: "Prescreen: two unaccompanied Bach movements, one standard-concerto movement, and one etude. Final BM audition: one concerto movement, one personal-choice work, two contrasting Bach movements, and a different etude.",
        cello_mm: "Prescreen: two unaccompanied Bach movements, two standard-concerto movements, and one personal-choice piece. Final MM audition: two contrasting Bach movements, a complete concerto, and a sonata movement or other personal-choice work; Bach and concerto are memorized.",
        cello_dma: "Prescreen: two unaccompanied Bach movements, two standard-concerto movements, and one personal-choice piece. Final DMA audition uses two contrasting Bach movements, a complete concerto, and a sonata movement or other personal-choice work; Bach and concerto are memorized.",
        composition_bm: "Portfolio: three or four original scores with recordings. Selected applicants complete a composition interview and an audition on their primary instrument or voice.",
        composition_mm: "Portfolio: three or four original scores with recordings, plus the applicable primary-instrument or voice prescreen. Selected applicants complete a composition interview and an applied audition.",
        composition_dma: "Portfolio: three or four original scores with recordings, plus the applicable primary-instrument or voice prescreen. Selected applicants complete a composition interview and an applied audition.",
        piano_bm: "Prescreen: at least 30 minutes from three periods, including a Classical-sonata Allegro and a virtuoso etude. Final BM audition: virtuoso etude; complete fugal Bach work; complete Classical sonata; complete Romantic work; and complete 20th/21st-century work, memorized.",
        piano_mm: "Prescreen: at least 30 minutes from three periods, including a Classical-sonata Allegro and a virtuoso etude. Final MM audition: at least 45 minutes with one virtuoso etude and at least three complete contrasting works, memorized.",
        piano_dma: "Prescreen: at least 30 minutes from three periods, including a Classical-sonata Allegro and a virtuoso etude. Final DMA audition: at least 60 minutes with one virtuoso etude and at least three complete contrasting works, memorized.",
        violin_bm: "Prescreen: one non-slow concerto movement and one solo Bach movement. Final BM audition: a memorized first or last concerto movement with cadenza, two memorized contrasting Bach movements, one standard etude, and three-octave scales and arpeggios.",
        violin_mm: "Prescreen: one non-slow concerto movement, two solo Bach movements, and a Paganini caprice or equivalent. Final MM audition: a complete memorized concerto, two memorized contrasting Bach movements, and one Paganini caprice or equivalent.",
        violin_dma: "Prescreen: one non-slow concerto movement, two solo Bach movements, and a Paganini caprice or equivalent. Final DMA audition: complete memorized concerto; complete memorized Bach sonata or partita with fugue or Chaconne; caprice; and virtuosic or contemporary work.",
        voice_bm: "Prescreen and final audition: three accompanied pieces in different styles and three different languages, one of which may be English; non-native English speakers must include English.",
        voice_mm: "Prescreen and final audition: four accompanied pieces, including at least one opera aria, in at least three languages; non-native English speakers must include English.",
        voice_dma: "Prescreen and final audition: four accompanied pieces, including at least one opera aria, in at least three languages; doctoral finalists also interview.",
        opera_studies_mm: "Prescreen portfolio demonstrates opera-directing experience. Final audition includes a staged dramatic coaching of an aria, supported by portfolio review and faculty interviews.",
      };
      const key = `${p.field}_${p.degree}`;
      return {
        prescreening_required: "Yes",
        prescreening_deadline: this.deadline,
        audition_required: "Yes",
        audition_format: p.field === "composition" || p.field === "opera_studies" ? "Multiple Rounds" : "Live or Recorded",
        repertoire_summary: reps[key],
        repertoire_structured: null,
        conditional_notes: "Several live major pages still display 2026 dates or studio-opening notes while the admissions landing page advertises Fall 2027.",
        review_status: "Needs Review",
      };
    },
    reviewNotes: [
      "Eastman advertises Fall 2027 applications, but several seeded-field repertoire pages still display 2026 dates and availability notes; all audition records remain Needs Review.",
      "Eastman's current TOEFL table publishes a post-January-21-2026 1–6 scale alongside legacy iBT minimums (83/88/100), and accepts scores up to two years old; toefl_minimum is null because V4 cannot label both scales.",
      "The $71,750 BM tuition is Eastman's latest published 2026-27 rate; it is not copied into the 2027-28 tuition_annual field.",
      "Graduate tuition varies by required units and applied lessons; official examples are $49,148 for 18 units and $53,616 for 20 units, so tuition_annual is null for each graduate offering.",
      "found, not seeded: Advanced Diploma in Performance and Advanced Diploma in Concertmaster Studies; these were not force-mapped to Artist Diploma.",
      "found, not seeded: all Eastman majors outside cello, composition, opera studies, piano, violin, and voice.",
    ],
    unresolved: [
      "Fall 2027 repertoire pages are only partially refreshed; older 2026 studio-opening notices may not describe 2027 availability.",
      "Graduate annual tuition cannot be assigned exactly without degree-specific unit and lesson loads.",
      "The latest published undergraduate tuition is for 2026-27; 2027-28 tuition remains unpublished and tuition_annual is null.",
      "V4 cannot safely represent Eastman's simultaneous new TOEFL 1–6 and legacy iBT paths in one unlabeled numeric field.",
    ],
  },
  {
    school: {
      school_ref: "new_england_conservatory",
      school_name: "New England Conservatory of Music",
      city: "Boston",
      country: "United States",
      school_type: "Conservatory",
      official_website: "https://necmusic.edu/",
    },
    cycle: "2027-2028",
    description: "A broad Boston conservatory with complete seeded-field coverage from BM through advanced performance credentials and a flexible live-or-recorded final-audition policy for selected programs.",
    urls: {
      undergradApply: "https://necmusic.edu/admissions/undergraduate-applicants/",
      graduateApply: "https://necmusic.edu/admissions/graduate-applicants/",
      portal: "https://apply.necmusic.edu/apply/",
      undergradPrograms: "https://necmusic.edu/admissions/degree-programs/undergraduate-programs/",
      graduatePrograms: "https://necmusic.edu/admissions/degree-programs/graduate-programs/",
      audition: "https://necmusic.edu/admissions/audition-requirements/",
      aid: "https://necmusic.edu/admissions/tuition-aid/",
      strings: "https://necmusic.edu/the-college/departments/strings/",
      composition: "https://necmusic.edu/the-college/departments/composition/",
      piano: "https://necmusic.edu/the-college/departments/piano/",
      voice: "https://necmusic.edu/the-college/departments/voice/",
      ad: "https://necmusic.edu/the-college/professional-programs/institute-for-concert-artists/",
    },
    sourceTitles: {
      undergradApply: "Undergraduate Applicants",
      graduateApply: "Graduate Applicants",
      portal: "NEC Application Portal",
      undergradPrograms: "Undergraduate Programs",
      graduatePrograms: "Graduate Programs",
      audition: "Audition Requirements",
      aid: "Tuition + Aid",
      strings: "Strings Department",
      composition: "Composition Department",
      piano: "Piano Department",
      voice: "Voice Department",
      ad: "Institute for Concert Artists",
    },
    deadline: "2026-12-01",
    deadlineQuote: "To complete an application for admission, submit the required materials using the online application by December 1.",
    tuition: null,
    tuitionQuote: null,
    scholarshipQuote: "NEC is committed to providing financial support, with scholarships based on a combination of financial need and artistic merit.",
    status: "Needs Review",
    programs: [],
    applicationFor(p) {
      const isBm = p.degree === "bm";
      return {
        application_deadline: this.deadline,
        deadline_notes: null,
        tuition_annual: null,
        tuition_currency: null,
        scholarships_available: "Yes",
        scholarship_note: p.degree === "ad"
          ? "Institute for Concert Artists Artist Diploma students receive a full-tuition scholarship and a $10,000 annual stipend."
          : "NEC awards scholarships using both financial need and artistic merit.",
        english_language_tests: ["TOEFL", "IELTS", "Duolingo"],
        toefl_minimum: isBm ? 61 : 79,
        ielts_minimum: isBm ? 6.0 : 6.5,
        duolingo_minimum: isBm ? 100 : 110,
        required_materials: [
          ...MATERIALS,
          ...(p.degree === "dma" ? ["Writing sample"] : []),
          ...(p.field === "composition" ? ["Portfolio"] : []),
        ],
        conditional_notes: "Tuition is the latest published 2026-27 rate; NEC has not yet published a 2027-28 rate.",
        review_status: "Needs Review",
      };
    },
    auditionFor(p) {
      const reps = {
        cello_bm: "Prescreen: a memorized major-concerto exposition or first five minutes and two memorized contrasting Bach-suite movements. Final: complete first concerto movement, two contrasting Bach movements, a showpiece/Italian sonata/etude, and one personally meaningful work.",
        cello_mm: "Prescreen: complete first movement of a major concerto and two contrasting Bach-suite movements, memorized. Final: complete concerto; complete Bach suite; complete post-1970 work; a showpiece/Italian sonata/etude; and one additional personal-choice work.",
        cello_gd: "Prescreen: complete first movement of a major concerto and two contrasting Bach-suite movements, memorized. Final: complete concerto; complete Bach suite; complete post-1970 work; a showpiece/Italian sonata/etude; and one additional personal-choice work.",
        cello_dma: "Prescreen: a complete first concerto movement, two contrasting Bach-suite movements, and up to five minutes from another final-audition work, memorized. Live final: five complete contrasting works, including a complete concerto, complete Bach suite, and one work from the last 50 years.",
        cello_ad: "Prescreen: a varied full recital-length program plus a complete concerto with accompaniment. Live final: a 60-minute recital program demonstrating artistic vision and technical mastery; the panel selects about 25 minutes for performance.",
        composition_bm: "Portfolio review: three original scores, available recordings, and a short composer-introduction video. Applicants outside the Harvard/NEC dual degree are reviewed on portfolio only, with no prescreening or interview.",
        composition_mm: "Portfolio review: three original scores, available recordings, and a short composer-introduction video. Admission is portfolio-only, with no prescreening or interview.",
        composition_gd: "Portfolio review: three original scores, available recordings, and a short composer-introduction video. Admission is portfolio-only, with no prescreening or interview.",
        composition_dma: "Portfolio review: at least three recent scores and recordings showing varied ensembles and forms, including a larger work, plus a short composer-introduction video. DMA applicants may be invited to interview and present five minutes of music.",
        piano_bm: "Prescreen and final: a complete Classical sonata, substantial Romantic work, fast etude, and one contrasting personal-choice work; final repertoire is memorized except potentially challenging contemporary music.",
        piano_mm: "Prescreen and final: a complete Classical sonata, substantial Romantic work, fast etude, and one contrasting personal-choice work; final repertoire is memorized except potentially challenging contemporary music.",
        piano_gd: "Prescreen and final: a complete Classical sonata, substantial Romantic work, fast etude, and one contrasting personal-choice work; final repertoire is memorized except potentially challenging contemporary music.",
        piano_dma: "Prescreen and final: a recital-length program of at least 60 minutes containing stylistically diverse, musically and technically challenging works; final repertoire is memorized except potentially challenging contemporary music.",
        piano_ad: "Prescreen: a varied full recital-length program plus a complete concerto with accompaniment. Live final: a 60-minute recital program demonstrating artistic vision and technical mastery; the panel selects about 25 minutes for performance.",
        violin_bm: "Prescreen: a major-concerto exposition or first five minutes and two contrasting solo Bach movements. Final: memorized concerto movement, memorized contrasting Bach movements, memorized etude/caprice, sonata or Mozart-concerto movement, and a personally meaningful work.",
        violin_mm: "Prescreen: a major-concerto exposition or first five minutes and two contrasting solo Bach movements. Final: complete memorized concerto, complete memorized Bach sonata/partita, memorized Paganini caprice, complete contrasting sonata, and a personal-choice work.",
        violin_gd: "Prescreen: a major-concerto exposition or first five minutes and two contrasting solo Bach movements. Final: complete memorized concerto, complete memorized Bach sonata/partita, memorized Paganini caprice, complete contrasting sonata, and a personal-choice work.",
        violin_dma: "Prescreen: a major-concerto exposition or first five minutes and two contrasting solo Bach movements. Final: five complete contrasting works, including a complete concerto, complete unaccompanied Bach sonata/partita, and one work written within the last 50 years.",
        violin_ad: "Prescreen: a varied full recital-length program plus a complete concerto with accompaniment. Live final: a 60-minute recital program demonstrating artistic vision and technical mastery; the panel selects about 25 minutes for performance.",
        voice_bm: "Prescreen and live audition: one art song in English, one in Italian, and one in another language; arias are not accepted for the BM program.",
        voice_mm: "Prescreen and final: art songs in Italian, French, German, and English, plus one opera aria and one oratorio aria; a second contrasting opera aria may replace one art song if all four languages remain represented.",
        voice_gd: "Prescreen and final: art songs in Italian, French, German, and English, plus one opera aria and one oratorio aria; a second contrasting opera aria may replace one art song if all four languages remain represented.",
        voice_dma: "Prescreen and final: a 45-minute recital spanning at least three stylistic periods with Italian, French, German, and English repertoire, plus one operatic and one oratorio aria.",
        voice_ad: "Prescreen and final program: six to eight opera arias in at least three languages, excluding oratorio and art song; finalists audition live before an external jury and interview afterward.",
      };
      const key = `${p.field}_${p.degree}`;
      if (p.field === "composition") {
        const dma = p.degree === "dma";
        return {
          prescreening_required: "No",
          prescreening_deadline: null,
          audition_required: dma ? "Varies" : "No",
          audition_format: dma ? "Multiple Rounds" : "Unknown",
          repertoire_summary: reps[key],
          repertoire_structured: null,
          conditional_notes: dma ? "DMA applicants may be invited to interview; no instrumental audition is specified." : "Admission is based on portfolio review; V4 has no portfolio-review audition format.",
          review_status: "Needs Review",
        };
      }
      const advanced = p.degree === "dma" || p.degree === "ad";
      return {
        prescreening_required: "Yes",
        prescreening_deadline: this.deadline,
        audition_required: "Yes",
        audition_format: advanced ? "Live Only" : "Live or Recorded",
        repertoire_summary: reps[key],
        repertoire_structured: null,
        conditional_notes: p.degree === "ad" ? "Finalists also complete a live interview." : null,
        review_status: "Needs Review",
      };
    },
    reviewNotes: [
      "The current application pages publish a recurring December 1 deadline without spelling out the year; 2026-12-01 is mapped to Fall 2027 entry because applications open September 15 and the package cycle is 2027-2028.",
      "The $64,208 tuition is NEC's latest published 2026-27 rate; it is not copied into the 2027-28 tuition_annual field.",
      "The recurring December 1 deadline is mapped to 2026-12-01 for Fall 2027; all affected records remain Needs Review.",
      "Composition BM/MM/GD admissions are portfolio-only; audition_format is Unknown because V4 has no Portfolio Review enum.",
      "found, not seeded: Undergraduate Diploma, Undergraduate Performance Certificate, Graduate Performance Certificate, Professional Piano Trio, and Professional String Quartet credentials.",
      "found, not seeded: all NEC majors outside cello, composition, piano, violin, and vocal performance.",
    ],
    unresolved: [
      "V4 cannot represent portfolio-only review as an audition format; composition non-DMA records use audition_format Unknown with explanatory notes.",
      "Graduate Diploma, DMA, and Artist Diploma durations are not stated as one stable number on the checked admissions pages.",
      "The latest published tuition is for 2026-27; 2027-28 tuition remains unpublished and tuition_annual is null.",
    ],
  },
];

// Build the representable program matrices from the supplied seeded field and degree vocabularies.
{
  const c = configs[0];
  for (const field of ["cello", "piano", "violin"]) {
    for (const degree of ["bm", "mm", "ad"]) {
      c.programs.push(program({
        schoolRef: c.school.school_ref,
        field,
        degree,
        programUrl: degree === "bm" ? c.urls.undergrad : c.urls.graduate,
        applicationUrl: c.urls.portal,
        auditionUrl: c.urls.audition,
        duration: degree === "bm" ? 4 : degree === "mm" ? 2 : null,
        status: c.status,
      }));
    }
  }
}

{
  const c = configs[1];
  for (const field of ["cello", "composition", "piano", "violin", "voice"]) {
    c.programs.push(program({
      schoolRef: c.school.school_ref,
      field,
      degree: "bm",
      name: field === "voice" ? "Voice — Bachelor of Music" : undefined,
      programUrl: c.urls.programs,
      applicationUrl: c.urls.portal,
      auditionUrl: c.urls.audition,
      duration: null,
      status: c.status,
    }));
  }
  for (const field of ["cello", "composition", "piano", "violin", "opera_studies"]) {
    c.programs.push(program({
      schoolRef: c.school.school_ref,
      field,
      degree: "mm",
      name: field === "opera_studies" ? "Opera — Master of Music" : undefined,
      programUrl: c.urls.mm,
      applicationUrl: c.urls.portal,
      auditionUrl: c.urls.audition,
      duration: null,
      status: c.status,
    }));
  }
}

{
  const c = configs[2];
  for (const field of ["cello", "composition", "piano", "violin", "voice"]) {
    for (const degree of ["bm", "mm", "dma"]) {
      c.programs.push(program({
        schoolRef: c.school.school_ref,
        field,
        degree,
        name: degree === "bm"
          ? `${field === "voice" ? "Voice" : FIELD_LABELS[field]} — Bachelor of Music`
          : degree === "mm"
            ? `${field === "voice" ? "Voice" : FIELD_LABELS[field]} — Master of Music in ${field === "composition" ? "Composition" : "Performance and Literature"}`
            : `${field === "voice" ? "Voice" : FIELD_LABELS[field]} — Doctor of Musical Arts in ${field === "composition" ? "Composition" : "Performance and Literature"}`,
        programUrl: degree === "bm" ? c.urls.programs : c.urls.graduate,
        applicationUrl: c.urls.portal,
        auditionUrl: c.urls.audition,
        duration: degree === "bm" ? 4 : null,
        status: c.status,
      }));
    }
  }
  c.programs.push(program({
    schoolRef: c.school.school_ref,
    field: "opera_studies",
    degree: "mm",
    name: "Opera Stage Directing — Master of Music",
    programUrl: c.urls.programs,
    applicationUrl: c.urls.portal,
    auditionUrl: c.urls.audition,
    duration: null,
    status: c.status,
  }));
}

{
  const c = configs[3];
  for (const field of ["cello", "piano", "violin", "voice"]) {
    for (const degree of ["bm", "mm", "gd", "dma", "ad"]) {
      const fieldUrl = field === "cello" || field === "violin" ? c.urls.strings : c.urls[field];
      c.programs.push(program({
        schoolRef: c.school.school_ref,
        field,
        degree,
        programUrl: degree === "ad" ? c.urls.ad : fieldUrl,
        applicationUrl: c.urls.portal,
        auditionUrl: c.urls.audition,
        duration: null,
        status: c.status,
      }));
    }
  }
  for (const degree of ["bm", "mm", "gd", "dma"]) {
    c.programs.push(program({
      schoolRef: c.school.school_ref,
      field: "composition",
      degree,
      programUrl: c.urls.composition,
      applicationUrl: c.urls.portal,
      auditionUrl: c.urls.audition,
      duration: null,
      status: c.status,
    }));
  }
}

function englishEvidence(config, p) {
  switch (config.school.school_ref) {
    case "colburn":
      if (p.degree === "bm") return "The TOEFL minimum score requirement for admission to the Bachelor of Music is 79 iBT.";
      if (p.degree === "mm") return "MM*\n86 iBT\n…\nMM*\n6.5 with no subscore lower than 6.0";
      return "AD and PSC\n65 iBT\n…\nAD and PSC\n6.0";
    case "curtis":
      return "Internet TOEFL iBT, score minimum of 79-80\nIELTS Academic Test, score minimum of 6.5-7.0 in each area\nCambridge B2 First, C1 Advanced or C2 Proficiency: 169";
    case "eastman":
      if (p.degree === "bm") return "Bachelor of Music (BM) | 4 | 83 iBT | 115 | 6.5 | 176";
      if (p.degree === "dma") return "Doctoral degree (DMA or PhD) | 5.5 | 100 iBT | 130 | 7 | 185";
      return "Master’s degree (MA or MM) | 4.5 | 88 iBT | 120 | 6.5 | 176";
    case "new_england_conservatory":
      return p.degree === "bm"
        ? "TOEFL iBT – 61\nIELTS – 6.0\nDuolingo English Test – 100"
        : "TOEFL iBT – 79\nIELTS – 6.5\nDuolingo English Test – 110";
    default:
      return null;
  }
}

function materialsEvidence(config) {
  switch (config.school.school_ref) {
    case "colburn": return "Any application missing required materials by the deadline will not be prescreened for an in-person audition.";
    case "curtis": return "There will be a section on the application to upload the following information.";
    case "eastman": return "Applicants are required to submit academic transcripts from each secondary school and college/university attended.";
    case "new_england_conservatory": return "Prescreening video recordings are the first part of the audition process for most degree programs.";
    default: return null;
  }
}

function durationEvidence(config, p) {
  if (config.school.school_ref === "colburn" && p.degree === "bm") return "The Bachelor of Music (BM) degree program is a four-year curriculum";
  if (config.school.school_ref === "colburn" && p.degree === "mm") return "The Master of Music (MM) degree program is a two-year curriculum";
  if (config.school.school_ref === "eastman" && p.degree === "bm") return "The Bachelor of Music curriculum is a four-year program";
  return null;
}

// Short verbatim excerpts from the checked official audition pages. The longer
// repertoire_summary values are editorial summaries and must never be reused as quotes.
function auditionEvidence(config, p, kind) {
  const school = config.school.school_ref;
  const degree = p.degree;
  const field = p.field;

  if (school === "colburn") {
    if (kind === "prescreen") return "The prescreening video recording is the first step of the audition process.";
    if (kind === "audition") return "Prescreening and live audition repertoire can be found below by instrument.";
    if (field === "cello") return "Two contrasting movements of solo Bach";
    if (field === "piano") return degree === "bm"
      ? "include a virtuosic etude and a classical work"
      : "include a classical work";
    return "All violin audition repertoire must be memorized, with no exceptions.";
  }

  if (school === "curtis") {
    if (kind === "prescreen") {
      if (field === "composition") return "Composition applicants will submit two to three original compositions.";
      if (field === "voice" || field === "opera_studies") return "All applicants in voice are required to submit screening video recordings with application materials.";
      if (field === "piano") return "applicants must submit a prescreening video together with their application";
      if (field === "violin") return "Applicants must submit a screening video with the application to be considered for the live auditions.";
      return "Applicants should submit a video (recently recorded) of the following.";
    }
    if (kind === "audition") {
      if (field === "composition") return "Finalists will be invited to campus for in-person interviews at Curtis in Philadelphia.";
      if (field === "voice") return "Vocalists who audition live will be asked to perform up to four selections from memory";
      if (field === "opera_studies") return "Vocalists who audition live will be asked to perform, from memory, up to five contrasting arias";
      return "Live Audition (if advanced)";
    }
    if (field === "composition") return "two to three original compositions";
    if (field === "piano") return "One complete prelude and fugue from either book of the Well-Tempered Clavier of J.S. Bach";
    if (field === "violin") return "Two movements from a Bach solo sonata or partita";
    if (field === "cello") return "A prelude plus another complete movement with repeats of a J.S. Bach suite";
    if (field === "voice") return "Three repertoire selections – one selection in English, one aria";
    return "Three contrasting opera arias.";
  }

  if (school === "eastman") {
    if (kind === "prescreen") {
      if (field === "composition") return "Applicants must upload PDF copies of three or four scores within their application for review by the composition faculty.";
      if (field === "opera_studies") return "MM applicants in Opera Stage Directing must upload supporting materials with their application";
      if (field === "voice") return "all applicants in voice (regardless of major) must upload a video pre-screen video recording";
      return "Pre-screening Requirement";
    }
    if (kind === "audition") {
      if (field === "composition") return "Selected applicants will be scheduled for an interview with the Composition faculty members.";
      if (field === "opera_studies") return "The audition consists of directing students in an opera scene structured around a dramatic coaching of an aria.";
      if (field === "voice") return "Applicants who successfully pass the pre-screening round will audition either in person in Rochester or by uploading a final audition video";
      return "Final Audition Requirements";
    }
    if (field === "composition") return "three or four scores";
    if (field === "opera_studies") return "directing students in an opera scene structured around a dramatic coaching of an aria";
    if (field === "cello") return degree === "bm"
      ? "Two contrasting movements of a Bach suite"
      : "2 contrasting movements of solo Bach, a complete concerto";
    if (field === "piano") return degree === "bm"
      ? "One virtuoso concert etude"
      : "at least three complete works representing different styles";
    if (field === "violin") return "Two contrasting movements from an unaccompanied Bach sonata or partita.";
    return degree === "bm"
      ? "Three pieces in varying musical styles, in three different languages"
      : "Four pieces–including at least one operatic aria–in at least three different languages";
  }

  // New England Conservatory
  if (field === "composition") {
    if (degree === "dma" && kind === "audition") return "Applicants may be invited for an interview.";
    return "Applicants to all other programs will be reviewed based on their portfolio only; there is no prescreening, and an interview is not required.";
  }
  if (degree === "ad") {
    if (kind === "prescreen") return "Video prescreening recordings are required of all Artist Diploma (Institute for Concert Artists) applicants";
    if (kind === "audition") return "Finalists will present their auditions (with pianists) in Jordan Hall";
    if (field === "voice") return "six to eight opera arias in at least three different languages";
    return "A varied, full recital-length program that best represents you as an artist";
  }
  if (kind === "prescreen") return "Prescreening";
  if (kind === "audition") return "Final Auditions";
  if (field === "cello") return "Two contrasting movements of a J.S. Bach Suite (memorized).";
  if (field === "piano") return "A complete Classical sonata (all movements)";
  if (field === "violin") return "Two contrasting movements from an unaccompanied sonata or partita by J.S. Bach";
  if (degree === "bm") return "One art song in English";
  if (degree === "dma") return "a full recital program consisting of 45 minutes of music";
  return "One oratorio aria";
}

function makePackage(config) {
  const schoolRef = config.school.school_ref;
  const programs = [...config.programs].sort((a, b) => a.ref.localeCompare(b.ref));
  const applicationRequirements = [];
  const auditionRequirements = [];
  const sources = [];
  const missing = [];
  const notes = [...config.reviewNotes];

  const primaryApplyUrl = config.urls.apply || config.urls.undergrad || config.urls.undergradApply;
  const aidUrl = config.urls.scholarship || config.urls.aid;
  const englishUrl = config.urls.international || config.urls.apply || config.urls.undergradApply;
  const tuitionUrl = config.school.school_ref === "eastman" ? config.urls.ugCost : (config.urls.cost || config.urls.aid);
  const programIndexUrl = config.urls.programs || config.urls.undergrad || config.urls.undergradPrograms;

  sources.push(source({ schoolRef, url: programIndexUrl, type: "Official Program Page", quote: null }));
  sources.push(source({ schoolRef, url: config.urls.portal, type: "Application Requirements Page", quote: null }));
  sources.push(source({
    schoolRef,
    url: primaryApplyUrl,
    type: "Application Requirements Page",
    field: "required_materials",
    quote: materialsEvidence(config),
  }));
  if (config.deadline) {
    sources.push(source({ schoolRef, url: primaryApplyUrl, type: "Deadline/Fee Page", field: "application_deadline", quote: config.deadlineQuote }));
  }
  if (config.tuition !== null) {
    sources.push(source({ schoolRef, url: tuitionUrl, type: "Deadline/Fee Page", field: "tuition_annual", quote: config.tuitionQuote }));
  }
  sources.push(source({ schoolRef, url: aidUrl, type: "Application Requirements Page", field: "scholarships_available", quote: config.scholarshipQuote }));

  for (const p of programs) {
    const app = config.applicationFor(p);
    const audition = config.auditionFor(p);
    applicationRequirements.push({ program_offering_ref: p.ref, admission_cycle: config.cycle, is_current: true, ...app });
    auditionRequirements.push({ program_offering_ref: p.ref, admission_cycle: config.cycle, is_current: true, ...audition });

    if (app.application_deadline === null) {
      missing.push(`${p.ref}.application_deadline`);
      notes.push(`${p.ref}: exact current-cycle application deadline is not published at ${primaryApplyUrl}; application_deadline left null.`);
    }
    if (app.tuition_annual === null) {
      missing.push(`${p.ref}.tuition_annual`);
      const checkedUrl = config.school.school_ref === "eastman" ? config.urls.gradCost : tuitionUrl;
      notes.push(`${p.ref}: exact current-cycle annual tuition is not published as one program-specific amount at ${checkedUrl}; tuition_annual left null.`);
    }
    if (audition.prescreening_required === "Yes" && audition.prescreening_deadline === null) {
      missing.push(`${p.ref}.prescreening_deadline`);
      notes.push(`${p.ref}: prescreening is required but the exact current-cycle deadline is not yet published at ${p.auditionUrl}; prescreening_deadline left null.`);
    }

    sources.push(
      source({ programRef: p.ref, url: p.programUrl, type: "Official Program Page", field: "official_program_name", quote: DEGREE_LABELS[p.degree] }),
      source({ programRef: p.ref, url: englishUrl, type: "English Language Requirements Page", field: "english_language_tests", quote: englishEvidence(config, p) }),
      source({ programRef: p.ref, url: p.auditionUrl, type: "Audition Requirements Page", field: "prescreening_required", quote: auditionEvidence(config, p, "prescreen") }),
      source({ programRef: p.ref, url: p.auditionUrl, type: "Audition Requirements Page", field: "audition_required", quote: auditionEvidence(config, p, "audition") }),
      source({ programRef: p.ref, url: p.auditionUrl, type: "Audition Requirements Page", field: "audition_format", quote: null }),
      source({ programRef: p.ref, url: p.auditionUrl, type: "Audition Requirements Page", field: "repertoire_summary", quote: auditionEvidence(config, p, "repertoire") }),
    );
    if (schoolRef === "new_england_conservatory" && p.degree === "ad") {
      sources.push(source({
        programRef: p.ref,
        url: config.urls.graduateApply,
        type: "Application Requirements Page",
        field: "scholarships_available",
        quote: "ICA artists receive a full-tuition scholarship, $10,000 annual stipend, and are eligible for travel and project support.",
      }));
    }
    if (audition.prescreening_deadline) {
      const deadlineEvidence = config.school.school_ref === "colburn"
        ? "upload prescreening videos by the December 2 application deadline"
        : config.school.school_ref === "eastman"
          ? "All required pre-screen materials and English proficiency test results must also be submitted by this date."
          : "Application and prescreening video due";
      sources.push(source({ programRef: p.ref, url: p.auditionUrl, type: "Audition Requirements Page", field: "prescreening_deadline", quote: deadlineEvidence }));
    }
    if (p.duration !== null) {
      sources.push(source({ programRef: p.ref, url: p.programUrl, type: "Official Program Page", field: "duration_years", quote: durationEvidence(config, p) }));
    }
  }

  const sourceRecords = sources.sort((a, b) => {
    const aScope = a.program_offering_ref || "";
    const bScope = b.program_offering_ref || "";
    return aScope.localeCompare(bScope) || a.source_url.localeCompare(b.source_url) || String(a.related_field).localeCompare(String(b.related_field));
  });

  return {
    schema_version: "stage_school_extraction_v4",
    school: config.school,
    program_offerings: programs.map((p) => ({
      program_offering_ref: p.ref,
      school_ref: schoolRef,
      field_ref: p.field,
      degree_level_ref: p.degree,
      track_or_concentration: p.track,
      official_program_name: p.name,
      program_url: p.programUrl,
      application_url: p.applicationUrl,
      audition_url: p.auditionUrl,
      duration_years: p.duration,
      language_of_instruction: null,
      last_checked: CHECKED,
      review_status: p.status,
    })),
    application_requirements: applicationRequirements.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref)),
    audition_requirements: auditionRequirements.sort((a, b) => a.program_offering_ref.localeCompare(b.program_offering_ref)),
    source_records: sourceRecords,
    data_quality: {
      overall_confidence: config.school.school_ref === "new_england_conservatory" ? "High" : "Medium",
      missing_critical_fields: [...new Set(missing)].sort(),
      needs_human_review: true,
      review_notes: notes,
    },
    workflow_status: {
      extraction_status: "complete",
      review_status: "unreviewed",
      ready_for_directus_import: false,
    },
  };
}

function countBy(items, key) {
  const result = {};
  for (const item of items) result[item[key]] = (result[item[key]] || 0) + 1;
  return result;
}

function tableRows(counts) {
  return Object.entries(counts).sort().map(([k, v]) => `| ${k.toUpperCase()} | ${v} |`).join("\n");
}

function summaryMarkdown(config, pkg) {
  const degrees = countBy(pkg.program_offerings, "degree_level_ref");
  const fields = countBy(pkg.program_offerings, "field_ref");
  return `# ${config.school.school_name} — V4 Extraction Summary

Retrieved and checked: ${CHECKED}  
Admission cycle represented: ${config.cycle}  
Official admissions entry: ${config.urls.admissions || config.urls.apply || config.urls.undergradApply}

## Decision summary

${config.description}

## Package outcome

- ${pkg.program_offerings.length} schema-representable offerings across the supplied seeded field vocabulary.
- ${pkg.application_requirements.length} current application records and ${pkg.audition_requirements.length} current audition records.
- ${pkg.source_records.length} official source-evidence records.
- ${pkg.data_quality.missing_critical_fields.length} decision-critical nulls, all explicitly named in data_quality.review_notes.
- No Directus or backend import was performed.

## Programs by degree

| Degree | Count |
|---|---:|
${tableRows(degrees)}

## Programs by seeded field

| Field | Count |
|---|---:|
${Object.entries(fields).sort().map(([k, v]) => `| ${FIELD_LABELS[k] || k} | ${v} |`).join("\n")}

## Scope boundary

Only fields present in data/reference/fields.json and degrees allowed by the V4 schema are included. Application fees, recording specifications, accompanist logistics, curriculum details, and interview scheduling are excluded by the V4 contract. Application-platform links are preserved through each offering's application_url because V4 has no application_platform field.
`;
}

function unresolvedMarkdown(config) {
  return `# Unresolved Issues

Checked: ${CHECKED}

Official information wins over the Obsidian clippings. The following issues remain because the live official sites do not currently resolve them in a V4-representable way:

${config.unresolved.map((x) => `- ${x}`).join("\n")}

## Contract-bound exclusions

- Application-fee amounts, detailed video/file rules, accompanist logistics, and interview scheduling were present on some source pages but intentionally excluded by V4 §4.
- The schema has no source_title field; source titles are preserved in source_inventory.md while source_url and source_quote remain in the authoritative JSON.
- No unsupported field or credential was force-mapped into the package.
`;
}

function sourceInventoryMarkdown(config, pkg) {
  const titleByUrl = new Map();
  for (const [key, title] of Object.entries(config.sourceTitles)) titleByUrl.set(config.urls[key], title);
  const grouped = new Map();
  for (const record of pkg.source_records) {
    if (!grouped.has(record.source_url)) grouped.set(record.source_url, []);
    grouped.get(record.source_url).push(record);
  }
  const rows = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([url, records]) => {
    const fields = [...new Set(records.map((r) => r.related_field).filter(Boolean))].sort().join(", ") || "general";
    const quote = records.find((r) => r.source_quote)?.source_quote
      ?.replace(/\r?\n/g, "<br>")
      .replace(/\|/g, "\\|") || "—";
    return `| ${titleByUrl.get(url) || "Official school page"} | ${url} | ${fields} | ${quote} |`;
  });
  return `# Source Inventory

Retrieved: ${CHECKED}

All sources are official school or parent-university pages. Source titles are stored here because the V4 JSON schema has no source_title property.

| Source title | Official URL | Related V4 fields | Short evidence excerpt |
|---|---|---|---|
${rows.join("\n")}
`;
}

for (const config of configs) {
  const pkg = makePackage(config);
  const dir = path.join(OUT_ROOT, config.school.school_ref);
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dir, `${config.school.school_ref}.v4.json`), `${JSON.stringify(pkg, null, 2)}\n`, "utf8"),
    writeFile(path.join(dir, "summary.md"), summaryMarkdown(config, pkg), "utf8"),
    writeFile(path.join(dir, "unresolved_issues.md"), unresolvedMarkdown(config), "utf8"),
    writeFile(path.join(dir, "source_inventory.md"), sourceInventoryMarkdown(config, pkg), "utf8"),
  ]);
  console.log(`${config.school.school_ref}: ${pkg.program_offerings.length} programs, ${pkg.source_records.length} sources`);
}
