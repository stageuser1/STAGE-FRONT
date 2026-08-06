import { programOfferingRef } from "@/lib/program-v3/format";
import type { ProgramV3 } from "./types";

/**
 * Mock canonical + publishing data for T3 (Web Card / detail page), built
 * against the STAGE V3 data dictionary §5–7 §13 shapes. Real Directus
 * wiring is a separate ticket — the data pipeline lives in another repo and
 * is untouched here (per the T3 brief).
 *
 * **All dates are fixed literals, never computed from `new Date()`**
 * (ruling T3-R3.12), so a given fixture always exercises the same rendering
 * path no matter when the suite runs. The deadline *states* are the one
 * thing that still moves, because §3.4 requires them to be computed from
 * the viewer's clock; the base date those were chosen against is below, and
 * each fixture names the state it was written to produce.
 *
 * Coverage:
 * | # | 费用形态 | badges | editorial | freshness | 曲目 | 截止 |
 * |---|---|---|---|---|---|---|
 * | 1 | ① 官方 CoA | 3 | 完整 | current_season | 超长 | 未过 |
 * | 2 | ② config 估算 | 0 | 无 | outdated_season | 无 | 已过 |
 * | 3 | ③ USD | 1 | 仅定位 | changed | 短 | 临近 |
 * | 4 | 无费用数据 | 0 | 无 | unknown | 无 | 已过 |
 * | 5 | ③ GBP | 3 | 无 | current_season | 短 | 未过 |
 * | 6 | ① 降级→③(FX 缺失) | 0 | 无 | unknown | 无 | 无截止日 |
 * | 7 | ② config 估算 | 1 | 完整 | current_season | 短 | 未过 |
 * | 8 | ①→③(无生活费组件) | 0 | 无 | current_season | 超长 | 未过 |
 * | 9 | ①→③(无学费组件,整块消失) | 1 | 无 | current_season | 无 | 未过 |
 *
 * Fixture 6 additionally covers: `required_materials` empty, no `sources`,
 * and both Chinese names null. Fixture 7 covers an explicit
 * `Not Required` English requirement and the `Conditional` five-state.
 * Fixture 8 covers `slug: null` (no detail page, so the repertoire is not
 * truncated) plus the exact 「作品集…英语…」 string that defeated the old
 * keyword classifier. Fixture 9 is the one condition that *does* merge into
 * the English line — pure language wording, no other material named.
 *
 * **`cost_estimate_rmb.min`/`.max` are in 元** (ruling T3-R6, 2026-08-03).
 * An earlier version of this file stored them as if pre-divided into 万
 * (`55` instead of `550000`), matching a same wrong reading in
 * `costBlockLine`'s display logic — the two bugs agreed with each other, so
 * nothing here ever looked wrong until a real T1b package (`570000`/`600000`)
 * rendered as ¥57 亿. `components[].value`/`value_min`/`value_max` were
 * never affected — those are the tuition/living-cost amount in their own
 * original currency (USD/GBP/EUR), not RMB, and always were correct.
 */

/** The date the deadline fixtures below were chosen against. */
export const MOCK_BASE_DATE = "2026-08-03";

const JUILLIARD = {
  slug: "juilliard",
  school_name: "The Juilliard School",
  school_name_zh: "茱莉亚音乐学院",
  city: "New York",
  country: "United States",
  country_code: "US",
};

const MANHATTAN = {
  slug: "manhattan-school-of-music",
  school_name: "Manhattan School of Music",
  school_name_zh: "曼哈顿音乐学院",
  city: "New York",
  country: "United States",
  country_code: "US",
};

const RCM = {
  slug: "royal-college-of-music",
  school_name: "Royal College of Music",
  school_name_zh: "英国皇家音乐学院",
  city: "London",
  country: "United Kingdom",
  country_code: "GB",
};

/** Chinese name deliberately absent — exercises the 核心原则 6 fallback. */
const MDW_WIEN = {
  slug: "mdw-wien",
  school_name: "Universität für Musik und darstellende Kunst Wien",
  school_name_zh: null,
  city: "Vienna",
  country: "Austria",
  country_code: "AT",
};

