import type { ProgramV3 } from "@/data/v3/types";
// Relative + extension, not `@/...`: `tests/t7_schools_browse.test.mjs`
// imports this file directly under `node --test --experimental-strip-types`,
// and that loader does not resolve the `@/` alias (same reason
// `data/v3/real-programs.ts` does it). The `ProgramV3` import above is
// `import type`, so it is erased before the loader ever sees it.
import { formatDateZh } from "../program-v3/format.ts";

/**
 * T7 院校与专业浏览页 — the pure model behind the four layers.
 *
 * Everything here is a function of the program list: no fetching, no
 * `now()` except where a caller passes one in, nothing that has to run in a
 * browser. The page component only decides where the strings go.
 *
 * Only programs that carry a `publishing.slug` enter the model. That is not
 * a filter T7 invented — it is the same condition
 * `productionProgramRouteParams()` uses, and it has to hold here because
 * every 小卡 in this page is addressable at
 * `/schools/{school-slug}/{program-slug}`. A slug-less program has no such
 * address, so selecting it could neither be pushed to the URL nor restored
 * from one.
 */

export interface BrowseProgram {
  /** Non-null by construction — see the filter in `buildBrowseModel`. */
  slug: string;
  program: ProgramV3;
}

export interface BrowseSchool {
  slug: string;
  /** 中文校名为主,缺失回退英文(核心原则 6 / ruling T3-R3.2). */
  nameZh: string;
  programs: BrowseProgram[];
}

export interface BrowseSelection {
  schoolSlug: string;
  programSlug: string;
}

/**
 * Groups programs under their school, preserving source order on both
 * levels — "第一所学校" and "该校第一个专业" are the data's own order, not a
 * sort this page imposes.
 */
export function buildBrowseModel(programs: ProgramV3[]): BrowseSchool[] {
  const schools: BrowseSchool[] = [];
  const bySlug = new Map<string, BrowseSchool>();

  for (const program of programs) {
    const slug = program.publishing.slug;
    if (slug === null) continue;
    let school = bySlug.get(program.school.slug);
    if (!school) {
      school = {
        slug: program.school.slug,
        nameZh: program.school.school_name_zh ?? program.school.school_name,
        programs: [],
      };
      bySlug.set(school.slug, school);
      schools.push(school);
    }
    school.programs.push({ slug, program });
  }

  // A school whose every program lacked a slug would be an empty tab with an
  // empty chip row and no card — it cannot occur through the loop above
  // (a school is only created when a slug-bearing program creates it), and
  // this states that rather than relying on the reader to re-derive it.
  return schools.filter((school) => school.programs.length > 0);
}

/**
 * The三层联动 entry point: given a (possibly absent, possibly wrong) pair of
 * slugs, return the pair the page will actually select.
 *
 * Falls back one level at a time — an unknown program under a known school
 * keeps the school and takes its first program, which is what a reader who
 * edited the last path segment expects. Returns `null` only when there is
 * no data at all to select.
 *
 * Per the 2026-08-05 ruling this fallback is the **client's** contract:
 * `/schools/{s}/{p}` still 404s server-side for a slug that was never
 * generated, so this never turns garbage URLs into 200s. It is what keeps
 * the page from going blank on a `popstate` to a URL the model cannot
 * resolve, and what resolves the bare `/schools` entry point.
 */
export function resolveBrowseSelection(
  schools: BrowseSchool[],
  schoolSlug?: string | null,
  programSlug?: string | null,
): BrowseSelection | null {
  if (schools.length === 0) return null;
  const school = schools.find((s) => s.slug === schoolSlug) ?? schools[0];
  const program =
    school.programs.find((p) => p.slug === programSlug) ?? school.programs[0];
  return { schoolSlug: school.slug, programSlug: program.slug };
}

/** The one place the browse URL shape is written down. */
export function browseHref(selection: BrowseSelection): string {
  return `/schools/${selection.schoolSlug}/${selection.programSlug}`;
}

/**
 * Reads a selection back out of a pathname (`popstate`, or the first paint
 * after a direct visit). Returns the raw segments — resolving them against
 * real data is `resolveBrowseSelection`'s job, so an unknown slug degrades
 * to the default instead of being rejected here.
 */
export function parseBrowsePath(pathname: string): {
  schoolSlug: string | null;
  programSlug: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "schools") return { schoolSlug: null, programSlug: null };
  return {
    schoolSlug: segments[1] ? decodeURIComponent(segments[1]) : null,
    programSlug: segments[2] ? decodeURIComponent(segments[2]) : null,
  };
}

/**
 * 顶部提示句. `N` is counted from the data, never written down — a hardcoded
 * count is exactly the kind of invented fact 核心原则 2 forbids.
 *
 * The sentence ends with 「每条信息标注官网核实时间」 and **not** 「每条信息
 * 可溯源至官网」 (人类裁决 2026-08-05, T7 交付确认第 1 条). 溯源 is the
 * stronger promise, and the T7 大卡 currently keeps only the citation line
 * (来源域名 + 核实月份) and the conditional notes' 官网来源 links — 原文证据
 * (`source_quote`)、曲目细则、特殊条件、相关专业 lost their production entry
 * when §2.2 详情页 was folded into this card. 宁缺毋假 applies to what the
 * site says about *itself*, not only to school data: the copy is trimmed to
 * what the page actually delivers. **When those four modules get an entry
 * back, this string may go back to 「可溯源至官网」** — see
 * `T7_REVIEW_HANDOFF.md` §待办 1.
 *
 * The 截至 month is the render month. These pages are statically generated,
 * so in production that is the build month, which is the honest reading:
 * the sentence describes when this snapshot of the database was published,
 * not what day the reader is visiting. (Contrast the deadline chip, which
 * §3.4 requires to be a live `now()` — that one is a claim about the
 * reader's present, so it is computed in the browser.)
 */
export function browseLede(schools: BrowseSchool[], now: Date): string {
  const asOf = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  return `截至 ${asOf} · 已收录 ${schools.length} 所音乐院校 · 每条信息标注官网核实时间`;
}

/**
 * 小卡第一行:「{专业中文名} · {学位缩写}」.
 *
 * `program_name_zh` is null on every real Juilliard offering as it comes out
 * of the canonical package (the adapter derives 「声乐」 from `field_ref`);
 * should it ever arrive null anyway, the English official name stands in
 * rather than the row losing its subject — the same 降级 as the card title
 * (ruling T3-R3.2). The degree abbreviation is required in canonical, so
 * there is no null branch for it to take.
 */
export function browseChipTitle(program: ProgramV3): string {
  const name =
    program.offering.program_name_zh ?? program.offering.official_program_name;
  return `${name} · ${program.offering.degree_abbreviation}`;
}

/**
 * 小卡第二行:「截止 {日期}」, or 「截止日期未公布」 when the deadline is
 * null.
 *
 * This is the one place T7 overrides §3.1's "null → 该行不渲染". The spec
 * asks for the wording explicitly, and it survives the 宁缺毋假 test because
 * it asserts nothing about the school's requirements — it says the date is
 * not published, which is precisely the fact at hand, not a 「暂无」
 * placeholder standing in for a value we failed to fetch. Dropping the line
 * instead would leave 小卡 of two different heights in one scroller.
 */
export function browseChipDeadline(program: ProgramV3): string {
  const formatted = formatDateZh(program.application.application_deadline);
  return formatted ? `截止 ${formatted}` : "截止日期未公布";
}
