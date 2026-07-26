import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSearchIndex,
  cjkBigrams,
  hasCjk,
  normalize,
  rankSearch,
} from "../lib/search/index.ts";

function program(overrides = {}) {
  return {
    id: "1",
    schoolId: "juilliard",
    name: "Master of Music, Violin",
    nameZh: "音乐硕士 小提琴",
    schoolName: "The Juilliard School",
    country: "United States",
    city: "New York",
    degreeSlug: "mm",
    degreeName: "Master of Music",
    degreeNameZh: "音乐硕士",
    degreeAbbr: "MM",
    majorArea: "Performance",
    majorAreaZh: "表演",
    specialization: "Violin",
    applicationDeadline: null,
    prescreeningDeadline: null,
    ieltsMinimum: null,
    tuitionAmount: null,
    tuitionCurrency: null,
    status: "published",
    lastCheckedAt: null,
    ...overrides,
  };
}

const corpus = [
  program(),
  program({
    id: "2",
    name: "Master of Music, Composition",
    nameZh: "音乐硕士 作曲",
    majorArea: "Composition",
    majorAreaZh: "作曲",
    specialization: "Composition",
  }),
  program({
    id: "3",
    schoolId: "rcm",
    name: "Bachelor of Music, Piano",
    nameZh: "音乐学士 钢琴",
    schoolName: "Royal College of Music",
    country: "United Kingdom",
    city: "London",
    degreeSlug: "bm",
    degreeName: "Bachelor of Music",
    degreeNameZh: "音乐学士",
    degreeAbbr: "BM",
    specialization: "Piano",
  }),
];

const index = buildSearchIndex(corpus);

test("normalize folds case, width and whitespace", () => {
  assert.equal(normalize("  Master   Of  MUSIC "), "master of music");
  // NFKC folds full-width Latin, which Chinese IMEs produce routinely.
  assert.equal(normalize("ＭＭ"), "mm");
});

test("detects CJK and builds overlapping bigrams", () => {
  assert.equal(hasCjk("作曲"), true);
  assert.equal(hasCjk("Violin"), false);
  assert.deepEqual(cjkBigrams("作曲专业"), ["作曲", "曲专", "专业"]);
  // A single-character term still yields something to match on.
  assert.deepEqual(cjkBigrams("琴"), ["琴"]);
});

test("exact title beats prefix beats contains", () => {
  const exact = rankSearch(index, "Master of Music, Violin");
  assert.equal(exact[0].programId, "1");
  assert.equal(exact[0].reasons[0].kind, "title_exact");

  const prefix = rankSearch(index, "Master of Music, C");
  assert.equal(prefix[0].reasons[0].kind, "title_prefix");

  const contains = rankSearch(index, "violin");
  assert.equal(contains[0].programId, "1");
  assert.equal(contains[0].reasons[0].kind, "title_contains");
});

test("matches a school name", () => {
  const results = rankSearch(index, "juilliard");
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.reasons.some((x) => x.kind === "school")));
});

test("matches a degree abbreviation", () => {
  const results = rankSearch(index, "bm");
  assert.equal(results.length, 1);
  assert.equal(results[0].programId, "3");
  assert.ok(results[0].reasons.some((r) => r.kind === "degree"));
});

test("matches a city and a country", () => {
  assert.equal(rankSearch(index, "new york").length, 2);
  const uk = rankSearch(index, "united kingdom");
  assert.equal(uk.length, 1);
  assert.ok(uk[0].reasons.some((r) => r.kind === "location"));
});

test("matches a Chinese major term", () => {
  const results = rankSearch(index, "作曲");
  assert.equal(results[0].programId, "2");
  assert.ok(
    results[0].reasons.some((r) => r.kind === "field" || r.kind === "zh_name"),
  );
});

test("falls back to the CJK bigram floor with a reason", () => {
  // 皇家音乐 appears only inside the Chinese school text, not as a field value.
  const results = rankSearch(
    buildSearchIndex([program({ id: "9", nameZh: "皇家音乐学院项目" })]),
    "皇家音乐",
  );
  assert.equal(results.length, 1);
  assert.ok(results[0].reasons.some((r) => r.kind === "zh_name" || r.kind === "cjk_ngram"));
});

test("every result carries at least one reason", () => {
  for (const query of ["music", "作曲", "MM", "London"]) {
    for (const result of rankSearch(index, query)) {
      assert.ok(
        result.reasons.length > 0,
        `"${query}" produced an unexplained result`,
      );
    }
  }
});

test("returns nothing for an empty query and no false matches", () => {
  assert.deepEqual(rankSearch(index, ""), []);
  assert.deepEqual(rankSearch(index, "   "), []);
  assert.deepEqual(rankSearch(index, "astrophysics"), []);
});

test("dedupes by program id and respects the limit", () => {
  // "music" matches title, school and degree on the same programs.
  const results = rankSearch(index, "music");
  const ids = results.map((r) => r.programId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(rankSearch(index, "music", 2).length <= 2);
});

test("ordering is stable across identical runs", () => {
  const a = rankSearch(index, "music").map((r) => r.programId);
  const b = rankSearch(index, "music").map((r) => r.programId);
  assert.deepEqual(a, b);
});
