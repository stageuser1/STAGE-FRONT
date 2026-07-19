import type { DegreeInfo, Program } from "@/data/types";

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

export function languageSummary(program: Program): string | null {
  const tests = program.language_requirements.accepted_tests;
  if (tests.length > 0) {
    return tests
      .map((test) =>
        test.minimum_score
          ? `${test.test_name} ${test.minimum_score}`
          : test.test_name,
      )
      .join(" / ");
  }
  if (program.language_requirements.english_required === false) return "不要求";
  return null;
}
