/**
 * Speaking shapes and labels, with no corpus attached.
 *
 * Split out from `speaking-corpus.ts` for one concrete reason: that module
 * builds its index from `speaking-questions.json` at module load, so anything
 * importing a *value* from it — even a label map — pulls the whole 46 KB corpus
 * into that bundle. The client components need the part labels and the row
 * types; the server pages need the loaders. This file is what the client side
 * imports, and the corpus stays in the payload the server sends rather than in
 * the JavaScript the browser downloads.
 */

export type SpeakingPart = 1 | 2 | 3;

export const SPEAKING_PARTS: readonly SpeakingPart[] = [1, 2, 3];

export const SPEAKING_PART_LABELS: Record<SpeakingPart, string> = {
  1: "Part 1",
  2: "Part 2",
  3: "Part 3",
};

/** What each part asks of a candidate, in plain language. Never a score claim. */
export const SPEAKING_PART_BLURB: Record<SpeakingPart, string> = {
  1: "日常话题短问答",
  2: "个人陈述，带提示卡",
  3: "延伸讨论，偏抽象",
};

export interface SpeakingQuestion {
  id: string;
  part: SpeakingPart;
  /** The prompt, verbatim. */
  textEn: string;
  /** Optional Chinese gloss of what is being asked. Never a model answer. */
  glossZh: string | null;
  /** `You should say:` bullets. Empty on Part 1 and Part 3. */
  cuePoints: string[];
  /**
   * How many recalled sittings this prompt was reported in, or `null` for the
   * self-authored rows that have no sitting data at all.
   *
   * `null` is not zero and must not be rendered as a frequency: it means the
   * question never came from a recall, so any band would be invented.
   */
  recallCount: number | null;
  topicId: string;
  topicLabelEn: string;
  topicLabelZh: string;
}

/* --------------------------------------------------------------------------
 * Frequency
 *
 * Two bands, not three. The Reading catalog has a 非高频 band because every
 * exam there carries a frequency; here 88 of 324 prompts carry none, and
 * labelling those 非高频 would state a fact the corpus does not have. They get
 * no mark at all instead.
 * ----------------------------------------------------------------------- */

export type SpeakingFrequency = "high" | "medium";

export const SPEAKING_FREQUENCY_LABELS: Record<SpeakingFrequency, string> = {
  high: "高频",
  medium: "次高频",
};

/** The band a recall count falls in, or `null` when there is nothing to say. */
export function speakingFrequency(
  recallCount: number | null,
): SpeakingFrequency | null {
  if (recallCount === null) return null;
  if (recallCount >= 3) return "high";
  if (recallCount === 2) return "medium";
  return null;
}

export interface SpeakingTopic {
  id: string;
  labelEn: string;
  labelZh: string;
  questions: SpeakingQuestion[];
}
