"use client";

/**
 * Single-answer multiple choice.
 *
 * A native radio group inside a `<fieldset>`: one tab stop, arrow keys move
 * between options, the legend is announced with each of them. The rows are
 * styled `<label>`s wrapping real inputs rather than buttons with
 * `role="radio"`, so none of that has to be re-implemented.
 *
 * The recorded value is the option's `label` ("A"), never its text and never
 * its index — `ChoiceOption` splits the two precisely so that reordering the
 * printed options cannot change what an answer means.
 */
import type { McqSingleGroup as McqSingleGroupType } from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, OptionLetter, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function McqSingleGroup({ group }: { group: McqSingleGroupType }) {
  const { attempt, answer } = useListeningAttemptContext();
  const selected = answerText(attempt, group.questionNo);
  const frozen = attempt.status === "submitted";

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.mcq_single}>
      <fieldset disabled={frozen}>
        <legend className="mb-3 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg">
          <QuestionNoBadge no={group.questionNo} />
          <span>
            <span className="sr-only">第 {group.questionNo} 题，</span>
            {group.question}
          </span>
        </legend>
        <div className="flex flex-col gap-2">
          {group.options.map((option) => (
            <label
              key={option.label}
              className={optionRowClass({
                selected: option.label === selected,
                disabled: frozen,
              })}
            >
              <input
                type="radio"
                name={`listening-q${group.questionNo}`}
                value={option.label}
                checked={option.label === selected}
                onChange={() => answer(group.questionNo, option.label)}
                className="mt-0.5 h-3.5 w-3.5 flex-none accent-stage-primary"
              />
              <OptionLetter label={option.label} />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </QuestionCard>
  );
}
