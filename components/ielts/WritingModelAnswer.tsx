"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WRITING_TASK_KIND_LABELS,
  type WritingModelAnswerDto,
} from "@/lib/writing-data";
import {
  isModelAnswerUnlocked,
  loadWritingSession,
} from "@/lib/ielts/writing-session";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, EmptyNote, PageHeader } from "./ui";

/**
 * Model answers, behind the "try first, then unlock" rule (writing-spec §四).
 *
 * The rule now spans the whole Lab — Reading explanations, Listening
 * transcripts, Writing model answers — so this screen states it rather than
 * re-deciding it: nothing is rendered until the learner's own session says they
 * completed their writing with a non-zero word count.
 *
 * The gate is evaluated after mount, and the answers are not in the DOM before
 * it passes. What this cannot do is hide the prose from the page payload: STAGE
 * is a static site with no learner session to check on the server. That limit
 * is recorded in the approved data contract (§3.3) rather than papered over.
 */
export function WritingModelAnswer({
  slug,
  title,
  answers,
}: {
  slug: string;
  title: string;
  answers: WritingModelAnswerDto[];
}) {
  // Three states, not two: "not yet read" must never render as "locked" or as
  // "unlocked", or the screen flashes the wrong one on every load.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(isModelAnswerUnlocked(loadWritingSession(slug)));
  }, [slug]);

  return (
    <div>
      <PageHeader title="参考范文" subtitle={title} />

      {unlocked === null ? (
        <p className="text-stage-xs text-stage-fg-muted">读取本机练习记录…</p>
      ) : !unlocked ? (
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
      ) : answers.length === 0 ? (
        <EmptyNote>这道题还没有配参考范文。</EmptyNote>
      ) : (
        <div className="flex flex-col gap-4">
          {answers.map((answer) => (
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
