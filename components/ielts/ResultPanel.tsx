"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { buildQuestionTypeStats } from "@/lib/ielts/analytics";
import { questionTypeLabel, UNCLASSIFIED } from "@/lib/ielts/question-types";
import type { AnswerComparison, PracticeRecord } from "@/lib/ielts/types";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Badge,
  accuracyText,
} from "./ui";

/**
 * Verbatim from the Reading player spec §四: `用时 {MM} 分 {SS} 秒`.
 *
 * Minutes are not padded (the spec's own example reads 18 分 42 秒); seconds
 * are, so the two-digit tail is stable as the number rolls over.
 */
function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `用时 ${minutes} 分 ${String(total % 60).padStart(2, "0")} 秒`;
}

function answerText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = (value ?? "").toString().trim();
  return text.length > 0 ? text : "（未作答）";
}

/** Numeric part of a question id, for the 题号 column. */
function questionNumber(id: string): string {
  return id.replace(/\D+/g, "") || id;
}

/**
 * Result transition page (Reading player spec §三.2).
 *
 * Shown over the runner once an attempt is scored: accuracy and elapsed time,
 * the per-question outcome list, and the two exits the spec names — 返回题库 as
 * the secondary and 查看复盘 as the primary, drawn more strongly when there is
 * something to review.
 *
 * The runner renders its own explanations inside the frame; this deliberately
 * does not repeat them. What it adds is what the frame cannot say: how the
 * attempt went by question type, and where to go next.
 */
export function ResultPanel({
  record,
  title,
  extraActions,
  note,
}: {
  record: PracticeRecord;
  title: string;
  /** Flow-specific follow-ups (next passage, suite overview, retry). */
  extraActions?: ReactNode;
  note?: ReactNode;
}) {
  const byType = buildQuestionTypeStats([record]).filter(
    (stat) => stat.type !== UNCLASSIFIED,
  );
  const questions = Object.entries(record.answerComparison ?? {});
  const wrongCount = questions.filter(([, entry]) => !entry.isCorrect).length;

  return (
    <div className="border-b border-stage-border bg-stage-bg">
      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="text-stage-2xs uppercase tracking-stage-eyebrow text-stage-fg-subtle">
              {title}
            </p>
            <p className="mt-1 truncate text-stage-sm font-medium text-stage-fg">
              {record.title}
            </p>
          </div>

          <dl className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <dt className="text-stage-xs text-stage-fg-muted">正确率</dt>
              <dd className="text-stage-h2 font-semibold tabular-nums text-stage-fg">
                {accuracyText(record.accuracy)}
              </dd>
            </div>
            <div>
              <dt className="text-stage-xs text-stage-fg-muted">答对题数</dt>
              <dd className="text-stage-h3 font-semibold tabular-nums text-stage-fg">
                {record.correctAnswers}
                <span className="text-stage-sm text-stage-fg-subtle">
                  /{record.totalQuestions}
                </span>
              </dd>
            </div>
            <p className="text-stage-xs tabular-nums text-stage-fg-muted">
              {formatElapsed(record.duration)}
            </p>
          </dl>
        </div>

        {byType.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-stage-border pt-3 text-stage-2xs">
            {byType.map((stat) => (
              <li key={stat.type} className="text-stage-fg-muted">
                {stat.label}{" "}
                <span className="font-semibold tabular-nums text-stage-fg">
                  {stat.correct}/{stat.attempted}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {questions.length > 0 ? (
          <details open className="group mt-4">
            <summary className="cursor-pointer text-stage-xs text-stage-fg-muted [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">展开逐题结果 ▾</span>
              <span className="hidden group-open:inline">收起逐题结果 ▴</span>
            </summary>
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-stage-md border border-stage-border">
              {questions.map(([questionId, entry]) => (
                <ResultRow
                  key={questionId}
                  questionId={questionId}
                  entry={entry}
                />
              ))}
            </ul>
          </details>
        ) : null}

        {note ? (
          <div className="mt-4 text-stage-xs text-stage-fg-muted">{note}</div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Spec §三.2: 返回题库 secondary, 查看复盘 primary — and the primary
              carries more weight when there are mistakes to look at. */}
          <Link
            href={`/ielts-lab/review/${record.id}`}
            className={wrongCount > 0 ? BUTTON_PRIMARY : BUTTON_SECONDARY}
          >
            查看复盘
            {wrongCount > 0 ? (
              <span className="tabular-nums">{` · ${wrongCount} 道错题`}</span>
            ) : null}
          </Link>
          <Link href="/ielts-lab/browse" className={BUTTON_SECONDARY}>
            返回题库
          </Link>
          {extraActions}
        </div>
      </div>
    </div>
  );
}

/**
 * One question's outcome: number, type, right/wrong, my answer vs the key.
 *
 * The answer key is visible here because the learner has just submitted their
 * own attempt — the rule the product enforces is that nothing is revealed
 * *before* that (supplement §五.4), not after.
 */
function ResultRow({
  questionId,
  entry,
}: {
  questionId: string;
  entry: AnswerComparison;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stage-border px-3 py-2 text-stage-2xs last:border-b-0">
      <span className="w-7 shrink-0 tabular-nums text-stage-fg-subtle">
        {questionNumber(questionId)}
      </span>
      <Badge tone={entry.isCorrect ? "positive" : "warning"}>
        {entry.isCorrect ? "正确" : "错误"}
      </Badge>
      {entry.questionType ? (
        <span className="shrink-0 text-stage-fg-subtle">
          {questionTypeLabel(entry.questionType)}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-stage-fg-body">
        {answerText(entry.userAnswer)}
        {!entry.isCorrect ? (
          <span className="text-stage-fg-muted">
            {" → "}
            {answerText(entry.correctAnswer)}
          </span>
        ) : null}
      </span>
    </li>
  );
}
