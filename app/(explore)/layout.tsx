import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ReviewerSessionBar } from "@/components/reviewer/ReviewerSessionBar";

/**
 * Explore surface layout: owns the reviewer session chrome and the mobile
 * bottom navigation that used to live in the root layout. Route groups make
 * this URL-transparent — every Explore URL is byte-identical to before.
 */
export default function ExploreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ReviewerSessionBar />
      {children}
      <MobileBottomNav />
    </>
  );
}
