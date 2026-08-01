/**
 * The library list's four decisions.
 *
 * Two of them are worth stating as guarantees rather than as cases.
 *
 * Filters compose with AND across every facet, so a row that satisfies four of
 * five is not shown. The rows below are synthetic on purpose: the fixture bank
 * holds one set, and one row cannot show that a filter *excludes* anything.
 *
 * The URL round trip is `parse(serialize(f)) === f` for every filter state this
 * module can produce, and `serialize(parse(url))` is stable for every URL it
 * accepts. Both directions matter — the first is what makes a link shareable,
 * the second is what stops the Back button from being spelled differently to
 * the state it restores.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  INITIAL_FILTERS,
  attemptAccuracy,
  availableTypes,
  filterRows,
  libraryAction,
  libraryStatus,
  matchesFilters,
  matchesSearch,
  matchesStatus,
  parseLibraryParams,
  serializeLibraryParams,
} from "../lib/ielts/listening-library-utils.ts";
import {
  MUSEUM_MEMBERSHIP_RULES,
  MUSEUM_MEMBERSHIP_SET,
} from "../lib/ielts/listening-fixture.ts";

/* -------------------------------------------------------------------------
 * A three-row bank. Nothing here claims to be real material — these exist so
 * an excluding filter has something to exclude.
 * ---------------------------------------------------------------------- */

const ROWS = [
  {
    id: "a",
    title: "Museum Membership Enquiry",
    titleZh: "博物馆会员咨询",
    part: 1,
    frequency: "high",
    questionCount: 8,
    types: ["form_completion", "mcq_multi", "map_labelling", "matching"],
  },
  {
    id: "b",
    title: "Campus Tour Briefing",
    titleZh: "校园导览说明",
    part: 2,
    frequency: "mid",
    questionCount: 10,
    types: ["mcq_single", "map_labelling"],
  },
  {
    id: "c",
    title: "Research Methods Seminar",
    titleZh: "研究方法研讨",
    part: 3,
    frequency: "high",
    questionCount: 6,
    types: ["matching"],
  },
];

const allFresh = () => "fresh";
const ids = (rows) => rows.map((row) => row.id);

function withFilters(overrides) {
  return { ...INITIAL_FILTERS, ...overrides };
}

/* -------------------------------------------------------------------------
 * Status, action, accuracy
 * ---------------------------------------------------------------------- */

test("a set's state comes from its stored record and nothing else", () => {
  assert.equal(libraryStatus(null), "fresh");
  assert.equal(libraryStatus({ status: "in_progress" }), "in_progress");
  assert.equal(libraryStatus({ status: "submitted" }), "practised");
});

test("the button's word follows the state", () => {
  assert.equal(libraryAction("fresh"), "start");
  assert.equal(libraryAction("in_progress"), "resume");
  assert.equal(libraryAction("practised"), "again");
});

test("accuracy exists only for a submitted attempt", () => {
  const answers = {
    1: { questionNo: 1, value: "Marchetti" },
    2: { questionNo: 2, value: "1 5TR" },
    6: { questionNo: 6, value: ["A", "C"] },
    7: { questionNo: 7, value: "C" },
  };
  const base = {
    setId: MUSEUM_MEMBERSHIP_SET.id,
    answers,
    startedAt: "2026-08-01T09:00:00.000Z",
    elapsedSec: 300,
  };

  // Four of eight right, and the other four blank.
  assert.equal(
    attemptAccuracy({ ...base, status: "submitted" }, MUSEUM_MEMBERSHIP_RULES),
    0.5,
  );

  // No score before a paper is handed in — not a zero.
  assert.equal(
    attemptAccuracy({ ...base, status: "in_progress" }, MUSEUM_MEMBERSHIP_RULES),
    null,
  );
  assert.equal(attemptAccuracy(null, MUSEUM_MEMBERSHIP_RULES), null);
  // A set whose key the page could not resolve reports nothing rather than 0%.
  assert.equal(attemptAccuracy({ ...base, status: "submitted" }, undefined), null);
  assert.equal(attemptAccuracy({ ...base, status: "submitted" }, []), null);
});

/* -------------------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------------- */

test("search is a case-insensitive substring of either title", () => {
  const [row] = ROWS;
  assert.equal(matchesSearch(row, ""), true);
  assert.equal(matchesSearch(row, "   "), true);
  assert.equal(matchesSearch(row, "membership"), true);
  assert.equal(matchesSearch(row, "MEMBERSHIP"), true);
  assert.equal(matchesSearch(row, "  Museum  "), true, "the query is trimmed");
  assert.equal(
    matchesSearch(row, "Museum  Membership"),
    false,
    "inner spaces are literal — nothing is collapsed",
  );
  assert.equal(matchesSearch(row, "会员"), true, "the Chinese title is searched too");
  assert.equal(matchesSearch(row, "seminar"), false);
});

/* -------------------------------------------------------------------------
 * Composition
 * ---------------------------------------------------------------------- */

test("no filters shows every row, in source order", () => {
  assert.deepEqual(ids(filterRows(ROWS, INITIAL_FILTERS, allFresh)), [
    "a",
    "b",
    "c",
  ]);
});

test("each facet narrows on its own", () => {
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ frequency: "high" }), allFresh)),
    ["a", "c"],
  );
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ part: 2 }), allFresh)),
    ["b"],
  );
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ search: "研究" }), allFresh)),
    ["c"],
  );
});

test("题型 matches a set that contains the type, not one that is only it", () => {
  // Row "a" holds four types including matching; row "c" holds only matching.
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ type: "matching" }), allFresh)),
    ["a", "c"],
  );
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ type: "map_labelling" }), allFresh)),
    ["a", "b"],
  );
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ type: "mcq_single" }), allFresh)),
    ["b"],
  );
});

