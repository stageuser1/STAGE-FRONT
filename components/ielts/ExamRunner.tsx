"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isTrustedRunnerEvent,
  runnerUrl,
  sendInitSession,
  sendReplayRecord,
  type PracticeCompleteData,
  type RunnerEnvelope,
} from "@/lib/ielts/messages";
import { buildProgressIndex, pickRandomExam } from "@/lib/ielts/progress";
import { questionTypeOf } from "@/lib/ielts/question-types";
import {
  clearSession,
  loadSessionOfKind,
  practiceHref,
  saveSession,
  type SessionFlow,
  type SuiteSession,
} from "@/lib/ielts/session";
import { getRecord, loadRecords, saveRecord, toPracticeRecord } from "@/lib/ielts/storage";
import type { ExamSummary, PracticeRecord, SuiteRef } from "@/lib/ielts/types";
import { ResultPanel } from "./ResultPanel";

type Status = "loading" | "ready" | "submitted" | "review";

const ACTION_PRIMARY =
  "rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover";
const ACTION_SECONDARY =
  "rounded-stage-md border border-stage-border bg-stage-bg px-4 py-2 text-sm transition-colors hover:border-stage-primary";

export interface ExamRunnerProps {
  exam: ExamSummary;
  /** Multi-passage flow this attempt belongs to, from `?flow=`. */
  flow?: SessionFlow;
  /** Record id from `?review=`. Opens the attempt read-only instead of fresh. */
  reviewRecordId?: string;
}

/**
 * Hosts the original IELTS exam runner in a same-origin iframe and bridges its
 * postMessage protocol to STAGE.
 *
 * The runner is used unmodified: it renders the passage and questions, owns the
 * timer, highlights, notes, question palette and drag-and-drop, and scores the
 * attempt against its own answer key. This component owns everything around
 * that — the handshake, persistence, review, and what happens after a submit.
 */
