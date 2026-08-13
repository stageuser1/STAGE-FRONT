/**
 * 香港大学音乐本科 canonical 包生成器（Mode B, 2026-08-13）。
 *
 *   node scripts/oss/build-hku-package.mjs <输出路径>
 *
 * 只收 Bachelor of Arts (Major in Music)。普通 BA 录取与 Music Scholarship
 * Scheme 的可选试演严格分开；本脚本只生成 draft 包。
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-hku-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "hku";
const OFFERING = "hku_music_ba";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";
const URL_INDEX = "https://admissions.hku.hk/programmes/undergraduate-programmes?page=1";
const URL_MUSIC_PROSPECTIVE = "https://www.music.hku.hk/prospective-students.html";
const URL_MUSIC_CURRICULUM = "https://www.music.hku.hk/undergrad-general-info.html";
const URL_APPLY = "https://admissions.hku.hk/apply/international-qualifications";
const URL_MAINLAND = "https://admissions.hku.hk/zh-hans/apply/mainland";
const URL_ENGLISH = "https://admissions.hku.hk/apply/international-qualifications/english-language-requirement";
const URL_FAQ = "https://admissions.hku.hk/faqs/bachelor";
const URL_FEE = "https://admissions.hku.hk/fees-and-scholarships/fees";
const URL_INTERVIEW = "https://admissions.hku.hk/apply/international-qualifications/interview";
const URL_SCHOLARSHIP = "https://admissions.hku.hk/fees-and-scholarships/scholarships/music-scholarship-scheme";

const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "International / Non-JUPAS application opens", date: "2025-09-24" },
    { label: "International / Non-JUPAS first-round evaluation deadline", date: "2025-11-26", qualifier: "12:00 noon Hong Kong Time" },
    { label: "International / Non-JUPAS rolling consideration", date_text: "From 26 November 2025", status: "rolling" },
    { label: "International / Non-JUPAS final application close", date: "2026-08-21", qualifier: "12:00 noon Hong Kong Time" },
    { label: "Mainland undergraduate application deadline", date: "2026-06-28", qualifier: "12:00 noon" },
    { label: "Mainland applicants upload Gaokao results", date_text: "Late June 2026", status: "published window" },
    { label: "Mainland admission interviews", date_text: "Late June 2026", conditional: "For applicants invited to interview" },
    { label: "Music Scholarship Scheme application deadline", date: "2026-05-29", conditional: "Optional scholarship route; not the ordinary BA admission deadline" },
    { label: "Music Scholarship Scheme interviews / auditions", date_text: "December 2025 - May 2026", conditional: "Shortlisted scholarship applicants only" },
  ],
  date_year_note: "官网当前招生页面仍以 2026/27 admissions cycle 为准；截至 2026-08-13 未见 2027/28 本科申请日期。",
};

const fields = [["music", "Music", "音乐", "Musicology"]];
const degreeLevels = [["ba", "Bachelor of Arts", "文学士", "BA"]];

const program = {
  program_offering_ref: OFFERING,
  school_ref: SCHOOL,
  field_ref: "music",
  degree_level_ref: "ba",
  track_or_concentration: "Music",
  official_program_name: "Bachelor of Arts (Major in Music)",
  program_name_zh: "文学士（音乐主修）",
  department: "Department of Music, School of Humanities, Faculty of Arts",
  duration_years: 4,
  language_of_instruction: ["English"],
  program_url: URL_INDEX,
  application_url: URL_APPLY,
  audition_url: URL_MUSIC_PROSPECTIVE,
  international_url: URL_APPLY,
  card_summary_zh: "香港大学文学院四年制文学士音乐主修，课程综合音乐学术、创作与表演学习。",
  degree_system: "Bachelor of Arts",
  tuition_currency: "HKD",
  tuition_amount_min: 224000,
  tuition_amount_max: 224000,
  tuition_period: "per_year",
  funding_policy: "UGC-funded undergraduate degree; non-local tuition shown in the main field for the project audience.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "普通 BA Music major 与 Music Scholarship Scheme 分开：奖学金路线的‘must major in Music’是奖学金录取条件，不是普通 BA 的入学后专业门槛。",
    "当前官网课程页显示 Music major 由 2000–4000 level 音乐课程组成；未发现普通 BA Music major 另有成绩、作品或审批门槛。",
    "非本地学费 HKD224,000/年；本地学费 HKD47,000/年写入 notes，均为 2026/27 cohort。",
  ),
};

const application = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-06-28",
  timeline_structured: TIMELINE,
  deadline_notes: "主 deadline 采用内地本科生入学计划的非本地申请主轮截止日 2026-06-28；国际/Non-JUPAS 首轮 2025-11-26、滚动申请及最终关闭日另列于 timeline_structured。官网当前仍显示 2026/27 周期，2027/28 日期未公布。",
  application_fee: 600,
  application_fee_currency: "HKD",
  required_materials: [
    "线上本科申请表",
    "个人身份证明文件",
    "教育及资格证明；申请阶段上传电子文件即可",
    "个人陈述",
    "预测成绩及/或实际成绩，并在成绩公布后更新申请系统",
    "内地本科生入学计划：高考成绩公布后上传高考成绩",
    "推荐信 / 简历 / CV（官网 FAQ 标为 optional）",
  ],
  transcript_requirements: "申请人须在系统输入并上传预测及/或实际学业成绩；教育及资格文件用于核实，申请阶段不要求邮寄纸质认证副本。",
  recommendation_letters: null,
  resume_required: "Optional",
  essay_required: "Required",
  portfolio_required: "Unknown",
  english_language_tests: ["IELTS Academic", "TOEFL iBT", "IB English", "GCE/IGCSE English", "SAT Reading and Writing", "PTE Academic"],
  toefl_minimum: 93,
  ielts_minimum: 6.5,
  duolingo_minimum: null,
  english_waiver_policy: "官网列出 IB、GCE、SAT、PTE 及其他国家/地区英语资历替代路径；具体按申请人资历页面核定。",
  english_requirement_status: "Conditional",
  international_applicant_notes: "所有非本地申请人须走 Non-JUPAS / International 或 Mainland Admissions Scheme，不走 JUPAS；同一招生周期通过不同招生计划重复申请不被接受。",
  conditional_notes: lines(
    "内地高考主路径：官网称全部本科专业面向内地招生，无文理科及新高考选科要求；录取综合考虑高考总成绩、英语成绩、获邀时的面试表现及综合学术/非学术素质，未公布 Music major 的固定高考分数线。",
    "国际资历主路径：IELTS Academic 6.5（同一次考试）、TOEFL iBT 93（同一次考试）；成绩须在入学当年 9 月 1 日前两年内取得，官网不接受 IELTS Indicator/Online、TOEFL ITP/ITP Plus/Home Edition。",
    "Music Scholarship Scheme 是普通 BA 之外的可选奖学金路径：申请人先递交 BA 申请，再另交奖学金申请；入选者可能参加面试和 audition，并提交 essay/video。该路径不改变普通 BA 的 audition_required。",
    "当前官网没有针对 BA Music major 的额外术科、作品集或音乐等级门槛；不把奖学金视频/试演外推为普通 BA 申请材料。",
  ),
  conditional_notes_structured: {
    mainland_route: {
      qualification: "2026 Mainland Undergraduate Admission Scheme",
      deadline: "2026-06-28",
      programs: "All undergraduate programmes",
      subject_restrictions: "No arts/science stream restriction; no subject selection restriction for new Gaokao provinces",
      assessment: ["Gaokao total score", "English score", "Interview if invited", "Overall academic and non-academic profile"],
      fixed_music_cutoff: null,
    },
    international_route: {
      first_round_deadline: "2025-11-26",
      final_close: "2026-08-21",
      rolling_after_first_round: true,
      ielts_academic: 6.5,
      toefl_ibt: 93,
      test_validity: "Within two years before 1 September 2026",
      restrictions: ["IELTS Indicator/home edition not accepted", "IELTS Online not accepted", "TOEFL ITP/ITP Plus not accepted", "TOEFL Home Edition not accepted"],
    },
    music_scholarship: {
      status: "Optional separate route",
      application_deadline: "2026-05-29",
      materials: ["Essay", "Video", "Personal, academic and employment details"],
      selection: "Shortlisted applicants may be invited to interview and audition; some may be asked to sit an aptitude test",
      ordinary_ba_effect: "Does not establish an ordinary BA Music audition requirement",
    },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "申请费 HKD600 为官网本科 FAQ 与内地招生页当前原文；非本地学费及本地学费均为 2026/27 cohort。",
};

const audition = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "No",
  audition_format: "Unknown",
  repertoire_summary: null,
  repertoire_structured: null,
  video_requirements: null,
  file_format_requirements: null,
  accompaniment_requirements: null,
  interview_or_callback_requirements: "普通 BA Music 录取路径当前官网未列独立 audition/interview 要求；Music Scholarship Scheme 入选申请人另可能参加 interview and audition。",
  special_notes: "严格区分普通 BA 路径与 Music Scholarship Scheme：当前 BA 普通路径的招生由 Faculty of Arts 管理；官网明确列出的面试/试演属于奖学金筛选。",
  conditional_notes: "普通 BA 路径填 No；奖学金路径为可选且另行申请，不是普通 BA 入学门槛。",
  conditional_notes_structured: {
    ordinary_ba: {
      audition_required: "No",
      evidence: "当前音乐系招生页将普通 BA admission 与 Music Scholarship Scheme 分列；普通 BA 部分未列 audition，奖学金部分明确列 interview/audition。",
    },
    music_scholarship: {
      audition_required: "Conditional",
      format: "Interview and audition for selected applicants; some may be asked to sit an aptitude test",
      content: "Applicants may discuss music interests, perform, present compositions or show other music-based projects",
    },
  },
  review_status: "Needs Review",
  notes: "按运营者裁决，audition_required 只回答普通 BA 录取路径；奖学金试演不写入普通录取门槛。R3 风险：普通路径的 No 主要依据招生结构与官方路径分列，复核时请逐字段确认是否接受此否定表述。",
};

const source = (source_url, source_title, source_type, source_quote, related_field = null, confidence_level = "High", program_offering_ref = OFFERING) => ({
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
  source(URL_INDEX, "Undergraduate Courses", "Official Program Page", "Bachelor of Arts (Major in Music); code 6054; 4-year; Single Degree Programme.", "music"),
  source(URL_MUSIC_PROSPECTIVE, "Prospective Students", "Official Program Page", "Admission into the Music Department is administered by the Faculty of Arts.", "music"),
  source(URL_MUSIC_CURRICULUM, "Undergraduate Curriculum", "Official Program Page", "A major in Music shall consist of 54 credit units of Level 2000, 3000, and 4000 courses from the music syllabus taken in the third to eighth semesters.", "music"),
  source(URL_MUSIC_PROSPECTIVE, "Music Scholarship Scheme", "Audition Requirements Page", "Selected applicants will be invited for an interview and audition; some may be asked to sit for an aptitude test.", "music"),
  source(URL_APPLY, "International / Non-JUPAS Admissions Scheme", "Application Requirements Page", "Applications after the first-round deadline are considered on a rolling basis subject to programme availability.", "music"),
  source(URL_FAQ, "FAQ Bachelor Degree", "Application Requirements Page", "The application fee is HK$600; Reference / Resume / Curriculum Vitae are optional; only one application may be submitted in a single admissions cycle.", "music"),
  source(URL_ENGLISH, "English Language Requirement", "English Language Requirements Page", "IELTS Academic 6.5; TOEFL iBT 93; both achieved in the same attempt; tests within two years before September 1, 2026.", "music"),
  source(URL_MAINLAND, "内地本科生入学计划", "International Students Page", "全部本科专业均面向内地招生；2026年度申请截止日期为2026年6月28日；申请费港币六百元。", "music"),
  source(URL_FEE, "Tuition and Living Expenses", "Deadline/Fee Page", "HKD47,000 local annual tuition and HKD224,000 non-local annual tuition for the 2026-27 cohort; Arts is a non-STEM Faculty.", "music"),
  source(URL_INTERVIEW, "Interview Schedules", "Audition Requirements Page", "For BA, the listed Music Scholarship Scheme schedule is Dec 2025 - May 2026; the page does not list an ordinary BA Music audition schedule.", "music", "Medium"),
  source(URL_SCHOLARSHIP, "Music Scholarship Scheme", "Audition Requirements Page", "Applicants must complete a separate scholarship application and submit personal, academic and employment details, including an essay and a video; application deadline May 29, 2026.", "music"),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "The University of Hong Kong",
    school_name_zh: "香港大学",
    city: "Hong Kong",
    country: "China",
    region: "Hong Kong SAR",
    state_province: null,
    country_code: "HK",
    languages_of_instruction: ["English"],
    school_type: "University Music School",
    official_website: "https://www.hku.hk/",
    logo: null,
    card_image: null,
    intro_zh: "香港大学文学院人文学院音乐系的四年制文学士音乐主修。",
    ranking_source: null,
    ranking_position: null,
    notes: "本批只收 Bachelor of Arts (Major in Music)。Humanities and Digital Technologies 的 Music focus/second major、Global Creative Industries 的 Music & Performing Arts concentration、minor 与研究生项目均排除。",
  }],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref, field_name, field_name_zh, field_category,
    parent_field: null, field_group: "University Music", aliases: null, description: "综合大学的标准 BA in Music / Music major。", display_order: null,
    _note: "2026-08-13 运营者裁决：综合大学 BA in Music 统一使用 music/Musicology。",
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation, degree_category: "Undergraduate", display_order: null, description: null,
    _note: "HKU Bachelor of Arts (Major in Music) is a four-year undergraduate degree.",
  })),
  program_offerings: [program],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records,
  publishing: { programs: [{
    program_offering_ref: OFFERING,
    slug: "music-ba",
    answer_sentence_zh: "香港大学文学士音乐主修：综合大学音乐系本科，普通 BA 路径不以 Music Scholarship audition 作为入学门槛。",
    field_tiers: { primary: "music" },
    cost_estimate_rmb: null,
    badges: [{ label: "综合大学 BA in Music", type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  }] },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: ["2027/28 application dates not published"],
    needs_human_review: true,
    review_notes: [
      "Mode A 裁决：新增 music field_ref，field_category=Musicology；professional_music 不适用于综合大学 BA in Music。",
      "普通 BA 与 Music Scholarship Scheme 严格分开；audition_required 只回答普通 BA 路径。",
      "ordinary BA 的 audition_required=No 依据官方招生路径分列与 BA 页面未列 audition；按 R3，需人工确认该证据是否足以支持否定态，而不是 Unknown。",
      "主 deadline 采用内地本科生入学计划 2026-06-28；国际/Non-JUPAS 首轮及滚动窗口另列 timeline_structured。",
      "当前官网页面仍为 2026/27 周期；未将 2027/28 未公布日期外推入库。",
      "学费主字段为非本地 HKD224,000/年；本地 HKD47,000/年只写 notes；cost_estimate_rmb 保持 null。",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
