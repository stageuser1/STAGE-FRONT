"use client";

/**
 * The Listening practice surface: everything B1–B3 built, assembled.
 *
 * This is the only module in the Listening module that owns anything global —
 * the clock interval, the localStorage draft, which question is current, and
 * whether a dialog is open. That is by design and it is why the pieces below it
 * are as dumb as they are: the runner has no timer, the attempt context has no
 * storage, the question components have no idea what "current" means, and the
 * nav bar selects without scrolling. Each of those was pushed up to here so
 * there is exactly one clock, one writer and one scroll container.
 *
 * The set and its scoring rules arrive as props from the server page, which is
 * the only place a `ListeningSetSource` is instantiated. Nothing in this file
 * or below it may import the fixture.
 *
 * Restore is done by *remounting*: the attempt hook can only create a fresh
 * attempt, so a restored draft is replayed into a new one through the same
 * public actions a candidate would have used — `answer` per stored answer, one
 * `tick` for the stored clock — with `startedAt` handed to the hook so the
 * timestamp survives untouched. Reaching into the reducer to install a
 * ready-made attempt would have meant a second way to build attempt state, and
 * the frozen-after-submit guarantee only holds because there is one.
 */
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BUTTON_DISABLED_SM, BUTTON_PRIMARY_SM, BUTTON_SECONDARY_SM, Tag } from "@/components/ielts/ui";
import {
  ListeningAttemptProvider,
  useListeningAttempt,
} from "@/lib/ielts/listening-attempt";
import { shouldOfferRestore } from "@/lib/ielts/listening-persist";
import { questionTarget, stepQuestionNo } from "@/lib/ielts/listening-practice-utils";
import { questionNumbers } from "@/lib/ielts/listening-runner";
import { scoreAttempt } from "@/lib/ielts/listening-scoring";
import type {
  Attempt,
  ListeningSet,
  QuestionGroup,
  ScoringRule,
} from "@/lib/ielts/listening-types";

import { ElapsedClock } from "./ElapsedClock";
import { FormCompletionGroup } from "./FormCompletionGroup";
import { ListeningAudioPlayer } from "./ListeningAudioPlayer";
import { ListeningResult } from "./ListeningResult";
import { MapLabellingGroup } from "./MapLabellingGroup";
import { MatchingGroup } from "./MatchingGroup";
import { McqMultiGroup } from "./McqMultiGroup";
import { McqSingleGroup } from "./McqSingleGroup";
import { QuestionNav } from "./QuestionNav";
import { RestorePrompt } from "./RestorePrompt";
import { SubmitBar } from "./SubmitBar";
import { SubmitConfirm } from "./SubmitConfirm";
import {
  clearStoredAttempt,
  readStoredAttempt,
  useAttemptStorage,
} from "./useAttemptStorage";

/**
 * The paper's column. Narrower than the shell's 1160px on purpose: this route
 * sits outside `(shell)` — no sidebar, no section chrome, per that layout's own
 * note — and a question paper set to the full width of a desktop window is a
 * line length nobody reads comfortably.
 */
const COLUMN = "mx-auto w-full max-w-[880px] px-[clamp(20px,3.4vw,44px)]";

/**
 * The restore decision, and the remount it drives.
 *
 * The paper renders immediately, with the dialog over it, rather than the page
 * waiting on a storage read: the read happens in an effect (localStorage is not
 * available during the server render) and blocking on it would blank the whole
 * route for a frame on every visit. The cost is that a fresh attempt exists
 * while the question is still open, which is exactly why `persist` is false
 * until it is answered — otherwise that empty attempt would debounce itself
 * over the draft being offered.
 */