export function ExamRunner({ exam, flow, reviewRecordId }: ExamRunnerProps) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [suite, setSuite] = useState<SuiteSession | null>(null);
  const [busy, setBusy] = useState(false);

  // The attempt being reviewed. Read once on mount: localStorage is only
  // available in the browser, and the value must be ready before SESSION_READY.
  const reviewRecordRef = useRef<PracticeRecord | null>(null);
  const [reviewMissing, setReviewMissing] = useState(false);

  useEffect(() => {
    if (!reviewRecordId) return;
    const found = getRecord(reviewRecordId);
    reviewRecordRef.current = found ?? null;
    if (found) setRecord(found);
    else setReviewMissing(true);
  }, [reviewRecordId]);

  useEffect(() => {
    if (flow !== "suite") return;
    setSuite(loadSessionOfKind("suite"));
  }, [flow]);

  /**
   * Persists a finished attempt and advances the enclosing session, if any.
   *
   * The runner is the authority on scoring — `toPracticeRecord` reshapes its
   * payload and never recomputes it.
   */
  const handleComplete = useCallback(
    (data: PracticeCompleteData) => {
      // A suite entry has to be tagged with its position, which lives in the
      // session rather than in component state at the moment the message lands.
      const active = flow === "suite" ? loadSessionOfKind("suite") : null;
      const position = active?.entries.findIndex(
        (entry) => entry.examId === exam.id,
      );
      const suiteRef: SuiteRef | undefined =
        active && position !== undefined && position >= 0
          ? { id: active.id, index: position, total: active.entries.length }
          : undefined;

      const saved = toPracticeRecord(
        data,
        {
          examId: exam.id,
          title: exam.title,
          category: exam.category,
          frequency: exam.frequency,
          mode: flow ?? "single",
          suite: suiteRef,
        },
        // Annotates each question with its corpus type, which the runner does
        // not report. Scoring is untouched — this is metadata only.
        questionTypeOf,
      );
      saveRecord(saved);
      setRecord(saved);
      setStatus("submitted");

      if (flow === "endless") {
        const endless = loadSessionOfKind("endless");
        if (endless) {
          saveSession({ ...endless, completed: endless.completed + 1 });
        }
        return;
      }

      if (active && suiteRef) {
        const entries = active.entries.map((entry, index) =>
          index === suiteRef.index ? { ...entry, recordId: saved.id } : entry,
        );
        const next = {
          ...active,
          entries,
          index: Math.min(suiteRef.index + 1, entries.length - 1),
        };
        saveSession(next);
        setSuite(next);
      }
    },
    [exam.id, exam.title, exam.category, exam.frequency, flow],
  );

  /**
   * Drives the startup handshake.
   *
   * The runner never announces itself: its own init loop calls an undefined
   * `dispatchReady()` (unifiedReadingPage.js line ~2189, a bug in the vendored
   * runtime), and `sendSessionReady` is reachable only from its INIT_SESSION
   * branch. So the host has to speak first, and SESSION_READY is the reply.
   *
   * Retried on an interval rather than sent once on `load`: the frame's load
   * event can beat `bootstrap()`, which awaits the dataset script before it
   * attaches its message bridge, and a single early INIT would be dropped.
   * Sending INIT also sets `state.sessionId` inside the runner, which is what
   * makes its broken interval clear itself.
   */
  const handshakeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopHandshake = useCallback(() => {
    if (handshakeRef.current === null) return;
    clearInterval(handshakeRef.current);
    handshakeRef.current = null;
  }, []);

  const startHandshake = useCallback(() => {
    stopHandshake();
    const sessionId = `stage-${exam.id}-${Date.now()}`;
    let attempts = 0;

    const send = () => {
      attempts += 1;
      sendInitSession(frameRef.current, { examId: exam.id, sessionId });
      // ~10s. If the runner has not replied by then it failed to boot, and
      // retrying forever would only keep a timer alive on a dead page.
      if (attempts >= 20) stopHandshake();
    };

    send();
    handshakeRef.current = setInterval(send, 500);
  }, [exam.id, stopHandshake]);

  useEffect(() => stopHandshake, [stopHandshake]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // The runner posts with targetOrigin "*", so every message is untrusted
      // until both the origin and the source window have been verified.
      if (!isTrustedRunnerEvent(event, frameRef.current)) return;

      const envelope = event.data as RunnerEnvelope<PracticeCompleteData>;
      switch (envelope.type) {
        case "SESSION_READY": {
          stopHandshake();
          const replay = reviewRecordRef.current;
          if (replay) {
            sendReplayRecord(frameRef.current, {
              examId: exam.id,
              answers: replay.answers,
              correctAnswerMap: replay.correctAnswerMap,
              answerComparison: replay.answerComparison,
              correctAnswers: replay.correctAnswers,
              totalQuestions: replay.totalQuestions,
              accuracy: replay.accuracy,
              markedQuestions: replay.markedQuestions,
            });
            setStatus("review");
          } else {
            setStatus((current) => (current === "loading" ? "ready" : current));
          }
          break;
        }
        case "PRACTICE_COMPLETE":
          handleComplete(envelope.data ?? {});
          break;
        case "ENDLESS_USER_EXIT":
        case "SUITE_USER_EXIT":
          clearSession();
          router.push("/ielts-lab");
          break;
        default:
          // SIMULATION_* belongs to the runner's own multi-passage flow, which
          // STAGE does not drive: suites are sequenced here, one exam per page.
          break;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [exam.id, handleComplete, router, stopHandshake]);

  /**
   * Draws the next passage for endless mode.
   *
   * The catalog is imported on demand rather than passed as a prop: this page
   * is statically generated for 222 exams, and shipping the index with each one
   * would put the same ~30KB in every payload. As a lazy client chunk it is
   * fetched once and shared.
   */
  const goToNextEndless = useCallback(async () => {
    setBusy(true);
    try {
      const { getAllExams } = await import("@/lib/ielts/catalog");
      const session = loadSessionOfKind("endless");
      const progress = buildProgressIndex(loadRecords());
      // Recent passages are excluded so a short corpus slice cannot serve the
      // same article twice in a row; the source project does allow that repeat.
      const recent = new Set((session?.served ?? []).slice(-5));
      recent.add(exam.id);

      const pick =
        pickRandomExam(getAllExams(), progress, { exclude: recent }) ??
        pickRandomExam(getAllExams(), progress, { exclude: new Set([exam.id]) });

      if (!pick) {
        clearSession();
        router.push("/ielts-lab");
        return;
      }
      if (session) {
        saveSession({ ...session, served: [...session.served, pick.id].slice(-50) });
      }
      router.push(practiceHref(pick.id, "endless"));
    } finally {
      setBusy(false);
    }
  }, [exam.id, router]);

  const isReview = status === "review" || Boolean(reviewRecordId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stage-border px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <ExitButton
            confirmFirst={status === "ready"}
            onExit={() => {
              if (flow) clearSession();
              router.push(flow === "suite" ? "/ielts-lab/suite" : "/ielts-lab/browse");
            }}
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{exam.title}</h1>
            <p className="text-xs text-stage-fg-muted">
              {exam.category}
              {flow === "endless" ? " · 无尽模式" : ""}
              {suite
                ? ` · 套题 ${
                    (suite.entries.findIndex((e) => e.examId === exam.id) + 1) || 1
                  }/${suite.entries.length}`
                : ""}
              {isReview ? " · 回顾模式" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {status === "loading" ? (
            <span className="text-stage-fg-muted">加载中…</span>
          ) : null}
          <Link
            href="/ielts-lab/history"
            className="text-stage-fg-muted transition-colors hover:text-stage-fg"
          >
            练习记录
          </Link>
        </div>
      </div>

      {reviewMissing ? (
        <p className="border-b border-stage-border bg-stage-bg-soft px-4 py-3 text-sm text-stage-fg-muted">
          找不到这条练习记录，已按新的一次练习打开。
        </p>
      ) : null}

      {record && (status === "submitted" || status === "review") ? (
        <ResultPanel
          record={record}
          title={status === "review" ? "回顾这次练习" : "本次成绩"}
          note={
            status === "review"
              ? "答案与解析已按当时的作答还原，页面为只读。"
              : undefined
          }
          actions={
            status === "review" ? (
              <ReviewActions examId={exam.id} />
            ) : (
              <SubmittedActions
                exam={exam}
                flow={flow}
                suite={suite}
                busy={busy}
                onNextEndless={goToNextEndless}
              />
            )
          }
        />
      ) : null}

      <iframe
        ref={frameRef}
        src={runnerUrl(exam.id, exam.dataKey)}
        title={exam.title}
        onLoad={startHandshake}
        className="w-full flex-1 border-0"
        // The runner is same-origin by design: the bridge needs contentWindow
        // identity checks, which a sandboxed opaque origin would break.
        allow="clipboard-write"
      />
    </div>
  );
}

/** Back out of an attempt, confirming first if one is under way. */
function ExitButton({
  confirmFirst,
  onExit,
}: {
  confirmFirst: boolean;
  onExit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirmFirst && !window.confirm("练习尚未提交，确定要退出吗？")) return;
        onExit();
      }}
      className="shrink-0 text-sm text-stage-fg-muted transition-colors hover:text-stage-fg"
    >
      ← 退出
    </button>
  );
}

