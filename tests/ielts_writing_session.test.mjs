import assert from "node:assert/strict";
import test from "node:test";

import {
  canComplete,
  countWords,
  emptySession,
  isModelAnswerUnlocked,
  markCompleted,
  startedTaskCount,
  taskText,
  totalWords,
  withTaskText,
} from "../lib/ielts/writing-session.ts";

test("countWords counts whitespace-delimited words, not punctuation", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n  "), 0);
  assert.equal(countWords("The chart shows"), 3);
  // Hyphenated compounds are one word, as every word processor counts them.
  assert.equal(countWords("a well-known example"), 3);
  // Stray punctuation is not a word.
  assert.equal(countWords("hello — world"), 2);
  assert.equal(countWords("...\t---"), 0);
  // Irregular whitespace does not inflate the count.
  assert.equal(countWords("  one   two\nthree\t four  "), 4);
});

test("withTaskText keeps both tasks of a session independent", () => {
  const base = emptySession("bar-chart-energy");
  const one = withTaskText(base, 1, "First task answer.");
  const both = withTaskText(one, 2, "Second task answer here.");

  assert.equal(taskText(both, 1), "First task answer.");
  assert.equal(taskText(both, 2), "Second task answer here.");
  assert.equal(totalWords(both), 7);
  assert.equal(startedTaskCount(both), 2);
});

test("switching tasks never clears the other side", () => {
  // The tab switch is a view change, so re-writing task 2 must leave task 1
  // exactly as it was (writing-spec §三 底部).
  const session = withTaskText(
    withTaskText(emptySession("s"), 1, "kept"),
    2,
    "replaced",
  );
  const after = withTaskText(session, 2, "rewritten entirely");

  assert.equal(taskText(after, 1), "kept");
  assert.equal(taskText(after, 2), "rewritten entirely");
});

test("an empty draft can never be completed", () => {
  const empty = emptySession("s");
  assert.equal(canComplete(empty), false);
  // markCompleted refuses rather than throwing, and returns the session as-is.
  assert.equal(markCompleted(empty).completedAt, null);

  // Whitespace and punctuation are not writing.
  const blank = withTaskText(empty, 1, "   \n\t  ");
  assert.equal(canComplete(blank), false);
  const punctuation = withTaskText(empty, 1, "-- ... ,,,");
  assert.equal(canComplete(punctuation), false);
});

test("model answers stay locked until the learner completes their own writing", () => {
  const empty = emptySession("s");
  assert.equal(isModelAnswerUnlocked(null), false);
  assert.equal(isModelAnswerUnlocked(empty), false);

  // Written but not completed: still locked.
  const written = withTaskText(empty, 1, "The chart shows a steady rise.");
  assert.equal(isModelAnswerUnlocked(written), false);

  // Completed with real words: unlocked.
  const completed = markCompleted(written);
  assert.notEqual(completed.completedAt, null);
  assert.equal(isModelAnswerUnlocked(completed), true);
});

test("emptying a completed session locks the model answer again", () => {
  // The word check is re-evaluated on every read rather than trusted from the
  // completion flag, so clearing the editor after completing re-locks it.
  const completed = markCompleted(
    withTaskText(emptySession("s"), 1, "Some real writing here."),
  );
  const emptied = withTaskText(completed, 1, "");

  assert.notEqual(emptied.completedAt, null);
  assert.equal(totalWords(emptied), 0);
  assert.equal(isModelAnswerUnlocked(emptied), false);
});
