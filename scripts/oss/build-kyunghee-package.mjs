/**
 * Kyung Hee University Post Modern Music undergraduate package generator.
 * Mode B, verified 2026-08-13 against the latest published foreign-admission guide
 * and the university's 2027 academic-year transition note.
 * Draft only; publishing remains an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-kyunghee-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "kyunghee";
const CHECKED = "2026-08-13";
const CYCLE = "2027 Spring (schedule pending)";
const URL_MAIN = "https://www.khu.ac.kr/";
const URL_ADMISSION = "https://iadmission.khu.ac.kr/gglobalcenter/user/contents/view.do?menuNo=8000033";
const URL_GUIDE = "https://kr.object.gov-ncloudstorage.com/khu-bucket/homepage/upload/notice/2026_2_foreignerAdmission.pdf";
const URL_PROGRAM = "https://com.khu.ac.kr/and_eng/user/contents/view.do?menuNo=15000015";
const URL_DEGREE = "https://com.khu.ac.kr/khsma/cmmn/file/fileDown.do?atchFileId=eccdcdcc39e843199e7ad159d20f79f1&bbsId=BMSR00040&fileSn=2&menuNo=500020";

const lines = (...parts) => parts.join("\n");
const refFor = () => `${SCHOOL}_postmodern_music_bm`;

const timeline = {
  milestones: [
    { label: "2026-2 第一批申请（最近已发布周期）", date_text: "2026-02-23 09:00 至 2026-03-13 17:00 KST", qualifier: "非 2027 春当前时点" },
    { label: "2026-2 第二批申请（最近已发布周期）", date_text: "2026-05-04 09:00 至 2026-05-15 17:00 KST", qualifier: "非 2027 春当前时点" },
    { label: "2027 春申请时间", date_text: "官网当前未发布，待下一版外国人本科简章", conditional: "以招生处新简章为准" },
    { label: "2027 学年度招生方式", date_text: "官方说明为拟自 2027 学年度起改为材料审核 100%", conditional: "最终规则待 2027 春简章确认" },
  ],
  date_year_note: "当前官网可取得的完整简章为 2026-2；官网另注 2027 学年度外国人本科新/插班招生拟改为材料审核 100%。",
};

const field = {
  field_ref: "professional_music",
  field_name: "Professional Music",
  field_name_zh: "专业音乐",
  field_category: "Interdisciplinary",
  parent_field: null,
  field_group: "Professional Music",
  aliases: ["Post Modern Music"],
  description: null,
  display_order: null,
  _note: "沿用已批准先例：Post Modern Music 属音乐与流行音乐、爵士、传统音乐、电脑音乐/音响及音乐内容制作的融合型学位，官方谱系不是纯音乐系 BA。",
};

const school = {
  school_ref: SCHOOL,
  school_name: "Kyung Hee University",
  school_name_zh: "庆熙大学",
  city: "Yongin",
  country: "South Korea",
  region: null,
  state_province: "Gyeonggi-do",
  country_code: "KR",
  languages_of_instruction: ["Korean"],
  school_type: "University Music School",
  official_website: URL_MAIN,
  logo: null,
  card_image: null,
  intro_zh: "庆熙大学艺术·设计学院 Post Modern 音乐学系的外国人本科招生记录。",
  ranking_source: null,
  ranking_position: null,
  notes: "本包只收 Post Modern 音乐学系本科外国人通道；其他艺术、设计、戏剧电影及研究生项目排除。该系官方学位目录列为音乐学士。",
};

const program = {
  program_offering_ref: refFor(),
  school_ref: SCHOOL,
  field_ref: "professional_music",
  degree_level_ref: "bm",
  track_or_concentration: "Post Modern Music; Vocal / Instrumental / Composition",
  official_program_name: "Kyung Hee University College of Art and Design — Department of Postmodern Music",
  program_name_zh: "庆熙大学艺术·设计学院 Post Modern 音乐学系（音乐学士）",
  department: "College of Art and Design; Department of Postmodern Music",
  duration_years: null,
  language_of_instruction: ["Korean"],
  program_url: URL_PROGRAM,
  application_url: URL_ADMISSION,
  audition_url: URL_GUIDE,
  international_url: URL_ADMISSION,
  card_summary_zh: "外国人本科通道可申请的融合型音乐学位；最近完整简章要求提交视频/作品材料，2027 学年度起招生方式拟改为材料审核 100%，需以新简章最终确认。",
  degree_system: "Bachelor of Music（官方学位目录韩文为 음악학사）",
  tuition_currency: "KRW",
  tuition_amount_min: 6718400,
  tuition_amount_max: 6718400,
  tuition_period: "per_semester",
  funding_policy: "最新完整外国人简章的 2026-1 参考学费将艺术·设计学院列为 KRW 6,718,400/semester；简章注明学费可能在 2026-2 变更，2027 春须重新核实。",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "官方外国人招生单位表列出 Post Modern 音乐学系，且招生单位位于艺术·设计学院；不是把课程含音乐内容的宽口径学位误收为音乐本科。",
    "官方系所页说明该系融合西方古典、东方传统、大众音乐与 Jazz，并强调电脑音乐、音响训练及音乐内容制作；因此沿用 professional_music/Interdisciplinary 的融合型先例。",
    "2027 春专门简章尚未在官网当前招生页出现。最新完整 2026-2 简章的具体实技规则与其中‘2027 学年度起拟材料审核 100%’的过渡说明分开记录，不相互冒充。",
    "cost_estimate_rmb 保持 null；韩国线主币种保留 KRW；排名字段保持 null。",
  ),
};

const application = {
  program_offering_ref: refFor(),
  admission_cycle: CYCLE,
  is_current: false,
  application_deadline: null,
  timeline_structured: timeline,
  deadline_notes: "2027 春外国人本科申请截止日截至 2026-08-13 尚未由官网当前招生页发布；按规程不拿已过期的 2026-2 日期冒充当前 deadline。",
  application_fee: 250000,
  application_fee_currency: "KRW",
  required_materials: [
    "外国人本科网上申请表",
    "语言能力证明（韩语授课路径）",
    "自我介绍及学业计划书",
    "本人护照及父母护照/身份证明",
    "高中毕业/预毕业证明及高中三年成绩单（翻译公证；中国学历按简章另附认证材料）",
    "学生与父母关系证明",
    "Post Modern 音乐学系技能视频 USB（最近完整简章要求）",
  ],
  transcript_requirements: "高中三年成绩单，需有满分或成绩评价体系说明；中国学历申请材料按最新简章的学历认证、翻译公证及认证要求提交。",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Required",
  portfolio_required: "Required",
  english_language_tests: null,
  toefl_minimum: null,
  ielts_minimum: null,
  duolingo_minimum: null,
  english_waiver_policy: "当前外国人简章只将英文授课轨道列于指定院系；Post Modern 音乐学系未列为英文授课轨道，因此不把英语成绩误写成该系入学硬门槛。",
  english_requirement_status: "Not Required",
  international_applicant_notes: "记录对应庆熙大学外国人本科新/插班招生通道；申请人及父母须满足外国人国籍条件，具体资格以新周期简章为准。",
  conditional_notes: lines(
    "Post Modern 音乐学系不在当前简章列出的 English Track 院系中，主语言口径按 Korean Track 处理。",
    "新入学韩语门槛：TOPIK 3 级以上，或庆熙大学韩语考试 3 级、KIIP 3 阶段/预评价 61 分以上、世宗学堂中级 1 以上等替代路径；插班路径为 TOPIK 4 级以上及相应替代路径。",
    "入学语言要求与毕业要求分开：最近完整简章规定 2026-2 本科新/插班生毕业前须提交 TOPIK 4 级以上，英语授课新/插班生除外；这不是本专业当前入学门槛的替代写法。",
  ),
  conditional_notes_structured: {
    language_entry: {
      track: "Korean Track",
      freshman: ["TOPIK 3+", "KHU Korean Language Test Level 3+", "KIIP Level 3+ or pre-test 61+", "King Sejong Institute Intermediate 1+"],
      transfer: ["TOPIK 4+", "KHU Korean Language Test Level 4+", "KIIP Level 4+ or pre-test 81+", "King Sejong Institute Intermediate 2+"],
    },
    language_after_admission: {
      graduation: "Latest complete guide: TOPIK 4+ before graduation for 2026-2 undergraduate entrants; English-track entrants excluded.",
      status: "Graduation requirement, not entry threshold",
    },
    next_cycle: {
      schedule: "2027 Spring deadline not yet published",
      selection: "Official note says international undergraduate admissions are planned to become document-review 100% from 2027 academic year; final 2027 Spring guide required",
    },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "最近完整简章列 Post Modern 音乐学系单独申请费 KRW 250,000；该数值对应 2026-2 已发布周期，2027 春需以新简章重新核实。",
};

const audition = {
  program_offering_ref: refFor(),
  admission_cycle: CYCLE,
  is_current: false,
  prescreening_required: "Unknown",
  prescreening_deadline: null,
  audition_required: "Unknown",
  audition_format: "Recorded Only",
  repertoire_summary: "最近完整 2026-2 简章的 Post Modern Music 方向材料分为 Vocal、Instrumental、Composition；2027 学年度起拟材料审核 100%，下一周期是否保留同一视频材料结构待新简章确认。",
  repertoire_structured: {
    Vocal: {
      official_direction_name: "Vocal",
      requirements: ["1 首韩语自由曲，2 分钟以内", "1 首非韩语自由曲，2 分钟以内"],
      recording: "两首歌曲分别录像提交；可无伴奏、乐器伴奏或 MR；声乐不得使用麦克风；不得音准修正或套用音效。",
    },
    Instrumental: {
      official_direction_name: "Instrumental",
      requirements: ["2 首自由曲", "两首曲目须为不同曲风；每首 2 分钟以内"],
      recording: "两首演奏分别录像提交；连续拍摄，脸部和实际演奏须清晰可见，不得剪辑。",
    },
    Composition: {
      official_direction_name: "Composition",
      requirements: ["提交 1 首本人创作作品的 PDF 乐谱", "亲自演奏/演唱该作品并提交视频；声乐作品也须亲自演奏"],
      recording: "按最近完整简章以 USB 提交视频；2027 春材料形态待新简章确认。",
    },
  },
  video_requirements: "最近完整简章要求 Post Modern Music 提交技能视频 USB；视频须在材料截止日前 3 个月内拍摄，开头展示手机日期后连续录制。",
  file_format_requirements: "视频应可在 Windows Media Player 或 macOS QuickTime Player 播放；不得剪辑或后期修饰。",
  accompaniment_requirements: "Vocal 可无伴奏、乐器伴奏或 MR；Instrumental 以实际演奏为准。",
  interview_or_callback_requirements: "最近完整 2026-2 周期为专业教授在线面试；2027 学年度起拟材料审核 100%，新周期是否保留面试待最终简章。",
  special_notes: lines(
    "这里保留一条 audition/records 记录，按官网方向键承载 Vocal、Instrumental、Composition，不把三个方向拆成三个 offering。",
    "audition_required 暂记 Unknown：最新完整简章对 2026-2 明列面试+技能考试，但同一官方材料又说明自 2027 学年度起拟改为材料审核 100%；当前尚无 2027 春定稿简章。",
    "不要把 2026-2 的技能考试细则直接展示为 2027 春硬性最终规则。",
  ),
  conditional_notes: "最新完整简章的方向要求可核实，但适用于 2027 春的最终评估方式与材料结构尚待新简章；该不确定性已显式保留。",
  conditional_notes_structured: {
    published_cycle: "2026-2: interview 50% + practical test 50% for Post Modern Music",
    planned_2027: "2027 academic year: document review 100% planned in official note",
    status: "Final 2027 Spring guide not published as of 2026-08-13",
  },
  review_status: "Needs Review",
  notes: "方向曲目与视频要求逐方向核实自最新完整官方简章；不外推其他音乐专业要求。",
};

const source = (url, title, type, quote, offeringRef = null, relatedField = null) => ({
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
  confidence_level: "High",
  review_status: "Extracted",
});

const publishing = {
  programs: [{
    program_offering_ref: refFor(),
    slug: "postmodern-music-bm",
    answer_sentence_zh: "庆熙大学 Post Modern 音乐学系（音乐学士）：外国人本科通道可申请，最近完整简章要求提交视频/作品材料；2027 学年度起拟改为材料审核 100%，待新简章确认。",
    field_tiers: { primary: "professional_music" },
    cost_estimate_rmb: null,
    badges: [{ label: "Kyung Hee Post Modern Music", type: "info", priority: 1 }],
    freshness_flag: { status: "unknown", last_verified: CHECKED, days_since_update: 0 },
  }],
};

const dataQuality = {
  overall_confidence: "Medium",
  missing_critical_fields: [
    "2027 Spring foreign undergraduate application deadline is not published on the current official admission page.",
    "2027 Spring final selection method and whether the 2026-2 video structure carries forward are not yet published; the official transition note is marked as planned.",
    "2027 Spring tuition and application fee are not yet published; latest complete 2026-2 figures are retained with explicit non-current notes.",
  ],
  needs_human_review: true,
  review_notes: [
    "Foreign-route existence passed: the latest official foreign-admission unit table lists Post Modern Music for both freshman and transfer admission; this is an official music major, not a broad Creative Media covered field.",
    "Offering grain is one official department/degree structure: Post Modern Music is one offering; Vocal, Instrumental and Composition are direction keys inside the single audition/records record.",
    "professional_music/Interdisciplinary is reused for the approved reason: the official department lineage combines classical, traditional, popular and Jazz music with computer music, sound and music-content production; it is not a standard Musicology BA.",
    "The latest complete guide states 2026-2 Post Modern Music selection as 50% interview + 50% practical test, while also stating that from the 2027 academic year international undergraduate admission is planned to be 100% document review. These are cycle-specific transition statements; the final 2027 Spring guide is still required.",
    "TOPIK is kept in conditional_notes_structured. The published entry path is Korean Track; English-test minimums are not promoted to the primary requirement because Post Modern Music is not listed among English Track departments.",
    "Entry language and graduation language are separated: entry is TOPIK/alternative Korean evidence; the latest complete guide separately states TOPIK 4+ before graduation for 2026-2 entrants, excluding English-track entrants.",
    "Latest complete 2026-2 figures: Post Modern Music application fee KRW 250,000; Arts & Design tuition KRW 6,718,400 per semester. Both are explicitly marked for re-verification against the 2027 Spring guide.",
    "Ranking fields intentionally null and cost_estimate_rmb intentionally null; no FX conversion was made.",
    "底稿更新提示：如底稿把 Post Modern Music 当作普通音乐学院/现场 audition，应改为艺术·设计学院下的融合型音乐学位；2027 学年度招生方式、截止日期、费用及视频材料以新简章替换。",
  ],
};

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [school],
  fields: [field],
  degree_levels: [{
    degree_level_ref: "bm",
    degree_level_name: "Bachelor of Music",
    degree_level_name_zh: "音乐学士",
    abbreviation: "BM",
    degree_category: "Undergraduate",
    display_order: null,
    description: null,
    _note: "Official university degree directory lists Post Modern Music as 음악학사; English rendering is Bachelor of Music.",
  }],
  program_offerings: [program],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records: [
    source(URL_ADMISSION, "Kyung Hee international undergraduate admission page", "International Students Page", "The official international-admission page provides the current foreign undergraduate guide access point.") ,
    source(URL_GUIDE, "2026-2 foreign undergraduate admission guide", "Application Requirements Page", "The latest complete guide lists Post Modern Music under the College of Art and Design for freshman and transfer foreign admission, and provides language, materials, fee, tuition, schedule and assessment sections.") ,
    source(URL_GUIDE, "2026-2 Post Modern Music practical-test guidance", "Audition Requirements Page", "Post Modern Music requirements are divided into Vocal, Instrumental and Composition; video is submitted on USB and the 2026-2 selection is interview plus practical test.", refFor(), "professional_music"),
    source(URL_PROGRAM, "Department of Postmodern Music", "Official Program Page", "The department combines Western classical, Eastern traditional, popular music and Jazz, and describes computer-music, sound and music-content training.", refFor(), "professional_music"),
    source(URL_DEGREE, "Kyung Hee degree directory", "Official Program Page", "The official degree directory lists Post Modern Music under the College of Art and Design with the degree name 음악학사.", refFor(), "professional_music"),
  ],
  publishing,
  data_quality: dataQuality,
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT} (1 offering)`);
