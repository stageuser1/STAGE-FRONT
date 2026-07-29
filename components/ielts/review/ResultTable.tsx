"use client";

import { answerText, type ResultRow } from "@/lib/ielts/review";
import { Badge } from "../ui";
import { EvidenceJump } from "./EvidenceJump";
import { RevealControl } from "./RevealControl";

export type ExplanationStatus = "idle" | "loading" | "ready" | "unavailable";

export interface ExplanationEntry {
  text: string;
  paragraphLabel?: string;
  sectionTitle?: string;
}

export interface ResultTableProps {
  rows: ResultRow[];
  /** Controlled by the page, so "reveal all" is one state change. */
  revealed: ReadonlySet<string>;
  onReveal: (questionId: string) => void;
  onRevealAll: () => void;
  onHideAll: () => void;
  onRequestExplanation: (questionId: string) => void;
  explanations: Record<string, ExplanationEntry | undefined>;
  explanationStatus: Record<string, ExplanationStatus>;
  /** Opens the vendored runner at this attempt, for the highlighted passage. */
  runnerHref: string;
  typeLabel: (type: string) => string;
  /** Only the wrong rows, used by the wrongbook. */
  wrongOnly?: boolean;
  /**
   * Sends a wrong question's evidence to the passage pane (T4). Absent on
   * surfaces that have no passage beside them, and the link is then not shown.
   */
  onLocate?: (questionId: string) => void;
}

/**
 * Per-question outcomes for one stored attempt (C-14).
 *
 * A real <table> at ≥768px and stacked cards below it — an answer table that
 * scrolls sideways on a phone is unusable, so it reflows instead.
 */
