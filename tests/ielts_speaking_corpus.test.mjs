/**
 * Contract tests for the static Speaking corpus.
 *
 * The approved T7 data contract (§3.3) chose a repository file over a CMS
 * collection partly because a file can be checked by machine. These are the six
 * assertions that decision promised.
 *
 * The JSON is read from disk rather than imported through `speaking-corpus.ts`
 * on purpose: this suite is about the *data*, and a reader that skipped a bad
 * row would hide exactly the defect being looked for.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const corpus = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../lib/ielts/speaking-questions.json", import.meta.url)),
    "utf8",
  ),
);

const snapshot = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./fixtures/speaking-corpus-ids.json", import.meta.url)),
    "utf8",
  ),
);

const topics = corpus.topics;
const questions = topics.flatMap((topic) => topic.questions);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CJK = /[　-〿一-鿿＀-￯]/;

test("envelope carries a version", () => {
  assert.equal(typeof corpus.corpusVersion, "number");
  assert.ok(corpus.corpusVersion >= 1);
  // Pinned verbatim since corpusVersion 2 (2026-07-30): the statement is the
  // compliance posture of the corpus — recall-derived questions, editorial
  // labels by STAGE — and must not drift in a content edit.
  assert.equal(
    corpus.sourceStatement,
    "题目基于考生回忆整理（2026 年 2–7 月场次），题干为考生回忆的转述文字，非官方试题原文；话题分类、话题中文名与中文注解为 STAGE 编辑撰写。保留的少量自撰话题在该话题的 sourceNote 中单独标明。",
  );
});

test("1 · every id is unique, non-empty and ASCII kebab", () => {
  const seen = new Set();
  for (const question of questions) {
    assert.equal(typeof question.id, "string", "question id must be a string");
    assert.match(question.id, KEBAB, `bad question id: ${question.id}`);
    assert.ok(!seen.has(question.id), `duplicate question id: ${question.id}`);
    seen.add(question.id);
  }
  const topicIds = new Set();
  for (const topic of topics) {
    assert.match(topic.id, KEBAB, `bad topic id: ${topic.id}`);
    assert.ok(!topicIds.has(topic.id), `duplicate topic id: ${topic.id}`);
    topicIds.add(topic.id);
  }
});

test("2 · part is 1/2/3 and cue points belong to Part 2 only", () => {
  for (const question of questions) {
    assert.ok(
      [1, 2, 3].includes(question.part),
      `bad part on ${question.id}: ${question.part}`,
    );
    if (question.part === 2) {
      assert.ok(
        Array.isArray(question.cuePointsEn) && question.cuePointsEn.length > 0,
        `Part 2 card without cue points: ${question.id}`,
      );
      for (const point of question.cuePointsEn) {
        assert.ok(
          typeof point === "string" && point.trim() !== "",
          `empty cue point on ${question.id}`,
        );
      }
    } else {
      assert.equal(
        question.cuePointsEn,
        undefined,
        `cue points outside Part 2: ${question.id}`,
      );
    }
  }
});

test("3 · prompts are non-empty English; glosses are absent or non-empty", () => {
  for (const question of questions) {
    assert.ok(
      typeof question.textEn === "string" && question.textEn.trim() !== "",
      `empty prompt: ${question.id}`,
    );
    assert.ok(
      !CJK.test(question.textEn),
      `Chinese in the English prompt: ${question.id}`,
    );
    if ("glossZh" in question) {
      assert.ok(
        typeof question.glossZh === "string" && question.glossZh.trim() !== "",
        `empty gloss: ${question.id}`,
      );
    }
  }
});

test("4 · every topic is labelled, sourced and non-empty", () => {
  for (const topic of topics) {
    for (const field of ["labelEn", "labelZh", "sourceNote"]) {
      assert.ok(
        typeof topic[field] === "string" && topic[field].trim() !== "",
        `topic ${topic.id} is missing ${field}`,
      );
    }
    assert.ok(
      Array.isArray(topic.questions) && topic.questions.length > 0,
      `topic ${topic.id} has no questions`,
    );
  }
});

/**
 * The scope freeze, asserted against the data rather than trusted to review.
 *
 * A question bank is where a score-oriented or recording-oriented phrase would
 * most plausibly slip in during a later content edit; the module has no field
 * for any of it, and the prompts must not describe it either.
 */
