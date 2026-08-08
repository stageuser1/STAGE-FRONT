import { MobileBottomNav } from "@/components/MobileBottomNav";

/**
 * Explore surface layout: owns the mobile bottom navigation that used to
 * live in the root layout. Route groups make this URL-transparent — every
 * Explore URL is byte-identical to before.(2026-08-08 OSS 迁移:reviewer
 * 会话条随 CMS 编辑面一并物理删除。)
 */
export default function ExploreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <MobileBottomNav />
    </>
  );
}