/**
 * Restarts the passage from scratch.
 *
 * A full document load, not a client navigation: after a submit the target URL
 * is the one already showing, so `router.push` is a no-op and the runner keeps
 * its scored, read-only state. Replacing the document is what actually gives
 * the learner a blank attempt.
 */
function RetryButton({
  examId,
  className,
  children,
}: {
  examId: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.location.assign(practiceHref(examId))}
      className={className}
    >
      {children}
    </button>
  );
}

function ReviewActions({ examId }: { examId: string }) {
  return (
    <>
      <RetryButton examId={examId} className={ACTION_PRIMARY}>
        重做这篇
      </RetryButton>
      <Link href="/ielts-lab/history" className={ACTION_SECONDARY}>
        返回记录
      </Link>
      <Link href="/ielts-lab/browse" className={ACTION_SECONDARY}>
        返回题库
      </Link>
    </>
  );
}

/**
 * What to do next after a submit.
 *
 * Which action leads depends on the flow: the source project's value is that
 * finishing a passage always proposes the obvious next step rather than
 * dropping the learner back on a list.
 */
function SubmittedActions({
  exam,
  flow,
  suite,
  busy,
  onNextEndless,
}: {
  exam: ExamSummary;
  flow?: SessionFlow;
  suite: SuiteSession | null;
  busy: boolean;
  onNextEndless: () => void;
}) {
  if (flow === "endless") {
    return (
      <>
        <button
          type="button"
          onClick={onNextEndless}
          disabled={busy}
          className={`${ACTION_PRIMARY} disabled:opacity-50`}
        >
          {busy ? "正在挑选…" : "下一篇"}
        </button>
        <Link href="/ielts-lab" className={ACTION_SECONDARY}>
          结束无尽模式
        </Link>
      </>
    );
  }

  if (flow === "suite" && suite) {
    const next = suite.entries.find((entry) => !entry.recordId);
    if (next) {
      return (
        <>
          <Link href={practiceHref(next.examId, "suite")} className={ACTION_PRIMARY}>
            下一篇 · {next.category}
          </Link>
          <Link href="/ielts-lab/suite" className={ACTION_SECONDARY}>
            套题概览
          </Link>
        </>
      );
    }
    return (
      <Link href="/ielts-lab/suite" className={ACTION_PRIMARY}>
        查看套题总成绩
      </Link>
    );
  }

  return (
    <>
      <RetryButton examId={exam.id} className={ACTION_SECONDARY}>
        再做一次
      </RetryButton>
      <Link href="/ielts-lab/browse" className={ACTION_PRIMARY}>
        继续练习
      </Link>
      <Link href="/ielts-lab/history" className={ACTION_SECONDARY}>
        查看记录
      </Link>
    </>
  );
}