// 1 — 费用形态①(官方 CoA), badges ×3(卡片截前 2), 编辑观点完整,
// current_season, 曲目超长(触发 80 字截断), 截止日未过,
// application 与 audition 双 conditional_notes(§3.2 合并展示)。
const juilliardVoiceBm: ProgramV3 = {
  school: JUILLIARD,
  offering: {
    school_ref: "juilliard",
    field_ref: "voice",
    degree_level_ref: "bm",
    program_name_zh: "声乐",
    official_program_name: "Voice",
    degree_level_name_zh: "音乐学士",
    degree_abbreviation: "BM",
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: "https://www.juilliard.edu/music/programs/voice",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-12-01",
    application_fee: 150,
    application_fee_currency: "USD",
    // 含「两封推荐信」,与 recommendation_letters 重复 —— 覆盖 T3-R3.11 去重
    required_materials: ["在线申请表", "官方成绩单", "两封推荐信", "个人陈述"],
    transcript_requirements: "需中学阶段官方成绩单原件或公证翻译件",
    recommendation_letters: 2,
    resume_required: "Optional",
    essay_required: "Required",
    portfolio_required: "Not Required",
    english_language_tests: ["TOEFL", "IELTS"],
    toefl_minimum: 100,
    ielts_minimum: 7,
    duolingo_minimum: null,
    english_requirement_status: "Required",
    english_waiver_policy: "以英语为母语或在英语授课学校完成三年以上学业者可申请豁免",
    international_applicant_notes: "国际学生须额外提交财力证明",
    conditional_notes: "语言成绩要求仅适用于国际申请者",
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "Yes",
    prescreening_deadline: "2026-11-01",
    audition_required: "Yes",
    audition_format: "Live or Recorded",
    repertoire_summary:
      "预筛需提交两首风格不同的咏叹调或艺术歌曲录像，总时长不超过10分钟；正式试音需准备三首曲目，其中至少一首为意大利语、一首为德语或法语艺术歌曲，另需准备一首英语艺术歌曲备选；评委可能要求视奏或现场调整曲目顺序，具体以当年官网公布的曲目单为准。",
    video_requirements: "单机位固定拍摄，全身入镜，钢琴伴奏须同时收音",
    file_format_requirements: "MP4/MOV，单个文件不超过 500MB",
    accompaniment_requirements: "可自带伴奏或使用学校提供的伴奏钢琴师（需提前预约）",
    special_notes: "入围者将收到现场试音邀请，费用自理",
    conditional_notes: "仅预筛通过者需参加现场试音，其余申请者流程至此结束",
  },
  editorial_note: {
    short_positioning: "声乐赛道竞争最激烈的项目之一",
    key_difficulty: "预筛录像淘汰率高，曲目语言覆盖要求严格",
  },
  publishing: {
    slug: "voice-bm",
    answer_sentence_zh:
      "茱莉亚音乐学院的声乐音乐学士项目，语言成绩要求 TOEFL 100 / IELTS 7，需预筛、需试音、试音形式为现场或录像试音，Fall 2026 申请季的申请截止日期为 2026年12月1日，一年总费用约 55–66 万元人民币。",
    // min/max 单位是元(T2-R2「取整到万」= 取整到万的倍数,不是「以万为单位」),
    // 与 T1b 真实产出对齐(裁决 T3-R6)。
    cost_estimate_rmb: {
      min: 550000,
      max: 660000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 53300,
          currency: "USD",
          source_type: "official",
          period: "per_year",
        },
        {
          item: "living_cost",
          value_min: 28000,
          value_max: 35000,
          currency: "USD",
          source_type: "official",
          composition_note: "含住宿、餐饮、书籍、交通及学生医保(校方公布)",
        },
      ],
      fx_rate: 7.12,
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [
      { label: "预筛可视频提交", type: "success", priority: 2 },
      { label: "免申请费", type: "info", priority: 4 },
      { label: "免现场试音", type: "success", priority: 1 },
    ],
    freshness_flag: {
      status: "current_season",
      last_verified: "2026-07-17",
      days_since_update: 16,
    },
  },
  sources: [
    {
      source_url: "https://www.juilliard.edu/music/programs/voice",
      source_title: "Juilliard — Voice",
      retrieved_date: "2026-07-17",
      source_quote:
        "Applicants must submit a prescreening video and, if advanced, perform a live or recorded audition consisting of three selections in contrasting languages.",
      related_field: "audition_requirements",
      confidence_level: "High",
    },
    {
      source_url: "https://www.juilliard.edu/admissions/english-requirements",
      source_title: "Juilliard — English Language Requirements",
      retrieved_date: "2026-07-17",
      source_quote:
        "International applicants must submit TOEFL or IELTS scores unless they qualify for a waiver.",
      related_field: "english_language_tests",
      confidence_level: "High",
    },
    {
      source_url: "https://www.juilliard.edu/admissions/costs",
      source_title: "Juilliard — Cost of Attendance",
      retrieved_date: "2026-07-10",
      source_quote:
        "The estimated cost of attendance for 2026-27 includes tuition, fees, room, board, and health insurance.",
      related_field: "estimated_living_cost",
      confidence_level: "High",
    },
  ],
  related_program_refs: ["juilliard-piano-bm", "juilliard-opera_studies-mm"],
};

