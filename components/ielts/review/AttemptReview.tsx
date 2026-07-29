"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildQuestionTypeStats } from "@/lib/ielts/analytics";
import { FREQUENCY_LABELS } from "@/lib/ielts/catalog";
import {
  explanationByQuestion,
  loadExamData,
  loadExplanation,
} from "@/lib/ielts/corpus";
import { passageCueOf, passageHtmlOf } from "@/lib/ielts/passage";
import { UNCLASSIFIED, questionTypeLabel, questionTypeOf } from "@/lib/ielts/question-types";
import {
  attemptsForExam,
  buildResultRows,
  type AttemptSummary,
  type ResultRow,
} from "@/lib/ielts/review";
import { practiceHref, reviewHref } from "@/lib/ielts/session";
import { getRecord, loadRecords } from "@/lib/ielts/storage";
import type { ExamFrequency, PracticeRecord } from "@/lib/ielts/types";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Card,
  EmptyNote,
  StatTile,
  splitTitle,
} from "../ui";
import { AttemptPager } from "./AttemptPager";
import {
  PassagePane,
  type PassageJump,
  type PassageStatus,
} from "./PassagePane";
import { QuestionNavigator, toNavigatorCells } from "./QuestionNavigator";
import {
  ResultTable,
  type ExplanationEntry,
  type ExplanationStatus,
} from "./ResultTable";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN");
}

