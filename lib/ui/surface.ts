/**
 * Surface token maps.
 *
 * The repository runs two token families, split by route group:
 *   - Explore family (brand/ink/line/page) in `(explore)`
 *   - App family (stage-*) in `(marketing)`, `(ielts)`, `(product)`
 *
 * Most components belong to exactly one family and hard-code its classes. The
 * handful that must render in both take a `surface` prop and read their neutral
 * classes from here, so a shared component never has to fork.
 *
 * Class strings are COMPLETE LITERALS on purpose: Tailwind's scanner cannot see
 * `bg-${x}-50`, so an interpolated token name silently produces no CSS.
 *
 * Status colours (emerald/amber/red) are deliberately absent — both families
 * already use the same Tailwind defaults for state, so status needs no switch.
 */
export type Surface = "explore" | "app";

export interface SurfaceTokens {
  card: string;
  inset: string;
  border: string;
  divider: string;
  fg: string;
  muted: string;
  faint: string;
  neutral: string;
  accent: string;
  accentBg: string;
  focus: string;
  primaryButton: string;
  secondaryButton: string;
}

export const surfaceTokens: Record<Surface, SurfaceTokens> = {
  explore: {
    card: "rounded-xl border border-line bg-white shadow-card",
    inset: "rounded-lg bg-ink-50",
    border: "border-line",
    divider: "border-line-subtle",
    fg: "text-ink-900",
    muted: "text-ink-500",
    faint: "text-ink-400",
    neutral: "bg-ink-100 text-ink-500",
    accent: "text-brand-600",
    accentBg: "bg-brand-50 text-brand-700",
    focus:
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
    primaryButton:
      "inline-flex h-10 items-center justify-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700",
    secondaryButton:
      "inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600",
  },
  app: {
    card: "rounded-stage-md border border-stage-border bg-stage-bg",
    inset: "rounded-stage-sm bg-stage-bg-soft",
    border: "border-stage-border",
    divider: "border-stage-border",
    fg: "text-stage-fg",
    muted: "text-stage-fg-muted",
    faint: "text-stage-fg-muted",
    neutral: "bg-stage-bg-soft text-stage-fg-muted",
    accent: "text-stage-primary",
    accentBg: "bg-stage-primary/10 text-stage-primary",
    focus:
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stage-primary",
    primaryButton:
      "inline-flex h-10 items-center justify-center rounded-stage-md bg-stage-primary px-4 text-sm font-medium text-stage-fg-on-dark transition-colors hover:bg-stage-primary-hover",
    secondaryButton:
      "inline-flex h-10 items-center justify-center rounded-stage-md border border-stage-border px-4 text-sm transition-colors hover:border-stage-primary",
  },
};
