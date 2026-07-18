"use client";

import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { Icon } from "./Icon";

interface ProseBlockProps {
  /** Markdown or plain text. Renders nothing when empty. */
  content: string | null | undefined;
  /** Optional small label above the prose (e.g. 预筛选曲目). */
  label?: string;
  /** Collapse content longer than this many characters. 0 disables. */
  collapseOver?: number;
  expandLabel?: string;
  className?: string;
}

/**
 * Full-width reading block for requirement and repertoire prose.
 * The counterpart of FactRow: anything sentence-length or longer
 * renders here, never in a narrow value column.
 */
export function ProseBlock({
  content,
  label,
  collapseOver = 800,
  expandLabel = "展开全部内容",
  className = "",
}: ProseBlockProps) {
  const [expanded, setExpanded] = useState(false);
  if (!content || content.trim() === "") return null;

  const collapsible = collapseOver > 0 && content.length > collapseOver;
  const clamped = collapsible && !expanded;

  return (
    <div className={className}>
      {label ? (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
      ) : null}
      <div className="relative">
        <div
          className={
            clamped ? "max-h-56 overflow-hidden" : undefined
          }
        >
          {renderMarkdown(content)}
        </div>
        {clamped ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        ) : null}
      </div>
      {collapsible ? (
        <button
          className="mt-2 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "收起" : expandLabel}
          <Icon
            className={expanded ? "rotate-180" : undefined}
            name="chevron-down"
            size={16}
          />
        </button>
      ) : null}
    </div>
  );
}
