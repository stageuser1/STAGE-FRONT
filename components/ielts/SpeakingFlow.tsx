"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SPEAKING_PART_LABELS,
  type SpeakingQuestion,
} from "@/lib/ielts/speaking-types";
import {
  appendConnectiveBlock,
  appendFragmentBlock,
  dimensionDef,
  dimensionsForPart,
  emptySpeakingState,
  filledDimensions,
  hasMaterial,
  loadSpeakingState,
  logSoloEvent,
  moveBlock,
  primaryFragment,
  removeBlock,
  removeFragment,
  saveSpeakingState,
  setFragmentText,
  setRecallLevel,
  setStep,
  stepAnnouncement,
  toggleChecked,
  type SpeakingDimension,
  type SpeakingDimensionDef,
  type SpeakingFragment,
  type SpeakingQuestionState,
} from "@/lib/ielts/speaking-session";
import { trackPracticeSubmit, useTrackOnMount } from "@/components/growth/Track";
import { contentPayload } from "@/lib/growth/emit";
import {
  CONNECTIVES,
  RECALL_LEVELS,
  soloHints,
  splitHead,
} from "@/lib/ielts/speaking-text";
import { Icon } from "@/components/ui/Icon";
import { SpeakingSteps } from "./SpeakingSteps";
import { Badge } from "./ui";

/* --------------------------------------------------------------------------
 * Control classes at the export's sizes.
 *
 * Local rather than `./ui`'s BUTTON_PRIMARY, which is the 13px control this
 * screen's spec does not use: the export's step footers are its `md` Button —
 * 44px tall, 18px side padding, a 15px medium label.
 * ----------------------------------------------------------------------- */

const STEP_BUTTON =
  "inline-flex h-11 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-stage-sm bg-stage-primary px-[18px] text-stage-sm font-medium leading-none text-stage-fg-on-dark transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-primary-hover active:bg-stage-primary-press disabled:cursor-not-allowed disabled:opacity-[0.45] disabled:hover:bg-stage-primary";

/** 11px uppercase section label, letter-spaced — the export's column heads. */
const EYEBROW =
  "text-stage-2xs font-semibold uppercase tracking-stage-eyebrow text-stage-fg-subtle";

/** The mono dimension code that prefixes every fragment. */
const DIM_CODE = "font-stage-mono text-stage-xs font-medium text-stage-primary";

/**
 * The five-step Speaking flow, steps two to five.
 *
 * 题目 is the catalog route, so this component owns 个人想法 → 答案构建 →
 * 记忆巩固 → 独立表达 and shares the step rail with it. The four steps are
 * component state rather than four routes: everything the last three render
 * lives in `localStorage`, so a server route per step would prerender three
 * empty shells.
 *
 * What this module does not contain, and cannot: any button that produces
 * language on the learner's behalf, any recorder, any microphone permission,
 * any pronunciation feedback, any score. 答案构建's draft is assembled from
 * references to the learner's own fragments — see `speaking-session.ts`, where
 * that is a property of the stored shape rather than a UI convention.
 */
