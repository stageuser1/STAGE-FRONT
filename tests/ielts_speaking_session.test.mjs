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
  LEGACY_SPEAKING_DIMENSIONS,
  addFragment,
  appendConnectiveBlock,
  appendFragmentBlock,
  dimensionLabel,
  dimensionsForPart,
  draftText,
  emptySpeakingState,
  filledDimensions,
  fragmentBlockCount,
  hasMaterial,
  isActiveDimension,
  isDimension,
  logSoloEvent,
  moveBlock,
  normaliseState,
  primaryFragment,
  removeBlock,
  removeFragment,
  setFragmentText,
  setRecallLevel,
  stepAnnouncement,
  toggleChecked,
  updateFragment,
} from "../lib/ielts/speaking-session.ts";
import {
  CONNECTIVES,
  RECALL_LEVELS,
  soloHints,
  splitHead,
} from "../lib/ielts/speaking-text.ts";
import { mergeStates, parseImport, toJson } from "../lib/ielts/speaking-io.ts";

function stateWithTwoFragments() {
  let state = emptySpeakingState("hometown-p2-01");
  state = addFragment(state, "WHAT", "a small tea house by the river");
  state = addFragment(state, "WHERE", "quiet and familiar");
  return state;
}

test("each part's dimensions are the spec's, verbatim and in order", () => {
  assert.deepEqual(dimensionsForPart(1).map((d) => `${d.labelEn} ${d.labelZh}`), [
    "OPINION 观点",
    "REASON 理由",
    "EXPLANATION 展开",
  ]);
  assert.deepEqual(dimensionsForPart(2).map((d) => `${d.labelEn} ${d.labelZh}`), [
    "WHAT 是什么",
    "WHY 为何",
    "WHEN 何时",
    "WHO 谁",
    "WHERE 何地",
    "HOW 如何",
  ]);
  assert.deepEqual(dimensionsForPart(3).map((d) => `${d.labelEn} ${d.labelZh}`), [
    "OPINION 观点",
    "REASON 理由",
    "EXAMPLE 例子",
    "EXPLANATION 展开",
  ]);
});

/**
 * The compatibility guarantee for pre-split material: a retired dimension is
 * still a dimension the reader accepts, still carries its own label, and is
 * simply no longer offered as a card. Narrowing `isDimension` to the active sets
 * would make `normaliseState` delete these fragments on the next page load.
 */
