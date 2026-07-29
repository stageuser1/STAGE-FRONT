"use client";

import { useEffect, useRef, useState } from "react";
import {
  cueLabel,
  noteLetterIndex,
  type PassageCue,
} from "@/lib/ielts/passage";
import { BUTTON_QUIET } from "../ui";

export type PassageStatus = "idle" | "loading" | "ready" | "unavailable";

export interface PassageJump {
  /** Changes on every request, so asking twice for one paragraph re-scrolls. */
  nonce: number;
  /** Named for the reader, e.g. "第 3 题". */
  questionLabel: string;
  /** Null when the explanation names no paragraph — never guessed. */
  cue: PassageCue | null;
}

export interface PassagePaneProps {
  /** Passage title, shown under the pane heading. */
  title: string;
  /** Raw corpus HTML, empty until it has been asked for. */
  html: string;
  status: PassageStatus;
  open: boolean;
  /** Opens/closes the pane; the first open is what triggers the corpus load. */
  onToggle: () => void;
  jump: PassageJump | null;
  /** `passageNotes` from the explanation file — a letter → position mapping. */
  notes?: ReadonlyArray<{ label?: string }>;
}

/* --------------------------------------------------------------------------
 * Sanitising
 *
 * The corpus passages are first-party static files, but they are authored for
 * the vendored player: they carry drop zones, drag targets and element ids that
 * mean nothing outside it. Rendering them here is done through an allow-list
 * rather than by trusting the source — the review injects HTML into the STAGE
 * document, and an allow-list is the only version of that which stays true if
 * the corpus is ever regenerated from somewhere else.
 * ----------------------------------------------------------------------- */

const ALLOWED_TAGS = new Set([
  "P", "DIV", "SPAN", "SECTION", "ARTICLE", "BLOCKQUOTE",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "STRONG", "B", "EM", "I", "U", "SMALL", "SUB", "SUP", "MARK",
  "UL", "OL", "LI", "DL", "DT", "DD",
  "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH", "CAPTION",
  "BR", "HR", "FIGURE", "FIGCAPTION",
]);

/** Removed outright, children and all. */
const DROPPED_TAGS = new Set([
  "SCRIPT", "STYLE", "LINK", "META", "TITLE", "BASE", "NOSCRIPT", "TEMPLATE",
  "IFRAME", "OBJECT", "EMBED", "APPLET", "FORM", "INPUT", "BUTTON", "SELECT",
  "TEXTAREA", "LABEL", "AUDIO", "VIDEO", "CANVAS", "SVG", "MATH", "IMG", "A",
]);

/** Player scaffolding: answer slots and drag targets have no meaning in review. */
const DROPPED_CLASSES = [
  "paragraph-dropzone",
  "paragraph-heading-dropzone",
  "paragraph-heading-match-dropzone",
  "match-dropzone",
  "dropzone",
  "dropped-items",
  "paragraph-label",
  "paragraph-heading-label",
  "empty-space",
  "drag-item",
  "drag-items",
];

/** `class` survives because paragraph structure is expressed through it. */
const ALLOWED_ATTRIBUTES = new Set(["class", "data-paragraph"]);

