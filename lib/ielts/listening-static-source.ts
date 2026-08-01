/**
 * Server-side adapter for the generated Listening static dataset.
 *
 * This module deliberately reads the external migration output at runtime
 * instead of importing it into a client bundle. `getSet()` maps only public
 * exercise data; answer keys are read and transformed only by
 * `getScoringRules()`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { ListeningSetSource } from "./listening-source.ts";
import { questionNumbers } from "./listening-runner.ts";
import type {
  ChoiceOption,
  FormCompletionGroup,
  FormLayout,
  FormRow,
  FormSegment,
  ListeningSet,
  ListeningSetSummary,
  MapLabellingGroup,
  MatchingGroup,
  MatchingOption,
  McqMultiGroup,
  McqMultiQuestion,
  McqSingleGroup,
  McqSingleQuestion,
  QuestionGroup,
  ScoringRule,
} from "./listening-types.ts";

const DEFAULT_DATA_ROOT = "D:\\STAGE LISTENING DATA";
const DEFAULT_AUDIO_BASE_URL = "/ielts/listening/audio";
const DEFAULT_IMAGE_BASE_URL = "/ielts/listening/images";

type RawOption = { id: string; text: string };

interface RawQuestion {
  id: string | number;
  text: string;
  answer?: string;
  options?: RawOption[];
}

interface RawBodyLine {
  text: string;
  list?: boolean;
  table?: number;
  row?: number;
  col?: number;
}

interface RawImage {
  assetId: string;
  filename: string;
  src: string;
}

interface RawGroup {
  type: "fill" | "single" | "multiple" | "matching" | "map";
  id?: string;
  title?: string;
  instruction?: string;
  questionText?: string;
  limit?: number;
  options?: RawOption[] | string[];
  image?: RawImage;
  questions: RawQuestion[];
  bodyLines?: RawBodyLine[];
}

interface RawAnswerRule {
  acceptedAnswers: Record<string, string | string[]>;
  caseInsensitive?: boolean;
  trimWhitespace?: boolean;
}

interface RawAnswerRules {
  text: RawAnswerRule;
  single: RawAnswerRule;
  multiple: RawAnswerRule;
  multipleMap: RawAnswerRule;
  matching: RawAnswerRule;
  map: RawAnswerRule;
}

interface RawAudio {
  assetId: string;
  filename: string;
  container: string;
  durationSeconds: number;
  checksum: string;
}

interface RawListeningItem {
  id: string;
  title: string;
  part: 1 | 2 | 3 | 4;
  difficulty: "high" | "medium" | "low";
  accessTier: "public" | "vip";
  audio: RawAudio;
  groups: RawGroup[];
  answerRules: RawAnswerRules;
  transcript?: unknown[];
}

interface ListeningManifestItem {
  id: string;
  audioFilename?: string;
}

interface ListeningManifest {
  items?: ListeningManifestItem[];
}

interface DatasetRecord {
  filename: string;
  item: RawListeningItem;
}

type GroupWithId = QuestionGroup & { groupId: string };
type StaticListeningSet = ListeningSet & {
  accessTier?: RawListeningItem["accessTier"];
  difficulty?: RawListeningItem["difficulty"];
};

export interface StaticListeningSourceOptions {
  dataRoot?: string;
  audioBaseUrl?: string;
  imageBaseUrl?: string;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveBaseUrl(
  optionValue: string | undefined,
  environmentValue: string | undefined,
  fallback: string,
): string {
  const value = optionValue ?? environmentValue;
  return normalizeBaseUrl(value?.trim() || fallback);
}

function urlSegment(value: string): string {
  return encodeURIComponent(value);
}

function urlPath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map(urlSegment)
    .join("/");
}

function parseQuestionNo(value: string | number): number {
  const questionNo = Number(value);
  if (!Number.isInteger(questionNo) || questionNo < 1) {
    throw new Error(`Invalid Listening question number: ${String(value)}`);
  }
  return questionNo;
}

function mapFrequency(
  difficulty: RawListeningItem["difficulty"],
): ListeningSetSummary["frequency"] {
  return difficulty === "medium" ? "mid" : difficulty;
}

function audioExtension(audio: RawAudio): string {
  if (audio.container === "mp3") return "mp3";
  if (/m4a|mp4/i.test(audio.container)) return "m4a";

  const sourceExtension = path.extname(audio.filename).replace(/^\./, "");
  return sourceExtension || "bin";
}

function audioUrl(
  audio: RawAudio,
  baseUrl: string,
  manifestFilename?: string,
): string {
  const filename = manifestFilename
    ? manifestFilename.replace(/^\/+/, "").replace(/^audio\//, "")
    : `${audio.assetId}.${audioExtension(audio)}`;
  return `${baseUrl}/${urlPath(filename)}`;
}

function manifestUrl(baseUrl: string): string | undefined {
  try {
    return new URL("../manifest/listening-index.json", `${baseUrl}/`).toString();
  } catch {
    return undefined;
  }
}

function imageUrl(
  image: RawImage | undefined,
  baseUrl: string,
): string | undefined {
  if (!image) return undefined;
  const filename = path.posix.basename(image.src);
  return `${baseUrl}/${urlSegment(filename)}`;
}

function optionItems(raw: RawOption[] | undefined): MatchingOption[] {
  return (raw ?? []).map((option) => ({
    id: String(option.id),
    text: option.text,
  }));
}

function choiceOptions(raw: RawOption[] | undefined): ChoiceOption[] {
  return (raw ?? []).map((option) => ({
    label: String(option.id),
    text: option.text,
  }));
}

function matchingOptions(raw: RawGroup["options"]): MatchingOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((option) => {
    if (typeof option === "string") return { id: option, text: option };
    return { id: String(option.id), text: option.text };
  });
}

function groupId(item: RawListeningItem, group: RawGroup, index: number): string {
  return group.id ?? `${item.id}:group-${index + 1}`;
}

function withGroupId<T extends QuestionGroup>(group: T, id: string): T & { groupId: string } {
  return Object.assign(group, { groupId: id });
}

function inferFormLayout(instruction: string): FormLayout {
  const text = instruction.toLowerCase();
  if (text.includes("table")) return "table";
  if (text.includes("form")) return "form";
  if (text.includes("sentence")) return "sentence";
  return "notes";
}

const FORM_BLANK = /(\d+)\s*[.)]?\s*(?:[£$€]\s*)?_{2,}/g;

function segmentsFromText(
  text: string,
  questionNos: Set<number>,
): { segments: FormSegment[]; questionNumbers: number[] } {
  const segments: FormSegment[] = [];
  const found: number[] = [];
  let cursor = 0;

  for (const match of text.matchAll(FORM_BLANK)) {
    const whole = match[0];
    const questionNo = parseQuestionNo(match[1]);
    if (!questionNos.has(questionNo)) continue;

    const before = text.slice(cursor, match.index);
    const printedPrefix = whole
      .replace(/^\d+\s*[.)]?\s*/, "")
      .replace(/_+$/, "");
    const fixedText = `${before}${printedPrefix}`;
    if (fixedText) segments.push({ kind: "text", value: fixedText });
    segments.push({ kind: "blank", questionNo });
    found.push(questionNo);
    cursor = (match.index ?? 0) + whole.length;
  }

  const remainder = text.slice(cursor);
  if (remainder) segments.push({ kind: "text", value: remainder });

  if (segments.length === 0) {
    return {
      segments: [
        { kind: "text", value: text },
      ],
      questionNumbers: [],
    };
  }

  return { segments, questionNumbers: found };
}

