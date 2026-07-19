/**
 * Development-only fixture content for school-detail sections whose
 * Directus fields do not exist yet.
 *
 * Rules (see redesign plan §8/§12):
 * - Content is generic and neutral — never school-specific, never a
 *   factual claim (no rankings, numbers, faculty, policies).
 * - Every consumer must render it with the violet 演示内容 badge.
 * - It is never part of any reviewer-editable field set, so it can
 *   never reach a Directus PATCH body.
 * - Deleting this file (and its single import in lib/school-detail.ts)
 *   removes all demo content from the app.
 */

export const DEMO_CONTENT_LABEL = "演示内容，不作为正式信息";

/** Fixtures only render in development or behind an explicit flag. */
export function demoContentEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEMO_SCHOOL_CONTENT === "true"
  );
}

export const demoSchoolSectionBodies: Record<string, string> = {
  overview:
    "该院校的中文简介将在学校资料字段接入后展示，内容涵盖办学定位、院系设置与培养方向。本段为演示内容，不作为正式信息。",
  international:
    "面向国际学生的签证、I-20、语言支持与入学服务等信息将在数据接入后展示。本段为演示内容，不作为正式信息。",
  tuition:
    "学费、杂费与奖学金政策等信息将在数据接入后展示。本段为演示内容，不作为正式信息。",
  campus:
    "校园环境、地理位置与交通信息将在数据接入后展示。本段为演示内容，不作为正式信息。",
  policies:
    "校级招生政策要点（申请系统、重考政策等）将在数据接入后展示。本段为演示内容，不作为正式信息。",
};
