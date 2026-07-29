/**
 * Directus read path for the IELTS Lab Writing module.
 *
 * Follows the four disciplines `lib/data.ts` established, without inheriting
 * its size: the transport is the shared one in `lib/directus/client.ts` (so
 * these reads get the same abort budget, failure classification, retry rules,
 * paging and `directus:{collection}` cache tags), every query names its columns
 * explicitly, route loaders are `cache()`-wrapped, and nothing crosses into a
 * client component except through a field-by-field DTO mapping.
 *
 * It lives here rather than in `lib/data.ts` (2,000 lines about schools and
 * programs, zero shared mapping) and rather than in `lib/ielts/` (a pure
 * function layer that `npm run test:lib` loads directly with
 * `--experimental-strip-types`; a Directus import would poison that path).
 *
 * Degradation, per the approved data contract §6.4: a Directus failure — the
 * collections not existing yet included — is logged and answered with an empty
 * result, never an exception. Writing is a new optional module; its backend
 * wobbling must not fail the build for the homepage and the school catalog.
 *
 * The two collections are `ielts_writing_sets` (a practice unit = one card) and
 * `ielts_writing_tasks` (one task = one tab), 1:N. See
 * `docs/roadmap/T6_WRITING_DATA_PROPOSAL.md`.
 */
import { cache } from "react";
import { logDirectusDegradation, readAllItems, readItems } from "@/lib/directus/client";

/* ------------------------------------------------------------------ *
 * Row shapes
 * ------------------------------------------------------------------ */

type DirectusId = string | number;

interface DirectusWritingFile {
  id?: DirectusId | null;
  width?: number | null;
  height?: number | null;
}

interface DirectusWritingTask {
  id?: DirectusId | null;
  position?: number | string | null;
  task_kind?: string | null;
  figure_kind?: string | null;
  prompt_en?: string | null;
  word_target?: number | string | null;
  figure_image?: DirectusWritingFile | DirectusId | null;
  figure_alt_zh?: string | null;
  model_answer_en?: string | null;
  model_answer_note_zh?: string | null;
  model_answer_source?: string | null;
}

interface DirectusWritingSet {
  id?: DirectusId | null;
  slug?: string | null;
  title_en?: string | null;
  title_zh?: string | null;
  difficulty?: string | null;
  estimated_minutes?: number | string | null;
  strategy_hint_zh?: string | null;
  sort?: number | string | null;
  tasks?: DirectusWritingTask[] | null;
}

/* ------------------------------------------------------------------ *
 * Public shapes
 * ------------------------------------------------------------------ */

export type WritingTaskKind = "task_1" | "task_2";

/** Task 1 figure classification: 数据图 / 流程图 / 地图 / 示意图. */
export type WritingFigureKind = "data_chart" | "process" | "map" | "diagram";

/**
 * Neutral three-step scale. Never mapped to a warning colour anywhere in the
 * UI — the writing spec singles this out (§二.3, §五.6), because a red
 * difficulty badge turns a browsing decision into a verdict.
 */
export type WritingDifficulty = "foundation" | "standard" | "advanced";

export const WRITING_TASK_KIND_LABELS: Record<WritingTaskKind, string> = {
  task_1: "Task 1",
  task_2: "Task 2",
};

export const WRITING_FIGURE_KIND_LABELS: Record<WritingFigureKind, string> = {
  data_chart: "数据图",
  process: "流程图",
  map: "地图",
  diagram: "示意图",
};

export const WRITING_DIFFICULTY_LABELS: Record<WritingDifficulty, string> = {
  foundation: "基础",
  standard: "标准",
  advanced: "进阶",
};

export interface WritingFigureDto {
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
}

export interface WritingTaskDto {
  position: number;
  taskKind: WritingTaskKind;
  figureKind: WritingFigureKind | null;
  prompt: string;
  wordTarget: number;
  figure: WritingFigureDto | null;
}

/** List-card fidelity: no prompt, no figure, no model answer. */
export interface WritingSetSummaryDto {
  slug: string;
  titleEn: string;
  titleZh: string | null;
  difficulty: WritingDifficulty | null;
  estimatedMinutes: number | null;
  strategyHint: string | null;
  taskCount: number;
  taskKinds: WritingTaskKind[];
}

export interface WritingSetDto extends WritingSetSummaryDto {
  tasks: WritingTaskDto[];
  /**
   * Whether a model answer exists — the boolean is the *only* thing about it
   * that reaches the writing screen. The prose itself is never in this payload.
   */
  hasModelAnswer: boolean;
}

export interface WritingModelAnswerDto {
  position: number;
  taskKind: WritingTaskKind;
  answer: string;
  note: string | null;
  source: string | null;
}

/* ------------------------------------------------------------------ *
 * Field allowlists
 * ------------------------------------------------------------------ */

const setCardFields = [
  "slug",
  "title_en",
  "title_zh",
  "difficulty",
  "estimated_minutes",
  "strategy_hint_zh",
  "sort",
  // Enough of each task to count them and label the card. The prompt, the
  // figure and the model answer are detail-fidelity and are not read here.
  "tasks.position",
  "tasks.task_kind",
].join(",");

