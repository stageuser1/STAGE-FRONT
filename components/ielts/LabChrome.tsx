import type { ReactNode } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

/**
 * Page chrome for the whole IELTS Lab surface.
 *
 * Deliberately the marketing top bar *without* the footer: the practice runner
 * is a timed test screen, and a footer under it invited the learner to scroll
 * away from an attempt in progress. The top bar stays so the lab is still
 * reachable from the rest of STAGE.
 *
 * Shared by the two route groups that make up the lab — the browsable sections
 * and the full-bleed runner — which are separate groups so that only the former
 * gets the section tabs.
 */
export function LabChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stage-bg font-stage-sans text-stage-fg-body antialiased">
      <MarketingNavbar />
      {/* flex-1 lets the runner claim the viewport without every child
          hard-coding the navbar height. */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
