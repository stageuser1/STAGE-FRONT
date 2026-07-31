"use client";

/**
 * Matching — one option from a printed list.
 *
 * `MatchingGroup.options` is `string[]` and not `ChoiceOption[]`: the options
 * here have no letters, so the recorded answer is the option's own text
 * ("first floor"). That is why the scoring rule for a matching question
 * normalizes spacing and case.
 *
 * Structurally the same native radio group as `McqSingleGroup`, kept separate
 * rather than generalized because the two differ in what an answer *is* — a
 * letter that stands for a choice, versus the choice itself — and a shared
 * component would have to take a "how do I name an answer" prop, which is the
 * distinction, spelled sideways.
 */
import type { MatchingGroup as MatchingGroupType } from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function MatchingGroup({ group }: { group: MatchingGroupType }) {
  const { attempt, answer } = useListeningAttemptContext();
  const selected = answerText(attempt, group.questionNo);
  const frozen = attempt.status === "submitted";

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.matching}>
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
              key={option}
              className={optionRowClass({
                selected: option === selected,
                disabled: frozen,
              })}
            >
              <input
                type="radio"
                name={`listening-q${group.questionNo}`}
                value={option}
                checked={option === selected}
                onChange={() => answer(group.questionNo, option)}
                className="mt-0.5 h-3.5 w-3.5 flex-none accent-stage-primary"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </QuestionCard>
  );
}
