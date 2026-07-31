"use client";

/**
 * Map labelling — one lettered position, picked from a row.
 *
 * A horizontal row of toggle buttons rather than a stacked radio list: the
 * choices are single letters that key into a diagram, so a full-width row per
 * letter would be five near-empty lines. Clicking the selected letter again
 * clears it, which is the only way to take back an answer here — there is no
 * `Clear` inside the card, and a candidate who guessed should be able to return
 * the question to unanswered so the nav bar stops claiming it is done.
 *
 * The image slot renders only when the set carries a `imageUrl`. Absent, the
 * card renders the letters alone — no frame, no placeholder, nothing that would
 * read as an image that failed to load.
 */
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
  const selected = answerText(attempt, group.questionNo);
  const frozen = attempt.status === "submitted";
  const promptId = `listening-q${group.questionNo}-prompt`;

  return (
    <QuestionCard typeLabel={GROUP_TYPE_LABELS.map_labelling}>
      <p
        id={promptId}
        className="mb-3 flex items-baseline gap-2 pr-16 text-stage-xs font-medium text-stage-fg"
      >
        <QuestionNoBadge no={group.questionNo} />
        <span>
          <span className="sr-only">第 {group.questionNo} 题，</span>
          {group.question}
        </span>
      </p>

      {group.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a set's map is
        // an arbitrary remote URL; next/image would need a loader configured
        // for every future backend, and this repo runs no image pipeline.
        <img
          src={group.imageUrl}
          alt="题目地图"
          className="mb-3 w-full rounded-stage-sm border border-stage-border"
        />
      ) : null}

      <div role="group" aria-labelledby={promptId} className="flex flex-wrap gap-2">
        {group.labels.map((label) => {
          const active = label === selected;
          return (
            <button
              key={label}
              type="button"
              disabled={frozen}
              aria-pressed={active}
              onClick={() =>
                active
                  ? clearAnswer(group.questionNo)
                  : answer(group.questionNo, label)
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
    </QuestionCard>
  );
}
