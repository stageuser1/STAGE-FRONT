import type { ReactNode } from "react";

/**
 * The one section skeleton the homepage spec mandates (§一): 小标签 → 大标题 →
 * 副标题 → 内容. Every block below the hero opens with this, so the page reads
 * as one system rather than a stack of one-off layouts.
 *
 * Server component, no animation — the visual language is typographic
 * (spec §一: hierarchy from weight and size alone, restrained colour).
 */
export function SectionIntro({
  eyebrow,
  title,
  subhead,
  align = "left",
  children,
}: {
  eyebrow: string;
  title: string;
  subhead?: string;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : ""}>
      <p className="text-stage-2xs font-medium tracking-stage-eyebrow text-stage-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-stage-h3 font-semibold text-stage-fg sm:text-stage-h2">
        {title}
      </h2>
      {subhead ? (
        <p
          className={`mt-4 max-w-stage-measure text-stage-sm text-stage-fg-muted sm:text-stage-body ${
            centered ? "mx-auto" : ""
          }`}
        >
          {subhead}
        </p>
      ) : null}
      {children}
    </div>
  );
}
