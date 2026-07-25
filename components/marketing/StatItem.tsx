import { CountUp } from "@/components/motion/CountUp";

/**
 * A single credibility statistic (doc 03 §3): count-up numeral in Geist Mono
 * over a Chinese label.
 */
export function StatItem({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <CountUp
        value={value}
        suffix={suffix}
        className="font-stage-mono text-stat-sm font-bold tracking-tight text-stage-fg md:text-stat"
      />
      <span className="mt-2 max-w-[16ch] text-body text-stage-fg-muted">
        {label}
      </span>
    </div>
  );
}