export function SpeakingFlow({ question }: { question: SpeakingQuestion }) {
  // null until the first read after mount; the flow renders a quiet placeholder
  // rather than a four-step skeleton that would then fill in.
  const [state, setState] = useState<SpeakingQuestionState | null>(null);
  const [step, setStepValue] = useState(1);
  const [saved, setSaved] = useState(false);

  // Choosing a question and entering the flow *is* 开练 for Speaking.
  useTrackOnMount("lab_practice_start", {
    section: "speaking",
    ...contentPayload(question.id),
  });

  useEffect(() => {
    const stored = loadSpeakingState(question.id) ?? emptySpeakingState(question.id);
    setState(stored);
    // Step 0 is the catalog; a learner arriving here is on 个人想法 at the
    // earliest, whatever the stored value says.
    setStepValue(Math.max(1, stored.step));
  }, [question.id]);

  /**
   * Every mutation goes through here: apply a pure transform, persist, show the
   * autosave note. Components never touch storage directly, and no step needs a
   * save button.
   */
  const apply = useCallback(
    (transform: (current: SpeakingQuestionState) => SpeakingQuestionState) => {
      setState((current) => {
        if (!current) return current;
        const next = transform(current);
        if (next === current) return current;
        saveSpeakingState(next);
        setSaved(true);
        return next;
      });
    },
    [],
  );

  /**
   * Focus moves to the new step's panel on every transition.
   *
   * Changing step replaces the whole working area without changing the page, so
   * without this a keyboard user stays wherever they were — on 进入答案构建, or
   * on a rail button several steps away — and a screen reader announces
   * nothing. `lastFocused` starts null so the *first* rendered step is adopted
   * silently: arriving on the route must not pull focus off the top of the
   * document, and a stored step restored by the loader above is an arrival, not
   * a transition.
   */
  const panel = useRef<HTMLElement>(null);
  const lastFocused = useRef<number | null>(null);

  useEffect(() => {
    if (!state) return;
    if (lastFocused.current === null || lastFocused.current === step) {
      lastFocused.current = step;
      return;
    }
    lastFocused.current = step;
    panel.current?.focus();
  }, [step, state]);

  function goTo(next: number) {
    setStepValue(next);
    apply((current) => setStep(current, next));
  }

  const dimensions = dimensionsForPart(question.part);

  if (!state) {
    return <p className="py-8 text-stage-sm text-stage-fg-muted">载入素材…</p>;
  }

  return (
    <div className="grid content-start gap-[18px]">
      <h1 className="text-stage-h2 font-bold leading-[1.15] text-stage-fg">
        Speaking
      </h1>

      <SpeakingSteps
        current={step}
        catalogHref="/ielts-lab/speaking"
        onGo={goTo}
      />

      <QuestionBar
        question={question}
        saved={saved || hasMaterial(state)}
      />

      {/* The focus target of every step transition. `tabIndex={-1}` makes it
          programmatically focusable without adding a Tab stop, and the outline
          is dropped because this is a container the learner was moved into, not
          a control they can act on — the next Tab takes them to the step's
          first real control. The heading is the accessible name, so a reader
          announces which step it landed on and how far through it is. */}
      <section
        ref={panel}
        tabIndex={-1}
        aria-labelledby="speaking-step-title"
        className="grid content-start gap-[18px] outline-none"
      >
        <h2 id="speaking-step-title" className="sr-only">
          {stepAnnouncement(step)}
        </h2>

        {step === 1 ? (
          <IdeasStep
            state={state}
            dimensions={dimensions}
            apply={apply}
            onNext={() => goTo(2)}
          />
        ) : null}
        {step === 2 ? (
          <BuildStep state={state} apply={apply} onNext={() => goTo(3)} />
        ) : null}
        {step === 3 ? (
          <RecallStep
            state={state}
            apply={apply}
            onBack={() => goTo(2)}
            onNext={() => goTo(4)}
          />
        ) : null}
        {step === 4 ? (
          <SoloStep
            question={question}
            dimensions={dimensions}
            state={state}
            apply={apply}
          />
        ) : null}
      </section>
    </div>
  );
}

/**
 * The prompt, resident above every step so it is never out of sight.
 *
 * A Part 2 cue card rides with it: the bullets are part of the prompt, and every
 * step after 题目 is work against them — the ideas have to answer them, the
 * draft has to cover them, and the solo turn is given holding them.
 */