// 2 — 费用形态②(city_costs 估算), badges 空(整行不渲染),
// 编辑观点空, outdated_season, 曲目为空, 截止日已过。
const juilliardPianoBm: ProgramV3 = {
  school: JUILLIARD,
  offering: {
    school_ref: "juilliard",
    field_ref: "piano",
    degree_level_ref: "bm",
    program_name_zh: "钢琴",
    official_program_name: "Piano",
    degree_level_name_zh: "音乐学士",
    degree_abbreviation: "BM",
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: "https://www.juilliard.edu/music/programs/piano",
  },
  application: {
    admission_cycle: "Fall 2025",
    application_deadline: "2025-12-01",
    application_fee: 150,
    application_fee_currency: "USD",
    required_materials: ["在线申请表", "官方成绩单"],
    transcript_requirements: null,
    recommendation_letters: null,
    resume_required: "Unknown",
    essay_required: "Required",
    portfolio_required: "Not Required",
    english_language_tests: [],
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_requirement_status: "Unknown",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: null,
  },
  audition: {
    admission_cycle: "Fall 2025",
    prescreening_required: "Varies",
    prescreening_deadline: null,
    audition_required: "Yes",
    audition_format: "Unknown",
    repertoire_summary: null,
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    slug: "piano-bm",
    answer_sentence_zh: null,
    cost_estimate_rmb: {
      min: 580000,
      max: 630000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 53300,
          currency: "USD",
          source_type: "official",
          period: "per_year",
        },
        {
          item: "living_cost",
          value_min: 28600,
          value_max: 31500,
          currency: "USD",
          source_type: "config_estimate",
          composition_note:
            "含住宿、餐饮、书籍、交通,不含学生医保(各校差异较大,以校方公布为准)",
        },
      ],
      fx_rate: 6.752,
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [],
    freshness_flag: {
      status: "outdated_season",
      last_verified: "2025-08-20",
      days_since_update: 360,
    },
  },
  sources: [
    {
      source_url: "https://www.juilliard.edu/music/programs/piano",
      source_title: "Juilliard — Piano",
      retrieved_date: "2025-08-20",
      source_quote: null,
      related_field: "audition_requirements",
      confidence_level: "Medium",
    },
  ],
  related_program_refs: ["juilliard-voice-bm"],
};

