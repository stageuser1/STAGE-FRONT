/**
 * Berklee NYC graduate canonical package generator.
 *
 *   node scripts/oss/build-berklee-nyc-package.mjs <output-path>
 *
 * Mode B evidence was checked on 2026-08-13. The three specialization pages
 * were checked independently before shared application facts were reused.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-berklee-nyc-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "berklee_nyc";
const CHECKED = "2026-08-13";
const CYCLE = "Fall 2027";
const DEGREE = "ma";
const DEGREE_NAME = "Master of Arts";
const BASE_PROGRAM = "Master of Arts in Creative Media and Technology";

const URL_HOME = "https://nyc.berklee.edu/";
const URL_GRADUATE_INDEX = "https://www.berklee.edu/graduate";
const URL_ADMISSIONS = "https://nyc.berklee.edu/about-graduate-admissions";
const URL_APPLY = "https://nyc.berklee.edu/admissions/how-to-apply";
const URL_DEADLINES = "https://nyc.berklee.edu/admissions-application-deadlines";
const URL_INTERVIEWS = "https://nyc.berklee.edu/admissions-interviews";
const URL_TUITION = "https://www.berklee.edu/student-accounts/tuition-and-related-costs";
const TUITION_PER_SEMESTER = 20585;
const APPLICATION_FEE = 150;

const lines = (...parts) => parts.join("\n");

const PROGRAMS = [
  {
    ref: "songwriting",
    officialName: "Songwriting and Production",
    nameZh: "词曲创作与制作",
    category: "Songwriting",
    url: "https://nyc.berklee.edu/songwriting-and-production",
    offeringRef: `${SCHOOL}_songwriting_${DEGREE}`,
    slug: "songwriting-production-ma",
    portfolio: lines(
      "提交一份 portfolio submission form。",
      "包含 3 个项目,展示以下任意组合的经验: songwriting、beat making、top-lining、音乐和/或人声制作、混音、声音设计。",
      "须使用官网提供的 portfolio template 并填写全部字段。",
    ),
    portfolioQuote:
      "Applicants ... are required to submit ... Three projects ... songwriting, beat making, top-lining, music and/or vocal production, mixing and sound design.",
    programQuote:
      "The Master of Arts in Creative Media and Technology program is designed to be completed in one full academic year: consecutive fall, spring, and summer semesters.",
    notes:
      "field_ref 复用主校 songwriting:官网将 songwriting 置于该 specialization 的核心创作手艺,production 是协作与技术实现层。按‘分类跟着实际专业走’且避免跨校领域拆分,不新增 songwriting_production。",
  },
  {
    ref: "musical_theater_writing_production",
    officialName: "Writing and Production for Musical Theater",
    nameZh: "音乐剧写作与制作",
    category: "Musical Theatre",
    url: "https://nyc.berklee.edu/writing-production-musical-theater",
    offeringRef: `${SCHOOL}_musical_theater_writing_production_${DEGREE}`,
    slug: "musical-theater-writing-production-ma",
    portfolio: lines(
      "提交一份 portfolio submission form。",
      "包括:一首含有本人音乐或歌词(或两者)的歌曲示例;一首完全由本人创作或另一首合作歌曲示例;作曲者再提交一份音乐示例、文字创作者再提交一份额外歌词;以及自选写作样本或额外歌词。",
      "须使用官网提供的 portfolio template 并填写全部字段。",
    ),
    portfolioQuote:
      "Applicants ... are required to submit ... a song example ... a song example written solely by you, or another song collaboration ... an additional music example or lyric ... a writing sample or additional lyric.",
    programQuote:
      "The Master of Arts in Creative Media and Technology program is designed to be completed in one full academic year: consecutive fall, spring, and summer semesters.",
    notes:
      "当前名称适用于 Fall 2025 起入学者;官网注明 2024–25 学年旧称为 Writing and Design for Musical Theater,不另建历史 offering。",
  },
  {
    ref: "music_production_engineering",
    officialName: "Live Music Production and Design",
    nameZh: "现场音乐制作与设计",
    category: "Music Production/Technology",
    url: "https://nyc.berklee.edu/live-music-production-design",
    offeringRef: `${SCHOOL}_music_production_engineering_${DEGREE}`,
    slug: "live-music-production-design-ma",
    portfolio: lines(
      "提交一份 portfolio submission form。",
      "包含 2 个项目,展示以下任意领域的经验:现场活动视觉内容创作、视频制作、灯光设计、舞台/布景设计、声音设计、现场音乐和/或艺术装置、表演艺术、现场活动舞台管理。",
      "须使用官网提供的 portfolio template 并核对链接有效。",
    ),
    portfolioQuote:
      "Applicants ... are required to submit ... Two projects demonstrating ... visual content creation for live events, video production, lighting design, set design, sound design ... or stage management for live events.",
    programQuote:
      "The Master of Arts in Creative Media and Technology program is designed to be completed in one full academic year: consecutive fall, spring, and summer semesters.",
    notes:
      "使用现有合法 field_ref music_production_engineering;按 P1 归入 Music Production/Technology。该 field_ref 是跨校合法归类值,不等同于本专业官方名称。",
  },
];

const COMMON_MATERIALS = [
  "Online application form",
  "Two- to four-minute video statement of purpose uploaded to YouTube",
  "Résumé/CV in English or translated to English, uploaded as PDF",
  "One letter of recommendation in English or translated to English, uploaded as PDF",
  "Official undergraduate bachelor's degree transcript(s)",
  "Program-specific portfolio submission",
  "English language test when English is a second language, unless the stated waiver applies",
];

const ENGLISH_TESTS = [
  "TOEFL iBT",
  "IELTS",
  "Pearson Test of English Academic (PTE)",
  "Duolingo English Test",
];

const DEADLINE_NOTES =
  `截至 ${CHECKED} 核实,官网 Admissions Deadlines 页面仅标月日未标年份: Early Action 11 月 1 日、` +
  "Regular Admission 1 月 15 日、Extended Action 3 月 24 日。按 R7 不自行补年份," +
  "application_deadline 填 null,is_current 填 false;官网公布带年份的新周期后需重新抽取。";

const TIMELINE = {
  milestones: [
    { label: "Early Action application deadline", date_text: "November 1" },
    { label: "Early Action decision", date_text: "January 31" },
    { label: "Regular Admission application deadline", date_text: "January 15" },
    { label: "Regular Admission decision", date_text: "March 31" },
    { label: "Extended Action application deadline", date_text: "March 24" },
    { label: "Extended Action decision", date_text: "April 14" },
    { label: "Tuition deposit", date_text: "May 1" },
  ],
  date_year_note: "官网当前截止日期页仅列月日,未标年份;核实日期 2026-08-13。",
};

const ENGLISH_WAIVER =
  "如果申请人已在英语授课的 college or university 完成至少两年全日制学习,收到成绩单后可申请豁免英语考试要求。";

const ENGLISH_CONDITIONAL =
  "官网按考试日期区分 TOEFL 新旧计分制:2026-01-21 之前参加考试最低 100,2026-01-21 当日及之后最低 5;本字段填当前新制 5。";

const INTERVIEW_NOTE =
  "本项目为面试制(interview)非试音制,字段名为契约限制。契约没有独立 interview 字段,因此 audition_required 与 prescreening_required 均不把‘未称为 audition’推成 No。";

const source = (programOfferingRef, url, title, type, relatedField, quote, confidence = "High") => ({
  school_ref: SCHOOL,
  program_offering_ref: programOfferingRef,
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

const applicationFor = (program) => ({
  program_offering_ref: program.offeringRef,
  admission_cycle: CYCLE,
  is_current: false,
  application_deadline: null,
  timeline_structured: TIMELINE,
  deadline_notes: DEADLINE_NOTES,
  application_fee: APPLICATION_FEE,
  application_fee_currency: "USD",
  required_materials: [...COMMON_MATERIALS, program.portfolio],
  transcript_requirements:
    "须提交本科 bachelor’s degree 的官方成绩单;不要提交其他学位或高中成绩单。若被录取,入学前还须提交毕业证或注明学位授予日期的最终成绩单;在读本科生须先提交当前官方成绩单,毕业后补交最终成绩单或毕业证明。",
  recommendation_letters: 1,
  resume_required: "Required",
  essay_required: "Unknown",
  portfolio_required: "Required",
  english_language_tests: ENGLISH_TESTS,
  toefl_minimum: 5,
  ielts_minimum: 7.5,
  duolingo_minimum: 120,
  english_waiver_policy: ENGLISH_WAIVER,
  english_requirement_status: "Conditional",
  international_applicant_notes:
    "英语为第二语言的申请人须提交规定英语考试成绩;符合官网英语授课大学全日制学习两年条件者可申请豁免。官网未在本页另设国际申请人流程。",
  conditional_notes: ENGLISH_CONDITIONAL,
  conditional_notes_structured: null,
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes:
    "三个 specialization 的申请记录分别核对了同一 How to Apply 页面;共享的是官网明确写给 all graduate applicants 的校级材料,portfolio 部分按本专业逐条保留。" +
    "官网要求的是 2–4 分钟视频 statement of purpose,但未明确否定书面 essay,故 essay_required=Unknown,不是 No。" +
    "官网明确不要求 GMAT/GRE,但契约没有对应字段,记入本 notes。",
});

const auditionFor = (program) => ({
  program_offering_ref: program.offeringRef,
  admission_cycle: CYCLE,
  is_current: false,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "Unknown",
  audition_format: "Unknown",
  repertoire_summary: null,
  repertoire_structured: null,
  video_requirements:
    "所有申请人须在提交申请后完成 Kira Talent self-recorded interview;官网称其包含 written and videotaped questions。",
  file_format_requirements: null,
  accompaniment_requirements: null,
  interview_or_callback_requirements:
    "所有申请人必须完成 Kira Talent 自录面试;该面试经招生委员会审阅后,被选中的申请人再参加与招生团队的第二轮线上 live interview。根据所申请 specialization,第二轮可能包含技术或领域问题。",
  special_notes: INTERVIEW_NOTE,
  conditional_notes: null,
  conditional_notes_structured: null,
  review_status: "Needs Review",
  notes:
    "官网把流程称为 interview,没有将其称为 audition;audition_required 与 prescreening_required 均填 Unknown,不把未提及 audition 当作明确否定。" +
    "本项目为面试制(interview)非试音制,字段名为契约限制。",
});

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [
    {
      school_ref: SCHOOL,
      school_name: "Berklee NYC",
      school_name_zh: "伯克利纽约(Berklee NYC)",
      city: "New York",
      country: "United States",
      region: "North America",
      state_province: "New York",
      country_code: "US",
      languages_of_instruction: ["English"],
      school_type: "University Music School",
      official_website: URL_HOME,
      logo: null,
      card_image: null,
      intro_zh: "伯克利纽约提供创意媒体与技术文学硕士项目,设有词曲创作与制作、音乐剧写作与制作、现场音乐制作与设计三个 specialization。",
      ranking_source: null,
      ranking_position: null,
      notes:
        "本包仅收录 Berklee NYC 的研究生 Master of Arts in Creative Media and Technology 及其三个 specialization。按运营者点名豁免 R11 的本科默认范围;不收录本科、其他 Berklee 校区、Berklee Online、非学位项目或毕业/修课要求。",
    },
  ],
  fields: PROGRAMS.map((program) => ({
    field_ref: program.ref,
    field_name: program.officialName,
    field_name_zh: program.nameZh,
    field_category: program.category,
    parent_field: null,
    field_group: null,
    aliases: null,
    description: null,
    display_order: null,
  })),
  degree_levels: [
    {
      degree_level_ref: DEGREE,
      degree_level_name: DEGREE_NAME,
      degree_level_name_zh: "文学硕士",
      abbreviation: "MA",
      degree_category: "Graduate",
      display_order: null,
      description: "Berklee NYC 的 Master of Arts in Creative Media and Technology。",
    },
  ],
  program_offerings: PROGRAMS.map((program) => ({
    program_offering_ref: program.offeringRef,
    school_ref: SCHOOL,
    field_ref: program.ref,
    degree_level_ref: DEGREE,
    track_or_concentration: program.officialName,
    official_program_name: BASE_PROGRAM,
    program_name_zh: `创意媒体与技术文学硕士（${program.nameZh}）`,
    department: null,
    duration_years: 1,
    language_of_instruction: ["English"],
    program_url: program.url,
    application_url: URL_APPLY,
    audition_url: URL_INTERVIEWS,
    international_url: null,
    card_summary_zh: null,
    degree_system: "Master of Arts (MA)",
    tuition_currency: "USD",
    tuition_amount_min: TUITION_PER_SEMESTER,
    tuition_amount_max: TUITION_PER_SEMESTER,
    tuition_period: "per_semester",
    funding_policy:
      "所有申请人会在招生流程中自动获得 merit-based scholarship 考虑,无需另行申请;美国公民或永久居民可申请联邦助学金。",
    major_declaration_requirements: null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes:
      `该 specialization 页面逐页写明 ${program.programQuote} ` +
      "官网未说明入学后另行申报该 specialization 的门槛,故 major_declaration_requirements=null。" +
      program.notes +
      "学费字段记录官网公布的每学期 MA tuition $20,585;另列 comprehensive fee、health insurance 等不并入 tuition_amount。",
  })),
  application_requirements: PROGRAMS.map(applicationFor),
  audition_requirements: PROGRAMS.map(auditionFor),
  source_records: [
    source(null, URL_HOME, "Berklee NYC", "Official Program Page", "program_offerings",
      "Master of Arts in Creative Media and Technology with three specializations: Songwriting and Production; Writing and Production for Musical Theater; Live Music Production and Design."),
    source(null, URL_GRADUATE_INDEX, "Graduate Programs", "Official Program Page", "degree_level",
      "Berklee's campus in New York offers a Master of Arts in creative media and technology."),
    source(null, URL_ADMISSIONS, "Admissions", "Application Requirements Page", "program_offerings",
      "All graduate programs on the Berklee NYC campus begin in September and are completed in one year (fall, spring, and summer semesters)."),
    ...PROGRAMS.flatMap((program) => [
      source(program.offeringRef, program.url, program.officialName, "Official Program Page", "duration_years", program.programQuote),
      source(program.offeringRef, program.url, program.officialName, "Official Program Page", "application_requirements",
        "Applicants to the Master of Arts in Creative Media and Technology program must possess a minimum of a bachelor's degree from an accredited institution."),
      source(program.offeringRef, URL_APPLY, "How to Apply", "Application Requirements Page", "required_materials",
        `All graduate applicants must submit the application form, portfolio, statement of purpose, résumé, letter(s) of recommendation, and college transcript(s); specialization-specific portfolio evidence: ${program.portfolioQuote}`),
      source(program.offeringRef, URL_APPLY, "How to Apply", "Application Requirements Page", "english_language_tests",
        "Applicants for whom English is a second language must submit one of the listed standardized tests; TOEFL iBT is 100 before January 21, 2026 and 5 on or after January 21, 2026; IELTS 7.5; PTE 68; Duolingo 120."),
      source(program.offeringRef, URL_INTERVIEWS, "Admissions Interviews", "Audition Requirements Page", "interview_or_callback_requirements",
        "All applicants are required to complete a self-recorded interview on the Kira Talent interview platform. Selected applicants will be invited to participate in a second-round, online interview."),
      source(program.offeringRef, URL_DEADLINES, "Admissions Deadlines", "Deadline/Fee Page", "application_deadline",
        "Early Action: November 1; Regular Admission: January 15; Extended Action: March 24. The page does not state a year; application_deadline is therefore null."),
      source(program.offeringRef, URL_TUITION, "Tuition and Related Costs", "Deadline/Fee Page", "tuition_amount_min",
        "New York City Campus — MA in creative media and technology: $20,585 per semester; comprehensive fee $1,625; application fee $150; tuition deposit $2,500."),
    ]),
  ],
  publishing: {
    programs: PROGRAMS.map((program) => ({
      program_offering_ref: program.offeringRef,
      slug: program.slug,
      answer_sentence_zh: null,
      field_tiers: {},
      cost_estimate_rmb: {
        min: TUITION_PER_SEMESTER,
        max: TUITION_PER_SEMESTER,
        currency: "USD",
        components: [
          {
            item: "tuition",
            value: TUITION_PER_SEMESTER,
            currency: "USD",
            source_type: "official",
            period: "per_semester",
            period_basis: "官网 2026–2027 New York City Campus MA tuition by semester",
            composition_note: "不含官网另列的 comprehensive fee、health insurance、tuition deposit 与生活成本。",
          },
        ],
        methodology_version: "v3",
        note: "本项目一年三个学期;此处只记录官方每学期 tuition,不把每学期数额擅自乘三。",
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
      "application_deadline(官网仅标月日未标年份)",
      "major_declaration_requirements(逐页核查后官网未说明入学后申报门槛)",
      "audition_semantics(契约强制 audition 字段,官网实际为 interview)",
      "essay_required(官网要求视频 statement of purpose,未明确否定书面 essay)",
    ],
    needs_human_review: true,
    review_notes: [
      "⚠ 未经人工复核。抽取方不给自己盖 Verified;workflow_status.review_status 保持 unreviewed。",
      "【R1 逐页核实】三个 specialization 页面分别核对了 Master of Arts、最低本科背景与一年制;这些共享事实不是默认复制。How to Apply 页面中 portfolio 要求逐 specialization 保留,三条记录不共用 portfolio 文本。",
      "【归类判断】Songwriting and Production 复用主校 songwriting,理由是核心创作手艺为 songwriting,production 为技术与协作实现层,避免跨校领域拆分。该理由已获运营者批准,作为本轮先例记录。",
      "【归类判断】Writing and Production for Musical Theater 使用新增 field_ref musical_theater_writing_production,归 Musical Theatre;理由已写入 docs/contracts/field-classification-precedents.md P6。",
      "【归类判断】Live Music Production and Design 复用现有 music_production_engineering 合法值,归 Music Production/Technology;该 field_ref 是跨校合法归类值,不是官方名称的同义替换。",
      "【三态】官网未说明入学后 specialization 申报门槛,major_declaration_requirements 填 null,不显示为‘无门槛’。",
      "【三态】官网采用 interview 流程而非 audition;audition_required 与 prescreening_required 填 Unknown,未将未称为 audition 推成 No。",
      "【契约债务】本项目为面试制(interview)非试音制,字段名为契约限制;audition_url 暂填官方 Admissions Interviews 页面。该债务已登记 ENGINEERING_BACKLOG B4。",
      "【日期】官网截止日期页仅标月日未标年份;application_deadline=null,is_current=false,并保留 Early/Regular/Extended 的月日文本。",
      "【数字】学费按官网每学期 $20,585 记录,没有跨学期乘三;另列 comprehensive fee、health insurance 和 deposit 未并入 tuition_amount。",
      "【数字】TOEFL 同时存在旧制 100 与 2026-01-21 起新制 5;字段填新制 5,旧制写入 conditional_notes。",
      "【字段限制】官网明确不要求 GMAT/GRE,但 v3 没有对应字段;已写入 application_requirements.notes。官网要求视频 statement of purpose,未明确否定书面 essay,故 essay_required=Unknown。",
      "【中文名】field_name_zh、program_name_zh、school_name_zh 为本项目译名,官网未提供中文名称。",
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
    `  专业: ${pkg.program_offerings.length} 条 MA specialization\n` +
    `  申请要求: ${pkg.application_requirements.length} 条 · 面试要求: ${pkg.audition_requirements.length} 条\n` +
    `  来源记录: ${pkg.source_records.length} 条 · 复核备注: ${pkg.data_quality.review_notes.length} 条`,
);
