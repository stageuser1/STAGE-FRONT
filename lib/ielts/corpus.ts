"use client";

/**
 * On-demand access to the reading corpus from STAGE React.
 *
 * The exam datasets and explanations under `public/ielts/` are IIFE scripts
 * that register themselves into a global registry — they are not fetchable
 * JSON. The runner loads them inside its iframe; this module loads the same
 * files into the host document using the same registries, so the native review
 * page can quote an explanation without embedding the runner.
 *
 * Everything here is lazy and failure-tolerant: a review renders fully from the
 * stored record alone, and corpus data only ever adds to it. A load failure
 * resolves `null` rather than throwing, so one missing explanation file cannot
 * take a page down.
 *
 * Never call these during render — only from an event handler or an effect.
 */

interface ExplanationItem {
  questionId: string;
  questionNumber: number;
  text: string;
}

/**
 * One section of a paper's explanations ("1. 段落标题匹配（Questions 1–8）"),
 * carrying the per-question items plus a concatenated `text` of them all.
 */
interface ExplanationGroup {
  sectionTitle?: string;
  mode?: string;
  questionRange?: { start: number; end: number };
  items?: ExplanationItem[];
  text?: string;
}

export interface ReadingExplanation {
  schemaVersion: string;
  examId: string;
  meta?: { title?: string; category?: string; noteType?: string };
  passageNotes?: Array<{ label: string; text: string }>;
  /**
   * An ARRAY of section groups in the shipped corpus. The single-object form is
   * accepted too, defensively — the corpus is generated data and one shape
   * assumption should not be able to blank out every explanation on the page.
   */
  questionExplanations?: ExplanationGroup[] | ExplanationGroup;
}

export interface ReadingExamData {
  schemaVersion: string;
  examId: string;
  /**
   * The passage, as one block per paper. Two shapes ship: `html` on the 199
   * `kind: "html"` papers and `bodyHtml` on the 23 `kind: "text"` ones — the
   * player reads `bodyHtml || html`, and so does `passageHtmlOf`.
   */
  passage?: {
    blocks?: Array<{
      blockId: string;
      kind: string;
      html?: string;
      bodyHtml?: string;
    }>;
  };
  questionGroups?: Array<{
    groupId: string;
    kind: string;
    questionIds: string[];
    bodyHtml: string;
  }>;
  answerKey?: Record<string, string | string[]>;
  questionOrder?: string[];
  questionDisplayMap?: Record<string, string>;
}

interface Registry<T> {
  get(id: string): T | null;
  has(id: string): boolean;
}

declare global {
  interface Window {
    __READING_EXPLANATION_DATA__?: Registry<ReadingExplanation>;
    __READING_EXAM_DATA__?: Registry<ReadingExamData>;
  }
}

/**
 * Loads a script once, keyed by src.
 *
 * The in-flight promise is cached, not just the result: two rows expanded in
 * the same tick must share one network request rather than racing two script
 * tags that both register into the same global.
 */
const scriptCache = new Map<string, Promise<boolean>>();

function loadScript(src: string): Promise<boolean> {
  const cached = scriptCache.get(src);
  if (cached) return cached;

  const promise = new Promise<boolean>((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-stage-corpus="${CSS.escape(src)}"]`,
    );
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.stageCorpus = src;
    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => {
      // Drop the cache entry so a transient failure can be retried by a later
      // expand rather than being remembered as permanently unavailable.
      scriptCache.delete(src);
      resolve(false);
    });
    document.head.append(script);
  });

  scriptCache.set(src, promise);
  return promise;
}

const explanationCache = new Map<string, ReadingExplanation | null>();
const examDataCache = new Map<string, ReadingExamData | null>();

export async function loadExplanation(
  examId: string,
): Promise<ReadingExplanation | null> {
  if (explanationCache.has(examId)) return explanationCache.get(examId) ?? null;

  const ready = await loadScript(
    "/ielts/runtime/readingExplanationRegistry.js",
  );
  if (!ready) return null;

  const loaded = await loadScript(
    `/ielts/reading-explanations/${encodeURIComponent(examId)}.js`,
  );
  const value = loaded
    ? window.__READING_EXPLANATION_DATA__?.get(examId) ?? null
    : null;
  explanationCache.set(examId, value);
  return value;
}

export async function loadExamData(
  examId: string,
): Promise<ReadingExamData | null> {
  if (examDataCache.has(examId)) return examDataCache.get(examId) ?? null;

  const ready = await loadScript("/ielts/runtime/readingExamRegistry.js");
  if (!ready) return null;

  const loaded = await loadScript(
    `/ielts/reading-exams/${encodeURIComponent(examId)}.js`,
  );
  const value = loaded
    ? window.__READING_EXAM_DATA__?.get(examId) ?? null
    : null;
  examDataCache.set(examId, value);
  return value;
}

export interface QuestionExplanation {
  text: string;
  paragraphLabel?: string;
  sectionTitle?: string;
}

/** Per-question explanation text, keyed by question id, flattened over sections. */
export function explanationByQuestion(
  explanation: ReadingExplanation | null,
): Map<string, QuestionExplanation> {
  const map = new Map<string, QuestionExplanation>();
  const raw = explanation?.questionExplanations;
  if (!raw) return map;

  const groups = Array.isArray(raw) ? raw : [raw];
  for (const group of groups) {
    if (!Array.isArray(group?.items)) continue;
    for (const item of group.items) {
      if (!item?.questionId || typeof item.text !== "string") continue;
      map.set(item.questionId, {
        text: item.text,
        paragraphLabel: paragraphLabelOf(item.text),
        sectionTitle: group.sectionTitle,
      });
    }
  }
  return map;
}

/**
 * Pulls the paragraph reference out of an explanation body.
 *
 * The corpus writes location cues as "定位 Paragraph C" inside otherwise free
 * Chinese prose. Extracting it gives the review a chip to show without
 * rendering the whole explanation, and returning undefined when there is no
 * match is fine — the chip is an enhancement, not a requirement.
 */
function paragraphLabelOf(text: string): string | undefined {
  const match = /Paragraph\s+([A-Z])\b/.exec(text);
  return match ? `Paragraph ${match[1]}` : undefined;
}
