/** HKMU undergraduate music package generator, Mode B 2026-08-13. */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-hkmu-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "hkmu";
const OFFERING = "hkmu_new_music_interactive_entertainment";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";
const URL_SCHOOL = "https://www.hkmu.edu.hk/";
const URL_PROGRAM = "https://admissions.hkmu.edu.hk/ug/as/new-music-and-interactive-entertainment/";
const URL_PROGRAM_ZH = "https://www.hkmu.edu.hk/as/tc/programmes-courses/ftug/bahnmiej/";
const URL_ENTRY = "https://admissions.hkmu.edu.hk/ug/entry_requirements/";
const URL_APPLICATION = "https://admissions.hkmu.edu.hk/ug/online-application/";
const URL_DIRECT = "https://admissions.hkmu.edu.hk/ug/overseas/";
const URL_MAINLAND = "https://admissions.hkmu.edu.hk/ug/mainland-ncee/";
const URL_JUPAS = "https://admissions.hkmu.edu.hk/ug/jupas/";
const URL_INTERVIEW = "https://admissions.hkmu.edu.hk/ug/jupas-interview/";
const URL_SUBSIDY = "https://admissions.hkmu.edu.hk/ug/student-finance/government-subsidies/";
const URL_OLD_FEE = "https://www.hkmu.edu.hk/REG/reg_ftae/Admission/Tuition_fee_non_local.pdf";
const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "Direct / non-local application opens", date: "2025-10-20" },
    { label: "Direct / non-local first-round deadline", date: "2026-03-31" },
    { label: "Direct / non-local second-round deadline", date: "2026-05-31", qualifier: "For all overseas applicants" },
    { label: "JUPAS application deadline", date: "2025-12-03", conditional: "Local HKDSE applicants" },
    { label: "JUPAS programme-choice update deadline", date: "2026-05-27", conditional: "Local HKDSE applicants" },
    { label: "Mainland NCEE / Gaokao application deadline", date_text: "Not published on the current 2026/27 page; latest brochure to be released", conditional: "Mainland route" },
    { label: "Direct-admission interviews", date_text: "Shortlisted applicants; details notified by email/SMS", conditional: "Direct application" },
    { label: "2026/27 term starts", date: "2026-09-01" },
  ],
  date_year_note: "官网当前资料对应 2026/27 entry；截至 2026-08-13，非本地申请日期已公布，但 Mainland NCEE 当前页面仍称 2026 最新招生简章将稍后发布。",
};

const fields = [["professional_music", "Professional Music", "专业音乐（创意产业融合）", "Interdisciplinary"]];
const degreeLevels = [["ba", "Bachelor of Arts", "文学士", "BA"]];

const program = {
  program_offering_ref: OFFERING,
  school_ref: SCHOOL,
  field_ref: "professional_music",
  degree_level_ref: "ba",
  track_or_concentration: "New Music / Interactive Entertainment",
  official_program_name: "Bachelor of Arts with Honours in New Music and Interactive Entertainment",
  program_name_zh: "新音乐及互动娱乐荣誉文学士",
  department: "School of Arts and Social Sciences, Department of Creative Arts",
  duration_years: 4,
  language_of_instruction: ["English"],
  program_url: URL_PROGRAM,
  application_url: URL_DIRECT,
  audition_url: URL_INTERVIEW,
  international_url: URL_DIRECT,
  card_summary_zh: "香港都会大学四年制新音乐及互动娱乐荣誉文学士，融合新音乐、智能声音、数字艺术、游戏引擎与互动娱乐设计。",
  degree_system: "Bachelor of Arts with Honours",
  tuition_currency: "HKD",
  tuition_amount_min: null,
  tuition_amount_max: null,
  tuition_period: "per_year",
  funding_policy: "SSSDP first-year-first-degree programme; local subsidy is restricted to eligible local students. Current official 2026/27 non-local tuition amount is not exposed on the programme page, so the main tuition amount remains null.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "官网当前项目结构是单一 BA(Hons) in New Music and Interactive Entertainment offering；Year 1 entry is 4 years/120 credit-units, senior-year route is 2–3 years and is excluded from this undergraduate mainstream package per scope.",
    "该项目的官方学位谱系明确同时指向 New Music 与 Interactive Entertainment，符合运营者新定义的 professional_music / Interdisciplinary：音乐+创意产业/媒介融合型学位，而非标准音乐系 BA in Music。",
    "2026/27 SSSDP 页面列出本地 FYFD 项目的最高资助额 HKD81,450；这是 subsidy，不是 tuition，未填入主学费字段。当前官网未给出可核验的 2026/27 非本地生年度学费，旧版 2025/26 数字不入库。",
  ),
};

