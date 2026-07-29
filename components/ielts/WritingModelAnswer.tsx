"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  WRITING_TASK_KIND_LABELS,
  type WritingModelAnswerDto,
} from "@/lib/writing-data";
import {
  isModelAnswerUnlocked,
  loadWritingSession,
} from "@/lib/ielts/writing-session";
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  BUTTON_SECONDARY,
  EmptyNote,
  PageHeader,
} from "./ui";

/**
 * Model answers, behind the "try first, then unlock" rule (writing-spec §四).
 *
 * The rule spans the whole Lab — Reading explanations, Listening transcripts,
 * Writing model answers — so this screen applies it rather than re-deciding it:
 * nothing is shown until the learner's own session says they completed their
 * writing with a non-zero word count.
 *
 * The answers are NOT props. This component receives a slug and fetches the
 * prose from `/api/ielts/writing/{slug}/model-answer` only once the gate has
 * passed, so a learner who has not written anything never receives the text at
 * all — the page they load contains no model answer to reveal.
 */

/** Everything this screen can be showing, as one value. */
type ViewState =
  | { kind: "checking" }
  | { kind: "locked" }
  | { kind: "loading" }
  | { kind: "ready"; answers: WritingModelAnswerDto[] }
  | { kind: "failed" };

export function WritingModelAnswer({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  // "checking" is a state of its own: rendering the gate or the answers before
  // local storage has been read would flash the wrong one on every load.
  const [view, setView] = useState<ViewState>({ kind: "checking" });

  const open = useCallback(
    (signal?: AbortSignal) => {
      // The gate is re-evaluated here, immediately before the request. It is
      // the only thing that can cause a fetch, so an unfinished draft never
      // reaches the endpoint.
      if (!isModelAnswerUnlocked(loadWritingSession(slug))) {
        setView({ kind: "locked" });
        return;
      }

      setView({ kind: "loading" });
      fetch(`/api/ielts/writing/${encodeURIComponent(slug)}/model-answer`, {
        signal,
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const body = (await response.json()) as {
            answers?: WritingModelAnswerDto[];
          };
          setView({ kind: "ready", answers: body.answers ?? [] });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setView({ kind: "failed" });
        });
    },
    [slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    open(controller.signal);
    return () => controller.abort();
  }, [open]);

  return (
    <div>
      <PageHeader title="参考范文" subtitle={title} />

      {view.kind === "checking" ? (
        <p className="text-stage-xs text-stage-fg-muted">读取本机练习记录…</p>
      ) : view.kind === "locked" ? (
        <div className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-10 text-center">
          <p className="text-stage-xs text-stage-fg-body">
            先完成你自己的写作，再看参考范文。
          </p>
          <p className="mx-auto mt-2 max-w-stage-measure-lead text-stage-2xs text-stage-fg-subtle">
            自己写过一遍之后再对照，范文才有参考价值。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href={`/ielts-lab/writing/${slug}`} className={BUTTON_PRIMARY}>
              去写这道题
            </Link>
            <Link href="/ielts-lab/writing" className={BUTTON_SECONDARY}>
              返回任务列表
            </Link>
          </div>
        </div>
      ) : view.kind === "loading" ? (
        <p className="text-stage-xs text-stage-fg-muted">读取参考范文…</p>
      ) : view.kind === "failed" ? (
        <div className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-10 text-center">
          <p className="text-stage-xs text-stage-fg-body">
            参考范文没有读取成功。
          </p>
          <div className="mt-4">
            <button type="button" onClick={() => open()} className={BUTTON_QUIET}>
              重试
            </button>
          </div>
        </div>
      ) : view.answers.length === 0 ? (
        <EmptyNote>这道题还没有配参考范文。</EmptyNote>
      ) : (
        <div className="flex flex-col gap-4">
          {view.answers.map((answer) => (
            <article
              key={answer.position}
              className="rounded-stage-lg border border-stage-border bg-stage-bg p-5"
            >
              <h2 className="text-stage-h4 font-semibold text-stage-fg">
                {WRITING_TASK_KIND_LABELS[answer.taskKind]}
              </h2>
              <p className="mt-3 whitespace-pre-line text-stage-xs leading-relaxed text-stage-fg-body">
                {answer.answer}
              </p>
              {answer.note ? (
                <p className="mt-4 rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-2 text-stage-2xs text-stage-fg-body">
                  {answer.note}
                </p>
              ) : null}
              {answer.source ? (
                <p className="mt-3 text-stage-2xs text-stage-fg-subtle">
                  来源：{answer.source}
                </p>
              ) : null}
            </article>
          ))}

          <div className="flex flex-wrap gap-3">
            <Link href={`/ielts-lab/writing/${slug}`} className={BUTTON_SECONDARY}>
              回到我的答案
            </Link>
            <Link href="/ielts-lab/writing" className={BUTTON_SECONDARY}>
              返回任务列表
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
