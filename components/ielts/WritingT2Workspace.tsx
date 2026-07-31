"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WRITING_ESSAY_TYPE_LABELS,
  type WritingT2Question,
} from "@/lib/ielts/writing-types";
import {
  T2_WORD_TARGET,
  countWords,
  formatElapsed,
} from "@/lib/ielts/writing-t2-attempt";
import { Icon } from "@/components/ui/Icon";
import { BUTTON_GHOST_SM } from "./ui";

/**
 * The export's md primary button. Same geometry as `SpeakingFlow`'s STEP_BUTTON
 * and the catalog's card CTA: 44px tall, 18px sides, a 15px medium label.
 */
const PRIMARY_MD =
  "inline-flex h-11 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-stage-sm bg-stage-primary px-[18px] text-stage-sm font-medium leading-none text-stage-fg-on-dark transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-primary-hover active:bg-stage-primary-press disabled:cursor-not-allowed disabled:opacity-[0.45] disabled:hover:bg-stage-primary";

/** 11px uppercase, letter-spaced — the export's column heads. */
const EYEBROW =
  "text-stage-2xs font-semibold uppercase tracking-stage-eyebrow text-stage-fg-subtle";

/**
 * Task 2 writing screen (writing-spec §三), on one bank question.
 *
 * Geometry from the approved export's `WritingScreen.jsx`, with one structural
 * adaptation: the export is a `height: 100vh` three-row frame (bar / panes /
 * footer) separated by hairlines, because it draws its own full-bleed surface.
 * This route lives inside the Lab `(shell)`, whose padded 1160px column is a
 * do-not-touch layout file, so the three rows become bordered cards in that
 * column — exactly the adaptation the Writing workspace this replaces already
 * made, and the reason the sidebar stays reachable mid-draft (a draft is not a
 * timed sitting; the learner may leave).
 *
 * The timer counts up in neutral grey with no threshold of any kind (§五.5).
 * Nothing here scores, grades or predicts a band (§五.8), and there is no model
 * answer on this screen at all — the 先尝试、后解锁 gate (§四) has nothing to
 * unlock in this phase because the bank ships no model answers.
 *
 * CP2 scope: layout, count-up timer and live word count. No persistence yet, so
 * the draft lives in component state and the 草稿已自动保存 line is deliberately
 * absent rather than shown as a constant that would be lying.
 */
