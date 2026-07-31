"use client";

/**
 * What a submitted paper reports back.
 *
 * Three deliberate absences.
 *
 * No band score. Converting 6/8 on one Part-1 set into a 6.5 would be an
 * invented mapping presented as an official one (ruling C1 bans the estimate
 * system outright), and a real conversion needs a full four-part paper anyway.
 * The report says what it knows: how many were right, and which.
 *
 * No accepted answer beside a *correct* answer. The candidate already wrote it;
 * printing the key next to it adds a line of text and no information. Wrong
 * rows print the key, because that is the row where it is the point.
 *
 * No colour without a word. `正确` / `错误` is on every row next to the tick or
 * cross, so the report survives greyscale and colour blindness — the same rule
 * `StatusDot` follows on the overview.
 */
import type { ScoreReport } from "@/lib/ielts/listening-types";
import { formatClock } from "@/lib/ielts/listening-ui-utils";

export function ListeningResult({
  report,
  elapsedSec,
}: {
  report: ScoreReport;
  elapsedSec: number;
}) {
  return (
    <section
      aria-label="本卷结果"
      className="rounded-stage-lg border border-stage-border bg-stage-bg p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-stage-h4 font-semibold text-stage-fg">本卷结果</h2>
          <p className="mt-1 text-stage-xs text-stage-fg-muted">
            答对题数与用时。本卷不换算分数。
          </p>
        </div>
        <dl className="flex items-end gap-6">
          <div>
            <dt className="text-stage-2xs text-stage-fg-muted">答对</dt>
            <dd className="mt-0.5 text-stage-h3 font-semibold tabular-nums text-stage-fg">
              {report.correct}
              <span className="text-stage-fg-muted">/{report.total}</span>
            </dd>
          </div>
          <div>
            <dt className="text-stage-2xs text-stage-fg-muted">用时</dt>
            <dd className="mt-0.5 font-stage-mono text-stage-h4 tabular-nums text-stage-fg">
              {formatClock(elapsedSec)}
            </dd>
          </div>
        </dl>
      </div>

      <ol className="mt-5 border-t border-stage-border">
        {report.byQuestion.map((question) => (
          <li
            key={question.no}
            className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 gap-y-1 border-b border-stage-border py-2.5"
          >
            <span className="font-stage-mono text-stage-2xs tabular-nums text-stage-fg-muted">
              {question.no}
            </span>

            <span className="min-w-0">
              {question.given === "" ? (
                <span className="text-stage-xs text-stage-fg-subtle">
                  未作答
                </span>
              ) : (
                <span
                  className={`text-stage-xs ${
                    question.correct ? "text-stage-success" : "text-stage-danger"
                  }`}
                >
                  {question.given}
                </span>
              )}
              {/*
                Only on a wrong row. `accepted` may hold several forms of the
                same answer (a postcode with and without its space), and all of
                them are shown: a candidate who wrote the other accepted form
                and still got it wrong deserves to see why.
              */}
              {question.correct ? null : (
                <span className="ml-2 text-stage-2xs text-stage-fg-muted">
                  正确答案：{question.accepted.join(" / ")}
                </span>
              )}
            </span>

            <span
              className={`text-stage-2xs font-medium ${
                question.correct ? "text-stage-success" : "text-stage-danger"
              }`}
            >
              <span aria-hidden className="mr-1">
                {question.correct ? "✓" : "✕"}
              </span>
              {question.correct ? "正确" : "错误"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
