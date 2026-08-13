/** Macao Polytechnic University undergraduate music package generator, Mode B 2026-08-13. */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-mpu-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "mpu";
const OFFERING = "mpu_music_ba";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";
const URL_SCHOOL = "https://www.mpu.edu.mo/en/";
const URL_MAINLAND_MUSIC = "https://mpusite.mpu.edu.mo/admission_mainland/zh/music.php";
const URL_MAINLAND_FEES = "https://mpusite.mpu.edu.mo/admission_mainland/zh/fees_scholarships_grants.php";
const URL_LOCAL_DIRECT = "https://mpusite.mpu.edu.mo/admission_local/en/direct_admission.php";
const URL_LOCAL_FEES = "https://mpusite.mpu.edu.mo/admission_local/en/fees_scholarships_grants.php";
const URL_LOCAL_UNDERGRAD = "https://mpusite.mpu.edu.mo/admission_local/en/undergraduate.php";
const URL_LOCAL_EXAMS = "https://mpusite.mpu.edu.mo/admission_local/en/admission_exams.php";
const URL_PROGRAM_SPEC = "https://mpusite.mpu.edu.mo/teaching_learning/en/progspec_fad_music.php";
const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    { label: "Mainland music application and video submission", date_options: ["2026-01-15", "2026-03-31"], conditional: "Mainland Gaokao route" },
    { label: "Music video recording window", date_options: ["2025-12-01", "2026-03-31"], conditional: "Mainland Gaokao route" },
    { label: "Music video interview", date_text: "April 2026", conditional: "Mainland music route" },
    { label: "Preliminary offers", date_text: "From mid-May 2026", conditional: "Mainland music route" },
    { label: "Submit Gaokao results", date: "2026-06-30", conditional: "Mainland music route" },
    { label: "Final admission results", date_text: "From July 2026", conditional: "Mainland music route" },
    { label: "Local/direct application", date_options: ["2026-02-01", "2026-06-15"], conditional: "Direct admission route" },
    { label: "Local admission exams / interviews", date_text: "From March 2026", conditional: "Local admission route" },
  ],
  date_year_note: "The primary deadline uses the dedicated Mainland music route (31 March 2026). Local/direct route dates and later selection milestones are retained here as conditional timeline items.",
};

const fields = [["music", "Music", "音乐", "Musicology"]];
const degreeLevels = [["ba", "Bachelor of Arts", "文学士", "BA"]];

const program = {
  program_offering_ref: OFFERING,
  school_ref: SCHOOL,
  field_ref: "music",
  degree_level_ref: "ba",
  track_or_concentration: "Music Education / Music Performance",
  official_program_name: "Bachelor of Arts in Music",
  program_name_zh: "音乐学士学位",
  department: "Faculty of Arts and Design",
  duration_years: 4,
  language_of_instruction: ["Chinese"],
  program_url: URL_PROGRAM_SPEC,
  application_url: URL_MAINLAND_MUSIC,
  audition_url: URL_MAINLAND_MUSIC,
  international_url: URL_MAINLAND_MUSIC,
  card_summary_zh: "澳门理工大学四年制音乐学士学位，官方设音乐教育与音乐表演两个专业方向；内地申请人须按方向提交表演视频并参加后续视频面试。",
  degree_system: "Bachelor of Arts",
  tuition_currency: "MOP",
  tuition_amount_min: 112000,
  tuition_amount_max: 112000,
  tuition_period: "per_year",
  funding_policy: "Main field uses the current Mainland/non-local fee: MOP112,000 per year. Local undergraduate fee is MOP150,000 for the four-year programme, paid in eight instalments, and is retained in notes.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "Official programme specification identifies one Bachelor of Arts in Music, hosted by the Faculty of Arts and Design, with two specialisations: Music Education and Music Performance. One offering is retained because the official final award is one BA in Music; the two specialisations are carried in track_or_concentration and audition structure.",
    "Local fee page lists MOP150,000 total for an undergraduate programme over four years (eight instalments). This is the local-student reference only; the main tuition fields use the Mainland/non-local MOP112,000-per-year figure.",
    "The comprehensive-university BA in Music precedent is applied by official degree genealogy: music is the primary discipline, while the two specialisations do not create separate degree offerings."
  ),
};

