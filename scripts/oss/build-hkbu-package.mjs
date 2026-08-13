/** HKBU undergraduate music package generator, Mode B 2026-08-13. */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-hkbu-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "hkbu";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";
const URL_SCHOOL = "https://www.hkbu.edu.hk/";
const URL_UNIFIED = "https://mus.hkbu.edu.hk/art-creative";
const URL_BA = "https://mus.hkbu.edu.hk/programmes/ba";
const URL_BMUS = "https://mus.hkbu.edu.hk/programmes/bmus";
const URL_ADMISSIONS = "https://admissions.hkbu.edu.hk/programmes/school-of-creative-arts/bachelor-of-arts-hons-bachelor-of-music-hons-music-creative-industries-year1.html";
const URL_MAINLAND = "https://admissions.hkbu.edu.hk/programmes/school-of-creative-arts/bachelor-of-arts-hons-bachelor-of-music-hons-music-creative-industries-year1-jee.html";
const URL_INTERNATIONAL = "https://admissions.hkbu.edu.hk/admissions/international-qualifications.html";
const URL_INT_PDF = "https://admissions.hkbu.edu.hk/content/dam/ao-assets/document/download-area/international-qualifications-2026.pdf";
const URL_FEES = "https://admissions.hkbu.edu.hk/fees-and-scholarships.html";
const URL_LANGUAGE = "https://admissions.hkbu.edu.hk/admissions/post-secondary-qualifications.html";
const URL_GER = "https://admissions.hkbu.edu.hk/content/dam/ao-assets/document/news/general-entrance-requirements-for-the-2025-entry/2026-GER-PERs.pdf";

const BA = "hkbu_music_ba";
const BMUS = "hkbu_creative_industries_bmus";
const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "International non-local non-mainland early round", date_text: "2 October–16 November 2025" },
    { label: "International non-local non-mainland main round", date_text: "17 November 2025–1 February 2026" },
    { label: "Local and Mainland Chinese main round", date_text: "2 October 2025–4 January 2026" },
    { label: "International non-local non-mainland extended round", date_text: "2 February–31 May 2026" },
    { label: "Local and Mainland Chinese extended round", date_text: "5 January–31 May 2026" },
    { label: "Music portfolio submission deadline for BA first-choice applicants", date: "2026-06-11", conditional: "Current programme page states this applies to Mainland application route" },
    { label: "JUPAS assessment / interview or audition arrangements", date_text: "May–June 2026", conditional: "Programme / applicant dependent" },
    { label: "2026/27 academic year starts", date_text: "Early September 2026" },
  ],
  date_year_note: "官网当前资料对应 September 2026 / 2026-27 entry；申请页面显示 2026/27 closed，下一周期日期截至 2026-08-13 未发布。",
};

const fields = [
  ["music", "Music", "音乐", "Musicology"],
  ["professional_music", "Professional Music", "专业音乐（职业路径）", "Interdisciplinary"],
];
const degreeLevels = [
  ["ba", "Bachelor of Arts", "文学士", "BA"],
  ["bm", "Bachelor of Music", "音乐学士", "BM"],
];

const commonNotes = lines(
  "BA (Hons) in Music 与 BMus (Hons) in Creative Industries 是官网明确列出的两个独立学位 offering；两者共用 JS2060 / unified programme code 入口，事实写入 notes，不合并 offering。",
  "HKBU Academy of Music 页面说明学生通过 JUPAS 或 Direct Admissions 申请 JS2060 后，再申报学位与 concentration；这属于入口结构，不改变两个官方学位各立一条 offering 的粒度裁决。",
  "政府资助四年制本科；Music Minor、两年制 BA in Music Studies top-up、Associate Degree、研究生项目均排除。",
  "2026/27 非本地生学费 HKD190,000/年；本地生 HKD47,000/年写入 notes；cost_estimate_rmb 保持 null。",
);