test("facets compose with AND", () => {
  // 高频 alone gives a and c; matching alone gives a and c; together with a
  // search that only a satisfies, one row survives.
  assert.deepEqual(
    ids(
      filterRows(
        ROWS,
        withFilters({ frequency: "high", type: "matching", search: "museum" }),
        allFresh,
      ),
    ),
    ["a"],
  );

  // Each of these alone matches something; the pair matches nothing, which is
  // the difference between AND and OR.
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ frequency: "mid", part: 3 }), allFresh)),
    [],
  );
});

test("状态 filters against the caller's own record lookup", () => {
  const statusOf = (id) =>
    id === "a" ? "practised" : id === "b" ? "in_progress" : "fresh";

  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ status: "practised" }), statusOf)),
    ["a"],
  );
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ status: "fresh" }), statusOf)),
    ["c"],
  );
  // An open draft is reachable under 全部 and under no chip of its own: the
  // export's four chips have no word for it.
  assert.deepEqual(
    ids(filterRows(ROWS, INITIAL_FILTERS, statusOf)),
    ["a", "b", "c"],
  );
});

test("待重测 matches nothing rather than guessing", () => {
  for (const status of ["fresh", "in_progress", "practised"]) {
    assert.equal(matchesStatus(status, "retest"), false);
  }
  const statusOf = (id) => (id === "a" ? "practised" : "fresh");
  assert.deepEqual(
    ids(filterRows(ROWS, withFilters({ status: "retest" }), statusOf)),
    [],
    "the re-test queue is a later phase; this renders the empty state",
  );
});

test("matchesFilters is the whole conjunction, not a subset", () => {
  const row = ROWS[0];
  const good = withFilters({
    search: "museum",
    frequency: "high",
    part: 1,
    type: "mcq_multi",
    status: "practised",
  });
  assert.equal(matchesFilters(row, good, "practised"), true);

  // Break exactly one facet at a time; every one of them must be enough.
  assert.equal(matchesFilters(row, { ...good, search: "seminar" }, "practised"), false);
  assert.equal(matchesFilters(row, { ...good, frequency: "low" }, "practised"), false);
  assert.equal(matchesFilters(row, { ...good, part: 4 }, "practised"), false);
  assert.equal(matchesFilters(row, { ...good, type: "mcq_single" }, "practised"), false);
  assert.equal(matchesFilters(row, good, "fresh"), false);
});

test("the type chips offer only what the bank actually holds", () => {
  assert.deepEqual(availableTypes(ROWS), [
    "form_completion",
    "mcq_single",
    "mcq_multi",
    "map_labelling",
    "matching",
  ]);
  // The real bank has no single-answer MCQ, so no chip for it is offered.
  assert.deepEqual(availableTypes([ROWS[0]]), [
    "form_completion",
    "mcq_multi",
    "map_labelling",
    "matching",
  ]);
  assert.deepEqual(availableTypes([]), []);
});

/* -------------------------------------------------------------------------
 * The URL
 * ---------------------------------------------------------------------- */

test("an unfiltered list is a bare URL", () => {
  assert.equal(serializeLibraryParams(INITIAL_FILTERS), "");
  assert.deepEqual(parseLibraryParams(""), INITIAL_FILTERS);
});

test("every filter state survives a round trip through the URL", () => {
  const states = [
    INITIAL_FILTERS,
    withFilters({ search: "museum" }),
    withFilters({ frequency: "high" }),
    withFilters({ frequency: "mid" }),
    withFilters({ frequency: "low" }),
    withFilters({ part: 1 }),
    withFilters({ part: 4 }),
    withFilters({ type: "form_completion" }),
    withFilters({ type: "matching" }),
    withFilters({ status: "fresh" }),
    withFilters({ status: "practised" }),
    withFilters({ status: "retest" }),
    {
      search: "校园",
      frequency: "mid",
      part: 2,
      type: "mcq_single",
      status: "practised",
    },
  ];

  for (const state of states) {
    const query = serializeLibraryParams(state);
    assert.deepEqual(
      parseLibraryParams(query),
      state,
      `lost state through "${query}"`,
    );
    // And the spelling is stable, which is what lets the component compare a
    // Back navigation against its own last write as strings.
    assert.equal(serializeLibraryParams(parseLibraryParams(query)), query);
  }
});

test("the query string names its parameters as the URL shows them", () => {
  assert.equal(
    serializeLibraryParams({
      search: "campus tour",
      frequency: "mid",
      part: 2,
      type: "mcq_single",
      status: "fresh",
    }),
    "q=campus+tour&freq=mid&part=2&type=mcq_single&status=fresh",
  );
});

test("a hand-edited URL degrades to the default rather than breaking", () => {
  assert.deepEqual(
    parseLibraryParams("freq=sometimes&part=9&type=essay&status=pending"),
    INITIAL_FILTERS,
  );
  // "0" and "5" are numbers, and still not Parts.
  assert.equal(parseLibraryParams("part=0").part, "all");
  assert.equal(parseLibraryParams("part=5").part, "all");
  assert.equal(parseLibraryParams("part=1").part, 1);
  // `status=all` is the default spelled out; it must not round-trip into the URL.
  assert.equal(parseLibraryParams("status=all").status, "all");
  assert.equal(serializeLibraryParams(parseLibraryParams("status=all")), "");
  // Unknown parameters are simply not ours.
  assert.deepEqual(parseLibraryParams("sort=newest&page=3"), INITIAL_FILTERS);
});

test("a search of only whitespace is not a filter", () => {
  assert.equal(serializeLibraryParams(withFilters({ search: "   " })), "");
});
