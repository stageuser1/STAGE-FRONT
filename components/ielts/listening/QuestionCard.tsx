"use client";

/**
 * The shell every Listening question group is drawn in, plus the two marks the
 * five groups share.
 *
 * Kept apart from the groups themselves so the card, the number chip and the
 * option row are one decision rather than five: the five group types differ in
 * how an answer is *given*, and should differ in nothing else.
 *
 * Visual standard is the one `components/ielts/ui.tsx` records — a flat white
 * surface, structure from hairline borders, never from shadows.
 */
import type { ReactNode } from "react";

/**
 * Card container with the type badge in its top-right corner.
 *
 * `typeLabel` is optional because the badge is a top-right *corner* mark: it
 * shares the row with the group's own heading, and a group that has no heading
 * of its own would leave the badge floating alone.
 */
export function QuestionCard({
  typeLabel,
  children,
}: {
  typeLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative rounded-stage-lg border border-stage-border bg-stage-bg p-5">
      {typeLabel ? (
        <span className="absolute right-5 top-5 inline-flex items-center rounded-stage-xs border border-stage-border bg-stage-bg-soft px-1.5 py-0.5 text-stage-2xs text-stage-fg-muted">
          {typeLabel}
        </span>
      ) : null}
      {children}
    </section>
  );
}

/**
 * The question number, as a chip.
 *
 * Deliberately one appearance in every state. The answered/unanswered
 * distinction is the nav bar's job (spec §题目作答区: 未答空心 / 已答实心), and
 * a chip that also changed with the answer would put the same information in
 * two places with two different shapes.
 *
 * `aria-hidden` because the number is already in the control's own label —
 * "Question 3, Phone" on the input, "第 6 题" on the fieldset — so announcing
 * the chip as well would read the number twice.
 */
export function QuestionNoBadge({ no }: { no: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid h-5 min-w-5 flex-none place-items-center rounded-stage-pill bg-stage-primary-soft px-1 font-stage-mono text-stage-2xs font-medium leading-none text-stage-primary"
    >
      {no}
    </span>
  );
}

/**
 * A full-width choice row, for the four groups that print their options.
 *
 * Returned as a class string rather than a component because the caller wraps
 * a real `<input type="radio">` or `<input type="checkbox">` in a `<label>` —
 * native controls, so keyboard and screen-reader behaviour comes for free —
 * and a wrapper component would have to forward the input in as a child
 * anyway.
 */
export function optionRowClass({
  selected,
  disabled,
}: {
  selected: boolean;
  disabled: boolean;
}): string {
  const base =
    "flex w-full items-start gap-3 rounded-stage-sm border px-3.5 py-2.5 text-stage-xs transition-colors duration-stage-fast ease-stage-standard";
  const cursor = disabled ? "cursor-not-allowed" : "cursor-pointer";
  if (selected) {
    return `${base} ${cursor} border-stage-primary bg-stage-primary-soft font-medium text-stage-fg`;
  }
  if (disabled) {
    return `${base} ${cursor} border-stage-border bg-stage-bg-soft text-stage-fg-subtle`;
  }
  return `${base} cursor-pointer border-stage-border text-stage-fg-body hover:border-stage-border-strong hover:bg-stage-bg-soft`;
}

/** The lettered prefix printed against an option's text ("A", "B", …). */
export function OptionLetter({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="mt-px font-stage-mono text-stage-2xs font-medium text-stage-fg-muted"
    >
      {label}
    </span>
  );
}
