/**
 * Local state for the IELTS Lab Speaking module.
 *
 * Everything a learner produces here — the per-dimension fragments, the draft
 * they assemble from them, their recall progress and their 独立表达 events —
 * stays in this browser. Nothing is uploaded, and there is nothing to upload it
 * to: the approved T7 data contract makes the corpus a static file and the
 * material local-only. Export/import (`speaking-io.ts`) is the single way any of
 * it leaves the machine, and the learner triggers that themselves.
 *
 * Key: `stage.ielts.speaking`, with the schema version *inside* the payload, per
 * the storage contract (Plan §6.3). Components never touch `localStorage`.
 *
 * TWO RULES ARE STRUCTURAL HERE, not merely enforced by the UI:
 *
 *   1. A draft block never stores prose. A fragment block holds a `fragmentId`
 *      and nothing else, so the text it renders is always read back from the
 *      fragment the learner wrote; a connective block holds one value from the
 *      closed `CONNECTIVES` list. It is therefore impossible for draft content
 *      to come from anywhere but the learner — which is exactly what 答案构建's
 *      core rule demands, and why no "generate" affordance can exist.
 *
 *   2. Material is never expired. Unlike the writing drafts, which prune at 180
 *      days, these fragments are meant to be revisited across a long
 *      preparation cycle — 记忆巩固 only makes sense against material that is
 *      still there. Storage is bounded by the corpus anyway.
 *
 * Absent by construction, and not by omission: audio, recording, pronunciation,
 * scores, bands, evaluation. There is no field any of them could be stored in.
 */
import { isDimension, type SpeakingDimension } from "./speaking-dimensions.ts";
import { isConnective, isRecallLevel, type RecallLevel } from "./speaking-text.ts";

const STORAGE_KEY = "stage.ielts.speaking";
export const SPEAKING_SCHEMA_VERSION = 1;

/**
 * The dimensions themselves live in `speaking-dimensions.ts` — they are read by
 * three screens that have no business importing the storage layer. Re-exported
 * here so callers that already hold a state object do not need both imports.
 */
export {
  LEGACY_SPEAKING_DIMENSIONS,
  SPEAKING_DIMENSIONS_BY_PART,
  dimensionDef,
  dimensionLabel,
  dimensionsForPart,
  isActiveDimension,
  isDimension,
  type SpeakingDimension,
  type SpeakingDimensionDef,
} from "./speaking-dimensions.ts";

/* ------------------------------------------------------------------ *
 * Shapes
 * ------------------------------------------------------------------ */

export interface SpeakingFragment {
  id: string;
  dimension: SpeakingDimension;
  /** Verbatim as typed, trimmed only at the ends. */
  text: string;
  createdAt: string;
}

export type SpeakingDraftBlock =
  | { id: string; kind: "fragment"; fragmentId: string }
  | { id: string; kind: "connective"; value: string };

/** One completed 独立表达. No audio, no score — only that it happened. */
export interface SpeakingSoloEvent {
  id: string;
  at: string;
  /**
   * The prompt, copied in at write time.
   *
   * Denormalised deliberately, the same way `PracticeRecord` stores its title:
   * it keeps the 练习记录 timeline readable without loading the corpus into that
   * page's bundle, and it means a retired question still reads as a sentence
   * rather than as an orphaned id.
   */
  questionText: string;
  /** Dimensions the learner ticked on the self-check list. */
  dimensions: SpeakingDimension[];
}

export interface SpeakingQuestionState {
  questionId: string;
  schemaVersion: number;
  updatedAt: string;
  fragments: SpeakingFragment[];
  draft: SpeakingDraftBlock[];
  recallLevel: RecallLevel;
  /** Ticks on the 独立表达 self-check list, kept between visits. */
  checked: SpeakingDimension[];
  /** Append-only. Each entry is one timeline event. */
  soloEvents: SpeakingSoloEvent[];
  /** Last step the learner was on, so returning lands where they left off. */
  step: number;
}

interface SpeakingStore {
  schemaVersion: number;
  questions: Record<string, SpeakingQuestionState>;
}

