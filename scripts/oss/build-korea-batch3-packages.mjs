import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-korea-batch3-packages.mjs <output-dir>");
  process.exit(2);
}

const CHECKED = "2026-08-14";
const lines = (...xs) => xs.filter(Boolean).join("\n");
const ref = (school, key) => `${school}_${key}_bm`;
const field = (field_ref, field_name, field_name_zh, field_category, note) => ({
  field_ref, field_name, field_name_zh, field_category,
  parent_field: null, field_group: "Professional Music", aliases: null,
  description: null, display_order: null, _note: note,
});
const degree = (note) => ({
  degree_level_ref: "bm", degree_level_name: "Bachelor of Music",
  degree_level_name_zh: "音乐学士", abbreviation: "BM", degree_category: "Undergraduate",
  display_order: null, description: null, _note: note,
});

const common = {
  ewha: [
    "在线申请表及申请费",
    "高中毕业/预毕业证明与完整高中成绩单",
    "申请人及父母国籍/身份材料",
    "申请人与父母关系证明；非韩文/英文材料须附认证翻译",
    "中国学历材料按官网要求办理学信网/认证手续",
  ],
  dankook: [
    "打印并签署的在线申请表",
    "高中毕业/预毕业证明与高中成绩单",
    "申请人及父母国籍材料、亲属关系证明",
    "按官网要求办理的翻译、公证、Apostille或韩国使领馆认证材料",
    "音乐方向视频/音频/乐谱或作品集材料（按方向要求）",
  ],
  sookmyung: [
    "打印并签署的在线申请表及学历查询同意书",
    "高中毕业证明与完整高中成绩单",
    "申请人及父母外国国籍证明、亲属关系证明",
    "韩文或英文以外材料的翻译公证",
    "音乐学院艺术作品/实技材料（按方向要求）",
  ],
};

const source = (school_ref, url, title, source_type, quote, offering = null, related_field = null, admission_cycle = null) => ({
  school_ref, program_offering_ref: offering, admission_cycle, source_url: url,
  source_title: title, source_type, retrieved_date: CHECKED, raw_markdown: null,
  source_quote: quote, related_field, confidence_level: "High", review_status: "Extracted",
});

function application({ school, offering, cycle, deadline, timeline, fee, materials, language, languageStructured, conditional, isCurrent = false }) {
  return {
    program_offering_ref: offering, admission_cycle: cycle, is_current: isCurrent,
    application_deadline: deadline, timeline_structured: timeline,
    deadline_notes: "本记录只保留一条申请记录；当前日期已超过所引用的最近完整官方简章周期，因此 is_current=false，新周期简章发布后需更新。",
    application_fee: fee, application_fee_currency: "KRW", required_materials: materials,
    transcript_requirements: "按外国人本科新生路径提交高中毕业/预毕业证明和完整成绩单；中国学历材料遵循该校当前简章的认证要求。",
    recommendation_letters: null, resume_required: "Unknown", essay_required: "Unknown",
    portfolio_required: "Required", english_language_tests: language.tests,
    toefl_minimum: language.toefl ?? null, ielts_minimum: language.ielts ?? null,
    duolingo_minimum: null, english_waiver_policy: language.waiver,
    english_requirement_status: language.status, international_applicant_notes: language.applicant,
    conditional_notes: conditional, conditional_notes_structured: languageStructured,
    estimated_living_cost: null, estimated_living_cost_currency: null,
    review_status: "Needs Review", notes: `官网来源：${school}外国人本科招生简章；未将研究生、插班生或国内通道并入本记录。`,
  };
}

function audition({ offering, cycle, prescreening, required, format, repertoire, video, file, accompaniment, interview, notes }) {
  return {
    program_offering_ref: offering, admission_cycle: cycle, is_current: false,
    prescreening_required: prescreening, prescreening_deadline: null,
    audition_required: required, audition_format: format,
    repertoire_summary: repertoire.summary, repertoire_structured: repertoire.structured,
    video_requirements: video ?? null, file_format_requirements: file ?? null,
    accompaniment_requirements: accompaniment ?? null, interview_or_callback_requirements: interview ?? null,
    special_notes: notes, conditional_notes: "audition_required 按官网实际评估方式填写；录制视频/作品集审查不自动改写为现场 audition。",
    conditional_notes_structured: { official_evaluation: repertoire.evaluation },
    review_status: "Needs Review", notes: "曲目/材料按官方招生单位逐方向记录；官网未列的方向未新增键。",
  };
}

