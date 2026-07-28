/**
 * Question-type lookup for IELTS Lab analytics.
 *
 * The runner scores an attempt but reports questions by id only, so the type
 * has to come from the corpus. `question-types.json` is generated offline by
 * scripts/ielts/build-question-types.mjs and committed; see that file for the
 * interning scheme.
 *
 * The index is ~26KB — comparable to the exam catalog this module sits beside,
 * and a fraction of it once compressed — so it is imported directly rather than
 * fetched. Both the write path (annotating a finished attempt) and the read
 * path (classifying records saved before types were stored) need it.
 */
import questionTypesJson from "./question-types.json";
import type { QuestionType } from "./types";

interface QuestionTypeIndex {
  kinds: string[];
  exams: Record<string, Record<string, number>>;
}

const INDEX = questionTypesJson as QuestionTypeIndex;

/** Display labels. Keyed by the corpus `kind` values, which are stable. */
const TYPE_LABELS: Record<string, string> = {
  matching: "信息匹配",
  single_choice: "单项选择",
  multi_choice: "多项选择",
  summary_completion: "摘要填空",
  true_false_not_given: "判断题 (TFNG)",
  yes_no_not_given: "判断题 (YNNG)",
  sentence_completion: "句子填空",
  table_completion: "表格填空",
  notes_completion: "笔记填空",
  diagram_completion: "图示填空",
  flow_chart_completion: "流程图填空",
  short_answer: "简答题",
  classification: "分类题",
};

/** Shown when a record predates the type index or the corpus has no group. */
export const UNCLASSIFIED = "unclassified";
const UNCLASSIFIED_LABEL = "未分类";

/**
 * Resolves the question type for one question of one exam.
 *
 * Returns `undefined` rather than a placeholder so callers can distinguish
 * "not in the corpus" from a genuine type, and decide their own fallback.
 */
export function questionTypeOf(
  examId: string,
  questionId: string,
): QuestionType | undefined {
  const index = INDEX.exams[examId]?.[questionId];
  if (index === undefined) return undefined;
  return INDEX.kinds[index] as QuestionType | undefined;
}

/** Human-readable label for a stored type value. */
export function questionTypeLabel(type: string): string {
  if (type === UNCLASSIFIED) return UNCLASSIFIED_LABEL;
  return TYPE_LABELS[type] ?? type;
}

/** Every type present in the corpus, in corpus order. Used for stable sorting. */
export function allQuestionTypes(): QuestionType[] {
  return INDEX.kinds as QuestionType[];
}

/**
 * Distinct question types of one exam, in the order they first appear.
 *
 * Drives the type tag on a catalog row. Resolved on the server so the browse
 * route does not have to ship this 26KB index to the client for a label.
 */
export function examQuestionTypes(examId: string): QuestionType[] {
  const questions = INDEX.exams[examId];
  if (!questions) return [];
  const seen = new Set<number>();
  const types: QuestionType[] = [];
  for (const index of Object.values(questions)) {
    if (seen.has(index)) continue;
    seen.add(index);
    const kind = INDEX.kinds[index];
    if (kind) types.push(kind as QuestionType);
  }
  return types;
}
