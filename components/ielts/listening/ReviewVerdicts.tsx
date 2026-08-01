"use client";

/**
 * 回顾模式 — the marking, moved to the question it marks.
 *
 * `ListeningResult` already reports every question in one table at the top of
 * the page. This is the same data and deliberately not a second source of it:
 * both read the one `ScoreReport` the page scored. What differs is where the
 * learner is standing when they read it. A table at the top answers "how did I
 * do"; a strip under the card answers "why was *this* wrong", with the options
 * and the form row still on screen above it.
 *
 * The verdict is never colour alone — `正确` / `错误` is printed on every row,
 * the rule `ListeningResult` and `StatusDot` both follow — so the strip
 * survives greyscale and colour blindness.
 *
 * Correct rows do not print the key. The candidate wrote it; repeating it back
 * is a line of text carrying no information. Wrong rows print every accepted
 * form, because a candidate who wrote one of the *other* accepted spellings and
 * still got it wrong deserves to see why.
 */
import type { QuestionGroup, QuestionScore } from "@/lib/ielts/listening-types";
import { groupQuestionNumbers } from "@/lib/ielts/listening-ui-utils";

export function ReviewVerdicts({
  group,
  /** The page's one report, keyed by question number. */
  scores,
}: {
  group: QuestionGroup;
  scores: Map<number, QuestionScore>;
}) {
  const rows = groupQuestionNumbers(group)
    .map((no) => scores.get(no))
    .filter((score): score is QuestionScore => score !== undefined);

  if (rows.length === 0) return null;

  return (
    <div
      // Named rather than anonymous: in review mode the page is a stack of
      // cards each followed by one of these, and a screen reader arriving at
      // the strip needs to know it belongs to the card above.
      aria-label="本题回顾"
      className="-mt-px rounded-b-stage-lg border border-t-0 border-stage-border bg-stage-bg-soft px-5 py-3"
    >
      <ol className="grid gap-1.5">
        {rows.map((score) => (
          <li
            key={score.no}
            className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 text-stage-2xs"
          >
            <span className="font-stage-mono tabular-nums text-stage-fg-muted">
              {score.no}
            </span>

            <span className="min-w-0">
              {score.given === "" ? (
                <span className="text-stage-fg-subtle">未作答</span>
              ) : (
                <span
                  className={
                    score.correct ? "text-stage-success" : "text-stage-danger"
                  }
                >
                  你的答案：{score.given}
                </span>
              )}
              {score.correct ? null : (
                <span className="ml-2 text-stage-fg-muted">
                  正确答案：{score.accepted.join(" / ")}
                </span>
              )}
            </span>

            <span
              className={`font-medium ${
                score.correct ? "text-stage-success" : "text-stage-danger"
              }`}
            >
              <span aria-hidden className="mr-1">
                {score.correct ? "✓" : "✕"}
              </span>
              {score.correct ? "正确" : "错误"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
