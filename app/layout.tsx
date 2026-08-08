import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC } from "next/font/google";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

// Marketing-surface fonts (ADR-6). Only CSS variables are defined at the
// root — the families are applied inside the (marketing) layout, so the
// Explore surface keeps its existing system font stack untouched.
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  /**
   * T5:`opengraph-image` 约定注入的 `og:image` 是**绝对地址**,而它的主机名
   * 来自这里。此前这里硬编码的是一个**本站以外**的域名,微信/搜索引擎抓到
   * 的分享图链接会指向一个我们并不控制的主机 —— 图片路由本身正确,但外部
   * 拿不到。改为复用 T4 定下的单一来源 `SITE_URL`(`lib/site-config.ts`),
   * 与 JSON-LD / robots / sitemap 同一个域名出处(见 T4 矩阵 H1)。
   */
  metadataBase: new URL(SITE_URL),
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
        {children}
      </body>
    </html>
  );
}
