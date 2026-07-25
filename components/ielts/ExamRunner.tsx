"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  isTrustedRunnerEvent,
  runnerUrl,
  type PracticeCompleteData,
  type RunnerEnvelope,
} from "@/lib/ielts/messages";
import { saveRecord, toPracticeRecord } from "@/lib/ielts/storage";
import type { ExamSummary } from "@/lib/ielts/types";

type Status = "loading" | "ready" | "submitted";

/**
 * Hosts the original IELTS exam runner in a same-origin iframe and bridges its
 * postMessage protocol to STAGE.
 *
 * The runner is used unmodified: it renders the passage and questions, owns the
 * timer, highlights, notes and drag-and-drop, and scores the attempt against its
 * own answer key. This component only listens for the result and persists it,
 * which is why the whole engine ports without a rewrite.
 */
export function ExamRunner({ exam }: { exam: ExamSummary }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<PracticeCompleteData | null>(null);

  const handleComplete = useCallback(
    (data: PracticeCompleteData) => {
      setResult(data);
      setStatus("submitted");
      saveRecord(
        toPracticeRecord(data, {
          examId: exam.id,
          title: exam.title,
          category: exam.category,
        }),
      );
    },
    [exam.id, exam.title, exam.category],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // The runner posts with targetOrigin "*", so every message is untrusted
      // until both the origin and the source window have been verified.
      if (!isTrustedRunnerEvent(event, frameRef.current)) return;

      const envelope = event.data as RunnerEnvelope<PracticeCompleteData>;
      switch (envelope.type) {
        case "SESSION_READY":
          setStatus((current) => (current === "loading" ? "ready" : current));
          break;
        case "PRACTICE_COMPLETE":
          handleComplete(envelope.data ?? {});
          break;
        default:
          // Suite / endless / review messages are out of MVP scope.
          break;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleComplete]);

  const score = result?.scoreInfo;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stage-border px-4 py-3">
        <div className="min-w-0">
          <Link
            href="/ielts-lab"
            className="text-sm text-stage-fg-muted transition-colors hover:text-stage-fg"
          >
            ← 返回题库
          </Link>
          <h1 className="truncate text-base font-semibold">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {status === "loading" && (
            <span className="text-stage-fg-muted">加载中…</span>
          )}
          {score && (
            <span className="rounded-md bg-stage-primary/10 px-3 py-1 font-semibold text-stage-primary">
              {score.correct} / {score.total} · {score.percentage}%
            </span>
          )}
          <Link
            href="/ielts-lab/history"
            className="text-stage-fg-muted transition-colors hover:text-stage-fg"
          >
            练习记录
          </Link>
        </div>
      </div>

      <iframe
        ref={frameRef}
        src={runnerUrl(exam.id, exam.dataKey)}
        title={exam.title}
        className="w-full flex-1 border-0"
        // The runner is same-origin by design: the bridge needs contentWindow
        // identity checks, which a sandboxed opaque origin would break.
        allow="clipboard-write"
      />
    </div>
  );
}
