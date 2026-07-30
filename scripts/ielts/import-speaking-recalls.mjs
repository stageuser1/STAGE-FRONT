#!/usr/bin/env node
/**
 * Import IELTS Speaking recall markdown into the static Speaking corpus.
 *
 * Source: markdown files under data/raw/speaking/ scraped from a recall site —
 * month sections ("## July 2026"), each holding "Test-taker recall" list items
 * whose body mixes Part 1/2/3 content on a single line. The format is only
 * semi-regular, so the parser is deliberately conservative: anything it cannot
 * read as a verbatim question goes to a manual-review list in the report, and
 * nothing is invented to fill gaps (no glosses, no cue points, no topic names
 * beyond the rules table).
 *
 * Topic assignment lives in speaking-topic-rules.json next to this script —
 * edit that, not this file, when a new season introduces new topics.
 *
 * Usage:
 *   node scripts/ielts/import-speaking-recalls.mjs               # parse + report only
 *   node scripts/ielts/import-speaking-recalls.mjs --write       # replace lib/ielts/speaking-questions.json
 *   node scripts/ielts/import-speaking-recalls.mjs --write --limit 10   # sample import
 *
 * Always writes data/raw/speaking/out/candidate-corpus.json and report.md.
 * --write does NOT touch tests/fixtures/speaking-corpus-ids.json: updating the
 * id snapshot is a deliberate act per the corpus contract (test 6) and must be
 * done in the same commit, by hand.
 *
 * Question ids are `r<part>-<sha1(normalized text)[:8]>` — derived from the
 * text itself, so a question that recurs next season keeps its id (learner
 * material is keyed by id), and re-runs are deterministic.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC_DIR = path.join(ROOT, "data", "raw", "speaking");
const OUT_DIR = path.join(SRC_DIR, "out");
const RULES_PATH = path.join(ROOT, "scripts", "ielts", "speaking-topic-rules.json");
const CORPUS_PATH = path.join(ROOT, "lib", "ielts", "speaking-questions.json");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : null;

const rules = JSON.parse(readFileSync(RULES_PATH, "utf8"));
const RULE_TOPICS = rules.topics.map((t) => ({
  ...t,
  regexes: t.patterns.map((p) => new RegExp(p, "i")),
}));

// ---------------------------------------------------------------------------
// 1 · Split the markdown into per-entry recall bodies
// ---------------------------------------------------------------------------

const MONTH = /^## ((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\s*$/;

function loadEntries() {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) throw new Error(`no .md files in ${SRC_DIR}`);
  const entries = [];
  for (const file of files) {
    const text = readFileSync(path.join(SRC_DIR, file), "utf8");
    const lines = text.split(/\r?\n/);
    let month = null;
    let current = null;
    const flush = () => {
      if (current) entries.push(current);
      current = null;
    };
    for (const line of lines) {
      const m = line.match(MONTH);
      if (m) {
        flush();
        month = m[1];
        continue;
      }
      if (/^## /.test(line)) {
        // non-month section (marketing header/footer) — outside any month
        flush();
        month = null;
        continue;
      }
      if (month === null) continue;
      const item = line.match(/^-\s+(.*?)·\s*Test-taker recall/);
      if (item) {
        flush();
        current = { file, month, country: item[1].trim() || null, body: "" };
        continue;
      }
      if (current) {
        if (/\[.*?\]\(http/.test(line) && /Build your answer|exam recalls/i.test(line)) continue;
        current.body += " " + line;
      }
    }
    flush();
  }
  return entries;
}

// ---------------------------------------------------------------------------
// 2 · Clean and split an entry into part blocks
// ---------------------------------------------------------------------------

function cleanBody(body) {
  return body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // strip residual links, keep text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/#\s*(Interview|Cue Card|Discussion)\s*#/gi, " ")
    .replace(/This part of the test begins.*?as an interview\.\s*/i, " ")
    .replace(/\b(Candidate Task Card|Two-way Questions|Questions included|Interview)\s*:/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-entry narrative summaries — real recalls, but nothing verbatim in them. */
function isNarrativeEntry(text) {
  return (
    /^(Latest IELTS|Test-takers sitting)/i.test(text) ||
    /recently reported|recurring themes|Topics included:/i.test(text)
  );
}

function splitParts(text) {
  const marker = /Part\s*([123])\b\s*[:.]?/g;
  const blocks = [];
  let match;
  let prev = null;
  while ((match = marker.exec(text)) !== null) {
    if (prev) blocks.push({ part: prev.part, text: text.slice(prev.end, match.index).trim() });
    else if (match.index > 0) blocks.push({ part: null, text: text.slice(0, match.index).trim() });
    prev = { part: Number(match[1]), end: match.index + match[0].length };
  }
  if (prev) blocks.push({ part: prev.part, text: text.slice(prev.end).trim() });
  else if (text) blocks.push({ part: null, text });
  return blocks.filter((b) => b.text !== "");
}

// ---------------------------------------------------------------------------
// 3 · Parse one part block into verbatim questions (or review items)
// ---------------------------------------------------------------------------

const QUESTION_WORD =
  /^(do|does|did|is|are|was|were|have|has|had|what|which|who|whose|when|where|why|how|would|should|could|can|will|in your opinion|with more)/i;
/** A recall item missing its "?" still needs an auxiliary somewhere to count as
 *  a full question — filters compressed lists like "Why people enjoy visiting". */
const HAS_AUX =
  /\b(do|does|did|is|are|was|were|should|shall|can|could|will|would|have|has|had|might|must)\b/i;
const TOPIC_HINT = /^Topic:\s*([A-Z][A-Z /'&]*)\s*(?:-\s*)?/;

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parsePart13(block, review, ctx) {
  const questions = [];
  let text = block.text.replace(/^[-:\s]+/, "");

  // "Part 1 topics: - house or flat - ..." — topic keywords, nothing verbatim.
  if (/^topics\b/i.test(text) || /\btopics? (recently reported|reported)\b/i.test(text)) {
    review.push({ ...ctx, reason: "话题关键词列表，非逐字题目", raw: block.text });
    return questions;
  }

  let topicHint = null;
  const hint = text.match(TOPIC_HINT);
  if (hint) {
    topicHint = hint[1].trim();
    text = text.slice(hint[0].length);
  }
  // Strip list labels ("questions:", "sports follow-ups:") — the items after
  // them still go through the per-item question test below.
  text = text.replace(/^(?:[a-z]+\s+)?follow-ups?\s*:\s*/i, "").replace(/^questions\s*:\s*/i, "");

  if (!/\s-\s/.test(text) && (text.match(/\?/g) || []).length > 1) {
    review.push({ ...ctx, reason: "无分隔符的多题段落，需人工切分", raw: block.text });
    return questions;
  }

  const items = text.split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
  for (const item of items) {
    // A short trailing "Why?"/"When?" belongs to the previous question.
    if (/^\w+\?$/.test(item) && item.length <= 12 && questions.length > 0) {
      questions[questions.length - 1].text += ` ${capitalize(item)}`;
      continue;
    }
    const q = capitalize(item.replace(/^["'-\s]+/, "").trim());
    if (q.endsWith("?") && q.length >= 12) {
      questions.push({ text: q, topicHint });
    } else if (
      QUESTION_WORD.test(q) &&
      HAS_AUX.test(q.split(/\s+/).slice(0, 3).join(" ")) &&
      q.length >= 12
    ) {
      // Question-shaped but missing "?" — a recall punctuation slip, keep with
      // "?". The auxiliary must sit in the first three words: real questions
      // invert ("What jobs do children want"), compressed paraphrases don't
      // ("Why some companies are more successful").
      questions.push({ text: q.replace(/[.,;]?$/, "?"), topicHint });
    } else {
      review.push({ ...ctx, reason: "不是完整问句（可能是转述或话题词）", raw: item });
    }
  }
  return questions;
}

function parsePart2(block, review, ctx) {
  const cards = [];
  const text = block.text.replace(/^[-:\s]+/, "");
  let topicHint = null;
  let rest = text;
  const hint = rest.match(TOPIC_HINT);
  if (hint) {
    topicHint = hint[1].trim();
    rest = rest.slice(hint[0].length);
  }
  const idx = rest.indexOf("Describe ");
  if (idx === -1) {
    review.push({ ...ctx, reason: "Part 2 无 “Describe …” 题干（可能是转述）", raw: block.text });
    return cards;
  }
  rest = rest.slice(idx);
  if (rest.slice(1).includes("Describe ")) {
    review.push({ ...ctx, reason: "一个 Part 2 段落含多张提示卡，需人工切分", raw: block.text });
    return cards;
  }

  let prompt;
  let cueText;
  const say = rest.match(/You should say\s*[:.]?/i);
  if (say) {
    prompt = rest.slice(0, say.index);
    cueText = rest.slice(say.index + say[0].length);
  } else {
    const dash = rest.search(/\s+-\s+/);
    if (dash === -1) {
      review.push({ ...ctx, reason: "提示卡无要点（回忆不完整）", raw: block.text });
      return cards;
    }
    prompt = rest.slice(0, dash);
    cueText = rest.slice(dash);
  }

  prompt = prompt.replace(/[-,;\s]+$/, "").trim();
  if (!/[.?]$/.test(prompt)) prompt += ".";

  let cues = cueText.split(/\s+-\s+|;\s+/).map((s) => s.trim()).filter(Boolean);
  if (cues.length === 1 && cues[0].includes(", ")) cues = cues[0].split(/,\s+/);
  cues = cues
    .map((c) => capitalize(c.replace(/^[-,:\s]+/, "").replace(/[.,;]+$/, "").trim()))
    .filter((c) => c.length >= 3);

  if (cues.length < 2) {
    // A real cue card has 3–4 bullets; one blob means the recall ran the
    // points together without separators — needs a human to re-segment.
    review.push({ ...ctx, reason: "提示卡要点缺失或未分段", raw: block.text });
    return cards;
  }
  if (cues.some((c) => /^(Include|Describe)\b/.test(c))) {
    review.push({ ...ctx, reason: "要点是转述而非原文", raw: block.text });
    return cards;
  }
  cards.push({ text: prompt, cues, topicHint });
  return cards;
}

// ---------------------------------------------------------------------------
// 4 · Dedup, topic assignment, corpus assembly
// ---------------------------------------------------------------------------

const MONTH_NUM = {
  January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
  July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
};

/** "July 2026" → "2026-07" */
function isoMonth(label) {
  const [name, year] = label.split(" ");
  return `${year}-${MONTH_NUM[name]}`;
}

function normKey(text) {
  // Aggressive on purpose: this key only decides which recall variants are the
  // same question, and variants differ in punctuation, "e.g."-style
  // abbreviations and filler articles ("food that you eat" / "food you eat").
  return text
    .toLowerCase()
    .replace(/\be\.?g\.?,?\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(that|the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assignTopic(matchText) {
  for (const topic of RULE_TOPICS) {
    if (topic.regexes.some((r) => r.test(matchText))) return topic;
  }
  return null;
}

function run() {
  const entries = loadEntries();
  const review = [];
  const procedural = [];
  /** normKey → { part, best, variants[], topic, months:Set, entryIdx } */
  const pool = new Map();
  let rawCount = 0;

  entries.forEach((entry, entryIdx) => {
    const text = cleanBody(entry.body);
    const ctx = { month: entry.month, country: entry.country, entryIdx };
    if (!text) return;
    if (isNarrativeEntry(text)) {
      review.push({ ...ctx, reason: "叙述式总结，无逐字题目", raw: text.slice(0, 300) });
      return;
    }
    const blocks = splitParts(text);
    const entryQuestions = [];
    for (const block of blocks) {
      if (block.part === null) {
        review.push({ ...ctx, reason: "Part 标记之外的内容", raw: block.text.slice(0, 300) });
        continue;
      }
      if (/\(No content provided\)|recall incomplete/i.test(block.text)) {
        review.push({ ...ctx, reason: "回忆不完整", raw: `Part ${block.part}: ${block.text.slice(0, 200)}` });
        continue;
      }
      if (block.part === 2) {
        for (const card of parsePart2(block, review, ctx)) {
          entryQuestions.push({ part: 2, ...card });
        }
      } else {
        for (const q of parsePart13(block, review, ctx)) {
          entryQuestions.push({ part: block.part, ...q });
        }
      }
    }

    // Topic pass 1: rules (+ Topic: XXX hints). Pass 2: unmatched Part 1/3
    // inherit the entry's first assigned Part 2 topic — recall entries group
    // the follow-ups with their cue card.
    for (const q of entryQuestions) {
      const matchText = [q.topicHint, q.text, ...(q.cues ?? [])].filter(Boolean).join(" ");
      q.topic = assignTopic(matchText);
    }
    const inherited = entryQuestions.find((q) => q.part === 2 && q.topic)?.topic ?? null;
    for (const q of entryQuestions) {
      if (!q.topic) q.topic = inherited;
    }

    for (const q of entryQuestions) {
      rawCount += 1;
      const key = normKey(q.text);
      if (rules.proceduralDrops.includes(key)) {
        procedural.push(q.text);
        continue;
      }
      if (rules.fragmentDrops.includes(key)) {
        review.push({ month: entry.month, country: entry.country, entryIdx, reason: "人工标记的碎片式转述（fragmentDrops）", raw: q.text });
        continue;
      }
      const slot = pool.get(`${q.part}|${key}`);
      if (!slot) {
        pool.set(`${q.part}|${key}`, { part: q.part, variants: [q], months: new Set([entry.month]) });
      } else {
        slot.variants.push(q);
        slot.months.add(entry.month);
        }
    }
  });

  // Pick the most complete variant of each question.
  const unique = [];
  for (const slot of pool.values()) {
    const score = (v) =>
      (/[?]$/.test(v.text) ? 1000 : 0) + (v.cues?.length ?? 0) * 100 + v.text.length + (v.cues?.join("").length ?? 0);
    const best = [...slot.variants].sort((a, b) => score(b) - score(a))[0];
    const topic = slot.variants.map((v) => v.topic).find(Boolean) ?? null;
    unique.push({ ...best, topic, part: slot.part, variantCount: slot.variants.length, months: [...slot.months] });
  }

  const unassigned = unique.filter((q) => !q.topic);
  const assigned = unique.filter((q) => q.topic);

  // Assemble topics in rules order; question order: part, then text.
  const byTopic = new Map();
  for (const q of assigned) {
    if (!byTopic.has(q.topic.id)) byTopic.set(q.topic.id, []);
    byTopic.get(q.topic.id).push(q);
  }
  const recallTopics = RULE_TOPICS.filter((t) => byTopic.has(t.id)).map((t) => {
    const qs = byTopic
      .get(t.id)
      .sort((a, b) => a.part - b.part || a.text.localeCompare(b.text))
      .map((q) => {
        const id = `r${q.part}-${createHash("sha1").update(normKey(q.text)).digest("hex").slice(0, 8)}`;
        const row = { id, part: q.part, textEn: q.text };
        if (q.part === 2) row.cuePointsEn = q.cues;
        // Recall provenance for later "high-frequency" UI: how many separate
        // recalls reported this question, and in which sittings. Only recall
        // questions carry these — retained self-authored rows have no sitting
        // data and must not pretend to.
        row.recallCount = q.variantCount;
        row.recallMonths = [...new Set(q.months.map(isoMonth))].sort();
        return row;
      });
    return { id: t.id, labelEn: t.labelEn, labelZh: t.labelZh, sourceNote: rules.recallSourceNote, questions: qs };
  });

  // Retained self-authored topics, verbatim from the current corpus.
  const existing = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const keep = new Set(rules.keepSelfAuthoredTopics);
  const mergeInto = rules.mergeSelfInto ?? {};
  const keptTopics = existing.topics.filter((t) => keep.has(t.id));
  const deletedTopics = existing.topics.filter((t) => !keep.has(t.id) && !(t.id in mergeInto));

  // Self topics folded into a recall topic: append their questions unless the
  // recall pool already has the same text (per part). Original ids and glosses
  // are kept; no recall fields are invented for them.
  const recallKeys = new Set(
    recallTopics.flatMap((t) => t.questions.map((q) => `${q.part}|${normKey(q.textEn)}`)),
  );
  const mergeReport = [];
  for (const [selfId, targetId] of Object.entries(mergeInto)) {
    const self = existing.topics.find((t) => t.id === selfId);
    const target = recallTopics.find((t) => t.id === targetId);
    if (!self || !target) {
      console.warn(`mergeSelfInto: ${selfId} → ${targetId} skipped (topic not found)`);
      continue;
    }
    const added = self.questions.filter((q) => !recallKeys.has(`${q.part}|${normKey(q.textEn)}`));
    const dropped = self.questions.filter((q) => recallKeys.has(`${q.part}|${normKey(q.textEn)}`));
    target.questions.push(...added);
    target.questions.sort((a, b) => a.part - b.part || a.textEn.localeCompare(b.textEn));
    target.sourceNote = `${rules.recallSourceNote}；含并入的自撰题（无频次字段）`;
    mergeReport.push({ selfId, targetId, added, dropped });
  }

  let corpus = {
    corpusVersion: existing.corpusVersion + 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    sourceStatement: rules.sourceStatement,
    topics: [...recallTopics, ...keptTopics],
  };

  if (LIMIT) {
    // Sample mode: keep the whole existing corpus and append only the first
    // LIMIT recall questions (spread across parts) so rendering can be checked.
    const sample = [];
    for (const part of [1, 2, 3]) {
      for (const t of recallTopics) {
        for (const q of t.questions) {
          if (q.part === part && sample.filter((s) => s.q.part === part).length < Math.ceil(LIMIT / 3)) {
            sample.push({ t, q });
          }
        }
      }
    }
    const sampleTopics = new Map();
    for (const { t, q } of sample.slice(0, LIMIT)) {
      if (!sampleTopics.has(t.id)) sampleTopics.set(t.id, { ...t, questions: [] });
      sampleTopics.get(t.id).questions.push(q);
    }
    corpus = {
      ...existing,
      corpusVersion: existing.corpusVersion,
      topics: [...existing.topics, ...sampleTopics.values()],
    };
  }

  // ---------------------------------------------------------------- report
  mkdirSync(OUT_DIR, { recursive: true });
  const countPart = (qs, p) => qs.filter((q) => q.part === p).length;
  const allQs = corpus.topics.flatMap((t) => t.questions);
  const merged = unique.filter((q) => q.variantCount > 1);
  const bytes = Buffer.byteLength(JSON.stringify(corpus, null, 2));

  const lines = [];
  lines.push(`# Speaking recall import report`);
  lines.push(``);
  lines.push(`生成时间：${new Date().toISOString()}  模式：${WRITE ? (LIMIT ? `write --limit ${LIMIT}` : "write") : "仅报告"}`);
  lines.push(``);
  lines.push(`## 统计`);
  lines.push(``);
  lines.push(`| 项 | 数量 |`);
  lines.push(`|---|---|`);
  lines.push(`| 源条目（recall entries） | ${entries.length} |`);
  lines.push(`| 解析出的题目（去重前） | ${rawCount} |`);
  lines.push(`| 去重后唯一题目 | ${unique.length}（P1 ${countPart(unique, 1)} / P2 ${countPart(unique, 2)} / P3 ${countPart(unique, 3)}） |`);
  lines.push(`| 被合并的重复题 | ${merged.length} 题共 ${merged.reduce((n, q) => n + q.variantCount - 1, 0)} 个重复版本 |`);
  lines.push(`| 丢弃的开场程序性问题 | ${procedural.length} |`);
  lines.push(`| 需人工复核（未入库） | ${review.length} |`);
  lines.push(`| 话题未分配（未入库） | ${unassigned.length} |`);
  lines.push(`| 最终语料 | ${allQs.length} 题 / ${corpus.topics.length} 话题 / ${(bytes / 1024).toFixed(1)} KB |`);
  lines.push(``);
  lines.push(`## 话题分布（真题回忆部分）`);
  lines.push(``);
  for (const t of recallTopics) {
    lines.push(`- ${t.id}（${t.labelZh}）: P1 ${countPart(t.questions, 1)} / P2 ${countPart(t.questions, 2)} / P3 ${countPart(t.questions, 3)}`);
  }
  lines.push(``);
  lines.push(`## 并入真题话题的自撰题`);
  lines.push(``);
  for (const m of mergeReport) {
    lines.push(`- ${m.selfId} → ${m.targetId}：并入 ${m.added.length} 题（${m.added.map((q) => q.id).join(", ") || "无"}）；逐字重复丢弃 ${m.dropped.length} 题（${m.dropped.map((q) => q.id).join(", ") || "无"}）`);
  }
  lines.push(``);
  lines.push(`## 保留的自撰话题`);
  lines.push(``);
  lines.push(keptTopics.length ? keptTopics.map((t) => `- ${t.id}（${t.labelZh}，${t.questions.length} 题）`).join("\n") : "（无）");
  lines.push(``);
  lines.push(`## 删除的自撰话题（原 corpusVersion ${existing.corpusVersion}）`);
  lines.push(``);
  for (const t of deletedTopics) {
    lines.push(`- ${t.id}（${t.labelZh}，${t.questions.length} 题：${t.questions.map((q) => q.id).join(", ")}）`);
  }
  lines.push(``);
  lines.push(`## 去重合并清单（保留版本 ← 合并的重复次数）`);
  lines.push(``);
  for (const q of merged.sort((a, b) => b.variantCount - a.variantCount)) {
    lines.push(`- [P${q.part} ×${q.variantCount}] ${q.text}`);
  }
  lines.push(``);
  lines.push(`## 丢弃的程序性开场问题`);
  lines.push(``);
  for (const p of [...new Set(procedural)]) lines.push(`- ${p}`);
  lines.push(``);
  lines.push(`## 话题未分配（需在 speaking-topic-rules.json 补规则）`);
  lines.push(``);
  for (const q of unassigned) lines.push(`- [P${q.part}] ${q.text}`);
  lines.push(``);
  lines.push(`## 需人工复核清单（未入库，${review.length} 条）`);
  lines.push(``);
  for (const r of review) {
    lines.push(`- **${r.month}${r.country ? " · " + r.country : ""} · 条目#${r.entryIdx}** — ${r.reason}`);
    lines.push(`  > ${r.raw.replace(/\n/g, " ").slice(0, 400)}`);
  }
  lines.push(``);

  writeFileSync(path.join(OUT_DIR, "report.md"), lines.join("\n"), "utf8");
  writeFileSync(path.join(OUT_DIR, "candidate-corpus.json"), JSON.stringify(corpus, null, 2), "utf8");

  if (WRITE) {
    writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 2), "utf8");
    console.log(`written: lib/ielts/speaking-questions.json (${allQs.length} questions)`);
    console.log(`NOTE: tests/fixtures/speaking-corpus-ids.json must be updated by hand in the same commit.`);
  }
  console.log(`report:  data/raw/speaking/out/report.md`);
  console.log(
    `parsed ${rawCount} → unique ${unique.length} (P1 ${countPart(unique, 1)} / P2 ${countPart(unique, 2)} / P3 ${countPart(unique, 3)}), review ${review.length}, unassigned ${unassigned.length}, corpus ${allQs.length} q / ${corpus.topics.length} topics / ${(bytes / 1024).toFixed(1)} KB`,
  );
}

run();
