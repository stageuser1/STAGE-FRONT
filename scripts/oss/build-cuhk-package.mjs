/**
 * 香港中文大学音乐本科 canonical 包生成器（Mode B, 2026-08-13）。
 *
 * 用法：node scripts/oss/build-cuhk-package.mjs <输出路径>
 * 只收四年制 B.A. in Music；Senior Year、Minor、研究生项目排除。
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/oss/build-cuhk-package.mjs <package.json>");
  process.exit(2);
}

const SCHOOL = "cuhk";
const OFFERING = "cuhk_music_ba";
const CHECKED = "2026-08-13";
const CYCLE = "2026/27";

const URL_SCHOOL = "https://www.cuhk.edu.hk/";
const URL_PROGRAM = "https://admission.cuhk.edu.hk/programme/muscn/";
const URL_PROGRAM_ZH = "https://admission.cuhk.edu.hk/sc/programme/muscn/";
const URL_PROGRAM_LIST = "https://admission.cuhk.edu.hk/programmes/list/";
const URL_MUSIC_OVERVIEW = "https://www.arts.cuhk.edu.hk/~music/undergraduate-studies-overview";
const URL_STUDY_SCHEME = "https://www.arts.cuhk.edu.hk/~music/undergraduate-studies-study-scheme";
const URL_STREAMS = "https://www.arts.cuhk.edu.hk/~music/undergraduate-studies-the-three-streams";
const URL_GUIDELINES = "https://www.arts.cuhk.edu.hk/~music/_ul/Guidelines_for_2026Entry.pdf";
const URL_NON_JUPAS = "https://admission.cuhk.edu.hk/application/non-jupas/application-guide/";
const URL_NON_JUPAS_GENERAL = "https://admission.cuhk.edu.hk/application/non-jupas/general-requirements/";
const URL_NON_JUPAS_LANGUAGE = "https://admission.cuhk.edu.hk/application/non-jupas/language-requirements/";
const URL_NON_JUPAS_FAQ = "https://admission.cuhk.edu.hk/application/non-jupas/faq/";
const URL_FEES = "https://admission.cuhk.edu.hk/fees-financing-your-studies/fees/";
const URL_MAINLAND = "https://admission.cuhk.edu.hk/sc/application/mainland-gaokao/admission/";
const URL_JUPAS = "https://www.jupas.edu.hk/en/programme/cuhk/JS4082/";

const lines = (...parts) => parts.join("\n");

const TIMELINE = {
  milestones: [
    {
      label: "Non-JUPAS / International Advance Round application deadline",
      date: "2025-11-13",
    },
    {
      label: "Non-JUPAS / International Advance Round audition video and supporting documents",
      date: "2025-11-23",
    },
    { label: "JUPAS application deadline", date: "2025-12-03" },
    {
      label: "Advance Round interview for selected applicants",
      date: "2025-12-11",
      conditional: "Selected applicants only",
    },
    {
      label: "Non-JUPAS / International Regular Round application deadline",
      date: "2026-01-08",
    },
    {
      label: "Non-JUPAS / International Regular Round audition video and supporting documents",
      date: "2026-01-18",
    },
    {
      label: "Regular Round interview for selected applicants",
      date: "2026-02-06",
      conditional: "Selected applicants only",
    },
    {
      label: "JUPAS audition video and supporting documents",
      date: "2026-04-13",
    },
    {
      label: "Non-JUPAS extended application deadline",
      date: "2026-05-29",
      conditional: "After this date, applications are subject to availability",
    },
    {
      label: "Music programme written entrance test",
      date: "2026-05-15",
      conditional: "Selected applicants only",
    },
    {
      label: "Music programme in-person interviews",
      date_text: "26–28 May 2026",
      conditional: "Shortlisted applicants only",
    },
    {
      label: "Mainland Gaokao route",
      date_text: "Through the National Colleges and Universities Enrolment System after Gaokao results",
      conditional: "The official Mainland route says applicants do not apply directly to CUHK; no university application deadline is invented here",
    },
  ],
  date_year_note:
    "官网当前招生页面对应 2026 Entry / 2026-27 cohort；2027/28 本科申请日期截至 2026-08-13 尚未发布。",
};

const fields = [["music", "Music", "音乐", "Musicology"]];
const degreeLevels = [["ba", "Bachelor of Arts", "文学士", "BA"]];

const program = {
  program_offering_ref: OFFERING,
  school_ref: SCHOOL,
  field_ref: "music",
  degree_level_ref: "ba",
  track_or_concentration: "Composition / Performance / Research (declared at the end of Year 2)",
  official_program_name: "B.A. in Music",
  program_name_zh: "音乐文学士",
  department: "Department of Music, Faculty of Arts",
  duration_years: 4,
  language_of_instruction: null,
  program_url: URL_PROGRAM,
  application_url: URL_NON_JUPAS,
  audition_url: URL_GUIDELINES,
  international_url: URL_NON_JUPAS,
  card_summary_zh:
    "香港中文大学文学院音乐系四年制音乐文学士，兼顾音乐人文学术研究与音乐实践训练。",
  degree_system: "Bachelor of Arts",
  tuition_currency: "HKD",
  tuition_amount_min: 214000,
  tuition_amount_max: 214000,
  tuition_period: "per_year",
  funding_policy:
    "Non-local undergraduate tuition is shown in the main field for the project audience; local tuition is retained in notes.",
  major_declaration_requirements: null,
  review_status: "Needs Review",
  last_checked: CHECKED,
  notes: lines(
    "官网课程结构显示 Composition、Performance、Research 为入学后第二学年末选择的三个 study streams；当前原文未显示成绩、作品或审批门槛，因此不写入 major_declaration_requirements。",
    "Electronic Music 出现在课程/选修结构中，不另建 offering 或 field。",
    "本次只收四年制 BA in Music；官网同页列出的 Senior Year Entry、Music Minor、MA/MMus/DMus/MPhil/PhD 均排除。",
    "官网当前未明确说明本科授课语言，language_of_instruction 保留 null；语言考试与中文要求按申请路径记录在 application 条件说明中。",
    "2026-27 非本地本科生年度学费为 HKD214,000；本地本科生 HKD47,000 仅保留在 notes。",
  ),
};

const application = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  application_deadline: "2026-01-08",
  timeline_structured: TIMELINE,
  deadline_notes: lines(
    "按 C10，主 deadline 采用非本地申请人可用的 Non-JUPAS / International Regular Round 主轮截止日 2026-01-08；Advance、extended、JUPAS 及音乐系补交材料时点全部放入 timeline_structured。",
    "Mainland Gaokao 官方路径写明无需直接向 CUHK 申请，因此不把内地高考志愿填报日期伪装成 CUHK application_deadline。",
  ),
  application_fee: 500,
  application_fee_currency: "HKD",
  required_materials: [
    "CUHK undergraduate online application for the Non-JUPAS / International route",
    "Academic credentials, transcripts and public examination results",
    "BA Music audition video and supporting documents",
    "Personal statement recommended by the Music Department (250–300 words in English)",
    "Written entrance test and in-person interview for selected / shortlisted applicants",
  ],
  transcript_requirements:
    "Non-JUPAS Year 1 applicants: transcripts of the most recent two years of study and predicted grades on public examinations; final results and other credentials are uploaded according to the admissions guide.",
  recommendation_letters: null,
  resume_required: "Unknown",
  essay_required: "Optional",
  portfolio_required: "Unknown",
  english_language_tests: [
    "IELTS Academic",
    "TOEFL iBT",
    "SAT Evidence-Based Reading and Writing",
    "ACT English Language Arts",
    "GCSE / IGCSE / GCE-OL English",
    "GCE-AL / AS English",
    "IB English",
    "HKDSE English",
    "Australian State or Territory High School Certificate Grade 12 English",
  ],
  toefl_minimum: 80,
  ielts_minimum: 6.0,
  duolingo_minimum: null,
  english_waiver_policy:
    "For 2026 Entry, the official Non-JUPAS page lists accepted English qualifications and test scores. The TOEFL requirement changes with the test date after 21 January 2026; IELTS Indicator/Online and TOEFL iBT Home Edition are not accepted to fulfil the university English requirement. Chinese-language waiver may be granted at the discretion of the Faculty Dean for eligible recognised non-local curricula.",
  english_requirement_status: "Conditional",
  international_applicant_notes: lines(
    "Non-JUPAS / International Year 1 and Mainland Gaokao are different routes. Mainland current Gaokao candidates, including those with certain Hong Kong visas or HKID, are directed to the National Colleges and Universities Enrolment System rather than Non-JUPAS.",
    "The Music Department publishes programme-specific audition and written-test guidance, while the Mainland general route says there is no direct CUHK application and no interview; the applicability of the supplementary Music process to Mainland Gaokao applicants remains a review item.",
  ),
  conditional_notes: lines(
    "内地高考路径：官方招生页写明报考香港中文大学不需要直接向学校申请，须在高考出分后通过内地教育考试院提前批次填报志愿；官方页面同时写明本校不设面试。音乐系 BA Music 页面另列视频试演、书面考试及面试，二者的路径适用关系未被同一页面明确说明，保留为 CONFLICT，不自行合并。",
    "国际/非联招路径：一般学历包括 GCE-AL / International-AL、IB Diploma 或其他可使申请人进入原属国家/地区大学的认可高中学历；具体竞争性录取仍由学校及专业审核。",
    "JUPAS 路径：官网列出 HKDSE 核心科目及两门选修的最低水平；Music is preferred。主乐器/声乐达到 ABRSM、Trinity College London 或同等 Grade 8 仅作为参考，不写成硬门槛。",
    "语言：主字段记录非联招/国际路径的 IELTS Academic 6.0；TOEFL iBT 2026 Entry 的页面存在考试日期导致的计分制度变化，完整分支保留在 conditional_notes_structured。中文要求及豁免具有路径和 Faculty Dean discretion。",
    "Stream：学生在第二学年末选择 Composition / Performance / Research；目前没有看到成绩、作品或审批门槛，因此不创建 major_declaration_requirements。",
    "2025-26 study scheme 页面明确提醒其内容可能不适用于 2026-27 及以后，本包不把该页的课程总学分当作 2026-27 当前招生字段。",
  ),
  conditional_notes_structured: {
    mainland_gaokao: {
      route: "National Colleges and Universities Enrolment System / Mainland Gaokao",
      direct_cuhk_application: false,
      interview_in_mainland_general_route: false,
      academic_threshold: "At or above the undergraduate first-batch / undergraduate or special-type admission control line, subject to the official Mainland notice.",
      music_supplementary_process: "Unresolved against the Music Department's programme-specific audition / written-test / interview guidance; retained for human review.",
      fixed_music_cutoff: null,
    },
    non_jupas_international: {
      advance_round_deadline: "2025-11-13",
      regular_round_deadline: "2026-01-08",
      extended_deadline: "2026-05-29",
      application_fee_hkd: 500,
      general_qualification_examples: [
        "GCE-AL / International-AL: 3 AL passes or 2 AL + 2 AS passes",
        "International Baccalaureate Diploma",
        "Recognised non-local secondary qualification that qualifies the applicant for university admission in its originating country or region",
      ],
    },
    jupas: {
      programme_code: "JS4082",
      chinese_language: "Level 3",
      english_language: "Level 3",
      mathematics_compulsory_part: "Level 2",
      citizenship_and_social_development: "Attained",
      two_electives: "Level 3 in two elective subjects; Music is preferred",
      music_qualification: "Reference only: Grade 8 ABRSM / Trinity College London / equivalent",
    },
    english: {
      ielts_academic: 6.0,
      toefl_ibt_before_2026_01_21: 80,
      toefl_ibt_on_or_after_2026_01_21: "4.5 out of 6 / 80 out of 120",
      other_minima: {
        sat_ebrw: 590,
        act_ela: 23,
        gcse_igcse_gce_ol: "C / Grade 4",
        gce_al_as: "E",
        ib: 4,
        hkdse: 3,
        australian_year_12_english: "80%",
      },
      chinese_language_waiver: "May be granted at Faculty Dean discretion for eligible recognised non-local curricula.",
    },
    streams: {
      declaration_point: "End of Year 2",
      choices: ["Composition", "Performance", "Research"],
      gate_found_in_current_index: false,
      storage: "track_or_concentration / notes; no major_declaration_requirements",
    },
  },
  estimated_living_cost: null,
  estimated_living_cost_currency: null,
  review_status: "Needs Review",
  notes:
    "HKD500 application fee is the current 2026 Non-JUPAS online application fee; it is not silently applied to the Mainland Gaokao route, which does not use a direct CUHK application.",
};

const audition = {
  program_offering_ref: OFFERING,
  admission_cycle: CYCLE,
  is_current: true,
  prescreening_required: "Yes",
  prescreening_deadline: null,
  audition_required: "Yes",
  audition_format: "Multiple Rounds",
  repertoire_summary:
    "2026 BA Music audition video: two contrasting pieces, one fast and one slow, recorded in a single take; maximum total duration 5 minutes. No instrument-specific or stream-specific repertoire keys were created because the current 2026 guideline gives a general rule only.",
  repertoire_structured: {
    general_2026_entry: {
      pieces: ["one fast piece", "one slow piece"],
      recording: "single take",
      maximum_total_duration_minutes: 5,
      excerpts_allowed: true,
      more_than_one_instrument: "Allowed; applicant must indicate the intended major instrument.",
      contrasting_style_or_period_required: false,
    },
  },
  video_requirements:
    "Show the applicant's face before playing; submit two contrasting pieces in one take; professional recording is not expected and a mobile device is acceptable if sound and image are clear; upload an unlisted YouTube or similar link.",
  file_format_requirements:
    "The guideline specifies an accessible unlisted YouTube or similar-platform link; no separate file-format requirement is stated.",
  accompaniment_requirements: "Accompanist is not required.",
  interview_or_callback_requirements:
    "Shortlisted candidates are invited to an in-person interview, planned for 26–28 May 2026; the guideline states that the interview lasts about 10 minutes.",
  special_notes: lines(
    "The 2026 guideline says the BA Music application additionally includes a video audition, supporting documents and an in-person written entrance test, which form the basis for shortlisting; shortlisted candidates are invited to an in-person interview.",
    "The written test covers aural skills plus theory and analysis. It is a selection stage recorded here alongside the audition process, not a separate offering.",
  ),
  conditional_notes:
    "The current 2026 guideline does not provide separate repertoire pages by instrument or by Composition / Performance / Research stream. Per R1, no instrument- or stream-specific repertoire keys are extrapolated. The Mainland general admissions page's no-interview statement is retained as a route conflict for human review.",
  conditional_notes_structured: {
    music_department_process: {
      video_audition: "Required as part of the BA Music programme-specific process",
      supporting_documents: "Required for processing / shortlisting",
      written_test: "In-person; selected applicants only",
      interview: "In-person; shortlisted applicants only",
    },
    route_conflict: {
      music_department_page: "Audition, written entrance test and interview are described for BA Music.",
      mainland_general_page: "No direct CUHK application and no interview are stated for the Mainland Gaokao route.",
      resolution: "Do not infer whether the Music Department supplementary process applies to Mainland Gaokao applicants; operator review required.",
    },
  },
  review_status: "Needs Review",
  notes:
    "R3/R10 review item: programme-specific Music guidance supports audition_required=Yes, but the Mainland Gaokao general route is described differently. The package preserves both statements instead of changing the programme-level requirement or creating a second audition record.",
};

const source = (
  source_url,
  source_title,
  source_type,
  source_quote,
  related_field = "music",
  confidence_level = "High",
  program_offering_ref = OFFERING,
) => ({
  school_ref: SCHOOL,
  program_offering_ref,
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
  source(
    URL_PROGRAM,
    "Music - CUHK Undergraduate Admissions",
    "Official Program Page",
    "B.A. in Music; JUPAS JS4082; programme code MUSCN; Faculty of Arts; four-year and Senior Year Entry routes listed.",
  ),
  source(
    URL_PROGRAM_ZH,
    "音乐 - 香港中文大学本科招生",
    "Official Program Page",
    "Chinese programme page used as the bilingual comparison for the Music programme and its listed admission routes.",
  ),
  source(
    URL_PROGRAM_LIST,
    "Programme List - CUHK Undergraduate Admissions",
    "Official Program Page",
    "MUSCN Music is listed under Faculty of Arts with JUPAS JS4082 and JUPAS, Non-JUPAS Year 1, Senior Year, Mainland Gaokao and International routes.",
  ),
  source(
    URL_MUSIC_OVERVIEW,
    "Undergraduate Studies - CUHK Music",
    "Application Requirements Page",
    "BA Music is described as humanistic and professional training; the department describes entrance test, audition and interview and publishes route-specific significant dates.",
  ),
  source(
    URL_STUDY_SCHEME,
    "Major in Music - Study Scheme",
    "Official Program Page",
    "The four-year BA offers Composition, Performance and Research streams selected at the end of Year 2; the displayed 2025-26 scheme may not apply to 2026-27 and after.",
  ),
  source(
    URL_STREAMS,
    "The Three Streams",
    "Official Program Page",
    "Students declare one of Composition, Performance and Research at the end of Year 2.",
  ),
  source(
    URL_GUIDELINES,
    "Department of Music 2026 Entry Guidelines",
    "Audition Requirements Page",
    "BA Music additionally includes a video audition, supporting documents and in-person written test; shortlisted candidates are invited to an in-person interview.",
  ),
  source(
    URL_NON_JUPAS,
    "Apply Here - CUHK Undergraduate Admissions",
    "Application Requirements Page",
    "2026 Non-JUPAS Advance, Regular and Extended deadlines; online application fee HK$500.",
  ),
  source(
    URL_NON_JUPAS_GENERAL,
    "General Requirements",
    "International Students Page",
    "Mainland current Gaokao candidates are directed to the National Colleges and Universities Enrolment System rather than Non-JUPAS; general non-local qualification routes are listed.",
  ),
  source(
    URL_NON_JUPAS_LANGUAGE,
    "Language Requirements",
    "English Language Requirements Page",
    "2026 Entry English minima and Chinese-language requirements/waiver policy are listed; TOEFL scoring changes with the test date.",
  ),
  source(
    URL_NON_JUPAS_FAQ,
    "FAQ - CUHK Undergraduate Admissions",
    "Application Requirements Page",
    "Only one undergraduate application may be submitted for 2026 Entry; the online application fee is HK$500.",
  ),
  source(
    URL_FEES,
    "Fees - CUHK Undergraduate Admissions",
    "Deadline/Fee Page",
    "2026-27 annual tuition: HK$47,000 local and HK$214,000 non-local.",
  ),
  source(
    URL_MAINLAND,
    "招生计划 - 香港中文大学本科招生",
    "International Students Page",
    "Mainland Gaokao applicants apply through the national enrolment system; the official general route states that applicants do not apply directly to CUHK and no interview is set.",
    "music",
    "Medium",
  ),
  source(
    URL_JUPAS,
    "Music - JUPAS CUHK",
    "Application Requirements Page",
    "JS4082 Music; audition video and written entrance test are listed; music qualification reference is not converted into a hard admission gate.",
    "music",
    "High",
  ),
];

const packageData = {
  schema_version: "stage_music_admissions_v3",
  status: "draft",
  last_checked: CHECKED,
  schools: [
    {
      school_ref: SCHOOL,
      school_name: "The Chinese University of Hong Kong",
      school_name_zh: "香港中文大学",
      city: "Hong Kong",
      country: "China",
      region: "Hong Kong SAR",
      state_province: null,
      country_code: "HK",
      languages_of_instruction: null,
      school_type: "University Music School",
      official_website: URL_SCHOOL,
      logo: null,
      card_image: null,
      intro_zh:
        "香港中文大学文学院音乐系四年制音乐文学士，兼顾音乐的人文学术研究与实践训练。",
      ranking_source: null,
      ranking_position: null,
      notes: lines(
        "本包只收 Faculty of Arts / Department of Music 的四年制 B.A. in Music。",
        "Senior Year、Music Minor、MA、MMus、DMus、MPhil、PhD 及排名字段均排除/不填。",
      ),
    },
  ],
  fields: fields.map(([field_ref, field_name, field_name_zh, field_category]) => ({
    field_ref,
    field_name,
    field_name_zh,
    field_category,
    parent_field: null,
    field_group: "University Music",
    aliases: null,
    description: "综合大学的标准 BA in Music / Music major。",
    display_order: null,
    _note: "沿用 2026-08-13 运营者先例：综合大学 BA in Music 统一使用 music/Musicology。",
  })),
  degree_levels: degreeLevels.map(
    ([degree_level_ref, degree_level_name, degree_level_name_zh, abbreviation]) => ({
      degree_level_ref,
      degree_level_name,
      degree_level_name_zh,
      abbreviation,
      degree_category: "Undergraduate",
      display_order: null,
      description: null,
      _note: "CUHK Music 本次只保留四年制本科 BA。",
    }),
  ),
  program_offerings: [program],
  application_requirements: [application],
  audition_requirements: [audition],
  source_records,
  publishing: {
    programs: [
      {
        program_offering_ref: OFFERING,
        slug: "music-ba",
        answer_sentence_zh:
          "香港中文大学音乐文学士：综合大学 Musicology 本科，四年制，申请阶段含视频试演及后续音乐测试/面试；内地高考路径需按官方招生路线另行核对。",
        field_tiers: { primary: "music" },
        cost_estimate_rmb: null,
        badges: [{ label: "综合大学 BA in Music", type: "info", priority: 1 }],
        freshness_flag: {
          status: "current_season",
          last_verified: CHECKED,
          days_since_update: 0,
        },
      },
    ],
  },
  data_quality: {
    overall_confidence: "Medium",
    missing_critical_fields: [
      "2027/28 undergraduate application dates not published",
      "Applicability of the Music Department supplementary audition process to Mainland Gaokao applicants is not explicit",
      "Medium of instruction is not explicitly stated on the current undergraduate programme pages",
    ],
    needs_human_review: true,
    review_notes: [
      "Mode A: one official four-year BA in Music offering; MUSCN / JS4082; Senior Year and Minor excluded.",
      "Mode A: field_ref=music and field_category=Musicology follow the approved comprehensive-university BA precedent; no new vocabulary value created.",
      "Mode A: Composition / Performance / Research are end-of-Year-2 study streams. No explicit grade, work or approval gate was found in the current index, so major_declaration_requirements remains null.",
      "C10: application_deadline uses the Non-JUPAS / International Regular Round date 2026-01-08; all other JUPAS, Non-JUPAS, department and Mainland route timing is in timeline_structured.",
      "R10 route conflict: Music Department pages describe video audition, written entrance test and interview; Mainland general admissions page says no direct CUHK application and no interview. The package preserves both statements and does not infer the Mainland supplementary-process applicability.",
      "R3: Grade 8 and Music-preferred language are recorded as reference/preference, not as a hard admission requirement.",
      "R1: current 2026 audition guideline is general rather than instrument- or stream-specific; no unverified repertoire direction keys were created.",
      "Language of instruction is not explicitly stated; it is not inferred from the presence of English and Chinese language outcomes.",
      "Tuition follows the Hong Kong dual-track precedent: non-local HKD214,000/year in main fields, local HKD47,000/year in notes, and cost_estimate_rmb remains null.",
      "Bottom-draft update hint: add current 2026 routes, application/department dates, HKD tuition, the written-test/interview stages, and the Mainland route conflict; the draft's general audition/Grade 8 map is not silently promoted beyond current official wording.",
      "Ranking fields intentionally left null per the operator's Hong Kong/Macao precedent.",
    ],
  },
  workflow_status: {
    extraction_status: "complete",
    review_status: "unreviewed",
    ready_for_directus_import: false,
  },
};

writeFileSync(OUT, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT}`);
