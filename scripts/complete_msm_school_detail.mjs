#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");

async function loadDotEnv(file) {
  try {
    for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
      if (!match) continue;
      process.env[match[1].trim()] ??= match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv(process.env.DIRECTUS_ENV_FILE ?? path.join(root, ".env.local"));
const baseUrl = process.env.DIRECTUS_URL?.replace(/\/+$/, "");
const token = process.env.DIRECTUS_TOKEN;
if (!baseUrl || !token) {
  throw new Error("DIRECTUS_URL and DIRECTUS_TOKEN are required");
}

async function api(method, apiPath, body) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const detail = payload.errors?.map(({ message }) => message).join("; ") ?? response.statusText;
    throw new Error(`${method} ${apiPath} failed (${response.status}): ${detail}`);
  }
  return payload.data;
}

function query(collection, filter, fields = "*") {
  const search = new URLSearchParams({
    limit: "-1",
    fields,
    filter: JSON.stringify(filter),
  });
  return api("GET", `/items/${collection}?${search}`);
}

function equal(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

const checkedAt = "2026-07-20";
const admissionCycle = "Fall 2026";
const academicYear = "2026-2027";

const sections = {
  overview: {
    body_zh:
      "曼哈顿音乐学院（MSM）是位于纽约市的音乐学院，核心培养领域涵盖古典音乐、爵士与音乐剧。学院授予 BM、MM、DMA，并设 PPD、PS 证书和 AD；教师包括活跃于纽约主要乐团、爵士舞台和百老汇的职业艺术家，学生来自数十个国家。",
    source_urls: [
      "https://www.msmnyc.edu/about/",
      "https://www.msmnyc.edu/admission/",
    ],
    evidence_quotes: [
      "One of the world's premier music conservatories for classical music, jazz, and musical theatre.",
      "The MSM faculty comes from the city’s great classical music organizations.",
    ],
    last_checked_at: checkedAt,
    admission_cycle: null,
    academic_year: null,
  },
  international: {
    body_zh:
      "MSM 欢迎国际申请者。母语非英语者目前须提交 Duolingo English Test（DET），TOEFL 和 IELTS 不能替代。申请阶段提交非正式成绩单及学位证明；录取后补交最终正式文件和必要的官方英文译文，学校也可能要求专业学历评估。通过适用预筛者仍须试音；录取后需申请 SEVIS I-20，再办理 F-1 学生签证。",
    source_urls: ["https://www.msmnyc.edu/admission/international-applicants/"],
    evidence_quotes: [
      "TOEFL and IELTS scores are not accepted as an alternative to the DET requirement.",
      "If you are admitted to MSM, you will be required to apply for the SEVIS Form I-20.",
    ],
    last_checked_at: checkedAt,
    admission_cycle: admissionCycle,
    academic_year: null,
  },
  tuition: {
    body_zh:
      "2026–2027 学年全日制学费为 60,800 美元，普通学生费 2,000 美元；校内双人间 12,550 美元，Gold 餐费计划 6,700 美元，学生医保金额尚待公布。MSM 奖学金面向所有学生，约 75% 的全日制学生获得校内奖学金，评定结合入学试音表现与家庭经济需求；国际生应准备自有资金承担奖学金未覆盖的费用。",
    source_urls: [
      "https://www.msmnyc.edu/admission/tuition-overview/",
      "https://www.msmnyc.edu/admission/scholarships-financial-aid/types-of-aid/",
    ],
    evidence_quotes: [
      "Tuition $60,800; General Student Fees $2,000.",
      "MSM Scholarship is awarded to approximately 75% of our full-time enrolled students.",
    ],
    last_checked_at: checkedAt,
    admission_cycle: null,
    academic_year: academicYear,
  },
  campus: {
    body_zh:
      "MSM 地址为 130 Claremont Avenue, New York, NY 10027，位于曼哈顿晨边高地、122 街与百老汇交界，靠近地铁 1 号线。校园设演出场地、图书馆、Myers 录音室及 Andersen 学生宿舍；宿舍楼约可住 525 人并设 79 间练习室。身处纽约便于学生接触职业艺术家、演出及文化资源。",
    source_urls: [
      "https://www.msmnyc.edu/campus/",
      "https://www.msmnyc.edu/campus/student-affairs/housing-residential-life/about-andersen-hall/",
    ],
    evidence_quotes: [
      "Located at the corner of 122nd and Broadway in Morningside Heights.",
      "13 floors with housing for approximately 525 students; 79 practice rooms.",
    ],
    last_checked_at: checkedAt,
    admission_cycle: null,
    academic_year: null,
  },
  policies: {
    body_zh:
      "校级摘要不能替代各专业的预筛与试音曲目要求。申请者须完成试音，适用专业先通过预筛；录制试音仅限官网规定的学位和专业，且不能替代预筛，DMA 与 AD 须现场试音。未收到现场试音日期和时间确认前不要购票。MSM 不通过招生代理传递申请、录取或资助结果；成绩单、日期与要求均以当期官网和申请门户为准。",
    source_urls: [
      "https://www.msmnyc.edu/admission/general-audition-information/",
      "https://www.msmnyc.edu/admission/international-applicants/",
      "https://www.msmnyc.edu/admission/dates-deadlines/college-dates-deadlines/",
    ],
    evidence_quotes: [
      "A recorded audition does not replace prescreening.",
      "You should not purchase travel tickets until MSM has notified you that your live audition date and time have been confirmed.",
    ],
    last_checked_at: checkedAt,
    admission_cycle: admissionCycle,
    academic_year: null,
  },
};

const journal = [];
const schoolFields = await api("GET", "/fields/schools");
if (!schoolFields.some(({ field }) => field === "school_detail_sections")) {
  await api("POST", "/fields/schools", {
    field: "school_detail_sections",
    type: "json",
    meta: {
      interface: "input-code",
      options: { language: "json" },
      note: "Structured school overview sections with Chinese copy, official sources, evidence, cycle/year, and verification date.",
      hidden: false,
      readonly: false,
      required: false,
      searchable: false,
      width: "full",
    },
    schema: { is_nullable: true },
  });
  journal.push({ action: "create_field", collection: "schools", field: "school_detail_sections" });
}

const [school] = await query(
  "schools",
  { slug: { _eq: "manhattan_school_of_music" } },
  "id,slug,intro_zh,last_checked_at,school_detail_sections",
);
if (!school) throw new Error("Existing Manhattan School of Music record was not found");

const schoolPatch = {};
if (school.intro_zh !== sections.overview.body_zh) schoolPatch.intro_zh = sections.overview.body_zh;
if (school.last_checked_at !== checkedAt) schoolPatch.last_checked_at = checkedAt;
if (!equal(school.school_detail_sections, sections)) schoolPatch.school_detail_sections = sections;
if (Object.keys(schoolPatch).length) {
  await api("PATCH", `/items/schools/${school.id}`, schoolPatch);
  journal.push({ action: "update", collection: "schools", id: school.id, fields: Object.keys(schoolPatch) });
}

const topicById = new Map([
  [12, "deadlines"], [13, "transcripts"], [14, "english"], [15, "english"],
  [16, "english"], [17, "english"], [18, "transcripts"], [19, "audition"],
  [20, "audition"], [21, "audition"], [22, "audition"], [23, "audition"],
  [5082, "english"], [5083, "english"], [5084, "aid"], [5085, "aid"],
  [5128, "deadlines"],
]);
const existingSources = await query(
  "source_records",
  { _and: [{ school_id: { _eq: school.id } }, { program_offering_id: { _null: true } }] },
  "id,evidence_metadata,last_checked_at,source_title",
);
for (const source of existingSources) {
  const topicKey = topicById.get(Number(source.id));
  if (!topicKey) continue;
  const metadata = {
    ...(source.evidence_metadata && typeof source.evidence_metadata === "object"
      ? source.evidence_metadata
      : {}),
    topic_key: topicKey,
    ...(topicKey === "deadlines" || topicKey === "english" || topicKey === "transcripts" || topicKey === "audition"
      ? { admission_cycle: admissionCycle }
      : {}),
    ...(Number(source.id) === 5085 ? { academic_year: academicYear } : {}),
  };
  const patch = {};
  if (!equal(source.evidence_metadata, metadata)) patch.evidence_metadata = metadata;
  if (source.last_checked_at !== checkedAt) patch.last_checked_at = checkedAt;
  if (!source.source_title) {
    if (Number(source.id) === 5084) patch.source_title = "Types of Aid";
    if (Number(source.id) === 5085) patch.source_title = "MSM Academic Catalog 2026–2027";
    if (Number(source.id) === 5128) patch.source_title = "MSM College Application";
    if (Number(source.id) === 5082 || Number(source.id) === 5083) patch.source_title = "International Applicants";
  }
  if (Object.keys(patch).length) {
    await api("PATCH", `/items/source_records/${source.id}`, patch);
    journal.push({ action: "update", collection: "source_records", id: source.id, fields: Object.keys(patch) });
  }
}

const durableSources = [
  {
    import_ref: "msm-school-detail-overview-2026",
    source_title: "About MSM",
    source_url: "https://www.msmnyc.edu/about/",
    source_quote: "MSM offers classical, jazz, and musical theatre training with artist-teacher faculty and an international student community.",
    source_type: "Official Program Page",
    related_field: "school_detail_sections.overview",
    topic_key: "official",
  },
  {
    import_ref: "msm-school-detail-admission-2026",
    source_title: "Admission",
    source_url: "https://www.msmnyc.edu/admission/",
    source_quote: "Official MSM entry point for college degrees, application information, faculty, programs, and campus links.",
    source_type: "Application Requirements Page",
    related_field: "school_detail_sections.policies",
    topic_key: "official",
  },
  {
    import_ref: "msm-school-detail-tuition-2026-27",
    source_title: "Tuition Overview",
    source_url: "https://www.msmnyc.edu/admission/tuition-overview/",
    source_quote: "2026–2027 full-time tuition is $60,800 and the general student fee is $2,000.",
    source_type: "Deadline/Fee Page",
    related_field: "school_detail_sections.tuition",
    topic_key: "aid",
    academic_year: academicYear,
  },
  {
    import_ref: "msm-school-detail-campus-2026",
    source_title: "Campus",
    source_url: "https://www.msmnyc.edu/campus/",
    source_quote: "Official campus overview covering the Morningside Heights location, residence hall, performance venues, recording arts, and libraries.",
    source_type: "Official Program Page",
    related_field: "school_detail_sections.campus",
    topic_key: "official",
  },
  {
    import_ref: "msm-school-detail-visa-2026",
    source_title: "International Applicants — Student Visas",
    source_url: "https://www.msmnyc.edu/admission/international-applicants/",
    source_quote: "Admitted international students apply for a SEVIS Form I-20 before applying for an F-1 student visa.",
    source_type: "International Students Page",
    related_field: "school_detail_sections.international",
    topic_key: "visa",
    admission_cycle: admissionCycle,
  },
  {
    import_ref: "msm-school-detail-international-2026",
    source_title: "International Applicants",
    source_url: "https://www.msmnyc.edu/admission/international-applicants/",
    source_quote: "MSM welcomes students from around the globe and does not work with U.S.-based or international admissions agents.",
    source_type: "International Students Page",
    related_field: "school_detail_sections.international",
    topic_key: "international",
    admission_cycle: admissionCycle,
  },
];

for (const definition of durableSources) {
  const [existing] = await query("source_records", { import_ref: { _eq: definition.import_ref } });
  const values = {
    school_id: school.id,
    program_offering_id: null,
    source_title: definition.source_title,
    source_url: definition.source_url,
    source_quote: definition.source_quote,
    source_type: definition.source_type,
    related_field: definition.related_field,
    import_ref: definition.import_ref,
    retrieved_date: checkedAt,
    last_checked_at: checkedAt,
    confidence_level: "High",
    review_status: "Human Checked",
    evidence_metadata: {
      topic_key: definition.topic_key,
      ...(definition.admission_cycle ? { admission_cycle: definition.admission_cycle } : {}),
      ...(definition.academic_year ? { academic_year: definition.academic_year } : {}),
    },
  };
  if (!existing) {
    const created = await api("POST", "/items/source_records", values);
    journal.push({ action: "create", collection: "source_records", id: created.id, import_ref: definition.import_ref });
    continue;
  }
  const patch = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => !equal(existing[key], value)),
  );
  if (Object.keys(patch).length) {
    await api("PATCH", `/items/source_records/${existing.id}`, patch);
    journal.push({ action: "update", collection: "source_records", id: existing.id, fields: Object.keys(patch) });
  }
}

process.stdout.write(`${JSON.stringify({ school_id: school.id, journal, writes: journal.length }, null, 2)}\n`);
