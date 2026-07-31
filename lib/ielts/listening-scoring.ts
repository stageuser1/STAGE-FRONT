/**
 * Listening marking. Pure functions — no DOM, no React, no clock.
 *
 * Two decisions worth stating, because the UI must not re-decide them:
 *
 * 1. The rule list is the authority on which questions exist, not the attempt.
 *    A question with no answer still appears in the report, marked wrong with a
 *    blank `given`, so the review screen can show every gap the candidate left.
 * 2. Multi-select is set equality with no partial credit, which is how IELTS
 *    marks "Choose TWO letters". Picking one of two correct letters scores 0,
 *    not 0.5, and the report must not imply otherwise.
 */
import type {
  Answer,
  NormalizeStep,
  QuestionScore,
  ScoreReport,
  ScoringRule,
  Attempt,
} from "./listening-types.ts";

/** Only a *leading* currency mark goes. "£25" is 25; "25p" is not 25. */
const LEADING_CURRENCY = /^[£$€]/;

/**
 * Applies the steps in the order the rule declares them. Order is the rule
 * author's to choose and it matters: `stripCurrency` before `trim` will not
 * touch " £25", because the £ is not leading until the space is gone.
 */
export function normalize(value: string, rules: NormalizeStep[]): string {
  let out = value;
  for (const rule of rules) {
    switch (rule) {
      case "trim":
        out = out.trim();
        break;
      case "lowercase":
        out = out.toLowerCase();
        break;
      case "collapseSpaces":
        out = out.replace(/\s+/g, " ");
        break;
      case "stripCurrency":
        out = out.replace(LEADING_CURRENCY, "");
        break;
    }
  }
  return out;
}

/** The set a multi-select answer really is: normalized, deduped, sorted. */
function normalizedSet(values: string[], rules: NormalizeStep[]): string[] {
  const seen = new Set(values.map((value) => normalize(value, rules)));
  return [...seen].sort();
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function isCorrect(answer: Answer | undefined, rule: ScoringRule): boolean {
  if (answer === undefined) return false;

  // An array given is a multi-select: the whole accepted list is the one
  // correct set, rather than a list of alternatives.
  if (Array.isArray(answer.value)) {
    if (answer.value.length === 0) return false;
    return sameSet(
      normalizedSet(answer.value, rule.normalize),
      normalizedSet(rule.accepted, rule.normalize),
    );
  }

  const given = normalize(answer.value, rule.normalize);
  if (given === "") return false;
  return rule.accepted.some(
    (accepted) => normalize(accepted, rule.normalize) === given,
  );
}

/** What the review screen prints back to the candidate: never normalized. */
function displayGiven(answer: Answer | undefined): string {
  if (answer === undefined) return "";
  if (Array.isArray(answer.value)) return answer.value.join(", ");
  return answer.value;
}

export function scoreAttempt(
  attempt: Attempt,
  rules: ScoringRule[],
): ScoreReport {
  const byQuestion: QuestionScore[] = rules.map((rule) => {
    const answer = attempt.answers[rule.questionNo];
    return {
      no: rule.questionNo,
      given: displayGiven(answer),
      accepted: rule.accepted,
      correct: isCorrect(answer, rule),
    };
  });

  return {
    total: byQuestion.length,
    correct: byQuestion.filter((question) => question.correct).length,
    byQuestion,
  };
}
