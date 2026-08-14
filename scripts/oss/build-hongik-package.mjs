/**
 * Hongik University Applied Music undergraduate canonical package generator.
 * Mode B, verified 2026-08-14 against the 2027 March foreign-admissions guide.
 * Draft only; publishing is an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-hongik-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "hongik";
const OFFERING = "hongik_applied_music_bm";
const CHECKED = "2026-08-14";
const CYCLE = "2027/28";
const URL_MAIN = "https://www.hongik.ac.kr/kr/admission";
const URL_PROGRAM = "https://music.hongik.ac.kr/music/index.do";
const URL_GUIDE = "https://www.hongik.ac.kr/kr/admission/recruitment-is.do?articleNo=153270&attachNo=89406&mode=download";
const URL_RULES = "https://www.hongik.ac.kr/kr/newscenter/notice.do?articleNo=6153&attachNo=17243&mode=download";

const lines = (...xs) => xs.filter(Boolean).join("\n");

const timeline = {
  milestones: [
    { label: "2027年3月外国人特别招生网上申请", date_text: "2026-07-16 10:00–2026-07-23 16:00 KST" },
    { label: "材料提交截止", date_text: "2026-07-24 16:00 KST" },
    { label: "录取结果公布", date: "2026-12-18" },
    { label: "在线文书注册", date_text: "2026-12-21–2026-12-23" },
    { label: "合格者追加材料提交", date_text: "2027-01-13–2027-01-26" },
    { label: "学费缴纳", date_text: "2027-02-10–2027-02-12" },
    { label: "开学", date: "2027-03-02" },
  ],
  date_year_note: "官网当前可核实的完整外国人本科周期为2027年3月入学；截至2026-08-14未见下一周期招生日期。该周期申请截止日已过，因此 is_current=false。",
};

const fields = [{
  field_ref: "applied_music",
  field_name: "Applied Music",
  field_name_zh: "实用音乐",
  field_category: "Interdisciplinary",
  parent_field: null,
  field_group: "Professional Music",
  aliases: null,
  description: null,
  display_order: null,
  _note: "2026-08-14 运营者裁决：韩国实用音乐项目按官网证据分流；Hongik 当前归 applied_music，暂归 Interdisciplinary。",
}];

const degreeLevels = [{
  degree_level_ref: "bm",
  degree_level_name: "Bachelor of Music",
  degree_level_name_zh: "音乐学士",
  abbreviation: "BM",
  degree_category: "Undergraduate",
  display_order: null,
  description: null,
  _note: "Hongik University official school rules list 공연예술학부 실용음악전공 as 음악학사 (Bachelor of Music).",
}];

const offering = {
  program_offering_ref: OFFERING,
  school_ref: SCHOOL,
  field_ref: "applied_music",
  degree_level_ref: "bm",
  track_or_concentration: "Vocal; Composition",
  official_program_name: "Bachelor of Music — Applied Music (Vocal/Composition)",
  program_name_zh: "音乐学士——实用音乐（声乐/作曲）",
  department: "School of Performing Arts, Applied Music Major",
  duration_years: null,
  language_of_instruction: ["Korean"],
  program_url: URL_PROGRAM,
  application_url: URL_GUIDE,
  audition_url: URL_GUIDE,
  international_url: URL_MAIN,
  card_summary_zh: "弘益大学表演艺术学部实用音乐本科，外国人特别招生按声乐/作曲方向提交录制实技视频。",
  degree_system: "Bachelor of Music",
  tuition_currency: "KRW",
  tuition_amount_min: 7174200,
  tuition_amount_max: 7174200,
  tuition_period: "per_semester",
  funding_policy: "Tuition shown from the 2027 March foreign-admissions guide; scholarships are recorded only when relevant to admission-path interpretation.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "本条只收本科实用音乐，排除同一表演艺术学部的音乐剧（表演）专业。",
    "官方外国人招生简章将 실용음악전공(보컬/작곡)作为一个招生单位；Vocal/Composition 保留在 track 与 audition repertoire_structured，不拆成两条 offering。",
    "Hongik 当前没有足够正面证据证明该项目属于 professional_music 的融合谱系，因此使用运营者批准的新 field_ref applied_music / Interdisciplinary。",
    "2027 March 外国人简章公布表演艺术学部学费 KRW 7,174,200 per semester；cost_estimate_rmb 保持 null。",
  ),
};

const application = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: false,
  application_deadline: "2026-07-23",
  timeline_structured: timeline,
  deadline_notes: "主 deadline 取外国人本科3月入学网上申请截止日 2026-07-23；材料截止、录取、注册、学费与开学时点保留在 timeline_structured。当前周期截止日已过，下一周期日期未发布。",
  application_fee: 150000,
  application_fee_currency: "KRW",
  required_materials: [
    "Online application form",
    "Education history and nationality form",
    "Foreign school academic-record inquiry consent",
    "High-school graduation or expected-graduation certificate",
    "Complete high-school transcript",
    "Applicant and both parents' passport or ID copies",
    "Family-relationship document",
    "TOPIK level 1+ or Hongik Language Education Institute level 1+ certificate",
    "Applied Music practical video: two unedited videos, direction-specific requirements below",
  ],
  transcript_requirements: "Submit the complete high-school transcript; documents not in Korean or English require a notarized Korean or English translation, and the guide requires Apostille or consular confirmation where applicable.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Unknown",
  portfolio_required: "Unknown",
  english_language_tests: null,
  toefl_minimum: null,
  ielts_minimum: null,
  duolingo_minimum: null,
  english_waiver_policy: null,
  english_requirement_status: "Unknown",
  international_applicant_notes: "This is the foreign special-admission route for March 2027 entry; the guide requires applicant and both parents to hold foreign nationality under its eligibility rules.",
  conditional_notes: "Entry language is Korean: TOPIK 1+ or Hongik Korean Language Education Institute level 1+ is required. After admission, TOPIK/institute levels A–C determine Korean-course and first-semester enrollment conditions. Graduation requires TOPIK 4+. The guide does not state an English-test requirement; English is therefore not converted to an explicit No.",
  conditional_notes_structured: {
    entry_language: ["TOPIK 1–6 or Hongik Korean Language Education Institute level 1+"],
    post_admission_language: {
      A: "TOPIK 4–6: one designated Korean course required; two advanced courses recommended.",
      B: "TOPIK 3: five designated Korean courses required in the first semester; no other courses may be taken that semester.",
      C: "TOPIK 1–2: first semester leave plus at least two semesters/six months of Korean-language study; return requires meeting A or B.",
    },
    graduation_language: "TOPIK 4+ before graduation",
    english_status: "The current foreign guide does not specify an English test or minimum; stored as Unknown under R3.",
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "Application fee field stores KRW 150,000; the separate KRW 8,000 online application-platform fee is retained in source notes rather than merged into the university application fee.",
};

const audition = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: false,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "Yes",
  audition_format: "Recorded Only",
  repertoire_summary: "Two unedited practical videos, each no longer than three minutes; requirements split between Vocal and Composition directions.",
  repertoire_structured: {
    Vocal: ["Two unedited practical videos", "Each video no longer than 3 minutes", "Korean or English vocal only", "Original song permitted"],
    Composition: ["Two unedited practical videos", "Each video no longer than 3 minutes", "Applicant must perform their own composition", "Performance on piano or acoustic guitar", "Original composition permitted"],
  },
  video_requirements: "Face front and full body must be visible; submit MP4 files, each no larger than 1 GB; submit two USB drives containing identical files.",
  file_format_requirements: "MP4; each file <=1 GB; filename format is application number plus passport English name.",
  accompaniment_requirements: "The guide permits accompaniment arrangements for the Vocal direction; Composition direction requires the applicant to perform the original piece on piano or acoustic guitar.",
  interview_or_callback_requirements: null,
  special_notes: "The official evaluation is 60% document review + 40% practical video for the School of Performing Arts. This is a recorded admission practical requirement, not a live audition or a separate scholarship audition.",
  conditional_notes: null,
  conditional_notes_structured: null,
  review_status: "Needs Review",
  notes: "R1 applied: only Vocal and Composition keys are created because those are the directions named in the current foreign-admissions guide; no other direction is inferred.",
};

const source = (url, title, source_type, quote, offeringRef = null, relatedField = null) => ({
  school_ref: SCHOOL,
  program_offering_ref: offeringRef,
  admission_cycle: offeringRef ? CYCLE : null,
  source_url: url,
  source_title: title,
  source_type,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote: quote,
  related_field: relatedField,
  confidence_level: "High",
  review_status: "Extracted",
});

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "Hongik University",
    school_name_zh: "弘益大学",
    city: "Seoul",
    country: "South Korea",
    region: null,
    state_province: "Seoul",
    country_code: "KR",
    languages_of_instruction: ["Korean"],
    school_type: "University Music School",
    official_website: "https://www.hongik.ac.kr/",
    logo: null,
    card_image: null,
    intro_zh: "弘益大学表演艺术学部实用音乐本科的外国人特别招生通道。",
    ranking_source: null,
    ranking_position: null,
    notes: lines(
      "本包只收表演艺术学部实用音乐本科；音乐剧、研究生及其他学院排除。",
      "官网学校规章确认实用音乐专业授予音乐学士（Bachelor of Music）。",
      "底稿更新提示：底稿截至2026-08-11仍将外国人招生日期、TOPIK、实技和学费列为待核；本包以2026-08-14官网2027 March外国人简章为准。",
      "排名字段不填；cost_estimate_rmb 不做汇率换算。",
    ),
  }],
  fields,
  degree_levels: degreeLevels,
  program_offerings: [offering],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records: [
    source(URL_GUIDE, "2027 March Foreign Special Admission Guide", "International Students Page", "The guide is the foreign special-admission route and lists Seoul Performing Arts College: Musical major (acting) and Applied Music major (Vocal/Composition).", null, "applied_music"),
    source(URL_GUIDE, "2027 March Foreign Special Admission Guide — application timeline and fee", "Deadline/Fee Page", "Application is 2026-07-16 10:00 through 2026-07-23 16:00; university application fee is KRW 150,000 and platform fee is KRW 8,000 separately.", OFFERING, "applied_music"),
    source(URL_GUIDE, "2027 March Foreign Special Admission Guide — required materials", "Application Requirements Page", "The common materials include academic and nationality documents, TOPIK 1+ or Hongik language-institute level 1+, and Applied Music practical videos.", OFFERING, "applied_music"),
    source(URL_GUIDE, "2027 March Foreign Special Admission Guide — Applied Music video requirements", "Audition Requirements Page", "Vocal and Composition requirements are separately stated: two unedited videos, Vocal permits Korean/English and original song; Composition requires the applicant's own performance on piano or acoustic guitar.", OFFERING, "applied_music"),
    source(URL_GUIDE, "2027 March Foreign Special Admission Guide — evaluation, Korean and tuition", "Application Requirements Page", "Performing Arts is evaluated 60% documents + 40% practical video; Korean criteria A–C and graduation TOPIK 4+ are stated; Performing Arts tuition is KRW 7,174,200 per semester.", OFFERING, "applied_music"),
    source(URL_RULES, "Hongik University School Rules — degree awards", "Official Program Page", "The school rules list 공연예술학부 실용음악전공 as 음악학사 (Bachelor of Music).", OFFERING, "applied_music"),
    source(URL_PROGRAM, "Hongik Applied Music official department page", "Official Program Page", "The official department site identifies Applied Music under the Performing Arts unit.", OFFERING, "applied_music"),
  ],
  publishing: { programs: [{
    program_offering_ref: OFFERING,
    slug: "hongik-applied-music-bm",
    answer_sentence_zh: "弘益大学音乐学士实用音乐（声乐/作曲）：外国人特别招生可申请，需提交两段不剪辑实技视频；韩语入学路径最低提交TOPIK 1级或校内语言教育院1级证明。",
    field_tiers: { primary: "applied_music" },
    cost_estimate_rmb: null,
    badges: [{ label: "Hongik Applied Music", type: "info", priority: 1 }],
    freshness_flag: { status: "outdated_season", last_verified: CHECKED, days_since_update: 0 },
  }] },
  data_quality: {
    overall_confidence: "High",
    missing_critical_fields: [
      "The 2027 March cycle is the latest complete official foreign guide found, but its application deadline has passed and the next cycle is not published; is_current=false.",
      "The current guide does not state a programme duration; duration_years remains null.",
      "The current guide does not state an English-test requirement; English fields remain Unknown/null rather than being converted to an explicit No.",
    ],
    needs_human_review: true,
    review_notes: [
      "Operator decision 2026-08-14: add applied_music to the vocabulary, field_category=Interdisciplinary; Hongik Applied Music does not use professional_music because the current official materials lack positive evidence of a music + creative-industry/media degree genealogy.",
      "Offering grain follows the official 2027 foreign-admissions unit: one Applied Music offering with Vocal/Composition in track and direction-keyed repertoire; Musical major (acting) is excluded from the music-only scope.",
      "Degree baseline follows the official Hongik University school rules: Applied Music awards Bachelor of Music.",
      "Audition semantics: ordinary foreign admission uses recorded practical video and 60% document + 40% video evaluation; this is not a live audition and no separate scholarship route is merged.",
      "TOPIK entry language, post-admission Korean-course conditions and graduation TOPIK 4+ are stored separately in conditional_notes_structured; English is not inferred from the Korean requirement.",
      "Bottom-draft update hint: replace the draft's 'not yet checked' dates, TOPIK, practical-test and tuition placeholders with the current official 2027 March guide values; keep the bottom draft itself unmodified.",
      "Ranking fields intentionally null; cost_estimate_rmb intentionally null; no FX conversion was made.",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
