/**
 * The Speaking question bank.
 *
 * A static versioned corpus shipped with the frontend, per the approved T7 data
 * contract (`docs/roadmap/T7_SPEAKING_DATA_PROPOSAL.md`, option B). It mirrors
 * the Reading catalog exactly — `exam-index.json` read by `catalog.ts` — rather
 * than introducing a Directus collection for a few hundred short strings:
 *
 *   - `scripts/guard.mjs` scans every text file in the repository, so the
 *     compliance blocklist actually covers this content. CMS rows are invisible
 *     to it.
 *   - `tests/ielts_speaking_corpus.test.mjs` asserts the shape, including that
 *     ids are never renamed — an id is the key a learner's own material hangs
 *     off, and renaming one orphans everything they wrote.
 *   - the module needs no network at all: `generateStaticParams` is a file read,
 *     so the build is reproducible and there is no degradation path to design.
 *
 * The corpus carries questions only. There is deliberately no sample answer,
 * no band, no score and no AI field anywhere in the payload — the whole point of
 * 答案构建 is that the draft comes from the learner's own fragments, and a
 * "reference answer" column would eventually be rendered somewhere.
 *
 * `sourceNote` stays internal: it is editorial provenance, not UI copy, so it is
 * dropped by the mapping below rather than exposed on a DTO.
 *
 * Server-side only in practice — importing anything from here pulls in the whole
 * corpus, which is why the labels and row types the client components need live
 * in `speaking-types.ts` instead.
 */
import corpus from "./speaking-questions.json";
import type { SpeakingPart, SpeakingQuestion, SpeakingTopic } from "./speaking-types";

export type { SpeakingPart, SpeakingQuestion, SpeakingTopic };

interface RawQuestion {
  id: string;
  part: number;
  textEn: string;
  glossZh?: string;
  cuePointsEn?: string[];
}

interface RawTopic {
  id: string;
  labelEn: string;
  labelZh: string;
  sourceNote: string;
  questions: RawQuestion[];
}

interface RawCorpus {
  corpusVersion: number;
  generatedAt: string;
  sourceStatement: string;
  topics: RawTopic[];
}

const RAW = corpus as RawCorpus;

export const SPEAKING_CORPUS_VERSION = RAW.corpusVersion;

function isPart(value: number): value is SpeakingPart {
  return value === 1 || value === 2 || value === 3;
}

/**
 * Built once at module load.
 *
 * The corpus is a fixed asset — nothing invalidates it at runtime — so the
 * flattening happens here rather than behind a memo, and every accessor below
 * is a lookup rather than a scan of nested arrays.
 */
const TOPICS: SpeakingTopic[] = RAW.topics.map((topic) => ({
  id: topic.id,
  labelEn: topic.labelEn,
  labelZh: topic.labelZh,
  questions: topic.questions.flatMap((question) => {
    // A row with an unknown part is dropped rather than defaulted: a Part 1
    // prompt shown under Part 2 would come with cue-card scaffolding that does
    // not belong to it. The corpus test makes this unreachable in practice.
    if (!isPart(question.part)) return [];
    return [
      {
        id: question.id,
        part: question.part,
        textEn: question.textEn,
        glossZh: question.glossZh ?? null,
        cuePoints: question.part === 2 ? (question.cuePointsEn ?? []) : [],
        topicId: topic.id,
        topicLabelEn: topic.labelEn,
        topicLabelZh: topic.labelZh,
      },
    ];
  }),
}));

const QUESTIONS: SpeakingQuestion[] = TOPICS.flatMap((topic) => topic.questions);

const BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));

export function getSpeakingTopics(): SpeakingTopic[] {
  return TOPICS;
}

/** Every question, or only those of one part, in corpus order. */
export function getSpeakingQuestions(part?: SpeakingPart): SpeakingQuestion[] {
  return part === undefined
    ? QUESTIONS
    : QUESTIONS.filter((question) => question.part === part);
}

export function getSpeakingQuestion(id: string): SpeakingQuestion | null {
  return BY_ID.get(id) ?? null;
}

/** Ids for `generateStaticParams`. */
export function getSpeakingQuestionIds(): string[] {
  return QUESTIONS.map((question) => question.id);
}