const programs = [
  {
    program_offering_ref: BA,
    school_ref: SCHOOL,
    field_ref: "music",
    degree_level_ref: "ba",
    track_or_concentration: "Composition / Directed Studies / Music Education / Performance",
    official_program_name: "Bachelor of Arts (Hons) in Music",
    program_name_zh: "音乐文学士（荣誉）",
    department: "Academy of Music, School of Creative Arts",
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: URL_BA,
    application_url: URL_ADMISSIONS,
    audition_url: URL_ADMISSIONS,
    international_url: URL_INTERNATIONAL,
    card_summary_zh: "香港浸会大学音乐学院四年制音乐文学士（荣誉），第二年选择作曲、指导研习、音乐教育或演奏方向。",
    degree_system: "Bachelor of Arts (Hons)",
    tuition_currency: "HKD",
    tuition_amount_min: 190000,
    tuition_amount_max: 190000,
    tuition_period: "per_year",
    funding_policy: "UGC-funded undergraduate degree; non-local tuition is shown in the main field.",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: commonNotes,
  },
  {
    program_offering_ref: BMUS,
    school_ref: SCHOOL,
    field_ref: "professional_music",
    degree_level_ref: "bm",
    track_or_concentration: "Scoring for Film, Television and Video Games / Popular Music Performance and Songwriting",
    official_program_name: "Bachelor of Music (Hons) in Creative Industries",
    program_name_zh: "创意产业音乐学士（荣誉）",
    department: "Academy of Music, School of Creative Arts",
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: URL_BMUS,
    application_url: URL_ADMISSIONS,
    audition_url: URL_ADMISSIONS,
    international_url: URL_INTERNATIONAL,
    card_summary_zh: "香港浸会大学四年制创意产业音乐学士（荣誉），设影视及电子游戏配乐、流行音乐表演与 songwriting 两条职业方向。",
    degree_system: "Bachelor of Music (Hons)",
    tuition_currency: "HKD",
    tuition_amount_min: 190000,
    tuition_amount_max: 190000,
    tuition_period: "per_year",
    funding_policy: "UGC-funded undergraduate degree; non-local tuition is shown in the main field.",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: lines(
      commonNotes,
      "BMus 使用 professional_music / Interdisciplinary 不是因为名称含 Creative Industries 就自动归类，而是因为官网将其定义为面向创意与娱乐产业的专业训练，并明确包含影视/电子游戏配乐与流行音乐表演/songwriting 两个跨实践路径。",
    ),
  },
];

