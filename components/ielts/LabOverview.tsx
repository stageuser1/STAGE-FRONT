"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadDrafts, type DraftEntry } from "@/lib/ielts/draft";
import { buildProgressIndex, pickRandomExam } from "@/lib/ielts/progress";
import { isDueForRetest } from "@/lib/ielts/retest";
import {
  clearSession,
  loadSession,
  practiceHref,
  reviewHref,
  type PracticeSession,
} from "@/lib/ielts/session";
import {
  hasMaterial,
  loadSpeakingStates,
  type SpeakingQuestionState,
} from "@/lib/ielts/speaking-session";
import { computeStats, loadRecords } from "@/lib/ielts/storage";
import type { ExamCategory, ExamSummary, PracticeRecord } from "@/lib/ielts/types";
import {
  loadWritingSessions,
  type WritingSessionState,
} from "@/lib/ielts/writing-session";
import { buildWrongbook } from "@/lib/ielts/wrongbook";
import { loadProfile, patchProfile } from "@/lib/profile/storage";
import {
  ENGLISH_SUBJECTS,
  TARGET_MAX,
  TARGET_MIN,
  TARGET_STEP,
  emptyTargets,
  normaliseTarget,
  type EnglishSubject,
} from "@/lib/profile/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  BUTTON_DISABLED_SM,
  BUTTON_GHOST_SM,
  BUTTON_PRIMARY,
  BUTTON_PRIMARY_SM,
  BUTTON_SECONDARY,
  BUTTON_SECONDARY_SM,
  Badge,
  EmptyNote,
  accuracyText,
  splitTitle,
} from "./ui";

/** Onboarding strip dismissal. Follows the `stage.*` key convention (Plan §6.3). */
const ONBOARDING_KEY = "stage.ielts.onboarding";

/**
 * The three steps of the starter strip (supplement §三).
 *
 * Labels and descriptions are the approved export's own wording, verbatim.
 *
 * Two of them describe more than this build ships: step 1 names Listening,
 * which has no module, and step 3's 安排重测 names a scheduling step nothing in
 * STAGE performs. Both are flagged in the T-stage report rather than silently
 * reworded — the copy is 逐字 and not the implementer's to edit.
 */
const ONBOARDING_STEPS = [
  { label: "选科目", detail: "从 Reading、Listening、Writing、Speaking 中选择" },
  { label: "去练习", detail: "在真实节奏下完成一次练习" },
  { label: "复盘巩固", detail: "查看证据复盘，标记弱点，安排重测" },
] as const;

/**
 * Subject labels for the target-score inputs.
 *
 * The export labels these in English, matching the skill names used by the
 * sidebar and the module cards. `ENGLISH_SUBJECT_LABELS` is the Chinese set the
 * profile wizard uses and is left alone — the two surfaces disagree on purpose.
 */
const TARGET_SUBJECT_LABELS: Record<EnglishSubject, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

/** Wrong answers old enough to be due, counted in questions (not passages). */
function countRetestDue(
  records: readonly PracticeRecord[],
  exams: readonly ExamSummary[],
): number {
  return buildWrongbook(records, { exams }).reduce(
    (sum, entry) =>
      isDueForRetest(entry.latestAttemptAt) ? sum + entry.wrongCount : sum,
    0,
  );
}

/** Questions answered across all attempts — the export's 已练习题目 · 题. */
function countQuestionsPractised(records: readonly PracticeRecord[]): number {
  return records.reduce(
    (sum, record) => sum + (Number(record.totalQuestions) || 0),
    0,
  );
}

/**
 * Mean accuracy over the trailing 30 days, or null when that window is empty.
 *
 * Computed here rather than read off `computeStats`, whose `averageAccuracy` is
 * all-time: the export labels this metric 近 30 天, and reporting a lifetime
 * figure under that label would be a false statement about the window.
 */