/**
 * STAGE-native review of one stored attempt (P-09), as the two-pane evidence
 * template (Plan §2.4 · master-spec 批次二, Reading variant).
 *
 * Left pane the passage, right pane the questions and what was answered; a
 * wrong question links across to the paragraph its explanation names. No
 * timestamps — those belong to the listening template, not this one.
 *
 * Distinct from the runner replay reachable at `?review=`: that one re-opens
 * the paper, this one is the analysis — masked answers, per-question
 * explanations, attempt history and what to do next. Both stay, because they
 * answer different questions.
 *
 * Everything is derived from the immutable record; the corpus only ever adds
 * display detail, and its absence degrades one row (or the left pane) rather
 * than the page. Nothing here writes to storage.
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

  // Left pane. `passageOpen` is what the learner controls; the corpus request
  // is triggered by opening it, by asking for evidence, or by expanding a row —
  // never by mounting the page.
  const [passageOpen, setPassageOpen] = useState(false);
  const [passageHtml, setPassageHtml] = useState("");
  const [passageNotes, setPassageNotes] = useState<
    ReadonlyArray<{ label?: string }>
  >([]);
  const [passageStatus, setPassageStatus] = useState<PassageStatus>("idle");
  const [jumpRequest, setJumpRequest] = useState<{
    nonce: number;
    questionId: string;
    questionLabel: string;
  } | null>(null);
  const jumpNonce = useRef(0);

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
   * Loads the corpus for this paper — explanations and exam dataset — once.
   *
   * One fetch per exam, not per question: the explanation file carries every
   * question and the exam dataset carries the whole passage, so a second
   * expansion (or opening the left pane afterwards) must not refetch either.
   * `lib/ielts/corpus.ts` memoises both, so calling this again is free.
   *
   * The exam dataset rides along with the explanation rather than loading on
   * mount: its `questionDisplayMap` is the identity map for every exam in the
   * current corpus, so eagerly fetching ~16KB per review bought nothing.
   * Requesting it here keeps the page at zero corpus bytes until the learner
   * asks for something, while still correcting the numbers if a future paper
   * ships a map that is not the identity.
   */
  const requestCorpus = useCallback(
    async (questionId?: string) => {
      if (!record) return;
      if (questionId) {
        setExplanationStatus((current) =>
          current[questionId] ? current : { ...current, [questionId]: "loading" },
        );
      }
      setPassageStatus((current) => (current === "ready" ? current : "loading"));

      const [explanation, examData] = await Promise.all([
        loadExplanation(record.examId),
        loadExamData(record.examId),
      ]);
      if (examData?.questionDisplayMap) setDisplayMap(examData.questionDisplayMap);
      if (examData?.questionOrder) setQuestionOrder(examData.questionOrder);

      const html = passageHtmlOf(examData?.passage?.blocks);
      setPassageHtml(html);
      setPassageNotes(explanation?.passageNotes ?? []);
      setPassageStatus(examData ? "ready" : "unavailable");

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

  /** 「查看证据」: open the passage, then highlight what the explanation names. */
  const locate = useCallback(
    (questionId: string) => {
      const row = rows.find((candidate) => candidate.questionId === questionId);
      jumpNonce.current += 1;
      setCurrentQuestion(questionId);
      setPassageOpen(true);
      setJumpRequest({
        nonce: jumpNonce.current,
        questionId,
        questionLabel: `第 ${row?.displayNo ?? questionId} 题`,
      });
      void requestCorpus(questionId);
    },
    [rows, requestCorpus],
  );

  /**
   * The cue is read from the explanation once it is loaded; until then the
   * pane says "定位中…" rather than reporting a location it cannot know yet.
   */
  const jump = useMemo<PassageJump | null>(() => {
    if (!jumpRequest) return null;
    return {
      nonce: jumpRequest.nonce,
      questionLabel: jumpRequest.questionLabel,
      cue: passageCueOf(explanations[jumpRequest.questionId]?.text),
    };
  }, [jumpRequest, explanations]);

  const togglePassage = useCallback(() => {
    if (!passageOpen) void requestCorpus();
    setPassageOpen((open) => !open);
  }, [passageOpen, requestCorpus]);

  const byType = useMemo(
    () =>
      record
        ? buildQuestionTypeStats([record]).filter(
            (stat) => stat.type !== UNCLASSIFIED,
          )
        : [],
    [record],
  );

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
        <div className="h-20 animate-pulse rounded-stage-lg bg-stage-bg-soft" />
        <div className="h-64 animate-pulse rounded-stage-lg bg-stage-bg-soft" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <h1 className="text-stage-h3 font-semibold text-stage-fg">逐题回顾</h1>
        <EmptyNote>
          找不到这条练习记录，可能已被删除，或来自其他浏览器。
        </EmptyNote>
        <div className="flex flex-wrap gap-2">
          <Link href="/ielts-lab/history" className={BUTTON_SECONDARY}>
            返回练习记录
          </Link>
          <Link href="/ielts-lab/browse" className={BUTTON_SECONDARY}>
            去题库
          </Link>
        </div>
      </div>
    );
  }

  const runnerLink = reviewHref(record.examId, record.id);
  const { en, zh } = splitTitle(record.title);
  const frequency = record.frequency
    ? FREQUENCY_LABELS[record.frequency as ExamFrequency]
    : "";

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/ielts-lab/history"
          className="text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:text-stage-fg"
        >
          ← 练习记录
        </Link>
        <h1 className="mt-1.5 text-stage-h3 font-semibold text-stage-fg">
          {en}
        </h1>
        {zh ? (
          <p className="mt-0.5 text-stage-xs text-stage-fg-muted">{zh}</p>
        ) : null}
        <p className="mt-1.5 text-stage-2xs text-stage-fg-subtle">
          {record.category || "—"}
          {frequency ? ` · ${frequency}` : ""}
          {" · "}
          {formatDateTime(record.createdAt)}
          {record.suite
            ? ` · 套题 ${record.suite.index + 1}/${record.suite.total}`
            : record.mode === "endless"
              ? " · 无尽模式"
              : ""}
        </p>
      </header>

      {/* Answered, accuracy, time — what the attempt actually produced. No
          score conversion (ruling C1). */}
      <dl className="grid grid-cols-3 gap-3">
        <StatTile
          label="正确率"
          value={`${Math.round(record.accuracy * 100)}%`}
        />
        <StatTile
          label="得分"
          value={`${record.correctAnswers}/${record.totalQuestions}`}
        />
        <StatTile label="用时" value={formatDuration(record.duration)} />
      </dl>

      <AttemptPager
        attempts={attempts}
        currentId={record.id}
        onSelect={(id) => router.push(`/ielts-lab/review/${id}`)}
      />

      {/* The evidence template: passage left, answers right. Stacked until lg
          because two readable columns do not fit in the shell below it. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-5">
        <PassagePane
          title={record.title}
          html={passageHtml}
          status={passageStatus}
          open={passageOpen}
          onToggle={togglePassage}
          jump={jump}
          notes={passageNotes}
        />

        <div className="space-y-4">
          {/* No rows, no navigator: a record stored without per-question data
              (P-09 empty state) keeps its summary and says so in the table. */}
          {rows.length > 0 ? (
            <Card title="题目导航" subtitle="点击跳转到该题结果">
              <QuestionNavigator
                cells={toNavigatorCells(rows)}
                currentId={currentQuestion}
                onSelect={scrollToQuestion}
              />
            </Card>
          ) : null}

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
              onRequestExplanation={requestCorpus}
              explanations={explanations}
              explanationStatus={explanationStatus}
              runnerHref={runnerLink}
              typeLabel={questionTypeLabel}
              onLocate={locate}
            />
          </Card>

          {byType.length > 0 ? (
            <Card title="按题型">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-stage-2xs">
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
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* A full document load, not router.push: the practice URL may already
            be in history with a scored runner state, and only replacing the
            document gives a blank attempt. */}
        <a href={practiceHref(record.examId)} className={BUTTON_PRIMARY}>
          重做这篇
        </a>
        <Link href={runnerLink} className={BUTTON_SECONDARY}>
          在原题中回顾
        </Link>
        <Link href="/ielts-lab/mistakes" className={BUTTON_SECONDARY}>
          错题本
        </Link>
        <Link href="/ielts-lab/history" className={BUTTON_SECONDARY}>
          返回记录
        </Link>
      </div>
    </div>
  );
}
