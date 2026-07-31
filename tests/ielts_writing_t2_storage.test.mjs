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

test("a restamped draft is repaired in storage, not only in memory", () => {
  const { map } = installStorage();

  for (const broken of [
    { text: "no stamp" },
    { text: "no stamp", updatedAt: 12345 },
    { text: "no stamp", updatedAt: "not a date" },
  ]) {
    map.set(`${DRAFT}wt2-001`, JSON.stringify(broken));

    const draft = loadWritingT2Draft("wt2-001");
    assert.equal(draft.text, "no stamp");

    // The raw stored value must now carry the corrected timestamp. Left only in
    // the returned object, the repair would be redone on every load and the
    // draft would never age at all.
    const stored = JSON.parse(map.get(`${DRAFT}wt2-001`));
    assert.equal(stored.updatedAt, draft.updatedAt);
    assert.ok(
      Number.isFinite(new Date(stored.updatedAt).getTime()),
      `unparseable after repair: ${stored.updatedAt}`,
    );
    assert.equal(stored.text, "no stamp", "repair must not disturb the prose");
    assert.equal(stored.schemaVersion, 1);
  }
});

test("a draft with a good timestamp is not rewritten on load", () => {
  const { map } = installStorage();
  const good = new Date(Date.now() - 86_400_000).toISOString();
  map.set(
    `${DRAFT}wt2-001`,
    JSON.stringify({ text: "fine", elapsedSeconds: 7, updatedAt: good }),
  );

  loadWritingT2Draft("wt2-001");
  // Reading is not writing: an intact draft keeps its own timestamp, so its
  // 180-day clock is not silently reset by visiting the page.
  assert.equal(JSON.parse(map.get(`${DRAFT}wt2-001`)).updatedAt, good);
});

test("submitting records the attempt and clears the draft", () => {
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "one two three", 90);

  const result = submitWritingT2Attempt("wt2-001", "one two three", 90);
  assert.equal(result.ok, true);
  const record = result.attempt;
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
    const result = submitWritingT2Attempt("wt2-001", empty, 30);
    assert.deepEqual(result, { ok: false, reason: "empty" }, JSON.stringify(empty));
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

test("a quota refusal is reported, not swallowed", () => {
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => {},
    },
  };
  // The write must say it failed. The page keeps rendering from memory, but
  // nothing may go on to claim the draft was saved.
  assert.equal(saveWritingT2Draft("wt2-001", "unsaveable", 1), false);
  assert.equal(restartWritingT2Attempt("wt2-001"), false);
  assert.doesNotThrow(() => loadWritingT2Draft("wt2-001"));
});

test("a refused autosave never reports success", () => {
  // The defect this guards: setItem throwing used to be swallowed, so the
  // indicator said 草稿已自动保存 over a store that had received nothing. The
  // component drives that line off this boolean, so `false` here is what keeps
  // the UI honest.
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "saved once", 5);
  assert.equal(loadWritingT2Draft("wt2-001").text, "saved once");

  let refuse = true;
  const inner = globalThis.window.localStorage;
  globalThis.window.localStorage = {
    getItem: (k) => inner.getItem(k),
    removeItem: (k) => inner.removeItem(k),
    setItem: (k, v) => {
      if (refuse) throw new DOMException("QuotaExceededError");
      inner.setItem(k, v);
    },
  };

  assert.equal(saveWritingT2Draft("wt2-001", "a much longer answer", 20), false);
  // The earlier draft is still what storage holds — a failed write changes
  // nothing rather than truncating what was there.
  assert.equal(loadWritingT2Draft("wt2-001").text, "saved once");

  // The next debounced save retries, and succeeds once there is room again.
  refuse = false;
  assert.equal(saveWritingT2Draft("wt2-001", "a much longer answer", 20), true);
  assert.equal(loadWritingT2Draft("wt2-001").text, "a much longer answer");
  assert.equal(map.size > 0, true);
});

test("a refused submit keeps the draft and reports storage", () => {
  const { map } = installStorage();
  saveWritingT2Draft("wt2-001", "my whole essay", 300);

  const inner = globalThis.window.localStorage;
  globalThis.window.localStorage = {
    getItem: (k) => inner.getItem(k),
    removeItem: (k) => inner.removeItem(k),
    setItem: () => {
      throw new DOMException("QuotaExceededError");
    },
  };

  const result = submitWritingT2Attempt("wt2-001", "my whole essay", 300);
  assert.deepEqual(result, { ok: false, reason: "storage" });

  // Restore reading so the assertions below see the real store.
  globalThis.window.localStorage = inner;
  // The essay must survive: no record was written, so the draft is all there is.
  assert.equal(loadWritingT2Draft("wt2-001").text, "my whole essay");
  assert.equal(loadWritingT2Attempt("wt2-001"), null);
  assert.equal(map.has(`${ATTEMPT}wt2-001`), false);
});

test("on the server there is no storage and nothing throws", () => {
  delete globalThis.window;
  assert.equal(loadWritingT2Draft("wt2-001"), null);
  assert.equal(loadWritingT2Attempt("wt2-001"), null);
  assert.doesNotThrow(() => saveWritingT2Draft("wt2-001", "x", 1));
  assert.doesNotThrow(() => clearWritingT2Draft("wt2-001"));
});