test("5 · no banned vocabulary anywhere in the corpus", () => {
  const banned = [
    "band",
    "score",
    "examiner",
    "recording",
    "microphone",
    "pronunciation",
    "估算",
    "模考",
    "倒计时",
    "评分",
    "打分",
    "录音",
    "考官",
    "麦克风",
  ];
  const text = JSON.stringify(corpus).toLowerCase();
  for (const term of banned) {
    assert.ok(!text.includes(term.toLowerCase()), `banned term in corpus: ${term}`);
  }
});

/**
 * Ids are the key a learner's own material hangs off. Removing or renaming one
 * orphans every fragment, draft block and 独立表达 event written against it, so
 * it has to be a deliberate act: update `tests/fixtures/speaking-corpus-ids.json`
 * in the same commit, having decided what happens to that material.
 *
 * 2026-07-30 · The baseline was reset at corpusVersion 2, when the self-authored
 * v1 corpus was replaced by the recall-derived import (approved decision:
 * recall questions become the corpus body; 20 self-authored topics deleted,
 * friends/money-and-saving folded into recall topics, 6 kept). This was done
 * pre-launch, with no learner data in existence, so no material was orphaned.
 * The guarantee itself is unchanged and applies from v2 ids onward.
 */
test("6 · no id from the previous corpus version has disappeared", () => {
  const present = new Set(questions.map((question) => question.id));
  const missing = snapshot.ids.filter((id) => !present.has(id));
  assert.deepEqual(
    missing,
    [],
    `question ids were removed or renamed: ${missing.join(", ")}. ` +
      "Learners' local fragments are keyed by these ids and would be orphaned. " +
      "If this is intended, update tests/fixtures/speaking-corpus-ids.json.",
  );
});

test("corpus is within the size budget agreed in the data contract", () => {
  const bytes = readFileSync(
    fileURLToPath(new URL("../lib/ielts/speaking-questions.json", import.meta.url)),
  ).byteLength;
  // §3.1: past 150 KB the corpus splits per part and is loaded on demand.
  assert.ok(bytes < 150_000, `corpus is ${bytes} bytes; the split threshold is 150 KB`);
  // Bounds widened 2026-07-30 with the corpusVersion 2 recall import
  // (approved): questions 350 → 500, topics 30 → 45. The 150 KB split
  // threshold and the 200-question floor are unchanged.
  assert.ok(questions.length >= 200 && questions.length <= 500);
  assert.ok(topics.length >= 20 && topics.length <= 45);
});

/**
 * Recall provenance, present since corpusVersion 2. Optional — self-authored
 * rows have no sitting data and must omit both fields — but where present the
 * pair is complete and well-formed. Data only for now; the UI's later
 * "high-frequency" badge hangs off recallCount.
 */
test("recallCount/recallMonths are absent or a well-formed pair", () => {
  for (const question of questions) {
    const hasCount = "recallCount" in question;
    const hasMonths = "recallMonths" in question;
    assert.equal(hasCount, hasMonths, `recall fields must come as a pair: ${question.id}`);
    if (!hasCount) continue;
    assert.ok(
      Number.isInteger(question.recallCount) && question.recallCount >= 1,
      `recallCount must be a positive integer: ${question.id}`,
    );
    assert.ok(
      Array.isArray(question.recallMonths) && question.recallMonths.length >= 1,
      `recallMonths must be a non-empty array: ${question.id}`,
    );
    for (const month of question.recallMonths) {
      assert.match(month, /^\d{4}-(0[1-9]|1[0-2])$/, `bad recall month on ${question.id}: ${month}`);
    }
  }
});
