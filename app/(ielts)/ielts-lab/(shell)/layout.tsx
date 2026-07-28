import type { ReactNode } from "react";
import { LabNav } from "@/components/ielts/LabNav";

/**
 * Container and section tabs for the browsable IELTS Lab sections.
 *
 * A nested route group, so `/ielts-lab/practice/[examId]` sits beside it rather
 * than under it: the runner is a full-bleed test surface and must not carry
 * section tabs the learner could click mid-attempt.
 *
 * Note this cannot be done by putting the runner in a *separate top-level*
 * group — two groups both declaring the `/ielts-lab` segment make Next compose
 * both of their layouts, which renders the lab chrome (and the runner iframe)
 * twice.
 */
export default function LabShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* The approved export identifies the application in its sidebar head.
          Ruling C3+C6 keeps the top navigation, so the identifier sits above
          the section rail instead — same statement, existing IA. */}
      <p className="mb-3 text-stage-2xs font-semibold uppercase tracking-stage-eyebrow text-stage-fg-subtle">
        IELTS Lab
      </p>
      <LabNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