function fallbackQuestionRow(question: RawQuestion): FormRow {
  const questionNo = parseQuestionNo(question.id);
  return {
    label: "",
    segments: [
      { kind: "text", value: question.text },
      { kind: "blank", questionNo },
    ],
  };
}

function fillRows(group: RawGroup): FormRow[] {
  const questions = group.questions ?? [];
  const questionNos = new Set(questions.map((question) => parseQuestionNo(question.id)));
  const rows: FormRow[] = [];
  const seen = new Set<number>();
  const bodyLines = group.bodyLines ?? [];

  const tableRows = new Map<number, RawBodyLine[]>();
  for (const line of bodyLines) {
    if (line.table === undefined || line.row === undefined) continue;
    const row = tableRows.get(line.row) ?? [];
    row.push(line);
    tableRows.set(line.row, row);
  }

  const addRow = (text: string, label = "") => {
    const parsed = segmentsFromText(text, questionNos);
    const blankNumbers = parsed.questionNumbers;
    if (blankNumbers.length === 0) return;
    for (const questionNo of blankNumbers) seen.add(questionNo);
    rows.push({ label, segments: parsed.segments });
  };

  if (tableRows.size > 0) {
    for (const cells of [...tableRows.entries()].sort(([a], [b]) => a - b).map(([, value]) => value)) {
      const ordered = [...cells].sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
      addRow(ordered.map((line) => line.text).join(" "));
    }
  }

  for (const line of bodyLines) {
    if (line.table !== undefined) continue;
    addRow(line.text);
  }

  for (const question of questions) {
    const questionNo = parseQuestionNo(question.id);
    if (!seen.has(questionNo)) rows.push(fallbackQuestionRow(question));
  }

  return rows.length > 0 ? rows : questions.map(fallbackQuestionRow);
}

