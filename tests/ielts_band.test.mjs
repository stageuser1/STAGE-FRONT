import assert from "node:assert/strict";
import test from "node:test";

import {
  BAND_TABLE_VERSION,
  bandFromRecords,
  estimateBand,
  formatBand,
  parseBandScore,
  toBandGap,
} from "../lib/ielts/band.ts";

test("maps published Academic Reading boundaries exactly", () => {
  const cases = [
    [40, 9.0],
    [39, 9.0],
    [38, 8.5],
    [37, 8.5],
    [36, 8.0],
    [35, 8.0],
    [34, 7.5],
    [33, 7.5],
    [32, 7.0],
    [30, 7.0],
    [29, 6.5],
    [27, 6.5],
    [26, 6.0],
    [23, 6.0],
    [22, 5.5],
    [19, 5.5],
    [18, 5.0],
    [15, 5.0],
    [13, 4.5],
    [10, 4.0],
    [8, 3.5],
    [6, 3.0],
    [4, 2.5],
    [0, 2.0],
  ];
  for (const [correct, band] of cases) {
    assert.equal(
      estimateBand(correct, 40).band,
      band,
      `${correct}/40 should be band ${band}`,
    );
  }
});

test("a full paper is not marked as scaled", () => {
  const estimate = estimateBand(27, 40);
  assert.equal(estimate.scaled, false);
  assert.equal(estimate.scaledCorrect, 27);
  assert.equal(estimate.tableVersion, BAND_TABLE_VERSION);
});

test("a short paper is scaled to 40 and flagged", () => {
  // 10/13 → 30.8 → 31/40 → band 7.0
  const estimate = estimateBand(10, 13);
  assert.equal(estimate.scaled, true);
  assert.equal(estimate.scaledCorrect, 31);
  assert.equal(estimate.band, 7.0);
  assert.equal(estimate.total, 13);
});

test("refuses to estimate without questions", () => {
  // "no data" and "band 2.0" are different statements.
  assert.equal(estimateBand(0, 0), null);
  assert.equal(estimateBand(5, -1), null);
  assert.equal(estimateBand(Number.NaN, 40), null);
});

test("clamps a score above the question count", () => {
  const estimate = estimateBand(50, 40);
  assert.equal(estimate.correct, 40);
  assert.equal(estimate.band, 9.0);
});

test("bandFromRecords aggregates the most recent attempts", () => {
  const record = (id, correct, total, createdAt) => ({
    id,
    examId: id,
    correctAnswers: correct,
    totalQuestions: total,
    createdAt,
  });
  const estimate = bandFromRecords(
    [
      record("a", 10, 13, "2026-07-24T00:00:00.000Z"),
      record("b", 9, 13, "2026-07-23T00:00:00.000Z"),
      record("c", 8, 14, "2026-07-22T00:00:00.000Z"),
    ],
    3,
  );
  assert.equal(estimate.correct, 27);
  assert.equal(estimate.total, 40);
  assert.equal(estimate.recordCount, 3);
  assert.equal(estimate.band, 6.5);
  assert.equal(bandFromRecords([]), null);
});

test("formatBand always shows one decimal", () => {
  assert.equal(formatBand(6), "6.0");
  assert.equal(formatBand(6.5), "6.5");
});

test("parseBandScore reads the overall band out of free text", () => {
  assert.equal(parseBandScore("6.5"), 6.5);
  assert.equal(parseBandScore("6.5 (no band below 6.0)"), 6.5);
  assert.equal(parseBandScore("IELTS 7.0 overall"), 7.0);
  assert.equal(parseBandScore(null), null);
  assert.equal(parseBandScore("see website"), null);
  // A leading number outside the band range is not a band.
  assert.equal(parseBandScore("2026 entry"), null);
});

test("toBandGap derives state and rounds delta to half bands", () => {
  assert.equal(toBandGap(6.5, 6.0, "lab_estimate").state, "below");
  assert.equal(toBandGap(6.5, 6.0, "lab_estimate").delta, -0.5);
  assert.equal(toBandGap(6.5, 6.5).state, "meets");
  assert.equal(toBandGap(6.5, 7.0).state, "exceeds");
  assert.equal(toBandGap(6.5, null).state, "no-estimate");
  assert.equal(toBandGap(null, 6.0).state, "no-requirement");
  assert.equal(toBandGap(6.5, null).delta, null);
});
