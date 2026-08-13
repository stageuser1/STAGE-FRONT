/**
 * K-Arts School of Music undergraduate canonical package generator.
 * Mode B, verified 2026-08-13 against the 2027 foreign-admissions guide.
 * Draft only; publishing is an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-karts-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "karts";
const CHECKED = "2026-08-13";
const CYCLE = "2027/28";
const BASE = "https://www.karts.ac.kr";
const URL_MAIN = `${BASE}/en/main.do`;
const URL_SCHOOL = `${BASE}/en/schools/dnp.do?CODE=01`;
const URL_FOREIGN = `${BASE}/en/karts/foreign.do`;
const URL_APPLICATION = `${BASE}/en/karts/application.do`;
const URL_GUIDE = `${BASE}/upload_file/application/2027%20Admissions%20Guide(for%20Bachelor).pdf`;
const URL_FINANCE = `${BASE}/en/karts/finance.do`;
const URL_COURSE = `${BASE}/en/karts/course`;

const lines = (...parts) => parts.join("\n");

const timeline = {
  milestones: [
    { label: "2027 foreign undergraduate online application (School of Music)", date_text: "2026-07-13 to 2026-07-15; closes 18:00 KST on July 15" },
    { label: "Required-document submission (School of Music)", date_text: "2026-07-13 to 2026-07-16; closes 18:00 KST on July 16" },
    { label: "Eligibility assessment result / examinee number", date: "2026-08-07", qualifier: "17:00 KST" },
    { label: "First-round examination schedule announcement", date: "2026-07-31", qualifier: "17:00 KST" },
    { label: "First-round selection", date_text: "2026-08-11 to 2026-08-28" },
    { label: "First-round qualifiers announced", date: "2026-10-13", qualifier: "17:00 KST" },
    { label: "Second-round examination schedule announcement", date: "2026-10-14", qualifier: "15:00 KST" },
    { label: "Second-round selection", date_text: "2026-10-21 to 2026-10-29" },
    { label: "Final selection results", date: "2026-11-06", qualifier: "17:00 KST" },
    { label: "Registration for successful applicants", date_text: "2027-01-25 to 2027-01-28 (tentative)" },
    { label: "Matriculation", date_text: "Early March 2027" },
  ],
  date_year_note: "The 2027 foreign-admissions guide places the School of Music in the October entrance-examination group. Dates above are the current guide dates verified 2026-08-13; registration is expressly tentative.",
};

const COMMON_MATERIALS = [
  "K-Arts required-document checklist and educational-background/language-proficiency form",
  "Signed consent to academic-background verification",
  "Notarised / apostilled or consular-legalised transcripts and graduation or expected-graduation certificates for elementary, middle and high school, as applicable",
  "Passport, nationality and family-relationship documents required for the foreign-national eligibility route",
  "Copy of passbook for application-fee refund where required",
];

const VOCAL = {
  Soprano: {
    gender: "women",
    first: "One Italian art song selected from the women’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the women’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
  "Mezzo-soprano": {
    gender: "women",
    first: "One Italian art song selected from the women’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the women’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
  Countertenor: {
    gender: "men",
    first: "One Italian art song selected from the men’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted. Countertenors are the stated exception to the post-1756 opera-aria limitation.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the men’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
  Tenor: {
    gender: "men",
    first: "One Italian art song selected from the men’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the men’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
  Baritone: {
    gender: "men",
    first: "One Italian art song selected from the men’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the men’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
  Bass: {
    gender: "men",
    first: "One Italian art song selected from the men’s list (transposition allowed) and one applicant-choice opera or oratorio aria. The aria must be sung in the native key and language; operetta arias and concertos are not allowed; recitativo and da capo repetition are omitted.",
    second: "One Concone Op.9, 50 Lessons No.20–40 song; one German art song selected by lot from the men’s list; and an applicant-choice opera or oratorio aria different from the first screening, including recitativo.",
  },
};

const INSTRUMENTAL = {
  Piano: "First: complete Mozart or Haydn sonata, Chopin etude, and an etude by Chopin, Liszt, Rachmaninoff, Scriabin or Debussy. Second: complete Beethoven sonata and one work by Schubert, Mendelssohn, Chopin, Schumann, Liszt, Brahms or Rachmaninoff; non-concerto/non-etude works exceed eight minutes. Basic music theory is tested in both rounds.",
  Organ: "First: two Bach Orgelbüchlein pieces BWV 608, 615 and 617 (score may be used) and Mendelssohn Prelude and Fugue in D minor Op.37 No.1 (memorised). Second: one Bach Prelude and Fugue and Vierne Symphony No.2 III Scherzo; all specified memorisation rules apply. Basic music theory is tested in both rounds.",
  Harpsichord: "First: Bach Prelude and Fugue in C minor BWV 850 and Couperin Second Ordre, four movements including Allemande la Laborieuse, Première Courante and Sarabande la Prude plus one chosen movement. Second: Sweelinck Praeludium Toccata and one Scarlatti sonata. Pieces are memorised as specified; basic music theory is tested.",
  Violin: "First: Paganini 24 Caprices Op.1 No.9 and Mozart Violin Concerto No.1 K.207, all movements, with Franz Beyer cadenza. Second: one complete concerto from Sibelius, Prokofiev No.1 or Lalo Symphonie Espagnole, with cadenza. Basic music theory is tested.",
  Viola: "First: Bach Cello Suite No.4, Prelude/Courante/Gigue, and Campagnoli 41 Caprices Op.22 No.17. Second: one complete concerto from Bartók, Hindemith Der Schwanendreher or Walton. Basic music theory is tested.",
  Cello: "First: Bach Cello Suite No.6, Prelude/Allemande/Gigue, and George Crumb Sonata for Solo Cello. Second: one concerto from Schumann, Haydn D major or Tchaikovsky Variations on a Rococo Theme, plus Rostropovich Humoresque Op.5. Basic music theory is tested.",
  "Double Bass": "First: Vanhal Double Bass Concerto in D major, first movement with Heinz Karl Gruber cadenza and specified Hofmeister edition, plus Glière 4 Pieces Op.32 No.4 Tarantella. Second: Koussevitzky Concerto Op.3. Solo tuning, memorisation and cadenza rules apply; basic music theory is tested.",
  Harp: "First: Pierné Impromptu Caprice. Second: Louis Spohr Fantasie for Harp Op.35; university instrument Lyon & Healy No.23 must be used. Basic music theory is tested.",
  Guitar: "First: Bach Fuga BWV 1000 arranged by Frank Koonce and Villa-Lobos Etude No.9. Second: N. Coste Andante and Polonaise Op.44. Memorisation rules apply; basic music theory is tested.",
  Recorder: "First: Bach Partita BWV 1013 in C minor at 415Hz. Second: Marais Les folies d’Espagne in G minor, edited by Hans-Peter Schmitz, at 415Hz. Memorisation rules apply; basic music theory is tested.",
  Saxophone: "First: Bozza 12 Etudes Caprices Nos.6 and 12 and Telemann 12 Fantasies No.12, both on alto saxophone. Second: sight-reading; Gillet Études pour hautbois No.11 without transposition; Rueff Concertino Op.17. Memorisation applies to the specified works; basic music theory is tested.",
  Flute: "First: Taffanel Fantasie sur le Freischütz. Second: sight-reading and Fétis Flute Concerto in B minor. Sight-reading is not memorised; the concerto is memorised. Basic music theory is tested.",
  Oboe: "First: Gillet Etude No.11 (not memorised), Bach Solo for Flute in A minor BWV 1013 and Malcolm Arnold Fantasy for Oboe Op.90 (memorised). Second: Mozart Oboe Concerto K.314, all movements and cadenzas in Henle edition, and Holliger Solo Sonata movement requirements. Basic music theory is tested.",
  Clarinet: "First: Kovács Hommage à Strauss and Bassi Rigoletto Fantasy. Second: A-clarinet sight-reading; Nielsen Concerto specified measures; Denisov Sonata No.1 II; Weber Clarinet Concerto No.2 specified movements. No accompaniment/repeats; basic music theory is tested.",
  Bassoon: "First: one day-selected major scale with relative minor from the listed scales and Arnold Fantasy Op.86. Second: sight-reading and Jacobi Introduction and Polonaise Op.9. Memorisation applies only as stated; basic music theory is tested.",
  Horn: "First: one Gallay 12 Grands Caprices and Mozart Horn Concerto No.2 first movement without accompaniment. Second: Strauss Concerto No.1 Op.11, all movements. Memorisation rules apply; basic music theory is tested.",
  Trumpet: "First: Arban Fantasie Brillante Introduction and Variation III without accompaniment and Brandt Etude No.6. Second: Haydn Trumpet Concerto in E-flat major, all movements, on B-flat trumpet. Memorisation rules apply; basic music theory is tested.",
  Trombone: {
    variants: {
      "Tenor Trombone": "First: two Kopprasch 60 Studies selections from the listed numbers. Second: all movements of Lars-Erik Larsson Concertino Op.45 No.7. Memorisation rules apply; basic music theory is tested.",
      "Bass Trombone": "First: two orchestral excerpts from the six listed excerpts, one Grigoriev 24 Studies selection, and two-octave major/relative-minor scales selected on the day. Second: Hidas Frigyes Rhapsody. Memorisation and excerpt-sheet rules apply; basic music theory is tested.",
    },
    note: "The foreign-admissions table treats Trombone (including Bass Trombone) as one admission unit; the detailed test page supplies tenor and bass variants, so they are retained under one offering rather than split into two offerings.",
  },
  Tuba: "First: solo etude Lento and all movements of Bozza Concertino for Tuba and Piano. Second: first movement of Boccherini Concerto adapted for tuba; F tuba must be used in both rounds. Memorisation rules apply; basic music theory is tested.",
  Percussion: "First: snare drum Delecluse Test claire and Cirone Portraits in Rhythm selection; marimba Andersen No.3 and Bach Invention in A minor BWV 784. Second: snare drum selections, marimba Koppel Concerto No.1 I and Creston Concertino III, plus timpani Krüger No.45. University instruments must be used; basic music theory is tested.",
};

const compositionRepertoire = {
  Composition: {
    first_screening: "Document screening: portfolio of two or more original compositions; five copies each of personal statement and statement of purpose; recommendations from two or more persons. Personal information beyond name, application number and department is prohibited in submitted work.",
    second_screening: [
      "Music analysis on an assigned classical, romantic and post-romantic solo or chamber work (2 hours; harmony, form, motif, dynamics and related analysis).",
      "Composition of a piano piece from given motifs in romantic style (6 hours).",
      "Oral examination covering analysis, live audition, submitted compositions, musicianship and overall music knowledge.",
      "Second-round resubmission of portfolio of two or more original compositions, five copies.",
    ],
  },
};

const conductingRepertoire = {
  "Orchestral Conducting": {
    first_screening: "Document screening and the guide's conducting-specific materials; the current guide does not state a separate foreign-route TOPIK threshold for this unit.",
    second_screening: [
      "Piano performance: Mozart Symphony No.38 ‘Prague’ K.504, first movement, from the full orchestral score; memorisation not required (60%).",
      "Score-reading: sight-read and perform a work given on the examination day (25%).",
      "Conducting: Mozart Symphony No.38 ‘Prague’ K.504, first movement (35%).",
      "Harmony theory problem solving (10%).",
      "Sight-singing: sing and conduct the score given on the day (30%).",
    ],
  },
};

const offerings = [
  ...Object.keys(VOCAL).map((major) => ({ department: "Vocal Music", major, field_ref: "performance", track: `Vocal Music — ${major}`, repertoire: { [major]: VOCAL[major] } })),
  ...Object.keys(INSTRUMENTAL).map((major) => ({ department: "Instrumental Music", major, field_ref: "performance", track: `Instrumental Music — ${major}`, repertoire: { [major]: INSTRUMENTAL[major] } })),
  { department: "Composition", major: "Composition", field_ref: "composition", track: "Composition", repertoire: compositionRepertoire },
  { department: "Conducting", major: "Orchestral Conducting", field_ref: "conducting", track: "Conducting — Orchestral Conducting", repertoire: conductingRepertoire },
];

const refFor = (o) => `${SCHOOL}_${o.department.toLowerCase().replace(/[^a-z]+/g, "_")}_${o.major.toLowerCase().replace(/[^a-z]+/g, "_")}_ba`.replace(/_+/g, "_").replace(/_ba$/, "_ba");
const slugFor = (o) => `${o.department}-${o.major}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const degreeLevels = [{
  degree_level_ref: "ba",
  degree_level_name: "Bachelor of Arts",
  degree_level_name_zh: "文学士",
  abbreviation: "BA",
  degree_category: "Undergraduate",
  display_order: null,
  description: null,
  _note: "The 2027 foreign-admissions guide is the admissions-source baseline and calls the four-year K-Arts undergraduate award Bachelor of Arts; the School of Music English overview uses Bachelor of Fine Arts terminology, recorded as a source conflict for review.",
}];

const fields = [
  { field_ref: "composition", field_name: "Composition", field_name_zh: "作曲", field_category: "Composition/Theory", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field value; K-Arts Composition is classified by the core craft of composition." },
  { field_ref: "conducting", field_name: "Conducting", field_name_zh: "指挥", field_category: "Conducting", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Operator-approved 2026-08-13 vocabulary addition; K-Arts Orchestral Conducting is the first member." },
  { field_ref: "performance", field_name: "Performance", field_name_zh: "演奏/演唱", field_category: "Music Performance", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field value; Vocal Music and Instrumental Music are performance admissions units." },
];

const school = {
  school_ref: SCHOOL,
  school_name: "Korea National University of Arts",
  school_name_zh: "韩国艺术综合学校",
  city: "Seoul",
  country: "South Korea",
  region: null,
  state_province: null,
  country_code: "KR",
  languages_of_instruction: ["Korean"],
  school_type: "Arts University",
  official_website: URL_MAIN,
  logo: null,
  card_image: null,
  intro_zh: "韩国艺术综合学校音乐院面向外国人本科通道招生的声乐、器乐、作曲与管弦乐指挥四类官方招生单位；音乐学与音乐科技本轮不建 offering。",
  ranking_source: null,
  ranking_position: null,
  notes: "本包只收 School of Music 的四年制本科外国人特别招生单位；排除 Musicology（2027 foreign guide 明确 not selected）、Music Technology（School of Music 页面列出但在 2027 foreign guide 的封闭式 Admission Unit 表中未列）、School of Korean Traditional Arts、戏剧及其他学院项目。排名字段按韩国线裁决留 null。",
};

const commonNotes = lines(
  "K-Arts 2027 Freshman Non-Quota Special Admissions Guide for International Students — Bachelor Programs applies to the foreign/non-quota route; applicants must satisfy the guide's foreign-national or all-schooling-abroad eligibility route.",
  "The School of Music is in the October entrance-examination group, but its 2027 foreign application window is July 13–15, 2026. Application is online through Jinhak Apply and required documents are mailed by the stated deadline.",
  "The current School of Music pages do not state a TOPIK minimum for these undergraduate foreign units. TOPIK therefore remains conditional rather than being promoted to a primary hard gate. This entry-language observation is separate from graduation language; no separate graduation-language threshold was found in the current guide.",
  "The official course page says the language of instruction is Korean. This is not converted into an English-test requirement without an explicit Music admissions rule.",
  "K-Arts finance page states annual tuition KRW 4,800,000. No separate local/non-local tuition track is displayed on that page; KRW is retained as the source currency and cost_estimate_rmb remains null.",
);

const makeProgram = (o) => {
  const ref = refFor(o);
  return {
    program_offering_ref: ref,
    school_ref: SCHOOL,
    field_ref: o.field_ref,
    degree_level_ref: "ba",
    track_or_concentration: o.track,
    official_program_name: `Bachelor of Arts — ${o.department} — ${o.major}`,
    program_name_zh: `文学士（${o.department === "Conducting" ? "指挥" : o.department === "Composition" ? "作曲" : o.department === "Vocal Music" ? "声乐" : "器乐"}：${o.major}）`,
    department: `School of Music; Department of ${o.department}`,
    duration_years: 4,
    language_of_instruction: ["Korean"],
    program_url: URL_SCHOOL,
    application_url: URL_APPLICATION,
    audition_url: URL_GUIDE,
    international_url: URL_FOREIGN,
    card_summary_zh: `韩国艺术综合学校音乐院四年制本科${o.department}·${o.major}，通过 2027 外国人特别招生通道申请；具体两轮考试要求按该招生单位逐项核实。`,
    degree_system: "Bachelor of Arts",
    tuition_currency: "KRW",
    tuition_amount_min: 4800000,
    tuition_amount_max: 4800000,
    tuition_period: "per_year",
    funding_policy: "K-Arts finance page states annual tuition of KRW 4,800,000; scholarships are separately administered and not netted into tuition.",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: lines(
      `Official foreign admission unit: ${o.department} / ${o.major}.`,
      "The 2027 foreign guide is used for current eligibility, degree naming, dates and selection content; the English School of Music overview's BFA terminology is retained as a review-note conflict rather than silently merged.",
      o.major === "Trombone" ? INSTRUMENTAL.Trombone.note : "One offering follows one official foreign admission unit; no instrument-level offering is created beyond the guide's unit table.",
      commonNotes,
    ),
  };
};

const makeApplication = (o) => {
  const ref = refFor(o);
  const extra = o.field_ref === "composition"
    ? ["Portfolio of two or more original compositions; five copies of personal statement and statement of purpose; recommendations from two or more persons; second-round portfolio resubmission as specified in the guide."]
    : o.field_ref === "conducting"
      ? ["Department-specific conducting materials and documents required by the 2027 guide; see the audition record for the exact two-round test content."]
      : ["One audiovisual recording on CD, DVD or USB stick for the first screening, plus the department/major-specific documents and repertoire information required by the guide."];
  return {
    program_offering_ref: ref,
    admission_cycle: CYCLE,
    is_current: true,
    application_deadline: "2026-07-15",
    timeline_structured: timeline,
    deadline_notes: "For the Mainland/foreign applicant route, the primary deadline is 2026-07-15 at 18:00 KST. Required documents are due 2026-07-16 at 18:00 KST. The current guide has one School of Music foreign intake in this cycle; no second March/September intake is published.",
    application_fee: 88000,
    application_fee_currency: "KRW",
    required_materials: [...COMMON_MATERIALS, ...extra],
    transcript_requirements: "Transcripts and certificates of graduation or expected graduation for the required schooling stages; documents not in Korean or English require notarised Korean or English translations, with apostille or consular legalisation as applicable.",
    recommendation_letters: o.field_ref === "composition" ? 2 : null,
    resume_required: "Unknown",
    essay_required: o.field_ref === "composition" ? "Required" : "Unknown",
    portfolio_required: o.field_ref === "composition" ? "Required" : "Unknown",
    english_language_tests: null,
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_waiver_policy: null,
    english_requirement_status: "Unknown",
    international_applicant_notes: "This record is for the official non-quota foreign/overseas-Korean admissions route, not the Korean domestic admissions route. Applicants and parents who are all foreign nationals, or applicants who completed all schooling abroad, must meet the route-specific eligibility documents in the 2027 guide.",
    conditional_notes: lines(
      "For Mainland applicants, the applicable primary gate is the foreign-admissions eligibility route and an accepted high-school-equivalent qualification; the current Music pages do not publish a separate Gaokao score threshold.",
      "TOPIK is retained as conditional because the current 2027 School of Music foreign guide does not state a unit-specific TOPIK minimum. Do not treat the TOPIK levels stated for other schools, AMA+ or other routes as applicable here.",
      "Entry-language and graduation-language requirements are kept separate: course catalog says instruction is Korean; no separate graduation TOPIK threshold was found in the current undergraduate foreign guide.",
      "The official guide's current fee is KRW 88,000 plus a separate KRW 6,000 online submission fee; only the application fee is in the numeric fee field.",
    ),
    conditional_notes_structured: {
      foreign_route: { status: "Eligible foreign/non-quota route", education: "High-school equivalent required", quota: "Unrestricted non-quota" },
      korean_language_entry: { status: "Conditional / no Music-specific TOPIK minimum stated in current 2027 guide", instruction_language: "Korean", evidence: "General educational-background/language-proficiency form is required" },
      graduation_language: { status: "Not stated separately in current 2027 undergraduate foreign guide", note: "Do not merge with entry-language evidence" },
      application_fee: { application_fee_krw: 88000, online_submission_fee_krw: 6000 },
    },
    estimated_living_cost: null,
    estimated_living_cost_currency: null,
    review_status: "Needs Review",
    notes: "The July 15 primary deadline is the single current School of Music foreign deadline; the timeline retains the document, examination, result, registration and matriculation milestones. The guide does not publish a March/September dual intake for this route.",
  };
};

const makeAudition = (o) => {
  const ref = refFor(o);
  const isVocal = o.department === "Vocal Music";
  const isComposition = o.field_ref === "composition";
  const isConducting = o.field_ref === "conducting";
  return {
    program_offering_ref: ref,
    admission_cycle: CYCLE,
    is_current: true,
    prescreening_required: "Yes",
    prescreening_deadline: "2026-07-16",
    audition_required: "Yes",
    audition_format: "Multiple Rounds",
    repertoire_summary: isVocal
      ? "Two-stage vocal major-repertoire screening, including Italian art song, opera/oratorio aria, Concone, German art song and a different second-stage aria; gender/voice-specific lists are recorded under the direction key."
      : isComposition
        ? "Two-stage composition screening: portfolio/document screening, analysis and composition examinations, oral examination, and portfolio resubmission."
        : isConducting
          ? "Two-stage conducting screening: piano performance, score-reading, conducting, harmony theory and sight-singing, with the exact Mozart Symphony No.38 requirements recorded under the unit key."
          : "Two-stage instrument-specific major-repertoire screening plus basic music theory; exact works and instrument variants are recorded under the official major key.",
    repertoire_structured: o.repertoire,
    video_requirements: isComposition || isConducting ? null : "For the first screening, submit one audiovisual recording on CD, DVD or USB stick by the required-document deadline; the guide states the medium, not a web-upload substitute.",
    file_format_requirements: isComposition ? "Portfolio and document-copy requirements follow the 2027 guide; no separate audiovisual file format is stated for Composition." : null,
    accompaniment_requirements: isVocal ? "Applicants bring an accompanist where required for a composition; the guide says the applicant is responsible for an accompanist." : null,
    interview_or_callback_requirements: isComposition ? "Second-round oral examination on analysis, submitted compositions, musicianship and overall music knowledge." : isConducting ? "Second-round live score-reading, conducting and sight-singing are required." : null,
    special_notes: lines(
      "The guide requires applicants to avoid repetition and perform works from memory where the unit-specific rule says so; cadenza and score-listing rules are retained in the direction data.",
      "The application form must identify the admission unit (department and major) and, where requested, audition repertoire; changes are not permitted after the relevant submission period.",
      isVocal ? "The common School of Music note says the online repertoire list requirement does not apply to Vocal Music; vocal lists are nevertheless recorded here from the test-content pages." : "Direction-specific requirements were checked from the School of Music pages in the 2027 guide; no requirements were extrapolated between majors.",
    ),
    conditional_notes: "The current guide's Music audition is a foreign-route multi-stage selection. TOPIK is not promoted to an audition gate; language evidence remains in conditional_notes_structured on the application record.",
    conditional_notes_structured: { korean_language: "No Music-specific TOPIK minimum stated in the current guide", round_structure: "First screening plus second screening", source_basis: "2027 foreign-admissions guide, School of Music test-content pages" },
    review_status: "Needs Review",
    notes: o.major === "Trombone" ? INSTRUMENTAL.Trombone.note : "One audition record per official offering; the repertoire object is direction-keyed and does not create additional offerings.",
  };
};

const source = (url, title, type, offeringRef, quote, relatedField = null) => ({
  school_ref: SCHOOL,
  program_offering_ref: offeringRef,
  admission_cycle: CYCLE,
  source_url: url,
  source_title: title,
  source_type: type,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote: quote,
  related_field: relatedField,
  confidence_level: "High",
  review_status: "Extracted",
});

const programs = offerings.map(makeProgram);
const applications = offerings.map(makeApplication);
const auditions = offerings.map(makeAudition);
const sourceRecords = [
  source(URL_SCHOOL, "School of Music — Degrees & Programs", "Official Program Page", null, "The School of Music page lists Vocal Music, Instrumental Music, Composition, Conducting, Musicology and Music Technology in the school structure.", null),
  source(URL_FOREIGN, "Foreign Admissions", "International Students Page", null, "General Foreign Admissions offers undergraduate degree-course applications for eligible foreign applicants.", null),
  source(URL_GUIDE, "2027 Freshman Non-Quota Special Admissions Guide for International Students — Bachelor Programs", "Application Requirements Page", null, "The guide applies to non-quota bachelor admissions for international students and lists the School of Music admission units and eligibility route.", null),
  source(URL_GUIDE, "2027 Freshman Non-Quota Special Admissions Guide — School of Music test contents", "Audition Requirements Page", null, "School of Music test-content pages give separate first- and second-screening requirements for Vocal Music, Instrumental Music, Composition and Orchestral Conducting.", null),
  source(URL_GUIDE, "2027 Freshman Non-Quota Special Admissions Guide — timeline and fee", "Deadline/Fee Page", null, "School of Music online application is July 13–15, 2026 until 18:00 on the final day; application fee is KRW 88,000 and online submission fee is KRW 6,000 separately.", null),
  source(URL_FINANCE, "Finance — Tuition Fee", "Deadline/Fee Page", null, "Annual tuition is KRW 4.8 million; the page does not show a separate local/non-local rate.", null),
  source(URL_COURSE, "Course Catalog", "Official Program Page", null, "The course catalog states that the language of instruction is Korean.", null),
  ...offerings.flatMap((o) => {
    const ref = refFor(o);
    return [
      source(URL_GUIDE, `2027 foreign guide — ${o.department} / ${o.major}`, "Official Program Page", ref, `The 2027 foreign-admissions Admission Unit table lists ${o.department} / ${o.major} as an application unit.`, o.field_ref),
      source(URL_GUIDE, `2027 foreign guide — ${o.department} / ${o.major} test content`, "Audition Requirements Page", ref, `The School of Music test-content pages provide the first- and second-screening requirements recorded for ${o.major}.`, o.field_ref),
    ];
  }),
];

const publishing = {
  programs: offerings.map((o) => ({
    program_offering_ref: refFor(o),
    slug: slugFor(o),
    answer_sentence_zh: `韩国艺术综合学校音乐院文学士（${o.department}·${o.major}）：四年制、韩语授课，通过 2027 外国人特别招生申请；两轮${o.field_ref === "performance" ? "器乐/声乐" : o.field_ref === "composition" ? "作曲" : "指挥"}考试要求以官网招生单位原文为准。`,
    field_tiers: { primary: o.field_ref },
    cost_estimate_rmb: null,
    badges: [{ label: `K-Arts ${o.major}`, type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })),
};

const dataQuality = {
  overall_confidence: "High",
  missing_critical_fields: [
    "No Music-specific TOPIK minimum is stated in the current 2027 foreign guide; retained as conditional rather than inferred.",
    "The guide calls the award Bachelor of Arts while the English School of Music overview uses Bachelor of Fine Arts terminology; admissions-guide wording is used as the degree baseline and the conflict is flagged for review.",
    "Music Technology is listed on the School of Music overview but is unlisted in the closed 2027 foreign Admission Unit table; it is excluded as unlisted, not labelled explicitly not admitted.",
  ],
  needs_human_review: true,
  review_notes: [
    "Mode A / operator decision: offerings follow the 2027 foreign admissions Admission Unit table. The result is 28 offerings: Vocal Music 6, Instrumental Music 20, Composition 1 and Orchestral Conducting 1.",
    "Mode A / operator decision: Musicology is excluded with the reason 'the foreign admissions route does not recruit it'; the 2027 guide explicitly says the Department of Musicology is not selected. Do not describe Musicology as nonexistent.",
    "Mode A / operator decision: Music Technology is excluded under the closed-list interpretation of the Admission Unit table. The School of Music page lists the department, but the 2027 foreign guide does not list it; this is a three-state 'unlisted' result, not an explicit no-admission statement.",
    "Vocabulary change: conducting was added to data/contract/field-vocabulary.json in this commit and maps to the existing native Conducting field_category. The classification precedent records K-Arts Orchestral Conducting as its first member.",
    "Trombone is not split into Tenor Trombone and Bass Trombone offerings: the foreign guide's admission-unit table says Trombone (including Bass Trombone), while the test-content pages give tenor and bass variants under that unit.",
    "All Vocal Music and Instrumental Music requirements were verified direction by direction from the current guide. No repertoire was extrapolated to directions that were not listed.",
    "Degree wording conflict: the current foreign admissions guide says Bachelor of Arts; the English School of Music overview says Bachelor of Fine Arts. The admissions guide is the recruitment-source baseline; operator review should decide whether the project degree vocabulary needs a separate K-Arts 예술사 precedent.",
    "TOPIK is not promoted to a primary entry gate because the current Music foreign guide pages do not state a Music-specific minimum. Entry-language evidence and graduation-language requirements remain separate; no graduation-language threshold was found.",
    "Tuition is recorded as KRW 4,800,000 per year from the current finance page; no local/non-local split is shown. Application fee is KRW 88,000; the separate KRW 6,000 online submission fee is retained in notes and conditional structure.",
    "Bottom-draft update hint: replace the pending 2027 PDF/dates/TOPIK/repertoire/fee/tuition gaps with the current guide values; update the school-level structure to show Musicology explicitly not recruited in the foreign route, Music Technology unlisted in that route, Orchestral Conducting recruited, and the 28 current admission units. The draft's old '21 instrumental majors' summary and older structure should not override the current admission-unit table.",
    "Ranking fields intentionally null. cost_estimate_rmb intentionally null; no FX conversion was made.",
  ],
};

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [school],
  fields,
  degree_levels: degreeLevels,
  program_offerings: programs,
  application_requirements: applications,
  audition_requirements: auditions,
  source_records: sourceRecords,
  publishing,
  data_quality: dataQuality,
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT} (${offerings.length} offerings)`);
