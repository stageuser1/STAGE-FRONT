/**
 * The Task 2 word-count rule and clock format.
 *
 * The count is what a learner is measured against — it decides whether the
 * readout says 已达到字数要求 and whether 完成本次练习 is available — so the rule
 * is pinned here rather than described in a comment and left to drift.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  T2_WORD_TARGET,
  countWords,
  formatElapsed,
} from "../lib/ielts/writing-t2-attempt.ts";

test("the target is Task 2's 250 words", () => {
  assert.equal(T2_WORD_TARGET, 250);
});

test("empty and blank text count zero", () => {
  for (const text of ["", " ", "\n\n", "\t  \n "]) {
    assert.equal(countWords(text), 0, JSON.stringify(text));
  }
});

test("words are whitespace-delimited", () => {
  assert.equal(countWords("one two three"), 3);
  // Any run of whitespace is one delimiter, so newlines and double spaces
  // between paragraphs do not inflate the count.
  assert.equal(countWords("one  two\n\nthree\tfour"), 4);
  assert.equal(countWords("  leading and trailing  "), 3);
});

test("a hyphenated word is one word", () => {
  // The convention IELTS itself uses. Nothing splits on the hyphen.
  assert.equal(countWords("well-being"), 1);
  assert.equal(countWords("state-of-the-art solutions"), 2);
  assert.equal(countWords("don't"), 1);
});

test("a token of pure punctuation counts zero", () => {
  // The export's rule (`split(/\s+/).length`) counts these, which would let a
  // line of dashes read as progress toward 250.
  assert.equal(countWords("one — two - three"), 3);
  assert.equal(countWords("— - ... !"), 0);
  // Punctuation attached to a word does not change it.
  assert.equal(countWords("Hello, world!"), 2);
});

test("the clock is zero-padded hours:minutes:seconds, counting up", () => {
  assert.equal(formatElapsed(0), "00:00:00");
  assert.equal(formatElapsed(1), "00:00:01");
  assert.equal(formatElapsed(59), "00:00:59");
  assert.equal(formatElapsed(60), "00:01:00");
  assert.equal(formatElapsed(252), "00:04:12");
  assert.equal(formatElapsed(3600), "01:00:00");
  assert.equal(formatElapsed(3661), "01:01:01");
  // A 40-minute task can overrun; the format must not wrap at an hour.
  assert.equal(formatElapsed(86_399), "23:59:59");
  assert.equal(formatElapsed(90_000), "25:00:00");
});

test("the clock never renders a negative or fractional second", () => {
  assert.equal(formatElapsed(-5), "00:00:00");
  assert.equal(formatElapsed(12.9), "00:00:12");
});
