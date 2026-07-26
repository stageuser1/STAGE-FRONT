/**
 * Explainable program search.
 *
 * Deterministic scoring tiers, evaluated in order, each attaching a REASON to
 * the result. There is no fuzzy-matching dependency: a CJK bigram floor is the
 * last tier, which is enough for a corpus of this size and keeps every result
 * explainable — a learner can always be told which field matched and why.
 *
 * Pure and free of JSON/React imports so it is unit-testable directly.
 */
import type { ExploreProgram } from "@/lib/explore/types";

/* ---------------------------------------------------------------------------
 * Text normalisation.
 *
 * Lives in this module rather than beside it so that the index and the query
 * are guaranteed to be normalised by the same code — a drift between those two
 * is the classic way a search silently stops matching.
 * ------------------------------------------------------------------------- */

/**
 * NFKC + lowercase + collapsed whitespace.
 *
 * NFKC folds full-width Latin (ＭＭ) onto ASCII, which matters here: Chinese
 * IMEs produce full-width characters routinely, and a learner typing "ＭＭ"
 * means the same thing as "MM".
 */
export function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

/** True for CJK ideographs — the scripts that need n-gram matching. */
function isCjk(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // Extension A
    (code >= 0xf900 && code <= 0xfaff) // Compatibility Ideographs
  );
}

/**
 * Overlapping character bigrams for CJK runs.
 *
 * Chinese has no spaces, so substring matching either over-matches on single
 * characters or misses entirely. Bigrams are the cheapest thing that behaves:
 * "作曲专业" yields 作曲/曲专/专业, and a query for 作曲 hits the first.
 * Single-character CJK terms are emitted as-is so a one-character query still
 * matches something.
 */
export function cjkBigrams(value: string): string[] {
  const normalized = normalize(value);
  const grams = new Set<string>();
  let run = "";

  const flush = () => {
    if (run.length === 1) grams.add(run);
    for (let i = 0; i + 1 < run.length; i += 1) grams.add(run.slice(i, i + 2));
    run = "";
  };

  for (const char of normalized) {
    if (isCjk(char)) run += char;
    else flush();
  }
  flush();
  return [...grams];
}

/** True when the query contains any CJK character. */
export function hasCjk(value: string): boolean {
  for (const char of value) if (isCjk(char)) return true;
  return false;
}

export const SEARCH_INDEX_VERSION = 1;

/** Why a program matched. Rendered to the user as a tag. */
export type ReasonKind =
  | "title_exact"
  | "title_prefix"
  | "title_contains"
  | "school"
  | "field"
  | "degree"
  | "location"
  | "zh_name"
  | "cjk_ngram";

export const REASON_LABELS: Record<ReasonKind, string> = {
  title_exact: "名称完全匹配",
  title_prefix: "名称开头匹配",
  title_contains: "名称包含",
  school: "学校名称",
  field: "专业方向",
  degree: "学位",
  location: "城市 / 国家",
  zh_name: "中文名称",
  cjk_ngram: "中文分词匹配",
};

/** Tier scores. Higher wins; the gaps leave room to insert tiers later. */
const TIER_SCORE: Record<ReasonKind, number> = {
  title_exact: 1100,
  title_prefix: 1050,
  title_contains: 1010,
  school: 1000,
  field: 950,
  degree: 900,
  location: 850,
  zh_name: 800,
  cjk_ngram: 780,
};

export interface SearchDoc {
  programId: string;
  schoolId: string;
  title: string;
  titleZh: string | null;
  school: string;
  field: string | null;
  fieldZh: string | null;
  degree: string | null;
  degreeAbbr: string | null;
  degreeSlug: string | null;
  city: string;
  country: string;
  specialization: string | null;
  /** Precomputed at build time so ranking never re-derives them per query. */
  ngrams: string[];
}

export interface SearchIndex {
  version: number;
  builtAt: string;
  docs: SearchDoc[];
}

export interface MatchReason {
  kind: ReasonKind;
  field: string;
  value: string;
}

export interface RankedResult {
  programId: string;
  score: number;
  reasons: MatchReason[];
}

/** Maximum rows returned. Beyond this the answer is "refine your query". */
export const SEARCH_RESULT_LIMIT = 50;