const application = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-03-31",
  timeline_structured: TIMELINE,
  deadline_notes: "Primary deadline is the dedicated Mainland music route deadline. The direct/local route and music selection milestones are retained in timeline_structured rather than creating additional application rows.",
  application_fee: 250,
  application_fee_currency: "MOP",
  required_materials: [
    "Online application",
    "2026 Gaokao registration / results documents",
    "2026 provincial music unified-examination result where applicable",
    "Performance video in MP4 or MOV, submitted by the official application route",
    "Video link document identifying programme choice, candidate number and name",
    "Academic / graduation documents and identification documents",
  ],
  transcript_requirements: "Applicants must provide the academic and examination documents required by the applicable route; final admission also requires the relevant Gaokao cultural score and professional score to meet the provincial arts undergraduate line or above.",
  recommendation_letters: null,
  resume_required: "Optional",
  essay_required: "Not Required",
  portfolio_required: "Required",
  english_language_tests: null,
  toefl_minimum: null,
  ielts_minimum: null,
  duolingo_minimum: null,
  english_waiver_policy: "The current Mainland music route specifies Gaokao and the provincial music unified examination / performance video; it does not publish a separate English-test threshold for this route. Direct-admission document languages are Chinese, Portuguese or English, with certified translation otherwise.",
  english_requirement_status: "Conditional",
  international_applicant_notes: lines(
    "Mainland applicants use MPU's independent Mainland admission route and must take the 2026 Gaokao plus the 2026 music unified examination where their province has one.",
    "If the province does not organise a music unified examination, the official music route permits application with a performance video and subsequent video interview.",
    "The direct-admission route also lists BA Music (Education/Performance), with a music portfolio consisting of a personal performance video, CV and optional awards / graded certificates."
  ),
  conditional_notes: lines(
    "Direction-specific admission material: Music Performance requires two excerpts from different composers and styles; Music Education requires one piano and one vocal excerpt, with an additional instrument if needed.",
    "Mainland selection combines the provincial music examination result where applicable, submitted video, video interview / self-assessment, Gaokao cultural result and professional result. The published provincial arts undergraduate-line condition is retained here rather than collapsed into a single numeric threshold.",
    "The programme specification states Chinese as medium of instruction. No separate English test threshold is stated on the current Mainland music admission page."
  ),
  conditional_notes_structured: {
    mainland_route: {
      qualification: "2026 Gaokao / NCEE",
      professional_exam: "2026 provincial music unified examination where available",
      no_provincial_exam: "Performance video plus video interview",
      cultural_and_professional_score: "Both at or above the provincial arts undergraduate admission line",
    },
    programme_directions: ["Music Education", "Music Performance"],
    language: { medium_of_instruction: "Chinese", separate_english_threshold_published: false },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes: "MOP250 application fee is from the current Mainland fee page. RMB approximations displayed by the official page are not stored; cost_estimate_rmb remains null.",
};

const audition = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Yes",
  prescreening_deadline: "2026-03-31",
  audition_required: "Yes",
  audition_format: "Multiple Rounds",
  repertoire_summary: "A recorded performance video is required for the Mainland music route, followed by selection for a video interview. Requirements differ by the two official specialisations.",
  repertoire_structured: {
    "Music Performance": {
      video: "Two excerpts from works by different composers and in different styles; Chinese or Western instrument or voice. Vocal applicants must perform from memory.",
      total_length: "All videos together no longer than 10 minutes.",
      recording: "One uninterrupted camera shot per excerpt; MP4 or MOV; face, hands and instrument / piano keys visible as specified by the official page.",
    },
    "Music Education": {
      video: "One piano excerpt and one vocal excerpt; style and level are self-selected; an additional instrument may be included if needed.",
      total_length: "All videos together no longer than 10 minutes.",
      recording: "One uninterrupted camera shot per excerpt; MP4 or MOV; face, hands and instrument / piano keys visible as specified by the official page.",
    },
  },
  video_requirements: "Video must be recorded between 1 December 2025 and 31 March 2026; submit a permanent Baidu Netdisk link in a Word document through the application page, with first/second programme choice, candidate number and name.",
  file_format_requirements: "MP4 or MOV; all videos together no longer than 10 minutes.",
  accompaniment_requirements: "Vocal performance may use piano accompaniment or be a cappella; accompaniment tracks are not allowed.",
  interview_or_callback_requirements: "Shortlisted applicants attend a video interview in April 2026; the published content is an interview and sight-singing in staff notation within two sharps / two flats.",
  special_notes: "One audition record is used for the single official BA Music offering. The two specialisations are not merged into one repertoire statement: each direction is recorded separately from the current official page.",
  conditional_notes: "If a province has no music unified examination, MPU selects applicants from the submitted video for video interview; this is a route condition, not an extrapolated exemption.",
  conditional_notes_structured: {
    music_performance: "Two contrasting excerpts, different composers and styles; vocal applicants sing from memory.",
    music_education: "One piano and one vocal excerpt; optional additional instrument.",
    interview: "Interview plus sight-singing within two sharps / two flats.",
  },
  review_status: "Needs Review",
  notes: "The official page does not provide instrument-by-instrument repertoire pages; no further instrument keys are invented."
};

const source = (source_url, source_title, source_type, source_quote, related_field = "music", confidence_level = "High") => ({
  school_ref: SCHOOL,
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  source_url,
  source_title,
  source_type,
  retrieved_date: CHECKED,
  raw_markdown: null,
  source_quote,
  related_field,
  confidence_level,
  review_status: "Extracted",
});

