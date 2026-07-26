"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ProfileStepId, StepState } from "@/lib/profile/types";

/**
 * One question of the progressive profile (C-22).
 *
 * Every step is skippable and no step can trap the learner — a profile where
 * all five were skipped is valid. There is no save button because there is no
 * unsaved state: every change is written through immediately.
 */
export function ProfileStep({
  stepId,
  index,
  total,
  title,
  hint,
  states,
  children,
  onBack,
  onSkip,
  onNext,
  isLast,
  savedAt,
  saveFailed,
}: {
  stepId: ProfileStepId;
  index: number;
  total: number;
  title: string;
  hint?: string;
  states: StepState[];
  children: ReactNode;
  onBack?: () => void;
  onSkip: () => void;
  onNext: () => void;
  isLast: boolean;
  savedAt: string | null;
  saveFailed: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the new question on advance, so a keyboard or screen-reader user
  // lands on the thing that changed rather than at the top of the document.
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepId]);

  return (
    <div className="mx-auto w-full max-w-xl rounded-stage-md border border-stage-border bg-stage-bg p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="档案填写进度"
        >
          {states.map((state, position) => (
            <span
              key={position}
              aria-hidden
              className={
                state === "skipped"
                  ? "h-0.5 w-3 rounded-full bg-stage-fg-muted/50"
                  : `h-1.5 w-1.5 rounded-full ${
                      position + 1 === index
                        ? "ring-2 ring-stage-primary ring-offset-1"
                        : state === "answered"
                          ? "bg-stage-primary"
                          : "border border-stage-fg-muted/50"
                    }`
              }
            />
          ))}
        </div>
        {/* The dots alone are not the progress indicator. */}
        <p className="text-xs text-stage-fg-muted">
          第 {index} / {total} 步
        </p>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-lg font-semibold outline-none"
      >
        {title}
      </h2>
      {hint ? (
        <p className="mt-1 text-xs text-stage-fg-muted">{hint}</p>
      ) : null}

      <div className="mt-5">{children}</div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stage-border pt-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-stage-md border border-stage-border px-4 py-2 text-sm transition-colors hover:border-stage-primary"
          >
            上一步
          </button>
        ) : null}
        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-stage-md border border-stage-border px-4 py-2 text-sm text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg sm:flex-none"
          >
            跳过
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover sm:flex-none"
          >
            {isLast ? "完成" : "下一步"}
          </button>
        </div>
      </div>

      {saveFailed ? (
        <p className="mt-3 rounded-stage-sm bg-amber-50 px-3 py-2 text-xs text-amber-700">
          无法保存到本机浏览器，本次填写在离开页面后会丢失。可能是浏览器处于无痕模式或存储已满。
        </p>
      ) : savedAt ? (
        <p className="mt-3 text-xs text-stage-fg-muted">已自动保存 · {savedAt}</p>
      ) : null}
    </div>
  );
}

/** Multi- or single-select chip group used by every step. */
export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  multi = true,
  columns = false,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
  columns?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-stage-fg-muted">
        {label}
        {multi ? "（可多选）" : ""}
      </legend>
      <div className={columns ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary ${
                active
                  ? "border-stage-primary bg-stage-primary text-white"
                  : "border-stage-border text-stage-fg-muted hover:border-stage-primary hover:text-stage-fg"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Half-band stepper for IELTS scores — no free-text number entry. */
export function BandStepper({
  label,
  value,
  onChange,
  min = 4,
  max = 9,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
}) {
  const current = value ?? 6;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-stage-fg-muted">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label}减 0.5`}
          disabled={value !== null && current <= min}
          onClick={() => onChange(Math.max(min, current - 0.5))}
          className="h-10 w-10 rounded-stage-md border border-stage-border text-lg transition-colors hover:border-stage-primary disabled:opacity-40"
        >
          −
        </button>
        <output className="min-w-16 text-center text-2xl font-semibold tabular-nums">
          {value === null ? "—" : value.toFixed(1)}
        </output>
        <button
          type="button"
          aria-label={`${label}加 0.5`}
          disabled={value !== null && current >= max}
          onClick={() => onChange(Math.min(max, value === null ? 6 : current + 0.5))}
          className="h-10 w-10 rounded-stage-md border border-stage-border text-lg transition-colors hover:border-stage-primary disabled:opacity-40"
        >
          +
        </button>
        {value !== null ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-stage-fg-muted underline-offset-2 hover:underline"
          >
            清除
          </button>
        ) : null}
      </div>
    </div>
  );
}
