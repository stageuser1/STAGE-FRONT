import { surfaceTokens, type Surface } from "@/lib/ui/surface";

/**
 * Three-state progress and requirement chip (C-06).
 *
 * A sibling of StatusBadge, not a replacement: StatusBadge renders the
 * data-workflow vocabulary (已核验 / 待核验 / 需更新), this renders the
 * learner-and-requirement vocabulary (未开始 / 进行中 / 已完成, 已满足 / 有差距).
 * Same geometry so the two align on a row; different word lists because they
 * answer different questions.
 *
 * State is never colour-only: every state carries a distinct dot shape and a
 * text label, so it survives greyscale and colour-blindness.
 */
export type ProgressState =
  | "unstarted"
  | "pending"
  | "completed"
  | "completed_with_errors"
  | "satisfied"
  | "gap"
  | "unknown"
  | "not_required"
  | "saved";

const LABELS: Record<ProgressState, string> = {
  unstarted: "未开始",
  pending: "进行中",
  completed: "已完成",
  completed_with_errors: "有错题",
  satisfied: "已满足",
  gap: "有差距",
  unknown: "待确认",
  not_required: "不需要",
  saved: "已收藏",
};

/** Status tones are family-neutral; only `neutral` differs per surface. */
const TONES: Record<ProgressState, string | null> = {
  unstarted: null,
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  completed_with_errors: "bg-amber-50 text-amber-700",
  satisfied: "bg-emerald-50 text-emerald-700",
  gap: "bg-amber-50 text-amber-700",
  // "We have not verified this" must never look like "you do not meet this".
  unknown: null,
  not_required: null,
  saved: "bg-brand-50 text-brand-700",
};

type DotShape = "hollow" | "half" | "solid" | "solid-ring";

const DOTS: Record<ProgressState, DotShape> = {
  unstarted: "hollow",
  pending: "half",
  completed: "solid",
  completed_with_errors: "solid-ring",
  satisfied: "solid",
  gap: "solid-ring",
  unknown: "hollow",
  not_required: "hollow",
  saved: "solid",
};

function Dot({ shape }: { shape: DotShape }) {
  const base = "inline-block h-1.5 w-1.5 shrink-0 rounded-full";
  switch (shape) {
    case "hollow":
      return (
        <span aria-hidden className={`${base} border border-current`} />
      );
    case "half":
      return (
        <span aria-hidden className={`${base} bg-current opacity-50`} />
      );
    case "solid-ring":
      return (
        <span
          aria-hidden
          className={`${base} bg-current ring-1 ring-current ring-offset-1`}
        />
      );
    default:
      return <span aria-hidden className={`${base} bg-current`} />;
  }
}

export function StatusChip({
  state,
  label,
  count,
  surface = "explore",
  className = "",
}: {
  state: ProgressState;
  /** Overrides the default Chinese label. */
  label?: string;
  /** Appended in parentheses, e.g. a wrong-answer count. */
  count?: number;
  surface?: Surface;
  className?: string;
}) {
  const tone = TONES[state] ?? surfaceTokens[surface].neutral;
  const text = label ?? LABELS[state];

  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${tone} ${
        state === "not_required" ? "opacity-70" : ""
      } ${className}`}
    >
      <Dot shape={DOTS[state]} />
      {text}
      {count !== undefined ? ` ${count}` : ""}
    </span>
  );
}