export function buildSearchIndex(programs: ExploreProgram[]): SearchIndex {
  return {
    version: SEARCH_INDEX_VERSION,
    builtAt: new Date().toISOString(),
    docs: programs.map((program) => ({
      programId: program.id,
      schoolId: program.schoolId,
      title: program.name,
      titleZh: program.nameZh,
      school: program.schoolName,
      field: program.majorArea,
      fieldZh: program.majorAreaZh,
      degree: program.degreeName,
      degreeAbbr: program.degreeAbbr,
      degreeSlug: program.degreeSlug,
      city: program.city,
      country: program.country,
      specialization: program.specialization,
      ngrams: cjkBigrams(
        [
          program.nameZh,
          program.majorAreaZh,
          program.specialization,
          program.schoolName,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    })),
  };
}

/** Evaluates one document, returning its best tier and every reason that fired. */
function scoreDoc(doc: SearchDoc, query: string): RankedResult | null {
  const reasons: MatchReason[] = [];
  const title = normalize(doc.title);

  const add = (kind: ReasonKind, field: string, value: string) => {
    reasons.push({ kind, field, value });
  };

  if (title === query) add("title_exact", "official_program_name", doc.title);
  else if (title.startsWith(query))
    add("title_prefix", "official_program_name", doc.title);
  else if (title.includes(query))
    add("title_contains", "official_program_name", doc.title);

  if (normalize(doc.school).includes(query)) add("school", "school_name", doc.school);

  for (const [value, label] of [
    [doc.field, "major_area"],
    [doc.fieldZh, "major_area_zh"],
    [doc.specialization, "specialization"],
  ] as const) {
    if (value && normalize(value).includes(query)) {
      add("field", label, value);
      break;
    }
  }

  for (const [value, label] of [
    [doc.degree, "degree_name"],
    [doc.degreeAbbr, "degree_abbreviation"],
    [doc.degreeSlug, "degree_slug"],
  ] as const) {
    if (value && normalize(value).includes(query)) {
      add("degree", label, value);
      break;
    }
  }

  for (const [value, label] of [
    [doc.city, "city"],
    [doc.country, "country"],
  ] as const) {
    if (value && normalize(value).includes(query)) {
      add("location", label, value);
      break;
    }
  }

  if (doc.titleZh && normalize(doc.titleZh).includes(query)) {
    add("zh_name", "program_name_zh", doc.titleZh);
  }

  // Floor tier: only consulted when nothing above matched, and only for CJK
  // queries — running it on Latin input would match noise.
  if (reasons.length === 0 && hasCjk(query)) {
    const queryGrams = cjkBigrams(query);
    const overlap = queryGrams.filter((gram) => doc.ngrams.includes(gram));
    // Two shared bigrams is the threshold: one is routinely coincidental in
    // Chinese, two is a real term overlap.
    const enough = queryGrams.length === 1 ? overlap.length >= 1 : overlap.length >= 2;
    if (enough) add("cjk_ngram", "zh_text", overlap.join(""));
  }

  if (reasons.length === 0) return null;

  // The best tier decides rank; every reason is still reported, because the
  // user asked "why is this here" and one answer is rarely the whole story.
  const score = Math.max(...reasons.map((reason) => TIER_SCORE[reason.kind]));
  return { programId: doc.programId, score, reasons };
}

export function rankSearch(
  index: SearchIndex,
  rawQuery: string,
  limit = SEARCH_RESULT_LIMIT,
): RankedResult[] {
  const query = normalize(rawQuery);
  if (query === "") return [];

  const results: RankedResult[] = [];
  const seen = new Set<string>();

  for (const doc of index.docs) {
    // Dedupe by canonical program id: the same offering must never appear
    // twice because two of its fields matched.
    if (seen.has(doc.programId)) continue;
    const result = scoreDoc(doc, query);
    if (!result) continue;
    seen.add(doc.programId);
    results.push(result);
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      // Stable, explainable tie-break: more reasons means a better match,
      // then program id so the order never shuffles between renders.
      b.reasons.length - a.reasons.length ||
      a.programId.localeCompare(b.programId),
  );

  return results.slice(0, limit);
}