const source_records = [
  source(URL_PROGRAM_SPEC, "Bachelor of Arts in Music programme specification", "Official Program Page", "The final award is Bachelor of Arts in Music; normal study is four years; medium of instruction is Chinese; specialisations are Music Education and Music Performance."),
  source(URL_LOCAL_UNDERGRAD, "Local undergraduate programme list", "Official Program Page", "The undergraduate list identifies BA in Music (Education/Performance), four years daytime, Chinese medium, code FAD M1."),
  source(URL_MAINLAND_MUSIC, "Mainland music admission route", "Application Requirements Page", "Mainland candidates must take the 2026 Gaokao and 2026 music unified examination where applicable; if no provincial music examination exists, a performance video route is available."),
  source(URL_MAINLAND_MUSIC, "Mainland music video requirements", "Audition Requirements Page", "Music Performance requires two excerpts by different composers and styles; Music Education requires one piano and one vocal excerpt; video interview includes interview and sight-singing within two sharps / two flats.", "music", "High"),
  source(URL_MAINLAND_FEES, "Mainland fees and scholarships", "Deadline/Fee Page", "Mainland application fee is MOP250; undergraduate tuition for 2024/25 intake or after is MOP448,000 over four years, or MOP112,000 per year. RMB approximations are displayed but not stored.", "music", "High"),
  source(URL_LOCAL_DIRECT, "Direct admission route", "Application Requirements Page", "The direct admission programme list includes Bachelor of Arts in Music (Education/Performance); the music portfolio requires a personal performance video, CV and optional awards / graded certificates; application runs 1 February to 15 June 2026."),
  source(URL_LOCAL_FEES, "Fees for local students", "Deadline/Fee Page", "Local undergraduate tuition is MOP150,000 for the four-year programme, paid in eight instalments; local application fee is MOP250."),
  source(URL_LOCAL_EXAMS, "Local admission exams", "Application Requirements Page", "Local admission can include the Joint Admission Examination and/or specialised examinations/interviews; current programme-specific exam arrangements are published through the admission route."),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [{
    school_ref: SCHOOL,
    school_name: "Macao Polytechnic University",
    school_name_zh: "澳门理工大学",
    city: "Macao",
    country: "China",
    region: "Macao SAR",
    state_province: null,
    country_code: "MO",
    languages_of_instruction: ["Chinese"],
    school_type: "Arts University",
    official_website: URL_SCHOOL,
    logo: null,
    card_image: null,
    intro_zh: "澳门理工大学音乐学士学位：一个官方 BA in Music 学位，下设 Music Education 与 Music Performance 两个专业方向。",
    ranking_source: null,
    ranking_position: null,
    notes: "本包只收四年制 BA in Music；其他本科、研究生及非音乐项目排除。",
  }],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref, field_name, field_name_zh, field_category, parent_field: null,
    field_group: "University Music", aliases: null, description: null, display_order: null,
    _note: "Applied P8: an official comprehensive/university BA in Music uses music/Musicology; official specialisations remain in the offering track and audition structure.",
  })),
  degree_levels: degreeLevels.map(([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
    degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation,
    degree_category: "Undergraduate", display_order: null, description: null,
    _note: "The official award is Bachelor of Arts in Music.",
  })),
  program_offerings: [program],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records,
  publishing: { programs: [{
    program_offering_ref: OFFERING,
    slug: "music-ba",
    answer_sentence_zh: "澳门理工大学音乐学士学位：四年制中文授课，一个官方 BA in Music 下设音乐教育与音乐表演方向；内地申请人须提交按方向区分的表演视频并参加后续视频面试。",
    field_tiers: { primary: "music" },
    cost_estimate_rmb: null,
    badges: [{ label: "Music Education / Music Performance", type: "info", priority: 1 }],
    freshness_flag: { status: "current_season", last_verified: CHECKED, days_since_update: 0 },
  }] },
  data_quality: {
    overall_confidence: "High",
    missing_critical_fields: [],
    needs_human_review: true,
    review_notes: [
      "Existence gate passed: the current official programme specification and admission lists identify a Bachelor of Arts in Music, not merely music-related courses.",
      "Offering grain: one offering follows the one official final award; Music Education and Music Performance are official specialisations, not separate degree awards.",
      "Classification: music/Musicology follows the comprehensive-university BA in Music precedent; the programme is not a creative-industry/media fusion degree, so professional_music is not used.",
      "Audition: one record; repertoire_structured keeps Music Performance and Music Education separate and does not invent instrument-level keys absent from the official page.",
      "Tuition: main field uses Mainland/non-local MOP112,000 per year; local MOP150,000 total over four years is retained in notes. cost_estimate_rmb is null; official RMB approximations are not copied.",
      "Bottom-draft update hint: replace any prior programme/fee/timing assumptions with the current BA in Music single-award structure, two official specialisations, MOP112,000 non-local annual fee, MOP250 application fee, and 2026 Mainland music dates/video requirements.",
    ],
  },
  workflow_status: { extraction_status: "complete", review_status: "unreviewed", ready_for_directus_import: false },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
