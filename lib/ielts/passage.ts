/**
 * Passage-location primitives for the evidence review (Plan §2.4, T4).
 *
 * The corpus writes its location cues as prose inside the Chinese explanation
 * — "定位 Paragraph C 的 …" in the lettered papers, "解析：第二段说 …" in the
 * rest. This module turns that prose into a cue the review can act on, and
 * nothing more: it never touches the DOM and never decides how a paragraph is
 * shown. The DOM half lives in `components/ielts/review/PassagePane.tsx`.
 *
 * Everything here is a best effort by design. A passage with no resolvable cue
 * still renders; the review simply offers no jump for that question rather than
 * guessing at a paragraph.
 */

/** A `passage.blocks[]` entry. `bodyHtml` and `html` are the two shipped shapes. */
export interface PassageBlock {
  blockId?: string;
  kind?: string;
  html?: string;
  bodyHtml?: string;
}

/**
 * Joins a passage's blocks into one HTML string.
 *
 * `bodyHtml` wins over `html`, which is the precedence the vendored player uses
 * (`unifiedReadingPage.js` → `block?.bodyHtml || block?.html || ''`). 23 of the
 * 222 shipped papers carry only `bodyHtml`, so the fallback is not academic.
 */
export function passageHtmlOf(
  blocks: readonly PassageBlock[] | undefined | null,
): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((block) => block?.bodyHtml || block?.html || "")
    .filter((html) => html.trim().length > 0)
    .join("\n");
}

/**
 * Where an explanation says the answer lives.
 *
 * Two vocabularies, because the corpus uses two: lettered paragraphs in the
 * heading-match papers ("Paragraph C") and ordinals everywhere else ("第二段").
 */
export type PassageCue =
  | { kind: "letter"; letter: string }
  | { kind: "ordinal"; position: number };

const LETTER_PATTERNS: RegExp[] = [
  /Paragraph\s+([A-Z])\b/,
  /段落\s*([A-Z])\b/,
];

const ORDINAL_PATTERN = /第\s*([0-9]+|[一二三四五六七八九十]+)\s*段/;

const CHINESE_DIGITS: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

/** "三" → 3, "十二" → 12, "二十" → 20. Beyond 99 returns null — no paper needs it. */
export function chineseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (/^[0-9]+$/.test(trimmed)) {
    const value = Number(trimmed);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const tenAt = trimmed.indexOf("十");
  if (tenAt === -1) {
    const digit = CHINESE_DIGITS[trimmed];
    return digit ?? null;
  }

  const head = trimmed.slice(0, tenAt);
  const tail = trimmed.slice(tenAt + 1);
  const tens = head.length === 0 ? 1 : CHINESE_DIGITS[head];
  const ones = tail.length === 0 ? 0 : CHINESE_DIGITS[tail];
  if (tens === undefined || ones === undefined) return null;
  return tens * 10 + ones;
}

/**
 * First location cue in an explanation body, or null when it names none.
 *
 * "First" is positional, not by pattern order: an explanation that opens with
 * "第二段说 …" and later mentions "Paragraph C" is pointing at the second
 * paragraph, and reading the patterns in a fixed order would invert that.
 */
export function passageCueOf(text: string | undefined | null): PassageCue | null {
  if (!text) return null;

  let best: { at: number; cue: PassageCue } | null = null;

  for (const pattern of LETTER_PATTERNS) {
    const match = pattern.exec(text);
    if (match && (best === null || match.index < best.at)) {
      best = { at: match.index, cue: { kind: "letter", letter: match[1] } };
    }
  }

  const ordinal = ORDINAL_PATTERN.exec(text);
  if (ordinal && (best === null || ordinal.index < best.at)) {
    const position = chineseNumber(ordinal[1]);
    if (position !== null) {
      best = { at: ordinal.index, cue: { kind: "ordinal", position } };
    }
  }

  return best?.cue ?? null;
}

/** Stable identity for a cue, so a repeat click can be told from a new one. */
export function cueKey(cue: PassageCue): string {
  return cue.kind === "letter" ? `letter:${cue.letter}` : `ordinal:${cue.position}`;
}

/** How a cue is named in the interface. */
export function cueLabel(cue: PassageCue): string {
  return cue.kind === "letter"
    ? `Paragraph ${cue.letter}`
    : `第 ${cue.position} 段`;
}

/**
 * Position of a lettered paragraph inside `passageNotes`, or -1.
 *
 * The player pairs `passageNotes[i]` with the i-th passage paragraph
 * (`renderPassageExplanations`), so when a passage carries no letter markup of
 * its own, the notes are still an authoritative letter → position mapping.
 */
export function noteLetterIndex(
  notes: ReadonlyArray<{ label?: string }> | undefined | null,
  letter: string,
): number {
  if (!Array.isArray(notes)) return -1;
  const wanted = letter.toUpperCase();
  return notes.findIndex((note) => {
    const match = /([A-Z])\s*$/.exec((note?.label ?? "").trim());
    return match?.[1] === wanted;
  });
}
