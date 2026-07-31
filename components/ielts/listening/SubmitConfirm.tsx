"use client";

/**
 * The 交卷 confirmation.
 *
 * The gaps are listed as *buttons*, not as prose. A dialog that says "还有 3
 * 题未作答" and then makes the candidate close it, hunt for the numbers in the
 * nav bar and click each one has told them about a problem while standing in
 * the way of fixing it; here the number is the way back to the question.
 *
 * The confirm button changes its word with the state of the paper
 * (`confirmSubmitLabel`), so 仍要交卷 is the only thing that hands in an
 * incomplete paper, and it can never be reached by muscle memory from a
 * complete one.
 */
import { BUTTON_PRIMARY_SM, BUTTON_SECONDARY_SM } from "@/components/ielts/ui";
import {
  confirmSubmitLabel,
  submitSummary,
} from "@/lib/ielts/listening-practice-utils";

import { ListeningDialog } from "./ListeningDialog";

export function SubmitConfirm({
  unanswered,
  total,
  onGoToQuestion,
  onConfirm,
  onCancel,
}: {
  unanswered: number[];
  total: number;
  /** Closes the dialog and takes the candidate to that question. */
  onGoToQuestion: (questionNo: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ListeningDialog title="交卷" onDismiss={onCancel}>
      <p className="mt-2 text-stage-xs text-stage-fg-body">
        {submitSummary(unanswered, total)}
      </p>

      {unanswered.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {unanswered.map((no) => (
            <button
              key={no}
              type="button"
              onClick={() => onGoToQuestion(no)}
              aria-label={`前往第 ${no} 题`}
              className="h-8 min-w-8 rounded-stage-sm border border-stage-border bg-stage-bg px-1.5 text-stage-2xs tabular-nums text-stage-fg-muted transition-colors duration-stage-fast ease-stage-standard hover:border-stage-primary hover:text-stage-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
            >
              {no}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-stage-2xs text-stage-fg-muted">
        交卷后本卷不可再作答。
      </p>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={BUTTON_SECONDARY_SM}>
          返回试卷
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className={BUTTON_PRIMARY_SM}
        >
          {confirmSubmitLabel(unanswered)}
        </button>
      </div>
    </ListeningDialog>
  );
}