const appFor = (program) => ({
  program_offering_ref: program.program_offering_ref,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-01-04",
  timeline_structured: TIMELINE,
  deadline_notes: "按港澳先例，主 deadline 采用内地/非本地客群可用的 Local and Mainland Chinese main round 截止日 2026-01-04；国际非本地早轮、主轮、延长轮及专业补交材料另列 timeline_structured。",
  application_fee: 450,
  application_fee_currency: "HKD",
  required_materials: program.program_offering_ref === BA
    ? [
        "HKBU undergraduate online application",
        "Academic credentials and examination results",
        "Music qualifications and/or examination results",
        "Portfolio",
        "Shortlisted applicants may be invited to aptitude test, interview and/or audition",
      ]
    : [
        "HKBU undergraduate online application",
        "Academic credentials and examination results",
        "Music qualification examination results (practical and theory)",
        "Online portfolio submission",
        "Further assessment / interview / audition if requested by the programme",
      ],
  transcript_requirements: "Upload academic credentials and examination results according to the selected admissions route; supporting documents are verified by the University.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Unknown",
  portfolio_required: "Required",
  english_language_tests: ["IELTS Academic", "TOEFL iBT / Home Edition / Paper Edition", "SAT Evidence-Based Reading and Writing", "ACT", "GCE English", "HKDSE English"],
  toefl_minimum: 79,
  ielts_minimum: 6.0,
  duolingo_minimum: null,
  english_waiver_policy: "HKBU lists alternative English qualifications by curriculum; mainland JEE English 110 is listed in the 2026 Mainland brochure. Chinese alternatives may be accepted for eligible non-Chinese-speaking applicants under the University's conditions.",
  english_requirement_status: "Conditional",
  international_applicant_notes: lines(
    "Non-local applicants apply through Direct (Non-JUPAS); Mainland current Gaokao applicants use the Mainland JEE route. HKBU states non-local applicants must not apply through JUPAS.",
    "The unified JS2060 route is shared by BA Music and BMus Creative Industries, but the Academy contacts applicants to declare the intended degree / concentration and the programme-specific materials differ.",
  ),
  conditional_notes: lines(
    "BA Music：国际/非联招页面要求提交音乐资历及/或考试成绩，通常为实用/演奏 Grade 8 及理论 Grade 5 或同等资历和/或音乐成就证据；还需提交 portfolio，入围者可能参加 aptitude test、interview 和/或 audition。该页面措辞不是所有申请人均必然现场试演，故 audition 记录为 Conditional。",
    "BMus Creative Industries：官网要求提交 practical/theory 音乐资历成绩及 online portfolio；没有 portfolio 的申请不会继续处理。官网项目说明的两个方向分别是 Scoring for Film, Television and Video Games 与 Popular Music Performance and Songwriting。",
    "HKDSE JS2060 属 broad-based admission；HKDSE 通用最低要求及专业页面的音乐资料要求需按申请路径理解，不把 BA 与 BMus 的音乐资历措辞互相外推。",
    "Mainland JEE 页面与国际页面的申请时间、材料和英语路径分别记录；专业网页写明 BA 第一志愿申请人须在 2026-06-11 前提交音乐作品。",
  ),
  conditional_notes_structured: {
    route: {
      shared_jupas_code: "JS2060",
      non_jupas_code: "BA/BMUSIC",
      mainland_route: "Mainland JEE",
      shared_entry_note: "Applicants enter the unified JS2060 route, then declare BA Music or BMus Creative Industries / concentration with the Academy.",
    },
    english: {
      ielts_academic: 6.0,
      toefl: 79,
      mainland_jee_english: 110,
      same_attempt: true,
    },
    program_specific: program.program_offering_ref === BA
      ? { practical_or_performance_music: "Grade 8 or equivalent", theory: "Grade 5 or equivalent", portfolio: "Required", shortlisted_assessment: ["aptitude test", "interview", "audition"] }
      : { practical_or_performance_music: "Preferable Grade 8 or above", theory: "Preferable Grade 5 or above", portfolio: "Required; without portfolio application is not further processed", concentrations: ["Scoring for Film, Television and Video Games", "Popular Music Performance and Songwriting"] },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "HKD450 application fee applies to the published 2026 undergraduate international admissions brochure; admission confirmation fee is separate and not merged into application_fee.",
});

const auditionFor = (program) => ({
  program_offering_ref: program.program_offering_ref,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Yes",
  prescreening_deadline: null,
  audition_required: "Varies",
  audition_format: "Unknown",
  repertoire_summary: null,
  repertoire_structured: null,
  video_requirements: null,
  file_format_requirements: null,
  accompaniment_requirements: null,
  interview_or_callback_requirements: program.program_offering_ref === BA
    ? "Shortlisted applicants may be invited to an aptitude test, interview and/or audition; current official page does not specify a single universal format or repertoire list."
    : "The current official admissions page requires an online portfolio and states that applicants may be required to attend programme assessments; the BMus page does not publish a single universal audition format or repertoire list.",
  special_notes: program.program_offering_ref === BA
    ? "BA Music portfolio is a required programme material for international/post-secondary applicants; aptitude test, interview and/or audition is conditional on shortlisting."
    : "BMus Creative Industries portfolio is mandatory and is submitted through an online portfolio system; applicants without portfolio are not further processed.",
  conditional_notes: "Per R1, no instrument-specific or concentration-specific repertoire is created because the current official 2026 admissions page does not publish such a list.",
  conditional_notes_structured: {
    portfolio: "Required",
    assessment: program.program_offering_ref === BA ? "Conditional: aptitude test / interview / audition for shortlisted applicants" : "Conditional programme assessment; portfolio is mandatory",
  },
  review_status: "Needs Review",
  notes: "BA and BMus audition / portfolio requirements are stored separately even though JS2060 is shared; no second audition record is created for the shared entrance code.",
});

const source = (source_url, source_title, source_type, source_quote, related_field, confidence_level = "High", program_offering_ref = null) => ({
  school_ref: SCHOOL,
  program_offering_ref,
  admission_cycle: CYCLE,
  source_url,
  source_title,
  source_type,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote,
  related_field,
  confidence_level,
  review_status: "Extracted",
});

const source_records = [
  source(URL_UNIFIED, "BA / BMus UGC-funded unified route", "Official Program Page", "Two UGC-funded undergraduate programmes share JS2060 and applicants declare programme / concentration with the Academy.", "music", "High"),
  source(URL_ADMISSIONS, "HKBU Undergraduate Admissions JS2060", "Official Program Page", "Four-year Year 1 entry; JS2060; English medium; 128 credits; choices include BA Music and BMus Creative Industries.", "music", "High"),
  source(URL_BA, "Bachelor of Arts (Hons) in Music", "Official Program Page", "BA Music offers Composition, Directed Studies, Music Education and Performance concentrations.", "music", "High", BA),
  source(URL_BMUS, "Bachelor of Music (Hons) in Creative Industries", "Official Program Page", "BMus offers Scoring for Film, Television and Video Games and Popular Music Performance and Songwriting.", "professional_music", "High", BMUS),
  source(URL_ADMISSIONS, "BA programme entrance requirements", "Application Requirements Page", "BA international / post-secondary applicants submit music qualifications and portfolio; shortlisted applicants may be invited to aptitude test, interview and/or audition.", "music", "High", BA),
  source(URL_ADMISSIONS, "BMus programme entrance requirements", "Application Requirements Page", "BMus applicants submit practical/theory music examination results and an online portfolio; without portfolio applications are not further processed.", "professional_music", "High", BMUS),
  source(URL_INT_PDF, "2026 International Qualifications brochure", "Application Requirements Page", "International and Mainland application rounds; HKD450 application fee; IELTS 6.0 and TOEFL 79.", "music", "High"),
  source(URL_INTERNATIONAL, "International Qualifications", "International Students Page", "HKBU adopts university, English and programme entrance requirements for international applicants.", "music", "High"),
  source(URL_MAINLAND, "Mainland JEE 2026 programme page", "International Students Page", "Mainland JEE Year 1 route; 2026 September start; BA and BMus are under JS2060.", "music", "High"),
  source(URL_FEES, "Fees and Scholarships", "Deadline/Fee Page", "2026/27 tuition HKD47,000 local and HKD190,000 non-local per year.", "music", "High"),
  source(URL_LANGUAGE, "Post-Secondary English / Chinese requirements", "English Language Requirements Page", "Accepted English and alternative Chinese qualifications are listed.", "music", "High"),
  source(URL_GER, "General and Programme Entrance Requirements 2026", "Application Requirements Page", "JS2060 is broad-based with HKDSE minimum levels 3/3/Attained/2 and two elective levels 3.", "music", "High"),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "Hong Kong Baptist University",
    school_name_zh: "香港浸会大学",
    city: "Hong Kong",
    country: "China",
    region: "Hong Kong SAR",
    state_province: null,
    country_code: "HK",
    languages_of_instruction: ["English"],
    school_type: "University Music School",
    official_website: URL_SCHOOL,
    logo: null,
    card_image: null,
    intro_zh: "香港浸会大学音乐学院的四年制 BA in Music 与 BMus in Creative Industries 本科项目。",
    ranking_source: null,
    ranking_position: null,
    notes: "本包仅收 Academy of Music 的两个 UGC-funded Year 1 undergraduate degree offerings；其他学院、top-up、associate degree、研究生项目排除。",
  }],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref, field_name, field_name_zh, field_category, parent_field: null,
    field_group: "University Music", aliases: null, description: null, display_order: null,
    _note: field_ref === "music"
      ? "综合大学 BA in Music 先例：music/Musicology。"
      : "沿用 Professional Music 的适用理由：官方专业化 BM Creative Industries 学位，核心为跨媒体/流行音乐职业实践，不是综合大学学术型 BA。",
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation,
    degree_category: "Undergraduate", display_order: null, description: null,
    _note: "HKBU 2026 JS2060 下的四年制 BA / BMus Year 1 degree offerings。",
  })),
  program_offerings: programs,
  application_requirements: programs.map(appFor),
  audition_requirements: programs.map(auditionFor),
  source_records,
  publishing: { programs: programs.map((program) => ({
    program_offering_ref: program.program_offering_ref,
    slug: program.program_offering_ref === BA ? "music-ba" : "creative-industries-bmus",
    answer_sentence_zh: program.program_offering_ref === BA
      ? "香港浸会大学音乐文学士（荣誉）：四年制综合音乐本科，JS2060 统一入口，作品集后可能进入 aptitude test、面试或试演。"
      : "香港浸会大学创意产业音乐学士（荣誉）：四年制专业化跨媒体音乐本科，JS2060 统一入口，必须提交线上作品集。",
    field_tiers: { primary: program.field_ref },
    cost_estimate_rmb: null,
    badges: [{ label: program.program_offering_ref === BA ? "BA in Music" : "BMus Creative Industries", type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })) },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: ["2027/28 dates not published", "Detailed 2026 audition / portfolio content is not exposed in the current static official page"],
    needs_human_review: true,
    review_notes: [
      "Mode A: BA Music and BMus Creative Industries are two official degrees under one JS2060 unified route; two offerings retained per operator decision.",
      "Mode A: BA uses music/Musicology because it is the comprehensive academic/practical BA in Music. BMus uses professional_music/Interdisciplinary because its official degree is a professional Creative Industries pathway with two cross-media/popular-music concentrations; this is a reasoned precedent application, not a name-only match.",
      "Shared JS2060 is recorded in both offering notes; no duplicate third offering was created for the entrance code.",
      "BA audition_required=Conditional: official page says portfolio is submitted and shortlisted applicants may be invited to aptitude test, interview and/or audition; it does not support a universal audition Yes.",
      "BMus portfolio_required=Required and audition_required=Conditional: official page says applicants without portfolio are not further processed, but does not publish one universal audition format.",
      "BA / BMus programme-specific requirements are kept separate despite common entry code; no cross-programme extrapolation.",
      "Tuition follows HK precedent: non-local HKD190,000/year in main fields, local HKD47,000/year in notes, RMB estimate null.",
      "Bottom-draft update hint: add the current JS2060 unified-entry structure, two degree offerings, current route dates, tuition, BA conditional assessment and BMus mandatory portfolio.",
      "Ranking fields intentionally null.",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
