/**
 * The one place a Speaking dimension is defined.
 *
 * 个人想法's prompts differ per part, because the three parts ask for different
 * shapes of answer: Part 1 is a short opinion with a reason, Part 2 is a
 * narrated cue card, Part 3 is a discussion. A single nine-dimension set asked
 * Part 1 candidates to fill in WHERE and CHANGE_OVER_TIME for "Do you like
 * music?", which is why it is now split.
 *
 * Three screens read these: the 个人想法 cards, the 答案构建 fragment list and
 * the 独立表达 self-check list. They all read *this* module — a second copy of
 * the labels anywhere else is the bug this file exists to prevent.
 *
 * Kept out of `speaking-session.ts` so the client components can import the
 * labels without pulling the storage layer, and out of `speaking-corpus.ts` so
 * they do not pull the 46 KB question bank (the same reasoning that split
 * `speaking-types.ts` off in the first place).
 */
import type { SpeakingPart } from "./speaking-types";

/**
 * Ids some part still offers as a card. Writing one is always in scope.
 *
 * Five of these (WHAT / WHY / WHEN / WHO / WHERE) were also in the retired
 * nine-dimension set, which is why they are here and not below: an id is
 * "retired" only if no part offers it any more.
 */
export type ActiveSpeakingDimension =
  | "OPINION"
  | "REASON"
  | "EXPLANATION"
  | "EXAMPLE"
  | "WHAT"
  | "WHY"
  | "WHEN"
  | "WHO"
  | "WHERE"
  | "HOW";

/**
 * Ids that survive only as stored material. No card writes one, and nothing may
 * start doing so — these are read, displayed and deleted, never authored.
 */
export type RetiredSpeakingDimension =
  | "MEMORY"
  | "FEELING"
  | "CHANGE_OVER_TIME"
  | "COMPARISON";

/**
 * Every id the storage layer will accept.
 *
 * A closed union rather than `string`: `normaliseState` drops a fragment whose
 * dimension it does not recognise, so a typo'd id would be written, look saved,
 * and vanish on the next page load. The union makes that unrepresentable at the
 * call site, and `isDimension` closes the same hole at runtime for values that
 * arrive as `unknown` — from storage, from an import, or from a caller that
 * cast its way past the type.
 */
export type SpeakingDimension =
  | ActiveSpeakingDimension
  | RetiredSpeakingDimension;

export interface SpeakingDimensionDef {
  /** Doubles as the stored key, so it is as fixed as the label. */
  id: SpeakingDimension;
  labelEn: string;
  labelZh: string;
}

/* ------------------------------------------------------------------ *
 * The active sets
 * ------------------------------------------------------------------ */

const PART_1: readonly SpeakingDimensionDef[] = [
  { id: "OPINION", labelEn: "OPINION", labelZh: "观点" },
  { id: "REASON", labelEn: "REASON", labelZh: "理由" },
  { id: "EXPLANATION", labelEn: "EXPLANATION", labelZh: "展开" },
];

const PART_2: readonly SpeakingDimensionDef[] = [
  { id: "WHAT", labelEn: "WHAT", labelZh: "是什么" },
  { id: "WHY", labelEn: "WHY", labelZh: "为何" },
  { id: "WHEN", labelEn: "WHEN", labelZh: "何时" },
  { id: "WHO", labelEn: "WHO", labelZh: "谁" },
  { id: "WHERE", labelEn: "WHERE", labelZh: "何地" },
  { id: "HOW", labelEn: "HOW", labelZh: "如何" },
];

const PART_3: readonly SpeakingDimensionDef[] = [
  { id: "OPINION", labelEn: "OPINION", labelZh: "观点" },
  { id: "REASON", labelEn: "REASON", labelZh: "理由" },
  { id: "EXAMPLE", labelEn: "EXAMPLE", labelZh: "例子" },
  { id: "EXPLANATION", labelEn: "EXPLANATION", labelZh: "展开" },
];

export const SPEAKING_DIMENSIONS_BY_PART: Record<
  SpeakingPart,
  readonly SpeakingDimensionDef[]
> = { 1: PART_1, 2: PART_2, 3: PART_3 };

export function dimensionsForPart(
  part: SpeakingPart,
): readonly SpeakingDimensionDef[] {
  return SPEAKING_DIMENSIONS_BY_PART[part];
}

/* ------------------------------------------------------------------ *
 * The retired set
 * ------------------------------------------------------------------ */

/**
 * The nine dimensions every question used before the per-part split.
 *
 * Retired as a *writing* target — no card offers them any more — but still
 * readable, because material written against them is prose a learner typed.
 * Four of the nine (MEMORY / FEELING / CHANGE_OVER_TIME / COMPARISON) have no
 * successor in any active set, so a fragment holding one is rendered under its
 * original label in a clearly-marked 旧素材 group rather than remapped: a
 * migration would have to guess which new dimension the learner meant, and
 * guessing wrong rewrites their notes.
 */
export const LEGACY_SPEAKING_DIMENSIONS: readonly SpeakingDimensionDef[] = [
  { id: "WHAT", labelEn: "WHAT", labelZh: "是什么" },
  { id: "WHO", labelEn: "WHO", labelZh: "谁" },
  { id: "WHEN", labelEn: "WHEN", labelZh: "何时" },
  { id: "WHERE", labelEn: "WHERE", labelZh: "何地" },
  { id: "WHY", labelEn: "WHY", labelZh: "为何" },
  { id: "MEMORY", labelEn: "MEMORY", labelZh: "记忆" },
  { id: "FEELING", labelEn: "FEELING", labelZh: "感受" },
  { id: "CHANGE_OVER_TIME", labelEn: "CHANGE_OVER_TIME", labelZh: "变化" },
  { id: "COMPARISON", labelEn: "COMPARISON", labelZh: "对比" },
];

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

/**
 * The runtime twin of `SpeakingDimension`: every id, active or retired.
 *
 * Built from the same four arrays the type is written from, so an id can only
 * be added to one by adding it to the other — a def whose `id` is outside the
 * union will not compile.
 */
const BY_ID = new Map<string, SpeakingDimensionDef>();
for (const def of [PART_1, PART_2, PART_3, LEGACY_SPEAKING_DIMENSIONS].flat()) {
  if (!BY_ID.has(def.id)) BY_ID.set(def.id, def);
}

/**
 * The guard for anything the type system did not already prove.
 *
 * Storage reads, imports, and any caller holding a plain `string` go through
 * here. A value that fails is never written: see `addFragment`, which refuses
 * rather than storing an id `normaliseState` would delete on the next load.
 */
export function isDimension(value: unknown): value is SpeakingDimension {
  return typeof value === "string" && BY_ID.has(value);
}

/** Whether this id is still offered as a card on that part's 个人想法. */
export function isActiveDimension(
  part: SpeakingPart,
  id: string,
): boolean {
  return dimensionsForPart(part).some((def) => def.id === id);
}

export function dimensionDef(id: string): SpeakingDimensionDef | null {
  return BY_ID.get(id) ?? null;
}

/** `WHAT 是什么` — the label as every screen writes it. */
export function dimensionLabel(id: string): string {
  const def = BY_ID.get(id);
  return def ? `${def.labelEn} ${def.labelZh}` : id;
}