export function ResultTable({
  rows,
  revealed,
  onReveal,
  onRevealAll,
  onHideAll,
  onRequestExplanation,
  explanations,
  explanationStatus,
  runnerHref,
  typeLabel,
  wrongOnly = false,
  onLocate,
}: ResultTableProps) {
  const visible = wrongOnly ? rows.filter((row) => !row.isCorrect) : rows;

  if (visible.length === 0) {
    return (
      <p className="rounded-stage-lg border border-stage-border px-4 py-6 text-center text-stage-xs text-stage-fg-muted">
        这条记录没有逐题数据。
      </p>
    );
  }

  const allRevealed = visible.every((row) => revealed.has(row.questionId));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-stage-2xs text-stage-fg-muted">
          共 {visible.length} 题 · 正确答案默认隐藏
        </p>
        <button
          type="button"
          onClick={allRevealed ? onHideAll : onRevealAll}
          className="rounded-stage-sm border border-stage-border-strong px-3 py-1.5 text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-primary hover:text-stage-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
        >
          {allRevealed ? "隐藏全部答案" : "全部显示答案"}
        </button>
      </div>

      {/* Desktop: a real table. */}
      <table className="hidden w-full border-collapse text-stage-xs md:table">
        <thead>
          <tr className="border-b border-stage-border text-left text-stage-2xs text-stage-fg-muted">
            <th className="w-10 py-2 font-normal" scope="col">
              题号
            </th>
            <th className="w-24 py-2 font-normal" scope="col">
              题型
            </th>
            <th className="py-2 font-normal" scope="col">
              我的作答
            </th>
            <th className="py-2 font-normal" scope="col">
              正确答案
            </th>
            <th className="w-10 py-2 font-normal" scope="col">
              结果
            </th>
            <th className="w-24 py-2 font-normal" scope="col">
              解析
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <ResultTableRow
              key={row.questionId}
              row={row}
              revealed={revealed.has(row.questionId)}
              onReveal={() => onReveal(row.questionId)}
              onRequestExplanation={() => onRequestExplanation(row.questionId)}
              explanation={explanations[row.questionId]}
              status={explanationStatus[row.questionId] ?? "idle"}
              runnerHref={runnerHref}
              typeLabel={typeLabel}
              onLocate={onLocate}
            />
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked cards. */}
      <ul className="space-y-2 md:hidden">
        {visible.map((row) => (
          <ResultCard
            key={row.questionId}
            row={row}
            revealed={revealed.has(row.questionId)}
            onReveal={() => onReveal(row.questionId)}
            onRequestExplanation={() => onRequestExplanation(row.questionId)}
            explanation={explanations[row.questionId]}
            status={explanationStatus[row.questionId] ?? "idle"}
            runnerHref={runnerHref}
            typeLabel={typeLabel}
            onLocate={onLocate}
          />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  row: ResultRow;
  revealed: boolean;
  onReveal: () => void;
  onRequestExplanation: () => void;
  explanation?: ExplanationEntry;
  status: ExplanationStatus;
  runnerHref: string;
  typeLabel: (type: string) => string;
  onLocate?: (questionId: string) => void;
}

/** Verdict glyph plus the word, so state survives greyscale. */
function Verdict({ correct }: { correct: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-stage-xs font-medium ${
        correct ? "text-stage-success" : "text-stage-warning"
      }`}
    >
      <span aria-hidden>{correct ? "✓" : "✗"}</span>
      <span className="sr-only">{correct ? "正确" : "错误"}</span>
    </span>
  );
}

/**
 * The cue link into the passage pane (master-spec 批次二).
 *
 * Only on wrong answers, and only where a passage pane exists to receive it.
 * It moves the left pane; it reveals nothing here — checking the answer stays
 * a separate, deliberate act.
 */
function EvidenceCue({
  row,
  onLocate,
}: {
  row: ResultRow;
  onLocate: (questionId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onLocate(row.questionId)}
      aria-label={`在原文中查看第 ${row.displayNo} 题的证据`}
      className="inline-flex items-center gap-1 text-stage-2xs font-medium text-stage-primary underline-offset-2 transition-colors duration-stage-fast hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
    >
      查看证据
      <span aria-hidden>→</span>
    </button>
  );
}

function ResultTableRow({
  row,
  revealed,
  onReveal,
  onRequestExplanation,
  explanation,
  status,
  runnerHref,
  typeLabel,
  onLocate,
}: RowProps) {
  const answerId = `answer-${row.questionId}`;
  return (
    <>
      <tr
        className="border-b border-stage-border align-top"
        id={`row-${row.questionId}`}
      >
        <td className="py-2 text-stage-2xs tabular-nums text-stage-fg-muted">
          {row.displayNo}
          {row.marked ? (
            <span className="ml-1 text-stage-primary" title="已标记">
              ●<span className="sr-only">已标记</span>
            </span>
          ) : null}
        </td>
        <td className="py-2 text-stage-2xs text-stage-fg-muted">
          {row.questionType ? typeLabel(row.questionType) : "—"}
        </td>
        <td className="py-2 text-stage-xs text-stage-fg-body">
          {answerText(row.userAnswer)}
        </td>
        <td className="py-2 text-stage-xs" id={answerId} aria-live="polite">
          {revealed ? (
            <span className="font-medium text-stage-fg">
              {answerText(row.correctAnswer)}
            </span>
          ) : (
            <RevealControl
              revealed={false}
              onReveal={onReveal}
              questionLabel={`第 ${row.displayNo} 题`}
              answerId={answerId}
            />
          )}
        </td>
        <td className="py-2">
          <Verdict correct={row.isCorrect} />
        </td>
        <td className="py-2">
          <div className="space-y-1">
            {onLocate && !row.isCorrect ? (
              <EvidenceCue row={row} onLocate={onLocate} />
            ) : null}
            <EvidenceJump
              questionLabel={`第 ${row.displayNo} 题`}
              status={status}
              explanation={explanation}
              runnerHref={runnerHref}
              onRequest={onRequestExplanation}
            />
          </div>
        </td>
      </tr>
    </>
  );
}

function ResultCard({
  row,
  revealed,
  onReveal,
  onRequestExplanation,
  explanation,
  status,
  runnerHref,
  typeLabel,
  onLocate,
}: RowProps) {
  const answerId = `answer-m-${row.questionId}`;
  return (
    <li
      className="rounded-stage-lg border border-stage-border p-3"
      id={`row-m-${row.questionId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-stage-xs font-medium tabular-nums text-stage-fg">
          第 {row.displayNo} 题
        </span>
        <div className="flex items-center gap-2">
          {row.questionType ? (
            <Badge>{typeLabel(row.questionType)}</Badge>
          ) : null}
          <Verdict correct={row.isCorrect} />
        </div>
      </div>
      <dl className="mt-2 space-y-1 text-stage-2xs">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-stage-fg-muted">我的作答</dt>
          <dd className="min-w-0 flex-1 text-stage-fg-body">
            {answerText(row.userAnswer)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="w-16 shrink-0 text-stage-fg-muted">正确答案</dt>
          <dd className="min-w-0 flex-1" id={answerId} aria-live="polite">
            {revealed ? (
              <span className="font-medium text-stage-fg">
                {answerText(row.correctAnswer)}
              </span>
            ) : (
              <RevealControl
                revealed={false}
                onReveal={onReveal}
                questionLabel={`第 ${row.displayNo} 题`}
                answerId={answerId}
              />
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-2 space-y-1.5">
        {onLocate && !row.isCorrect ? (
          <EvidenceCue row={row} onLocate={onLocate} />
        ) : null}
        <EvidenceJump
          questionLabel={`第 ${row.displayNo} 题`}
          status={status}
          explanation={explanation}
          runnerHref={runnerHref}
          onRequest={onRequestExplanation}
        />
      </div>
    </li>
  );
}
