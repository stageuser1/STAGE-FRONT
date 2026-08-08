/**
 * STAGE V3 — Web Card / 详情页 data shapes.
 *
 * Mirrors the data dictionary (`collections_reference.md(旧 CMS 数据字典)` §5–7, §13)
 * and the blueprint (`STAGE_V3_交接蓝图.md` §1.4, §13). This is the shape T3
 * components consume; it is NOT a the legacy CMS client — wiring to real the legacy CMS
 * queries is a later ticket. Every field that can be null in canonical is
 * typed nullable here on purpose, so `null` has to be handled at every call
 * site instead of being coerced away.
 */

export type Tier = "Extracted" | "Needs Review" | "Verified" | "Outdated";

/**
 * §1.1 五态: null / Not Required / Optional / Required / conditional.
 * `null` is expressed by the field being nullable; `Unknown` is the deployed
 * the legacy CMS dropdown's "we did not determine this" value and renders as
 * nothing, exactly like null (§3.1).
 *
 * `Conditional` is the blueprint's fifth state. The deployed dropdown does
 * not carry it yet (dictionary §5 lists four values), so the casing here
 * follows the sibling values' PascalCase convention — confirm against the
 * column when the schema adds it. A `Conditional` value obliges the renderer
 * to surface the matching `conditional_notes` (§3.2), never to collapse it
 * into Required/Not Required.
 */
export type FiveState =
  | "Required"
  | "Optional"
  | "Not Required"
  | "Conditional"
  | "Unknown";

export type YesNoVariesUnknown = "Yes" | "No" | "Varies" | "Unknown";

export type AuditionFormat =
  | "Live Only"
  | "Recorded Only"
  | "Live or Recorded"
  | "Regional"
  | "Multiple Rounds"
  | "Unknown";

export interface SourceRecordV3 {
  source_url: string;
  source_title: string | null;
  retrieved_date: string; // ISO date, required per §13/§7
  source_quote: string | null;
  related_field: string;
  confidence_level: "High" | "Medium" | "Low";
}

export interface SchoolV3 {
  slug: string;
  school_name: string;
  school_name_zh: string | null;
  city: string;
  country: string;
  country_code: string | null;
}

export interface ProgramOfferingV3 {
  school_ref: string;
  field_ref: string;
  degree_level_ref: string;
  program_name_zh: string | null;
  official_program_name: string;
  degree_level_name_zh: string;
  degree_abbreviation: string;
  duration_years: number | null;
  language_of_instruction: string[];
  program_url: string | null;
}

export interface ApplicationRequirementsV3 {
  admission_cycle: string; // "Fall 2026"
  application_deadline: string | null; // ISO date
  application_fee: number | null;
  application_fee_currency: "USD" | "GBP" | "EUR" | "CAD" | null;
  required_materials: string[];
  transcript_requirements: string | null;
  recommendation_letters: number | null;
  resume_required: FiveState;
  essay_required: FiveState;
  portfolio_required: FiveState;
  english_language_tests: string[];
  toefl_minimum: number | null;
  ielts_minimum: number | null;
  duolingo_minimum: number | null;
  english_requirement_status: FiveState;
  english_waiver_policy: string | null;
  international_applicant_notes: string | null;
  conditional_notes: string | null;
}

export interface AuditionRequirementsV3 {
  admission_cycle: string;
  prescreening_required: YesNoVariesUnknown;
  prescreening_deadline: string | null;
  audition_required: YesNoVariesUnknown;
  audition_format: AuditionFormat;
  repertoire_summary: string | null;
  video_requirements: string | null;
  file_format_requirements: string | null;
  accompaniment_requirements: string | null;
  special_notes: string | null;
  conditional_notes: string | null;
}

export type CostSourceType = "official" | "config_estimate";

export interface CostComponentV3 {
  item: "tuition" | "living_cost";
  value?: number;
  value_min?: number;
  value_max?: number;
  currency: string;
  source_type: CostSourceType;
  period?: "per_year" | "per_semester" | "total_program";
  period_basis?: string;
  composition_note?: string;
}

/**
 * Three forms, told apart by `currency` (§3.6 / §13):
 * ① currency "CNY", components include an "official" tuition — converted,
 *    official CoA basis.
 * ② currency "CNY", living_cost component is "config_estimate" — converted,
 *    third-party living-cost estimate.
 * ③ currency !== "CNY" — tuition only, original currency, no fx fields.
 * `null` overall = no tuition data at all (the whole cost line is hidden).
 */
export interface CostEstimateRmbV3 {
  min: number; // already rounded to 万 (ruling T2-R2) when currency === "CNY"
  max: number;
  currency: string;
  components: CostComponentV3[];
  fx_rate?: number;
  fx_snapshot_date?: string; // "2026-07-01" — month is what's disclosed
  methodology_version: string;
}

