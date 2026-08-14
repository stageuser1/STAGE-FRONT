/**
 * Chung-Ang University music undergraduate package generator.
 * Mode B, verified 2026-08-14 against the official 2027 Spring international guide.
 * Draft only; publishing remains an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-chungang-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "chungang";
const CHECKED = "2026-08-14";
const CYCLE = "2027 Spring — First Round";
const URL_MAIN = "https://www.cau.ac.kr/";
const URL_NOTICE = "https://oia.cau.ac.kr/cauoie/under/notice.do?articleNo=51004&mode=view";
const URL_GUIDE = "https://oia.cau.ac.kr/cauoie/under/notice.do?articleNo=51004&attachNo=62966&mode=download";
const URL_OIA = "https://oias.cau.ac.kr/cauoie/index.do";
const URL_MUSIC = "https://music.cau.ac.kr/";
const URL_KOREAN_MUSIC = "https://koreanmusic.cau.ac.kr/user-datas/ko/main.asp";
const URL_GLOBAL_ARTS = "https://globalarts.cau.ac.kr/";
const URL_DEGREE = "https://graduate.cau.ac.kr/_attach/gradcau/file/2025/10/FkRJQvmbFqdNmtPkIuFEyETJFB.pdf";

const lines = (...parts) => parts.join("\n");
const refFor = (o) => `${SCHOOL}_${o.key}_${o.degree}`;

const timeline = {
  milestones: [
    { label: "第一轮网上申请及材料提交", date_text: "2026-08-31 10:00 至 2026-09-18 18:00 KST" },
    { label: "第一轮艺术类实技/作品审核", date: "2026-10-10", qualifier: "School of Music Vocal/Orchestral 与传统艺术 Performing Arts 为现场实技；其他音乐单位为作品审核" },
    { label: "第一轮录取结果", date: "2026-10-30" },
    { label: "第二轮网上申请及材料提交", date_text: "2026-11-16 至 2026-11-27", qualifier: "同一 2027 春入学季的第二批时点" },
    { label: "第二轮艺术类实技/作品审核", date: "2026-12-05", qualifier: "非主轮，保留在时间线" },
    { label: "第二轮录取结果", date: "2026-12-18", qualifier: "非主轮，保留在时间线" },
    { label: "学费缴纳", date_text: "2027 年 1 月" },
    { label: "预计开学", date: "2027-03-02" },
  ],
  date_year_note: "官网 2027 Spring 国际学生简章列出 3 月入学第一轮与第二轮；主 deadline 取第一轮，第二轮保留在 timeline_structured。",
};

const fields = [
  {
    field_ref: "performance",
    field_name: "Performance",
    field_name_zh: "表演",
    field_category: "Music Performance",
    parent_field: null,
    field_group: "Professional Music",
    aliases: null,
    description: null,
    display_order: null,
    _note: "音乐学部的 Vocal/Piano/Orchestral、传统艺术学部的 Music Arts/Performing Arts 均以官方音乐招生单位下的方向要求为准；内部乐器与方向不另建 offering。",
  },
  {
    field_ref: "composition",
    field_name: "Composition",
    field_name_zh: "作曲",
    field_category: "Composition/Theory",
    parent_field: null,
    field_group: "Professional Music",
    aliases: null,
    description: null,
    display_order: null,
    _note: "School of Music Composition 按核心手艺归 Composition/Theory；合唱指挥、广播电影音乐为入学后/高年级细分方向，留在 track 层。",
  },
  {
    field_ref: "professional_music",
    field_name: "Professional Music",
    field_name_zh: "专业音乐",
    field_category: "Interdisciplinary",
    parent_field: null,
    field_group: "Professional Music",
    aliases: ["Applied Music"],
    description: null,
    display_order: null,
    _note: "沿用已批准先例：Global Arts Applied Music 的官方谱系是音乐与创意艺术/媒介的融合型学位，课程明确含作曲、编曲、表演与电脑音乐；不是纯音乐系谱系。",
  },
];

const school = {
  school_ref: SCHOOL,
  school_name: "Chung-Ang University",
  school_name_zh: "中央大学",
  city: "Anseong",
  country: "South Korea",
  region: null,
  state_province: "Gyeonggi-do",
  country_code: "KR",
  languages_of_instruction: ["Korean"],
  school_type: "University Music School",
  official_website: URL_MAIN,
  logo: null,
  card_image: null,
  intro_zh: "中央大学艺术相关本科外国人通道中的音乐学部、传统艺术学部音乐单位与全球艺术学部 Applied Music。",
  ranking_source: null,
  ranking_position: null,
  notes: "本包只收 2027 春外国人本科通道中的音乐类招生单位；研究生、非音乐艺术单位及其他专业排除。音乐学部与传统艺术学部项目位于安城 Da Vinci Campus；全球艺术学部 Applied Music 同属音乐类本科招生单位。",
};

const degreeLevels = [
  {
    degree_level_ref: "bm",
    degree_level_name: "Bachelor of Music",
    degree_level_name_zh: "音乐学士",
    abbreviation: "BM",
    degree_category: "Undergraduate",
    display_order: null,
    description: null,
    _note: "官方学位目录将 School of Music 与 Global Arts Applied Music 列为 음악학사（音乐学士）。",
  },
  {
    degree_level_ref: "bkm",
    degree_level_name: "Bachelor of Korean Music",
    degree_level_name_zh: "韩国音乐学士",
    abbreviation: "BKM",
    degree_category: "Undergraduate",
    display_order: null,
    description: null,
    _note: "官方学位目录将 School of Korean Traditional Arts 的 Music Arts 与 Performing Arts 列为 한국음악학사（韩国音乐学士）。",
  },
];

const offerings = [
  { key: "composition", degree: "bm", official: "Composition", nameZh: "作曲", field: "composition", track: "Composition; internal third-year subfields: Choral Conducting / Broadcast & Film Music / Composition", department: "College of Arts; School of Music", programUrl: URL_MUSIC, tuition: 7259000, mode: "portfolio", portfolio: true },
  { key: "vocal", degree: "bm", official: "Vocal Music", nameZh: "声乐", field: "performance", track: "Vocal Music", department: "College of Arts; School of Music", programUrl: URL_MUSIC, tuition: 7259000, mode: "live", portfolio: false },
  { key: "piano", degree: "bm", official: "Piano", nameZh: "钢琴", field: "performance", track: "Piano", department: "College of Arts; School of Music", programUrl: URL_MUSIC, tuition: 7259000, mode: "portfolio", portfolio: true },
  { key: "orchestral", degree: "bm", official: "Orchestral Instruments", nameZh: "管弦乐器", field: "performance", track: "Orchestral Instruments; instrument directions retained in repertoire_structured", department: "College of Arts; School of Music", programUrl: URL_MUSIC, tuition: 7259000, mode: "live", portfolio: false },
  { key: "music_arts", degree: "bkm", official: "Music Arts", nameZh: "音乐艺术", field: "performance", track: "Korean traditional instrumental accompaniment / voice / composition & applied music / conducting / musicology & arts management / percussion accompaniment", department: "College of Arts; School of Korean Traditional Arts", programUrl: URL_KOREAN_MUSIC, tuition: 7259000, mode: "portfolio", portfolio: true },
  { key: "performing_arts", degree: "bkm", official: "Performing Arts", nameZh: "演艺艺术", field: "performance", track: "Music Theatre / Percussion Performing", department: "College of Arts; School of Korean Traditional Arts", programUrl: URL_KOREAN_MUSIC, tuition: 7259000, mode: "live", portfolio: false },
  { key: "applied_music", degree: "bm", official: "Applied Music", nameZh: "实用音乐", field: "professional_music", track: "Applied Music", department: "College of Arts; School of Global Arts", programUrl: URL_GLOBAL_ARTS, tuition: 7039000, mode: "portfolio", portfolio: true },
];

const commonMaterials = [
  "在线申请表",
  "高中毕业/预毕业证明及高中成绩单",
  "本人护照及父母身份证明/护照",
  "学生与父母关系证明",
  "有效的韩语能力证明；不满足者可按 preliminary admission 规则申请",
  "中国学历按简章提交相应学历认证、翻译公证与认证材料",
];

const repertoire = {
  composition: {
    official_direction_name: "Composition",
    requirements: [
      "两首自由形式原创作品",
      "一首弦乐四重奏作品，共三首作品；提交 PDF 乐谱及 WAV/MP3 音频",
      "亲自演奏提交乐谱中的一首作品，提交 MOV/MP4 视频",
    ],
    evaluation: "Portfolio 80% + performance video 20%",
    notes: "作品集随申请材料提交；提交后不再另行实技考试。作曲专业内部三年级细分方向留在 track，不新建 offering。",
  },
  vocal: {
    official_direction_name: "Vocal Music",
    requirements: [
      "指定曲：一首德语艺术歌曲，作曲家须为 Mozart、Schubert、Schumann、Brahms、Strauss 或 Wolf",
      "自由曲：一首意大利语艺术歌曲或歌剧咏叹调，须用原语言与原调演唱；歌剧咏叹调需包含宣叙调，不接受音乐会咏叹调",
    ],
    evaluation: "In-person practical test 100%",
    notes: "官方要求为现场实技，不改写成录像作品集。",
  },
  piano: {
    official_direction_name: "Piano",
    requirements: [
      "Performance 1：L. v. Beethoven 钢琴奏鸣曲的一个快板乐章",
      "Performance 2：F. Chopin、F. Liszt 或 S. Rachmaninoff 的一首练习曲",
    ],
    evaluation: "Portfolio review: each performance video 50% + 50%",
    notes: "视频以 MOV/MP4 提交至远程评审；作品集随申请材料提交，提交后不再另行实技考试。",
  },
  orchestral: {
    official_direction_name: "Orchestral Instruments",
    directions: {
      orchestral_instruments: "任选一首约 10 分钟作品，须同时包含慢段与快段，并完整演奏快、慢乐章；现场实技 100%",
      percussion: "小鼓与马林巴两种乐器均须演奏，约 10 分钟；不得携带个人乐器",
    },
    evaluation: "In-person practical test 100%",
  },
  music_arts: {
    official_direction_name: "Music Arts",
    directions: {
      instrumental_accompaniment: "伽倻琴、玄琴、奚琴、牙筝、大笒、笛、乐器伴奏方向：从 sanjo、当代创作或正乐中任选一首约 10 分钟作品；sanjo 须包含全部节拍循环",
      voice: "任选一首声乐自由曲，约 5 分钟，无伴奏；方向包括 pansori、伽倻琴并唱、民歌、正歌",
      composition_applied_music: "提交个人学习/演出经历及三首原创作品的 PDF 乐谱与 WAV/MP3 音频；另提交任一乐器（含声乐）自由曲视频，MOV/MP4",
      conducting: "提交一首约 10 分钟自由曲的指挥视频；可用钢琴或一件/多件韩国传统乐器伴奏；原则上须背谱，单镜头不剪辑且全身可见",
      musicology_arts_management: "围绕韩国音乐/艺术管理自选题写约 25 页论文，含引言、正文、结论，PDF 提交",
      percussion_accompaniment: "任选一件乐器演奏一首约 5 分钟自由曲，无伴奏",
    },
    evaluation: "Portfolio review 100%",
    notes: "官方把上述方向置于一个 Music Arts 招生单位下；不拆为多个 offering。",
  },
  performing_arts: {
    official_direction_name: "Performing Arts",
    directions: {
      music_theatre: "综合表演，须含舞蹈、歌唱与对白，5 分钟以内；伴奏仅可使用 USB 中的 MP3；另任选一首 pansori、民歌、当代韩国传统歌曲或音乐剧曲目",
      percussion_performing: "任选一件乐器演奏一首约 5 分钟自由曲，无伴奏",
    },
    evaluation: "In-person practical test 100%",
    notes: "该单位的官方学位谱系是 School of Korean Traditional Arts 的 Bachelor of Korean Music；音乐剧/打击乐方向不是戏剧学院项目。",
  },
  applied_music: {
    official_direction_name: "Applied Music",
    portfolio: [
      "乐器演奏视频：本人演奏鼓、贝斯、吉他、钢琴、弦乐器或铜管乐器",
      "声乐视频：本人演唱；不接受 Auto-Tune",
      "作曲/编曲或作品制作过程视频",
    ],
    file_formats: "视频 MOV/MP4，音频 MP3；每个视频约 2 分钟",
    evaluation: "Portfolio review 100%",
    notes: "Global Arts 官方系所页明确把 Applied Music 定义为包含作曲、编曲、声乐、器乐、电脑音乐的实用音乐专业；因而沿用 professional_music/Interdisciplinary。",
  },
};

const programFor = (o) => ({
  program_offering_ref: refFor(o),
  school_ref: SCHOOL,
  field_ref: o.field,
  degree_level_ref: o.degree,
  track_or_concentration: o.track,
  official_program_name: `Chung-Ang University ${o.department} — ${o.official}`,
  program_name_zh: `中央大学${o.department.includes("School of Music") ? "音乐学部" : o.department.includes("Korean Traditional") ? "传统艺术学部" : "全球艺术学部"} ${o.nameZh}`,
  department: o.department,
  duration_years: null,
  language_of_instruction: ["Korean"],
  program_url: o.programUrl,
  application_url: URL_OIA,
  audition_url: URL_GUIDE,
  international_url: URL_NOTICE,
  card_summary_zh: `${o.official} 为 2027 春中央大学外国人本科招生单位；${o.mode === "live" ? "官方要求现场实技。" : "官方要求作品集/录像远程评审。"}`,
  degree_system: o.degree === "bkm" ? "Bachelor of Korean Music（한국음악학사）" : "Bachelor of Music（음악학사）",
  tuition_currency: "KRW",
  tuition_amount_min: o.tuition,
  tuition_amount_max: o.tuition,
  tuition_period: "per_semester",
  funding_policy: `官方 2027 春简章按 2026 学年参考标准列出${o.degree === "bkm" ? "School of Korean Traditional Arts" : o.key === "applied_music" ? "School of Global Arts" : "School of Music"}学费 KRW ${o.tuition.toLocaleString("en-US")}/semester；2027 学年学费尚未确定。`,
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "官方 2027 Spring 外国人招生单位表明确列出该单位；本包不把校内乐器/方向拆为新 offering。",
    o.key === "composition" ? "作曲专业官方网站说明三年级再细分为合唱指挥、广播电影音乐与作曲；这是入学后/高年级结构，保留在 track_or_concentration。" : "",
    o.key === "performing_arts" ? "虽然招生单位名称为 Performing Arts，但官方学校页与学位目录将其置于 School of Korean Traditional Arts 并授予 Bachelor of Korean Music；因此按音乐本科收录，不按戏剧学院项目处理。" : "",
    "cost_estimate_rmb 保持 null；韩国线保留 KRW 原币；排名字段保持 null。",
  ),
});

const applicationFor = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-09-18",
  timeline_structured: timeline,
  deadline_notes: "内地申请人使用中央大学纯外国人本科通道；第一轮主截止日为 2026-09-18 18:00 KST，第二轮同一春季入学季的时点保留在 timeline_structured。",
  application_fee: 200000,
  application_fee_currency: "KRW",
  required_materials: [
    ...commonMaterials,
    o.portfolio ? "该招生单位作品集/技能视频/音频，按方向要求提交" : "该招生单位现场实技考试材料，按方向要求准备",
  ],
  transcript_requirements: "高中三年成绩单；若为插班申请，还需提交大学在读/毕业证明及大学成绩单，按官方翻译公证与认证要求办理。",
  recommendation_letters: null,
  resume_required: o.key === "music_arts" ? "Required" : "Unknown",
  essay_required: o.key === "music_arts" ? "Required" : "Optional",
  portfolio_required: o.portfolio ? "Required" : "Not Required",
  english_language_tests: null,
  toefl_minimum: null,
  ielts_minimum: null,
  duolingo_minimum: null,
  english_waiver_policy: "除全英授课的 Game Convergence 等指定单位外，2027 春简章未将英语成绩列为本包音乐单位的入学硬门槛；音乐单位按韩语要求记录。",
  english_requirement_status: "Not Required",
  international_applicant_notes: "申请人及父母须在申请日持外国国籍；本包对应纯外国人本科招生通道。艺术学院申请人只能作为第一志愿，不能用第二志愿机制替代。",
  conditional_notes: lines(
    "韩语主口径：未满足韩语要求者仍可按 Preliminary Admission System 申请；满足学术与资格审查者先获 preliminary admission，须在两年内达到本科韩语要求并重新申请同一招生单位才能最终录取。",
    o.key === "applied_music" ? "Applied Music 属 Global Arts，2027 春简章对 Global School of Arts 适用 TOPIK 3 级以上；未满足者仍可按 preliminary admission 规则申请。" : "2027 春简章列出的本科韩语要求为 TOPIK 4 级以上，或中央大学国际教育院韩国语课程 4 级以上；韩国高中完整三年毕业者有官网规定的免除条件。",
    o.key === "composition" || o.key === "piano" || o.key === "music_arts" || o.key === "applied_music" ? "该单位的艺术评估是作品集/录像评审，不把录像提交误写成现场 audition。" : "该单位的艺术评估为现场实技，按官方方向要求记录。",
  ),
  conditional_notes_structured: {
    korean_entry: {
      standard: o.key === "applied_music" ? "TOPIK 3+ for Global School of Arts / Applied Music; see the guide's unit-specific Korean standard" : "TOPIK 4+ or CAU Institute of International Education Korean Language Program Level 4+",
      preliminary_admission: "Applicants below the Korean threshold may receive preliminary admission and must meet the threshold and reapply to the same admission unit within two years.",
    },
    application_rhythm: { first_round: "2026-08-31 to 2026-09-18", second_round: "2026-11-16 to 2026-11-27", main_round: "First round for March 2027 admission" },
    audition_semantics: { live: o.mode === "live", portfolio: o.portfolio },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "Application fee follows the College of Arts rule: KRW 200,000 for first choice; Arts applicants may apply only as first choice, so no second-choice fee is recorded for these offerings.",
});

const auditionFor = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: o.portfolio ? "Yes" : "No",
  prescreening_deadline: o.portfolio ? "2026-09-18" : null,
  audition_required: o.mode === "live" ? "Yes" : "No",
  audition_format: o.mode === "live" ? "Live Only" : "Recorded Only",
  repertoire_summary: `官方 2027 春简章的 ${o.nameZh}（${o.official}）要求按方向记录；${o.mode === "live" ? "评估为现场实技。" : "评估为作品集/录像远程评审，不是现场实技。"}`,
  repertoire_structured: { [o.official]: repertoire[o.key] },
  video_requirements: o.portfolio ? "按方向提交 MOV/MP4 视频或 WAV/MP3 音频；作品集随申请材料提交，提交后不再另行实技考试。" : null,
  file_format_requirements: o.portfolio ? "官方方向要求的视频使用 MOV/MP4，音频使用 WAV/MP3；具体方向以 2027 简章为准。" : null,
  accompaniment_requirements: null,
  interview_or_callback_requirements: null,
  special_notes: lines(
    "单条 audition/records 记录按官方招生单位承载曲目；内部乐器/方向只在 repertoire_structured 中分键。",
    o.key === "performing_arts" ? "Music Theatre 与 Percussion Performing 属同一 Performing Arts 招生单位，且官方学位谱系为 Bachelor of Korean Music；不拆 offering。" : "",
    o.key === "composition" ? "Composition 的合唱指挥与广播电影音乐是官方网站说明的三年级细分方向，不是入学时新的招生单位。" : "",
  ),
  conditional_notes: o.portfolio ? "作品集/录像评审不是现场 audition；作品材料虽有演奏内容，audition_required 仍为 No。" : "官方要求现场实技考试，audition_required 为 Yes。",
  conditional_notes_structured: { official_evaluation: o.mode === "live" ? "Document Evaluation + In-Person Practical Test" : "Document Evaluation + Portfolio Review", current_cycle: true },
  review_status: "Needs Review",
  notes: "曲目与材料要求逐招生单位核实，不将其他学校或国内普通招生路线的要求外推到本外国人通道。",
});

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

const programOffers = offerings.map(programFor);
const applications = offerings.map(applicationFor);
const auditions = offerings.map(auditionFor);

const publishing = {
  programs: offerings.map((o) => ({
    program_offering_ref: refFor(o),
    slug: `${o.key}-${o.degree}`,
    answer_sentence_zh: `中央大学${o.nameZh}（${o.official}；${o.degree === "bkm" ? "韩国音乐学士" : "音乐学士"}）：2027 春外国人本科通道可申请，${o.mode === "live" ? "官方要求现场实技。" : "官方以作品集/录像评审。"}`,
    field_tiers: { primary: o.field },
    cost_estimate_rmb: null,
    badges: [{ label: `Chung-Ang ${o.official}`, type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })),
};

const dataQuality = {
  overall_confidence: "High",
  missing_critical_fields: [
    "2027 academic-year tuition has not yet been determined; the package records the official 2026 academic-year reference figures with an explicit note.",
    "Program duration is not restated in the foreign guide; duration_years remains null rather than inferred.",
  ],
  needs_human_review: true,
  review_notes: [
    "Mode A existence passed: the 2027 Spring foreign guide lists School of Music Composition, Vocal Music, Piano and Orchestral Instruments; School of Korean Traditional Arts Music Arts and Performing Arts; and School of Global Arts Applied Music.",
    "Offering grain follows the official international admission-unit table: seven music-related offerings. Internal instruments and subdirections remain inside repertoire_structured. Composition's third-year Choral Conducting/Broadcast & Film Music/Composition split is not an entry-level offering split.",
    "Music School Composition is Composition/Theory; Vocal/Piano/Orchestral and Korean Traditional Arts music units are Music Performance. Applied Music reuses professional_music/Interdisciplinary only because the official Global Arts page describes composition, arrangement, vocal, instrumental and computer-music training within a creative-arts school lineage.",
    "Performing Arts is included only because the official School of Korean Traditional Arts page places Music Theatre and Percussion Performing inside that school and the official degree directory assigns it Bachelor of Korean Music; it is not a drama-school musical-theatre record.",
    "2027 Spring first-round deadline is 2026-09-18 18:00 KST; second-round dates remain in timeline_structured. Arts applicants may apply only as first choice; application fee is KRW 200,000.",
    "Live/portfolio semantics were separated by official evaluation method: Vocal, Orchestral and Performing Arts are live practical tests; Composition, Piano, Music Arts and Applied Music are portfolio/recorded review and are not labelled live audition.",
    "TOPIK is recorded in conditional_notes_structured; preliminary admission is separately described. The official guide's undergraduate Korean requirement is TOPIK 4+ or CAU language-program Level 4+, with a two-year reapplication path for preliminary admits.",
    "2026 academic-year reference tuition: School of Music and School of Korean Traditional Arts KRW 7,259,000 per semester; School of Global Arts KRW 7,039,000 per semester. 2027 tuition is not yet determined. cost_estimate_rmb and ranking fields remain null.",
    "底稿更新提示：如底稿只列 School of Music，需补充 2027 外国人通道的 Traditional Arts Music Arts/Performing Arts 与 Global Arts Applied Music；同时以本次官方 2027 春日期、韩语规则、评估方式及 KRW 参考学费替换旧值。",
  ],
};

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [school],
  fields,
  degree_levels: degreeLevels,
  program_offerings: programOffers,
  application_requirements: applications,
  audition_requirements: auditions,
  source_records: [
    source(URL_NOTICE, "2027 Spring first-round foreign undergraduate admission notice", "International Students Page", "The official notice sets the online application and document-submission period as 2026-08-31 10:00 to 2026-09-18 18:00 KST and links Korean/English/Chinese guides."),
    source(URL_GUIDE, "2027 Spring Admissions Guide for International Students", "Application Requirements Page", "The official guide lists the music-related admission units, eligibility, evaluation methods, schedule, fees, documents, Korean-language requirements and tuition table."),
    source(URL_GUIDE, "2027 School of Music and Korean Traditional Arts practical requirements", "Audition Requirements Page", "The guide distinguishes School of Music Composition/Vocal/Piano/Orchestral Instruments and School of Korean Traditional Arts Music Arts/Performing Arts, with direction-specific practical or portfolio requirements."),
    source(URL_GUIDE, "2027 Global Arts Applied Music portfolio requirements", "Audition Requirements Page", "The guide lists Applied Music under School of Global Arts and requires portfolio submissions for instrument, vocal and composition/arrangement work."),
    source(URL_MUSIC, "Chung-Ang Faculty of Music", "Official Program Page", "The official faculty site lists Orchestral, Vocal, Composition and Piano majors; the Composition page identifies later Choral Conducting and Broadcast/Film Music subfields."),
    source(URL_KOREAN_MUSIC, "Chung-Ang School of Korean Traditional Arts", "Official Program Page", "The official school page describes Music Arts and Performing Arts, including traditional instrumental, composition, conducting, voice, music theatre and percussion directions."),
    source(URL_GLOBAL_ARTS, "Chung-Ang School of Global Arts", "Official Program Page", "The official school page describes Applied Music as including composition, arrangement, vocal, instrumental and computer music, with a global creative-arts orientation."),
    source(URL_DEGREE, "Chung-Ang academic degree directory", "Official Program Page", "The official degree directory lists School of Music and Global Arts Applied Music as 음악학사 and School of Korean Traditional Arts Music Arts/Performing Arts as 한국음악학사."),
    ...offerings.map((o) => source(URL_GUIDE, `2027 foreign admission unit — ${o.official}`, "Official Program Page", `The 2027 foreign guide lists ${o.department} ${o.official} as an undergraduate admission unit.`, refFor(o), o.field)),
  ],
  publishing,
  data_quality: dataQuality,
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT} (${offerings.length} offerings)`);
