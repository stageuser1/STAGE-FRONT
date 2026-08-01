"use client";

import type { McqSingleGroup as McqSingleGroupType } from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, OptionLetter, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function McqSingleGroup({ group }: { group: McqSingleGroupType }) {
  const { attempt, answer } = useListeningAttemptContext();
  const frozen = attempt.status === "submitted";
  const questions =
    group.questions && group.questions.length > 0
      ? group.questions
      : [
          {
            questionNo: group.questionNo,
            prompt: group.question,
            options: group.options,
          },
        ];

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.mcq_single}>
      <div className="flex flex-col gap-5">
        {questions.map((question) => {
          const selected = answerText(attempt, question.questionNo);
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
                {question.options.map((option) => (
                  <label
                    key={option.label}
                    className={optionRowClass({
                      selected: option.label === selected,
                      disabled: frozen,
                    })}
                  >
                    <input
                      type="radio"
                      name={`listening-q${question.questionNo}`}
                      value={option.label}
                      checked={option.label === selected}
                      onChange={() => answer(question.questionNo, option.label)}
                      className="mt-0.5 h-3.5 w-3.5 flex-none accent-stage-primary"
                    />
                    <OptionLetter label={option.label} />
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
