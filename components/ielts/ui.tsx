"use client";

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
 *
 * Visual standard (T3): the approved export's language as recorded in
 * docs/roadmap/T0_TOKEN_MAP.md — a light, FLAT surface. Structure comes from
 * 1px hairline borders, never from shadows; cards are white with a 16px
 * radius; the type ramp is 11/13/15/20/24/32px; the primary action is the
 * deep navy `--stage-primary`.
 */
import { useState, type ReactNode } from "react";
import { EXAM_STATUS_LABELS, type ExamStatus } from "@/lib/ielts/status";

/* --------------------------------------------------------------------------
 * Shared control classes.
 *
 * Exported as strings rather than components because most callers need them on
 * a `<Link>`, a `<button>` and an `<a>` interchangeably; a component per
 * element would be three wrappers for one look.
 * ----------------------------------------------------------------------- */

const CONTROL_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-stage-sm px-4 py-2 text-stage-xs transition-colors duration-stage-fast ease-stage-standard disabled:cursor-not-allowed disabled:opacity-50";

/** Deep-navy filled action. One per view, at most. */
export const BUTTON_PRIMARY = `${CONTROL_BASE} bg-stage-primary font-medium text-stage-fg-on-dark hover:bg-stage-primary-hover active:bg-stage-primary-press`;

/** Hairline-outlined action — the export's default button. */
export const BUTTON_SECONDARY = `${CONTROL_BASE} border border-stage-border-strong bg-stage-bg text-stage-fg-body hover:border-stage-primary hover:text-stage-fg`;

/** Text-only action for tertiary moves (clear filters, dismiss, reroll). */
export const BUTTON_QUIET =
  "text-stage-xs text-stage-fg-muted underline-offset-2 transition-colors duration-stage-fast hover:text-stage-fg hover:underline";

/** Text input / select. */
export const FIELD =
  "rounded-stage-sm border border-stage-border-strong bg-stage-bg px-3 py-2 text-stage-xs text-stage-fg-body outline-none transition-colors duration-stage-fast placeholder:text-stage-fg-subtle focus:border-stage-primary focus:shadow-stage-focus";

/* --------------------------------------------------------------------------
 * Layout
 * ----------------------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-stage-h3 font-semibold text-stage-fg sm:text-stage-h2">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-stage-xs text-stage-fg-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

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
      className={`rounded-stage-lg border border-stage-border bg-stage-bg p-5 ${className}`}
    >
      {title ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-stage-h4 font-semibold text-stage-fg">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-stage-xs text-stage-fg-muted">
                {subtitle}
              </p>
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
    <div className="rounded-stage-lg border border-stage-border bg-stage-bg px-4 py-3.5">
      <dt className="text-stage-xs text-stage-fg-muted">{label}</dt>
      <dd className="mt-1.5 text-stage-h3 font-semibold tabular-nums text-stage-fg">
        {value}
      </dd>
      {hint ? (
        <p className="mt-1 text-stage-2xs text-stage-fg-subtle">{hint}</p>
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
  label = "视图",
}: {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex rounded-stage-pill border border-stage-border bg-stage-bg-soft p-1"
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
            className={`rounded-stage-pill px-4 py-1.5 text-stage-xs transition-colors duration-stage-fast ${
              active
                ? "bg-stage-bg font-medium text-stage-primary shadow-stage-xs"
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

/**
 * Filter pill. Shared by the catalog, the wrongbook and history so the three
 * lists speak one filter language.
 */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-stage-pill border px-3 py-1 text-stage-xs transition-colors duration-stage-fast ${
        active
          ? "border-stage-primary bg-stage-primary font-medium text-stage-fg-on-dark"
          : "border-stage-border text-stage-fg-muted hover:border-stage-border-strong hover:text-stage-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "accent" | "danger";
}) {
  const tones = {
    neutral: "bg-stage-bg-soft text-stage-fg-muted",
    positive: "bg-stage-success-soft text-stage-success",
    warning: "bg-stage-warning-soft text-stage-warning",
    accent: "bg-stage-primary-soft text-stage-primary",
    danger: "bg-stage-danger-soft text-stage-danger",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-stage-xs px-1.5 py-0.5 text-stage-2xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Neutral metadata tag: Part, question type, frequency. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-stage-xs border border-stage-border bg-stage-bg-soft px-1.5 py-0.5 text-stage-2xs text-stage-fg-muted">
      {children}
    </span>
  );
}

