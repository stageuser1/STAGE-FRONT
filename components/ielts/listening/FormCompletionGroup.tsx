"use client";

/**
 * Form completion — the paper form, reprinted.
 *
 * The spec's rule for the answer area (§题目作答区) is that the input sits
 * inside the original form structure rather than in a generic question widget,
 * so this renders a titled form with labelled rows and puts the gaps where the
 * paper puts them.
 *
 * The whole design of `FormRow.segments` is what makes that possible: a row is
 * an ordered list of printed text and numbered blanks, so `Helena ___`,
 * `___ membership` and `£ ___` are the same renderer with the segments in a
 * different order. Nothing here parses a template string, and nothing here
 * infers a blank's number from its position — the number is on the segment.
 *
 * The row therefore maps `segments` in order into one baseline-aligned inline
 * flow: a `text` segment prints, a `blank` segment becomes a number chip glued
 * to a fixed-width underlined input. Glued, because the chip and its input are
 * one unit — the flow may wrap between segments on a narrow viewport, but a
 * chip must never end a line with its input on the next one.
 */
import type { FormCompletionGroup as FormCompletionGroupType } from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function FormCompletionGroup({
  group,
}: {
  group: FormCompletionGroupType;
}) {
  const { attempt, answer } = useListeningAttemptContext();
  const frozen = attempt.status === "submitted";

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.form_completion}>
      <div className="mb-4 px-10 text-center">
        <h3 className="text-stage-h4 font-semibold text-stage-fg">
          {group.formTitle}
        </h3>
        <p className="mt-1.5 text-stage-2xs italic text-stage-fg-muted">
          {group.instruction}
        </p>
      </div>

      <dl className="border-t border-stage-border">
        {group.rows.map((row, rowIndex) => (
          <div
            // Position, not the label: two rows of a real form may well carry
            // the same word ("Date"), and the number on each blank is what
            // actually identifies a gap.
            key={rowIndex}
            className="grid grid-cols-[minmax(72px,28%)_1fr] gap-x-4 border-b border-stage-border px-1 py-3"
          >
            <dt className="text-stage-xs text-stage-fg-muted">{row.label}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-2 text-stage-xs text-stage-fg-body">
              {row.segments.map((segment, index) =>
                segment.kind === "text" ? (
                  <span key={index}>{segment.value}</span>
                ) : (
                  <span
                    key={index}
                    className="inline-flex items-baseline gap-1.5"
                  >
                    <QuestionNoBadge no={segment.questionNo} />
                    <input
                      type="text"
                      // The gap is a gap: no placeholder, so a candidate's own
                      // blank row never looks like it already holds a word.
                      value={answerText(attempt, segment.questionNo)}
                      onChange={(event) =>
                        answer(segment.questionNo, event.target.value)
                      }
                      disabled={frozen}
                      aria-label={`Question ${segment.questionNo}, ${row.label}`}
                      autoComplete="off"
                      // Fixed width, not the rest of the row: an underline as
                      // long as the cell is a promise about the length of the
                      // answer that the paper does not make.
                      className="w-32 border-b border-stage-border-strong bg-transparent px-1 pb-0.5 text-stage-xs text-stage-fg outline-none transition-colors duration-stage-fast focus:border-stage-primary disabled:cursor-not-allowed disabled:text-stage-fg-muted"
                    />
                  </span>
                ),
              )}
            </dd>
          </div>
        ))}
      </dl>
    </QuestionCard>
  );
}
