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
  assert.equal(typeof corpus.sourceStatement, "string");
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
  assert.ok(questions.length >= 200 && questions.length <= 350);
  assert.ok(topics.length >= 20 && topics.length <= 30);
});