export function ListeningPractice({
  set,
  rules,
}: {
  set: ListeningSet;
  rules: ScoringRule[];
}) {
  const [offer, setOffer] = useState<Attempt | null>(null);
  const [seed, setSeed] = useState<Attempt | null>(null);
  const [decided, setDecided] = useState(false);
  // Bumping this remounts the run, which is how an attempt is replaced.
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const stored = shouldOfferRestore(readStoredAttempt(set.id));
    if (stored) setOffer(stored);
    else setDecided(true);
  }, [set.id]);

  const continueStored = useCallback(() => {
    setSeed(offer);
    setRunKey((key) => key + 1);
    setOffer(null);
    setDecided(true);
  }, [offer]);

  const startFresh = useCallback(() => {
    clearStoredAttempt(set.id);
    setSeed(null);
    setRunKey((key) => key + 1);
    setOffer(null);
    setDecided(true);
  }, [set.id]);

  return (
    <>
      <ListeningRun
        key={runKey}
        set={set}
        rules={rules}
        seed={seed}
        persist={decided}
        onRestart={startFresh}
      />
      {offer ? (
        <RestorePrompt
          set={set}
          attempt={offer}
          onContinue={continueStored}
          onRestart={startFresh}
        />
      ) : null}
    </>
  );
}

