"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  WRITING_FIGURE_KIND_LABELS,
  WRITING_TASK_KIND_LABELS,
  type WritingSetDto,
  type WritingTaskDto,
} from "@/lib/writing-data";
import {
  canComplete,
  completeWritingSession,
  countWords,
  emptySession,
  loadWritingSession,
  reopenWritingSession,
  saveElapsed,
  saveTaskText,
  startedTaskCount,
  taskText,
  totalWords,
  withTaskText,
  type WritingSessionState,
} from "@/lib/ielts/writing-session";
import { BUTTON_PRIMARY, BUTTON_QUIET, BUTTON_SECONDARY, Tag } from "./ui";

/** Keystroke quiet period before a draft is written to storage. */
const AUTOSAVE_DELAY_MS = 700;
/** Timer ticks between persisting elapsed time. */
const ELAPSED_PERSIST_EVERY = 15;

/** `00:04:12` — hours:minutes:seconds, counting up. */
function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(
    Math.floor((seconds % 3600) / 60),
  )}:${pad(seconds % 60)}`;
}

/**
 * Two-pane writing screen (writing-spec §三).
 *
 * The timer counts up in neutral grey with no threshold of any kind — §五.5
 * makes that explicit, and it is the same rule Reading and Listening already
 * follow. Nothing on this screen scores, grades, predicts or evaluates the
 * learner's writing; the module's scope is draft management and process
 * tracking (§五.8).
 */
export function WritingWorkspace({ set }: { set: WritingSetDto }) {
  const [session, setSession] = useState<WritingSessionState | null>(null);
  // Local storage is unreadable until after mount. Until it has been read the
  // editor is read-only, so a keystroke can never be overwritten by the load.
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState(set.tasks[0]?.position ?? 1);
  const [taskHidden, setTaskHidden] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = loadWritingSession(set.slug);
    setSession(stored ?? emptySession(set.slug));
    setElapsed(stored?.elapsedSeconds ?? 0);
    setSaved(Boolean(stored));
    setShowResult(Boolean(stored?.completedAt));
    setReady(true);
  }, [set.slug]);

  // Count-up timer. Paused while the result panel is open — the sitting is over
  // and a still-running clock would be measuring nothing.
  useEffect(() => {
    if (!ready || showResult) return;
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      setElapsed((current) => {
        const next = current + 1;
        if (ticks % ELAPSED_PERSIST_EVERY === 0) saveElapsed(set.slug, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ready, showResult, set.slug]);

  // Flush a pending draft when the component goes away, so navigating out never
  // costs the last few characters.
  useEffect(() => () => flush.current?.(), []);

  const active = useMemo(
    () => set.tasks.find((task) => task.position === position) ?? set.tasks[0],
    [set.tasks, position],
  );

  const onType = useCallback(
    (text: string) => {
      if (!active) return;
      // The editor is optimistic: state updates on every keystroke and storage
      // catches up, so the caret never waits for localStorage.
      setSession((current) =>
        withTaskText(current ?? emptySession(set.slug), active.position, text),
      );
      setSaved(false);

      if (pending.current) clearTimeout(pending.current);
      const write = () => {
        pending.current = null;
        flush.current = null;
        setSession(saveTaskText(set.slug, active.position, text));
        setSaved(true);
      };
      flush.current = write;
      pending.current = setTimeout(write, AUTOSAVE_DELAY_MS);
    },
    [active, set.slug],
  );

  function onComplete() {
    // Write any pending keystrokes first: the completion rule reads storage,
    // and a debounce must never be the reason a draft counts as empty.
    flush.current?.();
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
    }
    saveElapsed(set.slug, elapsed);
    const completed = completeWritingSession(set.slug);
    if (!completed) return;
    setSession(completed);
    setShowResult(true);
  }

  function onReopen() {
    const reopened = reopenWritingSession(set.slug);
    if (reopened) setSession(reopened);
    setShowResult(false);
  }

  if (!active) return null;

  const words = totalWords(session);
  const started = startedTaskCount(session);

  if (showResult) {
    return (
      <ResultPanel
        set={set}
        session={session}
        elapsed={elapsed}
        onReopen={onReopen}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TopBar
        title={set.titleEn}
        started={started}
        total={set.tasks.length}
        elapsed={elapsed}
      />

      <div
        className={`grid gap-4 ${taskHidden ? "" : "lg:grid-cols-2 lg:items-start"}`}
      >
        {taskHidden ? null : (
          <TaskPane
            task={active}
            onHide={() => setTaskHidden(true)}
            singleTask={set.tasks.length === 1}
          />
        )}

        <EditorPane
          task={active}
          text={taskText(session, active.position)}
          readOnly={!ready}
          saved={saved}
          taskHidden={taskHidden}
          onShowTask={() => setTaskHidden(false)}
          onType={onType}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-stage-border pt-4">
        {set.tasks.length > 1 ? (
          <TaskSwitch
            tasks={set.tasks}
            position={active.position}
            onSwitch={setPosition}
            session={session}
          />
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-3">
          {words === 0 ? (
            <span className="text-stage-2xs text-stage-fg-subtle">
              写下你的答案后就可以完成本次练习。
            </span>
          ) : null}
          <button
            type="button"
            onClick={onComplete}
            disabled={!canComplete(session)}
            className={BUTTON_PRIMARY}
          >
            完成本次练习
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Top information bar (writing-spec §三).
 *
 * Left: back arrow and title. Middle: `{X}/{Y} tasks`. Right: the count-up
 * clock in neutral grey — no threshold, no colour change, no alarm.
 */
function TopBar({
  title,
  started,
  total,
  elapsed,
}: {
  title: string;
  started: number;
  total: number;
  elapsed: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-stage-lg border border-stage-border bg-stage-bg px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/ielts-lab/writing"
          aria-label="返回任务列表"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-stage-sm border border-stage-border text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-border-strong hover:text-stage-fg"
        >
          <span aria-hidden>←</span>
        </Link>
        <h1 className="min-w-0 truncate text-stage-sm font-semibold text-stage-fg">
          {title}
        </h1>
      </div>
      <p className="text-stage-2xs tabular-nums text-stage-fg-muted">
        {started}/{total} tasks
      </p>
      <p className="font-stage-mono text-stage-xs tabular-nums text-stage-fg-muted">
        <span className="sr-only">已用时 </span>
        {clock(elapsed)}
      </p>
    </header>
  );
}

/**
 * Left pane: the task itself (writing-spec §三 左栏).
 *
 * `Hide Task` collapses it so the editor owns the full width — the one control
 * on this screen borrowed wholesale from the reference, and the reason it earns
 * its place is that re-reading the prompt is voluntary once drafting starts.
 */
function TaskPane({
  task,
  onHide,
  singleTask,
}: {
  task: WritingTaskDto;
  onHide: () => void;
  singleTask: boolean;
}) {
  return (
    <section
      aria-label="题目"
      className="rounded-stage-lg border border-stage-border bg-stage-bg p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {singleTask ? null : <Tag>{WRITING_TASK_KIND_LABELS[task.taskKind]}</Tag>}
          {task.figureKind ? (
            <Tag>{WRITING_FIGURE_KIND_LABELS[task.figureKind]}</Tag>
          ) : null}
        </div>
        <button type="button" onClick={onHide} className={BUTTON_QUIET}>
          Hide Task
        </button>
      </div>

      {task.figure ? (
        // A plain <img>: the figure is a remote Directus asset, and next/image
        // would need a remotePatterns entry in next.config for no benefit the
        // learner can see. Explicit dimensions when Directus reports them keep
        // the pane from reflowing as it loads.
        <img
          src={task.figure.url}
          alt={task.figure.alt}
          width={task.figure.width ?? undefined}
          height={task.figure.height ?? undefined}
          loading="lazy"
          className="mb-3 h-auto w-full rounded-stage-sm border border-stage-border"
        />
      ) : null}

      <p className="whitespace-pre-line text-stage-xs text-stage-fg-body">
        {task.prompt}
      </p>
      <p className="mt-3 border-t border-stage-border pt-3 text-stage-2xs text-stage-fg-muted">
        Write at least {task.wordTarget} words.
      </p>
    </section>
  );
}

/** Right pane: the editor, its live word count and the autosave line. */
function EditorPane({
  task,
  text,
  readOnly,
  saved,
  taskHidden,
  onShowTask,
  onType,
}: {
  task: WritingTaskDto;
  text: string;
  readOnly: boolean;
  saved: boolean;
  taskHidden: boolean;
  onShowTask: () => void;
  onType: (next: string) => void;
}) {
  // Counted from the live text rather than from the stored session, so the
  // readout tracks the caret instead of the autosave debounce. Same function
  // the completion rule uses, so the two can never disagree.
  const words = countWords(text);
  const reached = words >= task.wordTarget;
  const label = `${WRITING_TASK_KIND_LABELS[task.taskKind]} 答案`;

  return (
    <section
      aria-label="写作区"
      className="flex flex-col rounded-stage-lg border border-stage-border bg-stage-bg p-4"
    >
      {taskHidden ? (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onShowTask} className={BUTTON_QUIET}>
            Show Task
          </button>
        </div>
      ) : null}

      <label className="sr-only" htmlFor="writing-editor">
        {label}
      </label>
      <textarea
        id="writing-editor"
        value={text}
        readOnly={readOnly}
        aria-busy={readOnly}
        onChange={(event) => onType(event.target.value)}
        placeholder="在这里输入你的答案…"
        spellCheck={false}
        className="min-h-[22rem] w-full resize-y rounded-stage-sm border border-stage-border-strong bg-stage-bg p-3 text-stage-xs leading-relaxed text-stage-fg-body outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus lg:min-h-[26rem]"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* Under target is stated, never warned: neutral text only, no red
            (writing-spec §五.6). Reaching it is positive, and says so in words
            as well as in colour. */}
        <p
          className={`text-stage-2xs tabular-nums ${
            reached ? "text-stage-success" : "text-stage-fg-muted"
          }`}
          aria-live="off"
        >
          {words} / {task.wordTarget} words
          {reached ? " · 已达标" : ""}
        </p>
        {saved ? (
          <p className="text-stage-2xs text-stage-fg-subtle">草稿已自动保存</p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Task 1 / Task 2 switch (writing-spec §三 底部).
 *
 * Both tasks belong to one session and one storage entry, so switching is a
 * view change: neither side is cleared, saved or discarded on the way.
 */
function TaskSwitch({
  tasks,
  position,
  onSwitch,
  session,
}: {
  tasks: WritingTaskDto[];
  position: number;
  onSwitch: (next: number) => void;
  session: WritingSessionState | null;
}) {
  return (
    <div
      role="tablist"
      aria-label="任务切换"
      className="inline-flex rounded-stage-pill border border-stage-border bg-stage-bg-soft p-1"
    >
      {tasks.map((task) => {
        const active = task.position === position;
        const written = session?.tasks[String(task.position)]?.wordCount ?? 0;
        return (
          <button
            key={task.position}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSwitch(task.position)}
            className={`rounded-stage-pill px-4 py-1.5 text-stage-xs transition-colors duration-stage-fast ${
              active
                ? "bg-stage-bg font-medium text-stage-primary shadow-stage-xs"
                : "text-stage-fg-muted hover:text-stage-fg"
            }`}
          >
            {WRITING_TASK_KIND_LABELS[task.taskKind]}
            {written > 0 ? (
              <span className="ml-1.5 text-stage-2xs tabular-nums text-stage-fg-subtle">
                {written}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * What 完成本次练习 leads to.
 *
 * A record of what the learner did — words written, time spent — and the exits.
 * Not a submission, not a result: nothing here is scored, and the button that
 * got here says so.
 */
function ResultPanel({
  set,
  session,
  elapsed,
  onReopen,
}: {
  set: WritingSetDto;
  session: WritingSessionState | null;
  elapsed: number;
  onReopen: () => void;
}) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="rounded-stage-lg border border-stage-border bg-stage-bg p-5">
      <h1 className="text-stage-h4 font-semibold text-stage-fg">
        本次练习已完成
      </h1>
      <p className="mt-1 text-stage-xs text-stage-fg-muted">
        {set.titleEn} · 用时 {minutes} 分 {seconds} 秒
      </p>

      <ul className="mt-4 divide-y divide-stage-border border-y border-stage-border">
        {set.tasks.map((task) => {
          const written = session?.tasks[String(task.position)]?.wordCount ?? 0;
          return (
            <li
              key={task.position}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
            >
              <span className="text-stage-xs text-stage-fg-body">
                {WRITING_TASK_KIND_LABELS[task.taskKind]}
              </span>
              <span className="text-stage-2xs tabular-nums text-stage-fg-muted">
                {written} / {task.wordTarget} words
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-stage-2xs text-stage-fg-subtle">
        草稿保存在本机浏览器，随时可以回来继续修改。
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {set.hasModelAnswer ? (
          <Link
            href={`/ielts-lab/writing/${set.slug}/model`}
            className={BUTTON_PRIMARY}
          >
            查看参考范文
          </Link>
        ) : null}
        <Link href="/ielts-lab/writing" className={BUTTON_SECONDARY}>
          返回任务列表
        </Link>
        <button type="button" onClick={onReopen} className={BUTTON_QUIET}>
          继续修改
        </button>
      </div>
    </div>
  );
}