function program({ school, key, official, zh, department, track, field_ref, programUrl, applicationUrl, auditionUrl, tuitionMin, tuitionMax, tuitionPeriod, majorReq, notes }) {
  return {
    program_offering_ref: ref(school, key), school_ref: school, field_ref,
    degree_level_ref: "bm", track_or_concentration: track,
    official_program_name: official, program_name_zh: zh, department,
    duration_years: null, language_of_instruction: ["Korean"], program_url: programUrl,
    application_url: applicationUrl, audition_url: auditionUrl, international_url: applicationUrl,
    card_summary_zh: `${zh}：外国人本科通道，具体材料与评估方式以当前官方简章为准。`,
    degree_system: "本科音乐学位；当前外国人简章未在每个招生单位旁重述完整英文学位名称。",
    tuition_currency: "KRW", tuition_amount_min: tuitionMin, tuition_amount_max: tuitionMax,
    tuition_period: tuitionPeriod, funding_policy: null, major_declaration_requirements: majorReq,
    review_status: "Needs Review", last_checked: CHECKED, notes,
  };
}

const ewha = (() => {
  const school = "ewha";
  const guide = "https://isa.ewha.ac.kr/sites/oisa/file/ag_english.pdf";
  const music = "https://www.ewha.ac.kr/ewhaen/academics/music.do";
  const cycle = "2026 Fall";
  const timeline = { milestones: [
    { label: "Online application and PDF upload", date_text: "2026-03-04 13:00–2026-04-03 17:00 KST" },
    { label: "Artistic materials by post/in person", date_text: "2026-03-04 13:00–2026-04-03 17:00 KST" },
    { label: "Preliminary admission decisions", date: "2026-04-30", qualifier: "17:00 KST" },
    { label: "Original documents", date_text: "2026-05-04–2026-05-15" },
    { label: "Final admission decisions", date: "2026-06-12", qualifier: "17:00 KST" },
    { label: "Enrollment/tuition payment", date_text: "July 2026" },
  ], date_year_note: "截至 2026-08-14 未检出 2027 Spring 新生外国人简章；上列为最近完整的 2026 Fall 简章。" };
  const lang = {
    tests: ["TOEFL iBT", "IELTS", "New TEPS"], toefl: 80, ielts: 6,
    status: "Optional", waiver: "音乐学院新生不要求提交英语成绩；英语成绩可作为补充材料，官网将 TOEFL iBT 80 / IELTS 6.0 / New TEPS 326 列为可提交的英语证明。",
    applicant: "外国人本科新生；Ewha 外国人通道仅招女性，申请人及父母须符合官网国籍条件。",
  };
  const languageStructured = {
    entry: { freshman: "No language proficiency requirement", english_evidence: "Optional", music_specific_minimum: null },
    post_admission: { major_entry: "完成 HOKMA Global Scholars Program 一年后进入专业；TOPIK 3 或等效成绩影响专业课程进入", graduation: "TOPIK 4 or above before graduation" },
  };
  const defs = [
    ["keyboard_instruments", "Keyboard Instruments", "键盘乐器", "performance", "Keyboard Instruments"],
    ["orchestral_instruments", "Orchestral Instruments", "管弦乐器", "performance", "Orchestral Instruments"],
    ["voice", "Voice", "声乐", "performance", "Voice"],
    ["composition", "Composition", "作曲", "composition", "Composition"],
    ["korean_music", "Korean Music", "韩国音乐", "performance", "Korean Music"],
  ];
  const fields = [
    field("performance", "Performance", "表演", "Music Performance", "Ewha College of Music 的器乐、声乐与韩国音乐招生单位均按表演核心归类。"),
    field("composition", "Composition", "作曲", "Composition/Theory", "Ewha Composition 按创作核心归类。"),
  ];
  const programs = defs.map(([key, official, zh, field_ref, dept]) => program({
    school, key, official_program_name: official, official, zh, department: `College of Music / ${dept}`,
    track: official, field_ref, programUrl: music, applicationUrl: guide, auditionUrl: guide,
    tuitionMin: 6270000, tuitionMax: 6430000, tuitionPeriod: "per_semester", majorReq: null,
    notes: lines(
      "2026 Fall 新生外国人简章在 College of Music 下明确列出该招生单位；Dance 排除。",
      "学费为官网 2026 学年 College of Music 本科每学期约 KRW 6,270,000（1年级）至 KRW 6,430,000（2年级起），官网未区分本地/非本地生。",
      "2027 Spring 新生简章截至核查日未发布，当前记录保持 draft/Needs Review。",
    ),
  }));
  const rep = {
    keyboard_instruments: { summary: "30 分钟、申请人自选曲目演奏视频。", structured: { Keyboard_Instruments: ["30-minute performance video", "Pieces of applicant's choice", "DVD or USB"] }, evaluation: "Required artistic-material submission; recorded review" },
    orchestral_instruments: { summary: "30 分钟、申请人自选曲目演奏视频。", structured: { Orchestral_Instruments: ["30-minute performance video", "Pieces of applicant's choice", "DVD or USB"] }, evaluation: "Required artistic-material submission; recorded review" },
    voice: { summary: "本科第一轮 20 分钟声乐视频，过审后 Zoom 面试与实技。", structured: { Voice: ["First-round 20-minute video of art songs or operatic arias", "One continuous take within the past six months", "Korean self-introduction with name and recording date", "PDF repertoire list with timestamps", "Second round: Korean-language interview and one free-choice piece with pianist"] }, evaluation: "First-round recorded screening + second-round Zoom interview/practical exam" },
    composition: { summary: "三部曲式钢琴曲谱 + 至少两件乐器的室内乐曲谱；音频/DVD 可选。", structured: { Composition: ["Piano score in three-part form", "Chamber-music score containing two or more instruments", "Additional audio recording or DVD permitted"] }, evaluation: "Required score submission; optional audio/DVD" },
    korean_music: { summary: "20 分钟、申请人自选曲目演奏视频。", structured: { Korean_Music: ["20-minute performance video", "Pieces of applicant's choice", "DVD or USB"] }, evaluation: "Required artistic-material submission; recorded review" },
  };
  const applications = defs.map(([key]) => application({ school, offering: ref(school, key), cycle, deadline: "2026-04-03", timeline, fee: 150000, materials: [...common.ewha, "College of Music 艺术能力材料及曲目清单"], language: lang, languageStructured, conditional: "新生入学本身无语言门槛；入学后须先完成至少一年 HOKMA Global Scholars Program，达到 TOPIK 3 或等效后进入专业课程；毕业前须达到 TOPIK 4。英语成绩对非 International Studies 专业为可选。" }));
  const auditions = defs.map(([key]) => audition({
    offering: ref(school, key), cycle, prescreening: "Yes", required: key === "voice" ? "Yes" : "No", format: key === "voice" ? "Multiple Rounds" : "Recorded Only", repertoire: rep[key],
    video: key === "voice" ? "Full-HD mobile recording; MP4 required, MOV not accepted; one continuous take; PDF repertoire timestamps." : "Submit the required performance video on DVD or USB.",
    file: key === "voice" ? "MP4; MOV not accepted" : "DVD or USB; Composition may additionally submit audio/DVD",
    accompaniment: key === "voice" ? "Second-round Zoom practical exam requires a piano and pianist; one free-choice piece with pianist accompaniment." : null,
    interview: key === "voice" ? "Only applicants passing first screening receive the Zoom schedule; interview assesses Korean proficiency." : null,
    notes: key === "voice" ? "Voice is the only undergraduate College of Music unit in this guide with an explicitly described second-round Zoom interview/practical exam." : "The official guide requires artistic materials but does not call this a live audition; audition_required is therefore No for the record-only units.",
  }));
  const sources = [
    source(school, guide, "Ewha Fall 2026 international undergraduate admissions guide", "Application Requirements Page", "College of Music freshman admission units are Keyboard Instruments, Orchestral Instruments, Voice, Composition and Korean Music; Dance is listed separately and excluded."),
    source(school, guide, "Ewha 2026 admissions timeline and fee", "Deadline/Fee Page", "Online application and artistic-material submission run 2026-03-04 to 2026-04-03; application fee is KRW 150,000."),
    source(school, guide, "Ewha undergraduate language requirements", "English Language Requirements Page", "Freshman applicants have no language proficiency requirement at entry; English evidence is optional outside International Studies; TOPIK 3 is needed for major entry and TOPIK 4 before graduation."),
    source(school, guide, "Ewha College of Music artistic materials", "Audition Requirements Page", "Keyboard and Orchestral require 30-minute videos; Voice has 20-minute first-round video plus second-round Zoom; Composition requires two score types; Korean Music requires a 20-minute video."),
    source(school, guide, "Ewha 2026 undergraduate tuition", "Deadline/Fee Page", "College of Music, Art & Design and Science & Industry undergraduate tuition is approximately KRW 6,270,000 for first year and KRW 6,430,000 from second year per semester."),
    source(school, music, "Ewha College of Music", "Official Program Page", "The official college page presents keyboard, orchestral, voice, composition and Korean music among the College of Music structure."),
  ];
  return makePackage({ school, name: "Ewha Womans University", zh: "梨花女子大学", city: "Seoul", schoolType: "University Music School", website: "https://www.ewha.ac.kr/ewhaen/", intro: "梨花女子大学 College of Music 的外国人本科新生通道。", fields, programs, applications, auditions, sources, cycle, stale: true, notes: "本包只收 College of Music 的五个本科音乐招生单位；Dance、Musicology 研究生及其他学院排除。Ewha 外国人新生通道为女性申请者。", review: ["分类：五个 College of Music 招生单位按核心手艺分为 performance 或 composition；没有复用 professional_music。", "Ewha 新生入学无语言门槛，但入学后 Global Scholars/专业进入及毕业 TOPIK 要求分开记录；英语成绩核实为非 International Studies 新生可选。", "Voice 的二轮 Zoom 实技单独记录；其余四个单位只记录官网明确的录制/乐谱材料，不写成现场 audition。", "2026 学年学费为音乐学院本科约 KRW 6,270,000–6,430,000/学期；2027 Spring 简章未检出。", "底稿更新提示：若底稿使用旧周期日期、语言门槛或费用，应改用本次 2026 Fall 官网口径；新增 HOKMA/专业进入与毕业 TOPIK 语义。"] });
})();

