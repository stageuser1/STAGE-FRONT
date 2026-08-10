/**
 * Berklee College of Music 主校 canonical 包生成器(阶段三 Mode B,2026-08-10)。
 *
 *   node scripts/oss/build-berklee-package.mjs <输出路径>
 *
 * 为什么是脚本而不是手写 JSON:15 个专业的申请要求与试音要求**完全相同**
 * (Berklee 的试音按主修乐器走、不按专业走),手写 15 份等于抄 15 遍,
 * 抄错一处就是一条无人发现的错误数据。共享事实在这里只写一次。
 *
 * 数据边界:
 * - 只做本科 BM(裁决 2026-08-10)。研究生、Professional Diploma、
 *   Berklee Online、两个 BA 均不在本版。
 * - 所有 `is_current: false`、`application_deadline: null` —— 官网截至
 *   2026-08-10 未公布 Fall 2027 任何日期,宁缺毋假。
 * - 本脚本产出的 `workflow_status.review_status` 恒为 `unreviewed`,
 *   行级 review_status 恒为 Extracted/Needs Review。**抽取方不给自己盖
 *   Verified**(技能纪律 + 项目规则 F),那是人工复核之后的事。
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-berklee-package.mjs <输出路径>");
  process.exit(2);
}

const SCHOOL = "berklee_college_of_music";
const CHECKED = "2026-08-10";
const CYCLE = "Fall 2026";

const URL_MAJORS = "https://college.berklee.edu/majors";
const URL_APPLY = "https://college.berklee.edu/admissions/undergraduate/how-to-apply";
const URL_DEADLINES = "https://college.berklee.edu/admissions/undergraduate/deadlines";
const URL_INTL = "https://college.berklee.edu/admissions/undergraduate/international";
const URL_AUDITION_PROCESS =
  "https://college.berklee.edu/admissions/undergraduate/auditionandinterview";
const URL_AUDITION_GUIDE = "https://college.berklee.edu/admissions/undergraduate/audition";
const URL_TUITION = "https://www.berklee.edu/student-accounts/tuition-and-related-costs";
const URL_MT_REQS =
  "https://college.berklee.edu/program-requirements/music-therapy-bachelors-degree";

/** 15 个 BM 专业。field_category 的归类理由见 docs/contracts/field-classification-precedents.md。 */
const MAJORS = [
  ["composition", "Composition", "作曲", "Composition/Theory"],
  ["contemporary_writing_production", "Contemporary Writing and Production", "当代写作与制作", "Composition/Theory"],
  ["electronic_production_design", "Electronic Production and Design", "电子音乐制作与设计", "Music Production/Technology"],
  ["film_media_scoring", "Film and Media Scoring", "影视配乐", "Screen Scoring"],
  ["game_interactive_media_scoring", "Game and Interactive Media Scoring", "游戏与交互媒体配乐", "Screen Scoring"],
  ["global_jazz_performance", "Global Jazz Performance", "全球爵士演奏", "Jazz Studies"],
  ["independent_recording_production", "Independent Recording and Production", "独立录音与制作", "Music Production/Technology"],
  ["jazz_composition", "Jazz Composition", "爵士作曲", "Jazz Studies"],
  ["music_business_management", "Music Business/Management", "音乐商业与管理", "Music Business"],
  ["music_education", "Music Education", "音乐教育", "Music Education"],
  ["music_production_engineering", "Music Production and Engineering", "音乐制作与工程", "Music Production/Technology"],
  ["music_therapy", "Music Therapy", "音乐治疗", "Music Therapy"],
  ["performance", "Performance", "演奏", "Music Performance"],
  ["professional_music", "Professional Music", "专业音乐(自主设计)", "Interdisciplinary"],
  ["songwriting", "Songwriting", "词曲创作", "Songwriting"],
];

const offeringRef = (fieldRef) => `${SCHOOL}_${fieldRef}_bm`;
const slugOf = (fieldRef) => `${fieldRef.replace(/_/g, "-")}-bm`;

/** 学费口径:官网给的是「tuition and mandatory fees」合计,不是纯学费。 */
const TUITION = 55620;

const DEADLINE_NOTES =
  `截至 ${CHECKED} 核对,官网未公布 Fall 2027 任何申请日期;` +
  `截止日期页当时只有 Fall 2026(Early Action 11 月 1 日、Regular Action 1 月 15 日,均已过)` +
  `与 Spring / Summer 2026。本记录因此不填截止日期、且 is_current 为 false —— ` +
  `宁可缺，不可假。官网公布新周期后需重新抽取。`;

