import type { Metadata } from "next";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";

/**
 * T7 院校与专业浏览页(2026-08-05 人类裁决:整页替换)。
 *
 * 这个 URL 之前是从首页迁过来的 Directus 探索页(`HeroSearch` +
 * `ExploreCatalog` + `ProfileNudge`)。裁决是整页替换,那些组件本身没有删,
 * 只是不再挂在 `/schools` 上。
 *
 * 页面完全静态:数据来自 `data/v3/real-programs.ts`(Mode F 已产出
 * publishing 块的真实包),运行时不查 Directus —— 核心原则 5。原页面的
 * `revalidate = 900` 随 Directus 依赖一起去掉了,不是漏写。
 */
export const metadata: Metadata = {
  title: "STAGE · 海外音乐院校招生数据库",
  description:
    "STAGE 收录海外音乐院校的招生项目、申请要求、语言要求与试音曲目，并标注每条信息的核验状态。",
};

export default function SchoolsPage() {
  // 无参数入口:回退到第一所学校的第一个专业(联动规则 1)。
  return <SchoolsBrowsePage />;
}