const dankook = (() => {
  const school = "dankook";
  const guide = "https://cms.dankook.ac.kr/documents/d/primus/2026-fall-intake_undergraduate-admission-guide";
  const music = "https://cms.dankook.ac.kr/web/piano/%EC%9D%8C%EC%95%85%ED%95%99%EB%B6%80";
  const cycle = "2026 Fall";
  const timeline = { milestones: [
    { label: "Round 1 online application", date_text: "2026-04-03 10:00–2026-04-17 17:00 KST" },
    { label: "Round 1 document deadline", date: "2026-04-23" },
    { label: "Round 1 online Korean exam", date: "2026-05-02", qualifier: "for non-TOPIK holders" },
    { label: "Round 2 online application", date_text: "2026-06-01 10:00–2026-06-16 17:00 KST" },
    { label: "Round 2 document deadline", date: "2026-06-19" },
    { label: "Round 2 online Korean exam", date: "2026-06-27", qualifier: "for non-TOPIK holders" },
  ], date_year_note: "截至 2026-08-14 未检出 2027 Spring 新生外国人简章；主 deadline 取 2026 Fall 第一轮，第二轮保留在 timeline_structured。" };
  const lang = { tests: ["TOPIK", "TOPIK IBT"], toefl: null, ielts: null, status: "Conditional", waiver: "音乐方向属于 Korean Track/School of Global Core Education 路径；TOPIK 3+、DKU Level 3+、认证语言中心或 King Sejong Intermediate 1 等均可，亦可参加 DKU Online Korean Language Examination。英语成绩门槛只列给 English Track，不适用于音乐方向。", applicant: "申请人及父母均须为非韩国国籍；申请人须完成相当于韩国 1–12 年级的正规中小学教育。" };
  const languageStructured = { entry: { korean: ["TOPIK/TOPIK IBT 3+", "DKU Global Education Center Level 3+", "DKU-certified overseas Korean center >6 months", "King Sejong Intermediate 1+", "DKU Online Korean Language Examination"], online_exam: "Oral test; passing score 60/100" }, english: { music_specific_requirement: null, english_track_minimum: "TOEFL iBT 71 or IELTS 5.5 only for named English Track departments" }, graduation: "Not stated separately in the foreign guide" };
  const defs = [
    ["piano", "Piano", "钢琴", "performance", "Music / Piano"],
    ["vocal_music", "Vocal Music", "声乐", "performance", "Music / Vocal Music"],
    ["music_composition", "Music Composition", "音乐作曲", "composition", "Music / Music Composition"],
    ["instrumental_music", "Instrumental Music", "器乐", "performance", "Instrumental Music"],
    ["korean_traditional_music", "Korean Traditional Music", "韩国传统音乐", "performance", "Korean Traditional Music"],
    ["music_technology", "Music Technology", "音乐科技", "music_technology", "New Music / Music Technology"],
    ["jazz_performance", "Jazz Performance", "爵士表演", "jazz_performance", "New Music / Jazz Performance"],
    ["singer_songwriting", "Singer Songwriting", "歌手创作", "songwriting", "New Music / Singer Songwriting"],
  ];
  const fields = [
    field("performance", "Performance", "表演", "Music Performance", "纯音乐系的钢琴、声乐、器乐及韩国传统音乐招生单位按表演核心归类。"),
    field("composition", "Composition", "作曲", "Composition/Theory", "Music Composition 按创作核心归类。"),
    field("music_technology", "Music Technology", "音乐科技", "Music Production/Technology", "一般性 Music Technology 不复用 Berklee 专属 production/engineering 值。"),
    field("jazz_performance", "Jazz Performance", "爵士表演", "Jazz Studies", "爵士表演与 jazz_composition 使用不同 field_ref，但共享 Jazz Studies 分类。"),
    field("songwriting", "Songwriting", "歌曲创作", "Songwriting", "Singer Songwriting 按创作歌曲核心归类。"),
  ];
  const majorReq = "入学后可选：韩语轨新生先进入 School of Global Core Education，完成第一年后自第二年进入申请时选定的音乐专业；申请时须选择计划进入的专业/部门。";
  const programs = defs.map(([key, official, zh, field_ref, dept]) => program({
    school, key, official, zh, department: `College of Music & Arts / ${dept}`, track: official, field_ref,
    programUrl: music, applicationUrl: guide, auditionUrl: guide, tuitionMin: 5968000, tuitionMax: 5968000,
    tuitionPeriod: "per_semester", majorReq, notes: lines(
      "2026 Fall 外国人本科简章列出该音乐招生单位；本包只收 freshman，不收 transfer。",
      "韩语轨音乐申请人先进入 School of Global Core Education，音乐专业从第二年开始；该结构记入 major_declaration_requirements，不新建学位结构。",
      "学费 KRW 5,968,000/学期；官网另列一次性 registration fee KRW 180,000。2027 学年可能调整。",
    ),
  }));
  const rep = {
    piano: { summary: "快速乐章视频，须背谱演奏。", structured: { Piano: ["Video recording of a fast-tempo piece", "Performed from memory"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    vocal_music: { summary: "意大利语或德语歌曲视频，须背谱。", structured: { Vocal_Music: ["Italian or German song", "Memorization required"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    music_composition: { summary: "音频 + 完整乐谱 PDF；一首申请人原创钢琴作品，不收 Applied Music 当代风格。", structured: { Music_Composition: ["Audio recording", "Full score in PDF", "One original piano work composed entirely by applicant", "Applied Music contemporary genre excluded"] }, evaluation: "Artwork Screening; audio and score" },
    instrumental_music: { summary: "快速乐章视频，须背谱；官网按 Instrumental Music 统列，器乐方向保留在 track。", structured: { Instrumental_Music: ["Video recording of a fast-tempo piece", "Performed from memory", "Official admission table lists string, woodwind, brass and percussion directions"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    korean_traditional_music: { summary: "韩国传统或申请人本国传统乐器/声乐任选一项，约 3 分钟。", structured: { Korean_Traditional_Music: ["One performance on a Korean traditional instrument/vocal or home-country traditional instrument/vocal", "Approximately 3 minutes", "Memory performance highly recommended"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    music_technology: { summary: "任选乐器演奏一首的器乐视频。", structured: { Music_Technology: ["Instrumental performance video", "One piece of applicant's choice", "Any instrument"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    jazz_performance: { summary: "一首无伴奏独奏。", structured: { Jazz_Performance: ["Solo performance", "One unaccompanied selection"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
    singer_songwriting: { summary: "自弹自唱视频。", structured: { Singer_Songwriting: ["Self-accompanied performance video"] }, evaluation: "Artwork Screening; video clip or portfolio on USB" },
  };
  const applications = defs.map(([key]) => application({ school, offering: ref(school, key), cycle, deadline: "2026-04-17", timeline, fee: 160000, materials: [...common.dankook, `该招生单位的 ${rep[key].summary}`], language: lang, languageStructured, conditional: "DKU 将音乐招生单位的艺术材料称为 Artwork Screening；提交视频/作品后再进行文件与实技审查。申请人可用 TOPIK 3+ 等资格，或参加 DKU Online Korean Language Examination；英语轨 TOEFL/IELTS 门槛不适用于音乐方向。" }));
  const auditions = defs.map(([key]) => audition({ offering: ref(school, key), cycle, prescreening: "Yes", required: "No", format: "Recorded Only", repertoire: rep[key], video: "视频须以申请人面部近景开始，紧接护照个人信息页；须在材料提交截止日前一个月内录制；存储于 USB。", file: key === "music_composition" ? "音频 + PDF 完整乐谱；其他方向按视频/USB要求" : "视频文件存储于 USB；实体作品集最多 5 件 A4", notes: "官网称为 Artwork Screening/Practical Screening，而非现场 audition；因此 audition_required=No，prescreening_required=Yes。" }));
  const sources = [
    source(school, guide, "Dankook 2026 Fall foreign undergraduate admission units", "Application Requirements Page", "Freshman Korean-track applicants enter School of Global Core Education and select the music major for year 2; the guide lists Music, Instrumental Music, Korean Traditional Music and New Music units."),
    source(school, guide, "Dankook Korean language and eligibility requirements", "English Language Requirements Page", "Non-Korean applicant and both parents non-Korean; Korean Track accepts TOPIK/TOPIK IBT 3+, DKU Level 3+, certified language-centre study, King Sejong Intermediate 1+ or the online Korean exam."),
    source(school, guide, "Dankook practical screening framework", "Audition Requirements Page", "Arts applicants submit artwork/video/portfolio; video must start with a face close-up followed by the passport biodata page and be recorded within one month of the document deadline."),
    source(school, guide, "Dankook music and New Music practical materials", "Audition Requirements Page", "The guide lists direction-specific requirements for Piano, Instrumental Music, Vocal Music, Music Composition, Korean Traditional Music, Jazz Performance, Music Technology and Singer Songwriting."),
    source(school, guide, "Dankook 2026 Fall schedule and fees", "Deadline/Fee Page", "Round 1 application closes 2026-04-17; Arts application fee totals KRW 160,000 (60,000 first stage + 100,000 second stage)."),
    source(school, guide, "Dankook tuition table", "Deadline/Fee Page", "School of Global Core Education Art (Music & Arts) and Arts Music & Arts tuition is KRW 5,968,000 per semester; registration fee is KRW 180,000 one time."),
  ];
  return makePackage({ school, name: "Dankook University", zh: "檀国大学", city: "Yongin / Cheonan", state: "Gyeonggi-do / Chungcheongnam-do", schoolType: "University Music School", website: "https://www.dankook.ac.kr/", intro: "檀国大学 College of Music & Arts 与 New Music 的外国人本科音乐招生单位。", fields, programs, applications, auditions, sources, cycle, stale: true, notes: "本包只收外国人本科 freshman 音乐招生单位；戏剧、舞蹈、电影等排除。New Music 的三个单位沿用已批准的新词表值，不复用 Berklee 专属值。", review: ["Offering 粒度按官网外国人招生单位：8 条；器乐内部乐器方向不拆成 offering。", "韩语轨先进入 Global Core、第二年进入音乐专业，写入 major_declaration_requirements，体现入学后专业选择结构。", "音乐实技在官网被称为 Artwork/Practical Screening，均为视频/作品材料，不写成现场 audition；每条仍保留一条 audition-compatible 记录。", "music_technology 与 jazz_performance 是本批新增词表值；music_technology 归 Music Production/Technology，jazz_performance 归 Jazz Studies。", "底稿更新提示：用当前官网 2026 Fall 的 8 个音乐招生单位、TOPIK/线上韩语考试、KRW 5,968,000/学期及分轮时点替换底稿旧信息；2027 Spring 尚未检出。"] });
})();

const sookmyung = (() => {
  const school = "sookmyung";
  const guide = "https://e.sookmyung.ac.kr/cms/etcResourceDown.do?site=$cms$Q&key=$cms$EwBmDYH0GUAcCcCWA7A5pAhgEwLaIM76ID2ykAqslGkbyrzYCuGALtZANIBKAdLFgDMgA";
  const admissions = "https://admission.sookmyung.ac.kr/enter/html/abroad/guide.asp";
  const music = "https://www.sookmyung.ac.kr/en/university-graduate/music01.do";
  const cycle = "2026 Spring";
  const timeline = { milestones: [
    { label: "Round 1 online application", date_text: "2025-10-13 10:00–2025-10-24 17:00 KST" },
    { label: "Round 1 documents", date: "2025-10-29" },
    { label: "Round 1 interview/practical", date: "2025-11-14" },
    { label: "Round 2 online application", date_text: "2025-11-10 10:00–2025-11-21 17:00 KST" },
    { label: "Round 2 interview/practical", date: "2025-12-19" },
    { label: "Round 3 online application", date_text: "2025-12-17 10:00–2025-12-24 17:00 KST" },
    { label: "Round 3 interview/practical", date: "2026-01-08" },
  ], date_year_note: "截至 2026-08-14 未检出 2027 Spring 新生外国人简章；上列为最近完整的 2026 Spring 简章。" };
  const lang = { tests: ["TOPIK", "TOPIK IBT"], toefl: null, ielts: null, status: "Conditional", waiver: "音乐学院属于韩语轨；通常须 TOPIK/TOPIK IBT 3+ 或学校认可的同等韩语课程/替代考试。官网允许没有语言成绩的艺体申请人以条件录取路径处理，但须先满足入学后的语言条件；英语轨成绩门槛只适用于英语轨专业。", applicant: "父母均为外国人的女性外国人可申请该本科外国人通道；官网不接受具有韩国国籍的双重国籍者。" };
  const languageStructured = { entry: { korean_track: ["TOPIK/TOPIK IBT 3+", "Sookmyung Global Language Institute Level 3+", "other university language institute Level 3+", "King Sejong Intermediate 1", "Social Integration Program Level 3 / pre-assessment 61+"], conditional_art_applicant: "无语言成绩的艺体申请人可按官网条件录取路径申请，之后须达到该学科语言条件" }, graduation: "韩语轨本科毕业前通常需 TOPIK 4+；艺体类为 TOPIK 3+" };
  const defs = [
    ["piano", "Piano", "钢琴", "performance", "Piano"],
    ["orchestral_instruments", "Orchestral Instruments", "管弦乐", "performance", "Orchestral Instruments"],
    ["vocal_music", "Vocal Music", "声乐", "performance", "Vocal Music"],
    ["composition", "Composition", "作曲", "composition", "Composition"],
  ];
  const fields = [
    field("performance", "Performance", "表演", "Music Performance", "Sookmyung Music College 的钢琴、管弦乐与声乐按表演核心归类。"),
    field("composition", "Composition", "作曲", "Composition/Theory", "Sookmyung Composition 按创作核心归类。"),
  ];
  const programs = defs.map(([key, official, zh, field_ref, dept]) => program({
    school, key, official, zh, department: `College of Music / ${dept}`, track: official, field_ref,
    programUrl: music, applicationUrl: admissions, auditionUrl: guide, tuitionMin: null, tuitionMax: null,
    tuitionPeriod: null, majorReq: null, notes: lines(
      "2026 Spring 外国人本科简章在 Music College 下明确列出该招生单位；官方学院页亦列出四个部门。",
      "官网简章未公布本包可核实的本科音乐学费数字，tuition 字段保持 null，不用底稿数字填充。",
      "2027 Spring 新生简章截至核查日未发布，当前记录保持 draft/Needs Review。",
    ),
  }));
  const rep = {
    piano: { summary: "奏鸣曲快速乐章一首 + Chopin Etude 一首（慢曲除外）。", structured: { Piano: ["One fast movement from a Sonata, piano solo", "One F. Chopin Etude, excluding a slow piece"] }, evaluation: "Interview/practical test; overseas alternative USB recording plus video interview" },
    orchestral_instruments: { summary: "自由曲一首，约 15 分钟。", structured: { Orchestral_Instruments: ["One piece of applicant's choice", "Approximately 15 minutes"] }, evaluation: "Interview/practical test; overseas alternative USB recording plus video interview" },
    vocal_music: { summary: "德语艺术歌曲一首 + 意大利语艺术歌曲一首，均须用原文背唱。", structured: { Vocal_Music: ["One German art song of choice, memorized in original language", "One Italian art song of choice, memorized in original language"] }, evaluation: "Interview/practical test; overseas alternative USB recording plus video interview" },
    composition: { summary: "写作三部曲式钢琴曲；海外替代方案为两首原创作品乐谱 + 在线面试（可含钢琴或器乐演奏）。", structured: { Composition: ["Write a piano piece in three-part form", "Overseas alternative: submit scores of two composed works (one piano work and one free-choice work)", "Online interview may include piano or instrumental performance"] }, evaluation: "Interview/practical test; overseas alternative online interview" },
  };
  const applications = defs.map(([key]) => application({ school, offering: ref(school, key), cycle, deadline: "2025-10-24", timeline, fee: 150000, materials: [...common.sookmyung, `该招生单位：${rep[key].summary}`], language: lang, languageStructured, conditional: "音乐学院为韩语轨；主字段记录 TOPIK 3+ 及官网同等替代路径。无语言成绩的艺体申请人存在条件录取路径，具体满足条件后再入学/复学；毕业语言要求另记为艺体类 TOPIK 3+，不与入学门槛混写。" }));
  const auditions = defs.map(([key]) => audition({ offering: ref(school, key), cycle, prescreening: "Yes", required: "Yes", format: "Live or Recorded", repertoire: rep[key], video: "韩国境外申请人可提交实技内容 USB，并参加视频面试；韩国境内按现场面试/实技安排。", file: key === "piano" ? "USB video; overseas alternative" : "USB video or materials per official overseas alternative", accompaniment: key === "vocal_music" ? "官方曲目为艺术歌曲；海外视频替代按该方向曲目提交。" : null, interview: "海外申请人可采用视频面试；Composition 明确写有 online interview。", notes: "官网把音乐学院四个部门列为面试审查/实技测试对象；海外申请人的 USB+视频面试是替代路径，不将其误并为第二个 offering。" }));
  const sources = [
    source(school, guide, "Sookmyung 2026 Spring foreign undergraduate admission guide", "Application Requirements Page", "Music College lists Piano, Orchestral Instruments, Vocal Music and Composition for freshman admission; these units are interview/practical-test units."),
    source(school, admissions, "Sookmyung foreign undergraduate admissions index", "International Students Page", "Official foreign admission guide index for international undergraduate applicants."),
    source(school, guide, "Sookmyung Korean language requirements", "English Language Requirements Page", "Most Korean-track departments require TOPIK 3+ or equivalent; arts applicants without language results have a conditional-admission route; graduation requirement is separately stated."),
    source(school, guide, "Sookmyung Music College practical requirements", "Audition Requirements Page", "Piano, Orchestral Instruments, Vocal Music and Composition have separate practical requirements; overseas alternatives use USB/video interview as stated in the guide."),
    source(school, guide, "Sookmyung 2026 Spring schedule and fee", "Deadline/Fee Page", "The guide lists three rounds between October and December 2025, and the application fee is KRW 150,000 or USD 150."),
    source(school, music, "Sookmyung College of Music", "Official Program Page", "The English college page lists Piano, Orchestral Instruments, Vocal Music and Composition departments."),
  ];
  return makePackage({ school, name: "Sookmyung Women's University", zh: "淑明女子大学", city: "Seoul", schoolType: "University Music School", website: "https://e.sookmyung.ac.kr/", intro: "淑明女子大学音乐学院四个本科外国人招生单位。", fields, programs, applications, auditions, sources, cycle, stale: true, notes: "本包只收 Music College 的 Piano、Orchestral Instruments、Vocal Music、Composition；舞蹈、美术、英语轨及研究生排除。", review: ["四个音乐招生单位均有独立官方招生名目，按官网学位/招生单位粒度各立一条。", "四个方向均为实技/面试对象；海外 USB+视频面试是替代路径，audition_format 记为 Live or Recorded。", "主语言口径为韩语轨 TOPIK 3+ 及同等路径；无语言成绩的艺体条件录取与毕业 TOPIK 3+ 分开记录。", "官方 2026 Spring 简章未给本科音乐学费数字，所有 tuition 字段留 null；不得用底稿数字补齐。", "底稿更新提示：用 2026 Spring 官方三轮日期、KRW 150,000 申请费、四方向逐项实技要求及语言条件替换底稿旧信息；2027 Spring 尚未检出。"] });
})();

function makePackage({ school, name, zh, city, state = null, schoolType, website, intro, fields, programs, applications, auditions, sources, cycle, stale, notes, review }) {
  return {
    schema_version: "stage_music_admissions_v3", status: "draft", last_checked: CHECKED,
    schools: [{ school_ref: school, school_name: name, school_name_zh: zh, city, country: "South Korea", region: null, state_province: state, country_code: "KR", languages_of_instruction: ["Korean"], school_type: schoolType, official_website: website, logo: null, card_image: null, intro_zh: intro, ranking_source: null, ranking_position: null, notes }],
    fields, degree_levels: [degree("当前外国人本科简章未在每个招生单位旁重述完整英文 award title；BM 仅用于项目的本科音乐学位层级，不外推研究生。" )],
    program_offerings: programs, application_requirements: applications, audition_requirements: auditions, source_records: sources,
    publishing: { programs: programs.map((p) => ({ program_offering_ref: p.program_offering_ref, slug: p.program_offering_ref.replace(/_bm$/, ""), answer_sentence_zh: `${p.program_name_zh}：外国人本科通道；具体申请材料、语言与实技要求以官方简章为准。`, field_tiers: { primary: p.field_ref }, cost_estimate_rmb: null, badges: [{ label: `${name} ${p.program_name_zh}`, type: "info", priority: 1 }], freshness_flag: { status: stale ? "outdated_season" : "current_season", last_verified: CHECKED, days_since_update: stale ? 0 : 0 } })) },
    data_quality: { overall_confidence: "High", missing_critical_fields: stale ? ["2026-08-14 未检出下一轮 2027 Spring 新生外国人简章；当前申请记录沿用最近完整官方周期并标记 is_current=false。"] : [], needs_human_review: true, review_notes: review },
    workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
  };
}

for (const pkg of [ewha, dankook, sookmyung]) {
  const path = `${OUT}/${pkg.schools[0].school_ref}-batch3.json`;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log(`wrote ${path} (${pkg.program_offerings.length} offerings)`);
}