function sanitize(root: HTMLElement): void {
  // The letter lives on the drop zone, which is about to be deleted — move it
  // onto the paragraph wrapper first so the location cue survives the cleanup.
  for (const marked of Array.from(root.querySelectorAll("[data-paragraph]"))) {
    const letter = marked.getAttribute("data-paragraph")?.trim() ?? "";
    const wrapper = marked.closest(".paragraph-wrapper") ?? marked.parentElement;
    if (wrapper && /^[A-Z]$/.test(letter) && !wrapper.hasAttribute("data-paragraph")) {
      wrapper.setAttribute("data-paragraph", letter);
    }
  }

  for (const selector of DROPPED_CLASSES) {
    for (const node of Array.from(root.querySelectorAll(`.${selector}`))) {
      node.remove();
    }
  }

  for (const element of Array.from(root.querySelectorAll("*"))) {
    if (DROPPED_TAGS.has(element.tagName)) {
      element.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(element.tagName)) {
      // Unknown but harmless: keep the words, drop the element.
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      if (!ALLOWED_ATTRIBUTES.has(attribute.name.toLowerCase())) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

/**
 * The paragraphs a cue can point at.
 *
 * Deliberately the same rule the player uses (`resolvePassageTargets` in
 * unifiedReadingPage.js): wrapped paragraphs when the paper has them, otherwise
 * every non-empty paragraph except the timing instruction. That matters because
 * the player pairs `passageNotes[i]` with the i-th target, which is what makes
 * ordinal cues ("第二段") and note-derived letters land on the same paragraph
 * here as they do in the paper.
 */
function paragraphTargets(root: HTMLElement): HTMLElement[] {
  const wrapped = Array.from(
    root.querySelectorAll<HTMLElement>(".paragraph-wrapper > p"),
  );
  if (wrapped.length > 0) return wrapped;

  return Array.from(root.querySelectorAll<HTMLElement>("p")).filter((node) => {
    const text = (node.textContent ?? "").trim();
    return text.length > 0 && !/you should spend about/i.test(text);
  });
}

/**
 * The paragraph's own letter, when it states one.
 *
 * Only two forms count: the `data-paragraph` attribute moved off the drop zone,
 * and a leading `<strong>A</strong>` marker. A bare capital at the start of the
 * text is NOT read as a letter — "A Brief History of Tea" would become
 * Paragraph A, and a wrong highlight is worse than none.
 */
function paragraphLetter(element: HTMLElement): string | undefined {
  const attribute = element
    .closest("[data-paragraph]")
    ?.getAttribute("data-paragraph")
    ?.trim();
  if (attribute && /^[A-Z]$/.test(attribute)) return attribute;

  const first = element.firstElementChild;
  if (first && (first.tagName === "STRONG" || first.tagName === "B")) {
    const text = (first.textContent ?? "").trim();
    if (/^[A-Z]$/.test(text)) return text;
  }
  return undefined;
}

function annotate(root: HTMLElement): void {
  paragraphTargets(root).forEach((element, index) => {
    element.dataset.stagePara = String(index);
    const letter = paragraphLetter(element);
    if (letter) element.dataset.stageParaLetter = letter;
  });
}

function resolveTarget(
  root: HTMLElement,
  cue: PassageCue,
  notes: ReadonlyArray<{ label?: string }> | undefined,
): HTMLElement | null {
  if (cue.kind === "ordinal") {
    return root.querySelector<HTMLElement>(
      `[data-stage-para="${cue.position - 1}"]`,
    );
  }

  const byLetter = root.querySelector<HTMLElement>(
    `[data-stage-para-letter="${cue.letter}"]`,
  );
  if (byLetter) return byLetter;

  // No letter in the markup: fall back to the notes' own ordering.
  const index = noteLetterIndex(notes, cue.letter);
  return index === -1
    ? null
    : root.querySelector<HTMLElement>(`[data-stage-para="${index}"]`);
}

/** "Paragraph C" needs the space in front of it; "第 2 段" reads better without. */
function cuePhrase(cue: PassageCue): string {
  return cue.kind === "letter" ? ` ${cueLabel(cue)}` : cueLabel(cue);
}

/** Applied imperatively — this subtree is not React-managed. */
const HIGHLIGHT_CLASSES = [
  "bg-stage-primary-soft",
  "rounded-stage-sm",
  "outline-none",
  "ring-1",
  "ring-stage-primary",
];

const PASSAGE_PROSE =
  "text-stage-xs leading-[1.85] text-stage-fg-body " +
  "[&_h2]:mb-2 [&_h2]:text-stage-2xs [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-stage-eyebrow [&_h2]:text-stage-fg-subtle " +
  "[&_h3]:mb-3 [&_h3]:mt-1 [&_h3]:text-stage-h4 [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:text-stage-fg " +
  "[&_h4]:mb-3 [&_h4]:text-stage-xs [&_h4]:text-stage-fg-muted " +
  "[&_h5]:mt-4 [&_h5]:text-stage-xs [&_h5]:font-semibold [&_h5]:text-stage-fg " +
  "[&_hr]:my-4 [&_hr]:border-stage-border " +
  "[&_p]:my-3 [&_p]:scroll-mt-4 " +
  "[&_p>strong:first-child]:mr-1.5 [&_p>strong:first-child]:font-semibold [&_p>strong:first-child]:text-stage-primary " +
  "[&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-stage-border [&_td]:p-1.5 " +
  "[&_th]:border [&_th]:border-stage-border [&_th]:p-1.5";

/**
 * Left pane of the evidence review (Plan §2.4, master-spec 批次二).
 *
 * The passage, quoted from the corpus, with the located paragraph highlighted —
 * the Reading variant of the evidence template, so no timestamps.
 *
 * Three properties this component exists to hold:
 *
 * 1. Nothing is fetched until the learner asks. The pane renders its own
 *    invitation and the corpus request is the caller's, made on first open.
 * 2. The passage subtree is built imperatively (parse → sanitize → annotate →
 *    `replaceChildren`) rather than through `dangerouslySetInnerHTML`, so the
 *    markup that reaches the document is the allow-listed version and the
 *    highlight can be applied without React re-rendering over it.
 * 3. Failure is local. No passage, an unreachable script, a paper with no
 *    passage block — the pane says so and the review is otherwise unchanged.
 */
export function PassagePane({
  title,
  html,
  status,
  open,
  onToggle,
  jump,
  notes,
}: PassagePaneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [located, setLocated] = useState<string | null>(null);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;
    if (!html) {
      container.replaceChildren();
      return;
    }
    const parsed = new DOMParser().parseFromString(html, "text/html");
    sanitize(parsed.body);
    annotate(parsed.body);
    container.replaceChildren(...Array.from(parsed.body.childNodes));
  }, [html, open]);

  useEffect(() => {
    const container = scrollRef.current;
    const body = bodyRef.current;
    if (!jump || !container || !body) return;
    // Still fetching: say so rather than reporting a location that is only
    // missing because the explanation has not arrived yet.
    if (status === "loading") {
      setLocated(`${jump.questionLabel}：定位中…`);
      return;
    }

    for (const previous of Array.from(
      body.querySelectorAll<HTMLElement>("[data-stage-highlight]"),
    )) {
      previous.removeAttribute("data-stage-highlight");
      previous.removeAttribute("tabindex");
      previous.classList.remove(...HIGHLIGHT_CLASSES);
    }

    const target = jump.cue ? resolveTarget(body, jump.cue, notes) : null;
    if (!target) {
      setLocated(
        jump.cue
          ? `${jump.questionLabel}：解析指向${cuePhrase(jump.cue)}，原文中未找到对应段落`
          : `${jump.questionLabel}：这道题的解析没有给出段落定位`,
      );
      return;
    }

    target.dataset.stageHighlight = "true";
    target.setAttribute("tabindex", "-1");
    target.classList.add(...HIGHLIGHT_CLASSES);

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";

    // Scroll the pane, not the page: `scrollIntoView` would also move the
    // document, which on desktop drags the results column out from under the
    // learner. Below md the pane is stacked above the results, so there it does
    // need bringing up.
    const stacked = !window.matchMedia?.("(min-width: 768px)")?.matches;
    const pageFrom = window.scrollY;
    if (stacked) {
      sectionRef.current?.scrollIntoView({ block: "start", behavior });
    }
    const from = container.scrollTop;
    const delta =
      target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const top = from + delta - 12;
    container.scrollTo({ top, behavior });
    target.focus({ preventScroll: true });

    setLocated(
      `${jump.questionLabel}：已定位到${
        jump.cue ? cuePhrase(jump.cue) : "对应段落"
      }`,
    );

    // Landing on the paragraph matters more than the animation. Where a smooth
    // scroll is dropped rather than run — a paused compositor, an engine that
    // ignores the behaviour — nothing would move at all, so check once and
    // place it directly if nothing has started.
    const settle = window.setTimeout(() => {
      if (container.scrollTop === from && top !== from) {
        container.scrollTop = top;
      }
      if (stacked && window.scrollY === pageFrom) {
        sectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }, 350);
    return () => window.clearTimeout(settle);
    // `open` and `html` are dependencies because closing the pane discards the
    // passage subtree: re-opening it has to re-apply the highlight rather than
    // leave the learner at the top of a passage the header says is located.
  }, [jump, notes, status, html, open]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="passage-pane-title"
      className="rounded-stage-lg border border-stage-border bg-stage-bg md:sticky md:top-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-stage-border px-4 py-3">
        <div className="min-w-0">
          <h2
            id="passage-pane-title"
            className="text-stage-xs font-semibold text-stage-fg"
          >
            阅读原文
          </h2>
          <p className="mt-0.5 truncate text-stage-2xs text-stage-fg-subtle">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="passage-pane-body"
          className={`${BUTTON_QUIET} shrink-0`}
        >
          {open ? "收起原文" : "显示原文"}
        </button>
      </div>

      {/* One live region for the whole pane, present whether or not the passage
          is open, so a jump is announced even before the first paint. */}
      <p
        aria-live="polite"
        className={
          located
            ? "border-b border-stage-border px-4 py-2 text-stage-2xs text-stage-fg-muted"
            : "sr-only"
        }
      >
        {located ?? ""}
      </p>

      {open ? (
        <div id="passage-pane-body">
          <div
            ref={scrollRef}
            tabIndex={0}
            role="region"
            aria-label="阅读原文内容"
            className="max-h-[55vh] overflow-y-auto overscroll-contain px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stage-primary md:max-h-[calc(100vh-11rem)]"
          >
            {/* Imperatively populated; React must not manage these children. */}
            <div ref={bodyRef} className={PASSAGE_PROSE} />

            {status === "loading" ? (
              <div className="space-y-2" aria-busy="true">
                <div className="h-3 w-1/2 animate-pulse rounded bg-stage-bg-soft" />
                <div className="h-3 animate-pulse rounded bg-stage-bg-soft" />
                <div className="h-3 animate-pulse rounded bg-stage-bg-soft" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-stage-bg-soft" />
              </div>
            ) : null}

            {/* No retry control: `lib/ielts/corpus.ts` memoises a failed load
                for the session, so a retry here could not do anything. */}
            {status === "unavailable" ? (
              <p className="text-stage-2xs text-stage-fg-muted">
                原文暂时取不到，右侧的逐题结果不受影响。
              </p>
            ) : null}

            {status === "ready" && html.length === 0 ? (
              <p className="text-stage-2xs text-stage-fg-muted">
                这篇题目没有随附原文。
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="px-4 py-3 text-stage-2xs text-stage-fg-subtle">
          原文按需载入，展开后可与右侧的作答逐题对照。
        </p>
      )}
    </section>
  );
}
