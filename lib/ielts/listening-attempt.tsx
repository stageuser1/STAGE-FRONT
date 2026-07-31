"use client";

/**
 * The attempt state layer: the runner, wrapped once for React, shared by
 * context.
 *
 * Two rules shape this module.
 *
 * It owns no timer. `tick` is exposed as a plain action and the interval lives
 * on the page (B4), because a hook that started its own interval would make
 * every consumer of the attempt a clock owner — and a page that mounts the
 * question list twice would then count twice as fast.
 *
 * It adds no state of its own. Everything here folds through the B1 reducer, so
 * the frozen-after-submit guarantee that module proves is the guarantee the UI
 * gets; a piece of answer state cached beside the reducer would be a second
 * source of truth that submit could not freeze.
 *
 * The context exists because the things that read an answer are leaves — an
 * `<input>` inside a form row inside a group inside the question list — and the
 * things that write one are the same leaves. Threading `attempt` and a dispatch
 * pair through four layers of layout would put attempt plumbing in the
 * signature of every card component.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  createAttempt,
  reduce,
  unansweredQuestions,
} from "./listening-runner.ts";
import type { Attempt, ListeningSet } from "./listening-types.ts";

export interface ListeningAttemptValue {
  attempt: Attempt;
  answer: (questionNo: number, value: string | string[]) => void;
  clearAnswer: (questionNo: number) => void;
  tick: (seconds: number) => void;
  submit: () => void;
  /** Question numbers still blank, ascending — what the submit warning lists. */
  unanswered: number[];
}

/**
 * Start an attempt over `set` and keep it in a reducer.
 *
 * `startedAt` is optional so the caller can supply the timestamp. Left out, the
 * attempt is stamped with `new Date()` inside the initializer, which runs on
 * the server and again on the client and therefore yields two different
 * strings; nothing renders `startedAt`, so that is invisible today, but a
 * caller that persists an attempt wants to decide the stamp itself.
 */
export function useListeningAttempt(
  set: ListeningSet,
  startedAt?: string,
): ListeningAttemptValue {
  const [attempt, dispatch] = useReducer(
    reduce,
    undefined,
    // Lazy: `createAttempt` allocates, and it must not be re-run on the
    // renders that follow.
    () => createAttempt(set, startedAt ?? new Date().toISOString()),
  );

  const answer = useCallback(
    (questionNo: number, value: string | string[]) =>
      dispatch({ type: "answer", questionNo, value }),
    [],
  );
  const clearAnswer = useCallback(
    (questionNo: number) => dispatch({ type: "clearAnswer", questionNo }),
    [],
  );
  const tick = useCallback(
    (seconds: number) => dispatch({ type: "tick", seconds }),
    [],
  );
  const submit = useCallback(() => dispatch({ type: "submit" }), []);

  const unanswered = useMemo(
    () => unansweredQuestions(attempt, set),
    [attempt, set],
  );

  return useMemo(
    () => ({ attempt, answer, clearAnswer, tick, submit, unanswered }),
    [attempt, answer, clearAnswer, tick, submit, unanswered],
  );
}

const ListeningAttemptContext = createContext<ListeningAttemptValue | null>(
  null,
);

/**
 * Publish an attempt to the question tree.
 *
 * Takes the value rather than the set: the page owns the interval and the
 * submit dialog, so it needs the same handle it is providing, and a provider
 * that created the attempt internally would force the page to read its own
 * state back out through a consumer hook.
 */
export function ListeningAttemptProvider({
  value,
  children,
}: {
  value: ListeningAttemptValue;
  children: ReactNode;
}) {
  return (
    <ListeningAttemptContext.Provider value={value}>
      {children}
    </ListeningAttemptContext.Provider>
  );
}

/**
 * Read the attempt. Throws outside a provider rather than handing back a null
 * attempt, because every caller is a control that must both read and write —
 * there is no useful degraded rendering for a question that cannot record an
 * answer.
 */
export function useListeningAttemptContext(): ListeningAttemptValue {
  const value = useContext(ListeningAttemptContext);
  if (value === null) {
    throw new Error(
      "useListeningAttemptContext must be used inside <ListeningAttemptProvider>",
    );
  }
  return value;
}
