"use client";

/**
 * The question-number bar for a live attempt (bottom bar, left).
 *
 * Three states, per spec §题目作答区: unanswered is an outline, answered is
 * filled, and the current question carries a ring *over* either of those —
 * `navStates` returns the answered state and the current flag separately for
 * exactly that reason. No correct/wrong colour appears here; during an attempt
 * nothing has been marked, and the spec forbids implying otherwise (§五.7).
 *
 * The bar selects; it does not scroll. `onSelect` hands the number to the page,
 * which owns the scroll container and therefore owns the decision about how a
 * question is brought into view (B4). Which question is current is likewise the
 * page's state — the bar is told, so that a question scrolled to by other means
 * can light up here too.
 *
 * Roving tabindex, matching `components/ielts/review/QuestionNavigator.tsx`: a
 * forty-question set would otherwise put forty tab stops between the audio
 * controls and the submit button.
 */
import { useRef } from "react";
import type { ListeningSet } from "@/lib/ielts/listening-types";
import { navStates, type AnsweredState } from "@/lib/ielts/listening-ui-utils";
import { useListeningAttemptContext } from "@/lib/ielts/listening-attempt";

const STATE_LABEL: Record<AnsweredState, string> = {
  answered: "已答",
  unanswered: "未答",
};

const STATE_TONE: Record<AnsweredState, string> = {
  answered: "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark",
  unanswered:
    "border-stage-border bg-stage-bg text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg",
};

export function QuestionNav({
  set,
  currentNo,
  onSelect,
}: {
  set: ListeningSet;
  /** `null` before the candidate has landed on a question. */
  currentNo: number | null;
  onSelect: (questionNo: number) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { attempt } = useListeningAttemptContext();
  const cells = navStates(set, attempt, currentNo);

  // With nothing current, the first cell holds the group's tab stop.
  const activeIndex = Math.max(
    0,
    cells.findIndex((cell) => cell.current),
  );

  function focusCell(index: number) {
    const buttons =
      containerRef.current?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[Math.max(0, Math.min(index, cells.length - 1))]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusCell(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusCell(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusCell(0);
        break;
      case "End":
        event.preventDefault();
        focusCell(cells.length - 1);
        break;
    }
  }

  return (
    <nav
      ref={containerRef}
      aria-label="题号导航"
      className="flex flex-wrap gap-1.5"
    >
      {cells.map((cell, index) => (
        <button
          key={cell.no}
          type="button"
          tabIndex={index === activeIndex ? 0 : -1}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => onSelect(cell.no)}
          aria-label={`第 ${cell.no} 题，${STATE_LABEL[cell.state]}`}
          aria-current={cell.current ? "true" : undefined}
          className={`h-8 min-w-8 rounded-stage-sm border px-1.5 text-stage-2xs tabular-nums transition-colors duration-stage-fast ease-stage-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary ${
            STATE_TONE[cell.state]
          } ${cell.current ? "ring-2 ring-stage-primary ring-offset-1" : ""}`}
        >
          {cell.no}
        </button>
      ))}
    </nav>
  );
}
