/** EdUHK undergraduate music package generator, Mode B 2026-08-13. */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-eduhk-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "eduhk";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";
const URL_SCHOOL = "https://www.eduhk.hk/";
const URL_LIST = "https://www.apply.eduhk.hk/ug/programme_list";
const URL_BED = "https://www.apply.eduhk.hk/ug/programmes/ba_bed_mu";
const URL_BA = "https://www.apply.eduhk.hk/ug/programmes/bacda";
const URL_JUPAS = "https://www.apply.eduhk.hk/ug/jupas";
const URL_INTERVIEW = "https://www.apply.eduhk.hk/ug/jupas_interview";
const URL_SELFNOM = "https://www.apply.eduhk.hk/ug/selfnom";
const URL_NONLOCAL = "https://www.apply.eduhk.hk/ug/nonlocal";
const URL_NONLOCAL_DATES = "https://www.apply.eduhk.hk/ug/nonlocal_dates";
const URL_NONLOCAL_PROCEDURES = "https://www.apply.eduhk.hk/ug/nonlocal_procedures";
const URL_MAINLAND = "https://www.apply.eduhk.hk/ug/mainlandjee";
const URL_FEES = "https://www.apply.eduhk.hk/ug/pdf/EdUHK_UG%20Brochure_Web_2025.pdf";
const URL_BED_COURSES = "https://www.apply.eduhk.hk/ug/pdf/programmes/course_list/BA%28CDA%29%26BEd%28MU%29.pdf";
const URL_BA_COURSES = "https://www.apply.eduhk.hk/ug/pdf/programmes/course_list/BA%28CDA%29.pdf";

const JS8001 = "eduhk_ba_cda_bed_music";
const JS8685 = "eduhk_ba_cda_music";
const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "International / Chinese Mainland non-JEE applications open", date: "2025-10-02" },
    { label: "International / Chinese Mainland non-JEE early-round deadline", date: "2025-11-17" },
    { label: "International / Chinese Mainland non-JEE main round", date_text: "18 November 2025–7 January 2026" },
    { label: "International / Chinese Mainland non-JEE late round", date_text: "8 January–6 May 2026" },
    { label: "Chinese Mainland JEE application deadline", date: "2026-06-12", qualifier: "12:00 noon Beijing Time" },
    { label: "Non-local shortlisted programme interviews", date_text: "December 2025–May 2026", conditional: "Shortlisted applicants" },
    { label: "JUPAS Music audition/interview before HKDSE results", date_text: "15–18 June 2026", conditional: "Shortlisted applicants" },
    { label: "JUPAS Music audition/interview after HKDSE results", date_text: "23–24 July 2026", conditional: "Shortlisted applicants" },
    { label: "2026/27 academic year starts", date_text: "Early September 2026" },
  ],
  date_year_note: "官网当前资料对应 2026/27 entry；截至 2026-08-13 未发布 2027/28 日期。",
};

const fields = [
  ["music_education", "Music Education", "音乐教育", "Music Education"],
  ["professional_music", "Professional Music", "专业音乐（创意产业融合）", "Interdisciplinary"],
];
const degreeLevels = [
  ["ba", "Bachelor of Arts", "文学士", "BA"],
  ["bed", "Bachelor of Education", "教育学士", "BEd"],
];

const commonNotes = lines(
  "本包只收 2026/27 官网清单中的 JS8001 与 JS8685 音乐本科项目；副学位、高等文凭、辅修、研究生项目排除。",
  "两项目属于 EdUHK Faculty of Humanities 的 Creative and Digital Arts 体系，不是独立音乐学院或标准 BA in Music。",
  "2026/27 非本地生学费 HKD180,000/年；本地生 HKD47,000/年写入 notes；cost_estimate_rmb 保持 null。",
);

