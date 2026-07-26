"use client";

import type { AttemptSummary } from "@/lib/ielts/review";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

/**
 * Moves between attempts of the same passage (C-16).
 *
 * Attempts are immutable, so this navigates between distinct records rather
 * than mutating a view. With three or more attempts it offers a select as well
 * as arrows — stepping through ten attempts one at a time is not navigation.
 */
export function AttemptPager({
  attempts,
  currentId,
  onSelect,
}: {
  attempts: AttemptSummary[];
  currentId: string;
  onSelect: (recordId: string) => void;
}) {
  if (attempts.length <= 1) {
    return (
      <p className="text-xs text-stage-fg-muted">这篇文章仅有一次作答记录。</p>
    );
  }

  const index = attempts.findIndex((attempt) => attempt.recordId === currentId);
  const position = index === -1 ? 0 : index;
  // attempts are newest-first, so "previous attempt in time" is the next index.
  const older = attempts[position + 1];
  const newer = attempts[position - 1];
  const current = attempts[position];

  return (
    <nav
      aria-label="作答次数"
      className="flex flex-wrap items-center gap-2 text-xs"
    >
      <button
        type="button"
        disabled={!older}
        onClick={() => older && onSelect(older.recordId)}
        aria-label="上一次作答"
        className="min-h-9 rounded-stage-sm border border-stage-border px-2.5 transition-colors hover:border-stage-primary disabled:opacity-40 disabled:hover:border-stage-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
      >
        ◀ 更早
      </button>

      {attempts.length >= 3 ? (
        <label className="flex items-center gap-1.5">
          <span className="sr-only">选择作答次数</span>
          <select
            value={currentId}
            onChange={(event) => onSelect(event.target.value)}
            className="min-h-9 rounded-stage-sm border border-stage-border bg-stage-bg px-2 text-xs outline-none focus:border-stage-primary"
          >
            {attempts.map((attempt, order) => (
              <option key={attempt.recordId} value={attempt.recordId}>
                第 {attempts.length - order} 次 · {formatDate(attempt.createdAt)}{" "}
                · {Math.round(attempt.accuracy * 100)}%
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="tabular-nums text-stage-fg-muted" aria-current="true">
          第 {attempts.length - position} 次 / 共 {attempts.length} 次 ·{" "}
          {formatDate(current.createdAt)} · {Math.round(current.accuracy * 100)}%
        </span>
      )}

      <button
        type="button"
        disabled={!newer}
        onClick={() => newer && onSelect(newer.recordId)}
        aria-label="下一次作答"
        className="min-h-9 rounded-stage-sm border border-stage-border px-2.5 transition-colors hover:border-stage-primary disabled:opacity-40 disabled:hover:border-stage-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
      >
        更近 ▶
      </button>
    </nav>
  );
}
