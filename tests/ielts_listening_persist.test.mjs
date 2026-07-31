/**
 * The restore decision.
 *
 * A stored attempt is untrusted input — an older build wrote it, or devtools
 * did, or a quota failure cut it in half — so every malformed case is pinned
 * here to the same answer: no restore, no throw. The one case that *is* offered
 * is asserted as an exact round trip, because a restore that quietly dropped
 * `elapsedSec` or an answer would hand the candidate back a paper that is not
 * the one they left.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  ATTEMPT_KEY_PREFIX,
  hasRecordedWork,
  shouldOfferRestore,
  storageKey,
} from "../lib/ielts/listening-persist.ts";
import {
  createAttempt,
  reduce,
  serializeAttempt,
} from "../lib/ielts/listening-runner.ts";
import { MUSEUM_MEMBERSHIP_SET } from "../lib/ielts/listening-fixture.ts";

const STARTED_AT = "2026-07-31T09:00:00.000Z";

/** An attempt with one of each answer shape and a clock that has run. */
function livePaper() {
  let attempt = createAttempt(MUSEUM_MEMBERSHIP_SET, STARTED_AT);
  attempt = reduce(attempt, { type: "answer", questionNo: 1, value: "Marchetti" });
  attempt = reduce(attempt, { type: "answer", questionNo: 6, value: ["A", "C"] });
  attempt = reduce(attempt, { type: "tick", seconds: 137 });
  return attempt;
}

test("storageKey namespaces one key per set", () => {
  assert.equal(
    storageKey("museum-membership-enquiry"),
    "ielts:listening:attempt:museum-membership-enquiry",
  );
  assert.equal(ATTEMPT_KEY_PREFIX, "ielts:listening:attempt:");
  // Two sets must never share a key.
  assert.notEqual(storageKey("a"), storageKey("b"));
});

test("nothing stored offers nothing", () => {
  assert.equal(shouldOfferRestore(null), null);
  assert.equal(shouldOfferRestore(""), null);
});

test("unparseable JSON offers nothing", () => {
  assert.equal(shouldOfferRestore("{"), null);
  assert.equal(shouldOfferRestore("not json at all"), null);
  // Valid JSON that is not an object is still not an attempt.
  assert.equal(shouldOfferRestore("42"), null);
  assert.equal(shouldOfferRestore("[]"), null);
  assert.equal(shouldOfferRestore("null"), null);
});

test("a submitted attempt is not offered", () => {
  const submitted = reduce(livePaper(), { type: "submit" });
  assert.equal(submitted.status, "submitted");
  assert.equal(shouldOfferRestore(serializeAttempt(submitted)), null);
});

test("an in-progress attempt round-trips exactly", () => {
  const attempt = livePaper();
  const restored = shouldOfferRestore(serializeAttempt(attempt));
  assert.deepEqual(restored, attempt);
  // The clock and both answer shapes specifically, so a regression here reads
  // as what it is rather than as a diff of the whole object.
  assert.equal(restored.elapsedSec, 137);
  assert.equal(restored.startedAt, STARTED_AT);
  assert.equal(restored.answers[1].value, "Marchetti");
  assert.deepEqual(restored.answers[6].value, ["A", "C"]);
});

test("recorded work is one answer, not one second", () => {
  const fresh = createAttempt(MUSEUM_MEMBERSHIP_SET, STARTED_AT);
  assert.equal(hasRecordedWork(fresh), false);
  assert.equal(
    hasRecordedWork(reduce(fresh, { type: "tick", seconds: 600 })),
    false,
  );
  assert.equal(
    hasRecordedWork(reduce(fresh, { type: "answer", questionNo: 1, value: "x" })),
    true,
  );
  // An answer typed and then deleted is still recorded work: the writer latches
  // on this, so a paper cleared back to blank must still overwrite its draft.
  assert.equal(
    hasRecordedWork(
      reduce(fresh, { type: "answer", questionNo: 1, value: "" }),
    ),
    true,
  );
});

test("an untouched paper is not offered back", () => {
  // Written the moment the page opened, before anything was answered. Valid,
  // in progress, and worth nothing to the candidate.
  const untouched = createAttempt(MUSEUM_MEMBERSHIP_SET, STARTED_AT);
  assert.equal(shouldOfferRestore(serializeAttempt(untouched)), null);

  // The clock alone is not work either.
  const ticked = reduce(untouched, { type: "tick", seconds: 90 });
  assert.equal(shouldOfferRestore(serializeAttempt(ticked)), null);

  // One answer is.
  const answered = reduce(ticked, {
    type: "answer",
    questionNo: 1,
    value: "Marchetti",
  });
  assert.notEqual(shouldOfferRestore(serializeAttempt(answered)), null);
});

test("a record missing answers offers nothing", () => {
  const { answers, ...withoutAnswers } = livePaper();
  assert.ok(answers);
  assert.equal(shouldOfferRestore(JSON.stringify(withoutAnswers)), null);
});

test("other wrong shapes offer nothing", () => {
  const good = livePaper();
  const broken = [
    { ...good, setId: 5 },
    { ...good, setId: "" },
    { ...good, startedAt: 0 },
    { ...good, elapsedSec: "137" },
    { ...good, elapsedSec: Number.NaN },
    { ...good, elapsedSec: -1 },
    { ...good, status: "paused" },
    { ...good, answers: [] },
    { ...good, answers: { 1: "Marchetti" } },
    { ...good, answers: { 1: { questionNo: 1 } } },
    { ...good, answers: { 6: { questionNo: 6, value: [1, 2] } } },
  ];
  for (const record of broken) {
    assert.equal(
      shouldOfferRestore(JSON.stringify(record)),
      null,
      `offered a restore for ${JSON.stringify(record)}`,
    );
  }
});

test("unknown extra fields are not carried into the restored attempt", () => {
  const raw = JSON.stringify({ ...livePaper(), reviewMode: true });
  const restored = shouldOfferRestore(raw);
  assert.deepEqual(Object.keys(restored).sort(), [
    "answers",
    "elapsedSec",
    "setId",
    "startedAt",
    "status",
  ]);
});
