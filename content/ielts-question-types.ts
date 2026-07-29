/**
 * Reference copy for the 题型说明 page (Plan §2.5, supplement-spec §二).
 *
 * One entry per corpus `kind` value. Two rules govern what may be written here:
 *
 *   1. Methodology only. Not one line may quote, paraphrase or hint at the
 *      content of a passage, a question stem or an answer — the page is a
 *      glossary, and a glossary that leaks the corpus becomes a spoiler.
 *   2. No numbers. Every count shown beside an entry is computed at build time
 *      from the shipped indices, never typed here, so the page cannot drift
 *      away from the corpus it describes.
 *
 * Keys must stay in sync with `lib/ielts/question-types.json` → `kinds`; the
 * page fails the build-time check below if a corpus kind has no entry.
 */

export interface QuestionTypeGuide {
  /** Corpus `kind` value — the join key, and the in-page anchor id. */
  kind: string;
  /** English name, shown after the Chinese label from `questionTypeLabel`. */
  en: string;
  /** Plain-language "what this question asks you to do". */
  description: string;
}

export const QUESTION_TYPE_GUIDES: QuestionTypeGuide[] = [
  {
    kind: "matching",
    en: "Matching",
    description:
      "题目给出若干条信息（也可能是人名、观点或小标题），要求你把每一条对应到原文的某个段落或某个选项上。先把题目列表读完建立印象，再回原文逐段定位；注意同一个段落可能被用到多次，也可能一次都用不上。",
  },
  {
    kind: "true_false_not_given",
    en: "True / False / Not Given",
    description:
      "给出一句陈述，判断它与原文所述的事实一致（True）、与原文冲突（False），还是原文根本没有提到（Not Given）。难点在于区分「说反了」和「没说过」：只要原文没有提供足以判断的信息，就是 Not Given，不能靠常识补足。",
  },
  {
    kind: "yes_no_not_given",
    en: "Yes / No / Not Given",
    description:
      "形式与上一类相同，但比较的对象是作者的观点或主张，而不是客观事实。判断依据只能是作者在文中表达过的立场，文章引述的他人看法不算作者本人的观点。",
  },
  {
    kind: "summary_completion",
    en: "Summary Completion",
    description:
      "原文的某一部分被改写成一段更短的摘要，其中留出空格。你需要在保证语法和语义都成立的前提下填空：有的题从给定词库中选词，有的要求直接取原文的词，动笔前先确认题目规定的词数上限。",
  },
  {
    kind: "sentence_completion",
    en: "Sentence Completion",
    description:
      "用原文中的词把一个不完整的句子补全。先从空格前后判断需要的词性和意义范围，再回原文对应位置取词；通常不允许改写词形，抄写时要与原文完全一致。",
  },
  {
    kind: "single_choice",
    en: "Multiple Choice (single answer)",
    description:
      "给出一个问题和若干选项，只选一个最符合原文的答案。干扰项常见的做法是：用原文出现过的词但答非所问，或者把原文的程度、范围、因果关系改动一点点。定位到原文后逐项排除比凭印象挑选可靠。",
  },
  {
    kind: "table_completion",
    en: "Table Completion",
    description:
      "信息以表格形式呈现，需要把缺失的单元格补齐。表头往往已经说明了该行、该列属于哪一类信息，是最直接的定位线索；填入的内容也要与同列其他单元格的形式保持一致。",
  },
  {
    kind: "short_answer",
    en: "Short-answer Questions",
    description:
      "用原文中的词直接回答一个问题，一般有明确的词数上限。答案通常是原文里现成的名词性成分，不需要自己组织句子，也不需要补上冠词之类的额外成分。",
  },
  {
    kind: "multi_choice",
    en: "Multiple Choice (multiple answers)",
    description:
      "从一个较长的选项列表中选出题目指定数量的答案。这类题的相关信息往往集中在原文的一处或几处，找到那一段后逐项核对，比读一遍就凭印象勾选更稳。选够题目要求的个数即可，多选通常不得分。",
  },
  {
    kind: "diagram_completion",
    en: "Diagram Label Completion",
    description:
      "给出一幅示意图（装置、结构或过程的图解），要求为图中的标注处填上名称。先看懂图的整体结构和方向，再到原文中找到描述这一结构的段落，按图上的顺序逐个对应。",
  },
  {
    kind: "notes_completion",
    en: "Note Completion",
    description:
      "内容以要点笔记的形式列出，其中留出空格。笔记的缩进层级和小标题指明了每个空格属于哪一部分内容，可据此定位；填入的词要与笔记本身的省略式写法相称。",
  },
  {
    kind: "classification",
    en: "Classification",
    description:
      "题目给出几个类别（例如不同时期、不同人物、不同做法），要求把每条信息归入其中一类。类别数量通常少于信息条数，所以同一个类别会被重复使用，不要因为「用过了」就排除它。",
  },
  {
    kind: "flow_chart_completion",
    en: "Flow-chart Completion",
    description:
      "把一个过程拆成先后相连的步骤框，其中若干步骤留空。原文里表示先后顺序的词是主要线索；填完之后从头读一遍整条流程，前后步骤能连贯衔接才算填对了位置。",
  },
];
