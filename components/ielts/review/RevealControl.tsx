"use client";

/**
 * Answer-reveal control (C-14).
 *
 * The discipline this enforces: a correct answer is masked until the learner
 * asks for it, one question at a time. That is the difference between checking
 * a score and reviewing an attempt.
 *
 * Revealing INSERTS the answer text into the DOM — it is never a blur or a
 * transparent colour, both of which leak the answer to screen readers, to
 * copy-paste, and to anyone who selects the page.
 */
export function RevealControl({
  revealed,
  onReveal,
  questionLabel,
  answerId,
}: {
  revealed: boolean;
  onReveal: () => void;
  /** Context for the accessible name, e.g. "第 3 题". */
  questionLabel: string;
  /** Id of the element this control fills in. */
  answerId: string;
}) {
  if (revealed) return null;

  return (
    <button
      type="button"
      onClick={onReveal}
      aria-expanded={false}
      aria-controls={answerId}
      aria-label={`显示${questionLabel}的正确答案`}
      className="inline-flex min-h-[28px] items-center gap-1.5 rounded-stage-sm border border-stage-border px-2 text-xs text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
    >
      <span aria-hidden className="tracking-widest">
        ●●●
      </span>
      显示
    </button>
  );
}
