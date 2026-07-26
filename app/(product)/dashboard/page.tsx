import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "学习中心 · STAGE",
  description:
    "STAGE 学习中心：申请准备度、截止时间线、下一步建议与雅思进度，全部保存在本机浏览器。",
};

/**
 * Product home (P-06).
 *
 * A thin server shell — every value comes from localStorage in the client, so
 * this route makes no Directus request at all.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">学习中心</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          你的申请进度、截止日期与备考情况，都在这里。
        </p>
      </header>
      <DashboardView />
    </div>
  );
}
