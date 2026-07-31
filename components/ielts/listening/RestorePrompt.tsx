"use client";

/**
 * "You left a paper open" — the dialog that runs before the first keystroke.
 *
 * It states what is actually on offer (how many questions were answered, how
 * long the clock had run) rather than asking an abstract 继续/重新开始, because
 * the two choices are not symmetric: 重新开始 destroys the draft, and a
 * candidate cannot judge that without knowing what the draft holds.
 *
 * Escape resolves to 继续上次练习 — the reading of a dismissed dialog has to be
 * the non-destructive one, and starting over is always still one click away.
 */
import { BUTTON_PRIMARY_SM, BUTTON_SECONDARY_SM } from "@/components/ielts/ui";
import { answeredState, formatClock } from "@/lib/ielts/listening-ui-utils";
import type { Attempt, ListeningSet } from "@/lib/ielts/listening-types";
import { questionNumbers } from "@/lib/ielts/listening-runner";

import { ListeningDialog } from "./ListeningDialog";

export function RestorePrompt({
  set,
  attempt,
  onContinue,
  onRestart,
}: {
  set: ListeningSet;
  attempt: Attempt;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const numbers = questionNumbers(set);
  const answered = numbers.filter(
    (no) => answeredState(attempt, no) === "answered",
  ).length;

  return (
    <ListeningDialog title="继续上次练习？" onDismiss={onContinue}>
      <p className="mt-2 text-stage-xs text-stage-fg-body">
        本机保存了一份未交卷的答题记录。
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-2">
          <dt className="text-stage-2xs text-stage-fg-muted">已作答</dt>
          <dd className="mt-0.5 text-stage-xs tabular-nums text-stage-fg">
            {answered} / {numbers.length} 题
          </dd>
        </div>
        <div className="rounded-stage-sm border border-stage-border bg-stage-bg-soft px-3 py-2">
          <dt className="text-stage-2xs text-stage-fg-muted">已用时</dt>
          <dd className="mt-0.5 font-stage-mono text-stage-xs tabular-nums text-stage-fg">
            {formatClock(attempt.elapsedSec)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-stage-2xs text-stage-fg-muted">
        重新开始会删除这份记录，且无法恢复。
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onRestart} className={BUTTON_SECONDARY_SM}>
          重新开始
        </button>
        <button
          type="button"
          autoFocus
          onClick={onContinue}
          className={BUTTON_PRIMARY_SM}
        >
          继续上次练习
        </button>
      </div>
    </ListeningDialog>
  );
}
