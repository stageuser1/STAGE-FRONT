/**
 * The Task 2 draft and attempt storage contract.
 *
 * This is the learner's own prose, so the cases that matter are the ones where
 * something has already gone wrong: a half-written entry, a corrupt value, a
 * quota refusal, an empty submit. None of them may lose an essay or take the
 * page down.
 *
 * `isBrowser()` is evaluated per call, so a `globalThis.window` stub installed
 * here is enough — the module needs no DOM beyond `localStorage`.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  clearWritingT2Draft,
  loadWritingT2Attempt,
  loadWritingT2Draft,
  restartWritingT2Attempt,
  saveWritingT2Draft,
  submitWritingT2Attempt,
} from "../lib/ielts/writing-t2-attempt.ts";

const DRAFT = "stage.ielts.writing.draft.";
const ATTEMPT = "stage.ielts.writing.attempt.";

function installStorage() {
  const map = new Map();
  const storage = {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
    get length() {
      return map.size;
    },
  };
  globalThis.window = { localStorage: storage };
  return { map, storage };
}

test.beforeEach(() => installStorage());

test("a draft round-trips under the specified key", () => {
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "Hello world", 42);

  assert.ok(map.has(`${DRAFT}wt2-001`), "key name changed");
  const draft = loadWritingT2Draft("wt2-001");
  assert.equal(draft.text, "Hello world");
  assert.equal(draft.elapsedSeconds, 42);
  assert.equal(draft.questionId, "wt2-001");
  assert.match(draft.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("drafts are per question and never bleed across ids", () => {
  saveWritingT2Draft("wt2-001", "first", 10);
  saveWritingT2Draft("wt2-004", "second", 20);
  assert.equal(loadWritingT2Draft("wt2-001").text, "first");
  assert.equal(loadWritingT2Draft("wt2-004").text, "second");
  assert.equal(loadWritingT2Draft("wt2-005"), null);
});

test("text is stored verbatim, including whitespace the user typed", () => {
  const typed = "  Leading space,\n\nand a blank line.  ";
  saveWritingT2Draft("wt2-001", typed, 0);
  assert.equal(loadWritingT2Draft("wt2-001").text, typed);
});

test("a stale draft is dropped rather than restored", () => {
  const { map } = installStorage();
  const old = new Date(Date.now() - 181 * 86_400_000).toISOString();
  map.set(
    `${DRAFT}wt2-001`,
    JSON.stringify({ questionId: "wt2-001", text: "ancient", elapsedSeconds: 5, updatedAt: old }),
  );
  assert.equal(loadWritingT2Draft("wt2-001"), null);

  const recent = new Date(Date.now() - 179 * 86_400_000).toISOString();
  map.set(
    `${DRAFT}wt2-001`,
    JSON.stringify({ questionId: "wt2-001", text: "recent", elapsedSeconds: 5, updatedAt: recent }),
  );
  assert.equal(loadWritingT2Draft("wt2-001").text, "recent");
});

test("corrupt or half-written entries degrade to no draft", () => {
  const { map } = installStorage();
  for (const bad of ["{not json", "null", '"a string"', "[]", '{"text":123}', "{}"]) {
    map.set(`${DRAFT}wt2-001`, bad);
    assert.equal(loadWritingT2Draft("wt2-001"), null, bad);
  }
  // A missing/!finite elapsed is repaired rather than fatal: the prose survives.
  map.set(`${DRAFT}wt2-001`, JSON.stringify({ text: "kept", elapsedSeconds: "xx" }));
  const draft = loadWritingT2Draft("wt2-001");
  assert.equal(draft.text, "kept");
  assert.equal(draft.elapsedSeconds, 0);
});

test("submitting records the attempt and clears the draft", () => {
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "one two three", 90);

  const record = submitWritingT2Attempt("wt2-001", "one two three", 90);
  assert.equal(record.wordCount, 3);
  assert.equal(record.elapsedSeconds, 90);
  assert.equal(record.questionId, "wt2-001");
  assert.match(record.submittedAt, /^\d{4}-\d{2}-\d{2}T/);

  assert.ok(map.has(`${ATTEMPT}wt2-001`), "attempt key changed");
  assert.equal(loadWritingT2Draft("wt2-001"), null, "draft survived submit");
  assert.equal(loadWritingT2Attempt("wt2-001").text, "one two three");
});

test("an empty submit writes nothing at all", () => {
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "   ", 30);

  for (const empty of ["", "   ", "\n\t", "— - ..."]) {
    assert.equal(submitWritingT2Attempt("wt2-001", empty, 30), null, JSON.stringify(empty));
  }
  assert.equal(map.has(`${ATTEMPT}wt2-001`), false, "empty attempt was recorded");
  // The guard must also not destroy the draft on the way out.
  assert.equal(loadWritingT2Draft("wt2-001").text, "   ");
});

test("a stored word count never outranks the stored text", () => {
  const { map } = installStorage();
  map.set(
    `${ATTEMPT}wt2-001`,
    JSON.stringify({ text: "one two", wordCount: 999, elapsedSeconds: 1, submittedAt: new Date().toISOString() }),
  );
  assert.equal(loadWritingT2Attempt("wt2-001").wordCount, 2);
});

test("再练一次 opens an empty draft and keeps the record", () => {
  submitWritingT2Attempt("wt2-001", "first attempt", 60);
  restartWritingT2Attempt("wt2-001");

  const draft = loadWritingT2Draft("wt2-001");
  assert.equal(draft.text, "");
  assert.equal(draft.elapsedSeconds, 0);
  // The record is history and must survive starting again.
  assert.equal(loadWritingT2Attempt("wt2-001").text, "first attempt");
});

test("resubmitting replaces the previous record", () => {
  submitWritingT2Attempt("wt2-001", "first attempt", 60);
  restartWritingT2Attempt("wt2-001");
  submitWritingT2Attempt("wt2-001", "a second and longer attempt", 120);

  const record = loadWritingT2Attempt("wt2-001");
  assert.equal(record.text, "a second and longer attempt");
  assert.equal(record.wordCount, 5);
  assert.equal(record.elapsedSeconds, 120);
  assert.equal(loadWritingT2Draft("wt2-001"), null);
});

test("clearing a draft leaves the record alone", () => {
  submitWritingT2Attempt("wt2-001", "kept", 10);
  restartWritingT2Attempt("wt2-001");
  clearWritingT2Draft("wt2-001");
  assert.equal(loadWritingT2Draft("wt2-001"), null);
  assert.equal(loadWritingT2Attempt("wt2-001").text, "kept");
});

test("a quota refusal is survivable", () => {
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => {},
    },
  };
  // The caller still gets its draft object back and the page keeps rendering.
  const draft = saveWritingT2Draft("wt2-001", "unsaveable", 1);
  assert.equal(draft.text, "unsaveable");
  assert.doesNotThrow(() => loadWritingT2Draft("wt2-001"));
});

test("on the server there is no storage and nothing throws", () => {
  delete globalThis.window;
  assert.equal(loadWritingT2Draft("wt2-001"), null);
  assert.equal(loadWritingT2Attempt("wt2-001"), null);
  assert.doesNotThrow(() => saveWritingT2Draft("wt2-001", "x", 1));
  assert.doesNotThrow(() => clearWritingT2Draft("wt2-001"));
});
