"use client";

import Link from "next/link";
import type { ExplanationEntry, ExplanationStatus } from "./ResultTable";

/**
 * Answer → explanation link (C-15).
 *
 * The corpus ships a Chinese explanation per question, with the passage
 * location named inside it ("定位 Paragraph C"). This surfaces that text next
 * to the result row, and hands off to the vendored runner for the fully
 * highlighted passage — re-implementing the highlight machinery here would
 * duplicate readingHighlightShared.js for no additional capability.
 *
 * The corpus script is fetched on first expand, never on mount: a review with
 * 13 rows must not pull 13 datasets to render a score.
 */
export function EvidenceJump({
  questionLabel,
  status,
  explanation,
  runnerHref,
  onRequest,
}: {
  questionLabel: string;
  status: ExplanationStatus;
  explanation?: ExplanationEntry;
  runnerHref: string;
  onRequest: () => void;
}) {
  return (
    <details
      className="group"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) onRequest();
      }}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-stage-fg-muted transition-colors hover:text-stage-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{questionLabel}的</span>原文定位
        <span aria-hidden className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-2 rounded-stage-sm bg-stage-bg-soft p-3 text-xs leading-5">
        {status === "loading" ? (
          <p className="text-stage-fg-muted">加载解析…</p>
        ) : status === "unavailable" ? (
          <p className="text-stage-fg-muted">这篇暂无解析。</p>
        ) : explanation ? (
          <>
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {explanation.paragraphLabel ? (
                <span className="inline-flex rounded bg-stage-bg px-1.5 py-0.5 text-[11px] font-medium text-stage-fg">
                  {explanation.paragraphLabel}
                </span>
              ) : null}
              {explanation.sectionTitle ? (
                <span className="text-[11px] text-stage-fg-muted">
                  {explanation.sectionTitle}
                </span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-stage-fg">
              {explanation.text}
            </p>
          </>
        ) : (
          <p className="text-stage-fg-muted">这题暂无解析。</p>
        )}

        <Link
          href={runnerHref}
          className="mt-2 inline-block text-stage-primary underline-offset-2 hover:underline"
        >
          在原题中查看高亮 →
        </Link>
      </div>
    </details>
  );
}
