import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC } from "next/font/google";
import { AuthProvider } from "@/lib/directus-auth";
import "./globals.css";

// Marketing-surface fonts (ADR-6). Only CSS variables are defined at the
// root — the families are applied inside the (marketing) layout, so the
// Explore surface keeps its existing system font stack untouched.
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stage.app"),
  title: "STAGE — 发现、准备并申请全球顶尖音乐院校",
  description:
    "汇聚全球顶尖音乐院校的权威招生数据，结合 AI 雅思备考。找到适合的项目，明确申请要求，掌握申请进度。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
