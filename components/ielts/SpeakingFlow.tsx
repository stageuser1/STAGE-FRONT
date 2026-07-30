"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SPEAKING_PART_LABELS,
  type SpeakingQuestion,
} from "@/lib/ielts/speaking-types";
import {
  SPEAKING_DIMENSIONS,
  SPEAKING_STEPS,
  addFragment,
  appendConnectiveBlock,
  appendFragmentBlock,
  draftText,
  emptySpeakingState,
  filledDimensions,
  fragmentBlockCount,
  fragmentsByDimension,
  loadSpeakingState,
  logSoloEvent,
  moveBlock,
  removeBlock,
  removeFragment,
  saveSpeakingState,
  setRecallLevel,
  setStep,
  toggleChecked,
  updateFragment,
  type SpeakingDimension,
  type SpeakingFragment,
  type SpeakingQuestionState,
} from "@/lib/ielts/speaking-session";
import {
  CONNECTIVES,
  RECALL_LEVELS,
  keywordsOf,
  skeletonTokens,
} from "@/lib/ielts/speaking-text";
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  BUTTON_SECONDARY,
  Card,
  EmptyNote,
  FIELD,
  Tag,
} from "./ui";

/**
 * The five-step Speaking flow (master-spec 批次三).
 *
 * 题目 → 个人想法 → 答案构建 → 记忆巩固 → 独立表达, with the stepper resident at
 * the top of every step. The steps are component state rather than five routes:
 * everything the last three steps render lives in `localStorage`, so a server
 * route per step would prerender four empty shells.
 *
 * What this module does not contain, and cannot: any button that produces
 * language on the learner's behalf, any recorder, any microphone permission,
 * any pronunciation feedback, any score. 答案构建's draft is assembled from
 * references to the learner's own fragments — see `speaking-session.ts`, where
 * that is a property of the stored shape rather than a UI convention.
 */
export function SpeakingFlow({ question }: { question: SpeakingQuestion }) {
  // null until the first read after mount; the flow renders a quiet placeholder
  // rather than a blank five-step skeleton that would then fill in.
  const [state, setState] = useState<SpeakingQuestionState | null>(null);
  const [step, setStepValue] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadSpeakingState(question.id) ?? emptySpeakingState(question.id);
    setState(stored);
    setStepValue(stored.step);
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

  function goTo(next: number) {
    setStepValue(next);
    apply((current) => setStep(current, next));
  }

  if (!state) {
    return <p className="py-8 text-stage-xs text-stage-fg-muted">载入素材…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/ielts-lab/speaking" className={BUTTON_QUIET}>
          ← 返回素材库
        </Link>
        {saved ? (
          <span className="text-stage-2xs text-stage-fg-subtle">已自动保存</span>
        ) : null}
      </div>

      <Stepper current={step} state={state} onGo={goTo} />

      <QuestionBar question={question} />

      {step === 0 ? (
        <QuestionStep question={question} onNext={() => goTo(1)} />
      ) : null}
      {step === 1 ? (
        <IdeasStep state={state} apply={apply} onNext={() => goTo(2)} />
      ) : null}
      {step === 2 ? (
        <BuildStep
          state={state}
          apply={apply}
          onBack={() => goTo(1)}
          onNext={() => goTo(3)}
        />
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
        <SoloStep question={question} state={state} apply={apply} onBack={() => goTo(3)} />
      ) : null}
    </div>
  );
}

/**
 * The resident stepper.
 *
 * Every step is reachable at any time — the flow is a way of working, not a
 * gate — and each carries a small count of what the learner has put into it, so
 * the row doubles as a progress readout. Completion is marked with a glyph as
 * well as colour (Plan §4.1.4).
 */