/* ------------------------------------------------------------------ *
 * Pure rules
 * ------------------------------------------------------------------ */

export const SPEAKING_STEPS = [
  { index: 0, label: "题目" },
  { index: 1, label: "个人想法" },
  { index: 2, label: "答案构建" },
  { index: 3, label: "记忆巩固" },
  { index: 4, label: "独立表达" },
] as const;

/**
 * What a screen reader says when focus lands on a step after a transition.
 *
 * The position is in the sentence, not only in the rail: moving between steps
 * changes the whole panel without changing the page, so a reader that only
 * heard "答案构建" would not know whether it had gone forward, gone back, or how
 * much was left. An out-of-range index falls back to the count alone rather
 * than announcing a label that is not on screen.
 */
export function stepAnnouncement(step: number): string {
  const total = SPEAKING_STEPS.length;
  const entry = SPEAKING_STEPS[step];
  const position = `第 ${step + 1} 步，共 ${total} 步`;
  return entry ? `${position}：${entry.label}` : position;
}

export function emptySpeakingState(questionId: string): SpeakingQuestionState {
  return {
    questionId,
    schemaVersion: SPEAKING_SCHEMA_VERSION,
    updatedAt: new Date(0).toISOString(),
    fragments: [],
    draft: [],
    recallLevel: 0,
    checked: [],
    soloEvents: [],
    step: 0,
  };
}

/**
 * Ids are generated here rather than by the caller so every fragment and block
 * carries the same shape. `crypto.randomUUID` where it exists — Node's test
 * runtime and every supported browser have it — with a counter fallback so a
 * missing global cannot make two fragments collide.
 */
