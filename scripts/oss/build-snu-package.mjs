/**
 * Seoul National University College of Music undergraduate canonical package.
 * Mode B, verified 2026-08-13 against Spring 2027 foreign-admissions materials.
 * Draft only; publishing is an operator action.
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-snu-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "snu";
const CHECKED = "2026-08-13";
const CYCLE = "2027/28";
const URL_MAIN = "https://en.snu.ac.kr/";
const URL_ADMISSION = "https://admission.snu.ac.kr/international/undergraduate/spring/guide";
const URL_GUIDE = "https://admission.snu.ac.kr/webdata/admission/files/2027Spring_under.pdf";
const URL_MUSIC = "https://music.snu.ac.kr/";
const URL_RECORDS = "https://music.snu.ac.kr/notice/13956?page=4";
const URL_MUSICOLOGY = "https://music.snu.ac.kr/content/department_m";
const URL_KOREAN_MUSIC = "https://music.snu.ac.kr/content/department_kt";

const lines = (...parts) => parts.join("\n");

const timeline = {
  milestones: [
    { label: "在线申请", date_text: "2026-07-06 10:00 至 2026-07-09 17:00 KST" },
    { label: "在线推荐信提交", date_text: "2026-07-06 10:00 至 2026-07-10 17:00 KST" },
    { label: "音乐大学成果物/作品集提交", date_text: "2026-07-06 10:00 至 2026-07-10 17:00 KST；邮寄材料 7 月 10 日前以邮戳为准" },
    { label: "预录取/候补录取结果", date: "2026-10-16", qualifier: "17:00 KST 或之后" },
    { label: "预录取后的原件提交", date_text: "2026-10-16 17:00 至 2026-11-03 17:00 KST" },
    { label: "最终录取结果", date: "2026-11-20", qualifier: "17:00 KST 或之后" },
    { label: "注册", date_text: "2026 年 12 月至 2027 年 2 月" },
    { label: "适用学生的韩语评估", date_text: "2027 年 2 月", conditional: "适用时" },
  ],
  date_year_note: "当前指南对应 Spring 2027 / 2027 学年度前期外国本科招生周期。指南未公布第二个三月/九月申请季；本周期为三月入学季。",
};

const commonMaterials = [
  "首尔大学国际本科在线申请",
  "个人陈述与学习计划",
  "教师在线推荐信",
  "韩语或英语能力证明",
  "高中完整成绩单及毕业/预毕业证明",
  "申请人及父母国籍、亲属关系证明",
  "学业标准化考试成绩（如适用）",
  "音乐大学成果物/作品集及签署声明",
];

const repertoire = {
  Vocal_Music: {
    official_direction_name: "Vocal Music / 성악과",
    recorded_records: ["One Italian art song or Italian opera aria", "One German Lied"],
    weights: [50, 50],
    notes: "Both works are submitted as records of achievement; this foreign route does not use the domestic live practical-exam format.",
  },
  Composition: {
    official_direction_name: "Composition major within Composition Department / 작곡전공",
    portfolio: "At least three works with different instrumentations; all works submitted in score.",
    notes: "This is a portfolio record, not the domestic practical-exam repertoire list.",
  },
  Conducting: {
    official_direction_name: "Conducting major within Composition Department / 지휘전공",
    video: ["C.M.v. Weber Oberon Overture J.306", "L.v. Beethoven Symphony No.2 in D major Op.36, first movement"],
    notes: "Submit videos showing the applicant personally conducting both works, including audio; submit on USB.",
  },
  Musicology: {
    official_direction_name: "Musicology / 음악학과",
    recorded_records: ["Assigned piano: Debussy, L’isle joyeuse, mm.1–28 to the first note of measure 28", "One free piece: one western-instrument work or one vocal art song/opera aria in original language and key", "One essay or report in Musicology"],
    weights: [30, 30, 40],
    notes: "The two performance pieces are memorised; the current guide says any edition may be used.",
  },
  Piano: {
    official_direction_name: "Piano / 피아노과",
    recorded_records: ["One fast movement from a Beethoven piano sonata", "One significant Romantic composition, or one sonata movement"],
    weights: [50, 50],
    notes: "The current foreign records guidance is submitted in place of a live audition; the works are the foreign-route guidance, not domestic admission repertoire.",
  },
  Strings: {
    official_direction_name: "Orchestral Music — Strings / 관현악과 현악",
    directions: {
      Violin: ["One slow and one fast movement from one of Bach Solo Sonatas Nos.1–3", "One complete Romantic concerto"],
      Viola: ["Prelude and Gigue from one of Bach Six Suites for Unaccompanied Cello Nos.1–6", "One complete concerto: Walton, Bartók or Hindemith Der Schwanendreher"],
      Cello: ["Prelude and Gigue from one of Bach Six Suites for Unaccompanied Cello Nos.4–6", "One complete concerto"],
      "Double Bass": ["Free programme, minimum 30 minutes"],
      Harp: ["Free programme, minimum 30 minutes"],
      "Classical Guitar": ["Free programme, minimum 30 minutes"],
    },
    notes: "The foreign guide's recruitment unit is Orchestral Music; the instrument directions are retained under this single offering.",
  },
  Woodwind_Brass_Percussion: {
    official_direction_name: "Orchestral Music — Woodwind / Brass / Percussion / 관현악과 관악",
    directions: {
      Flute: ["S.K. Elert Sonata Appassionata for Flute Solo in F-sharp minor Op.140", "Mozart Flute Concerto in G major, movements 2 and 3"],
      Oboe: ["P. Sancan Sonatine", "J.S. Bach Partita BWV 1013, movements 1 and 2"],
      Clarinet: ["B. Kovács Hommage à N. Paganini", "R. Schumann Fantasy Pieces"],
      Bassoon: ["H. Dutilleux Sarabande et Cortège"],
      Horn: ["R. Strauss Horn Concerto No.1 Op.11 in E-flat major"],
      Trumpet: ["A. Honegger INTRADA pour Trompette en ut et Piano, Salabert edition"],
      "Tenor Trombone": ["G. Jacob Concerto for Trombone and Piano"],
      "Bass Trombone": ["E. Ewazen Concerto for Bass Trombone"],
      Saxophone: ["E. Denisov Sonata for Alto Saxophone and Piano"],
      Tuba: ["W. Hartley Suite for Unaccompanied Tuba"],
      Percussion: ["Snare drum: Delecluse Test-Claire, Delecluse Twelve Studies No.9, Rimsky-Korsakov Sheherazade movements 3–4", "Marimba: Creston Concertino movement 3, Golinski Luminosity No.2", "Timpani: Delecluse 30 Studies Vol.3 No.24, Beethoven Symphony No.9 movements 1–2"],
    },
    notes: "The official foreign recruitment unit is Orchestral Music; instrument directions remain nested here. Underlined works may be read from the score; others are memorised and played in listed order.",
  },
  Korean_Traditional_Music: {
    official_direction_name: "Korean Music / 국악과",
    directions: {
      Gayageum: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Geomungo: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Haegeum: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Piri: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Daegeum: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Ajaeng: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      Percussion: "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
      "Korean Music Theory": "Portfolio, freely organised with research results or similar; include a Korean self-introduction video of more than one minute.",
      "Korean Music Composition": "Portfolio with at least one work; include a Korean self-introduction video of more than one minute.",
      "Korean Vocal Music": "Free Korean traditional-music piece up to 10 minutes; after the performance, a Korean self-introduction of more than one minute; portfolio of activity evidence.",
    },
    notes: "The College of Music notice adds an approximately 10-minute Zoom interview in Korean for Korean Music applicants to check language ability and major aptitude; this is recorded separately from the records submission and is not labelled an audition.",
  },
};

const offerings = [
  { key: "vocal", department: "Vocal Music", name_zh: "声乐系", field_ref: "performance", track: "Vocal Music", repertoire_key: "Vocal_Music" },
  { key: "composition", department: "Composition", name_zh: "作曲系", field_ref: "composition", track: "Composition; Conducting (major choice after admission under College regulations)", repertoire_key: "Composition", extra: { Conducting: repertoire.Conducting } },
  { key: "musicology", department: "Musicology", name_zh: "音乐学系", field_ref: "music", track: "Musicology", repertoire_key: "Musicology" },
  { key: "piano", department: "Piano", name_zh: "钢琴系", field_ref: "performance", track: "Piano", repertoire_key: "Piano" },
  { key: "orchestral", department: "Orchestral Music", name_zh: "管弦乐系", field_ref: "performance", track: "Strings; Woodwind/Brass/Percussion", repertoire_key: "Strings", extra: { Woodwind_Brass_Percussion: repertoire.Woodwind_Brass_Percussion } },
  { key: "korean_music", department: "Korean Traditional Music", name_zh: "国乐系", field_ref: "performance", track: "Korean Traditional Music", repertoire_key: "Korean_Traditional_Music" },
];

const refFor = (o) => `${SCHOOL}_${o.key}_bm`;

const fields = [
  { field_ref: "composition", field_name: "Composition", field_name_zh: "作曲", field_category: "Composition/Theory", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field; the foreign recruitment unit is Composition and its records guidance includes a Conducting major." },
  { field_ref: "music", field_name: "Music", field_name_zh: "音乐", field_category: "Musicology", parent_field: null, field_group: "University Music", aliases: null, description: null, display_order: null, _note: "Operator-approved comprehensive-university BA/musicology precedent; SNU Musicology is an academic College of Music department, not a performance offering." },
  { field_ref: "performance", field_name: "Performance", field_name_zh: "演奏/演唱", field_category: "Music Performance", parent_field: null, field_group: "Professional Music", aliases: null, description: null, display_order: null, _note: "Existing field; Vocal, Piano, Orchestral and Korean Traditional Music are performance-centred recruitment units." },
];

const degreeLevels = [{
  degree_level_ref: "bm",
  degree_level_name: "Bachelor of Music",
  degree_level_name_zh: "音乐学士",
  abbreviation: "BM",
  degree_category: "Undergraduate",
  display_order: null,
  description: null,
  _note: "The current foreign guide calls these undergraduate College of Music recruitment units and does not repeat an English degree-title line; BM is the existing project degree vocabulary for SNU College of Music undergraduate offerings, retained with a review note.",
}];

const school = {
  school_ref: SCHOOL,
  school_name: "Seoul National University",
  school_name_zh: "首尔大学",
  city: "Seoul",
  country: "South Korea",
  region: null,
  state_province: null,
  country_code: "KR",
  languages_of_instruction: ["Korean"],
  school_type: "University Music School",
  official_website: URL_MAIN,
  logo: null,
  card_image: null,
  intro_zh: "首尔大学音乐大学外国人本科特别招生：声乐、作曲、音乐学、钢琴、管弦乐与国乐六个官方招生单位；音乐专业以成果物/作品集替代现场实技，国乐另有韩语线上面试。",
  ranking_source: null,
  ranking_position: null,
  notes: "本包只收 Spring 2027 全球人才特别招生本科的 College of Music 六个官方 모집단위；研究生、韩国国内 수시/정시、非音乐学院项目排除。外国人通道的官方单位是六个 department，内部乐器/专修方向留在 track 与 repertoire_structured，不另造 offering。排名字段按韩国线裁决留 null。",
};

const languageNotes = lines(
  "首尔大学要求提交韩语或英语能力证明。当前指南列出 TOPIK/TOPIK IBT 3 级以上或韩国大学语学院 4 级以上；英语路径为 TOEFL iBT 80（2026-01-21 起新计分制为 4.0）、IELTS Academic 6.0 或 TEPS 269。",
  "按韩国线先例，TOPIK 保留在 conditional_notes_structured，不提升到英语主字段。这是入学语言要求；当前未说明单独的毕业语言门槛。",
  "部分被选中的学生可能在 2027 年 2 月参加韩语评估，结果可能影响课程修读；该入学后评估不是毕业语言要求。",
);

const makeProgram = (o) => ({
  program_offering_ref: refFor(o),
  school_ref: SCHOOL,
  field_ref: o.field_ref,
  degree_level_ref: "bm",
  track_or_concentration: o.track,
  official_program_name: `SNU College of Music Undergraduate Program — ${o.department}`,
  program_name_zh: `首尔大学音乐大学本科（${o.name_zh}）`,
  department: `College of Music; Department of ${o.department}`,
  duration_years: null,
  language_of_instruction: ["Korean"],
  program_url: o.department === "Musicology" ? URL_MUSICOLOGY : o.department === "Korean Traditional Music" ? URL_KOREAN_MUSIC : URL_MUSIC,
  application_url: URL_ADMISSION,
  audition_url: URL_RECORDS,
  international_url: URL_ADMISSION,
  card_summary_zh: `首尔大学音乐大学四年制本科层级招生单位（官网当前外国人简章未在该页重复年限），${o.department}通过外国人特别招生提交成果物/作品集；${o.department === "Korean Traditional Music" ? "另有韩语线上面试。" : "不实施现场实技。"}`,
  degree_system: "College of Music undergraduate degree; current foreign guide does not restate the English degree-title line",
  tuition_currency: "KRW",
  tuition_amount_min: 3916000,
  tuition_amount_max: 3916000,
  tuition_period: "per_semester",
  funding_policy: "SNU 2027 foreign guide appendix lists 2026 academic-year College of Music tuition as KRW 3,916,000 per semester; it notes that the amount may change.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    `外国人指南将 ${o.department} 列为音乐大学六个官方招生单位之一。`,
    o.key === "composition" ? "外国人申请表将 Composition 作为一个招生单位；音乐大学成果物指南另行区分 Composition 与 Conducting 方向。Conducting 保留为 track/曲目键，不新增第七条 offering，因为官方外国人招生单位仍是 Composition，入学后方向选择受音乐大学规定约束。" : "器乐/专修方向仅保留在 track_or_concentration 与曲目/作品集结构中，遵循外国人官方招生单位粒度。",
    o.key === "korean_music" ? "国乐是唯一有额外官方通知的招生单位：约 10 分钟韩语 Zoom 面试；不将其改写为 audition_required=Yes。" : "当前外国人通道不举行音乐大学实技考试，由成果物/作品集替代。",
    languageNotes,
    "Tuition is the official 2026 academic-year semester figure in the 2027 guide; it is not multiplied into an annual estimate and cost_estimate_rmb remains null.",
  ),
});

const makeApplication = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-07-09",
  timeline_structured: timeline,
  deadline_notes: "内地申请人使用外国人特别招生通道时，主截止时间为 2026-07-09 17:00 KST；音乐大学成果物/作品集截止时间为 2026-07-10 17:00 KST，另保留在时间线中。",
  application_fee: 70000,
  application_fee_currency: "KRW",
  required_materials: [...commonMaterials, o.key === "composition" ? "作曲作品集；指挥方向两段指定视频" : o.key === "korean_music" ? "国乐方向成果物/作品集；韩语自我介绍材料；韩语线上面试（如收到通知）" : "招生单位/方向要求的成果物、录像或作品集"],
  transcript_requirements: "高中完整学业记录及毕业/预毕业证明；中国内地申请人还须按当前指南提交相应高中学历的 CHSI 学历验证报告。",
  recommendation_letters: 1,
  resume_required: "Unknown",
  essay_required: "Required",
  portfolio_required: "Required",
  english_language_tests: ["TOEFL iBT", "IELTS Academic", "TEPS"],
  toefl_minimum: 80,
  ielts_minimum: 6,
  duolingo_minimum: null,
  english_waiver_policy: "语言证明可提交韩语或英语；当前指南还接受标准化考试成绩，或完整高中阶段以韩语/英语授课的官方证明。",
  english_requirement_status: "Conditional",
  international_applicant_notes: "本记录对应首尔大学 글로벌인재특별전형（全球人才特别招生）外国人通道。Type I 为申请人与父母均为外国国籍；Type II 为申请人完成全部小学至高中同等教育于海外。当前指南将音乐大学六个招生单位列入该通道。",
  conditional_notes: lines(
    "内地申请人使用外国人特别招生通道；当前指南未为音乐大学公布单独的高考分数线。主要学业门槛是高中毕业/同等学历，以及该通道要求的国籍或海外就学证明。",
    languageNotes,
    "The College of Music's foreign route does not use the domestic live practical-exam format: the guide says the practical exam is not held and is replaced by records/portfolio submission. Do not merge the current domestic 수시/정시 repertoire pages into this application record.",
  ),
  conditional_notes_structured: {
    foreign_route: { type_I: "Applicant and both parents are foreign nationals", type_II: "Entire equivalent primary/middle/high-school curriculum completed abroad" },
    language_entry: { topik: "TOPIK 或 TOPIK IBT 3 级以上", korean_language_institute: "韩国大学语学院 4 级以上", toefl_ibt: "80 以上；2026-01-21 起新计分制为 4.0 以上", ielts_academic: 6, teps: 269, alternatives: "完整韩语/英语授课经历官方证明或标准化考试语言成绩" },
    language_after_admission: { assessment: "2027 年 2 月对适用学生进行韩语评估", consequence: "可能影响课程修读", graduation_requirement: "当前指南未说明" },
    records_route: { practical_exam: false, replacement: "直接向音乐大学提交成果物/作品集", korean_music_interview: "约 10 分钟韩语面试，单独通知" },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "申请费为 KRW 70,000；当前未显示外国人/非本地生单独费用。音乐大学成果物截止时间比在线申请截止时间晚一天，不替代 application_deadline。",
});

const makeAudition = (o) => ({
  program_offering_ref: refFor(o),
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Yes",
  prescreening_deadline: "2026-07-10",
  audition_required: "No",
  audition_format: "Recorded Only",
  repertoire_summary: "外国人通道不举行现场实技考试，由提交成果物/作品集替代；声乐、作曲/指挥、音乐学、钢琴、管弦乐及国乐的方向要求分别保留在曲目/作品集结构中。",
  repertoire_structured: { [o.repertoire_key]: repertoire[o.repertoire_key], ...(o.extra || {}) },
  video_requirements: "音乐大学成果物通过 USB 提交；学院通知要求所有视频以 USB 形式提交。指挥与国乐方向的具体视频要求按方向键记录。",
  file_format_requirements: "当前中央指南接受规定大小范围内的 JPG、PNG 或 PDF 扫描件；音乐大学成果物通知要求视频记录通过 USB 提交。",
  accompaniment_requirements: null,
  interview_or_callback_requirements: o.key === "korean_music" ? "国乐申请人须参加约 10 分钟韩语 Zoom 面试，用于核查语言能力与专业适应度；时间另行通知。" : null,
  special_notes: lines(
    "这是外国人通道的成果物/作品集评估，不是韩国国内招生的现场实技考试；即使要求音乐录像或作品集，audition_required 仍为 No。",
    o.key === "composition" ? "Composition 与 Conducting 是单一 Composition 外国人招生单位下的两个方向键；Conducting 键保留两段指定指挥视频。" : "方向要求取自 2027 音乐大学外国人材料，不混入韩国国内招生曲目。",
    o.key === "korean_music" ? "韩语自我介绍属于国乐成果物要求；韩语 Zoom 面试用于语言/专业适应度核查，不是现场试音。" : "当前外国人通道未说明额外回访或现场试音。",
  ),
  conditional_notes: "成果物/作品集是音乐大学外国人通道的必交材料，但当前指南明确不举行实技考试；不得与韩国国内招生的试音术语混写。",
  conditional_notes_structured: { foreign_route: "成果物/作品集", live_audition: false, korean_music_interview: o.key === "korean_music" ? "是，约 10 分钟韩语面试" : "未找到单独说明" },
  review_status: "Needs Review",
  notes: "One audition/records record per official foreign recruitment unit; the direction keys preserve the College of Music attachment structure without creating extra offerings.",
});

const source = (url, title, type, offeringRef, quote, relatedField = null) => ({
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

const programs = offerings.map(makeProgram);
const applications = offerings.map(makeApplication);
const auditions = offerings.map(makeAudition);
const sourceRecords = [
  source(URL_ADMISSION, "Spring 2027 Undergraduate Admission Guide for International Students", "International Students Page", null, "The current foreign guide identifies the Spring 2027 Global Talent Special Admission route and links the 2027 undergraduate guide.", null),
  source(URL_GUIDE, "2027 Spring Undergraduate Admission Guide for International Students", "Application Requirements Page", null, "The guide lists application, recommendation, records submission, language evidence, nationality/family documents and the six College of Music recruitment units.", null),
  source(URL_GUIDE, "2027 Spring Undergraduate Admission Guide — schedule and fee", "Deadline/Fee Page", null, "Online application is 2026-07-06 to 2026-07-09 17:00 KST; application fee is KRW 70,000; College of Music records submission is 2026-07-06 to 2026-07-10 17:00 KST; tuition appendix lists KRW 3,916,000 per semester for the College of Music.", null),
  source(URL_RECORDS, "Spring 2027 College of Music records guidance and Korean Music notice", "Audition Requirements Page", null, "The College of Music notice says the foreign undergraduate route submits records of achievement by post, includes the department-specific attachment, and adds an approximately 10-minute Korean Zoom interview for Korean Music applicants.", null),
  source(URL_MUSIC, "SNU College of Music", "Official Program Page", null, "The official College of Music site links the six academic departments: Vocal Music, Composition, Musicology, Piano, Orchestral Music and Korean Music.", null),
  source(URL_MUSICOLOGY, "Department of Musicology", "Official Program Page", null, "Musicology is an academic College of Music department with research in music aesthetics, sociology, theory/analysis and related areas.", "music"),
  source(URL_KOREAN_MUSIC, "Department of Korean Music", "Official Program Page", null, "The Korean Music department has undergraduate study and performance, composition, theory and related traditional-music activity.", "performance"),
  ...offerings.flatMap((o) => {
    const ref = refFor(o);
    return [
      source(URL_GUIDE, `2027 foreign guide — College of Music / ${o.department}`, "Official Program Page", ref, `The current foreign guide lists ${o.department} as one official College of Music recruitment unit.`, o.field_ref),
      source(URL_RECORDS, `2027 College of Music foreign records guidance — ${o.department}`, "Audition Requirements Page", ref, `The current College of Music records attachment provides the direction-specific foreign-route records for ${o.department}.`, o.field_ref),
    ];
  }),
];

const publishing = {
  programs: offerings.map((o) => ({
    program_offering_ref: refFor(o),
    slug: `${o.key}-bm`,
    answer_sentence_zh: `首尔大学音乐大学本科（${o.name_zh}）：外国人特别招生以成果物/作品集替代现场实技；${o.key === "korean_music" ? "国乐方向另有韩语线上面试。" : "具体提交内容按官方招生单位方向键记录。"}`,
    field_tiers: { primary: o.field_ref },
    cost_estimate_rmb: null,
    badges: [{ label: `SNU ${o.department}`, type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  })),
};

const dataQuality = {
  overall_confidence: "High",
  missing_critical_fields: [
    "Current foreign guide does not restate an English degree-title line or duration; BM and duration are retained with an explicit review note rather than silently treated as a source quote.",
    "No separate graduation-language threshold is stated; the February Korean-language assessment is a post-admission/course-restriction matter.",
  ],
  needs_human_review: true,
  review_notes: [
    "Foreign-route existence passed: the 2027 Spring foreign undergraduate guide lists all six College of Music recruitment units: Vocal Music, Composition, Musicology, Piano, Orchestral Music and Korean Traditional Music.",
    "Offering grain follows the foreign recruitment-unit table: six offerings. Internal instrument/major directions are not new offerings because the guide says applicants apply by recruitment unit and choose department/major under College regulations after admission; the College of Music attachment carries direction-level records.",
    "Composition/Conducting is the key structure judgment: one official Composition recruitment unit, with Composition and Conducting as separate record keys. Conducting is not a seventh offering and is not treated as an entry gate.",
    "Musicology uses the operator-approved comprehensive-university music/Musicology precedent: it is an academic College of Music department, not a performance or professional-music fusion degree.",
    "Foreign route audition judgment: audition_required=No because the central 2027 guide explicitly says the College of Music does not hold the practical exam and substitutes records/portfolio submission. The records attachment is represented in the audition record without relabelling it as an audition.",
    "Korean Music exception: the College of Music notice adds an approximately 10-minute Korean Zoom interview for Korean Music applicants to check language ability and major aptitude; this is recorded as interview_or_callback, not audition_required=Yes.",
    "Direction-level records were independently transcribed from the 2027 foreign College of Music attachment: Vocal Music, Composition, Conducting, Musicology, Piano, Strings, Woodwind/Brass/Percussion and Korean Music keys. Domestic 2027 수시/정시 live-audition repertoire was not mixed into this package.",
    "TOPIK is recorded in conditional_notes_structured. The primary language fields retain the accepted English alternatives, and the Korean assessment after admission is kept separate from graduation-language requirements.",
    "Tuition follows the Korean line's original-currency rule: KRW 3,916,000 per semester from the 2026 academic-year appendix; cost_estimate_rmb remains null and the guide warns the amount may change.",
    "Application fee is KRW 70,000. Primary deadline is the foreign-route online application deadline 2026-07-09 17:00 KST; College of Music records deadline 2026-07-10 is retained in timeline_structured.",
    "Bottom-draft update hint: replace the old pending 2027 PDF/access gap with the now-verified 2027 guide, six foreign Music recruitment units, no-live-practical-exam rule, records attachment, Korean Music interview, TOPIK/English language alternatives, dates, KRW70,000 fee and KRW3,916,000 semester tuition. Do not carry domestic live-exam repertoire into the foreign route.",
    "Ranking fields intentionally null. cost_estimate_rmb intentionally null; no FX conversion was made.",
  ],
};

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [school],
  fields,
  degree_levels: degreeLevels,
  program_offerings: programs,
  application_requirements: applications,
  audition_requirements: auditions,
  source_records: sourceRecords,
  publishing,
  data_quality: dataQuality,
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT} (${offerings.length} offerings)`);
