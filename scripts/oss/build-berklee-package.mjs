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
const URL_SUPPORTING =
  "https://college.berklee.edu/admissions/undergraduate/supportingmaterials";

/**
 * 15 个 BM 专业。列:field_ref / 官方名 / 中文译名 / field_category /
 * 专业分页 URL / duration_years / major_declaration_requirements。
 *
 * `duration_years` 只在有直接证据的专业上填 4;其余留 null。
 *
 * `major_declaration_requirements` = **入学后**申报本专业的门槛,2026-08-10
 * 逐个专业页核实,15/15 有据,不外推。三态严格区分(裁决 ④):
 *   - 官网明确说明有门槛 → 写入具体条件
 *   - 官网**明确**说无门槛 → 写明「官网明确说明无额外门槛」(有原句支持)
 *   - 官网**未提及** → null(渲染层整块不显示;绝不写成「无门槛」)
 *
 * 多行文本一律用 lines() 拼,源码里不写转义序列 —— 上一版直接写转义
 * 换行时被写成了真实换行,导致文件语法错误。
 */
const lines = (...parts) => parts.join("\n");

const DECL_NONE =
  "官网明确说明:申报本专业无额外门槛,按注册处的常规专业申报流程办理。";

const DECL = {
  cwp: lines(
    "需在以下三门课各取得 B 或以上:MTEC-111 音乐科技导论(或 MTEC-122 加速版)、AR-111 编曲 1(新生版,或 AR-123 续读版)、HR-112 和声 2(或 HR-114 新生版)。",
    "低于 B(但高于 D)会被移出本专业,并须在下一门对应课程取得 B 或以上方可恢复:科技类需再修一门科技课、编曲需在 AR-124 取得 B 以上、和声需在 HR-211 和声 3 取得 B 以上。得 D 则须重修该课并取得 B 以上才能重新申报。",
  ),
  epd: lines(
    "⚠ 限额专业,须单独申请且需通过选拔。官网称其为「a capped major with a separate application process」。",
    "申请材料与流程:填写申请表、提交一篇文书、提交原创音乐作品,并与系主任或一位全职教师面试;全部面试结束后,由系主任与全职教师开会评定录取。",
    "另强烈建议尽早修读 LMSC-208 音乐声学或 LMSC-209 建筑声学,以及 LMSC-261 计算机编程导论。",
    "官网未说明最低成绩要求、申报时间窗口等其他细则。",
  ),
  filmScoring: lines(
    "须在 FILM-200 影视配乐导论取得 B 或以上,方可最终批准申报;申报本专业需系里批准(departmental approval)。",
    "若特殊情况需在 FILM-200 成绩出来之前申报,系里按个案考虑。",
  ),
  globalJazz: lines(
    "⚠ 仅凭试音进入。官网原文:「Entrance to this major is by audition only.」",
    "须向 Berklee Global Jazz Institute 试音,且最迟应在入学后第二或第三学期完成。",
    "注意:这是入学之后的专业试音,与申请伯克利时的入学试音是两回事。",
  ),
  irp: lines(
    "无申请流程 —— 官网明确:任何符合资格的伯克利在读学生均可申报本专业(「there is no application process」)。",
    "但打算申报者应最迟在第二学期修读 MP-113,并按注册处的常规专业申报流程办理。",
    "另:本专业学生须自费购置指定的硬件与软件。",
  ),
  jazzComp: lines(
    "申报前须完成 AR-111 与 HR-112 两门课。",
    "伯克利本科生须在第三学期前申报专业方向。",
  ),
  mbm: lines(
    "须累计 GPA 达到 2.7 或以上,且 LENG-111 大学写作导论取得 C 或以上。",
    "最迟须在第三学期申报。",
  ),
  musicEd: lines(
    "须完成第一学期的全院核心音乐课程,并通过一次申请与面试。",
    "伯克利本科生须在第三学期前申报专业方向。",
  ),
  mpe: lines(
    "⚠ 限额专业,仅凭申请进入且录取具竞争性。官网原文:「admission to the MP&E major is by application only」「Acceptance is competitive」。",
    "录取依据:音乐素养(musicianship)、既往学业记录、以及对这门手艺表现出的热情。",
    "资格前提:必须已是伯克利在读学生方可被考虑;申请前须已完成至少一学期在校学习,或持有至少 12 个转学分。",
    "课程要求:打算申请者应最迟在第二学期修读 MP-113。",
    "申请流程为两步,包含书面文书与一段五分钟的视频回答。",
  ),
  musicTherapy:
    "须在入学后前两学期内满足:修读 MTH-201 国际音乐治疗导论,期中考试达 84%,或结课总成绩至少 84%。",
  professionalMusic: lines(
    "须以入学后前两学期的成绩取得 GPA 2.0。",
    "伯克利本科生须在第三学期前申报专业方向。",
  ),
};

