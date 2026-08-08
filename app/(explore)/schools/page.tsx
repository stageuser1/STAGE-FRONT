import type { Metadata } from "next";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadPublishedProgramsV3 } from "@/lib/oss/catalog";

/**
 * T7 院校与专业浏览页(2026-08-05 人类裁决:整页替换)。
 *
 * 2026-08-08(OSS 迁移):数据源从仓库内静态包换成 OSS(唯一真相源,只含
 * published);ISR revalidate=3600(架构决策 6)。空库渲染空态,不 fallback
 * 到任何本地数据(硬约束 A)。
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "STAGE · 海外音乐院校招生数据库",
  description:
    "STAGE 收录海外音乐院校的招生项目、申请要求、语言要求与试音曲目，并标注每条信息的核验状态。",
};

export default async function SchoolsPage() {
  const programs = await loadPublishedProgramsV3();
  // 无参数入口:回退到第一所学校的第一个专业(联动规则 1)。
  return <SchoolsBrowsePage programs={programs} />;
}
