/**
 * Small presentational primitives for IELTS Lab.
 *
 * Composition follows shadcn/ui (a Card that is header + body, a controlled
 * Tabs pair, a variant-driven Badge) but the package is deliberately not a
 * dependency: `shadcn init` brings its own --background/--foreground token
 * layer, and this codebase already runs two token families — the Explore set
 * (ink/line/brand) used by components/ui/, and the stage-* set used across
 * IELTS Lab. A third would make visual consistency unachievable.
 *
 * These use stage-* exclusively, matching the rest of IELTS Lab.
 */
import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  aside,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-stage-md border border-stage-border bg-stage-bg p-4 ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-stage-fg">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-stage-fg-muted">{subtitle}</p>
            ) : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-stage-md border border-stage-border px-4 py-3">
      <dt className="text-xs text-stage-fg-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-stage-fg">{value}</dd>
      {hint ? (
        <p className="mt-0.5 text-xs text-stage-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Tabs rendered as a native radio-free button group.
 *
 * `role="tablist"` with `aria-selected` keeps it announced correctly without
 * pulling in a focus-management library; there are two panels and both are
 * reachable by Tab, so roving tabindex would be more machinery than it earns.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div
      role="tablist"
      aria-label="练习记录视图"
      className="inline-flex rounded-stage-md border border-stage-border p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`rounded-[calc(var(--stage-radius-md)-2px)] px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-stage-primary font-medium text-white"
                : "text-stage-fg-muted hover:text-stage-fg"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning";
}) {
  const tones = {
    neutral: "bg-stage-bg-soft text-stage-fg-muted",
    positive: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  } as const;

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-stage-md border border-stage-border px-4 py-8 text-center text-sm text-stage-fg-muted">
      {children}
    </p>
  );
}