const setDetailFields = [
  setCardFields,
  "tasks.figure_kind",
  "tasks.prompt_en",
  "tasks.word_target",
  "tasks.figure_image.id",
  "tasks.figure_image.width",
  "tasks.figure_image.height",
  "tasks.figure_alt_zh",
].join(",");

/**
 * Model-answer fidelity. Read by one route only, and only for the set that
 * route is about — the same "list surfaces read no bodies" rule the school
 * catalog follows for source quotes.
 */
const setModelAnswerFields = [
  "slug",
  "tasks.position",
  "tasks.task_kind",
  "tasks.model_answer_en",
  "tasks.model_answer_note_zh",
  "tasks.model_answer_source",
].join(",");

const publishedOnly = { "filter[publish_status][_eq]": "published" };

/* ------------------------------------------------------------------ *
 * Value mapping
 * ------------------------------------------------------------------ */

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function intValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function taskKind(value: unknown): WritingTaskKind | null {
  const text = textValue(value);
  return text === "task_1" || text === "task_2" ? text : null;
}

function figureKind(value: unknown): WritingFigureKind | null {
  const text = textValue(value);
  return text === "data_chart" ||
    text === "process" ||
    text === "map" ||
    text === "diagram"
    ? text
    : null;
}

/**
 * An unrecognised difficulty maps to null, not to a default.
 *
 * The card then renders no difficulty chip at all. Guessing "standard" would
 * put a label on the screen that no editor typed — the `null ≠ 0` discipline
 * (Plan §6.8) applied to an enum.
 */
function difficulty(value: unknown): WritingDifficulty | null {
  const text = textValue(value);
  return text === "foundation" || text === "standard" || text === "advanced"
    ? text
    : null;
}

/**
 * Strategy hints are capped at 120 characters by contract (§4 of the proposal):
 * one line of methodology, never a paragraph and never a ready-made sentence
 * for this particular task. An over-length hint is an editorial accident, so it
 * is dropped and logged rather than rendered — the rest of the card is fine.
 */
const STRATEGY_HINT_MAX = 120;

function strategyHint(value: unknown, slug: string): string | null {
  const text = textValue(value);
  if (!text) return null;
  if (text.length > STRATEGY_HINT_MAX) {
    console.warn(
      JSON.stringify({
        event: "writing_hint_rejected",
        slug,
        length: text.length,
        max: STRATEGY_HINT_MAX,
      }),
    );
    return null;
  }
  return text;
}

/**
 * Public asset URL for a Directus file.
 *
 * `NEXT_PUBLIC_DIRECTUS_URL` because the browser is what loads it; the files
 * live in the public-read `ielts-writing` folder approved with this contract.
 * Without the variable there is no honest URL to build, so the figure is
 * omitted and the task renders its prompt and alt text alone.
 */
function assetUrl(file: unknown): { url: string; width: number | null; height: number | null } | null {
  const base = process.env.NEXT_PUBLIC_DIRECTUS_URL?.replace(/\/$/, "");
  if (!base) return null;

  if (typeof file === "string" || typeof file === "number") {
    const id = textValue(file);
    return id ? { url: `${base}/assets/${id}`, width: null, height: null } : null;
  }
  if (!file || typeof file !== "object") return null;

  const record = file as DirectusWritingFile;
  const id = textValue(record.id);
  if (!id) return null;
  return {
    url: `${base}/assets/${id}`,
    width: intValue(record.width),
    height: intValue(record.height),
  };
}

/**
 * A task is only usable when it has the four things the writing screen cannot
 * render without: a position, a kind, a prompt and a word target. An incomplete
 * row is skipped rather than rendered half-empty.
 */
function mapTask(row: DirectusWritingTask): WritingTaskDto | null {
  const position = intValue(row.position);
  const kind = taskKind(row.task_kind);
  const prompt = textValue(row.prompt_en);
  const wordTarget = intValue(row.word_target);
  if (position === null || !kind || !prompt || wordTarget === null) return null;

  const alt = textValue(row.figure_alt_zh);
  const asset = assetUrl(row.figure_image);
  // A figure with no alt text is not shipped: an image a screen reader cannot
  // describe is worse than the prompt alone (Plan §4.1.4).
  const figure =
    asset && alt
      ? { url: asset.url, width: asset.width, height: asset.height, alt }
      : null;

  return {
    position,
    taskKind: kind,
    figureKind: kind === "task_1" ? figureKind(row.figure_kind) : null,
    prompt,
    wordTarget,
    figure,
  };
}

function orderedTasks(rows: DirectusWritingTask[] | null | undefined): DirectusWritingTask[] {
  // Sorted here rather than with a `deep[tasks][sort]` query parameter: the
  // shared transport takes a flat param map, and a handful of rows sort for
  // free.
  return [...(rows ?? [])].sort(
    (left, right) => (intValue(left.position) ?? 0) - (intValue(right.position) ?? 0),
  );
}

