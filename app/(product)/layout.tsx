import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

/**
 * Product surface layout — Phase 1. The Dashboard / IELTS Lab routes are
 * "coming soon" teasers only (doc 01 §3), so they share the marketing chrome
 * and font scope. The real auth-gated app shell (ADR-11) is built in a later
 * phase; this layout is deliberately the marketing shell for now.
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
