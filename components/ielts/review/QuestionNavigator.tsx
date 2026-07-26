"use client";

import { useRef } from "react";
import type { ResultRow } from "@/lib/ielts/review";

export interface NavigatorCell {
  questionId: string;
  displayNo: string;
  state: "correct" | "wrong" | "unanswered";
  marked: boolean;
}

/** An unanswered question is not the same failure as a wrong one. */
export function toNavigatorCells(rows: ResultRow[]): NavigatorCell[] {
  return rows.map((row) => {
    const answered = Array.isArray(row.userAnswer)
      ? row.userAnswer.length > 0
      : String(row.userAnswer ?? "").trim() !== "";
    return {
      questionId: row.questionId,
      displayNo: row.displayNo,
      state: row.isCorrect ? "correct" : answered ? "wrong" : "unanswered",
      marked: row.marked,
    };
  });
}

const CELL_TONE: Record<NavigatorCell["state"], string> = {
  correct: "bg-emerald-50 text-emerald-700 border-emerald-200",
  wrong: "bg-amber-50 text-amber-700 border-amber-200",
  unanswered:
    "bg-stage-bg-soft text-stage-fg-muted border-dashed border-stage-border",
};

const CELL_GLYPH: Record<NavigatorCell["state"], string> = {
  correct: "✓",
  wrong: "✗",
  unanswered: "–",
};

const STATE_LABEL: Record<NavigatorCell["state"], string> = {
  correct: "正确",
  wrong: "错误",
  unanswered: "未作答",
};

/**
 * Question navigator over a STORED attempt (C-17, review mode).
 *
 * The live-attempt navigator belongs to the vendored runner, which owns the
 * question DOM inside its iframe. This one navigates a record, which is DOM
 * STAGE owns — so it exists on the review and wrongbook surfaces only.
 *
 * Every cell carries a glyph as well as a colour, so state is readable in
 * greyscale, and the grid is a roving-tabindex group rather than 13+ tab stops.
 */
export function QuestionNavigator({
  cells,
  currentId,
  onSelect,
}: {
  cells: NavigatorCell[];
  currentId?: string;
  onSelect: (questionId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  if (cells.length === 0) return null;

  const activeIndex = Math.max(
    0,
    cells.findIndex((cell) => cell.questionId === currentId),
  );

  function focusCell(index: number) {
    const buttons =
      containerRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const next = buttons?.[Math.max(0, Math.min(index, cells.length - 1))];
    next?.focus();
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
    <div
      ref={containerRef}
      role="group"
      aria-label="题目导航"
      className="no-scrollbar flex flex-wrap gap-1.5 overflow-x-auto"
    >
      {cells.map((cell, index) => {
        const active = cell.questionId === currentId;
        return (
          <button
            key={cell.questionId}
            type="button"
            // Roving tabindex: one stop for the whole grid, arrows move within.
            tabIndex={index === activeIndex ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => onSelect(cell.questionId)}
            aria-label={`第 ${cell.displayNo} 题，${STATE_LABEL[cell.state]}${
              cell.marked ? "，已标记" : ""
            }`}
            aria-current={active ? "true" : undefined}
            className={`relative flex min-h-9 min-w-9 items-center justify-center gap-0.5 rounded-stage-sm border px-1.5 text-xs tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary ${
              CELL_TONE[cell.state]
            } ${active ? "ring-2 ring-stage-primary" : ""}`}
          >
            {cell.displayNo}
            <span aria-hidden className="opacity-70">
              {CELL_GLYPH[cell.state]}
            </span>
            {cell.marked ? (
              <span
                aria-hidden
                className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-stage-primary"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
