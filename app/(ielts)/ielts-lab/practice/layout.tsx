import type { ReactNode } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

/**
 * Chrome for the full-bleed practice runner.
 *
 * Deliberately the marketing top bar *without* the lab sidebar or a footer:
 * the runner is a timed test screen, and section navigation or a footer under
 * it invited the learner to click away from an attempt in progress. The top
 * bar stays so the lab is still reachable from the rest of STAGE.
 */
export default function PracticeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <MarketingNavbar />
      {/* flex-1 lets the runner claim the viewport without every child
          hard-coding the navbar height; LabChrome's column flex provides it. */}
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
