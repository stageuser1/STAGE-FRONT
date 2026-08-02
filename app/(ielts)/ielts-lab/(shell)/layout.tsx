import type { ReactNode } from "react";
import { TrackActiveDay } from "@/components/growth/Track";
import { LabMobileNav, LabSidebar } from "@/components/ielts/LabSidebar";

/**
 * Application shell for the browsable IELTS Lab sections: fixed left sidebar,
 * content on the right (master spec §应用壳). Below `lg` the rail folds into
 * a horizontal strip, since the approved export defines no mobile shell.
 *
 * A nested route group, so `/ielts-lab/practice/[examId]` sits beside it rather
 * than under it: the runner is a full-bleed test surface and must not carry
 * section navigation the learner could click mid-attempt.
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
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
      {/* Renders nothing. Here rather than on a page so every Lab surface — the
          overview and the mistake book included — counts as an active day. */}
      <TrackActiveDay />
      <LabSidebar />
      <LabMobileNav />
      <main className="min-w-0">
        {/* The export's content geometry: a 1160px column left-aligned against
            the rail (not centred), with the shell's own clamped gutters. */}
        <div className="w-full max-w-[1160px] px-[clamp(20px,3.4vw,44px)] pb-14 pt-[clamp(24px,3vw,40px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
