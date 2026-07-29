/**
 * Export and import of every piece of Speaking material (批次三 §6).
 *
 * Follows the precedent set by `history-io.ts`: a named envelope carrying a
 * format tag and a version, JSON only, and an import that merges rather than
 * overwrites. What differs is the fidelity requirement — practice history is
 * generated data that can be re-earned, whereas these fragments are prose the
 * learner wrote, so the round trip has to be lossless rather than merely useful.
 * Every field of every question state is carried, and `parseImport` runs the
 * same `normaliseState` the storage layer runs, so an imported file can never
 * introduce a shape the reader would not have accepted from disk.
 *
 * `downloadFile` is restated here rather than imported from `history-io`:
 * that module pulls in the question-type corpus for its Markdown export, and
 * importing it would drag 26 KB of reading metadata into the Speaking bundle to
 * reuse fifteen lines. The Safari revoke-timing workaround is kept identical.
 */
import {
  SPEAKING_SCHEMA_VERSION,
  normaliseState,
  type SpeakingQuestionState,
} from "./speaking-session.ts";

const EXPORT_VERSION = 1;

interface SpeakingEnvelope {
  format: "stage.ielts.speaking";
  version: number;
  corpusSchemaVersion: number;
  exportedAt: string;
  questions: SpeakingQuestionState[];
}

export function toJson(states: readonly SpeakingQuestionState[]): string {
  const envelope: SpeakingEnvelope = {
    format: "stage.ielts.speaking",
    version: EXPORT_VERSION,
    corpusSchemaVersion: SPEAKING_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    // Sorted by question id so two exports of the same material are identical
    // files — which is what makes a round trip checkable at all.
    questions: [...states].sort((left, right) =>
      left.questionId.localeCompare(right.questionId),
    ),
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses an exported file back into question states.
 *
 * A bare array is accepted alongside the envelope, matching what `history-io`
 * does, so a hand-assembled or partially-edited file still imports rather than
 * being refused for its wrapper.
 */
export function parseImport(text: string): SpeakingQuestionState[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON。");
  }

  const candidates: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { questions?: unknown } | null)?.questions;

  if (!Array.isArray(candidates)) {
    throw new Error("文件中没有找到口语素材。");
  }

  const states: SpeakingQuestionState[] = [];
  for (const entry of candidates) {
    const state = normaliseState(entry, "");
    if (state) states.push(state);
  }
  if (states.length === 0) {
    throw new Error("文件中没有可识别的口语素材。");
  }
  return states;
}

export interface MergeResult {
  states: SpeakingQuestionState[];
  added: number;
  updated: number;
}

/**
 * Merges imported material into what is already stored.
 *
 * Per question, the more recently updated side wins whole. A field-level merge
 * would have to decide which of two edits to the same fragment is right, and
 * getting that wrong silently rewrites something the learner wrote; keeping the
 * newer state whole is a rule they can predict. Importing into an empty store —
 * the restore-after-wipe case — therefore reproduces the export exactly.
 */
export function mergeStates(
  current: readonly SpeakingQuestionState[],
  imported: readonly SpeakingQuestionState[],
): MergeResult {
  const byId = new Map(current.map((state) => [state.questionId, state]));
  let added = 0;
  let updated = 0;

  for (const state of imported) {
    const existing = byId.get(state.questionId);
    if (!existing) {
      byId.set(state.questionId, state);
      added += 1;
      continue;
    }
    if (new Date(state.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      byId.set(state.questionId, state);
      updated += 1;
    }
  }

  return { states: [...byId.values()], added, updated };
}

/** `stage-ielts-speaking-2026-07-29.json` */
export function exportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `stage-ielts-speaking-${stamp}.json`;
}

/** Triggers a client-side download. No-op outside the browser. */
export function downloadFile(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick: Safari cancels an in-flight download if the
  // object URL is released synchronously after click().
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
