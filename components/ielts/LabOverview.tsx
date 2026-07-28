"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, countByCategory } from "@/lib/ielts/catalog";
import { loadDrafts, type DraftEntry } from "@/lib/ielts/draft";
import { buildProgressIndex, pickRandomExam, practisedByCategory } from "@/lib/ielts/progress";
import {
  clearSession,
  loadSession,
  practiceHref,
  reviewHref,
  startEndless,
  type PracticeSession,
} from "@/lib/ielts/session";
import { computeStats, loadRecords } from "@/lib/ielts/storage";
import type { ExamCategory, ExamSummary, PracticeRecord } from "@/lib/ielts/types";
import { wrongbookCount } from "@/lib/ielts/wrongbook";
import { loadProfile, patchProfile } from "@/lib/profile/storage";
import {
  ENGLISH_SUBJECTS,
  ENGLISH_SUBJECT_LABELS,
  TARGET_MAX,
  TARGET_MIN,
  TARGET_STEP,
  emptyTargets,
  normaliseTarget,
  type EnglishSubject,
} from "@/lib/profile/types";
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  BUTTON_SECONDARY,
  Card,
  EmptyNote,
  FIELD,
  PageHeader,
  StatTile,
  Tag,
  accuracyText,
  splitTitle,
} from "./ui";

/** Onboarding strip dismissal. Follows the `stage.*` key convention (Plan §6.3). */
const ONBOARDING_KEY = "stage.ielts.onboarding";

/**
 * The three steps of the starter strip (supplement §三).
 *
 * The labels are verbatim and must not be rewritten. The third step is the one
 * the supplement singles out: it stays about consolidating a review and must
 * never become score-oriented.
 *
 * The descriptions state what STAGE actually offers today — the spec's own
 * example lists four skills, and naming three that have no module yet would be
 * a promise the product does not keep.
 */
const ONBOARDING_STEPS = [
  { label: "选科目", detail: "目前开放 Reading" },
  { label: "去练习", detail: "在真实节奏下完成一次练习" },
  { label: "复盘巩固", detail: "逐题回顾，错题自动进入错题本" },
] as const;

