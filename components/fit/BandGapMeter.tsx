import Link from "next/link";
import { formatBand, type BandGap } from "@/lib/ielts/band";
import { surfaceTokens, type Surface } from "@/lib/ui/surface";

/** The meter spans the band range a learner realistically moves within. */
const MIN_BAND = 4;
const MAX_BAND = 9;

function position(band: number): number {
  const clamped = Math.max(MIN_BAND, Math.min(MAX_BAND, band));
  return ((clamped - MIN_BAND) / (MAX_BAND - MIN_BAND)) * 100;
}

/**
 * IELTS requirement vs current estimate (C-04).
 *
 * Never renders a number without its provenance: a lab estimate always states
 * how many questions it came from and which conversion table produced it, and
 * always carries the word 估算. The band a learner sees here is not a test score
 * and must never be able to read as one.
 */
export function BandGapMeter({
  gap,
  surface = "explore",
  ctaHref,
  ctaLabel = "去雅思实验室提分",
  compact = false,
}: {
  gap: BandGap;
  surface?: Surface;
  ctaHref?: string;
  ctaLabel?: string;
  compact?: boolean;
}) {
  const t = surfaceTokens[surface];

  if (gap.state === "no-requirement") {
    return (
      <div className={`text-xs ${t.muted}`}>
        该项目未收录雅思最低分要求。
        {gap.current !== null ? (
          <>
            {" "}
            你的当前水平 {formatBand(gap.current)}
            {gap.currentSource === "lab_estimate" ? "（估算）" : ""}。
          </>
        ) : null}
      </div>
    );
  }

  const required = gap.required as number;
  const label =
    gap.state === "no-estimate"
      ? "尚无估算"
      : gap.state === "below"
        ? `还差 ${Math.abs(gap.delta ?? 0).toFixed(1)} 分`
        : gap.state === "meets"
          ? "已达标"
          : `高出 ${(gap.delta ?? 0).toFixed(1)} 分`;

  const labelTone =
    gap.state === "below"
      ? "text-amber-700"
      : gap.state === "no-estimate"
        ? t.muted
        : "text-emerald-700";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`text-xs ${t.muted}`}>
          要求 <span className="font-semibold tabular-nums">{formatBand(required)}</span>
          {gap.current !== null ? (
            <>
              {" · "}你的
              <span className="font-semibold tabular-nums">
                {" "}
                {formatBand(gap.current)}
              </span>
              {gap.currentSource === "lab_estimate" ? "（估算）" : ""}
            </>
          ) : null}
        </p>
        <p className={`text-xs font-medium ${labelTone}`}>{label}</p>
      </div>

      <div
        role="meter"
        aria-valuemin={MIN_BAND}
        aria-valuemax={MAX_BAND}
        aria-valuenow={gap.current ?? required}
        aria-valuetext={
          gap.current === null
            ? `要求 ${formatBand(required)}，尚无估算`
            : `当前 ${formatBand(gap.current)}，要求 ${formatBand(required)}，${label}`
        }
        aria-label="雅思分数差距"
        className={`relative mt-2 h-2 rounded-full ${t.neutral}`}
      >
        {/* Requirement tick — the target the learner is aiming at. */}
        <span
          aria-hidden
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ink-900"
          style={{ left: `${position(required)}%` }}
        />
        {gap.current !== null ? (
          <span
            aria-hidden
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${
              gap.state === "below" ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ left: `${position(gap.current)}%` }}
          />
        ) : null}
      </div>

      {!compact ? (
        <div className={`mt-1 flex justify-between text-[11px] ${t.faint}`}>
          <span>{MIN_BAND.toFixed(1)}</span>
          <span>{MAX_BAND.toFixed(1)}</span>
        </div>
      ) : null}

      {/* Only shown when the official wording carries MORE than the number the
          meter already displays (a section minimum, a condition). Echoing
          "6.50000" back at the learner is noise, not provenance. */}
      {gap.requirementText &&
      Number.isNaN(Number(gap.requirementText.trim())) ? (
        <p className={`mt-1.5 text-[11px] ${t.muted}`}>
          官方原文：{gap.requirementText}
        </p>
      ) : null}

      {gap.estimateMeta ? (
        <p className={`mt-1.5 text-[11px] ${t.faint}`}>
          基于最近 {gap.estimateMeta.recordCount} 次练习共{" "}
          {gap.estimateMeta.questionCount} 题估算 ·{" "}
          {gap.estimateMeta.tableVersion} · 估算仅供参考，不等同于真实考试成绩
        </p>
      ) : null}

      {ctaHref && gap.state !== "meets" && gap.state !== "exceeds" ? (
        <Link
          href={ctaHref}
          className={`mt-2 inline-flex text-xs font-medium ${t.accent} underline-offset-2 hover:underline`}
        >
          {gap.state === "no-estimate" ? "做一套题得到估算" : ctaLabel} →
        </Link>
      ) : null}
    </div>
  );
}
