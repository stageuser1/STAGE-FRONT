import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

/**
 * Marketing surface layout. Scopes the Noto Sans SC font family and the
 * --stage-* token surface here (the Explore surface keeps its system stack),
 * and wraps every marketing page in the shared navbar + footer. The Explore
 * chrome (ReviewerSessionBar / MobileBottomNav) stays in app/(explore)/.
 */
export default function MarketingLayout({
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
