/**
 * Builds the question-type index used by IELTS Lab analytics.
 *
 * The exam runner's PRACTICE_COMPLETE payload identifies each question only by
 * id (`q1`, `q2`, …); it never says what *kind* of question it was. The kind
 * lives in the exam datasets, on `questionGroups[].kind`, with
 * `questionGroups[].questionIds` naming the questions that belong to the group.
 * This script flattens that into `questionId -> kind` per exam so a completed
 * attempt can be annotated at save time.
 *
 * Type names are interned into a shared array and referenced by index: the
 * thirteen kinds average fifteen characters each and repeat ~2,900 times, so
 * interning takes the committed file from ~74KB to ~26KB.
 *
 * Run offline; the generated file is committed. Same contract as
 * build-exam-index.mjs — the corpus is static, so this is not a build step.
 *
 * Usage: node scripts/ielts/build-question-types.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../..");

const EXAM_DIR = path.join(PROJECT, "public/ielts/reading-exams");
const INDEX = path.join(PROJECT, "lib/ielts/exam-index.json");
const OUT = path.join(PROJECT, "lib/ielts/question-types.json");

/**
 * `kind` values that describe layout rather than a question type. The corpus
 * uses `html` and `text` for prose blocks between question groups; they carry
 * no questionIds, but they are filtered explicitly so a future corpus that
 * attaches ids to them cannot silently pollute the index.
 */
const NON_QUESTION_KINDS = new Set(["html", "text"]);

function evaluate(file) {
  const sandbox = vm.createContext({});
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const registered = new Map();
  sandbox.__READING_EXAM_DATA__ = {
    register(examId, payload) {
      registered.set(examId, payload);
    },
  };

  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, {
    filename: file,
    timeout: 10_000,
  });
  return registered;
}

function main() {
  const interactive = JSON.parse(fs.readFileSync(INDEX, "utf8"))
    .filter((exam) => exam.interactive)
    .map((exam) => ({ id: exam.id, dataKey: exam.dataKey ?? exam.id }));

  const kinds = [];
  const exams = {};
  const missing = [];
  const empty = [];

  for (const { id, dataKey } of interactive) {
    const file = path.join(EXAM_DIR, `${dataKey}.js`);
    if (!fs.existsSync(file)) {
      missing.push(id);
      continue;
    }

    const registered = evaluate(file);
    // The dataset registers under its own key, which is the dataKey, not the
    // catalog id. Fall back to the sole registration when they disagree.
    const payload =
      registered.get(dataKey) ??
      registered.get(id) ??
      (registered.size === 1 ? [...registered.values()][0] : undefined);

    const groups = payload?.questionGroups;
    if (!Array.isArray(groups)) {
      empty.push(id);
      continue;
    }

    const map = {};
    for (const group of groups) {
      const kind = group?.kind;
      if (typeof kind !== "string" || NON_QUESTION_KINDS.has(kind)) continue;
      if (!Array.isArray(group.questionIds)) continue;

      let index = kinds.indexOf(kind);
      if (index === -1) index = kinds.push(kind) - 1;

      for (const questionId of group.questionIds) {
        if (typeof questionId === "string") map[questionId] = index;
      }
    }

    if (Object.keys(map).length === 0) empty.push(id);
    else exams[id] = map;
  }

  // A partial index is worse than none: it would silently under-report some
  // question types as "unclassified" in analytics. Fail loudly instead.
  if (missing.length > 0 || empty.length > 0) {
    console.error(
      `Incomplete question-type index.\n` +
        `  dataset file missing: ${missing.join(", ") || "none"}\n` +
        `  no question groups:   ${empty.join(", ") || "none"}`,
    );
    process.exit(1);
  }

  const total = Object.values(exams).reduce(
    (sum, map) => sum + Object.keys(map).length,
    0,
  );

  fs.writeFileSync(
    OUT,
    `${JSON.stringify({ kinds, exams })}\n`,
    "utf8",
  );

  console.log(
    `Wrote ${path.relative(PROJECT, OUT)} — ` +
      `${Object.keys(exams).length} exams, ${total} questions, ` +
      `${kinds.length} types, ${(fs.statSync(OUT).size / 1024).toFixed(1)}KB`,
  );
}

main();
