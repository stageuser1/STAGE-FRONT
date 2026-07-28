"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FREQUENCY_SCOPE_LABELS,
  buildProgressIndex,
  composeSuite,
  pickRandomExam,
  type FrequencyScope,
} from "@/lib/ielts/progress";
import {
  clearSession,
  loadSessionOfKind,
  practiceHref,
  reviewHref,
  saveSession,
  startSuite,
  type SuiteEntry,
  type SuiteSession,
} from "@/lib/ielts/session";
import { loadRecords } from "@/lib/ielts/storage";
import type { ExamSummary, PracticeRecord } from "@/lib/ielts/types";
import { FREQUENCY_LABELS } from "@/lib/ielts/catalog";
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  Card,
  Chip,
  EmptyNote,
  PageHeader,
  StatTile,
  Tag,
  accuracyText,
  splitTitle,
} from "./ui";

const SCOPES: FrequencyScope[] = ["high", "high_medium", "all"];

/**
 * Stated in plain language, above the button that acts on it.
 *
 * A ranked or generated list has to say what rule produced it — this is the
 * suite's version of that contract.
 */
const RULE_SENTENCE =
  "随机抽取 P1 → P2 → P3 各一篇组成一套；优先抽取你还没做过的篇目；三篇完成后合计答对题数、正确率与用时。";