const MAJORS = [
  ["composition", "Composition", "作曲", "Composition/Theory", "https://college.berklee.edu/composition/bachelor-of-music-in-composition", 4, DECL_NONE],
  ["contemporary_writing_production", "Contemporary Writing and Production", "当代写作与制作", "Composition/Theory", "https://college.berklee.edu/cwp/bachelor-of-music-in-contemporary-writing-and-production", 4, DECL.cwp],
  ["electronic_production_design", "Electronic Production and Design", "电子音乐制作与设计", "Music Production/Technology", "https://college.berklee.edu/electronic-production-and-design/bachelor-of-music-in-electronic-production-and-design", 4, DECL.epd],
  ["film_scoring", "Film Scoring", "影视配乐", "Screen Scoring", "https://college.berklee.edu/film-scoring/bachelor-of-music-in-film-scoring", 4, DECL.filmScoring],
  ["game_interactive_media_scoring", "Game and Interactive Media Scoring", "游戏与交互媒体配乐", "Screen Scoring", "https://college.berklee.edu/film-scoring/bachelor-of-music-in-game-and-interactive-media-scoring", null, DECL_NONE],
  ["global_jazz_performance", "Global Jazz Performance", "全球爵士演奏", "Jazz Studies", "https://college.berklee.edu/professional-performance/bachelor-of-music-in-global-jazz-performance", null, DECL.globalJazz],
  ["independent_recording_production", "Independent Recording and Production", "独立录音与制作", "Music Production/Technology", "https://college.berklee.edu/mpe/bachelor-of-music-in-independent-recording-and-production", null, DECL.irp],
  ["jazz_composition", "Jazz Composition", "爵士作曲", "Jazz Studies", "https://college.berklee.edu/jazz-composition", null, DECL.jazzComp],
  ["music_business_management", "Music Business/Management", "音乐商业与管理", "Music Business", "https://college.berklee.edu/music-business-management/bachelor-of-music-in-music-business-management", 4, DECL.mbm],
  ["music_education", "Music Education", "音乐教育", "Music Education", "https://college.berklee.edu/music-education/bachelor-of-music-in-music-education", 4, DECL.musicEd],
  ["music_production_engineering", "Music Production and Engineering", "音乐制作与工程", "Music Production/Technology", "https://college.berklee.edu/undergraduate/music-production-and-engineering-bachelors-degree", null, DECL.mpe],
  ["music_therapy", "Music Therapy", "音乐治疗", "Music Therapy", "https://college.berklee.edu/music-therapy/bachelor-of-music-in-music-therapy", 4, DECL.musicTherapy],
  ["performance", "Performance", "演奏", "Music Performance", "https://college.berklee.edu/undergraduate/bachelor-of-music-in-performance", null, null],
  ["professional_music", "Professional Music", "专业音乐(自主设计)", "Interdisciplinary", "https://college.berklee.edu/professional-music/bachelor-of-music-in-professional-music", 4, DECL.professionalMusic],
  ["songwriting", "Songwriting", "词曲创作", "Songwriting", "https://college.berklee.edu/songwriting/bachelor-of-music-in-songwriting", 4, DECL_NONE],
];

const offeringRef = (fieldRef) => `${SCHOOL}_${fieldRef}_bm`;
const slugOf = (fieldRef) => `${fieldRef.replace(/_/g, "-")}-bm`;

/** 学费口径:官网给的是「tuition and mandatory fees」合计,不是纯学费。 */
const TUITION = 55620;

