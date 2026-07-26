"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildQuestionTypeStats } from "@/lib/ielts/analytics";
import { formatBand, estimateBand } from "@/lib/ielts/band";
import {
  explanationByQuestion,
  loadExamData,
  loadExplanation,
} from "@/lib/ielts/corpus";
import { UNCLASSIFIED, questionTypeLabel, questionTypeOf } from "@/lib/ielts/question-types";
import {
  attemptsForExam,
  buildResultRows,
  type AttemptSummary,
  type ResultRow,
} from "@/lib/ielts/review";
import { practiceHref, reviewHref } from "@/lib/ielts/session";
import { getRecord, loadRecords } from "@/lib/ielts/storage";
import type { PracticeRecord } from "@/lib/ielts/types";
import { Card, EmptyNote, StatTile } from "../ui";
import { AttemptPager } from "./AttemptPager";
import { QuestionNavigator, toNavigatorCells } from "./QuestionNavigator";
import {
  ResultTable,
  type ExplanationEntry,
  type ExplanationStatus,
} from "./ResultTable";

const ACTION_PRIMARY =
  "rounded-stage-md bg-stage-primary px-4 py-2 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover";
const ACTION_SECONDARY =
  "rounded-stage-md border border-stage-border px-4 py-2 text-sm transition-colors hover:border-stage-primary";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN");
}

/**
 * STAGE-native review of one stored attempt (P-09).
 *
 * Distinct from the runner replay reachable at `?review=`: that one re-opens
 * the paper, this one is the analysis — masked answers, per-question
 * explanations, attempt history and what to do next. Both stay, because they
 * answer different questions.
 *
 * Everything is derived from the immutable record; the corpus only ever adds
 * display detail, and its absence degrades one row rather than the page.
 */
