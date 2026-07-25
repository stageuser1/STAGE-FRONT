/**
 * Converts the legacy `window.completeExamIndex` JS literal into typed JSON for
 * the catalog. Run offline; the generated file is committed.
 *
 * The legacy record carries fields the MVP cannot trust or does not need:
 *   - hasPdf         stale booleans (PDF library is excluded from the MVP)
 *   - pdfFilename    ditto
 *   - path/filename  dead Windows folder paths from the original distribution
 * `hasHtml` is not copied either — it is re-derived from the exam manifest,
 * which is the only authority on whether an interactive dataset exists.
 *
 * Usage: node scripts/ielts/build-exam-index.mjs [--source "D:\\STAGE TARGET"]
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../..");

const sourceArg = process.argv.indexOf("--source");
const SOURCE =
  sourceArg !== -1 ? process.argv[sourceArg + 1] : "D:\\STAGE TARGET";
const OUT = path.join(PROJECT, "lib", "ielts", "exam-index.json");

/** Legacy frequency labels → stable machine values. */
const FREQUENCY = new Map([
  ["高频", "high"],
  ["次高频", "medium"],
  ["low", "low"],
]);

function evaluate(file, globals = {}) {
  const sandbox = vm.createContext({});
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  Object.assign(sandbox, globals);
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, {
    filename: file,
    timeout: 10_000,
  });
  return sandbox;
}

function main() {
  const { completeExamIndex: legacy } = evaluate(
    path.join(SOURCE, "assets/scripts/complete-exam-data.js"),
  );
  const { __READING_EXAM_MANIFEST__: examManifest } = evaluate(
    path.join(SOURCE, "assets/generated/reading-exams/manifest.js"),
  );
  const { __READING_EXPLANATION_MANIFEST__: explManifest } = evaluate(
    path.join(PROJECT, "public/ielts/reading-explanations/manifest.js"),
  );

  const seen = new Set();
  const records = [];
  const unknownFrequency = new Set();

  for (const row of legacy) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const frequency = FREQUENCY.get(row.frequency);
    if (!frequency) unknownFrequency.add(row.frequency);

    const manifestEntry = examManifest[row.id];
    records.push({
      id: row.id,
      title: String(row.title ?? "").trim(),
      category: row.category,
      frequency: frequency ?? "low",
      // 84 of 223 records genuinely lack a score — keep it optional, never fake it.
      ...(typeof row.difficultyScore === "number"
        ? { difficultyScore: row.difficultyScore }
        : {}),
      // Authority is the manifest, not the legacy hasHtml flag.
      interactive: Boolean(manifestEntry),
      ...(manifestEntry ? { dataKey: manifestEntry.dataKey } : {}),
      hasExplanation: Boolean(explManifest[row.id]),
    });
  }

  records.sort((a, b) => a.id.localeCompare(b.id, "en"));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  const tally = (key) =>
    records.reduce((acc, r) => {
      acc[r[key]] = (acc[r[key]] ?? 0) + 1;
      return acc;
    }, {});

  console.log(`wrote ${path.relative(PROJECT, OUT)}`);
  console.log(`records          ${records.length}`);
  console.log(`by category      ${JSON.stringify(tally("category"))}`);
  console.log(`by frequency     ${JSON.stringify(tally("frequency"))}`);
  console.log(`interactive      ${records.filter((r) => r.interactive).length}`);
  console.log(
    `non-interactive  ${records
      .filter((r) => !r.interactive)
      .map((r) => r.id)
      .join(", ") || "none"}`,
  );
  console.log(`with explanation ${records.filter((r) => r.hasExplanation).length}`);
  console.log(`size             ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
  if (unknownFrequency.size) {
    console.log(`WARNING unmapped frequency labels: ${[...unknownFrequency].join(", ")}`);
  }
}

main();