const application = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-03-31",
  timeline_structured: TIMELINE,
  deadline_notes: "按港澳先例，主 deadline 采用非本地 Direct Admission 的第一轮截止日 2026-03-31；第二轮 2026-05-31、JUPAS 时点及 Mainland NCEE 当前未公布的状态另列 timeline_structured。",
  application_fee: 515,
  application_fee_currency: "HKD",
  required_materials: [
    "HKMU online application",
    "Passport / identity document; Mainland applicants also provide PRC identity card and travel document",
    "Academic transcripts and graduation / examination certificates",
    "English language proof where applicable",
    "Additional supplementary documents if required",
  ],
  transcript_requirements: "Applicants upload academic transcripts, graduation certificates or certifying letters and examination results; original documents may be requested for verification.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Unknown",
  portfolio_required: "Unknown",
  english_language_tests: ["IELTS Academic", "TOEFL iBT", "HKDSE English", "NCEE/Gaokao English", "IB English", "GCE English", "SAT Evidence-Based Reading and Writing"],
  toefl_minimum: 79,
  ielts_minimum: 6.0,
  duolingo_minimum: null,
  english_waiver_policy: "HKMU accepts route- and qualification-specific English alternatives; the current general page lists HKDSE English Level 3, IELTS Academic 6.0, TOEFL iBT 79, NCEE/Gaokao English 100/150, and other alternatives.",
  english_requirement_status: "Conditional",
  international_applicant_notes: lines(
    "Non-local applicants use Direct Admission; Mainland NCEE/Gaokao applicants use the separate Mainland route. Current Mainland page states that the latest 2026 brochure is forthcoming, so no unverified Mainland deadline or programme fee is invented.",
    "Direct application normally includes an admission interview after shortlisting; a written test may be required for some programmes, but the current official pages do not identify a New Music-specific audition or written test.",
  ),
  conditional_notes: lines(
    "主字段记录内地申请人可用的 NCEE/Gaokao 英语门槛：英语 100/150 或达到非 150 满分的三分之二；一般学历门槛由 HKMU 当前 General Entrance Requirements 按资历路径核定。",
    "国际/非本地路径：IELTS Academic 6.0、TOEFL iBT 79 等英语替代路径；考试须在官方考点参加并满足有效期规则。",
    "HKMU 当前项目页明确列出 JUPAS、Non-JUPAS、Mainland NCEE、Direct Non-local 四条申请入口；课程目标与课程结构明确覆盖新音乐、智能声音/音乐、互动音乐设计、生成音乐、声音艺术、游戏引擎和互动媒体。",
    "当前官网没有项目专属 audition、乐器方向或曲目清单；一般 Direct Admission interview 不能被外推成 audition_required=Yes。",
  ),
  conditional_notes_structured: {
    mainland_ncee: {
      qualification: "2026 NCEE / Gaokao",
      english: "100/150 or two-thirds of the full score where full score is not 150",
      current_deadline: null,
      deadline_note: "Current Mainland page says the latest admission brochure is forthcoming.",
    },
    international: {
      ielts_academic: 6.0,
      toefl_ibt: 79,
      application_fee_hkd: 515,
      first_round_deadline: "2026-03-31",
      second_round_deadline: "2026-05-31",
    },
    programme_structure: {
      year_1_entry: "4 years / 120 credit-units",
      music_or_visual_major_electives: "15 credit-units",
      core: "69 credit-units",
      streams: null,
    },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "HKD515 non-local application fee is from the current 2026/27 online application page. Tuition is intentionally null because the current official 2026/27 page does not publish a non-local fee; 2025/26 fee figures were not carried forward.",
};

