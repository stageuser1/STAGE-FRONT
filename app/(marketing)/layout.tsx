import type { ReactNode } from "react";

/**
 * Marketing surface layout (Phase 1A foundation).
 *
 * Intentionally a pass-through for now. The MarketingNavbar / MarketingFooter,
 * the Noto Sans SC font scope, and the --stage-* token surface are added in the
 * next EP1 step (see docs 02 / 04). This file exists so the marketing route
 * group is a stable, isolated boundary — it deliberately does NOT pull in the
 * Explore chrome (ReviewerSessionBar / MobileBottomNav), which stays scoped to
 * app/(explore)/layout.tsx.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