function QuestionBar({
  question,
  saved,
}: {
  question: SpeakingQuestion;
  saved: boolean;
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <Badge tone="accent">{SPEAKING_PART_LABELS[question.part]}</Badge>
        <span className="text-stage-body font-semibold text-stage-fg">
          {question.textEn}
        </span>
        {question.glossZh ? (
          <span className="text-stage-xs text-stage-fg-subtle">
            {question.glossZh}
          </span>
        ) : null}
        {saved ? (
          <span
            role="status"
            className="ml-auto inline-flex items-center gap-[5px] text-stage-xs text-stage-fg-subtle"
          >
            <span aria-hidden className="grid">
              <Icon name="check" size={12} strokeWidth={2.5} />
            </span>
            已自动保存
          </span>
        ) : null}
      </div>

      {question.cuePoints.length > 0 ? (
        <ul className="grid gap-1 rounded-stage-md border border-stage-border bg-stage-bg-soft px-4 py-3">
          <li className="text-stage-2xs font-medium text-stage-fg-muted">
            You should say:
          </li>
          {question.cuePoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-stage-xs text-stage-fg-body"
            >
              <span
                aria-hidden
                className="mt-2 inline-block h-1 w-1 flex-none rounded-stage-pill bg-stage-border-strong"
              />
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type Apply = (
  transform: (current: SpeakingQuestionState) => SpeakingQuestionState,
) => void;

/** The step footer: one action, then the sentence that qualifies it. */
function StepFoot({
  label,
  note,
  disabled = false,
  onClick,
}: {
  label: string;
  note: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={STEP_BUTTON}
      >
        {label}
      </button>
      <span className="text-stage-xs text-stage-fg-subtle">{note}</span>
    </div>
  );
}

/**
 * Column count per dimension set, so every row is full.
 *
 * The export's `repeat(auto-fill, minmax(300px, 1fr))` was written for a nine-
 * card grid; with three, four or six cards it leaves a ragged tail. These lay
 * 3 out as 3, 4 as 2×2 and 6 as 2×3 — no card is invented to fill a gap.
 */
const DIMENSION_COLUMNS: Record<number, string> = {
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2",
  6: "sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * Step 2 — 个人想法.
 *
 * One card per dimension of *this part*, bilingual label verbatim, each a free
 * input for the learner's own fragment. A dimension with text gets a check.
 * Nothing here suggests content: the cards ask a question and hold what the
 * learner answers.
 */
function IdeasStep({
  state,
  dimensions,
  apply,
  onNext,
}: {
  state: SpeakingQuestionState;
  dimensions: readonly SpeakingDimensionDef[];
  apply: Apply;
  onNext: () => void;
}) {
  const filled = useMemo(() => filledDimensions(state), [state]);
  const filledHere = dimensions.filter((def) => filled.has(def.id)).length;
  const legacy = useLegacyFragments(state, dimensions);

  return (
    <>
      <div
        className={`grid gap-3 ${DIMENSION_COLUMNS[dimensions.length] ?? "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        {dimensions.map((def) => (
          <IdeaCard
            key={def.id}
            def={def}
            text={primaryFragment(state, def.id)?.text ?? ""}
            onCommit={(text) =>
              apply((current) => setFragmentText(current, def.id, text))
            }
          />
        ))}
      </div>

      {legacy.length > 0 ? (
        <LegacyPanel
          fragments={legacy}
          onRemove={(id) => apply((current) => removeFragment(current, id))}
        />
      ) : null}

      <StepFoot
        label="进入答案构建"
        note={`已填 ${filledHere} / ${dimensions.length} 个维度`}
        disabled={state.fragments.length === 0}
        onClick={onNext}
      />
    </>
  );
}

/**
 * One dimension card.
 *
 * The textarea is uncontrolled from storage's point of view: it holds its own
 * value and commits after 600ms of quiet, or on blur. Writing through on every
 * keystroke would rewrite the whole store per character; committing only on
 * blur would lose a paragraph to a closed tab.
 */
function IdeaCard({
  def,
  text,
  onCommit,
}: {
  def: SpeakingDimensionDef;
  text: string;
  onCommit: (text: string) => void;
}) {
  const [value, setValue] = useState(text);
  const committed = useRef(text);
  // Held in a ref so the debounce below does not restart on every parent
  // render — an `onCommit` recreated each render would reset the timer forever.
  const commit = useRef(onCommit);
  commit.current = onCommit;

  // Storage changed under us (an undo elsewhere, a legacy delete): adopt it.
  useEffect(() => {
    if (text !== committed.current) {
      committed.current = text;
      setValue(text);
    }
  }, [text]);

  useEffect(() => {
    if (value.trim() === committed.current.trim()) return;
    const timer = setTimeout(() => {
      committed.current = value;
      commit.current(value);
    }, 600);
    return () => clearTimeout(timer);
  }, [value]);

  const label = `${def.labelEn} ${def.labelZh}`;
  const done = value.trim() !== "";

  return (
    <section className="grid content-start gap-2.5 rounded-stage-lg border border-stage-border bg-stage-bg p-4">
      <h2 className="flex items-center gap-2">
        <span className={DIM_CODE}>{def.labelEn}</span>
        <span className="text-stage-sm font-semibold text-stage-fg">
          {def.labelZh}
        </span>
        {/* The check is a glyph as well as a colour, never colour alone. */}
        {done ? (
          <span className="ml-auto grid text-stage-green-600">
            <Icon name="check" size={15} strokeWidth={2.5} />
            <span className="sr-only">已填写</span>
          </span>
        ) : null}
      </h2>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value.trim() === committed.current.trim()) return;
          committed.current = value;
          commit.current(value);
        }}
        placeholder="写下你自己的想法片段…"
        aria-label={label}
        className="min-h-16 w-full resize-y rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3 py-2.5 text-stage-sm leading-[1.6] text-stage-fg outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus"
      />
    </section>
  );
}

/**
 * Fragments that no card on this part can edit.
 *
 * Material written under the retired nine-dimension set, plus any second and
 * later fragment of a dimension that now holds one. Shown under its original
 * label and nowhere else: not remapped, not merged, and still available to
 * 答案构建 — but with no way to add more, since the dimension it names is no
 * longer offered.
 */
function useLegacyFragments(
  state: SpeakingQuestionState,
  dimensions: readonly SpeakingDimensionDef[],
): SpeakingFragment[] {
  return useMemo(() => {
    // Everything an active card owns. A fragment outside this set either names a
    // retired dimension, or is a second entry under one that now holds a single
    // textarea — either way, no card on this part can reach it.
    const owned = new Set(
      dimensions
        .map((def) => primaryFragment(state, def.id)?.id)
        .filter((id): id is string => id !== undefined),
    );
    return state.fragments.filter((fragment) => !owned.has(fragment.id));
  }, [state, dimensions]);
}

function LegacyPanel({
  fragments,
  onRemove,
}: {
  fragments: SpeakingFragment[];
  onRemove: (id: string) => void;
}) {
  return (
    <section className="grid gap-2.5 rounded-stage-lg border border-stage-border bg-stage-bg-soft p-4">
      <h2 className={EYEBROW}>旧素材 · 按原维度保留</h2>
      <p className="text-stage-xs text-stage-fg-subtle">
        这些片段写于旧的九维度体系。它们照原样保留，仍然可以在「答案构建」里使用；
        新的想法请写在上面当前 Part 的维度卡片里。
      </p>
      <ul className="grid gap-1.5">
        {fragments.map((fragment) => (
          <li
            key={fragment.id}
            className="flex items-baseline gap-2 rounded-stage-sm border border-stage-border bg-stage-bg px-3 py-2.5 text-stage-sm leading-[1.5]"
          >
            <span className={`${DIM_CODE} flex-none`}>
              {dimensionDef(fragment.dimension)?.labelEn ?? fragment.dimension}
            </span>
            <span className="min-w-0 flex-1 text-stage-fg-body">
              {fragment.text}
            </span>
            <IconAction
              label="删除这条旧素材"
              onClick={() => onRemove(fragment.id)}
            >
              <Icon name="close" size={13} />
            </IconAction>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Quiet square glyph button — the export's inline `×` / move affordances. */
function IconAction({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-6 w-6 flex-none place-items-center self-center rounded-stage-xs text-stage-fg-subtle transition-colors duration-stage-fast hover:bg-stage-bg-soft hover:text-stage-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/**
 * Step 3 — 答案构建.
 *
 * Left: the learner's fragments and the connective chips. Right: the draft, an
 * ordered list of references to those fragments plus connectives from a closed
 * list. There is no generation control on this screen, and there is nowhere for
 * one to write to: a draft block stores an id, never prose.
 *
 * Dragging is offered as an enhancement over clicking, not instead of it — a
 * drag-only pane would be unusable from the keyboard.
 */
function BuildStep({
  state,
  apply,
  onNext,
}: {
  state: SpeakingQuestionState;
  apply: Apply;
  onNext: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const byId = useMemo(
    () => new Map(state.fragments.map((fragment) => [fragment.id, fragment])),
    [state.fragments],
  );
  const used = useMemo(
    () =>
      new Set(
        state.draft.flatMap((block) =>
          block.kind === "fragment" ? [block.fragmentId] : [],
        ),
      ),
    [state.draft],
  );
  const fragmentBlocks = state.draft.filter((block) => block.kind === "fragment");

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-2.5">
          <h2 className={EYEBROW}>我的想法片段 · 点击加入右栏</h2>

          {state.fragments.length === 0 ? (
            <p className="rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-6 text-center text-stage-sm text-stage-fg-subtle">
              还没有想法片段。回到「个人想法」写下几条，再回来构建。
            </p>
          ) : (
            state.fragments.map((fragment) => {
              const spent = used.has(fragment.id);
              return (
                <button
                  key={fragment.id}
                  type="button"
                  disabled={spent}
                  draggable={!spent}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", fragment.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() =>
                    apply((current) => appendFragmentBlock(current, fragment.id))
                  }
                  className={`flex items-baseline gap-2 rounded-stage-sm border px-3 py-2.5 text-left text-stage-sm leading-[1.5] transition-colors duration-stage-fast ${
                    spent
                      ? "cursor-default border-stage-border bg-stage-bg-soft opacity-55"
                      : "border-stage-border-strong bg-stage-bg hover:border-stage-primary"
                  }`}
                >
                  <span className={`${DIM_CODE} flex-none`}>
                    {dimensionDef(fragment.dimension)?.labelEn ??
                      fragment.dimension}
                  </span>
                  <span className="min-w-0 flex-1 text-stage-fg-body">
                    {fragment.text}
                  </span>
                  {spent ? (
                    <span className="sr-only">已在草稿中</span>
                  ) : (
                    <span
                      aria-hidden
                      className="flex-none self-center text-[15px] font-medium leading-none text-stage-primary"
                    >
                      +
                    </span>
                  )}
                </button>
              );
            })
          )}

          <h2 className={`${EYEBROW} mt-2`}>连接词</h2>
          <ul className="flex flex-wrap gap-1.5">
            {CONNECTIVES.map((connective) => (
              <li key={connective}>
                <button
                  type="button"
                  onClick={() =>
                    apply((current) => appendConnectiveBlock(current, connective))
                  }
                  className="inline-flex h-7 items-center whitespace-nowrap rounded-stage-pill border border-stage-border bg-stage-bg px-2.5 font-stage-mono text-stage-2xs font-medium text-stage-fg-body transition-colors duration-stage-fast hover:border-stage-border-strong hover:bg-stage-bg-soft"
                >
                  {connective}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <section
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const fragmentId = event.dataTransfer.getData("text/plain");
            // `appendFragmentBlock` refuses an id that is not a fragment of this
            // question, so a payload dropped from anywhere else is inert.
            if (fragmentId) {
              apply((current) => appendFragmentBlock(current, fragmentId));
            }
          }}
          className={`grid min-h-[280px] content-start gap-2 rounded-stage-lg border bg-stage-bg p-4 transition-colors duration-stage-fast ${
            dragOver ? "border-stage-primary bg-stage-primary-soft" : "border-stage-border"
          }`}
        >
          <h2 className={EYEBROW}>答案草稿 · 只能由左栏片段组织而成</h2>

          {state.draft.length === 0 ? (
            <p className="py-6 text-center text-stage-sm text-stage-fg-subtle">
              从左栏点选或拖入片段与连接词，按你要说的顺序拼装。
            </p>
          ) : (
            <ol className="grid gap-2">
              {state.draft.map((block, index) => {
                const fragment =
                  block.kind === "fragment" ? byId.get(block.fragmentId) : null;

                return (
                  <li
                    key={block.id}
                    className={
                      block.kind === "connective"
                        ? "flex items-center gap-2 justify-self-start rounded-stage-pill border border-stage-gold-200 bg-stage-gold-50 px-2.5 py-1 font-stage-mono text-stage-xs text-stage-gold-700"
                        : "flex items-baseline gap-2 rounded-stage-sm border border-stage-border-accent bg-stage-primary-soft px-2.5 py-2 text-stage-sm leading-[1.5]"
                    }
                  >
                    {fragment ? (
                      <span className={`${DIM_CODE} flex-none`}>
                        {dimensionDef(fragment.dimension)?.labelEn ??
                          fragment.dimension}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      {block.kind === "connective" ? block.value : fragment?.text}
                    </span>
                    {/* The export reorders by removing and re-adding; these two
                        keep that possible without retyping, and are the only
                        way to reorder from a keyboard. */}
                    <IconAction
                      label="上移"
                      disabled={index === 0}
                      onClick={() =>
                        apply((current) => moveBlock(current, block.id, -1))
                      }
                    >
                      <span aria-hidden className="text-[13px] leading-none">
                        ↑
                      </span>
                    </IconAction>
                    <IconAction
                      label="下移"
                      disabled={index === state.draft.length - 1}
                      onClick={() =>
                        apply((current) => moveBlock(current, block.id, 1))
                      }
                    >
                      <span aria-hidden className="text-[13px] leading-none">
                        ↓
                      </span>
                    </IconAction>
                    <IconAction
                      label="移出草稿"
                      onClick={() =>
                        apply((current) => removeBlock(current, block.id))
                      }
                    >
                      <Icon name="close" size={13} />
                    </IconAction>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <StepFoot
        label="进入记忆巩固"
        note="没有 AI 生成——答案只来自你自己的片段。"
        disabled={fragmentBlocks.length === 0}
        onClick={onNext}
      />
    </>
  );
}

/**
 * Step 4 — 记忆巩固.
 *
 * The draft at four levels of hiding. The connectives print in full at every
 * level and each fragment keeps its opening words; the rest fades, then goes
 * behind a dashed rule, then the fragment goes entirely and only the joins are
 * left. Reduction is per fragment, not per word, so what remains is the shape
 * of the answer the learner assembled.
 */
function RecallStep({
  state,
  apply,
  onBack,
  onNext,
}: {
  state: SpeakingQuestionState;
  apply: Apply;
  onBack: () => void;
  onNext: () => void;
}) {
  const level = state.recallLevel;
  const byId = useMemo(
    () => new Map(state.fragments.map((fragment) => [fragment.id, fragment])),
    [state.fragments],
  );

  if (state.draft.length === 0) {
    return (
      <>
        <p className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-10 text-center text-stage-sm text-stage-fg-muted">
          草稿还是空的。先回到「答案构建」组织出一段答案。
        </p>
        <StepFoot
          label="回到答案构建"
          note="记忆巩固练的是你自己拼出来的那一段。"
          onClick={onBack}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-stage-xs text-stage-fg-subtle">隐藏程度：</span>
        {RECALL_LEVELS.map((entry) => {
          const on = entry.value === level;
          return (
            <button
              key={entry.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                apply((current) => setRecallLevel(current, entry.value))
              }
              className={`inline-flex h-[30px] flex-none items-center whitespace-nowrap rounded-stage-pill border px-3.5 text-stage-sm font-medium transition-colors duration-stage-fast ease-stage-standard ${
                on
                  ? "border-stage-primary bg-stage-primary text-stage-fg-on-dark"
                  : "border-stage-border bg-stage-bg text-stage-fg-body hover:border-stage-border-strong hover:bg-stage-bg-soft"
              }`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      <p className="rounded-stage-lg border border-stage-border bg-stage-bg p-[26px] text-stage-h4 font-normal leading-[2] text-stage-fg">
        {state.draft.map((block) => {
          if (block.kind === "connective") {
            return (
              <span
                key={block.id}
                className="px-1.5 font-stage-mono text-stage-body text-stage-gold-700"
              >
                {block.value}
              </span>
            );
          }
          const fragment = byId.get(block.fragmentId);
          if (!fragment) return null;
          const { head, rest } = splitHead(fragment.text);

          // 仅连接词: the fragment goes entirely, leaving a ruled gap the length
          // of what has to be recalled.
          if (level === 3) {
            return (
              <span key={block.id} className="mr-2 border-b border-dashed border-stage-neutral-300 text-transparent">
                {fragment.text}
              </span>
            );
          }
          return (
            <span key={block.id} className="pr-2">
              <span className="font-semibold">{head}</span>
              {rest ? " " : null}
              {rest && level === 0 ? <span>{rest}</span> : null}
              {rest && level === 1 ? (
                <span className="text-stage-neutral-300">{rest}</span>
              ) : null}
              {rest && level === 2 ? (
                <span className="border-b border-dashed border-stage-neutral-300 text-transparent">
                  {rest}
                </span>
              ) : null}
            </span>
          );
        })}
      </p>

      <StepFoot
        label="进入独立表达"
        note="连接词与你的核心词保留，其余逐级隐去。"
        onClick={onNext}
      />
    </>
  );
}

/**
 * Step 5 — 独立表达.
 *
 * A dismissible strip of the learner's own opening words, and a self-check list
 * of this part's dimensions. Completing it writes one event.
 *
 * The event says that the learner did this once, and which dimensions they say
 * they covered — that is the entire record, and the whole point of it. Nothing
 * is captured, timed, submitted or judged.
 */
function SoloStep({
  question,
  dimensions,
  state,
  apply,
}: {
  question: SpeakingQuestion;
  dimensions: readonly SpeakingDimensionDef[];
  state: SpeakingQuestionState;
  apply: Apply;
}) {
  const [hintsVisible, setHintsVisible] = useState(true);
  const [justLogged, setJustLogged] = useState(false);

  const hints = useMemo(() => {
    const byId = new Map(state.fragments.map((f) => [f.id, f]));
    return soloHints(
      state.draft.flatMap((block) =>
        block.kind === "fragment"
          ? [byId.get(block.fragmentId)?.text ?? ""]
          : [],
      ),
    );
  }, [state.draft, state.fragments]);

  const visible: SpeakingDimension[] = dimensions.map((def) => def.id);

  return (
    <>
      {hints !== "" && hintsVisible ? (
        <div className="flex items-center gap-3 rounded-stage-lg border border-stage-border bg-stage-bg p-4">
          <span className="min-w-0 flex-1 text-stage-sm text-stage-fg-body">
            {hints}
          </span>
          <IconAction label="关闭提示" onClick={() => setHintsVisible(false)}>
            <Icon name="close" size={13} />
          </IconAction>
        </div>
      ) : null}

      <section className="grid gap-3 rounded-stage-lg border border-stage-border bg-stage-bg p-5">
        <h2 className="text-stage-sm font-semibold text-stage-fg">
          自查清单 · 我的表达覆盖了哪些维度
        </h2>
        <ul className="grid gap-3">
          {dimensions.map((def) => {
            const checked = state.checked.includes(def.id);
            return (
              <li key={def.id}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply((current) => toggleChecked(current, def.id))
                    }
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="grid h-5 w-5 flex-none place-items-center rounded-stage-xs border border-stage-border-strong bg-stage-bg text-stage-fg-on-dark transition-colors duration-stage-fast peer-checked:border-stage-primary peer-checked:bg-stage-primary peer-focus-visible:shadow-stage-focus"
                  >
                    {checked ? <Icon name="check" size={13} strokeWidth={3} /> : null}
                  </span>
                  <span className="text-stage-sm leading-[1.5] text-stage-fg-body">
                    {def.labelEn} {def.labelZh}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
        <button
          type="button"
          onClick={() => {
            apply((current) => logSoloEvent(current, question.textEn, visible));
            setJustLogged(true);
            // 独立表达 completion is Speaking's 交卷. Section and content id only:
            // Speaking carries no scoring anywhere in this system, and none is
            // introduced here (§6 · Speaking 五禁).
            trackPracticeSubmit("speaking", contentPayload(question.id));
          }}
          className={STEP_BUTTON}
        >
          完成独立表达
        </button>
        <span className="text-stage-xs text-stage-fg-subtle">
          无录音、无计分——完成后记录一次「独立表达」事件。
        </span>
        {justLogged ? (
          <span role="status" className="text-stage-xs text-stage-green-600">
            已记录，可以在学习记录里看到。
          </span>
        ) : null}
      </div>

      {state.soloEvents.length > 0 ? (
        <p className="text-stage-xs tabular-nums text-stage-fg-subtle">
          这道题已完成 {state.soloEvents.length} 次独立表达。
        </p>
      ) : null}
    </>
  );
}
