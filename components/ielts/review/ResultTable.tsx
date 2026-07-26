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
}: ResultTableProps) {
  const visible = wrongOnly ? rows.filter((row) => !row.isCorrect) : rows;

  if (visible.length === 0) {
    return (
      <p className="rounded-stage-md border border-stage-border px-4 py-6 text-center text-sm text-stage-fg-muted">
        这条记录没有逐题数据。
      </p>
    );
  }

  const allRevealed = visible.every((row) => revealed.has(row.questionId));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stage-fg-muted">
          共 {visible.length} 题 · 正确答案默认隐藏
        </p>
        <button
          type="button"
          onClick={allRevealed ? onHideAll : onRevealAll}
          className="rounded-stage-sm border border-stage-border px-3 py-1.5 text-xs text-stage-fg-muted transition-colors hover:border-stage-primary hover:text-stage-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary"
        >
          {allRevealed ? "隐藏全部答案" : "全部显示答案"}
        </button>
      </div>

      {/* Desktop: a real table. */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b border-stage-border text-left text-xs text-stage-fg-muted">
            <th className="w-12 py-2 font-normal" scope="col">
              题号
            </th>
            <th className="w-28 py-2 font-normal" scope="col">
              题型
            </th>
            <th className="py-2 font-normal" scope="col">
              我的作答
            </th>
            <th className="py-2 font-normal" scope="col">
              正确答案
            </th>
            <th className="w-16 py-2 font-normal" scope="col">
              结果
            </th>
            <th className="w-28 py-2 font-normal" scope="col">
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
}

/** Verdict glyph plus the word, so state survives greyscale. */
function Verdict({ correct }: { correct: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        correct ? "text-emerald-700" : "text-amber-700"
      }`}
    >
      <span aria-hidden>{correct ? "✓" : "✗"}</span>
      <span className="sr-only">{correct ? "正确" : "错误"}</span>
    </span>
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
}: RowProps) {
  const answerId = `answer-${row.questionId}`;
  return (
    <>
      <tr
        className="border-b border-stage-border align-top"
        id={`row-${row.questionId}`}
      >
        <td className="py-2 text-xs tabular-nums text-stage-fg-muted">
          {row.displayNo}
          {row.marked ? (
            <span className="ml-1 text-stage-primary" title="已标记">
              ●<span className="sr-only">已标记</span>
            </span>
          ) : null}
        </td>
        <td className="py-2 text-xs text-stage-fg-muted">
          {row.questionType ? typeLabel(row.questionType) : "—"}
        </td>
        <td className="py-2 text-sm">{answerText(row.userAnswer)}</td>
        <td className="py-2 text-sm" id={answerId} aria-live="polite">
          {revealed ? (
            <span className="font-medium">{answerText(row.correctAnswer)}</span>
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
          <EvidenceJump
            questionLabel={`第 ${row.displayNo} 题`}
            status={status}
            explanation={explanation}
            runnerHref={runnerHref}
            onRequest={onRequestExplanation}
          />
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
}: RowProps) {
  const answerId = `answer-m-${row.questionId}`;
  return (
    <li
      className="rounded-stage-md border border-stage-border p-3"
      id={`row-m-${row.questionId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium tabular-nums">
          第 {row.displayNo} 题
        </span>
        <div className="flex items-center gap-2">
          {row.questionType ? (
            <Badge>{typeLabel(row.questionType)}</Badge>
          ) : null}
          <Verdict correct={row.isCorrect} />
        </div>
      </div>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-stage-fg-muted">我的作答</dt>
          <dd className="min-w-0 flex-1">{answerText(row.userAnswer)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="w-16 shrink-0 text-stage-fg-muted">正确答案</dt>
          <dd className="min-w-0 flex-1" id={answerId} aria-live="polite">
            {revealed ? (
              <span className="font-medium">
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
      <div className="mt-2">
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
