/**
 * Task 2 strategy hints, keyed by essay type.
 *
 * Pedagogical constants, not question data. They live here rather than in
 * `writing-t2-bank.json` because the bank is a verbatim recall record — every
 * field in it is something a test-taker reported — and a hint STAGE wrote is
 * not. Putting them in the bank would make an editorial line look like source
 * evidence, which is the one thing the bank's provenance statement promises it
 * is not.
 *
 * Editorial rule, from writing-spec §二.3: methodology and task-analysis only.
 * No ready-made sentence, paragraph or structured model-answer content for any
 * specific question — a hint that hands the learner wording is a model answer
 * leaking past the 先尝试、后解锁 gate (§四).
 *
 * One hint per rubric plus a fallback, because `essayType` is `null` on the
 * recalls too thin to classify; those questions still get a hint, just the
 * generic one. `advantages-disadvantages` currently matches no practicable
 * question in the bank — it is written anyway, so the record stays total over
 * `WritingEssayType` and a later recall does not silently fall through.
 */
import type { WritingEssayType } from "./writing-types";

export const WRITING_STRATEGY_TIPS: Record<WritingEssayType, string> = {
  opinion:
    "先明确表态（完全同意、部分同意还是不同意），再用「主张 → 原因 → 具体例子 → 回扣题目」搭每个主体段，全文立场不摇摆。",
  discussion:
    "两种观点各占一个主体段，先公平陈述再单独表明自己的立场——把双边讨论写成只谈一边是最常见的失分点。",
  "advantages-disadvantages":
    "先分清题目问的是「有哪些利弊」还是「利是否大于弊」；若是后者，结论必须给出明确的权衡判断。",
  "problem-solution":
    "一段写成因、一段写对策，并让每条对策都对应前面点出的具体问题，避免泛泛而谈的空对策。",
  "two-part":
    "题目里的两个问句各自成段回答，漏答任何一问都会直接拉低任务回应分。",
};

/** Used when `essayType` is `null` — the rubric was not recoverable. */
export const WRITING_STRATEGY_TIP_FALLBACK =
  "先审清题目究竟要求回答什么，再用「回答 → 理由 → 具体例子」搭好每个主体段，收尾前逐一核对每一问是否都已回应。";

export function writingStrategyTip(essayType: WritingEssayType | null): string {
  return essayType === null
    ? WRITING_STRATEGY_TIP_FALLBACK
    : WRITING_STRATEGY_TIPS[essayType];
}