function mapFillGroup(item: RawListeningItem, group: RawGroup, id: string): GroupWithId {
  const mapped: FormCompletionGroup = {
    type: "form_completion",
    layout: inferFormLayout(group.instruction ?? ""),
    instruction: group.instruction ?? "",
    formTitle: group.title ?? item.title,
    rows: fillRows(group),
  };
  return withGroupId(mapped, id);
}

function mapSingleGroup(group: RawGroup, id: string): GroupWithId {
  const sharedOptions = choiceOptions(
    group.questions[0]?.options,
  );
  const questions: McqSingleQuestion[] = group.questions.map((question) => ({
    questionNo: parseQuestionNo(question.id),
    prompt: question.text,
    options: question.options ? choiceOptions(question.options) : sharedOptions,
  }));
  const first = questions[0];
  const mapped: McqSingleGroup = {
    type: "mcq_single",
    instruction: group.instruction,
    questions,
    questionNo: first?.questionNo ?? 1,
    question: first?.prompt ?? "",
    options: first?.options ?? sharedOptions,
  };
  return withGroupId(mapped, id);
}

function mapMultipleGroup(group: RawGroup, id: string): GroupWithId {
  const sharedOptions = choiceOptions(group.options as RawOption[] | undefined);
  const questions: McqMultiQuestion[] = group.questions.map((question) => ({
    questionNo: parseQuestionNo(question.id),
    prompt: question.text || group.questionText || "",
    options: sharedOptions,
    selectCount: 1,
  }));
  const first = questions[0];
  const mapped: McqMultiGroup = {
    type: "mcq_multi",
    instruction: group.instruction,
    questions,
    questionNo: first?.questionNo ?? 1,
    question: group.questionText ?? first?.prompt ?? "",
    options: sharedOptions,
    selectCount: group.limit ?? 1,
  };
  return withGroupId(mapped, id);
}

function mapMapGroup(
  group: RawGroup,
  id: string,
  imageBaseUrl: string,
): GroupWithId {
  const labels = (group.options ?? []).map((option) => String(option));
  const resolvedImageUrl = imageUrl(group.image, imageBaseUrl);
  const questions = group.questions.map((question) => ({
    questionNo: parseQuestionNo(question.id),
    prompt: question.text,
    labels,
    imageUrl: resolvedImageUrl,
  }));
  const first = questions[0];
  const mapped: MapLabellingGroup = {
    type: "map_labelling",
    instruction: group.instruction,
    questions,
    questionNo: first?.questionNo ?? 1,
    question: first?.prompt ?? "",
    labels,
    imageUrl: resolvedImageUrl,
  };
  return withGroupId(mapped, id);
}

