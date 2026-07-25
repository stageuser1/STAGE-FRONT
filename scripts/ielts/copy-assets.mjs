/**
 * Copies the IELTS-practice runtime engine and content corpus into public/ielts/.
 *
 * The engine files are copied VERBATIM — they are never edited and never imported
 * by TypeScript. Only two artefacts are transformed, both of them data:
 *   1. reading-practice-unified.html  — six <script src> paths are re-pointed.
 *   2. reading-explanations/manifest.js — entries whose target file is missing or
 *      unparseable are dropped (see QUARANTINED below).
 *
 * The 229 MB ReadingPractice/PDF library is deliberately NOT copied: 222 of 223
 * exams have an interactive dataset, so the MVP does not need it.
 *
 * Usage: node scripts/ielts/copy-assets.mjs [--source "D:\\STAGE TARGET"]
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
const DEST = path.join(PROJECT, "public", "ielts");

/** Engine files. Copied byte-for-byte into public/ielts/runtime/. */
const RUNTIME_FILES = [
  "js/runtime/readingExamRegistry.js",
  "js/runtime/readingExplanationRegistry.js",
  "js/runtime/readingHighlightShared.js",
  "js/runtime/unifiedReadingPage.js",
  "js/utils/answerMatchCore.js",
];

/**
 * The exam page loads its dependencies with paths relative to itself. Moving it
 * from assets/generated/reading-exams/ to public/ielts/reading-exams/ changes
 * only the depth of the runtime directory, so ../../../js/{runtime,utils}/ all
 * collapse to ../runtime/. ./manifest.js stays correct because the manifest is
 * copied alongside the page.
 */
const HTML_SCRIPT_REWRITES = [
  ["../../../js/runtime/", "../runtime/"],
  ["../../../js/utils/", "../runtime/"],
];

function reset(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyGlob(fromDir, toDir, predicate) {
  let count = 0;
  let bytes = 0;
  for (const name of fs.readdirSync(fromDir)) {
    if (!predicate(name)) continue;
    const from = path.join(fromDir, name);
    if (!fs.statSync(from).isFile()) continue;
    fs.copyFileSync(from, path.join(toDir, name));
    bytes += fs.statSync(from).size;
    count += 1;
  }
  return { count, bytes };
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** Runs a legacy registry script in an isolated context to inspect its exports. */
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
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`);
    process.exit(1);
  }

  const srcExams = path.join(SOURCE, "assets/generated/reading-exams");
  const srcExpl = path.join(SOURCE, "assets/generated/reading-explanations");

  reset(DEST);
  const dirs = {
    runtime: path.join(DEST, "runtime"),
    exams: path.join(DEST, "reading-exams"),
    expl: path.join(DEST, "reading-explanations"),
  };
  Object.values(dirs).forEach((d) => fs.mkdirSync(d, { recursive: true }));

  // 1 — engine, verbatim.
  let runtimeBytes = 0;
  for (const rel of RUNTIME_FILES) {
    const from = path.join(SOURCE, rel);
    fs.copyFileSync(from, path.join(dirs.runtime, path.basename(rel)));
    runtimeBytes += fs.statSync(from).size;
  }
  console.log(`runtime engine      ${RUNTIME_FILES.length} files  ${mb(runtimeBytes)}`);

  // 2 — exam page shell, with its script paths re-pointed.
  const htmlName = "reading-practice-unified.html";
  let html = fs.readFileSync(path.join(srcExams, htmlName), "utf8");
  let rewrites = 0;
  for (const [from, to] of HTML_SCRIPT_REWRITES) {
    const occurrences = html.split(from).length - 1;
    rewrites += occurrences;
    html = html.split(from).join(to);
  }
  if (html.includes("../../../")) {
    console.error("FAIL: unresolved ../../../ path remains in exam page");
    process.exit(1);
  }
  fs.writeFileSync(path.join(dirs.exams, htmlName), html, "utf8");
  console.log(`exam page shell     1 file   ${rewrites} script paths re-pointed`);

  // 3 — exam manifest + datasets, verbatim.
  fs.copyFileSync(
    path.join(srcExams, "manifest.js"),
    path.join(dirs.exams, "manifest.js"),
  );
  const exams = copyGlob(srcExams, dirs.exams, (n) => /^p.*\.js$/.test(n));
  console.log(`exam datasets       ${exams.count} files ${mb(exams.bytes)}`);

  // 4 — explanations: copy every file that actually parses, then rebuild the
  //     manifest so it only references files that are present and valid.
  const explFiles = fs
    .readdirSync(srcExpl)
    .filter((n) => /^p.*\.js$/.test(n));

  const valid = new Set();
  const unparseable = [];
  for (const name of explFiles) {
    try {
      evaluate(path.join(srcExpl, name), {
        __READING_EXPLANATION_DATA__: { register: () => {}, has: () => false },
      });
      valid.add(name);
    } catch (error) {
      unparseable.push([name, error.message.split("\n")[0]]);
    }
  }

  let explBytes = 0;
  for (const name of valid) {
    const from = path.join(srcExpl, name);
    fs.copyFileSync(from, path.join(dirs.expl, name));
    explBytes += fs.statSync(from).size;
  }

  const { __READING_EXPLANATION_MANIFEST__: rawManifest = {} } = evaluate(
    path.join(srcExpl, "manifest.js"),
  );
  const kept = {};
  const dropped = [];
  for (const [examId, entry] of Object.entries(rawManifest)) {
    const target = path.basename(entry.script ?? "");
    if (valid.has(target)) kept[examId] = entry;
    else dropped.push(examId);
  }

  const manifestSource = `(function registerReadingExplanationManifest(global) {
  'use strict';
  global.__READING_EXPLANATION_MANIFEST__ = ${JSON.stringify(kept, null, 2)};
})(typeof window !== 'undefined' ? window : globalThis);
`;
  fs.writeFileSync(path.join(dirs.expl, "manifest.js"), manifestSource, "utf8");

  console.log(`explanations        ${valid.size} files ${mb(explBytes)}`);
  console.log(
    `  manifest: ${Object.keys(kept).length} kept, ${dropped.length} dropped`,
  );
  if (unparseable.length) {
    console.log(`  quarantined (unparseable): ${unparseable.map(([n]) => n).join(", ")}`);
  }
  if (dropped.length) console.log(`  dropped entries: ${dropped.join(", ")}`);

  const total = runtimeBytes + exams.bytes + explBytes;
  console.log(`\nTOTAL COPIED        ${mb(total)}  (PDF library excluded by design)`);
}

main();