const audition = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "Unknown",
  audition_format: "Unknown",
  repertoire_summary: null,
  repertoire_structured: null,
  video_requirements: null,
  file_format_requirements: null,
  accompaniment_requirements: null,
  interview_or_callback_requirements: "Direct Admission normally requires an admission interview after shortlisting; a written test may apply to some programmes. The official current pages do not identify a New Music-specific audition or interview format.",
  special_notes: "Do not convert the general direct-admission interview into an audition. The project is music-related by official degree genealogy and curriculum, but no audition or repertoire requirement is published for this offering.",
  conditional_notes: "R3: audition_required remains Unknown because current official pages describe general interviews and do not state a New Music audition requirement or explicit exemption.",
  conditional_notes_structured: {
    direct_interview: "Normally required after shortlisting",
    audition: null,
    repertoire: null,
  },
  review_status: "Needs Review",
  notes: "One audition record for the single official degree offering; no instrument-specific record is created.",
};

const source = (source_url, source_title, source_type, source_quote, related_field = "professional_music", confidence_level = "High") => ({
  school_ref: SCHOOL,
  program_offering_ref: OFFERING,
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
  source(URL_PROGRAM, "BA(Hons) New Music and Interactive Entertainment admissions page", "Official Program Page", "The programme aims to provide in-depth education and professional training in New Music and Interactive Entertainment, integrating generative visual/motion arts and intelligent sound/music."),
  source(URL_PROGRAM_ZH, "BA(Hons) New Music and Interactive Entertainment programme page", "Official Program Page", "The programme is a 4-year, 120-credit-unit full-time BA(Hons), with 2–3 year senior-year curriculum; it covers digital music, interactive music design, generative music, sound art, immersive spatial sound, game engines and machine learning."),
  source(URL_ENTRY, "General Entrance and English Requirements", "Application Requirements Page", "Bachelor applicants must meet general entrance requirements, English requirements and programme-specific requirements; Mainland NCEE English is 100/150 or two-thirds of the full score; IELTS Academic is 6.0 and TOEFL iBT is 79."),
  source(URL_APPLICATION, "Online Application", "Application Requirements Page", "Non-local applicants apply directly; the current page lists HKD515 application fee, supporting documents, and normal direct-admission interview after shortlisting."),
  source(URL_DIRECT, "Direct Admission (Non-local)", "Deadline/Fee Page", "2026/27 non-local application opens 20 October 2025; first-round deadline 31 March 2026; second-round deadline 31 May 2026; term starts 1 September 2026."),
  source(URL_MAINLAND, "Mainland NCEE / Gaokao Admissions", "International Students Page", "HKMU recruits Mainland NCEE candidates independently; the current page says the latest 2026 admission brochure is forthcoming, so no unpublished deadline or fee is inferred."),
  source(URL_JUPAS, "JUPAS Admission", "Application Requirements Page", "2026/27 JUPAS minimum requirements are Chinese 3, English 3, Mathematics 2, Citizenship and Social Development Attained, and two elective subjects at Level 2; JSSU18 is a JUPAS programme under the university's self-financing/SSSDP routes."),
  source(URL_INTERVIEW, "JUPAS Interview", "Audition Requirements Page", "The current compulsory-interview table does not identify JSSU18 as a programme-specific compulsory interview; this is not used to assert a universal audition No, so the audition field remains Unknown."),
  source(URL_SUBSIDY, "Government Subsidies SSSDP/NMTSS", "Deadline/Fee Page", "2026/27 New Music and Interactive Entertainment JSSU18 / BAHNMIEJ1 is a 4-year SSSDP first-year-first-degree programme with maximum local subsidy HKD81,450; only local students are eligible for subsidy."),
  source(URL_OLD_FEE, "2025/26 non-local tuition schedule", "Deadline/Fee Page", "The older official schedule shows 2025/26 non-local fee figures, but it is not used as a 2026/27 current amount.", "professional_music", "Medium"),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "Hong Kong Metropolitan University",
    school_name_zh: "香港都会大学",
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
    intro_zh: "香港都会大学新音乐及互动娱乐荣誉文学士：以新音乐、智能声音、数字艺术和互动娱乐设计为核心的融合型音乐本科。",
    ranking_source: null,
    ranking_position: null,
    notes: "本包只收 BA(Hons) in New Music and Interactive Entertainment 的 Year 1 mainstream undergraduate offering；Senior Year entry、其他创意艺术项目及研究生项目排除。",
  }],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref, field_name, field_name_zh, field_category, parent_field: null,
    field_group: "University Music", aliases: null, description: null, display_order: null,
    _note: "沿用 2026-08-13 运营者先例：官方谱系明确为音乐+创意产业/媒介融合型学位，使用 professional_music/Interdisciplinary。",
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation,
    degree_category: "Undergraduate", display_order: null, description: null,
    _note: "HKMU BAHNMIEJ Year 1 is a four-year Bachelor of Arts with Honours.",
  })),
  program_offerings: [program],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records,
  publishing: { programs: [{
    program_offering_ref: OFFERING,
    slug: "new-music-interactive-entertainment",
    answer_sentence_zh: "香港都会大学新音乐及互动娱乐荣誉文学士：四年制英语授课融合型音乐本科，结合新音乐、智能声音、互动音乐设计、声音艺术与游戏引擎；官网未公布项目专属 audition。",
    field_tiers: { primary: "professional_music" },
    cost_estimate_rmb: null,
    badges: [{ label: "New Music + Interactive Entertainment", type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  }] },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: ["2026/27 non-local tuition amount not published on the current official page", "2026 Mainland NCEE deadline not published on the current official page", "Programme-specific audition/repertoire not published"],
    needs_human_review: true,
    review_notes: [
      "存在性先判通过：官方学位名称本身含 New Music and Interactive Entertainment，且课程结构明确包含音乐与互动媒体/技术核心；符合新增收录门槛，不是仅因课程含音乐内容收录。",
      "归类使用 professional_music/Interdisciplinary：理由是官方学位谱系明确把 New Music 与 Interactive Entertainment 结合，且官方课程目标覆盖声音/音乐、视觉/动作、游戏引擎、互动娱乐和创意文化产业；不是名称表面匹配。",
      "按港澳先例保留一条 offering；Year 1 与 Senior Year 是同一官方学位的入学路径，Senior Year 依范围排除，不新建第二条 offering。",
      "audition_required=Unknown：当前官方页面只明确一般 Direct Admission interview；未找到项目专属 audition、曲目或豁免规则，未将 interview 外推为 audition No/Yes。",
      "主 deadline 采用非本地 Direct Admission 第一轮 2026-03-31；第二轮 2026-05-31 与 Mainland 当前未公布状态进入 timeline_structured。",
      "非本地学费主字段留 null：当前官方 2026/27 页面未给出可核验金额；旧版 2025/26 HKD143,330 不跨年度入库。SSSDP HKD81,450 是本地 subsidy，不是学费。",
      "HKD515 非本地申请费来自当前 2026/27 online application page；cost_estimate_rmb 保持 null，排名字段 null。",
      "Bottom-draft update hint: add current JSSU18/BAHNMIEJ codes, English instruction, 4-year/120-cru structure, music+interactive-entertainment official genealogy, current direct dates/application fee, and mark 2026/27 non-local tuition as pending official publication rather than retaining old 2025/26 figure.",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
