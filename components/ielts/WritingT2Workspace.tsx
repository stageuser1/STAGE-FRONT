"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  WRITING_ESSAY_TYPE_LABELS,
  type WritingT2Question,
} from "@/lib/ielts/writing-types";
import {
  T2_WORD_TARGET,
  clearWritingT2Draft,
  countWords,
  formatElapsed,
  loadWritingT2Attempt,
  loadWritingT2Draft,
  restartWritingT2Attempt,
  saveWritingT2Draft,
  submitWritingT2Attempt,
  type WritingT2Attempt,
} from "@/lib/ielts/writing-t2-attempt";
import { Icon } from "@/components/ui/Icon";
import { BUTTON_GHOST_SM, BUTTON_SECONDARY, ConfirmButton } from "./ui";

/** Keystroke quiet period before a draft is written to storage. */
const AUTOSAVE_DELAY_MS = 2000;
/** Timer ticks between persisting elapsed time. */
const ELAPSED_PERSIST_EVERY = 15;

/**
 * The export's md primary button. Same geometry as `SpeakingFlow`'s STEP_BUTTON
 * and the catalog's card CTA: 44px tall, 18px sides, a 15px medium label.
 */
const PRIMARY_MD =
  "inline-flex h-11 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-stage-sm bg-stage-primary px-[18px] text-stage-sm font-medium leading-none text-stage-fg-on-dark transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-primary-hover active:bg-stage-primary-press disabled:cursor-not-allowed disabled:opacity-[0.45] disabled:hover:bg-stage-primary";

/** 11px uppercase, letter-spaced — the export's column heads. */
const EYEBROW =
  "text-stage-2xs font-semibold uppercase tracking-stage-eyebrow text-stage-fg-subtle";

type SaveState = "idle" | "saving" | "saved" | "failed";

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
 * Every keystroke, the clock and the record stay in this browser; see
 * `writing-t2-attempt.ts` for the storage contract.
 */