// 3 — 费用形态③(USD, 无人民币换算), badges ×1, 编辑观点仅定位无难点,
// changed(红旗), 截止日临近。基准日 2026-08-03 起 18 天,
// 2026-08-21 之后该 fixture 转为「本季已截止」。
const juilliardOperaMm: ProgramV3 = {
  school: JUILLIARD,
  offering: {
    school_ref: "juilliard",
    field_ref: "opera_studies",
    degree_level_ref: "mm",
    program_name_zh: "歌剧研究",
    official_program_name: "Opera Studies",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MM",
    duration_years: 2,
    language_of_instruction: ["English"],
    program_url: "https://www.juilliard.edu/music/programs/opera-studies",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-08-21",
    application_fee: 0,
    application_fee_currency: "USD",
    required_materials: ["在线申请表", "官方成绩单", "三封推荐信"],
    transcript_requirements: "需本科阶段官方成绩单",
    recommendation_letters: 3,
    resume_required: "Required",
    essay_required: "Required",
    portfolio_required: "Not Required",
    english_language_tests: ["TOEFL"],
    toefl_minimum: 100,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_requirement_status: "Required",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: "仅适用于非英语授课本科背景的申请者",
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "Yes",
    prescreening_deadline: "2026-08-06",
    audition_required: "Yes",
    audition_format: "Regional",
    repertoire_summary: "四首咏叹调，覆盖至少三种语言，须能背谱演唱。",
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: "学校提供伴奏钢琴师",
    special_notes: "区域试音城市包括纽约、洛杉矶、芝加哥",
    conditional_notes: null,
  },
  editorial_note: {
    short_positioning: "偏重舞台实践的歌剧项目",
    key_difficulty: null,
  },
  publishing: {
    slug: "opera_studies-mm",
    answer_sentence_zh:
      "茱莉亚音乐学院的歌剧研究音乐硕士项目，语言成绩要求 TOEFL 100，需预筛、需试音、试音形式为区域试音，Fall 2026 申请季的申请截止日期为 2026年8月21日，一年学费约 61,300 美元。",
    cost_estimate_rmb: {
      min: 61300,
      max: 61300,
      currency: "USD",
      components: [
        {
          item: "tuition",
          value: 61300,
          currency: "USD",
          source_type: "official",
          period: "per_year",
        },
      ],
      methodology_version: "v3",
    },
    badges: [{ label: "免申请费", type: "info", priority: 4 }],
    freshness_flag: {
      status: "changed",
      last_verified: "2026-06-01",
      days_since_update: 63,
    },
  },
  sources: [
    {
      source_url: "https://www.juilliard.edu/music/programs/opera-studies",
      source_title: "Juilliard — Opera Studies",
      retrieved_date: "2026-06-01",
      source_quote:
        "The Opera Studies program requires a regional audition in one of several designated cities.",
      related_field: "audition_requirements",
      confidence_level: "Medium",
    },
  ],
  related_program_refs: ["juilliard-voice-bm"],
};

// 4 — 无任何费用数据(cost_estimate_rmb: null → 该数字不渲染),
// freshness unknown(不渲染状态旗,只显示来源域名与核实日期),
// 截止日已过, 作品集为 Conditional 五态。
const manhattanCompositionMm: ProgramV3 = {
  school: MANHATTAN,
  offering: {
    school_ref: "manhattan-school-of-music",
    field_ref: "composition",
    degree_level_ref: "mm",
    program_name_zh: "作曲",
    official_program_name: "Composition",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MM",
    duration_years: 2,
    language_of_instruction: ["English"],
    program_url: "https://www.msmnyc.edu/programs/composition",
  },
  application: {
    admission_cycle: "Fall 2025",
    application_deadline: "2025-12-01",
    application_fee: null,
    application_fee_currency: null,
    required_materials: ["在线申请表", "作品集"],
    transcript_requirements: null,
    recommendation_letters: null,
    resume_required: "Unknown",
    essay_required: "Unknown",
    portfolio_required: "Conditional",
    english_language_tests: [],
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_requirement_status: "Unknown",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: "作品集要求视申请方向而定，电子音乐方向另有细则",
  },
  audition: {
    admission_cycle: "Fall 2025",
    prescreening_required: "Unknown",
    prescreening_deadline: null,
    audition_required: "No",
    audition_format: "Unknown",
    repertoire_summary: null,
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    slug: "composition-mm",
    answer_sentence_zh: null,
    cost_estimate_rmb: null,
    badges: [],
    freshness_flag: {
      status: "unknown",
      last_verified: null,
      days_since_update: null,
    },
  },
  sources: [
    {
      source_url: "https://www.msmnyc.edu/programs/composition",
      source_title: "MSM — Composition",
      retrieved_date: "2025-09-02",
      source_quote: null,
      related_field: "application_requirements",
      confidence_level: "Low",
    },
  ],
  related_program_refs: [],
};

