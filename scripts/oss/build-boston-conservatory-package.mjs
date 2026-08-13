/**
 * Boston Conservatory at Berklee 本科 canonical 包生成器(Mode B, 2026-08-13)。
 *
 *   node scripts/oss/build-boston-conservatory-package.mjs <输出路径>
 *
 * 只收本科 BM/BFA;不收 Dance、Music Education、研究生、证书与非学位项目。
 * 所有官网来源均保持在 bostonconservatory.berklee.edu 域名下。
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-boston-conservatory-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "boston_conservatory_at_berklee";
const CHECKED = "2026-08-13";
const CYCLE = "Fall — year not stated on official page";
const BASE = "https://bostonconservatory.berklee.edu";
const URL_UNDERGRAD = `${BASE}/academics/undergraduate`;
const URL_MUSIC = `${BASE}/music`;
const URL_APPLY = `${BASE}/admissions/application-steps`;
const URL_DEADLINES = `${BASE}/admissions/deadlines`;
const URL_AUDITION_PROCESS = `${BASE}/admissions/audition-process`;
const URL_MUSIC_AUDITION = `${BASE}/admissions/undergraduate-music-audition-requirements`;
const URL_THEATER_AUDITION = `${BASE}/admissions/theater-audition-requirements`;
const URL_COST = `${BASE}/offices-and-services/cost-attendance`;
const URL_FINANCIAL_AID = `${BASE}/financial-aid`;
const URL_MUSICAL_THEATER_PROGRAM = `${BASE}/musical-theater/bfa-musical-theater`;

const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "Early Action application and pre-screen deadline", date_text: "November 1" },
    { label: "Early Action supporting documents and online interview deadline", date_text: "December 1" },
    { label: "Early Action eligible auditions completed by", date_text: "January 21" },
    { label: "Regular Action application and pre-screen deadline", date_text: "December 1" },
    { label: "Regular Action supporting documents and online interview deadline", date_text: "January 15" },
    { label: "Undergraduate admission offers", date_text: "April 1" },
    { label: "Fall tuition deposit", date_text: "May 1" },
  ],
  date_year_note: "官网当前截止日期页只列月日,未标年份;核实日期 2026-08-13。",
};

const DEADLINE_NOTES =
  `截至 ${CHECKED} 核实,官网 Application Deadlines 页面仅列月日未标年份。` +
  "Early Action:申请与预筛(如适用) 11 月 1 日,补充材料与线上面试 12 月 1 日;" +
  "Regular Action:申请与预筛(如适用) 12 月 1 日,补充材料与线上面试 1 月 15 日。" +
  "application_deadline 因未公布年份且存在两种申请轮次而填 null,is_current 填 false。";

const APPLICATION_FEE_NOTE =
  "官网原文给出分档申请费:$75—applications submitted through November 1;$150—applications submitted through December 1。" +
  "v3 的 application_fee 只能存一个数值,本包不取中间值,该字段填 null,完整分档保留在本 notes。";

const ENGLISH_WAIVER =
  "母语非英语者需提交 TOEFL iBT、IELTS 或 Duolingo。完成 IB 文凭(不含 IB 双语文凭)," +
  "或在高中全英文学习两年,或在大学全英文学习两个学期,可申请豁免;由学校收到成绩单后审核。";

const ENGLISH_CONDITIONAL =
  "官网按考试日期区分 TOEFL 新旧制:2026-01-21 之前考试最低 72,2026-01-21 当日及之后最低 4。" +
  "本字段填当前新制 4,旧制 72 保留在此说明。IELTS 6.0、Duolingo 110。";

const TRANSCRIPTS =
  "首次申请本科者须提交最新官方高中成绩单或 GED;曾有大学学分者还须提交官方大学成绩单。" +
  "国际申请人另须提交 credential evaluation report。所有文件须为英文或附英文版本。";

const SHARED_APPLICATION_MATERIALS = [
  "Online application form",
  "Official high school transcript or GED (first-time college applicants)",
  "Recorded online interview (undergraduate applicants)",
];

const SHARED_AUDITION_NOTE =
  "官网说明本科申请人须完成 recorded online interview,并另行注册 audition。" +
  "试音要求按项目、乐器和学位变化;线上试音与线下要求相同,录音替代方式仅在 intended program 允许时适用。";

const br = (key, instrument) => ({
  key,
  field_ref: "performance",
  degree_ref: "bm",
  official_program_name: `Bachelor of Music in Brass Performance — ${instrument}`,
  program_name_zh: `音乐学士（铜管乐器演奏—${instrument}）`,
  track_or_concentration: instrument,
  program_url: `${BASE}/brass`,
  audition_url: URL_MUSIC_AUDITION,
  department: "Music Division — Brass",
  prescreen: "No",
  audition_format: "Live Only",
  repertoire: lines(
    `${instrument} 被官网 Brass 试音段落明确列入方向清单。`,
    "新生须准备一首练习曲、奏鸣曲或协奏曲中两个速度与性质对比的乐章、全部大调音阶与琶音,以及可能的视奏。",
    "可选一首体现个人艺术兴趣的任意风格/文化背景作品。铜管试音须无伴奏。",
  ),
  source_quote:
    `Brass 页面明确列出 ${instrument};该段落写明 “No pre-screen required” 并列出 etude、two contrasting movements、scales and arpeggios、possible sight-reading。`,
  accompaniment: "官网明确:Brass auditions must be performed without accompaniment.",
});

const strings = (key, instrument, prescreen) => ({
  key,
  field_ref: "performance",
  degree_ref: "bm",
  official_program_name: `Bachelor of Music in String Performance — ${instrument}`,
  program_name_zh: `音乐学士（弦乐演奏—${instrument}）`,
  track_or_concentration: instrument,
  program_url: `${BASE}/strings`,
  audition_url: URL_MUSIC_AUDITION,
  department: "Music Division — Strings",
  prescreen,
  audition_format: prescreen === "Yes" ? "Multiple Rounds" : "Live Only",
  repertoire: lines(
    `${instrument} 使用官网 Strings 试音段落中针对 ${prescreen === "Yes" ? "Violin and Cello" : "Viola and Double Bass"} 的原文要求。`,
    "现场试音:能体现换把与运弓控制的练习曲或短技术作品、两段对比鲜明的无伴奏 Bach、标准协奏曲完整首乐章、以及一首自选作品;现场可能有简短视奏。",
    prescreen === "Yes"
      ? "预筛:两段无伴奏 Bach、标准协奏曲完整首/末乐章、以及总长两至三分钟的第三首作品;钢琴伴奏非必需。"
      : "该方向官网明确写明无需预筛;低音提琴可用自选作品替代 Bach。",
  ),
  source_quote:
    `${instrument} 在 Strings 页面 Areas of Focus 中单独列名;试音页对 ${prescreen === "Yes" ? "Violin and Cello" : "Viola and Double Bass"} 明确标注 ${prescreen === "Yes" ? "Pre-screen required" : "No pre-screen required"}。`,
  accompaniment: "钢琴伴奏 encouraged, but not required;官网不提供伴奏者。",
});

const woodwind = (key, instrument, prescreen, detail) => ({
  key,
  field_ref: "performance",
  degree_ref: "bm",
  official_program_name: `Bachelor of Music in Woodwind Performance — ${instrument}`,
  program_name_zh: `音乐学士（木管乐器演奏—${instrument}）`,
  track_or_concentration: instrument,
  program_url: `${BASE}/woodwinds`,
  audition_url: URL_MUSIC_AUDITION,
  department: "Music Division — Woodwinds",
  prescreen,
  audition_format: prescreen === "Yes" ? "Multiple Rounds" : "Live Only",
  repertoire: detail,
  source_quote:
    `Woodwinds 页面 Areas of Focus 明确列出 ${instrument};试音页对 ${instrument} 单独标注 ${prescreen === "Yes" ? "Pre-screen required" : "No pre-screen required"} 并给出独立曲目段落。`,
  accompaniment: instrument === "Flute" ? "预筛明确要求 No piano accompaniment;官网未另述现场伴奏。" : null,
});

const PROGRAMS = [
  {
    key: "composition",
    field_ref: "composition",
    degree_ref: "bm",
    official_program_name: "Bachelor of Music in Composition",
    program_name_zh: "音乐学士（作曲）",
    track_or_concentration: null,
    program_url: `${BASE}/composition`,
    audition_url: URL_MUSIC_AUDITION,
    department: "Music Division — Composition",
    prescreen: "Yes",
    audition_format: "Multiple Rounds",
    repertoire: lines(
      "预筛须提交近三年创作的 2–4 首作品,其中至少一首为两件或以上乐器创作。",
      "每首录音附乐谱;乐谱须清晰记谱。作品演出录音可提交但非必需,高质量 MIDI 可接受但非必需。",
      "另须用 1–2 页说明三位影响本人音乐创作的艺术家;通过预筛后可能获邀参加线上或校园面试,面试不要求现场演奏。",
    ),
    source_quote:
      "Composition 段落明确写明 “Pre-screen required” 和 2–4 recent works;每首须附 accompanying score。",
    video: "预筛上传作品演出录音;官网未规定统一时长或文件格式。",
    accompaniment: null,
    interview: "通过作品预筛后可能参加线上或校园 faculty panel interview;官网明确面试不含现场演奏。",
  },
  br("brass_trumpet", "Trumpet"),
  br("brass_horn", "Horn"),
  br("brass_trombone", "Trombone"),
  br("brass_bass_trombone", "Bass Trombone"),
  br("brass_euphonium", "Euphonium"),
  br("brass_tuba", "Tuba"),
  {
    key: "harp",
    field_ref: "performance",
    degree_ref: "bm",
    official_program_name: "Bachelor of Music in Harp Performance",
    program_name_zh: "音乐学士（竖琴演奏）",
    track_or_concentration: "Harp",
    program_url: `${BASE}/harp`,
    audition_url: URL_MUSIC_AUDITION,
    department: "Music Division — Harp",
    prescreen: "No",
    audition_format: "Live Only",
    repertoire: lines(
      "两首来自两个对比时期的对比作品或乐章;一首自选、最长五分钟的作品;一首自选管弦乐片段。",
      "作品可来自任意风格或文化背景,也可为本人原创或编曲。官网说明本科自选作品最长五分钟。",
    ),
    source_quote: "Harp 段落明确写明 “No pre-screen required” 并列出三部分现场/录音试音曲目。",
    accompaniment: "Instrumental auditions must be performed without accompaniment;官网列出可使用或自带竖琴。",
  },
  {
    key: "percussion_marimba",
    field_ref: "performance",
    degree_ref: "bm",
    official_program_name: "Bachelor of Music in Percussion Performance — Percussion/Marimba",
    program_name_zh: "音乐学士（打击乐演奏—打击乐/马林巴）",
    track_or_concentration: "Percussion/Marimba",
    program_url: `${BASE}/percussion-marimba`,
    audition_url: URL_MUSIC_AUDITION,
    department: "Music Division — Percussion and Marimba",
    prescreen: "No",
    audition_format: "Live Only",
    repertoire: lines(
      "官网明确写明无需预筛,且须无伴奏。申请人须展示三类能力:小军鼓、键盘打击乐器、定音鼓。",
      "小军鼓:音乐会练习曲与军鼓独奏,约四分钟;键盘打击乐:二槌与四槌独奏,至少四分钟;定音鼓:约三分钟独奏。",
      "现场可提供五组马林巴、木琴、颤音琴、定音鼓与小军鼓。",
    ),
    source_quote: "Percussion 段落明确写明 “No pre-screen required” 和 “Auditions must be performed without accompaniment”,随后分列 Snare Drum、Mallets、Timpani。",
    accompaniment: "Auditions must be performed without accompaniment.",
  },
  {
    key: "piano",
    field_ref: "performance",
    degree_ref: "bm",
    official_program_name: "Bachelor of Music in Piano Performance",
    program_name_zh: "音乐学士（钢琴演奏）",
    track_or_concentration: "Piano",
    program_url: `${BASE}/piano`,
    audition_url: URL_MUSIC_AUDITION,
    department: "Music Division — Piano",
    prescreen: "Yes",
    audition_format: "Multiple Rounds",
    repertoire: lines(
      "预筛视频至少 30 分钟,包含炫技练习曲及下列现场曲目中的至少三首。",
      "现场须准备: Bach 前奏曲与赋格(或含赋格作品)、Haydn/Mozart/Beethoven/Schubert 完整奏鸣曲、浪漫时期大型独奏作品、20/21 世纪独奏作品、以及一首炫技练习曲。全部背谱。",
    ),
    source_quote: "Piano 段落明确写明 “Pre-screen required” 和至少 30 分钟预筛视频,并列出五项现场曲目。",
    video: "预筛为至少 30 分钟视频;官网未规定统一文件格式。",
    accompaniment: null,
  },
  strings("strings_violin", "Violin", "Yes"),
  strings("strings_viola", "Viola", "No"),
  strings("strings_cello", "Cello", "Yes"),
  strings("strings_double_bass", "Double Bass", "No"),
  {
    key: "voice_performance",
    field_ref: "performance",
    degree_ref: "bm",
    official_program_name: "Bachelor of Music in Voice Performance",
    program_name_zh: "音乐学士（声乐演唱；可选歌剧方向）",
    track_or_concentration: "Optional emphasis on opera",
    program_url: `${BASE}/voice-opera`,
    audition_url: URL_MUSIC_AUDITION,
    department: "Music Division — Voice/Opera",
    prescreen: "Yes",
    audition_format: "Multiple Rounds",
    repertoire: lines(
      "预筛须有伴奏,包含三首对比鲜明的艺术歌曲:一首意大利语、一首法语或德语、一首非翻译英语;全部背谱,不得使用歌剧咏叹调。",
      "录音不得剪辑增强;可在不替代必需曲目的前提下增加母语古典曲目。获邀现场试音时要求与预筛相同,之后另有与在读声乐学生的短谈话/回顾。",
      "官网明确:带歌剧方向的 Bachelor of Music in voice audition 在入学后第四学期结束后进行。",
    ),
    source_quote: "Voice 段落明确写明 “Pre-screen required”,三首艺术歌曲的语言组合和 “Opera arias are not allowed”。",
    video: "预筛视频须有伴奏;官网要求不得编辑增强音视频。",
    accompaniment: "预筛须有伴奏;波士顿现场提供 staff pianist,申请人也可自带伴奏者。",
    interview: "现场试音后与在读声乐学生进行 short conversation and debrief。",
    major_declaration_requirements:
      "官网明确说明:带歌剧方向的 Bachelor of Music in voice audition 在入学后第四学期结束后进行。此项是入学后的方向试音,不与入学申请时的声乐预筛/试音混同。",
  },
  woodwind(
    "woodwinds_flute",
    "Flute",
    "Yes",
    lines(
      "预筛:一首练习曲、一首含对比乐章或段落的自选作品,无钢琴伴奏。",
      "现场:Kohler Romantic Etudes op.66 或 Karg-Elert Caprices op.107 中一首练习曲;两个对比时期的作品或乐章;以及一首任意风格/文化背景自选作品。",
    ),
  ),
  woodwind(
    "woodwinds_oboe",
    "Oboe",
    "No",
    "两首对比速度的练习曲(Barret 40 Progressive Melodies 与 Barret 15 Grand Studies 或 48 Ferling Etudes 各一首);巴洛克或古典协奏曲的一慢一快乐章;以及 William Grant Still《Incantation and Dance》。",
  ),
  woodwind(
    "woodwinds_clarinet",
    "Clarinet",
    "No",
    "全部大小调音阶(最好三个八度,连奏与吐奏);Rose Thirty-Two Etudes for Clarinet 中两首对比作品;一首自选协奏曲;以及一首任意风格/文化背景自选作品。",
  ),
  woodwind(
    "woodwinds_bassoon",
    "Bassoon",
    "No",
    "全音域大小调音阶;Ludwig Milde Concert Studies op.26 no.1;Weissenborn Method for Bassoon Etude no.15;两个对比时期的作品或乐章;以及一首任意风格/文化背景自选作品。",
  ),
  woodwind(
    "woodwinds_saxophone",
    "Saxophone",
    "No",
    "两首对比速度练习曲,从 Piazzolla、Ferling、Berbiguier 曲目中选;一首指定清单或同等程度作品;另有一首任意风格/文化背景自选作品可选。",
  ),
  {
    key: "musical_theater",
    field_ref: "musical_theater",
    degree_ref: "bfa",
    official_program_name: "Bachelor of Fine Arts in Theater: Musical Theater",
    program_name_zh: "戏剧：音乐剧美术学士",
    track_or_concentration: "Advanced Acting or Advanced Dance (chosen at the end of the second year)",
    program_url: `${BASE}/musical-theater`,
    audition_url: URL_THEATER_AUDITION,
    department: "Theater Division",
    prescreen: "Yes",
    audition_format: "Multiple Rounds",
    repertoire: lines(
      "预筛须通过 SlideRoom/MTCP 提交:10 秒 slate introduction;两首对比歌曲(一首 1970 年前、一首 1970 年后,各 60–90 秒);一首来自出版剧本或职业编剧的独白(60–90 秒,不得来自音乐剧、电视或电影)。",
      "现场:两首对比独白(一首当代、一首古典/口语/韵文);两首对比歌曲(一首 ballad、一首 up-tempo,至少一首音乐剧曲目,歌唱总计四分钟);另有芭蕾/爵士舞蹈 call。",
      "官网明确现场没有 musicianship/theory exam 或 sight-reading;演唱须自带预录伴奏,现场不提供钢琴。",
    ),
    source_quote: "Theater Audition Requirements 明确写明 BFA in Theater: Musical Theater 必须先交 pre-screen 才能进入 live audition;现场包含 acting、singing、dance。",
    video: "预筛每个作品须单独上传;歌曲与独白均 60–90 秒;线上舞蹈 call 另须在试音前 48 小时上传预录舞蹈视频。",
    accompaniment: "演唱须自带预录伴奏;官网明确现场没有钢琴,提供扬声器和辅助接口。",
    interview: "acting/singing 后 audition panel 会进行非正式提问;线上舞蹈 call 另有 live improv。",
    notes:
      "BFA 页面说明学生在第二学年末从 Advanced Acting 与 Advanced Dance 两条 track 中选择;这不是官网称谓的入学后专业申报门槛,因此 major_declaration_requirements 不将其写成专业门槛。",
  },
];

const fields = [
  ["composition", "Composition", "作曲", "Composition/Theory"],
  ["performance", "Performance", "演奏", "Music Performance"],
  ["musical_theater", "Musical Theater", "音乐剧表演", "Musical Theatre"],
];

const degreeLevels = [
  ["bm", "Bachelor of Music", "音乐学士", "BM"],
  ["bfa", "Bachelor of Fine Arts", "美术学士", "BFA"],
];

const offeringRef = (program) => `${SCHOOL}_${program.key}_${program.degree_ref}`;
const slugOf = (program) => `${program.key.replace(/_/g, "-")}-${program.degree_ref}`;

const applicationFor = (program) => {
  const music = program.degree_ref === "bm";
  const materials = [
    ...SHARED_APPLICATION_MATERIALS,
    "SlideRoom supplemental application",
    program.prescreen === "Yes" ? "Program-specific pre-screen materials" : "Program-specific audition registration",
    music ? "At least one recommendation letter" : "Program-specific artistic materials as instructed in SlideRoom",
    "Audition",
  ];
  return {
    program_offering_ref: offeringRef(program),
    admission_cycle: CYCLE,
    is_current: false,
    application_deadline: null,
    timeline_structured: TIMELINE,
    deadline_notes: DEADLINE_NOTES,
    application_fee: null,
    application_fee_currency: "USD",
    required_materials: materials,
    transcript_requirements: TRANSCRIPTS,
    recommendation_letters: music ? 1 : null,
    resume_required: "Unknown",
    essay_required: "Not Required",
    portfolio_required: program.key === "composition" ? "Required" : "Unknown",
    english_language_tests: ["TOEFL", "IELTS", "Duolingo"],
    toefl_minimum: 4,
    ielts_minimum: 6,
    duolingo_minimum: 110,
    english_waiver_policy: ENGLISH_WAIVER,
    english_requirement_status: "Conditional",
    international_applicant_notes:
      "母语非英语者须提交 TOEFL iBT、IELTS 或 Duolingo;在美国/加拿大以外完成学业的申请人须提交 credential evaluation report。",
    conditional_notes: lines(APPLICATION_FEE_NOTE, ENGLISH_CONDITIONAL),
    conditional_notes_structured: null,
    estimated_living_cost: null,
    estimated_living_cost_currency: null,
    review_status: "Needs Review",
    notes: lines(
      "校级申请材料、截止日期、申请费与语言要求来自 Boston Conservatory 官方招生页面,按运营者确认的共享字段规则复用。",
      music
        ? "官网明确 all music programs require at least one recommendation letter;该规则逐条适用于本包 20 个 BM offering。"
        : "官网对 recommendation letter 的明确要求只写 all music programs;本 BFA 音乐剧记录为 null/未说明,不把音乐项目规则外推到 Theater。",
      "官网明确不要求 essays、personal statements、SAT/ACT;resume 未明确为申请必交,故填 Unknown。",
    ),
  };
};

const auditionFor = (program) => ({
  program_offering_ref: offeringRef(program),
  admission_cycle: CYCLE,
  is_current: false,
  prescreening_required: program.prescreen,
  prescreening_deadline: null,
  audition_required: "Yes",
  audition_format: program.audition_format,
  repertoire_summary: program.repertoire,
  repertoire_structured: null,
  video_requirements: program.video ?? null,
  file_format_requirements: null,
  accompaniment_requirements: program.accompaniment ?? null,
  interview_or_callback_requirements: program.interview ?? null,
  special_notes: program.notes ?? null,
  conditional_notes: SHARED_AUDITION_NOTE,
  conditional_notes_structured: null,
  review_status: "Needs Review",
  notes: lines(
    "本条按该 offering 在官方试音要求页对应的方向段落单独核实;不从 Berklee College of Music 主校页面或其他乐器方向外推。",
    program.source_quote,
  ),
});

const source = (programOfferingRef, url, sourceTitle, sourceType, relatedField, quote, confidence = "High") => ({
  school_ref: SCHOOL,
  program_offering_ref: programOfferingRef,
  admission_cycle: CYCLE,
  source_url: url,
  source_title: sourceTitle,
  source_type: sourceType,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote: quote,
  related_field: relatedField,
  confidence_level: confidence,
  review_status: "Extracted",
});

const programSources = PROGRAMS.flatMap((program) => {
  const ref = offeringRef(program);
  const programQuote =
    program.degree_ref === "bfa"
      ? "Bachelor of Fine Arts in Theater: Musical Theater is a four-year program; students choose Advanced Acting or Advanced Dance at the end of the second year."
      : `${program.official_program_name} is listed as a Bachelor of Music, Four-Year Program; the official page separately identifies the direction ${program.track_or_concentration ?? "Composition"}.`;
  return [
    source(ref, program.program_url, program.official_program_name, "Official Program Page", "program_offerings", programQuote),
    source(ref, program.audition_url, program.official_program_name, "Audition Requirements Page", "audition_requirements", program.source_quote),
  ];
});

const pkg = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [
    {
      school_ref: SCHOOL,
      school_name: "Boston Conservatory at Berklee",
      school_name_zh: "波士顿音乐学院(伯克利)",
      city: "Boston",
      country: "United States",
      region: "North America",
      state_province: "Massachusetts",
      country_code: "US",
      languages_of_instruction: ["English"],
      school_type: "Conservatory",
      official_website: `${BASE}/`,
      logo: null,
      card_image: null,
      intro_zh: "波士顿音乐学院(伯克利)是一所独立招生的音乐、戏剧与舞蹈学院;本包仅收录其本科音乐类与音乐剧项目。",
      ranking_source: null,
      ranking_position: null,
      notes:
        "本包只收录本科 Bachelor of Music 与 Bachelor of Fine Arts in Theater: Musical Theater。" +
        "Dance(Contemporary Dance、Commercial Dance)、Music Education、研究生、Diploma、Certificate、Online、Summer 与 Extension 项目均排除。" +
        "Boston Conservatory at Berklee 与 Berklee College of Music、Berklee NYC 独立招生;本包来源 URL 不混用 college.berklee.edu 或主校页面。",
    },
  ],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref,
    field_name,
    field_name_zh,
    field_category,
    parent_field: null,
    field_group: null,
    aliases: null,
    description: null,
    display_order: null,
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref,
    degree_level_name,
    degree_level_name_zh,
    abbreviation,
    degree_category: "Undergraduate",
    display_order: null,
    description: null,
  })),
  program_offerings: PROGRAMS.map((program) => ({
    program_offering_ref: offeringRef(program),
    school_ref: SCHOOL,
    field_ref: program.field_ref,
    degree_level_ref: program.degree_ref,
    track_or_concentration: program.track_or_concentration,
    official_program_name: program.official_program_name,
    program_name_zh: program.program_name_zh,
    department: program.department,
    duration_years: 4,
    language_of_instruction: ["English"],
    program_url: program.program_url,
    application_url: URL_APPLY,
    audition_url: program.audition_url,
    international_url: null,
    card_summary_zh: null,
    degree_system: program.degree_ref === "bm" ? "Bachelor of Music (BM)" : "Bachelor of Fine Arts (BFA)",
    tuition_currency: "USD",
    tuition_amount_min: 55120,
    tuition_amount_max: 55120,
    tuition_period: "per_year",
    funding_policy: "All entering students are automatically considered for institutional scholarships as part of the admissions process.",
    major_declaration_requirements: program.major_declaration_requirements ?? null,
    review_status: "Needs Review",
    last_checked: CHECKED,
    notes: lines(
      "官网 2026–2027 本科 Cost of Attendance 页公布 tuition $55,120、fees $2,500; tuition_amount 只记录 tuition, fees 保留在 package review_notes/source_records,不把两者混成纯学费。",
      program.degree_ref === "bm"
        ? "官方项目页明确给出 Bachelor of Music 四年制;乐器方向同时写入 official_program_name 与 track_or_concentration,可独立辨识。"
        : program.notes ?? "官方项目页明确给出 Bachelor of Fine Arts 四年制。",
    ),
  })),
  application_requirements: PROGRAMS.map(applicationFor),
  audition_requirements: PROGRAMS.map(auditionFor),
  source_records: [
    source(null, URL_UNDERGRAD, "Undergraduate Programs", "Official Program Page", "program_offerings", "The undergraduate index lists Composition, Instrumental Performance (18 options), Voice Performance with optional opera emphasis, and Musical Theater; the Dance programs are separate BFA programs and are out of scope."),
    source(null, URL_MUSIC, "Music at Boston Conservatory", "Official Program Page", "program_offerings", "The Music Division index links the official Brass, Composition, Harp, Percussion/Marimba, Piano, Strings, Voice/Opera, and Woodwinds pages used for the 20 BM offerings."),
    source(null, URL_APPLY, "Application Steps", "Application Requirements Page", "application_requirements", "The application opens July 1; fees are $75 through November 1 and $150 through December 1; all music programs require at least one recommendation letter; undergraduate applicants complete a recorded online interview and an audition."),
    source(null, URL_APPLY, "Application Steps", "English Language Requirements Page", "english_language_tests", "For Bachelor of Music and Bachelor of Fine Arts: TOEFL iBT 72 before January 21, 2026 or 4 on/after January 21, 2026; IELTS 6.0; Duolingo 110. English waiver conditions are also stated on this page."),
    source(null, URL_DEADLINES, "Application Deadlines", "Deadline/Fee Page", "application_deadline", "Early Action: November 1 application/pre-screen and December 1 supporting documents/online interview; Regular Action: December 1 application/pre-screen and January 15 supporting documents/online interview; the page does not state a year."),
    source(null, URL_COST, "Cost of Attendance", "Deadline/Fee Page", "tuition_amount_min", "2026–2027 undergraduate tuition is $55,120 and fees are $2,500; on-campus room and board is $21,300 and total cost of attendance is $87,817."),
    source(null, URL_FINANCIAL_AID, "Financial Aid and Scholarships", "Application Requirements Page", "funding_policy", "All entering students are automatically considered for institutional scholarships as part of the admissions process."),
    source(null, URL_AUDITION_PROCESS, "Audition Process", "Audition Requirements Page", "audition_requirements", "Audition requirements vary by program, instrument, and degree; pre-screen materials are required for select music programs and all musical theater applicants."),
    ...programSources,
    source(`${SCHOOL}_voice_performance_bm`, URL_MUSIC_AUDITION, "Undergraduate Music Audition Requirements", "Audition Requirements Page", "major_declaration_requirements", "Auditions for the Bachelor of Music in voice with an opera emphasis take place after the fourth semester of enrollment."),
    source(`${SCHOOL}_musical_theater_bfa`, URL_MUSICAL_THEATER_PROGRAM, "Bachelor of Fine Arts in Theater: Musical Theater", "Official Program Page", "track_or_concentration", "Students choose between Advanced Acting and Advanced Dance at the end of the second year; the page does not describe this as a professional declaration barrier."),
  ],
  publishing: {
    programs: PROGRAMS.map((program) => ({
      program_offering_ref: offeringRef(program),
      slug: slugOf(program),
      answer_sentence_zh: null,
      field_tiers: {},
      cost_estimate_rmb: {
        min: 55120,
        max: 55120,
        currency: "USD",
        components: [
          {
            item: "tuition",
            value: 55120,
            currency: "USD",
            source_type: "official",
            period: "per_year",
            period_basis: "官网 2026–2027 undergraduate tuition",
            composition_note: "不含另列的 $2,500 fees、住宿餐食、保险与其他生活成本。",
          },
        ],
        methodology_version: "v3",
        note: "官网同时列出 undergraduate fees $2,500;v3 costComponent 没有单独 fee 枚举,因此只将 tuition 放入成本组件并在 notes 保留费用。",
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
      "application_deadline(官网只标月日未标年份,且 Early/Regular 两轮不能压成一个日期)",
      "application_fee(v3 只有单一数值,官网实际为 $75/$150 分档)",
      "major_declaration_requirements(除 Voice opera emphasis 的入学后试音外,官网逐页未说明本科专业申报门槛)",
    ],
    needs_human_review: true,
    review_notes: [
      "⚠ 未经人工复核。抽取方不给自己盖 Verified;workflow_status.review_status 保持 unreviewed。",
      "【范围】21 条本科 offering:20 条 BM(Composition、18 个器乐方向、Voice Performance)与 1 条 BFA Theater: Musical Theater;Dance、Music Education、研究生、Diploma、Certificate、Online、Summer、Extension 排除。",
      "【逐方向粒度】18 条器乐 offering 的 official_program_name 与 track_or_concentration 均完整写入乐器名;不得只靠 URL 区分。",
      "【归类】Composition → composition / Composition/Theory;20 个演奏向 BM → performance / Music Performance;BFA Theater: Musical Theater → 新增 musical_theater / Musical Theatre。表演向 musical_theater 与创作向 musical_theater_writing_production 的区分已写入 field-classification-precedents.md P7。",
      "【预筛逐项】No:6 Brass、Harp、Percussion、Viola、Double Bass、Oboe、Clarinet、Bassoon、Saxophone,以及对应的无预筛方向;Yes: Composition、Piano、Violin、Cello、Voice、Flute、Musical Theater。每条均按官方试音页面对应段落记录,未套用 Berklee 主校结论。",
      "【曲目逐项】Brass 六个方向各保留自己的 offering 与 source record;虽官网将六种铜管列在同一 Brass 段落,引用明确点名各乐器。Strings 与 Woodwinds 同理按各方向段落拆开,未从其他组外推。",
      "【三态】官网没有逐本科专业说明入学后专业申报门槛时,major_declaration_requirements 填 null 并注明官网未说明;Voice 的 opera emphasis 另有入学后第四学期结束后的试音,单独记录。",
      "【数字】2026–2027 undergraduate tuition $55,120、fees $2,500;tuition_amount 只记录 tuition,不把 fees 冒充纯学费。",
      "【申请费契约限制】官网明确给出 Early Action $75、Regular Action $150;v3 application_fee 只有单一数字,故填 null 并把两档原文写入 conditional_notes 与 review_notes。",
      "【日期】官网截止日期只列月日未列年份,application_deadline=null,is_current=false;timeline_structured 保留 Early/Regular 两套月日。",
      "【语言】本科 BM/BFA 校级语言门槛按官网统一表记录:TOEFL 新制 4、旧制 72、IELTS 6.0、Duolingo 110;旧制保留 conditional_notes。",
      "【来源隔离】所有 source_url 均为 bostonconservatory.berklee.edu;未使用 college.berklee.edu 主校页面。",
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
    `  专业: ${pkg.program_offerings.length} 条本科 offering\n` +
    `  申请要求: ${pkg.application_requirements.length} 条 · 试音要求: ${pkg.audition_requirements.length} 条\n` +
    `  来源记录: ${pkg.source_records.length} 条 · 复核备注: ${pkg.data_quality.review_notes.length} 条`,
);