export type BadgeType = "success" | "warning" | "info";

export interface BadgeV3 {
  label: string;
  type: BadgeType;
  priority: number;
}

export type FreshnessStatus =
  | "current_season"
  | "outdated_season"
  | "changed"
  | "unknown";

export interface FreshnessFlagV3 {
  status: FreshnessStatus;
  last_verified: string | null; // ISO date
  days_since_update: number | null; // internal reference only, never rendered as a judgment
}

export interface EditorialNoteV3 {
  short_positioning: string; // ≤20 字
  key_difficulty: string | null; // ≤30 字
}

export interface PublishingV3 {
  slug: string | null;
  answer_sentence_zh: string | null;
  cost_estimate_rmb: CostEstimateRmbV3 | null;
  badges: BadgeV3[];
  freshness_flag: FreshnessFlagV3;
}

/**
 * §1.2 `share_card_metric_rules` — the four seeded rows, mirrored into the
 * repo (see `data/v3/share-card-metric-rules.ts`).
 */
export type ShareCardMetricKey =
  | "language_requirement"
  | "prescreening_audition"
  | "deadline"
  | "total_cost";

export interface ShareCardMetricRuleV3 {
  metric_key: ShareCardMetricKey;
  /** 1 = highest. §1.2: 语言要求 > 预筛/试音 > 截止日期 > 总费用. */
  priority: number;
  label_zh: string;
  enabled: boolean;
  /** Whether a lower-priority rule may take this rule's slot when its own
   * value is missing (§1.2 「字段缺失按序补位」). */
  fallback_when_missing: boolean;
}

export interface ShareCardMetricV3 {
  metric_key: ShareCardMetricKey;
  label: string;
  value: string;
}

/**
 * `share_card_payload`。字段全部由 canonical + publishing 派生;没有一个字段
 * 是为这张卡另写的,`editorial_note` 在类型层面就没有进来的路径(§0.3)。
 *
 * `metrics` 由构造保证 ≤3(§1.2),且永不含占位条目 —— 没有取值的规则整条
 * 消失,不留空位。
 *
 * **字段数:8 = 蓝图 §1.4 的 7 个 + T5 扩展 1 个。**
 *
 * 蓝图 §1.4 逐字写死的是七个:`name_zh`、`name_en`、`program_zh`、
 * `degree_abbr`、`metrics`、`verified_stamp`、`qr_url`。
 * `qr_domain` 是 **T5 新增的实现扩展**(裁决 T5-R2 / Codex 第二轮,2026-08-04):卡面在二维码
 * 旁还要用文字印出域名,它由生成 `qr_url` 的同一个 `SITE_URL` 派生,不引入任何
 * 新事实。之所以在这里写清楚,是因为初版测试把八个字段一起说成「§1.4 定义」,
 * 那等于在验证一份不存在的规格。
 *
 * 这段注释**就是本仓库内的正式契约记录**(另一份同文在
 * `T5_REVIEW_HANDOFF.md` §9)。跨仓库的数据字典
 * `D:\STAGE_NIGHT_PROCESSOR\stage-music-admissions-extractor\references\collections_reference.md(旧 CMS 数据字典)`
 * 的 "`share_card_payload` — implemented as 8 fields" 小节有同一条记录 ——
 * 那个文件不在本仓库内,所以这里写绝对路径。`sc:A4` 把两个集合分开断言。
 *
 * 后续再往 `share_card_payload` 加字段,必须先改上述扩展清单(三处同步),
 * 再改断言 —— 不许把字段数改大之后仍称「§1.4 定义」。
 */
export interface ShareCardPayloadV3 {
  /** 中文校名;缺失时回退英文校名(核心原则 6 / 裁决 T3-R3.2). */
  name_zh: string;
  name_en: string;
  program_zh: string;
  degree_abbr: string;
  metrics: ShareCardMetricV3[];
  /** 「官网核实 YYYY年M月」, or the 变更中 wording when freshness says the
   * page changed; null when no verification date exists at all. */
  verified_stamp: string | null;
  /** Absolute URL encoded into the QR code (ruling T5-R2). */
  qr_url: string;
  /** Bare host shown next to the QR code. */
  qr_domain: string;
}

/** One assembled program record — everything a card or detail page reads. */
export interface ProgramV3 {
  school: SchoolV3;
  offering: ProgramOfferingV3;
  application: ApplicationRequirementsV3;
  audition: AuditionRequirementsV3;
  editorial_note: EditorialNoteV3 | null;
  publishing: PublishingV3;
  sources: SourceRecordV3[];
  related_program_refs: string[]; // program_offering_ref of related programs, same school
}