function toEntry(exam: ExamSummary): SuiteEntry {
  return { examId: exam.id, title: exam.title, category: exam.category };
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)} 分 ${String(total % 60).padStart(2, "0")} 秒`;
}

/**
 * Three-part suite practice: one P1, one P2 and one P3 in sequence.
 *
 * STAGE sequences it at the route level — one passage per page, each scored
 * and stored as its own record. That is what removes the need to rewrite every
 * question id as `examId::questionId`: records never collide, so question-type
 * analytics works on suite attempts with no special case.
 */
export function SuitePractice({ exams }: { exams: ExamSummary[] }) {
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [session, setSession] = useState<SuiteSession | null>(null);
  const [scope, setScope] = useState<FrequencyScope>("all");
  const [error, setError] = useState<string | null>(null);
  // Composition is previewed before it is committed: the learner sees the three
  // passages, can swap any of them, and only then locks the set into a session.
  const [preview, setPreview] = useState<ExamSummary[] | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
    const active = loadSessionOfKind("suite");
    setSession(active);
    if (active) setScope(active.scope);
  }, []);

  const progress = useMemo(
    () => buildProgressIndex(records ?? []),
    [records],
  );
  const recordsById = useMemo(() => {
    const map = new Map<string, PracticeRecord>();
    for (const record of records ?? []) map.set(record.id, record);
    return map;
  }, [records]);

  /** Draws a candidate set for preview. Nothing is committed yet. */
  function compose() {
    const picks = composeSuite(exams, progress, scope);
    if (!picks) {
      setError(
        `${FREQUENCY_SCOPE_LABELS[scope]}范围内凑不齐 P1 / P2 / P3 各一篇，换一个更宽的范围试试。`,
      );
      setPreview(null);
      return;
    }
    setError(null);
    setPreview(picks);
  }

  /** Swaps one previewed passage before the suite is committed. */
  function rerollPreview(index: number) {
    if (!preview) return;
    const taken = new Set(preview.map((exam) => exam.id));
    const pick = pickRandomExam(exams, progress, {
      category: preview[index].category,
      scope,
      exclude: taken,
    });
    if (!pick) return;
    setPreview(preview.map((exam, position) => (position === index ? pick : exam)));
  }

  /** Freezes the previewed composition into a session. */
  function start() {
    if (!preview) return;
    setSession(startSuite(preview.map(toEntry), scope));
    setPreview(null);
  }

  /** Swaps one not-yet-attempted entry for a different passage. */
  function reroll(index: number) {
    if (!session) return;
    const entry = session.entries[index];
    if (!entry || entry.recordId) return;

    const taken = new Set(session.entries.map((item) => item.examId));
    const pick = pickRandomExam(exams, progress, {
      category: entry.category,
      scope: session.scope,
      exclude: taken,
    });
    if (!pick) return;

    const entries = session.entries.map((item, position) =>
      position === index ? toEntry(pick) : item,
    );
    const next = { ...session, entries };
    saveSession(next);
    setSession(next);
  }

  function abandon() {
    clearSession();
    setSession(null);
  }

  if (records === null) {
    return <p className="text-stage-xs text-stage-fg-muted">加载套题状态…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="套题练习"
        subtitle="按 P1 → P2 → P3 的顺序连续完成三篇阅读，还原一场完整的阅读考试节奏。"
      />

      {session ? (
        <ActiveSuite
          session={session}
          recordsById={recordsById}
          onReroll={reroll}
          onAbandon={abandon}
        />
      ) : (
        <Card title="选择出题范围" subtitle={RULE_SENTENCE}>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((value) => (
              <Chip
                key={value}
                active={scope === value}
                onClick={() => {
                  setScope(value);
                  // A preview drawn under a different scope is no longer a
                  // preview of what this button would produce.
                  setPreview(null);
                }}
              >
                {FREQUENCY_SCOPE_LABELS[value]}
              </Chip>
            ))}
          </div>

          {error ? (
            <p className="mt-3 text-stage-xs text-stage-warning">{error}</p>
          ) : null}

          {preview ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-stage-xs font-medium text-stage-fg">
                  本套预览
                </p>
                <button type="button" onClick={compose} className={BUTTON_QUIET}>
                  重新抽取
                </button>
              </div>
              <ol className="overflow-hidden rounded-stage-md border border-stage-border">
                {preview.map((exam, index) => {
                  const { en, zh } = splitTitle(exam.title);
                  return (
                    <li
                      key={exam.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stage-border px-3 py-2.5 last:border-b-0"
                    >
                      <Tag>{exam.category}</Tag>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-stage-xs text-stage-fg">
                          {en}
                        </span>
                        {zh ? (
                          <span className="block truncate text-stage-2xs text-stage-fg-subtle">
                            {zh}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-stage-2xs text-stage-fg-subtle">
                        {FREQUENCY_LABELS[exam.frequency]}
                      </span>
                      <button
                        type="button"
                        onClick={() => rerollPreview(index)}
                        className={BUTTON_QUIET}
                      >
                        换一篇
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" onClick={start} className={`mt-4 ${BUTTON_PRIMARY}`}>
                开始套题
              </button>
              <p className="mt-2 text-stage-2xs text-stage-fg-subtle">
                开始后本套组成将被锁定，已完成的篇目不可更换。
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={compose}
              className={`mt-5 ${BUTTON_PRIMARY}`}
            >
              抽取三篇
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

function ActiveSuite({
  session,
  recordsById,
  onReroll,
  onAbandon,
}: {
  session: SuiteSession;
  recordsById: Map<string, PracticeRecord>;
  onReroll: (index: number) => void;
  onAbandon: () => void;
}) {
  const done = session.entries.filter((entry) => entry.recordId);
  const finished = done.length === session.entries.length;
  const next = session.entries.find((entry) => !entry.recordId);

  // Only entries whose record still exists are aggregated: a learner can delete
  // a record from history mid-suite, and the total must not count a score that
  // no longer has anything behind it.
  const scored = done
    .map((entry) => recordsById.get(entry.recordId as string))
    .filter((record): record is PracticeRecord => Boolean(record));

  const correct = scored.reduce((sum, record) => sum + record.correctAnswers, 0);
  const total = scored.reduce((sum, record) => sum + record.totalQuestions, 0);
  const duration = scored.reduce((sum, record) => sum + record.duration, 0);

  return (
    <Card
      title={finished ? "套题成绩" : "进行中"}
      subtitle={`${FREQUENCY_SCOPE_LABELS[session.scope]} · 已完成 ${done.length} / ${session.entries.length} 篇`}
      aside={
        <AbandonButton finished={finished} onConfirm={onAbandon} />
      }
    >
      {/* Native data only (ruling C1): answered, accuracy, time, and the
          per-passage breakdown below. No conversion of any kind — this is a
          record of what happened, not a score. */}
      {scored.length > 0 ? (
        <>
          <dl className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="答对题数"
              value={`${correct}/${total}`}
              hint={finished ? "三篇合计" : "已完成部分"}
            />
            <StatTile
              label="正确率"
              value={accuracyText(total > 0 ? correct / total : null)}
            />
            <StatTile label="总用时" value={formatDuration(duration)} />
          </dl>
          {finished && scored.length < session.entries.length ? (
            <p className="mb-4 text-stage-2xs text-stage-warning">
              部分记录已被删除，以上合计只包含仍保留的篇目。
            </p>
          ) : null}
        </>
      ) : (
        <EmptyNote>完成第一篇后这里会显示合计成绩。</EmptyNote>
      )}

      <p className="mb-2 mt-5 text-stage-xs font-medium text-stage-fg">
        分篇明细
      </p>
      <ol className="overflow-hidden rounded-stage-md border border-stage-border">
        {session.entries.map((entry, index) => (
          <li
            key={`${entry.examId}-${index}`}
            className="border-b border-stage-border last:border-b-0"
          >
            <SuiteRow
              entry={entry}
              index={index}
              record={
                entry.recordId ? recordsById.get(entry.recordId) : undefined
              }
              isNext={next?.examId === entry.examId}
              onReroll={() => onReroll(index)}
            />
          </li>
        ))}
      </ol>

      {next ? (
        <Link
          href={practiceHref(next.examId, "suite")}
          className={`mt-5 ${BUTTON_PRIMARY}`}
        >
          {done.length === 0 ? "开始第一篇" : `继续第 ${done.length + 1} 篇`}
        </Link>
      ) : (
        <p className="mt-5 text-stage-xs text-stage-fg-muted">
          三篇已全部完成。点击右上角可以开始新的一套。
        </p>
      )}
    </Card>
  );
}

/**
 * Abandoning a suite discards where the learner is, so it confirms first.
 *
 * Inline rather than `window.confirm`: a native dialog blocks the whole page,
 * cannot be styled or made accessible, and is one of the defects this product
 * set out not to copy (Plan §4.1.5).
 */
function AbandonButton({
  finished,
  onConfirm,
}: {
  finished: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => (finished ? onConfirm() : setConfirming(true))}
        className={BUTTON_QUIET}
      >
        {finished ? "开始新套题" : "放弃套题"}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="放弃套题确认"
      className="flex flex-wrap items-center justify-end gap-2 text-stage-2xs"
    >
      <span className="text-stage-fg-muted">
        已完成的篇目仍保留在练习记录中
      </span>
      <button type="button" onClick={onConfirm} className={BUTTON_QUIET}>
        仍要放弃
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className="rounded-stage-sm bg-stage-primary px-2.5 py-1 font-medium text-stage-fg-on-dark"
      >
        继续套题
      </button>
    </div>
  );
}

function SuiteRow({
  entry,
  index,
  record,
  isNext,
  onReroll,
}: {
  entry: SuiteEntry;
  index: number;
  record?: PracticeRecord;
  isNext: boolean;
  onReroll: () => void;
}) {
  const { en, zh } = splitTitle(entry.title);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 ${
        isNext ? "bg-stage-primary-soft" : ""
      }`}
    >
      <span className="w-5 shrink-0 text-stage-2xs tabular-nums text-stage-fg-subtle">
        {index + 1}
      </span>
      <Tag>{entry.category}</Tag>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-stage-xs text-stage-fg">{en}</span>
        {zh ? (
          <span className="block truncate text-stage-2xs text-stage-fg-subtle">
            {zh}
          </span>
        ) : null}
      </span>

      {record ? (
        <>
          <span className="text-stage-xs font-semibold tabular-nums text-stage-fg">
            {record.correctAnswers}/{record.totalQuestions}
          </span>
          <Link href={`/ielts-lab/review/${record.id}`} className={BUTTON_QUIET}>
            逐题回顾
          </Link>
          <Link href={reviewHref(entry.examId, record.id)} className={BUTTON_QUIET}>
            原题
          </Link>
        </>
      ) : entry.recordId ? (
        <span className="text-stage-2xs text-stage-fg-subtle">记录已删除</span>
      ) : (
        <button type="button" onClick={onReroll} className={BUTTON_QUIET}>
          换一篇
        </button>
      )}
    </div>
  );
}