function accuracyLast30Days(records: readonly PracticeRecord[]): number | null {
  const cutoff = Date.now() - 30 * 86_400_000;
  let sum = 0;
  let count = 0;
  for (const record of records) {
    const at = new Date(record.createdAt).getTime();
    if (!Number.isFinite(at) || at < cutoff) continue;
    sum += record.accuracy;
    count += 1;
  }
  return count > 0 ? sum / count : null;
}

/** Cumulative study time as the export writes it: `42h`, or `35m` under an hour. */
function studyTimeText(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 60) return "—";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
}

/**
 * Distinct question kinds in the reading corpus.
 *
 * The export's mock card reads `4 大题型`; this corpus actually carries 13
 * (lib/ielts/question-types.json `kinds`). The real count is used, since the
 * label is a claim about the question bank rather than decoration. Hard-coded
 * rather than imported because that index is ~26KB and would land in this
 * route's client bundle for the sake of one integer.
 */
const READING_QUESTION_KINDS = 13;

/** `2026-07-27`, the export's date format for a history row. */
function isoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** What one action slot on a module card resolves to. */
type ModuleAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "button"; label: string; onClick: () => void }
  | { kind: "disabled"; label: string };

interface ModuleCardData {
  skill: string;
  icon: IconName;
  /** Right-aligned qualifier beside the skill name. */
  sub: string;
  facts: readonly string[];
  done: number;
  total: number;
  /** Counting word: 篇 / 段 / 题 / 话题. */
  unit: string;
  /**
   * Latest accuracy for this skill, or null when the module produces none.
   *
   * Writing and Speaking are permanently null: neither is scored, and ruling C1
   * forbids deriving a figure for them. The row still renders (the export draws
   * four uniform cards) and reads `—`.
   */
  lastAccuracy: number | null;
  actions: readonly [ModuleAction, ModuleAction];
}

/**
 * IELTS Lab entry screen.
 *
 * Answers the three questions the master spec's overview answers on open:
 * where was I, what should I do next, and how far through am I. Its body is
 * the 批次一 layout minus the rulings' deferred items — no review queue card
 * (C3+C6), and only the Reading module card, because a module card for a skill
 * with no module would be the "即将上线" placeholder the spec forbids.
 */
