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
 * 3. Which of those two schemes applies comes from `rule.mode` alone, never
 *    from the runtime shape of the submitted answer. An answer of the wrong
 *    shape is marked wrong; it does not switch the marking scheme and it does
 *    not throw.
 */
import type {
  Answer,
  NormalizeStep,
  QuestionScore,
  ScoreReport,
  ScoringRule,
  Attempt,
} from "./listening-types.ts";

/**
 * Only a *leading* currency mark goes, along with any whitespace right behind
 * it: candidates type "£25" and "£ 25" about equally often and both mean 25.
 * "25£" is untouched, because the mark is not leading.
 */
const LEADING_CURRENCY = /^[£$€]\s*/;

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

function normalizedSorted(values: string[], rules: NormalizeStep[]): string[] {
  return values.map((value) => normalize(value, rules)).sort();
}

function sameSequence(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

/** Marks a `multi` rule: order-independent, all-or-nothing. */
function isMultiCorrect(value: string | string[], rule: ScoringRule): boolean {
  // A `multi` question submitted as a bare string is a UI bug, not a partly
  // right answer. It is wrong, and it must not fall through to text matching.
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;

  const given = normalizedSorted(value, rule.normalize);

  // Duplicates are never collapsed. Deduping first would mark ["A","A"] as the
  // set {A}, so a candidate who selected one option twice would score the same
  // as one who selected it once — and on a "choose TWO" question that turns an
  // invalid submission into a possible pass.
  if (hasDuplicates(given)) return false;

  return sameSequence(given, normalizedSorted(rule.accepted, rule.normalize));
}

/** Marks a `text` or `single` rule: any one accepted alternative matches. */
function isTextCorrect(value: string | string[], rule: ScoringRule): boolean {
  // Likewise the mirror bug: an array given for a single-answer question is
  // wrong rather than an error, and is never joined into a string first.
  if (Array.isArray(value)) return false;

  const given = normalize(value, rule.normalize);
  if (given === "") return false;
  return rule.accepted.some(
    (accepted) => normalize(accepted, rule.normalize) === given,
  );
}

function isCorrect(answer: Answer | undefined, rule: ScoringRule): boolean {
  if (answer === undefined) return false;
  return rule.mode === "multi"
    ? isMultiCorrect(answer.value, rule)
    : isTextCorrect(answer.value, rule);
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