function Stepper({
  current,
  state,
  onGo,
}: {
  current: number;
  state: SpeakingQuestionState;
  onGo: (step: number) => void;
}) {
  const counts = [
    null,
    state.fragments.length,
    state.draft.length,
    state.recallLevel > 0 ? state.recallLevel : null,
    state.soloEvents.length,
  ];

  return (
    // The scroll container and the wide row must be two elements: an element
    // that is both `w-max` and `overflow-x-auto` sizes to its content and never
    // scrolls, which pushes the page sideways instead. `LabMobileNav` in
    // LabSidebar.tsx splits them the same way.
    <nav
      aria-label="口语五步流程"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex w-max min-w-full gap-1">
        {SPEAKING_STEPS.map((entry) => {
          const active = entry.index === current;
          const count = counts[entry.index];
          const done = typeof count === "number" && count > 0;

          return (
            <li key={entry.index} className="flex-1">
              <button
                type="button"
                onClick={() => onGo(entry.index)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-stage-sm border px-3 py-2 text-stage-2xs transition-colors duration-stage-fast ${
                  active
                    ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
                    : "border-stage-border bg-stage-bg text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg"
                }`}
              >
                <span className="tabular-nums opacity-70">{entry.index + 1}</span>
                {entry.label}
                {done ? (
                  <span className="tabular-nums opacity-80">
                    <span aria-hidden>✓</span>
                    <span className="sr-only">已完成，</span>
                    {count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The prompt, resident above every step so it is never out of sight. */
function QuestionBar({ question }: { question: SpeakingQuestion }) {
  return (
    <section className="rounded-stage-lg border border-stage-border-accent bg-stage-primary-soft px-4 py-3.5">
      <p className="flex flex-wrap items-center gap-2">
        <Tag>{SPEAKING_PART_LABELS[question.part]}</Tag>
        <Tag>
          {question.topicLabelEn} {question.topicLabelZh}
        </Tag>
      </p>
      <p className="mt-2 text-stage-sm font-medium text-stage-fg">
        {question.textEn}
      </p>
      {question.glossZh ? (
        <p className="mt-1 text-stage-2xs text-stage-fg-muted">{question.glossZh}</p>
      ) : null}
    </section>
  );
}

/** Step 1 — 题目. */
function QuestionStep({
  question,
  onNext,
}: {
  question: SpeakingQuestion;
  onNext: () => void;
}) {
  return (
    <Card title="题目" subtitle="确认这道题目，然后开始整理你自己的想法。">
      {question.cuePoints.length > 0 ? (
        <div className="rounded-stage-md border border-stage-border bg-stage-bg-soft px-4 py-3">
          <p className="text-stage-2xs font-medium text-stage-fg">
            You should say:
          </p>
          <ul className="mt-2 space-y-1">
            {question.cuePoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-stage-xs text-stage-fg-body"
              >
                <span
                  aria-hidden
                  className="mt-2 inline-block h-1 w-1 shrink-0 rounded-stage-pill bg-stage-border-strong"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-stage-xs text-stage-fg-muted">
          {SPEAKING_PART_LABELS[question.part]} 题目没有提示卡，直接进入下一步整理想法。
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onNext} className={BUTTON_PRIMARY}>
          开始整理想法
        </button>
        <Link href="/ielts-lab/speaking" className={BUTTON_SECONDARY}>
          换一道题
        </Link>
      </div>
    </Card>
  );
}

type Apply = (
  transform: (current: SpeakingQuestionState) => SpeakingQuestionState,
) => void;

/**
 * Step 2 — 个人想法 (批次三 §2).
 *
 * Nine dimension cards, bilingual labels verbatim, each a free-input area for
 * the learner's own fragments. A dimension with at least one fragment gets a
 * check. Nothing here suggests content: the cards ask a question and hold what
 * the learner answers.
 */
function IdeasStep({
  state,
  apply,
  onNext,
}: {
  state: SpeakingQuestionState;
  apply: Apply;
  onNext: () => void;
}) {
  const grouped = useMemo(() => fragmentsByDimension(state), [state]);
  const filled = useMemo(() => filledDimensions(state), [state]);

  return (
    <div className="space-y-4">
      <Card
        title="个人想法"
        subtitle="九个角度，只写你自己想到的片段。写下来的东西会成为下一步唯一的素材来源。"
        aside={
          <span className="text-stage-2xs tabular-nums text-stage-fg-subtle">
            已填 {filled.size} / {SPEAKING_DIMENSIONS.length} 个维度
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SPEAKING_DIMENSIONS.map((dimension) => (
            <DimensionCard
              key={dimension.id}
              labelEn={dimension.labelEn}
              labelZh={dimension.labelZh}
              filled={filled.has(dimension.id)}
              fragments={grouped.get(dimension.id) ?? []}
              onAdd={(text) =>
                apply((current) => addFragment(current, dimension.id, text))
              }
              onEdit={(id, text) =>
                apply((current) => updateFragment(current, id, text))
              }
              onRemove={(id) => apply((current) => removeFragment(current, id))}
            />
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNext}
          disabled={state.fragments.length === 0}
          className={BUTTON_PRIMARY}
        >
          去构建答案
        </button>
        {state.fragments.length === 0 ? (
          <span className="text-stage-2xs text-stage-fg-subtle">
            至少写下一条想法，才有东西可以构建。
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DimensionCard({
  labelEn,
  labelZh,
  filled,
  fragments,
  onAdd,
  onEdit,
  onRemove,
}: {
  labelEn: string;
  labelZh: string;
  filled: boolean;
  fragments: SpeakingFragment[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const label = `${labelEn} ${labelZh}`;

  function submit() {
    if (draft.trim() === "") return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <section className="rounded-stage-md border border-stage-border bg-stage-bg p-3">
      <h3 className="flex items-center gap-1.5 text-stage-2xs font-medium text-stage-fg">
        {/* The check is a glyph plus a label, never colour alone. */}
        <span
          aria-hidden
          className={filled ? "text-stage-success" : "text-stage-fg-subtle"}
        >
          {filled ? "✓" : "○"}
        </span>
        {label}
        {filled ? <span className="sr-only">（已填写）</span> : null}
      </h3>

      {fragments.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {fragments.map((fragment) => (
            <li key={fragment.id} className="flex items-start gap-2">
              <textarea
                defaultValue={fragment.text}
                rows={2}
                aria-label={`${label} 想法片段`}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next !== "" && next !== fragment.text) {
                    onEdit(fragment.id, next);
                  } else if (next === "") {
                    event.target.value = fragment.text;
                  }
                }}
                className={`min-w-0 flex-1 resize-y ${FIELD}`}
              />
              <button
                type="button"
                onClick={() => onRemove(fragment.id)}
                aria-label="删除这条想法"
                className="shrink-0 rounded-stage-sm border border-stage-border px-2 py-1 text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-danger hover:text-stage-danger"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex items-start gap-2">
        <textarea
          value={draft}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter commits, Shift+Enter keeps a line break — the same bargain
            // every message field makes, so the habit transfers.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="写一条想法…"
          aria-label={`为 ${label} 添加想法`}
          className={`min-w-0 flex-1 resize-y ${FIELD}`}
        />
        <button
          type="button"
          onClick={submit}
          disabled={draft.trim() === ""}
          className={`shrink-0 ${BUTTON_SECONDARY}`}
        >
          添加
        </button>
      </div>
    </section>
  );
}

/**
 * Step 3 — 答案构建 (批次三 §3).
 *
 * Left: the learner's fragments, grouped by dimension. Right: the draft, an
 * ordered list of references to those fragments plus connectives from a closed
 * list. There is no generation control on this screen, and there is nowhere for
 * one to write to: a draft block stores an id, never prose.
 *
 * Dragging is offered as an enhancement over the buttons, not instead of them —
 * a drag-only pane would be unusable from the keyboard (Plan §4.1.4).
 */
function BuildStep({
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
  const grouped = useMemo(() => fragmentsByDimension(state), [state]);
  const byId = useMemo(
    () => new Map(state.fragments.map((fragment) => [fragment.id, fragment])),
    [state.fragments],
  );
  const [dragOver, setDragOver] = useState(false);
  const text = draftText(state);

  const used = new Set(
    state.draft.flatMap((block) =>
      block.kind === "fragment" ? [block.fragmentId] : [],
    ),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="我的想法片段"
          subtitle="按维度分组。加入右栏即可组织成答案。"
        >
          {state.fragments.length === 0 ? (
            <EmptyNote>
              还没有想法片段。回到「个人想法」写下几条，再回来构建。
            </EmptyNote>
          ) : (
            <div className="space-y-3">
              {SPEAKING_DIMENSIONS.map((dimension) => {
                const fragments = grouped.get(dimension.id) ?? [];
                if (fragments.length === 0) return null;
                return (
                  <section key={dimension.id}>
                    <h3 className="text-stage-2xs font-medium text-stage-fg-muted">
                      {dimension.labelEn} {dimension.labelZh}
                    </h3>
                    <ul className="mt-1.5 space-y-1.5">
                      {fragments.map((fragment) => (
                        <li
                          key={fragment.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", fragment.id);
                            event.dataTransfer.effectAllowed = "copy";
                          }}
                          className="flex items-start justify-between gap-2 rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-2"
                        >
                          <span className="min-w-0 text-stage-2xs text-stage-fg-body">
                            {fragment.text}
                            {used.has(fragment.id) ? (
                              <span className="ml-1.5 text-stage-fg-subtle">
                                · 已在草稿中
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              apply((current) =>
                                appendFragmentBlock(current, fragment.id),
                              )
                            }
                            className="shrink-0 rounded-stage-sm border border-stage-border-strong px-2 py-0.5 text-stage-2xs text-stage-fg-body transition-colors duration-stage-fast hover:border-stage-primary hover:text-stage-primary"
                          >
                            加入草稿
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="答案草稿"
          subtitle="只能由你自己的片段与连接词组成。"
          aside={
            <span className="text-stage-2xs tabular-nums text-stage-fg-subtle">
              {fragmentBlockCount(state)} 段来自你的片段
            </span>
          }
        >
          <div
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
              // `appendFragmentBlock` refuses an id that is not a fragment of
              // this question, so a dropped payload from anywhere else is inert.
              if (fragmentId) {
                apply((current) => appendFragmentBlock(current, fragmentId));
              }
            }}
            className={`rounded-stage-md border border-dashed p-3 transition-colors duration-stage-fast ${
              dragOver ? "border-stage-primary bg-stage-primary-soft" : "border-stage-border"
            }`}
          >
            {state.draft.length === 0 ? (
              <p className="py-6 text-center text-stage-2xs text-stage-fg-muted">
                把左栏的片段拖到这里，或点「加入草稿」。
              </p>
            ) : (
              <ol className="space-y-1.5">
                {state.draft.map((block, index) => {
                  const fragment =
                    block.kind === "fragment" ? byId.get(block.fragmentId) : null;
                  const dimension =
                    fragment &&
                    SPEAKING_DIMENSIONS.find((d) => d.id === fragment.dimension);

                  return (
                    <li
                      key={block.id}
                      className="flex items-start gap-2 rounded-stage-sm border border-stage-border bg-stage-bg px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 text-stage-2xs text-stage-fg-body">
                        {block.kind === "connective" ? (
                          <span className="text-stage-fg-muted">{block.value}</span>
                        ) : (
                          <>
                            {fragment?.text}
                            {dimension ? (
                              <span className="ml-1.5 text-stage-fg-subtle">
                                · 来源 {dimension.labelEn} {dimension.labelZh}
                              </span>
                            ) : null}
                          </>
                        )}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <MoveButton
                          label="上移"
                          glyph="↑"
                          disabled={index === 0}
                          onClick={() =>
                            apply((current) => moveBlock(current, block.id, -1))
                          }
                        />
                        <MoveButton
                          label="下移"
                          glyph="↓"
                          disabled={index === state.draft.length - 1}
                          onClick={() =>
                            apply((current) => moveBlock(current, block.id, 1))
                          }
                        />
                        <MoveButton
                          label="移出草稿"
                          glyph="×"
                          onClick={() =>
                            apply((current) => removeBlock(current, block.id))
                          }
                        />
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-3">
            <p className="text-stage-2xs text-stage-fg-muted">插入连接词</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {CONNECTIVES.map((connective) => (
                <li key={connective}>
                  <button
                    type="button"
                    onClick={() =>
                      apply((current) => appendConnectiveBlock(current, connective))
                    }
                    className="rounded-stage-pill border border-stage-border px-2.5 py-1 text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-border-strong hover:text-stage-fg"
                  >
                    {connective}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {text ? (
            <div className="mt-4 border-t border-stage-border pt-3">
              <p className="text-stage-2xs text-stage-fg-muted">连起来读一遍</p>
              <p className="mt-1.5 text-stage-xs leading-relaxed text-stage-fg-body">
                {text}
              </p>
            </div>
          ) : null}

          <p className="mt-3 text-stage-2xs text-stage-fg-subtle">
            草稿里的每一段都来自你自己写下的片段——这一页只做组织与连接。
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onNext}
          disabled={state.draft.length === 0}
          className={BUTTON_PRIMARY}
        >
          去记忆巩固
        </button>
        <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
          回到个人想法
        </button>
      </div>
    </div>
  );
}

function MoveButton({
  label,
  glyph,
  disabled = false,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-stage-sm border border-stage-border px-1.5 py-0.5 text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-border-strong hover:text-stage-fg disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}

/**
 * Step 4 — 记忆巩固 (批次三 §4).
 *
 * The draft as a keyword skeleton: connectives and the learner's own content
 * words hold, the grammatical scaffolding fades and then goes, and at the last
 * level only initials remain. Four levels, chosen by the learner and remembered
 * between visits.
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
  const text = draftText(state);
  const level = state.recallLevel;
  const tokens = useMemo(() => skeletonTokens(text, level), [text, level]);
  const active = RECALL_LEVELS[level];

  if (text === "") {
    return (
      <Card title="记忆巩固">
        <EmptyNote>草稿还是空的。先回到「答案构建」组织出一段答案。</EmptyNote>
        <button type="button" onClick={onBack} className={`mt-4 ${BUTTON_SECONDARY}`}>
          回到答案构建
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title="记忆巩固"
        subtitle="逐级隐去文字，看着剩下的线索把整段说完整。"
      >
        <div
          role="group"
          aria-label="隐藏程度"
          className="flex flex-wrap items-center gap-1.5"
        >
          {RECALL_LEVELS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              aria-pressed={entry.value === level}
              onClick={() =>
                apply((current) => setRecallLevel(current, entry.value))
              }
              className={`rounded-stage-pill border px-3 py-1 text-stage-2xs transition-colors duration-stage-fast ${
                entry.value === level
                  ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
                  : "border-stage-border text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-stage-2xs text-stage-fg-subtle">{active.hint}</p>

        <p className="mt-4 rounded-stage-md border border-stage-border bg-stage-bg-soft px-4 py-4 text-stage-sm leading-loose text-stage-fg-body">
          {tokens.map((token, index) => (
            <span
              key={index}
              className={
                token.faded
                  ? "text-stage-fg-subtle opacity-50"
                  : token.content
                    ? "font-medium text-stage-fg"
                    : undefined
              }
            >
              {token.display}
            </span>
          ))}
        </p>

        {level > 0 ? (
          <button
            type="button"
            onClick={() => apply((current) => setRecallLevel(current, 0))}
            className={`mt-3 ${BUTTON_QUIET}`}
          >
            看回完整版本
          </button>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onNext} className={BUTTON_PRIMARY}>
          去独立表达
        </button>
        <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
          回到答案构建
        </button>
      </div>
    </div>
  );
}

/**
 * Step 5 — 独立表达 (批次三 §5).
 *
 * The prompt, a dismissible keyword strip, and a self-check list of the
 * dimensions the learner meant to cover. Completing it writes one event.
 *
 * The event says that the learner did this once, and which dimensions they say
 * they covered — that is the entire record, and the whole point of it. Nothing
 * is captured, timed, submitted or judged; the copy on screen states what the
 * step is rather than listing what it deliberately lacks.
 */
function SoloStep({
  question,
  state,
  apply,
  onBack,
}: {
  question: SpeakingQuestion;
  state: SpeakingQuestionState;
  apply: Apply;
  onBack: () => void;
}) {
  const [hintsVisible, setHintsVisible] = useState(true);
  const [justLogged, setJustLogged] = useState(false);

  const text = draftText(state);
  const hints = useMemo(() => keywordsOf(text), [text]);
  // The checklist covers what the learner actually planned; falling back to all
  // nine when nothing was written keeps the list from being empty.
  const planned = useMemo(() => {
    const filled = filledDimensions(state);
    return SPEAKING_DIMENSIONS.filter(
      (dimension) => filled.size === 0 || filled.has(dimension.id),
    );
  }, [state]);

  const checkedCount = state.checked.length;

  return (
    <div className="space-y-4">
      <Card
        title="独立表达"
        subtitle="不看草稿，把这道题完整说一遍。完成后只留下一条「做过一次」的记录。"
      >
        <p className="rounded-stage-md border border-stage-border bg-stage-bg-soft px-4 py-4 text-stage-sm text-stage-fg">
          {question.textEn}
        </p>

        {hints.length > 0 ? (
          hintsVisible ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-stage-2xs text-stage-fg-muted">
                  关键词提示（你自己的词）
                </p>
                <button
                  type="button"
                  onClick={() => setHintsVisible(false)}
                  className={BUTTON_QUIET}
                >
                  收起提示
                </button>
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {hints.map((word) => (
                  <li key={word}>
                    <Tag>{word}</Tag>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHintsVisible(true)}
              className={`mt-3 ${BUTTON_QUIET}`}
            >
              显示关键词提示
            </button>
          )
        ) : null}
      </Card>

      <Card
        title="自查清单"
        subtitle="说完之后，勾选你实际覆盖到的维度。"
        aside={
          <span className="text-stage-2xs tabular-nums text-stage-fg-subtle">
            已勾选 {checkedCount} / {planned.length}
          </span>
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {planned.map((dimension) => {
            const checked = state.checked.includes(dimension.id);
            return (
              <li key={dimension.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-stage-sm border border-stage-border px-3 py-2 text-stage-2xs text-stage-fg-body">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply((current) =>
                        toggleChecked(current, dimension.id as SpeakingDimension),
                      )
                    }
                    className="h-4 w-4 shrink-0 accent-[var(--stage-primary)]"
                  />
                  {dimension.labelEn} {dimension.labelZh}
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              apply((current) => logSoloEvent(current, question.textEn));
              setJustLogged(true);
            }}
            className={BUTTON_PRIMARY}
          >
            完成本次独立表达
          </button>
          <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
            回到记忆巩固
          </button>
          {justLogged ? (
            <span role="status" className="text-stage-2xs text-stage-success">
              已记录，可以在练习记录里看到。
            </span>
          ) : null}
        </div>

        {state.soloEvents.length > 0 ? (
          <div className="mt-4 border-t border-stage-border pt-3">
            <p className="text-stage-2xs text-stage-fg-muted">
              这道题已完成 {state.soloEvents.length} 次独立表达
            </p>
            <ul className="mt-1.5 space-y-1">
              {[...state.soloEvents]
                .reverse()
                .slice(0, 5)
                .map((event) => (
                  <li
                    key={event.id}
                    className="text-stage-2xs tabular-nums text-stage-fg-subtle"
                  >
                    {new Date(event.at).toLocaleString("zh-CN")} · 覆盖{" "}
                    {event.dimensions.length} 个维度
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