let counter = 0;
function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${(counter += 1).toString(36)}`;
  return `${prefix}_${uuid}`;
}

function touched(
  state: SpeakingQuestionState,
  now: string,
): SpeakingQuestionState {
  return { ...state, updatedAt: now };
}

/**
 * Adds one idea fragment. Blank input is refused by returning the state
 * unchanged, so a caller cannot mistake a no-op for a write.
 *
 * An unrecognised dimension is refused the same way. `SpeakingDimension` is a
 * closed union, so this is unreachable from typed code — but a value that
 * arrived as `string` and was cast, or one written by a future build, would
 * otherwise be stored, look saved, and then be dropped by `normaliseState` on
 * the next page load. A write that silently disappears is worse than one that
 * never happened, so it never happens.
 */
export function addFragment(
  state: SpeakingQuestionState,
  dimension: SpeakingDimension,
  text: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const trimmed = text.trim();
  if (trimmed === "" || !isDimension(dimension)) return state;
  return touched(
    {
      ...state,
      fragments: [
        ...state.fragments,
        { id: newId("frag"), dimension, text: trimmed, createdAt: now },
      ],
    },
    now,
  );
}

export function updateFragment(
  state: SpeakingQuestionState,
  fragmentId: string,
  text: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const trimmed = text.trim();
  if (trimmed === "") return state;
  return touched(
    {
      ...state,
      fragments: state.fragments.map((fragment) =>
        fragment.id === fragmentId ? { ...fragment, text: trimmed } : fragment,
      ),
    },
    now,
  );
}

/**
 * Removes a fragment and every draft block that pointed at it.
 *
 * The draft cannot outlive its sources: a block whose fragment is gone would be
 * content with no origin, which is the one thing 答案构建 must never contain.
 */
export function removeFragment(
  state: SpeakingQuestionState,
  fragmentId: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  return touched(
    {
      ...state,
      fragments: state.fragments.filter((fragment) => fragment.id !== fragmentId),
      draft: state.draft.filter(
        (block) => block.kind !== "fragment" || block.fragmentId !== fragmentId,
      ),
    },
    now,
  );
}

/**
 * The single fragment a 个人想法 card edits, or `null` before anything is typed.
 *
 * The approved design gives each dimension one textarea, so one fragment is the
 * whole of what a card holds. A dimension carrying several — only possible from
 * material written under the nine-dimension set, which allowed a list — returns
 * its first, and the extras are rendered by the 旧素材 group rather than
 * silently merged into this one.
 */
export function primaryFragment(
  state: SpeakingQuestionState,
  dimension: SpeakingDimension,
): SpeakingFragment | null {
  return state.fragments.find((entry) => entry.dimension === dimension) ?? null;
}

/**
 * Writes a 个人想法 card: add, edit, or clear.
 *
 * Blanking the textarea deletes the fragment, which is what the learner means
 * by emptying it — and takes its draft blocks with it, since `removeFragment`
 * is the only way a draft cannot outlive its source.
 */
export function setFragmentText(
  state: SpeakingQuestionState,
  dimension: SpeakingDimension,
  text: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const trimmed = text.trim();
  const existing = primaryFragment(state, dimension);

  if (trimmed === "") {
    return existing ? removeFragment(state, existing.id, now) : state;
  }
  if (!existing) return addFragment(state, dimension, trimmed, now);
  if (existing.text === trimmed) return state;
  return updateFragment(state, existing.id, trimmed, now);
}

/** Dimensions with at least one fragment — the ones that get a check. */
export function filledDimensions(
  state: SpeakingQuestionState,
): Set<SpeakingDimension> {
  return new Set(state.fragments.map((fragment) => fragment.dimension));
}

export function appendFragmentBlock(
  state: SpeakingQuestionState,
  fragmentId: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  // A block can only reference a fragment that exists. This is the enforcement
  // point for the traceability rule, not the UI.
  if (!state.fragments.some((fragment) => fragment.id === fragmentId)) {
    return state;
  }
  return touched(
    {
      ...state,
      draft: [
        ...state.draft,
        { id: newId("blk"), kind: "fragment", fragmentId },
      ],
    },
    now,
  );
}

export function appendConnectiveBlock(
  state: SpeakingQuestionState,
  value: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  // Only a value from the closed list; anything else would be free text
  // entering the draft by the back door.
  if (!isConnective(value)) return state;
  return touched(
    {
      ...state,
      draft: [...state.draft, { id: newId("blk"), kind: "connective", value }],
    },
    now,
  );
}

export function removeBlock(
  state: SpeakingQuestionState,
  blockId: string,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  return touched(
    { ...state, draft: state.draft.filter((block) => block.id !== blockId) },
    now,
  );
}

/** Moves a block one position. Out-of-range moves are no-ops. */
export function moveBlock(
  state: SpeakingQuestionState,
  blockId: string,
  delta: -1 | 1,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const from = state.draft.findIndex((block) => block.id === blockId);
  if (from < 0) return state;
  const to = from + delta;
  if (to < 0 || to >= state.draft.length) return state;

  const draft = [...state.draft];
  const [moved] = draft.splice(from, 1);
  draft.splice(to, 0, moved);
  return touched({ ...state, draft }, now);
}

/**
 * The assembled draft as one string.
 *
 * Rebuilt from the fragments every time rather than stored: editing a fragment
 * in 个人想法 must change the draft that quotes it, and there is no second copy
 * of the text that could drift from the first.
 */
export function draftText(state: SpeakingQuestionState): string {
  const byId = new Map(state.fragments.map((fragment) => [fragment.id, fragment]));
  return state.draft
    .map((block) =>
      block.kind === "connective"
        ? block.value
        : byId.get(block.fragmentId)?.text ?? "",
    )
    .filter((piece) => piece !== "")
    .join(" ");
}

/** Blocks that came from a fragment — the numerator of the traceability line. */
export function fragmentBlockCount(state: SpeakingQuestionState): number {
  return state.draft.filter((block) => block.kind === "fragment").length;
}

export function setRecallLevel(
  state: SpeakingQuestionState,
  level: number,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  if (!isRecallLevel(level)) return state;
  return touched({ ...state, recallLevel: level }, now);
}

export function toggleChecked(
  state: SpeakingQuestionState,
  dimension: SpeakingDimension,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const checked = state.checked.includes(dimension)
    ? state.checked.filter((entry) => entry !== dimension)
    : [...state.checked, dimension];
  return touched({ ...state, checked }, now);
}

export function setStep(
  state: SpeakingQuestionState,
  step: number,
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  if (!Number.isInteger(step) || step < 0 || step >= SPEAKING_STEPS.length) {
    return state;
  }
  return touched({ ...state, step }, now);
}

/**
 * Records one 独立表达.
 *
 * Append-only: a learner who practises the same question three times has three
 * events on the timeline, which is the whole value of the record. The event
 * carries what was ticked and nothing else — no duration, no audio, no result.
 *
 * `visible` is the checklist as it was rendered. Ticks outside it are kept in
 * storage but left off the event: a tick a learner could not see is not a claim
 * they made, and the timeline says "covered N dimensions".
 */
export function logSoloEvent(
  state: SpeakingQuestionState,
  questionText: string,
  visible: readonly SpeakingDimension[],
  now: string = new Date().toISOString(),
): SpeakingQuestionState {
  const shown = new Set(visible);
  return touched(
    {
      ...state,
      soloEvents: [
        ...state.soloEvents,
        {
          id: newId("solo"),
          at: now,
          questionText,
          dimensions: state.checked.filter((entry) => shown.has(entry)),
        },
      ],
    },
    now,
  );
}

/** Whether this question has anything worth keeping. */
export function hasMaterial(state: SpeakingQuestionState | null): boolean {
  if (!state) return false;
  return (
    state.fragments.length > 0 ||
    state.draft.length > 0 ||
    state.soloEvents.length > 0
  );
}

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value !== "" ? value : fallback;
}

/**
 * Accepts one stored or imported question state.
 *
 * A payload written by a future schema version is rejected rather than coerced:
 * reading it as v1 would silently drop fields the learner wrote. Within v1
 * every collection is filtered rather than trusted, because an import is
 * untrusted input even when it is the learner's own file.
 */
export function normaliseState(
  value: unknown,
  fallbackId: string,
): SpeakingQuestionState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SpeakingQuestionState>;
  if (raw.schemaVersion !== SPEAKING_SCHEMA_VERSION) return null;

  const questionId = stringOr(raw.questionId, fallbackId);
  if (questionId === "") return null;

  const fragments: SpeakingFragment[] = [];
  for (const entry of Array.isArray(raw.fragments) ? raw.fragments : []) {
    if (!entry || typeof entry !== "object") continue;
    const fragment = entry as Partial<SpeakingFragment>;
    const text = typeof fragment.text === "string" ? fragment.text.trim() : "";
    if (text === "" || !isDimension(fragment.dimension)) continue;
    fragments.push({
      id: stringOr(fragment.id, newId("frag")),
      dimension: fragment.dimension,
      text,
      createdAt: stringOr(fragment.createdAt, new Date(0).toISOString()),
    });
  }

  const fragmentIds = new Set(fragments.map((fragment) => fragment.id));
  const draft: SpeakingDraftBlock[] = [];
  for (const entry of Array.isArray(raw.draft) ? raw.draft : []) {
    if (!entry || typeof entry !== "object") continue;
    const block = entry as Partial<SpeakingDraftBlock> & { kind?: string };
    if (block.kind === "connective") {
      const value = (block as { value?: unknown }).value;
      // Same closed list as the writer applies. An imported file cannot smuggle
      // arbitrary prose in as a "connective".
      if (typeof value === "string" && isConnective(value)) {
        draft.push({ id: stringOr(block.id, newId("blk")), kind: "connective", value });
      }
      continue;
    }
    if (block.kind === "fragment") {
      const fragmentId = (block as { fragmentId?: unknown }).fragmentId;
      // A block pointing at a fragment that did not survive is dropped, so the
      // draft can never contain text with no source.
      if (typeof fragmentId === "string" && fragmentIds.has(fragmentId)) {
        draft.push({ id: stringOr(block.id, newId("blk")), kind: "fragment", fragmentId });
      }
    }
  }

  const soloEvents: SpeakingSoloEvent[] = [];
  for (const entry of Array.isArray(raw.soloEvents) ? raw.soloEvents : []) {
    if (!entry || typeof entry !== "object") continue;
    const event = entry as Partial<SpeakingSoloEvent>;
    if (typeof event.at !== "string") continue;
    soloEvents.push({
      id: stringOr(event.id, newId("solo")),
      at: event.at,
      questionText: typeof event.questionText === "string" ? event.questionText : "",
      dimensions: (Array.isArray(event.dimensions) ? event.dimensions : []).filter(
        isDimension,
      ),
    });
  }

  const step =
    typeof raw.step === "number" &&
    Number.isInteger(raw.step) &&
    raw.step >= 0 &&
    raw.step < SPEAKING_STEPS.length
      ? raw.step
      : 0;

  return {
    questionId,
    schemaVersion: SPEAKING_SCHEMA_VERSION,
    updatedAt: stringOr(raw.updatedAt, new Date(0).toISOString()),
    fragments,
    draft,
    recallLevel:
      typeof raw.recallLevel === "number" && isRecallLevel(raw.recallLevel)
        ? raw.recallLevel
        : 0,
    checked: (Array.isArray(raw.checked) ? raw.checked : []).filter(isDimension),
    soloEvents,
    step,
  };
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStore(): SpeakingStore {
  const empty: SpeakingStore = {
    schemaVersion: SPEAKING_SCHEMA_VERSION,
    questions: {},
  };
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SpeakingStore>;
    if (!parsed || typeof parsed !== "object" || !parsed.questions) return empty;

    const questions: Record<string, SpeakingQuestionState> = {};
    for (const [questionId, value] of Object.entries(parsed.questions)) {
      const state = normaliseState(value, questionId);
      if (state) questions[questionId] = state;
    }
    return { schemaVersion: SPEAKING_SCHEMA_VERSION, questions };
  } catch {
    // Corrupt storage must not take the Speaking screens down.
    return empty;
  }
}

function writeStore(store: SpeakingStore): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota refusal: the in-memory state the caller holds still renders, and
    // the next edit tries again.
  }
}

/** Every question with stored material, keyed by question id. */
export function loadSpeakingStates(): Map<string, SpeakingQuestionState> {
  return new Map(Object.entries(readStore().questions));
}

export function loadSpeakingState(
  questionId: string,
): SpeakingQuestionState | null {
  return readStore().questions[questionId] ?? null;
}

/** Writes one question's state. Returns what was stored. */
export function saveSpeakingState(
  state: SpeakingQuestionState,
): SpeakingQuestionState {
  const store = readStore();
  store.questions[state.questionId] = state;
  writeStore(store);
  return state;
}

export function clearSpeakingState(questionId: string): void {
  const store = readStore();
  if (!(questionId in store.questions)) return;
  delete store.questions[questionId];
  writeStore(store);
}

export function clearAllSpeaking(): void {
  writeStore({ schemaVersion: SPEAKING_SCHEMA_VERSION, questions: {} });
}

/** Replaces the whole store. Used by import. */
export function replaceSpeakingStates(
  states: readonly SpeakingQuestionState[],
): void {
  const questions: Record<string, SpeakingQuestionState> = {};
  for (const state of states) questions[state.questionId] = state;
  writeStore({ schemaVersion: SPEAKING_SCHEMA_VERSION, questions });
}

export interface SpeakingTimelineEvent extends SpeakingSoloEvent {
  questionId: string;
}

/**
 * Every 独立表达 event across every question, newest first.
 *
 * Read by 练习记录 so the timeline can show them beside reading attempts. They
 * are deliberately NOT written as `PracticeRecord`s: a solo-expression event has
 * no accuracy, no per-question comparison and no duration, and forcing one into
 * that shape would corrupt the accuracy averages, the question-type analytics
 * and the wrongbook, all of which read every record.
 */
export function listSoloEvents(): SpeakingTimelineEvent[] {
  const events: SpeakingTimelineEvent[] = [];
  for (const state of loadSpeakingStates().values()) {
    for (const event of state.soloEvents) {
      events.push({ ...event, questionId: state.questionId });
    }
  }
  return events.sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
}
