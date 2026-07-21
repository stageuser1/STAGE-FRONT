import type { DegreeInfo, Program, School } from "@/data/types";

/** "2025-12-01" → "2025年12月1日"; anything unparsable returns null. */
export function formatDateZh(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

/** Days from today until the date; negative = past. Null if unparsable. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

/** "4.00000" → "4年"; keeps meaningful decimals ("2.5" → "2.5年"). */
export function formatDurationZh(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  const rounded = Math.round(number * 10) / 10;
  return `${rounded}年`;
}

/** Degree label used everywhere: Chinese name + abbreviation when known. */
export function degreeLabel(degree: DegreeInfo | undefined): string {
  if (!degree) return "学位待确认";
  const zh = degree.name_zh;
  const abbr = degree.abbreviation;
  if (zh && abbr) return `${zh} ${abbr}`;
  return zh ?? degree.name;
}

/** Short chip label for degree navigation: "BM" / "GD" / "AD". */
export function degreeChipLabel(degree: DegreeInfo | undefined): string {
  return degree?.abbreviation ?? degree?.name ?? "N/A";
}

const degreeSlugOrder = ["bm", "mm", "gd", "ad", "dma"];

/** Canonical display order for degree chips: BM → MM → GD → AD → DMA. */
export function degreeOrder(slug: string | null | undefined): number {
  const index = degreeSlugOrder.indexOf((slug ?? "").toLowerCase());
  return index === -1 ? degreeSlugOrder.length : index;
}

/** Stable in-page anchor id for a music-area section. */
export function areaAnchorId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `area-${slug || "other"}`;
}

export function formatFee(program: Program): string | null {
  const fee = program.cost_aid.application_fee;
  if (fee === null) return null;
  return `${program.cost_aid.currency} ${fee.toLocaleString()}`;
}

const degreeCategoryZhByLevel: Record<string, string> = {
  bachelor: "本科",
  master: "硕士",
  doctorate: "博士",
  diploma: "文凭",
  certificate: "证书",
};

/** Short Chinese degree-category badge label: 本科 / 硕士 / 博士 / 文凭. */
export function degreeCategoryZh(program: Program): string {
  return degreeCategoryZhByLevel[program.degree_level] ?? "项目";
}

const monthAbbr = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2025-12-01" → "Dec 1, 2025"; anything unparsable returns null. */
export function formatDeadlineEn(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const month = monthAbbr[Number(match[2]) - 1];
  if (!month) return null;
  return `${month} ${Number(match[3])}, ${match[1]}`;
}

/**
 * Annual tuition for the program card: "USD 56,280/year". Reads the raw
 * application-requirement values already carried on the program (no extra
 * fetch); returns null when tuition is not recorded.
 */
export function formatTuition(program: Program): string | null {
  const values = program.review_records?.application?.values;
  const amount = values?.tuition_annual;
  if (amount === null || amount === undefined || amount === "") return null;
  const number = Number(amount);
  const amountText = Number.isFinite(number)
    ? number.toLocaleString("en-US")
    : String(amount);
  const currency = String(values?.tuition_currency ?? "").toUpperCase().trim();
  return `${currency ? `${currency} ` : ""}${amountText}/year`;
}

const countryCodeByName: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  america: "US",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  england: "GB",
  canada: "CA",
  australia: "AU",
  germany: "DE",
  france: "FR",
  austria: "AT",
  netherlands: "NL",
  italy: "IT",
  spain: "ES",
  switzerland: "CH",
};

/** Short country label for compact rows: "United States" → "US". */
export function countryShort(country: string): string {
  const trimmed = country.trim();
  const code = countryCodeByName[trimmed.toLowerCase()];
  if (code) return code;
  // Already a 2–3 letter code (US, GBR) — keep as-is.
  if (/^[A-Za-z]{2,3}$/.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

/** Latest update date across a school and every one of its programs. */
export function latestSchoolUpdate(
  school: School,
  programs: Program[],
): string | null {
  const dates = [
    ...(school.sources ?? []).map((source) => source.accessed_at),
    ...programs.flatMap((program) =>
      program.sources.map((source) => source.accessed_at),
    ),
  ].filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

/** Most recent verification date for a program: latest source retrieval. */
export function latestCheckedDate(program: Program): string | null {
  const dates = program.sources
    .map((source) => source.accessed_at)
    .filter(Boolean);
  const lastChecked = program.review_records?.offering?.values?.last_checked;
  if (typeof lastChecked === "string" && lastChecked) dates.push(lastChecked);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

export function languageSummary(program: Program): string | null {
  const tests = program.language_requirements.accepted_tests;
  const namedTests = tests.filter(
    (test) => test.test_name !== "Other" || Boolean(test.minimum_score),
  );
  if (namedTests.length > 0) {
    return namedTests
      .map((test) =>
        test.minimum_score
          ? `${test.test_name} ${test.minimum_score}`
          : test.test_name,
      )
      .join(" / ");
  }
  if (program.language_requirements.english_required === true) {
    return "需要英语成绩";
  }
  if (program.language_requirements.english_required === false) return "不要求";
  return null;
}