export function WritingT2Workspace({
  question,
}: {
  question: WritingT2Question;
}) {
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [taskHidden, setTaskHidden] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const words = countWords(text);
  const reached = words >= T2_WORD_TARGET;
  const started = words > 0;
  const essayType = question.essayType
    ? WRITING_ESSAY_TYPE_LABELS[question.essayType]
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: back, title, progress, clock. */}
      <header className="flex flex-wrap items-center gap-4 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <Link
          href="/ielts-lab/writing"
          className="inline-flex items-center gap-[7px] text-stage-sm font-medium text-stage-fg-muted transition-colors duration-stage-fast hover:text-stage-fg"
        >
          <span aria-hidden className="grid flex-none">
            <Icon name="arrow-left" size={16} strokeWidth={2} />
          </span>
          返回任务列表
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-stage-sm font-semibold text-stage-fg">
          {question.promptText}
        </h1>
        <p className="whitespace-nowrap font-stage-mono text-stage-xs tabular-nums text-stage-fg-muted">
          {started ? 1 : 0}/1 tasks
        </p>
        <p className="font-stage-mono text-[1.25rem] tracking-[.04em] tabular-nums text-stage-fg-muted">
          <span className="sr-only">已用时 </span>
          {formatElapsed(elapsed)}
        </p>
      </header>

      {/* The export's split: the editor is the slightly wider column (1.05fr). */}
      <div
        className={`grid gap-4 ${
          taskHidden
            ? ""
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start"
        }`}
      >
        {taskHidden ? null : (
          <section
            aria-label="题目"
            className="grid content-start gap-4 rounded-stage-lg border border-stage-border bg-stage-bg p-[18px]"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={EYEBROW}>
                TASK 2{essayType ? ` · ${essayType}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setTaskHidden(true)}
                className={`ml-auto ${BUTTON_GHOST_SM}`}
              >
                <span aria-hidden className="grid flex-none">
                  <Icon name="chevron-left" size={14} />
                </span>
                Hide Task
              </button>
            </div>

            {/*
              Every Task 2 question is a text prompt, so this box is always in
              its empty state. It is drawn anyway, because the export draws it:
              it answers "is a chart missing?" before the learner wonders.
              The export's glyph is `file-text`; the Lab's icon set has no such
              name, and `document` is the same idea under the name it does have.
            */}
            <div className="grid h-[168px] place-items-center gap-2 rounded-stage-md border border-dashed border-stage-border-strong text-stage-xs text-stage-fg-subtle">
              <span aria-hidden className="grid justify-items-center">
                <Icon name="document" size={20} />
              </span>
              本题为文字题干，无图表
            </div>

            {/* Verbatim. `whitespace-pre-line` preserves the recall's own line
                breaks; nothing trims, rewraps or re-punctuates the prompt. */}
            <p className="whitespace-pre-line text-stage-sm leading-[1.85] text-stage-fg-body">
              {question.promptText}
            </p>
            <p className="text-stage-sm font-semibold text-stage-fg">
              Write at least {T2_WORD_TARGET} words.
            </p>
          </section>
        )}

        <section
          aria-label="写作区"
          className="grid content-start gap-3 rounded-stage-lg border border-stage-border bg-stage-bg p-[18px]"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={EYEBROW}>写作区 · TASK 2</span>
            {taskHidden ? (
              <button
                type="button"
                onClick={() => setTaskHidden(false)}
                className={`ml-auto ${BUTTON_GHOST_SM}`}
              >
                <span aria-hidden className="grid flex-none">
                  <Icon name="chevron-right" size={14} />
                </span>
                Show Task
              </button>
            ) : null}
          </div>

          <label className="sr-only" htmlFor="writing-t2-editor">
            Task 2 答案
          </label>
          <textarea
            id="writing-t2-editor"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="在这里输入你的答案…"
            spellCheck={false}
            className="min-h-[240px] w-full resize-y rounded-stage-md border border-stage-border-strong bg-stage-bg px-[18px] py-4 text-stage-sm leading-[1.9] text-stage-fg outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus lg:min-h-[420px]"
          />

          {/* Under target is stated, never warned — neutral text, no red
              (§五.6). Reaching it swaps the sentence rather than the colour. */}
          <div className="flex flex-wrap items-center gap-3.5 text-stage-xs text-stage-fg-muted">
            <span className="font-stage-mono tabular-nums">
              {words} / {T2_WORD_TARGET} words
            </span>
            <span>
              {reached
                ? "已达到字数要求"
                : `还差 ${T2_WORD_TARGET - words} 词达到字数要求`}
            </span>
          </div>
        </section>
      </div>

      {/* Footer: the task switch and the one primary action. */}
      <div className="flex flex-wrap items-center gap-3 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <TaskSwitch words={words} />
        <button
          type="button"
          disabled={!started}
          title={started ? undefined : "先写下你自己的答案"}
          className={`ml-auto ${PRIMARY_MD}`}
        >
          完成本次练习
        </button>
      </div>
    </div>
  );
}

/**
 * Task 1 / Task 2 switch (writing-spec §三 底部), at the export's geometry:
 * 8px-radius chips, 8px/18px padding, the selected one a soft blue fill with a
 * navy label.
 *
 * Task 1 is a disabled `<button>` carrying 待上线 in text — the same treatment
 * the catalog's filter gives it, for the same reason: the task exists, its bank
 * does not yet. It has nothing to switch to, so this is a two-chip strip with one
 * chip inert rather than a live tablist.
 */
function TaskSwitch({ words }: { words: number }) {
  const chip =
    "inline-flex items-center gap-2 whitespace-nowrap rounded-stage-sm border px-[18px] py-2 text-stage-sm transition-colors duration-stage-fast";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled
        title="Task 1 题库尚未上线"
        className={`${chip} cursor-not-allowed border-stage-border bg-stage-bg font-medium text-stage-neutral-400`}
      >
        Task 1
        <span className="rounded-stage-xs bg-stage-bg-soft px-1.5 py-0.5 text-stage-2xs font-normal text-stage-fg-subtle">
          待上线
        </span>
      </button>
      <span
        aria-current="step"
        className={`${chip} border-stage-primary bg-stage-primary-soft font-semibold text-stage-blue-800`}
      >
        Task 2
        {words > 0 ? (
          <span className="font-stage-mono text-stage-2xs font-normal tabular-nums opacity-70">
            {words}w
          </span>
        ) : null}
      </span>
    </div>
  );
}
