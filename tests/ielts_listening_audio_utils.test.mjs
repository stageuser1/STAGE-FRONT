/**
 * Listening player arithmetic.
 *
 * The cases worth guarding are the ones a media element hands you rather than
 * the ones a designer draws: a duration of NaN before metadata loads, a drag
 * that overshoots the end, an anchor authored past the file's length. Each of
 * those either throws or renders garbage if it reaches the DOM unclamped, and
 * this repo has no DOM runner to catch it there.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PLAYBACK_RATE,
  PLAYBACK_RATES,
  anchorPositions,
  clampSeek,
  formatRate,
  formatTime,
  isPlaybackRate,
} from "../lib/ielts/listening-audio-utils.ts";

test("formatTime renders m:ss", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(5), "0:05");
  assert.equal(formatTime(65), "1:05");
  assert.equal(formatTime(599), "9:59");
  // Truncated, not rounded: a clock must never show a second the media has
  // not reached, or the total reads one second short of the elapsed at the end.
  assert.equal(formatTime(65.9), "1:05");
  // Pinned at the rollover specifically: rounding here would print "1:00" for a
  // track that has not reached the minute, and the elapsed clock would tick to
  // the next minute a full second before the audio does.
  assert.equal(formatTime(59.9), "0:59");
});

test("formatTime rolls over to h:mm:ss past the hour", () => {
  assert.equal(formatTime(3600), "1:00:00");
  assert.equal(formatTime(3661), "1:01:01");
  assert.equal(formatTime(4000), "1:06:40");
});

test("formatTime survives the values an unloaded element reports", () => {
  assert.equal(formatTime(Number.NaN), "0:00");
  assert.equal(formatTime(Infinity), "0:00");
  assert.equal(formatTime(-5), "0:00");
});

test("clampSeek holds a seek inside the media", () => {
  assert.equal(clampSeek(30, 120), 30);
  assert.equal(clampSeek(-1, 120), 0);
  assert.equal(clampSeek(999, 120), 120);
  assert.equal(clampSeek(120, 120), 120);
});

test("clampSeek collapses to 0 when the duration is unknown", () => {
  assert.equal(clampSeek(30, Number.NaN), 0);
  assert.equal(clampSeek(30, Infinity), 0);
  assert.equal(clampSeek(30, 0), 0);
  assert.equal(clampSeek(Number.NaN, 120), 0);
});

test("anchorPositions places markers as fractions of the bar", () => {
  const positions = anchorPositions(
    [
      { questionNo: 1, timestampSec: 0 },
      { questionNo: 2, timestampSec: 30 },
      { questionNo: 3, timestampSec: 120 },
    ],
    120,
  );

  assert.deepEqual(
    positions.map((position) => position.fraction),
    [0, 0.25, 1],
  );
  assert.deepEqual(
    positions.map((position) => position.questionNo),
    [1, 2, 3],
  );
});

test("anchorPositions clamps an anchor authored past the file", () => {
  // The set declares its own durationSec; the loaded file is the placeholder
  // and is shorter. The marker parks at the end rather than off the track.
  const [position] = anchorPositions(
    [{ questionNo: 7, timestampSec: 400 }],
    120,
  );
  assert.equal(position.timestampSec, 120);
  assert.equal(position.fraction, 1);
});

test("anchorPositions handles nothing to place", () => {
  assert.deepEqual(anchorPositions([], 120), []);
  assert.deepEqual(anchorPositions(undefined, 120), []);
});

test("anchorPositions pins every marker at 0 when the duration is unknown", () => {
  const positions = anchorPositions(
    [
      { questionNo: 1, timestampSec: 10 },
      { questionNo: 2, timestampSec: 20 },
    ],
    Number.NaN,
  );
  assert.deepEqual(
    positions.map((position) => position.fraction),
    [0, 0],
  );
});

test("the rate ladder is the fixed set, defaulting to 1", () => {
  assert.deepEqual([...PLAYBACK_RATES], [0.75, 1, 1.25, 1.5]);
  assert.equal(DEFAULT_PLAYBACK_RATE, 1);
  assert.ok(isPlaybackRate(DEFAULT_PLAYBACK_RATE));
  assert.equal(isPlaybackRate(2), false);
  assert.equal(isPlaybackRate(1.75), false);
});

test("formatRate pads the whole rate without rounding the quarters away", () => {
  assert.deepEqual(PLAYBACK_RATES.map(formatRate), [
    "0.75×",
    "1.0×",
    "1.25×",
    "1.5×",
  ]);
});
