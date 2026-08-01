"use client";

import type { McqMultiGroup as McqMultiGroupType } from "@/lib/ielts/listening-types";
import {
  answerList,
  answerText,
  GROUP_TYPE_LABELS,
  multiSelectNext,
} from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, OptionLetter, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function McqMultiGroup({ group }: { group: McqMultiGroupType }) {
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
            selectCount: group.selectCount,
          },
        ];

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.mcq_multi}>
      {group.instruction ? (
        <p className="mb-3 text-stage-2xs italic text-stage-fg-muted">
          {group.instruction}
        </p>
      ) : null}
      <div className="flex flex-col gap-5">
        {questions.map((question) => {
          const selectCount = question.selectCount;
          const isMultiAnswer = selectCount > 1;
          const selectedList = answerList(attempt, question.questionNo);
          const selectedText = answerText(attempt, question.questionNo);
          const atLimit = selectedList.length >= selectCount;

          return (
            <fieldset key={question.questionNo} disabled={frozen}>
              <legend className="mb-1.5 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg">
                <QuestionNoBadge no={question.questionNo} />
                <span>
                  <span className="sr-only">{`\u7b2c ${question.questionNo} \u9898\uff0c`}</span>
                  {question.prompt}
                </span>
              </legend>
              <p
                aria-live="polite"
                className="mb-3 text-stage-2xs tabular-nums text-stage-fg-muted"
              >
                {`\u9009\u62e9${selectCount}\u9879 \u00b7 \u5df2\u9009${
                  isMultiAnswer
                    ? `${selectedList.length}/${selectCount}`
                    : selectedText === ""
                      ? `0/${selectCount}`
                      : `1/${selectCount}`
                }`}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option) => {
                  const checked = isMultiAnswer
                    ? selectedList.includes(option.label)
                    : option.label === selectedText;
                  const locked =
                    frozen || (isMultiAnswer && atLimit && !checked);

                  return (
                    <label
                      key={option.label}
                      className={optionRowClass({ selected: checked, disabled: locked })}
                    >
                      <input
                        type={isMultiAnswer ? "checkbox" : "radio"}
                        name={`listening-q${question.questionNo}`}
                        value={option.label}
                        checked={checked}
                        disabled={locked}
                        onChange={() => {
                          if (isMultiAnswer) {
                            const next = multiSelectNext(
                              selectedList,
                              option.label,
                              selectCount,
                            );
                            if (next !== selectedList) {
                              answer(question.questionNo, next);
                            }
                          } else {
                            answer(question.questionNo, option.label);
                          }
                        }}
                        className="mt-0.5 h-3.5 w-3.5 flex-none accent-stage-primary"
                      />
                      <OptionLetter label={option.label} />
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </QuestionCard>
  );
}