const programs = [
  {
    program_offering_ref: JS8001,
    school_ref: SCHOOL,
    field_ref: "music_education",
    degree_level_ref: "bed",
    track_or_concentration: "Music within BA(CDA) + BEd(Music) double degree",
    official_program_name: "Bachelor of Arts (Hons) in Creative and Digital Arts and Bachelor of Education (Hons) (Music)",
    program_name_zh: "创意艺术与数码艺术荣誉文学士及音乐教育荣誉学士",
    department: "Faculty of Humanities; Creative and Digital Arts / Music",
    duration_years: 5,
    language_of_instruction: ["English", "Chinese"],
    program_url: URL_BED,
    application_url: URL_MAINLAND,
    audition_url: URL_INTERVIEW,
    international_url: URL_NONLOCAL,
    card_summary_zh: "香港教育大学五年制创意艺术与数码艺术及音乐教育双学位，音乐方向要求面试与 audition。",
    degree_system: "Bachelor of Arts (Hons) in Creative and Digital Arts + Bachelor of Education (Hons) (Music)",
    tuition_currency: "HKD",
    tuition_amount_min: 180000,
    tuition_amount_max: 180000,
    tuition_period: "per_year",
    funding_policy: "UGC-funded undergraduate double degree; non-local tuition is shown in the main field.",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: commonNotes,
  },
  {
    program_offering_ref: JS8685,
    school_ref: SCHOOL,
    field_ref: "professional_music",
    degree_level_ref: "ba",
    track_or_concentration: "Music within Creative and Digital Arts",
    official_program_name: "Bachelor of Arts (Hons) in Creative and Digital Arts (Music)",
    program_name_zh: "创意艺术与数码艺术荣誉文学士（音乐）",
    department: "Faculty of Humanities; Creative and Digital Arts",
    duration_years: 4,
    language_of_instruction: ["English", "Chinese"],
    program_url: URL_BA,
    application_url: URL_MAINLAND,
    audition_url: URL_INTERVIEW,
    international_url: URL_NONLOCAL,
    card_summary_zh: "香港教育大学四年制创意艺术与数码艺术文学士音乐方向，融合数字音乐、创意产业、艺术管理与实习。",
    degree_system: "Bachelor of Arts (Hons) in Creative and Digital Arts",
    tuition_currency: "HKD",
    tuition_amount_min: 180000,
    tuition_amount_max: 180000,
    tuition_period: "per_year",
    funding_policy: "UGC-funded undergraduate degree; non-local tuition is shown in the main field.",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: lines(
      commonNotes,
      "JS8685 使用 professional_music / Interdisciplinary，是因为其官方学位谱系为 Creative and Digital Arts 的音乐融合方向，面向数字艺术、媒体娱乐、艺术管理及音乐表演等创意产业；不是因为课程中含有某一比例的表演或制作。",
    ),
  },
];

