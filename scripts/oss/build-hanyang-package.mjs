/**
 * Hanyang University Music College undergraduate package generator.
 * Mode B, verified 2026-08-13 against the current 2027 Spring OIA guide.
 * Draft only; publishing remains an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-hanyang-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "hanyang";
const CHECKED = "2026-08-13";
const CYCLE = "2027 Spring";
const BASE = "https://oia.hanyang.ac.kr";
const URL_OIA = BASE;
const URL_GUIDE_PAGE = `${BASE}/admission`;
const URL_GUIDE_EN = `${BASE}/files/attach/filebox/2026/07/24/7e54446c503b4737fd1ccf61f504fb74.pdf`;
const URL_GUIDE_KO = `${BASE}/files/attach/filebox/2026/07/24/b94c032672aabc67fddc3f0b1527077c.pdf`;
const URL_MUSIC = "https://music.hanyang.ac.kr/home";
const URL_COMPOSITION = "https://music.hanyang.ac.kr/-15";
const URL_ADMISSIONS = "https://go.hanyang.ac.kr/web/mojib/mojib.do?m_type=JEOEGUK&m_year=202703";
const URL_ADMISSIONS_PDF = "https://go.hanyang.ac.kr/resources/upload_data/mojib/20260710111925687_.pdf";

const lines = (...parts) => parts.join("\n");
const refFor = (o) => `${SCHOOL}_${o.key}_bm`;

const timeline = {
  milestones: [
    { label: "Online application opens", date: "2026-09-01", qualifier: "10:00 KST" },
    { label: "Online application deadline", date: "2026-09-18", qualifier: "17:00 KST" },
    { label: "Document submission opens", date: "2026-09-01", qualifier: "10:00 KST" },
    { label: "Document submission deadline", date: "2026-09-30", qualifier: "17:00 KST" },
    { label: "Admission results", date: "2026-12-18" },
    { label: "Tuition payment", date_text: "January 2027 (tentative)" },
    { label: "Semester begins", date: "2027-03-02" },
  ],
  date_year_note: "The current OIA guide is for 2027 Spring Semester (March); no September undergraduate intake is listed in this guide.",
};

const commonMaterials = [
  "Online application form and declaration",
  "High school graduation or expected-graduation certificate",
  "Complete high school transcript",
  "Applicant and parents' identity/nationality documents",
  "Family relationship certificate",
  "Artwork statement for majors requiring artwork submission",
  "Music College artwork/records submitted by post on USB",
];

const offerings = [
  {
    key: "voice",
    official: "Voice",
    nameZh: "声乐",
    department: "Music College; Voice",
    field: "performance",
    track: "Voice",
  },
  {
    key: "composition",
    official: "Composition",
    nameZh: "作曲",
    department: "Music College; Composition",
    field: "composition",
    track: "Composition; internal composition/electronic-music tracks",
  },
  {
    key: "piano",
    official: "Piano",
    nameZh: "钢琴",
    department: "Music College; Piano",
    field: "performance",
    track: "Piano",
  },
  {
    key: "orchestral_instruments",
    official: "Orchestral Instruments",
    nameZh: "管弦乐器",
    department: "Music College; Orchestral Instruments",
    field: "performance",
    track: "Violin; Viola; Cello; Double Bass; Flute; Oboe; Clarinet; Bassoon; Saxophone; Horn; Trumpet; Tenor Trombone; Bass Trombone; Tuba; Percussion Instrument",
  },
  {
    key: "korean_traditional_music",
    official: "Korean Traditional Music",
    nameZh: "韩国传统音乐",
    department: "Music College; Korean Traditional Music",
    field: "performance",
    track: "Instrumental Music; Voice; Composition; Theory",
  },
];

const repertoire = {
  voice: {
    official_unit: "Voice",
    submission: [
      "One Italian aria or one Song in Italian selected from the applicable list.",
      "One Song in German selected from the applicable list.",
    ],
    male_song_in_italian: [
      "Gial il sole dal Gange (A. Scarlatti)",
      "Vergin, tutto amor (F. Durante)",
      "O del mio dolce ardor (C. Gluck)",
      "Selve amiche (A. Caldara)",
      "Vaghissima sembianza (S. Donaudy)",
    ],
    male_song_in_german: [
      "An die Musik (F. Schubert)",
      "Die forelle (F. Schubert)",
      "Die Post (F. Schubert)",
      "Du bist die Ruh (F. Schubert)",
      "Ich liebe dich (L. v. Beethoven)",
      "Widmung (R. Schumann)",
    ],
    female_song_in_italian: [
      "Bel piacere (G. F. Handel)",
      "V'adore pupille (G. F. Handel)",
      "Lungi dal caro bene (A. Secchi)",
      "La Fioraia Fiorentina (G. Rossini)",
      "Sognai (F. Schira)",
    ],
    female_song_in_german: [
      "Das Veilchen (W. A. Mozart)",
      "Die forelle (F. Schubert)",
      "Du bist die Ruh (F. Schubert)",
      "Minnelied (J. Brahms)",
      "Widmung (R. Schumann)",
      "Immer leiser (J. Brahms)",
    ],
    recording_notes: [
      "The pianist/accompanist and the candidate's singing must both be clearly visible.",
      "Editing or enhancing the audio, sound, or any part of the recorded video is prohibited.",
      "Submit the file in MP4 format; the file name should be the title of the piece.",
    ],
  },
  composition: {
    official_unit: "Composition",
    submission: [
      "One sheet of music composed with musical expression in the Western classical music tradition.",
      "Performance video with one fast movement from any Beethoven sonata.",
    ],
  },
  piano: {
    official_unit: "Piano",
    submission: [
      "One fast movement from any Beethoven sonata.",
      "One etude by F. Chopin or F. Liszt.",
      "One work of the applicant's choice, with a minimum length of 5 minutes.",
    ],
  },
  orchestral_instruments: {
    official_unit: "Orchestral Instruments",
    direction_keys: {
      Violin: ["One song of the applicant's selection", "One of the violin scales"],
      Percussion: ["One marimba song of the applicant's selection", "Snare drum: M. Markovich, The Winner (1 minute)"],
      Other: ["One song of the applicant's selection"],
    },
    note: "The current foreign guide names the full instrument list in the Admission Unit table but gives artwork content only for Violin, Percussion and a grouped Other category. No separate repertoire key is created for unnamed individual directions.",
  },
  korean_traditional_music: {
    official_unit: "Korean Traditional Music",
    direction_keys: {
      Instrumental_Music: [
        "One song of the applicant's selection played on a Korean or the applicant's native musical instrument; video submission is available.",
        "Applicants may enter the major of a similar traditional musical instrument after the examination.",
      ],
      Voice: [
        "Two voice songs among Korean or the applicant's native music; video submission is available.",
        "Applicants may enter Korean Traditional Voice after the examination.",
      ],
      Composition: [
        "Sheet music longer than 24 measures, played using three or more Korean or native musical instruments.",
        "Applicants may enter Korean Traditional Composition after the examination.",
      ],
      Theory: [
        "Study plan in Korean or an English translation.",
        "Applicants may enter Korean Traditional Music Theory after the examination.",
      ],
    },
    interview: "Approximately 10-minute Korean Zoom interview; the time is announced separately.",
  },
};

const fields = [
  { field_ref: "composition", field_name: "Composition", field_name_zh: "作曲", field_category: "Composition/Theory", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field; Hanyang's official foreign admission unit is Composition. Electronic music is retained as an internal track note, not a separate offering." },
  { field_ref: "performance", field_name: "Performance", field_name_zh: "演奏/演唱", field_category: "Music Performance", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field; Voice, Piano, Orchestral Instruments and Korean Traditional Music are performance-centred admission units." },
];

const degreeLevels = [{
  degree_level_ref: "bm",
  degree_level_name: "Bachelor of Music",
  degree_level_name_zh: "音乐学士",
  abbreviation: "BM",
  degree_category: "Undergraduate",
  display_order: null,
  description: null,
  _note: "The current 2027 OIA guide labels these as undergraduate Music College admission units but does not restate the English degree title; BM is retained as the project's undergraduate music degree level with an explicit review note.",
}];

const school = {
  school_ref: SCHOOL,
  school_name: "Hanyang University",
  school_name_zh: "汉阳大学",
  city: "Seoul",
  country: "South Korea",
  region: null,
  state_province: null,
  country_code: "KR",
  languages_of_instruction: ["Korean"],
  school_type: "University Music School",
  official_website: "https://www.hanyang.ac.kr/",
  logo: null,
  card_image: null,
  intro_zh: "汉阳大学音乐学院本科外国人招生，当前 2027 Spring 指南列出声乐、作曲、钢琴、管弦乐器及韩国传统音乐五个招生单位。",
  ranking_source: null,
  ranking_position: null,
  notes: lines(
    "本包只收 Hanyang University Music College 的本科外国人招生单位；研究生、转学及其他学院项目排除。",
    "主记录采用 OIA 2027 Spring International Students 路径，适用于符合外国人新入学资格的内地申请人。招生处另有 2027 3 月 재외국민과 외국인 특별전형，音乐学院在该通道的全程海外就读类别中也被列出；两套通道不合并。",
    "OIA 指南的 Music 页面未给出非本地/本地学费区分；KRW 原币保留，cost_estimate_rmb 不做汇率换算。排名字段留 null。",
  ),
};

const makeProgram = (o) => ({
  program_offering_ref: refFor(o),
  school_ref: SCHOOL,
  field_ref: o.field,
  degree_level_ref: "bm",
  track_or_concentration: o.track,
  official_program_name: `Hanyang University Music College Undergraduate — ${o.official}`,
  program_name_zh: `汉阳大学音乐学院本科 — ${o.nameZh}`,
  department: o.department,
  duration_years: null,
  language_of_instruction: ["Korean"],
  program_url: o.key === "composition" ? URL_COMPOSITION : URL_MUSIC,
  application_url: URL_GUIDE_PAGE,
  audition_url: URL_GUIDE_EN,
  international_url: URL_OIA,
  card_summary_zh: `汉阳大学音乐学院${o.nameZh}本科外国人招生；当前 OIA 指南采用材料审查 + 作品审查，具体提交内容按官方招生单位逐项记录。`,
  degree_system: "Music College undergraduate degree; current foreign guide does not restate the English degree title",
  tuition_currency: "KRW",
  tuition_amount_min: 7820000,
  tuition_amount_max: 7820000,
  tuition_period: "per_semester",
  funding_policy: "The current OIA guide lists KRW 7,820,000 per semester for Music, based on Fall 2026 and subject to university policy changes.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    `官网当前外国人招生单位：${o.official}。`,
    o.key === "composition" ? "作曲系官网介绍作曲与电子音乐等内部 track；外国人指南的 Admission Unit 仍只有 Composition，因此不新增 Electronic Music offering。" : "Offering 粒度跟随 OIA 当前外国人 Admission Unit 表，不把未单列的内部方向拆成新 offering。",
    "当前 OIA 指南没有按招生单位重述英文 degree title 与学制年限；字段保留为项目本科音乐学位层级，未把缺失内容伪装成官网原文。",
  ),
});

const makeApplication = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-09-18",
  timeline_structured: timeline,
  deadline_notes: "主 deadline 取 OIA 外国人本科 2027 Spring 在线申请截止日 2026-09-18 17:00 KST；材料提交另截止至 2026-09-30 17:00 KST。招生处全程海外就读通道为另一套申请路径，保留在 notes/source_records，不合并为本记录的第二个 deadline。",
  application_fee: 142000,
  application_fee_currency: "KRW",
  required_materials: [...commonMaterials, ...(o.key === "korean_traditional_music" ? ["Korean Traditional Music direction-specific records; approximately 10-minute Korean Zoom interview if notified"] : [])],
  transcript_requirements: "Freshman applicants submit the high school graduation/expected-graduation certificate and complete high school transcript; Chinese-school documents require the guide's stated CHSI/Apostille or dual-certification handling.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Not Required",
  portfolio_required: "Required",
  english_language_tests: ["TOEFL iBT", "IELTS Academic"],
  toefl_minimum: null,
  ielts_minimum: null,
  duolingo_minimum: null,
  english_waiver_policy: "The guide lists English-language proficiency documents as optional for freshman applicants; English-track minimums are stated only for departments marked ENG, and Music is not marked ENG.",
  english_requirement_status: "Optional",
  international_applicant_notes: "This record uses Hanyang OIA's 2027 Spring international freshman route: applicants must hold foreign nationality and both parents must hold foreign nationality, and the applicant must have graduated or be expected to graduate from high school.",
  conditional_notes: lines(
    "Music is listed under Evaluation Type 2: Document Screening + Artwork Screening. The guide does not describe a live audition for this route; the Music College records/portfolio are submitted on USB.",
    "The guide's Korean-language standard is described for Korean Track majors. Music is not marked ENG and the current Music section does not publish a Music-specific TOPIK minimum; TOPIK is therefore retained as conditional context, not a primary hard threshold.",
    "The separate English-language row is optional for freshman applicants. The guide gives TOEFL/IELTS minimums for marked English Track departments only; no Music-specific TOEFL/IELTS minimum was found.",
    "An additional second-choice application is available for Seoul Campus; its separate fee is KRW 27,000 after the first-choice fee of KRW 142,000. The project keeps one application record per offering and records the second-choice mechanics in notes.",
  ),
  conditional_notes_structured: {
    route: { type: "OIA international freshman", semester: "2027 Spring (March)" },
    korean_language: { status: "Conditional", applicability: "Guide text ties the standard to Korean Track majors; no Music-specific minimum is published", standards: ["TOPIK / TOPIK IBT level 4 or higher", "Hanyang IIE Academic transcript level 4 or higher"] },
    english_language: { status: "Optional", music_marked_eng: false, tests_listed: ["TOEFL iBT", "IELTS Academic"], music_specific_minimum: null },
    post_admission_language: { status: "Not stated in the current guide", graduation_language_requirement: null },
    application_fee: { first_choice_krw: 142000, second_choice_krw: 27000, second_choice_total_krw: 169000 },
    eligibility: { freshman: "Foreign applicant and both parents foreign nationals; high school graduate or expected graduate" },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "The primary application deadline is the online application deadline. The later document deadline and Music College USB records deadline are preserved in timeline_structured. No September second intake is listed in the current OIA undergraduate guide.",
});

const makeAudition = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "No",
  prescreening_deadline: null,
  audition_required: "No",
  audition_format: "Recorded Only",
  repertoire_summary: "The current OIA route uses document screening plus artwork/records screening rather than a live practical audition. Direction-level requirements are kept under repertoire_structured.",
  repertoire_structured: repertoire[o.key],
  video_requirements: "Music College artwork/records are submitted on USB. Voice, Composition, Orchestral Instruments and Korean Traditional Music entries include video where specified by the direction-level requirements.",
  file_format_requirements: o.key === "voice" ? "MP4; file name should be the title of the piece." : "The guide requires USB submission for Music College artwork/records; it does not state a universal file format for every Music direction.",
  accompaniment_requirements: o.key === "voice" ? "The pianist/accompanist and candidate's singing must both be clearly visible in the recording." : null,
  interview_or_callback_requirements: o.key === "korean_traditional_music" ? "Approximately 10-minute Korean Zoom interview; schedule announced separately." : null,
  special_notes: lines(
    "audition_required is No because the current OIA guide describes Evaluation Type 2 as document screening + artwork screening, not a live audition.",
    "This is a records/portfolio requirement stored in the audition_requirements collection for product compatibility; it must not be displayed as an in-person audition requirement.",
    o.key === "orchestral_instruments" ? "The guide gives separate content for Violin, Percussion and grouped Other only; no unlisted direction-level repertoire is created." : null,
    o.key === "korean_traditional_music" ? "The Korean Zoom interview is a language/aptitude interview, not a live practical audition." : null,
  ),
  conditional_notes: "The current foreign route's Music College selection is records/artwork based. Domestic Korean admissions practical-exam repertoire was not imported into this foreign route.",
  conditional_notes_structured: { route: "2027 Spring OIA international freshman", selection: "Document Screening + Artwork Screening", live_audition: false, direction_level_source: "Current OIA guide, Requirements for the artwork — Details on the college of music" },
  review_status: "Needs Review",
  notes: "One records/audition-compatible record per official foreign admission unit; direction keys are retained only where the current guide gives them.",
});

const source = (url, title, type, offeringRef, quote, relatedField = null, confidence = "High") => ({
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
  confidence_level: confidence,
  review_status: "Extracted",
});

const programs = offerings.map(makeProgram);
const applications = offerings.map(makeApplication);
const auditions = offerings.map(makeAudition);

const sourceRecords = [
  source(URL_GUIDE_PAGE, "Hanyang OIA Admission Guideline", "International Students Page", null, "The current OIA page provides Korean, English and Chinese undergraduate admission-guide downloads.", null),
  source(URL_GUIDE_EN, "2027 Spring Admission Guidelines for International Students — English guide", "Application Requirements Page", null, "The current guide covers Undergraduate Admission Units, Application Schedule, Eligibility, Required Documents, Screening Process, Korean Language Proficiency Standards, dual application and tuition.", null),
  source(URL_GUIDE_KO, "2027 Spring Admission Guidelines for International Students — Korean original", "International Students Page", null, "Korean original guide; the English guide states that the Korean guideline prevails if interpretation conflicts.", null),
  source(URL_GUIDE_EN, "2027 Spring application schedule and fee", "Deadline/Fee Page", null, "Online application: September 1, 2026 10:00 to September 18, 2026 17:00; document submission: September 1, 2026 10:00 to September 30, 2026 17:00; first-choice application fee KRW 142,000 and second-choice fee KRW 27,000.", null),
  source(URL_GUIDE_EN, "2027 Spring Korean language proficiency standards", "English Language Requirements Page", null, "Korean standards are TOPIK/TOPIK IBT level 4 or higher or Hanyang IIE Academic transcript level 4 or higher; the surrounding text applies this requirement to Korean Track majors. English-language documents are optional for freshman applicants, and Music is not marked ENG.", null),
  source(URL_GUIDE_EN, "2027 Spring Music College artwork requirements", "Audition Requirements Page", null, "Evaluation Type 2 lists Music and its five departments: Voice, Composition, Piano, Orchestral Instruments and Korean Traditional Music; the Music College supplies direction-specific artwork/records requirements on the following page.", null),
  source(URL_GUIDE_EN, "2027 Spring Music tuition", "Deadline/Fee Page", null, "Tuition table: Music — KRW 7,820,000 per semester, based on Fall 2026 and subject to university policy.", null),
  source(URL_MUSIC, "Hanyang Music College", "Official Program Page", null, "The Music College homepage links the five current departments: Voice, Composition, Piano, Orchestral and Korean Music.", null),
  source(URL_COMPOSITION, "Hanyang Composition", "Official Program Page", null, "The Composition page describes composition and electronic music as internal specialised tracks within the Composition department; this supports retaining one Composition offering.", "composition"),
  source(URL_ADMISSIONS, "Hanyang 2027 March foreign admissions guide index", "International Students Page", null, "The Admissions Office current 2027 March guide separately lists the foreign/repatriate special-admissions route and its Music College units.", null),
  source(URL_ADMISSIONS_PDF, "Hanyang 2027 March foreign/repatriate guide", "Application Requirements Page", null, "The separate Admissions Office route lists Music College departments for the all-schooling-abroad category and uses a separate application route; it is not merged into the OIA international-freshman record.", null, "Medium"),
  ...offerings.flatMap((o) => [
    source(URL_GUIDE_EN, `2027 foreign guide — Music / ${o.official}`, "Official Program Page", refFor(o), `The current OIA Admission Unit and Evaluation Type 2 tables list ${o.official} as an international undergraduate Music admission unit.`, o.field),
    source(URL_GUIDE_EN, `2027 foreign guide — artwork requirements / ${o.official}`, "Audition Requirements Page", refFor(o), `The current Music College artwork attachment gives the direction-level submission for ${o.official}; no other direction's requirement was used as a substitute.`, o.field),
  ]),
];

const publishing = {
  programs: offerings.map((o) => ({
    program_offering_ref: refFor(o),
    slug: `hanyang-${o.key}`,
    answer_sentence_zh: `汉阳大学音乐学院${o.nameZh}本科：2027 Spring 外国人申请采用材料审查 + 作品审查，具体作品要求按官方招生单位逐方向核实；学费为 KRW 7,820,000/学期。`,
    field_tiers: { primary: o.field },
    cost_estimate_rmb: null,
    badges: [{ label: `Hanyang ${o.official}`, type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })),
};

const dataQuality = {
  overall_confidence: "High",
  missing_critical_fields: [
    "The current OIA guide does not restate the English degree title or duration for the Music College units; BM and duration_years null are retained with an explicit review note.",
    "The current OIA guide does not publish a Music-specific TOEFL/IELTS minimum or a separate graduation-language requirement.",
  ],
  needs_human_review: true,
  review_notes: [
    "Mode A offering grain follows the current OIA international Admission Unit table: five offerings — Voice, Composition, Piano, Orchestral Instruments and Korean Traditional Music.",
    "Composition and electronic music: the Music College Composition page describes electronic music as an internal specialised track; the foreign Admission Unit table lists only Composition, so no electronic-music offering is created.",
    "Current OIA route eligibility is the primary Mainland-applicant route. The Admissions Office all-schooling-abroad route is a separate current channel and is retained in source_records/notes rather than merged into the application record.",
    "The current OIA guide classifies Music under Evaluation Type 2: Document Screening + Artwork Screening. audition_required is therefore No; the USB records/portfolio are stored in audition_requirements only for the existing contract's records-compatible surface.",
    "Voice, Composition, Piano, Orchestral Instruments and Korean Traditional Music were transcribed separately from the current artwork page. Orchestral Instruments has only Violin, Percussion and grouped Other detail in the guide; no unspecified individual repertoire was invented.",
    "Korean Traditional Music's approximately 10-minute Korean Zoom interview is recorded as interview_or_callback, not as a live audition.",
    "English requirements were checked: Music is not marked ENG; the guide lists English-language evidence as optional for freshman applicants and publishes TOEFL/IELTS minima only for named English Track departments. Music-specific English minima are null.",
    "TOPIK is retained in conditional_notes_structured because the guide ties Korean standards to Korean Track majors and does not publish a Music-specific minimum. Entry-language context is kept separate from graduation-language requirements.",
    "Tuition is KRW 7,820,000 per semester, based on Fall 2026; local/non-local split is not displayed. cost_estimate_rmb remains null and no FX conversion was made.",
    "The primary deadline is 2026-09-18; the later document deadline is 2026-09-30. The OIA guide lists only the March/Spring cycle for this undergraduate route.",
    "Ranking fields intentionally null. Bottom-draft update hint: replace any prior pending Hanyang route map with the current OIA five-unit table, USB artwork rules, language semantics, dates, fees and KRW tuition; keep the separate Admissions Office route distinct.",
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
