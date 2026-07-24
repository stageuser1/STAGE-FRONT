import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { teasers } from "@/content/landing";

export const metadata: Metadata = {
  title: "学习中心 · STAGE",
  description: "STAGE 学习中心即将上线：集中管理成绩、收藏院校与申请进度。",
};

export default function DashboardTeaserPage() {
  return <ComingSoon {...teasers.dashboard} />;
}
