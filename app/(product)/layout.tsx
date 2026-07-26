import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

/**
 * Product surface layout.
 *
 * /dashboard and /profile are live product surfaces now, not teasers. They
 * keep the marketing chrome (navbar + footer) and the stage-* font scope,
 * which is what makes them App-family surfaces; the auth-gated app shell
 * arrives with accounts in a later phase.
 */
export default function ProductLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-stage-bg font-stage-sans text-stage-fg antialiased">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