export function WritingT2Workspace({
  question,
}: {
  question: WritingT2Question;
}) {
  const questionId = question.id;

  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [taskHidden, setTaskHidden] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [attempt, setAttempt] = useState<WritingT2Attempt | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  // localStorage is unreadable until after mount. Until it has been read the
  // editor is read-only, so a keystroke can never be overwritten by the load.
  const [ready, setReady] = useState(false);

  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useRef<(() => void) | null>(null);
  // The timer's interval closes over its first render, so what it needs to
  // persist is read from a ref rather than from stale state.
  const latest = useRef({ text: "", elapsed: 0, hasDraft: false });

  useEffect(() => {
    const draft = loadWritingT2Draft(questionId);
    const record = loadWritingT2Attempt(questionId);

    setAttempt(record);
    setText(draft?.text ?? "");
    setElapsed(draft?.elapsedSeconds ?? 0);
    setSaveState(draft ? "saved" : "idle");
    // A draft outranks a record: its presence is what says an attempt is open.
    setSubmitted(draft === null && record !== null);
    latest.current = {
      text: draft?.text ?? "",
      elapsed: draft?.elapsedSeconds ?? 0,
      hasDraft: draft !== null,
    };
    setReady(true);
  }, [questionId]);

  // Count-up timer. Stopped on the completion screen — the attempt is over, and
  // a running clock would be measuring nothing.
  useEffect(() => {
    if (!ready || submitted) return;
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      // Driven from the ref rather than from inside a `setElapsed` updater: the
      // periodic write now reports success, and setting state from within
      // another state updater is not somewhere a side effect may live.
      const next = latest.current.elapsed + 1;
      latest.current.elapsed = next;
      setElapsed(next);

      // Only once there is a draft to attach it to. Opening a question and
      // typing nothing must not leave storage behind.
      if (ticks % ELAPSED_PERSIST_EVERY === 0 && latest.current.hasDraft) {
        const stored = saveWritingT2Draft(
          questionId,
          latest.current.text,
          next,
        );
        setSaveState(stored ? "saved" : "failed");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ready, submitted, questionId]);

  // Flush a pending draft when the screen goes away, so navigating out never
  // costs the last few characters.
  useEffect(() => () => flush.current?.(), []);

  const onType = useCallback(
    (next: string) => {
      // The editor is optimistic: state updates on every keystroke and storage
      // catches up, so the caret never waits for localStorage.
      setText(next);
      latest.current.text = next;
      setSaveState("saving");

      if (pending.current) clearTimeout(pending.current);
      const write = () => {
        pending.current = null;
        flush.current = null;
        const stored = saveWritingT2Draft(
          questionId,
          next,
          latest.current.elapsed,
        );
        // `hasDraft` tracks storage, not intent: a refused write left nothing
        // behind, so the periodic elapsed save must not start writing either.
        if (stored) latest.current.hasDraft = true;
        setSaveState(stored ? "saved" : "failed");
      };
      flush.current = write;
      pending.current = setTimeout(write, AUTOSAVE_DELAY_MS);
    },
    [questionId],
  );

  function onSubmit() {
    // Perform the pending write rather than cancelling it. If the record write
    // then fails, the last keystrokes are already in the draft — cancelling
    // would have left them nowhere at all.
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
    }
    const flushPending = flush.current;
    flush.current = null;
    flushPending?.();

    const result = submitWritingT2Attempt(questionId, text, elapsed);
    if (!result.ok) {
      // `empty` is already prevented by the button, so anything reaching here is
      // storage refusing the record. The draft is untouched and the editor stays
      // open; saying nothing would let the learner leave believing it was filed.
      setSubmitFailed(result.reason === "storage");
      return;
    }

    setSubmitFailed(false);
    setAttempt(result.attempt);
    setSubmitted(true);
    setSaveState("idle");
    latest.current.hasDraft = false;
  }

  function onRestart() {
    const stored = restartWritingT2Attempt(questionId);
    latest.current = { text: "", elapsed: 0, hasDraft: stored };
    setText("");
    setElapsed(0);
    setSaveState(stored ? "saved" : "failed");
    setSubmitted(false);
    setSubmitFailed(false);
  }

  const words = countWords(text);
  const reached = words >= T2_WORD_TARGET;
  const started = words > 0;
  const essayType = question.essayType
    ? WRITING_ESSAY_TYPE_LABELS[question.essayType]
    : null;

  if (submitted && attempt) {
    return (
      <CompletionPanel
        question={question}
        attempt={attempt}
        onRestart={onRestart}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-4 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <BackLink />
        <h1 className="min-w-0 flex-1 truncate text-stage-sm font-semibold text-stage-fg">
          {question.promptText}
        </h1>
        <p className="whitespace-nowrap font-stage-mono text-stage-xs tabular-nums text-stage-fg-muted">
          {started ? 1 : 0}/1 tasks
        </p>
        <Clock seconds={elapsed} />
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
          <TaskPane
            question={question}
            essayType={essayType}
            onHide={() => setTaskHidden(true)}
          />
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
                className={BUTTON_GHOST_SM}
              >
                <span aria-hidden className="grid flex-none">
                  <Icon name="chevron-right" size={14} />
                </span>
                Show Task
              </button>
            ) : null}
            <SaveIndicator state={saveState} />
          </div>

          <label className="sr-only" htmlFor="writing-t2-editor">
            Task 2 答案
          </label>
          <textarea
            id="writing-t2-editor"
            value={text}
            readOnly={!ready}
            aria-busy={!ready}
            onChange={(event) => onType(event.target.value)}
            placeholder="在这里输入你的答案…"
            spellCheck={false}
            className="min-h-[240px] w-full resize-y rounded-stage-md border border-stage-border-strong bg-stage-bg px-[18px] py-4 text-stage-sm leading-[1.9] text-stage-fg outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus lg:min-h-[420px]"
          />

          <WordCount words={words} reached={reached} />
        </section>
      </div>

      {submitFailed ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-stage-md border border-stage-warning-soft bg-stage-warning-soft px-[18px] py-3 text-stage-xs leading-[1.7] text-stage-warning"
        >
          <span aria-hidden className="grid flex-none pt-0.5">
            <Icon name="alert" size={14} strokeWidth={2.5} />
          </span>
          本次提交没能存进浏览器，可能是存储空间已满。你的答案仍在编辑区，请先复制备份，再重试提交。
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <TaskSwitch words={words} />
        <span className="ml-auto">
          {started ? (
            // Inline rather than `window.confirm`, which blocks the page, cannot
            // be styled or made accessible, and is forbidden in new Lab
            // components (Plan §4.1.5).
            <ConfirmButton
              label="完成本次练习"
              question="完成本次练习？提交后草稿会清空。"
              onConfirm={onSubmit}
              className={PRIMARY_MD}
            />
          ) : (
            <button
              type="button"
              disabled
              title="先写下你自己的答案"
              className={PRIMARY_MD}
            >
              完成本次练习
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/ielts-lab/writing"
      className="inline-flex items-center gap-[7px] text-stage-sm font-medium text-stage-fg-muted transition-colors duration-stage-fast hover:text-stage-fg"
    >
      <span aria-hidden className="grid flex-none">
        <Icon name="arrow-left" size={16} strokeWidth={2} />
      </span>
      返回任务列表
    </Link>
  );
}

/** The export's clock: 20px mono, tabular figures, neutral grey, no threshold. */
function Clock({ seconds }: { seconds: number }) {
  return (
    <p className="font-stage-mono text-[1.25rem] tracking-[.04em] tabular-nums text-stage-fg-muted">
      <span className="sr-only">已用时 </span>
      {formatElapsed(seconds)}
    </p>
  );
}

/**
 * The autosave line, reflecting what storage actually did.
 *
 * Three states, not a constant: nothing before the first keystroke, 正在保存…
 * while the debounce is outstanding, 草稿已自动保存 once the write has happened.
 * `aria-live="polite"` because it is a status a learner may want confirmed, and
 * it changes at most once every couple of seconds.
 */
function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;

  if (state === "failed") {
    // The existing warning treatment (amber), never red: §五.6 keeps the alarm
    // colour off this screen, and this is a storage problem rather than
    // anything about the learner's writing. `assertive`, because it contradicts
    // what the line said a moment ago and must not wait for a pause.
    return (
      <span
        aria-live="assertive"
        className="ml-auto inline-flex items-center gap-1.5 text-stage-xs text-stage-warning"
      >
        <span aria-hidden className="grid flex-none">
          <Icon name="alert" size={12} strokeWidth={2.5} />
        </span>
        保存失败 · 继续输入会重试
      </span>
    );
  }

  return (
    <span
      aria-live="polite"
      className="ml-auto inline-flex items-center gap-1.5 text-stage-xs text-stage-fg-subtle"
    >
      {state === "saved" ? (
        <>
          <span aria-hidden className="grid flex-none">
            <Icon name="check" size={12} strokeWidth={2.5} />
          </span>
          草稿已自动保存
        </>
      ) : (
        "正在保存…"
      )}
    </span>
  );
}

/**
 * Live word count.
 *
 * Under target is stated, never warned — neutral text, no red (§五.6). Reaching
 * it is an affirmative state carried by the navy accent, a check glyph and a
 * weight step rather than by colour alone, so it survives greyscale and does not
 * borrow the success green that means "correct" elsewhere in the Lab.
 */
function WordCount({ words, reached }: { words: number; reached: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3.5 text-stage-xs ${
        reached ? "text-stage-primary" : "text-stage-fg-muted"
      }`}
    >
      <span
        className={`font-stage-mono tabular-nums ${reached ? "font-semibold" : ""}`}
      >
        {words} / {T2_WORD_TARGET} words
      </span>
      {reached ? (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span aria-hidden className="grid flex-none">
            <Icon name="check" size={14} strokeWidth={2.5} />
          </span>
          已达到字数要求
        </span>
      ) : (
        <span>还差 {T2_WORD_TARGET - words} 词达到字数要求</span>
      )}
    </div>
  );
}

/** Left pane: the prompt itself (writing-spec §三 左栏). */
function TaskPane({
  question,
  essayType,
  onHide,
}: {
  question: WritingT2Question;
  essayType: string | null;
  onHide: () => void;
}) {
  return (
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
          onClick={onHide}
          className={`ml-auto ${BUTTON_GHOST_SM}`}
        >
          <span aria-hidden className="grid flex-none">
            <Icon name="chevron-left" size={14} />
          </span>
          Hide Task
        </button>
      </div>

      {/*
        Every Task 2 question is a text prompt, so this box is always in its
        empty state. It is drawn anyway, because the export draws it: it answers
        "is a chart missing?" before the learner wonders. The export's glyph is
        `file-text`; the Lab's icon set has no such name, and `document` is the
        same idea under the name it does have.
      */}
      <div className="grid h-[168px] place-items-center gap-2 rounded-stage-md border border-dashed border-stage-border-strong text-stage-xs text-stage-fg-subtle">
        <span aria-hidden className="grid justify-items-center">
          <Icon name="document" size={20} />
        </span>
        本题为文字题干，无图表
      </div>

      {/* Verbatim. `whitespace-pre-line` preserves the recall's own line breaks;
          nothing trims, rewraps or re-punctuates the prompt. */}
      <p className="whitespace-pre-line text-stage-sm leading-[1.85] text-stage-fg-body">
        {question.promptText}
      </p>
      <p className="text-stage-sm font-semibold text-stage-fg">
        Write at least {T2_WORD_TARGET} words.
      </p>
    </section>
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

/**
 * The completion screen (writing-spec §三 底部: 进入结果/记录页, not 提交评分).
 *
 * What it shows is exactly what was recorded — the text, the count, the time and
 * the date. There is no band, no score, no correction and no AI feedback; the
 * module's scope is draft management and process tracking (§五.8), and this
 * phase's bank ships no model answer for the §四 gate to unlock.
 */
function CompletionPanel({
  question,
  attempt,
  onRestart,
}: {
  question: WritingT2Question;
  attempt: WritingT2Attempt;
  onRestart: () => void;
}) {
  const submittedAt = new Date(attempt.submittedAt);
  const stamp = Number.isNaN(submittedAt.getTime())
    ? null
    : submittedAt.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-4 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <BackLink />
        <h1 className="min-w-0 flex-1 truncate text-stage-sm font-semibold text-stage-fg">
          {question.promptText}
        </h1>
        <p className="whitespace-nowrap font-stage-mono text-stage-xs tabular-nums text-stage-fg-muted">
          1/1 tasks
        </p>
      </header>

      <section
        aria-label="练习结果"
        className="grid content-start gap-4 rounded-stage-lg border border-stage-border bg-stage-bg p-[18px]"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={EYEBROW}>本次练习已完成</span>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-stage-2xs text-stage-fg-muted">字数</dt>
            <dd className="mt-1 font-stage-mono text-stage-h4 tabular-nums text-stage-fg">
              {attempt.wordCount}
              <span className="ml-1 text-stage-xs text-stage-fg-subtle">
                / {T2_WORD_TARGET} words
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-stage-2xs text-stage-fg-muted">用时</dt>
            <dd className="mt-1 font-stage-mono text-stage-h4 tabular-nums text-stage-fg">
              {formatElapsed(attempt.elapsedSeconds)}
            </dd>
          </div>
          {stamp ? (
            <div>
              <dt className="text-stage-2xs text-stage-fg-muted">提交时间</dt>
              <dd className="mt-1 text-stage-sm text-stage-fg-body">{stamp}</dd>
            </div>
          ) : null}
        </dl>

        <div>
          <p className={`${EYEBROW} mb-2`}>你的答案</p>
          {/* Read-only, and rendered as text rather than put back in a textarea:
              this is a record, and an editable-looking box would invite edits
              that would silently disagree with the count beside it. */}
          <div className="whitespace-pre-line rounded-stage-md border border-stage-border bg-stage-bg-soft px-[18px] py-4 text-stage-sm leading-[1.9] text-stage-fg-body">
            {attempt.text}
          </div>
        </div>

        <p className="text-stage-2xs leading-[1.7] text-stage-fg-subtle">
          本模块不提供评分、批改或参考范文，这里只记录你写了什么、写了多久。
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-stage-lg border border-stage-border bg-stage-bg px-[18px] py-3">
        <Link href="/ielts-lab/writing" className={BUTTON_SECONDARY}>
          返回任务列表
        </Link>
        {/* Keeps the record: 再练一次 opens a fresh draft, and the stored
            attempt is replaced only when a new one is submitted. */}
        <button type="button" onClick={onRestart} className={`ml-auto ${PRIMARY_MD}`}>
          再练一次
        </button>
      </div>
    </div>
  );
}
