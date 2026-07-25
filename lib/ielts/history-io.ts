/**
 * Practice-history export and import.
 *
 * NOTE: do not rename this module back to `export.ts`. A client component that
 * imports a module whose basename is a JS reserved word is omitted from the
 * React Client Manifest, and the route fails to prerender with a bare
 * "Could not find the module … in the React Client Manifest".
 *
 * The source project offered Markdown, JSON and CSV export plus a JSON import
 * with a pre-import backup. STAGE ships Markdown (for reading and sharing) and
 * JSON (for moving history between browsers). CSV is omitted: it cannot carry
 * the per-question comparison, so a CSV round-trip silently loses the data
 * analytics depends on, and a lossy export invites exactly that mistake.
 *
 * No pre-import backup slot either — `importRecords` merges and never
 * overwrites an existing record, so an import has nothing to roll back.
 */
import { questionTypeLabel } from "./question-types";
import type { PracticeRecord } from "./types";

const EXPORT_VERSION = 1;

interface ExportEnvelope {
  format: "stage.ielts.history";
  version: number;
  exportedAt: string;
  records: PracticeRecord[];
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes} 分 ${String(total % 60).padStart(2, "0")} 秒`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN");
}

function answerText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = (value ?? "").toString().trim();
  return text.length > 0 ? text : "（未作答）";
}

/** Escapes the pipe so a stray answer cannot break the Markdown table. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

export function toMarkdown(records: readonly PracticeRecord[]): string {
  const lines: string[] = [
    "# STAGE 雅思实验室 · 练习记录",
    "",
    `导出时间：${formatDate(new Date().toISOString())}`,
    `记录数量：${records.length}`,
    "",
  ];

  for (const record of records) {
    const accuracy = Math.round(record.accuracy * 100);
    lines.push(
      `## ${record.title}`,
      "",
      `- 分类：${record.category || "—"}`,
      `- 时间：${formatDate(record.createdAt)}`,
      `- 用时：${formatDuration(record.duration)}`,
      `- 成绩：${record.correctAnswers} / ${record.totalQuestions}（${accuracy}%）`,
    );
    if (record.suite) {
      lines.push(
        `- 套题：第 ${record.suite.index + 1} / ${record.suite.total} 篇`,
      );
    }
    if (record.markedQuestions?.length) {
      lines.push(`- 标记题目：${record.markedQuestions.join(", ")}`);
    }
    lines.push("");

    const entries = Object.entries(record.answerComparison ?? {});
    if (entries.length === 0) {
      lines.push("_这条记录没有逐题数据。_", "");
      continue;
    }

    lines.push(
      "| 题号 | 题型 | 结果 | 你的答案 | 正确答案 |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const [questionId, entry] of entries) {
      lines.push(
        `| ${cell(questionId)} | ${cell(
          entry.questionType ? questionTypeLabel(entry.questionType) : "—",
        )} | ${entry.isCorrect ? "✅" : "❌"} | ${cell(
          answerText(entry.userAnswer),
        )} | ${cell(answerText(entry.correctAnswer))} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function toJson(records: readonly PracticeRecord[]): string {
  const envelope: ExportEnvelope = {
    format: "stage.ielts.history",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    records: records as PracticeRecord[],
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses an exported file back into records.
 *
 * Accepts both the STAGE envelope and a bare array, because the source
 * project's exports are bare arrays and a learner migrating from it should not
 * have to hand-edit the file. Throws on anything else rather than importing a
 * partially-understood payload.
 */
export function parseImport(text: string): PracticeRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON。");
  }

  const candidates: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { records?: unknown } | null)?.records;

  if (!Array.isArray(candidates)) {
    throw new Error("文件中没有找到练习记录。");
  }

  const records = candidates.filter(isPracticeRecord);
  if (records.length === 0) {
    throw new Error("文件中没有可识别的练习记录。");
  }
  return records;
}

/**
 * Structural check on one imported entry.
 *
 * Only the fields history rendering and analytics actually read are required.
 * An import is untrusted input, but it is also the learner's own data — being
 * stricter than the reader is would reject valid older records for no benefit.
 */
function isPracticeRecord(value: unknown): value is PracticeRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PracticeRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.examId === "string" &&
    typeof record.title === "string" &&
    typeof record.accuracy === "number" &&
    typeof record.createdAt === "string"
  );
}

/** Triggers a client-side download. No-op outside the browser. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
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

/** `stage-ielts-history-2026-07-25.md` */
export function exportFilename(extension: "md" | "json"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `stage-ielts-history-${stamp}.${extension}`;
}