const DEADLINE_NOTES =
  `截至 ${CHECKED} 核对,官网未见明确标注 Fall 2027 的申请截止日期。` +
  `截止日期页以「秋季/春季/夏季入学」列出循环的月日(秋季 Early Action 11 月 1 日、` +
  `Regular Action 1 月 15 日),但未标注对应年份。本记录因此不填截止日期、` +
  `且 is_current 为 false —— 宁可缺,不可假。官网明确新周期后需重新抽取。`;

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
  program_offerings: MAJORS.map(([ref, name, , , url, duration, declaration]) => ({
    program_offering_ref: offeringRef(ref),
    school_ref: SCHOOL,
    field_ref: ref,
    degree_level_ref: "bm",
    track_or_concentration: null,
    official_program_name: name,
    program_name_zh: null,
    department: null,
    duration_years: duration,
    language_of_instruction: ["English"],
    program_url: url,
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
    major_declaration_requirements: declaration,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes:
      `学费口径:官网 2026–2027 学年公布的 $${TUITION.toLocaleString("en-US")} 是「学费与强制杂费合计」,` +
      "不是纯学费;住宿与餐食(另计 $21,300)不含在内。" +
      "program_url 为 2026-08-10 从 /majors 页逐条取出的专业分页地址,非按模式拼接。" +
      (duration === null
        ? "duration_years 留空:该专业页未给出学制的直接证据,不按「BM 一般四年」外推。"
        : "duration_years=4 有该专业页/学位要求页的直接证据。"),
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
    recommendation_letters: 0,
    resume_required: "Not Required",
    essay_required: "Not Required",
    portfolio_required: "Not Required",
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
      "推荐信/简历/文书/作品集四项:官网 Supporting Materials 页明确写明 BM 申请人「not required to " +
      "submit supporting materials (e.g. a portfolio, letter of recommendation, etc.)」,且明确不要求 essay、" +
      "personal statement 与 SAT/ACT。故 recommendation_letters=0、其余三项为 Not Required —— " +
      "这是官网的明确否定句,不是「未提及」的推断。",
  })),
  audition_requirements: MAJORS.map(([ref]) => ({
    program_offering_ref: offeringRef(ref),
    admission_cycle: CYCLE,
    is_current: false,
    prescreening_required: "Unknown",
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
      "Berklee 的入学录取不针对具体专业:所有 BM 申请者共用同一套入学要求(申请表 + 主修乐器试音 + 面试)," +
      "专业在入学后申报 —— 因此 15 个专业的试音与语言要求相同,是官网事实而非抽取偷懒。" +
      "入学后各专业另有申报门槛,见 program_offerings.major_declaration_requirements。" +
      "prescreening_required 填 Unknown:官网描述了完整的试音流程但**未明确否定**预筛环节," +
      "「流程里没提到」不等于「官网说不需要」(Codex 交叉核对裁决 2026-08-10,推翻了先前填 No 的过度解读)。",
  })),
  source_records: [
    source(URL_MAJORS, "Official Program Page", "program_offerings",
      "Bachelor of Music majors listed on the official majors page (15 BM majors after excluding the Bachelor of Arts programs)."),
    source(URL_APPLY, "Application Requirements Page", "application_fee",
      "Your application form is not considered complete until the $150 application fee is paid."),
    source(URL_APPLY, "Application Requirements Page", "required_materials",
      "Applying to Berklee College of Music requires an online application form, supporting materials (e.g. resume, transcripts, or personal statement), and typically an audition and/or interview.",
      "Medium"),
    source(URL_APPLY, "Application Requirements Page", "recommendation_letters",
      "Applicants to certain degree programs are not required to submit supporting materials (e.g. a portfolio, letter of recommendation, etc.) in order to complete their application. Bachelor of Music applicants are not required to submit supplemental materials. Berklee does not require essays, personal statements, or standardized test (e.g., SAT/ACT) scores."),
    source(URL_SUPPORTING, "Application Requirements Page", "resume_required",
      "Bachelor of Music and Bachelor of Arts in Black Music and Culture applicants are not required to submit supplemental materials to complete their application."),
    source(URL_DEADLINES, "Deadline/Fee Page", "application_deadline",
      "页面按「秋季(9 月)/ 春季(1 月)/ 夏季(5 月)」入学列出循环的月日(秋季 Early Action 11 月 1 日、Regular Action 1 月 15 日;春季 7 月 1 日;夏季 11 月 1 日 / 12 月 1 日),仅 Summer Program Participants 一行带年份(July 30, 2026)。页面未出现任何标注 Fall 2027 的截止日期。"),
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
      "duration_years(15 个专业中 6 个缺直接证据,留空未外推)",
      "english_requirement_status",
    ],
    needs_human_review: true,
    review_notes: [
      "⚠ 未经人工复核。抽取方不给自己盖 Verified(项目规则 F)。",
      "【交叉核对已过一轮】2026-08-10 由独立模型(Codex)逐字段交叉核对,四类修正已全部采纳:支撑材料四项由 Unknown 改为官网明确的 Not Required/0、duration_years 停止外推、prescreening 改 Unknown、截止日期备注改用不绑定页面结构的措辞。交叉核对不替代人工复核。",
      "【官网自相矛盾,仍需最终确认】Black Music and Culture 的学位类型:/majors 页三次抓取均把它列在 Bachelor of Music 专业中(链接 /africana-studies-department/black-music-and-culture);但**两个招生页**独立地称其为 BA —— How to Apply 页作「Bachelor of Music & BA Black Music/Culture」区分,Supporting Materials 页作「Bachelor of Music and Bachelor of Arts in Black Music and Culture applicants」。招生侧证据更一致,按裁决判为 BA,故不在本版(本版只做 BM)。旁证:/majors 列 16 条,减去它正好是官方口径的「15 个 BM 专业」。若最终判定为 BM,需补第 16 条 offering。",
      "【归类判断题,已立先例】Contemporary Writing and Production 归 Composition/Theory(核心手艺是写作编配,制作是载体);Jazz Composition 归 Jazz Studies(体裁优先于职能);Professional Music 归新设的 Interdisciplinary(无固定手艺核心,并入 Music Performance 会对使用者撒谎)。三条理由与后续适用规则见 docs/contracts/field-classification-precedents.md。",
      "【中文名为译名,非官方】field_name_zh 与 school_name_zh 是为中文读者所译,Berklee 官方未提供中文专业名。请在复核时确认译法。",
      "【已修正·Codex 交叉核对 2026-08-10】duration_years 不再跨专业外推:9 个有「over eight semesters」等直接证据的专业填 4;其余 6 个(Game and Interactive Media Scoring、Global Jazz Performance、Independent Recording and Production、Jazz Composition、Music Production and Engineering、Performance)留 null。「BM 一般四年」是常识不是这一页给的事实。",
      "【已修正·Codex 交叉核对 2026-08-10】prescreening_required 由 No 改为 Unknown:官网描述了完整试音流程但未明确否定预筛,「流程里没提到」不等于「官网说不需要」。原值是过度解读。",
      "【已修正·2026-08-10】program_url 现为逐条核实的专业分页地址(从 /majors 页取出,非按模式拼接)。先前统一指向总览页是因为我猜的两个 URL 都 404,当时选择不填未验证的链接。",
      "【已修正·2026-08-10】官方专业名更正:Film and Media Scoring → Film Scoring(以 /majors 页与其分页 URL 为准),field_ref 同步为 film_scoring,跨校词表已更新。注:该专业页正文自称「film and media scoring major」,两种叫法官网都在用;按裁决以 /majors 索引页为准,差异记此。",
      "【新增维度·2026-08-10】major_declaration_requirements:入学后申报专业的门槛,15 个专业逐页核实、不外推。结果:11 个有实质门槛、3 个官网明确无门槛(Composition / Game and Interactive Media Scoring / Songwriting)、1 个官网未说明(Performance,填 null)。**三个是限额或选拔性专业**——Electronic Production and Design(申请表+文书+原创作品+面试)、Global Jazz Performance(仅凭试音,须第二或第三学期完成)、Music Production and Engineering(竞争性申请,须在读+≥1 学期或 12 转学分+MP-113+两步流程含五分钟视频)。这三个是「考进伯克利≠能读该专业」的主要风险点。",
      "【方法论·为何先前 15 条完全相同】上一版的申请与试音要求是模板套用(builder 里只写一份、复制 15 次),依据是「试音按主修乐器走」这个当时未验证的判断。经运营者质疑后逐项核实:语言成绩确为校级统一(International 页按学位类型分组,BM 全部同组)、试音亦为校级统一(录取不针对专业,专业入学后申报)——结论碰巧成立,但过程不成立。真正的缺口是当时完全没有「申报门槛」这个维度。",
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