export function LabOverview({
  exams,
  /** Published writing sets. Zero renders the Writing card's totals as 0. */
  writingSetCount = 0,
  /** Questions in the static Speaking corpus. */
  speakingQuestionCount = 0,
}: {
  exams: ExamSummary[];
  writingSetCount?: number;
  speakingQuestionCount?: number;
}) {
  const router = useRouter();
  // localStorage and sessionStorage are unreadable until after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [writingSessions, setWritingSessions] = useState<WritingSessionState[]>(
    [],
  );
  const [speakingStates, setSpeakingStates] = useState<SpeakingQuestionState[]>(
    [],
  );

  useEffect(() => {
    setRecords(loadRecords());
    setSession(loadSession());
    setDrafts([...loadDrafts().values()]);
    setWritingSessions([...loadWritingSessions().values()]);
    setSpeakingStates([...loadSpeakingStates().values()]);
  }, []);

  const progress = useMemo(
    () => buildProgressIndex(records ?? []),
    [records],
  );
  const stats = useMemo(
    () => (records ? computeStats(records) : null),
    [records],
  );
  const retestDue = useMemo(
    () => (records ? countRetestDue(records, exams) : 0),
    [records, exams],
  );

  const examsById = useMemo(() => {
    const map = new Map<string, ExamSummary>();
    for (const exam of exams) map.set(exam.id, exam);
    return map;
  }, [exams]);

  /**
   * The single passage worth offering to resume.
   *
   * Drafts are the runner's own autosave markers, so the most recently touched
   * one is where the learner actually left off.
   */
  const resumable = useMemo(() => {
    const candidates = drafts
      .filter((draft) => examsById.has(draft.examId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    return candidates[0] ?? null;
  }, [drafts, examsById]);

  function startRandom(category?: ExamCategory) {
    const pick = pickRandomExam(exams, progress, { category });
    if (pick) router.push(practiceHref(pick.id));
  }

  const recent = (records ?? []).slice(0, 5);
  const resumableExam = resumable ? examsById.get(resumable.examId) : undefined;

  /** Speaking question with material, most recently touched — 继续构建's target. */
  const resumableSpeaking = useMemo(
    () =>
      [...speakingStates]
        .filter((state) => hasMaterial(state))
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0],
    [speakingStates],
  );

  /**
   * The four skill cards.
   *
   * Structure and wording come from the approved export; every FIGURE comes from
   * this build. Where the two disagree the real number wins — the export's mock
   * says Listening has 186 段 and Speaking 96 话题, but this build has no
   * listening corpus at all, and the speaking total is whatever the corpus
   * module currently holds (no number is written down here, so a corpus update
   * cannot make this comment stale).
   */
  const moduleCards: readonly ModuleCardData[] = [
    {
      skill: "Reading",
      icon: "book-open",
      sub: `${READING_QUESTION_KINDS} 大题型`,
      facts: [
        `题库总量 ${exams.length} 篇`,
        "频次分层筛选",
        "讲解按答题解锁",
      ],
      done: progress.size,
      total: exams.length,
      unit: "篇",
      lastAccuracy: records?.[0]?.accuracy ?? null,
      actions: [
        { kind: "link", label: "浏览题库", href: "/ielts-lab/browse" },
        { kind: "button", label: "随机练习", onClick: () => startRandom() },
      ],
    },
    {
      // No corpus, no route. The card renders so the row is the export's four,
      // but every figure is zero and both actions are inert — the same treatment
      // the sidebar gives this entry.
      skill: "Listening",
      icon: "headphones",
      sub: "P1–P4",
      facts: ["题库总量 0 段", "原文证据复盘", "套题模式可选"],
      done: 0,
      total: 0,
      unit: "段",
      lastAccuracy: null,
      actions: [
        { kind: "disabled", label: "浏览题库" },
        { kind: "disabled", label: "随机练习" },
      ],
    },
    {
      skill: "Writing",
      icon: "pen-line",
      sub: "Task 1 & Task 2",
      facts: ["小作文按图型分类", "草稿自动保存", "范文按完成解锁"],
      done: writingSessions.filter((entry) => entry.completedAt).length,
      total: writingSetCount,
      unit: "题",
      lastAccuracy: null,
      actions: [
        { kind: "link", label: "浏览题库", href: "/ielts-lab/writing" },
        // The module has no random-draw entry point to route to.
        { kind: "disabled", label: "随机练习" },
      ],
    },
    {
      skill: "Speaking",
      icon: "messages-square",
      sub: "五步流程",
      facts: ["九维度素材库", "个人故事构建", "可导出 / 导入"],
      done: speakingStates.filter((state) => hasMaterial(state)).length,
      total: speakingQuestionCount,
      unit: "话题",
      lastAccuracy: null,
      actions: [
        { kind: "link", label: "进入素材库", href: "/ielts-lab/speaking" },
        resumableSpeaking
          ? {
              kind: "link",
              label: "继续构建",
              href: `/ielts-lab/speaking/${resumableSpeaking.questionId}`,
            }
          : { kind: "disabled", label: "继续构建" },
      ],
    },
  ];

  return (
    // 18px between blocks, per the export's own page grid. The explicit
    // minmax(0,1fr) column is load-bearing: an `auto` track is sized by its
    // items' min-content contributions, so one nowrap child (the onboarding
    // steps) would otherwise widen the column past the viewport and take every
    // sibling with it.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px]">
      <h1 className="text-stage-h2 font-bold leading-[1.15] text-stage-fg">
        学习总览
      </h1>

      <OnboardingStrip />

      {resumable ? (
        <ContinueBar
          draft={resumable}
          title={resumableExam?.title ?? resumable.examId}
          category={resumableExam?.category ?? ""}
        />
      ) : null}

      {session ? (
        <ResumeBanner
          session={session}
          onDismiss={() => {
            clearSession();
            setSession(null);
          }}
        />
      ) : null}

      {retestDue > 0 ? <RetestBar count={retestDue} /> : null}

      <MetricRow
        questions={records ? countQuestionsPractised(records) : 0}
        accuracy30d={records ? accuracyLast30Days(records) : null}
        studyTime={studyTimeText(stats?.totalTimeSeconds ?? 0)}
        streak={stats?.streakDays ?? 0}
      />

      <TargetScoreCard />

      {/* Four equal cards on one row; auto-fit reflows them below ~960px. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
        {moduleCards.map((card) => (
          <ModuleCard key={card.skill} card={card} />
        ))}
      </div>

      <RecentPractice records={recent} />

      <TrademarkDisclaimer />
    </div>
  );
}

/**
 * IELTS trademark disclaimer — the approved export's `LabFooter`, verbatim.
 *
 * Two paragraphs rather than the export's single string, so the two sentences
 * always break where the design breaks them. The export's 88ch measure is
 * dropped with it: at 11px that cap is ~530px, which wrapped the first sentence
 * onto a second line and made the block three lines instead of two. The
 * content column's own 1160px ceiling is the measure now.
 *
 * `mt` completes the export's rhythm: the page grid already contributes 18px,
 * and the export puts 56px between the last content block and the rule, then
 * 22px between the rule and the text.
 *
 * NOTE: the export renders this in the app shell, so it sits under every
 * non-fullbleed Lab screen, not only the overview. It lives here because this
 * step is scoped to the overview; it likely wants to move up to the shell
 * layout once the other screens are rebuilt.
 */
function TrademarkDisclaimer() {
  return (
    <footer className="mt-[38px] border-t border-stage-border pt-[22px] text-stage-2xs leading-[1.85] text-stage-fg-subtle">
      <p>
        IELTS® 是英国文化教育协会（British Council）、IDP IELTS Australia
        与剑桥大学英语考评部（Cambridge Assessment English）的注册商标。
      </p>
      <p>STAGE 与上述机构不存在任何关联、认可或合作关系。</p>
    </footer>
  );
}

/**
 * Starter strip (supplement §三).
 *
 * A thin rule with small controls rather than a banner — the Plan leaves the
 * exact treatment to the implementer and forbids marketing-weight promos
 * inside the study surface. Rendered only after the dismissal flag has been
 * read, so a returning learner never sees it flash.
 */
function OnboardingStrip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(ONBOARDING_KEY) !== "dismissed");
    } catch {
      // Private-mode storage refusal: show it, it costs one row.
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="新手引导"
      className="flex flex-wrap items-center gap-3.5 rounded-stage-md border border-stage-border px-4 py-[11px]"
    >
      {/* Each step is nowrap inside a wrapping row, so a viewport that is merely
          narrow moves whole steps to the next line instead of breaking one in
          half. Below `sm` the longest step is wider than the viewport itself, so
          nowrap is dropped and the text wraps rather than overflowing — the
          export is a desktop-only surface and never meets this case. */}
      <ol className="flex flex-wrap items-center gap-3.5">
        {ONBOARDING_STEPS.map((step, index) => (
          <li
            key={step.label}
            className="inline-flex items-center gap-2 text-stage-xs text-stage-fg-body sm:whitespace-nowrap"
          >
            <span
              aria-hidden
              className="grid h-[18px] w-[18px] flex-none place-items-center rounded-stage-pill bg-stage-primary-soft font-stage-mono text-[10px] text-stage-primary"
            >
              {index + 1}
            </span>
            <span className="font-medium">{step.label}</span>
            <span className="text-stage-fg-subtle">— {step.detail}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        aria-label="关闭引导"
        title="关闭引导"
        onClick={() => {
          setVisible(false);
          try {
            window.localStorage.setItem(ONBOARDING_KEY, "dismissed");
          } catch {
            // Dismissal is a preference; failing to store it is not an error.
          }
        }}
        className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-stage-sm border border-transparent text-stage-fg-muted transition-colors duration-stage-fast ease-stage-standard hover:bg-stage-bg-soft hover:text-stage-fg"
      >
        <Icon name="close" size={16} />
      </button>
    </aside>
  );
}

/**
 * Continue bar (master-spec 批次一 §1).
 *
 * Driven by the runner's autosave marker, which is why it can honestly say
 * 已自动保存: STAGE is reporting that the runner saved, not claiming to have
 * saved anything itself.
 */
function ContinueBar({
  draft,
  title,
  category,
}: {
  draft: DraftEntry;
  title: string;
  category: ExamCategory | "";
}) {
  const { en, zh } = splitTitle(title);
  // The corpus stores the part as P1/P2/P3; the export writes it out in full.
  const meta = [
    zh,
    category ? `Reading Passage ${category.slice(1)}` : "Reading",
    draft.total > 0 ? `进度 ${draft.answered} / ${draft.total} 题` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-stage-lg border border-stage-border-accent bg-stage-primary-soft px-5 py-4">
      <span aria-hidden className="grid flex-none text-stage-primary">
        <Icon name="book-open" size={19} />
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="text-stage-sm font-semibold text-stage-fg">
          继续上次：{en}
        </p>
        <p className="mt-0.5 text-stage-xs text-stage-fg-muted">{meta}</p>
      </div>
      <Link href={practiceHref(draft.examId)} className={BUTTON_PRIMARY_SM}>
        继续
      </Link>
      <span className="inline-flex items-center gap-[5px] text-stage-xs text-stage-fg-subtle">
        <Icon aria-hidden name="check" size={12} strokeWidth={2.5} />
        已自动保存
      </span>
    </section>
  );
}

/**
 * Retest reminder (master-spec 批次一 §2).
 *
 * The wording is verbatim. What makes a question "due" is
 * `RETEST_DUE_AFTER_DAYS` — a placeholder, since STAGE schedules nothing; see
 * that constant.
 */
function RetestBar({ count }: { count: number }) {
  return (
    <section className="flex flex-wrap items-center gap-3.5 rounded-stage-lg border border-stage-border px-5 py-3.5">
      <span aria-hidden className="grid flex-none text-stage-fg-subtle">
        <Icon name="rotate-ccw" size={18} />
      </span>
      <p className="flex-1 text-stage-sm text-stage-fg-body">
        有 {count} 道错题到了建议重测的时间
      </p>
      <Link href="/ielts-lab/mistakes" className={BUTTON_SECONDARY_SM}>
        去重测
      </Link>
    </section>
  );
}

/**
 * The four core metrics (master-spec 批次一 §3).
 *
 * One bordered container with 1px gaps over a hairline background, so every
 * cell is ruled on all four sides — the export's trick for making a wrapped
 * row impossible to leave with a dividerless orphan cell.
 *
 * Native data only: questions, accuracy, time and days. Nothing here is
 * projected onto a band scale (ruling C1).
 */
function MetricRow({
  questions,
  accuracy30d,
  studyTime,
  streak,
}: {
  questions: number;
  /** Null when no attempt falls inside the window — rendered as `—`, not 0%. */
  accuracy30d: number | null;
  studyTime: string;
  streak: number;
}) {
  const metrics = [
    { label: "已练习题目", note: "题", value: String(questions) },
    { label: "平均正确率", note: "近 30 天", value: accuracyText(accuracy30d) },
    { label: "学习时长", note: "累计", value: studyTime },
    { label: "连续学习", note: "天", value: String(streak) },
  ];

  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-px overflow-hidden rounded-stage-lg border border-stage-border bg-stage-border">
      {metrics.map((metric) => (
        // dt precedes dd in the DOM (a dl group requires it) while
        // flex-col-reverse puts the figure on top, as the export draws it.
        <div
          key={metric.label}
          className="flex flex-col-reverse gap-[5px] bg-stage-bg px-[22px] py-5"
        >
          <dt className="text-stage-xs text-stage-fg-muted">
            {metric.label} · {metric.note}
          </dt>
          <dd className="text-[clamp(1.75rem,2.4vw,2.5rem)] font-bold leading-none tracking-[-0.03em] tabular-nums text-stage-fg">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One skill card (master-spec 批次一 §4, in the export's four-across layout).
 *
 * Uniform across all four skills, including the ones with less behind them: the
 * export draws four cards and the row is the page's skill index. What varies is
 * the data (zeros where there is nothing) and whether the actions resolve.
 */
function ModuleCard({ card }: { card: ModuleCardData }) {
  const ratio = card.total > 0 ? card.done / card.total : 0;
  // The export floors a non-empty bar at 1.5% so a single attempt still reads as
  // a mark rather than an empty track. A module with no corpus stays at 0.
  const percent = card.total > 0 ? Math.max(ratio * 100, 1.5) : 0;

  return (
    <section className="grid content-start gap-3 rounded-stage-lg border border-stage-border bg-stage-bg p-5">
      <div className="flex items-center gap-[9px]">
        <span aria-hidden className="grid flex-none text-stage-primary">
          <Icon name={card.icon} size={19} />
        </span>
        <h2 className="text-stage-h4 font-semibold text-stage-fg">
          {card.skill}
        </h2>
        <span className="ml-auto text-stage-xs text-stage-fg-subtle">
          {card.sub}
        </span>
      </div>

      <ul className="grid gap-1.5">
        {card.facts.map((fact) => (
          <li
            key={fact}
            className="flex gap-2 text-stage-xs leading-[1.6] text-stage-fg-body"
          >
            {/* The export's 12px minus glyph, inline so this step stays inside
                one file rather than extending the shared Icon set. */}
            <span
              aria-hidden
              className="grid flex-none pt-[3px] text-stage-neutral-400"
            >
              <svg
                fill="none"
                height="12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="12"
              >
                <path d="M5 12h14" />
              </svg>
            </span>
            {fact}
          </li>
        ))}
      </ul>

      <div className="grid gap-[7px]">
        <div className="flex items-baseline justify-between text-stage-xs text-stage-fg-muted">
          <span>已练习</span>
          <span className="flex-none whitespace-nowrap pl-2 font-stage-mono text-stage-fg-body">
            {card.done} / {card.total} {card.unit}
          </span>
        </div>
        <div
          className="h-[5px] overflow-hidden rounded-stage-pill bg-stage-neutral-100"
          role="progressbar"
          aria-valuenow={Math.round(ratio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${card.skill} 题库完成进度`}
        >
          <div
            className="h-full rounded-stage-pill bg-stage-blue-600 transition-[width] duration-stage-base"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-baseline justify-between text-stage-xs text-stage-fg-muted">
          <span>最近一次正确率</span>
          <span className="flex-none whitespace-nowrap pl-2 font-stage-mono text-stage-fg-body">
            {accuracyText(card.lastAccuracy)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {card.actions.map((action, index) => (
          <ModuleActionButton
            key={action.label}
            action={action}
            variant={index === 0 ? "outline" : "ghost"}
          />
        ))}
      </div>
    </section>
  );
}

/** One of a module card's two action slots, at the export's sm size. */
function ModuleActionButton({
  action,
  variant,
}: {
  action: ModuleAction;
  variant: "outline" | "ghost";
}) {
  const shell = `w-full flex-1 ${
    variant === "outline" ? BUTTON_SECONDARY_SM : BUTTON_GHOST_SM
  }`;

  // A span, not a disabled <button>: there is no action to disable, the module
  // simply has nowhere to go yet. Matches the sidebar's inert Listening entry.
  if (action.kind === "disabled") {
    return (
      <span
        aria-disabled="true"
        className={`w-full flex-1 ${BUTTON_DISABLED_SM}`}
      >
        {action.label}
      </span>
    );
  }

  if (action.kind === "link") {
    return (
      <Link href={action.href} className={shell}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={shell}>
      {action.label}
    </button>
  );
}

/**
 * 最近练习 (master-spec 批次一 §5).
 *
 * The export's row carries a 全体平均 figure beside the learner's own. It is
 * absent here on two counts: nothing in the data layer holds a cohort average
 * (neither PracticeRecord nor ExamSummary has such a field), and ruling C4
 * struck that figure from the spec.
 */
function RecentPractice({ records }: { records: readonly PracticeRecord[] }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 pb-3">
        <h2 className="text-stage-h4 font-semibold text-stage-fg">最近练习</h2>
        <Link
          href="/ielts-lab/question-types"
          className="ml-auto text-stage-sm font-medium text-stage-fg-muted transition-colors duration-stage-fast hover:text-stage-fg"
        >
          题型说明
        </Link>
        <Link
          href="/ielts-lab/history"
          className="text-stage-sm font-medium text-stage-primary transition-colors duration-stage-fast hover:text-stage-primary-hover"
        >
          全部记录 →
        </Link>
      </div>

      {records.length === 0 ? (
        <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
      ) : (
        // The row is a five-column table and cannot compress far; below its
        // natural width it scrolls inside this container rather than pushing the
        // page sideways. The export is desktop-only and defines no narrow form.
        <div className="overflow-x-auto">
          <ul className="min-w-[720px] overflow-hidden rounded-stage-lg border border-stage-border">
            {records.map((record, index) => (
              <RecentRow
                key={record.id}
                record={record}
                last={index === records.length - 1}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** One row of 最近练习: title (EN + zh), type tag, date, accuracy, 回顾. */
function RecentRow({
  record,
  last,
}: {
  record: PracticeRecord;
  last: boolean;
}) {
  const { en, zh } = splitTitle(record.title);
  // Every record this build can produce is a reading attempt. The tag still
  // names the skill, because the export's row is skill-labelled and this list
  // gains other skills as their modules land.
  const tag = record.category
    ? `Reading Passage ${record.category.slice(1)}`
    : "Reading";

  return (
    <li
      className={`grid grid-cols-[1.6fr_auto_auto_auto_auto] items-center gap-[18px] px-[18px] py-3.5 ${
        last ? "" : "border-b border-stage-border"
      }`}
    >
      <span className="grid min-w-0">
        <span className="truncate text-stage-sm font-medium text-stage-fg">
          {en}
        </span>
        {zh ? (
          <span className="mt-0.5 truncate text-stage-2xs text-stage-fg-subtle">
            {zh}
          </span>
        ) : null}
      </span>
      <Badge tone="neutral">{tag}</Badge>
      <span className="font-stage-mono text-stage-2xs text-stage-fg-subtle">
        {isoDate(record.createdAt)}
      </span>
      <span className="text-stage-xs text-stage-fg-body">
        我的正确率{" "}
        <span className="font-stage-mono font-medium">
          {accuracyText(record.accuracy)}
        </span>
      </span>
      <Link
        href={reviewHref(record.examId, record.id)}
        className="justify-self-end text-stage-xs font-semibold text-stage-primary transition-colors duration-stage-fast hover:text-stage-primary-hover"
      >
        回顾
      </Link>
    </li>
  );
}

/**
 * The learner's own target scores (ruling C1).
 *
 * STAGE no longer produces a score of any kind, so the only band figures in the
 * Lab are the ones the learner types here. Nothing derives them, nothing
 * overwrites them, and the helper line says exactly what they are for.
 *
 * All four subjects are offered even though only Reading has a module today:
 * these are the learner's own plans, not a claim about what STAGE can practise.
 */
function TargetScoreCard() {
  // localStorage is unreadable until after mount; drafts keep the input
  // editable mid-typing without a half-entered value being snapped to 0.5.
  const [drafts, setDrafts] = useState<Record<EnglishSubject, string>>({
    reading: "",
    listening: "",
    writing: "",
    speaking: "",
  });

  useEffect(() => {
    const stored = loadProfile()?.english.targets ?? emptyTargets();
    setDrafts({
      reading: stored.reading === null ? "" : String(stored.reading),
      listening: stored.listening === null ? "" : String(stored.listening),
      writing: stored.writing === null ? "" : String(stored.writing),
      speaking: stored.speaking === null ? "" : String(stored.speaking),
    });
  }, []);

  function persist(subject: EnglishSubject, value: number | null) {
    patchProfile((profile) => ({
      ...profile,
      english: {
        ...profile.english,
        targets: { ...profile.english.targets, [subject]: value },
      },
    }));
  }

  function onType(subject: EnglishSubject, raw: string) {
    setDrafts((current) => ({ ...current, [subject]: raw }));
    if (raw.trim() === "") {
      persist(subject, null);
      return;
    }
    const parsed = Number(raw);
    // Persist only a value already inside the range; anything else waits for
    // blur, where it is clamped rather than stored as typed.
    if (
      Number.isFinite(parsed) &&
      parsed >= TARGET_MIN &&
      parsed <= TARGET_MAX
    ) {
      persist(subject, parsed);
    }
  }

  function onCommit(subject: EnglishSubject) {
    const raw = drafts[subject];
    const value =
      raw.trim() === "" ? null : normaliseTarget(Number(raw));
    persist(subject, value);
    setDrafts((current) => ({
      ...current,
      [subject]: value === null ? "" : String(value),
    }));
  }

  return (
    <section className="rounded-stage-lg border border-stage-border px-5 py-[18px]">
      {/* role=group rather than fieldset/legend: the export puts the note on the
          title's baseline, and a <legend> has to be the fieldset's first child,
          which cannot be laid out that way without losing the accessible name. */}
      <div
        role="group"
        aria-labelledby="target-score-title"
        className="grid gap-3.5"
      >
        {/* The note qualifies what these figures are before any is read. */}
        <div className="flex flex-wrap items-baseline gap-3">
          <h2
            id="target-score-title"
            className="text-stage-h4 font-semibold text-stage-fg"
          >
            我的目标分数
          </h2>
          <p className="text-stage-xs text-stage-fg-subtle">
            目标分数由你自己设定，仅用于个人规划参考。
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3">
          {ENGLISH_SUBJECTS.map((subject) => (
            <label key={subject} className="grid gap-1.5">
              <span className="text-stage-xs text-stage-fg-muted">
                {TARGET_SUBJECT_LABELS[subject]}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={TARGET_MIN}
                max={TARGET_MAX}
                step={TARGET_STEP}
                value={drafts[subject]}
                onChange={(event) => onType(subject, event.target.value)}
                onBlur={() => onCommit(subject)}
                placeholder="—"
                className="w-full rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3 py-[9px] font-stage-mono text-stage-body text-stage-fg outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus"
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Offers to resume an interrupted multi-passage session.
 *
 * Resuming navigates back into a test, which should be the learner's choice —
 * so the offer is stated rather than the session restored silently.
 */
function ResumeBanner({
  session,
  onDismiss,
}: {
  session: PracticeSession;
  onDismiss: () => void;
}) {
  const shell =
    "flex flex-wrap items-center justify-between gap-3 rounded-stage-lg border border-stage-border-accent bg-stage-primary-soft px-4 py-3.5";

  if (session.kind === "endless") {
    const last = session.served[session.served.length - 1];
    return (
      <section className={shell}>
        <p className="text-stage-xs text-stage-fg-body">
          无尽模式进行中 · 已完成 {session.completed} 篇
        </p>
        <div className="flex gap-2">
          {last ? (
            <Link href={practiceHref(last, "endless")} className={BUTTON_PRIMARY}>
              继续
            </Link>
          ) : null}
          <button type="button" onClick={onDismiss} className={BUTTON_SECONDARY}>
            结束
          </button>
        </div>
      </section>
    );
  }

  const current = session.entries[session.index];
  return (
    <section className={shell}>
      <p className="min-w-0 text-stage-xs text-stage-fg-body">
        套题进行中 · 第 {session.index + 1} / {session.entries.length} 篇
        {current ? ` · ${current.title}` : ""}
      </p>
      <div className="flex gap-2">
        {current ? (
          <Link
            href={practiceHref(current.examId, "suite")}
            className={BUTTON_PRIMARY}
          >
            继续
          </Link>
        ) : null}
        <button type="button" onClick={onDismiss} className={BUTTON_SECONDARY}>
          放弃
        </button>
      </div>
    </section>
  );
}
