"use client";

import type { ReactNode } from "react";
import { buildQuestionTypeStats } from "@/lib/ielts/analytics";
import { UNCLASSIFIED } from "@/lib/ielts/question-types";
import type { PracticeRecord } from "@/lib/ielts/types";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function accuracyTone(accuracy: number): string {
  if (accuracy >= 0.75) return "text-stage-success";
  if (accuracy >= 0.5) return "text-stage-warning";
  return "text-red-600";
}

/**
 * Summary shown over the runner once an attempt is scored.
 *
 * The runner renders its own per-question table and explanations inside the
 * frame; this deliberately does not repeat them. It answers the questions the
 * frame cannot: how this attempt compares by question type, and what to do next.
 */
export function ResultPanel({
  record,
  title,
  actions,
  note,
}: {
  record: PracticeRecord;
  title: string;
  actions: ReactNode;
  note?: ReactNode;
}) {
  const byType = buildQuestionTypeStats([record]).filter(
    (stat) => stat.type !== UNCLASSIFIED,
  );
  const accuracy = Math.round(record.accuracy * 100);

  return (
    <div className="border-b border-stage-border bg-stage-bg-soft">
      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-stage-fg-muted">{title}</p>
            <p className="truncate text-sm font-medium">{record.title}</p>
          </div>

          <dl className="flex items-center gap-5">
            <div>
              <dt className="text-xs text-stage-fg-muted">正确率</dt>
              <dd
                className={`text-2xl font-semibold tabular-nums ${accuracyTone(
                  record.accuracy,
                )}`}
              >
                {accuracy}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stage-fg-muted">得分</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {record.correctAnswers}
                <span className="text-base text-stage-fg-muted">
                  /{record.totalQuestions}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stage-fg-muted">用时</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {formatDuration(record.duration)}
              </dd>
            </div>
          </dl>
        </div>

        {byType.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-stage-border pt-3 text-xs">
            {byType.map((stat) => (
              <li key={stat.type} className="text-stage-fg-muted">
                {stat.label}{" "}
                <span
                  className={`font-semibold tabular-nums ${accuracyTone(
                    stat.accuracy / 100,
                  )}`}
                >
                  {stat.correct}/{stat.attempted}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {note ? <div className="mt-3 text-xs text-stage-fg-muted">{note}</div> : null}

        <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
      </div>
    </div>
  );
}