function mapSummary(row: DirectusWritingSet): WritingSetSummaryDto | null {
  const slug = textValue(row.slug);
  const titleEn = textValue(row.title_en);
  if (!slug || !titleEn) return null;

  const tasks = orderedTasks(row.tasks);
  const kinds = tasks
    .map((task) => taskKind(task.task_kind))
    .filter((kind): kind is WritingTaskKind => kind !== null);
  // A set with no readable task is not a practice unit; listing it would
  // promise a screen that cannot be built.
  if (kinds.length === 0) return null;

  return {
    slug,
    titleEn,
    titleZh: textValue(row.title_zh),
    difficulty: difficulty(row.difficulty),
    estimatedMinutes: intValue(row.estimated_minutes),
    strategyHint: strategyHint(row.strategy_hint_zh, slug),
    // Derived from the relation, never a stored column: a hand-entered count
    // is the one number on the card a learner reads before clicking in.
    taskCount: kinds.length,
    taskKinds: [...new Set(kinds)],
  };
}

/* ------------------------------------------------------------------ *
 * Loaders
 * ------------------------------------------------------------------ */

/**
 * Every published practice set, at card fidelity.
 *
 * Ordered by the editor's manual `sort` then `id`, so the list — and therefore
 * its pagination — is stable between builds.
 */
export const loadWritingSetSummaries = cache(
  async (): Promise<WritingSetSummaryDto[]> => {
    try {
      const rows = await readAllItems<DirectusWritingSet>("ielts_writing_sets", {
        fields: setCardFields,
        filter: publishedOnly,
        sort: "sort,id",
      });
      return rows.flatMap((row) => {
        const summary = mapSummary(row);
        return summary ? [summary] : [];
      });
    } catch (error) {
      logDirectusDegradation("writing_sets", error);
      return [];
    }
  },
);

/** One set at writing-screen fidelity. Carries no model answer prose. */
export const loadWritingSet = cache(
  async (slug: string): Promise<WritingSetDto | null> => {
    let row: DirectusWritingSet | undefined;
    try {
      const rows = await readItems<DirectusWritingSet>("ielts_writing_sets", {
        fields: setDetailFields,
        limit: 1,
        filter: { ...publishedOnly, "filter[slug][_eq]": slug },
      });
      row = rows[0];
    } catch (error) {
      logDirectusDegradation("writing_set", error);
      return null;
    }
    if (!row) return null;

    const summary = mapSummary(row);
    if (!summary) return null;

    const tasks = orderedTasks(row.tasks).flatMap((task) => {
      const mapped = mapTask(task);
      return mapped ? [mapped] : [];
    });
    if (tasks.length === 0) return null;

    return {
      ...summary,
      taskCount: tasks.length,
      taskKinds: [...new Set(tasks.map((task) => task.taskKind))],
      tasks,
      hasModelAnswer: await hasModelAnswer(slug),
    };
  },
);

/**
 * Whether any task of this set carries a model answer.
 *
 * A separate, minimal read: the writing screen needs the boolean to decide
 * whether to offer the entry after 完成本次练习, and must not receive the prose
 * to decide it. Reading only the presence keeps the answer out of the payload
 * while still being honest about whether one exists.
 */
const hasModelAnswer = cache(async (slug: string): Promise<boolean> => {
  try {
    const rows = await readItems<{ id?: DirectusId }>("ielts_writing_tasks", {
      fields: "id",
      limit: 1,
      filter: {
        "filter[set_id][slug][_eq]": slug,
        "filter[set_id][publish_status][_eq]": "published",
        "filter[model_answer_en][_nnull]": "true",
        "filter[model_answer_en][_neq]": "",
      },
    });
    return rows.length > 0;
  } catch (error) {
    // Unknown is answered as "no": offering an entry that cannot be filled is
    // worse than withholding one that could have been.
    logDirectusDegradation("writing_model_answer_probe", error);
    return false;
  }
});

/**
 * Model answers for one set.
 *
 * Called by `/api/ielts/writing/[setSlug]/model-answer` and by nothing else —
 * in particular, by no page. That is what keeps the prose out of every
 * prerendered payload: it is only ever produced in response to a request the
 * client makes after the local completion condition passes (writing-spec §四).
 */
export const loadWritingModelAnswers = cache(
  async (slug: string): Promise<WritingModelAnswerDto[]> => {
    try {
      const rows = await readItems<DirectusWritingSet>("ielts_writing_sets", {
        fields: setModelAnswerFields,
        limit: 1,
        filter: { ...publishedOnly, "filter[slug][_eq]": slug },
      });
      return orderedTasks(rows[0]?.tasks).flatMap((task) => {
        const position = intValue(task.position);
        const kind = taskKind(task.task_kind);
        const answer = textValue(task.model_answer_en);
        if (position === null || !kind || !answer) return [];
        return [
          {
            position,
            taskKind: kind,
            answer,
            note: textValue(task.model_answer_note_zh),
            source: textValue(task.model_answer_source),
          },
        ];
      });
    } catch (error) {
      logDirectusDegradation("writing_model_answers", error);
      return [];
    }
  },
);

/** Slugs for `generateStaticParams`. Empty when Directus is unavailable. */
export async function getWritingSetSlugs(): Promise<string[]> {
  const sets = await loadWritingSetSummaries();
  return sets.map((set) => set.slug);
}
