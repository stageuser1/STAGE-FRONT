import type { WorkflowStatus } from "@/data/types";
import { FactRow } from "@/components/ui/FactRow";
import { Icon } from "@/components/ui/Icon";
import { VerificationBadge } from "@/components/ui/StatusBadge";

interface SchoolVerificationCardProps {
  status: WorkflowStatus;
  sourceCount: number;
  lastSourceDate: string | null;
}

/**
 * Trust ledger for the school page. Collapsed by default — the badge on
 * the closed bar carries the verification state; details stay one tap
 * away so they never compete with decision content.
 */
export function SchoolVerificationCard({
  status,
  sourceCount,
  lastSourceDate,
}: SchoolVerificationCardProps) {
  return (
    <details
      className="group scroll-mt-20 rounded-xl border border-line bg-white shadow-card"
      id="sources-verification"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[15px] font-semibold leading-6 text-ink-900">
            来源与核验
          </span>
          <span className="text-xs leading-4 text-ink-400">
            Sources & Verification
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <VerificationBadge status={status} />
          <Icon
            className="text-ink-400 transition-transform group-open:rotate-180"
            name="chevron-down"
            size={16}
          />
        </span>
      </summary>
      <div className="border-t border-line-subtle px-4 pb-4 pt-2 md:px-5">
        <div className="grid gap-0">
          <FactRow
            label="来源记录"
            value={sourceCount > 0 ? `${sourceCount} 条` : null}
          />
          <FactRow label="最近资料更新" value={lastSourceDate} />
        </div>
        <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-500">
          所有信息以院校官网为准；页面中「暂未收录」表示尚未采集，不代表学校无此要求。
        </p>
      </div>
    </details>
  );
}
