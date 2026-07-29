import assert from "node:assert/strict";
import test from "node:test";

import {
  chineseNumber,
  cueKey,
  cueLabel,
  noteLetterIndex,
  passageCueOf,
  passageHtmlOf,
} from "../lib/ielts/passage.ts";

test("passageHtmlOf prefers bodyHtml, the precedence the player uses", () => {
  assert.equal(
    passageHtmlOf([{ kind: "text", bodyHtml: "<p>body</p>", html: "<p>other</p>" }]),
    "<p>body</p>",
  );
  assert.equal(passageHtmlOf([{ kind: "html", html: "<p>only</p>" }]), "<p>only</p>");
});

test("passageHtmlOf joins blocks and tolerates missing ones", () => {
  assert.equal(
    passageHtmlOf([{ html: "<p>a</p>" }, { html: "  " }, { bodyHtml: "<p>b</p>" }]),
    "<p>a</p>\n<p>b</p>",
  );
  assert.equal(passageHtmlOf(undefined), "");
  assert.equal(passageHtmlOf([]), "");
});

test("passageCueOf reads the lettered form", () => {
  assert.deepEqual(passageCueOf("解析：定位 Paragraph C 的 “Tea was elevated…”"), {
    kind: "letter",
    letter: "C",
  });
  assert.deepEqual(passageCueOf("对应段落 D 的描述"), {
    kind: "letter",
    letter: "D",
  });
});

test("passageCueOf reads the ordinal form, Chinese numerals included", () => {
  assert.deepEqual(passageCueOf("答案：FALSE\n解析：第二段说恐龙后来…"), {
    kind: "ordinal",
    position: 2,
  });
  assert.deepEqual(passageCueOf("解析：第 12 段提到"), {
    kind: "ordinal",
    position: 12,
  });
  assert.deepEqual(passageCueOf("解析：第十一段提到"), {
    kind: "ordinal",
    position: 11,
  });
});

test("passageCueOf takes the first cue in reading order, not by pattern", () => {
  assert.deepEqual(
    passageCueOf("解析：第三段说她在女王学院时…；Paragraph F 另有说明"),
    { kind: "ordinal", position: 3 },
  );
  assert.deepEqual(
    passageCueOf("定位 Paragraph A —— 第二段的对应内容"),
    { kind: "letter", letter: "A" },
  );
});

test("passageCueOf returns null when nothing is named", () => {
  assert.equal(passageCueOf("答案：TRUE\n解析：原文与题干一致。"), null);
  assert.equal(passageCueOf(""), null);
  assert.equal(passageCueOf(undefined), null);
});

test("chineseNumber covers the range a passage can reach", () => {
  assert.equal(chineseNumber("一"), 1);
  assert.equal(chineseNumber("九"), 9);
  assert.equal(chineseNumber("十"), 10);
  assert.equal(chineseNumber("十五"), 15);
  assert.equal(chineseNumber("二十"), 20);
  assert.equal(chineseNumber("7"), 7);
  assert.equal(chineseNumber("零"), null);
  assert.equal(chineseNumber(""), null);
});

test("cueKey and cueLabel name a cue", () => {
  assert.equal(cueKey({ kind: "letter", letter: "B" }), "letter:B");
  assert.equal(cueKey({ kind: "ordinal", position: 4 }), "ordinal:4");
  assert.equal(cueLabel({ kind: "letter", letter: "B" }), "Paragraph B");
  assert.equal(cueLabel({ kind: "ordinal", position: 4 }), "第 4 段");
});

test("noteLetterIndex maps a letter onto the passageNotes order", () => {
  const notes = [
    { label: "Paragraph A", text: "…" },
    { label: "Paragraph B", text: "…" },
    { label: "Paragraph C", text: "…" },
  ];
  assert.equal(noteLetterIndex(notes, "C"), 2);
  assert.equal(noteLetterIndex(notes, "Z"), -1);
  assert.equal(noteLetterIndex(undefined, "A"), -1);
  assert.equal(noteLetterIndex([{ label: "段落讲解 1" }], "A"), -1);
});
