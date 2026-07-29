/**
 * The Speaking module's pure rules.
 *
 * Three things are load-bearing and are asserted here rather than left to the
 * UI: a draft block can only ever reference material the learner wrote, the
 * recall skeleton is deterministic, and an export/import round trip loses
 * nothing (Plan §5-T7).
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  SPEAKING_DIMENSIONS,
  addFragment,
  appendConnectiveBlock,
  appendFragmentBlock,
  draftText,
  emptySpeakingState,
  filledDimensions,
  fragmentBlockCount,
  hasMaterial,
  logSoloEvent,
  moveBlock,
  normaliseState,
  removeBlock,
  removeFragment,
  setRecallLevel,
  toggleChecked,
  updateFragment,
} from "../lib/ielts/speaking-session.ts";
import {
  CONNECTIVES,
  isContentWord,
  keywordsOf,
  skeletonTokens,
} from "../lib/ielts/speaking-text.ts";
import { mergeStates, parseImport, toJson } from "../lib/ielts/speaking-io.ts";

function stateWithTwoFragments() {
  let state = emptySpeakingState("hometown-p2-01");
  state = addFragment(state, "WHAT", "a small tea house by the river");
  state = addFragment(state, "FEELING", "quiet and familiar");
  return state;
}

test("the nine dimensions are the spec's, verbatim and in order", () => {
  assert.deepEqual(
    SPEAKING_DIMENSIONS.map((d) => `${d.labelEn} ${d.labelZh}`),
    [
      "WHAT 是什么",
      "WHO 谁",
      "WHEN 何时",
      "WHERE 何地",
      "WHY 为何",
      "MEMORY 记忆",
      "FEELING 感受",
      "CHANGE_OVER_TIME 变化",
      "COMPARISON 对比",
    ],
  );
});

test("blank fragments are refused, and filled dimensions get a check", () => {
  let state = emptySpeakingState("q1");
  state = addFragment(state, "WHAT", "   ");
  assert.equal(state.fragments.length, 0);

  state = addFragment(state, "WHAT", "  an old market  ");
  assert.equal(state.fragments.length, 1);
  assert.equal(state.fragments[0].text, "an old market");
  assert.deepEqual([...filledDimensions(state)], ["WHAT"]);
});

test("a draft block can only reference a fragment that exists", () => {
  const state = stateWithTwoFragments();
  const unchanged = appendFragmentBlock(state, "frag_does_not_exist");
  assert.equal(unchanged.draft.length, 0);
  assert.equal(unchanged, state, "a refused write returns the same object");

  const built = appendFragmentBlock(state, state.fragments[0].id);
  assert.equal(built.draft.length, 1);
  assert.equal(fragmentBlockCount(built), 1);
});

test("only a connective from the closed list may join the draft", () => {
  let state = stateWithTwoFragments();
  state = appendConnectiveBlock(state, "and then I would say that");
  assert.equal(state.draft.length, 0, "free text is not a connective");

  state = appendConnectiveBlock(state, CONNECTIVES[0]);
  assert.equal(state.draft.length, 1);
  assert.equal(state.draft[0].kind, "connective");
});

test("draft text is always rebuilt from the fragments, never stored", () => {
  let state = stateWithTwoFragments();
  const [first, second] = state.fragments;
  state = appendConnectiveBlock(state, "First of all,");
  state = appendFragmentBlock(state, first.id);
  state = appendFragmentBlock(state, second.id);

  assert.equal(
    draftText(state),
    "First of all, a small tea house by the river quiet and familiar",
  );

  // Editing the source fragment changes the draft: there is no second copy.
  state = updateFragment(state, first.id, "a tea house on the old bridge");
  assert.match(draftText(state), /a tea house on the old bridge/);
  assert.ok(!draftText(state).includes("by the river"));
});

test("deleting a fragment removes the draft blocks that cited it", () => {
  let state = stateWithTwoFragments();
  const [first, second] = state.fragments;
  state = appendFragmentBlock(state, first.id);
  state = appendFragmentBlock(state, second.id);
  assert.equal(state.draft.length, 2);

  state = removeFragment(state, first.id);
  assert.equal(state.draft.length, 1);
  assert.equal(draftText(state), "quiet and familiar");
});

test("blocks move within range and no further", () => {
  let state = stateWithTwoFragments();
  const [first, second] = state.fragments;
  state = appendFragmentBlock(state, first.id);
  state = appendFragmentBlock(state, second.id);
  const [top, bottom] = state.draft;

  const moved = moveBlock(state, bottom.id, -1);
  assert.deepEqual(
    moved.draft.map((block) => block.id),
    [bottom.id, top.id],
  );
  assert.equal(moveBlock(state, top.id, -1), state, "no move past the start");
  assert.equal(moveBlock(state, bottom.id, 1), state, "no move past the end");

  const dropped = removeBlock(state, top.id);
  assert.equal(dropped.draft.length, 1);
});

test("recall levels are clamped to the four defined steps", () => {
  const state = emptySpeakingState("q1");
  assert.equal(setRecallLevel(state, 2).recallLevel, 2);
  assert.equal(setRecallLevel(state, 9).recallLevel, 0);
  assert.equal(setRecallLevel(state, -1).recallLevel, 0);
});

test("the skeleton keeps content words and strips scaffolding", () => {
  const text = "I visited the market with my brother";
  assert.equal(isContentWord("market"), true);
  assert.equal(isContentWord("the"), false);

  const full = skeletonTokens(text, 0)
    .map((token) => token.display)
    .join("");
  assert.equal(full, text, "level 0 reproduces the draft exactly");

  const faded = skeletonTokens(text, 1);
  assert.equal(faded.find((t) => t.raw === "the").faded, true);
  assert.equal(faded.find((t) => t.raw === "market").faded, false);

  const hidden = skeletonTokens(text, 2).filter((token) => token.kind === "word");
  assert.deepEqual(
    hidden.filter((token) => !token.content).map((token) => token.display),
    ["·", "·", "·", "·"],
    "I / the / with / my are all replaced",
  );
  assert.deepEqual(
    hidden.filter((token) => token.content).map((token) => token.display),
    ["visited", "market", "brother"],
    "the learner's own words survive",
  );

  const initials = skeletonTokens(text, 3).filter((t) => t.content);
  assert.equal(initials[0].display[0], "v");
  assert.match(initials[0].display, /^v_+$/);
});

test("keyword hints are the learner's own words, deduplicated in order", () => {
  const words = keywordsOf(
    "the market was busy and the market was loud in the morning",
  );
  assert.deepEqual(words, ["market", "busy", "loud", "morning"]);
  assert.equal(keywordsOf("the market was busy", 1).length, 1);
});

test("a solo event records what was ticked and nothing else", () => {
  let state = stateWithTwoFragments();
  state = toggleChecked(state, "WHAT");
  state = toggleChecked(state, "FEELING");
  state = toggleChecked(state, "FEELING");
  state = logSoloEvent(state, "Describe a place", "2026-07-29T10:00:00.000Z");

  assert.equal(state.soloEvents.length, 1);
  assert.deepEqual(state.soloEvents[0].dimensions, ["WHAT"]);
  assert.deepEqual(Object.keys(state.soloEvents[0]).sort(), [
    "at",
    "dimensions",
    "id",
    "questionText",
  ]);

  state = logSoloEvent(state, "Describe a place", "2026-07-29T11:00:00.000Z");
  assert.equal(state.soloEvents.length, 2, "events append, never replace");
});

test("export → wipe → import restores every field", () => {
  let state = stateWithTwoFragments();
  const [first, second] = state.fragments;
  state = appendConnectiveBlock(state, "First of all,");
  state = appendFragmentBlock(state, first.id);
  state = appendFragmentBlock(state, second.id);
  state = setRecallLevel(state, 2);
  state = toggleChecked(state, "WHAT");
  state = logSoloEvent(state, "Describe a place", "2026-07-29T10:00:00.000Z");

  const exported = toJson([state]);
  // The wipe: nothing carried over but the file itself.
  const restored = parseImport(exported);

  assert.equal(restored.length, 1);
  assert.deepEqual(restored[0], state);
  assert.equal(draftText(restored[0]), draftText(state));
});

test("import refuses files it cannot understand", () => {
  assert.throws(() => parseImport("not json"), /JSON/);
  assert.throws(() => parseImport('{"format":"other"}'), /没有找到/);
  assert.throws(() => parseImport("[]"), /没有找到|没有可识别/);
  assert.throws(
    () => parseImport(JSON.stringify({ questions: [{ questionId: "q", schemaVersion: 99 }] })),
    /没有可识别/,
  );
});

test("an imported draft cannot smuggle in text that is not a fragment", () => {
  const forged = {
    questionId: "q1",
    schemaVersion: 1,
    updatedAt: "2026-07-29T10:00:00.000Z",
    fragments: [
      {
        id: "frag_1",
        dimension: "WHAT",
        text: "my own words",
        createdAt: "2026-07-29T10:00:00.000Z",
      },
    ],
    draft: [
      { id: "b1", kind: "fragment", fragmentId: "frag_1" },
      { id: "b2", kind: "fragment", fragmentId: "frag_missing" },
      { id: "b3", kind: "connective", value: "a whole sentence written by a machine" },
      { id: "b4", kind: "connective", value: "However," },
    ],
    recallLevel: 0,
    checked: [],
    soloEvents: [],
    step: 2,
  };

  const [state] = parseImport(JSON.stringify({ questions: [forged] }));
  assert.deepEqual(
    state.draft.map((block) => block.id),
    ["b1", "b4"],
    "a dangling reference and a forged connective are both dropped",
  );
  assert.equal(draftText(state), "my own words However,");
});

test("merging keeps the more recently updated side of each question", () => {
  const older = {
    ...emptySpeakingState("q1"),
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
  const newer = {
    ...addFragment(emptySpeakingState("q1"), "WHAT", "newer material"),
    updatedAt: "2026-07-20T00:00:00.000Z",
  };
  const other = addFragment(emptySpeakingState("q2"), "WHY", "second question");

  const forward = mergeStates([older], [newer, other]);
  assert.equal(forward.added, 1);
  assert.equal(forward.updated, 1);
  assert.equal(
    forward.states.find((s) => s.questionId === "q1").fragments.length,
    1,
  );

  const backward = mergeStates([newer], [older]);
  assert.equal(backward.updated, 0, "an older file never overwrites newer work");
  assert.equal(
    backward.states.find((s) => s.questionId === "q1").fragments.length,
    1,
  );
});

test("material for a question no longer in the corpus is still readable", () => {
  // The orphan rule from the data contract §1.4: a retired id must not make the
  // learner's own fragments unreadable or unexportable.
  const orphan = normaliseState(
    {
      ...stateWithTwoFragments(),
      questionId: "retired-question-id",
      schemaVersion: 1,
    },
    "retired-question-id",
  );
  assert.ok(orphan);
  assert.equal(hasMaterial(orphan), true);
  assert.equal(parseImport(toJson([orphan]))[0].questionId, "retired-question-id");
});
