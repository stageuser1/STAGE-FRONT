import Link from "next/link";
import { formatBand, type BandGap } from "@/lib/fit/gap";
import { surfaceTokens, type Surface } from "@/lib/ui/surface";

/** The meter spans the band range a learner realistically moves within. */
const MIN_BAND = 4;
const MAX_BAND = 9;

function position(band: number): number {
  const clamped = Math.max(MIN_BAND, Math.min(MAX_BAND, band));
  return ((clamped - MIN_BAND) / (MAX_BAND - MIN_BAND)) * 100;
}

/**
 * Programme requirement vs the learner's own figures (C-04, ruling C1).
 *
 * Every number on the learner's side was typed by the learner. STAGE produces
 * none of them, so there is no provenance line to render and no estimate to
 * disclaim — the only two states are "you told us your score" and "待确认".
 *
 * 待确认 is deliberately neutral: not amber, not a zero-length bar, not a
 * failure. A learner who has not filled in their score has not failed the
 * requirement, and the meter must never imply otherwise. A self-set target is
 * drawn as a hollow marker for context and never moves the verdict.
 */
export function BandGapMeter({
  gap,
  surface = "explore",
  ctaHref,
  ctaLabel = "去雅思实验室提分",
  profileHref,
  compact = false,
}: {
  gap: BandGap;
  surface?: Surface;
  ctaHref?: string;
  ctaLabel?: string;
  /** Where a learner goes to enter their own score. */
  profileHref?: string;
  compact?: boolean;
}) {
  const t = surfaceTokens[surface];

  const ownFigures = (
    <>
      {gap.current !== null ? (
        <>
          {" · "}你填写的
          <span className="font-semibold tabular-nums"> {formatBand(gap.current)}</span>
        </>
      ) : null}
      {gap.target !== null ? (
        <>
          {" · "}你的目标
          <span className="font-semibold tabular-nums"> {formatBand(gap.target)}</span>
        </>
      ) : null}
    </>
  );

  if (gap.state === "no-requirement") {
    return (
      <div className={`text-xs ${t.muted}`}>
        该项目未收录雅思最低分要求。
        {gap.current !== null || gap.target !== null ? (
          <>
            {" "}
            你填写的信息：
            {[
              gap.current !== null ? `成绩 ${formatBand(gap.current)}` : null,
              gap.target !== null ? `目标 ${formatBand(gap.target)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            。
          </>
        ) : null}
      </div>
    );
  }

  const required = gap.required as number;
  const label =
    gap.state === "unconfirmed"
      ? "待确认"
      : gap.state === "below"
        ? `还差 ${Math.abs(gap.delta ?? 0).toFixed(1)} 分`
        : gap.state === "meets"
          ? "已达标"
          : `高出 ${(gap.delta ?? 0).toFixed(1)} 分`;

  const labelTone =
    gap.state === "below"
      ? "text-amber-700"
      : gap.state === "unconfirmed"
        ? t.muted
        : "text-emerald-700";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`text-xs ${t.muted}`}>
          要求 <span className="font-semibold tabular-nums">{formatBand(required)}</span>
          {ownFigures}
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
            ? `要求 ${formatBand(required)}，你的成绩待确认${
                gap.target !== null ? `，你的目标 ${formatBand(gap.target)}` : ""
              }`
            : `你填写的 ${formatBand(gap.current)}，要求 ${formatBand(required)}，${label}`
        }
        aria-label="雅思分数对比"
        className={`relative mt-2 h-2 rounded-full ${t.neutral}`}
      >
        {/* Requirement tick — the number the programme states. */}
        <span
          aria-hidden
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ink-900"
          style={{ left: `${position(required)}%` }}
        />
        {/* Self-set target — hollow, so it reads as a plan rather than a result. */}
        {gap.target !== null ? (
          <span
            aria-hidden
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-400 bg-white"
            style={{ left: `${position(gap.target)}%` }}
          />
        ) : null}
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

      {gap.state === "unconfirmed" ? (
        <p className={`mt-1.5 text-[11px] ${t.muted}`}>
          填写你自己的成绩后，这里才会给出对比结果。
        </p>
      ) : null}

      {gap.state === "unconfirmed" && profileHref ? (
        <Link
          href={profileHref}
          className={`mt-2 inline-flex text-xs font-medium ${t.accent} underline-offset-2 hover:underline`}
        >
          填写我的成绩 →
        </Link>
      ) : ctaHref && gap.state === "below" ? (
        <Link
          href={ctaHref}
          className={`mt-2 inline-flex text-xs font-medium ${t.accent} underline-offset-2 hover:underline`}
        >
          {ctaLabel} →
        </Link>
      ) : null}
    </div>
  );
}