export function AttemptReview({ recordId }: { recordId: string }) {
  const router = useRouter();
  // localStorage is unreadable until after mount: null means "still loading",
  // which is a different state from "not found".
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<string | undefined>();
  const [displayMap, setDisplayMap] = useState<Record<string, string>>({});
  const [questionOrder, setQuestionOrder] = useState<string[] | undefined>();
  const [explanations, setExplanations] = useState<
    Record<string, ExplanationEntry | undefined>
  >({});
  const [explanationStatus, setExplanationStatus] = useState<
    Record<string, ExplanationStatus>
  >({});

  useEffect(() => {
    const found = getRecord(recordId);
    setRecord(found ?? null);
    if (found) setAttempts(attemptsForExam(loadRecords(), found.examId));
    // Reveal state is deliberately per-visit: re-opening a review starts masked.
    setRevealed(new Set());
    setLoading(false);
  }, [recordId]);

  const rows = useMemo<ResultRow[]>(
    () =>
      record
        ? buildResultRows(record, {
            displayMap,
            questionOrder,
            resolveQuestionType: questionTypeOf,
          })
        : [],
    [record, displayMap, questionOrder],
  );

  /**
   * Loads the corpus explanation set once, on the first row expansion.
   *
   * One fetch per exam, not per question: the explanation file carries every
   * question, so expanding a second row must not refetch it.
   */
  const requestExplanation = useCallback(
    async (questionId: string) => {
      if (!record) return;
      setExplanationStatus((current) =>
        current[questionId] ? current : { ...current, [questionId]: "loading" },
      );

      // The exam dataset rides along with the first explanation rather than
      // loading on mount: its `questionDisplayMap` is the identity map for every
      // exam in the current corpus, so eagerly fetching ~16KB per review bought
      // nothing. Requesting it here keeps the page at zero corpus bytes until
      // the learner asks for an explanation, while still correcting the numbers
      // if a future paper ships a map that is not the identity.
      const [explanation, examData] = await Promise.all([
        loadExplanation(record.examId),
        loadExamData(record.examId),
      ]);
      if (examData?.questionDisplayMap) setDisplayMap(examData.questionDisplayMap);
      if (examData?.questionOrder) setQuestionOrder(examData.questionOrder);

      const byQuestion = explanationByQuestion(explanation);

      setExplanations((current) => {
        const next = { ...current };
        for (const [id, entry] of byQuestion) next[id] = entry;
        return next;
      });
      setExplanationStatus((current) => {
        const next = { ...current };
        for (const row of rows) {
          next[row.questionId] = byQuestion.has(row.questionId)
            ? "ready"
            : "unavailable";
        }
        return next;
      });
    },
    [record, rows],
  );

  const byType = useMemo(
    () =>
      record
        ? buildQuestionTypeStats([record]).filter(
            (stat) => stat.type !== UNCLASSIFIED,
          )
        : [],
    [record],
  );

  const band = record
    ? estimateBand(record.correctAnswers, record.totalQuestions)
    : null;

  function scrollToQuestion(questionId: string) {
    setCurrentQuestion(questionId);
    const target =
      document.getElementById(`row-${questionId}`) ??
      document.getElementById(`row-m-${questionId}`);
    if (!target) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    target.scrollIntoView({
      block: "center",
      behavior: reduced ? "auto" : "smooth",
    });
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-6 w-2/3 animate-pulse rounded bg-stage-bg-soft" />
        <div className="h-20 animate-pulse rounded-stage-md bg-stage-bg-soft" />
        <div className="h-64 animate-pulse rounded-stage-md bg-stage-bg-soft" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">逐题回顾</h1>
        <EmptyNote>
          找不到这条练习记录，可能已被删除，或来自其他浏览器。
        </EmptyNote>
        <div className="flex flex-wrap gap-2">
          <Link href="/ielts-lab/history" className={ACTION_SECONDARY}>
            返回练习记录
          </Link>
          <Link href="/ielts-lab/browse" className={ACTION_SECONDARY}>
            去题库
          </Link>
        </div>
      </div>
    );
  }

  const runnerLink = reviewHref(record.examId, record.id);

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/ielts-lab/history"
          className="text-xs text-stage-fg-muted transition-colors hover:text-stage-fg"
        >
          ← 练习记录
        </Link>
        <h1 className="mt-1 text-xl font-semibold md:text-2xl">
          {record.title}
        </h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          {record.category || "—"}
          {record.frequency ? ` · ${record.frequency === "high" ? "高频" : record.frequency === "medium" ? "次高频" : "低频"}` : ""}
          {" · "}
          {formatDateTime(record.createdAt)}
          {record.suite
            ? ` · 套题 ${record.suite.index + 1}/${record.suite.total}`
            : record.mode === "endless"
              ? " · 无尽模式"
              : ""}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="正确率"
          value={`${Math.round(record.accuracy * 100)}%`}
        />
        <StatTile
          label="得分"
          value={`${record.correctAnswers}/${record.totalQuestions}`}
        />
        <StatTile label="用时" value={formatDuration(record.duration)} />
        <StatTile
          label="本篇折合"
          value={band ? formatBand(band.band) : "—"}
          hint={
            band
              ? `估算 · ${band.scaled ? `按 ${band.total} 题折算` : "按 40 题"}`
              : "题量不足"
          }
        />
      </dl>

      <AttemptPager
        attempts={attempts}
        currentId={record.id}
        onSelect={(id) => router.push(`/ielts-lab/review/${id}`)}
      />

      <Card title="题目导航" subtitle="点击跳转到该题结果">
        <QuestionNavigator
          cells={toNavigatorCells(rows)}
          currentId={currentQuestion}
          onSelect={scrollToQuestion}
        />
      </Card>

      <Card title="逐题结果">
        <ResultTable
          rows={rows}
          revealed={revealed}
          onReveal={(questionId) =>
            setRevealed((current) => new Set(current).add(questionId))
          }
          onRevealAll={() =>
            setRevealed(new Set(rows.map((row) => row.questionId)))
          }
          onHideAll={() => setRevealed(new Set())}
          onRequestExplanation={requestExplanation}
          explanations={explanations}
          explanationStatus={explanationStatus}
          runnerHref={runnerLink}
          typeLabel={questionTypeLabel}
        />
      </Card>

      {byType.length > 0 ? (
        <Card title="按题型">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {byType.map((stat) => (
              <li key={stat.type} className="text-stage-fg-muted">
                {stat.label}{" "}
                <span className="font-semibold tabular-nums text-stage-fg">
                  {stat.correct}/{stat.attempted}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {/* A full document load, not router.push: the practice URL may already
            be in history with a scored runner state, and only replacing the
            document gives a blank attempt. */}
        <a href={practiceHref(record.examId)} className={ACTION_PRIMARY}>
          重做这篇
        </a>
        <Link href={runnerLink} className={ACTION_SECONDARY}>
          在原题中回顾
        </Link>
        <Link href="/ielts-lab/mistakes" className={ACTION_SECONDARY}>
          错题本
        </Link>
        <Link href="/ielts-lab/history" className={ACTION_SECONDARY}>
          返回记录
        </Link>
      </div>
    </div>
  );
}
