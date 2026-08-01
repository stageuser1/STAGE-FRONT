"use client";

import type { MapLabellingGroup as MapLabellingGroupType } from "@/lib/ielts/listening-types";
import { answerText, GROUP_TYPE_LABELS } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function MapLabellingGroup({
  group,
}: {
  group: MapLabellingGroupType;
}) {
  const { attempt, answer, clearAnswer } = useListeningAttemptContext();
  const frozen = attempt.status === "submitted";
  const questions =
    group.questions && group.questions.length > 0
      ? group.questions
      : [
          {
            questionNo: group.questionNo,
            prompt: group.question,
            labels: group.labels,
            imageUrl: group.imageUrl,
          },
        ];
  const image = group.imageUrl ?? questions.find((question) => question.imageUrl)?.imageUrl;

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.map_labelling}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- a set's map is
        // an arbitrary static asset; next/image would add no value here.
        <img
          src={image}
          alt={"\u9898\u76ee\u5730\u56fe"}
          className="mb-3 w-full rounded-stage-sm border border-stage-border"
        />
      ) : null}

      <div className="flex flex-col gap-5">
        {questions.map((question) => {
          const selected = answerText(attempt, question.questionNo);
          const promptId = `listening-q${question.questionNo}-prompt`;
          return (
            <div key={question.questionNo}>
              <p
                id={promptId}
                className="mb-3 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg"
              >
                <QuestionNoBadge no={question.questionNo} />
                <span>
                  <span className="sr-only">{`\u7b2c ${question.questionNo} \u9898\uff0c`}</span>
                  {question.prompt}
                </span>
              </p>

              <div role="group" aria-labelledby={promptId} className="flex flex-wrap gap-2">
                {question.labels.map((label) => {
                  const active = label === selected;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={frozen}
                      aria-pressed={active}
                      onClick={() =>
                        active
                          ? clearAnswer(question.questionNo)
                          : answer(question.questionNo, label)
                      }
                      className={`h-9 w-9 rounded-stage-sm border font-stage-mono text-stage-xs transition-colors duration-stage-fast ease-stage-standard disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
                          : "border-stage-border text-stage-fg-body hover:border-stage-border-strong hover:bg-stage-bg-soft"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </QuestionCard>
  );
}