test("nine-dimension material is still readable under its own labels", () => {
  for (const def of LEGACY_SPEAKING_DIMENSIONS) {
    assert.equal(isDimension(def.id), true, `${def.id} must survive a read`);
    assert.equal(dimensionLabel(def.id), `${def.labelEn} ${def.labelZh}`);
  }

  const retired = ["MEMORY", "FEELING", "CHANGE_OVER_TIME", "COMPARISON"];
  for (const id of retired) {
    for (const part of [1, 2, 3]) {
      assert.equal(
        isActiveDimension(part, id),
        false,
        `${id} must not be offered on Part ${part}`,
      );
    }
  }

  const stored = {
    ...emptySpeakingState("q1"),
    fragments: [
      {
        id: "frag_legacy",
        dimension: "CHANGE_OVER_TIME",
        text: "it used to be much quieter",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
    ],
  };
  const read = normaliseState(stored, "q1");
  assert.equal(read.fragments.length, 1, "a retired dimension is not dropped");
  assert.equal(read.fragments[0].dimension, "CHANGE_OVER_TIME");

  assert.equal(isDimension("NOT_A_DIMENSION"), false);
});

/**
 * The write path's own guard, not just the reader's.
 *
 * `SpeakingDimension` is a closed union, so an unknown id cannot arrive from
 * typed code — but if one ever did, storing it would produce a write that looks
 * saved and is then deleted by `normaliseState` on the next load. Refusing at
 * the door is the only version of this a learner can trust.
 */
test("addFragment refuses an id that is not a dimension", () => {
  const state = emptySpeakingState("q1");

  for (const bogus of ["NOT_A_DIMENSION", "what", "", "OPINION "]) {
    const after = addFragment(state, bogus, "text I typed");
    assert.equal(after, state, `"${bogus}" must return the same object`);
    assert.equal(after.fragments.length, 0);
    assert.equal(
      after.updatedAt,
      state.updatedAt,
      "a refused write does not even restamp the question",
    );
  }

  // Nothing reaches storage, so nothing is there to be dropped later: what the
  // writer refuses and what the reader would have deleted are the same set.
  const stored = toJson([addFragment(state, "NOT_A_DIMENSION", "text I typed")]);
  assert.ok(!stored.includes("NOT_A_DIMENSION"));
  assert.ok(!stored.includes("text I typed"));

  // The guard is the id, not the write: a real dimension still goes through.
  assert.equal(addFragment(state, "OPINION", "text I typed").fragments.length, 1);
});

test("a dimension card holds one fragment: add, edit, then clear", () => {
  let state = emptySpeakingState("q1");
  state = setFragmentText(state, "OPINION", "   ");
  assert.equal(state.fragments.length, 0, "blank input writes nothing");

  state = setFragmentText(state, "OPINION", "  I mostly agree  ");
  assert.equal(state.fragments.length, 1);
  assert.equal(primaryFragment(state, "OPINION").text, "I mostly agree");

  const same = setFragmentText(state, "OPINION", "I mostly agree");
  assert.equal(same, state, "an unchanged write returns the same object");

  state = setFragmentText(state, "OPINION", "I only partly agree");
  assert.equal(state.fragments.length, 1, "editing does not add a second");
  assert.equal(primaryFragment(state, "OPINION").text, "I only partly agree");

  // Emptying the textarea deletes the fragment — and its draft blocks with it.
  state = appendFragmentBlock(state, state.fragments[0].id);
  assert.equal(state.draft.length, 1);
  state = setFragmentText(state, "OPINION", "");
  assert.equal(state.fragments.length, 0);
  assert.equal(state.draft.length, 0, "the draft cannot outlive its source");
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

/**
 * The rule the whole of 答案构建 rests on, restated for the design's list: only
 * a value from the closed vocabulary may enter a draft, and the vocabulary the
 * screen offers is the export's six.
 */
test("the offered connectives are the approved design's six", () => {
  assert.deepEqual(
    [...CONNECTIVES],
    ["because", "however", "for example", "after that", "which means", "compared with"],
  );
});

test("a draft built under the previous connective list keeps its blocks", () => {
  const stored = {
    ...emptySpeakingState("q1"),
    fragments: [
      {
        id: "frag_1",
        dimension: "WHAT",
        text: "my own words",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    draft: [
      { id: "b1", kind: "connective", value: "First of all," },
      { id: "b2", kind: "fragment", fragmentId: "frag_1" },
      { id: "b3", kind: "connective", value: "a sentence written by a machine" },
    ],
  };
  const read = normaliseState(stored, "q1");
  assert.deepEqual(
    read.draft.map((block) => block.id),
    ["b1", "b2"],
    "a retired connective survives; free text still does not",
  );
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
  state = appendFragmentBlock(state, first.id);
  state = appendConnectiveBlock(state, "because");
  state = appendFragmentBlock(state, second.id);

  assert.equal(
    draftText(state),
    "a small tea house by the river because quiet and familiar",
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

/**
 * What focus announces after a step transition. The flow moves focus to the new
 * step's panel, and this string is that panel's accessible name — the only
 * thing a screen-reader user hears to tell them the working area changed.
 */
test("a step announces its position as well as its name", () => {
  assert.equal(stepAnnouncement(0), "第 1 步，共 5 步：题目");
  assert.equal(stepAnnouncement(1), "第 2 步，共 5 步：个人想法");
  assert.equal(stepAnnouncement(4), "第 5 步，共 5 步：独立表达");
  // Out of range: the count is still true, so it is still said; the label is
  // not invented.
  assert.equal(stepAnnouncement(9), "第 10 步，共 5 步");
});

test("the four hiding levels are the approved design's, in order", () => {
  assert.deepEqual(
    RECALL_LEVELS.map((entry) => entry.label),
    ["全文", "淡化", "隐藏", "仅连接词"],
  );
  assert.deepEqual(
    RECALL_LEVELS.map((entry) => entry.value),
    [0, 1, 2, 3],
    "the stored value is the index, so levels chosen before the rewording resolve",
  );
});

test("a fragment reduces to its opening words, and loses nothing else", () => {
  assert.deepEqual(splitHead("my chamber music teacher pushed me to try"), {
    head: "my chamber",
    rest: "music teacher pushed me to try",
  });
  // Short enough to be all cue: nothing is invented to fill the remainder.
  assert.deepEqual(splitHead("very calm"), { head: "very calm", rest: "" });
  assert.deepEqual(splitHead("  spaced   out  words "), {
    head: "spaced out",
    rest: "words",
  });
  assert.deepEqual(splitHead(""), { head: "", rest: "" });
});

test("solo hints are the learner's own opening words, in draft order", () => {
  assert.equal(
    soloHints(["learning to accompany singers", "nervous at first", ""]),
    "learning to · nervous at",
  );
  assert.equal(soloHints([]), "", "nothing to hint at renders no strip");
});

test("a solo event records what was ticked and shown, and nothing else", () => {
  let state = stateWithTwoFragments();
  const shown = ["WHAT", "WHY", "WHEN", "WHO", "WHERE", "HOW"];
  state = toggleChecked(state, "WHAT");
  state = toggleChecked(state, "WHERE");
  state = toggleChecked(state, "WHERE");
  state = logSoloEvent(state, "Describe a place", shown, "2026-07-29T10:00:00.000Z");

  assert.equal(state.soloEvents.length, 1);
  assert.deepEqual(state.soloEvents[0].dimensions, ["WHAT"]);
  assert.deepEqual(Object.keys(state.soloEvents[0]).sort(), [
    "at",
    "dimensions",
    "id",
    "questionText",
  ]);

  state = logSoloEvent(state, "Describe a place", shown, "2026-07-29T11:00:00.000Z");
  assert.equal(state.soloEvents.length, 2, "events append, never replace");
});

/**
 * A tick left over from the nine-dimension checklist is kept in storage but is
 * not a claim the learner made on this run — they could not see it to untick it.
 */
test("a tick outside the rendered checklist is not written to the event", () => {
  let state = emptySpeakingState("q1");
  state = toggleChecked(state, "MEMORY");
  state = toggleChecked(state, "OPINION");
  state = logSoloEvent(
    state,
    "Do you like music?",
    ["OPINION", "REASON", "EXPLANATION"],
    "2026-07-29T10:00:00.000Z",
  );

  assert.deepEqual(state.soloEvents[0].dimensions, ["OPINION"]);
  assert.deepEqual(
    state.checked.sort(),
    ["MEMORY", "OPINION"],
    "the tick itself is kept, not deleted",
  );
});

test("export → wipe → import restores every field", () => {
  let state = stateWithTwoFragments();
  const [first, second] = state.fragments;
  state = appendFragmentBlock(state, first.id);
  state = appendConnectiveBlock(state, "which means");
  state = appendFragmentBlock(state, second.id);
  state = setRecallLevel(state, 2);
  state = toggleChecked(state, "WHAT");
  state = logSoloEvent(
    state,
    "Describe a place",
    ["WHAT", "WHERE"],
    "2026-07-29T10:00:00.000Z",
  );

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
      { id: "b4", kind: "connective", value: "however" },
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
  assert.equal(draftText(state), "my own words however");
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
