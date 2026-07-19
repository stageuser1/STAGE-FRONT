import type { WorkflowStatus } from "@/data/types";
import { FactRow } from "@/components/ui/FactRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { VerificationBadge } from "@/components/ui/StatusBadge";

interface SchoolVerificationCardProps {
  status: WorkflowStatus;
  sourceCount: number;
  lastSourceDate: string | null;
}

/**
 * Trust ledger for the school page: overall verification state, source
 * volume and the standing accuracy note. Always renders — a
 * verification state always exists.
 */
export function SchoolVerificationCard({
  status,
  sourceCount,
  lastSourceDate,
}: SchoolVerificationCardProps) {
  return (
    <SectionCard
      aside={<VerificationBadge status={status} />}
      subtitle="Sources & Verification"
      title="来源与核验"
    >
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
    </SectionCard>
  );
}
