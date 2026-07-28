#!/usr/bin/env node
/**
 * Compliance guard — STAGE visual replacement program, Plan §4.2.
 *
 * Four checks, run over the working tree:
 *
 *   1. competitor  — peer product names must not appear anywhere, docs included.
 *                    The blocklist lives here base64-encoded and is decoded at
 *                    runtime only. It is never written out decoded: a hit is
 *                    reported as `file:line` plus a blocklist index, never as
 *                    the matched text or the surrounding line.
 *   2. estimate    — the band-estimate system (ruling C1) must leave no trace
 *                    in code: labEstimate / estimateBand / BAND_TABLE.
 *   3. lab-words   — vocabulary banned from the IELTS Lab interface. Scoped to
 *                    components/ielts/** and app/(ielts)/** on purpose: ruling
 *                    C5 keeps the school-side data-transparency vocabulary
 *                    ("待核验" on StatusBadge/ConfidenceBadge), so the explore
 *                    surface must never be scanned for these.
 *   4. structure   — a duplicate ielts-lab route group, or any file named
 *                    export.ts (it breaks the Next client manifest).
 *
 * Pre-existing violations that a later stage is contracted to delete are listed
 * in WHITELIST below, each tagged with that stage. A whitelist entry that stops
 * matching is itself reported as an error, so the entry cannot outlive the code
 * it was covering.
 *
 * Usage: npm run guard   (exit 0 clean, exit 1 with a file:line report)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * Peer product names, base64-encoded (Plan §4.2.1). Decoded in memory only.
 * Matching is case-insensitive; the Chinese entries are unaffected by case.
 */
const BLOCKLIST_B64 = [
  "6Jm+5ruR5ZCs5Yqb",
  "5Lmd5YiG5a2m6ZW/",
  "SUVMVFMgTWFzdGVy",
  "T25lSUVMVFM=",
  "TW9ja0lFTFRT",
  "VmVyc2Vv",
  "TGFuZ2FyZA==",
];

const COMPETITOR_NEEDLES = BLOCKLIST_B64.map((b64, index) => ({
  index,
  needle: Buffer.from(b64, "base64").toString("utf8").toLowerCase(),
}));

/** Ruling C1: the band-estimate system. */
const ESTIMATE_TERMS = ["labEstimate", "estimateBand", "BAND_TABLE"];
const ESTIMATE_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs"];

/** Plan §4.2.3 — banned only inside the Lab interface. */
const LAB_TERMS = ["估算", "倒计时", "模考", "待核验", "待公布", "雅思实验室"];
const LAB_SCOPES = ["components/ielts/", "app/(ielts)/"];

/**
 * Directories never walked.
 *
 * The first four are the exclusions the Plan names (design-reference is a
 * third-party export, and the guard must not flag its own blocklist). The rest
 * are build output and local scratch that is git-ignored and never ships —
 * .git is excluded because it stores packed binary history, not source.
 */
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  "design-reference",
  ".git",
  "out",
  "dist",
  "tmp",
  "__pycache__",
  "coverage",
]);

const SELF = "scripts/guard.mjs";

/** Binary payloads: nothing to read, and decoding them is just noise. */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".icns",
  ".bmp",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".7z",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".mp3",
  ".mp4",
  ".wav",
  ".m4a",
  ".webm",
  ".mov",
  ".xlsx",
  ".docx",
  ".pptx",
  ".db",
  ".sqlite",
]);

/**
 * Known violations that a later stage removes. `term` narrows the waiver to one
 * banned word so the rest of the rule still applies to the same file; omit it
 * to waive the whole rule for that file.
 *
 * `stage` is the stage contracted to delete the offending code. `OWNER` means
 * no stage owns it and the repository owner has to decide — those entries are
 * called out separately in the report.
 */
const WHITELIST = [
  // T1 removed every band-estimate waiver that used to sit here: the system is
  // gone from the code, so the rule now applies unwaived (Plan §5-T1).

  // T3 removed the nine "雅思实验室" waivers that used to sit here: every Lab
  // surface now says "IELTS Lab", so the rule applies unwaived (Plan §5-T3).

  // --- competitor names in pre-existing research notes. No stage owns these;
  // they are analysis scratch that predates the program. See the T0 report. ---
  { rule: "competitor", file: "verseo-hero-analysis.md", stage: "OWNER" },
];

const usedWhitelist = new Set();

function whitelistKey(entry) {
  return `${entry.rule}|${entry.file}|${entry.term ?? "*"}`;
}

function isWaived(rule, file, term) {
  for (const entry of WHITELIST) {
    if (entry.rule !== rule || entry.file !== file) continue;
    if (entry.term && entry.term !== term) continue;
    usedWhitelist.add(whitelistKey(entry));
    return true;
  }
  return false;
}

/** Walk the tree, returning repo-relative POSIX paths. */
function collectFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(name)) continue;
    const full = join(dir, name);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue; // a broken link or a file that vanished mid-walk
    }
    if (stats.isDirectory()) {
      collectFiles(full, out);
    } else if (stats.isFile()) {
      out.push(relative(REPO_ROOT, full).split("\\").join("/"));
    }
  }
  return out;
}

