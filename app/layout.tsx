import type { Metadata } from "next";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ReviewerSessionBar } from "@/components/reviewer/ReviewerSessionBar";
import { AuthProvider } from "@/lib/directus-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "STAGE · 海外音乐院校招生数据库",
  description:
    "STAGE 收录海外音乐院校的招生项目、申请要求、语言要求与试音曲目，并标注每条信息的核验状态。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <ReviewerSessionBar />
          {children}
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