// 5 — 费用形态③(GBP), badges ×3, 编辑观点空, current_season, 截止日未过。
const rcmPianoBm: ProgramV3 = {
  school: RCM,
  offering: {
    school_ref: "royal-college-of-music",
    field_ref: "piano",
    degree_level_ref: "bm",
    program_name_zh: "钢琴演奏",
    official_program_name: "Piano Performance",
    degree_level_name_zh: "音乐学士",
    degree_abbreviation: "BMus",
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: "https://www.rcm.ac.uk/study/undergraduate/piano/",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-10-01",
    application_fee: 75,
    application_fee_currency: "GBP",
    required_materials: ["UCAS 申请表", "官方成绩单", "一封推荐信"],
    transcript_requirements: null,
    recommendation_letters: 1,
    resume_required: "Not Required",
    essay_required: "Not Required",
    portfolio_required: "Not Required",
    english_language_tests: ["IELTS"],
    toefl_minimum: null,
    ielts_minimum: 6.5,
    duolingo_minimum: null,
    english_requirement_status: "Required",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: null,
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "Yes",
    prescreening_deadline: "2026-09-01",
    audition_required: "Yes",
    audition_format: "Live Only",
    repertoire_summary: "两首对比风格的独奏作品，总时长约15分钟。",
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    slug: "piano-bm",
    answer_sentence_zh:
      "英国皇家音乐学院的钢琴演奏音乐学士项目，语言成绩要求 IELTS 6.5，需预筛、需试音、试音形式为现场试音，Fall 2026 申请季的申请截止日期为 2026年10月1日，一年学费约 32,000 英镑。",
    cost_estimate_rmb: {
      min: 32000,
      max: 32000,
      currency: "GBP",
      components: [
        {
          item: "tuition",
          value: 32000,
          currency: "GBP",
          source_type: "official",
          period: "per_year",
        },
      ],
      methodology_version: "v3",
    },
    badges: [
      { label: "免现场试音", type: "success", priority: 1 },
      { label: "预筛可视频提交", type: "success", priority: 2 },
      { label: "免申请费", type: "info", priority: 4 },
    ],
    freshness_flag: {
      status: "current_season",
      last_verified: "2026-07-20",
      days_since_update: 13,
    },
  },
  sources: [
    {
      source_url: "https://www.rcm.ac.uk/study/undergraduate/piano/",
      source_title: "RCM — Piano Performance",
      retrieved_date: "2026-07-20",
      source_quote:
        "Candidates are required to perform two contrasting solo works, totalling approximately 15 minutes.",
      related_field: "audition_requirements",
      confidence_level: "High",
    },
  ],
  related_program_refs: [],
};

