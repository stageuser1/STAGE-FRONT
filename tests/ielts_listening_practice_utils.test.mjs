/**
 * The practice page's own decisions.
 *
 * The page is a `.tsx` and therefore untestable here, which is exactly why
 * these four functions are not in it. The load-bearing cases: the confirm
 * button must change its word when the paper has gaps, `Next` must stop at the
 * end of the paper rather than wrap, and a jump to question 3 must resolve to
 * the third *blank* of the form card and not to its third row.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  confirmSubmitLabel,
  questionTarget,
  stepQuestionNo,
  submitSummary,
} from "../lib/ielts/listening-practice-utils.ts";
import { questionNumbers } from "../lib/ielts/listening-runner.ts";
import { MUSEUM_MEMBERSHIP_SET } from "../lib/ielts/listening-fixture.ts";

const NUMBERS = questionNumbers(MUSEUM_MEMBERSHIP_SET);

test("the confirm button names what it is about to do", () => {
  assert.equal(confirmSubmitLabel([]), "确认交卷");
  assert.equal(confirmSubmitLabel([3]), "仍要交卷");
  assert.equal(confirmSubmitLabel([3, 4, 7]), "仍要交卷");
});

test("the summary states the gap count, or that there is none", () => {
  assert.equal(submitSummary([], 8), "全部 8 题均已作答。");
  assert.equal(submitSummary([3, 4], 8), "还有 2 题未作答（共 8 题）：");
});

test("Previous and Next clamp at the ends of the paper", () => {
  assert.equal(stepQuestionNo(NUMBERS, 1, 1), 2);
  assert.equal(stepQuestionNo(NUMBERS, 2, -1), 1);
  // Last question, forwards: stays put. First question, backwards: stays put.
  assert.equal(stepQuestionNo(NUMBERS, 8, 1), 8);
  assert.equal(stepQuestionNo(NUMBERS, 1, -1), 1);
});

test("stepping from nothing selected lands on the first question", () => {
  assert.equal(stepQuestionNo(NUMBERS, null, 1), 1);
  assert.equal(stepQuestionNo(NUMBERS, null, -1), 1);
  // A number that is not in the set is treated the same way.
  assert.equal(stepQuestionNo(NUMBERS, 99, 1), 1);
  assert.equal(stepQuestionNo([], null, 1), null);
});

test("a form-completion question resolves to its own blank", () => {
  // Questions 1–5 are the five blanks of the single form card, in order.
  for (let no = 1; no <= 5; no++) {
    assert.deepEqual(questionTarget(MUSEUM_MEMBERSHIP_SET, no), {
      groupIndex: 0,
      controlIndex: no - 1,
    });
  }
});

test("a one-question group resolves to its own card, control zero", () => {
  assert.deepEqual(questionTarget(MUSEUM_MEMBERSHIP_SET, 6), {
    groupIndex: 1,
    controlIndex: 0,
  });
  assert.deepEqual(questionTarget(MUSEUM_MEMBERSHIP_SET, 7), {
    groupIndex: 2,
    controlIndex: 0,
  });
  assert.deepEqual(questionTarget(MUSEUM_MEMBERSHIP_SET, 8), {
    groupIndex: 3,
    controlIndex: 0,
  });
});

test("every question in the set has a target, and nothing else does", () => {
  for (const no of NUMBERS) {
    assert.notEqual(
      questionTarget(MUSEUM_MEMBERSHIP_SET, no),
      null,
      `no target for question ${no}`,
    );
  }
  assert.equal(questionTarget(MUSEUM_MEMBERSHIP_SET, 0), null);
  assert.equal(questionTarget(MUSEUM_MEMBERSHIP_SET, 99), null);
});
