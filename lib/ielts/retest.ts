/**
 * When a wrong answer becomes due for retest.
 *
 * PLACEHOLDER, and the only reason a "待重测" state can be computed at all: the
 * master spec gates its retest affordances on 复盘队列有到期项, but nothing in
 * STAGE schedules a retest. The wrongbook is derived from history with no
 * interval model, so "due" is approximated by age alone.
 *
 * One day is the shortest window that stops the UI announcing
 * "到了建议重测的时间" about a passage finished seconds ago. Replace this whole
 * module when a real scheduling policy is decided — that is the point of it
 * being a module rather than a constant in one screen: the overview's reminder
 * bar and the catalog's status column must never disagree about what is due.
 */
export const RETEST_DUE_AFTER_DAYS = 1;

const DAY_MS = 86_400_000;

/**
 * Whether an attempt is old enough for its wrong answers to be due.
 *
 * An unparseable timestamp is never due: NaN fails the comparison, which is the
 * safe direction — it under-reports rather than nagging about a date that could
 * not be read.
 */
export function isDueForRetest(
  latestAttemptAt: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!latestAttemptAt) return false;
  return new Date(latestAttemptAt).getTime() <= now - RETEST_DUE_AFTER_DAYS * DAY_MS;
}