function collectDirs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(name)) continue;
    const full = join(dir, name);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      out.push(relative(REPO_ROOT, full).split("\\").join("/"));
      collectDirs(full, out);
    }
  }
  return out;
}

function extensionOf(file) {
  const dot = file.lastIndexOf(".");
  const slash = file.lastIndexOf("/");
  return dot > slash ? file.slice(dot).toLowerCase() : "";
}

function readText(file) {
  const buffer = readFileSync(join(REPO_ROOT, file));
  // A NUL byte in the first 8 KiB means it is not text we can meaningfully scan.
  if (buffer.subarray(0, 8192).includes(0)) return null;
  return buffer.toString("utf8");
}

/** 1-based line number of a character offset. */
function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

function findAll(haystack, needle) {
  const hits = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return hits;
    hits.push(at);
    from = at + needle.length;
  }
}

const findings = [];

function report(rule, file, line, message) {
  findings.push({ rule, file, line, message });
}

const files = collectFiles(REPO_ROOT).filter((file) => file !== SELF);

for (const file of files) {
  if (BINARY_EXTENSIONS.has(extensionOf(file))) continue;

  let text;
  try {
    text = readText(file);
  } catch {
    continue;
  }
  if (text === null) continue;

  // 1. competitor names — whole repo, docs included, case-insensitive.
  const lowered = text.toLowerCase();
  const loweredPath = file.toLowerCase();
  for (const { index, needle } of COMPETITOR_NEEDLES) {
    if (loweredPath.includes(needle) && !isWaived("competitor", file, null)) {
      // The name is in the path itself; nothing to point at inside the file.
      report(
        "competitor",
        file,
        0,
        `file name matches blocklist entry #${index} — rename or remove the file`,
      );
    }
    const hits = findAll(lowered, needle);
    if (hits.length === 0) continue;
    if (isWaived("competitor", file, null)) continue;
    for (const at of hits) {
      report(
        "competitor",
        file,
        lineOf(text, at),
        `blocklist entry #${index} (${hits.length} hit(s) in this file)`,
      );
    }
  }

  // 2. band-estimate identifiers — code files only.
  if (ESTIMATE_EXTENSIONS.includes(extensionOf(file))) {
    for (const term of ESTIMATE_TERMS) {
      const hits = findAll(text, term);
      if (hits.length === 0) continue;
      if (isWaived("estimate", file, term)) continue;
      for (const at of hits) {
        report("estimate", file, lineOf(text, at), `${term} (ruling C1)`);
      }
    }
  }

  // 3. banned Lab vocabulary — only inside the Lab interface (ruling C5).
  if (LAB_SCOPES.some((scope) => file.startsWith(scope))) {
    for (const term of LAB_TERMS) {
      const hits = findAll(text, term);
      if (hits.length === 0) continue;
      if (isWaived("lab-words", file, term)) continue;
      for (const at of hits) {
        report("lab-words", file, lineOf(text, at), `banned Lab word: ${term}`);
      }
    }
  }
}

// 4a. structural — exactly one directory may introduce the ielts-lab segment.
// Descendants of that directory are not themselves a second route group, so
// only the segment a directory adds is tested.
const labDirs = collectDirs(join(REPO_ROOT, "app")).filter((dir) => {
  const segments = dir.split("/");
  return segments[segments.length - 1].toLowerCase().includes("ielts-lab");
});
if (labDirs.length > 1) {
  for (const dir of labDirs) {
    report(
      "structure",
      dir,
      0,
      `duplicate ielts-lab route group — ${labDirs.length} found, exactly one is allowed (Plan §6.1)`,
    );
  }
}

// 4b. structural — export.ts breaks the Next.js client manifest.
for (const file of files) {
  if (file.endsWith("/export.ts") || file === "export.ts") {
    report("structure", file, 0, "file named export.ts is forbidden");
  }
}

// 5. a whitelist entry that no longer matches anything must be deleted.
const stale = WHITELIST.filter(
  (entry) => !usedWhitelist.has(whitelistKey(entry)),
);
for (const entry of stale) {
  report(
    "whitelist",
    "scripts/guard.mjs",
    0,
    `stale waiver for ${entry.rule} in ${entry.file}${
      entry.term ? ` (${entry.term})` : ""
    } — the code is gone, delete the entry`,
  );
}

findings.sort(
  (a, b) =>
    a.rule.localeCompare(b.rule) ||
    a.file.localeCompare(b.file) ||
    a.line - b.line,
);

if (findings.length === 0) {
  const waived = WHITELIST.length;
  console.log(
    `guard: clean — ${files.length} files scanned, ${waived} waiver(s) active.`,
  );
  for (const stage of [...new Set(WHITELIST.map((e) => e.stage))].sort()) {
    const count = WHITELIST.filter((e) => e.stage === stage).length;
    console.log(`  ${stage}: ${count} waiver(s) to remove`);
  }
  process.exit(0);
}

console.error(`guard: ${findings.length} violation(s)\n`);
for (const finding of findings) {
  const at = finding.line > 0 ? `${finding.file}:${finding.line}` : finding.file;
  console.error(`  [${finding.rule}] ${at}  ${finding.message}`);
}
console.error(
  "\nSee docs/roadmap/STAGE_VISUAL_REPLACEMENT_PLAN.md §4.2 for the rules.",
);
process.exit(1);
