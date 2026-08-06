import type {
  AuditionFormat,
  FiveState,
  ProgramV3,
  YesNoVariesUnknown,
} from "@/data/v3/types";

/**
 * Canonical 包(`schema_version: stage_music_admissions_v3`,Mode F 产出)
 * → T3/T5 组件消费的 `ProgramV3`。
 *
 * **这不是生产接线。** 真实数据进入页面(以及生产路由 `/schools/...`)是
 * T3b 的范围。这个适配器存在的唯一理由是 T5 的自测要求:分享卡必须用
 * T1b 跑出的茱莉亚真实包渲染一张,而真实包是**集合形状**(schools /
 * program_offerings / application_requirements / … 各一个数组,靠
 * `program_offering_ref` 相互引用),T3 的 mock 是**已装配的单条记录**。
 * 没有这一层就没法用真实数据出图。
 *
 * 转换过程中发现的、mock 与真实数据不一致的地方,逐条记在
 * `T5_REVIEW_HANDOFF.md`,并在下面对应位置标注 —— 这里只做形状搬运,
 * 不替上游补数据、不猜缺失字段。
 */

interface RawSchool {
  school_ref: string;
  school_name: string;
  school_name_zh: string | null;
  city: string;
  country: string;
  country_code: string | null;
}

interface RawField {
  field_ref: string;
  field_name: string;
  field_name_zh: string | null;
}

interface RawDegreeLevel {
  degree_level_ref: string;
  degree_level_name_zh: string | null;
  abbreviation: string;
}

interface RawOffering {
  program_offering_ref: string;
  school_ref: string;
  field_ref: string;
  degree_level_ref: string;
  official_program_name: string;
  program_name_zh: string | null;
  duration_years: number | null;
  language_of_instruction: string[] | null;
  program_url: string | null;
}

type RawRecord = Record<string, unknown>;