// 6 — 降级路径集中覆盖:currency 标 CNY 但 fx_rate 缺失 → 整块降级为
// 原币种(读 components[].currency 得 EUR,而非 block 的 CNY);
// application_deadline 为 null(角标与截止数字均不渲染);
// required_materials 为空 + 全部五态 Unknown(折叠区整块不渲染);
// sources 为空;中文校名与中文专业名均为 null(回退英文)。
const mdwWienVoiceMa: ProgramV3 = {
  school: MDW_WIEN,
  offering: {
    school_ref: "mdw-wien",
    field_ref: "voice",
    degree_level_ref: "mm",
    program_name_zh: null,
    official_program_name: "Gesang",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MA",
    duration_years: 2,
    language_of_instruction: ["German"],
    program_url: "https://www.mdw.ac.at/gesang/",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: null,
    application_fee: 50,
    // 币种缺失 → 申请费整行不渲染(裁决 T3-R3.2)
    application_fee_currency: null,
    required_materials: [],
    transcript_requirements: null,
    recommendation_letters: null,
    resume_required: "Unknown",
    essay_required: "Unknown",
    portfolio_required: "Unknown",
    english_language_tests: [],
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_requirement_status: "Unknown",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: null,
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "Unknown",
    prescreening_deadline: null,
    audition_required: "Unknown",
    audition_format: "Unknown",
    repertoire_summary: null,
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    slug: "voice-mm",
    answer_sentence_zh: null,
    cost_estimate_rmb: {
      // Mode F 标了 CNY,但 fx_rate 缺失 —— 前端必须降级,不得凭
      // min/max 直接渲染人民币(裁决 T3-R3.4)。min/max 单位仍是元,与其它
      // fixture 一致(裁决 T3-R6),即便本 fixture 因降级而从不显示它们。
      min: 120000,
      max: 150000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 1500,
          currency: "EUR",
          source_type: "official",
          period: "per_semester",
        },
      ],
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [],
    freshness_flag: {
      status: "unknown",
      last_verified: null,
      days_since_update: null,
    },
  },
  sources: [],
  related_program_refs: [],
};

// 7 — 英语显式 Not Required(唯一可点亮「免语言成绩」的情形),
// 费用形态②, badges ×1, 编辑观点完整, current_season, 截止日未过。
const manhattanVoiceMm: ProgramV3 = {
  school: MANHATTAN,
  offering: {
    school_ref: "manhattan-school-of-music",
    field_ref: "voice",
    degree_level_ref: "mm",
    program_name_zh: "声乐",
    official_program_name: "Voice",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MM",
    duration_years: 2,
    language_of_instruction: ["English"],
    program_url: "https://www.msmnyc.edu/programs/voice",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-12-01",
    application_fee: 125,
    application_fee_currency: "USD",
    required_materials: ["在线申请表", "官方成绩单"],
    transcript_requirements: null,
    recommendation_letters: 2,
    resume_required: "Required",
    essay_required: "Optional",
    portfolio_required: "Not Required",
    english_language_tests: [],
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    // 显式 Not Required —— §3.1 允许「无需」措辞的唯一情形
    english_requirement_status: "Not Required",
    english_waiver_policy: null,
    international_applicant_notes: null,
    conditional_notes: null,
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "No",
    prescreening_deadline: null,
    audition_required: "Yes",
    audition_format: "Recorded Only",
    repertoire_summary: "三首不同语言的艺术歌曲或咏叹调，录像提交。",
    video_requirements: "须为近六个月内录制",
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: "录像超过六个月者须重新录制并说明原因",
  },
  editorial_note: {
    short_positioning: "少数不强制语言成绩的声乐硕士",
    key_difficulty: "录像时效要求严格",
  },
  publishing: {
    slug: "voice-mm",
    answer_sentence_zh:
      "曼哈顿音乐学院的声乐音乐硕士项目，无需语言成绩，无需预筛、需试音、试音形式为录像试音，Fall 2026 申请季的申请截止日期为 2026年12月1日，一年总费用约 47–52 万元人民币。",
    cost_estimate_rmb: {
      min: 470000,
      max: 520000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 25400,
          currency: "USD",
          source_type: "official",
          period: "per_semester",
          period_basis: "per_semester×2",
        },
        {
          item: "living_cost",
          value_min: 28600,
          value_max: 31500,
          currency: "USD",
          source_type: "config_estimate",
          composition_note:
            "含住宿、餐饮、书籍、交通,不含学生医保(各校差异较大,以校方公布为准)",
        },
      ],
      fx_rate: 6.752,
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [{ label: "免语言成绩", type: "success", priority: 3 }],
    freshness_flag: {
      status: "current_season",
      last_verified: "2026-07-22",
      days_since_update: 11,
    },
  },
  sources: [
    {
      source_url: "https://www.msmnyc.edu/programs/voice",
      source_title: "MSM — Voice",
      retrieved_date: "2026-07-22",
      source_quote:
        "Applicants to the MM in Voice are not required to submit English language test scores.",
      related_field: "english_language_tests",
      confidence_level: "High",
    },
  ],
  related_program_refs: ["manhattan-school-of-music-composition-mm"],
};

