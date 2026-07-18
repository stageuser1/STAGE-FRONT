import type { ReactNode } from "react";
import { DeadlineChip } from "@/components/ui/DeadlineChip";
import { FactRow } from "@/components/ui/FactRow";
import { ProseBlock } from "@/components/ui/ProseBlock";
import { formatDateZh } from "@/lib/format";

/**
 * Presentational requirement views shared by the public page and the
 * reviewer edit cards, so both modes render identical structure.
 * Scalars go to FactRow; anything sentence-length renders in ProseBlock.
 */

export function requirementStatusZh(value: string | null | undefined): {
  label: string;
  known: boolean;
} {
  const normalized = (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["required", "yes", "true"].includes(normalized)) {
    return { label: "需要", known: true };
  }
  if (["not_required", "no", "false", "none"].includes(normalized)) {
    return { label: "不需要", known: true };
  }
  if (normalized === "optional") return { label: "可选", known: true };
  if (normalized === "" ) return { label: "待确认", known: false };
  if (normalized === "unknown") return { label: "待确认", known: false };
  return { label: value!.trim(), known: true };
}

export function StatusText({ value }: { value: string | null | undefined }) {
  const status = requirementStatusZh(value);
  return status.known ? (
    <span>{status.label}</span>
  ) : (
    <span className="font-normal text-ink-400">{status.label}</span>
  );
}

/** 申请材料 view model. */
export interface ApplicationViewData {
  application_deadline: string | null;
  deadline_notes: string | null;
  application_fee: string | null;
  application_fee_currency: string | null;
  resume_required: string | null;
  essay_required: string | null;
  recommendation_letters: string | null;
  transcript_requirements: string | null;
  portfolio_required: string | null;
  required_materials: string | null;
  international_applicant_notes: string | null;
  conditional_notes: string | null;
  notes: string | null;
}

export function ApplicationView({ data }: { data: ApplicationViewData }) {
  const fee =
    data.application_fee && data.application_fee.trim() !== ""
      ? `${data.application_fee_currency ?? ""} ${data.application_fee}`.trim()
      : null;
  return (
    <>
      <div className="grid gap-0">
        <FactRow
          label="申请截止"
          value={
            data.application_deadline ? (
              <DeadlineChip
                date={data.application_deadline}
                label="申请截止"
              />
            ) : null
          }
        />
        <FactRow label="申请费" value={fee} />
        <FactRow label="简历" value={<StatusText value={data.resume_required} />} />
        <FactRow label="文书" value={<StatusText value={data.essay_required} />} />
        <FactRow label="推荐信" value={data.recommendation_letters} />
        <FactRow
          label="作品集"
          value={<StatusText value={data.portfolio_required} />}
        />
      </div>
      <div className="mt-3 space-y-4">
        <ProseBlock content={data.deadline_notes} label="截止日期说明" />
        <ProseBlock content={data.transcript_requirements} label="成绩单要求" />
        <ProseBlock content={data.required_materials} label="申请材料清单" />
        <ProseBlock
          content={data.international_applicant_notes}
          label="国际申请人说明"
        />
        <ProseBlock content={data.conditional_notes} label="条件说明" />
        <ProseBlock content={data.notes} label="其他说明" />
      </div>
    </>
  );
}

/** 预筛选 view model. */
export interface PrescreenViewData {
  required_text: string | null;
  deadline: string | null;
  video_requirements: string | null;
  file_format_requirements: string | null;
}

export function PrescreenView({ data }: { data: PrescreenViewData }) {
  const status = requirementStatusZh(data.required_text);
  if (status.label === "不需要") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 px-3.5 py-3">
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <p className="text-sm leading-6 text-emerald-800">
          该专业无预筛选环节，申请后直接进入试音安排。
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="grid gap-0">
        <FactRow
          label="是否需要预筛选"
          value={<StatusText value={data.required_text} />}
        />
        <FactRow
          label="预筛选截止"
          value={
            data.deadline ? (
              <DeadlineChip date={data.deadline} label="预筛选截止" />
            ) : null
          }
          missingLabel="日期待确认"
        />
      </div>
      <div className="mt-3 space-y-4">
        <ProseBlock content={data.video_requirements} label="视频录制要求" />
        <ProseBlock
          content={data.file_format_requirements}
          label="文件格式要求"
        />
      </div>
    </>
  );
}

/** 现场试音 view model. */
export interface AuditionViewData {
  required_text: string | null;
  format: string | null;
  accompaniment_requirements: string | null;
  interview_or_callback_requirements: string | null;
  special_notes: string | null;
  conditional_notes: string | null;
  notes: string | null;
}

export function AuditionView({ data }: { data: AuditionViewData }) {
  return (
    <>
      <div className="grid gap-0">
        <FactRow
          label="是否需要试音"
          value={<StatusText value={data.required_text} />}
        />
        <FactRow label="试音形式" value={data.format} />
      </div>
      <div className="mt-3 space-y-4">
        <ProseBlock
          content={data.accompaniment_requirements}
          label="伴奏要求"
        />
        <ProseBlock
          content={data.interview_or_callback_requirements}
          label="面试 / 复试"
        />
        <ProseBlock content={data.special_notes} label="特别说明" />
        <ProseBlock content={data.conditional_notes} label="条件说明" />
        <ProseBlock content={data.notes} label="其他说明" />
      </div>
    </>
  );
}

/** 曲目要求 view model. */
export interface RepertoireViewData {
  prescreen_repertoire: string | null;
  audition_repertoire: string | null;
  legacy_summary: string | null;
}

export function RepertoireView({ data }: { data: RepertoireViewData }) {
  const hasSplit =
    Boolean(data.prescreen_repertoire) || Boolean(data.audition_repertoire);
  return (
    <div className="space-y-5">
      {data.prescreen_repertoire ? (
        <RepertoireGroup title="预筛选曲目" tone="prescreen">
          <ProseBlock collapseOver={900} content={data.prescreen_repertoire} />
        </RepertoireGroup>
      ) : null}
      {data.audition_repertoire ? (
        <RepertoireGroup title="现场试音曲目" tone="audition">
          <ProseBlock collapseOver={900} content={data.audition_repertoire} />
        </RepertoireGroup>
      ) : null}
      {!hasSplit && data.legacy_summary ? (
        <RepertoireGroup title="曲目要求（未拆分）" tone="legacy">
          <p className="mb-2 text-xs leading-5 text-amber-700">
            此记录的曲目内容尚未拆分为预筛选与现场试音两部分。
          </p>
          <ProseBlock collapseOver={900} content={data.legacy_summary} />
        </RepertoireGroup>
      ) : null}
    </div>
  );
}

function RepertoireGroup({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "prescreen" | "audition" | "legacy";
  children: ReactNode;
}) {
  const dot =
    tone === "prescreen"
      ? "bg-brand-500"
      : tone === "audition"
        ? "bg-emerald-500"
        : "bg-amber-500";
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {title}
      </p>
      {children}
    </div>
  );
}

/** True when a view model has anything worth rendering publicly. */
export function hasAnyValue(
  data: Record<string, string | null>,
  ignore: string[] = [],
): boolean {
  return Object.entries(data).some(
    ([key, value]) =>
      !ignore.includes(key) && value !== null && value.trim() !== "",
  );
}

export function formatDeadlineText(value: string | null): string | null {
  return formatDateZh(value);
}