function mapMatchingGroup(group: RawGroup, id: string): GroupWithId {
  const items = matchingOptions(group.options);
  const questions = group.questions.map((question) => ({
    questionNo: parseQuestionNo(question.id),
    prompt: question.text,
    options: items,
  }));
  const first = questions[0];
  const mapped: MatchingGroup = {
    type: "matching",
    instruction: group.instruction,
    questions,
    questionNo: first?.questionNo ?? 1,
    question: first?.prompt ?? "",
    // The legacy renderer records the submitted value. Use IDs here so its
    // output agrees with the option-id scoring rules; new UI should render
    // optionItems for the human-readable text.
    options: items.map((option) => option.id),
    optionItems: items,
  };
  return withGroupId(mapped, id);
}

function mapGroup(
  item: RawListeningItem,
  group: RawGroup,
  index: number,
  imageBaseUrl: string,
): GroupWithId {
  const id = groupId(item, group, index);
  switch (group.type) {
    case "fill":
      return mapFillGroup(item, group, id);
    case "single":
      return mapSingleGroup(group, id);
    case "multiple":
      return mapMultipleGroup(group, id);
    case "matching":
      return mapMatchingGroup(group, id);
    case "map":
      return mapMapGroup(group, id, imageBaseUrl);
  }
}

function mapSet(
  item: RawListeningItem,
  audioBaseUrl: string,
  imageBaseUrl: string,
  manifestFilename?: string,
): StaticListeningSet {
  const questionGroups = item.groups.map((group, index) =>
    mapGroup(item, group, index, imageBaseUrl),
  );

  return Object.assign(
    {
      id: item.id,
      title: item.title,
      titleZh: null,
      part: item.part,
      frequency: mapFrequency(item.difficulty),
      audioUrl: audioUrl(item.audio, audioBaseUrl, manifestFilename),
      durationSec: item.audio.durationSeconds,
      audioMetadata: {
        container: item.audio.container,
        checksum: item.audio.checksum,
      },
      transcriptRef: item.transcript?.length ? `${item.id}#transcript` : null,
      questionGroups,
    },
    {
      accessTier: item.accessTier,
      difficulty: item.difficulty,
    },
  );
}

function normalizeSteps(rule: RawAnswerRule): ScoringRule["normalize"] {
  const steps: ScoringRule["normalize"] = [];
  if (rule.trimWhitespace) steps.push("trim");
  if (rule.caseInsensitive) steps.push("lowercase");
  return steps;
}

