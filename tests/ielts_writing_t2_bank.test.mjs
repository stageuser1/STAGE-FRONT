/**
 * Contract tests for the static Writing Task 2 recall bank.
 *
 * `writing-t2-bank.ts` narrows the JSON import to `WritingT2Bank` with a type
 * assertion, because `resolveJsonModule` widens every string in the file. An
 * assertion is a compile-time claim that nothing checks at runtime, so these are
 * the checks that actually hold the claim up.
 *
 * The JSON is read from disk rather than through the reader, for the reason the
 * Speaking suite gives: this is about the *data*, and a reader that quietly
 * dropped a bad row would hide the defect being looked for.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  WRITING_ESSAY_TYPE_LABELS,
  WRITING_FREQUENCY_LABELS,
  WRITING_MODULE_LABELS,
  isPracticable,
} from "../lib/ielts/writing-types.ts";
import { writingStrategyTip } from "../lib/ielts/writing-tips.ts";

const bank = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../lib/ielts/writing-t2-bank.json", import.meta.url)),
    "utf8",
  ),
);

const questions = bank.questions;
const ESSAY_TYPES = Object.keys(WRITING_ESSAY_TYPE_LABELS);
const MODULES = Object.keys(WRITING_MODULE_LABELS);
const FREQUENCIES = Object.keys(WRITING_FREQUENCY_LABELS);
const ID = /^wt2-\d{3}$/;

test("the envelope is the version the reader asserts", () => {
  assert.equal(bank.schemaVersion, "WritingT2BankV1");
  assert.equal(bank.source, "verbatim-recall");
  assert.ok(Number.isInteger(bank.corpusVersion) && bank.corpusVersion >= 1);
  assert.match(bank.sourceWindow, /^\d{4}-\d{2}\.\.\d{4}-\d{2}$/);
  // Rendered to learners wherever bank text appears, so it cannot be empty.
  assert.ok(bank.sourceStatement.trim().length > 0);
});

test("ids are unique, well-formed and in corpus order", () => {
  const ids = questions.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, ID);
  // The catalog presents the bank in file order; ids are assigned in source
  // order and never renumbered, so the two must agree.
  assert.deepEqual(ids, [...ids].sort());
});

test("every enum-valued field is inside its union", () => {
  for (const question of questions) {
    assert.ok(
      question.essayType === null || ESSAY_TYPES.includes(question.essayType),
      `${question.id}: essayType ${JSON.stringify(question.essayType)}`,
    );
    for (const module of question.modules) {
      assert.ok(MODULES.includes(module), `${question.id}: module ${module}`);
    }
    if ("frequency" in question) {
      assert.ok(
        FREQUENCIES.includes(question.frequency),
        `${question.id}: frequency ${question.frequency}`,
      );
    }
  }
});

test("prompt text is verbatim and non-empty", () => {
  for (const question of questions) {
    assert.ok(question.promptText.length > 0, `${question.id}: empty prompt`);
    // Stored byte-faithful to the recall: a trimmed copy must be identical, or
    // something in the pipeline has been tidying prompts.
    assert.equal(question.promptText, question.promptText.trim());
    assert.ok(Array.isArray(question.variants));
    for (const variant of question.variants) {
      assert.equal(variant, variant.trim());
      assert.notEqual(variant, question.promptText);
    }
  }
});

test("no question carries a translation field", () => {
  // The UI renders a Chinese subtitle only if the data has one. Nothing may add
  // that field except a real translation, so its absence is asserted rather
  // than left to a reviewer to notice.
  for (const question of questions) {
    assert.ok(
      !("promptTextCn" in question),
      `${question.id}: unexpected promptTextCn`,
    );
  }
});

test("frequency is absent below two sightings and banded above", () => {
  for (const question of questions) {
    assert.ok(question.occurrenceCount >= 1, question.id);
    // `months` is the *distinct* months that reported it, so it is bounded by
    // the sighting count but need not equal it: wt2-017, -018 and -020 were each
    // recalled twice within one month.
    const months = question.months;
    assert.ok(
      months.length >= 1 && months.length <= question.occurrenceCount,
      `${question.id}: ${months.length} months for ${question.occurrenceCount} sightings`,
    );
    assert.equal(new Set(months).size, months.length, `${question.id}: repeated month`);
    for (const month of months) assert.match(month, /^\d{4}-\d{2}$/);

    if (question.occurrenceCount === 1) {
      // Not "low": one sighting is not evidence of rarity.
      assert.ok(
        !("frequency" in question),
        `${question.id}: banded on a single sighting`,
      );
      continue;
    }

    assert.equal(
      question.frequency,
      question.occurrenceCount >= 3 ? "high" : "medium",
      `${question.id}: band disagrees with occurrenceCount`,
    );
  }
});

test("the practicable set is the catalog's 21 questions", () => {
  const fragments = questions.filter((question) => !isPracticable(question));
  assert.deepEqual(
    fragments.map((question) => question.id),
    ["wt2-002", "wt2-003", "wt2-011", "wt2-012"],
  );
  assert.equal(questions.filter(isPracticable).length, 21);
  // Every excluded row says why it is excluded; nothing else carries the flag.
  for (const question of fragments) assert.equal(question.incomplete, true);
});

test("the frequency badges the catalog shows are the ones in the data", () => {
  const banded = questions.filter(isPracticable).filter((q) => "frequency" in q);
  assert.equal(banded.filter((q) => q.frequency === "high").length, 1);
  assert.equal(banded.filter((q) => q.frequency === "medium").length, 5);
});

test("every question resolves a strategy tip", () => {
  // `writingStrategyTip` is total over the union plus null, so this fails only
  // if the bank grows a rubric the tips do not cover.
  for (const question of questions) {
    const tip = writingStrategyTip(question.essayType);
    assert.equal(typeof tip, "string");
    assert.ok(tip.trim().length > 0, `${question.id}: empty tip`);
  }
});