function ListeningRun({
  set,
  rules,
  seed,
  persist,
  onRestart,
}: {
  set: ListeningSet;
  rules: ScoringRule[];
  /** A draft to replay into this attempt, or `null` for a blank paper. */
  seed: Attempt | null;
  persist: boolean;
  onRestart: () => void;
}) {
  const value = useListeningAttempt(set, seed?.startedAt);
  const { attempt, answer, clearAnswer, tick, submit, unanswered } = value;

  const numbers = useMemo(() => questionNumbers(set), [set]);
  const [currentNo, setCurrentNo] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const groupRefs = useRef<(HTMLElement | null)[]>([]);

  const frozen = attempt.status === "submitted";

  /* ---- restore -------------------------------------------------------- */

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || seed === null) return;
    // Guarded by a ref rather than by the dependency list: React's development
    // Strict Mode runs this effect twice on mount, and a second `tick` would
    // hand the candidate back double the time they spent.
    seeded.current = true;
    for (const stored of Object.values(seed.answers)) {
      answer(stored.questionNo, stored.value);
    }
    if (seed.elapsedSec > 0) tick(seed.elapsedSec);
  }, [seed, answer, tick]);

  /* ---- the clock ------------------------------------------------------ */

  useEffect(() => {
    if (frozen) return;

    let timer: number | undefined;
    const start = () => {
      if (timer === undefined) {
        timer = window.setInterval(() => tick(1), 1000);
      }
    };
    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    // A hidden tab is not a tab anyone is practising in, and browsers throttle
    // its timers to once a minute anyway — left running, the clock would drift
    // behind by whatever the throttle swallowed rather than by nothing at all.
    // Audio is untouched by this: a candidate may listen with the tab in the
    // background, and the transport owns its own playback state.
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [frozen, tick]);

  /* ---- the draft ------------------------------------------------------ */

  useAttemptStorage(set.id, attempt, persist);

  /* ---- moving between questions --------------------------------------- */

  const goTo = useCallback(
    (questionNo: number) => {
      setCurrentNo(questionNo);

      const target = questionTarget(set, questionNo);
      if (target === null) return;
      const card = groupRefs.current[target.groupIndex];
      if (!card) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      card.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      // Answer controls in document order — text inputs for a form card,
      // radios or letter buttons for the rest — so `controlIndex` indexes
      // straight into them. `preventScroll` because focusing an element is
      // itself a scroll request, and it would cancel the smooth one above.
      const controls = card.querySelectorAll<HTMLElement>("input, button");
      controls[target.controlIndex]?.focus({ preventScroll: true });
    },
    [set],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = stepQuestionNo(numbers, currentNo, delta);
      if (next !== null) goTo(next);
    },
    [numbers, currentNo, goTo],
  );

  /* ---- submit --------------------------------------------------------- */

  const report = useMemo(
    () => (frozen ? scoreAttempt(attempt, rules) : null),
    [frozen, attempt, rules],
  );

  const confirmSubmit = useCallback(() => {
    setConfirming(false);
    submit();
    // The result lands at the top of the question column, which is where the
    // paper was — without this the candidate is left looking at question 8.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submit]);

  return (
    <ListeningAttemptProvider value={value}>
      {/*
        `flex-1`, not `min-h-screen`: this route's layout already puts the
        marketing top bar above it inside a full-height column, so a second
        viewport's worth of minimum height here would overflow the page by the
        height of that bar. The two sticky edges below sit *under* it — 64px is
        the bar's own height, and z-30 keeps them beneath its z-50.
      */}
      <div className="flex flex-1 flex-col bg-stage-bg-soft">
        <header className="sticky top-16 z-30 border-b border-stage-border bg-stage-bg">
          <div className={`${COLUMN} flex items-center justify-between gap-4 py-3`}>
            <div className="min-w-0">
              <h1 className="truncate text-stage-h4 font-semibold text-stage-fg">
                {set.title}
              </h1>
              <p className="truncate text-stage-2xs text-stage-fg-muted">
                {set.titleZh}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Tag>Part {set.part}</Tag>
              <Link href="/ielts-lab" className={BUTTON_SECONDARY_SM}>
                返回题库
              </Link>
            </div>
          </div>
        </header>

        <main className={`${COLUMN} flex-1 py-5`}>
          <ListeningAudioPlayer
            src={set.audioUrl}
            durationSec={set.durationSec}
            policy="free"
          />

          {report ? (
            <div className="mt-5 flex flex-col gap-3">
              <ListeningResult report={report} elapsedSec={attempt.elapsedSec} />
              <div className="flex flex-wrap justify-end gap-2">
                <Link href="/ielts-lab" className={BUTTON_SECONDARY_SM}>
                  返回题库
                </Link>
                <button
                  type="button"
                  onClick={onRestart}
                  className={BUTTON_PRIMARY_SM}
                >
                  重新练习
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-4">
            {set.questionGroups.map((group, index) => (
              <div
                key={index}
                ref={(element) => {
                  groupRefs.current[index] = element;
                }}
                // Clears both sticky bars — the marketing top bar and this
                // page's own header — when a jump scrolls this card up.
                className="scroll-mt-36"
              >
                <QuestionGroupCard group={group} />
              </div>
            ))}
          </div>
        </main>

        <div className="sticky bottom-0 z-30 border-t border-stage-border bg-stage-bg">
          <div
            className={`${COLUMN} flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3`}
          >
            <QuestionNav set={set} currentNo={currentNo} onSelect={goTo} />

            <div className="flex flex-wrap items-center gap-3">
              <ElapsedClock elapsedSec={attempt.elapsedSec} />

              {frozen ? null : (
                <SubmitBar
                  onPrevious={() => step(-1)}
                  onNext={() => step(1)}
                  // Only the current question, per B4 scope — there is no
                  // whole-paper clear. With nothing selected there is nothing
                  // to clear and the button is inert; `SubmitBar` takes no
                  // `disabled` prop and its props are not this batch's to
                  // change.
                  onClear={() => {
                    if (currentNo !== null) clearAnswer(currentNo);
                  }}
                  onSubmit={() => setConfirming(true)}
                />
              )}

              {/* Ruling C6's treatment for an action with nothing behind it
                  yet: inert and muted rather than a live control that does
                  nothing. 回顾模式 arrives with B5. */}
              <span aria-disabled className={BUTTON_DISABLED_SM}>
                回顾模式
              </span>
            </div>
          </div>
        </div>
      </div>

      {confirming ? (
        <SubmitConfirm
          unanswered={unanswered}
          total={numbers.length}
          onGoToQuestion={(no) => {
            setConfirming(false);
            goTo(no);
          }}
          onConfirm={confirmSubmit}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </ListeningAttemptProvider>
  );
}

/**
 * One group, drawn by its own component.
 *
 * A switch rather than a lookup table keyed on `type`: the five components take
 * five different props, and a table would have to erase them to a common
 * `{ group: QuestionGroup }` — which is precisely the discriminated union this
 * switch is here to preserve.
 */
function QuestionGroupCard({ group }: { group: QuestionGroup }) {
  switch (group.type) {
    case "form_completion":
      return <FormCompletionGroup group={group} />;
    case "mcq_single":
      return <McqSingleGroup group={group} />;
    case "mcq_multi":
      return <McqMultiGroup group={group} />;
    case "map_labelling":
      return <MapLabellingGroup group={group} />;
    case "matching":
      return <MatchingGroup group={group} />;
  }
}
