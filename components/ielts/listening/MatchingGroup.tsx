"use client";

import type {
  MatchingGroup as MatchingGroupType,
  MatchingOption,
} from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function MatchingGroup({ group }: { group: MatchingGroupType }) {
  const { attempt, answer } = useListeningAttemptContext();
  const frozen = attempt.status === "submitted";
  const groupOptions: MatchingOption[] =
    group.optionItems ?? group.options.map((option) => ({ id: option, text: option }));
  const questions =
    group.questions && group.questions.length > 0
      ? group.questions
      : [
          {
            questionNo: group.questionNo,
            prompt: group.question,
            options: groupOptions,
          },
        ];

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.matching}>
      {group.instruction ? (
        <p className="mb-3 text-stage-2xs italic text-stage-fg-muted">
          {group.instruction}
        </p>
      ) : null}
      <div className="flex flex-col gap-5">
        {questions.map((question) => {
          const selected = answerText(attempt, question.questionNo);
          const options = question.options ?? groupOptions;
          return (
            <fieldset key={question.questionNo} disabled={frozen}>
              <legend className="mb-3 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg">
                <QuestionNoBadge no={question.questionNo} />
                <span>
                  <span className="sr-only">{`\u7b2c ${question.questionNo} \u9898\uff0c`}</span>
                  {question.prompt}
                </span>
              </legend>
              <div className="flex flex-col gap-2">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className={optionRowClass({
                      selected: option.id === selected,
                      disabled: frozen,
                    })}
                  >
                    <input
                      type="radio"
                      name={`listening-q${question.questionNo}`}
                      value={option.id}
                      checked={option.id === selected}
                      onChange={() => answer(question.questionNo, option.id)}
                      className="mt-0.5 h-3.5 w-3.5 flex-none accent-stage-primary"
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
    </QuestionCard>
  );
}
