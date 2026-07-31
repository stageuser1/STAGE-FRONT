"use client";

/**
 * Multiple-answer multiple choice, scored all-or-nothing.
 *
 * Because the whole set is one mark, the count is stated twice — the
 * requirement (`选择 2 项`) and the running total (`已选 1/2`) — so a candidate
 * never discovers at submit time that they gave one answer to a two-answer
 * question.
 *
 * Once `selectCount` options are ticked the remaining ones are `disabled`. The
 * rejected alternative was to accept the click and drop the oldest selection to
 * make room: that silently discards an answer the candidate deliberately gave.
 * A disabled box says the limit is reached and leaves the candidate to untick
 * what they no longer want. `multiSelectNext` refuses the over-limit add on its
 * own as well, so the rule holds even if a control is ever rendered enabled.
 */
import type { McqMultiGroup as McqMultiGroupType } from "@/lib/ielts/listening-types";
import {
  answerList,
  GROUP_TYPE_LABELS,
  multiSelectNext,
} from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";
import { optionRowClass, OptionLetter, QuestionCard, QuestionNoBadge } from "./QuestionCard";

export function McqMultiGroup({ group }: { group: McqMultiGroupType }) {
  const { attempt, answer } = useListeningAttemptContext();
  const selected = answerList(attempt, group.questionNo);
  const frozen = attempt.status === "submitted";
  const atLimit = selected.length >= group.selectCount;

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.mcq_multi}>
      <fieldset disabled={frozen}>
        <legend className="mb-1.5 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg">
          <QuestionNoBadge no={group.questionNo} />
          <span>
            <span className="sr-only">第 {group.questionNo} 题，</span>
            {group.question}
          </span>
        </legend>
        {/*
          A live region: the total changes without the focus moving, so a
          screen reader would otherwise never hear the count go up.
        */}
        <p
          aria-live="polite"
          className="mb-3 text-stage-2xs tabular-nums text-stage-fg-muted"
        >
          选择{group.selectCount}项 · 已选{selected.length}/{group.selectCount}
        </p>
        <div className="flex flex-col gap-2">
          {group.options.map((option) => {
            const checked = selected.includes(option.label);
            const locked = frozen || (atLimit && !checked);
            return (
              <label
                key={option.label}
                className={optionRowClass({ selected: checked, disabled: locked })}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={() => {
                    const next = multiSelectNext(
                      selected,
                      option.label,
                      group.selectCount,
                    );
                    // The helper returns the same array when it refuses the
                    // click; nothing to record then.
                    if (next !== selected) answer(group.questionNo, next);
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
    </QuestionCard>
  );
}
