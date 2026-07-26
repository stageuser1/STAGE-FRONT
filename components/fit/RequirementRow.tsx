"use client";

import Link from "next/link";
import { ProseBlock } from "@/components/ui/ProseBlock";
import { StatusChip } from "@/components/ui/StatusChip";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { WorkflowStatus } from "@/data/types";
import type { RequirementItem, RequirementKind } from "@/lib/fit/requirements";
import type { Surface } from "@/lib/ui/surface";

const KIND_ICON: Record<RequirementKind, IconName> = {
  language: "document",
  prescreen: "mic",
  audition: "music",
  documents: "list-checks",
  deadline: "calendar",
  cost: "tuition",
};

/**
 * One requirement rendered as a task (C-03).
 *
 * Built on a native <details> so the disclosure works without JS and carries
 * correct keyboard semantics for free — the same choice ExpandableSection and
 * EvidenceAccordion already make.
 */
export function RequirementRow({
  item,
  status,
  surface = "explore",
}: {
  item: RequirementItem;
  status: WorkflowStatus;
  surface?: Surface;
}) {
  const hasBody = Boolean(item.detail || item.evidence || item.action);

  const header = (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
      <Icon className="shrink-0 text-ink-400" name={KIND_ICON[item.kind]} size={16} />
      <span className="text-[15px] font-medium text-ink-900">{item.title}</span>
      {item.titleEn ? (
        <span className="text-xs text-ink-400">{item.titleEn}</span>
      ) : null}
      <StatusChip state={item.state} surface={surface} />
      {item.summary ? (
        <span className="min-w-0 text-xs text-ink-500">{item.summary}</span>
      ) : (
        <span className="text-xs text-ink-400">暂未收录</span>
      )}
    </span>
  );

  if (!hasBody) {
    return (
      <div className="flex min-h-12 items-center gap-3 border-b border-line-subtle py-2 last:border-b-0">
        {header}
      </div>
    );
  }

  return (
    <details className="group border-b border-line-subtle last:border-b-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
        {header}
        <Icon
          className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
          name="chevron-down"
          size={16}
        />
      </summary>

      <div className="space-y-3 pb-3 pl-6">
        {item.detail ? <ProseBlock content={item.detail} /> : null}

        {item.evidence ? (
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <a
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
              href={item.evidence.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {item.evidence.title}
              <Icon name="external" size={14} />
            </a>
            <p className="mt-0.5 text-xs text-ink-400">
              访问日期 {item.evidence.accessedAt}
            </p>
            {item.evidence.quote ? (
              <blockquote className="mt-1.5 border-l-2 border-ink-300 pl-2.5 text-xs leading-5 text-ink-500">
                {item.evidence.quote}
              </blockquote>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <ConfidenceBadge
            lastCheckedAt={item.lastCheckedAt}
            status={status}
            surface={surface}
          />
          {/* Only offered when there is actually a gap to close. */}
          {item.state === "gap" && item.action ? (
            <Link
              href={item.action.href}
              className="inline-flex h-8 items-center rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white transition hover:bg-ink-700"
            >
              {item.action.label} →
            </Link>
          ) : null}
          {item.missingProfileStep ? (
            <Link
              href={`/profile?return=${encodeURIComponent(
                typeof window === "undefined" ? "/schools" : window.location.pathname,
              )}`}
              className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              补全档案以比对 →
            </Link>
          ) : null}
        </div>
      </div>
    </details>
  );
}