const appFor = (program) => ({
  program_offering_ref: program.program_offering_ref,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-06-12",
  timeline_structured: TIMELINE,
  deadline_notes: "按港澳先例，主 deadline 采用内地应届高考生招生主路径 2026-06-12 12:00（北京时间）；国际/非联招早轮、主轮、晚轮及面试时间另列 timeline_structured。",
  application_fee: 300,
  application_fee_currency: "HKD",
  required_materials: [
    "EdUHK online undergraduate application",
    "Mainland JEE results / academic qualifications according to route",
    "English language evidence according to route",
    "Programme-specific music competence evidence",
    "Applicant Particular Form and original music certificate(s) for JUPAS music audition/interview when instructed",
  ],
  transcript_requirements: "Applicants upload the latest proofs of academic qualifications, predicted grades and language test reports when available; the University assesses applications holistically and competitively.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Unknown",
  portfolio_required: "Unknown",
  english_language_tests: ["IELTS Academic", "TOEFL iBT", "PTE Academic", "SAT Evidence-Based Reading and Writing", "GCE English", "IB English", "HKDSE English"],
  toefl_minimum: 80,
  ielts_minimum: 6.0,
  duolingo_minimum: null,
  english_waiver_policy: "EdUHK lists qualification-specific English alternatives; Mainland JEE applicants follow the JEE English route and the programme-specific English score table. Chinese Language may be waived case-by-case for applicants to programmes with English as the medium of instruction, subject to the University's conditions.",
  english_requirement_status: "Conditional",
  international_applicant_notes: lines(
    "Non-local applicants apply through the University's non-local / non-JUPAS route, not JUPAS; Chinese Mainland JEE applicants use the separate Chinese online platform.",
    "Each non-local applicant may submit up to two programme choices for HKD300; priority is given to the first programme choice. This application structure does not create a third offering for a second choice.",
  ),
  conditional_notes: lines(
    "内地应届高考生主路径：高考总分达到所属省市一本线或特殊类型招生控制分数线以上；英语通常 120/150 以上，部分专业最低 110/150，具体按当前专业英语要求表核定。JS8001/JS8685 的音乐能力要求另列。",
    "国际资历主路径：官网按 GCE/IB/SAT 及国家/地区资历分别列一般入学门槛；英语可用 IELTS Academic 6.0、TOEFL iBT 80（2026-01-21 前旧制；之后页面另列新制 4）等替代路径。",
    "JS8001 与 JS8685 均要求 satisfactory performance in an audition；HKDSE Music Level 4 or above 可豁免 audition；JUPAS 页面同时列 Interview Requirement = Yes。",
    "音乐 audition/interview 的 2026 页面格式为 individual audition and interview，约 10–15 分钟，英语进行；官网当前页面未发布乐器分方向曲目清单，因此不创建 repertoire_structured 方向键。",
    "Self-Nomination Admissions Scheme 是 JUPAS 申请人的可选优才路径，需把 JS8001/或 JS8685 放在 Band A，并提交音乐资历、个人陈述及可选推荐信；不写成普通申请的必过门槛。",
  ),
  conditional_notes_structured: {
    mainland_jee: {
      qualification: "Chinese Mainland National Joint College Entrance Examination",
      general_threshold: "Provincial first-tier line or special-type admission control line; not below the University's stated current threshold",
      english: "Normally 120/150; some programmes 110/150 according to the programme English requirement table",
      deadline: "2026-06-12 12:00 Beijing Time",
    },
    international: {
      early_round_deadline: "2025-11-17",
      main_round: "2025-11-18–2026-01-07",
      late_round: "2026-01-08–2026-05-06",
      ielts_academic: 6.0,
      toefl_ibt: 80,
    },
    programme_specific: {
      audition: "Required unless HKDSE Music Level 4 or above exemption applies",
      interview: "Required for JUPAS programme-specific interview arrangement",
      format: "Individual audition and interview; about 10–15 minutes; English",
      repertoire: null,
    },
    self_nomination: {
      status: "Optional JUPAS talent route",
      band_a: true,
      supporting_documents: ["music qualifications / experiences / achievements", "300–500 word personal statement", "recommendation letter optional"],
    },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "HKD300 application fee applies to non-local / Mainland application route; local/non-JUPAS timing is retained in timeline_structured. Non-local tuition is HKD180,000/year; local tuition HKD47,000/year is in programme notes.",
});

const auditionFor = (program) => ({
  program_offering_ref: program.program_offering_ref,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "Yes",
  audition_format: "Live Only",
  repertoire_summary: null,
  repertoire_structured: null,
  video_requirements: null,
  file_format_requirements: null,
  accompaniment_requirements: null,
  interview_or_callback_requirements: "JUPAS programme-specific page requires interview; 2026 arrangement page states individual audition and interview, about 10–15 minutes, in English.",
  special_notes: "Applicants who obtain Level 4 or above in HKDSE Music are exempted from the audition; the interview requirement remains separately listed. The current page gives no instrument-specific repertoire list.",
  conditional_notes: "Audition is required unless the stated HKDSE Music Level 4-or-above exemption applies. Self-Nomination Admissions Scheme interviews/tests are an optional route and do not replace the ordinary programme record.",
  conditional_notes_structured: {
    exemption: "HKDSE Music Level 4 or above",
    format: "Individual Audition and Interview",
    duration: "About 10–15 minutes",
    language: "English",
    repertoire: null,
  },
  review_status: "Needs Review",
  notes: "One audition record per official offering; no shared-code duplication and no repertoire extrapolation between the two Creative and Digital Arts music offerings.",
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
  source(URL_LIST, "Programme List 2026/27", "Official Program Page", "JS8001 is a five-year BA in Creative and Digital Arts & BEd (Music); JS8685 is a four-year BA in Creative and Digital Arts (Music), with two-year senior year entry.", "music_education", "High"),
  source(URL_BED, "BA(CDA) & BEd(MU)", "Official Program Page", "The official programme page identifies the five-year double-degree structure and the Music degree component.", "music_education", "High", JS8001),
  source(URL_BA, "BA in Creative and Digital Arts", "Official Program Page", "JS8685 is the Music code; the programme has an innovative creative digital emphasis, interdisciplinary music/visual arts studies, arts management, internship, and careers in digital and creative industries.", "professional_music", "High", JS8685),
  source(URL_BED_COURSES, "BA(CDA) & BEd(MU) course list", "Official Program Page", "The 2026/27 course list includes Music Studies, Musical Performance Skills, music traditions, digital music creation/performance, and Music Education courses.", "music_education", "High", JS8001),
  source(URL_BA_COURSES, "BA(CDA) course list", "Official Program Page", "The 2026/27 course list includes compulsory Music Subject Focus courses such as digital media and music learning, popular music, technology in the popular music industry, and digital music creation/performance.", "professional_music", "High", JS8685),
  source(URL_JUPAS, "JUPAS Entrance Requirements", "Application Requirements Page", "JS8001 and JS8685 each require satisfactory audition performance, exempted for HKDSE Music Level 4 or above; both list an interview requirement.", "music_education", "High"),
  source(URL_INTERVIEW, "JUPAS Interview Arrangement", "Audition Requirements Page", "For JS8001 and JS8685: individual audition and interview, about 10–15 minutes, in English; music certificate originals are inspected.", "music_education", "High"),
  source(URL_SELFNOM, "Self-Nomination Admissions Scheme", "Application Requirements Page", "The optional JUPAS music route covers JS8001 and JS8685, requires Band A choice and music qualifications/experience/achievements.", "music_education", "High"),
  source(URL_NONLOCAL, "International Qualifications", "International Students Page", "Chinese Mainland JEE applicants need the provincial first-tier/special-type line and the listed English score route; international qualifications and English alternatives are listed.", "music_education", "High"),
  source(URL_NONLOCAL_DATES, "International Qualifications Important Dates", "Deadline/Fee Page", "2026/27 non-local early deadline 17 November 2025, main round 18 November 2025–7 January 2026, late round 8 January–6 May 2026; interviews December 2025–May 2026.", "music_education", "High"),
  source(URL_NONLOCAL_PROCEDURES, "International Application Procedures", "Application Requirements Page", "Non-local applicants may submit up to two programme choices for HKD300; priority is given to the first choice.", "music_education", "High"),
  source(URL_MAINLAND, "Chinese Mainland JEE Applicants", "International Students Page", "2026/27 Mainland application deadline is 12 June 2026 at noon Beijing Time; applicants need first-tier/special-type line and English 120/150, with some programmes at 110/150.", "music_education", "High"),
  source(URL_NONLOCAL, "General English Language Requirements", "English Language Requirements Page", "IELTS Academic 6.0 and TOEFL iBT 80 are listed among accepted English thresholds; alternative qualification paths are also listed.", "music_education", "High"),
  source(URL_FEES, "2026/27 Tuition Fees", "Deadline/Fee Page", "For 2026/27 undergraduate JUPAS admissions, tuition is HKD47,000 for local students and HKD180,000 for non-local students per annum.", "music_education", "High"),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "The Education University of Hong Kong",
    school_name_zh: "香港教育大学",
    city: "Hong Kong",
    country: "China",
    region: "Hong Kong SAR",
    state_province: null,
    country_code: "HK",
    languages_of_instruction: ["English", "Chinese"],
    school_type: "University Music School",
    official_website: URL_SCHOOL,
    logo: null,
    card_image: null,
    intro_zh: "香港教育大学创意艺术与数码艺术体系中的音乐本科项目，包括音乐教育双学位与创意产业融合型音乐方向。",
    ranking_source: null,
    ranking_position: null,
    notes: "本包只收 JS8001 与 JS8685 两个官方音乐本科项目；其他艺术方向、高等文凭、辅修、研究生及非音乐项目排除。",
  }],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref, field_name, field_name_zh, field_category, parent_field: null,
    field_group: "University Music", aliases: null, description: null, display_order: null,
    _note: field_ref === "music_education"
      ? "2026-08-13 运营者裁决：官方学位谱系含 BEd (Music) 的 JS8001 使用 music_education/Music Education。"
      : "2026-08-13 运营者裁决：JS8685 是 Creative and Digital Arts 的音乐融合型学位，沿用 professional_music/Interdisciplinary。",
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation,
    degree_category: "Undergraduate", display_order: null, description: null,
    _note: "EdUHK JS8001 is a five-year BA + BEd double degree; JS8685 is a four-year BA.",
  })),
  program_offerings: programs,
  application_requirements: programs.map(appFor),
  audition_requirements: programs.map(auditionFor),
  source_records,
  publishing: { programs: programs.map((program) => ({
    program_offering_ref: program.program_offering_ref,
    slug: program.program_offering_ref === JS8001 ? "ba-cda-bed-music" : "ba-cda-music",
    answer_sentence_zh: program.program_offering_ref === JS8001
      ? "香港教育大学创意艺术与数码艺术及音乐教育双学位：五年制，音乐 audition 与面试为项目要求，符合条件的 HKDSE Music 申请人可豁免 audition。"
      : "香港教育大学创意艺术与数码艺术文学士（音乐）：四年制创意产业融合型音乐方向，要求音乐 audition 与面试，符合条件的 HKDSE Music 申请人可豁免 audition。",
    field_tiers: { primary: program.field_ref },
    cost_estimate_rmb: null,
    badges: [{ label: program.program_offering_ref === JS8001 ? "BA + BEd Music" : "BA(CDA) Music", type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })) },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: ["2027/28 application dates not published", "Instrument-specific repertoire list not published"],
    needs_human_review: true,
    review_notes: [
      "Mode A / operator decision: JS8001 uses music_education/Music Education because the official degree structure includes BEd (Music); this is not the comprehensive BA in Music precedent.",
      "Mode A / operator decision: JS8685 uses professional_music/Interdisciplinary because the official degree genealogy is Creative and Digital Arts (Music), a music + creative industry/media fusion degree; this is a reasoned extension of the HKBU BMus Creative Industries precedent, not a name-only match.",
      "The two official degrees remain two offerings; JS8001 double-degree semantics are represented in degree_system and notes, with degree_level_ref=bed for the teacher-education endpoint.",
      "Both offerings have one audition record. Official 2026 page says individual audition and interview, about 10–15 minutes, English; no repertoire list is created under R1.",
      "Audition is required unless HKDSE Music Level 4 or above exemption applies; optional Self-Nomination route is retained in conditional notes and not promoted to a universal extra hurdle.",
      "Main deadline uses Mainland JEE 2026-06-12 noon Beijing Time; international non-JEE rounds and interview windows are retained in timeline_structured.",
      "Tuition follows Hong Kong dual-track precedent: non-local HKD180,000/year main field, local HKD47,000/year in notes, RMB estimate null.",
      "Bottom-draft update hint: replace any prior 2026/27 structure, duration, JS8001/JS8685 labels, audition format, Mainland deadline and tuition with current official values; confirm the old BA(CAC) naming is superseded by BA(CDA).",
      "Ranking fields intentionally null.",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