function acceptedValues(
  rule: RawAnswerRule,
  questionNo: number,
  fallback?: string,
): string[] {
  const value = rule.acceptedAnswers[String(questionNo)] ?? fallback;
  if (value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function fallbackMultipleAnswer(
  rule: RawAnswerRule,
  group: RawGroup,
  questionIndex: number,
): string | undefined {
  const key = `${group.questions[0]?.id}_${group.questions[group.questions.length - 1]?.id}`;
  const accepted = rule.acceptedAnswers[key];
  return Array.isArray(accepted) ? accepted[questionIndex] : undefined;
}

function mapScoringRules(item: RawListeningItem): ScoringRule[] {
  const rules: ScoringRule[] = [];

  for (const [index, group] of item.groups.entries()) {
    const id = groupId(item, group, index);
    const questions = group.questions ?? [];

    for (const [questionIndex, question] of questions.entries()) {
      const questionNo = parseQuestionNo(question.id);
      let mode: ScoringRule["mode"] = "text";
      let answerKind: ScoringRule["answerKind"] = "text";
      let sourceRule = item.answerRules.text;
      let fallback = question.answer;
      let selectCount: number | undefined;

      switch (group.type) {
        case "single":
          mode = "single";
          answerKind = "optionId";
          sourceRule = item.answerRules.single;
          break;
        case "multiple":
          // The migrated representation gives each numbered slot one answer;
          // the shared instruction group's `limit` is preserved on the group.
          mode = "single";
          answerKind = "optionId";
          sourceRule = item.answerRules.multipleMap;
          fallback = fallbackMultipleAnswer(item.answerRules.multiple, group, questionIndex);
          selectCount = 1;
          break;
        case "matching":
          mode = "single";
          answerKind = "optionId";
          sourceRule = item.answerRules.matching;
          break;
        case "map":
          mode = "single";
          answerKind = "optionId";
          sourceRule = item.answerRules.map;
          break;
        case "fill":
          break;
      }

      const accepted = acceptedValues(sourceRule, questionNo, fallback);
      if (accepted.length === 0) continue;

      rules.push({
        questionNo,
        groupId: id,
        mode,
        accepted,
        answerKind,
        ...(selectCount === undefined ? {} : { selectCount }),
        normalize: normalizeSteps(sourceRule),
      });
    }
  }

  return rules.sort((a, b) => a.questionNo - b.questionNo);
}

export class StaticListeningSource implements ListeningSetSource {
  private readonly itemsDirectory: string;
  private readonly audioBaseUrl: string;
  private readonly imageBaseUrl: string;
  private readonly listeningManifestUrl?: string;
  private recordsPromise?: Promise<DatasetRecord[]>;
  private audioManifestPromise?: Promise<Map<string, string>>;

  constructor(options: StaticListeningSourceOptions = {}) {
    const dataRoot = options.dataRoot ?? process.env.STAGE_LISTENING_DATA_ROOT ?? DEFAULT_DATA_ROOT;
    this.itemsDirectory = path.join(dataRoot, "items");
    this.audioBaseUrl = resolveBaseUrl(
      options.audioBaseUrl,
      process.env.STAGE_LISTENING_AUDIO_BASE_URL,
      DEFAULT_AUDIO_BASE_URL,
    );
    this.imageBaseUrl = resolveBaseUrl(
      options.imageBaseUrl,
      process.env.STAGE_LISTENING_IMAGE_BASE_URL,
      DEFAULT_IMAGE_BASE_URL,
    );
    this.listeningManifestUrl = manifestUrl(this.audioBaseUrl);
  }

  private async audioManifest(): Promise<Map<string, string>> {
    if (!this.audioManifestPromise) {
      this.audioManifestPromise = (async () => {
        if (!this.listeningManifestUrl) return new Map();

        try {
          const response = await fetch(this.listeningManifestUrl);
          if (!response.ok) return new Map();

          const manifest = (await response.json()) as ListeningManifest;
          return new Map(
            (manifest.items ?? [])
              .filter((entry) => entry.id && entry.audioFilename)
              .map((entry) => [entry.id, entry.audioFilename as string]),
          );
        } catch {
          // The item JSON remains a complete local fallback if the remote
          // manifest is unavailable during a build or a temporary outage.
          return new Map();
        }
      })();
    }
    return this.audioManifestPromise;
  }

  private async records(): Promise<DatasetRecord[]> {
    if (!this.recordsPromise) {
      this.recordsPromise = readdir(this.itemsDirectory, { withFileTypes: true }).then(
        async (entries) => {
          const filenames = entries
            .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
            .map((entry) => entry.name)
            .sort((a, b) => a.localeCompare(b));
          return Promise.all(
            filenames.map(async (filename) => ({
              filename,
              item: JSON.parse(
                await readFile(path.join(this.itemsDirectory, filename), "utf8"),
              ) as RawListeningItem,
            })),
          );
        },
      );
    }
    return this.recordsPromise;
  }

  private async recordFor(id: string): Promise<DatasetRecord> {
    const record = (await this.records()).find((candidate) => candidate.item.id === id);
    if (!record) throw new Error(`Unknown listening set: ${id}`);
    return record;
  }

  async listSets(): Promise<ListeningSetSummary[]> {
    const records = await this.records();
    const audioManifest = await this.audioManifest();
    return records.map(({ item }) => {
      const set = mapSet(
        item,
        this.audioBaseUrl,
        this.imageBaseUrl,
        audioManifest.get(item.id),
      );
      return {
        id: set.id,
        title: set.title,
        titleZh: set.titleZh ?? "",
        part: set.part,
        frequency: set.frequency,
        questionCount: questionNumbers(set).length,
      };
    });
  }

  async getSet(id: string): Promise<ListeningSet> {
    const { item } = await this.recordFor(id);
    const audioManifest = await this.audioManifest();
    return mapSet(
      item,
      this.audioBaseUrl,
      this.imageBaseUrl,
      audioManifest.get(item.id),
    );
  }

  async getScoringRules(id: string): Promise<ScoringRule[]> {
    const { item } = await this.recordFor(id);
    return mapScoringRules(item);
  }
}
