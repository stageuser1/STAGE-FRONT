import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { ProgramDetailV3 } from "@/components/program/v3/ProgramDetailV3";
import { WechatShareSetup } from "@/components/program/v3/WechatShareSetup";
import { relatedMockProgramsV3 } from "@/data/v3/mock-programs";
// T5:预览面现在同时包含 T3 的 9 个 mock 与 T1b 的 4 条真实数据,
// 三个路由(详情页 / 分享卡 / OG)必须查同一张表,见 preview-registry。
import { findPreviewProgramV3 } from "@/data/v3/preview-registry";
import { buildWechatShareConfig } from "@/lib/wechat/share-config";

interface V3ProgramPageProps {
  params: Promise<{ schoolSlug: string; programSlug: string }>;
}

/**
 * §2.2 detail page, mounted here as `/v3-preview/{school-slug}/{program-slug}`
 * rather than under `/schools/...` — the blueprint's exact URL collides with
 * this repo's existing (Directus-backed) `/schools/[schoolId]/programs/[programId]`
 * route, and re-routing production URLs is outside T3's mock-data-only scope.
 * Flagged in the T3 handoff for a human call on migrating the real route.
 */
export default async function V3ProgramPage({ params }: V3ProgramPageProps) {
  const { schoolSlug, programSlug } = await params;
  const program = findPreviewProgramV3(schoolSlug, programSlug);
  if (!program) notFound();

  const related = relatedMockProgramsV3(program);
  // T5:微信内分享的标题/描述/缩略图。未配置签名接口时组件自身完全不动作,
  // 页面渲染不受影响(见 WechatShareSetup 顶部的后端依赖说明)。
  const wechatShare = buildWechatShareConfig(program);

  return (
    <>
      <MobileHeader backHref="/v3-preview" />
      {wechatShare ? <WechatShareSetup config={wechatShare} /> : null}
      <ProgramDetailV3 program={program} relatedPrograms={related} />
    </>
  );
}
