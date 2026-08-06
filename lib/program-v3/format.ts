import type {
  CostEstimateRmbV3,
  FreshnessStatus,
  ProgramV3,
} from "@/data/v3/types";

/** §3.3: JS char-count truncation, never CSS line-clamp — the cut point must
 * be identical on every device. A plain string slice already is: it does not
 * depend on font metrics, so there is no need for this to run in the
 * browser — computing it at render time (server or client, same code) yields
 * the same boundary everywhere. */
export const REPERTOIRE_TRUNCATE_LENGTH = 80;

export function truncateChars(
  text: string,
  limit: number = REPERTOIRE_TRUNCATE_LENGTH,
): { preview: string; isTruncated: boolean } {
  const chars = Array.from(text);
  if (chars.length <= limit) {
    return { preview: text, isTruncated: false };
  }
  return { preview: `${chars.slice(0, limit).join("")}…`, isTruncated: true };
}

/** "2025-12-01" → "2025年12月1日"; null passes through as null (§3.1: no
 * placeholder is manufactured here — callers decide whether to render the
 * row at all). */
export function formatDateZh(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

/** "2026-07-01" → "2026-07" for the fx/verification-month disclaimers. */
export function formatYearMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

/** "2026-07-01" → "2026年7月". §3.4 asks the unknown-freshness bar for a
 * 核实月份, not a full date — the day would imply a precision the state
 * itself does not claim. */
export function formatYearMonthZh(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月`;
}

/** Stable identity for a program across compare/favorite lists. Includes the
 * school: `voice`+`bm` exists at more than one school, so a key without it
 * would silently merge two different programs into one entry. */
export function programOfferingRef(program: ProgramV3): string {
  return `${program.offering.school_ref}-${program.offering.field_ref}-${program.offering.degree_level_ref}`;
}

/**
 * The detail page path for a program, or `null` when Mode F never generated
 * a slug (§13: dangling field/degree refs mean no slug, no page — ruling
 * T3-R4.4).
 *
 * `/schools/{school-slug}/{program-slug}` per blueprint §2.2 (T3b, human
 * ruling 2026-08-05: partial migration — only programs that carry a real
 * `publishing.slug` route here; everything else stays on the legacy
 * Directus-backed `/schools/{schoolId}/programs/{programId}` route, which
 * this function never touches). Every consumer of this path (cards,
 * related-program links, JSON-LD `url`, sitemap `loc`, share-card QR) goes
 * through this one function, so a future full migration only changes it
 * here. Note: `/v3-preview`'s own pages resolve program objects whose
 * `school.slug` carries a `-t1b` collision-avoidance suffix (see
 * `data/v3/preview-registry.ts`), so links built from *those* objects point
 * at a slug this route doesn't serve — expected, since `/v3-preview` is a
 * disallowed dev-only surface, not a production consumer of this path.
 */
export function programDetailHref(program: ProgramV3): string | null {
  if (!program.publishing.slug) return null;
  return `/schools/${program.school.slug}/${program.publishing.slug}`;
}

export type DeadlineState =
  | { kind: "open"; days: number }
  | { kind: "closing"; days: number }
  | { kind: "closed" };

/**
 * §3.4: three states computed from now() vs deadline, independent of
 * freshness. Returns null only when there is no deadline to compute
 * against — that is a "row doesn't render" case, not a state.
 *
 * Counted in **calendar days**, both sides floored to local midnight, for
 * two reasons a millisecond subtraction got wrong:
 *
 * - `Math.ceil` on a negative fraction yields `-0`, and `-0 < 0` is false.
 *   A deadline that passed earlier the same morning was therefore reported
 *   as still open, labelled 「距截止 -0 天」.
 * - A raw ms difference changes during the day, so the same deadline read
 *   「距截止 19 天」 at breakfast and 「18 天」 after dinner. Whole days
 *   between dates is also what 「距截止 N 天」 means to a reader.
 *
 * `Math.round` absorbs the ±1h a DST boundary puts between two midnights.
 */
export function deadlineState(
  deadline: string | null,
  now: Date = new Date(),
): DeadlineState | null {
  if (!deadline) return null;
  const target = new Date(`${deadline.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round(
    (target.getTime() - today.getTime()) / 86_400_000,
  );
  if (days < 0) return { kind: "closed" };
  return { kind: days <= 30 ? "closing" : "open", days };
}

const FRESHNESS_LABEL: Record<
  Exclude<FreshnessStatus, "unknown">,
  { text: (cycle: string) => string; tone: "green" | "yellow" | "red" }
> = {
  current_season: {
    text: (cycle) => `官网核实 · ${cycle} · 未检测到变更`,
    tone: "green",
  },
  // Ratified by the human (not in the blueprint's §3.4 verbatim quotes,
  // which only give current_season/changed): "过时" leads so the reader
  // doesn't mistake this for freshly-verified data — "官网核实" trailing
  // would read as an endorsement of the season, not just of the retrieval.
  outdated_season: {
    text: (cycle) => `上一申请季数据 · 官网核实 ${cycle}`,
    tone: "yellow",
  },
  changed: {
    text: () => "官网内容有变更,信息更新中",
    tone: "red",
  },
};

export function freshnessLabel(
  status: FreshnessStatus,
  admissionCycle: string,
): { text: string; tone: "green" | "yellow" | "red" } | null {
  if (status === "unknown") return null;
  return {
    text: FRESHNESS_LABEL[status].text(admissionCycle),
    tone: FRESHNESS_LABEL[status].tone,
  };
}

/** PHRASING_V1.audition_format (data dictionary §13 附录) — reused verbatim
 * for the UI so the card and answer_sentence never disagree on wording. */
export const AUDITION_FORMAT_ZH: Record<string, string> = {
  "Live Only": "现场试音",
  "Recorded Only": "录像试音",
  "Live or Recorded": "现场或录像试音",
  Regional: "区域试音",
  "Multiple Rounds": "多轮试音",
};

/** `Unknown` and null render nothing (PHRASING_V1 note). */
export function auditionFormatZh(format: string): string | null {
  return AUDITION_FORMAT_ZH[format] ?? null;
}

export const FIVE_STATE_ZH: Record<string, string> = {
  Required: "需要",
  "Not Required": "无需",
  Optional: "可选",
  // §1.1 五态的第五态。措辞刻意不落到"需要/无需"任一侧 —— 条件本身
  // 才是事实,细则由 conditional_notes 承载(§3.2)。
  Conditional: "有条件要求",
};

/** `Unknown` renders nothing — null ≠ Not Required (§3.1/§3.2). */
export function fiveStateZh(state: string): string | null {
  return FIVE_STATE_ZH[state] ?? null;
}

export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Language vocabulary — a **necessary but never sufficient** signal. See
 * `conditionIsPurelyLanguage`.
 */
const LANGUAGE_CONDITION_HINTS = [
  "英语",
  "语言成绩",
  "语言要求",
  "语言能力",
  "语言水平",
  "托福",
  "雅思",
  "多邻国",
  "toefl",
  "ielts",
  "duolingo",
  "english",
];

/**
 * Vocabulary for every *other* requirement a condition could be about. Any
 * single hit vetoes the merge, whatever else the sentence contains.
 */
const OTHER_REQUIREMENT_HINTS = [
  "作品集",
  "作品",
  "曲目",
  "试音",
  "预筛",
  "面试",
  "回访",
  "录像",
  "视频",
  "录音",
  "总谱",
  "推荐信",
  "成绩单",
  "简历",
  "文书",
  "个人陈述",
  "材料",
  "申请费",
  "portfolio",
  "repertoire",
  "audition",
  "prescreen",
  "interview",
  "video",
  "recording",
  "recommendation",
  "transcript",
  "resume",
  "essay",
  "material",
];

/**
 * Whether `application_requirements.conditional_notes` may be merged into
 * the English requirement line.
 *
 * The field is **table-scoped** (dictionary §5: "explicit home for any
 * 'only if X' condition"), so it can be about the portfolio, the fee, the
 * deadline or the materials just as easily as about English. Filing a
 * portfolio condition under 「英语要求」 tells the reader the English
 * requirement is conditional when it is not.
 *
 * Direction matters more than vocabulary here (ruling T3-R5.1). An earlier
 * version asked "does this mention a language?" and merged on a hit, which
 * loses to any sentence that mentions both — 「作品集须包含至少一部英语声乐
 * 作品」 is a portfolio rule that would have been filed under English.
 * Chasing that with more exclusions is an arms race with no end: bar
 * 「作品」 and 「面试用英语进行」 still gets through.
 *
 * So the question is inverted. **Standalone is the default.** A merge
 * requires both gates to hold: the sentence must name a language
 * requirement *and* must not name any other requirement at all. Any doubt
 * — including a sentence that spans both — stays standalone.
 *
 * The two lists carry asymmetric risk, which is the property to preserve:
 * adding to `OTHER_REQUIREMENT_HINTS` can only move conditions toward
 * standalone and is always safe; adding to `LANGUAGE_CONDITION_HINTS` is
 * what re-opens the misfiling exposure. Extend the veto list freely;
 * extend the language list only with a reason.
 *
 * The cost is that some genuinely pure language conditions read as a
 * separate line rather than as a tail on the English row. Verbose is not
 * wrong; misattributed is. The real fix is a field-level split in the
 * schema (tracked on T2b), not a better word list.
 */
export function conditionIsPurelyLanguage(note: string): boolean {
  const text = note.toLowerCase();
  const namesLanguage = LANGUAGE_CONDITION_HINTS.some((hint) =>
    text.includes(hint),
  );
  if (!namesLanguage) return false;
  const namesSomethingElse = OTHER_REQUIREMENT_HINTS.some((hint) =>
    text.includes(hint),
  );
  return !namesSomethingElse;
}

/**
 * The source page backing a given field, for §3.2's 「豁免细则见官网来源
 * (链接)」. Matches `source_records.related_field` against the supplied
 * hints, case-insensitively.
 *
 * Returns `null` when nothing matches — the caller then renders the wording
 * without a link rather than pointing at an arbitrary source page. §3.2 is
 * explicit that the frontend does not author waiver rules itself, and
 * linking the wrong evidence page is a quieter version of the same mistake.
 */
export function sourceUrlForField(
  program: ProgramV3,
  ...hints: string[]
): string | null {
  const match = program.sources.find((source) =>
    hints.some((hint) =>
      source.related_field.toLowerCase().includes(hint.toLowerCase()),
    ),
  );
  return match?.source_url ?? null;
}

/** Latest `retrieved_date` across a program's sources — computed at render
 * time, never stored (§1.1). */
export function latestRetrievedDate(program: ProgramV3): string | null {
  const dates = program.sources.map((s) => s.retrieved_date).filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

export type CostBlockLine =
  | {
      // 形态①②: converted to CNY. The fx disclaimer is non-optional by
      // type — §1.4 requires every converted figure to name its rate month,
      // so a form that could omit it must not be representable.
      form: "official" | "config_estimate";
      headline: string; // e.g. "¥55–66 万元人民币"
      compositionNote: string | null;
      fxDisclaimer: string;
      // 形态② must always carry it; 形态① never does.
      configEstimateDisclaimer: string | null;
    }
  | {
      // 形态③: tuition only, original currency. No conversion happened, so
      // there is no rate to disclose and no living cost to qualify.
      form: "tuition_only";
      headline: string;
      compositionNote: null;
      fxDisclaimer: null;
      configEstimateDisclaimer: null;
    };

const PERIOD_SUFFIX_ZH: Record<string, string> = {
  per_year: "/年",
  per_semester: "/学期",
  total_program: "/全程",
};

/**
 * `cost_estimate_rmb.min/max` are stored in **元** (ruling T2-R2: "already
 * rounded to 万" means rounded *to the nearest* 万 — i.e. floored/ceiled to
 * a multiple of 10,000 — not stored *in units of* 万). A real Mode F package
 * carries `570000`/`600000`, meaning ¥57万–60万 (ruling T3-R6).
 *
 * T3's mock data and this function's display logic shared the same wrong
 * reading of that rule (`min`/`max` treated as already-万 numbers, so `55`
 * rendered as `55 万元`), and both sides agreeing with each other is exactly
 * why 61 passing claims and four review rounds never caught it — nothing
 * disagreed. Real T1b data (`570000`) is what surfaced it: the Web Card
 * rendered `¥570000–600000 万元人民币`, i.e. ¥57 **亿**.
 *
 * **Not a formatter — a contract check.** The first fix here divided by
 * 10,000 and rounded the result with `toFixed()`, reasoning that "division
 * only, no rounding" avoided masking a future contract violation. That
 * reasoning was wrong: `toFixed()` *is* rounding, so `9999` and `10001` both
 * still displayed as a clean "1 万" — the exact failure this function exists
 * to surface, reintroduced one line later (ruling T3-R7.1). A function
 * cannot both promise "reveals contract violations" and use an operation
 * whose entire purpose is to hide small deviations; only one of those
 * claims can be true, and the display-friendliness one was the one to give
 * up — 宁缺毋假 means refusing to show a number that doesn't fit the
 * contract, not making it look fine anyway.
 *
 * So this is now a predicate, not a formatter. `costBlockLine` calls it
 * before committing to 形态①/②; a `false` degrades the whole block to
 * 形态③ (tuition-only) rather than rendering anything derived from an
 * out-of-contract number.
 */
function isWanAligned(yuan: number): boolean {
  return Number.isInteger(yuan) && yuan % 10_000 === 0;
}

/**
 * 形态③ — the tuition component rendered in its own currency.
 *
 * Reads `currency` off the component rather than off the block: when a CNY
 * block degrades here because its fx data is incomplete, the block says
 * "CNY" but the tuition component still carries the real original currency
 * (§13 requires `currency` on every component precisely so `53300` is never
 * ambiguous). Using the block's currency would relabel USD as CNY —
 * a fabricated number, not a degradation.
 */
function tuitionOnlyLine(cost: CostEstimateRmbV3): CostBlockLine | null {
  const tuition = cost.components.find((c) => c.item === "tuition");
  if (!tuition) return null;
  const min = tuition.value ?? tuition.value_min;
  const max = tuition.value ?? tuition.value_max;
  if (min === undefined || max === undefined) return null;
  const range =
    min === max
      ? min.toLocaleString()
      : `${min.toLocaleString()}–${max.toLocaleString()}`;
  const period = tuition.period ? (PERIOD_SUFFIX_ZH[tuition.period] ?? "") : "";
  return {
    form: "tuition_only",
    headline: `${tuition.currency} ${range}${period}（学费,不含生活费）`,
    compositionNote: null,
    fxDisclaimer: null,
    configEstimateDisclaimer: null,
  };
}

/**
 * §3.6 三形态。`null` in → `null` out: no tuition at all means the whole
 * cost block is absent, never a zero or a placeholder.
 *
 * Every form is identified **positively**, from components that must
 * actually be there (rulings T3-R4.3, T3-R5.2). 「年总费用」 claims to cover
 * a year of study, so both halves of that claim must be present:
 *
 * - 形态① needs a `tuition` component **and** a `living_cost` component
 *   with `source_type: "official"` — an official Cost of Attendance.
 * - 形态② needs a `tuition` component **and** a `living_cost` component
 *   with `source_type: "config_estimate"` — the `city_costs` table.
 * - Anything less → 形态③.
 *
 * The earlier "no config_estimate, therefore official" inference was wrong
 * in a way that published a false claim: a CNY block carrying only tuition
 * would classify as ①, and 「年总费用」 backed by an official-CoA
 * composition note would then describe room, board and insurance that the
 * figure does not contain. The mirror case is just as wrong — living costs
 * with no tuition would publish a 「年总费用」 that no student's tuition is
 * in. Neither half alone is a total, so both degrade to 形态③ and emit no
 * composition or fx wording at all.
 *
 * A CNY block whose fx data is incomplete (missing rate *or* missing
 * snapshot date) degrades the same way — §1.4: "city_costs 或 fx 缺失 →
 * 整块降级为只显示原币种学费,不强拼人民币".
 */
export function costBlockLine(
  cost: CostEstimateRmbV3 | null,
): CostBlockLine | null {
  if (!cost) return null;
  if (cost.currency !== "CNY") return tuitionOnlyLine(cost);

  const month = formatYearMonth(cost.fx_snapshot_date);
  const rateIsUsable =
    typeof cost.fx_rate === "number" &&
    Number.isFinite(cost.fx_rate) &&
    cost.fx_rate > 0;
  if (!month || !rateIsUsable) return tuitionOnlyLine(cost);

  // Both halves required. `tuitionOnlyLine` itself returns null when there
  // is no tuition component, so "living costs but no tuition" ends with the
  // whole block absent rather than with a partial figure relabelled as a
  // total (ruling T3-R5.2).
  const tuition = cost.components.find((c) => c.item === "tuition");
  const living = cost.components.find((c) => c.item === "living_cost");
  if (!tuition || !living) return tuitionOnlyLine(cost);
  if (
    living.source_type !== "official" &&
    living.source_type !== "config_estimate"
  ) {
    return tuitionOnlyLine(cost);
  }

  // §1.4/T2-R2 契约:min/max 必须是万的整数倍(min 向下取整、max 向上取整
  // 而来)。违反契约的数字不是"显示得难看"的问题,是数据本身不可信——
  // 拒绝显示,降级为原币种学费,并留痕(ruling T3-R7.1)。
  if (!isWanAligned(cost.min) || !isWanAligned(cost.max)) {
    console.warn(
      `cost_estimate_rmb 违反契约(min/max 必须是万的整数倍):min=${cost.min} max=${cost.max} — 已降级为原币种学费显示`,
    );
    return tuitionOnlyLine(cost);
  }

  const isEstimate = living.source_type === "config_estimate";
  return {
    form: isEstimate ? "config_estimate" : "official",
    headline: `¥${cost.min / 10_000}–${cost.max / 10_000} 万元人民币`,
    compositionNote: living.composition_note ?? null,
    fxDisclaimer: `按 ${month} 月均汇率估算,实际以缴费时点为准`,
    configEstimateDisclaimer: isEstimate
      ? "生活费为第三方估算,非院校官方数据"
      : null,
  };
}

/** Minimal .ics VEVENT for the application deadline, as a data: URI — no
 * backend endpoint, generated at render time from data already on the page. */
export function icsDataUri(program: ProgramV3): string | null {
  const deadline = program.application.application_deadline;
  if (!deadline) return null;
  const date = deadline.replace(/-/g, "");
  const title = `${program.school.school_name_zh ?? program.school.school_name} ${
    program.offering.program_name_zh ?? program.offering.official_program_name
  } 申请截止`;
  const uid = `${program.publishing.slug ?? program.offering.program_name_zh ?? "stage"}-deadline@stagefront`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//STAGE//Application Deadline//ZH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${date}T000000Z`,
    `DTSTART;VALUE=DATE:${date}`,
    `SUMMARY:${title}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