/**
 * Exam status, as a dot plus its word.
 *
 * The dot shape differs per state as well as the colour, and the label is
 * always rendered, so the state survives greyscale (Plan §4.1.4). The unstarted
 * state is deliberately neutral rather than red: an untouched passage is an
 * entrance, not a failure (master-spec 全局规则 §7).
 */
const STATUS_STYLES: Record<ExamStatus, { dot: string; text: string }> = {
  unstarted: {
    dot: "border border-stage-border-strong",
    text: "text-stage-fg-subtle",
  },
  pending: { dot: "bg-stage-primary opacity-60", text: "text-stage-primary" },
  completed: { dot: "bg-stage-success", text: "text-stage-success" },
  completed_with_errors: {
    dot: "bg-stage-warning ring-1 ring-stage-warning ring-offset-1",
    text: "text-stage-warning",
  },
};

export function StatusDot({
  status,
  count,
}: {
  status: ExamStatus;
  /** Appended after the label, e.g. a wrong-answer count. */
  count?: number;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 text-stage-2xs font-medium ${style.text}`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-stage-pill ${style.dot}`}
      />
      {EXAM_STATUS_LABELS[status]}
      {count !== undefined ? ` ${count}` : ""}
    </span>
  );
}

/**
 * Destructive action with an inline confirmation step.
 *
 * Inline rather than `window.confirm`: a native dialog blocks the whole page,
 * cannot be styled or made accessible, and is forbidden in new Lab components
 * (Plan §4.1.5).
 */
export function ConfirmButton({
  label,
  question,
  onConfirm,
  className = BUTTON_QUIET,
}: {
  label: string;
  question: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      role="alertdialog"
      aria-label={question}
      className="inline-flex flex-wrap items-center gap-2 text-stage-2xs"
    >
      <span className="text-stage-fg-muted">{question}</span>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
        className="rounded-stage-sm border border-stage-border px-2 py-0.5 text-stage-danger transition-colors duration-stage-fast hover:border-stage-danger"
      >
        确认
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className="rounded-stage-sm bg-stage-primary px-2 py-0.5 font-medium text-stage-fg-on-dark"
      >
        取消
      </button>
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-stage-lg border border-stage-border bg-stage-bg-soft px-4 py-10 text-center text-stage-xs text-stage-fg-muted">
      {children}
    </p>
  );
}

/**
 * Splits a corpus title into its English main title and Chinese subtitle.
 *
 * The exam index stores both in one string ("A Brief History of Tea 茶叶简史")
 * because that is how the corpus names them; the row layout wants them on two
 * lines. Split at the first CJK character rather than at a separator: there is
 * no delimiter, and 84 of the 223 titles contain punctuation of their own.
 *
 * A title with no CJK tail returns an empty `zh` — the caller renders one line.
 *
 * The range is CJK punctuation, the unified ideographs, and the fullwidth
 * forms; the Latin curly quotes some titles use are outside it on purpose.
 */
const CJK = /[　-〿㐀-鿿＀-￯]/;

export function splitTitle(title: string): { en: string; zh: string } {
  const at = title.search(CJK);
  if (at <= 0) return { en: title.trim(), zh: "" };
  return { en: title.slice(0, at).trim(), zh: title.slice(at).trim() };
}

/** Percentage of a [0,1] ratio, or `—` when there is nothing to report. */
export function accuracyText(ratio: number | null | undefined): string {
  return ratio === null || ratio === undefined
    ? "—"
    : `${Math.round(ratio * 100)}%`;
}
