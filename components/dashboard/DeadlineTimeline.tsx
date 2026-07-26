"use client";

import Link from "next/link";
import { DeadlineChip } from "@/components/ui/DeadlineChip";
import {
  deadlineLabel,
  type DeadlineNode,
} from "@/lib/dashboard/readiness";

/**
 * Deadlines on a time axis (C-11).
 *
 * Horizontal at ≥768px, a vertical list below it — it REFLOWS, it never
 * disappears. The nodes themselves are DeadlineChips, so a date looks the same
 * here as it does on a program card.
 */
export function DeadlineTimeline({
  nodes,
  windowDays = 90,
}: {
  nodes: DeadlineNode[];
  windowDays?: number;
}) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-stage-md border border-stage-border p-4">
        <p className="text-sm text-stage-fg-muted">
          未来 {windowDays} 天内没有已收藏项目的截止日期。
        </p>
        <Link
          className="mt-3 inline-flex rounded-stage-md border border-stage-border px-3 py-1.5 text-xs transition-colors hover:border-stage-primary"
          href="/schools"
        >
          去收藏项目
        </Link>
      </div>
    );
  }

  const max = Math.max(windowDays, ...nodes.map((node) => node.daysUntil));

  return (
    <div>
      {/* Horizontal axis — desktop only. */}
      <div className="hidden md:block">
        <div className="relative h-24">
          <div className="absolute inset-x-0 top-12 h-px bg-stage-border" />
          <div
            aria-hidden
            className="absolute top-9 flex flex-col items-center"
            style={{ left: 0 }}
          >
            <span className="h-4 w-0.5 rounded-full bg-stage-fg" />
            <span className="mt-1 text-[11px] text-stage-fg-muted">今天</span>
          </div>
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${Math.min(92, (node.daysUntil / max) * 92 + 4)}%`,
                top: index % 2 === 0 ? 0 : 56,
              }}
            >
              <Link
                className="max-w-40 truncate text-[11px] text-stage-fg underline-offset-2 hover:underline"
                href={`/schools/${node.schoolId}/programs/${node.programId}`}
                title={`${node.programLabel} ${deadlineLabel(node.kind)} ${node.date}`}
              >
                {node.programLabel}
              </Link>
              <span className="text-[11px] text-stage-fg-muted">
                {deadlineLabel(node.kind)}
              </span>
              <span
                aria-hidden
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  node.daysUntil <= 30
                    ? "bg-red-500"
                    : node.daysUntil <= 60
                      ? "bg-amber-500"
                      : "bg-stage-primary"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vertical list — the same data, reflowed. This is also the DOM order,
          so the axis is never the only way to read it. */}
      <ol className="space-y-2 md:hidden">
        {nodes.map((node) => (
          <li
            key={node.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-stage-md border border-stage-border px-3 py-2"
          >
            <DeadlineChip date={node.date} label={deadlineLabel(node.kind)} />
            <Link
              className="min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
              href={`/schools/${node.schoolId}/programs/${node.programId}`}
            >
              {node.programLabel}
            </Link>
            <span className="text-xs tabular-nums text-stage-fg-muted">
              还有 {node.daysUntil} 天
            </span>
          </li>
        ))}
      </ol>

      <ul className="mt-3 hidden flex-wrap gap-x-4 gap-y-1 text-[11px] text-stage-fg-muted md:flex">
        <li>● 30 天内</li>
        <li>● 60 天内</li>
        <li>● 更远</li>
        {/* Stated rather than implied: the audition node type has no data
            source yet, so its absence is not evidence of no auditions. */}
        <li className="ml-auto">试音日期暂未收录，以项目页为准</li>
      </ul>
    </div>
  );
}