const CATEGORY_BLURB: Record<ExamCategory, string> = {
  P1: "篇幅最短，事实定位为主",
  P2: "论证结构，段落匹配偏多",
  P3: "学术论文，题型最复杂",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(then).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
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
export function LabOverview({ exams }: { exams: ExamSummary[] }) {
  const router = useRouter();
  // localStorage and sessionStorage are unreadable until after mount.
  const [records, setRecords] = useState<PracticeRecord[] | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
    setSession(loadSession());
    setDrafts([...loadDrafts().values()]);
  }, []);

  const totals = useMemo(() => countByCategory(exams), [exams]);
  const progress = useMemo(
    () => buildProgressIndex(records ?? []),
    [records],
  );
  const practised = useMemo(
    () => practisedByCategory(exams, progress),
    [exams, progress],
  );
  const stats = useMemo(
    () => (records ? computeStats(records) : null),
    [records],
  );
  const mistakes = useMemo(
    () => (records ? wrongbookCount(records) : 0),
    [records],
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

  function startEndlessMode() {
    const pick = pickRandomExam(exams, progress);
    if (!pick) return;
    startEndless(pick.id);
    router.push(practiceHref(pick.id, "endless"));
  }

  const recent = (records ?? []).slice(0, 5);
  const practisedTotal = progress.size;
  const latestAccuracy = records?.[0]?.accuracy ?? null;

  return (
    <div className="space-y-6">
      <OnboardingStrip />

      <PageHeader
        title="学习总览"
        subtitle={`${exams.length} 篇真题阅读 · 完整还原考试环境 · 记录保存在本机`}
        actions={
          <>
            <button
              type="button"
              onClick={() => startRandom()}
              className={BUTTON_PRIMARY}
            >
              随机练习
            </button>
            <button
              type="button"
              onClick={startEndlessMode}
              className={BUTTON_SECONDARY}
            >
              无尽模式
            </button>
            <Link href="/ielts-lab/suite" className={BUTTON_SECONDARY}>
              套题练习
            </Link>
            <Link href="/ielts-lab/mistakes" className={BUTTON_SECONDARY}>
              错题本
              {mistakes > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-stage-pill bg-stage-warning-soft px-1 text-stage-2xs font-medium tabular-nums text-stage-warning">
                  {mistakes}
                </span>
              ) : null}
            </Link>
          </>
        }
      />

      {resumable ? (
        <ContinueBar
          draft={resumable}
          title={examsById.get(resumable.examId)?.title ?? resumable.examId}
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

      {/* Core metrics (master-spec 批次一 §3). Native data only: counts,
          accuracy, minutes and days — never projected onto a score scale. */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="已练习题目"
          value={String(stats?.totalPractices ?? 0)}
          hint="累计练习次数"
        />
        <StatTile
          label="平均正确率"
          // Null, not zero: no attempts is absent data, and a 0% would read
          // as a result the learner never produced.
          value={
            stats && stats.totalPractices > 0
              ? accuracyText(stats.averageAccuracy)
              : "—"
          }
        />
        <StatTile
          label="学习时长"
          value={
            stats && stats.totalPractices > 0
              ? `${Math.round(stats.totalTimeSeconds / 60)} 分钟`
              : "—"
          }
        />
        <StatTile label="连续学习" value={`${stats?.streakDays ?? 0} 天`} />
      </dl>

      <TargetScoreCard />

      <ReadingModuleCard
        total={exams.length}
        practised={practisedTotal}
        latestAccuracy={latestAccuracy}
        totals={totals}
        practisedByPart={practised}
        onRandom={() => startRandom()}
      />

      <Card
        title="最近练习"
        aside={
          <Link href="/ielts-lab/history" className={BUTTON_QUIET}>
            全部记录 →
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyNote>还没有练习记录。完成一篇阅读后会自动保存。</EmptyNote>
        ) : (
          <ul className="divide-y divide-stage-border">
            {recent.map((record) => (
              <RecentRow key={record.id} record={record} />
            ))}
          </ul>
        )}
      </Card>
    </div>
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
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-stage-lg border border-stage-border bg-stage-bg px-4 py-3"
    >
      <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
        {ONBOARDING_STEPS.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-stage-pill border border-stage-border-strong text-stage-2xs font-medium tabular-nums text-stage-fg-muted"
            >
              {index + 1}
            </span>
            <span className="text-stage-xs font-medium text-stage-fg">
              {step.label}
            </span>
            <span className="text-stage-xs text-stage-fg-subtle">
              {step.detail}
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          try {
            window.localStorage.setItem(ONBOARDING_KEY, "dismissed");
          } catch {
            // Dismissal is a preference; failing to store it is not an error.
          }
        }}
        className={BUTTON_QUIET}
      >
        知道了
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
function ContinueBar({ draft, title }: { draft: DraftEntry; title: string }) {
  const { en, zh } = splitTitle(title);
  const percent =
    draft.total > 0
      ? Math.min(100, Math.round((draft.answered / draft.total) * 100))
      : 0;

  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-stage-lg border border-stage-border-accent bg-stage-primary-soft px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-stage-xs text-stage-fg-muted">
          继续上次：
          <span className="font-medium text-stage-fg">{en}</span>
          {zh ? <span className="text-stage-fg-muted"> {zh}</span> : null}
        </p>
        {draft.total > 0 ? (
          <div className="mt-2 flex items-center gap-3">
            <div
              className="h-1 w-32 overflow-hidden rounded-stage-pill bg-stage-neutral-100"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="上次练习进度"
            >
              <div
                className="h-full rounded-stage-pill bg-stage-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-stage-2xs tabular-nums text-stage-fg-muted">
              已完成 {draft.answered}/{draft.total} 题
            </span>
          </div>
        ) : null}
      </div>
      <span className="text-stage-2xs text-stage-fg-subtle">已自动保存</span>
      <Link href={practiceHref(draft.examId)} className={BUTTON_PRIMARY}>
        继续
      </Link>
    </section>
  );
}

/**
 * Reading module card (master-spec 批次一 §4, hardened by supplement §一).
 *
 * The other three skills get no card: the spec forbids "即将上线" placeholders,
 * and a card is how a module announces that it exists.
 *
 * Every bullet is a fact about this build — no capability is claimed that the
 * learner cannot exercise today, and nothing about scoring or evaluation.
 */
function ReadingModuleCard({
  total,
  practised,
  latestAccuracy,
  totals,
  practisedByPart,
  onRandom,
}: {
  total: number;
  practised: number;
  /** Accuracy of the most recent attempt; null when there is none. */
  latestAccuracy: number | null;
  totals: Record<ExamCategory, number>;
  practisedByPart: Record<ExamCategory, number>;
  onRandom: () => void;
}) {
  const percent = total > 0 ? Math.round((practised / total) * 100) : 0;
  const facts = [
    `题库总量 ${total} 篇`,
    "频次分层筛选：高频 / 次高频 / 低频",
    "逐题回顾与错题自动收集",
    "练习记录保存在本机浏览器",
  ];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-stage-md bg-stage-primary-soft text-stage-xs font-semibold text-stage-primary"
          >
            R
          </span>
          <div className="min-w-0">
            <h2 className="text-stage-h4 font-semibold text-stage-fg">
              Reading
            </h2>
            <p className="mt-0.5 text-stage-xs text-stage-fg-muted">
              P1 / P2 / P3 三个部分
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/ielts-lab/browse" className={BUTTON_SECONDARY}>
            浏览题库
          </Link>
          <button type="button" onClick={onRandom} className={BUTTON_SECONDARY}>
            随机练习
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="min-w-[12rem] flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-stage-xs text-stage-fg-muted">
              已练习 {practised} / {total} 篇
            </span>
            <span className="text-stage-2xs tabular-nums text-stage-fg-subtle">
              {percent}%
            </span>
          </div>
          <div
            className="mt-1.5 h-1 overflow-hidden rounded-stage-pill bg-stage-neutral-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading 题库完成进度"
          >
            <div
              className="h-full rounded-stage-pill bg-stage-primary transition-[width] duration-stage-base"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <p className="text-stage-xs text-stage-fg-muted">
          最近一次正确率{" "}
          <span className="font-semibold tabular-nums text-stage-fg">
            {accuracyText(latestAccuracy)}
          </span>
        </p>
      </div>

      <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {facts.map((fact) => (
          <li
            key={fact}
            className="flex items-start gap-2 text-stage-xs text-stage-fg-muted"
          >
            <span
              aria-hidden
              className="mt-2 inline-block h-1 w-1 shrink-0 rounded-stage-pill bg-stage-border-strong"
            />
            {fact}
          </li>
        ))}
      </ul>

      <ul className="mt-4 flex flex-wrap gap-2 border-t border-stage-border pt-4">
        {CATEGORIES.map((category) => (
          <li key={category}>
            {/* No `title` attribute: it would replace the accessible name and
                leave the link announced as its blurb rather than as "P1". */}
            <Link
              href={`/ielts-lab/browse?category=${category}`}
              className="flex items-center gap-2 rounded-stage-sm border border-stage-border px-3 py-1.5 text-stage-2xs text-stage-fg-muted transition-colors duration-stage-fast hover:border-stage-border-strong hover:text-stage-fg"
            >
              <span className="font-medium text-stage-fg">{category}</span>
              <span className="tabular-nums">
                {practisedByPart[category]} / {totals[category]}
              </span>
              <span className="hidden text-stage-fg-subtle sm:inline">
                {CATEGORY_BLURB[category]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** One row of 最近练习: title (EN + zh), Part, date, accuracy, 回顾. */
function RecentRow({ record }: { record: PracticeRecord }) {
  const { en, zh } = splitTitle(record.title);

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-stage-xs font-medium text-stage-fg">{en}</p>
        {zh ? (
          <p className="truncate text-stage-2xs text-stage-fg-subtle">{zh}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {record.category ? <Tag>{record.category}</Tag> : null}
        <span className="text-stage-2xs text-stage-fg-subtle">
          {relativeTime(record.createdAt)}
        </span>
        <span className="text-stage-xs font-semibold tabular-nums text-stage-fg">
          {accuracyText(record.accuracy)}
        </span>
        <Link href={reviewHref(record.examId, record.id)} className={BUTTON_QUIET}>
          回顾
        </Link>
      </div>
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
    <Card>
      <fieldset>
        <legend className="text-stage-h4 font-semibold text-stage-fg">
          我的目标分数
        </legend>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ENGLISH_SUBJECTS.map((subject) => (
            <label key={subject} className="block">
              <span className="text-stage-xs text-stage-fg-muted">
                {ENGLISH_SUBJECT_LABELS[subject]}
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
                className={`mt-1.5 w-full tabular-nums ${FIELD}`}
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-stage-xs text-stage-fg-subtle">
          目标分数由你自己设定，仅用于个人规划参考。
        </p>
      </fieldset>
    </Card>
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