const ENGLISH_WAIVER =
  "完成 IB 文凭(不含 IB 双语文凭),或有两年全英文授课的高中、或两学期全英文授课的大学经历,可免语言成绩。";

const TOEFL_CONDITIONAL =
  "TOEFL 计分制 2026-01-21 改版:官网列出「2026-01-21 之前考的:72」与「2026-01-21 当日及之后考的:4」。" +
  "本字段填新制 4(2027 入学申请人绝大多数考的是新制);若持旧制成绩,最低要求为 72。";

const REPERTOIRE =
  "现场演奏/演唱一首自选曲目(3–5 分钟,不可预先录制);在标准 I-IV-V 布鲁斯进行上即兴;" +
  "视奏一段记谱(音高与时值准确);听力测试(短节奏与旋律的模仿回应、音程与和弦性质辨识)。";

const AUDITION_NOTES =
  "试音与面试合计约 1 小时(试音 15 分钟 + 面试 15 分钟,需提前 30 分钟报到)。" +
  "可选波士顿校区、全球 40 余个地区试音点、或线上进行;官网称三种方式在录取与奖学金评定上权重相同。" +
  "部分乐器系另有附加技术要求,见官网 Additional Guidelines by Instrument 页(本次未逐乐器抽取)。";

const source = (url, type, related, quote, confidence = "High") => ({
  school_ref: SCHOOL,
  program_offering_ref: null,
  admission_cycle: CYCLE,
  source_url: url,
  source_title: null,
  source_type: type,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote: quote,
  related_field: related,
  confidence_level: confidence,
  review_status: "Extracted",
});

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [
    {
      school_ref: SCHOOL,
      school_name: "Berklee College of Music",
      school_name_zh: "伯克利音乐学院",
      city: "Boston",
      country: "United States",
      region: "North America",
      state_province: "Massachusetts",
      country_code: "US",
      languages_of_instruction: ["English"],
      school_type: "Conservatory",
      official_website: "https://college.berklee.edu/",
      logo: null,
      card_image: null,
      intro_zh: null,
      ranking_source: null,
      ranking_position: null,
      notes:
        "本版只收录本科 Bachelor of Music 的 15 个专业。研究生项目、Professional Diploma、" +
        "Berklee Online、以及两个 Bachelor of Arts(Music Industry Leadership and Innovation、" +
        "Black Music and Culture)均不在本版范围。Boston Conservatory at Berklee 与 Berklee NYC " +
        "是独立招生的另外两所,各自单独建包。",
    },
  ],
  fields: MAJORS.map(([ref, name, zh, category]) => ({
    field_ref: ref,
    field_name: name,
    field_name_zh: zh,
    field_category: category,
    parent_field: null,
    field_group: null,
    aliases: null,
    description: null,
    display_order: null,
  })),
  degree_levels: [
    {
      degree_level_ref: "bm",
      degree_level_name: "Bachelor of Music",
      degree_level_name_zh: "音乐学士",
      abbreviation: "BM",
      degree_category: "Undergraduate",
      display_order: null,
      description: null,
    },
  ],
  program_offerings: MAJORS.map(([ref, name]) => ({
    program_offering_ref: offeringRef(ref),
    school_ref: SCHOOL,
    field_ref: ref,
    degree_level_ref: "bm",
    track_or_concentration: null,
    official_program_name: name,
    program_name_zh: null,
    department: null,
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: URL_MAJORS,
    application_url: URL_APPLY,
    audition_url: URL_AUDITION_GUIDE,
    international_url: URL_INTL,
    card_summary_zh: null,
    degree_system: null,
    tuition_currency: "USD",
    tuition_amount_min: TUITION,
    tuition_amount_max: TUITION,
    tuition_period: "per_year",
    funding_policy: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes:
      `学费口径:官网 2026–2027 学年公布的 $${TUITION.toLocaleString("en-US")} 是「学费与强制杂费合计」,` +
      "不是纯学费;住宿与餐食(另计 $21,300)不含在内。" +
      "program_url 指向专业总览页:各专业另有独立页面但路径不统一(形如 /{department}/bachelor-of-music-in-{major})," +
      "本次未逐个核实,故不填未经验证的链接。",
  })),
  application_requirements: MAJORS.map(([ref]) => ({
    program_offering_ref: offeringRef(ref),
    admission_cycle: CYCLE,
    is_current: false,
    application_deadline: null,
    timeline_structured: null,
    deadline_notes: DEADLINE_NOTES,
    application_fee: 150,
    application_fee_currency: "USD",
    required_materials: [
      "Online application form",
      "Official high school transcript or GED",
      "Live audition",
      "Interview",
    ],
    transcript_requirements: null,
    recommendation_letters: null,
    resume_required: "Unknown",
    essay_required: "Unknown",
    portfolio_required: "Unknown",
    english_language_tests: ["TOEFL", "IELTS", "Duolingo", "PTE"],
    toefl_minimum: 4,
    ielts_minimum: 6,
    duolingo_minimum: 110,
    english_waiver_policy: ENGLISH_WAIVER,
    english_requirement_status: null,
    international_applicant_notes:
      "国际申请人另需学历认证评估;母语非英语者需提交英语成绩(可豁免条件见 english_waiver_policy)。",
    conditional_notes: TOEFL_CONDITIONAL,
    conditional_notes_structured: null,
    estimated_living_cost: null,
    estimated_living_cost_currency: null,
    review_status: "Needs Review",
    notes:
      "语言要求与申请费为校级统一规定(来源为全校页面,非专业页),已复制到每个专业。" +
      "PTE 最低 48 分官网有列,但契约无对应字段,记于此。" +
      "推荐信、简历、文书三项官网未明确说明是否必需,故为 Unknown/null,不猜。",
  })),
  audition_requirements: MAJORS.map(([ref]) => ({
    program_offering_ref: offeringRef(ref),
    admission_cycle: CYCLE,
    is_current: false,
    prescreening_required: "No",
    prescreening_deadline: null,
    audition_required: "Yes",
    audition_format: "Live Only",
    repertoire_summary: REPERTOIRE,
    repertoire_structured: null,
    video_requirements: null,
    file_format_requirements: null,
    accompaniment_requirements:
      "学校不提供伴奏。可自带伴奏者,或使用手机播放伴奏音轨。",
    interview_or_callback_requirements:
      "面试为必需环节,与试音同场进行,约 15 分钟,谈音乐经历、目标与对学校的期待。",
    special_notes: AUDITION_NOTES,
    conditional_notes: null,
    conditional_notes_structured: null,
    review_status: "Needs Review",
    notes:
      "Berklee 的试音按主修乐器组织,不按专业区分 —— 15 个专业共用同一套试音要求,来源为全校页面。" +
      "prescreening_required 填 No 是基于两处独立来源(试音流程页、截止日期页)描述的完整流程中均无预筛环节," +
      "而非官网的明确否定句;此项已标 Needs Review,请人工确认。",
  })),
  source_records: [
    source(URL_MAJORS, "Official Program Page", "program_offerings",
      "Bachelor of Music majors listed on the official majors page (15 BM majors after excluding the Bachelor of Arts programs)."),
    source(URL_APPLY, "Application Requirements Page", "application_fee",
      "Your application form is not considered complete until the $150 application fee is paid."),
    source(URL_APPLY, "Application Requirements Page", "required_materials",
      "Applying to Berklee College of Music requires an online application form, supporting materials (e.g. resume, transcripts, or personal statement), and typically an audition and/or interview.",
      "Medium"),
    source(URL_DEADLINES, "Deadline/Fee Page", "application_deadline",
      "页面仅列出 Fall 2026(Early Action 11 月 1 日、Regular Action 1 月 15 日)与 Spring / Summer 2026;无任何 Fall 2027 日期。"),
    source(URL_INTL, "English Language Requirements Page", "english_language_tests",
      "Bachelor of Music: TOEFL iBT — exams taken before January 21, 2026: 72; exams taken on or after January 21, 2026: 4. IELTS: 6.0. Duolingo English Test: 110. PTE Academic: 48."),
    source(URL_INTL, "English Language Requirements Page", "english_waiver_policy",
      "Applicants may bypass the English test requirement if they complete an IB Diploma (excluding the IB Bilingual Diploma) or have studied for two years of high school or two semesters of college entirely in English."),
    source(URL_AUDITION_PROCESS, "Audition Requirements Page", "audition_format",
      "The audition and interview process takes about one hour after you check in — a 15-minute audition and a 15-minute interview. Applicants may audition in Boston, at a regional site, or online."),
    source(URL_AUDITION_GUIDE, "Audition Requirements Page", "repertoire_summary",
      "Prepared piece must be performed live (it cannot be prerecorded) and be three to five minutes in length. Be prepared to play or sing over a standard I-IV-V blues progression. Sight-reading and ear training are also assessed. Berklee does not provide an accompanist to applicants at auditions."),
    source(URL_TUITION, "Deadline/Fee Page", "tuition_amount_min",
      "For Berklee College of Music, undergraduate degree tuition and mandatory fees will be $55,620 (2026–2027)."),
    source(URL_MT_REQS, "Official Program Page", "duration_years",
      "Bachelor of Music degree total of 128 credits completed over eight semesters.", "Medium"),
  ],
  publishing: {
    programs: MAJORS.map(([ref]) => ({
      program_offering_ref: offeringRef(ref),
      slug: slugOf(ref),
      answer_sentence_zh: null,
      field_tiers: {},
      cost_estimate_rmb: {
        // 形态③(见 data/v3/types.ts):仅学费、原币种、无汇率字段。
        // 不自造汇率,也不把「学费+杂费」当成完整就读成本。
        min: TUITION,
        max: TUITION,
        currency: "USD",
        components: [
          {
            item: "tuition",
            value: TUITION,
            currency: "USD",
            source_type: "official",
            period: "per_year",
            composition_note: "官网口径为学费与强制杂费合计,不含住宿餐食",
          },
        ],
        methodology_version: "v3",
      },
      badges: [],
      freshness_flag: {
        status: "unknown",
        last_verified: CHECKED,
        days_since_update: 0,
      },
    })),
  },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: [
      "application_deadline",
      "recommendation_letters",
      "resume_required",
      "essay_required",
      "portfolio_required",
      "english_requirement_status",
    ],
    needs_human_review: true,
    review_notes: [
      "⚠ 未经人工复核。抽取方不给自己盖 Verified(项目规则 F)。",
      "【官网自相矛盾,需裁决】Black Music and Culture 的学位类型:/majors 页两次抓取均标为 Bachelor of Music,而招生页措辞为「a Bachelor of Music or a Bachelor of Arts in Black Music and Culture student」,读作 BA。按裁决以招生页为准判为 BA,故不在本版(本版只做 BM)。旁证:搜索摘要称「15 majors leading to a Bachelor of Music」,而 /majors 列 16 条,减去它正好 15。若最终判定为 BM,需补一条 offering。",
      "【归类判断题,已立先例】Contemporary Writing and Production 归 Composition/Theory(核心手艺是写作编配,制作是载体);Jazz Composition 归 Jazz Studies(体裁优先于职能);Professional Music 归新设的 Interdisciplinary(无固定手艺核心,并入 Music Performance 会对使用者撒谎)。三条理由与后续适用规则见 docs/contracts/field-classification-precedents.md。",
      "【中文名为译名,非官方】field_name_zh 与 school_name_zh 是为中文读者所译,Berklee 官方未提供中文专业名。请在复核时确认译法。",
      "【跨专业推断】duration_years=4 的直接证据只见于 Music Therapy 的学位要求页(128 学分 / 八学期),已按 BM 学位结构应用于全部 15 个专业,来源 confidence 标 Medium。",
      "【弱证据】prescreening_required=No 来自两处流程描述中均无预筛环节,而非官网明确否定句,已标 Needs Review。",
      "【链接精度】program_url 统一指向 /majors 总览页。各专业有独立页面但路径不统一(形如 /{department}/bachelor-of-music-in-{major}),本次未逐个核实,故不填未经验证的链接。",
      "【学费口径】$55,620 是「学费+强制杂费」合计,非纯学费;住宿餐食另计 $21,300,未计入。",
      "【周期归属】全部记录 admission_cycle=Fall 2026 且 is_current=false、截止日期为 null —— 官网截至 2026-08-10 未公布 Fall 2027 任何日期。官网更新后需重新抽取。",
      "【渲染层已知缺陷】lib/program-v3/package-adapter.ts 取 application/audition 记录时不读 is_current,取的是数组首条。本包每专业只有一条记录故无影响,但包内一旦出现两个周期,页面会渲染靠前的那条。已作为发现上报。",
      "【契约无对应字段】PTE Academic 最低 48 分官网有列,契约无 pte_minimum 字段,已记于 application_requirements.notes。",
    ],
  },
  workflow_status: {
    extraction_status: "complete",
    review_status: "unreviewed",
    ready_for_directus_import: false,
  },
};

writeFileSync(OUT, JSON.stringify(pkg, null, 2), "utf8");
console.log(
  `已生成 ${OUT}\n` +
    `  学校: ${pkg.schools[0].school_name} (${SCHOOL})\n` +
    `  专业: ${pkg.program_offerings.length} 条 BM\n` +
    `  申请要求: ${pkg.application_requirements.length} 条 · 试音要求: ${pkg.audition_requirements.length} 条\n` +
    `  来源记录: ${pkg.source_records.length} 条 · 复核备注: ${pkg.data_quality.review_notes.length} 条`,
);