// 8 — 正向识别的反例(裁决 T3-R4.3):currency=CNY、FX 完全有效,
// 但 components 里只有学费、没有任何 living_cost 组件。旧的反推逻辑
// (「无 config_estimate ⇒ 官方 CoA」)会把它判成形态①并配上
// 「含住宿、餐饮…」的构成小字 —— 而这笔钱里根本没有住宿。
// 正确行为:降级为形态③,只显示原币种学费,不发任何构成/汇率免责语。
// 同时覆盖 slug=null(裁决 T3-R4.4:无详情页出口则曲目不截断)。
const rcmCompositionMm: ProgramV3 = {
  school: RCM,
  offering: {
    school_ref: "royal-college-of-music",
    field_ref: "composition",
    degree_level_ref: "mm",
    program_name_zh: "作曲",
    official_program_name: "Composition",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MMus",
    duration_years: 2,
    language_of_instruction: ["English"],
    program_url: "https://www.rcm.ac.uk/study/postgraduate/composition/",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-10-01",
    application_fee: 75,
    application_fee_currency: "GBP",
    required_materials: ["在线申请表", "作品集"],
    transcript_requirements: null,
    recommendation_letters: 2,
    resume_required: "Required",
    essay_required: "Optional",
    portfolio_required: "Required",
    english_language_tests: ["IELTS"],
    toefl_minimum: null,
    ielts_minimum: 6.5,
    duolingo_minimum: null,
    english_requirement_status: "Required",
    english_waiver_policy: null,
    international_applicant_notes: null,
    // 归属回归测试:这正是 Codex 用来绕过旧关键词表的构造 —— 句中同时
    // 出现「英语」(语言信号)与「作品集」(其他材料)。旧逻辑会把它
    // 并进英语要求行,新逻辑必须让「作品集」一票否决,走独立的
    // 「申请条件说明」行(裁决 T3-R5.1)。
    conditional_notes: "作品集须包含至少一部英语声乐作品",
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "No",
    prescreening_deadline: null,
    audition_required: "No",
    audition_format: "Unknown",
    // 超长且无 slug → 不截断、整段展示(裁决 T3-R4.4)
    repertoire_summary:
      "作品集需提交三至五部近三年内完成的原创作品总谱，其中至少一部为室内乐编制（三件乐器以上），至少一部须附实际演出或高质量音频渲染的录音；电子音乐方向可用固定媒体作品替代其中一部，但须另附技术说明文档，说明所用软件、合成方式与空间化处理手段；所有总谱须为 PDF，录音须为 WAV 或 320kbps MP3。",
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    // field_ref/degree_level_ref 悬空时 Mode F 拒绝生成 slug(§13),
    // 此处模拟该真实路径
    slug: null,
    answer_sentence_zh: null,
    cost_estimate_rmb: {
      min: 220000,
      max: 220000,
      currency: "CNY",
      components: [
        {
          item: "tuition",
          value: 32000,
          currency: "GBP",
          source_type: "official",
          period: "per_year",
        },
      ],
      fx_rate: 9.12,
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [],
    freshness_flag: {
      status: "current_season",
      last_verified: "2026-07-20",
      days_since_update: 13,
    },
  },
  sources: [
    {
      source_url: "https://www.rcm.ac.uk/study/postgraduate/composition/",
      source_title: "RCM — Composition",
      retrieved_date: "2026-07-20",
      source_quote: null,
      related_field: "application_requirements",
      confidence_level: "High",
    },
  ],
  related_program_refs: [],
};

// 9 — 形态①正向判定的另一半(裁决 T3-R5.2):官方 CoA 生活费齐全、
// FX 有效,但 tuition 组件缺失(schools 的 tuition_* 为 null 而
// application_requirements.estimated_living_cost 有值,是真实可能的组合)。
// 只检查 living_cost 的逻辑会把纯生活费渲染成「年总费用」。
// 正确行为:tuition 缺失 → 落形态③ → 无学费可显示 → 整个费用块不渲染。
// 同时覆盖:纯语言条件(无其他材料词)必须并入英语行。
const mdwWienCompositionMa: ProgramV3 = {
  school: MDW_WIEN,
  offering: {
    school_ref: "mdw-wien",
    field_ref: "composition",
    degree_level_ref: "mm",
    program_name_zh: "作曲",
    official_program_name: "Komposition",
    degree_level_name_zh: "音乐硕士",
    degree_abbreviation: "MA",
    duration_years: 2,
    language_of_instruction: ["German"],
    program_url: "https://www.mdw.ac.at/komposition/",
  },
  application: {
    admission_cycle: "Fall 2026",
    application_deadline: "2026-09-15",
    application_fee: null,
    application_fee_currency: null,
    required_materials: ["在线申请表", "作品集"],
    transcript_requirements: null,
    recommendation_letters: null,
    resume_required: "Unknown",
    essay_required: "Unknown",
    portfolio_required: "Required",
    english_language_tests: [],
    toefl_minimum: null,
    ielts_minimum: null,
    duolingo_minimum: null,
    english_requirement_status: "Not Required",
    english_waiver_policy: null,
    international_applicant_notes: null,
    // 纯语言条件:提到语言要求、不涉及任何其他材料 → 应并入英语行
    conditional_notes: "德语语言要求仅适用于计划修读教学法方向的申请者",
  },
  audition: {
    admission_cycle: "Fall 2026",
    prescreening_required: "Unknown",
    prescreening_deadline: null,
    audition_required: "Unknown",
    audition_format: "Unknown",
    repertoire_summary: null,
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements: null,
    special_notes: null,
    conditional_notes: null,
  },
  editorial_note: null,
  publishing: {
    slug: "composition-mm",
    answer_sentence_zh: null,
    cost_estimate_rmb: {
      min: 190000,
      max: 210000,
      currency: "CNY",
      components: [
        // tuition 组件缺失 —— 只有官方生活费
        {
          item: "living_cost",
          value_min: 14400,
          value_max: 15800,
          currency: "EUR",
          source_type: "official",
          composition_note: "含住宿、餐饮、书籍、交通及学生医保(校方公布)",
        },
      ],
      fx_rate: 7.84,
      fx_snapshot_date: "2026-07-01",
      methodology_version: "v3",
    },
    badges: [{ label: "免语言成绩", type: "success", priority: 3 }],
    freshness_flag: {
      status: "current_season",
      last_verified: "2026-07-19",
      days_since_update: 14,
    },
  },
  sources: [
    {
      source_url: "https://www.mdw.ac.at/komposition/",
      source_title: "mdw — Komposition",
      retrieved_date: "2026-07-19",
      source_quote: null,
      related_field: "application_requirements",
      confidence_level: "Medium",
    },
  ],
  related_program_refs: [],
};

export const mockProgramsV3: ProgramV3[] = [
  juilliardVoiceBm,
  juilliardPianoBm,
  juilliardOperaMm,
  manhattanCompositionMm,
  rcmPianoBm,
  mdwWienVoiceMa,
  manhattanVoiceMm,
  rcmCompositionMm,
  mdwWienCompositionMa,
];

export function findMockProgramV3(
  schoolSlug: string,
  programSlug: string,
): ProgramV3 | undefined {
  return mockProgramsV3.find(
    (p) => p.school.slug === schoolSlug && p.publishing.slug === programSlug,
  );
}

export function relatedMockProgramsV3(program: ProgramV3): ProgramV3[] {
  return program.related_program_refs
    .map((ref) => mockProgramsV3.find((p) => programOfferingRef(p) === ref))
    .filter((p): p is ProgramV3 => Boolean(p));
}