export interface CanonicalPackage {
  schema_version: string;
  schools: RawSchool[];
  fields: RawField[];
  degree_levels: RawDegreeLevel[];
  program_offerings: RawOffering[];
  application_requirements: RawRecord[];
  audition_requirements: RawRecord[];
  source_records: RawRecord[];
  publishing?: { programs?: RawRecord[] };
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const FIVE_STATES: FiveState[] = [
  "Required",
  "Optional",
  "Not Required",
  "Conditional",
  "Unknown",
];

/** 词表不匹配 → `Unknown`,与提取纪律一致(§1.1「词表不匹配时置 null」)。 */
function fiveState(value: unknown): FiveState {
  return FIVE_STATES.includes(value as FiveState)
    ? (value as FiveState)
    : "Unknown";
}

function yesNo(value: unknown): YesNoVariesUnknown {
  return value === "Yes" || value === "No" || value === "Varies"
    ? value
    : "Unknown";
}

const AUDITION_FORMATS: AuditionFormat[] = [
  "Live Only",
  "Recorded Only",
  "Live or Recorded",
  "Regional",
  "Multiple Rounds",
  "Unknown",
];

function auditionFormat(value: unknown): AuditionFormat {
  return AUDITION_FORMATS.includes(value as AuditionFormat)
    ? (value as AuditionFormat)
    : "Unknown";
}

/** `school_ref` 直接当 slug 用:真实包里它已经是 `juilliard` 这样的 kebab 标识。 */
export function adaptCanonicalPackage(pkg: CanonicalPackage): ProgramV3[] {
  const school = pkg.schools[0];
  if (!school) return [];
  const fieldsByRef = new Map(pkg.fields.map((f) => [f.field_ref, f]));
  const degreesByRef = new Map(
    pkg.degree_levels.map((d) => [d.degree_level_ref, d]),
  );
  const publishingByRef = new Map(
    (pkg.publishing?.programs ?? []).map((p) => [
      p.program_offering_ref as string,
      p,
    ]),
  );

  return pkg.program_offerings.flatMap((offering): ProgramV3[] => {
    const publishing = publishingByRef.get(offering.program_offering_ref);
    // publishing 块缺失 = Mode F 没发布过这个项目,四投影都不该有它。
    if (!publishing) return [];

    const application =
      pkg.application_requirements.find(
        (r) => r.program_offering_ref === offering.program_offering_ref,
      ) ?? {};
    const audition =
      pkg.audition_requirements.find(
        (r) => r.program_offering_ref === offering.program_offering_ref,
      ) ?? {};
    const degree = degreesByRef.get(offering.degree_level_ref);
    const field = fieldsByRef.get(offering.field_ref);

    return [
      {
        school: {
          slug: school.school_ref,
          school_name: school.school_name,
          school_name_zh: str(school.school_name_zh),
          city: school.city,
          country: school.country,
          country_code: str(school.country_code),
        },
        offering: {
          school_ref: offering.school_ref,
          field_ref: offering.field_ref,
          degree_level_ref: offering.degree_level_ref,
          // 差异 ①:真实包里 `program_offerings.program_name_zh` 为 null,
          // 中文专业名在受控词表 `fields[].field_name_zh` 上。Mode F 生成
          // answer_sentence 时用的就是词表那一列(「茱莉亚学院的**声乐**音乐
          // 学士项目」),所以这里回退到同一列 —— 与 Mode F 取同一个事实,
          // 不是前端另找了一个名字。
          program_name_zh:
            str(offering.program_name_zh) ?? str(field?.field_name_zh ?? null),
          official_program_name: offering.official_program_name,
          degree_level_name_zh: degree?.degree_level_name_zh ?? "",
          degree_abbreviation: degree?.abbreviation ?? "",
          duration_years: num(offering.duration_years),
          language_of_instruction: offering.language_of_instruction ?? [],
          program_url: str(offering.program_url),
        },
        application: {
          admission_cycle: str(application.admission_cycle) ?? "",
          application_deadline: str(application.application_deadline),
          application_fee: num(application.application_fee),
          application_fee_currency: str(
            application.application_fee_currency,
          ) as ProgramV3["application"]["application_fee_currency"],
          required_materials: Array.isArray(application.required_materials)
            ? (application.required_materials as string[])
            : [],
          transcript_requirements: str(application.transcript_requirements),
          recommendation_letters: num(application.recommendation_letters),
          resume_required: fiveState(application.resume_required),
          essay_required: fiveState(application.essay_required),
          portfolio_required: fiveState(application.portfolio_required),
          english_language_tests: Array.isArray(application.english_language_tests)
            ? (application.english_language_tests as string[])
            : [],
          toefl_minimum: num(application.toefl_minimum),
          ielts_minimum: num(application.ielts_minimum),
          duolingo_minimum: num(application.duolingo_minimum),
          // 差异 ②:真实包的 application_requirements **没有**
          // `english_requirement_status` 这一列(T3 的 mock 有,并且 T3 的
          // 英语要求行依赖它)。缺列 → `Unknown`,等同于 null:不渲染、
          // 不点亮「免语言成绩」标签。绝不由「有 TOEFL 分数」反推成
          // `Required` —— 那是前端发明五态。已记入移交文档。
          english_requirement_status: fiveState(
            application.english_requirement_status,
          ),
          english_waiver_policy: str(application.english_waiver_policy),
          international_applicant_notes: str(
            application.international_applicant_notes,
          ),
          conditional_notes: str(application.conditional_notes),
        },
        audition: {
          admission_cycle: str(audition.admission_cycle) ?? "",
          prescreening_required: yesNo(audition.prescreening_required),
          prescreening_deadline: str(audition.prescreening_deadline),
          audition_required: yesNo(audition.audition_required),
          audition_format: auditionFormat(audition.audition_format),
          repertoire_summary: str(audition.repertoire_summary),
          video_requirements: str(audition.video_requirements),
          file_format_requirements: str(audition.file_format_requirements),
          accompaniment_requirements: str(audition.accompaniment_requirements),
          special_notes: str(audition.special_notes),
          conditional_notes: str(audition.conditional_notes),
        },
        // 编辑层是独立 collection,提取包里没有,也不该有(§1.6:提取 agent
        // 禁止写 editorial_notes)。
        editorial_note: null,
        publishing: {
          slug: str(publishing.slug),
          answer_sentence_zh: str(publishing.answer_sentence_zh),
          cost_estimate_rmb:
            (publishing.cost_estimate_rmb as ProgramV3["publishing"]["cost_estimate_rmb"]) ??
            null,
          badges: Array.isArray(publishing.badges)
            ? (publishing.badges as ProgramV3["publishing"]["badges"])
            : [],
          freshness_flag:
            (publishing.freshness_flag as ProgramV3["publishing"]["freshness_flag"]) ??
            {
              status: "unknown",
              last_verified: null,
              days_since_update: null,
            },
        },
        sources: pkg.source_records
          .filter((r) => r.program_offering_ref === offering.program_offering_ref)
          .map((r) => ({
            source_url: str(r.source_url) ?? "",
            source_title: str(r.source_title),
            retrieved_date: str(r.retrieved_date) ?? "",
            source_quote: str(r.source_quote),
            related_field: str(r.related_field) ?? "",
            confidence_level:
              (str(r.confidence_level) as "High" | "Medium" | "Low") ?? "Low",
          })),
        related_program_refs: [],
      },
    ];
  });
}
